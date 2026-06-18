#!/bin/sh
# WebKhata Installer for OpenWrt / Radxa E20C
set -e

# Stop on Ctrl+C (SIGINT)
trap "echo '\nInstallation aborted by user.'; exit 1" INT

INSTALL_DIR="/opt/webkhata"
SERVICE_NAME="webkhata"

echo "=== WebKhata Installer ==="

# Ensure Python3 and dependencies are installed
echo "Installing Python3 and dependencies..."
opkg update || true
opkg install python3-light python3-pip python3-sqlite3 || true

# Create install directory
mkdir -p "$INSTALL_DIR"

# Copy application files
cp -r backend "$INSTALL_DIR/"
cp -r scripts "$INSTALL_DIR/"

# Install Python dependencies
cd "$INSTALL_DIR/backend"
# Try with --break-system-packages for newer pip/Python, fallback to normal
pip3 install --break-system-packages -r requirements.txt || pip3 install -r requirements.txt

# Pre-compile Python files for faster startup on ARM
python3 -m compileall "$INSTALL_DIR/backend/" -q

# Install init.d service
cat > /etc/init.d/$SERVICE_NAME << EOF
#!/bin/sh /etc/rc.common
START=90
STOP=10
USE_PROCD=1

start_service() {
    procd_open_instance
    procd_set_param command /usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 6540 --workers 1 --app-dir $INSTALL_DIR/backend
    procd_set_param respawn 3600 5 5
    procd_set_param stdout 1
    procd_set_param stderr 1
    procd_set_param pidfile /var/run/$SERVICE_NAME.pid
    procd_close_instance
}
EOF
chmod +x /etc/init.d/$SERVICE_NAME

# Enable and start service
/etc/init.d/$SERVICE_NAME enable
/etc/init.d/$SERVICE_NAME start

# Setup daily backup cron
mkdir -p "$INSTALL_DIR/backups"
chmod +x "$INSTALL_DIR/scripts/backup.sh"
(crontab -l 2>/dev/null | grep -v "$INSTALL_DIR/scripts/backup.sh"; echo "0 3 * * * $INSTALL_DIR/scripts/backup.sh >> /var/log/webkhata-backup.log 2>&1") | crontab -

echo "=== WebKhata installed and running on port 6540 ==="
echo "Access: http://$(ip addr show br-lan | grep 'inet ' | awk '{print $2}' | cut -d/ -f1):6540"
echo "Default login: admin / changeme"
