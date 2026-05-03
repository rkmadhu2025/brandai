export interface User {
  id: number;
  name: string;
  email: string;
  bio: string;
  skills: string;
  experience: string;
  education: string;
  career_goals: string;
  target_role: string;
  industry?: string;
  job_preferences?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  portfolio_url?: string;
  is_onboarded?: boolean;
}

export interface Post {
  id: number;
  content: string;
  platform: string;
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduled_at: string | null;
  recurrence_pattern: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  recurrence_end_date: string | null;
  is_recurring_instance?: boolean;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  watch_time?: number;
  audience_retention?: number;
  click_through_rate?: number;
  transcription?: string;
  video_style?: string;
  video_length?: string;
  video_aspect_ratio?: string;
  video_resolution?: string;
  has_conflict?: boolean;
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
  job_type?: string;
  experience_level?: string;
  created_at: string;
}

export interface JobEvent {
  id: number;
  job_id?: number;
  title: string;
  type: 'deadline' | 'interview' | 'follow-up' | 'other';
  date: string;
  notes?: string;
  recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  is_recurring_instance?: boolean;
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

export interface Channel {
  id: number;
  user_id: number;
  platform: string;
  handle: string;
  name: string;
  avatar_url: string;
  is_connected: boolean;
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
