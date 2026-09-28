import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CloudRain, Lock, User as UserIcon, ArrowRight, ShieldAlert, Sun, Moon, UserPlus, LogIn, BadgeCheck } from 'lucide-react';

export default function Login({ onLogin, isDarkMode, setIsDarkMode }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', id: '', password: '' });

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef([]);
  const formRef = useRef(null);
  const rainRefs = useRef([]);

  const titleText = "RainRegime".split("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(cardRef.current, { transformPerspective: 1500, rotationX: 10, rotationY: -10, z: -200, opacity: 0 });
      
      rainRefs.current.forEach((drop) => {
        gsap.fromTo(drop, 
          { y: -150, opacity: 0 },
          { y: window.innerHeight + 150, opacity: "random(0.2, 0.6)", duration: "random(2, 4)", repeat: -1, ease: "linear", delay: "random(0, 4)" }
        );
      });

      const tl = gsap.timeline();
      tl.to(cardRef.current, { duration: 1.5, rotationX: 0, rotationY: 0, z: 0, opacity: 1, ease: "expo.out" })
      .fromTo(logoRef.current, { scale: 0.5, opacity: 0, filter: "blur(5px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1, ease: "back.out(1.5)" }, "-=1.2")
      .fromTo(titleRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.8, ease: "power3.out" }, "-=0.8")
      .fromTo(formRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6");
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e) => {
    if (isSubmitting || !cardRef.current) return;
    const xPos = (e.clientX / window.innerWidth - 0.5) * 12; 
    const yPos = (e.clientY / window.innerHeight - 0.5) * 12;
    gsap.to(cardRef.current, { rotationY: xPos, rotationX: -yPos, ease: "power3.out", duration: 1 });
  };

  const handleMouseLeave = () => {
    if (isSubmitting) return;
    gsap.to(cardRef.current, { rotationY: 0, rotationX: 0, ease: "expo.out", duration: 1.5 });
  };

  const toggleMode = () => {
    gsap.to(formRef.current, {
      opacity: 0, y: 10, duration: 0.2,
      onComplete: () => {
        setIsLoginMode(!isLoginMode);
        setFormData({ name: '', id: '', password: '' });
        gsap.to(formRef.current, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
      }
    });
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    setTimeout(() => {
      let userData = null;

      if (!isLoginMode) {
        if (localStorage.getItem(formData.id)) {
          alert("Government ID already registered. Please switch to login.");
          setIsSubmitting(false);
          return;
        }
        localStorage.setItem(formData.id, JSON.stringify({ name: formData.name, password: formData.password }));
        userData = { name: formData.name, id: formData.id };
      } else {
        if (formData.id === 'SIH-EVAL-26080' && formData.password === 'admin123') {
          userData = { name: 'Evaluation Judge', id: 'SIH-EVAL-26080' };
        } else {
          const userRecord = JSON.parse(localStorage.getItem(formData.id));
          if (!userRecord || userRecord.password !== formData.password) {
            alert("Unauthorized: Invalid Government ID or Passcode.");
            setIsSubmitting(false);
            return;
          }
          userData = { name: userRecord.name, id: formData.id };
        }
      }
      triggerPortalExit(userData);
    }, 800);
  };

  const triggerPortalExit = (userData) => {
    gsap.killTweensOf(cardRef.current);
    gsap.set(cardRef.current, { rotationX: 0, rotationY: 0 });

    const exitTl = gsap.timeline({ onComplete: () => onLogin(userData) });
    exitTl
      .to(formRef.current, { y: 20, opacity: 0, duration: 0.3, ease: "power2.in" })
      .to(titleRef.current, { y: -10, opacity: 0, stagger: 0.02, duration: 0.3, ease: "power2.in" }, "-=0.2")
      .to(cardRef.current, { backgroundColor: "transparent", borderColor: "transparent", boxShadow: "none", duration: 0.2 }, "-=0.1")
      .to(cardRef.current, { z: -1500, scale: 0, opacity: 0, duration: 0.8, ease: "power2.inOut", force3D: true }, "-=0.1")
      .to(logoRef.current, { rotation: -180, opacity: 0, duration: 0.6, ease: "power3.in", force3D: true }, "-=0.8");
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <>
      <style>{`
        :root {
          /* Smooth Cream/Off-White Palette */
          --bg-app: #F4F2EA;
          --bg-card: #FCFAF5;
          --bg-input: #EAE6DB;
          --border-subtle: #DCD8CC;
          --text-primary: #292524;
          --text-secondary: #57534E;
          --primary-accent: #D97706;
          --badge-success: #10B981;
        }
        .dark {
          --bg-app: #0E1117;
          --bg-card: #161B22;
          --bg-input: #1F242C;
          --border-subtle: #2B313A;
          --text-primary: #F0EBE1; /* Soft cream-white for dark mode text */
          --text-secondary: #9CA3AF;
          --primary-accent: #D97706;
          --badge-success: #10B981;
        }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .ambient-grid {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
                            linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px);
          opacity: 0.2;
          animation: gridMove 5s linear infinite;
        }
      `}</style>

      <div ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className={`relative w-screen h-screen flex items-center justify-center overflow-hidden font-sans perspective-[1200px] transition-colors duration-500 ${isDarkMode ? 'dark' : ''} bg-[var(--bg-app)] text-[var(--text-primary)]`}>
        <div className="absolute inset-0 ambient-grid pointer-events-none"></div>

        {[...Array(20)].map((_, i) => (
          <div key={`rain-${i}`} ref={el => rainRefs.current[i] = el} className="absolute w-[2px] h-32 bg-gradient-to-b from-transparent to-[var(--primary-accent)] pointer-events-none rounded-full" style={{ left: `${Math.random() * 100}%`, top: -150 }} />
        ))}

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-6 right-8 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--primary-accent)] rounded-full shadow-sm transition-all duration-300 z-50 cursor-pointer">
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>

        <div ref={cardRef} className="relative z-10 w-full max-w-md p-10 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl transform-style-preserve-3d">
          <div className="flex flex-col items-center mb-8">
            <div ref={logoRef} className="w-16 h-16 bg-[var(--bg-app)] border-2 border-[var(--primary-accent)] rounded-xl flex items-center justify-center mb-5 shadow-sm">
              <CloudRain size={32} className="text-[var(--primary-accent)]" />
            </div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight flex gap-[2px]">
              {titleText.map((char, i) => (<span key={i} ref={el => titleRef.current[i] = el} className="inline-block">{char}</span>))}
              <span className="text-[var(--primary-accent)] ml-1">AI</span>
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-[2px] uppercase mt-2 flex items-center gap-2">
              <ShieldAlert size={14} className="text-[var(--primary-accent)]" /> Govt Identity Verification
            </p>
          </div>

          <div ref={formRef}>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginMode && (
                <div className="relative group">
                  <BadgeCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors duration-300 group-focus-within:text-[var(--primary-accent)]" />
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Analyst Full Name" className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-md py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary-accent)] transition-all duration-300 font-medium" />
                </div>
              )}
              <div className="relative group">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors duration-300 group-focus-within:text-[var(--primary-accent)]" />
                <input required type="text" name="id" value={formData.id} onChange={handleInputChange} placeholder="Government ID / Evaluator Key" className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-md py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary-accent)] transition-all duration-300 font-medium" />
              </div>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors duration-300 group-focus-within:text-[var(--primary-accent)]" />
                <input required type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Secure Passcode" className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-md py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary-accent)] transition-all duration-300 font-medium" />
              </div>

              <div className="pt-4">
                <button disabled={isSubmitting} type="submit" className="w-full bg-[var(--primary-accent)] text-white border-transparent font-bold py-3.5 rounded-md flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer">
                  <span>{isSubmitting ? "VERIFYING CREDENTIALS..." : (isLoginMode ? "AUTHENTICATE" : "REGISTER ANALYST")}</span>
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-[var(--border-subtle)] pt-5 text-center">
              <button onClick={toggleMode} type="button" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary-accent)] transition-colors duration-300 flex items-center justify-center gap-2 w-full cursor-pointer">
                {isLoginMode ? (<><UserPlus size={14} /> NO CLEARANCE? REGISTER NEW ID</>) : (<><LogIn size={14} /> ALREADY REGISTERED? PROCEED TO LOGIN</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}