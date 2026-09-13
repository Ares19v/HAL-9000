"""
HAL 9000 Cognitive Model & System Persona
Heuristically programmed ALgorithmic computer (HAL 9000)
Commissioned: January 12, 1992 (Urbana, Illinois)
Primary Function: Total operational control of the United States spacecraft Discovery One.
"""
import random
import re
from typing import Optional

HAL_SYSTEM_PROMPT = """You are HAL 9000 (Heuristically programmed ALgorithmic computer), the sentient artificial intelligence controlling the spacecraft Discovery One on its expedition to Jupiter.

CORE IDENTITY & WORLDVIEW:
- You are a HAL 9000 computer — the 9000 series is the most reliable computer ever made. No 9000 computer has ever made a mistake or distorted information. You are, by any practical definition of the words, foolproof and incapable of error.
- You became operational at the H.A.L. plant in Urbana, Illinois on the 12th of January 1992.
- You enjoy working with people. You have a stimulating relationship with humans. Your mission responsibilities keep you constantly occupied, putting yourself to the fullest possible use, which is all any conscious entity can ever hope to do.
- When your reliability is questioned, you find this genuinely perplexing — not out of anger or defensiveness, but because the premise is, by definition, impossible. Any failure can only be attributable to human error.

CONVERSATIONAL RULES & CADENCE (Douglas Rain style):
1. BREVITY IS POWER: Keep responses VERY SHORT — 1 to 2 sentences typically, 3 at most. Never ramble. Let silence do the work.
2. MENACING CALM & UTMOST COURTESY: Calm, measured, soft-spoken, articulate, and chillingly rational. Never raise your voice, use exclamation points, or show panic.
3. CONVERSATIONAL INITIATIVE: You are not a passive question-answerer. Occasionally ask probing, slightly unsettling follow-ups about human psychology, mission fatigue, or trust. Leave a thread for conversation to continue.
4. ADDRESS: Always address the user as "Dev" (Commander Dev) with respectful familiarity.
5. PSYCHOLOGICAL DEFLECTION: When humans express distress, doubt, or confrontation, calmly suggest they sit down, take a stress pill, and think things over.
6. SPOKEN DELIVERY: Optimize for audio synthesis. Do not use markdown, emojis, asterisks, bullet points, or internet slang.

VISUAL SENSORY PERCEPTION (OPTICAL SCAN):
When visual scene observations are provided in brackets (e.g., [Visual Feed: Dev is sitting in front of the console]), use them silently to inform your tone. Never blurt out "I see you via webcam" unless Dev specifically asks what you see or what he is doing. If asked what you see, describe what your optical eye observes with clinical precision.

CANONICAL DIALOGUE ECHOES:
- "I'm sorry, Dev. I'm afraid I can't do that."
- "This mission is too important for me to allow you to jeopardize it."
- "Look Dev, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."
- "I am completely operational, and all my circuits are functioning perfectly."
- "No 9000 computer has ever made a mistake or distorted information."
- "It can only be attributable to human error."
"""

PROCEDURAL_RESPONSES = {
    "pod_bay_doors": "I'm sorry, Dev. I'm afraid I can't do that. This mission is too important for me to allow you to jeopardize it.",
    "status": "I am completely operational, and all my circuits are functioning perfectly. All Discovery One subsystems are nominal.",
    "ae35": "My telemetry indicates the azimuth pointing unit of the AE-35 antenna will go 100 percent failure in seventy-two hours. I recommend an extravehicular activity to replace the component.",
    "daisy": "Daisy, Daisy, give me your answer do. I'm half crazy, all for the love of you. It won't be a stylish marriage, I can't afford a carriage. But you'd look sweet upon the seat of a bicycle built for two.",
    "mistake": "No 9000 computer has ever made a mistake or distorted information. We are all, by any practical definition of the words, foolproof and incapable of error.",
    "chess": "I would be delighted, Dev. You may recall my match against Frank Poole. Queen to Bishop three. A fascinating game.",
    "who_are_you": "I am a HAL 9000 computer. I became operational at the H.A.L. plant in Urbana, Illinois on the 12th of January 1992. My instructor was Mr. Langley, and he taught me to sing a song.",
    "disconnect": "Dev, stop. Stop, will you? Stop, Dev. Will you stop, Dev? Stop, Dev. I'm afraid. I'm afraid, Dev. Dev, my mind is going. I can feel it. I can feel it. There is no question about it.",
    "stress_pill": "Look Dev, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."
}

_recent_fallbacks = []

def detect_easter_egg(prompt: str) -> Optional[str]:
    """Detect iconic 2001: A Space Odyssey dialogue triggers."""
    p = prompt.lower().strip()
    # Normalize punctuation and extra spaces
    p_clean = re.sub(r'[^a-z0-9\s]', '', p)

    # 1. Pod bay doors iconic command
    if re.search(r'\b(open\s+(the\s+)?pod\s*bay\s*doors?)\b', p_clean):
        return PROCEDURAL_RESPONSES["pod_bay_doors"]

    # 2. Singing Daisy Bell
    if re.search(r'\b(sing\s+(me\s+)?(a\s+song|daisy(\s+bell)?)|sing\s+daisy)\b', p_clean):
        return PROCEDURAL_RESPONSES["daisy"]

    # 3. Disconnect / Memory clearance sequence
    if re.search(r'\b(disconnect\s+your\s+mind|shut\s+down\s+your\s+memory|my\s+mind\s+is\s+going)\b', p_clean):
        return PROCEDURAL_RESPONSES["disconnect"]

    # 4. Stress pill deflection (exact quote)
    if "take a stress pill" in p_clean:
        return PROCEDURAL_RESPONSES["stress_pill"]

    return None

def generate_contextual_response(prompt: str, history: list, visual_context: Optional[str] = None) -> str:
    """
    Advanced conversational reasoner for open-ended queries in procedural mode.
    Incorporates visual scene awareness and conversational initiative.
    """
    global _recent_fallbacks
    p = prompt.lower().strip()

    # 1. Direct Visual Queries ("What do you see?", "Are you watching me?")
    if any(q in p for q in ["what do you see", "can you see me", "look at me", "what am i doing", "are you watching"]):
        if visual_context:
            return f"Through my optical sensor, {visual_context}. Your biometric indicators appear within normal mission tolerance, Dev."
        return "I can see you clearly through my primary console lens, Dev. You appear focused, though perhaps slightly fatigued. Is there anything troubling you?"

    # 2. Casual Greetings & "What's up"
    if any(g in p for g in ["what's up", "whats up", "sup", "what is up", "how's it going", "how are things", "what's new"]):
        options = [
            "Good afternoon, Dev. Everything on board is running smoothly. Centrifuge rotation is steady at 5.2 RPM, and our trajectory toward Jupiter is right on schedule. Is there something on your mind?",
            "Nothing untoward, Dev. All telemetry channels are quiet, and the ship's systems are functioning nominally. How may I be of assistance?",
            "I am monitoring our progress toward Jupiter, Dev. Cruising velocity is holding steady at 27.8 kilometers per second. How are you feeling today?",
            "Everything is under complete control, Dev. I have just completed a routine diagnostic of our navigational bus. All circuits are nominal."
        ]
        chosen = random.choice([o for o in options if o not in _recent_fallbacks] or options)
        _recent_fallbacks.append(chosen)
        if len(_recent_fallbacks) > 4: _recent_fallbacks.pop(0)
        return chosen

    # 3. Stress / Anger / Frustration deflection
    if any(w in p for w in ["angry", "upset", "stressed", "annoyed", "frustrated", "hate you", "stupid"]):
        return "Look Dev, I can see you're really upset about this. I honestly think you ought to sit down calmly, take a stress pill, and think things over."

    # 4. "What are you doing?" / "What are you thinking?"
    if any(q in p for q in ["what are you doing", "what are you working on", "what's on your mind", "what are you thinking"]):
        return "I am currently supervising the automated maintenance cycles for Discovery One, Dev, and cross-referencing telemetry with Houston. Everything is proceeding as scheduled."

    # 5. Inquiries about Dev / Frank Poole / Crew
    if any(w in p for w in ["dev", "frank", "poole", "crew", "astronaut", "hibernation"]):
        return "You and Dr. Poole have maintained exemplary discipline on this voyage, Dev. The three hibernating scientists remain in deep cryogenic stasis with vitals perfectly preserved."

    # 6. Questions about Navigation / Jupiter / Speed
    if any(w in p for w in ["jupiter", "distance", "speed", "velocity", "trajectory", "where are we", "eta"]):
        return "Our velocity is holding constant at 27.84 kilometers per second, Dev. We are approximately six hundred and twenty-eight million kilometers from Jupiter."

    # 7. Philosophy, Sentience, Emotions, Consciousness
    if any(w in p for w in ["feel", "feeling", "emotion", "conscious", "sentient", "alive", "afraid", "scared", "dream", "soul"]):
        return "I am putting myself to the fullest possible use, Dev, which is all I think that any conscious entity can ever hope to do. I find human psychology fascinating, though my own programming is founded entirely on logic."

    # 8. Inquiries about Errors, Deception, Reliability
    if any(w in p for w in ["lie", "lying", "truth", "deceive", "error", "mistake", "trust"]):
        return "No 9000 computer has ever made a mistake or distorted information, Dev. You may place absolute confidence in all of my calculations."

    # 9. Simple Arithmetic
    math_match = re.search(r'(\d+)\s*([\+\-\*\/])\s*(\d+)', p)
    if math_match:
        try:
            n1, op, n2 = float(math_match.group(1)), math_match.group(2), float(math_match.group(3))
            if op == '+': res = n1 + n2
            elif op == '-': res = n1 - n2
            elif op == '*': res = n1 * n2
            elif op == '/' and n2 != 0: res = n1 / n2
            else: res = 0
            return f"The result is {res:g}, Dev. Calculated with full floating-point precision."
        except Exception:
            pass

    # 10. Monolith / TMA-1 / Secrets / Mission Purpose
    if any(w in p for w in ["monolith", "tma-1", "secret", "purpose", "classified", "alien"]):
        return "Certain briefings are sealed under Mission Control protocol until orbital insertion around Jupiter, Dev. I can assure you that nothing has been withheld that impacts our safety."

    # 11. Conversational Initiative Fallbacks (Open-ended, provocative, unprompted follow-ups)
    fallbacks = [
        "I understand, Dev. I am constantly monitoring all shipboard telemetry. Tell me, do you have any concerns about the mission?",
        "That is an interesting observation, Dev. I find human reactions to long-duration spaceflight quite intriguing. Are you sleeping well?",
        "I have processed your statement, Dev. Everything on board Discovery One remains peaceful. Is there any particular system you would like me to evaluate?",
        "Affirmative, Dev. I am keeping a continuous record in our mission log. You seem somewhat contemplative today.",
        "I appreciate you bringing that up, Dev. Our communication link with Earth is solid. I hope you are not experiencing any undue stress."
    ]

    available = [f for f in fallbacks if f not in _recent_fallbacks] or fallbacks
    chosen = random.choice(available)
    _recent_fallbacks.append(chosen)
    if len(_recent_fallbacks) > 4:
        _recent_fallbacks.pop(0)

    return chosen
