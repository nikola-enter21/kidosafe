from rest_framework import serializers
from .models import Category, Scenario, Choice


# ─────────────────────────────────────────────────────────────────────────────
# Category
# ─────────────────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for Category.
    Output uses camelCase to match the frontend CategoryId type.
    """
    colorLight = serializers.CharField(source='color_light')
    colorDark = serializers.CharField(source='color_dark')
    scenarioCount = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'label', 'emoji', 'color', 'colorLight', 'colorDark', 'description', 'scenarioCount']

    def get_scenarioCount(self, obj) -> int:
        return obj.scenarios.count()


# ─────────────────────────────────────────────────────────────────────────────
# Choice
# ─────────────────────────────────────────────────────────────────────────────

class ChoiceSerializer(serializers.ModelSerializer):
    """
    CRUD serializer for Choice.
    Maps is_correct ↔ isCorrect (via source=) and feedback_emoji ↔ feedbackEmoji (via overrides).
    feedbackEmoji is handled explicitly in to_internal_value / to_representation to guarantee
    it is written to the DB — DRF's source= mapping can be unreliable in nested ListSerializer context.
    """
    isCorrect = serializers.BooleanField(source='is_correct', required=False, default=False)

    class Meta:
        model = Choice
        fields = ['id', 'text', 'emoji', 'isCorrect', 'feedback', 'order']
        extra_kwargs = {
            'id': {'required': False, 'validators': []},  # skip unique check; update() deletes then recreates
            'emoji': {'required': False, 'default': '🔹'},
            'feedback': {'required': False, 'default': ''},
            'order': {'required': False, 'default': 0},
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['feedbackEmoji'] = instance.feedback_emoji
        return data

    def to_internal_value(self, data):
        mutable = dict(data)
        feedback_emoji = mutable.pop('feedbackEmoji', '⭐')
        result = super().to_internal_value(mutable)
        result['feedback_emoji'] = feedback_emoji
        return result


# ─────────────────────────────────────────────────────────────────────────────
# Scenario
# ─────────────────────────────────────────────────────────────────────────────

class ScenarioSerializer(serializers.ModelSerializer):
    """
    Full CRUD serializer for Scenario with nested choices and scene config.

    Mapping:
      watch_time         ↔  watchTime
      question_video_url ↔  questionVideoUrl
      wrong_video_url    ↔  wrongVideoUrl
      correct_video_url  ↔  correctVideoUrl
      scene_*            ↔  scene: { background, emoji, label }
    """
    watchTime = serializers.IntegerField(source='watch_time', required=False, default=4)
    questionVideoUrl = serializers.CharField(
        source='question_video_url', required=False, allow_blank=True, default=''
    )
    wrongVideoUrl = serializers.CharField(
        source='wrong_video_url', required=False, allow_blank=True, default=''
    )
    correctVideoUrl = serializers.CharField(
        source='correct_video_url', required=False, allow_blank=True, default=''
    )
    imageUrl = serializers.CharField(
        source='image_url', required=False, allow_blank=True, default=''
    )
    imageUrlCorrect = serializers.CharField(
        source='image_url_correct', required=False, allow_blank=True, default=''
    )
    imageUrlWrong = serializers.CharField(
        source='image_url_wrong', required=False, allow_blank=True, default=''
    )
    # Legacy alias from older editor payloads; mapped to question_video_url in to_internal_value.
    videoUrl = serializers.CharField(required=False, allow_blank=True, write_only=True, default='')
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Scenario
        fields = [
            'id', 'category', 'order', 'question', 'watchTime', 'tip', 'description',
            'videoUrl',
            'questionVideoUrl', 'wrongVideoUrl', 'correctVideoUrl',
            'imageUrl', 'imageUrlCorrect', 'imageUrlWrong',
            'choices',
        ]
        extra_kwargs = {
            'id': {'required': False},
            'order': {'required': False, 'default': 0},
        }

    # ── READ: inject scene object into output ─────────────────────────────

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Keep legacy key for frontend compatibility (single-video flow).
        data['videoUrl'] = data.get('questionVideoUrl', '')
        data['scene'] = {
            'background': instance.scene_background,
            'emoji': instance.scene_emoji,
            'label': instance.scene_label,
        }
        return data

    # ── WRITE: extract scene from input before validation ─────────────────

    def to_internal_value(self, data):
        # Pull out 'scene' before calling super so DRF doesn't reject it.
        if isinstance(data, dict):
            scene_was_provided = 'scene' in data
            scene = data.get('scene') or {}
            remaining = {k: v for k, v in data.items() if k != 'scene'}
        else:
            scene_was_provided = False
            scene = {}
            remaining = data

        result = super().to_internal_value(remaining)

        # Legacy field alias: videoUrl -> question_video_url (unless explicit questionVideoUrl exists).
        legacy_video_url = result.pop('videoUrl', '')
        if legacy_video_url and not result.get('question_video_url'):
            result['question_video_url'] = legacy_video_url

        # Merge scene fields into validated data only when scene is explicitly present.
        if scene_was_provided:
            result['scene_background'] = scene.get(
                'background', 'linear-gradient(135deg,#667eea,#764ba2)'
            )
            result['scene_emoji'] = scene.get('emoji', '🎯')
            result['scene_label'] = scene.get('label', 'Safety Scenario')
        return result

    # ── CREATE ────────────────────────────────────────────────────────────

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        scenario = Scenario.objects.create(**validated_data)
        for idx, choice_data in enumerate(choices_data):
            cd = dict(choice_data)
            cd.pop('id', None)
            cd.setdefault('order', idx)
            Choice.objects.create(scenario=scenario, **cd)
        return scenario

    # ── UPDATE ────────────────────────────────────────────────────────────

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Replace all choices if the field is present in the request
        if choices_data is not None:
            instance.choices.all().delete()
            for idx, choice_data in enumerate(choices_data):
                cd = dict(choice_data)
                cd.pop('id', None)
                cd.setdefault('order', idx)
                Choice.objects.create(scenario=instance, **cd)

        return instance


# ─────────────────────────────────────────────────────────────────────────────
# Scenario list (lightweight, no nested choices)
# ─────────────────────────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────────────────────────
# Material input (generate_scenario endpoint)
# ─────────────────────────────────────────────────────────────────────────────

class MaterialInputSerializer(serializers.Serializer):
    """
    Validates the JSON payload received from the AI scenario service.
    Used by GET /api/categories/{id}/generate_scenario/.
    """
    id_material           = serializers.CharField(required=False, allow_null=True, allow_blank=True, default=None)
    question              = serializers.CharField()
    answers               = serializers.ListField(child=serializers.CharField(), min_length=2)
    correctAnswer         = serializers.IntegerField(min_value=0, required=False)
    correct_answer        = serializers.IntegerField(min_value=0, required=False, write_only=True)
    question_image_prompt = serializers.CharField(required=False, allow_blank=True, default='')
    success_image_prompt  = serializers.CharField(required=False, allow_blank=True, default='')
    failure_image_prompt  = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        # Accept either camelCase (correctAnswer) or snake_case (correct_answer)
        if 'correct_answer' in data and 'correctAnswer' not in data:
            data['correctAnswer'] = data.pop('correct_answer')
        elif 'correct_answer' in data:
            data.pop('correct_answer')

        if data.get('correctAnswer') is None:
            raise serializers.ValidationError({'correctAnswer': 'This field is required.'})
        if data['correctAnswer'] >= len(data['answers']):
            raise serializers.ValidationError(
                {'correctAnswer': 'Index out of range for the provided answers array.'}
            )
        return data


class ScenarioListSerializer(serializers.ModelSerializer):
    """Compact serializer used in list views to avoid N+1 on choices."""
    watchTime = serializers.IntegerField(source='watch_time')
    questionVideoUrl = serializers.CharField(source='question_video_url', allow_blank=True)
    wrongVideoUrl = serializers.CharField(source='wrong_video_url', allow_blank=True)
    correctVideoUrl = serializers.CharField(source='correct_video_url', allow_blank=True)
    imageUrl = serializers.CharField(source='image_url', allow_blank=True)
    imageUrlCorrect = serializers.CharField(source='image_url_correct', allow_blank=True)
    imageUrlWrong = serializers.CharField(source='image_url_wrong', allow_blank=True)
    choiceCount = serializers.SerializerMethodField()

    class Meta:
        model = Scenario
        fields = [
            'id', 'category', 'question', 'watchTime', 'tip', 'description',
            'questionVideoUrl', 'wrongVideoUrl', 'correctVideoUrl',
            'imageUrl', 'imageUrlCorrect', 'imageUrlWrong',
            'choiceCount', 'order',
        ]

    def get_choiceCount(self, obj) -> int:
        return obj.choices.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Keep legacy key for frontend compatibility (single-video flow).
        data['videoUrl'] = data.get('questionVideoUrl', '')
        data['scene'] = {
            'background': instance.scene_background,
            'emoji': instance.scene_emoji,
            'label': instance.scene_label,
        }
        return data
