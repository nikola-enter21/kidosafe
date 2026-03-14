from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='scenario',
            name='video_url',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Direct .mp4/.webm path or URL',
                max_length=500,
            ),
        ),
        migrations.AlterField(
            model_name='scenario',
            name='image_url',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Fallback image path or URL',
                max_length=500,
            ),
        ),
    ]
