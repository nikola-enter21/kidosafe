import json
from pathlib import Path
from typing import Any

from django.db import transaction

from .models import Category, Choice, Scenario


DEFAULT_COLORS = {
    'color': '#6B7280',
    'color_light': '#E5E7EB',
    'color_dark': '#374151',
}

CATEGORY_META = {
    'home-alone': {
        'label': 'Home Alone',
        'emoji': '🏠',
        'color': '#FF6B6B',
        'color_light': '#FFE8E8',
        'color_dark': '#C0392B',
        'description': "Learn to stay safe when you're home alone!",
    },
    'stranger': {
        'label': 'Stranger Safety',
        'emoji': '🛡️',
        'color': '#F7B731',
        'color_light': '#FFF8E1',
        'color_dark': '#D68910',
        'description': "What to do when you meet someone you don't know!",
    },
    'internet': {
        'label': 'Internet Safety',
        'emoji': '💻',
        'color': '#4ECDC4',
        'color_light': '#E0F9F7',
        'color_dark': '#1A9E96',
        'description': 'Stay safe and smart online!',
    },
    'school': {
        'label': 'School Safety',
        'emoji': '🎒',
        'color': '#A29BFE',
        'color_light': '#EEEEFF',
        'color_dark': '#6C5CE7',
        'description': 'Be safe and kind at school every day!',
    },
}


class DatasetValidationError(ValueError):
    pass


def default_dataset_path() -> Path:
    repo_root = Path(__file__).resolve().parents[3]
    return repo_root / 'frontend' / 'public' / 'content' / 'scenarios.v1.json'


def load_dataset_from_path(path: str | Path | None = None) -> dict[str, Any]:
    dataset_path = Path(path or default_dataset_path()).resolve()
    if not dataset_path.exists():
        raise DatasetValidationError(f'Dataset file not found: {dataset_path}')

    try:
        with dataset_path.open('r', encoding='utf-8') as file:
            return json.load(file)
    except json.JSONDecodeError as error:
        raise DatasetValidationError(f'Invalid JSON in {dataset_path}: {error}') from error


def _normalize_text(value: object, *, required: bool, field_name: str) -> str:
    text = str(value).strip() if value is not None else ''
    if required and not text:
        raise DatasetValidationError(
            f'Invalid dataset: "{field_name}" is required and cannot be empty.'
        )
    return text


def replace_content_from_dataset(dataset: dict[str, Any]) -> dict[str, int]:
    if not isinstance(dataset, dict):
        raise DatasetValidationError('Invalid dataset: root value must be a JSON object.')

    categories = dataset.get('categories')
    scenarios_by_category = dataset.get('scenariosByCategory')

    if not isinstance(categories, list) or not all(isinstance(item, str) for item in categories):
        raise DatasetValidationError('Invalid dataset: "categories" must be an array of strings.')

    if not isinstance(scenarios_by_category, dict):
        raise DatasetValidationError('Invalid dataset: "scenariosByCategory" must be an object.')

    created_categories = 0
    created_scenarios = 0
    created_choices = 0
    seen_scenario_ids: set[str] = set()
    seen_choice_ids: set[str] = set()

    with transaction.atomic():
        Choice.objects.all().delete()
        Scenario.objects.all().delete()
        Category.objects.all().delete()

        for category_id in categories:
            category_meta = CATEGORY_META.get(category_id, {})
            fallback_label = category_id.replace('-', ' ').title()

            category = Category.objects.create(
                id=category_id,
                label=category_meta.get('label', fallback_label),
                emoji=category_meta.get('emoji', '🧩'),
                description=category_meta.get(
                    'description', f'{fallback_label} safety scenarios.'
                ),
                color=category_meta.get('color', DEFAULT_COLORS['color']),
                color_light=category_meta.get(
                    'color_light', DEFAULT_COLORS['color_light']
                ),
                color_dark=category_meta.get('color_dark', DEFAULT_COLORS['color_dark']),
            )
            created_categories += 1

            raw_scenarios = scenarios_by_category.get(category_id, [])
            if not isinstance(raw_scenarios, list):
                raise DatasetValidationError(
                    f'Invalid dataset: scenariosByCategory.{category_id} must be an array.'
                )

            for scenario_order, raw_scenario in enumerate(raw_scenarios):
                if not isinstance(raw_scenario, dict):
                    raise DatasetValidationError(
                        f'Invalid dataset: scenariosByCategory.{category_id}[{scenario_order}] must be an object.'
                    )

                scenario_id = _normalize_text(
                    raw_scenario.get('id'),
                    required=True,
                    field_name=f'scenariosByCategory.{category_id}[{scenario_order}].id',
                )
                if scenario_id in seen_scenario_ids:
                    raise DatasetValidationError(
                        f'Invalid dataset: duplicate scenario id "{scenario_id}".'
                    )
                seen_scenario_ids.add(scenario_id)

                scene = raw_scenario.get('scene') or {}
                if not isinstance(scene, dict):
                    raise DatasetValidationError(
                        f'Invalid dataset: scenariosByCategory.{category_id}[{scenario_order}].scene must be an object.'
                    )

                question_video_url = _normalize_text(
                    raw_scenario.get('questionVideoUrl'),
                    required=False,
                    field_name='questionVideoUrl',
                )
                wrong_video_url = _normalize_text(
                    raw_scenario.get('wrongVideoUrl'),
                    required=False,
                    field_name='wrongVideoUrl',
                )
                correct_video_url = _normalize_text(
                    raw_scenario.get('correctVideoUrl'),
                    required=False,
                    field_name='correctVideoUrl',
                )
                has_any_triplet_video = bool(
                    question_video_url or wrong_video_url or correct_video_url
                )
                has_full_triplet_video = bool(
                    question_video_url and wrong_video_url and correct_video_url
                )
                if has_any_triplet_video and not has_full_triplet_video:
                    raise DatasetValidationError(
                        f'Invalid dataset: {scenario_id} has incomplete triplet video fields.'
                    )

                scenario = Scenario.objects.create(
                    id=scenario_id,
                    category=category,
                    question=_normalize_text(
                        raw_scenario.get('question'),
                        required=True,
                        field_name=f'scenariosByCategory.{category_id}[{scenario_order}].question',
                    ),
                    watch_time=int(raw_scenario.get('watchTime') or 4),
                    tip=_normalize_text(
                        raw_scenario.get('tip'),
                        required=True,
                        field_name=f'scenariosByCategory.{category_id}[{scenario_order}].tip',
                    ),
                    video_url=_normalize_text(
                        raw_scenario.get('videoUrl'),
                        required=False,
                        field_name='videoUrl',
                    ),
                    image_url=_normalize_text(
                        raw_scenario.get('imageUrl'),
                        required=False,
                        field_name='imageUrl',
                    ),
                    question_video_url=question_video_url,
                    wrong_video_url=wrong_video_url,
                    correct_video_url=correct_video_url,
                    scene_background=_normalize_text(
                        scene.get('background'),
                        required=False,
                        field_name='scene.background',
                    )
                    or 'linear-gradient(135deg,#667eea,#764ba2)',
                    scene_emoji=_normalize_text(
                        scene.get('emoji'),
                        required=False,
                        field_name='scene.emoji',
                    )
                    or '🎯',
                    scene_label=_normalize_text(
                        scene.get('label'),
                        required=False,
                        field_name='scene.label',
                    )
                    or 'Safety Scenario',
                    order=scenario_order,
                )
                created_scenarios += 1

                raw_choices = raw_scenario.get('choices', [])
                if not isinstance(raw_choices, list):
                    raise DatasetValidationError(
                        f'Invalid dataset: choices in {scenario_id} must be an array.'
                    )

                correct_choices = 0
                for choice_order, raw_choice in enumerate(raw_choices):
                    if not isinstance(raw_choice, dict):
                        raise DatasetValidationError(
                            f'Invalid dataset: {scenario_id}.choices[{choice_order}] must be an object.'
                        )

                    choice_id = _normalize_text(
                        raw_choice.get('id'),
                        required=True,
                        field_name=f'{scenario_id}.choices[{choice_order}].id',
                    )
                    if choice_id in seen_choice_ids:
                        raise DatasetValidationError(
                            f'Invalid dataset: duplicate choice id "{choice_id}".'
                        )
                    seen_choice_ids.add(choice_id)

                    is_correct = bool(raw_choice.get('isCorrect'))
                    if is_correct:
                        correct_choices += 1

                    Choice.objects.create(
                        id=choice_id,
                        scenario=scenario,
                        text=_normalize_text(
                            raw_choice.get('text'),
                            required=True,
                            field_name=f'{scenario_id}.choices[{choice_order}].text',
                        ),
                        emoji=_normalize_text(
                            raw_choice.get('emoji'),
                            required=False,
                            field_name='emoji',
                        )
                        or '🔹',
                        is_correct=is_correct,
                        feedback=_normalize_text(
                            raw_choice.get('feedback'),
                            required=False,
                            field_name='feedback',
                        ),
                        feedback_emoji=_normalize_text(
                            raw_choice.get('feedbackEmoji'),
                            required=False,
                            field_name='feedbackEmoji',
                        )
                        or '⭐',
                        order=choice_order,
                    )
                    created_choices += 1

                if correct_choices != 1:
                    raise DatasetValidationError(
                        f'Invalid dataset: {scenario_id} must have exactly one correct choice.'
                    )

    return {
        'categories': created_categories,
        'scenarios': created_scenarios,
        'choices': created_choices,
    }
