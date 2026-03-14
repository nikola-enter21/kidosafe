from django.db import models


class Player(models.Model):
    """
    A KiddoSafe player — identified only by username (no auth).
    Points accumulate from correct answers across all sessions.
    """
    username = models.CharField(max_length=100, unique=True)
    total_points = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_points', 'username']

    def __str__(self) -> str:
        return f"{self.username} ({self.total_points} pts)"


class CategoryStat(models.Model):
    """
    Per-player, per-category statistics.
    One row per (player, category) pair — created/updated after each game session.
    """
    player = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='category_stats'
    )
    category = models.ForeignKey(
        'content.Category', on_delete=models.CASCADE, related_name='player_stats'
    )
    total_answers = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [['player', 'category']]
        ordering = ['category_id']

    def __str__(self) -> str:
        return f"{self.player.username} · {self.category_id} · {self.correct_answers}/{self.total_answers}"
