import paramiko

host = "169.58.147.145"
new_password = "bbeknur983"

def reload_server():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, port=22, username="root", password=new_password, timeout=10)
    print("Restarting services...")
    ssh.exec_command("systemctl restart atigi_crm && systemctl restart nginx")
    print("Services restarted!")
    ssh.close()

if __name__ == "__main__":
    reload_server()
