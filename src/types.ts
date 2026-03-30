export interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
  skills: string;
  experience: string;
  target_role: string;
  industry?: string;
  job_preferences?: string;
}

export interface Post {
  id: number;
  content: string;
  platform: string;
  image_url: string | null;
  video_url: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: string | null;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  url: string;
  created_at: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string | null;
  match_score: number;
  is_saved: boolean;
  created_at: string;
}

export interface JobEvent {
  id: number;
  job_id?: number;
  title: string;
  type: 'deadline' | 'interview' | 'follow-up' | 'other';
  date: string;
  notes?: string;
  created_at: string;
}

export interface JobApplication {
  id: number;
  user_id: number;
  company: string;
  role: string;
  application_date: string;
  status: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  notes: string | null;
  created_at: string;
}

export interface JobAlert {
  id: number;
  user_id: number;
  enabled: boolean;
  preference: 'email' | 'in-app';
  frequency: 'daily' | 'weekly' | 'instant';
  created_at: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
