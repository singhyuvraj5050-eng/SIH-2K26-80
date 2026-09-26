from fastapi import FastAPI
from fastapi.responses import JSONResponse
import random
from datetime import datetime

app = FastAPI(title="SIH Weather API", version="2.4.1")

# MLOps: Track model versioning
MODEL_VERSION = "v2.4.1"
LAST_TRAINED = "2023-09-24T02:00:00Z"

@app.get("/forecast")
def get_forecast(lat: float, lon: float, date: str):
    # Simulated confidence score
    ai_confidence = random.uniform(0.4, 0.9)
    
    # OPS: Fallback mode - if classifier is uncertain, default safely to raw NWP
    fallback_active = ai_confidence < 0.6
    
    raw_rainfall = 18.32
    ai_corrected = 14.59 if not fallback_active else raw_rainfall
    regime = "Break Monsoon" if not fallback_active else "Mixed/Uncertain (Fallback)"

    return {
        "lat": lat,
        "lon": lon,
        "synoptic_regime": regime,
        "rainfall_mm": {
            "raw_gfs": raw_rainfall,
            "ai_corrected": ai_corrected
        },
        "heavy_rain_probability": 84,
        "bias_adjustment_applied": round(ai_corrected - raw_rainfall, 2),
        "metrics": {"rmse": 4.12, "ets": 0.48, "csi": 0.55, "pod": 0.82, "far": 0.14, "fss": 0.76},
        "ml_addons": {
            "fallback_active": fallback_active, # Flag for frontend
            "model_version": MODEL_VERSION,
            "last_trained": LAST_TRAINED,
            "confidence": f"± {round(1.0 - ai_confidence, 2)}"
        }
    }

# INTEGRATION: GeoJSON/shapefile export for GIS tools
@app.get("/export/geojson")
def export_geojson(lat: float, lon: float):
    geojson_data = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "regime": "Break Monsoon",
                    "corrected_rainfall_mm": 14.59,
                    "heavy_rain_prob": 84
                }
            }
        ]
    }
    return JSONResponse(content=geojson_data)