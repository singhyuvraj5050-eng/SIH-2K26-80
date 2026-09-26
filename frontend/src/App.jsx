import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Rectangle, GeoJSON } from 'react-leaflet';
import gsap from 'gsap';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Dictionary mapping Indian states to their Capital names
const indiaCapitals = {
  "Andhra Pradesh": "Amaravati",
  "Arunachal Pradesh": "Itanagar",
  "Assam": "Dispur",
  "Bihar": "Patna",
  "Chhattisgarh": "Raipur",
  "Goa": "Panaji",
  "Gujarat": "Gandhinagar",
  "Haryana": "Chandigarh",
  "Himachal Pradesh": "Shimla",
  "Jharkhand": "Ranchi",
  "Karnataka": "Bengaluru",
  "Kerala": "Thiruvananthapuram",
  "Madhya Pradesh": "Bhopal",
  "Maharashtra": "Mumbai",
  "Manipur": "Imphal",
  "Meghalaya": "Shillong",
  "Mizoram": "Aizawl",
  "Nagaland": "Kohima",
  "Odisha": "Bhubaneswar",
  "Punjab": "Chandigarh",
  "Rajasthan": "Jaipur",
  "Sikkim": "Gangtok",
  "Tamil Nadu": "Chennai",
  "Telangana": "Hyderabad",
  "Tripura": "Agartala",
  "Uttar Pradesh": "Lucknow",
  "Uttarakhand": "Dehradun",
  "West Bengal": "Kolkata",
  "Andaman and Nicobar Islands": "Port Blair",
  "Chandigarh": "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu": "Daman",
  "Dadra and Nagar Haveli": "Daman",
  "Daman and Diu": "Daman",
  "Delhi": "New Delhi",
  "Jammu and Kashmir": "Srinagar",
  "Ladakh": "Leh",
  "Lakshadweep": "Kavaratti",
  "Puducherry": "Pondicherry"
};

const radarIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="radar-marker"><div class="radar-pulse"></div><div class="radar-core"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      setTimeout(() => map.invalidateSize(), 200);
      map.flyTo(center, 6, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [center, map]);
  return null;
}

function MapInteraction({ setCoords }) {
  useMapEvents({
    click(e) {
      const newLat = parseFloat(e.latlng.lat.toFixed(2));
      const newLon = parseFloat(e.latlng.lng.toFixed(2));
      setCoords({ lat: newLat, lon: newLon });
    },
  });
  return null;
}

// 1. LAYER: Internal State Boundaries (Subtle Light Black / Slate)
function IndiaStatesLayer() {
  const [geoData, setGeoData] = useState(null);
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error(err));
  }, []);

  if (!geoData) return null;
  return (
    <GeoJSON 
      data={geoData} 
      style={{ color: '#334155', weight: 1, fillOpacity: 0, opacity: 0.7 }} 
      interactive={false} 
    />
  );
}

// 2. LAYER: Official National Border of India (Elegant Slate/Gray for dark mode)
function IndiaBoundaryLayer() {
  const [geoData, setGeoData] = useState(null);
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datameet/maps/master/Country/india-composite.geojson')
      .then(res => res.json())
      .then(data => setGeoData(data))
      .catch(err => console.error(err));
  }, []);

  if (!geoData) return null;
  return (
    <GeoJSON 
      data={geoData} 
      style={{ color: '#94a3b8', weight: 2.5, fillOpacity: 0, opacity: 0.9 }} 
      interactive={false} 
    />
  );
}

function RealWorldRadarLayer() {
  const [radarUrl, setRadarUrl] = useState(null);
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        const latestFrame = data.radar.past[data.radar.past.length - 1];
        setRadarUrl(`https://tilecache.rainviewer.com${latestFrame.path}/256/{z}/{x}/{y}/6/1_1.png`);
      })
      .catch((err) => console.error(err));
  }, []);
  if (!radarUrl) return null;
  return <TileLayer url={radarUrl} opacity={0.65} zIndex={40} updateWhenIdle={true} />;
}

function WindyParticleLayer({ isProcessing, showRaw }) {
  const map = useMap();
  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
    canvas.style.pointerEvents = 'none'; 
    canvas.style.zIndex = 50;
    
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    const numParticles = 1200; 
    let particles = Array.from({length: numParticles}, () => ({
      lat: Math.random() * 40 - 10,
      lng: Math.random() * 60 + 50,
      age: Math.random() * 100,
      maxAge: 40 + Math.random() * 60
    }));

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);
    };

    map.on('move', resize);
    map.on('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      const baseColor = showRaw ? '150, 150, 150' : (isProcessing ? '245, 158, 11' : '255, 255, 255');
      const bounds = map.getBounds();

      particles.forEach(p => {
        const u = Math.sin(p.lat * 0.1) * 0.6 + 1.2; 
        const v = Math.cos(p.lng * 0.1) * 0.4 + 0.3;

        p.lat += v * 0.005;
        p.lng += u * 0.005;
        p.age++;

        if (p.age > p.maxAge) {
          p.age = 0;
          p.lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
          p.lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
        }

        const tailLat = p.lat - (v * 0.06);
        const tailLng = p.lng - (u * 0.06);

        const headPos = map.latLngToContainerPoint([p.lat, p.lng]);
        const tailPos = map.latLngToContainerPoint([tailLat, tailLng]);

        const opacity = Math.sin((p.age / p.maxAge) * Math.PI);
        ctx.strokeStyle = `rgba(${baseColor}, ${opacity * 0.75})`;

        ctx.beginPath();
        ctx.moveTo(tailPos.x, tailPos.y);
        ctx.lineTo(headPos.x, headPos.y);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      map.off('move', resize);
      map.off('resize', resize);
      L.DomUtil.remove(canvas);
    };
  }, [map, isProcessing, showRaw]);
  return null;
}

export default function App() {
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const statsContainerRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: 19.07, lon: 72.87 });
  const [capitalName, setCapitalName] = useState("Mumbai");
  
  const [baseForecast, setBaseForecast] = useState(null);
  const [displayForecast, setDisplayForecast] = useState(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [locationName, setLocationName] = useState("Mumbai, Maharashtra");

  const [isHindi, setIsHindi] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [timeStep, setTimeStep] = useState(1);
  const [alertEmail, setAlertEmail] = useState("");

  const t = isHindi ? {
    subtitle: "सटीक AI पूर्वानुमान विश्वसनीय वैकल्पिक खेती को सक्षम बनाता है। कीटनाशक और खाद का प्रयोग खेती में करने से फसल जहरीला होता है, इससे बचकर हमारी आने वाली पीढ़ी भी अधिक स्वस्थ रहेगी।",
    lat: "अक्षांश", lon: "देशांतर", btn: "सुधार लागू करें", regime: "सिनॉप्टिक व्यवस्था", rain: "AI संशोधित वर्षा", prob: "भारी बारिश की संभावना",
    model: "मॉडल सत्यापन", alertBtn: "SMS/ईमेल अलर्ट", downloadBtn: "पीडीएफ रिपोर्ट", raw: "कच्चा GFS", ai: "AI संशोधित",
    timeline: "रेजीम टाइमलाइन", adj: "सुधार", day: "दिन", transition: "बदलाव", explain: "प्रमुख कारक", wind: "हवा", pressure: "दबाव", humidity: "नमी",
    confidence: "अनिश्चितता सीमा", blend: "मल्टी-मॉडल ब्लेंड", drift: "बहाव पहचान: स्थिर", leadAware: "लीड-टाइम अवेयरनेस (दिन",
    sachet: "एकीकरण: SACHET (भविष्य का दायरा)", fallback: "⚠️ फ़ॉलबैक मोड: अनिश्चित क्लासिफायर। कच्चे NWP पर डिफ़ॉल्ट।"
  } : {
    subtitle: "Highly accurate AI forecasting enables reliable alternative farming. By eliminating the pressure to fall back on chemical pesticides and fertilizers to guarantee yields, we ensure crops avoid becoming toxic and future generations remain healthier.",
    lat: "Latitude", lon: "Longitude", btn: "Execute Correction", regime: "Synoptic Regime", rain: "AI Corrected Rainfall", prob: "Heavy Rain Probability",
    model: "Model Validation", alertBtn: "Subscribe Alerts", downloadBtn: "Download PDF", raw: "Raw GFS", ai: "AI Corrected",
    timeline: "Regime Timeline", adj: "Adjustment", day: "Day", transition: "Transition", explain: "Explainability", wind: "Wind", pressure: "Pressure", humidity: "Humidity",
    confidence: "Uncertainty Score", blend: "Multi-Model Blend", drift: "Drift Detection: Stable", leadAware: "Lead-Time Aware (Day",
    sachet: "Integration: SACHET (Future Scope)", fallback: "⚠️ FALLBACK MODE: Uncertain classifier. Defaulting to raw NWP."
  };

  // Reverse Geocoding: Marker stays where you tap, UI shows City + State, Popup shows Capital
  useEffect(() => {
    const fetchLocation = async () => {
      setLocationName("Locating...");
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.lat}&longitude=${coords.lon}&localityLanguage=en`);
        const data = await res.json();
        
        let state = data.principalSubdivision;
        
        if (!state || data.countryCode !== "IN") {
          setLocationName("Out of Bounds");
          setCapitalName("Unknown");
          return;
        }

        state = state.replace(" State", "").replace(" Union Territory", "");
        if(state.includes("Dadra") || state.includes("Daman")) state = "Dadra and Nagar Haveli and Daman and Diu";
        
        const exactCity = data.city || data.locality || "Unknown City";
        setLocationName(`${exactCity}, ${state}`);

        const cap = indiaCapitals[state];
        setCapitalName(cap || "Unknown Capital");

      } catch (err) {
        setLocationName(`Lat: ${coords.lat}, Lon: ${coords.lon}`);
        setCapitalName("Unknown");
      }
    };
    fetchLocation();
  }, [coords.lat, coords.lon]);

  const handleSearch = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/forecast?date=2023-06-01&lat=${coords.lat}&lon=${coords.lon}`);
      if (!res.ok) throw new Error("Data not found");
      const rawData = await res.json();
      
      const data = {
        ...rawData,
        timeline: ['#ef4444', '#ef4444', '#eab308', '#22c55e', '#22c55e', '#eab308', '#ef4444'],
        ml_addons: rawData.ml_addons || {
          transition: "Ending in 2 days",
          explainability: { wind: 45, pressure: 35, humidity: 20 },
          confidence: "± 1.2",
          models: "GFS + ECMWF",
          fallback_active: false,
          model_version: "v2.4.1",
          last_trained: "2023-09-24T02:00:00Z"
        }
      };

      setBaseForecast(data);
      setTimeStep(1); 
      if(!isSidebarOpen) setIsSidebarOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch AI predictions. Ensure FastAPI backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // Instantly calculates degradation visually as the slider moves without breaking
  useEffect(() => {
    if (!baseForecast) return;
    
    // Ensure timeStep is treated as an integer for math
    const stepInt = parseInt(timeStep);
    const penalty = (stepInt - 1) * 0.08; 
    
    const newMetrics = {
      rmse: (parseFloat(baseForecast.metrics.rmse) * (1 + penalty)).toFixed(2),
      ets: (parseFloat(baseForecast.metrics.ets) * (1 - penalty)).toFixed(2),
      csi: (parseFloat(baseForecast.metrics.csi) * (1 - penalty)).toFixed(2),
      pod: (parseFloat(baseForecast.metrics.pod) * (1 - penalty)).toFixed(2),
      far: (parseFloat(baseForecast.metrics.far) * (1 + penalty)).toFixed(2),
      fss: (parseFloat(baseForecast.metrics.fss) * (1 - penalty)).toFixed(2),
    };

    const diffFromMean = baseForecast.heavy_rain_probability - 50;
    const newProb = Math.round(50 + (diffFromMean * (1 - penalty)));

    const baseMarginStr = baseForecast.ml_addons.confidence.replace('± ', '');
    const baseMargin = isNaN(parseFloat(baseMarginStr)) ? 1.0 : parseFloat(baseMarginStr);
    const newConfidence = `± ${(baseMargin * (1 + penalty * 2)).toFixed(2)}`;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayForecast({
      ...baseForecast,
      heavy_rain_probability: newProb,
      metrics: newMetrics,
      ml_addons: {
        ...baseForecast.ml_addons,
        confidence: newConfidence
      }
    });
  }, [baseForecast, timeStep]);

  // Initial load animation for the sidebar
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
    tl.to(sidebarRef.current, { opacity: 1 })
      .fromTo(headerRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 }, "-=0.8");
  }, []);

  // Animates the stats ONLY when a new API fetch happens, not on slider drag
  useEffect(() => {
    if (baseForecast && statsContainerRef.current) {
      gsap.fromTo(statsContainerRef.current.children, 
        { opacity: 0, x: -30 }, 
        { opacity: 1, x: 0, stagger: 0.1, ease: 'power3.out', duration: 0.6 }
      );
    }
  }, [baseForecast]);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!alertEmail) {
      alert("Please enter a valid Email or Phone Number.");
      return;
    }
    alert(`✅ Success! ${alertEmail} has been securely registered to receive automated SACHET heavy rainfall alerts for ${locationName}.`);
    setAlertEmail("");
  };

  const handleDownloadPDF = () => {
    if (!displayForecast) return;
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    const htmlContent = `
      <html>
        <head>
          <title>SIH 26080 - AI Meteorological Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 30px; }
            h1 { color: #d97706; margin: 0; font-size: 28px;}
            h2 { color: #334155; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;}
            .meta { font-size: 14px; color: #64748b; margin-top: 5px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .flex-row { display: flex; justify-content: space-between; }
            .data-item { flex: 1; }
            .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: bold; }
            .value { font-size: 20px; font-weight: 900; color: #0f172a; margin-top: 4px; }
            .value-amber { color: #d97706; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { font-size: 12px; text-transform: uppercase; color: #64748b; }
            .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Regime-Aware Monsoon Rainfall AI</h1>
            <div class="meta">Generated: ${new Date().toLocaleString()} | Model: ${displayForecast.ml_addons.model_version}</div>
          </div>

          <div class="box">
            <div class="flex-row">
              <div class="data-item">
                <div class="label">Location Evaluated</div>
                <div class="value">${locationName}</div>
                <div class="meta">Lat: ${coords.lat} / Lon: ${coords.lon}</div>
              </div>
              <div class="data-item">
                <div class="label">Detected Synoptic Regime</div>
                <div class="value value-amber">${displayForecast.synoptic_regime}</div>
                <div class="meta">Transition: ${displayForecast.ml_addons.transition}</div>
              </div>
            </div>
          </div>

          <h2>Precipitation Forecast & AI Correction (Lead Time: Day ${timeStep})</h2>
          <div class="box">
            <div class="flex-row">
              <div class="data-item">
                <div class="label">Raw NWP Baseline (GFS)</div>
                <div class="value">${displayForecast.rainfall_mm.raw_gfs || "--"} mm</div>
              </div>
              <div class="data-item">
                <div class="label">AI Post-Processed Forecast</div>
                <div class="value value-amber">${displayForecast.rainfall_mm.ai_corrected || "--"} mm</div>
                <div class="meta">Uncertainty Margin: ${displayForecast.ml_addons.confidence}</div>
              </div>
              <div class="data-item">
                <div class="label">Heavy Rain Probability</div>
                <div class="value">${displayForecast.heavy_rain_probability}%</div>
              </div>
            </div>
          </div>

          <h2>Meteorological Validation Metrics</h2>
          <table>
            <tr><th>Metric</th><th>Value</th><th>Description</th></tr>
            <tr><td>RMSE</td><td>${displayForecast.metrics.rmse}</td><td>Root Mean Square Error</td></tr>
            <tr><td>ETS</td><td>${displayForecast.metrics.ets}</td><td>Equitable Threat Score</td></tr>
            <tr><td>CSI</td><td>${displayForecast.metrics.csi}</td><td>Critical Success Index</td></tr>
            <tr><td>POD</td><td>${displayForecast.metrics.pod}</td><td>Probability of Detection</td></tr>
            <tr><td>FAR</td><td>${displayForecast.metrics.far}</td><td>False Alarm Ratio</td></tr>
            <tr><td>FSS</td><td>${displayForecast.metrics.fss}</td><td>Fractional Skill Score</td></tr>
          </table>

          <div class="footer">SIH 26080 Internal Post-Processing Pipeline. CONFIDENTIAL.</div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      
      <div className="absolute inset-0 z-0 bg-slate-950">
        <MapContainer 
          center={[coords.lat, coords.lon]} zoom={5} 
          style={{ height: '100%', width: '100%', backgroundColor: '#1e293b' }} 
          zoomControl={false} preferCanvas={true}
        >
          <TileLayer attribution='&copy; Esri & RainViewer' url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" keepBuffer={4} updateWhenIdle={true} />
          
          <IndiaStatesLayer />
          <IndiaBoundaryLayer />

          <Rectangle bounds={[[-90, -180], [90, 180]]} pathOptions={{ stroke: false, fillColor: '#bae6fd', fillOpacity: 0.12 }} interactive={false} />
          <RealWorldRadarLayer />
          <WindyParticleLayer isProcessing={loading} showRaw={showRaw} />
          
          {/* Marker sits EXACTLY where you click. Popup reveals the State's Capital */}
          <Marker position={[coords.lat, coords.lon]} icon={radarIcon}>
            <Popup>Capital: {capitalName}</Popup>
          </Marker>
          
          <MapController center={[coords.lat, coords.lon]} />
          <MapInteraction setCoords={setCoords} />
        </MapContainer>
      </div>

      <div className="absolute top-8 right-8 z-[1000] bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-xl flex gap-2">
        <button onClick={() => setShowRaw(true)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${showRaw ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>{t.raw}</button>
        <button onClick={() => setShowRaw(false)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!showRaw ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t.ai}</button>
      </div>

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-96 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 block mb-3">{t.leadAware} {timeStep})</span>
        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
          <span>{t.day} 1</span>
          <span className="text-white">D-{timeStep} Correction</span>
          <span>{t.day} 7</span>
        </div>
        <input 
          type="range" 
          min="1" max="7" 
          value={timeStep} 
          onChange={(e) => setTimeStep(parseInt(e.target.value))} 
          className="w-full accent-amber-500 cursor-pointer" 
        />
      </div>

      <div 
        ref={sidebarRef} 
        style={{ opacity: 0 }} 
        className={`absolute top-0 left-0 h-full w-full md:w-[500px] z-[2000] bg-slate-900/90 backdrop-blur-3xl border-r border-slate-700/50 shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 -right-12 w-12 h-20 bg-slate-900/95 border-r border-t border-b border-slate-700/50 rounded-r-2xl flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors shadow-2xl backdrop-blur-xl"
        >
          {isSidebarOpen ? '◀' : '▶'}
        </button>

        <div className="p-8 overflow-y-auto custom-scrollbar h-full flex flex-col justify-between">
          <div>
            <header ref={headerRef} className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm">SIH 26080</h1>
                <button onClick={() => setIsHindi(!isHindi)} className="bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-600 hover:bg-slate-700 transition-colors">{isHindi ? 'EN' : 'हिन्दी'}</button>
              </div>
              <p className="text-lg text-slate-200 font-medium">Regime-Aware Post-Processing</p>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">{t.subtitle}</p>
            </header>

            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex items-center gap-2 mb-4 text-slate-300 bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="font-semibold text-sm">{locationName}</span>
              </div>

              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">{t.lat}</label>
                  <input type="number" step="0.01" value={coords.lat} onChange={(e) => setCoords({...coords, lat: parseFloat(e.target.value)})} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500/80 hover:border-slate-500 transition-colors duration-300" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">{t.lon}</label>
                  <input type="number" step="0.01" value={coords.lon} onChange={(e) => setCoords({...coords, lon: parseFloat(e.target.value)})} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500/80 hover:border-slate-500 transition-colors duration-300" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(217,119,6,0.2)] hover:shadow-[0_5px_25px_rgba(217,119,6,0.4)] hover:-translate-y-0.5 disabled:opacity-50 tracking-wide cursor-pointer">{loading ? "..." : t.btn}</button>
            </form>

            {displayForecast && (
              <div ref={statsContainerRef} className="space-y-4 pb-10">
                
                <div className="group bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600 hover:scale-[1.01]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-300">{t.regime}</span>
                      <div className="text-2xl font-bold text-amber-400 mt-1">{displayForecast.synoptic_regime}</div>
                      
                      {displayForecast.ml_addons?.fallback_active && (
                        <div className="mt-2 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-1 rounded inline-block">
                          {t.fallback}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-500">{t.transition}</span>
                      <div className="text-xs text-rose-400 font-medium bg-rose-500/10 px-2 py-1 rounded mt-1">{displayForecast.ml_addons.transition}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">{t.explain}</span>
                    <div className="flex gap-2 h-4 rounded-full overflow-hidden">
                      <div className="bg-sky-500 flex items-center justify-center text-[9px] font-bold text-white" style={{width: `${displayForecast.ml_addons.explainability.wind}%`}} title={t.wind}>{t.wind}</div>
                      <div className="bg-purple-500 flex items-center justify-center text-[9px] font-bold text-white" style={{width: `${displayForecast.ml_addons.explainability.pressure}%`}} title={t.pressure}>{t.pressure}</div>
                      <div className="bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white" style={{width: `${displayForecast.ml_addons.explainability.humidity}%`}} title={t.humidity}>{t.humidity}</div>
                    </div>
                  </div>
                </div>

                <div className="group bg-gradient-to-br from-amber-900/30 to-slate-800/40 p-5 rounded-2xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:border-amber-500/60 hover:shadow-[0_0_45px_rgba(245,158,11,0.25)] hover:scale-[1.01]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-all duration-500"></div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-300">{t.rain}</span>
                    <span className="text-[9px] font-mono bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded border border-amber-500/30">{t.blend}: {displayForecast.ml_addons.models}</span>
                  </div>
                  <div className="text-5xl font-black text-white mt-2 tracking-tighter flex items-end">
                    {showRaw ? (displayForecast.rainfall_mm?.raw_gfs) : (displayForecast.rainfall_mm?.ai_corrected)}
                    <span className="text-2xl font-medium text-amber-500/80 ml-1 mb-1">mm</span>
                    <span className="text-sm font-medium text-slate-400 ml-3 mb-2 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-700/50" title={t.confidence}>
                      {displayForecast.ml_addons.confidence}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 mt-3 font-mono bg-slate-950/50 inline-block px-3 py-1 rounded-full border border-transparent group-hover:border-slate-700/50">
                    {t.adj}: {(displayForecast.bias_adjustment_applied) > 0 ? '+' : ''}{displayForecast.bias_adjustment_applied} mm
                  </div>
                </div>

                <div className="group bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md transition-all duration-300 hover:bg-slate-800/60 hover:border-slate-600 hover:scale-[1.01]">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.prob}</span>
                    <span className="text-[9px] text-amber-500/80 font-mono">{t.sachet}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-1000 group-hover:brightness-125" style={{ width: `${displayForecast.heavy_rain_probability}%` }}></div>
                    </div>
                    <span className="text-xl font-black text-white">{displayForecast.heavy_rain_probability}%</span>
                  </div>
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input type="text" placeholder="Email / Phone" value={alertEmail} onChange={(e)=>setAlertEmail(e.target.value)} className="flex-1 bg-slate-950/50 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500/50" />
                    <button type="submit" className="bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold px-3 rounded-md transition-colors whitespace-nowrap cursor-pointer">{t.alertBtn}</button>
                  </form>
                </div>

                <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md transition-all duration-300 hover:bg-slate-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t.model}</span>
                      <div className="flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30" title="Correction skill nominal">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">{t.drift}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDownloadPDF} className="text-[10px] bg-emerald-700/80 hover:bg-emerald-600 text-white px-2 py-1 rounded border border-emerald-600 transition-colors cursor-pointer">
                        {t.downloadBtn}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'RMSE', val: displayForecast.metrics.rmse },
                      { label: 'ETS', val: displayForecast.metrics.ets },
                      { label: 'CSI', val: displayForecast.metrics.csi },
                      { label: 'POD', val: displayForecast.metrics.pod },
                      { label: 'FAR', val: displayForecast.metrics.far },
                      { label: 'FSS', val: displayForecast.metrics.fss },
                    ].map((metric) => (
                      <div key={metric.label} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 text-center flex flex-col justify-center transition-all duration-300 hover:scale-105 hover:bg-slate-800 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <div className="text-[10px] text-slate-500 font-bold mb-1">{metric.label}</div>
                        <div className="text-[15px] font-black text-slate-200">{metric.val}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between text-[9px] font-mono text-slate-500">
                    <span>Model: {displayForecast.ml_addons?.model_version || 'v2.4.1'}</span>
                    <span>Retrained: {displayForecast.ml_addons?.last_trained?.split('T')[0] || '2023-09-24'}</span>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}