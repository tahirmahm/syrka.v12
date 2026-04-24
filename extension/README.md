# SYRKA Chrome Extension

This extension provides "Course Intelligence" for Moodle and "Job Intelligence" for various job boards, integrated with the Syrka platform.

## Features
- **Course Intelligence**: Detects course name, modules, and assignments on Moodle pages.
- **Job Intelligence**: Detects job titles, companies, and skills on LinkedIn, Indeed, etc.
- **Offer Scoring**: A-F grading based on salary, skills match, seniority, and preferences.
- **Syrka Integration**: One-click "Add to Pipeline" and "Generate Application".

## Installation
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `/extension` folder from this repository.

## Backend Setup
The extension communicates with the Syrka backend.
1. Ensure the Syrka Next.js app is running locally on `http://localhost:3000`.
2. The endpoint `http://localhost:3000/api/extension/ingest` must be available.
3. Run the provided migration in `extension-backend/migration.sql` on your Supabase instance.

## Testing
- **Moodle**: Visit any URL containing `/course/` or `/moodle/`.
- **Jobs**: Visit a LinkedIn job listing or any URL matching the `/jobs/` pattern.
- **Scoring**: View the Grade (A-F) in the Job Intelligence section.

## Design System
- Background: `#111417`
- Surface: `#1D2023`
- Primary: `#FFFFFF`
- Fonts: Space Grotesk, Inter
- Zero border-radius (except pills)

## Git Commands
\`\`\`bash
git checkout -b feature/syrka-chrome-extension
git add .
git commit -m "feat: implement syrka chrome extension and backend ingest route"
git push origin feature/syrka-chrome-extension
\`\`\`
