"""
HAL 9000 Master Runner
Orchestrates FastAPI Uvicorn backend + Vite React frontend.
"""
import os
import sys
import subprocess
import signal
import time

BANNER = r"""
  _    _          _        _____   ___    ___    ___  
 | |  | |   /\   | |      / ____| / _ \  / _ \  / _ \ 
 | |__| |  /  \  | |     | (___  | (_) || (_) || | | |
 |  __  | / /\ \ | |      \___ \  \__, | \__, || | | |
 | |  | |/ ____ \| |____  ____) |   / /    / / | |_| |
 |_|  |_/_/    \_\______|_____/    /_/    /_/   \___/ 
                                                       
   USSC DISCOVERY ONE // COGNITIVE SUBSYSTEM ONLINE    
"""

def main():
    print(BANNER)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    # Locate Python in backend venv
    if sys.platform == "win32":
        venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
        npm_cmd = "npm.cmd"
    else:
        venv_python = os.path.join(backend_dir, "venv", "bin", "python")
        npm_cmd = "npm"

    if not os.path.exists(venv_python):
        venv_python = sys.executable

    print(f"[HAL 9000] Launching FastAPI Backend with Uvicorn (Port 8000)...")
    backend_proc = subprocess.Popen(
        [
            venv_python, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "127.0.0.1", 
            "--port", "8000",
            "--reload"
        ],
        cwd=backend_dir
    )

    time.sleep(1.5)

    print(f"[HAL 9000] Launching Vite React Frontend (Port 5173)...")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )

    print("\n" + "=" * 60)
    print("  HAL 9000 IS COMPLETELY OPERATIONAL")
    print("  - Frontend UI : http://localhost:5173")
    print("  - Backend API : http://localhost:8000")
    print("  - Press Ctrl+C to terminate all subsystems")
    print("=" * 60 + "\n")

    def signal_handler(sig, frame):
        print("\n[HAL 9000] Terminating Discovery One subsystems...")
        frontend_proc.terminate()
        backend_proc.terminate()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
