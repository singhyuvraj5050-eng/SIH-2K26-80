from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import xarray as xr
import pandas as pd
from pathlib import Path
import numpy as np

app = FastAPI(
    title="MoES Monsoon AI Post-Processing API",
    description="REST API for regime-aware bias-corrected rainfall forecasts (SIH 26080)",
    version="1.0.0"
)

# Enable CORS for local testing and web frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File paths
DATA_PATH = Path("data/processed/corrected_rainfall.nc")
REGIME_PATH = Path("data/processed/daily_regimes.csv")

if not DATA_PATH.exists():
    raise RuntimeError("Processed data file missing. Run src/bias_correction.py first.")

ds = xr.open_dataset(DATA_PATH)
df_regimes = pd.read_csv(REGIME_PATH)
df_regimes["time"] = pd.to_datetime(df_regimes["time"]).dt.strftime("%Y-%m-%d")

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "Regime-Aware AI Post-Processing Engine",
        "spatial_coverage": "Indian Subcontinent (0.25 deg resolution)"
    }

@app.get("/forecast")
def get_forecast(
    date: str = Query(..., description="Forecast date (YYYY-MM-DD)", example="2023-06-01"),
    lat: float = Query(..., ge=6.5, le=38.5, description="Latitude (6.5 to 38.5)"),
    lon: float = Query(..., ge=68.5, le=98.5, description="Longitude (68.5 to 98.5)")
):
    """Retrieve raw vs. AI-corrected rainfall at a specific coordinate and date."""
    available_dates = pd.to_datetime(ds["time"].values).strftime("%Y-%m-%d")
    
    if date not in available_dates.values:
        raise HTTPException(status_code=404, detail=f"Date {date} not found in forecast dataset.")
    
    # Extract synoptic regime information
    regime_row = df_regimes[df_regimes["time"] == date]
    regime_name = regime_row["regime_name"].values[0] if not regime_row.empty else "Unknown"

    # Nearest-neighbor coordinate lookup
    point_data = ds.sel(time=date, lat=lat, lon=lon, method="nearest")
    
    raw_val = float(point_data["raw_rainfall"].values)
    corr_val = float(point_data["corrected_rainfall"].values)
    obs_val = float(point_data["observed_rainfall"].values)

    return {
        "query": {
            "date": date,
            "requested_lat": lat,
            "requested_lon": lon
        },
        "nearest_grid": {
            "lat": float(point_data["lat"].values),
            "lon": float(point_data["lon"].values)
        },
        "synoptic_regime": regime_name,
        "rainfall_mm": {
            "raw_nwp": round(raw_val, 2),
            "ai_corrected": round(corr_val, 2),
            "observed_actual": round(obs_val, 2)
        },
        "bias_adjustment_applied": round(corr_val - raw_val, 2)
    }