import json, urllib.request, datetime as dt

def get(url):
    with urllib.request.urlopen(url, timeout=20) as r:
        return json.load(r)

er = get("https://open.er-api.com/v6/latest/USD")
rates = {k: float(v) for k, v in er["rates"].items()}
updated = dt.datetime.fromtimestamp(er["time_last_update_unix"], dt.UTC)
sources = ["open.er-api.com"]

try:
    fr = get("https://api.frankfurter.dev/v1/latest?base=USD")
    # ECB reference rates are published around 14:00-15:00 UTC on their date
    ecb_time = dt.datetime.fromisoformat(fr["date"] + "T15:00:00+00:00")
    if ecb_time > updated:
        for k, v in fr["rates"].items():
            rates[k] = float(v)
        updated = ecb_time
        sources.append("BCE via frankfurter.dev")
except Exception:
    pass

rates["USD"] = 1.0
doc = {"base": "USD", "rates": rates,
       "updated": updated.strftime("%Y-%m-%dT%H:%M:%SZ"),
       "source": " + ".join(sources)}
with open("rates.json", "w") as f:
    json.dump(doc, f, separators=(",", ":"))
print(doc["updated"], doc["source"])
