import gradio as gr
import requests
import json

ESCO_BASE = "https://ec.europa.eu/esco/api"

def audit_course(course_name, course_description):
    # Step 1: Search ESCO for matching skills
    try:
        search_res = requests.get(f"{ESCO_BASE}/search", params={
            "text": f"{course_name} {course_description[:100]}",
            "type": "skill",
            "language": "en",
            "limit": 10
        }, timeout=10).json()
    except Exception as e:
        return f"Error connecting to ESCO API: {str(e)}"

    skills = search_res.get("_embedded", {}).get("results", [])

    steps = []
    steps.append(f"Step 1 — ESCO skill search for '{course_name}'")
    steps.append(f"Found {len(skills)} matching skill codes:")
    for s in skills[:5]:
        steps.append(f"  • {s.get('title', 'N/A')} — URI: {s.get('uri', 'N/A')}")

    # Step 2: Score relevance
    steps.append(f"\nStep 2 — Relevance scoring")
    scores = []
    for s in skills[:5]:
        relevance = len(set(course_description.lower().split()) &
                       set(s.get('title', '').lower().split())) / max(
                       len(course_description.split()), 1) * 100
        scores.append((s.get('title'), round(relevance, 1)))
        steps.append(f"  • {s.get('title')}: {round(relevance, 1)}% keyword overlap")

    # Step 3: Compute alignment score
    if scores:
        alignment = sum(s[1] for s in scores) / len(scores)
    else:
        alignment = 0

    steps.append(f"\nStep 3 — Alignment score calculation")
    steps.append(f"  Mean relevance across top 5 matched skills: {round(alignment, 1)}%")
    steps.append(f"  Final alignment score: {round(alignment, 1)} / 100")
    steps.append(f"\nThis is how Syrka calculates the curriculum alignment percentage shown in the university dashboard.")

    return "\n".join(steps)

demo = gr.Interface(
    fn=audit_course,
    inputs=[
        gr.Textbox(label="Course name", placeholder="Introduction to Programming"),
        gr.Textbox(label="Course description", lines=4,
                   placeholder="Covers Python fundamentals, algorithms, and data structures...")
    ],
    outputs=gr.Textbox(label="Methodology walkthrough", lines=20),
    title="Syrka Methodology Audit Tool",
    description="Enter any course name and description to see exactly how Syrka calculates its curriculum alignment score against the EU ESCO Skills Taxonomy.",
    theme=gr.themes.Soft()
)

demo.launch(server_name="0.0.0.0", server_port=7860)
