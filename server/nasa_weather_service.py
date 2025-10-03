"""
NASA Weather Data Service for UAE/India Cities
- Fetches historical/NRT data from NASA POWER
- Fetches 5-day forecast from NASA GEOS-CF via Google Earth Engine
- Computes temperature trends
"""
import datetime
import json
from typing import Dict, Any

# For NASA POWER API
import requests

# For Google Earth Engine (GEE)
import ee

# City to coordinates mapping
CITY_COORDS = {
    "Dubai": {"lat": 25.276987, "lon": 55.296249},
    "Abu Dhabi": {"lat": 24.453884, "lon": 54.3773438},
    "Mumbai": {"lat": 19.07609, "lon": 72.877426},
    "Delhi": {"lat": 28.613939, "lon": 77.209021}
}

# NASA POWER API endpoints
POWER_BASE = "https://power.larc.nasa.gov/api/temporal/"

# Helper: fetch NASA POWER data (hourly/daily)
def fetch_power_data(lat, lon, start, end, temporal="hourly"):
    params = {
        "latitude": lat,
        "longitude": lon,
        "start": start,
        "end": end,
        "community": "RE",
        "parameters": "T2M",
        "format": "JSON"
    }
    url = f"{POWER_BASE}{temporal}"  # e.g. .../hourly
    try:
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        return data["properties"]["parameter"]["T2M"]
    except Exception as e:
        return {"error": f"POWER API error: {e}"}

# Helper: fetch GEOS-CF forecast from GEE
def fetch_geoscf_forecast(lat, lon):
    try:
        # GEOS-CF hourly forecast: 'NOAA/GEOS-CF/v1/forecast'
        # Variable: 'T2M' (2m air temp, K)
        point = ee.Geometry.Point([lon, lat])
        now = ee.Date(datetime.datetime.utcnow())
        # 5 days ahead, hourly
        end = now.advance(5, 'day')
        collection = ee.ImageCollection('NOAA/GEOS-CF/v1/forecast') \
            .filterDate(now, end)
        # Reduce to point, get hourly
        def extract(img):
            val = img.reduceRegion(ee.Reducer.mean(), point, 20000).get('T2M')
            time = img.date().format('YYYY-MM-ddTHH:mm:ss')
            return ee.Feature(None, {'T2M': val, 'datetime': time})
        feats = collection.map(extract).filter(ee.Filter.notNull(['T2M']))
        # Get as list
        feat_list = feats.toList(feats.size())
        vals = ee.List(feat_list).getInfo()
        # Convert K to C
        hourly = [
            {"datetime": v["properties"]["datetime"], "T2M": round(v["properties"]["T2M"] - 273.15, 2)}
            for v in vals if v["properties"]["T2M"] is not None
        ]
        return hourly
    except Exception as e:
        return {"error": f"GEOS-CF GEE error: {e}"}

# Convert hourly forecast to daily averages
def hourly_to_daily(hourly):
    from collections import defaultdict
    daily = defaultdict(list)
    for h in hourly:
        day = h["datetime"][:10]
        daily[day].append(h["T2M"])
    return [
        {"date": d, "T2M": round(sum(ts)/len(ts), 2)}
        for d, ts in sorted(daily.items())
    ]

# Compute trend: next 3 days vs previous 3 days
def compute_trend(daily):
    if len(daily) < 6:
        return "insufficient data"
    prev = sum(d["T2M"] for d in daily[:3]) / 3
    next_ = sum(d["T2M"] for d in daily[3:6]) / 3
    if next_ - prev > 0.5:
        return "rising"
    elif prev - next_ > 0.5:
        return "falling"
    else:
        return "stable"

# Main API function
def get_city_weather(city: str) -> Dict[str, Any]:
    if city not in CITY_COORDS:
        return {"error": "City not supported"}
    coords = CITY_COORDS[city]
    lat, lon = coords["lat"], coords["lon"]
    today = datetime.datetime.utcnow().date()
    start = (today - datetime.timedelta(days=7)).strftime("%Y%m%d")
    end = today.strftime("%Y%m%d")
    # POWER data
    power_daily = fetch_power_data(lat, lon, start, end, temporal="daily")
    power_hourly = fetch_power_data(lat, lon, start, end, temporal="hourly")
    # GEE init
    try:
        ee.Initialize()
    except Exception:
        try:
            ee.Initialize(opt_auth_mode='notebook')
        except Exception as e:
            return {"error": f"GEE init failed: {e}"}
    geoscf_hourly = fetch_geoscf_forecast(lat, lon)
    if isinstance(geoscf_hourly, dict) and "error" in geoscf_hourly:
        geoscf_daily = geoscf_hourly
        trend = "no forecast"
    else:
        geoscf_daily = hourly_to_daily(geoscf_hourly)
        trend = compute_trend(geoscf_daily)
    return {
        "city": city,
        "coords": coords,
        "power": {"daily": power_daily, "hourly": power_hourly},
        "geoscf_forecast": {"hourly": geoscf_hourly, "daily": geoscf_daily},
        "trend": trend
    }

# If run as script: test for Dubai/Mumbai
def main():
    for city in ["Dubai", "Mumbai"]:
        print(json.dumps(get_city_weather(city), indent=2))

if __name__ == "__main__":
    main()
