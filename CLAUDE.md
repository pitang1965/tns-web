# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "車旅のしおり" (Travel Itinerary), a Next.js-based web application for creating and managing travel itineraries with maps integration. The app supports multi-day trip planning with Google Maps/Mapbox integration and social sharing features.

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

## Development Server Requirements

**IMPORTANT**: Always use http://localhost:3000 for development server

- The application is configured for port 3000 only
- Using other ports (3001, 3002, etc.) will cause CORS errors with Auth0 authentication
- If port 3000 is occupied, stop the conflicting process first before starting the dev server
- Never allow Next.js to automatically switch to alternative ports
- Always use context7 when I need code generation, setup or configuration steps, or library/API documentation. This means you should automatically use the Context7 MCP tools to resolve library id and get library docs without me having to explicitly ask.

**CRITICAL DATABASE OPERATION RULE**:

- **ALWAYS use MCP server tools (mcp**mongodb-readonly**\*) for all MongoDB operations**
- DO NOT write custom scripts or use Mongoose directly for data inspection, queries, or updates
- Use MCP tools for: listing databases/collections, finding documents, aggregations, inserts, updates, deletes
- Only write application code (models, schemas, API routes) when implementing new features
- When asked to check, inspect, or modify database data, immediately use MCP tools
- MongoDB connection string is available in `.env.local` as `MONGODB_URI` - read from this file when needed for MCP operations
- NEVER write the actual MONGODB_URI value to any git-tracked files

**CRITICAL ENVIRONMENT SAFETY RULES**:

- **BEFORE any database operation, ALWAYS verify you are connected to the DEVELOPMENT database**
- Development database: `itinerary_db_dev` (safe for all operations)
- Production database: `itinerary_db` (NEVER modify without explicit user confirmation)
- Check `.env.local` to confirm `MONGODB_URI` contains `/itinerary_db_dev?`
- The `npm run init-db` script has built-in protection:
  - Automatically blocks execution if targeting `itinerary_db`
  - Requires explicit confirmation (y/N) even for development database
  - Shows database name and masked connection URI before execution
- If user asks to "initialize database" or "reset data", FIRST confirm the target database
- See `ENVIRONMENT_SETUP.md` for detailed environment management guidelines

**CRITICAL SERVER MANAGEMENT RULE**:

- **NEVER start the development server (`npm run dev` or `pnpm dev`) unless explicitly requested by the user**
- The user will start and manage the development server themselves
- If you need to check if the server is running, you may use `netstat -ano | findstr :3000` to check port status
- If the user asks you to stop the server, you may kill the process using `taskkill //F //PID [PID]`
- Do NOT automatically start the server for testing, debugging, or any other purpose
- If you need the server running for a task, ask the user to start it first

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
- Auth0 configuration variables (AUTH0\_\*)
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

## TypeScript Guidelines

### Type Definitions

**IMPORTANT: Always use `type` instead of `interface` for new type definitions**

This project follows modern TypeScript best practices by preferring `type` over `interface` for consistency and flexibility.

**Use `type` for:**
- ✅ Component Props
- ✅ Function parameters and return types
- ✅ Object type definitions
- ✅ Union types and intersections
- ✅ Mapped types and conditional types

**Example:**
```typescript
// ✅ Correct - Use type
type UserProfileProps = {
  name: string;
  email: string;
  onUpdate: (data: UserData) => void;
}

// ❌ Avoid - Don't use interface
interface UserProfileProps {
  name: string;
  email: string;
  onUpdate: (data: UserData) => void;
}
```

**Exceptions (when `interface` is acceptable):**
- Mongoose model definitions that extend `Document`
- React component types that extend React built-in types (e.g., `React.HTMLAttributes`)
- When declaration merging is explicitly needed (rare cases)
- Third-party library integration that requires `interface`

**Example of valid `interface` usage:**
```typescript
// ✅ Valid - Mongoose Document extension
export interface ICampingSpot extends Document {
  name: string;
  coordinates: [number, number];
}

// ✅ Valid - React type extension
interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  customProp: string;
}
```

**Why `type` over `interface`:**
1. **Consistency**: Using `type` throughout the codebase reduces cognitive load
2. **Flexibility**: `type` supports union types, intersections, and mapped types
3. **Modern Practice**: TypeScript community increasingly prefers `type` for general use
4. **Clarity**: The `= {` syntax makes it clear you're defining a type alias

### UI Component Guidelines

**shadcn/ui Components:**

- All shadcn/ui components must be placed in `src/components/ui/` directory
- When adding new shadcn/ui components, use: `npx shadcn@latest add [component-name]`

**CRITICAL - Post-Installation Verification Steps:**

After running `npx shadcn@latest add [component-name]`, ALWAYS perform these checks:

1. **Verify Installation Location:**
   ```bash
   # Check if file was installed in the wrong location
   find . -name "*[component-name]*" -type f 2>/dev/null
   ```
   - ✅ Correct: `./src/components/ui/[component-name].tsx`
   - ❌ Wrong: `./@/components/ui/[component-name].tsx` or any other location

2. **Move if Necessary:**
   ```bash
   # If installed in wrong location, move it
   mv "./@/components/ui/[component-name].tsx" "src/components/ui/[component-name].tsx"
   # Clean up incorrect directory
   rm -rf "./@"
   ```

3. **Fix Import Paths:**
   - This project uses `@/lib/utils` for the cn() utility function
   - shadcn/ui CLI often generates files with `@/utils` imports, which is INCORRECT
   - Check and fix in newly created/updated files:
     - ❌ Wrong: `import { cn } from "@/utils"`
     - ✅ Correct: `import { cn } from "@/lib/utils"`

4. **Verify with TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
   - This will catch any import path errors or type issues

**Common Issue:**
The shadcn CLI sometimes creates files in `./@/components/ui/` instead of `src/components/ui/`. Always check and correct the installation location immediately after running the add command.

## Git Commit Guidelines

**Commit Message Format:**

Use Japanese for commit messages with appropriate emoji prefixes:

```
🐛 簡潔なタイトル(50文字以内)

- 変更点1の説明
- 変更点2の説明
- 変更点3の説明

修正内容:
- 修正した具体的な問題1
- 修正した具体的な問題2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Common Emoji Prefixes:**
- 🐛 バグ修正 (Bug fix)
- ✨ 新機能 (New feature)
- 🔒 セキュリティ (Security)
- ⬆️ 依存関係の更新 (Dependency updates)
- 🔀 マージ (Merge)
- 🥅 エラー処理の改善 (Error handling)
- 🎨 スタイル・UI改善 (Style/UI improvements)
- ♻️ リファクタリング (Refactoring)
- 📝 ドキュメント (Documentation)
- 🚀 パフォーマンス改善 (Performance)

**Example Commit Message:**

```
🐛 Hydrationエラー、NaNバリデーション、マップマーカー番号を修正

- ActivityControlsのネストしたボタン要素によるhydrationエラーを修正
- locationSchemaにNaN値のバリデーションを追加し、無効な座標の送信を防止
- useMapboxフックに座標の有効性チェックを追加してMapbox初期化エラーを防止
- マップマーカーの番号をフィルタ後のインデックスではなく元のインデックスを使用するように修正
  - DayPlanForm: filter→mapをmap→filterに変更して元のインデックスを保持
  - DayPlanView: 一貫性のため同じ修正を適用
- DayPlanFormのuseMemo依存配列を最適化して不要な再レンダリングを回避

修正内容:
- Mapbox初期化時の "Invalid LngLat object: (NaN, NaN)" エラー
- フォーム送信時の "Expected string, received nan" バリデーションエラー
- ネストしたbutton要素によるReact hydration警告
- 序盤のアクティビティに座標がない場合にマーカーが誤った番号(2-3ではなく1-2)を表示する問題

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
