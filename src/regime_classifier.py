import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
import joblib

# Paths
raw_nwp_path = Path("data/raw/nwp_forecast_raw.nc")
processed_dir = Path("data/processed")
model_dir = Path("models/regime_classifier")
processed_dir.mkdir(parents=True, exist_ok=True)
model_dir.mkdir(parents=True, exist_ok=True)

print("Loading NWP forecast atmospheric fields for regime classification...")
ds = xr.open_dataset(raw_nwp_path)

# Extract synoptic variables
mslp = ds["mslp"].values  # Shape: (time, lat, lon)
u850 = ds["u850"].values
v850 = ds["v850"].values
n_times = len(ds["time"])

# Flatten spatial dimensions per time step: (time, lat * lon)
X_mslp = mslp.reshape(n_times, -1)
X_u850 = u850.reshape(n_times, -1)
X_v850 = v850.reshape(n_times, -1)

# Standardize and concatenate features across synoptic variables
X_combined = np.hstack([
    (X_mslp - X_mslp.mean()) / X_mslp.std(),
    (X_u850 - X_u850.mean()) / X_u850.std(),
    (X_v850 - X_v850.mean()) / X_v850.std(),
])

# Reduce dimensionality using PCA to capture primary atmospheric variance
print("Fitting PCA on large-scale wind and pressure patterns...")
pca = PCA(n_components=10, random_state=42)
X_pca = pca.fit_transform(X_combined)

# Cluster into 4 Synoptic Weather Regimes
print("Clustering synoptic patterns into 4 weather regimes...")
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
regime_labels = kmeans.fit_predict(X_pca)

# Regime mapping dictionary
regime_names = {
    0: "Active Monsoon",
    1: "Break Monsoon",
    2: "Monsoon Depression / Low",
    3: "Normal / Transitional"
}

# Save regime labels aligned with time dimension
df_regimes = pd.DataFrame({
    "time": ds["time"].values,
    "regime_id": regime_labels,
    "regime_name": [regime_names[i] for i in regime_labels]
})
df_regimes.to_csv(processed_dir / "daily_regimes.csv", index=False)

# Save trained classification pipeline
joblib.dump({"pca": pca, "kmeans": kmeans, "regime_names": regime_names}, model_dir / "regime_pipeline.pkl")

print(f"Classification completed successfully!")
print(f"Regime distribution:\n{df_regimes['regime_name'].value_counts().to_string()}")
print(f"Saved regime labels to: {processed_dir / 'daily_regimes.csv'}")