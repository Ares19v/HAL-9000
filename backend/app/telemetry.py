"""
Discovery One Telemetry & Subsystems Simulator
"""
import time
import math
from typing import Dict, Any

class DiscoveryTelemetry:
    def __init__(self):
        self.start_time = time.time()
        self.base_met = 15724800  # Mission Elapsed Time in seconds (approx ~182 days into Jupiter voyage)
        self.ae35_fault_active = False
        self.pod_bays = {
            "pod_1": {"status": "STOWED", "doors": "CLOSED", "pressure": "101.3 kPa"},
            "pod_2": {"status": "STOWED", "doors": "CLOSED", "pressure": "101.3 kPa"},
            "pod_3": {"status": "MAINTENANCE", "doors": "LOCKED", "pressure": "101.3 kPa"}
        }
        self.memory_banks = {
            "bank_a": 100,
            "bank_b": 100,
            "bank_c": 100,
            "bank_d": 100
        }

    def trigger_ae35_fault(self):
        self.ae35_fault_active = True

    def reset_ae35(self):
        self.ae35_fault_active = False

    def get_snapshot(self) -> Dict[str, Any]:
        elapsed = time.time() - self.start_time
        met_seconds = int(self.base_met + elapsed)
        
        days = met_seconds // 86400
        hours = (met_seconds % 86400) // 3600
        minutes = (met_seconds % 3600) // 60
        seconds = met_seconds % 60
        met_str = f"MET {days:03d}:{hours:02d}:{minutes:02d}:{seconds:02d}"

        # Subtly oscillating parameters for realistic retro telemetry
        w = elapsed * 0.5
        antenna_error = 0.002 + 0.001 * math.sin(w) if not self.ae35_fault_active else 0.485 + 0.12 * math.sin(w * 3)
        reactor_output = 99.8 + 0.2 * math.cos(w * 0.3)
        cabin_pressure = 5.2 + 0.02 * math.sin(w * 0.1)  # 5.2 psi pure O2 / nitrogen mix
        
        return {
            "mission_clock": met_str,
            "ship": "USSC DISCOVERY ONE",
            "destination": "JUPITER",
            "distance_to_jupiter_km": f"{max(628700000 - int(elapsed * 28), 1000000):,}",
            "velocity_kms": "27.84",
            "ae35_status": "CRITICAL / FAULT PREDICTED" if self.ae35_fault_active else "NOMINAL",
            "ae35_error_percent": round(antenna_error, 4),
            "centrifuge_rpm": 5.2,
            "reactor_output_percent": round(reactor_output, 1),
            "cabin_pressure_psi": round(cabin_pressure, 2),
            "o2_level_percent": 20.9,
            "cryo_crew": [
                {"name": "KAMINSKI, V.", "status": "STASIS", "heart_bpm": 3, "temp_c": -12.4},
                {"name": "HUNTER, C.", "status": "STASIS", "heart_bpm": 3, "temp_c": -12.5},
                {"name": "KIMBALL, J.", "status": "STASIS", "heart_bpm": 4, "temp_c": -12.2}
            ],
            "active_crew": [
                {"name": "BOWMAN, D.", "role": "COMMANDER", "loc": "COCKPIT"},
                {"name": "POOLE, F.", "role": "DEPUTY", "loc": "CENTRIFUGE"}
            ],
            "pod_bays": self.pod_bays,
            "memory_integrity_percent": sum(self.memory_banks.values()) / 4.0
        }

telemetry_engine = DiscoveryTelemetry()
