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
    Maps is_correct ↔ isCorrect and feedback_emoji ↔ feedbackEmoji.
    """
    isCorrect = serializers.BooleanField(source='is_correct', required=False, default=False)
    feedbackEmoji = serializers.CharField(source='feedback_emoji', required=False, default='⭐')

    class Meta:
        model = Choice
        fields = ['id', 'text', 'emoji', 'isCorrect', 'feedback', 'feedbackEmoji', 'order']
        extra_kwargs = {
            'id': {'required': False, 'validators': []},  # skip unique check; update() deletes then recreates
            'emoji': {'required': False, 'default': '🔹'},
            'feedback': {'required': False, 'default': ''},
            'order': {'required': False, 'default': 0},
        }


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
    # Legacy alias from older editor payloads; mapped to question_video_url in to_internal_value.
    videoUrl = serializers.CharField(required=False, allow_blank=True, write_only=True, default='')
    choices = ChoiceSerializer(many=True, required=False)

    class Meta:
        model = Scenario
        fields = [
            'id', 'category', 'question', 'watchTime', 'tip',
            'videoUrl',
            'questionVideoUrl', 'wrongVideoUrl', 'correctVideoUrl',
            'choices',
        ]
        extra_kwargs = {
            'id': {'required': False},
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
            choice_data.setdefault('order', idx)
            Choice.objects.create(scenario=scenario, **choice_data)
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
                choice_data.setdefault('order', idx)
                Choice.objects.create(scenario=instance, **choice_data)

        return instance


# ─────────────────────────────────────────────────────────────────────────────
# Scenario list (lightweight, no nested choices)
# ─────────────────────────────────────────────────────────────────────────────

class ScenarioListSerializer(serializers.ModelSerializer):
    """Compact serializer used in list views to avoid N+1 on choices."""
    watchTime = serializers.IntegerField(source='watch_time')
    questionVideoUrl = serializers.CharField(source='question_video_url', allow_blank=True)
    wrongVideoUrl = serializers.CharField(source='wrong_video_url', allow_blank=True)
    correctVideoUrl = serializers.CharField(source='correct_video_url', allow_blank=True)
    choiceCount = serializers.SerializerMethodField()

    class Meta:
        model = Scenario
        fields = [
            'id', 'category', 'question', 'watchTime', 'tip',
            'questionVideoUrl', 'wrongVideoUrl', 'correctVideoUrl',
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
