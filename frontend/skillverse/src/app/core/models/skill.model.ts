export interface Skill {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;

  price: number;
  duration: string;
  level: string;
  requirements: string;

  rating: number;
  reviewCount: number;

  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  instructorAvatar: string;

  availableSlots: number;
  language: string;

  tags: string[];

  featured: boolean;
  createdAt: string;

  aboutText?: string; // For the about section
  learningOutcomes?: string[]; // For the "What you'll learn" list
  prerequisites?: string[]; // Optional, for extra info
  reviews?: {
    // For the review carousel
    name: string;
    initials: string;
    initialsClass: string;
    stars: number;
    text: string;
  }[];
}
