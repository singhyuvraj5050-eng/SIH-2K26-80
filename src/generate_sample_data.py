import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path

# Setup directories
data_dir = Path("data/raw")
data_dir.mkdir(parents=True, exist_ok=True)

print("Generating synthetic Indian Monsoon dataset (NWP + Observations)...")

# Indian Domain Coordinates (0.25 degree resolution)
lats = np.arange(6.5, 38.5, 0.25)
lons = np.arange(68.5, 98.5, 0.25)
dates = pd.date_range("2023-06-01", "2023-09-30", freq="D")  # Monsoon season

n_times, n_lats, n_lons = len(dates), len(lats), len(lons)
np.random.seed(42)

# 1. Ground Truth Observations (IMD style gridded daily rainfall in mm)
obs_rain = np.random.gamma(shape=1.2, scale=12.0, size=(n_times, n_lats, n_lons))
obs_rain[obs_rain < 2.5] = 0.0

# 2. Raw NWP Forecast with systematic biases
nwp_rain = obs_rain * 0.85 + np.random.normal(loc=2.0, scale=3.0, size=(n_times, n_lats, n_lons))
nwp_rain = np.clip(nwp_rain, 0, None)

# 3. Large-Scale Atmospheric Fields (used for Regime Classification)
mslp = 1005.0 + np.random.normal(0, 4.0, size=(n_times, n_lats, n_lons))
u850 = 12.0 + np.random.normal(0, 5.0, size=(n_times, n_lats, n_lons))
v850 = 4.0 + np.random.normal(0, 3.0, size=(n_times, n_lats, n_lons))

# Create IMD Observation Dataset
ds_obs = xr.Dataset(
    data_vars={"rainfall": (["time", "lat", "lon"], obs_rain.astype(np.float32))},
    coords={"time": dates, "lat": lats, "lon": lons}
)
ds_obs.to_netcdf(data_dir / "imd_rainfall_obs.nc")

# Create NWP Forecast Dataset
ds_nwp = xr.Dataset(
    data_vars={
        "total_precipitation": (["time", "lat", "lon"], nwp_rain.astype(np.float32)),
        "mslp": (["time", "lat", "lon"], mslp.astype(np.float32)),
        "u850": (["time", "lat", "lon"], u850.astype(np.float32)),
        "v850": (["time", "lat", "lon"], v850.astype(np.float32)),
    },
    coords={"time": dates, "lat": lats, "lon": lons}
)
ds_nwp.to_netcdf(data_dir / "nwp_forecast_raw.nc")

print("Generated data/raw/imd_rainfall_obs.nc and data/raw/nwp_forecast_raw.nc")