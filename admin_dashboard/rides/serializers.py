from rest_framework import serializers
from .models import Vehicle, RideRequest


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ('id', 'owner', 'make', 'model', 'plate')


class RideRequestSerializer(serializers.ModelSerializer):
    driver_info = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()

    def get_driver_info(self, obj):
        if not obj.driver:
            return None
        profile = getattr(obj.driver, 'profile', None)
        return {
            'id': obj.driver.id,
            'username': obj.driver.username,
            'full_name': getattr(profile, 'full_name', '') if profile else '',
            'phone': getattr(profile, 'phone', '') if profile else '',
        }

    def get_is_completed(self, obj):
        return obj.status == 'completed'
    class Meta:
        model = RideRequest
        fields = ('id', 'rider', 'driver', 'driver_info', 'is_completed', 'origin', 'destination', 'status', 'requested_at', 'assigned_at', 'completed_at', 'transport_type')
