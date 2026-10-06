from django import forms

# ---------------------------------------------------------------------------
# Shared choice lists.
# IMPORTANT: these values must match the category labels the encoders were
# FIT ON during training (see training/train_models.py -> CATEGORY VALUES).
# If your real dataset uses different labels, update both here and in the
# encoders used during training.
# ---------------------------------------------------------------------------

GENDER_CHOICES = [
    ('Male', 'Male'),
    ('Female', 'Female'),
]

OCCUPATION_CHOICES = [
    ('Software Engineer', 'Software Engineer'),
    ('Doctor', 'Doctor'),
    ('Sales Representative', 'Sales Representative'),
    ('Teacher', 'Teacher'),
    ('Nurse', 'Nurse'),
    ('Engineer', 'Engineer'),
    ('Accountant', 'Accountant'),
    ('Scientist', 'Scientist'),
    ('Lawyer', 'Lawyer'),
    ('Salesperson', 'Salesperson'),
    ('Manager', 'Manager'),
]

BMI_CHOICES = [
    ('Normal', 'Normal'),
    ('Overweight', 'Overweight'),
    ('Obese', 'Obese'),
]


class BaseSleepForm(forms.Form):
    """
    Shared fields used by BOTH the Sleep Quality and Sleep Disorder forms.
    Keeping this as a base class guarantees identical field definitions and
    validation for the two pages, since both models were trained on the same
    feature set.
    """

    gender = forms.ChoiceField(
        choices=GENDER_CHOICES,
        label='Gender',
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    age = forms.IntegerField(
        label='Age',
        min_value=1,
        max_value=120,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'years'}),
    )
    occupation = forms.ChoiceField(
        choices=OCCUPATION_CHOICES,
        label='Occupation',
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    sleep_duration = forms.FloatField(
        label='Sleep Duration',
        min_value=0,
        max_value=24,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1', 'placeholder': 'hours'}),
    )
    physical_activity_level = forms.IntegerField(
        label='Physical Activity Level',
        min_value=0,
        max_value=100,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'minutes/day'}),
    )
    stress_level = forms.IntegerField(
        label='Stress Level',
        min_value=1,
        max_value=10,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'scale 1-10'}),
    )
    bmi_category = forms.ChoiceField(
        choices=BMI_CHOICES,
        label='BMI Category',
        widget=forms.Select(attrs={'class': 'form-select'}),
    )
    heart_rate = forms.IntegerField(
        label='Heart Rate',
        min_value=30,
        max_value=220,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'bpm'}),
    )
    daily_steps = forms.IntegerField(
        label='Daily Steps',
        min_value=0,
        max_value=50000,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'steps/day'}),
    )
    systolic_bp = forms.IntegerField(
        label='Systolic Blood Pressure',
        min_value=70,
        max_value=250,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'mmHg'}),
    )
    diastolic_bp = forms.IntegerField(
        label='Diastolic Blood Pressure',
        min_value=40,
        max_value=150,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'mmHg'}),
    )

    def clean(self):
        cleaned_data = super().clean()
        systolic = cleaned_data.get('systolic_bp')
        diastolic = cleaned_data.get('diastolic_bp')
        if systolic is not None and diastolic is not None and diastolic >= systolic:
            raise forms.ValidationError(
                'Diastolic blood pressure must be lower than systolic blood pressure.'
            )
        return cleaned_data


class SleepQualityForm(BaseSleepForm):
    """Form for the Sleep Quality Prediction page."""
    pass


class SleepDisorderForm(BaseSleepForm):
    """Form for the Sleep Disorder Prediction page."""
    pass


# ---------------------------------------------------------------------------
# Chatbot Assessment Form
# ---------------------------------------------------------------------------

SLEEP_DURATION_CHOICES = [
    'Less than 5 hours',
    '5–6 hours',
    '6–7 hours',
    '7–9 hours',
    'More than 9 hours',
]

ASSESSMENT_GENDER_CHOICES = ['Male', 'Female', 'Other', 'Prefer not to say']

BOOLEAN_FIELDS = [
    'difficulty_falling_asleep',
    'frequent_night_awakenings',
    'early_morning_awakening',
    'daytime_sleepiness',
    'loud_snoring',
    'gasping_or_choking',
    'dry_mouth_or_sore_throat',
    'morning_headache',
    'unrefreshing_sleep',
]


class SleepAssessmentForm(forms.Form):
    """
    Server-side validation for the chatbot sleep assessment.
    Accepts boolean or 'yes'/'no' strings for boolean symptom fields.
    Demographics are optional and can be inherited from the linked SleepAnalysis.
    """

    analysis_id = forms.IntegerField(required=False, label='Analysis ID')
    age = forms.IntegerField(min_value=5, max_value=110, required=False, label='Age')

    gender = forms.ChoiceField(
        choices=[(c, c) for c in ASSESSMENT_GENDER_CHOICES],
        required=False,
        label='Gender',
    )

    occupation = forms.CharField(max_length=100, required=False, label='Occupation')

    # ── Yes / No symptom fields ───────────────────────────────────────────────
    difficulty_falling_asleep = forms.CharField(label='Difficulty Falling Asleep')
    frequent_night_awakenings = forms.CharField(label='Frequent Night Awakenings')
    early_morning_awakening   = forms.CharField(label='Early Morning Awakening')
    daytime_sleepiness        = forms.CharField(label='Daytime Sleepiness')
    loud_snoring              = forms.CharField(label='Loud Snoring')
    gasping_or_choking        = forms.CharField(label='Gasping or Choking')
    dry_mouth_or_sore_throat  = forms.CharField(label='Dry Mouth or Sore Throat')
    morning_headache          = forms.CharField(label='Morning Headache')
    unrefreshing_sleep        = forms.CharField(label='Unrefreshing Sleep')

    sleep_duration = forms.CharField(
        max_length=50,
        required=False,
        label='Sleep Duration',
    )

    def full_clean(self):
        super().full_clean()
        # Convert yes/no strings or booleans after standard validation
        for field in BOOLEAN_FIELDS:
            if field in self.cleaned_data:
                val = self.cleaned_data[field]
                if isinstance(val, bool):
                    continue
                if isinstance(val, str):
                    val_str = val.strip().lower()
                    if val_str in ('yes', 'true', '1'):
                        self.cleaned_data[field] = True
                    elif val_str in ('no', 'false', '0'):
                        self.cleaned_data[field] = False
                    else:
                        self.add_error(field, "Must be 'yes' or 'no'.")
                else:
                    self.add_error(field, "Must be 'yes' or 'no'.")

