import json
import requests
from prompts import *
from env import *
from pydantic import BaseModel, ValidationError, Field
from typing import List

class SafetyQuiz(BaseModel):
    scenario: str
    question: str
    answers: List[str]
    correct_answer: int
    context: str

class ImagePrompts(BaseModel):
    question_image_prompt: str
    success_image_prompt: str
    failure_image_prompt: str

class ExpandedTopic(BaseModel):
    description: str

def expand_topic(topic: str) -> str:
    prompt = PROMPT_TOPIC_EXPENSION_TEMPLATE.format(topic=topic)

    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "stream": False,
    }

    response = requests.post(
        f"{LM_STUDIO_BASE_URL}/v1/chat/completions",
        headers={"Content-Type": "application/json"},
        json=payload,
        # timeout=60,
    )
    response.raise_for_status()

    data = response.json()

    raw_text = ""
    if "choices" in data and len(data["choices"]) > 0:
         try:
             raw_text = data["choices"][0]["message"]["content"]
         except (KeyError, IndexError):
             pass

    if not raw_text:
        # Fallback for other formats
        output_items = data.get("output", [])
        for item in output_items:
            if item.get("type") == "message":
                raw_text = item.get("content", "")
                break
    
    if not raw_text:
        raise ValueError(f"No message content found in API response: {data}")

    # Remove markdown code blocks if present
    raw_text = raw_text.strip()
    if "```" in raw_text:
        # Extract content between first and last ``` block
        parts = raw_text.split("```")
        # Usually the content is in the second part (index 1) 
        # e.g. "Here is the json:\n```json\n{...}\n```"
        if len(parts) >= 3:
            raw_text = parts[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        else:
            # Fallback for "``` {...} ```"
            raw_text = raw_text.replace("```json", "").replace("```", "")
            
    raw_text = raw_text.strip()

    try:
        # Use Pydantic for validation
        expanded_topic = ExpandedTopic.model_validate_json(raw_text)
        return expanded_topic.description
    except ValidationError as e:
        raise ValueError(f"Failed to validate model output: {e}\nRaw output:\n{raw_text}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")

def generate_safety_quiz(topic: str) -> dict:
    """
    Generates a child safety quiz scenario for the given topic
    using the LM Studio API.

    Args:
        topic: The safety topic to generate a quiz scenario for.

    Returns:
        A dict with keys: scenario, question, answers, correct_answer, context.

    Raises:
        requests.HTTPError: If the API request fails.
        ValueError: If the response cannot be parsed as valid JSON.
    """
    prompt = PROMPT_TEMPLATE + topic

    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "stream": False,
    }

    response = requests.post(
        f"{LM_STUDIO_BASE_URL}/v1/chat/completions",
        headers={"Content-Type": "application/json"},
        json=payload,
        # timeout=60,
    )
    response.raise_for_status()

    data = response.json()

    raw_text = ""
    if "choices" in data and len(data["choices"]) > 0:
         try:
             raw_text = data["choices"][0]["message"]["content"]
         except (KeyError, IndexError):
             pass

    if not raw_text:
        # Fallback for other formats
        output_items = data.get("output", [])
        for item in output_items:
            if item.get("type") == "message":
                raw_text = item.get("content", "")
                break
    
    if not raw_text:
        raise ValueError(f"No message content found in API response: {data}")

    # Remove markdown code blocks if present
    raw_text = raw_text.strip()
    if "```" in raw_text:
        # Extract content between first and last ``` block
        parts = raw_text.split("```")
        # Usually the content is in the second part (index 1) 
        # e.g. "Here is the json:\n```json\n{...}\n```"
        if len(parts) >= 3:
            raw_text = parts[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        else:
            # Fallback for "``` {...} ```"
            raw_text = raw_text.replace("```json", "").replace("```", "")
            
    raw_text = raw_text.strip()

    try:
        # Use Pydantic for validation
        quiz = SafetyQuiz.model_validate_json(raw_text)
        return quiz.model_dump()
    except ValidationError as e:
        raise ValueError(f"Failed to validate model output: {e}\nRaw output:\n{raw_text}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")


def generate_safety_quiz_continuation(
    topic: str,
    situation: str,
    response: str,
    context: str,
) -> dict:
    """
    Generates a continuation of a child safety quiz scenario.

    Args:
        topic:     The safety topic (e.g. "talking to strangers").
        situation: What happened immediately prior to the current scenario.
        response:  How the child reacted in the previous step (correct or not).
        context:   Accumulated story context from previous steps.

    Returns:
        A dict with keys: scenario, question, answers, correct_answer, context.

    Raises:
        requests.HTTPError: If the API request fails.
        ValueError: If the response cannot be parsed as valid JSON or is missing fields.
    """
    prompt_text = CONTINUATION_PROMPT_TEMPLATE.format(
        topic=topic,
        situation=situation,
        response=response,
        context=context,
    )

    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt_text}
        ],
        "temperature": 0.7,
        "stream": False,
    }

    response_http = requests.post(
        f"{LM_STUDIO_BASE_URL}/v1/chat/completions",
        headers={"Content-Type": "application/json"},
        json=payload,
        # timeout=60,
    )
    response_http.raise_for_status()

    data = response_http.json()

    raw_text = ""
    if "choices" in data and len(data["choices"]) > 0:
         try:
             raw_text = data["choices"][0]["message"]["content"]
         except (KeyError, IndexError):
             pass

    if not raw_text:
        # Fallback for other formats
        output_items = data.get("output", [])
        for item in output_items:
            if item.get("type") == "message":
                raw_text = item.get("content", "")
                break
    
    if not raw_text:
        raise ValueError(f"No message content found in API response: {data}")

    # Remove markdown code blocks if present
    raw_text = raw_text.strip()
    if "```" in raw_text:
        parts = raw_text.split("```")
        if len(parts) >= 3:
            raw_text = parts[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        else:
            raw_text = raw_text.replace("```json", "").replace("```", "")
            
    raw_text = raw_text.strip()

    try:
        # Use Pydantic for validation
        quiz = SafetyQuiz.model_validate_json(raw_text)
        return quiz.model_dump()
    except ValidationError as e:
        raise ValueError(f"Failed to validate model output: {e}\nRaw output:\n{raw_text}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")

def generate_image_prompts(
    situation: str,
    context: str,
    answers: list,
    correct_answer: int,
) -> dict:
    """
    Generates image prompts for visual illustrations of a quiz scenario.

    Args:
        situation:      The scenario text the child is currently facing.
        context:        The accumulated story context for visual consistency.
        answers:        List of answer choice strings.
        correct_answer: Index of the correct answer in the answers list (0-based).

    Returns:
        A dict with keys: question_image_prompt, success_image_prompt, failure_image_prompt.

    Raises:
        requests.HTTPError: If the API request fails.
        ValueError: If the response cannot be parsed as valid JSON or is missing fields.
    """
    prompt = IMAGE_PROMPT_TEMPLATE.format(
        situation=situation,
        context=context,
        answers=answers,
        correct_answer=correct_answer,
    )

    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "stream": False,
    }

    response = requests.post(
        f"{LM_STUDIO_BASE_URL}/v1/chat/completions",
        headers={"Content-Type": "application/json"},
        json=payload,
        # timeout=60,
    )
    response.raise_for_status()

    data = response.json()

    raw_text = ""
    if "choices" in data and len(data["choices"]) > 0:
         try:
             raw_text = data["choices"][0]["message"]["content"]
         except (KeyError, IndexError):
             pass

    if not raw_text:
        # Fallback for other formats
        output_items = data.get("output", [])
        for item in output_items:
            if item.get("type") == "message":
                raw_text = item.get("content", "")
                break
    
    if not raw_text:
        raise ValueError(f"No message content found in API response: {data}")

    # Remove markdown code blocks if present
    raw_text = raw_text.strip()
    if "```" in raw_text:
        # Extract content between first and last ``` block
        parts = raw_text.split("```")
        # Usually the content is in the second part (index 1) 
        # e.g. "Here is the json:\n```json\n{...}\n```"
        if len(parts) >= 3:
            raw_text = parts[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        else:
            # Fallback for "``` {...} ```"
            raw_text = raw_text.replace("```json", "").replace("```", "")
            
    raw_text = raw_text.strip()

    try:
        # Use Pydantic for validation
        print("validating image prompts", raw_text)
        prompts = ImagePrompts.model_validate_json(raw_text)
        return prompts.model_dump()
    except ValidationError as e:
        raise ValueError(f"Failed to validate model output: {e}\nRaw output:\n{raw_text}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")


# if __name__ == "__main__":
#     topic = "Online interactions"

#     # Step 1: generate the opening scenario
#     print(f"Step 1 — Generating opening quiz for topic: '{topic}'\n")
#     opening = generate_safety_quiz(topic)
#     print(json.dumps(opening, indent=2))

#     # Step 2: use the correct answer to continue the story
#     correct_answer = opening["answers"][opening["correct_answer"]]
#     print(f"\nStep 2 — Continuing with correct answer: '{correct_answer}'\n")

#     continuation = generate_safety_quiz_continuation(
#         topic=topic,
#         situation=opening["scenario"],
#         response=correct_answer,
#         context=opening["context"],
#     )
#     print(json.dumps(continuation, indent=2))

#     # Step 3: generate image prompts for the continuation scenario
#     print(f"\nStep 3 — Generating image prompts\n")
#     image_prompts = generate_image_prompts(
#         situation=continuation["scenario"],
#         context=continuation["context"],
#         answers=continuation["answers"],
#         correct_answer=continuation["correct_answer"],
#     )
#     print(json.dumps(image_prompts, indent=2, ensure_ascii=False))