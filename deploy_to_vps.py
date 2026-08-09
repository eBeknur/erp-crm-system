import paramiko
from scp import SCPClient
import os
import sys
import tarfile
import subprocess

HOST = "169.58.147.145"
USER = "root"
PASSWORD = "FloK78PRLxu93E7e"
REMOTE_DIR = "/opt/atigi_crm"
ARCHIVE_NAME = "atigi_crm_bundle.tar.gz"

def create_archive():
    print("📦 Creating production deployment archive...")
    project_root = os.path.abspath(os.path.dirname(__file__))
    archive_path = os.path.join(project_root, ARCHIVE_NAME)

    if os.path.exists(archive_path):
        os.remove(archive_path)

    with tarfile.open(archive_path, "w:gz") as tar:
        # Add backend excluding venv and __pycache__
        backend_dir = os.path.join(project_root, "backend")
        for root, dirs, files in os.walk(backend_dir):
            dirs[:] = [d for d in dirs if d not in ['venv', '__pycache__', '.pytest_cache', '.git']]
            for file in files:
                if file.endswith('.pyc') or file.endswith('.sqlite'):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_root)
                tar.add(full_path, arcname=rel_path)

        # Add frontend dist
        frontend_dist = os.path.join(project_root, "frontend", "dist")
        if os.path.exists(frontend_dist):
            for root, dirs, files in os.walk(frontend_dist):
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, project_root)
                    tar.add(full_path, arcname=rel_path)

    size_mb = os.path.getsize(archive_path) / (1024 * 1024)
    print(f"✅ Archive created: {ARCHIVE_NAME} ({size_mb:.2f} MB)")
    return archive_path

def run_remote_commands(ssh, commands):
    for cmd in commands:
        print(f"🚀 Running: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8').strip()
        err = stderr.read().decode('utf-8').strip()

        if out:
            print(f"  [OUT] {out}")
        if err:
            print(f"  [ERR] {err}")

        if exit_status != 0:
            print(f"⚠️ Command '{cmd}' failed with status {exit_status}")

def deploy():
    # 1. Build archive
    archive_path = create_archive()

    # 2. SSH connect
    print(f"🔑 Connecting SSH to {USER}@{HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=HOST, port=22, username=USER, password=PASSWORD, timeout=15)
    print("✅ Connected to VPS!")

    # 3. SCP upload
    print("📤 Uploading deployment archive to VPS...")
    with SCPClient(ssh.get_transport()) as scp:
        scp.put(archive_path, f"/tmp/{ARCHIVE_NAME}")
    print("✅ Archive uploaded!")

    # 4. Remote Setup & Installation
    setup_commands = [
        f"mkdir -p {REMOTE_DIR}",
        f"tar -xzf /tmp/{ARCHIVE_NAME} -C {REMOTE_DIR}",
        "apt-get update -y",
        "apt-get install -y python3 python3-pip python3-venv nginx ufw",
        f"python3 -m venv {REMOTE_DIR}/backend/venv",
        f"{REMOTE_DIR}/backend/venv/bin/pip install --upgrade pip",
        f"{REMOTE_DIR}/backend/venv/bin/pip install -r {REMOTE_DIR}/backend/requirements.txt",
        # Clean reset DB on VPS
        f"cd {REMOTE_DIR}/backend && {REMOTE_DIR}/backend/venv/bin/python reset_clean_data.py"
    ]

    print("⚙️ Executing server setup & python environment setup...")
    run_remote_commands(ssh, setup_commands)

    # 5. Create Systemd Service for FastAPI
    service_content = f"""[Unit]
Description=Atigi CRM FastAPI Service
After=network.target

[Service]
User=root
WorkingDirectory={REMOTE_DIR}/backend
ExecStart={REMOTE_DIR}/backend/venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
"""
    
    print("📌 Setting up systemd service 'atigi_crm.service'...")
    ssh.exec_command(f"cat << 'EOF' > /etc/systemd/system/atigi_crm.service\n{service_content}\nEOF")

    # 6. Configure Nginx Reverse Proxy on Port 80
    nginx_content = f"""server {{
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {{
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
    print("🌐 Setting up Nginx Reverse Proxy on Port 80...")
    ssh.exec_command("rm -f /etc/nginx/sites-enabled/default")
    ssh.exec_command(f"cat << 'EOF' > /etc/nginx/sites-available/atigi_crm\n{nginx_content}\nEOF")
    ssh.exec_command("ln -sf /etc/nginx/sites-available/atigi_crm /etc/nginx/sites-enabled/atigi_crm")

    # 7. Open Firewall Ports & Restart Services
    systemd_commands = [
        "ufw allow 80/tcp",
        "ufw allow 8000/tcp",
        "ufw allow 22/tcp",
        "systemctl daemon-reload",
        "systemctl enable atigi_crm",
        "systemctl restart atigi_crm",
        "systemctl restart nginx",
        "systemctl status atigi_crm --no-pager"
    ]
    print("🔄 Restarting and enabling atigi_crm and nginx services...")
    run_remote_commands(ssh, systemd_commands)

    # 8. Test HTTP response
    stdin, stdout, stderr = ssh.exec_command("curl -s -I http://127.0.0.1:8000 | head -n 5")
    print("🔥 Backend HTTP Check:")
    print(stdout.read().decode('utf-8'))

    ssh.close()
    print("🎉 DEPLOYMENT TO VPS COMPLETE!")

if __name__ == "__main__":
    deploy()
