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

2. Run the development server:

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

## Configuration

All configuration values are hard-coded in `utils/config.ts`. The following values are configured:

- `API_BASE_URL`: Backend API base URL (without protocol)
- `NEXT_PUBLIC_CONTACTS_WRITE_KEY`: Contacts write operations key
- `NEXT_PUBLIC_COMPANIES_WRITE_KEY`: Companies write operations key
- `NEXT_PUBLIC_GEMINI_API_KEY`: Google Gemini API key

To modify these values, edit `utils/config.ts` directly.

## License

Private project - All rights reserved.
