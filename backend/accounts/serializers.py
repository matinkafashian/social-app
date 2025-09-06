import re
from rest_framework import serializers
from .models import UserProfile, Post, Notification, PostSave
HANDLE_RE = re.compile(r"^[a-z0-9_]{3,20}$")

class ProfileSerializer(serializers.ModelSerializer):
  email = serializers.SerializerMethodField()
  class Meta:
    model = UserProfile
    fields = ["email","handle","photo","city","categories","bio","age"]
    read_only_fields = ["email","photo"]
  def get_email(self, obj): return obj.user.email

class ProfileUpdateSerializer(serializers.Serializer):
  handle = serializers.CharField(required=False)
  city = serializers.CharField(allow_blank=True, required=False)
  categories = serializers.ListField(child=serializers.CharField(), required=False)
  bio = serializers.CharField(allow_blank=True, required=False)
  age = serializers.IntegerField(required=False, min_value=13, max_value=120)
  def validate_handle(self, value):
    v = value.strip().lower()
    if not HANDLE_RE.match(v):
      raise serializers.ValidationError("handle must be 3-20 chars: a-z, 0-9, underscore")
    qs = UserProfile.objects.filter(handle=v)
    me = self.context.get("profile")
    if me: qs = qs.exclude(pk=me.pk)
    if qs.exists(): raise serializers.ValidationError("handle already taken")
    return v

class PostListSerializer(serializers.ModelSerializer):
  image_url = serializers.SerializerMethodField()
  likes_count = serializers.IntegerField(source="like_count", read_only=True)
  comment_count = serializers.IntegerField()
  is_liked = serializers.BooleanField(source="did_like")
  user_handle = serializers.SerializerMethodField()
  user_avatar = serializers.SerializerMethodField()
  is_owner = serializers.SerializerMethodField()
  is_saved = serializers.SerializerMethodField()
  class Meta:
    model = Post
    fields = ["id","image_url","caption","categories","created_at","likes_count","comment_count","is_liked","user_handle","user_avatar","is_owner","is_saved"]
  def get_image_url(self, obj):
    try: return self.context["request"].build_absolute_uri(obj.image.url)
    except: return None
  def get_user_handle(self, obj):
    p = getattr(obj.user, "profile", None)
    return getattr(p, "handle", None) or obj.user.email
  def get_user_avatar(self, obj):
    p = getattr(obj.user, "profile", None)
    if p and p.photo and hasattr(p.photo, "url"):
      try: return self.context["request"].build_absolute_uri(p.photo.url)
      except: return None
    return None
  def get_is_owner(self, obj):
    try:
      req = self.context.get("request")
      return bool(req and req.user and obj.user_id == req.user.id)
    except Exception:
      return False
  def get_is_saved(self, obj):
    try:
      req = self.context.get("request")
      if not req or not req.user or not req.user.is_authenticated: return False
      return PostSave.objects.filter(user=req.user, post=obj).exists()
    except Exception:
      return False

class NotificationSerializer(serializers.ModelSerializer):
  post_id = serializers.IntegerField(read_only=True)
  actor_handle = serializers.SerializerMethodField()
  actor_avatar = serializers.SerializerMethodField()
  post_image = serializers.SerializerMethodField()
  class Meta:
    model = Notification
    fields = ["id","type","is_read","created_at","actor_handle","actor_avatar","post_image","post_id"]
  def get_actor_handle(self, obj):
    p = getattr(obj.actor, "profile", None)
    return getattr(p, "handle", None) or obj.actor.email
  def get_actor_avatar(self, obj):
    p = getattr(obj.actor, "profile", None)
    if p and p.photo and hasattr(p.photo, "url"):
      try: return self.context["request"].build_absolute_uri(p.photo.url)
      except: return None
    return None
  def get_post_image(self, obj):
    if obj.post and obj.post.image and hasattr(obj.post.image, "url"):
      try: return self.context["request"].build_absolute_uri(obj.post.image.url)
      except: return None
    return None
