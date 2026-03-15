import uuid
from django.db import models

def _scenario_id(category_id: str) -> str:
    return f"{category_id}-{uuid.uuid4().hex[:8]}"


def _choice_id(scenario_id: str) -> str:
    return f"{scenario_id}-{uuid.uuid4().hex[:4]}"


class Category(models.Model):
    """
    A safety topic category (e.g. "Home Alone", "Stranger Safety").
    The id is a human-readable slug (e.g. 'home-alone') to match the frontend enum.
    """
    id = models.CharField(max_length=50, primary_key=True)
    label = models.CharField(max_length=100)
    emoji = models.CharField(max_length=20)
    color = models.CharField(max_length=20, help_text='Primary hex color (#RRGGBB)')
    color_light = models.CharField(max_length=20, help_text='Light variant hex color')
    color_dark = models.CharField(max_length=20, help_text='Dark variant hex color')
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['id']

    def __str__(self) -> str:
        return f"{self.emoji} {self.label}"

class Scenario(models.Model):
    """
    An interactive safety scenario shown to children.
    scene_* fields store the SceneConfig (background gradient, emoji, label).
    """
    id = models.CharField(max_length=100, primary_key=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name='scenarios'
    )
    question = models.TextField()
    watch_time = models.PositiveSmallIntegerField(
        default=4, help_text='Seconds to watch before choices unlock (2–15)'
    )
    tip = models.TextField(blank=True, default='', help_text='Safety advice shown after answering')
    question_video_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Video shown before choices are made (.mp4/.webm path or URL)',
    )
    wrong_video_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Video shown after an incorrect choice (.mp4/.webm path or URL)',
    )
    correct_video_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Video shown after a correct choice (.mp4/.webm path or URL)',
    )

    image_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Image shown during question phase (fallback when no question_video_url)',
    )
    image_url_correct = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Image shown after a correct choice (fallback when no correct_video_url)',
    )
    image_url_wrong = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text='Image shown after a wrong choice (fallback when no wrong_video_url)',
    )

    description = models.TextField(
        blank=True,
        default='',
        help_text='Short description of the scenario media (used for AI matching)',
    )

    scene_background = models.CharField(
        max_length=200,
        default='linear-gradient(135deg,#667eea,#764ba2)',
        help_text='CSS gradient or color for scene background',
    )
    scene_emoji = models.CharField(max_length=20, default='🎯')
    scene_label = models.CharField(max_length=100, default='Safety Scenario')

    order = models.PositiveIntegerField(default=0, help_text='Display order within category')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self) -> str:
        return f"[{self.category_id}] {self.question[:60]}"

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _scenario_id(self.category_id)
        super().save(*args, **kwargs)


class Choice(models.Model):
    """
    One answer option within a Scenario.
    Exactly one Choice per Scenario must have is_correct=True.
    """
    id = models.CharField(max_length=100, primary_key=True)
    scenario = models.ForeignKey(
        Scenario, on_delete=models.CASCADE, related_name='choices'
    )
    text = models.TextField()
    emoji = models.CharField(max_length=20, default='🔹')
    is_correct = models.BooleanField(default=False)
    feedback = models.TextField(blank=True, help_text='Message shown after selecting this choice')
    feedback_emoji = models.CharField(max_length=20, default='⭐')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self) -> str:
        tick = '✅' if self.is_correct else '❌'
        return f"{tick} [{self.scenario_id}] {self.text[:40]}"

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = _choice_id(self.scenario_id)
        super().save(*args, **kwargs)
