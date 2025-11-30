from django.urls import path
from .views import RegisterView, register_page, rider_dashboard, driver_dashboard, pending_approval

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('register-web/', register_page, name='register_web'),
    path('rider/', rider_dashboard, name='rider_dashboard'),
    path('driver/', driver_dashboard, name='driver_dashboard'),
    path('pending/', pending_approval, name='pending_approval'),
]
