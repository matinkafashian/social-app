from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
def root(request): return JsonResponse({"ok": True, "service":"social-api"})
def health(request): return JsonResponse({"status":"ok"})
urlpatterns = [
  path("", root),
  path("admin/", admin.site.urls),
  path("api/auth/", include("accounts.urls")),
  path("api/", include("accounts.urls")),
  path("api/health/", health),
]
if settings.DEBUG:
  urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
