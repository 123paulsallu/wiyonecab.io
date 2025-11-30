from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'full_name', 'role', 'phone', 'city', 'is_driver_approved')
    list_filter = ('role', 'is_driver_approved')
    search_fields = ('user__username', 'full_name', 'phone', 'id_number')
    actions = ['approve_drivers']

    def approve_drivers(self, request, queryset):
        """Admin action to approve selected driver profiles."""
        updated = queryset.update(is_driver_approved=True)
        self.message_user(request, f"Approved {updated} profiles as drivers.")
    approve_drivers.short_description = 'Approve selected drivers'
