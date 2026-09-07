import time
from typing import List
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

app = FastAPI(
    title="MailMatch Backend API",
    description="Backend services for parsing and matching mail contents for automation.",
    version="1.0.0"
)

# Enable CORS for the chrome extension requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Extensions make requests from chrome-extension:// origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmailPayload(BaseModel):
    subject: str
    sender: str
    body: str
    received_at: float = time.time()

class MatchResult(BaseModel):
    match_found: bool
    category: str
    confidence: float
    matched_rules: List[str]
    actions_triggered: List[str]

@app.get("/")
def read_root():
    return {
        "status": "active",
        "service": "MailMatch Backend API",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "timestamp": time.time()}

@app.post("/api/match", response_model=MatchResult)
def match_email(payload: EmailPayload):
    subject_lower = payload.subject.lower()
    body_lower = payload.body.lower()
    
    # Basic rule-based classification demo rules
    matched_rules = []
    category = "Unclassified"
    confidence = 0.5
    actions = []
    match_found = False
    
    if "invoice" in subject_lower or "billing" in subject_lower or "receipt" in subject_lower:
        matched_rules.append("Financial Keyword Match")
        category = "Finance & Billing"
        confidence = 0.9
        actions.append("forward_to_accounting")
        match_found = True
    elif "alert" in subject_lower or "critical" in subject_lower or "warning" in body_lower:
        matched_rules.append("Urgent Warning Match")
        category = "System Alert"
        confidence = 0.85
        actions.append("send_sms_notification")
        match_found = True
    elif "meeting" in subject_lower or "calendar" in body_lower or "schedule" in body_lower:
        matched_rules.append("Scheduling Match")
        category = "Calendar & Meetings"
        confidence = 0.8
        actions.append("schedule_followup")
        match_found = True
        
    return MatchResult(
        match_found=match_found,
        category=category,
        confidence=confidence,
        matched_rules=matched_rules,
        actions_triggered=actions
    )

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
