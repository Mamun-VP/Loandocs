def compute_aggregates(ai_data: dict) -> dict:
    mc = ai_data.get("monthly_credits", [])
    bs = ai_data.get("balance_snapshots", [])
    ai_data["credit_totals"] = _credit_totals(mc)
    ai_data["credit_averages"] = _credit_averages(mc)
    ai_data["balance_averages"] = _balance_averages(bs)
    ai_data["grand_balance_averages"] = _grand_avgs(ai_data["balance_averages"])
    return ai_data

def _safe(v):
    if v is None: return 0.0
    try: return float(str(v).replace(",","").replace("₹","").strip())
    except: return 0.0

def _credit_totals(credits):
    t = {}
    for r in credits:
        b = r.get("bank_name","unknown")
        t.setdefault(b, {"applicant":0.0,"co_applicant":0.0,"one_time_excluded":0.0})
        if r.get("is_one_time"):
            t[b]["one_time_excluded"] += _safe(r.get("applicant_amount"))
        else:
            t[b]["applicant"] += _safe(r.get("applicant_amount"))
            t[b]["co_applicant"] += _safe(r.get("co_applicant_amount"))
    return t

def _credit_averages(credits):
    sums, counts = {}, {}
    for r in credits:
        if r.get("is_one_time"): continue
        b = r.get("bank_name","unknown")
        sums.setdefault(b, {"applicant":0.0,"co_applicant":0.0})
        counts.setdefault(b, 0)
        sums[b]["applicant"] += _safe(r.get("applicant_amount"))
        sums[b]["co_applicant"] += _safe(r.get("co_applicant_amount"))
        counts[b] += 1
    return {b: {"applicant": round(s["applicant"]/(counts[b] or 1),2), "co_applicant": round(s["co_applicant"]/(counts[b] or 1),2), "months_count": counts[b]} for b,s in sums.items()}

def _balance_averages(snapshots):
    result = {}
    for r in snapshots:
        b = r.get("bank_name","unknown")
        m = r.get("month")
        vals = [_safe(r.get(f"day_{d}")) for d in (1,8,17,25) if r.get(f"day_{d}") is not None]
        avg = round(sum(vals)/len(vals),2) if vals else None
        result.setdefault(b,{})[m] = {"day_1":r.get("day_1"),"day_8":r.get("day_8"),"day_17":r.get("day_17"),"day_25":r.get("day_25"),"monthly_avg":avg}
    return result

def _grand_avgs(bal_avgs):
    return {b: round(sum(m["monthly_avg"] for m in months.values() if m["monthly_avg"] is not None) / max(1, sum(1 for m in months.values() if m["monthly_avg"] is not None)), 2) for b, months in bal_avgs.items()}
