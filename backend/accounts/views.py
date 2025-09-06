from django.contrib.auth.models import User
import json
from django.db import transaction
from django.db.models import Count, Exists, OuterRef
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, parsers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import UserProfile, Post, PostLike, PostComment, Notification, Follow, PostSave
from .serializers import ProfileSerializer, ProfileUpdateSerializer, PostListSerializer, NotificationSerializer
from django.utils.text import slugify

def _post_qs_for(request):
  qs = Post.objects.all().select_related("user","user__profile")
  qs = qs.annotate(like_count=Count("likes"), comment_count=Count("comments"))
  qs = qs.annotate(did_like=Exists(PostLike.objects.filter(post=OuterRef("pk"), user=request.user)))
  return qs

def _push_notification(request, notif):
  try:
    layer = get_channel_layer()
    data = NotificationSerializer(notif, context={"request": request}).data
    async_to_sync(layer.group_send)(f"user_{notif.user_id}", {"type":"notify", "item": data})
  except Exception:
    pass

class RegisterView(APIView):
  permission_classes = [permissions.AllowAny]
  def post(self, request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
      return Response({"detail":"email and password required"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
      return Response({"detail":"email already registered"}, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
      user = User.objects.create_user(username=email, email=email, password=password)
      UserProfile.objects.create(user=user)
    refresh = RefreshToken.for_user(user)
    return Response({"user":{"id":user.id,"email":user.email},"access":str(refresh.access_token),"refresh":str(refresh)}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
  permission_classes = [permissions.AllowAny]
  def post(self, request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    try: user = User.objects.get(email=email)
    except User.DoesNotExist: return Response({"detail":"invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(password): return Response({"detail":"invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
    refresh = RefreshToken.for_user(user)
    return Response({"user":{"id":user.id,"email":user.email},"access":str(refresh.access_token),"refresh":str(refresh)})

class MeView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    u = request.user
    return Response({"id":u.id, "email":u.email})

class ProfileView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    data = ProfileSerializer(profile).data
    photo_url = None
    if profile.photo and hasattr(profile.photo, "url"):
      photo_url = request.build_absolute_uri(profile.photo.url)
    data["photo_url"] = photo_url
    data["followers"] = Follow.objects.filter(following=request.user).count()
    data["following"] = Follow.objects.filter(follower=request.user).count()
    return Response(data)
  
  def put(self, request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    ser = ProfileUpdateSerializer(data=request.data, context={"profile": profile})
    ser.is_valid(raise_exception=True)
    if "handle" in ser.validated_data: profile.handle = ser.validated_data["handle"]
    if "city" in ser.validated_data: profile.city = ser.validated_data["city"]
    if "categories" in ser.validated_data: profile.categories = ser.validated_data["categories"]
    if "bio" in ser.validated_data: profile.bio = ser.validated_data["bio"]
    if "age" in ser.validated_data: profile.age = ser.validated_data["age"]
    profile.save()
    return Response({"ok": True, "handle": profile.handle})

class ProfilePhotoView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  parser_classes = [parsers.MultiPartParser, parsers.FormParser]
  def post(self, request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    photo = request.data.get("photo")
    if not photo: return Response({"detail":"no photo"}, status=status.HTTP_400_BAD_REQUEST)
    profile.photo = photo; profile.save(update_fields=["photo"])
    url = request.build_absolute_uri(profile.photo.url)
    return Response({"ok": True, "photo_url": url})

class UsernameCheckView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    handle = (request.query_params.get("handle") or "").strip().lower()
    if not handle: return Response({"available": False})
    exists = UserProfile.objects.filter(handle=handle).exists()
    me = getattr(request.user, "profile", None)
    if me and me.handle == handle: exists = False
    return Response({"available": not exists})

class FeedView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if not Post.objects.filter(user=request.user).exists() and profile.photo:
      Post.objects.create(user=request.user, image=profile.photo, caption=profile.handle or "")
    qs = _post_qs_for(request).order_by("-created_at")[:50]
    ser = PostListSerializer(qs, many=True, context={"request": request})
    return Response(ser.data)

class ExploreView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    qs = _post_qs_for(request).exclude(user=request.user).order_by("-created_at")[:50]
    ser = PostListSerializer(qs, many=True, context={"request": request})
    return Response(ser.data)

class MyPostsView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    qs = _post_qs_for(request).filter(user=request.user).order_by("-created_at")[:50]
    ser = PostListSerializer(qs, many=True, context={"request": request})
    return Response(ser.data)

class UserDetailView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request, handle):
    try:
      p = UserProfile.objects.select_related("user").get(handle=handle)
    except UserProfile.DoesNotExist:
      return Response(status=status.HTTP_404_NOT_FOUND)
    photo_url = None
    if p.photo and hasattr(p.photo, "url"):
      photo_url = request.build_absolute_uri(p.photo.url)
    followers = Follow.objects.filter(following=p.user).count()
    following = Follow.objects.filter(follower=p.user).count()
    is_following = Follow.objects.filter(follower=request.user, following=p.user).exists()
    return Response({
      "handle": p.handle,
      "photo_url": photo_url,
      "is_me": p.user_id == request.user.id,
      "followers": followers,
      "following": following,
      "is_following": is_following,
      "bio": p.bio,
      "categories": p.categories,
      "city": p.city,
      "age": p.age,
    })

class UserPostsView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request, handle):
    try:
      p = UserProfile.objects.select_related("user").get(handle=handle)
    except UserProfile.DoesNotExist:
      return Response(status=status.HTTP_404_NOT_FOUND)
    qs = _post_qs_for(request).filter(user=p.user).order_by("-created_at")[:50]
    ser = PostListSerializer(qs, many=True, context={"request": request})
    return Response(ser.data)

class PostCreateView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  parser_classes = [parsers.MultiPartParser, parsers.FormParser]
  def post(self, request):
    image = request.data.get("image"); caption = request.data.get("caption") or ""
    if not image: return Response({"detail":"no image"}, status=status.HTTP_400_BAD_REQUEST)
    raw = request.data.get("categories")
    categories = []
    if raw is not None:
      try:
        if isinstance(raw, (list, tuple)):
          categories = list(raw)
        else:
          s = str(raw)
          if s.strip().startswith("["):
            categories = json.loads(s)
          else:
            categories = [x.strip() for x in s.split(",") if x.strip()]
      except Exception:
        categories = []
    # sanitize and limit
    categories = [str(c)[:32] for c in categories][:6]
    p = Post.objects.create(user=request.user, image=image, caption=caption, categories=categories)
    return Response({"id": p.id})

class PostDetailView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request, pk):
    try: post = Post.objects.select_related("user","user__profile").get(pk=pk)
    except Post.DoesNotExist: return Response(status=status.HTTP_404_NOT_FOUND)
    # annotate for serializer parity
    from django.db.models import Count, Exists, OuterRef
    post.like_count = post.likes.count()
    post.comment_count = post.comments.count()
    post.did_like = PostLike.objects.filter(post=post, user=request.user).exists()
    ser = PostListSerializer(post, context={"request": request})
    return Response(ser.data)
  def put(self, request, pk):
    try: post = Post.objects.get(pk=pk)
    except Post.DoesNotExist: return Response(status=status.HTTP_404_NOT_FOUND)
    if post.user_id != request.user.id:
      return Response({"detail":"forbidden"}, status=status.HTTP_403_FORBIDDEN)
    caption = request.data.get("caption")
    raw = request.data.get("categories")
    categories = None
    if raw is not None:
      try:
        if isinstance(raw, (list, tuple)):
          categories = list(raw)
        else:
          s = str(raw)
          if s.strip().startswith("["):
            categories = json.loads(s)
          else:
            categories = [x.strip() for x in s.split(",") if x.strip()]
      except Exception:
        categories = None
    if caption is not None: post.caption = caption
    if categories is not None:
      post.categories = [str(c)[:32] for c in categories][:6]
    post.save()
    return Response({"ok": True})
  def delete(self, request, pk):
    try: post = Post.objects.get(pk=pk)
    except Post.DoesNotExist: return Response(status=status.HTTP_404_NOT_FOUND)
    if post.user_id != request.user.id:
      return Response({"detail":"forbidden"}, status=status.HTTP_403_FORBIDDEN)
    post.delete()
    return Response({"ok": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def post_like(request, pk):
    post = get_object_or_404(Post, pk=pk)
    like, created = PostLike.objects.get_or_create(user=request.user, post=post)
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
        if post.user_id != request.user.id:
            n = Notification.objects.create(user=post.user, actor=request.user, post=post, type="like")
            _push_notification(request, n)
    return Response({"liked": liked, "likes_count": post.likes.count()})

class PostCommentsView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request, pk):
    try: post = Post.objects.get(pk=pk)
    except Post.DoesNotExist: return Response(status=status.HTTP_404_NOT_FOUND)
    items = list(post.comments.select_related("user","user__profile").order_by("created_at").values("id","text","created_at","user__profile__handle","user__email"))
    for it in items:
      author = it.pop("user__profile__handle") or it.pop("user__email")
      it["author"] = author
    return Response({"items": items})
  def post(self, request, pk):
    text = (request.data.get("text") or "").strip()
    if not text: return Response({"detail":"empty"}, status=status.HTTP_400_BAD_REQUEST)
    try: post = Post.objects.get(pk=pk)
    except Post.DoesNotExist: return Response(status=status.HTTP_404_NOT_FOUND)
    PostComment.objects.create(user=request.user, post=post, text=text)
    if post.user_id != request.user.id:
      n = Notification.objects.create(user=post.user, actor=request.user, post=post, type="comment")
      _push_notification(request, n)
    count = post.comments.count()
    return Response({"ok": True, "comment_count": count})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def post_save_toggle(request, pk):
    post = get_object_or_404(Post, pk=pk)
    obj, created = PostSave.objects.get_or_create(user=request.user, post=post)
    if not created:
        obj.delete()
        saved = False
    else:
        saved = True
    return Response({"saved": saved})

class SavedPostsView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    saved_ids = list(PostSave.objects.filter(user=request.user).order_by("-created_at").values_list("post_id", flat=True)[:200])
    # preserve order
    id_to_idx = {pid:i for i,pid in enumerate(saved_ids)}
    qs = _post_qs_for(request).filter(id__in=saved_ids)
    items = sorted(list(qs), key=lambda p: id_to_idx.get(p.id, 0))
    ser = PostListSerializer(items, many=True, context={"request": request})
    return Response(ser.data)

class NotificationsView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    base_qs = Notification.objects.filter(user=request.user).select_related("actor","actor__profile","post")
    unread = base_qs.filter(is_read=False).count()
    qs = base_qs[:50]
    data = NotificationSerializer(qs, many=True, context={"request": request}).data
    return Response({"items": data, "unread": unread})

class NotificationsReadAllView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def post(self, request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"ok": True})

class SearchUsersView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request):
    q = (request.query_params.get("q") or "").strip().lower()
    if not q: return Response({"items": []})
    qs = UserProfile.objects.select_related("user").filter(handle__icontains=q).order_by("handle")[:10]
    items = []
    for p in qs:
      photo_url = None
      if p.photo and hasattr(p.photo, "url"):
        photo_url = request.build_absolute_uri(p.photo.url)
      items.append({"handle": p.handle, "photo_url": photo_url})
    return Response({"items": items})

class FollowToggleView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def post(self, request, handle):
    try:
      p = UserProfile.objects.select_related("user").get(handle=handle)
    except UserProfile.DoesNotExist:
      return Response(status=status.HTTP_404_NOT_FOUND)
    if p.user_id == request.user.id:
      return Response({"detail":"cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
    obj, created = Follow.objects.get_or_create(follower=request.user, following=p.user)
    did_follow = True
    if not created:
      obj.delete(); did_follow = False
    else:
      # push follow notification
      try:
        n = Notification.objects.create(user=p.user, actor=request.user, post=None, type="follow")
        _push_notification(request, n)
      except Exception:
        pass
    followers = Follow.objects.filter(following=p.user).count()
    following = Follow.objects.filter(follower=request.user).count()
    return Response({"ok": True, "did_follow": did_follow, "followers": followers, "following": following})

class CategoryPostsView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  def get(self, request, category):
    limit = request.query_params.get("limit")
    try: limit = int(limit) if limit is not None else 20
    except: limit = 20
    if limit < 1: limit = 1
    if limit > 50: limit = 50
    offset = request.query_params.get("offset")
    try: offset = int(offset) if offset is not None else 0
    except: offset = 0
    qcat = category
    base_qs = _post_qs_for(request).order_by("-created_at","-id")
    # Robust fallback: Python-side filtering to avoid SQLite JSON quirks
    # Fetch a reasonable window then filter
    window = list(base_qs[:500])
    filtered = [p for p in window if qcat in (getattr(p, "categories", []) or [])]
    items = filtered[offset:offset+limit]
    ser = PostListSerializer(items, many=True, context={"request": request})
    next_offset = offset + len(items)
    if len(items) < limit or (offset + limit) >= len(filtered):
      next_offset = None
    return Response({"items": ser.data, "next_offset": next_offset})
