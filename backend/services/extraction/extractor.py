import csv as _csv
from pathlib import Path
import pdfplumber
import openpyxl

SUPPORTED = {".pdf", ".csv", ".xlsx", ".xls"}

def extract(file_path: str) -> dict:
    path = Path(file_path)
    ext = path.suffix.lower()
    if ext not in SUPPORTED:
        raise ValueError(f"Unsupported file type: {ext}")
    if ext == ".pdf":
        return _pdf(path)
    elif ext == ".csv":
        return _csv_file(path)
    return _excel(path)

def _pdf(path):
    texts, tables = [], []
    with pdfplumber.open(str(path)) as pdf:
        pages = len(pdf.pages)
        for page in pdf.pages:
            t = page.extract_text() or ""
            texts.append(t)
            for tbl in (page.extract_tables() or []):
                tables.extend(tbl)
    return {"text": "\n".join(texts), "tables": tables, "format": "pdf", "page_count": pages}

def _csv_file(path):
    with open(str(path), newline="", encoding="utf-8-sig") as f:
        rows = list(_csv.reader(f))
    text = "\n".join("\t".join(r) for r in rows)
    return {"text": text, "tables": rows, "format": "csv", "page_count": 1}

def _excel(path):
    wb = openpyxl.load_workbook(str(path), read_only=True, data_only=True)
    ws = wb.active
    rows = [[str(c.value) if c.value is not None else "" for c in row] for row in ws.iter_rows()]
    wb.close()
    text = "\n".join("\t".join(r) for r in rows)
    return {"text": text, "tables": rows, "format": "xlsx", "page_count": 1}
