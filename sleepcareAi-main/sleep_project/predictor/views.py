import datetime
import json
import logging
import re
from pathlib import Path

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import PasswordResetForm
from django.http import FileResponse, HttpResponse, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from .forms import SleepAssessmentForm, SleepDisorderForm, SleepQualityForm
from .ml_utils import ModelLoadError, predict_sleep_disorder, predict_sleep_quality
from .models import (
    PRIVACY_POLICY_VERSION,
    DailySleepRecord,
    SleepAnalysis,
    SleepAssessment,
    SleepDisorderPrediction,
    SleepGoal,
    SleepQualityPrediction,
    UserConsent,
)
from .pdf_generator import generate_sleep_analysis_pdf
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Traditional Django Views
# ---------------------------------------------------------------------------

def home(request):
    return render(request, 'home.html')


def about(request):
    return render(request, 'about.html')


def sleep_quality_view(request):
    result = None
    model_error = None

    if request.method == 'POST':
        form = SleepQualityForm(request.POST)
        if form.is_valid():
            try:
                result = predict_sleep_quality(form.cleaned_data)
            except ModelLoadError as exc:
                logger.error('Sleep quality model error: %s', exc)
                model_error = str(exc)
            except Exception:
                logger.exception('Unexpected error during sleep quality prediction')
                model_error = (
                    'Something went wrong while generating the prediction. '
                    'Please check your inputs and try again.'
                )
    else:
        form = SleepQualityForm()

    return render(request, 'sleep_quality.html', {
        'form': form,
        'result': result,
        'model_error': model_error,
    })


def sleep_disorder_view(request):
    result = None
    model_error = None

    if request.method == 'POST':
        form = SleepDisorderForm(request.POST)
        if form.is_valid():
            try:
                result = predict_sleep_disorder(form.cleaned_data)
            except ModelLoadError as exc:
                logger.error('Sleep disorder model error: %s', exc)
                model_error = str(exc)
            except Exception:
                logger.exception('Unexpected error during sleep disorder prediction')
                model_error = (
                    'Something went wrong while generating the prediction. '
                    'Please check your inputs and try again.'
                )
    else:
        form = SleepDisorderForm()

    return render(request, 'sleep_disorder.html', {
        'form': form,
        'result': result,
        'model_error': model_error,
    })


@ensure_csrf_cookie
def react_prediction_view(request):
    """Serves the React Vite SPA for frontend routes when built."""
    dist_index = Path(__file__).resolve().parent.parent.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            response = HttpResponse(f.read(), content_type='text/html')
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response
    return HttpResponseRedirect('http://localhost:5173' + request.path)


# ---------------------------------------------------------------------------
# Authentication APIs (Django Session & Built-in Auth)
# ---------------------------------------------------------------------------

@ensure_csrf_cookie
def api_csrf(request):
    """
    Returns the CSRF token and sets the csrftoken cookie.
    React calls this on initial load to establish CSRF protection.
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})


def api_login(request):
    """
    POST /api/auth/login/
    Authenticates username + password using Django's built-in auth system.
    Establishes a Django session cookie.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    serializer = LoginSerializer(data=data)
    if not serializer.is_valid():
        return JsonResponse({
            "authenticated": False,
            "error": "Invalid username or password."
        }, status=400)

    username = serializer.validated_data.get('username')
    password = serializer.validated_data.get('password')

    user = authenticate(request, username=username, password=password)
    if user is not None:
        if not user.is_active:
            return JsonResponse({
                "authenticated": False,
                "error": "This account is inactive."
            }, status=403)

        login(request, user)
        token = get_token(request)
        return JsonResponse({
            "authenticated": True,
            "csrfToken": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }, status=200)

    return JsonResponse({
        "authenticated": False,
        "error": "Invalid username or password."
    }, status=400)


def api_register(request):
    """
    POST /api/auth/register/
    Registers a new user and automatically logs them into a Django session.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    serializer = RegisterSerializer(data=data)
    if not serializer.is_valid():
        first_error = "Registration failed."
        for field, errors in serializer.errors.items():
            if isinstance(errors, list) and len(errors) > 0:
                first_error = errors[0]
                break
            elif isinstance(errors, str):
                first_error = errors
                break

        return JsonResponse({
            "authenticated": False,
            "error": first_error,
            "errors": serializer.errors
        }, status=400)

    # Extract privacy_consent before saving (serializer.create() pops it)
    privacy_consent_accepted = serializer.validated_data.get('privacy_consent', False)

    user = serializer.save()

    # Record consent server-side — independent of frontend checkbox state
    from django.utils import timezone as tz
    UserConsent.objects.create(
        user=user,
        privacy_consent=privacy_consent_accepted,
        privacy_consent_at=tz.now() if privacy_consent_accepted else None,
        privacy_consent_version=PRIVACY_POLICY_VERSION,
    )

    login(request, user)
    token = get_token(request)

    return JsonResponse({
        "authenticated": True,
        "csrfToken": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }, status=201)


def api_me(request):
    """
    GET /api/auth/me/
    Returns the current authenticated user from Django session, or authenticated=false.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if request.user.is_authenticated:
        return JsonResponse({
            "authenticated": True,
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email
            }
        }, status=200)

    return JsonResponse({
        "authenticated": False
    }, status=200)


def api_logout(request):
    """
    POST /api/auth/logout/
    Flushes the Django session and signs out the user.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    logout(request)
    return JsonResponse({
        "authenticated": False,
        "message": "Logged out successfully."
    }, status=200)


def api_password_reset(request):
    """
    POST /api/auth/password-reset/
    Triggers Django's built-in password reset workflow for the provided email.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    email = data.get("email", "").strip()
    if not email:
        return JsonResponse({"error": "Please provide an email address."}, status=400)

    form = PasswordResetForm({'email': email})
    if form.is_valid():
        try:
            form.save(
                request=request,
                use_https=request.is_secure(),
                subject_template_name='registration/password_reset_subject.txt',
                email_template_name='registration/password_reset_email.html',
            )
        except Exception as exc:
            logger.info("Password reset email dispatch handled: %s", exc)

    return JsonResponse({
        "success": True,
        "message": "If an account exists with that email address, password reset instructions have been sent."
    }, status=200)


# ---------------------------------------------------------------------------
# Prediction APIs (Protected by Django Authentication)
# ---------------------------------------------------------------------------

def generate_explainability_report(cleaned_data, quality_result, disorder_result):
    """
    Generates structured Explainable AI (XAI) insights and feature attribution
    factors for the given health inputs and model prediction outcomes.
    """
    sleep_duration = float(cleaned_data.get('sleep_duration', 7.0))
    stress_level = int(cleaned_data.get('stress_level', 5))
    activity_level = int(cleaned_data.get('physical_activity_level', 40))
    bmi_category = cleaned_data.get('bmi_category', 'Normal')
    systolic = int(cleaned_data.get('systolic_bp', 120))
    diastolic = int(cleaned_data.get('diastolic_bp', 80))
    heart_rate = int(cleaned_data.get('heart_rate', 70))

    factors = []
    positive_contributors = []
    risk_factors = []

    # 1. Sleep Duration Attribution
    if 7.0 <= sleep_duration <= 9.0:
        msg = f"Optimal duration ({sleep_duration}h) strongly enhances deep slow-wave sleep and supports restorative recovery."
        factors.append({"feature": "Sleep Duration", "value": f"{sleep_duration} hrs", "impact": "positive", "detail": msg})
        positive_contributors.append("Optimal sleep duration (7–9 hours)")
    elif sleep_duration < 6.0:
        msg = f"Restricted sleep duration ({sleep_duration}h) heavily penalizes sleep quality and correlates with chronic fatigue."
        factors.append({"feature": "Sleep Duration", "value": f"{sleep_duration} hrs", "impact": "negative", "detail": msg})
        risk_factors.append(f"Insufficient sleep duration ({sleep_duration} hrs)")
    else:
        factors.append({"feature": "Sleep Duration", "value": f"{sleep_duration} hrs", "impact": "neutral", "detail": f"Sleep duration of {sleep_duration} hrs slightly exceeds typical reference baselines."})

    # 2. Stress Level Attribution
    if stress_level >= 7:
        msg = f"Elevated stress ({stress_level}/10) stimulates cortical hyperarousal, elevating insomnia probability and disrupting REM stability."
        factors.append({"feature": "Stress Level", "value": f"{stress_level} / 10", "impact": "negative", "detail": msg})
        risk_factors.append(f"High stress index ({stress_level}/10)")
    elif stress_level <= 4:
        msg = f"Low stress level ({stress_level}/10) facilitates smooth sleep onset and lowers nighttime awakenings."
        factors.append({"feature": "Stress Level", "value": f"{stress_level} / 10", "impact": "positive", "detail": msg})
        positive_contributors.append("Low stress index (≤ 4/10)")
    else:
        factors.append({"feature": "Stress Level", "value": f"{stress_level} / 10", "impact": "neutral", "detail": f"Moderate stress ({stress_level}/10)."})

    # 3. Physical Activity Attribution
    if activity_level >= 45:
        msg = f"Substantial physical activity ({activity_level} min/day) drives deeper slow-wave sleep and improves cardiovascular efficiency."
        factors.append({"feature": "Physical Activity", "value": f"{activity_level} min/day", "impact": "positive", "detail": msg})
        positive_contributors.append(f"High physical activity ({activity_level} min/day)")
    elif activity_level < 20:
        msg = f"Low physical activity ({activity_level} min/day) reduces natural daytime adenosine buildup, delaying sleep drive."
        factors.append({"feature": "Physical Activity", "value": f"{activity_level} min/day", "impact": "negative", "detail": msg})
        risk_factors.append("Low daily physical activity (< 20 min/day)")

    # 4. BMI Category Attribution
    if bmi_category in ['Overweight', 'Obese']:
        msg = f"{bmi_category} weight status significantly increases pharyngeal collapsibility, elevating sleep apnea risk."
        factors.append({"feature": "BMI Category", "value": bmi_category, "impact": "negative", "detail": msg})
        risk_factors.append(f"{bmi_category} weight category (elevates airway collapse risk)")
    else:
        msg = "Normal BMI profile minimizes airway restriction and supports healthy nocturnal ventilation."
        factors.append({"feature": "BMI Category", "value": bmi_category, "impact": "positive", "detail": msg})
        positive_contributors.append("Healthy BMI category")

    # 5. Blood Pressure Attribution
    if systolic >= 135 or diastolic >= 85:
        msg = f"Elevated blood pressure ({systolic}/{diastolic} mmHg) reflects sympathetic overactivation during rest."
        factors.append({"feature": "Blood Pressure", "value": f"{systolic}/{diastolic} mmHg", "impact": "negative", "detail": msg})
        risk_factors.append(f"Elevated blood pressure ({systolic}/{diastolic} mmHg)")
    else:
        factors.append({"feature": "Blood Pressure", "value": f"{systolic}/{diastolic} mmHg", "impact": "positive", "detail": "Normotensive cardiovascular profile."})

    return {
        "factors": factors,
        "positive_contributors": positive_contributors,
        "risk_factors": risk_factors,
        "confidence": disorder_result.get("confidence"),
        "calibration_note": disorder_result.get("calibration_note", ""),
        "predicted_disorder": disorder_result.get("label"),
        "predicted_quality": quality_result.get("score"),
    }


def api_predict_sleep_quality(request):
    """
    POST /api/predict/sleep-quality/
    Requires authenticated Django session.
    Runs ML predictions and saves a SleepAnalysis associated with request.user
    and the corresponding SleepAssessment (if assessment_id provided).
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Authentication required. Please sign in to predict sleep quality."
        }, status=401)

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    form = SleepQualityForm(data)
    if not form.is_valid():
        return JsonResponse({
            "error": "Validation failed",
            "field_errors": form.errors
        }, status=400)

    try:
        # Run both quality and disorder models on the 11 clinical features
        quality_res = predict_sleep_quality(form.cleaned_data)
        disorder_res = predict_sleep_disorder(form.cleaned_data)

        # Generate Explainable AI report
        xai_info = generate_explainability_report(form.cleaned_data, quality_res, disorder_res)

        # Check for assessment ownership
        assessment_id = data.get('assessment_id')
        assessment = None
        if assessment_id:
            try:
                assessment = SleepAssessment.objects.get(id=assessment_id, user=request.user)
            except (SleepAssessment.DoesNotExist, ValueError):
                assessment = None

        score_val = quality_res.get('score') if quality_res.get('score') is not None else quality_res.get('predicted_quality')
        label_val = quality_res.get('label') or quality_res.get('quality_label', '')
        activity_val = form.cleaned_data.get('physical_activity_level') or form.cleaned_data.get('physical_activity')

        # Backward compatibility records
        SleepQualityPrediction.objects.create(
            user=request.user,
            gender=form.cleaned_data.get('gender', ''),
            age=form.cleaned_data.get('age'),
            occupation=form.cleaned_data.get('occupation', ''),
            sleep_duration=form.cleaned_data.get('sleep_duration'),
            physical_activity=activity_val,
            stress_level=form.cleaned_data.get('stress_level'),
            daily_steps=form.cleaned_data.get('daily_steps'),
            bmi_category=form.cleaned_data.get('bmi_category', ''),
            heart_rate=form.cleaned_data.get('heart_rate'),
            systolic_bp=form.cleaned_data.get('systolic_bp'),
            predicted_quality=score_val,
            quality_label=label_val,
        )

        disorder_raw = disorder_res.get('label') or disorder_res.get('predicted_disorder', '')
        disorder_display = "No Sleep Disorder" if disorder_raw == 'None' else (disorder_raw or "No Sleep Disorder")

        # Create unified SleepAnalysis associated with user and assessment
        analysis = SleepAnalysis.objects.create(
            user=request.user,
            assessment=assessment,
            sleep_quality_score=score_val,
            sleep_quality_label=label_val,
            sleep_disorder_result=disorder_display,
            model_probabilities=disorder_res.get('class_probabilities', []),
            explainable_ai=xai_info,
            input_data=form.cleaned_data,
        )

        response_payload = {
            **quality_res,
            "analysis_id": analysis.id,
            "assessment_id": assessment.id if assessment else None,
            "disorder": disorder_res,
            "explainable_ai": xai_info,
        }

        return JsonResponse(response_payload, status=200)
    except ModelLoadError as exc:
        logger.error("Sleep quality model load error: %s", exc)
        return JsonResponse({"error": str(exc)}, status=500)
    except Exception:
        logger.exception("Unexpected error in api_predict_sleep_quality")
        return JsonResponse({
            "error": "Something went wrong while generating the prediction. Please try again."
        }, status=500)


def api_predict_sleep_disorder(request):
    """
    POST /api/predict/sleep-disorder/
    Requires authenticated Django session.
    Runs ML predictions and saves a SleepAnalysis associated with request.user
    and the corresponding SleepAssessment (if assessment_id provided).
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse({
            "error": "Authentication required. Please sign in to analyze sleep disorder risk."
        }, status=401)

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    form = SleepDisorderForm(data)
    if not form.is_valid():
        return JsonResponse({
            "error": "Validation failed",
            "field_errors": form.errors
        }, status=400)

    try:
        # Run both quality and disorder models
        quality_res = predict_sleep_quality(form.cleaned_data)
        disorder_res = predict_sleep_disorder(form.cleaned_data)

        # Generate Explainable AI report
        xai_info = generate_explainability_report(form.cleaned_data, quality_res, disorder_res)

        # Check for assessment ownership
        assessment_id = data.get('assessment_id')
        assessment = None
        if assessment_id:
            try:
                assessment = SleepAssessment.objects.get(id=assessment_id, user=request.user)
            except (SleepAssessment.DoesNotExist, ValueError):
                assessment = None

        disorder_raw = disorder_res.get('label') or disorder_res.get('predicted_disorder', '')
        disorder_display = "No Sleep Disorder" if disorder_raw == 'None' else (disorder_raw or "No Sleep Disorder")

        if 'class_probabilities' in disorder_res and isinstance(disorder_res['class_probabilities'], list):
            prob_dict = {item['label']: item['probability'] for item in disorder_res['class_probabilities'] if 'label' in item and 'probability' in item}
        else:
            prob_dict = disorder_res.get('probabilities', {})
        activity_val = form.cleaned_data.get('physical_activity_level') or form.cleaned_data.get('physical_activity')

        # Backward compatibility record
        SleepDisorderPrediction.objects.create(
            user=request.user,
            gender=form.cleaned_data.get('gender', ''),
            age=form.cleaned_data.get('age'),
            occupation=form.cleaned_data.get('occupation', ''),
            sleep_duration=form.cleaned_data.get('sleep_duration'),
            physical_activity=activity_val,
            stress_level=form.cleaned_data.get('stress_level'),
            daily_steps=form.cleaned_data.get('daily_steps'),
            bmi_category=form.cleaned_data.get('bmi_category', ''),
            heart_rate=form.cleaned_data.get('heart_rate'),
            systolic_bp=form.cleaned_data.get('systolic_bp'),
            diastolic_bp=form.cleaned_data.get('diastolic_bp'),
            predicted_disorder=disorder_raw,
            probabilities=prob_dict,
        )

        score_val = quality_res.get('score') if quality_res.get('score') is not None else quality_res.get('predicted_quality')
        label_val = quality_res.get('label') or quality_res.get('quality_label', '')

        # Create unified SleepAnalysis
        analysis = SleepAnalysis.objects.create(
            user=request.user,
            assessment=assessment,
            sleep_quality_score=score_val,
            sleep_quality_label=label_val,
            sleep_disorder_result=disorder_display,
            model_probabilities=disorder_res.get('class_probabilities', []),
            explainable_ai=xai_info,
            input_data=form.cleaned_data,
        )

        response_payload = {
            **disorder_res,
            "analysis_id": analysis.id,
            "assessment_id": assessment.id if assessment else None,
            "quality": quality_res,
            "explainable_ai": xai_info,
        }

        return JsonResponse(response_payload, status=200)
    except ModelLoadError as exc:
        logger.error("Sleep disorder model load error: %s", exc)
        return JsonResponse({"error": str(exc)}, status=500)
    except Exception:
        logger.exception("Unexpected error in api_predict_sleep_disorder")
        return JsonResponse({
            "error": "Something went wrong while generating the prediction. Please try again."
        }, status=500)


def api_user_history(request):
    """
    GET /api/history/
    Retrieves prediction and assessment analysis history for the authenticated user only.

    DELETE /api/history/
    Deletes an individual history item (by type and id) or all records (type='all') for the user.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    user = request.user

    if request.method in ('DELETE', 'POST') and (request.method == 'DELETE' or request.path.endswith('/delete/')):
        try:
            body = json.loads(request.body.decode('utf-8')) if request.body else {}
        except Exception:
            body = {}

        item_type = body.get('type') or request.GET.get('type')
        item_id = body.get('id') or request.GET.get('id')

        if item_type == 'all':
            user.sleep_analyses.all().delete()
            user.sleep_assessments.all().delete()
            user.quality_predictions.all().delete()
            user.disorder_predictions.all().delete()
            return JsonResponse({
                "success": True,
                "message": "All past analysis history cleared successfully.",
            }, status=200)

        if not item_id:
            return JsonResponse({"error": "Missing item ID for deletion."}, status=400)

        try:
            item_id = int(item_id)
        except (ValueError, TypeError):
            return JsonResponse({"error": "Invalid item ID format."}, status=400)

        if item_type in ('assessment', 'analysis'):
            analysis = user.sleep_analyses.filter(id=item_id).first()
            if analysis:
                assessment = analysis.assessment
                analysis.delete()
                if assessment and not assessment.analyses.exists():
                    assessment.delete()
                return JsonResponse({"success": True, "message": "Analysis deleted successfully.", "deleted_id": item_id}, status=200)

            assessment = user.sleep_assessments.filter(id=item_id).first()
            if assessment:
                assessment.delete()
                return JsonResponse({"success": True, "message": "Assessment deleted successfully.", "deleted_id": item_id}, status=200)

            return JsonResponse({"error": "Analysis not found."}, status=404)

        elif item_type == 'quality':
            count, _ = user.quality_predictions.filter(id=item_id).delete()
            if count:
                return JsonResponse({"success": True, "message": "Sleep quality record deleted successfully.", "deleted_id": item_id}, status=200)
            return JsonResponse({"error": "Record not found."}, status=404)

        elif item_type == 'disorder':
            count, _ = user.disorder_predictions.filter(id=item_id).delete()
            if count:
                return JsonResponse({"success": True, "message": "Sleep disorder record deleted successfully.", "deleted_id": item_id}, status=200)
            return JsonResponse({"error": "Record not found."}, status=404)

        return JsonResponse({"error": f"Unknown record type: '{item_type}'."}, status=400)

    analyses_records = [
        {
            "id": a.id,
            "assessment_id": a.assessment_id,
            "title": f"Sleep Assessment #{a.assessment_id}" if a.assessment_id else "Sleep Assessment",
            "date": a.prediction_date.strftime('%B %d, %Y'),
            "created_at": a.prediction_date.isoformat(),
            "sleep_quality": f"{round(a.sleep_quality_score, 1)} / 10" if a.sleep_quality_score is not None else "—",
            "sleep_quality_label": a.sleep_quality_label,
            "sleep_disorder": a.sleep_disorder_result or "No Sleep Disorder",
            "probabilities": a.model_probabilities,
            "explainable_ai": a.explainable_ai,
            "sleep_duration": a.input_data.get('sleep_duration') if a.input_data else None,
            "stress_level": a.input_data.get('stress_level') if a.input_data else None,
        }
        for a in user.sleep_analyses.all()[:30]
    ]

    quality_records = [
        {
            "id": p.id,
            "created_at": p.created_at.isoformat(),
            "predicted_quality": p.predicted_quality,
            "quality_label": p.quality_label,
            "sleep_duration": p.sleep_duration,
            "stress_level": p.stress_level,
        }
        for p in user.quality_predictions.all()[:20]
    ]

    disorder_records = [
        {
            "id": p.id,
            "created_at": p.created_at.isoformat(),
            "predicted_disorder": p.predicted_disorder,
            "probabilities": p.probabilities,
            "sleep_duration": p.sleep_duration,
            "stress_level": p.stress_level,
        }
        for p in user.disorder_predictions.all()[:20]
    ]

    return JsonResponse({
        "analyses": analyses_records,
        "quality_history": quality_records,
        "disorder_history": disorder_records,
    }, status=200)


def api_dashboard(request):
    """
    GET /api/dashboard/
    Retrieves aggregated dashboard data for the authenticated user.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    user = request.user
    analyses_qs = user.sleep_analyses.all().order_by('-prediction_date')
    quality_qs = user.quality_predictions.all().order_by('-created_at')
    disorder_qs = user.disorder_predictions.all().order_by('-created_at')

    total_analyses = analyses_qs.count() + quality_qs.count() + disorder_qs.count()

    if total_analyses == 0:
        return JsonResponse({
            "user": {
                "username": user.username,
                "first_name": user.first_name,
                "email": user.email,
            },
            "stats": None,
            "latest_analysis": None,
            "recent_analyses": [],
            "sleep_quality_trend": [],
            "insights": [],
        }, status=200)

    # 1. Stats calculation
    durations = []
    stresses = []

    for a in analyses_qs:
        if a.input_data and a.input_data.get('sleep_duration') is not None:
            durations.append(float(a.input_data['sleep_duration']))
        if a.input_data and a.input_data.get('stress_level') is not None:
            stresses.append(int(a.input_data['stress_level']))

    for q in quality_qs:
        if q.sleep_duration is not None:
            durations.append(q.sleep_duration)
        if q.stress_level is not None:
            stresses.append(q.stress_level)

    for d in disorder_qs:
        if d.sleep_duration is not None:
            durations.append(d.sleep_duration)
        if d.stress_level is not None:
            stresses.append(d.stress_level)

    avg_duration = round(sum(durations) / len(durations), 1) if durations else None
    avg_stress = round(sum(stresses) / len(stresses), 1) if stresses else None

    # Latest sleep score
    latest_sleep_score = None
    latest_quality_label = None

    latest_a = analyses_qs.first()
    latest_q = quality_qs.first()

    if latest_a and latest_a.sleep_quality_score is not None:
        latest_sleep_score = round(latest_a.sleep_quality_score, 1)
        latest_quality_label = latest_a.sleep_quality_label
    elif latest_q and latest_q.predicted_quality is not None:
        latest_sleep_score = round(latest_q.predicted_quality, 1)
        latest_quality_label = latest_q.quality_label

    stats = {
        "latest_sleep_score": latest_sleep_score,
        "latest_quality_label": latest_quality_label,
        "average_sleep_duration": avg_duration,
        "average_stress": avg_stress,
        "total_analyses": total_analyses,
    }

    # 2. Latest analysis (determine most recent)
    latest_analysis = None
    if latest_a and (not latest_q or latest_a.prediction_date >= latest_q.created_at):
        score_display = f"{round(latest_a.sleep_quality_score, 1)} / 10" if latest_a.sleep_quality_score is not None else "—"
        disorder_display = latest_a.sleep_disorder_result or "No Sleep Disorder"
        title = f"Sleep Assessment #{latest_a.assessment_id}" if latest_a.assessment_id else "Sleep Assessment"
        latest_analysis = {
            "id": latest_a.id,
            "type": "assessment",
            "title": title,
            "date": latest_a.prediction_date.strftime('%B %d, %Y'),
            "created_at": latest_a.prediction_date.isoformat(),
            "score": round(latest_a.sleep_quality_score, 1) if latest_a.sleep_quality_score is not None else None,
            "label": latest_a.sleep_quality_label or "Good",
            "sleep_quality": score_display,
            "sleep_disorder": disorder_display,
            "probabilities": latest_a.model_probabilities,
            "explainable_ai": latest_a.explainable_ai,
            "assessment_id": latest_a.assessment_id,
            "sleep_duration": latest_a.input_data.get('sleep_duration') if latest_a.input_data else None,
            "stress_level": latest_a.input_data.get('stress_level') if latest_a.input_data else None,
            "physical_activity": latest_a.input_data.get('physical_activity_level') if latest_a.input_data else None,
        }
    else:
        latest_quality = quality_qs.first()
        latest_disorder = disorder_qs.first()
        if latest_quality and latest_disorder:
            if latest_quality.created_at >= latest_disorder.created_at:
                latest_obj = ('quality', latest_quality)
            else:
                latest_obj = ('disorder', latest_disorder)
        elif latest_quality:
            latest_obj = ('quality', latest_quality)
        elif latest_disorder:
            latest_obj = ('disorder', latest_disorder)
        else:
            latest_obj = None

        if latest_obj:
            kind, obj = latest_obj
            if kind == 'quality':
                latest_analysis = {
                    "id": obj.id,
                    "type": "quality",
                    "title": "Sleep Quality",
                    "score": round(obj.predicted_quality, 1) if obj.predicted_quality else None,
                    "label": obj.quality_label or "Good",
                    "created_at": obj.created_at.isoformat(),
                    "sleep_duration": obj.sleep_duration,
                    "stress_level": obj.stress_level,
                    "physical_activity": obj.physical_activity,
                }
            else:
                latest_analysis = {
                    "id": obj.id,
                    "type": "disorder",
                    "title": "Sleep Disorder",
                    "result": obj.predicted_disorder or "No Disorder",
                    "probabilities": obj.probabilities or {},
                    "created_at": obj.created_at.isoformat(),
                    "sleep_duration": obj.sleep_duration,
                    "stress_level": obj.stress_level,
                    "physical_activity": obj.physical_activity,
                }

    # 3. Recent analyses
    combined = []
    for a in analyses_qs[:10]:
        score_display = f"{round(a.sleep_quality_score, 1)} / 10" if a.sleep_quality_score is not None else "—"
        disorder_display = a.sleep_disorder_result or "No Sleep Disorder"
        title = f"Sleep Assessment #{a.assessment_id}" if a.assessment_id else "Sleep Assessment"
        combined.append({
            "id": f"a_{a.id}",
            "analysis_id": a.id,
            "type": "assessment",
            "type_label": title,
            "icon": "shield-check",
            "title": title,
            "date": a.prediction_date.strftime('%B %d, %Y'),
            "raw_date": a.prediction_date,
            "score": a.sleep_quality_score,
            "sleep_quality": score_display,
            "sleep_quality_label": a.sleep_quality_label,
            "sleep_disorder": disorder_display,
            "probabilities": a.model_probabilities,
            "explainable_ai": a.explainable_ai,
            "assessment_id": a.assessment_id,
            "duration": a.input_data.get('sleep_duration') if a.input_data else None,
            "stress": a.input_data.get('stress_level') if a.input_data else None,
            "result": f"Quality: {score_display} · Disorder: {disorder_display}",
        })

    for q in quality_qs[:10]:
        combined.append({
            "id": f"q_{q.id}",
            "type": "quality",
            "type_label": "Sleep Quality",
            "icon": "moon",
            "result": f"{q.quality_label} · {round(q.predicted_quality, 1)}/10" if q.predicted_quality else (q.quality_label or "Estimated"),
            "created_at": q.created_at.isoformat(),
            "date": q.created_at.strftime('%B %d, %Y'),
            "raw_date": q.created_at,
            "score": q.predicted_quality,
            "duration": q.sleep_duration,
            "sleep_quality": f"{round(q.predicted_quality, 1)} / 10" if q.predicted_quality else None,
            "sleep_disorder": None,
        })

    for d in disorder_qs[:10]:
        top_prob = ""
        if isinstance(d.probabilities, dict) and d.probabilities:
            try:
                max_p = max(d.probabilities.values())
                val = float(max_p)
                pct = val if val > 1.0 else val * 100.0
                top_prob = f" · {pct:.2f}%"
            except Exception:
                pass
        combined.append({
            "id": f"d_{d.id}",
            "type": "disorder",
            "type_label": "Sleep Disorder",
            "icon": "brain",
            "result": f"{d.predicted_disorder or 'Assessed'}{top_prob}",
            "created_at": d.created_at.isoformat(),
            "date": d.created_at.strftime('%B %d, %Y'),
            "raw_date": d.created_at,
            "probabilities": d.probabilities,
            "duration": d.sleep_duration,
            "sleep_quality": None,
            "sleep_disorder": d.predicted_disorder or "Assessed",
        })

    combined.sort(key=lambda x: x['raw_date'], reverse=True)
    recent_analyses = []
    for item in combined[:8]:
        item_copy = {k: v for k, v in item.items() if k != 'raw_date'}
        recent_analyses.append(item_copy)

    # 4. Sleep quality trend
    trend_items = []
    for a in analyses_qs[:15]:
        if a.sleep_quality_score is not None:
            trend_items.append({
                "id": f"a_{a.id}",
                "date": a.prediction_date.strftime('%a, %b %d'),
                "short_date": a.prediction_date.strftime('%b %d'),
                "day": a.prediction_date.strftime('%a'),
                "score": round(a.sleep_quality_score, 1),
                "duration": a.input_data.get('sleep_duration') if a.input_data else None,
                "label": a.sleep_quality_label,
                "timestamp": a.prediction_date.isoformat(),
                "raw_date": a.prediction_date,
            })

    for q in quality_qs[:15]:
        if q.predicted_quality is not None:
            trend_items.append({
                "id": f"q_{q.id}",
                "date": q.created_at.strftime('%a, %b %d'),
                "short_date": q.created_at.strftime('%b %d'),
                "day": q.created_at.strftime('%a'),
                "score": round(q.predicted_quality, 1),
                "duration": q.sleep_duration,
                "label": q.quality_label,
                "timestamp": q.created_at.isoformat(),
                "raw_date": q.created_at,
            })

    trend_items.sort(key=lambda x: x['raw_date'])
    sleep_quality_trend = [{k: v for k, v in t.items() if k != 'raw_date'} for t in trend_items[-15:]]

    # 5. AI Sleep Insights (respecting non-medical language requirements)
    insights = []
    if len(durations) >= 2:
        recent_dur = durations[0]
        prev_dur = durations[1]
        diff = recent_dur - prev_dur
        if abs(diff) < 0.5:
            insights.append({
                "id": "insight-duration",
                "category": "Sleep Duration",
                "icon": "moon",
                "title": "Sleep Duration Consistency",
                "description": "Your recent sleep duration has remained relatively consistent across latest model inputs.",
                "highlight": f"{round(recent_dur, 1)} hrs recorded",
            })
        elif diff > 0:
            insights.append({
                "id": "insight-duration",
                "category": "Sleep Duration",
                "icon": "moon",
                "title": "Upward Duration Pattern",
                "description": "A pattern in your data indicates an increase in recorded sleep duration in recent entries.",
                "highlight": f"+{round(diff, 1)} hrs from previous",
            })
        else:
            insights.append({
                "id": "insight-duration",
                "category": "Sleep Duration",
                "icon": "moon",
                "title": "Duration Variance",
                "description": "The model observed lower sleep duration in your latest entry compared with earlier inputs.",
                "highlight": f"{round(diff, 1)} hrs from previous",
            })

    if len(stresses) >= 2 and avg_stress is not None:
        latest_stress = stresses[0]
        if latest_stress <= 4:
            insights.append({
                "id": "insight-stress",
                "category": "Stress Pattern",
                "icon": "brain",
                "title": "Low Stress Profile",
                "description": "Lower recorded stress levels in your data are model-associated with more favorable quality score estimates.",
                "highlight": f"{latest_stress}/10 stress level",
            })
        else:
            insights.append({
                "id": "insight-stress",
                "category": "Stress Pattern",
                "icon": "brain",
                "title": "Stress Elevation Pattern",
                "description": "Your recent stress measurements may be associated with changes in model-estimated sleep quality.",
                "highlight": f"{latest_stress}/10 stress level",
            })

    if len(sleep_quality_trend) >= 2:
        last_score = sleep_quality_trend[-1]['score']
        first_score = sleep_quality_trend[0]['score']
        delta = round(last_score - first_score, 1)
        if delta >= 0.5:
            insights.append({
                "id": "insight-trend",
                "category": "Sleep Trend",
                "icon": "trending-up",
                "title": "Positive Quality Trajectory",
                "description": "Your latest sleep-quality estimates show an upward trajectory across recent evaluation points.",
                "highlight": f"+{delta} pts trend",
            })
        elif delta <= -0.5:
            insights.append({
                "id": "insight-trend",
                "category": "Sleep Trend",
                "icon": "trending-up",
                "title": "Fluctuating Quality Pattern",
                "description": "Your latest sleep-quality estimates show variation compared with earlier analyses in your history.",
                "highlight": f"{delta} pts change",
            })
        else:
            insights.append({
                "id": "insight-trend",
                "category": "Sleep Trend",
                "icon": "trending-up",
                "title": "Steady Quality Stability",
                "description": "The model observed consistent quality scores across your recorded evaluations.",
                "highlight": "Stable trend",
            })

    if not insights and total_analyses > 0:
        insights.append({
            "id": "insight-baseline",
            "category": "Baseline",
            "icon": "sparkles",
            "title": "Baseline Recorded",
            "description": "The model has established your initial baseline. Additional analyses will unlock longitudinal pattern insights.",
            "highlight": "1 analysis logged",
        })

    return JsonResponse({
        "user": {
            "username": user.username,
            "first_name": user.first_name,
            "email": user.email,
        },
        "stats": stats,
        "latest_analysis": latest_analysis,
        "recent_analyses": recent_analyses,
        "sleep_quality_trend": sleep_quality_trend,
        "insights": insights,
    }, status=200)


# ---------------------------------------------------------------------------
# Chatbot Assessment API
# ---------------------------------------------------------------------------

def api_save_assessment(request):
    """
    POST /api/assessments/
    Saves a chatbot sleep assessment for the currently authenticated user.

    The user identity is ALWAYS taken from request.user — never from the
    request body. The client must be authenticated via Django session.

    Request body (JSON):
        age                        int       (5–110)
        gender                     str       ('Male' | 'Female' | 'Other' | 'Prefer not to say')
        occupation                 str       (free text, max 100 chars)
        difficulty_falling_asleep  str       ('yes' | 'no')
        frequent_night_awakenings  str       ('yes' | 'no')
        early_morning_awakening    str       ('yes' | 'no')
        daytime_sleepiness         str       ('yes' | 'no')
        loud_snoring               str       ('yes' | 'no')
        gasping_or_choking         str       ('yes' | 'no')
        dry_mouth_or_sore_throat   str       ('yes' | 'no')
        morning_headache           str       ('yes' | 'no')
        unrefreshing_sleep         str       ('yes' | 'no')
        sleep_duration             str       (one of the five duration bands)

    Response (200):
        { "success": true, "id": <int> }
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse(
            {'error': 'Authentication required. Please sign in to save your assessment.'},
            status=401,
        )

    try:
        data = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON payload'}, status=400)

    form = SleepAssessmentForm(data)
    if not form.is_valid():
        return JsonResponse(
            {'error': 'Validation failed', 'field_errors': form.errors},
            status=400,
        )

    try:
        cd = form.cleaned_data
        analysis_id = cd.get('analysis_id') or data.get('analysis_id')
        analysis = None
        if analysis_id:
            try:
                analysis = SleepAnalysis.objects.filter(id=analysis_id, user=request.user).first()
            except (ValueError, TypeError):
                analysis = None

        # Resolve demographics from analysis input_data or provided form or safe defaults
        input_data = analysis.input_data if (analysis and analysis.input_data) else {}
        age = cd.get('age') or input_data.get('age') or 30
        gender = cd.get('gender') or input_data.get('gender') or 'Other'
        occupation = cd.get('occupation') or input_data.get('occupation') or 'Unspecified'
        dur_raw = cd.get('sleep_duration') or input_data.get('sleep_duration') or '7–9 hours'
        try:
            dur_float = float(dur_raw)
            if dur_float < 5:
                sleep_duration = 'Less than 5 hours'
            elif dur_float < 6:
                sleep_duration = '5–6 hours'
            elif dur_float < 7:
                sleep_duration = '6–7 hours'
            elif dur_float <= 9:
                sleep_duration = '7–9 hours'
            else:
                sleep_duration = 'More than 9 hours'
        except (ValueError, TypeError):
            valid_choices = [c[0] for c in SleepAssessment.SLEEP_HOURS_CHOICES]
            sleep_duration = str(dur_raw) if str(dur_raw) in valid_choices else '7–9 hours'

        # If analysis already has an assessment, update it; otherwise create a new one
        if analysis and analysis.assessment:
            assessment = analysis.assessment
            assessment.difficulty_falling_asleep = cd['difficulty_falling_asleep']
            assessment.frequent_night_awakenings = cd['frequent_night_awakenings']
            assessment.early_morning_awakening   = cd['early_morning_awakening']
            assessment.daytime_sleepiness        = cd['daytime_sleepiness']
            assessment.loud_snoring              = cd['loud_snoring']
            assessment.gasping_or_choking        = cd['gasping_or_choking']
            assessment.dry_mouth_or_sore_throat  = cd['dry_mouth_or_sore_throat']
            assessment.morning_headache          = cd['morning_headache']
            assessment.unrefreshing_sleep        = cd['unrefreshing_sleep']
            if age: assessment.age = age
            if gender: assessment.gender = gender
            if occupation: assessment.occupation = occupation
            if sleep_duration: assessment.sleep_duration = sleep_duration
            assessment.save()
        else:
            assessment = SleepAssessment.objects.create(
                user=request.user,          # ← always from session, never the client
                age=age,
                gender=gender,
                occupation=occupation,
                difficulty_falling_asleep=cd['difficulty_falling_asleep'],
                frequent_night_awakenings=cd['frequent_night_awakenings'],
                early_morning_awakening=cd['early_morning_awakening'],
                daytime_sleepiness=cd['daytime_sleepiness'],
                loud_snoring=cd['loud_snoring'],
                gasping_or_choking=cd['gasping_or_choking'],
                dry_mouth_or_sore_throat=cd['dry_mouth_or_sore_throat'],
                morning_headache=cd['morning_headache'],
                unrefreshing_sleep=cd['unrefreshing_sleep'],
                sleep_duration=sleep_duration,
            )
            if analysis:
                analysis.assessment = assessment
                analysis.save(update_fields=['assessment'])

        return JsonResponse({
            'success': True,
            'id': assessment.id,
            'analysis_id': analysis.id if analysis else None,
        }, status=200)

    except Exception:
        logger.exception('Unexpected error in api_save_assessment')
        return JsonResponse(
            {'error': 'Something went wrong while saving your assessment. Please try again.'},
            status=500,
        )


def api_get_assessment(request, assessment_id):
    """
    GET /api/assessments/<id>/
    Returns the saved chatbot assessment for the authenticated user.
    Only the owner of the assessment can retrieve it.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        assessment = SleepAssessment.objects.get(
            id=assessment_id,
            user=request.user,   # ← ownership enforced — no user can read another's
        )
    except SleepAssessment.DoesNotExist:
        return JsonResponse({'error': 'Assessment not found.'}, status=404)

    return JsonResponse({
        'id':                       assessment.id,
        'age':                      assessment.age,
        'gender':                   assessment.gender,
        'occupation':               assessment.occupation,
        'difficulty_falling_asleep': assessment.difficulty_falling_asleep,
        'frequent_night_awakenings': assessment.frequent_night_awakenings,
        'early_morning_awakening':   assessment.early_morning_awakening,
        'daytime_sleepiness':        assessment.daytime_sleepiness,
        'loud_snoring':              assessment.loud_snoring,
        'gasping_or_choking':        assessment.gasping_or_choking,
        'dry_mouth_or_sore_throat':  assessment.dry_mouth_or_sore_throat,
        'morning_headache':          assessment.morning_headache,
        'unrefreshing_sleep':        assessment.unrefreshing_sleep,
        'sleep_duration':            assessment.sleep_duration,
        'created_at':                assessment.created_at.isoformat(),
    }, status=200)


def api_get_analysis(request, analysis_id):
    """
    GET /api/analyses/<id>/
    Retrieves full details of a saved SleepAnalysis for the authenticated user only.

    DELETE /api/analyses/<id>/
    Deletes the saved SleepAnalysis for the authenticated user only.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    try:
        analysis = SleepAnalysis.objects.select_related('assessment').get(
            id=analysis_id,
            user=request.user,
        )
    except SleepAnalysis.DoesNotExist:
        return JsonResponse({"error": "Analysis not found."}, status=404)

    if request.method == 'DELETE' or (request.method == 'POST' and request.path.endswith('/delete/')):
        assessment = analysis.assessment
        analysis.delete()
        if assessment and not assessment.analyses.exists():
            assessment.delete()
        return JsonResponse({
            "success": True,
            "message": "Analysis deleted successfully.",
            "deleted_id": analysis_id,
        }, status=200)

    assessment_data = None
    if analysis.assessment:
        a = analysis.assessment
        assessment_data = {
            "id": a.id,
            "age": a.age,
            "gender": a.gender,
            "occupation": a.occupation,
            "difficulty_falling_asleep": a.difficulty_falling_asleep,
            "frequent_night_awakenings": a.frequent_night_awakenings,
            "early_morning_awakening": a.early_morning_awakening,
            "daytime_sleepiness": a.daytime_sleepiness,
            "loud_snoring": a.loud_snoring,
            "gasping_or_choking": a.gasping_or_choking,
            "dry_mouth_or_sore_throat": a.dry_mouth_or_sore_throat,
            "morning_headache": a.morning_headache,
            "unrefreshing_sleep": a.unrefreshing_sleep,
            "sleep_duration": a.sleep_duration,
            "created_at": a.created_at.isoformat(),
        }

    return JsonResponse({
        "id": analysis.id,
        "title": f"Sleep Assessment #{analysis.assessment.id}" if analysis.assessment else "Sleep Assessment",
        "date": analysis.prediction_date.strftime('%B %d, %Y'),
        "prediction_date": analysis.prediction_date.strftime('%B %d, %Y'),
        "created_at": analysis.prediction_date.isoformat(),
        "sleep_quality_score": round(analysis.sleep_quality_score, 1) if analysis.sleep_quality_score is not None else None,
        "sleep_quality_label": analysis.sleep_quality_label,
        "sleep_disorder_result": analysis.sleep_disorder_result,
        "model_probabilities": analysis.model_probabilities,
        "explainable_ai": analysis.explainable_ai,
        "input_data": analysis.input_data,
        "assessment": assessment_data,
    }, status=200)


def api_assessment_report_pdf(request, assessment_id):
    """
    GET /api/assessments/<id>/report/
    Generates and downloads a vector PDF sleep analysis report for the specified assessment.
    Protected view: user must be authenticated and only access their own assessments/analyses.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    assessment = SleepAssessment.objects.filter(id=assessment_id, user=request.user).first()
    analysis = None

    if assessment:
        analysis = assessment.analyses.first()
    else:
        # Fallback: check if the ID corresponds to a SleepAnalysis
        analysis = SleepAnalysis.objects.filter(id=assessment_id, user=request.user).first()
        if analysis:
            assessment = analysis.assessment
        else:
            return JsonResponse({"error": "Assessment or analysis record not found."}, status=404)

    pdf_buffer = generate_sleep_analysis_pdf(request.user, assessment=assessment, analysis=analysis)
    file_id = assessment.id if assessment else (analysis.id if analysis else assessment_id)
    filename = f"SleepCare_Report_Assessment_{file_id}.pdf"

    return FileResponse(
        pdf_buffer,
        as_attachment=True,
        filename=filename,
        content_type='application/pdf',
    )


def api_analysis_report_pdf(request, analysis_id):
    """
    GET /api/analyses/<id>/report/
    Generates and downloads a vector PDF sleep analysis report for the specified analysis.
    Protected view: user must be authenticated and only access their own analyses.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    try:
        analysis = SleepAnalysis.objects.select_related('assessment').get(id=analysis_id, user=request.user)
    except SleepAnalysis.DoesNotExist:
        return JsonResponse({"error": "Analysis not found."}, status=404)

    assessment = analysis.assessment
    pdf_buffer = generate_sleep_analysis_pdf(request.user, assessment=assessment, analysis=analysis)
    filename = f"SleepCare_Report_Analysis_{analysis.id}.pdf"

    return FileResponse(
        pdf_buffer,
        as_attachment=True,
        filename=filename,
        content_type='application/pdf',
    )


# ---------------------------------------------------------------------------
# 21-Day Sleep Challenge & Goal API Endpoints
# ---------------------------------------------------------------------------

def calculate_sleep_duration(bedtime_str, wake_time_str):
    """
    Calculates exact sleep duration in minutes between bedtime and wake-up time.
    If wake-up time is earlier than or equal to bedtime, assumes wake-up occurs the next day.
    Returns integer total minutes or None if inputs are invalid.
    """
    if not bedtime_str or not wake_time_str:
        return None

    def _parse(s):
        if not isinstance(s, str):
            return None
        match = re.match(r'^(\d{1,2}):(\d{2})(?::\d{2})?\s*([aApP][mM])?$', s.strip())
        if not match:
            return None
        h = int(match.group(1))
        m = int(match.group(2))
        meridiem = match.group(3).upper() if match.group(3) else None
        if m < 0 or m > 59:
            return None
        if meridiem:
            if h < 1 or h > 12:
                return None
            if meridiem == 'AM':
                h = 0 if h == 12 else h
            elif meridiem == 'PM':
                h = 12 if h == 12 else h + 12
        else:
            if h < 0 or h > 23:
                return None
        return h * 60 + m

    b = _parse(bedtime_str)
    w = _parse(wake_time_str)
    if b is None or w is None:
        return None

    if w <= b:
        return (1440 - b) + w
    else:
        return w - b


def _serialize_sleep_goal(goal):
    """Serializes a SleepGoal instance to JSON-safe dictionary."""
    if not goal:
        return None
    return {
        "id": goal.id,
        "target_sleep_duration": goal.target_sleep_duration,
        "target_bedtime": goal.target_bedtime,
        "target_wake_time": goal.target_wake_time,
        "start_date": goal.start_date.isoformat(),
        "end_date": goal.end_date.isoformat(),
        "status": goal.status,
        "current_day": goal.current_day,
    }


def _serialize_daily_record(record):
    """Serializes a DailySleepRecord instance to JSON-safe dictionary."""
    if not record:
        return None
    return {
        "id": record.id,
        "goal_id": record.goal_id,
        "day_number": record.day_number,
        "date": record.date.isoformat() if hasattr(record.date, 'isoformat') else str(record.date),
        "actual_sleep_duration": record.actual_sleep_duration,
        "bedtime": record.bedtime,
        "wake_time": record.wake_time,
        "goal_achieved": record.goal_achieved,
        "recorded_at": record.recorded_at.isoformat() if record.recorded_at else None,
    }


def _calculate_goal_stats(records, target_sleep_duration):
    """
    Computes real-time streak and progress metrics from records list.
    Streak rule: Count consecutive achieved days ending with the most recent recorded day.
    """
    valid_records = [r for r in records if r.get('actual_sleep_duration') is not None]
    recorded_days_count = len(valid_records)
    achieved_days_count = 0
    missed_days_count = 0

    for r in valid_records:
        is_achieved = r.get('goal_achieved')
        if is_achieved is None:
            is_achieved = (r.get('actual_sleep_duration', 0) >= target_sleep_duration)
        if is_achieved:
            achieved_days_count += 1
        else:
            missed_days_count += 1

    success_rate = round((achieved_days_count / recorded_days_count) * 100) if recorded_days_count > 0 else 0

    current_streak = 0
    sorted_records = sorted(valid_records, key=lambda x: x.get('day_number', 0))
    for r in reversed(sorted_records):
        is_achieved = r.get('goal_achieved')
        if is_achieved is None:
            is_achieved = (r.get('actual_sleep_duration', 0) >= target_sleep_duration)
        if is_achieved:
            current_streak += 1
        else:
            break

    return {
        "recordedDaysCount": recorded_days_count,
        "achievedDaysCount": achieved_days_count,
        "missedDaysCount": missed_days_count,
        "successRate": success_rate,
        "currentStreak": current_streak,
        "totalDays": 21,
    }


def _ensure_21_day_records(user, goal):
    """
    Ensures all 21 DailySleepRecord days exist for the goal.
    """
    existing_days = set(DailySleepRecord.objects.filter(goal=goal, user=user).values_list('day_number', flat=True))
    to_create = []
    for day_num in range(1, 22):
        if day_num not in existing_days:
            day_date = goal.start_date + datetime.timedelta(days=day_num - 1)
            to_create.append(
                DailySleepRecord(
                    user=user,
                    goal=goal,
                    day_number=day_num,
                    date=day_date,
                    actual_sleep_duration=None,
                    bedtime=None,
                    wake_time=None,
                    goal_achieved=None,
                    recorded_at=None,
                )
            )
    if to_create:
        DailySleepRecord.objects.bulk_create(to_create)


def api_get_active_sleep_goal(request):
    """
    GET /api/sleep-goals/active/
    Returns active 21-day sleep goal and records for the logged-in user only.
    Returns goal: null if no active goal exists for this user.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    goal = SleepGoal.objects.filter(user=request.user, status='active').order_by('-created_at').first()
    if not goal:
        return JsonResponse({
            "goal": None,
            "records": [],
            "stats": {
                "recordedDaysCount": 0,
                "achievedDaysCount": 0,
                "missedDaysCount": 0,
                "successRate": 0,
                "currentStreak": 0,
                "totalDays": 21,
            }
        }, status=200)

    _ensure_21_day_records(request.user, goal)
    records_qs = DailySleepRecord.objects.filter(goal=goal, user=request.user).order_by('day_number')
    records = [_serialize_daily_record(r) for r in records_qs]
    stats = _calculate_goal_stats(records, goal.target_sleep_duration)

    return JsonResponse({
        "goal": _serialize_sleep_goal(goal),
        "records": records,
        "stats": stats,
    }, status=200)


def api_create_sleep_goal(request):
    """
    POST /api/sleep-goals/
    Creates a new 21-day sleep goal for the logged-in user.
    Archives any existing active goal for this user.
    Goal type is always 'both' — duration, bedtime, and wake-up time are all evaluated.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    target_bedtime = str(data.get('target_bedtime', '10:30 PM')).strip() or '10:30 PM'
    target_wake_time = str(data.get('target_wake_time', '6:30 AM')).strip() or '6:30 AM'

    # Automatically calculate duration from target_bedtime and target_wake_time
    calc_duration = calculate_sleep_duration(target_bedtime, target_wake_time)
    if calc_duration is not None:
        target_sleep_duration = calc_duration
    else:
        target_sleep_duration = data.get('target_sleep_duration', 480)
        try:
            target_sleep_duration = max(60, min(1440, int(target_sleep_duration)))
        except (TypeError, ValueError):
            target_sleep_duration = 480

    # Archive previous active goals for this user
    SleepGoal.objects.filter(user=request.user, status='active').update(status='archived')

    start_date = timezone.localdate()
    end_date = start_date + datetime.timedelta(days=20)

    goal = SleepGoal.objects.create(
        user=request.user,
        target_sleep_duration=target_sleep_duration,
        target_bedtime=target_bedtime,
        target_wake_time=target_wake_time,
        goal_type='both',  # Always evaluate all dimensions
        start_date=start_date,
        end_date=end_date,
        status='active',
    )

    _ensure_21_day_records(request.user, goal)
    records_qs = DailySleepRecord.objects.filter(goal=goal, user=request.user).order_by('day_number')
    records = [_serialize_daily_record(r) for r in records_qs]
    stats = _calculate_goal_stats(records, goal.target_sleep_duration)

    return JsonResponse({
        "goal": _serialize_sleep_goal(goal),
        "records": records,
        "stats": stats,
    }, status=201)


def api_record_daily_sleep(request, goal_id):
    """
    POST /api/sleep-goals/<goal_id>/daily-record/
    Records or updates daily sleep data for a specific day in the user's active goal.
    Strictly verifies:
    - Goal and record belong to request.user.
    - The day's calendar date must be today or in the past (no future recording).
    - Prevents duplicate records by using get_or_create.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    goal = SleepGoal.objects.filter(id=goal_id, user=request.user).first()
    if not goal:
        return JsonResponse({"error": "Goal not found or does not belong to you."}, status=404)

    try:
        data = json.loads(request.body) if request.body else {}
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    try:
        day_number = int(data.get('day_number', 1))
        if day_number < 1 or day_number > 21:
            return JsonResponse({"error": "day_number must be between 1 and 21."}, status=400)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid day_number."}, status=400)

    # Compute the calendar date for this day
    record_date = goal.start_date + datetime.timedelta(days=day_number - 1)
    today = timezone.localdate()

    # Enforce: cannot record a future day
    if record_date > today:
        return JsonResponse(
            {
                "error": "Cannot record sleep for a future day.",
                "detail": f"Day {day_number} is on {record_date.isoformat()} which has not arrived yet.",
            },
            status=403,
        )

    bedtime = data.get('bedtime')
    wake_time = data.get('wake_time')

    if bedtime:
        bedtime = str(bedtime).strip()
    if wake_time:
        wake_time = str(wake_time).strip()

    # Automatically calculate duration from bedtime and wake_time (do not trust unverified client value)
    calc_duration = calculate_sleep_duration(bedtime, wake_time) if (bedtime and wake_time) else None
    if calc_duration is not None:
        actual_sleep_duration = calc_duration
    else:
        actual_sleep_duration = data.get('actual_sleep_duration')
        if actual_sleep_duration is not None:
            try:
                actual_sleep_duration = max(0, min(1440, int(actual_sleep_duration)))
            except (TypeError, ValueError):
                return JsonResponse({"error": "Invalid actual_sleep_duration."}, status=400)

    record, _ = DailySleepRecord.objects.get_or_create(
        goal=goal,
        day_number=day_number,
        defaults={'user': request.user, 'date': record_date}
    )

    if actual_sleep_duration is not None:
        record.actual_sleep_duration = actual_sleep_duration
        record.goal_achieved = (actual_sleep_duration >= goal.target_sleep_duration)

    if bedtime:
        record.bedtime = bedtime
    if wake_time:
        record.wake_time = wake_time
    record.date = record_date

    record.recorded_at = timezone.now()
    record.save()

    records_qs = DailySleepRecord.objects.filter(goal=goal, user=request.user).order_by('day_number')
    records = [_serialize_daily_record(r) for r in records_qs]
    stats = _calculate_goal_stats(records, goal.target_sleep_duration)

    return JsonResponse({
        "record": _serialize_daily_record(record),
        "records": records,
        "stats": stats,
    }, status=200)


def api_reset_sleep_goal(request):
    """
    POST /api/sleep-goals/reset/
    Archives the current active goal for the logged-in user so they can start fresh.
    """
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required."}, status=401)

    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    SleepGoal.objects.filter(user=request.user, status='active').update(status='archived')

    return JsonResponse({
        "message": "Goal reset successfully.",
        "goal": None,
        "records": [],
        "stats": {
            "recordedDaysCount": 0,
            "achievedDaysCount": 0,
            "missedDaysCount": 0,
            "successRate": 0,
            "currentStreak": 0,
            "totalDays": 21,
        }
    }, status=200)


