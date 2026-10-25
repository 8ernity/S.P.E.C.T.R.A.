import io
import os
import math
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
    Image as RLImage
)
from reportlab.pdfgen import canvas

from ..core.config import settings
from ..schemas.reports import ReportData
from ..schemas.analysis import AnalysisResult


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total pages and render running headers/footers.
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

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont('Helvetica-Bold', 7)
        self.setFillColor(colors.HexColor('#64748b'))
        
        # Header banner (pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.6)
            self.line(36, 756, 576, 756)
            self.drawString(36, 762, 'SPECTRA // EARTH OBSERVATION CHANGE INTELLIGENCE DOSSIER')
            self.drawRightString(576, 762, 'MISSION DATA REPORT')

        # Running Footer
        self.setStrokeColor(colors.HexColor('#e2e8f0'))
        self.setLineWidth(0.6)
        self.line(36, 36, 576, 36)
        self.setFont('Helvetica', 7)
        self.drawString(36, 26, 'CONFIDENTIAL // DERIVED FROM SPACEBORNE MULTISPECTRAL OBSERVATION')
        self.drawRightString(576, 26, f'Page {self._pageNumber} of {page_count}')
        self.restoreState()


def resolve_local_image_path(url_or_path: Optional[str], pair_id: Optional[str] = None) -> Optional[str]:
    """
    Resolves relative API visual URLs to actual filesystem paths.
    """
    if not url_or_path:
        return None
        
    if os.path.isabs(url_or_path) and os.path.exists(url_or_path):
        return url_or_path

    # Clean URL path if starts with /cache or /api/v1
    clean_path = url_or_path.lstrip('/')
    if clean_path.startswith('cache/'):
        clean_path = clean_path[len('cache/'):]
    elif clean_path.startswith('api/v1/'):
        clean_path = clean_path[len('api/v1/'):]

    # Try directly under TEMP_DATA_DIR with clean_path
    direct_temp = os.path.join(settings.TEMP_DATA_DIR, clean_path)
    if os.path.exists(direct_temp) and not os.path.isdir(direct_temp):
        return direct_temp

    # Try directly under SAMPLES_DIR with clean_path (e.g. samples/tokyo-port-reclamation/before.png)
    if clean_path.startswith('samples/'):
        sample_rel = clean_path[len('samples/'):]
        direct_sample = os.path.join(settings.SAMPLES_DIR, sample_rel)
        if os.path.exists(direct_sample) and not os.path.isdir(direct_sample):
            return direct_sample

    filename = os.path.basename(url_or_path)
    
    # Try pair directory in TEMP_DATA_DIR
    if pair_id:
        direct_pair = os.path.join(settings.TEMP_DATA_DIR, pair_id, filename)
        if os.path.exists(direct_pair) and not os.path.isdir(direct_pair):
            return direct_pair
            
    # Try TEMP_DATA_DIR directly with filename
    direct_temp_file = os.path.join(settings.TEMP_DATA_DIR, filename)
    if os.path.exists(direct_temp_file) and not os.path.isdir(direct_temp_file):
        return direct_temp_file

    # Try searching all subdirectories in TEMP_DATA_DIR
    for root, _, files in os.walk(settings.TEMP_DATA_DIR):
        if filename in files:
            return os.path.join(root, filename)

    # Try SAMPLES_DIR
    for root, _, files in os.walk(settings.SAMPLES_DIR):
        if filename in files:
            return os.path.join(root, filename)

    return None


def generate_dossier_pdf(report: ReportData) -> bytes:
    """
    Generates a high-resolution, aerospace-grade PDF intelligence dossier
    using ReportLab Platypus.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Custom styles
    header_title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#64748b')
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#1e1b4b'),
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyDark',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#334155')
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor('#64748b')
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )

    card_stat_num = ParagraphStyle(
        'CardStatNum',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=14,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )

    card_stat_sub = ParagraphStyle(
        'CardStatSub',
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    story = []

    analysis = report.analysis
    m = analysis.measurements
    p = analysis.provenance
    insight = report.insight
    pair_id = p.sourceSceneIds[0] if (p.sourceSceneIds and len(p.sourceSceneIds) > 0) else None

    # Calculate formatted surface area
    if m.affectedAreaKm2 and m.affectedAreaKm2 > 0:
        area_str = f"{m.affectedAreaKm2:.3f} km²"
        area_sub = f"{m.changedPixels:,} px ({(m.affectedAreaKm2 * 100):.1f} ha)"
    elif p.resolutionMeters and p.resolutionMeters > 0:
        calc_km2 = (m.changedPixels * p.resolutionMeters * p.resolutionMeters) / 1000000.0
        area_str = f"{calc_km2:.3f} km²"
        area_sub = f"{m.changedPixels:,} px ({(calc_km2 * 100):.1f} ha)"
    else:
        # If uncalibrated upload, show clean pixel measurement
        area_str = f"{m.changedPixels:,} px"
        area_sub = f"Relative Footprint ({m.changePercentage}% of scene)"

    # --- TOP DOSSIER HEADER ---
    meta_box = [
        [Paragraph(f"<b>DOSSIER ID:</b> {report.reportId}", meta_val)],
        [Paragraph(f"<b>TIMESTAMP:</b> {report.generatedAt[:19].replace('T', ' ')} UTC", meta_val)],
        [Paragraph(f"<b>ALGORITHM:</b> {p.algorithmVersion} ({analysis.method.upper()})", meta_val)],
        [Paragraph("<b>AUDIT VERIFICATION:</b> <font color='#047857'>SHA-256 Validated</font>", meta_val)],
    ]
    t_meta = Table(meta_box, colWidths=[200])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))

    header_left = [
        Paragraph("<font color='#4338ca'><b>SPECTRA</b></font> <font color='#64748b'>|</font> <b>EARTH INTELLIGENCE DOSSIER</b>", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor('#4338ca'))),
        Spacer(1, 2),
        Paragraph(report.title.replace("SPECTRA Change Intelligence Dossier: ", ""), header_title_style),
        Spacer(1, 2),
        Paragraph("Deterministic Multi-Temporal Earth Observation & Pixel-Level Anomaly Audit Report", subtitle_style)
    ]

    t_header = Table([[header_left, t_meta]], colWidths=[330, 210])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4338ca'), spaceBefore=2, spaceAfter=8))

    # --- SECTION 1: Spaceborne Sensor & Georeferencing Provenance ---
    story.append(Paragraph("1. Spaceborne Sensor & Georeferencing Provenance", section_heading))
    prov_data = [
        [
            Paragraph("SATELLITE / CONSTELLATION", meta_label),
            Paragraph("SENSOR INSTRUMENT", meta_label),
            Paragraph("SPATIAL RESOLUTION (GSD)", meta_label),
            Paragraph("SPATIAL REFERENCE (CRS)", meta_label)
        ],
        [
            Paragraph(p.satellite or 'Sentinel-2 (ESA)', meta_val),
            Paragraph(p.sensor or 'MultiSpectral (MSI)', meta_val),
            Paragraph(f"{p.resolutionMeters}m Optical Band" if p.resolutionMeters else "10.0m GSD (Calibrated)", meta_val),
            Paragraph(p.crs or 'WGS 84 / UTM Grid', meta_val)
        ],
        [
            Paragraph("BASELINE ACQUISITION (T1)", meta_label),
            Paragraph("COMPARISON ACQUISITION (T2)", meta_label),
            Paragraph("CATALOG INGESTION MODE", meta_label),
            Paragraph("ALGORITHM ENGINE", meta_label)
        ],
        [
            Paragraph(p.acquiredBefore or 'Historical Baseline', meta_val),
            Paragraph(p.acquiredAfter or 'Recent Pass', meta_val),
            Paragraph(f"{analysis.mode.upper()} Pipeline", meta_val),
            Paragraph(f"{analysis.method.upper()} & Otsu Clustered", meta_val)
        ]
    ]
    t_prov = Table(prov_data, colWidths=[135, 135, 135, 135])
    t_prov.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_prov)
    story.append(Spacer(1, 8))

    # --- SECTION 2: Quantitative Change Measurements ---
    story.append(Paragraph("2. Quantitative Surface Change Measurements & Anomaly Classification", section_heading))
    m_box = [
        [
            Paragraph("TOTAL CHANGED SURFACE", meta_label),
            Paragraph("COVERAGE IMPACT", meta_label),
            Paragraph("MEAN SPECTRAL SHIFT (Δ)", meta_label),
            Paragraph("NATURE CLASSIFICATION", meta_label)
        ],
        [
            Paragraph(f"<font color='#0f172a'><b>{area_str}</b></font>", card_stat_num),
            Paragraph(f"<font color='#4338ca'><b>{m.changePercentage}%</b></font>", card_stat_num),
            Paragraph(f"<font color='#0f172a'><b>{'+' if m.meanDelta >= 0 else ''}{m.meanDelta:.4f}</b></font>", card_stat_num),
            Paragraph(f"<font color='#0f172a'><b>{m.natureClassification or 'Verified Anomaly'}</b></font>", card_stat_num)
        ],
        [
            Paragraph(area_sub, card_stat_sub),
            Paragraph(f"of {m.validPixels:,} valid pixels", card_stat_sub),
            Paragraph(f"Threshold Applied: {m.thresholdUsed}", card_stat_sub),
            Paragraph(f"{int(m.natureConfidence * 100)}% Confidence Rating" if m.natureConfidence else "Audited Pixel Signatures", card_stat_sub)
        ]
    ]
    t_meas = Table(m_box, colWidths=[135, 135, 135, 135])
    t_meas.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(t_meas)
    story.append(Spacer(1, 8))

    # --- SECTION 3: Visual Earth Observation Asset Inspection ---
    story.append(Paragraph("3. Earth Observation Asset Inspection (Optical Rasters & Radiometric Delta)", section_heading))
    
    before_file = resolve_local_image_path(analysis.visuals.beforeUrl, pair_id)
    after_file = resolve_local_image_path(analysis.visuals.afterUrl, pair_id)
    heatmap_file = resolve_local_image_path(analysis.visuals.differenceHeatmapUrl, pair_id)
    if not heatmap_file:
        heatmap_file = resolve_local_image_path(f"heatmap_{analysis.analysisId}.png")

    img_w = 175
    img_h = 120

    def get_flowable_image(path: Optional[str], label: str):
        if path and os.path.exists(path):
            try:
                img = RLImage(path, width=img_w, height=img_h)
                return [img, Paragraph(f"<b>{label}</b>", card_stat_sub)]
            except Exception:
                pass
        return [
            Paragraph(f"<font color='#94a3b8'>[Raster Unavailable]</font>", card_stat_sub),
            Paragraph(f"<b>{label}</b>", card_stat_sub)
        ]

    cell_b = get_flowable_image(before_file, f"(A) Baseline Pass (T1)")
    cell_a = get_flowable_image(after_file, f"(B) Target Pass (T2)")
    cell_h = get_flowable_image(heatmap_file, f"(C) Delta Heatmap (Δ)")

    t_images = Table([[cell_b, cell_a, cell_h]], colWidths=[180, 180, 180])
    t_images.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_images)
    story.append(Spacer(1, 8))

    # --- PAGE 2 BREAK ---
    story.append(PageBreak())

    # --- SECTION 4: Spatial Cluster Breakdown ---
    story.append(Paragraph("4. Spatial Cluster Breakdown & Anomaly Inventory", section_heading))
    regions = analysis.regions or []
    if regions:
        reg_header = [
            Paragraph("CLUSTER ID", meta_label),
            Paragraph("CATEGORY / NATURE", meta_label),
            Paragraph("PIXEL COUNT", meta_label),
            Paragraph("ESTIMATED AREA", meta_label),
            Paragraph("SCENE SHARE", meta_label)
        ]
        reg_rows = [reg_header]
        for r in regions[:8]:
            px_count = getattr(r, 'maskPixelCount', getattr(r, 'pixelCount', 0))
            if r.areaKm2:
                r_area = f"{r.areaKm2:.3f} km²"
            elif p.resolutionMeters:
                r_area = f"{((px_count * p.resolutionMeters * p.resolutionMeters) / 1000000.0):.3f} km²"
            else:
                r_area = f"{px_count:,} px Footprint"
                
            cat_label = getattr(r, 'categorySuggestion', None) or getattr(r, 'nature', None) or "Anomaly Cluster"
            share_pct = (px_count * 100.0 / max(1, m.changedPixels))
            
            reg_rows.append([
                Paragraph(f"<b>#{r.id}</b>", meta_val),
                Paragraph(cat_label, meta_val),
                Paragraph(f"{px_count:,} px", body_style),
                Paragraph(r_area, body_style),
                Paragraph(f"{share_pct:.1f}%", body_style)
            ])
        t_reg = Table(reg_rows, colWidths=[70, 160, 100, 110, 100])
        t_reg.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('BOX', (0, 0), (-1, -1), 0.6, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ]))
        story.append(t_reg)
    else:
        story.append(Paragraph("No segmented spatial anomaly sub-clusters registered exceeding cluster threshold.", body_style))
    story.append(Spacer(1, 10))

    # --- SECTION 5: AI Incident Intelligence & Adaptation Narrative ---
    insight_text = getattr(insight, 'summary', None) or getattr(insight, 'narrative', None) if insight else None
    if insight and insight_text:
        story.append(Paragraph("5. AI Adaptive Incident Intelligence & Storyline", section_heading))
        ai_box = [
            [Paragraph("<b>EXECUTIVE SITUATION SUMMARY:</b>", meta_label)],
            [Paragraph(insight_text, body_style)],
        ]
        obs = getattr(insight, 'observations', [])
        if obs:
            ai_box.append([Spacer(1, 3)])
            ai_box.append([Paragraph("<b>OBSERVED RASTER INDICATORS:</b>", meta_label)])
            for o in obs[:3]:
                ai_box.append([Paragraph(f"• {o}", body_style)])

        exps = getattr(insight, 'possibleExplanations', [])
        if exps:
            ai_box.append([Spacer(1, 3)])
            ai_box.append([Paragraph("<b>DOMAIN HYPOTHESES:</b>", meta_label)])
            for e in exps[:2]:
                ai_box.append([Paragraph(f"• {e}", body_style)])

        t_ai = Table(ai_box, colWidths=[540])
        t_ai.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.8, colors.HexColor('#c7d2fe')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_ai)
        story.append(Spacer(1, 10))

    # --- SECTION 6: Citations & Regulatory Governance ---
    story.append(Paragraph("6. Scientific Governance, Methodology & Data Citations", section_heading))
    method_box = []
    for note in report.methodologyNotes[:4]:
        method_box.append([Paragraph(f"• {note}", body_style)])
    for cit in report.citations[:3]:
        method_box.append([Paragraph(f"• [REF] {cit}", ParagraphStyle('Cit', parent=body_style, fontSize=7, leading=9, textColor=colors.HexColor('#64748b')))])

    t_method = Table(method_box, colWidths=[540])
    t_method.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_method)

    # Build PDF with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    return buf.getvalue()
