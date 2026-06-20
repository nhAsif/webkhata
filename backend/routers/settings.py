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

@router.post("/refetch-quotes")
async def refetch_quotes(current_user: User = Depends(require_tutor)):
    from routers.dashboard import clear_quotes_cache, fetch_quotes_background
    clear_quotes_cache()
    fetch_quotes_background()
    return {"message": "Quotes refetched successfully"}

@router.post("/refetch-words")
async def refetch_words(db: Session = Depends(get_db), current_user: User = Depends(require_tutor)):
    from models import DailyVocabularySet
    from datetime import date
    from routers.vocabulary import get_daily_vocabulary
    
    today = date.today()
    db.query(DailyVocabularySet).filter(DailyVocabularySet.date == today).delete()
    db.commit()
    
    # Fetch instantly
    get_daily_vocabulary(db, current_user)
    
    return {"message": "Words refetched instantly"}

import json

SETTINGS_FILE = "./system_settings.json"

def get_system_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"language": "en"}

def save_system_settings(data):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(data, f)
    except Exception as e:
        print(f"Failed to save system settings: {e}")

@router.get("/language")
async def get_language():
    cfg = get_system_settings()
    return {"language": cfg.get("language", "en")}

@router.put("/language")
async def update_language(payload: dict, current_user: User = Depends(require_tutor)):
    lang = payload.get("language")
    if lang not in ["en", "bn"]:
        raise HTTPException(status_code=400, detail="Invalid language")
    
    cfg = get_system_settings()
    cfg["language"] = lang
    save_system_settings(cfg)
    return {"message": "Language updated successfully", "language": lang}
