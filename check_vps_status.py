import paramiko

host = "169.58.147.145"
user = "root"
password = "FloK78PRLxu93E7e"

def check():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, port=22, username=user, password=password, timeout=10)
    
    print("Checking VPS service status...")
    stdin, stdout, stderr = ssh.exec_command("journalctl -u atigi_crm --no-pager -n 30")
    print(stdout.read().decode('utf-8'))
    
    stdin, stdout, stderr = ssh.exec_command("curl -s -I http://127.0.0.1:8000")
    print("HTTP Check 8000:")
    print(stdout.read().decode('utf-8'))

    stdin, stdout, stderr = ssh.exec_command("curl -s -I http://127.0.0.1:80")
    print("HTTP Check 80:")
    print(stdout.read().decode('utf-8'))

    ssh.close()

if __name__ == "__main__":
    check()
