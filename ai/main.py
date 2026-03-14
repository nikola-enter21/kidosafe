from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="KidoSafe AI Service", description="API for AI backend communication")

class Message(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Service is running"}

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
