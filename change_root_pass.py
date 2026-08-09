import paramiko
import time

host = "169.58.147.145"
old_password = "FloK78PRLxu93E7e"
new_password = "bbeknur983"

def change_password():
    print(f"🔑 Connecting to VPS ({host}) using existing credentials...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname=host, port=22, username="root", password=old_password, timeout=15)
        print("✅ SSH Connection established with old password!")
    except Exception as e:
        print(f"❌ Failed to connect with old password: {e}")
        # Check if already updated
        try:
            ssh.connect(hostname=host, port=22, username="root", password=new_password, timeout=15)
            print("✅ Already updated to new password!")
            ssh.close()
            return True
        except Exception as e2:
            print(f"❌ Failed to connect with new password: {e2}")
            return False

    print("⚙️ Updating root password on server...")
    stdin, stdout, stderr = ssh.exec_command(f'echo "root:{new_password}" | chpasswd')
    exit_status = stdout.channel.recv_exit_status()
    err = stderr.read().decode('utf-8').strip()
    
    if exit_status == 0:
        print("✅ Password change command executed successfully on server!")
    else:
        print(f"⚠️ Error changing password: {err}")
        ssh.close()
        return False
        
    ssh.close()
    time.sleep(2)

    # Verification
    print("🔍 Verifying new password connection...")
    try:
        ssh_verify = paramiko.SSHClient()
        ssh_verify.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh_verify.connect(hostname=host, port=22, username="root", password=new_password, timeout=15)
        print("🎉 SUCCESS! Verified connection with NEW password!")
        ssh_verify.close()
        return True
    except Exception as e:
        print(f"❌ Verification failed with new password: {e}")
        return False

if __name__ == "__main__":
    change_password()
