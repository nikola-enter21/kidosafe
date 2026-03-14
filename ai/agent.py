import json
import requests
<<<<<<< Updated upstream
from prompts import *
from env import *
=======

LM_STUDIO_BASE_URL = "http://localhost:1234"
MODEL_ID = "google/gemma-3-4b"

PROMPT_TEMPLATE = """Act like an expert educational content designer specializing in child safety.
Your goal is to generate engaging, age-appropriate quiz scenarios for children aged 5 to 10, focused on safety topics (e.g., talking with strangers, drug use). The content should be concise, easy to understand, and adaptable for accompanying visual aids.
Task: Create a child safety scenario quiz in JSON format.
Requirements:
1) Generate a scenario that is realistic and suitable for children aged 5-10.
2) Formulate a clear, actionable question prompting the child to choose the safest course of action.
3) Provide 2-3 plausible answer choices, with one being clearly correct.
4) Specify the index of the correct answer (starting from 0).
5) Include a verbatim copy of the scenario in a separate field labeled "context".
Context:
///
The quiz topic is appended at the end of this prompt. Ensure the scenario matches this topic while remaining age-appropriate and sensitive. Keep text brief and accessible, as visuals will aid comprehension. The JSON output should strictly contain the following fields: {{scenario}}, {{question}}, {{answers}}, {{correct_answer}}, {{context}}. THE CONTEXT FIELD OF THE JSON SHOULD HAVE THE EXACT SAME CONTENTS AS THE SCENARIO FIELD.
///
Constraints:
- Format: JSON with exactly 5 fields as specified above. Do NOT output anything besides the finished JSON.
- Style: concise, clear, child-friendly, educational.
- Scope: Focus only on realistic safety situations for children 5-10; exclude violent or inappropriate content.
- Reasoning: Think step-by-step to ensure each component logically flows from the scenario to the question and answers.
- Self-check: Verify age-appropriateness, clarity, correctness, and adherence to JSON structure before finalizing.
Take a deep breath and work on this problem step-by-step.
Topic: """

CONTINUATION_PROMPT_TEMPLATE = """Act like an expert educational content designer specializing in child safety and interactive learning.
Your goal is to generate engaging, age-appropriate quiz scenarios for children aged 5 to 10, based on an existing story context and a specific safety topic (e.g., talking with strangers, drug use). The content should be concise, easy to understand, and adaptable for accompanying visual aids. Ensure the continuation logically follows the child's previous response, even if it was incorrect, reflecting realistic consequences.
Task: Generate a continuation of a child safety scenario as a quiz in JSON format.
Requirements:
1) Generate a scenario continuation ({{scenario}}) that naturally follows the previous situation and child response while reflecting realistic consequences of any incorrect actions.
2) Formulate a clear, actionable question ({{question}}) prompting the child to choose the safest next action.
3) Provide 2-3 plausible answer choices ({{answers}}), with one clearly correct.
4) Specify the index of the correct answer ({{correct_answer}}, starting at 0).
5) Update the story context ({{context}}) to incorporate the new scenario while keeping it concise and free of irrelevant information.
Context:
///
You will be provided:
- Situation: What happened immediately prior to the current scenario.
- Response: How the child reacted (may be correct or incorrect).
- Context: Additional information to maintain continuity and avoid contradictions.
The quiz topic is appended at the end of the prompt. Use the context to maintain consistency, avoid plot holes, and adapt consequences of incorrect choices.
///
Constraints:
- Format: JSON with exactly 5 fields: {{scenario}}, {{question}}, {{answers}}, {{correct_answer}}, {{context}}. Do NOT output anything besides the finished JSON.
- Style: concise, clear, child-friendly, educational.
- Scope: Focus on realistic child safety situations for ages 5-10; exclude violence or inappropriate content.
- Reasoning: Think step-by-step, ensuring the continuation flows naturally from the previous response and context.
- Self-check: Verify age-appropriateness, logical consistency, correctness of answer index, and JSON validity before finalizing.
Take a deep breath and work on this problem step-by-step.
Topic: {topic}
Situation: {situation}
Response: {response}
Context: {context}"""

IMAGE_PROMPT_TEMPLATE = """Act like an expert visual prompt designer and educational game narrative designer.

Your goal is to create highly descriptive image prompts for an image-generation AI that will produce illustrations for a children's safety education quiz. The quiz is part of an interactive story for children aged 5–10. The illustrations must clearly communicate the situation and emotional context while remaining child-appropriate, non-threatening, and visually understandable for young audiences.

Task: Based on the provided scenario, story context, answer choices, and the index of the correct answer, generate three detailed prompts that will be used to create illustrations supporting the quiz question.

Follow these steps:

1) Carefully read the scenario description. This describes the situation the child is currently facing.
2) Review the additional story context to ensure visual consistency (characters, environment, and story elements). Avoid contradictions with previously established details.
3) Examine the list of possible actions and identify the correct action using the provided index (answers are indexed starting from 0).
4) Create a descriptive prompt for an image generation AI illustrating the moment just before the child decides what to do. This prompt will be labelled question_image_prompt.
5) Generate a "description-prefix". The description-prefix is based on the contents of question_image_prompt and describes the entities in the scene. The purpose of the description-prefix is to provide context for the two prompts you'll generate in step 6. Both of these prompts will begin with this description-prefix.
6) Create two descriptive prompts for an image generation AI (both prompts must contain the entire content of the description-prefix before anything else):
   - One illustrating the child performing the correct action itself (not the outcome). This prompt will be labeled success_image_prompt.
   - One illustrating the same situation as the first image but with the child visibly upset after making a wrong choice. This prompt will be labeled failure_image_prompt.

Image prompt guidelines:
- Describe the environment, characters, expressions, body language, and important objects.
- Keep the tone safe, calm, and appropriate for children ages 5–10.
- Avoid frightening, violent, or graphic imagery.
- Use simple, clear visual storytelling suitable for educational materials.
- Each prompt should stipulate that the generated image must be in landscape ratio.
- Any context provided by the question_image_prompt for the latter two prompts must come from the description-prefix.

Output Requirements:
Return ONLY a valid JSON object with exactly three fields and no additional text.

{{
  "question_image_prompt": "...",
  "success_image_prompt": "...",
  "failure_image_prompt": "..."
}}

Constraints:
- Format: strict JSON only, no commentary or explanation.
- Style: descriptive, clear, visual, and suitable for illustration generation.
- Scope: maintain consistency with the scenario and context while keeping visuals child-appropriate.
- Self-check: ensure the prompts are visually descriptive, logically consistent with the scenario, and the JSON structure is valid.

Take a deep breath and work on this problem step-by-step.
Situation: {situation}
Context: {context}
Answers: {answers}
Correct Answer Index: {correct_answer}"""

>>>>>>> Stashed changes

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


<<<<<<< Updated upstream
# if __name__ == "__main__":
#     topic = "Online interactions"

#     # Step 1: generate the opening scenario
#     print(f"Step 1 — Generating opening quiz for topic: '{topic}'\n")
#     opening = generate_safety_quiz(topic)
#     print(json.dumps(opening, indent=2))
=======
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
        image_prompts = json.loads(raw_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse model output as JSON: {e}\nRaw output:\n{raw_text}")

    expected_fields = {"question_image_prompt", "success_image_prompt", "failure_image_prompt"}
    missing = expected_fields - image_prompts.keys()
    if missing:
        raise ValueError(f"Response JSON is missing fields: {missing}\nParsed: {image_prompts}")

    return image_prompts


if __name__ == "__main__":
    topic = "Online interactions"

    # Step 1: generate the opening scenario
    print(f"Step 1 — Generating opening quiz for topic: '{topic}'\n")
    opening = generate_safety_quiz(topic)
    print(json.dumps(opening, indent=2, ensure_ascii=False))
>>>>>>> Stashed changes

#     # Step 2: use the correct answer to continue the story
#     correct_answer = opening["answers"][opening["correct_answer"]]
#     print(f"\nStep 2 — Continuing with correct answer: '{correct_answer}'\n")

<<<<<<< Updated upstream
#     continuation = generate_safety_quiz_continuation(
#         topic=topic,
#         situation=opening["scenario"],
#         response=correct_answer,
#         context=opening["context"],
#     )
#     print(json.dumps(continuation, indent=2))
=======
    continuation = generate_safety_quiz_continuation(
        topic=topic,
        situation=opening["scenario"],
        response=correct_answer,
        context=opening["context"],
    )
    print(json.dumps(continuation, indent=2, ensure_ascii=False))
>>>>>>> Stashed changes

    # Step 3: generate image prompts for the continuation scenario
    print(f"\nStep 3 — Generating image prompts\n")
    image_prompts = generate_image_prompts(
        situation=continuation["scenario"],
        context=continuation["context"],
        answers=continuation["answers"],
        correct_answer=continuation["correct_answer"],
    )
    print(json.dumps(image_prompts, indent=2, ensure_ascii=False))