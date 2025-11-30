from django.contrib import admin
from .models import Vehicle, RideRequest

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('owner', 'make', 'model', 'plate')


@admin.register(RideRequest)
class RideRequestAdmin(admin.ModelAdmin):
    list_display = ('rider', 'driver', 'origin', 'destination', 'status', 'requested_at', 'completed_at')
    search_fields = ('rider__username', 'driver__username', 'origin', 'destination')
    list_filter = ('status',)
    readonly_fields = ('requested_at', 'assigned_at', 'completed_at')

    actions = ['mark_completed']

    def mark_completed(self, request, queryset):
        """Admin action to mark selected rides as completed."""
        from django.utils import timezone
        updated = queryset.update(status='completed', completed_at=timezone.now())
        self.message_user(request, f"Marked {updated} ride(s) as completed.")
    mark_completed.short_description = 'Mark selected rides as completed'
