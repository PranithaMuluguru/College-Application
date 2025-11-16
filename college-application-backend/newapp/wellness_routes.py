# apis/wellness_routes.py
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from textblob import TextBlob
import numpy as np
import json
from pydantic import BaseModel
from typing import Optional, List
from newapp.models import (
    WellnessEntry,
    RiskAssessment,
    CounselorForm,      # ← Add this
    DailyAnalysis,
    ChatMessage,
    TimetableEntry,
    TodoItem,
    GradeEntry
)
from newapp.database import get_database as get_db

wellness_bp = APIRouter()

# ==================== PYDANTIC MODELS ====================

class WellnessCheckIn(BaseModel):
    user_id: int
    mood: float
    stress: float
    energy: float
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[float] = None  # Change from str to float
    notes: Optional[str] = None
    triggers: Optional[str] = None
    
    class Config:
        # Allow extra fields to be ignored
        extra = "ignore"

class CounselorFormSubmit(BaseModel):
    user_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    subject: Optional[str] = None
    message: str

# ==================== DEPENDENCY ====================
# You'll need to implement get_db() based on your DB setup
# Example:
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# ==================== DAILY CHECK-IN ====================

@wellness_bp.get("/check-in")
async def wellness_check_in():
    return {"status": "ok"}

@wellness_bp.post('/checkin')
async def create_wellness_checkin(data: WellnessCheckIn, db: Session = Depends(get_db)):
    """Save daily wellness check-in"""
    today = date.today()
    
    print(f"📝 Check-in for user {data.user_id}")
    
    # Check if entry already exists for today
    existing = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == data.user_id,
        WellnessEntry.date == today
    ).first()
    
    if existing:
        # Update existing entry
        existing.mood_score = data.mood
        existing.stress_level = data.stress
        existing.energy_level = data.energy
        existing.sleep_hours = data.sleep_hours
        existing.sleep_quality = data.sleep_quality
        existing.notes = data.notes
        existing.triggers = data.triggers
        existing.updated_at = datetime.utcnow()
        print(f"✏️ Updated existing entry ID: {existing.id}")
    else:
        # Create new entry
        entry = WellnessEntry(
            user_id=data.user_id,
            date=today,
            mood_score=data.mood,
            stress_level=data.stress,
            energy_level=data.energy,
            sleep_hours=data.sleep_hours,
            sleep_quality=data.sleep_quality,
            notes=data.notes,
            triggers=data.triggers
        )
        db.add(entry)
        print(f"➕ Created new entry for {today}")
    
    db.commit()
    
    # Verify it was saved
    count = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == data.user_id
    ).count()
    print(f"📊 Total entries for user {data.user_id}: {count}")
    
    # Generate daily analysis
    analysis = generate_daily_analysis(data.user_id, db)
    
    return {
        "success": True,
        "message": "Check-in saved successfully",
        "analysis": {
            "predicted_mood": analysis.predicted_mood,
            "risk_level": analysis.risk_level,
            "recommendations": json.loads(analysis.recommendations or "[]")
        }
    
    }


# ==================== ANALYTICS ====================

@wellness_bp.get('/analytics/{user_id}')
async def get_wellness_analytics(
    user_id: int,
    days: int = Query(30),
    db: Session = Depends(get_db)
):
    """Get 30-day wellness analytics with charts"""
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    # Fetch entries
    entries = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id,
        WellnessEntry.date >= start_date
    ).order_by(WellnessEntry.date).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="No wellness data found")
    
    # Prepare time series data
    dates = [str(e.date) for e in entries]
    moods = [e.mood_score for e in entries]
    stress = [e.stress_level for e in entries]
    energy = [e.energy_level for e in entries]
    sleep = [e.sleep_hours or 0 for e in entries]
    
    # Calculate statistics
    stats = {
        "avg_mood": round(np.mean(moods), 2),
        "avg_stress": round(np.mean(stress), 2),
        "avg_energy": round(np.mean(energy), 2),
        "avg_sleep": round(np.mean(sleep), 2),
        "total_entries": len(entries),
        "streak": calculate_streak(entries)
    }
    
    # Calculate correlations
    correlations = {
        "sleep_mood": calculate_correlation(sleep, moods),
        "stress_mood": calculate_correlation(stress, moods),
        "energy_mood": calculate_correlation(energy, moods)
    }
    
    # Weekly patterns
    patterns = analyze_weekly_patterns(entries)
    
    # Insights
    insights = generate_insights(stats, correlations, patterns)
    
    return {
        "time_series": {
            "dates": dates,
            "mood": moods,
            "stress": stress,
            "energy": energy,
            "sleep": sleep
        },
        "statistics": stats,
        "correlations": correlations,
        "weekly_patterns": patterns,
        "insights": insights
    }


# ==================== RISK ASSESSMENT ====================

@wellness_bp.get('/risk-assessment/{user_id}')
async def assess_mental_health_risk(user_id: int, db: Session = Depends(get_db)):
    """Comprehensive mental health risk assessment"""
    
    # Get last 14 days of data
    fourteen_days_ago = date.today() - timedelta(days=14)
    entries = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id,
        WellnessEntry.date >= fourteen_days_ago
    ).all()
    
    if len(entries) < 3:
        raise HTTPException(status_code=400, detail="Insufficient data for assessment")
    
    # Calculate risk scores
    mood_risk = calculate_mood_risk(entries)
    stress_risk = calculate_stress_risk(entries)
    sleep_risk = calculate_sleep_risk(entries)
    social_risk = calculate_social_withdrawal_risk(user_id, db)
    academic_risk = calculate_academic_risk(user_id, db)
    
    # Overall risk
    risk_scores = [mood_risk, stress_risk, sleep_risk, social_risk, academic_risk]
    overall_risk = np.mean([s for s in risk_scores if s > 0])
    
    # Determine risk level
    if overall_risk >= 70:
        risk_level = "critical"
        action = "immediate_counselor_contact"
    elif overall_risk >= 50:
        risk_level = "high"
        action = "schedule_counseling_session"
    elif overall_risk >= 30:
        risk_level = "medium"
        action = "monitor_closely"
    else:
        risk_level = "low"
        action = "continue_tracking"
    
    # Generate recommendations
    recommendations = generate_risk_recommendations(risk_level, {
        "mood": mood_risk,
        "stress": stress_risk,
        "sleep": sleep_risk,
        "social": social_risk,
        "academic": academic_risk
    })
    
    # Save assessment
    assessment = RiskAssessment(
        user_id=user_id,
        mood_volatility_score=mood_risk,
        stress_accumulation_score=stress_risk,
        sleep_deterioration_score=sleep_risk,
        social_withdrawal_score=social_risk,
        academic_decline_score=academic_risk,
        overall_risk_level=risk_level,
        risk_percentage=overall_risk,
        recommended_actions=json.dumps(recommendations),
        counselor_contact_recommended=(overall_risk >= 50),
        immediate_intervention=(overall_risk >= 70)
    )
    
    db.add(assessment)
    db.commit()
    
    return {
        "risk_level": risk_level,
        "overall_risk_percentage": round(overall_risk, 1),
        "risk_breakdown": {
            "mood_volatility": round(mood_risk, 1),
            "stress_accumulation": round(stress_risk, 1),
            "sleep_deterioration": round(sleep_risk, 1),
            "social_withdrawal": round(social_risk, 1),
            "academic_decline": round(academic_risk, 1)
        },
        "recommended_action": action,
        "recommendations": recommendations,
        "counselor_contact_needed": overall_risk >= 50,
        "crisis_resources": get_crisis_resources() if overall_risk >= 70 else None
    }


# ==================== COUNSELOR FORM ====================

@wellness_bp.post('/counselor-form')
async def submit_counselor_form(data: CounselorFormSubmit, db: Session = Depends(get_db)):
    """Submit form to reach out to counselor"""
    
    # Analyze message sentiment to determine priority
    message = data.message
    sentiment = TextBlob(message).sentiment.polarity
    
    # Detect urgency keywords
    urgent_keywords = ['suicide', 'kill', 'harm', 'emergency', 'crisis']
    is_urgent = any(keyword in message.lower() for keyword in urgent_keywords)
    
    if is_urgent:
        priority = 'urgent'
    elif sentiment < -0.5:
        priority = 'high'
    elif sentiment < 0:
        priority = 'medium'
    else:
        priority = 'low'
    
    # Categorize
    categories = {
        'stress': ['stress', 'overwhelm', 'pressure', 'anxious'],
        'anxiety': ['anxiety', 'panic', 'worry', 'fear'],
        'depression': ['depressed', 'sad', 'hopeless', 'empty'],
        'sleep': ['sleep', 'insomnia', 'tired', 'fatigue']
    }
    
    category = 'other'
    for cat, keywords in categories.items():
        if any(kw in message.lower() for kw in keywords):
            category = cat
            break
    
    form = CounselorForm(
        user_id=data.user_id,
        name=data.name,
        email=data.email,
        subject=data.subject or 'Mental Health Support Request',
        message=message,
        priority=priority,
        category=category
    )
    
    db.add(form)
    db.commit()
    
    # If urgent, send immediate notification
    if is_urgent:
        # TODO: Send SMS/Email to counselor
        pass
    
    return {
        "success": True,
        "message": "Your message has been sent. A counselor will reach out within 24 hours.",
        "priority": priority,
        "estimated_response_time": "Immediate" if is_urgent else "Within 24 hours",
        "crisis_hotline": "1-800-273-8255" if is_urgent else None
    }


# ==================== ADDITIONAL ROUTES ====================

@wellness_bp.get('/today/{user_id}')
async def get_today_entry(user_id: int, db: Session = Depends(get_db)):
    """Get today's wellness entry if exists"""
    today = date.today()
    
    entry = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id,
        WellnessEntry.date == today
    ).first()
    
    if not entry:
        return {"exists": False}
    
    return {
        "exists": True,
        "mood_score": entry.mood_score,
        "stress_level": entry.stress_level,
        "energy_level": entry.energy_level,
        "sleep_hours": entry.sleep_hours,
        "sleep_quality": entry.sleep_quality,
        "notes": entry.notes,
        "triggers": entry.triggers
    }


@wellness_bp.get('/history/{user_id}')
async def get_wellness_history(user_id: int, db: Session = Depends(get_db)):
    """Get all wellness entries for user"""
    
    entries = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id
    ).order_by(WellnessEntry.date.desc()).all()
    
    # Add debug logging
    print(f"📋 History request for user {user_id}")
    print(f"📊 Found {len(entries)} total entries")
    if entries:
        print(f"📅 Date range: {entries[-1].date} to {entries[0].date}")
    
    result = [{
        "id": e.id,
        "date": str(e.date),
        "mood_score": e.mood_score,
        "stress_level": e.stress_level,
        "energy_level": e.energy_level,
        "sleep_hours": e.sleep_hours,
        "sleep_quality": e.sleep_quality,
        "notes": e.notes,
        "triggers": e.triggers
    } for e in entries]
    
    print(f"✅ Returning {len(result)} entries")
    return result

@wellness_bp.get('/insights/{user_id}')
async def get_personalized_insights(user_id: int, db: Session = Depends(get_db)):
    """Generate personalized wellness insights"""
    
    # Get last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    entries = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id,
        WellnessEntry.date >= thirty_days_ago
    ).all()
    
    if not entries:
        return {"insights": []}
    
    insights = []
    
    # Mood trend
    moods = [e.mood_score for e in entries]
    recent_moods = moods[-7:]
    overall_avg = np.mean(moods)
    recent_avg = np.mean(recent_moods)
    
    if recent_avg > overall_avg + 0.5:
        insights.append({
            "type": "positive",
            "icon": "trending-up",
            "message": f"Your mood is improving! Up {(recent_avg - overall_avg):.1f} points this week.",
            "color": "#10b981"
        })
    elif recent_avg < overall_avg - 0.5:
        insights.append({
            "type": "concern",
            "icon": "trending-down",
            "message": "Your mood has been lower recently. Consider reaching out for support.",
            "color": "#f59e0b"
        })
    
    # Sleep correlation
    sleep_hours = [e.sleep_hours for e in entries if e.sleep_hours]
    if sleep_hours:
        avg_sleep = np.mean(sleep_hours)
        if avg_sleep < 6:
            insights.append({
                "type": "action",
                "icon": "moon",
                "message": f"You're averaging {avg_sleep:.1f}h sleep. Aim for 7-8 hours for better mood.",
                "color": "#3b82f6"
            })
    
    # Stress levels
    stress_levels = [e.stress_level for e in entries]
    avg_stress = np.mean(stress_levels)
    if avg_stress > 7:
        insights.append({
            "type": "alert",
            "icon": "alert-circle",
            "message": "High stress detected. Try meditation or breathing exercises daily.",
            "color": "#ef4444"
        })
    
    # Consistency
    streak = calculate_streak(entries)
    if streak >= 7:
        insights.append({
            "type": "achievement",
            "icon": "trophy",
            "message": f"Amazing! {streak}-day check-in streak! 🎉",
            "color": "#f59e0b"
        })
    
    return {"insights": insights}


@wellness_bp.get('/monthly-report/{user_id}')
async def get_monthly_report(user_id: int, db: Session = Depends(get_db)):
    """Generate comprehensive monthly report"""
    
    # Get current month data
    today = date.today()
    month_start = today.replace(day=1)
    
    entries = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id,
        WellnessEntry.date >= month_start,
        WellnessEntry.date <= today
    ).all()
    
    if not entries:
        raise HTTPException(status_code=404, detail="No data for this month")
    
    # Statistics
    moods = [e.mood_score for e in entries]
    stress = [e.stress_level for e in entries]
    energy = [e.energy_level for e in entries]
    sleep = [e.sleep_hours for e in entries if e.sleep_hours]
    
    # Mood distribution
    mood_distribution = {
        "1-2": sum(1 for m in moods if m <= 2),
        "2-3": sum(1 for m in moods if 2 < m <= 3),
        "3-4": sum(1 for m in moods if 3 < m <= 4),
        "4-5": sum(1 for m in moods if m > 4)
    }
    
    # Stress distribution
    stress_distribution = {
        "Low (1-3)": sum(1 for s in stress if s <= 3),
        "Medium (4-6)": sum(1 for s in stress if 3 < s <= 6),
        "High (7-10)": sum(1 for s in stress if s > 6)
    }
    
    # Best and worst days
    best_entry = max(entries, key=lambda x: x.mood_score)
    worst_entry = min(entries, key=lambda x: x.mood_score)
    
    return {
        "month": month_start.strftime("%B %Y"),
        "total_entries": len(entries),
        "statistics": {
            "avg_mood": round(np.mean(moods), 2),
            "avg_stress": round(np.mean(stress), 2),
            "avg_energy": round(np.mean(energy), 2),
            "avg_sleep": round(np.mean(sleep), 2) if sleep else 0
        },
        "distributions": {
            "mood": mood_distribution,
            "stress": stress_distribution
        },
        "highlights": {
            "best_day": {
                "date": str(best_entry.date),
                "mood": best_entry.mood_score,
                "notes": best_entry.notes
            },
            "worst_day": {
                "date": str(worst_entry.date),
                "mood": worst_entry.mood_score,
                "notes": worst_entry.notes
            }
        }
    }


# ==================== HELPER FUNCTIONS (Keep as-is) ====================
# [All your helper functions remain unchanged - they're pure Python]

def generate_daily_analysis(user_id, db):
    """Generate AI daily analysis"""
    today = date.today()
    
    entry = db.query(WellnessEntry).filter(
        WellnessEntry.user_id == user_id,
        WellnessEntry.date == today
    ).first()
    
    seven_days_ago = datetime.now() - timedelta(days=7)
    message_count = db.query(ChatMessage).filter(
        ChatMessage.sender_id == user_id,
        ChatMessage.created_at >= seven_days_ago
    ).count()
    
    day_name = today.strftime("%A")
    classes_today = db.query(TimetableEntry).filter(
        TimetableEntry.user_id == user_id,
        TimetableEntry.day_of_week == day_name
    ).count()
    
    todos_pending = db.query(TodoItem).filter(
        TodoItem.user_id == user_id,
        TodoItem.is_completed == False
    ).count()
    
    academic_stress = min(10, (classes_today * 1.5) + (todos_pending * 0.5))
    
    predicted_mood = entry.mood_score if entry else 3.0
    predicted_stress = entry.stress_level if entry else 5.0
    
    if predicted_mood < 2.5 or predicted_stress > 7:
        risk_level = "high"
    elif predicted_mood < 3.5 or predicted_stress > 5:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    recommendations = []
    if predicted_stress > 6:
        recommendations.append("Take 10-minute breaks every hour")
        recommendations.append("Try box breathing exercise")
    if classes_today >= 4:
        recommendations.append("Heavy class schedule - pace yourself")
    if message_count < 5:
        recommendations.append("Consider reaching out to friends")
    
    analysis = DailyAnalysis(
        user_id=user_id,
        analysis_date=today,
        predicted_mood=predicted_mood,
        predicted_stress=predicted_stress,
        predicted_energy=entry.energy_level if entry else 5.0,
        message_count=message_count,
        chat_activity_level="low" if message_count < 10 else "medium" if message_count < 30 else "high",
        classes_today=classes_today,
        todos_pending=todos_pending,
        academic_stress=academic_stress,
        risk_level=risk_level,
        recommendations=json.dumps(recommendations)
    )
    
    db.add(analysis)
    db.commit()
    
    return analysis


def calculate_correlation(x, y):
    """Calculate Pearson correlation"""
    if len(x) < 2 or len(y) < 2:
        return 0.0
    x = np.array([v for v in x if v is not None])
    y = np.array([v for v in y if v is not None])
    if len(x) != len(y) or len(x) == 0:
        return 0.0
    return round(float(np.corrcoef(x, y)[0, 1]), 2)


def calculate_streak(entries):
    """Calculate current check-in streak"""
    if not entries:
        return 0
    
    entries_sorted = sorted(entries, key=lambda x: x.date, reverse=True)
    streak = 1
    current_date = entries_sorted[0].date
    
    for i in range(1, len(entries_sorted)):
        expected_date = current_date - timedelta(days=1)
        if entries_sorted[i].date == expected_date:
            streak += 1
            current_date = expected_date
        else:
            break
    
    return streak


def analyze_weekly_patterns(entries):
    """Analyze patterns by day of week"""
    from collections import defaultdict
    
    patterns = defaultdict(lambda: {"mood": [], "stress": []})
    
    for entry in entries:
        day = entry.date.strftime("%A")
        patterns[day]["mood"].append(entry.mood_score)
        patterns[day]["stress"].append(entry.stress_level)
    
    result = {}
    for day, data in patterns.items():
        result[day] = {
            "avg_mood": round(np.mean(data["mood"]), 2) if data["mood"] else None,
            "avg_stress": round(np.mean(data["stress"]), 2) if data["stress"] else None
        }
    
    return result


def generate_insights(stats, correlations, patterns):
    """Generate personalized insights"""
    insights = []
    
    if stats["avg_mood"] >= 4:
        insights.append("Great job maintaining positive mood! 🌟")
    elif stats["avg_mood"] < 3:
        insights.append("Your mood has been lower than usual. Consider reaching out for support.")
    
    if correlations["sleep_mood"] > 0.5:
        insights.append(f"Sleep strongly impacts your mood. Aim for {stats['avg_sleep']:.1f}+ hours.")
    
    if stats["avg_stress"] > 6:
        insights.append("High stress detected. Try meditation or breathing exercises.")
    
    if patterns:
        best_day = max(patterns.items(), key=lambda x: x[1]["avg_mood"] or 0)
        insights.append(f"Your best day: {best_day[0]}. Plan important tasks accordingly.")
    
    return insights


def calculate_mood_risk(entries):
    """Calculate mood deterioration risk"""
    moods = [e.mood_score for e in entries]
    recent_moods = moods[-7:] if len(moods) >= 7 else moods
    
    avg_recent = np.mean(recent_moods)
    volatility = np.std(moods)
    
    risk = 0
    if avg_recent < 2.5:
        risk += 50
    elif avg_recent < 3.5:
        risk += 25
    
    if volatility > 1.5:
        risk += 30
    
    return min(100, risk)


def calculate_stress_risk(entries):
    """Calculate stress accumulation risk"""
    stress_levels = [e.stress_level for e in entries]
    recent_stress = stress_levels[-7:] if len(stress_levels) >= 7 else stress_levels
    
    avg_stress = np.mean(recent_stress)
    trend = np.polyfit(range(len(recent_stress)), recent_stress, 1)[0]
    
    risk = (avg_stress / 10) * 50
    if trend > 0.5:
        risk += 30
    
    return min(100, risk)


def calculate_sleep_risk(entries):
    """Calculate sleep deterioration risk"""
    sleep_hours = [e.sleep_hours for e in entries if e.sleep_hours]
    
    if not sleep_hours:
        return 0
    
    avg_sleep = np.mean(sleep_hours)
    recent_sleep = np.mean(sleep_hours[-3:]) if len(sleep_hours) >= 3 else avg_sleep
    
    risk = 0
    if recent_sleep < 5:
        risk = 80
    elif recent_sleep < 6:
        risk = 50
    elif recent_sleep < 7:
        risk = 25
    
    return risk


def calculate_social_withdrawal_risk(user_id, db):
    """Calculate social withdrawal risk"""
    week_ago = datetime.now() - timedelta(days=7)
    two_weeks_ago = datetime.now() - timedelta(days=14)
    
    current_messages = db.query(ChatMessage).filter(
        ChatMessage.sender_id == user_id,
        ChatMessage.created_at >= week_ago
    ).count()
    
    prev_messages = db.query(ChatMessage).filter(
        ChatMessage.sender_id == user_id,
        ChatMessage.created_at >= two_weeks_ago,
        ChatMessage.created_at < week_ago
    ).count()
    
    if prev_messages == 0:
        return 0
    
    change = ((current_messages - prev_messages) / prev_messages) * 100
    
    if change < -60:
        return 70
    elif change < -40:
        return 50
    elif change < -20:
        return 30
    
    return 0


def calculate_academic_risk(user_id, db):
    """Calculate academic decline risk"""
    grades = db.query(GradeEntry).filter(
        GradeEntry.user_id == user_id
    ).order_by(GradeEntry.created_at.desc()).limit(6).all()
    
    if len(grades) < 2:
        return 0
    
    grade_map = {"A+": 10, "A": 9, "B+": 8, "B": 7, "C+": 6, "C": 5, "D": 4, "F": 2}
    scores = [grade_map.get(g.grade, 5) for g in grades]
    
    recent_avg = np.mean(scores[:3])
    overall_avg = np.mean(scores)
    
    if recent_avg < 5:
        return 60
    elif recent_avg < overall_avg - 1.5:
        return 40
    
    return 0


def generate_risk_recommendations(risk_level, breakdown):
    """Generate recommendations based on risk assessment"""
    recommendations = []
    
    if risk_level in ["critical", "high"]:
        recommendations.append({
            "priority": "urgent",
            "action": "Contact campus counseling immediately",
            "contact": "1-800-XXX-XXXX"
        })
    
    if breakdown["sleep"] > 50:
        recommendations.append({
            "priority": "high",
            "action": "Improve sleep hygiene - aim for 7-8 hours",
            "tips": ["Set consistent bedtime", "Avoid screens 1hr before sleep"]
        })
    
    if breakdown["stress"] > 50:
        recommendations.append({
            "priority": "high",
            "action": "Practice daily stress management",
            "tips": ["Box breathing 3x daily", "10-min meditation"]
        })
    
    if breakdown["social"] > 40:
        recommendations.append({
            "priority": "medium",
            "action": "Reconnect with friends or join a group activity"
        })
    
    return recommendations


def get_crisis_resources():
    """Return crisis resources"""
    return {
        "national_suicide_hotline": "1-800-273-8255",
        "crisis_text_line": "Text HOME to 741741",
        "campus_emergency": "Campus Police: XXX-XXX-XXXX",
        "message": "If you're in immediate danger, please call 911 or go to the nearest emergency room."
    }