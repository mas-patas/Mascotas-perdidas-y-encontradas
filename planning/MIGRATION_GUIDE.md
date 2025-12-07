# Migration Guide: Feature-Driven Architecture

## Overview
This guide helps you migrate from the flat `components/` structure to a feature-driven architecture.

## Step-by-Step Migration

### Phase 1: Create Structure (✅ Done)
The folder structure has been created.

### Phase 2: Move Components

#### 2.1 Pets Feature
```bash
# Move pet-related components
mv src/components/PetCard.tsx src/features/pets/components/
mv src/components/PetList.tsx src/features/pets/components/
mv src/components/PetDetailPage.tsx src/features/pets/components/
mv src/components/AddPetModal.tsx src/features/pets/components/
mv src/components/ReportPetForm.tsx src/features/pets/components/
mv src/components/ReportAdoptionForm.tsx src/features/pets/components/
mv src/components/RenewModal.tsx src/features/pets/components/
mv src/components/StatusCheckModal.tsx src/features/pets/components/
mv src/components/PotentialMatchesModal.tsx src/features/pets/components/
mv src/components/ReunitedPetsPage.tsx src/features/pets/components/
mv src/components/FilterControls.tsx src/features/pets/components/
```

#### 2.2 Auth Feature
```bash
mv src/components/AuthPage.tsx src/features/auth/components/
mv src/components/ProfileSetupPage.tsx src/features/auth/components/
mv src/components/CompleteProfileModal.tsx src/features/auth/components/
```

#### 2.3 Profile Feature
```bash
mv src/components/ProfilePage.tsx src/features/profile/components/
mv src/components/UserPublicProfileModal.tsx src/features/profile/components/
```

#### 2.4 Admin Feature
```bash
mv src/components/AdminDashboard.tsx src/features/admin/components/
mv src/components/AdminUserDetailModal.tsx src/features/admin/components/
mv src/components/AdminBusinessPanel.tsx src/features/admin/components/
```

#### 2.5 Campaigns Feature
```bash
mv src/components/CampaignsPage.tsx src/features/campaigns/components/
mv src/components/CampaignDetailPage.tsx src/features/campaigns/components/
mv src/components/CampaignCard.tsx src/features/campaigns/components/
mv src/components/CampaignFormModal.tsx src/features/campaigns/components/
```

#### 2.6 Chat Feature
```bash
mv src/components/ChatPage.tsx src/features/chat/components/
mv src/components/MessagesPage.tsx src/features/chat/components/
```

#### 2.7 Support Feature
```bash
mv src/components/SupportPage.tsx src/features/support/components/
mv src/components/SupportTicketModal.tsx src/features/support/components/
```

#### 2.8 Reports Feature
```bash
mv src/components/ReportModal.tsx src/features/reports/components/
mv src/components/ReportDetailModal.tsx src/features/reports/components/
```

#### 2.9 Businesses Feature
```bash
mv src/components/BusinessDetailPage.tsx src/features/businesses/components/
mv src/components/BusinessManagementModal.tsx src/features/businesses/components/
```

#### 2.10 Maps Feature
```bash
mv src/components/MapPage.tsx src/features/maps/components/
mv src/components/ServicesMapPage.tsx src/features/maps/components/
```

#### 2.11 Gamification Feature
```bash
mv src/components/GamificationDashboard.tsx src/features/gamification/components/
mv src/components/GamificationBadge.tsx src/features/gamification/components/
mv src/components/GamificationBadge.test.tsx src/features/gamification/components/
```

#### 2.12 Notifications Feature
```bash
mv src/components/NotificationDropdown.tsx src/features/notifications/components/
mv src/components/NotificationPermissionBanner.tsx src/features/notifications/components/
```

#### 2.13 Shared Components
```bash
mv src/components/Layout.tsx src/shared/components/
mv src/components/Header.tsx src/shared/components/
mv src/components/Header.test.tsx src/shared/components/
mv src/components/Toast.tsx src/shared/components/
mv src/components/Toast.test.tsx src/shared/components/
mv src/components/ErrorBoundary.tsx src/shared/components/
mv src/components/LazyImage.tsx src/shared/components/
mv src/components/PullToRefresh.tsx src/shared/components/
mv src/components/ConfirmationModal.tsx src/shared/components/
mv src/components/ShareModal.tsx src/shared/components/
mv src/components/FlyerModal.tsx src/shared/components/
mv src/components/StarRating.tsx src/shared/components/
mv src/components/StarRating.test.tsx src/shared/components/
mv src/components/BreedBadges.tsx src/shared/components/
mv src/components/ContactRequestersModal.tsx src/shared/components/
mv src/components/OwnedPetDetailModal.tsx src/shared/components/
mv src/components/icons.tsx src/shared/components/
```

#### 2.14 Pages
```bash
mv src/components/AboutPage.tsx src/pages/
mv src/components/TipsPage.tsx src/pages/
mv src/components/TermsPage.tsx src/pages/
mv src/components/OnboardingTour.tsx src/shared/components/  # Or create onboarding feature
```

### Phase 3: Update Imports

#### 3.1 Update Component Imports
After moving files, update imports in:
- `App.tsx`
- Other components that import these
- Test files

#### 3.2 Example Import Updates

**Before:**
```typescript
import { PetCard } from './components/PetCard';
import { Layout } from './components/Layout';
```

**After:**
```typescript
import { PetCard } from '@/features/pets';
import { Layout } from '@/shared';
```

Or using relative paths:
```typescript
import { PetCard } from './features/pets';
import { Layout } from './shared';
```

### Phase 4: Update Path Aliases (Optional but Recommended)

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/features/*": ["./src/features/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/api/*": ["./src/api/*"],
      "@/pages/*": ["./src/pages/*"]
    }
  }
}
```

And update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/api': path.resolve(__dirname, './src/api'),
      '@/pages': path.resolve(__dirname, './src/pages'),
    },
  },
});
```

### Phase 5: Move Feature-Specific Hooks

Move hooks to their respective features:
```bash
mv src/hooks/usePetFilters.ts src/features/pets/hooks/
```

### Phase 6: Testing

1. Run your test suite
2. Check for broken imports
3. Test each feature independently
4. Verify routing still works

## Benefits After Migration

1. **Clear Feature Boundaries**: Each feature is self-contained
2. **Easier Navigation**: Find related code quickly
3. **Better Scalability**: Add new features without cluttering
4. **Team Collaboration**: Multiple devs can work on different features
5. **Code Reusability**: Shared components are clearly identified

## Tips

- Migrate one feature at a time
- Test after each migration
- Use find/replace for import updates
- Keep the old `components/` folder until migration is complete
- Update documentation as you go
