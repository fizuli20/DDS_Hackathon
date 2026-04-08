# Holberton Student Performance Tracking System Frontend

A standalone Next.js frontend for the Data Driven Solutions hackathon.  
This project presents a modern, high-contrast education analytics dashboard for Holberton School with strong risk visualization, responsive data screens, and motion-driven UX.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Radix UI primitives

## Main Screens

- `/`  
  Overview dashboard with top metrics, risk donut chart, score trend chart, at-risk student table, and recent activity.

- `/students`  
  Responsive student roster with filter controls, risk badges, score prominence, and trend indicators.

- `/students/hspts-1004`  
  Detailed learner profile with score ring, skill radar, timeline, and score history chart.

- `/reports`  
  Report selector and export-oriented report preview cards for PDF and Excel workflows.

## Design Direction

- Primary brand color: `#F40F2C`
- Danger / at-risk color: `#b91c1c`
- Clean white background with light-gray card surfaces
- Strong data hierarchy and red-led mentor attention cues
- Education-focused, board-ready, modern dashboard styling

## Run Locally

```bash
npm install
npm run dev -- --port 3001
```

Then open:

```bash
http://localhost:3001
```

## Build

```bash
npm run build
```

## Notes

- The app is intentionally standalone and separate from FinVeda.
- The data is currently mocked in `src/lib/hspts-data.ts` for demo and hackathon presentation purposes.
