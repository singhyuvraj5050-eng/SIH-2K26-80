import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Rectangle } from 'react-leaflet';
import gsap from 'gsap';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 1. Custom animated radar icon
const radarIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="radar-marker"><div class="radar-pulse"></div><div class="radar-core"></div></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// 2. Map Controller for smooth flying and resize fixing
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

// 3. Click Interaction
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

// 4. Stable Real-World Precipitation
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

// 5. Windy.com Canvas Particle System (Lower Density)
function WindyParticleLayer({ isProcessing }) {
  const map = useMap();

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas', 'leaflet-zoom-animated');
    canvas.style.pointerEvents = 'none'; 
    canvas.style.zIndex = 50;
    
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    // DECREASED DENSITY: Halved the particle count from 2500 to 1200
    const numParticles = 1200; 
    let particles = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        lat: Math.random() * 40 - 10,
        lng: Math.random() * 60 + 50,
        age: Math.random() * 100,
        maxAge: 40 + Math.random() * 60
      });
    }

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

      const baseColor = isProcessing ? '245, 158, 11' : '255, 255, 255';
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
  }, [map, isProcessing]);

  return null;
}

// 6. NEW: Horizontal Legend Component
function MapLegend() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-8 z-[1000] pointer-events-auto drop-shadow-2xl">
      <div 
        className="h-10 rounded-full flex items-center justify-between px-5 text-white text-[14px] font-bold tracking-wide border border-white/20 shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        style={{
          width: '380px',
          // Matches the blue-to-purple gradient from the screenshot
          background: 'linear-gradient(to right, #388299, #28a08d, #4eb353, #99c746, #c5d73f, #f2a638, #ed5840, #d53664, #9a2cb1)'
        }}
      >
        <span className="mr-3 font-semibold opacity-90 text-[15px]">mm</span>
        <span>1.5</span>
        <span>2</span>
        <span>3</span>
        <span>7</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
      </div>
    </div>
  );
}

export default function App() {
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);
  const statsContainerRef = useRef(null);
  const highlightCardRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ lat: 19.07, lon: 72.87 });
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
    tl.to(sidebarRef.current, { x: '0%', opacity: 1 })
      .fromTo(headerRef.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1 }, "-=0.8");
  }, []);

  useEffect(() => {
    if (forecast && statsContainerRef.current) {
      gsap.fromTo(statsContainerRef.current.children, 
        { x: -30, opacity: 0 }, 
        { x: 0, opacity: 1, stagger: 0.15, ease: 'power3.out', duration: 0.8 }
      );
      if (highlightCardRef.current) {
        gsap.to(highlightCardRef.current, { y: -5, repeat: -1, yoyo: true, ease: 'sine.inOut', duration: 2.5 });
      }
    }
  }, [forecast]);

  const handleSearch = async (e) => {
    if(e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/forecast?date=2023-06-01&lat=${coords.lat}&lon=${coords.lon}`);
      if (!res.ok) throw new Error("Data not found");
      const data = await res.json();
      setForecast(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch AI predictions. Ensure FastAPI backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      
      <div className="absolute inset-0 z-0 bg-slate-950">
        <MapContainer 
          center={[coords.lat, coords.lon]} 
          zoom={5} 
          style={{ height: '100%', width: '100%', backgroundColor: '#1e293b' }} 
          zoomControl={false}
          preferCanvas={true}
        >
          {/* Base Dark Canvas Map */}
          <TileLayer
            attribution='&copy; Esri & RainViewer'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            keepBuffer={4}
            updateWhenIdle={true}
          />
          
          {/* NEW: Global Earthy Map Tint (Placed under the radar/particles) */}
          <Rectangle 
            bounds={[[-90, -180], [90, 180]]} 
            pathOptions={{ stroke: false, fillColor: '#92754d', fillOpacity: 0.25 }} 
            interactive={false} 
          />
          
          <RealWorldRadarLayer />
          <WindyParticleLayer isProcessing={loading} />

          <Marker position={[coords.lat, coords.lon]} icon={radarIcon}>
            <Popup>
              Lat: {coords.lat} <br/> Lon: {coords.lon}
            </Popup>
          </Marker>
          <MapController center={[coords.lat, coords.lon]} />
          <MapInteraction setCoords={setCoords} />
        </MapContainer>
      </div>

      <MapLegend />

      <div 
        ref={sidebarRef} 
        style={{ opacity: 0, transform: 'translateX(-100%)' }}
        className="absolute top-0 left-0 h-full w-full md:w-[480px] z-10 bg-slate-900/70 backdrop-blur-3xl border-r border-slate-700/50 shadow-[20px_0_50px_rgba(0,0,0,0.5)] p-8 flex flex-col justify-between overflow-y-auto pointer-events-auto"
      >
        <div>
          <header ref={headerRef} className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 drop-shadow-sm mb-2">
              SIH 26080
            </h1>
            <p className="text-lg text-slate-200 font-medium">Regime-Aware Post-Processing</p>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Highly accurate AI forecasting enables reliable alternative farming. By eliminating the pressure to fall back on chemical pesticides and fertilizers to guarantee yields, we ensure crops avoid becoming toxic and future generations remain healthier.
            </p>
          </header>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Latitude</label>
                <input 
                  type="number" step="0.01" 
                  value={coords.lat} 
                  onChange={(e) => setCoords({...coords, lat: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs uppercase tracking-widest text-slate-500 mb-1">Longitude</label>
                <input 
                  type="number" step="0.01" 
                  value={coords.lon} 
                  onChange={(e) => setCoords({...coords, lon: parseFloat(e.target.value)})}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-600/90 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.3)] disabled:opacity-50 tracking-wide cursor-pointer"
            >
              {loading ? "Running AI Pipeline..." : "Execute Correction"}
            </button>
          </form>

          {forecast && (
            <div ref={statsContainerRef} className="space-y-4">
              <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Synoptic Regime</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">{forecast.synoptic_regime}</div>
              </div>

              <div ref={highlightCardRef} className="bg-gradient-to-br from-amber-900/30 to-slate-800/40 p-5 rounded-2xl border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">AI Corrected Rainfall</span>
                <div className="text-5xl font-black text-white mt-2 tracking-tighter">
                  {forecast.rainfall_mm.ai_corrected}<span className="text-2xl font-medium text-amber-500/80 ml-1">mm</span>
                </div>
                <div className="text-sm text-slate-400 mt-3 font-mono bg-slate-950/50 inline-block px-3 py-1 rounded-full">
                  Adjustment: {forecast.bias_adjustment_applied > 0 ? '+' : ''}{forecast.bias_adjustment_applied} mm
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}