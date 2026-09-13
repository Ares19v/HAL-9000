import React, { useEffect, useRef } from 'react';
import type { TelemetryData } from '../types';
import { Radio, AlertTriangle, ShieldCheck, Cpu, Activity } from 'lucide-react';

interface SubsystemTelemetryProps {
  telemetry: TelemetryData | null;
  onTriggerAE35: () => void;
  onResetAE35: () => void;
}

export const SubsystemTelemetry: React.FC<SubsystemTelemetryProps> = ({
  telemetry,
  onTriggerAE35,
  onResetAE35
}) => {
  const ecgCanvasRef = useRef<HTMLCanvasElement>(null);
  const ecgOffsetRef = useRef<number>(0);

  // Animated ECG canvas loop for the 3 hibernating crew members
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const renderECG = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      ctx.clearRect(0, 0, width, height);

      ecgOffsetRef.current += 1.2;

      // Draw 3 horizontal ECG lines for the 3 cryo crew
      const lanes = [height * 0.22, height * 0.52, height * 0.82];
      const colors = ['#38bdf8', '#22c55e', '#a855f7'];

      lanes.forEach((baseline, laneIdx) => {
        ctx.strokeStyle = '#151824';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, baseline);
        ctx.lineTo(width, baseline);
        ctx.stroke();

        ctx.strokeStyle = colors[laneIdx];
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 6;
        ctx.shadowColor = colors[laneIdx];
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
          const t = (x + ecgOffsetRef.current + laneIdx * 90) % 180;
          let y = baseline;

          // P-Q-R-S-T ECG cardiac complex
          if (t > 30 && t < 40) {
            // P wave
            y -= Math.sin(((t - 30) / 10) * Math.PI) * 3;
          } else if (t >= 45 && t < 48) {
            // Q wave
            y += 2;
          } else if (t >= 48 && t < 53) {
            // R spike
            y -= 14;
          } else if (t >= 53 && t < 57) {
            // S wave
            y += 4;
          } else if (t >= 65 && t < 80) {
            // T wave
            y -= Math.sin(((t - 65) / 15) * Math.PI) * 4;
          }

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.restore();
      animId = requestAnimationFrame(renderECG);
    };

    renderECG();
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!telemetry) {
    return (
      <div className="bg-[#08090d] border border-zinc-800 rounded-lg p-5 font-mono text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        [INITIALIZING DISCOVERY ONE AVIONICS BUS...]
      </div>
    );
  }

  const isAE35Fault = telemetry.ae35_status.includes('FAULT') || telemetry.ae35_status.includes('CRITICAL');
  const azimuth = telemetry.ae35_azimuth_deg ?? 142.34;
  const elevation = telemetry.ae35_elevation_deg ?? -18.21;
  const signalDb = telemetry.earth_signal_db ?? -84.2;

  return (
    <div className="w-full flex flex-col gap-3.5 font-mono text-xs select-none">
      
      {/* Top Banner: Mission Elapsed Time & Trajectory */}
      <div className="relative crt-monitor border border-[#232736] p-4 rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2.5 border-b border-[#1b1f2d] text-[10px] text-zinc-400">
          <span className="font-extrabold tracking-widest text-zinc-200 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span className="tracking-[0.2em]">DISCOVERY NAV-COM // FLIGHT TELEMETRY</span>
          </span>
          <span className="text-zinc-500 font-bold tracking-widest">TRANSMISSION: NOMINAL</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div className="bg-[#0b0d14]/80 p-2 rounded border border-[#181a24]">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Mission Elapsed</div>
            <div className="text-base font-extrabold text-amber-400 tracking-wider phosphor-amber mt-0.5">
              {telemetry.mission_clock}
            </div>
          </div>
          <div className="bg-[#0b0d14]/80 p-2 rounded border border-[#181a24]">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Target Horizon</div>
            <div className="text-base font-extrabold text-cyan-400 phosphor-cyan mt-0.5">
              {telemetry.destination}
            </div>
          </div>
          <div className="bg-[#0b0d14]/80 p-2 rounded border border-[#181a24]">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Distance Rem.</div>
            <div className="text-base font-bold text-zinc-200 mt-0.5">
              {telemetry.distance_to_jupiter_km} <span className="text-[10px] text-zinc-500">KM</span>
            </div>
          </div>
          <div className="bg-[#0b0d14]/80 p-2 rounded border border-[#181a24]">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Cruising Speed</div>
            <div className="text-base font-bold text-green-400 phosphor-green mt-0.5">
              {telemetry.velocity_kms} <span className="text-[10px] text-zinc-500">KM/S</span>
            </div>
          </div>
        </div>

        {/* Minimalist Vector Silhouette of USSC Discovery One with Animated Propulsion & Signals */}
        <div className="mt-3.5 pt-2.5 border-t border-[#181b26] flex items-center justify-between relative overflow-hidden">
          <svg className="w-full h-8 text-zinc-500 opacity-90" viewBox="0 0 400 30" fill="none">
            {/* Command Sphere */}
            <circle cx="25" cy="15" r="11" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="25" cy="15" r="4" fill="currentColor" opacity="0.4" />
            {/* Spine Neck */}
            <line x1="36" y1="15" x2="60" y2="15" stroke="currentColor" strokeWidth="2" />
            {/* Modular Spine Container Blocks */}
            {[70, 95, 120, 145, 170, 195, 220, 245, 270].map((x, i) => (
              <g key={i}>
                <rect x={x - 6} y="11" width="12" height="8" stroke="currentColor" strokeWidth="1" fill="#0d0f14" />
                <line x1={x + 6} y1="15" x2={x + 19} y2="15" stroke="currentColor" strokeWidth="1.5" />
              </g>
            ))}
            {/* AE-35 Antenna on Spine with Animated Transmission Waves */}
            <line x1="145" y1="11" x2="145" y2="4" stroke="currentColor" strokeWidth="1.5" />
            <ellipse 
              cx="145" 
              cy="3" 
              rx="8" 
              ry="3" 
              stroke={isAE35Fault ? '#ef4444' : '#22c55e'} 
              strokeWidth="1.5" 
              fill={isAE35Fault ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'} 
              className="animate-pulse"
            />
            {/* Microwave signal pulse emitted from dish */}
            {!isAE35Fault && (
              <circle cx="145" cy="3" r="1.5" fill="#22c55e">
                <animate attributeName="r" values="1.5;14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Propulsion Reactor Unit with Animated Plasma Exhaust Plume */}
            <path d="M295 8 L355 8 L365 11 L370 15 L365 19 L355 22 L295 22 Z" stroke="currentColor" strokeWidth="1.5" fill="#0d0f14" />
            <line x1="370" y1="12" x2="385" y2="10" stroke="#00e5ff" strokeWidth="1.5" opacity="0.8">
              <animate attributeName="x2" values="385;395;385" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
            </line>
            <line x1="370" y1="15" x2="395" y2="15" stroke="#38bdf8" strokeWidth="2" opacity="0.9">
              <animate attributeName="x2" values="395;405;395" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;1;0.7" dur="0.6s" repeatCount="indefinite" />
            </line>
            <line x1="370" y1="18" x2="385" y2="20" stroke="#00e5ff" strokeWidth="1.5" opacity="0.8">
              <animate attributeName="x2" values="385;395;385" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
            </line>
          </svg>
        </div>
      </div>

      {/* Subsystems Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* AE-35 Unit Radar & Dish Telemetry */}
        <div className={`relative crt-monitor p-3.5 rounded-xl border transition-all duration-300 overflow-hidden shadow-md ${
          isAE35Fault 
            ? 'border-red-600/90 bg-red-950/25 shadow-[0_0_22px_rgba(239,68,68,0.25)]' 
            : 'border-[#222530] bg-[#07080c]'
        }`}>
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 font-bold uppercase text-[11px] text-zinc-200">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>AE-35 POINTING</span>
            </div>
            {isAE35Fault ? (
              <div className="flex items-center space-x-1 text-red-400 font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px]">CRITICAL</span>
              </div>
            ) : (
              <ShieldCheck className="w-4 h-4 text-green-400" />
            )}
          </div>
          
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Tracking:</span>
              <span className={isAE35Fault ? 'text-red-400 font-bold phosphor-red' : 'text-green-400 font-bold phosphor-green'}>
                {telemetry.ae35_status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Az / El:</span>
              <span className={isAE35Fault ? 'text-red-300 font-bold' : 'text-zinc-200 font-mono'}>
                {azimuth}° / {elevation}°
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Carrier:</span>
              <span className={isAE35Fault ? 'text-red-400 font-bold' : 'text-cyan-400 font-bold font-mono'}>
                {signalDb} dBm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Variance:</span>
              <span className={isAE35Fault ? 'text-red-400 font-bold' : 'text-zinc-300 font-mono'}>
                {(telemetry.ae35_error_percent * 100).toFixed(3)}%
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Fault Sim</span>
            {isAE35Fault ? (
              <button 
                onClick={onResetAE35}
                className="px-2.5 py-1 text-[10px] rounded bg-green-950/80 hover:bg-green-900 text-green-200 border border-green-700/80 transition-colors font-bold cursor-pointer"
              >
                Restore Nominal
              </button>
            ) : (
              <button 
                onClick={onTriggerAE35}
                className="px-2.5 py-1 text-[10px] rounded bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800 transition-colors font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)] cursor-pointer"
              >
                Inject Anomaly
              </button>
            )}
          </div>
        </div>

        {/* Live Cryogenic Stasis ECG Monitor */}
        <div className="relative crt-monitor border border-[#222530] p-3.5 rounded-xl overflow-hidden bg-[#07080c] shadow-md flex flex-col justify-between">
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2 font-bold uppercase text-[11px] text-zinc-200">
              <div className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>CRYO-STASIS ECG</span>
              </div>
              <span className="text-[9px] text-cyan-400 font-bold">3 SUBJECTS</span>
            </div>

            {/* Live ECG Heartbeat Oscilloscope */}
            <div className="w-full h-12 bg-[#050608] rounded border border-[#1b1e28] overflow-hidden my-1">
              <canvas ref={ecgCanvasRef} className="w-full h-full block" />
            </div>

            <div className="space-y-1.5 mt-2">
              {telemetry.cryo_crew.map((member, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] bg-[#0b0d13] px-2 py-0.5 rounded border border-[#161822]">
                  <span className="text-zinc-300 font-mono truncate max-w-[85px]">{member.name}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-cyan-400 font-mono">{member.temp_c}°C</span>
                    <span className="text-green-400 font-bold phosphor-green font-mono">{member.heart_bpm} BPM</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cognitive Core & Centrifuge Status */}
        <div className="relative crt-monitor border border-[#222530] p-3.5 rounded-xl overflow-hidden bg-[#07080c] flex flex-col justify-between shadow-md">
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2 font-bold uppercase text-[11px] text-zinc-200">
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-red-400" />
                <span>LOGIC CORE</span>
              </div>
              <span className="text-green-400 font-bold phosphor-green">100.0%</span>
            </div>

            {/* Memory Banks Visualizer */}
            <div className="grid grid-cols-4 gap-1.5 my-2">
              {['BANK A', 'BANK B', 'BANK C', 'BANK D'].map((b, idx) => (
                <div key={idx} className="bg-[#0b0d14] border border-[#1c1f2c] p-1.5 rounded text-center">
                  <div className="text-[8px] text-zinc-400 font-bold tracking-wider">{b}</div>
                  <div className="text-[9px] text-green-400 font-bold phosphor-green mt-0.5">OK</div>
                  <div className="w-full bg-zinc-800 h-1 rounded-full mt-1 overflow-hidden">
                    <div className="bg-green-500 h-full w-full shadow-[0_0_4px_#22c55e]" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-[10px] pt-1">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Centrifuge:</span>
                <span className="text-zinc-300 font-bold font-mono">{telemetry.centrifuge_rpm} RPM (1G)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Cabin Atm:</span>
                <span className="text-zinc-300 font-mono">{telemetry.cabin_pressure_psi} PSI</span>
              </div>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono">
            <span className="text-green-500 font-bold">POD 1: OK</span>
            <span className="text-green-500 font-bold">POD 2: OK</span>
            <span className="text-amber-400 font-bold">POD 3: STOW</span>
          </div>
        </div>

      </div>
    </div>
  );
};
