# KidoSafe

KidoSafe teaches children safe behavior through short interactive scenarios. The AI part of the project creates those scenarios, suggests visuals, and decides when existing learning materials can be reused.

This page explains the workflow in plain language, focused on understanding how the system works.

## AI Workflow Overview

When a new scenario is requested, the AI workflow does five things in order:

1. Understand the selected safety topic.
2. Generate a child-friendly situation, question, and answer options.
3. Check if a similar scenario already exists.
4. Reuse existing visuals when possible, or create new ones when needed.
5. Return a complete scenario package to the game.

The goal is to keep scenarios safe, clear, and fast to deliver while avoiding unnecessary regeneration of media.

## Models You Used

Your AI stack uses three model layers, each with a different role in the learning experience.

### 1) Language model for scenario reasoning

You use Gemma 3 4B through LM Studio as the text reasoning model.

What this model is responsible for:

1. Expanding a broad topic into practical child-safety rules.
2. Generating a quiz-like scenario with choices and feedback.
3. Producing structured prompts for visual generation.

Why this choice fits your project:

1. Small enough to run locally.
2. Strong enough for structured JSON-like outputs.
3. Good balance between quality and latency for interactive gameplay.

### 2) Embedding model for meaning-based matching

You use Qwen3-Embedding-0.6B (via SentenceTransformers) to convert scenario descriptions into semantic vectors.

What this model is responsible for:

1. Converting existing scenario descriptions into vector representations.
2. Converting each newly generated scenario into the same vector space.
3. Enabling meaning-based search so the system can detect similarity even when wording is different.

Why this choice fits your project:

1. Better reuse decisions than simple keyword matching.
2. More stable matching across paraphrased scenarios.
3. Efficient enough for real-time lookup in your workflow.

### 3) Image diffusion model for visuals

You use a Stable Diffusion XL pipeline loaded from an SDXL FP8 checkpoint.

What this model is responsible for:

1. Turning narrative prompts into child-friendly scene images.
2. Generating three visual states per scenario: decision, safe outcome, unsafe outcome.
3. Producing consistent visual context so children connect choices with consequences.

Why this choice fits your project:

1. High-quality scene generation for educational storytelling.
2. Flexible style control through prompt design.
3. Good visual detail for emotionally clear but safe content.
4. Relatively lightweight model that does not require high computational power.

## Scenario Generation

Scenario generation is the storytelling and decision-making part of the system.

### What it produces

For each new scenario request, the AI produces:

1. A short realistic situation for a child.
2. A simple question asking what the child should do next.
3. Two or three answer options.
4. A clear correct answer.
5. Feedback text for each answer choice.

### Design intent

The scenario text is designed to be:

1. Age-appropriate for young children.
2. Action-oriented, so the child learns what to do.
3. Calm and educational, without scary or harmful detail.

### Deeper generation stages

From a workflow perspective, scenario generation has three cognitive stages:

1. Topic grounding:
The system first expands a short category into actionable safety guidance so the generated scenario stays on-topic and teachable.
2. Situation design:
The model creates one realistic child situation where a decision is needed now.
3. Pedagogical packaging:
The system adds choices, marks one as safest, and writes brief feedback for every option so each click teaches something.

This design keeps the output compact enough for game interaction but rich enough to teach behavior, not just facts.

## Image Generation

Image generation supports comprehension by turning scenario moments into visuals.

### Visual stages

For every scenario, the workflow can create three visual moments:

1. The decision moment before the child chooses.
2. A positive outcome for the safe choice.
3. A negative outcome for an unsafe choice.

### How image generation works in your notebook

Your image notebook behaves like a small image service around the SDXL model.

1. Model loading phase:
The notebook loads the SDXL pipeline and prepares GPU inference.
2. Styling phase:
A shared style prefix is used so generated scenes feel visually consistent across scenarios.
3. Generation phase:
For each incoming prompt, the model renders one image with a fixed inference-step setting.
4. Packaging phase:
The generated image is packaged and returned in a format the backend can store and reuse.
5. Publishing phase:
The notebook is exposed via ngrok so your backend can call it from outside the notebook runtime.

In practice, this means your notebook is not only for experiments, it works as a live microservice for production-like generation flow.

### Why three visuals

Using three moments helps children connect:

1. Situation
2. Decision
3. Consequence

This improves understanding compared with showing only one static scene.

## Embeddings

Embeddings are numerical representations of scenario meaning. They allow the system to compare scenarios by meaning, not only by exact words.

### Conceptual role

Embeddings make it possible to:

1. Represent each existing scenario as a semantic fingerprint.
2. Represent each newly generated scenario in the same semantic space.
3. Measure how close two scenarios are in meaning.

In simple terms, embeddings let the system answer: "Have we already taught something very similar?"

### How embeddings work in your notebook

Your embeddings notebook also acts as a service, not only a prototype.

1. It loads the Qwen embedding model.
2. It accepts text input and returns numeric vectors.
3. It can be exposed publicly through ngrok for backend access.

This notebook-based setup gives you a fast iteration loop: you can tune matching quality quickly without rebuilding the full backend stack.

## Semantic Search

Semantic search uses embeddings to find the closest existing scenario.

### Decision logic

The workflow compares the new scenario meaning with previously stored ones:

1. If similarity is high enough, it reuses existing media.
2. If similarity is not high enough, it generates fresh media.

### What semantic search decides in your project

Semantic search is the key switch between reuse and regeneration.

1. Reuse path:
If a new scenario is semantically close to an existing one, the system reuses existing media.
2. New generation path:
If no strong match is found, the system generates new visuals for that scenario.

So semantic search is not only retrieval. It is a cost, speed, and consistency controller for the whole AI pipeline.

### Why this matters

This gives two important benefits:

1. Faster response time when similar content already exists.
2. Better consistency across repeated learning themes.

It also reduces repeated work and computational cost.

## End-to-End Learning Flow

From the learner perspective, the complete loop is:

1. Child opens a category and starts a scenario.
2. AI prepares scenario text and choices.
3. System decides whether to reuse visuals or generate new visuals.
4. Child sees the scenario and makes a choice.
5. Child receives feedback that explains why the choice was safe or unsafe.

### Full pipeline view with model roles

1. Category is selected.
2. Gemma model expands and generates a scenario package.
3. Qwen embedding model compares the new scenario with historical ones.
4. The system chooses reuse or fresh image generation.
5. SDXL generates visuals when needed.
6. Scenario, choices, and media are delivered to the child interface.

This creates a closed learning loop where language reasoning, semantic memory, and visual storytelling work together.

The result is an interactive micro-lesson where each scenario teaches one clear safety behavior.

## Quality Principles

Across all stages, the workflow is guided by these principles:

1. Child safety first in language and visuals.
2. Clarity over complexity.
3. Consistent learning structure (situation -> choice -> feedback).
4. Efficient reuse of useful existing materials.

## Why This Architecture Works Well

Your architecture is strong because each model does one job well:

1. Gemma handles educational reasoning and structured scenario writing.
2. Qwen embeddings handle memory and semantic matching.
3. SDXL handles visual communication and engagement.

By separating responsibilities this way, you gain:

1. Better maintainability.
2. Better tuning per component.
3. Better reliability when one part needs to be upgraded.

## In Short

KidoSafe AI is a learning workflow engine:

1. It generates understandable safety scenarios.
2. It attaches visuals that support decision learning.
3. It uses semantic understanding to reuse what already works.
4. It delivers a complete interactive lesson to the child.