#!/usr/bin/env python
"""
Django migration runner script
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')

# Setup Django
django.setup()

# Now run the migrations
from django.core.management import execute_from_command_line

print("Creating migrations for all apps...")
try:
    execute_from_command_line(['manage.py', 'makemigrations'])
    print("Migrations created successfully!")
    
    print("\nRunning migrations...")
    execute_from_command_line(['manage.py', 'migrate'])
    print("All migrations completed successfully!")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()