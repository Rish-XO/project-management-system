from django.contrib import admin
from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'contact_email', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'contact_email']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at']
    ordering = ['name']
