import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'admin_dashboard.settings')
import django
django.setup()

from django.contrib.auth import get_user_model

def main():
    User = get_user_model()
    username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'superadmin')
    email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'superadmin@example.com')
    password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'SuperPass123!')

    if User.objects.filter(username=username).exists():
        print(f'SUPERUSER: already exists: {username}')
        return

    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'SUPERUSER: created: {username}')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('ERROR creating superuser:', e)
        sys.exit(1)
