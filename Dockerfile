# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies required for geospatial libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libeccodes0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project directory into the container
COPY . .

# Expose the port Streamlit runs on
EXPOSE 8501

# Run the training pipeline, then start the dashboard
CMD python src/generate_sample_data.py && \
    python src/regime_classifier.py && \
    python src/bias_correction.py && \
    streamlit run dashboard/app.py --server.port=8501 --server.address=0.0.0.0