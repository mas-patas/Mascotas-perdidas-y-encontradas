export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  paragraph?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerData {
  imageUrl: string;
  title?: string;
  paragraph?: string;
  order?: number;
}

export interface UpdateBannerData {
  imageUrl?: string;
  title?: string;
  paragraph?: string;
  order?: number;
  isActive?: boolean;
}



