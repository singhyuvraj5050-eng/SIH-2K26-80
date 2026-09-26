# Skill scores: RMSE, POD, FAR, CSI, ETS, FSS
import numpy as np
import xarray as xr
import pandas as pd
from pathlib import Path

def calculate_contingency_table(obs, pred, threshold):
    """Calculates Hits, False Alarms, Misses, and Correct Negatives."""
    obs_event = obs >= threshold
    pred_event = pred >= threshold
    
    hits = np.sum(obs_event & pred_event)
    false_alarms = np.sum((~obs_event) & pred_event)
    misses = np.sum(obs_event & (~pred_event))
    correct_negatives = np.sum((~obs_event) & (~pred_event))
    
    return hits, false_alarms, misses, correct_negatives

def compute_skill_scores(obs, pred, thresholds):
    """Computes POD, FAR, and CSI for given rainfall thresholds (mm)."""
    results = []
    for t in thresholds:
        h, fa, m, cn = calculate_contingency_table(obs, pred, t)
        
        pod = h / (h + m) if (h + m) > 0 else 0.0
        far = fa / (h + fa) if (h + fa) > 0 else 0.0
        csi = h / (h + m + fa) if (h + m + fa) > 0 else 0.0
        
        results.append({"Threshold (mm)": t, "POD": pod, "FAR": far, "CSI": csi})
        
    return pd.DataFrame(results)

if __name__ == "__main__":
    data_path = Path("data/processed/corrected_rainfall.nc")
    
    if data_path.exists():
        print("Calculating Categorical Skill Scores...")
        ds = xr.open_dataset(data_path)
        
        # Flatten spatial dimensions for global metric evaluation
        obs = ds["observed_rainfall"].values.ravel()
        raw = ds["raw_rainfall"].values.ravel()
        corr = ds["corrected_rainfall"].values.ravel()
        
        # IMD Thresholds: Light (2.5mm), Moderate (15.5mm), Heavy (64.5mm)
        thresholds = [2.5, 15.5, 64.5]
        
        print("\n--- Raw NWP Forecast Skill ---")
        print(compute_skill_scores(obs, raw, thresholds).to_string(index=False))
        
        print("\n--- AI Post-Processed Forecast Skill ---")
        print(compute_skill_scores(obs, corr, thresholds).to_string(index=False))
    else:
        print("Processed data not found. Run bias_correction.py first.")