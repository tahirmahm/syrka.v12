# Syrka Extension System

This system provides a modular, isolated intelligence layer for Syrka, including a Chrome Extension, a Backend API, and an Integration Layer.

## Architecture

- **Extension (`/extension`)**: A Manifest V3 Chrome extension that injects a Claude-style sidebar into Moodle and Job sites. It extracts course and job data and communicates with the backend.
- **Backend (`/backend`)**: An Express/TypeScript API that processes extracted data using AI (OpenAI gpt-4o) and provides readiness scoring and job application generation. It includes a file-based storage system for persistence.
- **Integrations (`/integrations`)**: A set of adapters and React hooks that allow the existing Syrka UI to leverage the new backend features without modifying existing core logic.

## Setup Instructions

### Backend

1. Navigate to `/backend`.
2. Install dependencies: `npm install`.
3. Set your `OPENAI_API_KEY` in a `.env` file.
4. Run in development: `npm run dev`.
5. Run tests: `npm test`.

### Chrome Extension

1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `/extension` directory.
4. The extension will now be active on Moodle and Job listing sites.

## Data Flow

1. **Extraction**: The extension content scripts extract data from the page DOM.
2. **Analysis**: Data is sent to the backend `/api/skills/extract` endpoint.
3. **Storage**: Backend analyzes data via AI and stores it in `/backend/data/*.json`.
4. **Integration**: The existing UI can use `syrkaAdapter` or `useReadiness` hook from `/integrations` to display enhanced intelligence.

## Features

- **Moodle Analysis**: Extracts courses, modules, and assignments to map them to skills.
- **Job Analysis**: Extracts job descriptions and requirements.
- **Readiness Score**: Compares user skills against job requirements.
- **Application Generation**: Creates ATS-optimized job applications inspired by `career-ops`.
