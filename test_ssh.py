import paramiko
import sys

host = "169.58.147.145"
password = "FloK78PRLxu93E7e"

def test_ssh():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    for username in ["root", "ubuntu", "debian", "admin"]:
        try:
            print(f"Connecting to {host} as user '{username}'...")
            client.connect(hostname=host, port=22, username=username, password=password, timeout=10)
            print(f"✅ SSH SUCCESS as '{username}'!")
            
            stdin, stdout, stderr = client.exec_command("uname -a && uptime && which python3")
            print("Server Info:")
            print(stdout.read().decode('utf-8'))
            
            client.close()
            return username
        except Exception as e:
            print(f"Failed as '{username}': {e}")
            
    return None

if __name__ == "__main__":
    test_ssh()
