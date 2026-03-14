from django.contrib import admin
from .models import Category, Scenario, Choice


# ─────────────────────────────────────────────────────────────────────────────
# Inline
# ─────────────────────────────────────────────────────────────────────────────

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0
    fields = ('id', 'text', 'emoji', 'is_correct', 'feedback', 'feedback_emoji', 'order')
    readonly_fields = ('id',)
    ordering = ('order', 'id')


class ScenarioInline(admin.TabularInline):
    model = Scenario
    extra = 0
    fields = ('id', 'question', 'watch_time', 'order')
    readonly_fields = ('id',)
    show_change_link = True
    ordering = ('order', 'created_at')


# ─────────────────────────────────────────────────────────────────────────────
# Category admin
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'emoji', 'label', 'color', 'scenario_count')
    list_display_links = ('id', 'label')
    search_fields = ('id', 'label', 'description')
    inlines = [ScenarioInline]

    @admin.display(description='Scenarios')
    def scenario_count(self, obj):
        return obj.scenarios.count()


# ─────────────────────────────────────────────────────────────────────────────
# Scenario admin
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(Scenario)
class ScenarioAdmin(admin.ModelAdmin):
    list_display = ('id', 'category', 'question_short', 'watch_time', 'choice_count', 'order', 'updated_at')
    list_filter = ('category',)
    search_fields = ('id', 'question', 'tip')
    ordering = ('category', 'order', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [ChoiceInline]
    fieldsets = (
        (None, {
            'fields': ('id', 'category', 'order'),
        }),
        ('Content', {
            'fields': ('question', 'watch_time', 'tip'),
        }),
        ('Media', {
            'fields': ('question_video_url', 'wrong_video_url', 'correct_video_url'),
            'classes': ('collapse',),
        }),
        ('Scene Config', {
            'fields': ('scene_background', 'scene_emoji', 'scene_label'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Question')
    def question_short(self, obj):
        return obj.question[:70] + ('…' if len(obj.question) > 70 else '')

    @admin.display(description='Choices')
    def choice_count(self, obj):
        return obj.choices.count()


# ─────────────────────────────────────────────────────────────────────────────
# Choice admin
# ─────────────────────────────────────────────────────────────────────────────

@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'scenario', 'emoji', 'text_short', 'is_correct', 'order')
    list_filter = ('is_correct', 'scenario__category')
    search_fields = ('id', 'text', 'feedback')
    ordering = ('scenario', 'order', 'id')
    readonly_fields = ('id',)

    @admin.display(description='Text')
    def text_short(self, obj):
        return obj.text[:60] + ('…' if len(obj.text) > 60 else '')
