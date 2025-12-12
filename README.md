<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xJUADB6BqtL4OCVmNF4HoOHxzMAP4c-9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set environment variables in `.env.local`:
   - `GEMINI_API_KEY`: Your Gemini API key (if using AI features)
   - `VITE_GA_MEASUREMENT_ID`: Your Google Analytics 4 Measurement ID (optional, format: `G-XXXXXXXXXX`)
3. Run the app:
   `npm run dev`

## Google Analytics Setup

This project includes Google Analytics 4 (GA4) integration. To enable it:

1. **Get your Measurement ID:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property or select an existing one
   - Navigate to Admin → Data Streams → Web
   - Copy your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure the environment variable:**
   - Create a `.env.local` file in the root directory (if it doesn't exist)
   - Add: `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` (replace with your actual ID)
   - Restart your development server

3. **For production:**
   - Set the `VITE_GA_MEASUREMENT_ID` environment variable in your hosting platform (Vercel, Netlify, etc.)

**Note:** If `VITE_GA_MEASUREMENT_ID` is not set, Google Analytics will be automatically disabled and won't load any scripts.
