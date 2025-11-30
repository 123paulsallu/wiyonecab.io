from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, RideRequestViewSet, create_ride

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'rides', RideRequestViewSet, basename='riderequest')

urlpatterns = [
	path('rides/create/', create_ride, name='create_ride'),
	path('', include(router.urls)),
]
