import os
import sqlite3
import tempfile
import zipfile
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from auth import require_tutor
from models import User

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/backup")
async def create_backup(current_user: User = Depends(require_tutor)):
    """Generates a complete backup of the application data in a zip file."""
    
    # Create a temporary directory to store the backup files
    temp_dir = tempfile.mkdtemp()
    db_backup_path = os.path.join(temp_dir, "tutor.db")
    zip_path = os.path.join(temp_dir, f"webkhata-backup-{datetime.now().strftime('%Y-%m-%d-%H%M')}.wkb")
    
    try:
        # Safe sqlite backup
        src = sqlite3.connect(settings.DB_PATH)
        dst = sqlite3.connect(db_backup_path)
        with src, dst:
            src.backup(dst)
        dst.close()
        src.close()
        
        # Create a zip file containing the db
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(db_backup_path, arcname="tutor.db")
            
        tasks = BackgroundTasks()
        tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        return FileResponse(
            path=zip_path,
            filename=os.path.basename(zip_path),
            media_type="application/zip",
            background=tasks
        )
    except Exception as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to create backup: {str(e)}")

@router.post("/restore")
async def restore_backup(file: UploadFile = File(...), current_user: User = Depends(require_tutor)):
    """Restores application data from a backup zip file."""
    if not file.filename.endswith('.wkb') and not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Invalid backup file format. Must be .wkb or .zip")
        
    temp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(temp_dir, "uploaded_backup.zip")
    
    try:
        # Save uploaded file
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Extract the zip
        extracted_db_path = None
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(temp_dir)
            if "tutor.db" in zipf.namelist():
                extracted_db_path = os.path.join(temp_dir, "tutor.db")
            else:
                # Try to find any .db file if named differently
                for name in zipf.namelist():
                    if name.endswith('.db'):
                        extracted_db_path = os.path.join(temp_dir, name)
                        break
                        
        if not extracted_db_path or not os.path.exists(extracted_db_path):
            raise HTTPException(status_code=400, detail="No valid database found in the backup file")
            
        # Safe sqlite restore (copy from extracted to main db)
        src = sqlite3.connect(extracted_db_path)
        dst = sqlite3.connect(settings.DB_PATH)
        with src, dst:
            src.backup(dst)
        dst.close()
        src.close()
        
        return {"message": "Restore completed successfully"}
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid zip file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore backup: {str(e)}")
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
