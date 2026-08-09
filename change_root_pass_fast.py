import paramiko
import time

host = "169.58.147.145"
old_password = "FloK78PRLxu93E7e"
new_password = "bbeknur983"

def run():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # Try connecting with old password
    try:
        print("Connecting with old password...")
        ssh.connect(hostname=host, port=22, username="root", password=old_password, timeout=10)
        print("Connected with old password! Executing chpasswd...")
        stdin, stdout, stderr = ssh.exec_command("chpasswd")
        stdin.write(f"root:{new_password}\n")
        stdin.flush()
        stdin.close()
        out = stdout.read().decode('utf-8')
        err = stderr.read().decode('utf-8')
        print(f"chpasswd out: {out}, err: {err}")
        ssh.close()
    except Exception as e:
        print(f"Old password connection note: {e}")

    time.sleep(2)

    # Test new password
    print("Testing connection with NEW password 'bbeknur983'...")
    ssh_new = paramiko.SSHClient()
    ssh_new.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh_new.connect(hostname=host, port=22, username="root", password=new_password, timeout=10)
        print("🎉 SUCCESS! Logged in with NEW password!")
        stdin, stdout, stderr = ssh_new.exec_command("whoami && uptime")
        print("Command output:", stdout.read().decode('utf-8').strip())
        ssh_new.close()
        return True
    except Exception as e:
        print(f"New password test failed: {e}")
        return False

if __name__ == "__main__":
    run()
