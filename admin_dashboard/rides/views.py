from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Vehicle, RideRequest
from .serializers import VehicleSerializer, RideRequestSerializer
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from .permissions import IsDriver, IsRider
from django.core.mail import mail_admins


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]


class RideRequestViewSet(viewsets.ModelViewSet):
    queryset = RideRequest.objects.all()
    serializer_class = RideRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def available(self, request):
        """List available unassigned ride requests for drivers to view."""
        qs = RideRequest.objects.filter(driver__isnull=True, status='requested')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDriver])
    def accept(self, request, pk=None):
        """Driver accepts a ride request; assigns themselves as the driver."""
        ride = self.get_object()
        user = request.user
        # ensure user is a driver by profile
        profile = getattr(user, 'profile', None)
        if profile is None or profile.role != 'driver':
            return Response({'detail': 'Only drivers can accept rides.'}, status=403)
        if ride.driver is not None:
            return Response({'detail': 'Ride already assigned.'}, status=400)
        ride.driver = user
        ride.status = 'assigned'
        from django.utils import timezone
        ride.assigned_at = timezone.now()
        ride.save()
        return Response({'detail': 'Ride assigned to you.'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsRider])
    def complete(self, request, pk=None):
        """Mark a ride as completed.

        Allowed actors:
        - the rider who requested the ride
        - the driver assigned to the ride
        """
        ride = self.get_object()
        user = request.user
        # Only the rider or the assigned driver may mark completed
        if ride.rider != user and ride.driver != user:
            return Response({'detail': 'Only the rider or assigned driver can mark this ride completed.'}, status=403)
        if ride.status == 'completed':
            return Response({'detail': 'Ride already completed.'}, status=400)
        from django.utils import timezone
        ride.status = 'completed'
        ride.completed_at = timezone.now()
        ride.save()

        # Notify admins that the ride was marked completed
        try:
            driver_name = ''
            driver_phone = ''
            if ride.driver:
                profile = getattr(ride.driver, 'profile', None)
                driver_name = getattr(profile, 'full_name', ride.driver.username) if profile else ride.driver.username
                driver_phone = getattr(profile, 'phone', '') if profile else ''
            subject = f'Ride marked completed: #{ride.id} by {request.user.username}'
            message = (
                f'Ride ID: {ride.id}\n'
                f'Completed by: {request.user.username} (id={request.user.id})\n'
                f'Rider: {ride.rider.username} (id={ride.rider.id})\n'
                f'Driver: {driver_name} (phone: {driver_phone})\n'
                f'Origin: {ride.origin}\n'
                f'Destination: {ride.destination}\n'
                f'Requested at: {ride.requested_at}\n'
                f'Completed at: {ride.completed_at}\n'
            )
            mail_admins(subject, message)
        except Exception:
            pass

        return Response({'detail': 'Ride marked as completed.'})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def status(self, request, pk=None):
        """Return minimal status information for a ride: status and is_completed boolean."""
        ride = self.get_object()
        return Response({'id': ride.id, 'status': ride.status, 'is_completed': ride.status == 'completed'})


@login_required
def create_ride(request):
    """Create a new RideRequest from a simple web form. Only riders may create requests."""
    profile = getattr(request.user, 'profile', None)
    if profile is None or profile.role != 'rider':
        return redirect('login')

    if request.method == 'POST':
        origin = request.POST.get('origin')
        destination = request.POST.get('destination')
        if origin and destination:
            ride = RideRequest.objects.create(
                rider=request.user,
                origin=origin,
                destination=destination,
                status='requested',
                requested_at=timezone.now()
            )
            return redirect('rider_dashboard')
        else:
            return render(request, 'core/rider_dashboard.html', {'rides': request.user.ride_requests.all(), 'error': 'Origin and destination required.'})

    return redirect('rider_dashboard')
