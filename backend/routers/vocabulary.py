import os
from datetime import date, datetime
from typing import List
import json
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

import models
import schemas
from database import get_db
from auth import get_current_user
from config import settings
from google import genai

router = APIRouter(
    prefix="/api/vocabulary",
    tags=["vocabulary"],
)

# Configure Gemini API
client = genai.Client(api_key=settings.GEMINI_API_KEY)

PROMPT = """
Generate 20 English vocabulary words suitable for students in Bangladesh learning English. 
The words should be unique, useful, and not overly complex.
Provide the response strictly as a JSON array of objects. Do not include any markdown formatting such as ```json. Just return the raw JSON array.
Each object must have the following keys exactly:
- "word" (string)
- "bangla_meaning" (string, the meaning in Bengali)
- "part_of_speech" (string)
- "synonyms" (string, comma separated list)
- "antonyms" (string, comma separated list)
- "example_sentence" (string, an English example sentence)
- "bangla_sentence_meaning" (string, the Bengali translation of the example sentence)
"""

def fetch_words_from_gemini():
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=PROMPT
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        words = json.loads(text)
        return words
    except Exception as e:
        print(f"Error fetching from Gemini: {e}")
        return []


@router.get("/daily", response_model=List[schemas.DailyVocabularyResponse])
def get_daily_vocabulary(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = date.today()
    
    daily_sets = db.query(models.DailyVocabularySet).filter(models.DailyVocabularySet.date == today).order_by(models.DailyVocabularySet.display_order).all()
    
    if len(daily_sets) > 20:
        # Trim extra words if there are more than 20 due to previous bug
        for item in daily_sets[20:]:
            db.delete(item)
        db.commit()
        daily_sets = daily_sets[:20]
    elif len(daily_sets) < 20:
        words_needed = 20 - len(daily_sets)
        # Fetch new words
        new_words_data = fetch_words_from_gemini()
        if not new_words_data:
            raise HTTPException(status_code=500, detail="Failed to fetch new vocabulary")
            
        current_display_order = len(daily_sets)
        added_count = 0
        
        # Process up to words_needed words
        for data in new_words_data:
            if added_count >= words_needed:
                break
                
            # Insert or update VocabularyWord
            word_obj = db.query(models.VocabularyWord).filter(func.lower(models.VocabularyWord.word) == data['word'].lower()).first()
            if not word_obj:
                word_obj = models.VocabularyWord(
                    word=data['word'],
                    bangla_meaning=data['bangla_meaning'],
                    part_of_speech=data['part_of_speech'],
                    synonyms=data.get('synonyms', ''),
                    antonyms=data.get('antonyms', ''),
                    example_sentence=data.get('example_sentence', ''),
                    bangla_sentence_meaning=data.get('bangla_sentence_meaning', '')
                )
                db.add(word_obj)
                db.commit()
                db.refresh(word_obj)
            
            # Check if it is already in today's set
            existing_daily = db.query(models.DailyVocabularySet).filter(
                models.DailyVocabularySet.date == today,
                models.DailyVocabularySet.word_id == word_obj.id
            ).first()
            
            if not existing_daily:
                current_display_order += 1
                daily_item = models.DailyVocabularySet(
                    date=today,
                    word_id=word_obj.id,
                    display_order=current_display_order
                )
                db.add(daily_item)
                added_count += 1
        db.commit()
        
        daily_sets = db.query(models.DailyVocabularySet).filter(models.DailyVocabularySet.date == today).order_by(models.DailyVocabularySet.display_order).all()

    return daily_sets


class ProgressUpdate(BaseModel):
    word_id: int
    viewed: bool = False
    bookmarked: bool = False


@router.post("/progress", response_model=schemas.StudentVocabularyProgressResponse)
def update_progress(data: ProgressUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.student_id:
        raise HTTPException(status_code=403, detail="Only students can have vocabulary progress")
        
    progress = db.query(models.StudentVocabularyProgress).filter(
        models.StudentVocabularyProgress.student_id == current_user.student_id,
        models.StudentVocabularyProgress.word_id == data.word_id
    ).first()
    
    if not progress:
        progress = models.StudentVocabularyProgress(
            student_id=current_user.student_id,
            word_id=data.word_id,
            viewed=data.viewed,
            bookmarked=data.bookmarked,
            viewed_at=datetime.now() if data.viewed else None
        )
        db.add(progress)
    else:
        if data.viewed and not progress.viewed:
            progress.viewed_at = datetime.now()
        progress.viewed = data.viewed or progress.viewed
        progress.bookmarked = data.bookmarked
        
    db.commit()
    db.refresh(progress)
    return progress


@router.get("/progress/stats")
def get_progress_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.student_id:
        raise HTTPException(status_code=403, detail="Only students can have vocabulary progress")
        
    student_id = current_user.student_id
    today = date.today()
    
    total_learned = db.query(models.StudentVocabularyProgress).filter(
        models.StudentVocabularyProgress.student_id == student_id,
        models.StudentVocabularyProgress.viewed == True
    ).count()
    
    # In sqlite, dates can be tricky. Let's do simple python-side or use func.date
    all_viewed = db.query(models.StudentVocabularyProgress).filter(
        models.StudentVocabularyProgress.student_id == student_id,
        models.StudentVocabularyProgress.viewed == True
    ).all()
    
    learned_this_week = sum(1 for p in all_viewed if p.viewed_at and (today - p.viewed_at.date()).days <= 7)
    learned_this_month = sum(1 for p in all_viewed if p.viewed_at and (today - p.viewed_at.date()).days <= 30)
    
    today_words_ids = [s.word_id for s in db.query(models.DailyVocabularySet).filter(models.DailyVocabularySet.date == today).all()]
    viewed_today = db.query(models.StudentVocabularyProgress).filter(
        models.StudentVocabularyProgress.student_id == student_id,
        models.StudentVocabularyProgress.word_id.in_(today_words_ids),
        models.StudentVocabularyProgress.viewed == True
    ).count()
    
    return {
        "total_words_learned": total_learned,
        "words_learned_this_week": learned_this_week,
        "words_learned_this_month": learned_this_month,
        "today_viewed": viewed_today,
        "today_total": len(today_words_ids)
    }


@router.get("/search", response_model=List[schemas.VocabularyWordResponse])
def search_words(q: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    search = f"%{q}%"
    results = db.query(models.VocabularyWord).filter(
        (models.VocabularyWord.word.ilike(search)) |
        (models.VocabularyWord.bangla_meaning.ilike(search)) |
        (models.VocabularyWord.part_of_speech.ilike(search))
    ).limit(50).all()
    return results


@router.get("/bookmarked", response_model=List[schemas.StudentVocabularyProgressResponse])
def get_bookmarked_words(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.student_id:
        raise HTTPException(status_code=403, detail="Only students can have bookmarked words")
        
    results = db.query(models.StudentVocabularyProgress).filter(
        models.StudentVocabularyProgress.student_id == current_user.student_id,
        models.StudentVocabularyProgress.bookmarked == True
    ).all()
    return results


@router.get("/practice", response_model=List[schemas.VocabularyWordResponse])
def practice_words(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = date.today()
    # Exclude today's words
    today_word_ids = [w.word_id for w in db.query(models.DailyVocabularySet.word_id).filter(models.DailyVocabularySet.date == today).all()]
    
    query = db.query(models.VocabularyWord)
    if today_word_ids:
        query = query.filter(~models.VocabularyWord.id.in_(today_word_ids))
        
    all_words = query.all()
    if not all_words:
        return []
        
    practice_count = min(10, len(all_words))
    return random.sample(all_words, practice_count)
