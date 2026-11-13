import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class PredictionFeedback(Base):
    __tablename__ = "prediction_feedback"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(100), index=True, nullable=False)
    predicted_label = Column(String(100), nullable=False)
    true_label = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=False)
    was_correct = Column(Boolean, nullable=False)
    user_note = Column(Text, nullable=True)
    opt_in_share = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SharedImage(Base):
    __tablename__ = "shared_images"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(String(100), nullable=True)
    image_data_base64 = Column(Text, nullable=False)
    suggested_label = Column(String(100), nullable=False)
    true_label = Column(String(100), nullable=True)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    reviewed_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class PartnerInquiry(Base):
    __tablename__ = "partner_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    organization_name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    institution_type = Column(String(100), default="school")
    devices_needed = Column(String(100), default="10-25")
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="new")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
