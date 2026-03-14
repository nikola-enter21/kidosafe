from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import requests
import numpy as np
from embedding import *
from agent import *
from env import *
from typing import Dict
import scipy

app = FastAPI(title="KidoSafe AI Service", description="API for AI backend communication", port=5467)
temperature = 0.2

initialize_materials_and_embeddings()

class UserRation(BaseModel):
    ratio: Dict[str, float]

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Service is running"}

@app.post("/{category}/generate_scenario")
def generate_scenario(category: str, message: Message):
    
    # TODO: Implement scenario generation logic
    return {
        "status": "success",
        "result": "Scenario generated successfully",
        "original_text": message.text
    }

@app.post("/get_next_category")
def get_next_category(ratio: UserRation):
    dict_ratio = ratio.ratio

    ratios_array = np.array(list(dict_ratio.values()), dtype=float)
    
    scaled_ratios = -ratios_array / temperature
    scaled_ratios -= np.max(scaled_ratios) 
    
    exp_vals = np.exp(scaled_ratios)
    probabilities = exp_vals / np.sum(exp_vals)

    next_category = np.random.choice(list(dict_ratio.keys()), p=probabilities)
    
    return {
        "next_category": next_category
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
