# Syrka — National Human Capital Intelligence Platform

**Live:** [syrka12.vercel.app](https://syrka12.vercel.app)

Syrka is an AI-powered platform that helps governments, universities, employers, and students understand and close national workforce gaps. It turns fragmented labour market data into actionable intelligence — gap analyses, policy prescriptions, simulation models, and benchmarks — tailored to each stakeholder.

---

## The Problem

Governments and institutions face a structural disconnect between education outputs and labour market needs. Workforce gap data exists in silos — ministries, universities, employers, and students each have partial pictures but no unified intelligence layer. The result is misallocated training budgets, graduates entering oversupplied fields, and persistent skills shortages in critical sectors.

---

## What Syrka Does

Syrka provides a multi-stakeholder national workforce intelligence system with four distinct dashboards:

### Ministry Dashboard
For government ministries of education and labour:
- **National Workforce Gap Overview** — real-time supply/demand gap visualization across all sectors
- **Gap Analysis Engine** — AI-generated sector-level gap reports with severity scoring
- **Policy Prescription Generator** — actionable policy recommendations based on gap data
- **Workforce Simulation** — scenario modelling to project gap trajectories under different policy interventions
- **International Benchmarking** — compare national workforce metrics against peer countries
- **Stakeholder Chat (MiroFish)** — AI assistant trained on national human capital data

### University Dashboard
- **Rankings Intelligence** — QS/THE global rankings analysis and positioning
- **Graduate Outcome Tracking** — where graduates are going vs. where demand is
- **Sector Alignment View** — how programme offerings map to labour market needs
- **Employer Engagement Signals** — demand signals from employer-side data

### Employer Dashboard
- **Talent Gap View** — skills shortages by occupation and sector
- **ESCO Skills Mapping** — standardised European skills taxonomy integration
- **Workforce Planning Tools** — supply projections for hiring pipeline planning

### Student Dashboard
- **Career Track Intelligence** — demand outlook by field of study and occupation
- **Skills Gap Guidance** — personalised recommendations based on target career paths
- **Graduate Market Overview** — live labour market context for decision-making

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (Postgres) |
| AI / LLM | OpenAI GPT-4 + LangChain + LangGraph |
| AI Fallback | DeepSeek (automatic failover) |
| Vector Search | Chroma DB |
| Charts | Apache ECharts + Observable Plot |
| OCR | Document extraction pipeline |
| Skills Data | ESCO taxonomy API |
| Rankings Data | QS / THE integration |
| External Data | Wikidata enrichment |
| UI | Tailwind CSS + Lucide |
| Deployment | Vercel |

---

## Architecture

```
app/
  [country]/
    ministry/       # Government policy dashboard
    university/     # University intelligence dashboard
    employer/       # Employer workforce dashboard
    student/        # Student career dashboard
  api/
    ai/             # LLM inference endpoints
    benchmark/      # International benchmarking
    chroma/         # Vector search
    comparison/     # Country comparison generation
    esco/           # Skills taxonomy mapping
    mirofish/       # Stakeholder AI chat
    ocr/            # Document extraction
    prescriptions/  # Policy prescription generation
    rankings/       # QS/THE rankings intelligence
    students/       # Student data
    wikidata/       # Country data enrichment
components/
  charts/           # Reusable chart components
  ministry/         # Ministry-specific UI modules
  university/       # University-specific UI modules
  employer/         # Employer-specific UI modules
  student/          # Student-specific UI modules
```

---

## Supported Countries

Currently live with data for:
- **Malta** — Full ministry, university, employer, and student dashboards
- **Saudi Arabia** — Ministry dashboard with Vision 2030 workforce alignment

Architecture is country-agnostic — new countries are added via the `[country]` dynamic route.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project
- OpenAI API key
- DeepSeek API key (optional, for fallback)

### Installation

```bash
git clone https://github.com/tahirmahm/syrka.v12.git
cd syrka.v12
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

Deployed on Vercel with automatic production deployments on push to main.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tahirmahm/syrka.v12)

---

## Roadmap

- [ ] Additional country modules (GCC expansion)
- [ ] Real-time labour market data integrations
- [ ] University partnership portal
- [ ] Employer talent pipeline API
- [ ] Multi-language support (Arabic)

---

## About

Built by [Tahir Mahmood Khan](https://www.linkedin.com/in/tahir-mahmood-khan/) — policy technologist and CEO of Syrka, focused on bridging the gap between education systems and labour markets across emerging economies.

**Contact:** [LinkedIn](https://www.linkedin.com/in/tahir-mahmood-khan/) | [syrka.co](https://syrka.co)
