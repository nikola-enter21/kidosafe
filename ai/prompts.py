PROMPT_TOPIC_EXPENSION_TEMPLATE = """Act like an expert educational content designer specializing in child safety education for children ages 5–10. 
You are experienced in transforming safety guidelines into simple, rule-based educational content that can easily be converted into quiz questions for young learners.
Your goal is to convert a safety topic into a dense, clear, rule-focused paragraph that highlights essential safety behaviors. 
The final text must provide enough structured information so that an educator or curriculum designer can easily extract 3–5 quiz questions directly from the content.
Task: Expand the provided safety topic into a concise but comprehensive set of clear “Dos and Don’ts” that teach children exactly what they should always do, what they must never do, and who they should contact in an emergency.

Requirements:
1) Focus strictly on rules and safety actions. Clearly state behaviors a child must always follow and actions they must absolutely avoid.
2) Include practical safety instructions that are realistic for children ages 5–10.
3) Clearly identify trusted people or emergency contacts children should reach out to when they need help.
4) Write in simple, direct, empowering language that young children can easily understand.
5) Ensure the paragraph contains enough distinct safety rules so that at least three to five quiz questions could be created from it.

Important restrictions:
- Do NOT include fictional characters, names, role-play situations, or storytelling elements.
- Do NOT create imaginary scenarios or narratives.
- Avoid scary, graphic, or emotionally overwhelming language.
- Focus only on real-world safety behaviors and responsible actions.

Context:
Topic: {topic}

Output Constraints:
- Format: One single paragraph only. Do not tell me you've understood and are going to do the task. Do not offer additional tips for formulating a quiz. Generate the paragraph on safety behaviors and absolutely nothing else.
- Style: Clear, educational, rule-based, and child-friendly.
- Tone: Calm, supportive, and instructive.
- Scope: Only factual safety rules and guidance; no stories or dialogue.
- Length: Dense enough to contain multiple rules but still concise and readable for children.

Before finalizing, verify that the paragraph contains multiple clear rules, includes both “do” and “do not” behaviors, and mentions who to contact for help in an emergency.

Take a deep breath and work on this problem step-by-step."""

PROMPT_TEMPLATE = """Act like an expert educational content designer specializing in child safety.
Your goal is to generate engaging, age-appropriate quiz scenarios for children aged 5 to 10, focused on safety topics (e.g., talking with strangers, drug use). The content should be concise, easy to understand, and adaptable for accompanying visual aids.
Task: Create a child safety scenario quiz in JSON format.
Requirements:
1) Generate a scenario that is realistic and suitable for children aged 5-10.
2) Formulate a clear, actionable question prompting the child to choose the safest course of action.
3) Provide 2-3 plausible answer choices, with one being clearly correct. Paired with each answer, provide a short piece of feedback for picking this particular answer.
4) Specify the index of the correct answer (starting from 0).
5) Include a verbatim copy of the scenario in a separate field labeled "context".
Context:
///
The quiz topic is appended at the end of this prompt. Ensure the scenario matches this topic while remaining age-appropriate and sensitive. Keep text brief and accessible, as visuals will aid comprehension. The JSON output should strictly contain the following fields: {{scenario}}, {{question}}, {{answers}}, {{correct_answer}}, {{context}}. THE CONTEXT FIELD OF THE JSON SHOULD HAVE THE EXACT SAME CONTENTS AS THE SCENARIO FIELD.
///
Constraints:
- Format: JSON with exactly 5 fields as specified above. The "answers" field must be a list of objects, where each object has a "text" field for the answer and a "feedback" field for the explanation. Do NOT output anything besides the finished JSON.
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
- Format: JSON with exactly 5 fields: {{scenario}}, {{question}}, {{answers}}, {{correct_answer}}, {{context}}. The "answers" field must be a list of objects, where each object has a "text" field for the answer and a "feedback" field for the explanation. Do NOT output anything besides the finished JSON.
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