"""
Tests for organizations app models and functionality.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from organizations.models import Organization


class OrganizationModelTest(TestCase):
    """Test cases for Organization model."""

    def setUp(self):
        """Set up test data."""
        self.org_data = {
            'name': 'Test Organization',
            'slug': 'test-org',
            'contact_email': 'contact@testorg.com'
        }

    def test_organization_creation(self):
        """Test creating a new organization."""
        org = Organization.objects.create(**self.org_data)
        
        self.assertEqual(org.name, 'Test Organization')
        self.assertEqual(org.slug, 'test-org')
        self.assertEqual(org.contact_email, 'contact@testorg.com')
        self.assertIsNotNone(org.created_at)
        
    def test_organization_string_representation(self):
        """Test the string representation of organization."""
        org = Organization.objects.create(**self.org_data)
        self.assertEqual(str(org), 'Test Organization')

    def test_slug_uniqueness(self):
        """Test that organization slugs must be unique."""
        Organization.objects.create(**self.org_data)
        
        # Try to create another organization with the same slug
        with self.assertRaises(IntegrityError):
            Organization.objects.create(
                name='Another Organization',
                slug='test-org',  # Same slug
                contact_email='another@testorg.com'
            )

    def test_email_validation(self):
        """Test email field validation."""
        # Test with invalid email
        invalid_org_data = self.org_data.copy()
        invalid_org_data['contact_email'] = 'invalid-email'
        
        org = Organization(**invalid_org_data)
        with self.assertRaises(ValidationError):
            org.full_clean()

    def test_required_fields(self):
        """Test that required fields are enforced."""
        # Test missing name
        with self.assertRaises(IntegrityError):
            Organization.objects.create(
                slug='test-slug',
                contact_email='test@example.com'
            )
        
        # Test missing slug
        with self.assertRaises(IntegrityError):
            Organization.objects.create(
                name='Test Name',
                contact_email='test@example.com'
            )

    def test_organization_ordering(self):
        """Test organization ordering by name."""
        # Create multiple organizations
        org_a = Organization.objects.create(
            name='Alpha Organization',
            slug='alpha-org',
            contact_email='alpha@example.com'
        )
        org_z = Organization.objects.create(
            name='Zeta Organization', 
            slug='zeta-org',
            contact_email='zeta@example.com'
        )
        org_b = Organization.objects.create(
            name='Beta Organization',
            slug='beta-org', 
            contact_email='beta@example.com'
        )
        
        # Check ordering
        orgs = list(Organization.objects.all())
        self.assertEqual(orgs[0], org_a)  # Alpha first
        self.assertEqual(orgs[1], org_b)  # Beta second
        self.assertEqual(orgs[2], org_z)  # Zeta last
