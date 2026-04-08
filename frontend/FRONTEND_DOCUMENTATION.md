# Frontend Documentation

## Product Summary

The Holberton Student Performance Tracking System (HSPTS) frontend is a standalone education analytics dashboard designed for academic leads, mentors, and school operators. The interface emphasizes learner risk visibility, cohort health, and intervention readiness.

The visual language is intentionally clean and high-contrast:

- Holberton red drives the main brand and attention system
- white space and low-noise card layouts keep analytics readable
- red escalation states make at-risk learners immediately visible
- charts and score containers are styled to feel presentation-ready, not generic admin UI

## Information Architecture

### 1. Overview Dashboard

Purpose:

- provide a fast executive snapshot of student health
- highlight at-risk learners and trend movement
- summarize recent operational activity

Key sections:

- top metric cards
- risk distribution donut chart
- 30-day score trend line chart
- at-risk student table
- activity feed

### 2. Students List

Purpose:

- help staff filter the roster quickly by cohort, track, and risk
- compare learner performance without opening every profile

Key sections:

- filter controls
- search input
- responsive table or mobile card list
- risk and trend visualization

### 3. Student Profile

Purpose:

- give mentors a compact but rich intervention view for a single learner

Key sections:

- identity header
- circular overall score display
- radar chart and progress breakdown
- activity timeline
- score history line chart

### 4. Reports

Purpose:

- present export-oriented reporting options for leadership and mentor workflows

Key sections:

- report type selector
- active preview surface
- export cards and actions

## Design Tokens

### Core Colors

- Primary red: `#F40F2C`
- Deep red hover: `#d60d28`
- Danger: `#b91c1c`
- Success: `#16a34a`
- Warning: `#ca8a04`
- Ink text: `#111827`
- Secondary text: `#6b7280`
- Surface white: `#ffffff`
- Card gray: `#fafafa`

### UX Principles

- use red for urgency and primary action, not for decoration everywhere
- keep content density high enough for analytics, but not crowded
- use large numeric hierarchy for scores and KPIs
- make risk visible by label, color, and placement
- ensure all screens collapse gracefully for mobile

## Component Strategy

The frontend uses lightweight shared primitives plus custom dashboard composition:

- UI primitives copied from the existing design system: button, card, input, select, sheet
- custom shell for Holberton navigation and header
- screen-level dashboard composition in `src/components/hspts-screens.tsx`
- mock data source in `src/lib/hspts-data.ts`

## Motion System

Animations are used for meaning, not noise:

- section reveals on load
- subtle card hover lift
- smooth chart and route-level continuity
- reduced-motion support through `useReducedMotion`

## File Structure

```text
src/
  app/
    page.tsx
    reports/page.tsx
    students/page.tsx
    students/[studentId]/page.tsx
    globals.css
    layout.tsx
  components/
    hspts-shell.tsx
    hspts-screens.tsx
    ui/
      button.tsx
      card.tsx
      input.tsx
      select.tsx
      sheet.tsx
  lib/
    hspts-data.ts
    utils.ts
```

## How To Extend

### Replace mock data

Swap `src/lib/hspts-data.ts` with API-backed data loading and keep the same object shape where possible.

### Add auth

Wrap the root layout with a session provider or route guard if this moves beyond demo mode.

### Connect exports

The report buttons are currently UI-first. Connect them to backend report generation or file streaming endpoints.

### Add backend integration

Recommended integration path:

- `/api/dashboard/summary`
- `/api/students`
- `/api/students/:id`
- `/api/reports`

## Local Development

```bash
npm install
npm run dev -- --port 3001
```

## Validation Performed

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Hackathon Positioning

This frontend is optimized for demo clarity:

- strong first impression
- immediately understandable risk visualizations
- realistic mentor workflow storytelling
- enough structure to grow into a production app after the hackathon
