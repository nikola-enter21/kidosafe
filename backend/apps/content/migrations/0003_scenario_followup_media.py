from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0002_alter_scenario_video_image_urls'),
    ]

    operations = [
        migrations.AddField(
            model_name='scenario',
            name='follow_up_video_url',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Short follow-up video shown after the answer (.mp4/.webm path or URL)',
                max_length=500,
            ),
        ),
        migrations.AddField(
            model_name='scenario',
            name='follow_up_image_url',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Follow-up image shown when no follow-up video is set',
                max_length=500,
            ),
        ),
        migrations.AddField(
            model_name='scenario',
            name='follow_up_caption',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Short caption shown below the follow-up media',
                max_length=300,
            ),
        ),
    ]
