"""
GraphQL API integration tests.

Tests the complete GraphQL API including queries, mutations, and organization isolation.
"""

from django.test import TestCase
from graphene.test import Client
from project_management.schema import schema
from organizations.models import Organization
from projects.models import Project
from tasks.models import Task, TaskComment


class GraphQLAPITest(TestCase):
    """Test GraphQL API queries and mutations."""

    def setUp(self):
        """Set up test data."""
        # Create test organizations
        self.org1 = Organization.objects.create(
            name='Organization 1',
            slug='org-1',
            contact_email='contact@org1.com'
        )
        
        self.org2 = Organization.objects.create(
            name='Organization 2',
            slug='org-2',
            contact_email='contact@org2.com'
        )
        
        # Create test projects
        self.project1 = Project.objects.create(
            organization=self.org1,
            name='Project 1',
            description='First project',
            status='ACTIVE'
        )
        
        self.project2 = Project.objects.create(
            organization=self.org2,
            name='Project 2', 
            description='Second project',
            status='ACTIVE'
        )
        
        # Create test tasks
        self.task1 = Task.objects.create(
            project=self.project1,
            title='Task 1',
            description='First task',
            status='TODO',
            assignee_email='user1@example.com'
        )
        
        self.task2 = Task.objects.create(
            project=self.project1,
            title='Task 2',
            description='Second task',
            status='IN_PROGRESS'
        )
        
        # Create test comments
        self.comment1 = TaskComment.objects.create(
            task=self.task1,
            content='First comment',
            author_email='commenter@example.com'
        )
        
        # Set up GraphQL client
        self.client = Client(schema)

    def test_organization_list_query(self):
        """Test organizationList query."""
        query = '''
        query {
            organizationList {
                id
                name
                slug
                contactEmail
            }
        }
        '''
        
        result = self.client.execute(query)
        
        self.assertIsNone(result.get('errors'))
        
        organizations = result['data']['organizationList']
        self.assertEqual(len(organizations), 2)
        
        # Check organization data
        org_names = [org['name'] for org in organizations]
        self.assertIn('Organization 1', org_names)
        self.assertIn('Organization 2', org_names)

    def test_projects_by_organization_query(self):
        """Test projectsByOrganization query."""
        query = '''
        query($organizationSlug: String!) {
            projectsByOrganization(organizationSlug: $organizationSlug) {
                id
                name
                description
                status
                organization {
                    name
                    slug
                }
            }
        }
        '''
        
        variables = {'organizationSlug': 'org-1'}
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        projects = result['data']['projectsByOrganization']
        self.assertEqual(len(projects), 1)
        
        project = projects[0]
        self.assertEqual(project['name'], 'Project 1')
        self.assertEqual(project['status'], 'ACTIVE')
        self.assertEqual(project['organization']['slug'], 'org-1')

    def test_tasks_by_project_query(self):
        """Test tasksByProject query."""
        query = '''
        query($projectId: ID!) {
            tasksByProject(projectId: $projectId) {
                id
                title
                description
                status
                assigneeEmail
                project {
                    name
                }
                comments {
                    id
                    content
                    authorEmail
                }
            }
        }
        '''
        
        variables = {'projectId': str(self.project1.id)}
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        tasks = result['data']['tasksByProject']
        self.assertEqual(len(tasks), 2)
        
        # Check task with comments
        task_with_comments = next((task for task in tasks if task['title'] == 'Task 1'), None)
        self.assertIsNotNone(task_with_comments)
        self.assertEqual(len(task_with_comments['comments']), 1)
        self.assertEqual(task_with_comments['comments'][0]['content'], 'First comment')

    def test_task_detail_query(self):
        """Test taskDetail query."""
        query = '''
        query($id: ID!) {
            taskDetail(id: $id) {
                id
                title
                description
                status
                assigneeEmail
                project {
                    name
                    organization {
                        name
                        slug
                    }
                }
                comments {
                    content
                    authorEmail
                    timestamp
                }
            }
        }
        '''
        
        variables = {'id': str(self.task1.id)}
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        task = result['data']['taskDetail']
        self.assertEqual(task['title'], 'Task 1')
        self.assertEqual(task['project']['name'], 'Project 1')
        self.assertEqual(task['project']['organization']['slug'], 'org-1')

    def test_create_task_mutation(self):
        """Test createTask mutation."""
        mutation = '''
        mutation($projectId: ID!, $title: String!, $description: String, $assigneeEmail: String) {
            createTask(
                projectId: $projectId,
                title: $title,
                description: $description,
                assigneeEmail: $assigneeEmail
            ) {
                success
                errors
                task {
                    id
                    title
                    description
                    status
                    assigneeEmail
                }
            }
        }
        '''
        
        variables = {
            'projectId': str(self.project1.id),
            'title': 'New Test Task',
            'description': 'New task description',
            'assigneeEmail': 'newuser@example.com'
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        create_result = result['data']['createTask']
        self.assertTrue(create_result['success'])
        self.assertEqual(create_result['errors'], [])
        
        new_task = create_result['task']
        self.assertEqual(new_task['title'], 'New Test Task')
        self.assertEqual(new_task['status'], 'TODO')  # Default status
        self.assertEqual(new_task['assigneeEmail'], 'newuser@example.com')
        
        # Verify task was actually created in database
        db_task = Task.objects.get(id=new_task['id'])
        self.assertEqual(db_task.title, 'New Test Task')

    def test_update_task_mutation(self):
        """Test updateTask mutation."""
        mutation = '''
        mutation($id: ID!, $title: String, $description: String, $assigneeEmail: String) {
            updateTask(
                id: $id,
                title: $title,
                description: $description,
                assigneeEmail: $assigneeEmail
            ) {
                success
                errors
                task {
                    id
                    title
                    description
                    assigneeEmail
                }
            }
        }
        '''
        
        variables = {
            'id': str(self.task1.id),
            'title': 'Updated Task Title',
            'description': 'Updated description',
            'assigneeEmail': 'updated@example.com'
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        update_result = result['data']['updateTask']
        self.assertTrue(update_result['success'])
        
        updated_task = update_result['task']
        self.assertEqual(updated_task['title'], 'Updated Task Title')
        self.assertEqual(updated_task['description'], 'Updated description')
        self.assertEqual(updated_task['assigneeEmail'], 'updated@example.com')
        
        # Verify task was actually updated in database
        db_task = Task.objects.get(id=self.task1.id)
        self.assertEqual(db_task.title, 'Updated Task Title')

    def test_update_task_status_mutation(self):
        """Test updateTaskStatus mutation."""
        mutation = '''
        mutation($id: ID!, $status: String!) {
            updateTaskStatus(id: $id, status: $status) {
                success
                errors
                task {
                    id
                    status
                }
            }
        }
        '''
        
        variables = {
            'id': str(self.task1.id),
            'status': 'DONE'
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        update_result = result['data']['updateTaskStatus']
        self.assertTrue(update_result['success'])
        
        updated_task = update_result['task']
        self.assertEqual(updated_task['status'], 'DONE')
        
        # Verify status was actually updated in database
        db_task = Task.objects.get(id=self.task1.id)
        self.assertEqual(db_task.status, 'DONE')

    def test_add_task_comment_mutation(self):
        """Test addTaskComment mutation."""
        mutation = '''
        mutation($taskId: ID!, $content: String!, $authorEmail: String!) {
            addTaskComment(
                taskId: $taskId,
                content: $content,
                authorEmail: $authorEmail
            ) {
                success
                errors
                comment {
                    id
                    content
                    authorEmail
                    task {
                        title
                    }
                }
            }
        }
        '''
        
        variables = {
            'taskId': str(self.task2.id),
            'content': 'New test comment',
            'authorEmail': 'newcomment@example.com'
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        comment_result = result['data']['addTaskComment']
        self.assertTrue(comment_result['success'])
        
        new_comment = comment_result['comment']
        self.assertEqual(new_comment['content'], 'New test comment')
        self.assertEqual(new_comment['authorEmail'], 'newcomment@example.com')
        self.assertEqual(new_comment['task']['title'], 'Task 2')
        
        # Verify comment was actually created in database
        db_comment = TaskComment.objects.get(id=new_comment['id'])
        self.assertEqual(db_comment.content, 'New test comment')

    def test_organization_isolation(self):
        """Test that organization data is properly isolated."""
        # Query projects for org-1 should not return org-2 projects
        query = '''
        query($organizationSlug: String!) {
            projectsByOrganization(organizationSlug: $organizationSlug) {
                name
                organization {
                    slug
                }
            }
        }
        '''
        
        # Test org-1 isolation
        variables = {'organizationSlug': 'org-1'}
        result = self.client.execute(query, variables=variables)
        
        projects = result['data']['projectsByOrganization']
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]['name'], 'Project 1')
        self.assertEqual(projects[0]['organization']['slug'], 'org-1')
        
        # Test org-2 isolation
        variables = {'organizationSlug': 'org-2'}
        result = self.client.execute(query, variables=variables)
        
        projects = result['data']['projectsByOrganization']
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0]['name'], 'Project 2')
        self.assertEqual(projects[0]['organization']['slug'], 'org-2')

    def test_invalid_task_status_mutation(self):
        """Test updateTaskStatus with invalid status."""
        mutation = '''
        mutation($id: ID!, $status: String!) {
            updateTaskStatus(id: $id, status: $status) {
                success
                errors
                task {
                    id
                    status
                }
            }
        }
        '''
        
        variables = {
            'id': str(self.task1.id),
            'status': 'INVALID_STATUS'
        }
        
        result = self.client.execute(mutation, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        
        update_result = result['data']['updateTaskStatus']
        self.assertFalse(update_result['success'])
        self.assertTrue(len(update_result['errors']) > 0)

    def test_nonexistent_task_query(self):
        """Test querying non-existent task."""
        query = '''
        query($id: ID!) {
            taskDetail(id: $id) {
                id
                title
            }
        }
        '''
        
        variables = {'id': '99999'}  # Non-existent ID
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        self.assertIsNone(result['data']['taskDetail'])

    def test_nonexistent_project_tasks_query(self):
        """Test querying tasks for non-existent project."""
        query = '''
        query($projectId: ID!) {
            tasksByProject(projectId: $projectId) {
                id
                title
            }
        }
        '''
        
        variables = {'projectId': '99999'}  # Non-existent ID
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        self.assertEqual(result['data']['tasksByProject'], [])

    def test_empty_organization_projects_query(self):
        """Test querying projects for organization with no projects."""
        # Create organization with no projects
        empty_org = Organization.objects.create(
            name='Empty Organization',
            slug='empty-org',
            contact_email='empty@example.com'
        )
        
        query = '''
        query($organizationSlug: String!) {
            projectsByOrganization(organizationSlug: $organizationSlug) {
                id
                name
            }
        }
        '''
        
        variables = {'organizationSlug': 'empty-org'}
        result = self.client.execute(query, variables=variables)
        
        self.assertIsNone(result.get('errors'))
        self.assertEqual(result['data']['projectsByOrganization'], [])