import gradio as gr
import requests

ESCO_BASE = "https://ec.europa.eu/esco/api"

def audit_course(course_name, course_description, vision_context):
    steps = []
    steps.append(f"STEP 1 — ESCO Skill Search")
    steps.append(f"Query: '{course_name} {course_description[:80]}'")
    steps.append("")

    try:
        res = requests.get(f"{ESCO_BASE}/search", params={
            "text": f"{course_name} {course_description[:100]}",
            "type": "skill", "language": "en", "limit": 10
        }, timeout=10).json()
        skills = res.get("_embedded", {}).get("results", [])
    except Exception:
        skills = []

    steps.append(f"Found {len(skills)} ESCO skill matches:")
    for s in skills[:6]:
        steps.append(f"  [{s.get('uri','').split('/')[-1]}] {s.get('title','')}")

    steps.append("")
    steps.append("STEP 2 — Vision Alignment Scoring")

    vision_keywords = vision_context.lower().split() if vision_context else []
    scores = []
    for s in skills[:6]:
        skill_words = set(s.get('title', '').lower().split() +
                         s.get('description', '').lower().split()[:20])
        course_words = set(course_description.lower().split())
        vision_words = set(vision_keywords)

        esco_relevance = len(course_words & skill_words) / max(len(course_words), 1)
        vision_relevance = len(vision_words & skill_words) / max(len(vision_words), 1) if vision_words else 0
        combined = (esco_relevance * 0.6 + vision_relevance * 0.4) * 100
        scores.append(combined)
        steps.append(f"  {s.get('title','')[:40]}: ESCO match {esco_relevance*100:.0f}% | Vision match {vision_relevance*100:.0f}% | Combined {combined:.1f}")

    steps.append("")
    steps.append("STEP 3 — Final Alignment Score")

    if scores:
        alignment = sum(scores) / len(scores)
        steps.append(f"  Mean across {len(scores)} matched skills: {alignment:.1f} / 100")
        steps.append(f"  This is the score shown in Syrka's university curriculum dashboard.")
        steps.append("")
        steps.append("STEP 4 — What This Means")
        if alignment >= 70:
            steps.append(f"  Score {alignment:.0f}/100 = Strong alignment. Course content maps well to ESCO skills demanded by the Vision sector.")
        elif alignment >= 40:
            steps.append(f"  Score {alignment:.0f}/100 = Moderate alignment. Core concepts present but Vision-specific applications missing.")
        else:
            steps.append(f"  Score {alignment:.0f}/100 = Low alignment. Course content does not map to skills required for Vision-priority roles.")
    else:
        steps.append("  No ESCO skills matched. Score: 0/100")
        steps.append("  This typically means the course content is too general or uses terminology not in the ESCO taxonomy.")

    return "\n".join(steps)

demo = gr.Interface(
    fn=audit_course,
    inputs=[
        gr.Textbox(label="Course name", placeholder="Introduction to Programming"),
        gr.Textbox(label="Course description", lines=4,
                  placeholder="Covers Python fundamentals, data structures, algorithms..."),
        gr.Textbox(label="National Vision context", lines=2,
                  placeholder="Saudi Vision 2030: AI, cloud computing, cybersecurity, fintech...")
    ],
    outputs=gr.Textbox(label="Methodology walkthrough — step by step", lines=25),
    title="Syrka Curriculum Alignment — Methodology Audit",
    description="Shows exactly how Syrka calculates curriculum alignment scores against the EU ESCO Skills Taxonomy. Use this to verify any score shown in the university dashboard.",
    examples=[
        ["Introduction to Programming", "Covers Python basics, variables, loops, functions, and simple algorithms. Weekly lab sessions.", "Saudi Vision 2030: artificial intelligence, machine learning, data science, digital transformation"],
        ["Data Structures and Algorithms", "Binary trees, sorting algorithms, graph theory, dynamic programming, computational complexity.", "Malta Vision 2050: digital economy, ICT sector, software development, technology innovation"],
        ["Professional Ethics", "Academic integrity, research ethics, professional codes of conduct. Case studies from engineering practice.", "Saudi Vision 2030: AI ethics, cybersecurity frameworks, digital governance, Vision compliance"]
    ]
)

demo.launch(server_name="0.0.0.0", server_port=7860)
