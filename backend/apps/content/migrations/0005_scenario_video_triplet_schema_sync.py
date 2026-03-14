from django.db import migrations, models


FORWARD_SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'question_video_url'
    ) THEN
        ALTER TABLE content_scenario
            ADD COLUMN question_video_url varchar(500) NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'wrong_video_url'
    ) THEN
        ALTER TABLE content_scenario
            ADD COLUMN wrong_video_url varchar(500) NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'correct_video_url'
    ) THEN
        ALTER TABLE content_scenario
            ADD COLUMN correct_video_url varchar(500) NOT NULL DEFAULT '';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'video_url'
    ) THEN
        UPDATE content_scenario
        SET question_video_url = COALESCE(NULLIF(question_video_url, ''), COALESCE(video_url, ''));

        ALTER TABLE content_scenario
            DROP COLUMN video_url;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'image_url'
    ) THEN
        ALTER TABLE content_scenario
            DROP COLUMN image_url;
    END IF;
END $$;
"""


REVERSE_SQL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'video_url'
    ) THEN
        ALTER TABLE content_scenario
            ADD COLUMN video_url varchar(500) NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'image_url'
    ) THEN
        ALTER TABLE content_scenario
            ADD COLUMN image_url varchar(500) NOT NULL DEFAULT '';
    END IF;

    UPDATE content_scenario
    SET video_url = COALESCE(NULLIF(video_url, ''), COALESCE(question_video_url, ''));

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'question_video_url'
    ) THEN
        ALTER TABLE content_scenario
            DROP COLUMN question_video_url;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'wrong_video_url'
    ) THEN
        ALTER TABLE content_scenario
            DROP COLUMN wrong_video_url;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'content_scenario'
          AND column_name = 'correct_video_url'
    ) THEN
        ALTER TABLE content_scenario
            DROP COLUMN correct_video_url;
    END IF;
END $$;
"""


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0004_remove_scenario_follow_up_caption_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(FORWARD_SQL, REVERSE_SQL),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name='scenario',
                    name='video_url',
                ),
                migrations.RemoveField(
                    model_name='scenario',
                    name='image_url',
                ),
                migrations.AddField(
                    model_name='scenario',
                    name='question_video_url',
                    field=models.CharField(
                        blank=True,
                        default='',
                        help_text='Video shown before choices are made (.mp4/.webm path or URL)',
                        max_length=500,
                    ),
                ),
                migrations.AddField(
                    model_name='scenario',
                    name='wrong_video_url',
                    field=models.CharField(
                        blank=True,
                        default='',
                        help_text='Video shown after an incorrect choice (.mp4/.webm path or URL)',
                        max_length=500,
                    ),
                ),
                migrations.AddField(
                    model_name='scenario',
                    name='correct_video_url',
                    field=models.CharField(
                        blank=True,
                        default='',
                        help_text='Video shown after a correct choice (.mp4/.webm path or URL)',
                        max_length=500,
                    ),
                ),
            ],
        ),
    ]
