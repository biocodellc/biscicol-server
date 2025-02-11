README.txt - Server Setup Guide for ElasticServer
================================

Setup for PostgreSQL, Jetty, User Accounts, SSH, and Firewalls on Ubuntu 24.04.1 LTS

---------------------------------
1. System Preparation
---------------------------------

1.1 Update System
-----------------
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y

1.2 Check Available Storage
---------------------------
df -h
lsblk

If `/media/volume/Elastic` is not mounted, mount it manually:
sudo mkdir -p /media/volume/Elastic
sudo mount /dev/sdb /media/volume/Elastic

Make the mount persistent by adding to `/etc/fstab`:
echo "UUID=a419bfdb-9965-405b-a78a-f1c5a8643eeb /media/volume/Elastic ext4 defaults 0 2" | sudo tee -a /etc/fstab

Test the mount:
sudo mount -a

---------------------------------
2. Create a Consultant User Account
---------------------------------

2.1 Add User
------------
sudo adduser consultant

2.2 Grant Limited Sudo Privileges
---------------------------------
sudo usermod -aG sudo consultant
sudo visudo

Add the following line at the end:
consultant ALL=(ALL) NOPASSWD: /usr/bin/apt, /usr/bin/systemctl, /usr/bin/service, /usr/bin/restart, /usr/bin/shutdown, /usr/bin/reboot

---------------------------------
3. Configure SSH Access for the Consultant
---------------------------------

3.1 Enable SSH
--------------
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh
sudo systemctl status ssh

3.2 Restrict SSH Access
-----------------------
sudo nano /etc/ssh/sshd_config

Make the following changes:
- Disable root login:
  PermitRootLogin no
- Restrict SSH access to specific users:
  AllowUsers your_admin_user consultant
- Disable password-based authentication (use SSH keys instead):
  PasswordAuthentication no

Save and restart SSH:
sudo systemctl restart ssh

3.3 Set Up SSH Key Authentication (Recommended)
-----------------------------------------------
Create `.ssh` directory and add consultant's public key:
sudo mkdir -p /home/consultant/.ssh
echo "ssh-rsa AAAAB..." | sudo tee -a /home/consultant/.ssh/authorized_keys
sudo chmod 600 /home/consultant/.ssh/authorized_keys
sudo chown -R consultant:consultant /home/consultant/.ssh

Verify login via SSH:
ssh consultant@your-server-ip

---------------------------------
4. Configure Firewall (UFW) and Security Measures
---------------------------------

4.1 Allow Essential Services
----------------------------
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # Nginx HTTP
sudo ufw allow 443/tcp   # Nginx HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (if remote access is needed)

4.2 Enable the Firewall
-----------------------
sudo ufw enable
sudo ufw status

4.3 Set Up Fail2Ban to Prevent Brute Force Attacks
---------------------------------------------------
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

Configure SSH protection:
sudo nano /etc/fail2ban/jail.local

Add:
[sshd]
enabled = true
bantime  = 600
findtime  = 600
maxretry = 3

Restart Fail2Ban:
sudo systemctl restart fail2ban

---------------------------------
5. Install and Configure PostgreSQL 16
---------------------------------

5.1 Install PostgreSQL 16
-------------------------
sudo apt install postgresql-16 -y

5.2 Stop PostgreSQL Service Before Moving Data Directory
---------------------------------------------------------
sudo systemctl stop postgresql

5.3 Initialize PostgreSQL Data Directory on /media/volume/Elastic
-----------------------------------------------------------------
sudo -u postgres /usr/lib/postgresql/16/bin/initdb -D /media/volume/Elastic/postgresql/16/main

5.4 Update PostgreSQL Configuration
-----------------------------------
sudo nano /etc/postgresql/16/main/postgresql.conf

Find `data_directory` and update it:
data_directory = '/media/volume/Elastic/postgresql/16/main'

5.5 Set Correct Permissions
---------------------------
sudo chown -R postgres:postgres /media/volume/Elastic/postgresql
sudo chmod 700 /media/volume/Elastic/postgresql

5.6 Start PostgreSQL
--------------------
sudo systemctl start postgresql
sudo systemctl enable postgresql

---------------------------------
6. Install and Configure Jetty 12
---------------------------------

6.1 Download and Install Jetty 12
---------------------------------
cd /opt
sudo wget -O jetty-distribution.tar.gz https://repo1.maven.org/maven2/org/eclipse/jetty/jetty-distribution/12.0.0/jetty-distribution-12.0.0.tar.gz
sudo tar -xvzf jetty-distribution.tar.gz
sudo mv jetty-distribution-12.0.0 jetty12
sudo rm jetty-distribution.tar.gz

6.2 Create Jetty Base Directory
-------------------------------
sudo mkdir /opt/jetty12-base
sudo chown -R jetty:jetty /opt/jetty12-base

6.3 Create Jetty Service File
-----------------------------
sudo nano /etc/systemd/system/jetty.service

Paste the following:
[Unit]
Description=Jetty 12 Web Server
After=network.target

[Service]
User=jetty
WorkingDirectory=/opt/jetty12
ExecStart=/usr/bin/java -jar /opt/jetty12/start.jar --module=server --jetty.base=/opt/jetty12-base
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target

Enable and start Jetty:
sudo systemctl daemon-reload
sudo systemctl enable jetty
sudo systemctl start jetty
sudo systemctl status jetty

---------------------------------
7. Deploy a WAR File to Jetty
---------------------------------

7.1 Place the WAR File
----------------------
cd /opt/jetty12-base/webapps/
sudo cp /path/to/yourapp.war /opt/jetty12-base/webapps/yourapp.war
sudo chown jetty:jetty /opt/jetty12-base/webapps/yourapp.war

7.2 Restart Jetty
-----------------
sudo systemctl restart jetty

7.3 Verify Deployment
---------------------
curl -I http://localhost:8080/yourapp/

If the application does not deploy, manually extract it:
cd /opt/jetty12-base/webapps/
sudo mkdir yourapp
sudo unzip yourapp.war -d yourapp/
sudo chown -R jetty:jetty yourapp/
sudo systemctl restart jetty

---------------------------------
8. Verify Services on Reboot
---------------------------------

Reboot the server:
sudo reboot

After reboot, check PostgreSQL:
sudo systemctl status postgresql

Check Jetty:
sudo systemctl status jetty

Check SSH:
sudo systemctl status ssh

Check firewall:
sudo ufw status

---------------------------------
9. Troubleshooting
---------------------------------

Check PostgreSQL Logs:
sudo journalctl -xeu postgresql --no-pager --lines=50

Check Jetty Logs:
sudo journalctl -xeu jetty --no-pager --lines=50

Check Web Service:
curl -I http://localhost:8080/

Check Firewall Rules:
sudo ufw status verbose

---------------------------------
End of README.txt
---------------------------------

