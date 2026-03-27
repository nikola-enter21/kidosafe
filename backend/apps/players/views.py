from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Player, CategoryStat
from .serializers import PlayerSerializer


class PlayerViewSet(viewsets.GenericViewSet):
    """
    POST   /api/players/                        → get_or_create player by username
    GET    /api/players/{id}/                   → retrieve player with full stats
    POST   /api/players/{id}/record-session/    → record results after a game session
    """
    queryset = Player.objects.prefetch_related('category_stats').all()
    serializer_class = PlayerSerializer

    def create(self, request):
        username = (request.data.get('username') or '').strip()
        if not username:
            return Response({'username': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        player, created = Player.objects.get_or_create(username=username)
        serializer = self.get_serializer(player)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=http_status)


    def retrieve(self, request, pk=None):
        player = self.get_object()
        serializer = self.get_serializer(player)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='record-session')
    def record_session(self, request, pk=None):
        """
        Body:
          {
            "categoryId": "home-alone",
            "correctAnswers": 4,
            "totalAnswers": 5,
            "pointsEarned": 450
          }
        """
        player = self.get_object()

        category_id = request.data.get('categoryId', '').strip()
        try:
            correct = int(request.data.get('correctAnswers', 0))
            total = int(request.data.get('totalAnswers', 0))
            points = int(request.data.get('pointsEarned', 0))
        except (ValueError, TypeError):
            return Response({'error': 'Invalid numeric values.'}, status=status.HTTP_400_BAD_REQUEST)

        if not category_id:
            return Response({'error': 'categoryId is required.'}, status=status.HTTP_400_BAD_REQUEST)

        stat, _ = CategoryStat.objects.get_or_create(
            player=player,
            category_id=category_id,
            defaults={'total_answers': 0, 'correct_answers': 0},
        )
        stat.total_answers += total
        stat.correct_answers += correct
        stat.save(update_fields=['total_answers', 'correct_answers'])

        player.total_points += points
        player.save(update_fields=['total_points'])

        serializer = self.get_serializer(player)
        return Response(serializer.data)
