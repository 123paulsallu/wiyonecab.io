from rest_framework.permissions import BasePermission


class IsDriver(BasePermission):
    """Allow access only to users with profile.role == 'driver' and who are approved."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.role == 'driver' and getattr(profile, 'is_driver_approved', False))


class IsRider(BasePermission):
    """Allow access only to users with profile.role == 'rider'."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        profile = getattr(user, 'profile', None)
        return bool(profile and profile.role == 'rider')
