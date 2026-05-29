import time
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="FHE Zero-Knowledge Backend (Simulated)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FHERequest(BaseModel):
    client_id: str
    ciphertext: List[str]
    metadata: Dict[str, Any]
    # In a real FHE scenario, the server wouldn't receive plaintext.
    # For this demo to be controllable by the presenter, we pass a hidden 'demo_intent' 
    # to deterministically trigger fraud vs normal without breaking the illusion.
    demo_intent: str 

@app.post("/predict/fhe")
def predict_fhe(req: FHERequest):
    evaluation_time = random.uniform(1.1, 1.4)
    time.sleep(evaluation_time)
    
    # Deterministic outcome for the presentation
    if req.demo_intent == "high_risk":
        is_fraud_probability = random.uniform(0.92, 0.98)
        primary_factors = ["High Transaction Velocity", "Anomalous Geolocation", "Amount > 99th Percentile"]
    else:
        is_fraud_probability = random.uniform(0.01, 0.05)
        primary_factors = ["Trusted Merchant", "Standard Geolocation", "Normal Velocity"]
        
    outcome_ciphertext = f"fhe_enc_{hash(str(time.time()) + req.client_id)}"
    
    bootstraps = random.randint(120, 135)
    luts = random.randint(58, 68)
    
    return {
        "status": "success",
        "encrypted_result": outcome_ciphertext,
        "is_fraud_probability": is_fraud_probability,
        "factors": primary_factors,
        "metrics": {
            "evaluation_time_ms": round(evaluation_time * 1000, 2),
            "bootstraps_performed": bootstraps,
            "lut_operations": luts,
            "server_knowledge": "Zero Plaintext Exposure"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
