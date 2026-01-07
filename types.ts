
export interface Song {
  id: string;
  title: string;
  movie: string;
  artist: string;
  musicDirector: string;
  year: number;
  category: 'Melody' | 'Mass' | 'Love' | 'Folk' | 'Devotional';
  image: string;
  audioUrl: string;
  duration: string;
  section: 'Latest' | 'Trending' | 'Classic' | 'MovieWise';
}

export type Category = Song['category'] | 'All';
export type Section = Song['section'] | 'All';
