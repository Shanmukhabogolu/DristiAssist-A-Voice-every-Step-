import sys
import os
from passlib.context import CryptContext
from datetime import datetime

from .database import engine, SessionLocal
from .models import Base, User, Profile, FeedbackReport, ImageContribution, PartnerInquiry

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@drishtiassist.org").first()
        if not admin:
            admin = User(
                email="admin@drishtiassist.org",
                hashed_password=pwd_context.hash("DrishtiAdmin2026!"),
                role="admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

            profile = Profile(
                user_id=admin.id,
                language="hi",
                speech_rate=1.05,
                confidence_threshold=0.60
            )
            db.add(profile)
            db.commit()
            print("✓ Seeded demo admin: admin@drishtiassist.org / DrishtiAdmin2026!")

        print("✓ Database seeding complete.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
