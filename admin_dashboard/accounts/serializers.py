from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Profile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Profile
        fields = ('id', 'user', 'role', 'phone', 'city', 'created')


class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES, default='rider')
    # Optional extended fields
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    id_type = serializers.ChoiceField(required=False, choices=(('nin','NIN'),('passport','Passport')))
    id_number = serializers.CharField(required=False, allow_blank=True)
    id_document = serializers.FileField(required=False, allow_null=True)
    driver_license = serializers.FileField(required=False, allow_null=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with that username already exists.')
        return value

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data.get('email', '')
        password = validated_data['password']
        role = validated_data.get('role', 'rider')
        full_name = validated_data.get('full_name', '')
        phone = validated_data.get('phone', '')
        id_type = validated_data.get('id_type', '')
        id_number = validated_data.get('id_number', '')
        id_document = validated_data.get('id_document', None)
        driver_license = validated_data.get('driver_license', None)

        user = User.objects.create_user(username=username, email=email)
        user.set_password(password)
        user.save()
        # ensure profile exists and set role
        profile = getattr(user, 'profile', None)
        if profile is None:
            profile = Profile.objects.create(user=user, role=role)
        else:
            profile.role = role
        # populate extended profile fields if provided
        if full_name:
            profile.full_name = full_name
        if phone:
            profile.phone = phone
        if id_type:
            profile.id_type = id_type
        if id_number:
            profile.id_number = id_number
        if id_document:
            profile.id_document = id_document
        if driver_license:
            profile.driver_license = driver_license
        profile.save()
        return user
