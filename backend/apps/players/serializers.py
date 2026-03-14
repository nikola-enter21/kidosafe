from rest_framework import serializers
from .models import Player, CategoryStat


class CategoryStatSerializer(serializers.ModelSerializer):
    categoryId = serializers.CharField(source='category_id')
    totalAnswers = serializers.IntegerField(source='total_answers')
    correctAnswers = serializers.IntegerField(source='correct_answers')

    class Meta:
        model = CategoryStat
        fields = ['categoryId', 'totalAnswers', 'correctAnswers']


class PlayerSerializer(serializers.ModelSerializer):
    totalPoints = serializers.IntegerField(source='total_points', read_only=True)
    categoryStats = CategoryStatSerializer(source='category_stats', many=True, read_only=True)

    class Meta:
        model = Player
        fields = ['id', 'username', 'totalPoints', 'categoryStats']
        extra_kwargs = {
            'username': {'validators': []},  # unique check done manually in view (get_or_create)
        }
