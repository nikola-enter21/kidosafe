prompt_story_generation = """
Act like an expert educational content designer specializing in child safety.

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
The quiz topic is appended at the end of this prompt. Ensure the scenario matches this topic while remaining age-appropriate and sensitive. Keep text brief and accessible, as visuals will aid comprehension. The JSON output should strictly contain the following fields: {scenario}, {question}, {answers}, {correct_answer}, {context}. THE CONTEXT FIELD OF THE JSON SHOULD HAVE THE EXACT SAME CONTENTS AS THE SCENARIO FIELD.
///

Constraints:
- Format: JSON with exactly 5 fields as specified above. Do NOT output anything besides the finished JSON.
- Style: concise, clear, child-friendly, educational.
- Scope: Focus only on realistic safety situations for children 5-10; exclude violent or inappropriate content.
- Reasoning: Think step-by-step to ensure each component logically flows from the scenario to the question and answers.
- Self-check: Verify age-appropriateness, clarity, correctness, and adherence to JSON structure before finalizing.

Take a deep breath and work on this problem step-by-step.
"""

prompt_data_segmentation = """
Act like an expert content analyst, curriculum designer, and child safety education specialist.
Your goal is to analyze instructional materials related to child safety and clearly identify the main topics covered in the text so that educators, parents, or trainers can easily understand the structure of the material.
Task: Carefully analyze the provided text and extract its key themes, then organize the content into clearly defined topic sections.
Requirements:
1) Read the entire text carefully before identifying any themes.
2) Detect the major child safety topics discussed (for example: supervision, emergency response, online safety, abuse prevention, environmental hazards, etc.).
3) Group related ideas under the same topic to avoid fragmentation.
4) Create clear section titles that accurately summarize the core idea of each topic.
5) Place the relevant parts of the text under the appropriate section.
6) If a concept appears in multiple areas, place it under the most relevant topic.
7) Ensure the structure is logical and easy for readers to follow.
Step-by-step process:
1) Read and understand the full document.
2) Identify recurring ideas, warnings, recommendations, or safety principles.
3) Cluster similar ideas into broader thematic categories.
4) Name each category with a clear and descriptive section title.
5) Organize the material into sections with the following format: Section Title - Brief explanation of the topic - Key points extracted from the text
6) Ensure every important idea from the text is represented in one of the sections.
Constraints:
- Format: Use clean Markdown with headings and bullet points.
- Style: Clear, structured, neutral, and informative.
- Scope: Focus only on identifying and organizing topics (do not add new safety advice).
- Clarity: Section titles must be concise but descriptive.
- Self-check: Confirm that all major themes from the text are represented and grouped logically before finalizing the output.
Take a deep breath and work on this problem step-by-step.

"""