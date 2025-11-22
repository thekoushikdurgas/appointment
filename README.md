# Contact360 - Contact Management System (Next.js)

A comprehensive, modern web-based contact management system built with Next.js, React, TypeScript, and custom CSS. This is a Next.js migration of the original Vite-based React SPA.

## Core Technologies

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Custom CSS (semantic CSS classes with BEM-like naming)
- **Backend:** External Contact360 REST API (Contacts, Auth, User Profiles, AI Chats)
- **AI:** Google Gemini API
- **Charting:** Recharts
- **Icons:** Lucide React, React Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
# Windows
copy .env.example .env.local

# Linux/Mac
cp .env.example .env.local
```

3. Edit `.env.local` with your configuration:
   - `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Google Gemini API key
   - `NEXT_PUBLIC_CONTACTS_WRITE_KEY`: Contacts write operations key
   - `NEXT_PUBLIC_COMPANIES_WRITE_KEY`: Companies write operations key

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```txt
app/
  (auth)/              # Authentication routes (login, register)
  (dashboard)/         # Protected dashboard routes
    dashboard/         # Dashboard page
    contacts/          # Contacts management
    companies/         # Companies management
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
  ui/                 # UI components
  icons/              # Icon components
  apollo/             # Apollo integration components
  companies/          # Company-specific components
  contacts/           # Contact-specific components
  dashboard/          # Dashboard components
  auth/               # Authentication components
  linkedin/           # LinkedIn integration components
contexts/             # React contexts (Auth, Theme)
hooks/                # Custom React hooks
services/             # API services (Auth, User, AI Chat, Contacts, Apollo, LinkedIn)
types/                # TypeScript type definitions
utils/                # Utility functions and constants
styles/               # Custom CSS files
  ui-components.css   # Core UI component styles
  feature-*.css       # Feature-specific styles
  base.css            # Base styles and CSS variables
  components.css      # Component styles
  utilities.css       # Utility classes
  animations.css      # Animation classes
  responsive.css      # Responsive breakpoints
  layouts.css         # Layout styles
  pages.css           # Page-specific styles
```

## Features

- **Authentication:** JWT-based authentication with email/password via backend API
- **Contact Management:** Advanced filtering, sorting, and search with server-side pagination
- **Company Management:** Comprehensive company profiles with contact relationships
- **Dashboard:** Analytics dashboard with KPIs and charts
- **AI Assistant:** Google Gemini-powered assistant with contact search capabilities and chat history
- **Apollo Integration:** Seamless integration with Apollo.io for contact enrichment
- **LinkedIn Integration:** LinkedIn profile lookup and enrichment
- **Settings:** Comprehensive settings with profile, appearance, security, notifications, billing, and team management
- **Dark Mode:** Built-in theme switching with persistent preferences
- **Responsive Design:** Mobile-first responsive design for all screen sizes
- **Glassmorphism UI:** Modern glassmorphism effects with blur and transparency

## Development

### Commands

For detailed commands, see [commands.txt](commands.txt).

**Common commands:**
```bash
# Development
npm run dev

# Build
npm run build
npm run start

# Code Quality
npm run lint
npm run lint:fix
npm run type-check

# Clean
npm run clean
npm run clean:all
npm run clean:install
```

### Prompts

For development prompts and instructions, see [prompts.txt](prompts.txt).

## Building for Production

```bash
npm run build
npm start
```

## Styling Architecture

This project uses **custom CSS** with semantic class names following a BEM-like naming convention. The styling has been migrated from Tailwind CSS to a custom CSS architecture for better maintainability and performance.

### CSS Structure

- **Base Styles** (`base.css`): CSS variables, reset, typography
- **UI Components** (`ui-components.css`): Core UI component styles with glassmorphism effects
- **Feature Styles** (`feature-*.css`): Feature-specific component styles
- **Utilities** (`utilities.css`): Utility classes for common patterns
- **Animations** (`animations.css`): Animation classes and keyframes
- **Responsive** (`responsive.css`): Responsive breakpoints and media queries
- **Layouts** (`layouts.css`): Layout-specific styles
- **Pages** (`pages.css`): Page-specific styles

### CSS Features

- Semantic class names (BEM-like convention)
- CSS variables for theming
- Dark mode support via CSS variables
- Glassmorphism effects
- Smooth animations and transitions
- Responsive breakpoints
- Utility classes for common patterns

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_CONTACTS_WRITE_KEY=your_contacts_write_key
NEXT_PUBLIC_COMPANIES_WRITE_KEY=your_companies_write_key
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Do not put sensitive keys in `NEXT_PUBLIC_` variables.

## Key Differences from Vite Version

- Uses Next.js App Router instead of client-side routing
- File-based routing with Next.js conventions
- Server-side rendering capabilities (though most pages are client components)
- Custom CSS instead of Tailwind CSS
- Next.js Image component support (can be added where needed)

## API Integration

The frontend integrates with the Contact360 FastAPI backend:

- **Base URL**: Configured via `NEXT_PUBLIC_API_BASE_URL`
- **Authentication**: JWT tokens stored in localStorage
- **API Services**: Located in `services/` directory
- **WebSocket**: Real-time updates via WebSocket connections

For API documentation, see the backend documentation or visit <http://localhost:8000/docs> when the backend is running.

## Deployment

See [deploy/DEPLOYMENT.md](deploy/DEPLOYMENT.md) for deployment instructions.

## Troubleshooting

### Development server won't start

- Check Node.js version: `node --version` (should be 18+)
- Delete `node_modules` and reinstall: `npm run clean:install`
- Check `.env.local` file exists

### Build fails

- Check for TypeScript errors: `npm run type-check`
- Check for linting errors: `npm run lint`
- Clear `.next` folder: `npm run clean`

### API connection issues

- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Check backend server is running
- Verify CORS settings on backend
- Check browser console for errors

For more troubleshooting tips, see [commands.txt](commands.txt).

## Documentation

- [Root README](../README.md) - Project overview
- [Commands Reference](commands.txt) - Development commands
- [Prompts Reference](prompts.txt) - Development prompts
- [Frontend Documentation](docs/) - Implementation guides and conversion reports

## License

Private project - All rights reserved.
