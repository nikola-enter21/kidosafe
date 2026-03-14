import json
import requests
from prompts import *
from env import *

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
        "input": prompt,
        "temperature": 0.7,
        "stream": False,
    }

    response = requests.post(
        f"{LM_STUDIO_BASE_URL}/api/v1/chat",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    response.raise_for_status()

    data = response.json()

    output_items = data.get("output", [])
    raw_text = ""
    for item in output_items:
        if item.get("type") == "message":
            raw_text = item.get("content", "")
            break

    if not raw_text:
        raise ValueError(f"No message content found in API response: {data}")

    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[-1]
        raw_text = raw_text.rsplit("```", 1)[0]
    raw_text = raw_text.strip()

    try:
        quiz = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")

    expected_fields = {"scenario", "question", "answers", "correct_answer", "context"}
    missing = expected_fields - quiz.keys()
    if missing:
        raise ValueError(f"Response JSON is missing fields: {missing}\nParsed: {quiz}")

    return quiz


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
    prompt = CONTINUATION_PROMPT_TEMPLATE.format(
        topic=topic,
        situation=situation,
        response=response,
        context=context,
    )

    payload = {
        "model": MODEL_ID,
        "input": prompt,
        "temperature": 0.7,
        "stream": False,
    }

    response_http = requests.post(
        f"{LM_STUDIO_BASE_URL}/api/v1/chat",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    response_http.raise_for_status()

    data = response_http.json()

    output_items = data.get("output", [])
    raw_text = ""
    for item in output_items:
        if item.get("type") == "message":
            raw_text = item.get("content", "")
            break

    if not raw_text:
        raise ValueError(f"No message content found in API response: {data}")

    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[-1]
        raw_text = raw_text.rsplit("```", 1)[0]
    raw_text = raw_text.strip()

    try:
        quiz = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")

    expected_fields = {"scenario", "question", "answers", "correct_answer", "context"}
    missing = expected_fields - quiz.keys()
    if missing:
        raise ValueError(f"Response JSON is missing fields: {missing}\nParsed: {quiz}")

    return quiz


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

    