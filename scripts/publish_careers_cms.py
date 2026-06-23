"""Publish default careers CMS (listings + application form) to kk_app_settings."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = "idwtlujcdfnnndxmlaco"
BASE = f"https://{REF}.supabase.co"

CAREERS_CONTENT = {
    "copy": {
        "heroEyebrow": "Careers at Kado Kohi",
        "heroTitle": "Build the tambayan with us",
        "heroDescription": (
            "We hire people who care about craft coffee, ceremonial matcha, and warm hospitality. "
            "Grow your career in Marikina — on the bar, behind the brand, on the decks, or on the road."
        ),
        "heroBenefits": ["Hands-on training", "Growth paths", "Team-first culture", "Flexible schedules"],
        "whyJoinTitle": "Why join our corner?",
        "whyJoinBody": (
            "Kado Kohi is a Japanese-inspired urban café built for community — morning runs, study sessions, "
            "and late-night tambayan. We invest in people who show up with curiosity, consistency, and care."
        ),
        "careersSectionTitle": "Open roles",
        "careersSectionIntro": (
            "From espresso bars to marketing campaigns, weekend DJ sets to delivery runs — "
            "explore roles across our Marikina home base."
        ),
        "creatorsSectionTitle": "Content creators",
        "creatorsSectionIntro": (
            "Reels, lookbooks, event coverage, and UGC that fits our mood — "
            "pitch a concept or ask about upcoming campaigns."
        ),
        "collabsSectionTitle": "Collaborations",
        "collabsSectionIntro": (
            "Pop-ups, co-branded drinks, neighborhood activations, and partner booths — "
            "tell us your idea and we'll explore it together."
        ),
        "emptyMessage": "No open listings in this section right now. Follow @kadocoffeeph or check back soon.",
    },
    "listings": [
        {
            "id": "career_barista",
            "title": "Barista",
            "category": "careers",
            "location": "Marikina · Sta. Elena",
            "employmentType": "Full-time / Part-time",
            "description": (
                "Pull espresso, whisk matcha, and hold space for our tambayan. "
                "Prior café experience helps; warmth and consistency matter most."
            ),
            "applyLabel": "Apply now",
            "applyMode": "form",
            "visible": True,
            "sortOrder": 0,
        },
        {
            "id": "career_marketing_manager",
            "title": "Marketing Manager",
            "category": "careers",
            "location": "Marikina · Sta. Elena",
            "employmentType": "Full-time",
            "description": (
                "Own campaigns, social storytelling, and local partnerships. "
                "You translate brand voice into reels, events, and community moments that feel unmistakably Kado Kohi."
            ),
            "applyLabel": "Apply now",
            "applyMode": "form",
            "visible": True,
            "sortOrder": 1,
        },
        {
            "id": "career_dj",
            "title": "DJ",
            "category": "careers",
            "location": "Marikina · Metro Manila",
            "employmentType": "Part-time / Events",
            "description": (
                "Set the mood for tambayan nights, run club pop-ups, and collaborate on seasonal playlists. "
                "Share your mixes and event experience."
            ),
            "applyLabel": "Apply now",
            "applyMode": "form",
            "visible": True,
            "sortOrder": 2,
        },
        {
            "id": "career_delivery_rider",
            "title": "Delivery Rider",
            "category": "careers",
            "location": "Marikina & nearby areas",
            "employmentType": "Part-time / Full-time",
            "description": (
                "Deliver Kado Kohi orders safely and on time around Marikina. "
                "Valid license, reliable phone, and friendly service on every drop-off."
            ),
            "applyLabel": "Apply now",
            "applyMode": "form",
            "visible": True,
            "sortOrder": 3,
        },
        {
            "id": "career_creator",
            "title": "Creator partner — reels & events",
            "category": "content-creators",
            "location": "Metro Manila",
            "employmentType": "Project-based",
            "description": (
                "Cover Kado Run mornings, tambayan nights, or seasonal drink drops. "
                "Share your portfolio and rate card — we reply with campaign fit."
            ),
            "applyLabel": "Submit pitch",
            "applyMode": "form",
            "visible": True,
            "sortOrder": 0,
        },
        {
            "id": "career_collab_pop",
            "title": "Pop-up & co-brand collabs",
            "category": "collaborations",
            "location": "Marikina & Metro Manila",
            "employmentType": "Partnership",
            "description": (
                "Bakeries, brands, and neighborhood groups — propose a limited drink, merch drop, "
                "or weekend activation at the corner or your venue."
            ),
            "applyLabel": "Propose a collab",
            "applyMode": "form",
            "visible": True,
            "sortOrder": 0,
        },
    ],
    "applicationForm": {
        "title": "Apply to Kado Kohi",
        "intro": "Tell us about yourself — we reply to every application within a few business days.",
        "successTitle": "Application sent",
        "successMessage": "Thanks for applying. Our team will review your details and get back to you by email.",
        "fields": [
            {
                "id": "f_name",
                "type": "text",
                "label": "Full name",
                "placeholder": "Your name",
                "required": True,
                "mapsTo": "contact_name",
            },
            {
                "id": "f_phone",
                "type": "phone",
                "label": "Phone number",
                "required": True,
                "mapsTo": "contact_phone",
            },
            {
                "id": "f_email",
                "type": "email",
                "label": "Email",
                "placeholder": "you@email.com",
                "required": True,
                "mapsTo": "contact_email",
            },
            {
                "id": "f_availability",
                "type": "select",
                "label": "Availability",
                "required": True,
                "options": ["Full-time", "Part-time", "Weekends only", "Flexible / project-based"],
            },
            {
                "id": "f_why",
                "type": "textarea",
                "label": "Why do you want to join Kado Kohi?",
                "placeholder": "A few sentences about you, your experience, and what draws you to our corner.",
                "required": True,
                "helpText": "Share relevant experience — cafe, marketing, events, delivery, or hospitality.",
            },
            {
                "id": "f_portfolio",
                "type": "text",
                "label": "Portfolio or social link",
                "placeholder": "Instagram, portfolio URL, or sample work (optional)",
                "required": False,
            },
        ],
    },
}


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    path = ROOT / ".env"
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        val = val.strip().strip('"')
        env[key] = val
    return env


def main() -> None:
    env = load_env()
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or ""
    if not key:
        print("ERR: missing SUPABASE_SERVICE_ROLE_KEY in .env", file=sys.stderr)
        sys.exit(1)

    body = json.dumps({"id": True, "careers_content": CAREERS_CONTENT}).encode()
    req = urllib.request.Request(
        f"{BASE}/rest/v1/kk_app_settings",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "resolution=merge-duplicates",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print("OK", resp.status)
    except urllib.error.HTTPError as err:
        print("ERR", err.code, err.read().decode(), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
