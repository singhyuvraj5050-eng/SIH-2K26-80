# Streamlit interactive forecast dashboard
import streamlit as st
import xarray as xr
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

# Configure page layout
st.set_page_config(page_title="Monsoon AI Post-Processing", layout="wide")

st.title("Regime-Aware AI Post-Processing of Monsoon Rainfall")
st.markdown("**Problem Statement ID: 26080 | MoES / NCMRWF**")

# Load processed datasets and cache them for performance
@st.cache_data
def load_data():
    data_path = Path("data/processed/corrected_rainfall.nc")
    regime_path = Path("data/processed/daily_regimes.csv")
    
    if not data_path.exists():
        return None, None
        
    ds = xr.open_dataset(data_path)
    df_regimes = pd.read_csv(regime_path)
    return ds, df_regimes

ds, df_regimes = load_data()

if ds is None:
    st.error("Processed data not found. Please run src/bias_correction.py first.")
    st.stop()

# Sidebar UI
st.sidebar.header("Forecast Controls")
time_options = pd.to_datetime(ds["time"].values).strftime('%Y-%m-%d').tolist()
selected_date = st.sidebar.selectbox("Select Forecast Date:", time_options)
idx = time_options.index(selected_date)

# Extract spatial grids for the selected day
day_data = ds.isel(time=idx)
day_regime = df_regimes.iloc[idx]["regime_name"]

st.sidebar.markdown("---")
st.sidebar.markdown(f"### Active Synoptic Regime:\n**🌤️ {day_regime}**")

# Extract NumPy arrays for plotting and metric calculations
obs = day_data["observed_rainfall"].values
raw = day_data["raw_rainfall"].values
corr = day_data["corrected_rainfall"].values

# Calculate daily spatial RMSE
raw_rmse = np.sqrt(np.mean((obs - raw)**2))
corr_rmse = np.sqrt(np.mean((obs - corr)**2))
improvement = ((raw_rmse - corr_rmse) / raw_rmse) * 100

# Metric Cards
col1, col2, col3 = st.columns(3)
col1.metric("Raw NWP RMSE", f"{raw_rmse:.2f} mm")
col2.metric("AI Corrected RMSE", f"{corr_rmse:.2f} mm", f"-{improvement:.1f}%")
col3.metric("Max Observed Rainfall", f"{obs.max():.1f} mm")

# Matplotlib Figure displaying the spatial maps
st.subheader("Spatial Rainfall Distribution (mm/day)")
fig, axes = plt.subplots(1, 3, figsize=(18, 5))
vmax = max(obs.max(), raw.max(), corr.max())  # Align color scales

# Raw NWP
im0 = axes[0].imshow(raw, cmap="Blues", origin="lower", vmin=0, vmax=vmax)
axes[0].set_title("Raw NWP Forecast")

# AI Corrected
im1 = axes[1].imshow(corr, cmap="Blues", origin="lower", vmin=0, vmax=vmax)
axes[1].set_title("AI Post-Processed Forecast")

# Ground Truth
im2 = axes[2].imshow(obs, cmap="Blues", origin="lower", vmin=0, vmax=vmax)
axes[2].set_title("IMD Observation (Ground Truth)")

for ax in axes:
    ax.axis("off")

# Render Matplotlib figure in Streamlit
st.pyplot(fig, clear_figure=True)