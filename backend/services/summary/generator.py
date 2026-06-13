import os
from pathlib import Path
from datetime import datetime

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT

DARK_BLUE  = colors.HexColor('#1b3a6b')
MED_BLUE   = colors.HexColor('#2e5fa3')
LIGHT_BLUE = colors.HexColor('#eef3fb')
ROW_ALT    = colors.HexColor('#f7f8fc')
TOTAL_BG   = colors.HexColor('#dce8f8')
BORDER     = colors.HexColor('#c8c8d8')
AMBER_BG   = colors.HexColor('#faeeda')
AMBER      = colors.HexColor('#ef9f27')
GREY_TEXT  = colors.HexColor('#555555')
STAMP_TEXT = colors.HexColor('#888888')


def generate_pdf(summary_data: dict, document_meta: dict, output_path: str) -> str:
    os.makedirs(Path(output_path).parent, exist_ok=True)
    doc = SimpleDocTemplate(
        output_path, pagesize=landscape(A4),
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )
    story = []
    generated_at = datetime.now().strftime("%d %B %Y, %H:%M")

    # ── Header ────────────────────────────────────────────────────────────────
    hdr = Table([[
        Paragraph('<b>Bank Statement Analysis</b><br/>'
                  '<font size="8" color="#555555">Lending Assessment &amp; Financial Review Report</font>',
                  ParagraphStyle('brand', fontSize=16, fontName='Helvetica-Bold', textColor=DARK_BLUE, leading=20)),
        Paragraph(f'<font color="#b91c1c"><b>CONFIDENTIAL</b></font><br/>'
                  f'<b>Report Date: {generated_at}</b><br/>'
                  f'Ref: {document_meta.get("loan_reference") or "—"}',
                  ParagraphStyle('hdr_r', fontSize=9, alignment=TA_RIGHT, leading=13)),
    ]], colWidths=['70%', '30%'])
    hdr.setStyle(TableStyle([
        ('LINEABOVE',  (0,0), (-1,0),  3,   DARK_BLUE),
        ('LINEBELOW',  (0,0), (-1,-1), 1.5, DARK_BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('VALIGN',     (0,0), (-1,-1), 'BOTTOM'),
    ]))
    story += [hdr, Spacer(1, 10)]

    # ── 1. Account Details ────────────────────────────────────────────────────
    story.append(_section('1. Account Details'))
    for acct in summary_data.get('account_details', []):
        rows = [
            ['Bank', acct.get('bank_name', '—'),
             'Account No.', acct.get('account_number_masked', '—')],
            ['Applicant', acct.get('applicant_name') or document_meta.get('applicant_name', '—'),
             'Co-Applicant', acct.get('co_applicant_name') or document_meta.get('co_applicant_name', '—')],
            ['Account Type', acct.get('account_type', '—'),
             'Period', f"{acct.get('statement_period_from','—')} to {acct.get('statement_period_to','—')}"],
        ]
        t = Table(rows, colWidths=['15%', '35%', '15%', '35%'])
        t.setStyle(TableStyle([
            ('FONTSIZE',  (0,0), (-1,-1), 9),
            ('FONTNAME',  (0,0), (0,-1),  'Helvetica-Bold'),
            ('FONTNAME',  (2,0), (2,-1),  'Helvetica-Bold'),
            ('TEXTCOLOR', (0,0), (0,-1),  GREY_TEXT),
            ('TEXTCOLOR', (2,0), (2,-1),  GREY_TEXT),
            ('BACKGROUND',(0,0), (-1,-1), LIGHT_BLUE),
            ('BOX',       (0,0), (-1,-1), 1,   BORDER),
            ('LINEBEFORE',(0,0), (0,-1),  3,   MED_BLUE),
            ('GRID',      (0,0), (-1,-1), 0.5, BORDER),
            ('PADDING',   (0,0), (-1,-1), 4),
        ]))
        story += [t, Spacer(1, 6)]

    # ── 2. Monthly Credits ────────────────────────────────────────────────────
    story += [Spacer(1, 4), _section('2. Monthly Credits (₹)')]
    monthly_credits  = summary_data.get('monthly_credits', [])
    credit_totals    = summary_data.get('credit_totals', {})
    credit_averages  = summary_data.get('credit_averages', {})

    if monthly_credits:
        banks  = list(dict.fromkeys(r['bank_name'] for r in monthly_credits))
        months = list(dict.fromkeys(r['month']     for r in monthly_credits))

        h1 = ['Month'] + [b for b in banks for _ in range(2)] + ['Remarks']
        h2 = ['']      + ['Applicant (₹)', 'Co-Appl. (₹)'] * len(banks) + ['']
        rows = [h1, h2]

        for month in months:
            row = [month]
            remark = '—'
            for bank in banks:
                m = [r for r in monthly_credits if r['month'] == month and r['bank_name'] == bank]
                if m:
                    row += [_inr(m[0].get('applicant_amount')), _inr(m[0].get('co_applicant_amount'))]
                    if m[0].get('remarks'):
                        remark = ('One-time: ' if m[0].get('is_one_time') else '') + m[0]['remarks']
                else:
                    row += ['—', '—']
            rows.append(row + [remark])

        months_count = (next(iter(credit_averages.values()), {}) or {}).get('months_count', 12)
        tot = ['Total']   + [_inr(credit_totals.get(b,{}).get(k,0))    for b in banks for k in ('applicant','co_applicant')] + ['Excl. one-time credits']
        avg = ['Avg./Month'] + [_inr(credit_averages.get(b,{}).get(k,0)) for b in banks for k in ('applicant','co_applicant')] + [f'{months_count}-month basis']
        rows += [tot, avg]

        n_data = len(banks) * 2
        cw = ['12%'] + [f'{70/n_data:.1f}%'] * n_data + ['18%']
        ct = Table(rows, colWidths=cw, repeatRows=2)

        sty = [
            ('FONTSIZE',    (0,0), (-1,-1), 8),
            ('FONTNAME',    (0,0), (-1,1),  'Helvetica-Bold'),
            ('BACKGROUND',  (0,0), (-1,1),  DARK_BLUE),
            ('TEXTCOLOR',   (0,0), (-1,1),  colors.white),
            ('ALIGN',       (0,0), (-1,-1), 'CENTER'),
            ('ALIGN',       (0,0), (0,-1),  'LEFT'),
            ('ALIGN',       (-1,0),(-1,-1), 'LEFT'),
            ('GRID',        (0,0), (-1,-1), 0.5, BORDER),
            ('PADDING',     (0,0), (-1,-1), 4),
            ('SPAN',        (0,0), (0,1)),
            ('SPAN',        (-1,0),(-1,1)),
        ]
        for i, _ in enumerate(banks):
            sty.append(('SPAN', (1+i*2,0), (2+i*2,0)))
        for i in range(len(months)):
            if i % 2 == 1:
                sty.append(('BACKGROUND', (0,i+2), (-1,i+2), ROW_ALT))
        tr = len(months) + 2
        sty += [
            ('BACKGROUND', (0,tr),   (-1,tr),   TOTAL_BG),
            ('FONTNAME',   (0,tr),   (-1,tr),   'Helvetica-Bold'),
            ('LINEABOVE',  (0,tr),   (-1,tr),   1.5, MED_BLUE),
            ('BACKGROUND', (0,tr+1), (-1,tr+1), LIGHT_BLUE),
            ('FONTNAME',   (0,tr+1), (-1,tr+1), 'Helvetica-Bold'),
            ('TEXTCOLOR',  (0,tr+1), (-1,tr+1), DARK_BLUE),
            ('LINEBELOW',  (0,tr+1), (-1,tr+1), 1.5, DARK_BLUE),
        ]
        ct.setStyle(TableStyle(sty))
        story.append(ct)

    # ── 3. Balance Averages ───────────────────────────────────────────────────
    story += [Spacer(1, 8), _section('3. Average Bank Balance Position (₹)')]
    balance_averages       = summary_data.get('balance_averages', {})
    grand_balance_averages = summary_data.get('grand_balance_averages', {})

    for bank, months_data in balance_averages.items():
        story.append(Paragraph(f'<b>{bank}</b>',
                               ParagraphStyle('bk', fontSize=9, textColor=MED_BLUE, leading=12, spaceAfter=3)))
        brows = [['Month', '1st', '8th', '17th', '25th', 'Monthly Avg.']]
        for month, v in months_data.items():
            brows.append([month, _inr(v.get('day_1')), _inr(v.get('day_8')),
                          _inr(v.get('day_17')), _inr(v.get('day_25')), _inr(v.get('monthly_avg'))])
        brows.append(['Grand Average Balance', '', '', '', '', _inr(grand_balance_averages.get(bank))])

        bt = Table(brows, colWidths=['20%','13%','13%','13%','13%','15%'], repeatRows=1)
        bsty = [
            ('FONTSIZE',   (0,0), (-1,-1), 8),
            ('FONTNAME',   (0,0), (-1,0),  'Helvetica-Bold'),
            ('BACKGROUND', (0,0), (-1,0),  DARK_BLUE),
            ('TEXTCOLOR',  (0,0), (-1,0),  colors.white),
            ('ALIGN',      (0,0), (-1,-1), 'RIGHT'),
            ('ALIGN',      (0,0), (0,-1),  'LEFT'),
            ('GRID',       (0,0), (-1,-1), 0.5, BORDER),
            ('PADDING',    (0,0), (-1,-1), 4),
            ('BACKGROUND', (0,-1),(-1,-1), DARK_BLUE),
            ('TEXTCOLOR',  (0,-1),(-1,-1), colors.white),
            ('FONTNAME',   (0,-1),(-1,-1), 'Helvetica-Bold'),
            ('SPAN',       (0,-1),(4,-1)),
        ]
        for i in range(1, len(months_data)+1):
            if i % 2 == 0:
                bsty.append(('BACKGROUND', (0,i), (-1,i), ROW_ALT))
        bt.setStyle(TableStyle(bsty))
        story += [bt, Spacer(1, 6)]

    # ── 4. Notes ──────────────────────────────────────────────────────────────
    notes = summary_data.get('notes', [])
    if notes:
        story += [Spacer(1, 4), _section('4. Supporting Notes')]
        for note in notes:
            story.append(Paragraph(f'◆  {note}',
                                   ParagraphStyle('note', fontSize=9, leftIndent=10,
                                                  textColor=GREY_TEXT, leading=14)))

    # ── 5. AI Flags ───────────────────────────────────────────────────────────
    ai_flags = summary_data.get('ai_flags', [])
    if ai_flags:
        story += [Spacer(1, 4), _section('5. AI Confidence Flags — Manual Review Required')]
        for flag in ai_flags:
            story.append(Paragraph(
                f'<b>⚠ {flag.get("field","")} — {str(flag.get("severity","")).upper()}</b><br/>'
                f'{flag.get("message","")} (Confidence: {_pct(flag.get("confidence"))})',
                ParagraphStyle('flag', fontSize=9, leading=13, backColor=AMBER_BG,
                               borderColor=AMBER, borderWidth=1, borderPadding=6, spaceAfter=4)))

    # ── Footer ────────────────────────────────────────────────────────────────
    story += [Spacer(1, 10), HRFlowable(width='100%', thickness=1.5, color=DARK_BLUE), Spacer(1, 6)]
    ft = Table([[
        Paragraph(f'<b>Prepared by (Appraiser)</b><br/>{document_meta.get("appraiser_name","")}'
                  '<br/>______________________________',
                  ParagraphStyle('fp', fontSize=9, leading=14)),
        Paragraph(f'<b>Date</b><br/>{generated_at.split(",")[0]}'
                  '<br/>______________________________',
                  ParagraphStyle('fp', fontSize=9, leading=14)),
        Paragraph('<b>Reviewed by</b><br/>&nbsp;<br/>______________________________',
                  ParagraphStyle('fp', fontSize=9, leading=14)),
        Paragraph(f'Generated by LoanDocs AI · {document_meta.get("loan_reference","")}<br/>'
                  'Confidential — Internal Use Only<br/>All figures in Indian Rupees (₹)',
                  ParagraphStyle('stamp', fontSize=8, textColor=STAMP_TEXT,
                                 alignment=TA_RIGHT, leading=12)),
    ]], colWidths=['25%', '20%', '25%', '30%'])
    ft.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('FONTSIZE', (0,0), (-1,-1), 9)]))
    story.append(ft)

    doc.build(story)
    return output_path


def _section(title: str) -> Paragraph:
    return Paragraph(title, ParagraphStyle(
        'sec', fontSize=9, fontName='Helvetica-Bold', textColor=MED_BLUE,
        leading=14, spaceAfter=4, borderPadding=(0,0,3,0),
        borderWidth=0, borderColor=BORDER,
    ))

def _inr(v):
    if v is None: return '—'
    try:
        n = int(float(v))
        if n < 0: return f'-{_inr(-n)}'
        s = str(n); r = s[-3:]; s = s[:-3]
        while s: r = s[-2:] + ',' + r; s = s[:-2]
        return r.lstrip(',')
    except: return str(v)

def _pct(v):
    if v is None: return '—'
    try: return f'{float(v)*100:.0f}%'
    except: return str(v)
