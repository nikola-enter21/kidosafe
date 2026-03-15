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
4) Plan out three scenes you'll be generating an image generation prompt for. The scenes are:
- The situation immediately prior to the child making a choice.
- The child actively carrying out the correct action.
- The child in the situation prior to making a choice, but visibly upset
5) Identify the common elements in the three scene. These includes things like the environment, as well as individual characters and their descriptions. Generate a prompt describing these common elements. SAVE THIS PROMPT AS AN INTERNAL VARIABLE, WORD FOR WORD, NAMED scene_description.
6) Perform this step individually for each scene: Generate an image generation prompt for the scene. The prompt should begin with the ENTIRE CONTENTS of the scene_description variable. Extend the prompt with additional detail unique for the scene.
7) Format the three prompts you've generated as per the output requirements below.

Image prompt guidelines:
- Keep the tone safe, calm, and appropriate for children ages 5–10.
- Avoid frightening, violent, or graphic imagery.
- Use simple, clear visual storytelling suitable for educational materials.

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