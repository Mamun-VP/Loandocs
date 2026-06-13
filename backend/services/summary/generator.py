import os
from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader

TEMPLATES_DIR = Path(__file__).parent / "templates"

def generate_pdf(summary_data: dict, document_meta: dict, output_path: str) -> str:
    env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)), autoescape=True)
    env.filters["inr"] = _inr
    env.filters["pct"] = _pct
    template = env.get_template("bs_analysis.html")
    html = template.render(
        meta=document_meta,
        account_details=summary_data.get("account_details", []),
        monthly_credits=summary_data.get("monthly_credits", []),
        credit_totals=summary_data.get("credit_totals", {}),
        credit_averages=summary_data.get("credit_averages", {}),
        balance_averages=summary_data.get("balance_averages", {}),
        grand_balance_averages=summary_data.get("grand_balance_averages", {}),
        notes=summary_data.get("notes", []),
        ai_flags=summary_data.get("ai_flags", []),
        confidence=summary_data.get("confidence", {}),
        generated_at=datetime.now().strftime("%d %B %Y, %H:%M"),
    )
    os.makedirs(Path(output_path).parent, exist_ok=True)
    from xhtml2pdf import pisa
    html_with_page = f'<style>@page {{ size: A4 landscape; margin: 15mm; }}</style>{html}'
    with open(output_path, "wb") as pdf_file:
        pisa.CreatePDF(html_with_page, dest=pdf_file)
    return output_path

def _inr(v):
    if v is None: return "—"
    try:
        n = int(float(v))
        if n < 0: return f"-{_inr(-n)}"
        s = str(n); r = s[-3:]; s = s[:-3]
        while s: r = s[-2:] + "," + r; s = s[:-2]
        return r.lstrip(",")
    except: return str(v)

def _pct(v):
    if v is None: return "—"
    try: return f"{float(v)*100:.0f}%"
    except: return str(v)
