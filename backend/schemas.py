from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr


class FeedbackCreate(BaseModel):
    prediction_id: str
    predicted_label: str
    confidence: float
    was_correct: bool
    true_label: Optional[str] = None
    note: Optional[str] = None
    opt_in_share: Optional[bool] = False
    image_base64: Optional[str] = None


class PartnerCreate(BaseModel):
    organization_name: str
    contact_name: str
    email: EmailStr
    institution_type: Optional[str] = "school"
    devices_needed: Optional[str] = "10-25"
    notes: Optional[str] = ""


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "admin"


class PredictionResponse(BaseModel):
    prediction_id: str
    label: str
    confidence: float
    top3: List[Dict[str, Any]]
    low_confidence: bool
    inference_time_ms: float
    model_version: str


class ExplainResponse(BaseModel):
    prediction_id: str
    label: str
    confidence: float
    gradcam_overlay_base64: str
    inference_time_ms: float
