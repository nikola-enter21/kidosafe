import requests as http_requests

from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .image_service import generate_and_save_images
from .models import Category, Scenario, Choice, _scenario_id, _choice_id
from .serializers import (
    CategorySerializer,
    MaterialInputSerializer,
    ScenarioSerializer,
    ScenarioListSerializer,
    ChoiceSerializer,
)


# ─────────────────────────────────────────────────────────────────────────────
# Category
# ─────────────────────────────────────────────────────────────────────────────

class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD for safety categories.

    GET    /api/categories/          → list all
    POST   /api/categories/          → create
    GET    /api/categories/{id}/     → retrieve
    PUT    /api/categories/{id}/     → full update
    PATCH  /api/categories/{id}/     → partial update
    DELETE /api/categories/{id}/     → delete

    GET    /api/categories/{id}/scenarios/  → all scenarios for category (full detail)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['id', 'label']
    ordering = ['id']

    @action(detail=True, methods=['get'])
    def scenarios(self, request, pk=None):
        """Return all full-detail scenarios for this category."""
        category = self.get_object()
        qs = category.scenarios.prefetch_related('choices').order_by('order', 'created_at')
        serializer = ScenarioSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='generate_scenario')
    def generate_scenario(self, request, pk=None):
        """
        GET /api/categories/{id}/generate_scenario/

        Calls SCENARIO_SERVICE_URL to fetch a material JSON, then:

        Case 1 — id_material absent or not in DB:
            Calls IMAGE_SERVICE_URL 3× to generate images, saves PNGs to
            frontend/public/{category}/, creates new Scenario + Choices.

        Case 2 — id_material found in DB:
            Copies all media fields (images + videos) from the existing scenario,
            creates a new Scenario record with the new question + Choices.
        """
        category = self.get_object()
        # Fetch material JSON from the AI scenario service
        resp = http_requests.get(
            f"{settings.SCENARIO_SERVICE_URL}/api/{category.id}/generate_scenario",
        )
        resp.raise_for_status()

        serializer = MaterialInputSerializer(data=resp.json())
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        id_material = (data.get('id_material') or '').strip()
        existing = Scenario.objects.filter(id=id_material).first() if id_material else None
        new_id = _scenario_id(category.id)

        if existing:
            # Case 2: copy media from existing scenario, new question + choices
            scenario = Scenario.objects.create(
                id=new_id,
                category=category,
                question=data['question'],
                tip='',
                image_url=existing.image_url,
                image_url_correct=existing.image_url_correct,
                image_url_wrong=existing.image_url_wrong,
                question_video_url=existing.question_video_url,
                correct_video_url=existing.correct_video_url,
                wrong_video_url=existing.wrong_video_url,
            )
        else:
            # Case 1: generate images then create new scenario
            image_paths = generate_and_save_images(
                category_id=category.id,
                scenario_id=new_id,
                prompts={
                    'question': data['question_image_prompt'],
                    'success':  data['success_image_prompt'],
                    'failure':  data['failure_image_prompt'],
                },
            )
            scenario = Scenario.objects.create(
                id=new_id,
                category=category,
                question=data['question'],
                tip='',
                image_url=image_paths.get('question', ''),
                image_url_correct=image_paths.get('success', ''),
                image_url_wrong=image_paths.get('failure', ''),
            )

        _bulk_create_choices(scenario, data['answers'], data['correctAnswer'])
        return Response(ScenarioSerializer(scenario).data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# Scenario
# ─────────────────────────────────────────────────────────────────────────────

class ScenarioViewSet(viewsets.ModelViewSet):
    """
    CRUD for scenarios.

    GET    /api/scenarios/               → list (compact, no nested choices)
    POST   /api/scenarios/               → create (with optional nested choices array)
    GET    /api/scenarios/{id}/          → retrieve (full, with choices)
    PUT    /api/scenarios/{id}/          → full update (replaces choices if provided)
    PATCH  /api/scenarios/{id}/          → partial update
    DELETE /api/scenarios/{id}/          → delete

    GET    /api/scenarios/{id}/choices/  → list choices for this scenario
    POST   /api/scenarios/{id}/choices/  → add a single choice to this scenario

    Query params:
      ?category=home-alone   filter by category id
      ?ordering=order        sort by order field
    """
    queryset = Scenario.objects.select_related('category').prefetch_related('choices')
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category']
    ordering_fields = ['order', 'created_at', 'category']
    ordering = ['order', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ScenarioListSerializer
        return ScenarioSerializer

    # ── Nested choices actions ────────────────────────────────────────────

    @action(detail=True, methods=['get', 'post'], url_path='choices')
    def choices(self, request, pk=None):
        scenario = self.get_object()

        if request.method == 'GET':
            qs = scenario.choices.all().order_by('order', 'id')
            serializer = ChoiceSerializer(qs, many=True)
            return Response(serializer.data)

        # POST – add a single choice
        serializer = ChoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # validated_data has snake_case keys from 'source' mappings
        vd = serializer.validated_data
        choice = Choice.objects.create(scenario=scenario, **vd)
        out = ChoiceSerializer(choice)
        return Response(out.data, status=status.HTTP_201_CREATED)

    # ── Bulk choices replacement ──────────────────────────────────────────

    @action(detail=True, methods=['put'], url_path='choices/bulk')
    def choices_bulk(self, request, pk=None):
        """
        PUT /api/scenarios/{id}/choices/bulk
        Replace ALL choices for this scenario with the provided list.
        Body: [{ text, emoji, isCorrect, feedback, feedbackEmoji, order }, ...]
        """
        scenario = self.get_object()
        serializer = ChoiceSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        scenario.choices.all().delete()
        choices = []
        for idx, vd in enumerate(serializer.validated_data):
            vd = dict(vd)
            choice_id = vd.pop('id', None) or _choice_id(scenario.id)
            vd.setdefault('order', idx)
            choices.append(Choice(id=choice_id, scenario=scenario, **vd))
        Choice.objects.bulk_create(choices)

        qs = scenario.choices.all().order_by('order', 'id')
        out = ChoiceSerializer(qs, many=True)
        return Response(out.data)

    # ── Export (full dataset for frontend) ───────────────────────────────

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        """
        GET /api/scenarios/export
        Returns dataset in the same shape as /content/scenarios.v1.json
        so the frontend can import it directly.
        """
        cats = Category.objects.prefetch_related('scenarios__choices').all()
        scenarios_by_category = {}
        for cat in cats:
            qs = cat.scenarios.prefetch_related('choices').order_by('order', 'created_at')
            scenarios_by_category[cat.id] = ScenarioSerializer(qs, many=True).data

        return Response({
            'version': 1,
            'categories': [c.id for c in cats],
            'scenariosByCategory': scenarios_by_category,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Choice
# ─────────────────────────────────────────────────────────────────────────────

class ChoiceViewSet(viewsets.ModelViewSet):
    """
    CRUD for individual choices (direct access without scenario nesting).

    GET    /api/choices/             → list (filter: ?scenario=<id>)
    POST   /api/choices/             → create (must include scenario id in body)
    GET    /api/choices/{id}/        → retrieve
    PUT    /api/choices/{id}/        → full update
    PATCH  /api/choices/{id}/        → partial update
    DELETE /api/choices/{id}/        → delete

    Query params:
      ?scenario=ha-1   filter choices for a specific scenario
    """
    queryset = Choice.objects.select_related('scenario')
    serializer_class = ChoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['scenario']
    ordering_fields = ['order', 'id']
    ordering = ['order', 'id']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data

        # 'scenario' must be provided in the request body
        scenario_id = request.data.get('scenario')
        if not scenario_id:
            return Response({'scenario': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            scenario = Scenario.objects.get(pk=scenario_id)
        except Scenario.DoesNotExist:
            return Response({'scenario': f'Scenario "{scenario_id}" not found.'}, status=status.HTTP_404_NOT_FOUND)

        choice = Choice.objects.create(scenario=scenario, **vd)
        out = ChoiceSerializer(choice)
        return Response(out.data, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _bulk_create_choices(scenario: Scenario, answers: list, correct_idx: int) -> None:
    """Create Choice records for a scenario from a flat answers list."""
    Choice.objects.bulk_create([
        Choice(
            id=_choice_id(scenario.id),
            scenario=scenario,
            text=answers[i]['text'],
            feedback=answers[i].get('feedback', ''),
            is_correct=(i == correct_idx),
            order=i,
        )
        for i in range(len(answers))
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Descriptions
# ─────────────────────────────────────────────────────────────────────────────

class GetDescriptionsView(APIView):
    """
    GET /api/get_descriptions
    Returns two parallel arrays: id_material (scenario IDs) and description.
    """
    def get(self, request):
        qs = Scenario.objects.values_list('id', 'description').order_by('id')
        if qs:
            id_material, descriptions = zip(*qs)
        else:
            id_material, descriptions = [], []
        return Response({
            'id_material': list(id_material),
            'description': list(descriptions),
        })
