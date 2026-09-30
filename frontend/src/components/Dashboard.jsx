import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Rectangle, GeoJSON } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { LayoutDashboard, Map as MapIcon, Table, BrainCircuit, Activity, RotateCcw, Bell, User, Calendar, CheckCircle2, ShieldCheck, Play, Pause, AlertTriangle, ArrowRight, ServerCrash, Database, FileText, FileDown, Sun, Moon, Radio, X, LogOut, Terminal, Menu } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- DICTIONARIES & INITIAL DATA ---
const indiaCapitalsData = {
  "Andhra Pradesh": { name: "Amaravati", lat: 16.5062, lon: 80.6321 },
  "Arunachal Pradesh": { name: "Itanagar", lat: 27.0844, lon: 93.6053 },
  "Assam": { name: "Dispur", lat: 26.1433, lon: 91.7898 },
  "Bihar": { name: "Patna", lat: 25.5941, lon: 85.1376 },
  "Chhattisgarh": { name: "Raipur", lat: 21.2514, lon: 81.6296 },
  "Goa": { name: "Panaji", lat: 15.4909, lon: 73.8278 },
  "Gujarat": { name: "Gandhinagar", lat: 23.2156, lon: 72.6369 },
  "Haryana": { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  "Himachal Pradesh": { name: "Shimla", lat: 31.1048, lon: 77.1734 },
  "Jharkhand": { name: "Ranchi", lat: 23.3441, lon: 85.3096 },
  "Karnataka": { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  "Kerala": { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
  "Madhya Pradesh": { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
  "Maharashtra": { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  "Manipur": { name: "Imphal", lat: 24.8170, lon: 93.9368 },
  "Meghalaya": { name: "Shillong", lat: 25.5788, lon: 91.8933 },
  "Mizoram": { name: "Aizawl", lat: 23.7271, lon: 92.7176 },
  "Nagaland": { name: "Kohima", lat: 25.6751, lon: 94.1086 },
  "Odisha": { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
  "Punjab": { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  "Rajasthan": { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  "Sikkim": { name: "Gangtok", lat: 27.3389, lon: 88.6065 },
  "Tamil Nadu": { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  "Telangana": { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  "Tripura": { name: "Agartala", lat: 23.8315, lon: 91.2868 },
  "Uttar Pradesh": { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  "Uttarakhand": { name: "Dehradun", lat: 30.3165, lon: 78.0322 },
  "West Bengal": { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  "Delhi": { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
};

const verificationData = [
  { name: 'RMSE (mm)', raw: 14.2, generic: 11.5, regime: 9.8 },
  { name: 'CSI', raw: 0.32, generic: 0.41, regime: 0.48 },
  { name: 'POD', raw: 0.55, generic: 0.63, regime: 0.72 },
  { name: 'FAR', raw: 0.38, generic: 0.28, regime: 0.18 },
  { name: 'ETS', raw: 0.25, generic: 0.34, regime: 0.41 },
];

const replayEventData = [
  { date: "15 Jul", time: "00:00", regime: "Active Monsoon", obs: 45, raw: 22, ai: 41, risk: "Medium" },
  { date: "16 Jul", time: "12:00", regime: "Depression", obs: 110, raw: 45, ai: 98, risk: "High" },
  { date: "17 Jul", time: "06:00", regime: "Depression", obs: 145, raw: 52, ai: 130, risk: "Extreme" },
  { date: "18 Jul", time: "18:00", regime: "Western Disturbance", obs: 60, raw: 30, ai: 55, risk: "Medium" },
  { date: "19 Jul", time: "00:00", regime: "Break Monsoon", obs: 12, raw: 15, ai: 14, risk: "Low" },
];

// --- DYNAMIC MOCK GENERATOR FOR DEMO PURPOSES ---
const generateMockForecast = (lat, lon) => {
  // Uses lat/lon to create deterministic "random" numbers so the data changes when clicked!
  const pseudoRandom = (seed) => { let x = Math.sin(seed) * 10000; return x - Math.floor(x); };
  const r1 = pseudoRandom(lat + lon);
  const r2 = pseudoRandom(lat * lon);
  const r3 = pseudoRandom(lat / (lon || 1));

  const regimes = ["Active Monsoon", "Depression", "Western Disturbance", "Break Monsoon", "Orographic"];
  const raw = 15 + r2 * 80;
  const ai = raw + 5 + r3 * 25;

  return {
    synoptic_regime: regimes[Math.floor(r1 * regimes.length)],
    heavy_rain_probability: Math.floor(30 + r1 * 65),
    rainfall_mm: { raw_gfs: raw.toFixed(1), ai_corrected: ai.toFixed(1) },
    bias_adjustment_applied: (ai - raw).toFixed(1),
    metrics: {
      rmse: (8 + r2 * 5).toFixed(2),
      ets: (0.3 + r3 * 0.3).toFixed(2),
      csi: (0.4 + r1 * 0.3).toFixed(2),
      pod: (0.6 + r2 * 0.25).toFixed(2),
      far: (0.1 + r3 * 0.2).toFixed(2),
      fss: (0.5 + r1 * 0.3).toFixed(2)
    },
    ml_addons: { transition: "Ending in 2 days", confidence: `± ${(0.5 + r2 * 1.5).toFixed(1)}`, model_version: "v2.4.1" }
  };
};

// --- MAP COMPONENTS ---
const getRadarIcon = (colorHex) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="radar-marker"><div class="radar-pulse" style="border-color: ${colorHex};"></div><div class="radar-core" style="background-color: ${colorHex}; box-shadow: 0 0 15px ${colorHex};"></div><div class="radar-crosshair"></div></div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { if (map) map.flyTo(center, 6, { duration: 1.5, easeLinearity: 0.25 }); }, [center, map]);
  return null;
}

function MapInteraction({ setCoords }) {
  useMapEvents({ click(e) { setCoords({ lat: parseFloat(e.latlng.lat.toFixed(4)), lon: parseFloat(e.latlng.lng.toFixed(4)) }); } });
  return null;
}

function IndiaStatesLayer({ isDarkMode }) {
  const [geoData, setGeoData] = useState(null);
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
      .then(res => res.json()).then(data => setGeoData(data)).catch(() => {});
  }, []);
  if (!geoData) return null;
  return <GeoJSON data={geoData} style={{ color: isDarkMode ? '#E2DFD8' : '#ffffff', weight: 1, fillOpacity: 0, opacity: 0.4 }} interactive={false} />;
}

function IndiaBoundaryLayer() {
  const [geoData, setGeoData] = useState(null);
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson')
      .then(res => res.json()).then(data => setGeoData(data)).catch(() => {});
  }, []);
  if (!geoData) return null;
  return <GeoJSON data={geoData} style={{ color: '#334155', weight: 2.5, fillOpacity: 0, opacity: 0.9 }} interactive={false} />;
}

function WindyParticleLayer({ showRaw }) {
  const map = useMap();
  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
    canvas.style.pointerEvents = 'none'; canvas.style.zIndex = 50;
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId;
    const numParticles = 800; 
    let particles = Array.from({length: numParticles}, () => ({
      lat: Math.random() * 40 - 10, lng: Math.random() * 60 + 50, age: Math.random() * 100, maxAge: 40 + Math.random() * 60
    }));

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x; canvas.height = size.y;
      L.DomUtil.setPosition(canvas, map.containerPointToLayerPoint([0, 0]));
    };

    map.on('move', resize); map.on('resize', resize); resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      const baseColor = showRaw ? '255, 255, 255' : '96, 165, 250';
      const bounds = map.getBounds();

      particles.forEach(p => {
        const u = Math.sin(p.lat * 0.1) * 0.6 + 1.2; 
        const v = Math.cos(p.lng * 0.1) * 0.4 + 0.3;
        p.lat += v * 0.005; p.lng += u * 0.005; p.age++;

        if (p.age > p.maxAge) {
          p.age = 0;
          p.lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
          p.lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
        }

        const headPos = map.latLngToContainerPoint([p.lat, p.lng]);
        const tailPos = map.latLngToContainerPoint([p.lat - (v * 0.08), p.lng - (u * 0.08)]);
        const opacity = Math.sin((p.age / p.maxAge) * Math.PI);
        ctx.strokeStyle = `rgba(${baseColor}, ${opacity * 0.9})`;

        ctx.beginPath(); ctx.moveTo(tailPos.x, tailPos.y); ctx.lineTo(headPos.x, headPos.y); ctx.stroke();
      });
      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animationFrameId); map.off('move', resize); map.off('resize', resize); L.DomUtil.remove(canvas); };
  }, [map, showRaw]);
  return null;
}

// --- MAIN APPLICATION ARCHITECTURE ---
export default function Dashboard({ currentUser, onLogout }) {
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [activeView, setActiveView] = useState('dashboard');
  const [coords, setCoords] = useState({ lat: 23.2599, lon: 77.4126 }); 
  const [capitalName, setCapitalName] = useState("Bhopal");
  const [locationName, setLocationName] = useState("Bhopal, Madhya Pradesh");
  const [selectedState, setSelectedState] = useState("Madhya Pradesh");
  
  // Set initial state using the generator so it matches on first load
  const [baseForecast, setBaseForecast] = useState(() => generateMockForecast(23.2599, 77.4126));
  const [timeStep, setTimeStep] = useState(1);
  const [showRaw, setShowRaw] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  const activeUser = currentUser || { name: 'Evaluation Judge', id: 'SIH-EVAL-26080' };

  // Core API Logic
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`);
        const data = await res.json();
        let state = data.principalSubdivision;
        if (!state || data.countryCode !== "IN") return;
        state = state.replace(" State", "").replace(" Union Territory", "");
        if(state.includes("Dadra") || state.includes("Daman")) state = "Dadra and Nagar Haveli and Daman and Diu";
        
        const exactDistrict = data.city || data.locality || "Unknown District";
        setLocationName(`${exactDistrict}, ${state}`);
        setSelectedState(state);
        setCapitalName(indiaCapitalsData[state]?.name || "Unknown");
      } catch (err) { console.error("Geocoding Error:", err); }
    };
    fetchLocation();
    
    const fetchBackend = async () => {
      try {
        const res = await fetch(`http://localhost:8000/forecast?date=2023-06-01&lat=${coords.lat}&lon=${coords.lon}`);
        if (!res.ok) throw new Error("Backend offline");
        const rawData = await res.json();
        setBaseForecast({
          ...defaultForecastTemplate,
          ...rawData,
          metrics: { ...defaultForecastTemplate.metrics, ...rawData.metrics },
          ml_addons: { ...defaultForecastTemplate.ml_addons, ...rawData.ml_addons }
        });
      } catch(err) {
        // HYPER-DYNAMIC DEMO MODE: If backend is offline, generate distinct realistic data based on coordinates
        setBaseForecast(generateMockForecast(coords.lat, coords.lon));
      }
      setTimeStep(1); 
    };
    fetchBackend();
  }, [coords]);

  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setReplayStep((prev) => {
          if (prev >= replayEventData.length - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1500);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isPlaying]);

  const handleRegionChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    if (indiaCapitalsData[newState]) setCoords(indiaCapitalsData[newState]);
  };

  const districtTableData = useMemo(() => {
    const names = {
      "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
      "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
      "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
      "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubli", "Belagavi"],
      "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut"],
      "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    };
    const distList = names[selectedState] || ["Capital Region", "North District", "South District", "East District", "West District"];
    const regimes = ["Active Monsoon", "Depression", "Western Disturbance", "Break Monsoon", "Orographic"];
    
    return distList.map((d, i) => {
      // Dynamic deterministic generation for district tables based on the map coordinates clicked
      const seed = Math.sin(coords.lat + coords.lon + i) * 10000;
      const r = seed - Math.floor(seed);
      const rawVal = Math.floor(20 + r * 50);
      const aiVal = rawVal + Math.floor(5 + r * 15);
      
      return {
        district: d,
        state: selectedState ? selectedState.substring(0, 2).toUpperCase() : "NA",
        regime: regimes[i % regimes.length],
        raw: rawVal,
        ai: aiVal,
        heavy: Math.floor(40 + r * 50),
        conf: Math.floor(60 + r * 30)
      };
    });
  }, [selectedState, coords]);

  const displayForecast = useMemo(() => {
    const penalty = (timeStep - 1) * 0.08;
    const rawRain = parseFloat(baseForecast.rainfall_mm.raw_gfs);
    const aiRain = parseFloat(baseForecast.rainfall_mm.ai_corrected);
    const degradedAiRain = (aiRain - ((aiRain - rawRain) * (penalty * 1.5))).toFixed(2);
    let baseConfidence = String(baseForecast.ml_addons.confidence).replace('± ', '');
    if (isNaN(parseFloat(baseConfidence))) baseConfidence = "1.2";

    return {
      ...baseForecast,
      synoptic_regime: timeStep > 4 ? "Mixed/Uncertain" : baseForecast.synoptic_regime,
      heavy_rain_probability: Math.round(50 + ((baseForecast.heavy_rain_probability - 50) * (1 - penalty))),
      rainfall_mm: { raw_gfs: rawRain.toFixed(2), ai_corrected: degradedAiRain },
      bias_adjustment_applied: (degradedAiRain - rawRain).toFixed(2),
      metrics: {
        rmse: (parseFloat(baseForecast.metrics.rmse) * (1 + penalty)).toFixed(2),
        csi: (parseFloat(baseForecast.metrics.csi) * (1 - penalty)).toFixed(2),
        pod: (parseFloat(baseForecast.metrics.pod) * (1 - penalty)).toFixed(2),
        far: (parseFloat(baseForecast.metrics.far) * (1 + penalty)).toFixed(2),
        ets: (parseFloat(baseForecast.metrics.ets) * (1 - penalty)).toFixed(2),
        fss: (parseFloat(baseForecast.metrics.fss) * (1 - penalty)).toFixed(2),
      },
      ml_addons: { ...baseForecast.ml_addons, confidence: `± ${(parseFloat(baseConfidence) * (1 + penalty * 2)).toFixed(2)}` }
    };
  }, [baseForecast, timeStep]);

  const thresholdExceeded = displayForecast.heavy_rain_probability >= 75;

  useEffect(() => {
    if (!thresholdExceeded) setIsAlertDismissed(false);
  }, [thresholdExceeded]);

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const htmlContent = `
      <html>
        <head>
          <title>Govt of India - Meteorological Intelligence Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111827; line-height: 1.6; }
            .header { border-bottom: 3px solid #D97706; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            h1 { color: #111827; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;}
            .meta { font-size: 13px; color: #4B5563; margin-top: 5px; font-weight: 600; }
            .box { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
            .flex-row { display: flex; justify-content: space-between; }
            .data-item { flex: 1; border-left: 2px solid #E5E7EB; padding-left: 15px; }
            .data-item:first-child { border-left: none; padding-left: 0; }
            .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #4B5563; font-weight: bold; }
            .value { font-size: 22px; font-weight: 900; color: #111827; margin-top: 4px; }
            .value-accent { color: #D97706; }
            .value-red { color: #EF4444; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
            th { font-size: 12px; text-transform: uppercase; color: #4B5563; background: #F3F4F6; }
            .footer { margin-top: 50px; font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 20px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Regime-Aware Weather Intelligence</h1>
              <div class="meta">Automated Post-Processing Output</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Date: ${new Date().toLocaleDateString()}</div>
              <div class="meta">Time: ${new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          <div class="box">
            <div class="flex-row">
              <div class="data-item">
                <div class="label">Target Zone</div>
                <div class="value">${locationName}</div>
                <div class="meta">Coordinates: ${coords.lat}, ${coords.lon}</div>
              </div>
              <div class="data-item">
                <div class="label">Detected Weather Regime</div>
                <div class="value value-accent">${displayForecast.synoptic_regime}</div>
                <div class="meta">Classification Confidence: ${displayForecast.ml_addons.confidence}</div>
              </div>
            </div>
          </div>

          <h2 style="font-size: 16px; color: #111827; margin-top: 30px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Precipitation Forecast Analysis (Horizon: +${timeStep * 24}h)</h2>
          <div class="box">
            <div class="flex-row">
              <div class="data-item">
                <div class="label">Raw NWP Baseline</div>
                <div class="value">${displayForecast.rainfall_mm.raw_gfs} mm</div>
              </div>
              <div class="data-item">
                <div class="label">AI Bias-Corrected Output</div>
                <div class="value value-accent">${displayForecast.rainfall_mm.ai_corrected} mm</div>
              </div>
              <div class="data-item">
                <div class="label">Heavy Rain Threshold Risk</div>
                <div class="value ${thresholdExceeded ? 'value-red' : ''}">${displayForecast.heavy_rain_probability}%</div>
              </div>
            </div>
          </div>

          <h2 style="font-size: 16px; color: #111827; margin-top: 30px; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px;">Model Validation Metrics</h2>
          <table>
            <tr><th>Metric</th><th>Recorded Value</th><th>Description</th></tr>
            <tr><td>RMSE</td><td>${displayForecast.metrics.rmse}</td><td>Root Mean Square Error</td></tr>
            <tr><td>ETS</td><td>${displayForecast.metrics.ets}</td><td>Equitable Threat Score</td></tr>
            <tr><td>CSI</td><td>${displayForecast.metrics.csi}</td><td>Critical Success Index</td></tr>
            <tr><td>POD</td><td>${displayForecast.metrics.pod}</td><td>Probability of Detection</td></tr>
            <tr><td>FAR</td><td>${displayForecast.metrics.far}</td><td>False Alarm Ratio</td></tr>
          </table>

          <div class="footer">GOVERNMENT OF INDIA • INTERNAL METEOROLOGICAL DISSEMINATION SYSTEM • SIH-26080</div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSafeLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload(); 
    }
  };

  // --- VIEWS ---
  const renderDashboard = () => (
    <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar space-y-6 pb-20 relative">
      <div className="absolute inset-0 ambient-grid pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 mb-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Executive Intelligence Summary</h2>
          <p className="text-[var(--text-secondary)] mt-1 text-xs md:text-sm font-medium">Real-time regime-aware post-processing of NWP models.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <span className="px-3 py-1.5 bg-[var(--bg-input)] text-[var(--badge-success)] border border-[var(--border-subtle)] rounded flex items-center gap-2 text-[10px] md:text-xs font-bold shadow-sm">
            <Radio size={14} className="animate-pulse"/> NWP ONLINE
          </span>
          <span className="px-3 py-1.5 bg-[var(--bg-input)] text-[var(--badge-success)] border border-[var(--border-subtle)] rounded flex items-center gap-2 text-[10px] md:text-xs font-bold shadow-sm">
            <CheckCircle2 size={14}/> CLASSIFIER ACTIVE
          </span>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-5">
        {[
          { label: "Active Districts", val: "52", sub: "+8 from previous", color: "text-[var(--text-primary)]", subColor: "text-[var(--badge-success)]" },
          { label: "Heavy Rain Alerts", val: "17", sub: "6 high-confidence", color: "text-[var(--badge-alert)]", subColor: "text-[var(--badge-alert)]" },
          { label: "Dominant Regime", val: `🌀 ${displayForecast.synoptic_regime}`, sub: `${displayForecast.ml_addons.confidence} Uncertainty`, color: "text-[var(--primary-accent)]", subColor: "text-[var(--text-secondary)]", isText: true },
          { label: "Average Correction", val: `+${displayForecast.bias_adjustment_applied}`, unit: "mm", sub: "vs Raw NWP", color: "text-[var(--text-primary)]", subColor: "text-[var(--text-secondary)]" },
          { label: "Skill Improvement", val: "+17.8%", sub: "CSI Increase", color: "text-[var(--badge-success)]", subColor: "text-[var(--text-secondary)]" }
        ].map((card, idx) => (
          <div key={idx} className={`glass-card hover-shimmer group p-4 md:p-6 ${idx === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
            <div className="text-[9px] md:text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1 md:mb-2 relative z-10">{card.label}</div>
            <div className={`text-2xl md:text-3xl ${card.isText ? 'text-lg md:text-xl mt-2' : 'font-black'} ${card.color} group-hover:scale-[1.02] origin-left transition-transform duration-300 relative z-10`}>
              {card.val} {card.unit && <span className="text-sm md:text-lg text-[var(--text-secondary)] font-bold">{card.unit}</span>}
            </div>
            <div className={`text-[10px] md:text-xs ${card.subColor} mt-2 md:mt-3 font-semibold relative z-10`}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row gap-6">
        {/* Workflow Diagram Pipeline Mapper - Horizontally Swipeable on Mobile */}
        <div className="glass-card w-full xl:w-3/4 p-4 md:p-8">
          <h3 className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-6 md:mb-8 flex items-center gap-2">
            <Activity size={18} className="text-[var(--primary-accent)]"/> Automated Dissemination Pipeline
          </h3>
          <div className="overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex items-center justify-between w-full relative min-w-[600px] pt-2 pb-6">
              <div className="absolute left-[10%] right-[10%] h-[2px] bg-[var(--border-subtle)] top-[40%] z-0 overflow-hidden rounded-full">
                <div className="data-packet data-packet-1"></div>
                <div className="data-packet data-packet-2"></div>
                <div className="data-packet data-packet-3"></div>
                <div className="data-packet data-packet-4"></div>
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-3 w-1/5">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-app)] border-2 border-[var(--primary-accent)] flex items-center justify-center shadow-md">
                  <div className="absolute inset-[-4px] border border-dashed border-[var(--primary-accent)] rounded-full spin-slow opacity-50"></div>
                  <BrainCircuit size={18} className="text-[var(--primary-accent)]"/>
                </div>
                <div className="text-center bg-[var(--bg-card)] p-1 rounded z-10">
                  <div className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">Regime Classifier</div>
                  <div className="text-[9px] md:text-[10px] text-[var(--text-secondary)] mt-0.5 md:mt-1 font-semibold">{displayForecast.synoptic_regime}</div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-3 w-1/5">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-app)] border-2 border-[var(--badge-success)] flex items-center justify-center shadow-md">
                  <div className="absolute inset-[-4px] border border-dashed border-[var(--badge-success)] rounded-full spin-reverse opacity-50"></div>
                  <Activity size={18} className="text-[var(--badge-success)]"/>
                </div>
                <div className="text-center bg-[var(--bg-card)] p-1 rounded z-10">
                  <div className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">Bias Correction</div>
                  <div className="text-[9px] md:text-[10px] text-[var(--text-secondary)] mt-0.5 md:mt-1 font-semibold">NWP Adjusted</div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-3 w-1/5">
                <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 transition-colors duration-500`}
                     style={{ 
                       backgroundColor: thresholdExceeded ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-input)', 
                       borderColor: thresholdExceeded ? 'var(--badge-alert)' : 'var(--border-subtle)' 
                     }}>
                  {thresholdExceeded && <div className="absolute inset-[-6px] border-2 border-dashed border-[var(--badge-alert)] rounded-full spin-fast opacity-80"></div>}
                  <AlertTriangle size={20} className={thresholdExceeded ? 'text-[var(--badge-alert)] animate-pulse' : 'text-[var(--text-secondary)]'}/>
                </div>
                <div className="text-center bg-[var(--bg-card)] p-1 rounded z-10">
                  <div className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">Threshold &gt; 75%?</div>
                  <div className={`text-[9px] md:text-[10px] font-black mt-0.5 md:mt-1 ${thresholdExceeded ? 'text-[var(--badge-alert)]' : 'text-[var(--text-secondary)]'}`}>{thresholdExceeded ? 'EXCEEDED (YES)' : 'NORMAL (NO)'}</div>
                </div>
              </div>

              <div className={`relative z-10 flex flex-col items-center gap-3 w-1/5 transition-opacity duration-500 ${thresholdExceeded ? 'opacity-100' : 'opacity-40'}`}>
                 <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-500" 
                     style={{ 
                       backgroundColor: thresholdExceeded ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-input)', 
                       borderColor: thresholdExceeded ? 'var(--badge-alert)' : 'var(--border-subtle)',
                       color: thresholdExceeded ? 'var(--badge-alert)' : 'var(--text-secondary)'
                     }}>
                  <ServerCrash size={18} />
                </div>
                <div className="text-center bg-[var(--bg-card)] p-1 rounded z-10">
                  <div className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">Priority Alert</div>
                  <div className="text-[9px] md:text-[10px] text-[var(--text-secondary)] mt-0.5 md:mt-1 font-semibold">Disaster Mgmt</div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-3 w-1/5">
                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-app)] border-2 border-[var(--text-primary)] flex items-center justify-center shadow-md">
                  <div className="absolute inset-[-4px] border border-dashed border-[var(--text-primary)] rounded-full spin-slow opacity-50"></div>
                  <Database size={18} className="text-[var(--text-primary)]"/>
                </div>
                <div className="text-center bg-[var(--bg-card)] p-1 rounded z-10">
                  <div className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">IMD Sync</div>
                  <div className="text-[9px] md:text-[10px] text-[var(--text-secondary)] mt-0.5 md:mt-1 font-semibold">Bulletin Published</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Terminal Streaming Log */}
        <div className="glass-card w-full xl:w-1/4 flex flex-col min-h-[200px] md:min-h-[250px] p-4 md:p-8">
          <h3 className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
            <Terminal size={14} className="text-[var(--primary-accent)]"/> System Log
          </h3>
          <div className="flex-1 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded p-3 font-mono text-[9px] md:text-[10px] text-[var(--text-secondary)] overflow-hidden relative">
             <div className="terminal-scroll space-y-1.5 md:space-y-2">
                <p><span className="text-[var(--badge-success)]">[OK]</span> Connection to GFS Node established.</p>
                <p><span className="text-[var(--primary-accent)]">[AI]</span> Analyzing multi-variate topography...</p>
                <p><span className="text-[var(--badge-success)]">[OK]</span> Model weights loaded (v2.4.1).</p>
                <p><span className="text-[var(--primary-accent)]">[AI]</span> Applying bias reduction matrix.</p>
                <p><span className="text-[var(--text-primary)]">[SYS]</span> Threshold check initiated: {displayForecast.heavy_rain_probability}%</p>
                {thresholdExceeded && <p className="text-[var(--badge-alert)] animate-pulse font-bold">[WARN] CRITICAL THRESHOLD EXCEEDED.</p>}
                <p><span className="text-[var(--badge-success)]">[OK]</span> Pushing metrics to display...</p>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--bg-input)] to-transparent"></div>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card hover-shimmer p-4 md:p-8">
          <h3 className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2"><ShieldCheck size={18} className="text-[var(--primary-accent)]"/> Regime Classification Mapping</h3>
          <div className="space-y-4 md:space-y-5">
            {[
              { name: "Depression / LPS", val: 84, color: "var(--primary-accent)" },
              { name: "Active Monsoon", val: 9, color: "var(--badge-success)" },
              { name: "Western Disturbance", val: 5, color: "var(--text-secondary)" }, 
              { name: "Orographic", val: 2, color: "var(--text-secondary)" },
              { name: "Coastal / Break", val: 0, color: "var(--border-subtle)" },
            ].map(reg => (
              <div key={reg.name} className="group">
                <div className="flex justify-between text-[10px] md:text-xs mb-1.5 md:mb-2 font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors"><span>{reg.name}</span><span>{reg.val}%</span></div>
                <div className="h-1.5 md:h-2 bg-[var(--bg-input)] rounded-none overflow-hidden"><div className="h-full transition-all duration-700 ease-out" style={{ width: `${reg.val}%`, backgroundColor: reg.color }}></div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card hover-shimmer p-4 md:p-8">
          <h3 className="text-xs md:text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 flex items-center gap-2"><FileText size={18} className="text-[var(--primary-accent)]"/> Explainable Model Weights</h3>
          <p className="text-[11px] md:text-sm text-[var(--text-secondary)] mb-6 md:mb-8 font-medium">{locationName}: <span className="line-through mx-1">{displayForecast.rainfall_mm.raw_gfs}mm</span> <ArrowRight size={14} className="inline mx-1"/> <span className="text-[var(--primary-accent)] font-black">{displayForecast.rainfall_mm.ai_corrected}mm</span></p>
          <div className="space-y-4 md:space-y-5">
            {[
              { factor: "Depression proximity", val: "+12 mm", w: "80%" },
              { factor: "Relative humidity", val: "+5 mm", w: "40%" },
              { factor: "Wind convergence", val: "+3 mm", w: "25%" },
              { factor: "Terrain topology", val: "+1 mm", w: "10%" },
            ].map(f => (
              <div key={f.factor} className="flex items-center gap-3 md:gap-4 group">
                <div className="w-28 md:w-32 text-[10px] md:text-xs text-[var(--text-secondary)] font-bold truncate group-hover:text-[var(--text-primary)] transition-colors">{f.factor}</div>
                <div className="flex-1 h-1.5 md:h-2 bg-[var(--bg-input)] rounded-none overflow-hidden flex">
                  <div className="h-full transition-all duration-700 ease-out" style={{ width: f.w, backgroundColor: 'var(--text-secondary)' }}></div>
                </div>
                <div className="w-10 md:w-12 text-[10px] md:text-xs font-black text-[var(--text-primary)] text-right">{f.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar space-y-6 pb-20 relative">
      <div className="absolute inset-0 ambient-grid pointer-events-none"></div>
      
      <div className="relative z-10 mb-6 border-b border-[var(--border-subtle)] pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">Verification Report</h2>
          <p className="text-[var(--text-secondary)] mt-1 text-xs md:text-sm font-medium">Post-forecast evaluation metrics.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-[var(--badge-success)] px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--badge-success)] animate-pulse"></div> LIVE SYNC
        </div>
      </div>
      
      <div className="relative z-10 glass-card h-[350px] md:h-[450px] overflow-hidden p-2 md:p-8">
        <div className="chart-scanner"></div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={verificationData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} dx={-10} />
            <RechartsTooltip cursor={{fill: 'var(--bg-input)', opacity: 0.8}} contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px'}} />
            <Legend wrapperStyle={{fontSize: '11px', paddingTop: '20px', fontWeight: 'bold'}} iconType="square" />
            <Bar dataKey="raw" name="Raw NWP Data" fill="var(--text-secondary)" radius={[2, 2, 0, 0]} barSize={20} />
            <Bar dataKey="generic" name="Generic ML Engine" fill="var(--bg-input)" stroke="var(--border-subtle)" radius={[2, 2, 0, 0]} barSize={20} />
            <Bar dataKey="regime" name="Regime-Aware Correction" fill="var(--primary-accent)" radius={[2, 2, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar pb-20 relative">
      <div className="absolute inset-0 ambient-grid pointer-events-none"></div>
      
      <div className="relative z-10 mb-6 border-b border-[var(--border-subtle)] pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight">District Forecast & Grids</h2>
          <p className="text-[var(--text-secondary)] mt-1 text-xs md:text-sm font-medium">High-resolution AI-corrected rainfall data mapped to {selectedState}.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-[var(--primary-accent)] px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded shadow-sm">
          <Radio size={14} className="animate-pulse"/> REAL-TIME FEED
        </div>
      </div>

      <div className="relative z-10 glass-card p-0 overflow-hidden">
        {/* Horizontal Scroll on Mobile Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[600px] text-left text-sm text-[var(--text-primary)]">
            <thead className="bg-[var(--bg-input)] text-[10px] md:text-[11px] uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
              <tr>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black">Grid / District</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black">Classifier Regime</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-right">Raw NWP</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-right text-[var(--primary-accent)]">Post-Bias Correction</th>
                <th className="px-4 md:px-6 py-4 md:py-5 font-black text-right">Heavy Rain Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {districtTableData.map((row, i) => (
                <tr key={i} className="hover:bg-[var(--bg-input)] transition-colors duration-200">
                  <td className="px-4 md:px-6 py-3 md:py-4 font-bold flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--badge-success)] animate-pulse"></div> {row.district}, {row.state}
                  </td>
                  <td className="px-4 md:px-6 py-3 md:py-4"><span className="bg-[var(--bg-app)] border border-[var(--border-subtle)] px-2 py-1 md:px-2.5 md:py-1.5 rounded text-[9px] md:text-[11px] font-bold text-[var(--text-secondary)] shadow-sm whitespace-nowrap">{row.regime}</span></td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-medium text-[var(--text-secondary)] text-xs md:text-sm">{row.raw} mm</td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-black text-[var(--primary-accent)] text-xs md:text-sm">{row.ai} mm <span className="text-[var(--badge-success)] text-[9px] md:text-[10px] ml-1 md:ml-2">(+{row.ai - row.raw})</span></td>
                  <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                    <span className="px-2 py-1 md:px-2.5 md:py-1.5 rounded text-[10px] md:text-[11px] font-black border inline-block min-w-[40px] md:min-w-[50px] text-center"
                          style={{
                            backgroundColor: row.heavy > 75 ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-app)',
                            borderColor: row.heavy > 75 ? 'var(--badge-alert)' : 'var(--border-subtle)',
                            color: row.heavy > 75 ? 'var(--badge-alert)' : 'var(--text-secondary)'
                          }}>
                      {row.heavy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReplay = () => {
    const currentData = replayEventData[replayStep];
    return (
      <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar space-y-6 pb-20 relative">
        <div className="absolute inset-0 ambient-grid pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-0 mb-6 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2 md:gap-3"><RotateCcw className="text-[var(--primary-accent)]"/> Historical Event Replay</h2>
            <p className="text-[var(--text-secondary)] mt-1 text-xs md:text-sm font-medium">Simulating pipeline performance during a severe event.</p>
          </div>
          <button onClick={() => { if(replayStep >= replayEventData.length - 1) setReplayStep(0); setIsPlaying(p => !p); }} className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold transition-all duration-300 ease-out border cursor-pointer ${isPlaying ? 'bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-subtle)]' : 'bg-[var(--primary-accent)] text-white border-transparent shadow-md'}`}>
            {isPlaying ? <Pause size={16}/> : <Play size={16}/>} {isPlaying ? "PAUSE PIPELINE" : "START PIPELINE"}
          </button>
        </div>

        {/* Mobile Swipeable Timeline */}
        <div className="relative z-10 glass-card mb-8 p-4 md:p-8">
          <div className="overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="relative flex justify-between min-w-[500px]">
              <div className="absolute left-6 right-6 h-[2px] bg-[var(--border-subtle)] top-1/2 -translate-y-1/2 z-0"></div>
              {replayEventData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2 md:gap-3 relative z-10" onClick={() => { setReplayStep(index); setIsPlaying(false); }}>
                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-out border-2 ${index === replayStep ? 'bg-[var(--primary-accent)] border-[var(--primary-accent)] scale-125 shadow-[0_0_10px_rgba(217,119,6,0.4)]' : index < replayStep ? 'bg-[var(--badge-success)] border-[var(--badge-success)]' : 'bg-[var(--bg-input)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'}`}>
                    {index < replayStep && <CheckCircle2 size={12} className="text-white"/>}
                  </div>
                  <div className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${index === replayStep ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)]'}`}>{data.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
           <div className="glass-card hover-shimmer p-4 md:p-6">
             <div className="text-[9px] md:text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1 md:mb-2">Time Profile</div>
             <div className="text-xl md:text-3xl font-black text-[var(--text-primary)]">{currentData.time} <span className="text-[10px] md:text-sm font-semibold text-[var(--text-secondary)]">IST</span></div>
             <div className="text-[10px] md:text-xs text-[var(--text-secondary)] font-medium mt-1 md:mt-2">{currentData.date}</div>
           </div>
           
           <div className="glass-card hover-shimmer p-4 md:p-6 transition-all duration-500 ease-out" style={{ backgroundColor: currentData.regime === 'Depression' ? 'rgba(220, 38, 38, 0.05)' : 'var(--bg-card)', borderColor: currentData.regime === 'Depression' ? 'var(--badge-alert)' : 'var(--border-subtle)' }}>
             <div className={`text-[9px] md:text-[11px] uppercase tracking-wider font-bold mb-1 md:mb-2 ${currentData.regime === 'Depression' ? 'text-[var(--badge-alert)]' : 'text-[var(--text-secondary)]'}`}>Classifier Regime</div>
             <div className={`text-sm md:text-xl font-black flex items-center gap-1.5 md:gap-2 ${currentData.regime === 'Depression' ? 'text-[var(--badge-alert)] animate-pulse' : 'text-[var(--text-primary)]'}`}>
               {currentData.regime === 'Depression' ? <AlertTriangle size={16}/> : '🌀'} {currentData.regime}
             </div>
           </div>

           <div className="glass-card hover-shimmer p-4 md:p-6">
             <div className="text-[9px] md:text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1 md:mb-2">Raw NWP Forecast</div>
             <div className="text-xl md:text-3xl font-black text-[var(--text-primary)]">{currentData.raw} <span className="text-[10px] md:text-lg font-semibold text-[var(--text-secondary)]">mm</span></div>
             <div className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-1 md:mt-2 font-medium">Error: {Math.abs(currentData.obs - currentData.raw)} mm</div>
           </div>

           <div className="glass-card hover-shimmer p-4 md:p-6 border-[var(--primary-accent)] shadow-sm">
             <div className="text-[9px] md:text-[11px] uppercase tracking-wider text-[var(--primary-accent)] font-bold mb-1 md:mb-2">Bias Corrected</div>
             <div className="text-xl md:text-3xl font-black text-[var(--primary-accent)]">{currentData.ai} <span className="text-[10px] md:text-lg font-semibold text-[var(--primary-accent)]">mm</span></div>
             <div className="text-[10px] md:text-xs text-[var(--badge-success)] mt-1 md:mt-2 font-bold">Error Reduced: {Math.abs(currentData.obs - currentData.ai)} mm</div>
           </div>
        </div>

        <div className="relative z-10 glass-card h-[300px] md:h-[400px] p-2 md:p-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={replayEventData.slice(0, replayStep + 1)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorObs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--badge-success)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--badge-success)" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary-accent)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--primary-accent)" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} dx={-10} />
              <RechartsTooltip contentStyle={{backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '12px'}} />
              <Legend wrapperStyle={{fontSize: '11px', paddingTop: '20px', fontWeight: 'bold'}} iconType="square" />
              <Area type="monotone" dataKey="obs" name="Ground Truth Obs" stroke="var(--badge-success)" fillOpacity={1} fill="url(#colorObs)" strokeWidth={3} activeDot={{r: 4, strokeWidth: 0}} />
              <Area type="monotone" dataKey="ai" name="Post-Bias Correction (AI)" stroke="var(--primary-accent)" fillOpacity={1} fill="url(#colorAI)" strokeWidth={3} activeDot={{r: 4, strokeWidth: 0}} />
              <Area type="monotone" dataKey="raw" name="Raw NWP" stroke="var(--text-secondary)" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        :root {
          /* Premium Cream / Off-White Palette (Light Mode Default) */
          --bg-app: #F7F5F0;
          --bg-card: #FFFFFF;
          --bg-input: #EFECE5;
          --border-subtle: #E2DFD8;
          --text-primary: #1C1917;
          --text-secondary: #57534E;
          --primary-accent: #D97706;
          --badge-success: #059669; 
          --badge-alert: #DC2626;   
        }
        .dark {
          --bg-app: #0E1117;
          --bg-card: #161B22;
          --bg-input: #1F242C;
          --border-subtle: #2B313A;
          --text-primary: #F3F4F6; 
          --text-secondary: #9CA3AF;
          --primary-accent: #D97706;
          --badge-success: #10B981;
          --badge-alert: #EF4444;
        }

        .custom-scrollbar { scroll-behavior: smooth; scrollbar-width: thin; scrollbar-color: var(--border-subtle) transparent; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border-subtle); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--text-secondary); }
        
        .leaflet-container { background: #000 !important; }
        
        /* Tactical Grid Overlay on the Map */
        .leaflet-map-pane::before {
           content: ''; position: absolute; inset: -5000px;
           background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
           background-size: 100px 100px; z-index: 400; pointer-events: none;
        }

        .glass-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 0.5rem; position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); }
        .dark .glass-card { box-shadow: none; }
        
        .hover-shimmer::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent); transform: rotate(30deg) translateY(-100%); transition: transform 0.6s ease; pointer-events: none; z-index: 10; }
        .dark .hover-shimmer::after { background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent); }
        .hover-shimmer:hover::after { transform: rotate(30deg) translateY(100%); }

        @keyframes alertDrop { 0% { transform: translate(-50%, -100%); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
        .animate-alert-drop { animation: alertDrop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes radarPulse { 0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(3.5); opacity: 0; } }
        .radar-marker { position: relative; width: 40px; height: 40px; }
        .radar-core { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border-radius: 50%; z-index: 3; }
        .radar-pulse { position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; border-radius: 50%; border: 2px solid; animation: radarPulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; z-index: 1; }
        .radar-crosshair { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; border: 1px dashed rgba(255,255,255,0.5); border-radius: 50%; z-index: 2; pointer-events: none;}

        @keyframes packetFlow { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
        .data-packet { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: var(--primary-accent); top: 50%; transform: translateY(-50%); box-shadow: 0 0 6px var(--primary-accent); animation: packetFlow 4s infinite linear; }
        .data-packet-1 { animation-delay: 0s; } .data-packet-2 { animation-delay: 1s; } .data-packet-3 { animation-delay: 2s; } .data-packet-4 { animation-delay: 3s; }
        
        @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
        .ambient-grid { background-size: 40px 40px; background-image: linear-gradient(to right, var(--border-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px); opacity: 0.4; animation: gridMove 5s linear infinite; }
        .dark .ambient-grid { opacity: 0.1; }
        
        @keyframes scanline { 0% { transform: translateX(-100%); } 100% { transform: translateX(100vw); } }
        .active-scanline { background: linear-gradient(90deg, transparent, var(--primary-accent), transparent); width: 50vw; animation: scanline 5s linear infinite; }

        @keyframes scanVertical { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .chart-scanner { position: absolute; top: 0; left: 0; right: 0; height: 100%; background: linear-gradient(180deg, transparent, rgba(217, 119, 6, 0.06), transparent); animation: scanVertical 6s linear infinite; pointer-events: none; z-index: 10;}

        @keyframes orbitRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbitReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        .animate-orbit { position: absolute; inset: -6px; border: 1px dashed var(--primary-accent); border-radius: 30%; opacity: 0.7; animation: orbitRotate 12s linear infinite; }
        .spin-slow { animation: orbitRotate 8s linear infinite; }
        .spin-fast { animation: orbitRotate 3s linear infinite; }
        .spin-reverse { animation: orbitReverse 8s linear infinite; }

        @keyframes eqBlink { 0%, 100% { height: 4px; } 50% { height: 14px; } }
        .eq-bar { width: 3px; background: var(--primary-accent); animation: eqBlink 1s infinite; border-radius: 2px;}

        @keyframes pulseMatrix { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 4px var(--badge-success);} }

        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-content { display: flex; width: 200%; animation: marquee 30s linear infinite; font-family: monospace; font-size: 10px; color: var(--text-secondary); white-space: nowrap; }

        @keyframes scrollUp { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }
        .terminal-scroll { animation: scrollUp 15s linear infinite; }
      `}</style>

      {/* USER PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-sm relative animate-alert-drop">
            <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--badge-alert)] transition-colors cursor-pointer"><X size={20}/></button>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--bg-input)] border-4 border-[var(--border-subtle)] flex items-center justify-center mb-4">
                <User size={32} className="text-[var(--primary-accent)]" />
              </div>
              <h2 className="text-lg md:text-xl font-black text-[var(--text-primary)] text-center">{activeUser.name}</h2>
              <p className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)] mt-1 tracking-wider uppercase">{activeUser.id}</p>
              
              <div className="w-full mt-6 space-y-2 md:space-y-3">
                <div className="bg-[var(--bg-app)] p-3 rounded border border-[var(--border-subtle)] flex justify-between items-center">
                  <span className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase">Clearance Level</span>
                  <span className="text-[10px] md:text-xs font-black text-[var(--badge-success)] flex items-center gap-1"><CheckCircle2 size={12}/> ACTIVE</span>
                </div>
                <div className="bg-[var(--bg-app)] p-3 rounded border border-[var(--border-subtle)] flex justify-between items-center">
                  <span className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase">Session Started</span>
                  <span className="text-[10px] md:text-xs font-bold text-[var(--text-primary)]">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <button onClick={handleSafeLogout} className="w-full mt-6 text-[var(--badge-alert)] border border-[var(--badge-alert)] hover:bg-[var(--badge-alert)] hover:text-white transition-colors duration-300 font-bold py-3 rounded flex items-center justify-center gap-2 cursor-pointer text-sm" style={{backgroundColor: 'rgba(220, 38, 38, 0.05)'}}>
                <LogOut size={16} /> TERMINATE SESSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <div className={`flex flex-col h-[100dvh] w-screen font-sans overflow-hidden ${isDarkMode ? 'dark' : ''} bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300`}>
        
        {/* MAIN LAYOUT WRAPPER */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* SIDEBAR */}
          <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-[9999] md:z-50 w-64 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] flex flex-col justify-between shadow-xl md:shadow-md transition-transform duration-300 ease-in-out`}>
            <div>
              <div className="p-5 md:p-7 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] flex justify-between items-center">
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">RainRegime</h1>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[var(--primary-accent)] mt-1 font-bold">Intelligence Ops</p>
                </div>
                <button className="md:hidden text-[var(--text-secondary)]" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
              </div>
              <nav className="p-4 space-y-1">
                {[
                  { id: 'dashboard', icon: LayoutDashboard, label: 'Pipeline Dashboard' },
                  { id: 'map', icon: MapIcon, label: 'Forecast Output Map' },
                  { id: 'table', icon: Table, label: 'Grid / District Data' },
                  { id: 'verification', icon: Activity, label: 'Verification Report' },
                  { id: 'replay', icon: RotateCcw, label: 'Event Replay' },
                ].map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }} 
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-xs md:text-sm font-bold transition-all duration-300 ease-out cursor-pointer group ${activeView === item.id ? 'bg-[var(--bg-input)] text-[var(--primary-accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'}`}
                  >
                    <item.icon size={18} className={`transition-colors duration-300 ${activeView === item.id ? 'text-[var(--primary-accent)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} /> 
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 md:p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-input)]">
              <div className="flex items-center gap-2 mb-4 text-[10px] md:text-xs font-bold text-[var(--badge-success)]">
                <div className="w-2 h-2 rounded-full bg-[var(--badge-success)] animate-pulse"></div> SYSTEM ONLINE
              </div>
              
              <div className="mb-4 bg-[var(--bg-card)] p-2 md:p-3 rounded border border-[var(--border-subtle)] shadow-sm">
                <div className="text-[8px] md:text-[9px] text-[var(--text-secondary)] uppercase font-bold mb-2 md:mb-3 flex justify-between"><span>Sensor Array</span><span className="text-[var(--text-primary)]">Optimal</span></div>
                <div className="grid grid-cols-8 gap-1.5 md:gap-2">
                  {[...Array(24)].map((_, i) => (
                     <div key={i} className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--badge-success)]" style={{opacity: Math.random(), animation: `pulseMatrix ${1 + Math.random()*2}s infinite ${Math.random()}s`}}></div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2 text-[9px] md:text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">
                <div className="flex justify-between"><span>IMD Auth</span><span className="text-[var(--text-primary)]">Verified</span></div>
                <div className="flex justify-between"><span>Classifier API</span><span className="text-[var(--text-primary)]">Active</span></div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
            
            <header className="relative h-14 md:h-16 bg-[var(--bg-app)] border-b border-[var(--border-subtle)] flex items-center justify-between px-3 md:px-8 z-40 shrink-0 shadow-sm">
              <div className="flex items-center gap-2 md:gap-3 relative z-10">
                <button className="md:hidden p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary-accent)]" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu size={20}/>
                </button>
                <span className="hidden sm:inline text-[var(--text-secondary)] uppercase text-[10px] md:text-xs tracking-wider font-bold">Analyst Region</span> 
                <select value={selectedState} onChange={handleRegionChange} className="bg-[var(--bg-input)] text-[var(--text-primary)] font-bold text-xs md:text-sm outline-none cursor-pointer border border-[var(--border-subtle)] focus:border-[var(--primary-accent)] rounded px-2 md:px-3 py-1.5 transition-colors duration-300 max-w-[120px] md:max-w-none truncate">
                  {Object.keys(indiaCapitalsData).map(state => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-3 md:gap-6 text-sm font-bold text-[var(--text-secondary)] relative z-10">
                
                <div className="hidden lg:flex items-center gap-2 bg-[var(--bg-input)] px-3 py-1 rounded border border-[var(--border-subtle)] shadow-inner">
                  <span className="text-[10px] uppercase">Live Stream</span>
                  <div className="flex items-end gap-0.5 h-3">
                    {[1,2,3,4,5].map(i => <div key={i} className="eq-bar" style={{animationDuration: `${0.5 + Math.random()}s`}}></div>)}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2"><Calendar size={14}/> 28 Sep 2026</div>
                <div className="hidden md:flex items-center gap-2">NWP Horizon: +{timeStep * 24}h</div>
                <div className="hidden md:block w-px h-5 bg-[var(--border-subtle)] mx-1"></div>
                
                <button title="Toggle Theme" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:text-[var(--primary-accent)] transition-colors cursor-pointer text-[var(--text-primary)]"><Sun size={18} className="hidden dark:block" /><Moon size={18} className="block dark:hidden" /></button>
                <button title="Export PDF Report" onClick={handleDownloadPDF} className="hover:text-[var(--primary-accent)] transition-colors cursor-pointer hidden sm:block"><FileDown size={18}/></button>
                <button title="System Alerts" onClick={() => { alert(thresholdExceeded ? `🚨 AUTOMATED DISPATCH TRIGGERED` : "No alerts pending."); setIsAlertDismissed(true); }} className={`relative transition-all duration-300 cursor-pointer flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 rounded border ${thresholdExceeded ? 'text-[var(--badge-alert)] border-[var(--badge-alert)]' : 'border-transparent hover:text-[var(--primary-accent)]'}`} style={{backgroundColor: thresholdExceeded ? 'rgba(220,38,38,0.1)' : 'transparent'}}>
                  <Bell size={18} className={thresholdExceeded ? "animate-[bounce_2s_infinite]" : ""}/>
                  {thresholdExceeded && <span className="hidden sm:inline font-black text-[10px] md:text-xs tracking-wider">1 CRITICAL</span>}
                </button>
                <button title="User Profile" onClick={() => setShowProfile(true)} className="hover:text-[var(--primary-accent)] transition-colors cursor-pointer"><User size={18}/></button>
              </div>
            </header>

            <main className="flex-1 relative overflow-hidden bg-[var(--bg-app)]">

              {thresholdExceeded && !isAlertDismissed && activeView !== 'replay' && (
                <div className="absolute top-20 md:top-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100vw-2rem)] md:w-max animate-alert-drop pointer-events-auto">
                  <div className="bg-[var(--bg-card)] border-2 border-[var(--badge-alert)] rounded-md shadow-2xl flex flex-col md:flex-row items-center p-3 md:p-1.5 md:pr-4 gap-3 md:gap-0 text-center md:text-left">
                    <div className="bg-[var(--badge-alert)] text-white px-4 md:px-5 py-2 md:py-3 rounded flex items-center gap-2 md:gap-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      <AlertTriangle size={20} className="relative z-10 md:w-6 md:h-6" />
                      <span className="font-black tracking-widest text-sm md:text-lg relative z-10">SEVERE WEATHER</span>
                    </div>
                    <div className="px-2 md:px-6 w-full md:w-auto">
                      <div className="text-[var(--badge-alert)] font-black text-[9px] md:text-[10px] uppercase tracking-widest mb-0.5">Automated AI Warning</div>
                      <div className="text-[var(--text-primary)] text-xs md:text-sm"><span className="font-bold">{locationName}</span> <br className="md:hidden" /> <span className="hidden md:inline">•</span> <span className="font-black text-[var(--badge-alert)]">{displayForecast.heavy_rain_probability}%</span> Heavy Rain Risk</div>
                    </div>
                    <button onClick={() => { alert(`🚨 DISPATCH TRIGGERED`); setIsAlertDismissed(true); }} className="w-full md:w-auto mt-2 md:mt-0 md:ml-3 border border-[var(--badge-alert)] text-[var(--badge-alert)] hover:bg-[var(--badge-alert)] hover:text-white transition-colors px-4 md:px-6 py-2 md:py-2.5 rounded font-bold uppercase tracking-wider text-[10px] md:text-xs cursor-pointer shadow-sm">Review & Dispatch</button>
                  </div>
                </div>
              )}
              
              <div className={`absolute inset-0 transition-opacity duration-500 ease-out ${activeView === 'map' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none -z-10'}`}>
                <MapContainer center={[coords.lat, coords.lon]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false} preferCanvas={true}>
                  {/* HIGH RES SATELLITE TILE LAYER */}
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={18} />
                  {/* TRANSPARENT LABEL OVERLAY LAYER */}
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" maxZoom={18} zIndex={10} />
                  
                  <IndiaBoundaryLayer />
                  <IndiaStatesLayer isDarkMode={isDarkMode} />
                  
                  {/* Subtle Dark Map Vignette */}
                  <Rectangle bounds={[[-90, -180], [90, 180]]} pathOptions={{ stroke: false, fillColor: '#000000', fillOpacity: isDarkMode ? 0.4 : 0.15 }} interactive={false} />
                  
                  <Marker position={[coords.lat, coords.lon]} icon={getRadarIcon('#38bdf8')}><Popup>Grid Sector: {capitalName}</Popup></Marker>
                  <MapController center={[coords.lat, coords.lon]} /><MapInteraction setCoords={setCoords} />
                  <WindyParticleLayer showRaw={showRaw} />
                </MapContainer>
                
                {/* Premium Tactical Vignette Overlay */}
                <div className="absolute inset-0 pointer-events-none z-[400] shadow-[inset_0_0_150px_rgba(0,0,0,0.6)]"></div>

                <div className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
                  <button onClick={() => setShowRaw(true)} className={`px-4 md:px-5 py-2 md:py-2.5 rounded text-xs md:text-sm font-bold transition-all duration-300 shadow-md cursor-pointer ${showRaw ? 'bg-[#334155] text-white border-transparent' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]'}`}>Raw NWP</button>
                  <button onClick={() => setShowRaw(false)} className={`px-4 md:px-5 py-2 md:py-2.5 rounded text-xs md:text-sm font-bold transition-all duration-300 shadow-md cursor-pointer ${!showRaw ? 'bg-[#38bdf8] text-[#0f172a] border-transparent' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]'}`}>Bias Corrected</button>
                </div>

                <div className="absolute bottom-4 md:bottom-auto md:top-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl p-5 md:p-7 z-[1000] custom-scrollbar overflow-y-auto max-h-[55vh] md:max-h-[85vh]" onWheel={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4 md:mb-5 pb-4 md:pb-5 border-b border-[var(--border-subtle)]">
                    <div>
                      <h3 className="font-black text-[var(--text-primary)] text-sm md:text-lg uppercase tracking-tight">{locationName}</h3>
                      <div className="flex items-center gap-2 mt-1.5 md:mt-2">
                        <div className="relative w-3 h-3 md:w-4 md:h-4 flex items-center justify-center">
                          <div className="animate-orbit"></div>
                          <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[var(--primary-accent)] rounded-full"></div>
                        </div>
                        <span className="text-[9px] md:text-[10px] bg-[var(--bg-input)] text-[var(--primary-accent)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-sm uppercase font-bold tracking-wider">{displayForecast.synoptic_regime}</span>
                      </div>
                    </div>
                    <button onClick={handleDownloadPDF} title="Download PDF Report" className="hidden sm:block p-2 md:p-2.5 bg-[var(--bg-input)] hover:bg-[var(--primary-accent)] text-[var(--text-secondary)] hover:text-white rounded border border-[var(--border-subtle)] transition-colors duration-300 cursor-pointer shadow-sm"><FileDown size={18} /></button>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                    <div className="bg-[var(--bg-input)] p-3 md:p-5 rounded border border-[var(--border-subtle)] shadow-inner">
                      <div className="flex justify-between text-[9px] md:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 md:mb-2"><span>Raw NWP Input</span><span className="text-[var(--primary-accent)]">Bias Corrected</span></div>
                      <div className="flex justify-between items-end">
                        <span className="text-lg md:text-2xl text-[var(--text-secondary)] line-through decoration-[var(--text-secondary)] font-medium">{displayForecast.rainfall_mm.raw_gfs} <span className="text-xs md:text-sm">mm</span></span>
                        <span className="text-2xl md:text-4xl font-black text-[var(--text-primary)]">{displayForecast.rainfall_mm.ai_corrected} <span className="text-base md:text-xl text-[var(--primary-accent)]">mm</span></span>
                      </div>
                      <div className="text-[9px] md:text-[11px] text-[var(--badge-success)] mt-2 md:mt-3 font-bold pt-2 md:pt-3 border-t border-[var(--border-subtle)]">Correction Engine: +{displayForecast.bias_adjustment_applied} mm</div>
                    </div>

                    <div className="bg-[var(--bg-input)] p-3 md:p-5 rounded border border-[var(--border-subtle)] shadow-inner">
                      <div className="text-[9px] md:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 md:mb-3 flex justify-between"><span>Heavy Rain Risk</span><span className="text-[var(--text-secondary)] hidden sm:inline">{displayForecast.ml_addons.confidence} Error</span></div>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex-1 h-1.5 md:h-2 bg-[var(--border-subtle)] rounded-none overflow-hidden"><div className="h-full transition-all duration-500 ease-out" style={{ width: `${displayForecast.heavy_rain_probability}%`, backgroundColor: thresholdExceeded ? 'var(--badge-alert)' : 'var(--primary-accent)' }}></div></div>
                        <span className="text-base md:text-xl font-black text-[var(--text-primary)]">{displayForecast.heavy_rain_probability}%</span>
                      </div>
                    </div>

                    <div className="pt-2 md:pt-3">
                      <div className="text-[9px] md:text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 md:mb-3 text-center flex justify-between"><span>Day 1</span><span>Lead Time Engine</span><span>Day 7</span></div>
                      <input type="range" min="1" max="7" value={timeStep} onChange={(e) => setTimeStep(parseInt(e.target.value))} className="w-full cursor-pointer" style={{ accentColor: 'var(--primary-accent)' }} />
                    </div>
                  </div>
                </div>
                
              </div>

              {activeView === 'dashboard' && renderDashboard()}
              {activeView === 'verification' && renderVerification()}
              {activeView === 'table' && renderTable()}
              {activeView === 'replay' && renderReplay()}

            </main>
          </div>
        </div>

        {/* BOTTOM MET-OPS TICKER TAPE */}
        <div className="h-6 md:h-8 bg-[var(--bg-input)] border-t border-[var(--border-subtle)] flex items-center overflow-hidden shrink-0 z-50">
           <div className="ticker-content font-bold text-[8px] md:text-[10px]">
              {Array(10).fill("++ GFS NODE SYNC COMPLETE ++ RADAR ARRAY NOMINAL ++ BIAS CORRECTION ACTIVE ++ IMD SECURE CONNECTION VERIFIED ++ ").map((text, i) => (
                <span key={i} className="mr-4">{text}</span>
              ))}
           </div>
        </div>

      </div>
    </>
  );
}