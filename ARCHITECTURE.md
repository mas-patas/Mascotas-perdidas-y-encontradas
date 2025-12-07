# Feature-Driven Architecture

## Overview
This project uses a **feature-driven architecture** to organize code by business domain rather than by file type. This makes the codebase more scalable and maintainable.

## Folder Structure

```
src/
├── features/              # Feature modules (business logic)
│   ├── auth/             # Authentication & user setup
│   ├── pets/             # Pet management
│   ├── profile/          # User profiles
│   ├── admin/            # Admin dashboard
│   ├── campaigns/         # Campaign management
│   ├── chat/              # Messaging system
│   ├── support/           # Support tickets
│   ├── reports/           # Reporting system
│   ├── businesses/        # Business listings
│   ├── maps/              # Map views
│   ├── gamification/      # Points & badges
│   └── notifications/     # Notifications
│
├── shared/                # Shared/common components
│   ├── components/        # Reusable UI components
│   └── ui/                # UI primitives (future)
│
├── pages/                 # Top-level page components
├── api/                   # API layer (React Query)
├── contexts/              # React contexts
├── hooks/                 # Global hooks
├── services/              # Business services
├── utils/                 # Utility functions
├── types.ts               # TypeScript types
└── constants.ts           # Constants
```

## Feature Structure

Each feature follows this structure:

```
features/
└── [feature-name]/
    ├── components/        # Feature-specific components
    ├── hooks/            # Feature-specific hooks (optional)
    ├── utils/            # Feature-specific utilities (optional)
    └── index.ts          # Public API exports
```

## Import Patterns

### Using Path Aliases (Recommended)

```typescript
// Feature imports
import { PetCard, PetList } from '@/features/pets';
import { AuthPage } from '@/features/auth';
import { AdminDashboard } from '@/features/admin';

// Shared components
import { Layout, Header } from '@/shared';
import { Toast } from '@/shared';

// API
import { usePets, useUsers } from '@/api';

// Pages
import { AboutPage } from '@/pages';
```

### Using Relative Paths

```typescript
import { PetCard } from '../features/pets';
import { Layout } from '../shared';
```

## Principles

1. **Feature Isolation**: Each feature is self-contained
2. **Clear Boundaries**: Features don't directly import from other features
3. **Shared Code**: Common code goes in `shared/`
4. **Public API**: Each feature exports only what's needed via `index.ts`
5. **Scalability**: Easy to add new features without affecting existing ones

## Benefits

✅ **Scalability**: Add features without cluttering  
✅ **Maintainability**: Related code grouped together  
✅ **Team Collaboration**: Multiple devs can work on different features  
✅ **Clear Boundaries**: Easy to understand what belongs where  
✅ **Reusability**: Shared components clearly identified  

## Migration Status

- ✅ Folder structure created
- ✅ Index files created
- ✅ Path aliases configured
- ⏳ Component migration (use MIGRATION_GUIDE.md)
- ⏳ Import updates
- ⏳ Testing

## Next Steps

1. Follow `MIGRATION_GUIDE.md` to move components
2. Update imports in `App.tsx` and other files
3. Test each feature after migration
4. Remove old `components/` folder when complete
