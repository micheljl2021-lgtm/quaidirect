# GitHub Copilot Instructions for QuaiDirect

## Project Overview

QuaiDirect is a web application that enables artisanal fishermen to sell their catch directly at the docks, eliminating intermediaries. The platform uses React 18, TypeScript, Vite, Tailwind CSS, and Supabase as the backend.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Payments**: Stripe
- **Maps**: Google Maps API
- **Email**: Resend
- **Testing**: Vitest, React Testing Library, MSW
- **Linting**: ESLint with TypeScript support

## Code Style & Conventions

### TypeScript
- Use TypeScript for all new code files
- Prefer explicit type definitions over `any`
- Use interfaces for object shapes and types for unions/primitives
- Follow existing naming conventions:
  - PascalCase for components and types
  - camelCase for functions and variables
  - UPPER_SNAKE_CASE for constants

### React Components
- Use functional components with hooks
- Prefer named exports for components
- Use `@/` alias for imports from `src/` directory
- Follow the existing component structure in `src/components/`

### File Organization
```
src/
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   ├── admin/           # Admin dashboard components
│   ├── arrivage-wizard/ # Arrival creation wizard
│   └── onboarding/      # Fisherman onboarding steps
├── pages/               # Application pages
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helper functions
├── integrations/        # API integrations (Supabase)
└── types/               # TypeScript type definitions
```

## Development Workflow

### Before Making Changes
1. Run existing tests to understand baseline: `npm test`
2. Run linter to check code style: `npm run lint`
3. Run the dev server to verify functionality: `npm run dev`

### Making Changes
1. Keep changes minimal and focused on the specific issue
2. Follow existing patterns in the codebase
3. Maintain consistency with the project's architecture
4. Update tests when modifying behavior

### Testing
- **Test Framework**: Vitest with React Testing Library
- **Test Location**: All tests are in the `tests/` directory
- **Run Tests**: `npx vitest`
- **Test Coverage**: `npx vitest --coverage`
- Use MSW (Mock Service Worker) for mocking API calls
- Follow existing test patterns in `tests/` directory

### Building
- **Development Build**: `npm run build:dev`
- **Production Build**: `npm run build`
- Verify builds succeed before committing changes

## Supabase Integration

### Key Concepts
- All database operations use Supabase client from `@/integrations/supabase/client`
- Row Level Security (RLS) is enabled on all sensitive tables
- Edge Functions are located in `supabase/functions/`
- Use Supabase Auth for authentication

### Common Patterns
```typescript
import { supabase } from "@/integrations/supabase/client";

// Queries
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

// Mutations
const { error } = await supabase
  .from('table_name')
  .insert({ /* data */ });
```

## UI Components

### shadcn/ui
- UI components are in `src/components/ui/`
- Follow shadcn/ui patterns for component usage
- Use Radix UI primitives when available
- Apply Tailwind classes using `cn()` utility from `@/lib/utils`

### Styling
- Use Tailwind CSS utility classes
- Follow responsive design patterns: `sm:`, `md:`, `lg:`, `xl:`
- Use design tokens defined in `tailwind.config.ts`
- Avoid inline styles; use Tailwind classes

## State Management

- Use React Query (`@tanstack/react-query`) for server state
- Use React hooks (`useState`, `useReducer`) for local state
- Custom hooks are in `src/hooks/`
- Follow existing patterns for data fetching and caching

## Error Handling

- Use try-catch blocks for async operations
- Display user-friendly error messages using toast notifications (`sonner`)
- Log errors appropriately (Sentry is integrated)
- Always handle loading and error states in UI components

## Security Best Practices

- Never commit sensitive data (API keys, secrets) to the repository
- Use environment variables for configuration (`.env`)
- Validate user input on both client and server side
- Follow RLS policies when working with Supabase
- Use Zod for schema validation

## Important Notes

### Payment Flow
- Fisherman subscriptions use Stripe with 30-day trial
- Webhook endpoint: `stripe-webhook` Edge Function
- Test mode: use Stripe test keys and test cards

### PWA
- Service worker is located in `public/sw.js`
- Cache versioning is automatic via build process
- See `SERVICE_WORKER_CACHE_VERSIONING.md` for details

### Environment Variables
- Required variables are documented in `.env.example`
- Frontend vars: prefix with `VITE_`
- Backend vars: configured in Supabase Dashboard

## Common Tasks

### Adding a New Component
1. Create component file in appropriate `src/components/` subdirectory
2. Use TypeScript with proper prop types
3. Follow existing naming and export conventions
4. Add corresponding test in `tests/components/`

### Adding a New Page
1. Create page file in `src/pages/`
2. Add route in `src/App.tsx`
3. Ensure proper authentication checks if needed
4. Add test in `tests/pages/`

### Modifying Database Schema
1. Update schema in Supabase Dashboard or via migrations
2. Update TypeScript types if needed
3. Update RLS policies for security
4. Test changes thoroughly

### Adding Dependencies
1. Use `npm install` to add dependencies
2. Check for security vulnerabilities with `npm audit`
3. Fix vulnerabilities with `npm audit fix` if available
4. Update documentation if it affects setup

## Resources

- [Project README](../README.md)
- [Audit Documents](../AUDIT_PARTIE_1_FRONTEND.md)
- [Critical Corrections](../CORRECTIONS_CRITIQUES_EFFECTUEES.md)
- [Workflow Optimization](../WORKFLOW_OPTIMAL_GPT_LOVABLE_GITHUB.md)
