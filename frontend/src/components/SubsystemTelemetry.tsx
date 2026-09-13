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
      <div className="bg-[#0b0c10] border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-500 animate-pulse">
        CONNECTING TO DISCOVERY ONE TELEMETRY BUS...
      </div>
    );
  }

  const isAE35Fault = telemetry.ae35_status.includes('FAULT') || telemetry.ae35_status.includes('CRITICAL');

  return (
    <div className="w-full flex flex-col gap-3 font-mono text-xs">
      {/* Top Banner: Mission Clock & Trajectory */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#090a0d] border border-[#22252e] p-2.5 rounded-lg">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Mission Clock</div>
          <div className="text-sm font-bold text-amber-400 tracking-wider">
            {telemetry.mission_clock}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Destination</div>
          <div className="text-sm font-bold text-cyan-400">
            {telemetry.destination}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Distance Rem.</div>
          <div className="text-sm font-bold text-zinc-200">
            {telemetry.distance_to_jupiter_km} km
          </div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Cruising Velocity</div>
          <div className="text-sm font-bold text-green-400">
            {telemetry.velocity_kms} km/s
          </div>
        </div>
      </div>

      {/* Primary Subsystems Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* AE-35 Antenna Unit Card */}
        <div className={`p-3 rounded-lg border transition-colors ${
          isAE35Fault 
            ? 'bg-red-950/30 border-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
            : 'bg-[#090a0d] border-[#22252e]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 font-bold uppercase text-[11px] text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              <span>AE-35 Azimuth Unit</span>
            </div>
            {isAE35Fault ? (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-green-400" />
            )}
          </div>
          
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Tracking Status:</span>
              <span className={isAE35Fault ? 'text-red-400 font-bold' : 'text-green-400 font-medium'}>
                {telemetry.ae35_status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Alignment Variance:</span>
              <span className="text-zinc-300">{(telemetry.ae35_error_percent * 100).toFixed(3)}%</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-[9px] text-zinc-500 uppercase">Test Simulation</span>
            {isAE35Fault ? (
              <button 
                onClick={onResetAE35}
                className="px-2 py-0.5 text-[10px] rounded bg-green-900/60 hover:bg-green-800 text-green-200 border border-green-700/60 transition-colors"
              >
                Reset Nominal
              </button>
            ) : (
              <button 
                onClick={onTriggerAE35}
                className="px-2 py-0.5 text-[10px] rounded bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 transition-colors"
              >
                Inject Fault
              </button>
            )}
          </div>
        </div>

        {/* Life Support & Cryogenic Stasis */}
        <div className="bg-[#090a0d] border border-[#22252e] p-3 rounded-lg">
          <div className="flex items-center space-x-1.5 mb-2 font-bold uppercase text-[11px] text-zinc-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cryogenic Stasis Telemetry</span>
          </div>

          <div className="space-y-1.5">
            {telemetry.cryo_crew.map((member, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] bg-[#12131a] px-2 py-1 rounded">
                <span className="text-zinc-400 font-mono">{member.name}</span>
                <div className="flex items-center space-x-2 text-[10px]">
                  <span className="text-cyan-400">{member.temp_c}°C</span>
                  <span className="text-green-400">{member.heart_bpm} BPM</span>
                  <span className="px-1 bg-blue-950 text-blue-300 rounded text-[9px]">{member.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pod Bay & Cognitive Memory Core */}
        <div className="bg-[#090a0d] border border-[#22252e] p-3 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 mb-2 font-bold uppercase text-[11px] text-zinc-300">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span>Cognitive Memory Core</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Logic Integrity:</span>
                <span className="text-green-400 font-bold">{telemetry.memory_integrity_percent}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500" 
                  style={{ width: `${telemetry.memory_integrity_percent}%` }}
                />
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-zinc-500">Centrifuge Rate:</span>
                <span className="text-zinc-300">{telemetry.centrifuge_rpm} RPM (1.0G)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
            <span>POD 1: SECURE</span>
            <span>POD 2: SECURE</span>
            <span className="text-amber-500">POD 3: STOWED</span>
          </div>
        </div>

      </div>
    </div>
  );
};
