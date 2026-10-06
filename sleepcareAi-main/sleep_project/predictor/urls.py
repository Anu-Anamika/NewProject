from django.urls import path
from . import views

app_name = 'predictor'

urlpatterns = [
    # Legacy Django template views (preserved for fallback/reference)
    path('django/', views.home, name='django_home'),
    path('django/sleep-quality/', views.sleep_quality_view, name='django_sleep_quality'),
    path('django/sleep-disorder/', views.sleep_disorder_view, name='django_sleep_disorder'),
    path('django/about/', views.about, name='django_about'),

    # React SPA entry routes (single source of truth with unified Navbar & MainLayout)
    path('', views.react_prediction_view, name='home'),
    path('about/', views.react_prediction_view, name='about'),
    path('contact/', views.react_prediction_view, name='contact'),
    path('login/', views.react_prediction_view, name='react_login'),
    path('register/', views.react_prediction_view, name='react_register'),
    path('forgot-password/', views.react_prediction_view, name='react_forgot_password'),
    path('dashboard/', views.react_prediction_view, name='react_dashboard'),
    path('set-goal/', views.react_prediction_view, name='react_set_goal'),
    path('predict/sleep-quality/', views.react_prediction_view, name='react_sleep_quality'),
    path('predict/sleep-disorder/', views.react_prediction_view, name='react_sleep_disorder'),
    path('history/', views.react_prediction_view, name='react_history'),
    path('history/<path:subpath>/', views.react_prediction_view, name='react_history_nested'),

    # Authentication API endpoints (Django Session & Auth)
    path('api/auth/csrf/', views.api_csrf, name='api_csrf'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/register/', views.api_register, name='api_register'),
    path('api/auth/me/', views.api_me, name='api_me'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/password-reset/', views.api_password_reset, name='api_password_reset'),

    # Prediction API endpoints (Protected)
    path('api/predict/sleep-quality/', views.api_predict_sleep_quality, name='api_sleep_quality'),
    path('api/predict/sleep-disorder/', views.api_predict_sleep_disorder, name='api_sleep_disorder'),
    path('api/history/', views.api_user_history, name='api_user_history'),
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),

    # Chatbot Assessment API (Protected)
    path('api/assessments/', views.api_save_assessment, name='api_save_assessment'),
    path('api/assessments/<int:assessment_id>/', views.api_get_assessment, name='api_get_assessment'),
    path('api/assessments/<int:assessment_id>/report/', views.api_assessment_report_pdf, name='api_assessment_report_pdf'),

    # Analysis Detail, Delete & Report API (Protected)
    path('api/analyses/<int:analysis_id>/', views.api_get_analysis, name='api_get_analysis'),
    path('api/analyses/<int:analysis_id>/delete/', views.api_get_analysis, name='api_delete_analysis'),
    path('api/analyses/<int:analysis_id>/report/', views.api_analysis_report_pdf, name='api_analysis_report_pdf'),
    path('api/history/delete/', views.api_user_history, name='api_history_delete'),

    # 21-Day Sleep Challenge & Goals API (Protected)
    path('api/sleep-goals/active/', views.api_get_active_sleep_goal, name='api_get_active_sleep_goal'),
    path('api/sleep-goals/', views.api_create_sleep_goal, name='api_create_sleep_goal'),
    path('api/sleep-goals/<int:goal_id>/daily-record/', views.api_record_daily_sleep, name='api_record_daily_sleep'),
    path('api/sleep-goals/reset/', views.api_reset_sleep_goal, name='api_reset_sleep_goal'),

    # Prediction SPA routes (Django fallback to React)
    path('prediction/<path:subpath>/', views.react_prediction_view, name='react_prediction_nested'),
]

