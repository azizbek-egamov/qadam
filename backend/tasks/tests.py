import json
import tempfile
from io import BytesIO
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, Client, override_settings
from PIL import Image
from rest_framework.test import APIClient
from .models import DeveloperProfile, Task, TaskActivity

User = get_user_model()

class TaskApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='owner', password='Strong-admin-pass-908!')
        self.developer = User.objects.create_user(username='dev1', first_name='Ali', last_name='Valiyev', password='Strong-developer-pass-908!')
        DeveloperProfile.objects.create(user=self.developer, created_by=self.admin, must_change_password=False)
        self.client = APIClient(enforce_csrf_checks=True)
        self.client.get('/api/csrf/')

    def authenticate(self, username, password):
        token = self.client.cookies['csrftoken'].value
        return self.client.post('/api/login/', {'username': username, 'password': password}, format='json', HTTP_X_CSRFTOKEN=token)

    def test_login_requires_csrf_token(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post('/api/login/', data=json.dumps({'username': 'owner', 'password': 'Strong-admin-pass-908!'}), content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_superuser_creates_developer_with_one_time_password(self):
        self.authenticate('owner', 'Strong-admin-pass-908!')
        response = self.client.post('/api/developers/', {'name': 'Madina Karimova', 'username': 'madina.k'}, format='json', HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['developer']['name'], 'Madina Karimova')
        created = User.objects.get(username='madina.k')
        self.assertTrue(created.check_password(response.data['temporary_password']))
        self.assertTrue(created.developer_profile.must_change_password)
        self.assertNotIn('password', response.data['developer'])

    def test_superuser_creates_task_and_assigns_developer(self):
        self.authenticate('owner', 'Strong-admin-pass-908!')
        token = self.client.cookies['csrftoken'].value
        response = self.client.post('/api/tasks/', {'title': 'Profil API', 'description': 'Profil endpointlarini yozing.', 'category': 'Backend', 'priority': 'Yuqori', 'assignee_id': self.developer.id, 'due_date': '2026-06-21'}, format='json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data['category'], 'Backend')
        self.assertEqual(response.data['priority'], 'Yuqori')
        self.assertEqual(response.data['assignee'], 'Ali Valiyev')
        self.assertEqual(response.data['status'], 'new')

    def test_developer_cannot_create_task_or_manage_team(self):
        self.authenticate('dev1', 'Strong-developer-pass-908!')
        token = self.client.cookies['csrftoken'].value
        self.assertEqual(self.client.post('/api/tasks/', {'title': 'No ruxsat'}, format='json', HTTP_X_CSRFTOKEN=token).status_code, 403)
        self.assertEqual(self.client.post('/api/developers/', {'name': 'Yangi Azo', 'username': 'yangi.azo'}, format='json', HTTP_X_CSRFTOKEN=token).status_code, 403)

    def test_developer_only_sees_assigned_tasks_and_advances_one_step(self):
        task = Task.objects.create(title='API ishini tekshirish', creator=self.admin, assignee=self.developer)
        self.authenticate('dev1', 'Strong-developer-pass-908!')
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['id'] for item in response.data], [task.id])
        token = self.client.cookies['csrftoken'].value
        forbidden_jump = self.client.patch(f'/api/tasks/{task.id}/status/', {'status': 'done'}, format='json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(forbidden_jump.status_code, 400)
        progressed = self.client.patch(f'/api/tasks/{task.id}/status/', {'status': 'progress'}, format='json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(progressed.status_code, 200)
        task.refresh_from_db()
        self.assertEqual(task.status, 'progress')
        self.assertTrue(TaskActivity.objects.filter(task=task, action='status_changed').exists())

    def test_forced_password_change_unlocks_developer_access(self):
        self.developer.developer_profile.must_change_password = True
        self.developer.developer_profile.save(update_fields=['must_change_password'])
        self.authenticate('dev1', 'Strong-developer-pass-908!')
        token = self.client.cookies['csrftoken'].value
        changed = self.client.post('/api/password/', {'current_password': 'Strong-developer-pass-908!', 'new_password': 'A-new-Strong-Password-113!'}, format='json', HTTP_X_CSRFTOKEN=token)
        self.assertEqual(changed.status_code, 200, changed.data)
        self.assertIn('csrfToken', changed.data)
        self.assertTrue(self.developer.__class__.objects.get(pk=self.developer.pk).check_password('A-new-Strong-Password-113!'))
        self.assertFalse(self.developer.developer_profile.__class__.objects.get(pk=self.developer.developer_profile.pk).must_change_password)

    def test_attachment_upload_and_delivery_are_scoped_to_task_members(self):
        second = User.objects.create_user(username='dev2', password='Strong-developer-pass-999!')
        DeveloperProfile.objects.create(user=second, created_by=self.admin, must_change_password=False)
        task = Task.objects.create(title='Maxfiy rasm', creator=self.admin, assignee=self.developer)
        image_bytes = BytesIO()
        Image.new('RGB', (3, 3), color='green').save(image_bytes, format='PNG')
        image_bytes.seek(0)
        with tempfile.TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            self.authenticate('dev1', 'Strong-developer-pass-908!')
            token = self.client.cookies['csrftoken'].value
            uploaded = self.client.post(f'/api/tasks/{task.id}/attachments/', {'file': SimpleUploadedFile('layout.png', image_bytes.read(), content_type='image/png')}, format='multipart', HTTP_X_CSRFTOKEN=token)
            self.assertEqual(uploaded.status_code, 201, uploaded.data)
            private_file = self.client.get(uploaded.data['url'])
            self.assertEqual(private_file.status_code, 200)
            self.assertEqual(private_file['Content-Type'], 'image/png')
            private_file.close()
            self.client.cookies.clear()
            self.client.get('/api/csrf/')
            self.authenticate('dev2', 'Strong-developer-pass-999!')
            self.assertEqual(self.client.get(uploaded.data['url']).status_code, 403)

    def test_unassigned_developer_cannot_read_task_or_private_attachment(self):
        second = User.objects.create_user(username='dev2', password='Strong-developer-pass-999!')
        DeveloperProfile.objects.create(user=second, created_by=self.admin, must_change_password=False)
        task = Task.objects.create(title='Maxfiy vazifa', creator=self.admin, assignee=self.developer)
        self.authenticate('dev2', 'Strong-developer-pass-999!')
        self.assertEqual(self.client.get('/api/tasks/').data, [])
        self.assertEqual(self.client.patch(f'/api/tasks/{task.id}/status/', {'status': 'progress'}, format='json', HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value).status_code, 403)

    def test_developer_must_change_initial_password_before_access(self):
        self.developer.developer_profile.must_change_password = True
        self.developer.developer_profile.save(update_fields=['must_change_password'])
        self.authenticate('dev1', 'Strong-developer-pass-908!')
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, 403)
