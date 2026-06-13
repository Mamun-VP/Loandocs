from pathlib import Path
import pdfplumber
import pandas as pd

SUPPORTED = {".pdf", ".csv", ".xlsx", ".xls"}

def extract(file_path: str) -> dict:
    path = Path(file_path)
    ext = path.suffix.lower()
    if ext not in SUPPORTED:
        raise ValueError(f"Unsupported file type: {ext}")
    if ext == ".pdf":
        return _pdf(path)
    elif ext == ".csv":
        return _csv(path)
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

def _csv(path):
    df = pd.read_csv(str(path), dtype=str, keep_default_na=False)
    return {"text": df.to_string(index=False), "tables": [df.columns.tolist()] + df.values.tolist(), "format": "csv", "page_count": 1}

def _excel(path):
    df = pd.read_excel(str(path), dtype=str, keep_default_na=False)
    return {"text": df.to_string(index=False), "tables": [df.columns.tolist()] + df.values.tolist(), "format": "xlsx", "page_count": 1}
