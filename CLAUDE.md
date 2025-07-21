# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "旅のしおり" (Travel Itinerary), a Next.js-based web application for creating and managing travel itineraries with maps integration. The app supports multi-day trip planning with Google Maps/Mapbox integration and social sharing features.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database initialization
npm run init-db      # Initialize MongoDB database with sample data
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **UI**: React 19, Radix UI components, Tailwind CSS
- **State Management**: Jotai for global state
- **Forms**: React Hook Form with Zod validation
- **Database**: MongoDB with Mongoose ODM
- **Maps**: Mapbox GL (primary) and React Leaflet
- **Authentication**: Auth0
- **Monitoring**: Sentry for error tracking

### Key Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── actions/           # Server actions for CRUD operations
│   ├── api/               # API route handlers
│   └── itineraries/       # Itinerary-related pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── common/           # Shared components (Maps, ThemeProvider)
│   ├── itinerary/        # Itinerary-specific components
│   ├── layout/           # Layout components (Header, Footer)
│   └── ui/               # shadcn/ui components
├── data/                 # Data layer
│   ├── schemas/          # Zod validation schemas
│   ├── store/            # Jotai atoms
│   └── validators/       # Form validators
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions and configurations
```

### Data Models

The application uses Zod schemas for type-safe data validation:

- **Itinerary**: Main travel plan with multiple day plans
- **DayPlan**: Activities for a specific day
- **Activity**: Individual activity with location, time, and notes
- **Place**: Location data with coordinates and address
- **Transportation**: Travel method between activities

Key schemas are defined in `src/data/schemas/` with separate client/server variants to handle MongoDB ObjectId conversion.

### State Management

- **Jotai**: Used for form state and itinerary metadata (`src/data/store/itineraryAtoms.ts`)
- **React Hook Form**: Form state management with Zod validation
- Server state is managed through Next.js server actions

### Authentication & Authorization

- Auth0 integration for user authentication
- User context provided by `@auth0/nextjs-auth0/client`
- Protected routes and API endpoints check authentication status

### Maps Integration

- **Primary**: Mapbox GL for interactive maps
- **Fallback**: React Leaflet for simpler map requirements
- Maps display daily routes and individual activity locations
- Coordinate data can be imported from Google Maps URLs or direct coordinates

### Environment Variables

Required environment variables (see README.md for full details):
- `MONGODB_URI`: Database connection string
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`: Mapbox API token
- Auth0 configuration variables (AUTH0_*)
- Optional: Sentry DSN, AdSense client ID

### Build Configuration

- ESLint errors are ignored during builds (`next.config.mjs`)
- Sentry integration for error tracking and performance monitoring
- TypeScript with strict mode enabled

## Development Notes

- The app uses force-dynamic rendering for real-time data
- Database initialization script available via `npm run init-db`
- Comprehensive error boundaries and toast notifications
- Responsive design with mobile-first approach
- Japanese language support (locale: ja_JP)