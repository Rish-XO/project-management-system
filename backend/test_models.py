import os
import sys
import django

# Add the backend directory to the Python path
sys.path.insert(0, r'D:\codes\tasks\project-management-system\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project_management.settings')
django.setup()

# Try to import models
try:
    from organizations.models import Organization
    from projects.models import Project
    from tasks.models import Task, TaskComment
    print("✅ All models imported successfully!")
    
    # Try to create migrations
    from django.core.management import call_command
    print("\n📝 Creating migrations...")
    call_command('makemigrations', verbosity=2)
    
    print("\n✅ Migrations created successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()