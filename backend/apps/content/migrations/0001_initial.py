import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('label', models.CharField(max_length=100)),
                ('emoji', models.CharField(max_length=20)),
                ('color', models.CharField(help_text='Primary hex color (#RRGGBB)', max_length=20)),
                ('color_light', models.CharField(help_text='Light variant hex color', max_length=20)),
                ('color_dark', models.CharField(help_text='Dark variant hex color', max_length=20)),
                ('description', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'verbose_name_plural': 'categories', 'ordering': ['id']},
        ),
        migrations.CreateModel(
            name='Scenario',
            fields=[
                ('id', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('question', models.TextField()),
                ('watch_time', models.PositiveSmallIntegerField(default=4, help_text='Seconds to watch before choices unlock (2–15)')),
                ('tip', models.TextField(help_text='Safety advice shown after answering')),
                ('video_url', models.URLField(blank=True, help_text='Direct .mp4/.webm URL', null=True)),
                ('image_url', models.URLField(blank=True, help_text='Fallback image URL', null=True)),
                ('scene_background', models.CharField(default='linear-gradient(135deg,#667eea,#764ba2)', help_text='CSS gradient or color for scene background', max_length=200)),
                ('scene_emoji', models.CharField(default='🎯', max_length=20)),
                ('scene_label', models.CharField(default='Safety Scenario', max_length=100)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order within category')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='scenarios',
                    to='content.category',
                )),
            ],
            options={'ordering': ['order', 'created_at']},
        ),
        migrations.CreateModel(
            name='Choice',
            fields=[
                ('id', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('text', models.TextField()),
                ('emoji', models.CharField(default='🔹', max_length=20)),
                ('is_correct', models.BooleanField(default=False)),
                ('feedback', models.TextField(blank=True, help_text='Message shown after selecting this choice')),
                ('feedback_emoji', models.CharField(default='⭐', max_length=20)),
                ('order', models.PositiveIntegerField(default=0)),
                ('scenario', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='choices',
                    to='content.scenario',
                )),
            ],
            options={'ordering': ['order', 'id']},
        ),
    ]
