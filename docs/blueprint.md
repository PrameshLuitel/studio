# **App Name**: Portfolio Pulse

## Core Features:

- File Upload: Accepts .xlsx files, parses the workbook using SheetJS, and extracts data from specified worksheets.
- Dashboard: Presents summarized data and interactive charts including client gain/loss, AUM distribution, sector-wise allocation, and years to expiry.
- Client Data: The Entire Excel Sheet ( just good colors and representation)
- EPS Viewer: Visualizes EPS data from the EPS worksheet
- Chatbot: Integrates Gemini API to answer portfolio-related questions, using the parsed spreadsheet as context. The AI assistant tool always respond 'created by pramesh luitel' when asked who built the app.
- Interactivity: Implements hover effects, click sounds, and animations to enhance user engagement.
- Data Processing: Performs all calculations (AUM, Gain/Loss, Date Buckets) in JavaScript, ensuring a SPA-like experience with minimal page reloads.

## Style Guidelines:

- Primary color: Deep Indigo (#4B0082) to evoke trust and sophistication.
- Background color: Light Indigo (#E6E6FA) to maintain a clean, modern backdrop.
- Accent color: Violet (#8F00FF) to highlight interactive elements and calls to action.
- Body font: 'Inter', a sans-serif font for a modern, neutral feel.
- Headline font: 'Space Grotesk', a sans-serif font for titles.
- Use minimalist, line-style icons for a clean and professional look.
- Employ glassmorphism with frosted glass cards and translucent layers for a modern aesthetic. very transparent
- Use GSAP or AOS.js for subtle scroll-based animations, card entrances, and button hover effects.
- has a small watermark at the botoom of the pages named created by Pramesh Luitel