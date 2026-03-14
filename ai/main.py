from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import requests
import numpy as np
from embedding import *
from agent import *
from env import *

app = FastAPI(title="KidoSafe AI Service", description="API for AI backend communication", port=5467)

initialize_materials_and_embeddings()

class Message(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Service is running"}

@app.post("/generate_scenario")
def generate_scenario(message: Message):
    # TODO: Implement scenario generation logic
    return {
        "status": "success",
        "result": "Scenario generated successfully",
        "original_text": message.text
    }

@app.post("/analyze")
def analyze_text(message: Message):
    # TODO: Implement your AI logic here
    return {
        "status": "success",
        "result": "Safe",
        "original_text": message.text
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
