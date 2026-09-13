import React from 'react';
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
  if (!telemetry) {
    return (
      <div className="bg-[#08090d] border border-zinc-800 rounded-lg p-5 font-mono text-xs text-zinc-500 animate-pulse flex items-center justify-center">
        [INITIALIZING DISCOVERY ONE AVIONICS BUS...]
      </div>
    );
  }

  const isAE35Fault = telemetry.ae35_status.includes('FAULT') || telemetry.ae35_status.includes('CRITICAL');

  return (
    <div className="w-full flex flex-col gap-3 font-mono text-xs select-none">
      
      {/* Top Banner: Mission Elapsed Time & Trajectory */}
      <div className="relative crt-monitor border border-[#232733] p-3 rounded-lg overflow-hidden">
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2 border-b border-[#1b1e28] text-[10px] text-zinc-500">
          <span className="font-bold tracking-widest text-zinc-400">DISCOVERY NAV-COM // METRICS</span>
          <span>JUPITER ORBIT INSERTION T-MINUS 182d</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Mission Elapsed Time</div>
            <div className="text-base font-bold text-amber-400 tracking-wider phosphor-amber">
              {telemetry.mission_clock}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Target Destination</div>
            <div className="text-base font-bold text-cyan-400 phosphor-cyan">
              {telemetry.destination}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Distance Remaining</div>
            <div className="text-base font-bold text-zinc-200">
              {telemetry.distance_to_jupiter_km} <span className="text-[10px] text-zinc-500">KM</span>
            </div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Cruising Velocity</div>
            <div className="text-base font-bold text-green-400 phosphor-green">
              {telemetry.velocity_kms} <span className="text-[10px] text-zinc-500">KM/S</span>
            </div>
          </div>
        </div>

        {/* Minimalist Vector Silhouette of USSC Discovery One */}
        <div className="mt-2.5 pt-2 border-t border-[#181b24] flex items-center justify-between">
          <svg className="w-full h-7 text-zinc-600 opacity-60" viewBox="0 0 400 30" fill="none">
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
            {/* AE-35 Antenna on Spine */}
            <line x1="145" y1="11" x2="145" y2="4" stroke="currentColor" strokeWidth="1.5" />
            <ellipse cx="145" cy="3" rx="7" ry="2.5" stroke={isAE35Fault ? '#ef4444' : '#22c55e'} strokeWidth="1.5" fill="none" />
            {/* Propulsion Reactor Unit */}
            <path d="M295 8 L355 8 L365 11 L370 15 L365 19 L355 22 L295 22 Z" stroke="currentColor" strokeWidth="1.5" fill="#0d0f14" />
            <line x1="370" y1="12" x2="385" y2="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="370" y1="15" x2="390" y2="15" stroke="currentColor" strokeWidth="1.5" />
            <line x1="370" y1="18" x2="385" y2="20" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      {/* Subsystems Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* AE-35 Unit Monitor */}
        <div className={`relative crt-monitor p-3.5 rounded-lg border transition-all duration-300 overflow-hidden ${
          isAE35Fault 
            ? 'border-red-600/90 bg-red-950/25 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
            : 'border-[#222530] bg-[#07080c]'
        }`}>
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />

          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-1.5 font-bold uppercase text-[11px] text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>AE-35 POINTING UNIT</span>
            </div>
            {isAE35Fault ? (
              <div className="flex items-center space-x-1 text-red-400 font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px]">ALERT</span>
              </div>
            ) : (
              <ShieldCheck className="w-4 h-4 text-green-400" />
            )}
          </div>
          
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Tracking Status:</span>
              <span className={isAE35Fault ? 'text-red-400 font-bold phosphor-red' : 'text-green-400 font-medium phosphor-green'}>
                {telemetry.ae35_status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Azimuth Variance:</span>
              <span className={isAE35Fault ? 'text-red-300 font-bold' : 'text-zinc-300'}>
                {(telemetry.ae35_error_percent * 100).toFixed(3)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Earth Pointing Link:</span>
              <span className="text-zinc-400">CARRIER 2.29 GHz</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-800/70 flex items-center justify-between">
            <span className="text-[9px] text-zinc-500 uppercase">Fault Injector</span>
            {isAE35Fault ? (
              <button 
                onClick={onResetAE35}
                className="px-2.5 py-1 text-[10px] rounded bg-green-950/80 hover:bg-green-900 text-green-200 border border-green-700/80 transition-colors font-bold"
              >
                Restore Nominal
              </button>
            ) : (
              <button 
                onClick={onTriggerAE35}
                className="px-2.5 py-1 text-[10px] rounded bg-red-950/90 hover:bg-red-900 text-red-200 border border-red-800 transition-colors font-bold shadow-[0_0_8px_rgba(239,68,68,0.3)]"
              >
                Inject Anomaly
              </button>
            )}
          </div>
        </div>

        {/* Life Support & Cryogenic Stasis */}
        <div className="relative crt-monitor border border-[#222530] p-3.5 rounded-lg overflow-hidden bg-[#07080c]">
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />

          <div className="flex items-center justify-between mb-2.5 font-bold uppercase text-[11px] text-zinc-300">
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>CRYO-STASIS CREW</span>
            </div>
            <span className="text-[9px] text-cyan-500">3 SUBJECTS</span>
          </div>

          <div className="space-y-1.5">
            {telemetry.cryo_crew.map((member, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] bg-[#0c0e14] px-2 py-1.5 rounded border border-[#181a24]">
                <span className="text-zinc-300 font-mono font-medium">{member.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-cyan-400 font-bold">{member.temp_c}°C</span>
                  <span className="text-green-400 font-bold phosphor-green">{member.heart_bpm} BPM</span>
                  <span className="px-1 py-0.5 bg-blue-950/90 text-blue-300 rounded text-[8px] font-bold border border-blue-800/60">
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cognitive Core & Centrifuge */}
        <div className="relative crt-monitor border border-[#222530] p-3.5 rounded-lg overflow-hidden bg-[#07080c] flex flex-col justify-between">
          <div className="absolute inset-0 crt-scanlines pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2.5 font-bold uppercase text-[11px] text-zinc-300">
              <div className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-red-400" />
                <span>LOGIC CORE INTEGRITY</span>
              </div>
              <span className="text-green-400 font-bold phosphor-green">100.0%</span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="w-full bg-[#12141c] h-2 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className="bg-green-500 h-full transition-all duration-500 shadow-[0_0_8px_#22c55e]" 
                  style={{ width: `${telemetry.memory_integrity_percent}%` }}
                />
              </div>
              <div className="flex justify-between pt-1 text-[10px]">
                <span className="text-zinc-500">Carousel Centrifuge:</span>
                <span className="text-zinc-300 font-bold">{telemetry.centrifuge_rpm} RPM (1.0G)</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Cabin Atmosphere:</span>
                <span className="text-zinc-300">{telemetry.cabin_pressure_psi} PSI (O2/N2)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-400">
            <span className="text-green-500">POD 1: SECURED</span>
            <span className="text-green-500">POD 2: SECURED</span>
            <span className="text-amber-400">POD 3: STOWED</span>
          </div>
        </div>

      </div>
    </div>
  );
};
