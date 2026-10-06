from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


PRIVACY_POLICY_VERSION = "1.0"


class SleepQualityPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quality_predictions')
    created_at = models.DateTimeField(auto_now_add=True)
    gender = models.CharField(max_length=20, blank=True)
    age = models.IntegerField(null=True, blank=True)
    occupation = models.CharField(max_length=50, blank=True)
    sleep_duration = models.FloatField(null=True, blank=True)
    physical_activity = models.FloatField(null=True, blank=True)
    stress_level = models.IntegerField(null=True, blank=True)
    daily_steps = models.IntegerField(null=True, blank=True)
    bmi_category = models.CharField(max_length=30, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    systolic_bp = models.IntegerField(null=True, blank=True)
    predicted_quality = models.FloatField(null=True, blank=True)
    quality_label = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - Quality: {self.predicted_quality} ({self.created_at:%Y-%m-%d %H:%M})"


class SleepDisorderPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disorder_predictions')
    created_at = models.DateTimeField(auto_now_add=True)
    gender = models.CharField(max_length=20, blank=True)
    age = models.IntegerField(null=True, blank=True)
    occupation = models.CharField(max_length=50, blank=True)
    sleep_duration = models.FloatField(null=True, blank=True)
    physical_activity = models.FloatField(null=True, blank=True)
    stress_level = models.IntegerField(null=True, blank=True)
    daily_steps = models.IntegerField(null=True, blank=True)
    bmi_category = models.CharField(max_length=30, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    systolic_bp = models.IntegerField(null=True, blank=True)
    diastolic_bp = models.IntegerField(null=True, blank=True)
    predicted_disorder = models.CharField(max_length=50, blank=True)
    probabilities = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - Disorder: {self.predicted_disorder} ({self.created_at:%Y-%m-%d %H:%M})"


class SleepAssessment(models.Model):
    """
    Stores the chatbot-guided sleep symptom assessment for a user.
    Never populated with a user ID from the client — always derived
    from request.user in the view layer.
    """

    GENDER_CHOICES = [
        ('Male',             'Male'),
        ('Female',           'Female'),
        ('Other',            'Other'),
        ('Prefer not to say','Prefer not to say'),
    ]

    SLEEP_HOURS_CHOICES = [
        ('Less than 5 hours', 'Less than 5 hours'),
        ('5–6 hours',         '5–6 hours'),
        ('6–7 hours',         '6–7 hours'),
        ('7–9 hours',         '7–9 hours'),
        ('More than 9 hours', 'More than 9 hours'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_assessments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Section 1: About You ──────────────────────────────────────────────────
    age        = models.IntegerField()
    gender     = models.CharField(max_length=20, choices=GENDER_CHOICES)
    occupation = models.CharField(max_length=100)

    # ── Section 2: Sleep Symptoms (all boolean Yes/No) ────────────────────────
    difficulty_falling_asleep = models.BooleanField()
    frequent_night_awakenings = models.BooleanField()
    early_morning_awakening   = models.BooleanField()
    daytime_sleepiness        = models.BooleanField()
    loud_snoring              = models.BooleanField()
    gasping_or_choking        = models.BooleanField()
    dry_mouth_or_sore_throat  = models.BooleanField()
    morning_headache          = models.BooleanField()
    unrefreshing_sleep        = models.BooleanField()

    # ── Section 3: Sleep Duration ─────────────────────────────────────────────
    sleep_duration = models.CharField(max_length=20, choices=SLEEP_HOURS_CHOICES)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - Assessment ({self.created_at:%Y-%m-%d %H:%M})"


class SleepAnalysis(models.Model):
    """
    Stores a complete AI sleep analysis integrating:
    - Authenticated user
    - Corresponding chatbot assessment (if any)
    - Prediction date
    - Sleep quality result (score, label)
    - Sleep disorder result (label, probabilities)
    - Explainable AI information
    - Cleaned input features
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_analyses')
    assessment = models.ForeignKey(
        SleepAssessment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analyses'
    )
    prediction_date = models.DateTimeField(auto_now_add=True)

    # Sleep Quality result
    sleep_quality_score = models.FloatField(null=True, blank=True)
    sleep_quality_label = models.CharField(max_length=50, blank=True)

    # Sleep Disorder result
    sleep_disorder_result = models.CharField(max_length=50, blank=True)
    model_probabilities = models.JSONField(default=dict, blank=True)

    # Explainable AI information
    explainable_ai = models.JSONField(default=dict, blank=True)

    # Snapshot of the input features used for inference
    input_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-prediction_date']

    def __str__(self):
        return f"{self.user.username} - Analysis ({self.prediction_date:%Y-%m-%d %H:%M})"


class UserConsent(models.Model):
    """
    Records explicit user consent to the Privacy & Data Storage Agreement
    at the time of account creation.

    - One record per user (OneToOneField).
    - privacy_consent_version tracks which version of the agreement was accepted
      so future policy changes can require new consent if needed.
    - Never populated from client-supplied user IDs — always keyed to the User
      object created in the same transaction as registration.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='consent',
    )
    privacy_consent = models.BooleanField(default=False)
    privacy_consent_at = models.DateTimeField(null=True, blank=True)
    privacy_consent_version = models.CharField(
        max_length=20,
        default=PRIVACY_POLICY_VERSION,
        blank=True,
    )

    class Meta:
        verbose_name = "User Consent"
        verbose_name_plural = "User Consents"

    def __str__(self):
        status = "accepted" if self.privacy_consent else "not accepted"
        return f"{self.user.username} — privacy consent {status} (v{self.privacy_consent_version})"


class SleepGoal(models.Model):
    """
    User-specific 21-Day Sleep Goal.
    Each user has their own goal targets and timeline.
    """
    GOAL_TYPE_CHOICES = [
        ('sleep_duration', 'Sleep Duration'),
        ('consistent_schedule', 'Consistent Schedule'),
        ('both', 'Both'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sleep_goals')
    target_sleep_duration = models.IntegerField(default=480)  # in minutes (e.g. 480 = 8h 0m)
    target_bedtime = models.CharField(max_length=20, default='10:30 PM')
    target_wake_time = models.CharField(max_length=20, default='6:30 AM')
    goal_type = models.CharField(max_length=30, choices=GOAL_TYPE_CHOICES, default='both')
    start_date = models.DateField(default=timezone.localdate)
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - 21-Day Goal ({self.status}) started {self.start_date}"

    @property
    def current_day(self):
        """
        Calculate current day (1 to 21) based on start_date and today's date.
        """
        today = timezone.localdate()
        diff = (today - self.start_date).days + 1
        if diff < 1:
            return 1
        return min(21, diff)


class DailySleepRecord(models.Model):
    """
    Daily sleep tracking record for a user's 21-day sleep challenge.
    Strictly isolated and scoped by user and goal.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_sleep_records')
    goal = models.ForeignKey(SleepGoal, on_delete=models.CASCADE, related_name='records')
    day_number = models.IntegerField()  # 1 to 21
    date = models.DateField()
    actual_sleep_duration = models.IntegerField(null=True, blank=True)  # in minutes
    bedtime = models.CharField(max_length=20, null=True, blank=True)
    wake_time = models.CharField(max_length=20, null=True, blank=True)
    goal_achieved = models.BooleanField(null=True, blank=True)
    recorded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_number']
        unique_together = ('goal', 'day_number')

    def __str__(self):
        return f"{self.user.username} - Goal #{self.goal_id} Day {self.day_number}: {self.actual_sleep_duration}m"

