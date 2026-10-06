from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'dist'
FRONTEND_DIST_ASSETS = FRONTEND_DIST / 'assets'

urlpatterns = [
    path('admin/', admin.site.urls),
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': str(FRONTEND_DIST_ASSETS)}),
    re_path(r'^(?P<path>[^/]+\.(ico|svg|png|jpg|jpeg|webp|json|txt))$', serve, {'document_root': str(FRONTEND_DIST)}),
    path('', include('predictor.urls')),
]

