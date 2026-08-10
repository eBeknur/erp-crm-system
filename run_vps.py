import paramiko
import os
import tarfile
import time

host = "169.58.147.145"
user = "root"
password = "bbeknur983"
ARCHIVE_NAME = "atigi_crm_bundle.tar.gz"

def create_archive():
    print("📦 Creating production deployment archive...")
    project_root = os.path.abspath(os.path.dirname(__file__))
    archive_path = os.path.join(project_root, ARCHIVE_NAME)

    if os.path.exists(archive_path):
        os.remove(archive_path)

    with tarfile.open(archive_path, "w:gz") as tar:
        backend_dir = os.path.join(project_root, "backend")
        for root, dirs, files in os.walk(backend_dir):
            dirs[:] = [d for d in dirs if d not in ['venv', '__pycache__', '.pytest_cache', '.git']]
            for file in files:
                if file.endswith('.pyc') or file.endswith('.sqlite'):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, project_root)
                tar.add(full_path, arcname=rel_path)

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

def connect_ssh():
    for attempt in range(1, 6):
        try:
            print(f"Connecting to {host} (attempt {attempt}/5)...")
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(hostname=host, port=22, username=user, password=password, timeout=15)
            print("✅ SSH Connection Established!")
            return ssh
        except Exception as e:
            print(f"Connection attempt {attempt} failed: {e}")
            time.sleep(3)
    raise Exception("Could not connect to SSH after 5 attempts")

def run():
    archive_path = create_archive()
    ssh = connect_ssh()

    print("📤 Uploading bundle via SFTP...")
    sftp = ssh.open_sftp()
    sftp.put(archive_path, f"/tmp/{ARCHIVE_NAME}")
    sftp.close()
    print("✅ Upload complete!")

    print("Executing server setup directly...")
    
    cmds = [
        "timedatectl set-timezone Asia/Tashkent",
        "mkdir -p /opt/atigi_crm",
        "rm -rf /opt/atigi_crm/frontend/dist",
        "tar -xzf /tmp/atigi_crm_bundle.tar.gz -C /opt/atigi_crm",
        "apt-get update -y",
        "DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-pip python3-venv nginx ufw",
        "rm -rf /opt/atigi_crm/backend/venv",
        "python3 -m venv /opt/atigi_crm/backend/venv",
        "/opt/atigi_crm/backend/venv/bin/python3 -m pip install -r /opt/atigi_crm/backend/requirements.txt",
        "chmod -R 755 /opt/atigi_crm",
        "cd /opt/atigi_crm/backend && /opt/atigi_crm/backend/venv/bin/python3 -m app.seed",
        "chmod -R 755 /opt/atigi_crm",
    ]

    for cmd in cmds:
        print(f"🚀 Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8').strip()
        err = stderr.read().decode('utf-8').strip()
        if out:
            print(f"  [OUT] {out[:400]}")
        if err:
            print(f"  [ERR] {err[:400]}")

    # Setup Systemd Service
    service_content = """[Unit]
Description=Atigi CRM FastAPI Service
After=network.target

[Service]
User=root
WorkingDirectory=/opt/atigi_crm/backend
ExecStart=/opt/atigi_crm/backend/venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=3
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
"""
    ssh.exec_command("cat << 'EOF' > /etc/systemd/system/atigi_crm.service\n" + service_content + "\nEOF")

    # Generate SSL certificate for HTTPS (required by Chrome & Safari for camera and GPS)
    ssh.exec_command("mkdir -p /etc/ssl/private /etc/ssl/certs")
    ssh.exec_command("openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/ssl/private/atigi_crm.key -out /etc/ssl/certs/atigi_crm.crt -subj '/CN=169.58.147.145'")

    # Setup Nginx with HTTP & HTTPS and direct SPA static serving
    nginx_content = """server {
    listen 80;
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/certs/atigi_crm.crt;
    ssl_certificate_key /etc/ssl/private/atigi_crm.key;

    client_max_body_size 50M;

    root /opt/atigi_crm/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
"""
    ssh.exec_command("rm -f /etc/nginx/sites-enabled/default")
    ssh.exec_command("cat << 'EOF' > /etc/nginx/sites-available/atigi_crm\n" + nginx_content + "\nEOF")
    ssh.exec_command("ln -sf /etc/nginx/sites-available/atigi_crm /etc/nginx/sites-enabled/atigi_crm")

    final_cmds = [
        "ufw allow 80/tcp || true",
        "ufw allow 443/tcp || true",
        "ufw allow 8000/tcp || true",
        "ufw allow 22/tcp || true",
        "systemctl daemon-reload",
        "systemctl enable atigi_crm",
        "systemctl restart atigi_crm",
        "systemctl restart nginx",
        "systemctl status atigi_crm --no-pager",
        "curl -s -I http://127.0.0.1:8000 | head -n 5"
    ]

    for cmd in final_cmds:
        print(f"🚀 Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8').strip()
        if out:
            print(f"  [OUT] {out[:400]}")

    ssh.close()
    print("🎉 REMOTE SETUP FINISHED SUCCESSFULLY!")

if __name__ == "__main__":
    run()
