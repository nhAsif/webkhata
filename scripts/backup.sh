#!/bin/sh
# Backup script for SQLite database

DB_PATH="/opt/webkhata/backend/tutor.db"
BACKUP_DIR="/opt/webkhata/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/tutor_$TIMESTAMP.db"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# Use SQLite Online Backup API (safe during active writes)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -ne 0 ]; then
    echo "ERROR: Backup failed!"
    exit 1
fi

# Verify integrity
if sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" | grep -q "ok"; then
    gzip "$BACKUP_FILE"
    echo "Backup OK: ${BACKUP_FILE}.gz"
else
    echo "ERROR: Backup integrity check failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Purge old backups
find "$BACKUP_DIR" -type f -name "*.db.gz" -mtime +$RETENTION_DAYS -delete
echo "Purged backups older than $RETENTION_DAYS days."
