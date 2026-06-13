import json, re
from config import settings

SYSTEM_PROMPT = """You are a financial data analyst specialising in bank statement processing for loan assessment.
Extract ONLY factual data — never infer or invent figures.
Return a single valid JSON object with NO markdown fences, NO commentary.
All monetary amounts must be plain numbers without commas or currency symbols.
If a value cannot be determined, use null."""

EXTRACTION_PROMPT = '''Analyse the bank statement text and return EXACTLY this JSON structure:

{
  "account_details": [
    {
      "bank_name": "string",
      "account_number_masked": "string (last 4 digits only, e.g. XXXX 4821)",
      "account_type": "string",
      "applicant_name": "string",
      "co_applicant_name": "string or null",
      "statement_period_from": "YYYY-MM-DD or null",
      "statement_period_to": "YYYY-MM-DD or null"
    }
  ],
  "monthly_credits": [
    {
      "month": "MMM YYYY",
      "applicant_amount": 0,
      "co_applicant_amount": null,
      "bank_name": "string",
      "remarks": "string or null",
      "remarks_confidence": 0.95,
      "is_one_time": false
    }
  ],
  "balance_snapshots": [
    {
      "month": "MMM YYYY",
      "bank_name": "string",
      "day_1": null,
      "day_8": null,
      "day_17": null,
      "day_25": null
    }
  ],
  "notes": ["string"],
  "ai_flags": [
    {
      "field": "string",
      "message": "string",
      "confidence": 0.85,
      "severity": "low"
    }
  ],
  "confidence": {
    "income_classification": 0.95,
    "balance_extraction": 0.98,
    "remarks_classification": 0.87
  }
}

BANK STATEMENT TEXT:
{text}'''

def analyse(extracted_data: dict) -> dict:
    text = extracted_data.get("text", "")
    if not text.strip():
        raise ValueError("No text content to analyse")
    prompt = EXTRACTION_PROMPT.replace("{text}", text[:120000])
    provider = settings.AI_PROVIDER
    if provider == "anthropic":
        raw = _call_anthropic(prompt)
    elif provider == "gemini":
        raw = _call_gemini(prompt)
    elif provider == "ollama":
        raw = _call_ollama(prompt)
    else:
        raw = _call_openai(prompt)
    return _validate(raw)

def _call_anthropic(prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    msg = client.messages.create(model=settings.AI_MODEL_ANTHROPIC, max_tokens=settings.AI_MAX_TOKENS,
        system=SYSTEM_PROMPT, messages=[{"role": "user", "content": prompt}])
    return msg.content[0].text

def _call_openai(prompt: str) -> str:
    import openai
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    r = client.chat.completions.create(model=settings.AI_MODEL_OPENAI, max_tokens=settings.AI_MAX_TOKENS,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}],
        response_format={"type": "json_object"})
    return r.choices[0].message.content

def _call_gemini(prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name=settings.AI_MODEL_GEMINI,
        system_instruction=SYSTEM_PROMPT,
    )
    response = model.generate_content(prompt)
    return response.text

def _call_ollama(prompt: str) -> str:
    import urllib.request, json as _json
    payload = _json.dumps({"model": settings.AI_MODEL_OLLAMA, "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}", "stream": False}).encode()
    req = urllib.request.Request(f"{settings.OLLAMA_BASE_URL}/api/generate", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return _json.loads(r.read())["response"]

def _validate(raw: str) -> dict:
    clean = re.sub(r"```(?:json)?|```", "", raw).strip()
    try:
        data = json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {e}")
    conf = data.setdefault("confidence", {})
    for k in ("income_classification", "balance_extraction", "remarks_classification"):
        conf.setdefault(k, 0.0)
    flags = data.setdefault("ai_flags", [])
    threshold = settings.AI_CONFIDENCE_THRESHOLD
    for c in data.get("monthly_credits", []):
        rc = c.get("remarks_confidence", 1.0)
        if rc is not None and rc < threshold and c.get("remarks"):
            flags.append({"field": f"remarks:{c.get('month')}", "message": f"Remark '{c['remarks']}' has {rc:.0%} confidence — verify manually.", "confidence": rc, "severity": "medium" if rc > 0.7 else "high"})
    return data
