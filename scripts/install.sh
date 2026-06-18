#!/bin/sh
# WebKhata Installer for OpenWrt / Radxa E20C
set -e

# Stop on Ctrl+C (SIGINT)
trap "echo '\nInstallation aborted by user.'; exit 1" INT

INSTALL_DIR="/opt/webkhata"
SERVICE_NAME="webkhata"

echo "=== WebKhata Installer ==="

printf "Enter your Gemini API key (or press Enter to skip): "
read GEMINI_API_KEY

# Ensure Python3 and dependencies are installed
echo "Installing Python3 and dependencies..."
opkg update || true
opkg install python3-light python3-pip python3-sqlite3 || true

# Create install directory
mkdir -p "$INSTALL_DIR"

# Copy application files
cp -r backend "$INSTALL_DIR/"
cp -r scripts "$INSTALL_DIR/"

# Set Gemini API key in .env
if [ -n "$GEMINI_API_KEY" ]; then
    # Remove existing key if any
    [ -f "$INSTALL_DIR/backend/.env" ] && sed -i '/^GEMINI_API_KEY=/d' "$INSTALL_DIR/backend/.env"
    echo "GEMINI_API_KEY=$GEMINI_API_KEY" >> "$INSTALL_DIR/backend/.env"
    echo "Gemini API key configured."
fi

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
    procd_set_param command /bin/sh -c "cd $INSTALL_DIR/backend && exec /usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 6540 --workers 1"
    procd_set_param respawn
    procd_set_param stdout 1
    procd_set_param stderr 1
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
