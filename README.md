# Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts

Problem Statement ID: 26080
Organization: MoES / NCMRWF


# Regime-Aware AI Post-Processing of Monsoon Rainfall Forecasts

**Problem Statement ID:** 26080  
**Organization:** Ministry of Earth Sciences (MoES) / NCMRWF  

## Overview
This project provides an end-to-end AI pipeline to correct systematic biases in Numerical Weather Prediction (NWP) rainfall forecasts over the Indian Monsoon region. It uses a **Regime-Conditioned XGBoost Regressor** to adjust rainfall predictions dynamically based on large-scale synoptic atmospheric states (Active, Break, and Depression regimes).

## Core Features
- **Data Pipeline:** Synthetic NWP and IMD observation generation for rapid testing.
- **Regime Classifier:** PCA + K-Means clustering on $850\text{ hPa}$ winds and MSLP.
- **Bias Corrector:** XGBoost model conditioned on spatial coordinates and synoptic weather regimes.
- **Evaluation:** Calculates IMD categorical skill scores (POD, FAR, CSI).
- **Dashboard:** Interactive Streamlit UI for visual spatial comparison.

## How to Run

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt