from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ScenarioViewSet, ChoiceViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'scenarios',  ScenarioViewSet,  basename='scenario')
router.register(r'choices',    ChoiceViewSet,    basename='choice')

urlpatterns = router.urls
