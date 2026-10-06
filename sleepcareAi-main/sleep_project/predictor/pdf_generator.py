"""
SleepCare AI — Professional PDF Sleep Analysis Report Generator
Uses ReportLab to generate vector PDF reports for saved sleep assessments.
"""

from io import BytesIO
from django.conf import settings
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
    Image,
)
from reportlab.pdfgen import canvas


def _has_symptom_data(assessment):
    """
    Return True if the assessment has at least one boolean symptom field set
    (not None). This distinguishes a completed post-prediction assessment from
    a stub/empty assessment record.
    """
    symptom_fields = [
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
    for field in symptom_fields:
        val = getattr(assessment, field, None)
        if val is not None:
            return True
    return False



class NumberedCanvas(canvas.Canvas):
    """
    Custom two-pass canvas to dynamically compute total page count
    and render a professional footer with page numbering and disclaimer.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 38, 572, 38)

        # Footer text
        disclaimer = "SleepCare AI — Not a medical diagnosis. For health decisions, consult a healthcare provider."
        self.drawString(40, 26, disclaimer)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 26, page_str)
        self.restoreState()


def generate_sleep_analysis_pdf(user, assessment=None, analysis=None):
    """
    Generates a PDF binary stream containing the full sleep analysis report.
    Returns: BytesIO buffer
    """
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    brand_title_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#071D3B'),
    )

    brand_sub_style = ParagraphStyle(
        'BrandSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#147DF5'),
        spaceAfter=10,
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#071D3B'),
        spaceBefore=10,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0F172A'),
    )

    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
    )

    image_title_style = ParagraphStyle(
        'ImageTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#0F172A'),
        alignment=1,
    )

    image_caption_style = ParagraphStyle(
        'ImageCaption',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569'),
        alignment=1,
    )

    story = []

    # ---------------------------------------------------------------------------
    # 1. Header Banner
    # ---------------------------------------------------------------------------
    header_data = [
        [
            Paragraph("SLEEPCARE AI", brand_title_style),
            Paragraph("CONFIDENTIAL HEALTH REPORT", ParagraphStyle(
                'Conf', fontName='Helvetica-Bold', fontSize=8, leading=10,
                textColor=colors.HexColor('#147DF5'), alignment=2
            )),
        ],
        [
            Paragraph("Sleep Analysis Report", brand_sub_style),
            Paragraph("Generated by SleepCare AI Decision Support", ParagraphStyle(
                'SubRight', fontName='Helvetica', fontSize=8, leading=10,
                textColor=colors.HexColor('#64748B'), alignment=2
            )),
        ]
    ]

    header_table = Table(header_data, colWidths=[332, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#147DF5'), spaceAfter=14))

    # ---------------------------------------------------------------------------
    # 2. User Information
    # ---------------------------------------------------------------------------
    story.append(Paragraph("User Information", section_heading))

    date_str = "Recently"
    if analysis and analysis.prediction_date:
        date_str = analysis.prediction_date.strftime('%B %d, %Y at %I:%M %p')
    elif assessment and assessment.created_at:
        date_str = assessment.created_at.strftime('%B %d, %Y at %I:%M %p')

    user_full_name = f"{user.first_name} {user.last_name}".strip() if (user.first_name or user.last_name) else user.username

    user_info_data = [
        [
            Paragraph("<b>Username:</b>", body_style),
            Paragraph(str(user.username), body_style),
            Paragraph("<b>Full Name:</b>", body_style),
            Paragraph(user_full_name, body_style),
        ],
        [
            Paragraph("<b>Assessment Date:</b>", body_style),
            Paragraph(date_str, body_style),
            Paragraph("<b>Assessment ID:</b>", body_style),
            Paragraph(f"#{assessment.id}" if assessment else (f"#{analysis.id}" if analysis else "—"), body_style),
        ]
    ]

    user_info_table = Table(user_info_data, colWidths=[105, 161, 105, 161])
    user_info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EDF2F7')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(user_info_table)
    story.append(Spacer(1, 12))

    # ---------------------------------------------------------------------------
    # 3. Collected Sleep Information
    # ---------------------------------------------------------------------------
    story.append(Paragraph("Collected Sleep Information", section_heading))

    age_val = assessment.age if assessment else (analysis.input_data.get('age', '—') if analysis and analysis.input_data else '—')
    gender_val = assessment.gender if assessment else (analysis.input_data.get('gender', '—') if analysis and analysis.input_data else '—')
    occ_val = assessment.occupation if assessment else (analysis.input_data.get('occupation', '—') if analysis and analysis.input_data else '—')
    duration_val = assessment.sleep_duration if assessment else (f"{analysis.input_data.get('sleep_duration', '—')} hours" if analysis and analysis.input_data else '—')

    demographics_data = [
        [
            Paragraph("<b>Age:</b>", body_style), Paragraph(str(age_val), body_style),
            Paragraph("<b>Gender:</b>", body_style), Paragraph(str(gender_val), body_style),
        ],
        [
            Paragraph("<b>Occupation:</b>", body_style), Paragraph(str(occ_val), body_style),
            Paragraph("<b>Sleep Duration:</b>", body_style), Paragraph(str(duration_val), body_style),
        ],
    ]
    demographics_table = Table(demographics_data, colWidths=[90, 176, 90, 176])
    demographics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EDF2F7')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(demographics_table)
    story.append(Spacer(1, 12))

    # ---------------------------------------------------------------------------
    # 4. Prediction Results
    # ---------------------------------------------------------------------------
    story.append(Paragraph("Machine Learning Prediction", section_heading))

    quality_display = "—"
    quality_label = ""
    disorder_display = "—"
    probs_list = []

    if analysis:
        if analysis.sleep_quality_score is not None:
            quality_display = f"{analysis.sleep_quality_score:.1f} / 10"
            quality_label = f"({analysis.sleep_quality_label})" if analysis.sleep_quality_label else ""
        disorder_display = analysis.sleep_disorder_result or "No Sleep Disorder"
        if isinstance(analysis.model_probabilities, list):
            probs_list = analysis.model_probabilities
        elif isinstance(analysis.model_probabilities, dict):
            probs_list = [{"label": k, "probability": v} for k, v in analysis.model_probabilities.items()]

    pred_summary_data = [
        [
            Paragraph("<b>Predicted Sleep Quality Score:</b>", body_style),
            Paragraph(f"<font color='#0284C7'><b>{quality_display}</b></font> {quality_label}", body_style),
        ],
        [
            Paragraph("<b>Sleep Disorder Assessment:</b>", body_style),
            Paragraph(f"<font color='#0F172A'><b>{disorder_display}</b></font>", body_style),
        ]
    ]

    pred_table = Table(pred_summary_data, colWidths=[200, 332])
    pred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F9FF')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#7DD3FC')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BAE6FD')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(pred_table)

    # Probabilities Table
    if probs_list:
        story.append(Spacer(1, 6))
        prob_header = [Paragraph("<b>Disorder Classification Category</b>", body_bold), Paragraph("<b>Estimated Probability</b>", body_bold)]
        prob_rows = [prob_header]
        for p in probs_list:
            lbl = p.get('label', '')
            if lbl == 'None':
                lbl = 'No Sleep Disorder'
            pct = p.get('probability', 0)
            if isinstance(pct, (int, float)) and pct <= 1:
                pct = pct * 100
            prob_rows.append([
                Paragraph(lbl, body_style),
                Paragraph(f"{float(pct):.2f}%", body_bold),
            ])

        prob_table = Table(prob_rows, colWidths=[332, 200])
        prob_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(prob_table)

    story.append(Spacer(1, 12))

    # ---------------------------------------------------------------------------
    # 5. Medical Educational Reference Illustration
    # ---------------------------------------------------------------------------
    condition_str = (disorder_display or '').lower()

    def resolve_medical_img(filename):
        paths = [
            settings.BASE_DIR / 'static' / 'images' / 'medical' / filename,
            settings.BASE_DIR.parent / 'frontend' / 'src' / 'assets' / 'medical' / filename,
            settings.BASE_DIR.parent / 'frontend' / 'public' / 'assets' / 'medical' / filename,
            settings.BASE_DIR / 'static' / 'medical' / filename,
        ]
        for p in paths:
            if p.exists():
                return str(p)
        return None

    if 'apnea' in condition_str or 'osa' in condition_str:
        normal_path = resolve_medical_img('osa-normal-airway.png')
        blocked_path = resolve_medical_img('osa-blocked-airway.png')

        if normal_path and blocked_path:
            story.append(Paragraph("Clinical Condition & Airway Anatomy Reference", section_heading))
            story.append(Paragraph(
                "Cross-sectional medical illustration comparing unobstructed airflow during normal sleep versus collapsed airway obstruction characteristic of Obstructive Sleep Apnea (OSA).",
                body_style
            ))
            story.append(Spacer(1, 6))

            img_w = 140
            img_h = 168

            normal_img = Image(normal_path, width=img_w, height=img_h)
            blocked_img = Image(blocked_path, width=img_w, height=img_h)

            col1_content = [
                Paragraph("<font color='#059669'><b>NORMAL SLEEP</b></font>", image_title_style),
                Spacer(1, 3),
                normal_img,
                Spacer(1, 4),
                Paragraph("<b>Normal Open Airway</b>", image_title_style),
                Paragraph("Airway muscles maintain tone, permitting free and unobstructed airflow to the lungs.", image_caption_style),
            ]

            col2_content = [
                Paragraph("<font color='#DC2626'><b>OBSTRUCTIVE SLEEP APNEA</b></font>", image_title_style),
                Spacer(1, 3),
                blocked_img,
                Spacer(1, 4),
                Paragraph("<b>Blocked Airway (OSA)</b>", image_title_style),
                Paragraph("Throat muscles relax and airway tissues collapse, obstructing airflow and causing oxygen drops.", image_caption_style),
            ]

            img_table = Table([[col1_content, col2_content]], colWidths=[260, 260])
            img_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F0FDF4')),
                ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#FEF2F2')),
                ('BOX', (0, 0), (0, 0), 0.75, colors.HexColor('#BBF7D0')),
                ('BOX', (1, 0), (1, 0), 0.75, colors.HexColor('#FECACA')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(KeepTogether(img_table))
            story.append(Spacer(1, 12))

    elif 'insomnia' in condition_str:
        norm_sleep_path = resolve_medical_img('insomnia-normal.png')
        insomnia_path = resolve_medical_img('insomnia.png')

        if norm_sleep_path and insomnia_path:
            story.append(Paragraph("Clinical Condition & Brain Activity Reference", section_heading))
            story.append(Paragraph(
                "Comparative medical illustration demonstrating calm neural activity during healthy restorative sleep versus elevated cortical hyperarousal during insomnia episodes.",
                body_style
            ))
            story.append(Spacer(1, 6))

            img_w = 165
            img_h = 130

            norm_img = Image(norm_sleep_path, width=img_w, height=img_h)
            insom_img = Image(insomnia_path, width=img_w, height=img_h)

            col1_content = [
                Paragraph("<font color='#059669'><b>NORMAL RESTORATIVE SLEEP</b></font>", image_title_style),
                Spacer(1, 3),
                norm_img,
                Spacer(1, 4),
                Paragraph("<b>Calm Neurological Activity</b>", image_title_style),
                Paragraph("Synchronized slow-wave neural activity facilitates deep sleep cycles and body recovery.", image_caption_style),
            ]

            col2_content = [
                Paragraph("<font color='#DC2626'><b>INSOMNIA HYPERAROUSAL</b></font>", image_title_style),
                Spacer(1, 3),
                insom_img,
                Spacer(1, 4),
                Paragraph("<b>Heightened Cognitive Alertness</b>", image_title_style),
                Paragraph("Persistent cortical hyperarousal creates difficulty initiating, sustaining, or resuming sleep.", image_caption_style),
            ]

            img_table = Table([[col1_content, col2_content]], colWidths=[260, 260])
            img_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F0FDF4')),
                ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#FEF2F2')),
                ('BOX', (0, 0), (0, 0), 0.75, colors.HexColor('#BBF7D0')),
                ('BOX', (1, 0), (1, 0), 0.75, colors.HexColor('#FECACA')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(KeepTogether(img_table))
            story.append(Spacer(1, 12))

    else:
        healthy_path = resolve_medical_img('healthy-sleep.png')
        if healthy_path:
            story.append(Paragraph("Healthy Sleep Architecture Reference", section_heading))
            story.append(Paragraph(
                "Clinical educational reference depicting balanced circadian rhythm regulation and healthy progression through restorative non-REM and REM sleep phases.",
                body_style
            ))
            story.append(Spacer(1, 6))

            img_w = 260
            img_h = 195
            healthy_img = Image(healthy_path, width=img_w, height=img_h)

            card_content = [
                Paragraph("<font color='#0284C7'><b>HEALTHY SLEEP ARCHITECTURE</b></font>", image_title_style),
                Spacer(1, 4),
                healthy_img,
                Spacer(1, 4),
                Paragraph("<b>Restorative Sleep Cycles</b>", image_title_style),
                Paragraph("Consistent sleep habits and dark, cool environments support cellular repair, memory consolidation, and cardiovascular health.", image_caption_style),
            ]

            img_table = Table([[card_content]], colWidths=[520])
            img_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F9FF')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#BAE6FD')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(KeepTogether(img_table))
            story.append(Spacer(1, 12))

    # ---------------------------------------------------------------------------
    # 6. Explainable AI (XAI)
    # ---------------------------------------------------------------------------
    story.append(Paragraph("Explainable AI (XAI) & Contributing Features", section_heading))

    xai = analysis.explainable_ai if (analysis and analysis.explainable_ai) else {}
    factors = xai.get('factors', [])
    positives = xai.get('positive_contributors', [])
    risks = xai.get('risk_factors', [])
    calibration_note = xai.get('calibration_note', '')

    if factors:
        factor_rows = [[
            Paragraph("<b>Feature Factor</b>", body_bold),
            Paragraph("<b>Recorded Value</b>", body_bold),
            Paragraph("<b>Directional Influence & Detail</b>", body_bold),
        ]]
        for f in factors:
            impact_color = "#15803D" if f.get('impact') == 'positive' else ("#C2410C" if f.get('impact') == 'negative' else "#475569")
            factor_rows.append([
                Paragraph(f.get('feature', '—'), body_bold),
                Paragraph(f.get('value', '—'), body_style),
                Paragraph(f"<font color='{impact_color}'><b>[{f.get('impact', '').upper()}]</b></font> {f.get('detail', '')}", body_style),
            ])

        factor_table = Table(factor_rows, colWidths=[120, 92, 320])
        factor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(factor_table)

    if positives or risks:
        story.append(Spacer(1, 6))
        summary_bullets = []
        if positives:
            summary_bullets.append(Paragraph("<b>Protective / Positive Contributors:</b>", body_bold))
            for p in positives:
                summary_bullets.append(Paragraph(f"• {p}", body_style))
        if risks:
            if positives:
                summary_bullets.append(Spacer(1, 4))
            summary_bullets.append(Paragraph("<b>Identified Risk Factors:</b>", body_bold))
            for r in risks:
                summary_bullets.append(Paragraph(f"• {r}", body_style))

        bullet_table = Table([[summary_bullets]], colWidths=[532])
        bullet_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FAF5FF')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E9D5FF')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(bullet_table)

    if calibration_note:
        story.append(Spacer(1, 6))
        cal_para = Paragraph(f"<b>Model Calibration Note:</b> {calibration_note}", ParagraphStyle(
            'Cal', fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#64748B')
        ))
        story.append(cal_para)

    # ---------------------------------------------------------------------------
    # 6a. Sleep Health Assessment (Optional — only when assessment was completed)
    # ---------------------------------------------------------------------------
    # The assessment is linked to the analysis via analysis.assessment.
    # If the user skipped the assessment, analysis.assessment will be None
    # and this entire section is omitted from the report.
    linked_assessment = assessment
    if not linked_assessment and analysis:
        linked_assessment = getattr(analysis, 'assessment', None)

    # Only show this section if the assessment actually has symptom data
    if linked_assessment and _has_symptom_data(linked_assessment):
        story.append(Spacer(1, 14))
        story.append(Paragraph("Sleep Health Assessment", section_heading))
        story.append(Paragraph(
            "The following responses were voluntarily provided by the user as part of an optional "
            "sleep health self-assessment. These answers are recorded for contextual awareness only "
            "and do not influence the machine-learning predictions above.",
            body_style
        ))
        story.append(Spacer(1, 6))

        sha_header = [
            Paragraph("<b>Sleep Assessment Question</b>", body_bold),
            Paragraph("<b>Response</b>", body_bold),
        ]

        sha_questions = [
            ("Difficulty falling asleep", linked_assessment.difficulty_falling_asleep),
            ("Frequent nighttime waking", linked_assessment.frequent_night_awakenings),
            ("Waking earlier than desired", linked_assessment.early_morning_awakening),
            ("Daytime tiredness/sleepiness", linked_assessment.daytime_sleepiness),
            ("Loud snoring", linked_assessment.loud_snoring),
            ("Waking gasping/choking", linked_assessment.gasping_or_choking),
            ("Dry mouth or sore throat", linked_assessment.dry_mouth_or_sore_throat),
            ("Morning headache", linked_assessment.morning_headache),
            ("Tired despite enough sleep", linked_assessment.unrefreshing_sleep),
        ]

        sha_rows = [sha_header]
        for label, value in sha_questions:
            if value is True or value == 1 or str(value).lower() in ('true', 'yes'):
                display = "Yes"
            elif value is False or value == 0 or str(value).lower() in ('false', 'no'):
                display = "No"
            else:
                display = "—"
            sha_rows.append([
                Paragraph(label, body_style),
                Paragraph(display, body_style),
            ])

        sha_table = Table(sha_rows, colWidths=[366, 166])
        sha_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(sha_table)

        story.append(Spacer(1, 6))
        sha_note = Paragraph(
            "<b>Assessment Context:</b> These responses reflect the user's reported sleep "
            "experiences and are provided for health awareness and additional context. "
            "They are not a medical diagnosis.",
            ParagraphStyle(
                'ShaNote', fontName='Helvetica-Oblique', fontSize=8, leading=11,
                textColor=colors.HexColor('#64748B'),
            )
        )
        sha_note_table = Table([[sha_note]], colWidths=[532])
        sha_note_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0F9FF')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#BAE6FD')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(sha_note_table)

    # ---------------------------------------------------------------------------
    # 7. Medical Disclaimer (Required verbatim)
    # ---------------------------------------------------------------------------
    story.append(Spacer(1, 14))
    disclaimer_text = (
        "<b>Important Medical Disclaimer:</b><br/>"
        "This report contains machine-learning estimates and is not a medical diagnosis. "
        "The calculated sleep scores, disorder probabilities, and feature attributions are intended "
        "solely for personal health awareness and lifestyle tracking. Do not adjust medications or "
        "medical treatments without consulting a qualified physician or sleep specialist."
    )
    disc_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[532])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFBEB')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FDE68A')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(disc_table)

    # Build PDF with dynamic page numbering
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
