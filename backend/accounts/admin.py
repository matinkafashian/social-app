from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    UserProfile,
    Post,
    PostLike,
    PostComment,
    PostSave,
    Follow,
    Notification,
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    fk_name = "user"
    extra = 0


class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]
    list_display = (
        "username",
        "email",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email")


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "handle",
        "city",
        "followers_count",
        "following_count",
        "is_active",
        "is_private",
    )
    list_filter = ("is_active", "is_private", "city")
    search_fields = ("user__username", "user__email", "handle", "city")
    autocomplete_fields = ("user",)


class PostLikeInline(admin.TabularInline):
    model = PostLike
    extra = 0


class PostCommentInline(admin.TabularInline):
    model = PostComment
    extra = 0


class PostSaveInline(admin.TabularInline):
    model = PostSave
    extra = 0


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "caption")
    autocomplete_fields = ("user",)
    inlines = [PostLikeInline, PostCommentInline, PostSaveInline]


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("post__id", "user__username", "user__email", "text")
    autocomplete_fields = ("post", "user")


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("post__id", "user__username", "user__email")
    autocomplete_fields = ("post", "user")


@admin.register(PostSave)
class PostSaveAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "created_at")
    list_filter = ("created_at",)
    search_fields = ("post__id", "user__username", "user__email")
    autocomplete_fields = ("post", "user")


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ("id", "follower", "following", "created_at")
    search_fields = (
        "follower__username",
        "follower__email",
        "following__username",
        "following__email",
    )
    autocomplete_fields = ("follower", "following")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "actor", "type", "is_read", "created_at")
    list_filter = ("type", "is_read", "created_at")
    search_fields = (
        "user__username",
        "user__email",
        "actor__username",
        "actor__email",
    )
    autocomplete_fields = ("user", "actor", "post")


# Re-register User admin with profile inline
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Admin site branding
admin.site.site_header = "Social Admin"
admin.site.site_title = "Social Admin"
admin.site.index_title = "Administration"
