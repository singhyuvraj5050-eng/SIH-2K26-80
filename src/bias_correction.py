# Regime-aware rainfall bias correction models
import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path
from xgboost import XGBRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error
import joblib

# Paths
obs_path = Path("data/raw/imd_rainfall_obs.nc")
nwp_path = Path("data/raw/nwp_forecast_raw.nc")
regimes_path = Path("data/processed/daily_regimes.csv")
output_dir = Path("data/processed")
model_dir = Path("models/bias_corrector")
model_dir.mkdir(parents=True, exist_ok=True)

print("Loading observation, forecast, and regime datasets...")
ds_obs = xr.open_dataset(obs_path)
ds_nwp = xr.open_dataset(nwp_path)
df_regimes = pd.read_csv(regimes_path)

# Extract aligned arrays
obs_rain = ds_obs["rainfall"].values          # (time, lat, lon)
nwp_rain = ds_nwp["total_precipitation"].values
mslp = ds_nwp["mslp"].values
u850 = ds_nwp["u850"].values
v850 = ds_nwp["v850"].values

n_times, n_lats, n_lons = nwp_rain.shape
lats, lons = ds_nwp["lat"].values, ds_nwp["lon"].values

# Meshgrid coordinates for spatial features
lon_grid, lat_grid = np.meshgrid(lons, lats)
lat_feature = np.tile(lat_grid, (n_times, 1, 1))
lon_feature = np.tile(lon_grid, (n_times, 1, 1))

# Broadcast daily regime labels to 3D grid
regime_map = df_regimes["regime_id"].values[:, None, None]
regime_feature = np.broadcast_to(regime_map, (n_times, n_lats, n_lons))

# Build training tabular matrices
print("Flattening spatial grid into feature matrix...")
X = np.column_stack([
    nwp_rain.ravel(),
    regime_feature.ravel(),
    lat_feature.ravel(),
    lon_feature.ravel(),
    mslp.ravel(),
    u850.ravel(),
    v850.ravel()
])
y = obs_rain.ravel()

# Temporal train/test split (First 80% days for training, last 20% for testing)
split_idx = int(0.8 * n_times) * n_lats * n_lons
X_train, X_test = X[:split_idx], X[split_idx:]
y_train, y_test = y[:split_idx], y[split_idx:]
raw_test_pred = X_test[:, 0]  # Raw NWP output for comparison

print(f"Training samples: {len(X_train):,}, Evaluation samples: {len(X_test):,}")

# Train Regime-Aware XGBoost Model
print("Training Regime-Aware XGBoost Bias Corrector...")
model = XGBRegressor(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.08,
    n_jobs=-1,
    random_state=42
)
model.fit(X_train, y_train)

# Predict and clip negative rainfall values
corrected_test = np.clip(model.predict(X_test), 0, None)

# Evaluate performance metrics
raw_rmse = np.sqrt(mean_squared_error(y_test, raw_test_pred))
corr_rmse = np.sqrt(mean_squared_error(y_test, corrected_test))
raw_mae = mean_absolute_error(y_test, raw_test_pred)
corr_mae = mean_absolute_error(y_test, corrected_test)

print("\n--- MODEL PERFORMANCE ON UNSEEN MONSOON DAYS ---")
print(f"Raw NWP Forecast   -> RMSE: {raw_rmse:.3f} mm, MAE: {raw_mae:.3f} mm")
print(f"AI Post-Processed  -> RMSE: {corr_rmse:.3f} mm, MAE: {corr_mae:.3f} mm")
print(f"Error Reduction: {((raw_rmse - corr_rmse) / raw_rmse) * 100:.2f}%\n")

# Save full corrected grid to NetCDF
print("Reconstructing full bias-corrected grid...")
full_corrected = np.clip(model.predict(X), 0, None).reshape(n_times, n_lats, n_lons)

ds_corrected = xr.Dataset(
    data_vars={
        "corrected_rainfall": (["time", "lat", "lon"], full_corrected.astype(np.float32)),
        "raw_rainfall": (["time", "lat", "lon"], nwp_rain.astype(np.float32)),
        "observed_rainfall": (["time", "lat", "lon"], obs_rain.astype(np.float32))
    },
    coords={"time": ds_nwp["time"], "lat": lats, "lon": lons}
)
ds_corrected.to_netcdf(output_dir / "corrected_rainfall.nc")

# Save model weights
joblib.dump(model, model_dir / "regime_xgb_corrector.pkl")
print(f"Saved model to: {model_dir / 'regime_xgb_corrector.pkl'}")
print(f"Saved corrected dataset to: {output_dir / 'corrected_rainfall.nc'}")