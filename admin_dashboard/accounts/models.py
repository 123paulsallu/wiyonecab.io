from django.db import models
from django.conf import settings


class Profile(models.Model):
    ROLE_CHOICES = (
        ('rider', 'Rider'),
        ('driver', 'Driver'),
        ('admin', 'Admin'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='rider')
    phone = models.CharField(max_length=32, blank=True)
    city = models.CharField(max_length=100, blank=True)
    full_name = models.CharField(max_length=200, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    # For drivers, indicate what vehicle type they operate
    vehicle_type = models.CharField(max_length=16, blank=True, choices=(
        ('taxi', 'Taxi'),
        ('bike', 'Bike'),
    ))
    # Identity fields
    ID_TYPE_CHOICES = (
        ('nin', 'National ID (NIN)'),
        ('passport', 'Passport'),
    )
    id_type = models.CharField(max_length=16, choices=ID_TYPE_CHOICES, blank=True)
    id_number = models.CharField(max_length=128, blank=True)
    id_document = models.FileField(upload_to='ids/', blank=True, null=True)

    # For drivers: upload license and require admin approval before granting dashboard access
    driver_license = models.FileField(upload_to='licenses/', blank=True, null=True)
    is_driver_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} ({self.role})"
