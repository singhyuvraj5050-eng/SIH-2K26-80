import requests
import json

# Define the local API endpoint and query parameters (Mumbai coordinates)
url = "http://localhost:8000/forecast"
params = {
    "date": "2023-07-15",
    "lat": 19.07,
    "lon": 72.87
}

print("Querying MoES AI Post-Processing API...")
try:
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    # Pretty-print the JSON response
    data = response.json()
    print("\nAPI Response:")
    print(json.dumps(data, indent=2))
    
except requests.exceptions.RequestException as e:
    print(f"API Request Failed: {e}")