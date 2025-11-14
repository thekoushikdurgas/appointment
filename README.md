# NexusCRM - Contact Management System (Next.js)

A comprehensive, modern web-based contact management system built with Next.js, React, TypeScript, and Tailwind CSS. This is a Next.js migration of the original Vite-based React SPA.

## Core Technologies

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** External Appointment360 REST API (Contacts, Auth, User Profiles, AI Chats)
- **AI:** Google Gemini API
- **Charting:** Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
API_KEY=your_gemini_api_key
NEXT_PUBLIC_API_BASE_URL=http://54.88.182.69:8000
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```txt
app/
  (auth)/              # Authentication routes (login, register)
  (dashboard)/         # Protected dashboard routes
    dashboard/         # Dashboard page
    contacts/          # Contacts management
    orders/            # Orders page
    history/           # Export history
    ai-assistant/      # AI assistant with Gemini
    plans/             # Subscription plans
    settings/          # Settings with sub-pages
      profile/         # Profile settings
      appearance/      # Theme settings
      security/        # Security settings
      notifications/   # Notification preferences
      billing/         # Billing information
      team/            # Team management
components/            # Reusable components
  layout/             # Layout components (Sidebar)
  icons/              # Icon components
contexts/             # React contexts (Auth, Theme)
hooks/                # Custom React hooks
services/             # API services (Auth, User, AI Chat, Contacts)
types/                # TypeScript type definitions
utils/                # Utility functions and constants
```

## Features

- **Authentication:** JWT-based authentication with email/password via backend API
- **Contact Management:** Advanced filtering, sorting, and search with server-side pagination
- **Dashboard:** Analytics dashboard with KPIs and charts
- **AI Assistant:** Google Gemini-powered assistant with contact search capabilities and chat history
- **Settings:** Comprehensive settings with profile, appearance, security, notifications, billing, and team management
- **Dark Mode:** Built-in theme switching
- **Responsive Design:** Mobile-first responsive design

## Building for Production

```bash
npm run build
npm start
```

## Key Differences from Vite Version

- Uses Next.js App Router instead of client-side routing
- File-based routing with Next.js conventions
- Server-side rendering capabilities (though most pages are client components)
- Next.js Image component support (can be added where needed)
- Environment variables use `NEXT_PUBLIC_` prefix for client-side access

## Environment Variables

All environment variables should be prefixed with `NEXT_PUBLIC_` if they need to be accessed in client components. The API key for Gemini is accessed via `process.env.NEXT_PUBLIC_GEMINI_API_KEY` or `process.env.API_KEY` (configured in next.config.js).

## License

Private project - All rights reserved.
