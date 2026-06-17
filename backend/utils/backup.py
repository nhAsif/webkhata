import subprocess
import os
from datetime import datetime
from pathlib import Path


def backup_database(db_path: str, backup_dir: str) -> str:
    """
    Use SQLite Online Backup API via sqlite3 CLI.
    Returns the backup file path on success, raises on failure.
    """
    backup_dir_path = Path(backup_dir)
    backup_dir_path.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir_path / f"tutor_{timestamp}.db"

    result = subprocess.run(
        ["sqlite3", db_path, f".backup '{backup_file}'"],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Backup failed: {result.stderr}")

    return str(backup_file)
