from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet

router = DefaultRouter()
router.register(r'players', PlayerViewSet, basename='player')

urlpatterns = router.urls
