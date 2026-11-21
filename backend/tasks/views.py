import json
import secrets
from datetime import date, timedelta
from pathlib import Path
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.db.models import Q
from django.http import FileResponse, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_POST
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import DeveloperProfile, Task, TaskActivity, TaskAttachment
from .serializers import (
    DeveloperCreateSerializer, DeveloperSerializer, PasswordChangeSerializer,
    TaskActivitySerializer, TaskCreateSerializer, TaskSerializer, TaskUpdateSerializer
)

User = get_user_model()

@ensure_csrf_cookie
@require_GET
def csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

def user_payload(user):
    parts = (user.get_full_name() or user.get_username()).split()
    initials = ''.join(p[0] for p in parts[:2]).upper() if parts else 'U'
    return {
        'id': user.id,
        'name': user.get_full_name() or user.get_username(),
        'username': user.get_username(),
        'is_superuser': user.is_superuser,
        'initials': initials,
        'role_display': 'Super Administrator' if user.is_superuser else 'Dasturchi',
    }

@csrf_protect
@require_POST
def sign_in(request):
    try:
        data = json.loads(request.body or '{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'So‘rov formati noto‘g‘ri.'}, status=400)

    username = str(data.get('username', '')).strip()[:150]
    address = request.META.get('REMOTE_ADDR', 'unknown')
    key = f'qadam-login:{address}:{username.casefold()}'

    try:
        if (cache.get(key) or 0) >= 15:
            return JsonResponse({'error': 'Urinishlar soni ko‘payib ketdi. 15 daqiqadan so‘ng qayta urinib ko‘ring.'}, status=429)
    except Exception:
        pass

    try:
        user = authenticate(request, username=username, password=data.get('password', ''))
    except Exception as exc:
        import logging
        logging.getLogger(__name__).exception("Auth error during sign_in")
        return JsonResponse({'error': f'Autentifikatsiya xatosi: {exc}'}, status=500)

    if user is None:
        try:
            attempts = (cache.get(key) or 0) + 1
            cache.set(key, attempts, 900)
        except Exception:
            pass
        return JsonResponse({'error': 'Login yoki parol noto‘g‘ri.'}, status=401)

    if not user.is_active:
        return JsonResponse({'error': 'Hisob vaqtincha o‘chirilgan.'}, status=403)

    try:
        cache.delete(key)
    except Exception:
        pass

    try:
        login(request, user)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).exception("Session error during login")
        return JsonResponse({'error': f'Sessiya xatosi: {exc}'}, status=500)

    return JsonResponse({'user': user_payload(user), 'csrfToken': get_token(request)})

@require_POST
@login_required
def sign_out(request):
    logout(request)
    return JsonResponse({'success': True})

class MeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'authenticated': False})
        profile = getattr(request.user, 'developer_profile', None)
        return Response({
            'authenticated': True,
            'user': {
                **user_payload(request.user),
                'must_change_password': bool(profile and profile.must_change_password)
            }
        })

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Avtorizatsiyadan o‘tilmagan.'}, status=status.HTTP_401_UNAUTHORIZED)
        user = request.user
        data = request.data
        update_fields = []

        if 'name' in data:
            name_val = str(data['name']).strip()
            if not name_val:
                return Response({'detail': 'Ism bo‘sh bo‘lishi mumkin emas.'}, status=status.HTTP_400_BAD_REQUEST)
            parts = name_val.split(maxsplit=1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            update_fields.extend(['first_name', 'last_name'])

        if 'username' in data:
            new_username = str(data['username']).strip()
            if not new_username:
                return Response({'detail': 'Login bo‘sh bo‘lishi mumkin emas.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.exclude(pk=user.pk).filter(username__iexact=new_username).exists():
                return Response({'detail': 'Bu login allaqachon band. Boshqa login tanlang.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = new_username
            update_fields.append('username')

        if 'new_password' in data and data['new_password']:
            new_pass = str(data['new_password'])
            current_pass = data.get('current_password')
            if not user.is_superuser:
                if not current_pass or not user.check_password(current_pass):
                    return Response({'detail': 'Joriy parol noto‘g‘ri.'}, status=status.HTTP_400_BAD_REQUEST)
            elif current_pass and not user.check_password(current_pass):
                return Response({'detail': 'Joriy parol noto‘g‘ri.'}, status=status.HTTP_400_BAD_REQUEST)

            if len(new_pass) < 8:
                return Response({'detail': 'Yangi parol kamida 8 ta belgidan iborat bo‘lishi kerak.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_pass)
            update_fields.append('password')
            profile = getattr(user, 'developer_profile', None)
            if profile:
                profile.must_change_password = False
                profile.save(update_fields=['must_change_password'])

        if update_fields:
            user.save(update_fields=list(set(update_fields)))
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        return Response({
            'user': user_payload(user),
            'csrfToken': get_token(request)
        })

class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['current_password']):
            return Response({'detail': 'Joriy parol noto‘g‘ri.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        profile = getattr(request.user, 'developer_profile', None)
        if profile:
            profile.must_change_password = False
            profile.save(update_fields=['must_change_password'])
        login(request, request.user, backend='django.contrib.auth.backends.ModelBackend')
        return Response({'success': True, 'csrfToken': get_token(request)})

class SetupRequiredPermission(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        profile = getattr(request.user, 'developer_profile', None)
        return not (profile and profile.must_change_password)

CATEGORY_MAP = {'Frontend': 'frontend', 'Backend': 'backend', 'Dizayn': 'design', 'Tahlil': 'analysis', 'Boshqa': 'other'}
PRIORITY_MAP = {'Yuqori': 'high', 'O‘rta': 'medium', 'Past': 'low'}

class TaskListCreateView(APIView):
    permission_classes = [SetupRequiredPermission]

    def get(self, request):
        queryset = Task.objects.select_related('assignee', 'creator').prefetch_related('activity', 'attachments')
        scope = request.query_params.get('scope', 'my' if not request.user.is_superuser else 'all')
        if not request.user.is_superuser and scope == 'my':
            queryset = queryset.filter(assignee=request.user)
        assignee_id = request.query_params.get('assignee_id')
        if assignee_id and assignee_id != 'all':
            queryset = queryset.filter(assignee_id=assignee_id)
        status_filter = request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)
        return Response(TaskSerializer(queryset, many=True).data)

    def post(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Faqat super administrator vazifa yaratishi mumkin.'}, status=status.HTTP_403_FORBIDDEN)
        payload = request.data.copy()
        payload['category'] = CATEGORY_MAP.get(payload.get('category'), payload.get('category', 'other'))
        payload['priority'] = PRIORITY_MAP.get(payload.get('priority'), payload.get('priority', 'medium'))
        due = payload.get('due')
        if due and not payload.get('due_date'):
            if due == 'Bugun':
                payload['due_date'] = date.today().isoformat()
            elif due == 'Ertaga':
                payload['due_date'] = (date.today() + timedelta(days=1)).isoformat()
        serializer = TaskCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        assignee_id = serializer.validated_data.pop('assignee_id', None)
        assignee = User.objects.filter(id=assignee_id, is_active=True).first() if assignee_id else User.objects.filter(is_superuser=False, is_active=True).order_by('id').first()
        if not assignee:
            return Response({'detail': 'Avval jamoaga kamida bitta faol dasturchi qo‘shing.'}, status=status.HTTP_400_BAD_REQUEST)
        task = serializer.save(creator=request.user, assignee=assignee)
        TaskActivity.objects.create(task=task, actor=request.user, action='created', to_status=task.status, note='Vazifa yaratildi')
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

class TaskDetailView(APIView):
    permission_classes = [SetupRequiredPermission]

    def get(self, request, pk):
        task = Task.objects.filter(pk=pk).select_related('assignee', 'creator').prefetch_related('activity', 'attachments').first()
        if not task:
            return Response({'detail': 'Vazifa topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TaskSerializer(task).data)

    def patch(self, request, pk):
        task = Task.objects.filter(pk=pk).select_related('assignee', 'creator').first()
        if not task:
            return Response({'detail': 'Vazifa topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser:
            return Response({'detail': 'Faqat super administrator vazifani tahrirlashi mumkin.'}, status=status.HTTP_403_FORBIDDEN)
        payload = request.data.copy()
        if 'category' in payload:
            payload['category'] = CATEGORY_MAP.get(payload['category'], payload['category'])
        if 'priority' in payload:
            payload['priority'] = PRIORITY_MAP.get(payload['priority'], payload['priority'])
        serializer = TaskUpdateSerializer(task, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_task = serializer.save()
        TaskActivity.objects.create(task=updated_task, actor=request.user, action='updated', note='Vazifa maʼlumotlari tahrirlandi')
        return Response(TaskSerializer(updated_task).data)

    def delete(self, request, pk):
        task = Task.objects.filter(pk=pk).first()
        if not task:
            return Response({'detail': 'Vazifa topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser:
            return Response({'detail': 'Faqat super administrator vazifani o‘chira oladi.'}, status=status.HTTP_403_FORBIDDEN)
        task.delete()
        return Response({'success': True}, status=status.HTTP_204_NO_CONTENT)

class TaskStatusView(APIView):
    permission_classes = [SetupRequiredPermission]

    def patch(self, request, pk):
        task = Task.objects.filter(pk=pk).select_related('assignee', 'creator').first()
        if task is None:
            return Response({'detail': 'Vazifa topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser and task.assignee_id != request.user.id:
            return Response({'detail': 'Bu vazifa sizga biriktirilmagan.'}, status=status.HTTP_403_FORBIDDEN)
        next_status = request.data.get('status')
        if next_status not in Task.Status.values:
            return Response({'detail': 'Yaroqsiz holat qiymati.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.is_superuser:
            valid_transitions = {
                'new': ['progress'],
                'progress': ['review'],
                'review': ['progress'],
                'done': []
            }
            if next_status not in valid_transitions.get(task.status, []):
                return Response({'detail': f'Dasturchi vazifani {task.status} holatidan {next_status} holatiga o‘tkaza olmaydi.'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = task.status
        task.status = next_status
        task.save(update_fields=['status', 'updated_at'])
        note = request.data.get('note', '')
        TaskActivity.objects.create(
            task=task,
            actor=request.user,
            action='status_changed',
            from_status=old_status,
            to_status=next_status,
            note=note or f'Holat o‘zgartirildi: {old_status} -> {next_status}'
        )
        return Response(TaskSerializer(task).data)

class TaskActivityCreateView(APIView):
    permission_classes = [SetupRequiredPermission]

    def post(self, request, pk):
        task = Task.objects.filter(pk=pk).first()
        if not task:
            return Response({'detail': 'Vazifa topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser and task.assignee_id != request.user.id:
            return Response({'detail': 'Bu vazifaga sharh yozish huquqi yo‘q.'}, status=status.HTTP_403_FORBIDDEN)
        note = str(request.data.get('note', '')).strip()
        if not note:
            return Response({'detail': 'Sharh matni bo‘sh bo‘lishi mumkin emas.'}, status=status.HTTP_400_BAD_REQUEST)
        activity = TaskActivity.objects.create(task=task, actor=request.user, action='comment', note=note)
        return Response(TaskActivitySerializer(activity).data, status=status.HTTP_201_CREATED)

class DeveloperListCreateView(APIView):
    permission_classes = [SetupRequiredPermission]

    def get(self, request):
        users = User.objects.filter(is_superuser=False).order_by('first_name', 'username')
        return Response(DeveloperSerializer(users, many=True).data)

    def post(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Faqat super administrator hisob yarata oladi.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = DeveloperCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        full_name = serializer.validated_data['name'].strip()
        parts = full_name.split(maxsplit=1)
        temporary_password = secrets.token_urlsafe(14)
        developer = User.objects.create_user(
            username=serializer.validated_data['username'],
            first_name=parts[0],
            last_name=parts[1] if len(parts) > 1 else '',
            password=temporary_password
        )
        DeveloperProfile.objects.create(user=developer, created_by=request.user, must_change_password=True)
        return Response({'developer': DeveloperSerializer(developer).data, 'temporary_password': temporary_password}, status=status.HTTP_201_CREATED)

class DeveloperDetailView(APIView):
    permission_classes = [SetupRequiredPermission]

    def patch(self, request, pk):
        if not request.user.is_superuser:
            return Response({'detail': 'Faqat administrator amalga oshirishi mumkin.'}, status=status.HTTP_403_FORBIDDEN)
        user = User.objects.filter(pk=pk, is_superuser=False).first()
        if not user:
            return Response({'detail': 'Dasturchi topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        update_fields = []

        if 'name' in data:
            name_val = str(data['name']).strip()
            if not name_val:
                return Response({'detail': 'Ism bo‘sh bo‘lishi mumkin emas.'}, status=status.HTTP_400_BAD_REQUEST)
            parts = name_val.split(maxsplit=1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            update_fields.extend(['first_name', 'last_name'])

        if 'username' in data:
            new_username = str(data['username']).strip()
            if not new_username:
                return Response({'detail': 'Login bo‘sh bo‘lishi mumkin emas.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.exclude(pk=user.pk).filter(username__iexact=new_username).exists():
                return Response({'detail': 'Bu login allaqachon mavjud.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = new_username
            update_fields.append('username')

        if 'password' in data and data['password']:
            new_pass = str(data['password'])
            if len(new_pass) < 6:
                return Response({'detail': 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_pass)
            update_fields.append('password')
            profile, _ = DeveloperProfile.objects.get_or_create(user=user)
            profile.must_change_password = False
            profile.save(update_fields=['must_change_password'])

        if 'active' in data:
            user.is_active = bool(data['active'])
            update_fields.append('is_active')

        if update_fields:
            user.save(update_fields=list(set(update_fields)))

        return Response(DeveloperSerializer(user).data)

    def post(self, request, pk):
        if not request.user.is_superuser:
            return Response({'detail': 'Faqat administrator amalga oshirishi mumkin.'}, status=status.HTTP_403_FORBIDDEN)
        user = User.objects.filter(pk=pk, is_superuser=False).first()
        if not user:
            return Response({'detail': 'Dasturchi topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        temporary_password = secrets.token_urlsafe(14)
        user.set_password(temporary_password)
        user.save(update_fields=['password'])
        profile, _ = DeveloperProfile.objects.get_or_create(user=user)
        profile.must_change_password = True
        profile.save(update_fields=['must_change_password'])
        return Response({'temporary_password': temporary_password, 'developer': DeveloperSerializer(user).data})

class AttachmentUploadView(APIView):
    permission_classes = [SetupRequiredPermission]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        task = Task.objects.filter(pk=pk).first()
        if task is None:
            return Response({'detail': 'Vazifa topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser and task.assignee_id != request.user.id:
            return Response({'detail': 'Bu vazifa sizga biriktirilmagan.'}, status=status.HTTP_403_FORBIDDEN)
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Fayl tanlanmagan.'}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > 10 * 1024 * 1024:
            return Response({'detail': 'Fayl hajmi 10 MB dan oshmasligi kerak.'}, status=status.HTTP_400_BAD_REQUEST)
        extension = Path(file.name).suffix.lower()
        if extension not in {'.png', '.jpg', '.jpeg', '.webp', '.pdf'}:
            return Response({'detail': 'Faqat PNG, JPG, WEBP yoki PDF fayllar ruxsat etiladi.'}, status=status.HTTP_400_BAD_REQUEST)
        if extension == '.pdf':
            if not file.read(5).startswith(b'%PDF-'):
                return Response({'detail': 'Fayl haqiqiy PDF emas.'}, status=status.HTTP_400_BAD_REQUEST)
            file.seek(0)
        else:
            try:
                from PIL import Image
                image = Image.open(file)
                image.verify()
                if image.format not in {'PNG', 'JPEG', 'WEBP'}:
                    raise ValueError('Unsupported image format')
                file.seek(0)
            except (ValueError, OSError, Image.DecompressionBombError):
                return Response({'detail': 'Rasm fayli buzilgan yoki yaroqsiz.'}, status=status.HTTP_400_BAD_REQUEST)
        attachment = TaskAttachment.objects.create(
            task=task,
            uploaded_by=request.user,
            file=file,
            original_name=Path(file.name).name[:255],
            size=file.size
        )
        TaskActivity.objects.create(
            task=task,
            actor=request.user,
            action='attachment_uploaded',
            note=f'Fayl yuklandi: {attachment.original_name}'
        )
        return Response({
            'id': attachment.id,
            'name': attachment.original_name,
            'size': attachment.size,
            'url': f'/api/attachments/{attachment.id}/file/'
        }, status=status.HTTP_201_CREATED)

class AttachmentDownloadView(APIView):
    permission_classes = [SetupRequiredPermission]

    def get(self, request, pk):
        attachment = TaskAttachment.objects.filter(pk=pk).select_related('task').first()
        if attachment is None:
            return Response({'detail': 'Fayl topilmadi.'}, status=status.HTTP_404_NOT_FOUND)
        if not request.user.is_superuser and attachment.task.assignee_id != request.user.id:
            return Response({'detail': 'Bu faylga kirish huquqi yo‘q.'}, status=status.HTTP_403_FORBIDDEN)
        suffix = Path(attachment.file.name).suffix.lower()
        content_type = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg'
        }.get(suffix, 'application/octet-stream')
        response = FileResponse(
            attachment.file.open('rb'),
            as_attachment=suffix == '.pdf',
            filename=Path(attachment.original_name).name,
            content_type=content_type
        )
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response
