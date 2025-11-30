from django.contrib.auth.views import LoginView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie


@method_decorator(ensure_csrf_cookie, name='dispatch')
class RoleLoginView(LoginView):
    """LoginView that redirects users to role-specific dashboards.

    - drivers -> /api/accounts/driver/
    - riders -> /api/accounts/rider/
    - staff/superuser -> /admin/
    """

    def get_success_url(self):
        user = self.request.user
        # fallback to rider if profile missing
        role = getattr(getattr(user, 'profile', None), 'role', 'rider')
        if user.is_staff or user.is_superuser or role == 'admin':
            return '/admin/'
        if role == 'driver':
            # if driver not approved, send them to pending approval page
            profile = getattr(user, 'profile', None)
            if profile and not getattr(profile, 'is_driver_approved', False):
                return '/api/accounts/pending/'
            return '/api/accounts/driver/'
        return '/api/accounts/rider/'
