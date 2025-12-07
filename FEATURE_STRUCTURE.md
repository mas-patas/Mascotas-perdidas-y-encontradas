# Feature-Driven Architecture Structure

## Proposed Folder Structure

```
src/
├── features/                    # Feature modules (business logic)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── ProfileSetupPage.tsx
│   │   │   └── CompleteProfileModal.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts (if feature-specific)
│   │   └── index.ts
│   │
│   ├── pets/
│   │   ├── components/
│   │   │   ├── PetCard.tsx
│   │   │   ├── PetList.tsx
│   │   │   ├── PetDetailPage.tsx
│   │   │   ├── AddPetModal.tsx
│   │   │   ├── ReportPetForm.tsx
│   │   │   ├── ReportAdoptionForm.tsx
│   │   │   ├── RenewModal.tsx
│   │   │   ├── StatusCheckModal.tsx
│   │   │   ├── PotentialMatchesModal.tsx
│   │   │   ├── ReunitedPetsPage.tsx
│   │   │   └── FilterControls.tsx
│   │   ├── hooks/
│   │   │   └── usePetFilters.ts
│   │   └── index.ts
│   │
│   ├── profile/
│   │   ├── components/
│   │   │   ├── ProfilePage.tsx
│   │   │   └── UserPublicProfileModal.tsx
│   │   └── index.ts
│   │
│   ├── admin/
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminUserDetailModal.tsx
│   │   │   └── AdminBusinessPanel.tsx
│   │   └── index.ts
│   │
│   ├── campaigns/
│   │   ├── components/
│   │   │   ├── CampaignsPage.tsx
│   │   │   ├── CampaignDetailPage.tsx
│   │   │   ├── CampaignCard.tsx
│   │   │   └── CampaignFormModal.tsx
│   │   └── index.ts
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatPage.tsx
│   │   │   └── MessagesPage.tsx
│   │   └── index.ts
│   │
│   ├── support/
│   │   ├── components/
│   │   │   ├── SupportPage.tsx
│   │   │   └── SupportTicketModal.tsx
│   │   └── index.ts
│   │
│   ├── reports/
│   │   ├── components/
│   │   │   ├── ReportModal.tsx
│   │   │   └── ReportDetailModal.tsx
│   │   └── index.ts
│   │
│   ├── businesses/
│   │   ├── components/
│   │   │   ├── BusinessDetailPage.tsx
│   │   │   └── BusinessManagementModal.tsx
│   │   └── index.ts
│   │
│   ├── maps/
│   │   ├── components/
│   │   │   ├── MapPage.tsx
│   │   │   └── ServicesMapPage.tsx
│   │   └── index.ts
│   │
│   ├── gamification/
│   │   ├── components/
│   │   │   ├── GamificationDashboard.tsx
│   │   │   └── GamificationBadge.tsx
│   │   └── index.ts
│   │
│   └── notifications/
│       ├── components/
│       │   ├── NotificationDropdown.tsx
│       │   └── NotificationPermissionBanner.tsx
│       └── index.ts
│
├── shared/                      # Shared/common components
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Header.tsx
│   │   ├── Toast.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LazyImage.tsx
│   │   ├── PullToRefresh.tsx
│   │   ├── ConfirmationModal.tsx
│   │   ├── ShareModal.tsx
│   │   ├── FlyerModal.tsx
│   │   ├── StarRating.tsx
│   │   ├── BreedBadges.tsx
│   │   ├── ContactRequestersModal.tsx
│   │   ├── OwnedPetDetailModal.tsx
│   │   └── icons.tsx
│   ├── ui/                      # Reusable UI primitives
│   │   └── (future button, input, etc.)
│   └── index.ts
│
├── pages/                       # Top-level page components (if needed)
│   ├── AboutPage.tsx
│   ├── TipsPage.tsx
│   └── TermsPage.tsx
│
├── api/                         # Already structured ✅
├── contexts/                    # Global contexts
├── hooks/                       # Global/shared hooks
├── services/                    # Business services
├── utils/                       # Utility functions
├── types.ts                      # Global types
├── constants.ts                  # Constants
└── App.tsx
```

## Benefits

1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Related code is grouped together
3. **Team Collaboration**: Multiple developers can work on different features
4. **Clear Boundaries**: Each feature is self-contained
5. **Reusability**: Shared components are clearly separated

## Migration Strategy

1. Create the new folder structure
2. Move components feature by feature
3. Update imports incrementally
4. Test after each feature migration
