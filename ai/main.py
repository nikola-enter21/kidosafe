from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from embedding import *
from env import *
from typing import Dict
from agent import *

app = FastAPI(title="KidoSafe AI Service", description="API for AI backend communication")
temperature = 0.2

embeddings, materials, id_to_material = initialize_materials_and_embeddings()

class UserRation(BaseModel):
    ratio: Dict[str, float]

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Service is running"}

@app.get("/api/categories/{category}/generate_scenario")
def generate_scenario(category: str):
    generated_quiz = generate_safety_quiz(category)

    rel_doc = get_most_relevant_materials(generated_quiz.get("scenario"), embeddings=embeddings, id_to_material=id_to_material, top_k=1)

    if not rel_doc:
        image_prompts = generate_image_prompts(generated_quiz.get("scenario"), 
                                               generated_quiz.get("context"), 
                                               generated_quiz.get("answers"), 
                                               generated_quiz.get("correct_answer"))
        
        return {
            "id_material": None,
            "question": generated_quiz.get("question"),
            "answers": generated_quiz.get("answers"),
            "correct_answer": generated_quiz.get("correct_answer"),
            "question_image_prompt": image_prompts.get("question_image_prompt"),
            "success_image_prompt": image_prompts.get("success_image_prompt"),
            "failure_image_prompt": image_prompts.get("failure_image_prompt"),
        }
    
    return {
        "id_material": rel_doc[0][0],
        "question": generated_quiz.get("question"),
        "answers": generated_quiz.get("answers"),
        "correct_answer": generated_quiz.get("correct_answer"),
        "question_image_prompt": None,
        "success_image_prompt": None,
        "failure_image_prompt": None
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
    uvicorn.run("main:app", host="0.0.0.0", port=5467, reload=True)
