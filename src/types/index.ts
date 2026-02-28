export interface Business {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  neighborhood: string;
  image: string;
  isOpen: boolean;
  distance?: string;
  address: string;
  phone: string;
  hours: string;
  description: string;
  amenities: string[];
  photos: string[];
}

export interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: string;
  text: string;
  useful: number;
  funny: number;
  cool: number;
  photos?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
