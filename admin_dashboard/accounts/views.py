from django.contrib.auth import get_user_model
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from rest_framework import generics, permissions
from .serializers import RegistrationSerializer, UserSerializer, ProfileSerializer
from .models import Profile

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """API registration endpoint that creates a User and Profile with role."""
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.AllowAny]


from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def register_page(request):
    """Simple HTML registration form for web users."""
    if request.method == 'POST':
        data = request.POST
        files = request.FILES
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip()
        role = data.get('role', 'rider')
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip()
        id_type = data.get('id_type', '').strip()
        id_number = data.get('id_number', '').strip()
        id_document = files.get('id_document')
        driver_license = files.get('driver_license')

        errors = []
        if not username:
            errors.append('Username is required')
        if not password:
            errors.append('Password is required')
        if not full_name:
            errors.append('Full name is required')
        if not phone:
            errors.append('Phone number is required')
        # extra checks for drivers
        if role == 'driver':
            if not id_type:
                errors.append('ID type is required for drivers')
            if not id_number:
                errors.append('ID number is required for drivers')
            if not id_document:
                errors.append('Please upload a photo of your ID (NIN or passport)')
            if not driver_license:
                errors.append('Please upload your driver license')

        # username uniqueness
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(username=username).exists():
            errors.append('Username already taken')

        if errors:
            return render(request, 'core/register.html', {'errors': errors, 'data': data})

        # create user and profile
        user = User.objects.create_user(username=username, email=email)
        user.set_password(password)
        user.save()

        profile = getattr(user, 'profile', None)
        if profile is None:
            profile = Profile.objects.create(user=user, role=role)
        else:
            profile.role = role

        profile.full_name = full_name
        profile.phone = phone
        if id_type:
            profile.id_type = id_type
        if id_number:
            profile.id_number = id_number
        if id_document:
            profile.id_document = id_document
        if driver_license:
            profile.driver_license = driver_license
        # drivers require admin approval before access
        if role == 'driver':
            profile.is_driver_approved = False

        profile.save()

        if role == 'driver':
            # show pending approval page
            return render(request, 'core/pending_approval.html', {'user': user})

        return redirect('login')

    return render(request, 'core/register.html')


@login_required
def rider_dashboard(request):
    # Rider sees their ride requests
    profile = getattr(request.user, 'profile', None)
    if profile and profile.role != 'rider':
        return redirect('login')
    rides = request.user.ride_requests.all()
    return render(request, 'core/rider_dashboard.html', {'rides': rides})


@login_required
def driver_dashboard(request):
    # Driver sees available unassigned rides and assigned rides
    profile = getattr(request.user, 'profile', None)
    if profile and profile.role != 'driver':
        return redirect('login')
    # If driver is not yet approved by admin, send to pending page
    if profile and not profile.is_driver_approved:
        return redirect('pending_approval')
    from rides.models import RideRequest
    # Use `status='requested'` for available/unassigned rides (model has no `completed` boolean)
    available = RideRequest.objects.filter(driver__isnull=True, status='requested')
    assigned = RideRequest.objects.filter(driver=request.user)
    return render(request, 'core/driver_dashboard.html', {'available': available, 'assigned': assigned})


@login_required
def pending_approval(request):
    # Simple page informing driver their account is awaiting admin approval
    return render(request, 'core/pending_approval.html')
