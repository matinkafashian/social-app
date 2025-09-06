from django.urls import path
from .views import (
  RegisterView, LoginView, MeView, ProfileView, ProfilePhotoView, UsernameCheckView,
  FeedView, ExploreView, MyPostsView, UserDetailView, UserPostsView,
  PostCreateView, PostDetailView, post_like, PostCommentsView, post_save_toggle,
  NotificationsView, NotificationsReadAllView, SearchUsersView, FollowToggleView, SavedPostsView,
  CategoryPostsView
)
urlpatterns = [
  path("register/", RegisterView.as_view()),
  path("login/", LoginView.as_view()),
  path("me/", MeView.as_view()),
  path("profile/", ProfileView.as_view()),
  path("profile/photo/", ProfilePhotoView.as_view()),
  path("username-check/", UsernameCheckView.as_view()),
  path("feed/", FeedView.as_view()),
  path("explore/", ExploreView.as_view()),
  path("my-posts/", MyPostsView.as_view()),
  path("users/<slug:handle>/", UserDetailView.as_view()),
  path("users/<slug:handle>/posts/", UserPostsView.as_view()),
  path("users/<slug:handle>/follow/", FollowToggleView.as_view()),
  path("posts/", PostCreateView.as_view()),
  path("posts/<int:pk>/", PostDetailView.as_view()),
  path("posts/<int:pk>/like/", post_like),
  path("posts/<int:pk>/save/", post_save_toggle),
  path("posts/<int:pk>/comments/", PostCommentsView.as_view()),
  path("saved/", SavedPostsView.as_view()),
  path("categories/<slug:category>/posts/", CategoryPostsView.as_view()),
  path("notifications/", NotificationsView.as_view()),
  path("notifications/read-all/", NotificationsReadAllView.as_view()),
  path("search-users/", SearchUsersView.as_view()),
]
