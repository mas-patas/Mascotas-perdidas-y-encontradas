export const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (filters: string) => [...bannerKeys.lists(), { filters }] as const,
  details: () => [...bannerKeys.all, 'detail'] as const,
  detail: (id: string) => [...bannerKeys.details(), id] as const,
  active: () => [...bannerKeys.all, 'active'] as const,
};



