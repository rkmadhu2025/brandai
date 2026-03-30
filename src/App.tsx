import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  Briefcase, 
  FolderKanban, 
  BarChart3, 
  Settings, 
  Plus, 
  Send, 
  Calendar, 
  Search,
  Zap,
  CheckCircle2,
  ExternalLink,
  Github,
  Linkedin,
  Twitter,
  User as UserIcon,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Save,
  Edit3,
  X,
  Clock,
  Heart,
  Image as ImageIcon,
  Trash2,
  SlidersHorizontal,
  Check,
  Share2,
  Building2,
  MapPin,
  Copy,
  Upload,
  Youtube,
  Filter,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';
import { Post, Project, Job, User, JobEvent, JobApplication } from './types';
import { generateSocialPost, optimizeProfile, rewriteContent, generateArticle, generateProfileSummary, generateImage, suggestJobs, suggestContentIdeas, generateVideo, analyzeJobDescription } from './services/geminiService';
import CalendarView from './components/CalendarView';
import { PlatformIcon } from './components/PlatformIcon';

// Removed getPlatformIcon helper function

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studioInitialDraft, setStudioInitialDraft] = useState('');
  const [studioInitialPlatform, setStudioInitialPlatform] = useState('linkedin');
  const [studioInitialDate, setStudioInitialDate] = useState<Date | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobEvents, setJobEvents] = useState<JobEvent[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [u, p, pr, j, je, ja, fg] = await Promise.all([
        fetch('/api/user').then(res => res.json()),
        fetch('/api/posts').then(res => res.json()),
        fetch('/api/projects').then(res => res.json()),
        fetch('/api/jobs').then(res => res.json()),
        fetch('/api/job-events').then(res => res.json()),
        fetch('/api/job-applications').then(res => res.json()),
        fetch('/api/analytics/follower-growth').then(res => res.json())
      ]);
      setUser(u);
      setPosts(p);
      setProjects(pr);
      setJobs(j);
      setJobEvents(je);
      setJobApplications(ja);
      setFollowerGrowth(fg);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView user={user} posts={posts} projects={projects} jobs={jobs} />;
      case 'profile': return <OptimizerView user={user} onUpdate={fetchData} />;
      case 'studio': return <StudioView onPostCreated={fetchData} user={user} posts={posts} initialDraft={studioInitialDraft} initialPlatform={studioInitialPlatform} initialDate={studioInitialDate} />;
      case 'ideas': return <ContentIdeasView user={user} onUseIdea={(draft, platform) => { 
        setStudioInitialDraft(draft);
        setStudioInitialPlatform(platform);
        setActiveTab('studio'); 
      }} />;
      case 'calendar': return <CalendarView posts={posts} onPostUpdated={fetchData} onSchedulePost={(date) => {
        setStudioInitialDate(date);
        setStudioInitialDraft('');
        setStudioInitialPlatform('linkedin');
        setActiveTab('studio');
      }} />;
      case 'projects': return <ProjectsView projects={projects} onProjectAdded={fetchData} />;
      case 'jobs': return <JobsView user={user} jobs={jobs} jobEvents={jobEvents} posts={posts} onSearch={fetchData} onEventsChange={fetchData} onAddToTracker={async (job) => {
        await fetch('/api/job-applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: job.company,
            role: job.title,
            application_date: format(new Date(), 'yyyy-MM-dd'),
            status: 'Applied',
            notes: `Added from Job Finder. Match score: ${job.match_score}%`
          })
        });
        fetchData();
        setActiveTab('job-tracker');
      }} />;
      case 'job-tracker': return <JobTrackerView applications={jobApplications} onUpdate={fetchData} />;
      case 'analytics': return <AnalyticsView posts={posts} followerGrowth={followerGrowth} jobApplications={jobApplications} />;
      default: return <DashboardView user={user} posts={posts} projects={projects} jobs={jobs} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 bg-white flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">BrandAI</span>
          </div>
          
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<PenTool size={20} />} label="Content Studio" active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} />
            <NavItem icon={<Sparkles size={20} />} label="AI Ideas" active={activeTab === 'ideas'} onClick={() => setActiveTab('ideas')} />
            <NavItem icon={<Calendar size={20} />} label="Content Calendar" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
            <NavItem icon={<Sparkles size={20} />} label="Profile Optimizer" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            <NavItem icon={<FolderKanban size={20} />} label="Projects" active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
            <NavItem icon={<Briefcase size={20} />} label="Job Finder" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
            <NavItem icon={<FileText size={20} />} label="Job Tracker" active={activeTab === 'job-tracker'} onClick={() => setActiveTab('job-tracker')} />
            <NavItem icon={<BarChart3 size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <UserIcon className="text-slate-500" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Loading...'}</p>
              <p className="text-xs text-slate-500 truncate">Pro Plan</p>
            </div>
            <Settings size={16} className="text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
            <Zap className="text-white w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">BrandAI</span>
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
          <UserIcon className="text-slate-500" size={16} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <header className="hidden md:flex h-16 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 items-center justify-between px-8">
          <h2 className="font-display font-semibold text-lg capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4">
            <button className="btn-secondary flex items-center gap-2 text-sm">
              <Plus size={16} /> New Project
            </button>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <PenTool size={16} /> Create Post
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <div className="md:hidden mb-6">
            <h2 className="font-display font-bold text-2xl capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-50">
        <MobileNavItem icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <MobileNavItem icon={<PenTool size={20} />} label="Studio" active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} />
        <MobileNavItem icon={<Sparkles size={20} />} label="Ideas" active={activeTab === 'ideas'} onClick={() => setActiveTab('ideas')} />
        <MobileNavItem icon={<Calendar size={20} />} label="Calendar" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
        <MobileNavItem icon={<Briefcase size={20} />} label="Jobs" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
      </nav>
    </div>
  );
}

function MobileNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-1 transition-all ${
        active ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
        active ? 'nav-item-active' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function DashboardView({ user, posts, projects, jobs }: { user: User | null, posts: Post[], projects: Project[], jobs: Job[] }) {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="glass-card p-6 md:p-8 bg-indigo-600 text-white border-none overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-indigo-100 max-w-xl text-sm md:text-base">Your personal brand is growing. You have {posts.filter(p => p.status === 'scheduled').length} posts scheduled and {jobs.length} job matches waiting for you.</p>
          <div className="mt-6 flex gap-3 md:gap-4">
            <div className="bg-white/20 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-lg border border-white/10">
              <p className="text-[10px] md:text-xs text-indigo-200 uppercase tracking-wider font-semibold">Weekly Reach</p>
              <p className="text-lg md:text-xl font-bold">+12.4%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-2 md:px-4 md:py-2 rounded-lg border border-white/10">
              <p className="text-[10px] md:text-xs text-indigo-200 uppercase tracking-wider font-semibold">New Followers</p>
              <p className="text-lg md:text-xl font-bold">142</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg">Recent Activity</h3>
            <button className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {posts.slice(0, 3).map(post => (
              <div key={post.id} className="glass-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <PlatformIcon platform={post.platform} size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{post.platform}</span>
                      {post.scheduled_at && (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold uppercase">
                          <Clock size={10} /> {format(new Date(post.scheduled_at.replace(' ', 'T')), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                  {post.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-100 max-w-xs">
                      <img src={post.image_url} alt="Post visual" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  {post.video_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-100 max-w-xs">
                      <video src={post.video_url} controls className="w-full h-auto object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-slate-500 text-sm italic">No posts yet. Start creating in the Studio!</p>}
          </div>
        </div>

        {/* Job Matches */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg">Top Job Matches</h3>
          <div className="space-y-3">
            {jobs.slice(0, 4).map(job => (
              <div key={job.id} className="glass-card p-4 hover:border-indigo-300 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                    <Briefcase size={16} className="text-slate-600" />
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {job.match_score}% Match
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate">{job.title}</h4>
                <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
              </div>
            ))}
            {jobs.length === 0 && <p className="text-slate-500 text-sm italic">No matches yet. Run a search!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudioView({ onPostCreated, user, posts, initialDraft = '', initialPlatform = 'linkedin', initialDate }: { onPostCreated: () => void, user: User | null, posts: Post[], initialDraft?: string, initialPlatform?: string, initialDate?: Date }) {
  const [mode, setMode] = useState<'generate' | 'rewrite'>('generate');
  const [contentType, setContentType] = useState<'social' | 'article' | 'summary' | 'shorts'>('social');
  const [topic, setTopic] = useState(initialDraft);
  const [platform, setPlatform] = useState(initialPlatform);
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [includeKeywords, setIncludeKeywords] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [cta, setCta] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');

  useEffect(() => {
    if (initialDraft) setTopic(initialDraft);
    if (initialPlatform) {
      setPlatform(initialPlatform);
      if (initialPlatform === 'youtube-shorts') setContentType('shorts');
      else if (initialPlatform === 'blog') setContentType('article');
      else setContentType('social');
    }
    if (initialDate) {
      setScheduledDate(initialDate);
      setIsScheduling(true);
    }
  }, [initialDraft, initialPlatform, initialDate]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledHour, setScheduledHour] = useState('12');
  const [scheduledMinute, setScheduledMinute] = useState('00');
  const [scheduledAmPm, setScheduledAmPm] = useState('PM');
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [sharePostId, setSharePostId] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    core: true,
    advanced: false
  });

  const toggleSection = (section: 'core' | 'advanced') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    try {
      await navigator.clipboard.writeText(generatedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleProcess = async () => {
    if (!topic && contentType !== 'summary') return;
    setIsProcessing(true);
    let content = '';
    
    if (mode === 'rewrite') {
      content = await rewriteContent(topic, platform, tone, length, includeKeywords, excludeKeywords, cta, targetAudience);
    } else {
      if (contentType === 'social') {
        content = await generateSocialPost(topic, platform, tone, length, includeKeywords, excludeKeywords, cta, targetAudience);
      } else if (contentType === 'shorts') {
        content = await generateSocialPost(topic, 'youtube-shorts', tone, length, includeKeywords, excludeKeywords, cta, targetAudience);
      } else if (contentType === 'article') {
        content = await generateArticle(topic, tone, length, includeKeywords, excludeKeywords, cta, targetAudience);
      } else if (contentType === 'summary') {
        content = await generateProfileSummary(user?.experience || topic, user?.skills || '', tone, length, includeKeywords, excludeKeywords, cta, targetAudience);
      }
    }
    
    setGeneratedContent(content);
    setIsProcessing(false);
  };

  const handleGenerateImage = async () => {
    if (!topic && !generatedContent) return;
    setIsGeneratingImage(true);
    const prompt = generatedContent || topic;
    const imageUrl = await generateImage(prompt);
    setGeneratedImage(imageUrl);
    setIsGeneratingImage(false);
  };

  const handleGenerateVideo = async () => {
    if (!topic && !generatedContent) return;

    // Check for API key selection for Veo models
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        if (typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
          // After opening the dialog, we assume the user will select a key and proceed
        } else {
          alert("Please select a Gemini API key in the settings to use video generation.");
          return;
        }
      }
    }

    setIsGeneratingVideo(true);
    try {
      const prompt = generatedContent || topic;
      const videoUrl = await generateVideo(prompt);
      setGeneratedVideo(videoUrl);
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        // Reset key selection state and prompt again if needed
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
        }
      } else {
        alert("Failed to generate video. Please ensure you have a valid paid Gemini API key selected.");
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedImage(reader.result as string);
        setGeneratedVideo(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedVideo(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (status: 'draft' | 'scheduled' | 'published' = 'published') => {
    if (contentType === 'summary') {
      // For summaries, we update the user profile
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, bio: generatedContent })
      });
      onPostCreated(); // Refresh user data
    } else {
      const payload: any = { 
        content: generatedContent, 
        platform: contentType === 'article' ? 'blog' : (contentType === 'shorts' ? 'youtube-shorts' : platform),
        image_url: generatedImage,
        video_url: generatedVideo,
        status: isScheduling ? 'scheduled' : status
      };

      if (isScheduling && scheduledDate) {
        let hour = parseInt(scheduledHour);
        if (scheduledAmPm === 'PM' && hour < 12) hour += 12;
        if (scheduledAmPm === 'AM' && hour === 12) hour = 0;
        const formattedDate = format(scheduledDate, 'yyyy-MM-dd');
        const formattedTime = `${hour.toString().padStart(2, '0')}:${scheduledMinute}:00`;
        payload.scheduled_at = `${formattedDate} ${formattedTime}`;
      }

      if (editingPostId) {
        await fetch(`/api/posts/${editingPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      onPostCreated();
    }
    setGeneratedContent('');
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setTopic('');
    setIncludeKeywords('');
    setExcludeKeywords('');
    setCta('');
    setTargetAudience('');
    setIsScheduling(false);
    setScheduledDate(undefined);
    setScheduledHour('12');
    setScheduledMinute('00');
    setScheduledAmPm('PM');
    setEditingPostId(null);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-6">
          <div className="glass-card p-5 md:p-6">
            <div className="flex gap-4 mb-6 p-1 bg-slate-100 rounded-xl">
            <button 
              onClick={() => setMode('generate')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'generate' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setMode('rewrite')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'rewrite' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              Rewrite
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">
              {editingPostId ? 'Edit Post' : (mode === 'generate' ? 'AI Content Generator' : 'AI Content Rewriter')}
            </h3>
            {editingPostId && (
              <button 
                onClick={() => {
                  setEditingPostId(null);
                  setGeneratedContent('');
                  setGeneratedImage(null);
                  setGeneratedVideo(null);
                  setTopic('');
                  setIsScheduling(false);
                }}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all border border-rose-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {mode === 'generate' && (
            <div className="flex flex-wrap gap-2 mb-6">
              {['social', 'shorts', 'article', 'summary'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setContentType(type as any);
                    if (type === 'shorts') setPlatform('youtube-shorts');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                    contentType === type 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {type === 'shorts' ? 'YouTube Shorts' : type.replace('social', 'Social').replace('article', 'Article').replace('summary', 'Summary')}
                </button>
              ))}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Core Settings Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleSection('core')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PenTool size={16} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Core Settings</span>
                </div>
                {expandedSections.core ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              <AnimatePresence initial={false}>
                {expandedSections.core && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-4 border-t border-slate-200"
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {mode === 'rewrite' 
                          ? "Paste your content here" 
                          : contentType === 'summary' 
                            ? "Additional context (optional)" 
                            : "What's the topic?"}
                      </label>
                      <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={
                          mode === 'rewrite' 
                            ? "Paste a blog post, project description, or rough draft..." 
                            : contentType === 'summary'
                              ? "Add specific details you want to highlight in your summary..."
                              : contentType === 'article'
                                ? "e.g. The future of AI in personal branding..."
                                : "e.g. Just finished building a new AI tool..."
                        }
                        className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {contentType === 'social' || mode === 'rewrite' ? (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                          <select 
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                          >
                            <option value="linkedin">LinkedIn</option>
                            <option value="twitter">X (Twitter)</option>
                            <option value="facebook">Facebook</option>
                            <option value="instagram">Instagram</option>
                            <option value="youtube">YouTube</option>
                            <option value="youtube-shorts">YouTube Shorts</option>
                          </select>
                        </div>
                      ) : (
                        <div className={(contentType === 'article' || contentType === 'shorts') ? "opacity-50 pointer-events-none" : ""}>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
                          <div className="w-full p-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50">
                            {contentType === 'article' ? 'Blog Post' : (contentType === 'shorts' ? 'YouTube Shorts' : 'N/A')}
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
                        <select 
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="engaging">Engaging</option>
                          <option value="educational">Educational</option>
                          <option value="witty">Witty</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Length</label>
                      <select 
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Options Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button 
                onClick={() => toggleSection('advanced')}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Refinements & Audience</span>
                </div>
                {expandedSections.advanced ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              <AnimatePresence initial={false}>
                {expandedSections.advanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-4 border-t border-slate-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Include Keywords</label>
                        <input 
                          type="text"
                          value={includeKeywords}
                          onChange={(e) => setIncludeKeywords(e.target.value)}
                          placeholder="e.g. AI, tech"
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Exclude Keywords</label>
                        <input 
                          type="text"
                          value={excludeKeywords}
                          onChange={(e) => setExcludeKeywords(e.target.value)}
                          placeholder="e.g. jargon"
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Call to Action</label>
                        <input 
                          type="text"
                          value={cta}
                          onChange={(e) => setCta(e.target.value)}
                          placeholder="e.g. Sign up for my newsletter"
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                        <input 
                          type="text"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="e.g. Tech recruiters, developers"
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  <span className="text-sm font-medium text-slate-700">Schedule Post</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isScheduling}
                    onChange={() => setIsScheduling(!isScheduling)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {isScheduling && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="space-y-4 pt-4 border-t border-slate-100"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Date</label>
                    <div className="bg-white border border-slate-200 rounded-xl p-2 flex justify-center">
                      <DayPicker 
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={{ before: new Date() }}
                        className="text-sm"
                        classNames={{
                          day_selected: "bg-indigo-600 text-white hover:bg-indigo-700",
                          day_today: "font-bold text-indigo-600"
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Time</label>
                    <div className="flex gap-2">
                      <select 
                        value={scheduledHour}
                        onChange={e => setScheduledHour(e.target.value)}
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="flex items-center font-bold text-slate-400">:</span>
                      <select 
                        value={scheduledMinute}
                        onChange={e => setScheduledMinute(e.target.value)}
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {['00', '15', '30', '45'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select 
                        value={scheduledAmPm}
                        onChange={e => setScheduledAmPm(e.target.value)}
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <button 
              onClick={handleProcess}
              disabled={isProcessing || !topic}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isProcessing ? 'Processing...' : <><Zap size={18} /> {mode === 'generate' ? 'Generate' : 'Rewrite'} with AI</>}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-5 md:p-6 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-display font-bold text-lg">Preview</h3>
              {isScheduling && scheduledDate && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                  <Clock size={10} />
                  <span>Scheduled</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { 
                  setGeneratedContent(''); 
                  setGeneratedImage(null); 
                  setGeneratedVideo(null);
                  setIncludeKeywords('');
                  setExcludeKeywords('');
                  setCta('');
                  setTargetAudience('');
                }} 
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-50 rounded-xl p-4 md:p-6 border border-slate-100 relative overflow-y-auto max-h-[600px]">
            <div className="h-full flex flex-col">
              {isScheduling && scheduledDate && (
                <div className="mb-6 p-4 bg-white border border-amber-100 rounded-2xl flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Publishing Schedule</p>
                    <p className="text-sm font-bold text-slate-800">
                      {format(scheduledDate, 'EEEE, MMMM do')}
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-indigo-600">{scheduledHour}:{scheduledMinute} {scheduledAmPm}</span>
                    </p>
                  </div>
                  <div className="hidden sm:block px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Ready to Queue</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <textarea 
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  placeholder="Write your post content here or use AI to generate it..."
                  className="w-full min-h-[150px] bg-transparent border-none outline-none text-sm text-slate-700 resize-none leading-relaxed mb-2"
                />
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleCopy}
                    disabled={!generatedContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {generatedImage && (
                <div className="relative group mb-4">
                  <img 
                    src={generatedImage} 
                    alt="Post visual" 
                    className="w-full rounded-xl border border-slate-200 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => setGeneratedImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {generatedVideo && (
                <div className="relative group mb-4">
                  <video 
                    src={generatedVideo} 
                    controls
                    className="w-full rounded-xl border border-slate-200 shadow-sm"
                  />
                  <button 
                    onClick={() => setGeneratedVideo(null)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {contentType !== 'summary' && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <button 
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || isGeneratingVideo || (!topic && !generatedContent)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:hover:text-indigo-600"
                    >
                      {isGeneratingImage ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <ImageIcon size={14} />
                      )}
                      {isGeneratingImage ? 'Generating Image...' : 'AI Image'}
                    </button>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button 
                      onClick={handleGenerateVideo}
                      disabled={isGeneratingVideo || isGeneratingImage || (!topic && !generatedContent)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-wider disabled:opacity-50 disabled:hover:text-indigo-600"
                    >
                      {isGeneratingVideo ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Video size={14} />
                      )}
                      {isGeneratingVideo ? 'Generating Video...' : 'AI Video'}
                    </button>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer">
                      <ImageIcon size={14} />
                      Upload Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer">
                      <Video size={14} />
                      Upload Video
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </label>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <button 
                      onClick={() => setIsScheduling(!isScheduling)}
                      className={`flex items-center gap-2 text-xs font-bold transition-colors uppercase tracking-wider ${isScheduling ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
                    >
                      <Calendar size={14} />
                      {isScheduling ? 'Scheduling On' : 'Schedule'}
                    </button>
                    <div className="h-4 w-px bg-slate-200"></div>
                  </div>

                  {isScheduling && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Date</label>
                          <div className="flex justify-center sm:justify-start">
                            <DayPicker 
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              disabled={{ before: new Date() }}
                              className="text-sm"
                              classNames={{
                                day_selected: "bg-indigo-600 text-white hover:bg-indigo-700",
                                day_today: "font-bold text-indigo-600"
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Time</label>
                            <div className="flex gap-2">
                              <select 
                                value={scheduledHour}
                                onChange={e => setScheduledHour(e.target.value)}
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                  <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
                                ))}
                              </select>
                              <span className="flex items-center font-bold text-slate-400">:</span>
                              <select 
                                value={scheduledMinute}
                                onChange={e => setScheduledMinute(e.target.value)}
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                {['00', '15', '30', '45'].map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <select 
                                value={scheduledAmPm}
                                onChange={e => setScheduledAmPm(e.target.value)}
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Scheduled For</p>
                            <p className="text-sm font-bold text-slate-800">
                              {scheduledDate ? format(scheduledDate, 'MMM d, yyyy') : 'No date selected'} at {scheduledHour}:{scheduledMinute} {scheduledAmPm}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {contentType === 'summary' ? (
              <button 
                onClick={() => handleSave()}
                disabled={!generatedContent}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 sm:py-2"
              >
                <Save size={18} /> Apply to Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={() => handleSave('draft')}
                  disabled={!(generatedContent || generatedImage || generatedVideo) || isScheduling}
                  className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <Save size={18} /> {editingPostId ? 'Update Draft' : 'Save Post'}
                </button>
                <button 
                  onClick={() => handleSave('published')}
                  disabled={!(generatedContent || generatedImage || generatedVideo) || (isScheduling && !scheduledDate)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 sm:py-2"
                >
                  <Send size={18} /> {editingPostId ? 'Update Post' : (isScheduling ? 'Schedule Post' : (contentType === 'article' ? 'Publish' : 'Post Now'))}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Your Posts Section */}
      <div className="glass-card p-5 md:p-6">
        <h3 className="font-display font-bold text-lg mb-6">Your Posts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                    <PlatformIcon platform={post.platform} size={16} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{post.platform}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                    post.status === 'published' ? 'bg-emerald-50 text-emerald-600' :
                    post.status === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {post.status}
                  </span>
                  {post.status === 'scheduled' && post.scheduled_at && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50/50 px-2 py-1 rounded-full border border-amber-100">
                      <Clock size={10} /> {format(new Date(post.scheduled_at.replace(' ', 'T')), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-4 line-clamp-3 flex-1">{post.content}</p>
              {post.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden border border-slate-100 h-32">
                  <img src={post.image_url} alt="Post visual" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              {post.video_url && (
                <div className="mb-4 rounded-lg overflow-hidden border border-slate-100 h-32">
                  <video src={post.video_url} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setEditingPostId(post.id);
                    setGeneratedContent(post.content);
                    setGeneratedImage(post.image_url);
                    setGeneratedVideo(post.video_url);
                    setPlatform(post.platform);
                    setContentType(post.platform === 'blog' ? 'article' : 'social');
                    if (post.status === 'scheduled' && post.scheduled_at) {
                      setIsScheduling(true);
                      const [dateStr, timeStr] = post.scheduled_at.split(' ');
                      setScheduledDate(new Date(dateStr));
                      const [h, m] = timeStr.split(':');
                      let hourNum = parseInt(h);
                      const ampm = hourNum >= 12 ? 'PM' : 'AM';
                      if (hourNum > 12) hourNum -= 12;
                      if (hourNum === 0) hourNum = 12;
                      setScheduledHour(hourNum.toString().padStart(2, '0'));
                      setScheduledMinute(m);
                      setScheduledAmPm(ampm);
                    } else {
                      setIsScheduling(false);
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 btn-secondary text-xs flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button 
                  onClick={() => setSharePostId(post.id)}
                  className="flex-1 btn-primary text-xs flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> Share
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              <PenTool size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">No posts yet. Generate your first post above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {sharePostId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSharePostId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Share Post</h3>
                <button onClick={() => setSharePostId(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 mb-4">Choose a platform to share this post:</p>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Linkedin size={20} />
                    </div>
                    <span className="font-medium text-sm text-slate-700 group-hover:text-blue-700">LinkedIn</span>
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(posts.find(p => p.id === sharePostId)?.content || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <Twitter size={20} />
                    </div>
                    <span className="font-medium text-sm text-slate-700 group-hover:text-sky-700">Twitter</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function OptimizerView({ user, onUpdate }: { user: User | null, onUpdate: () => void }) {
  const [profile, setProfile] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills || '',
    experience: user?.experience || '',
    target_role: user?.target_role || '',
    job_preferences: user?.job_preferences || JSON.stringify({
      location: 'Remote',
      jobType: 'Full-time',
      experienceLevel: 'Senior'
    })
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [lastAppliedId, setLastAppliedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        target_role: user.target_role,
        job_preferences: user.job_preferences || JSON.stringify({
          location: 'Remote',
          jobType: 'Full-time',
          experienceLevel: 'Senior'
        })
      });
    }
  }, [user]);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    const result = await optimizeProfile(profile.bio, profile.skills, profile.experience, profile.target_role);
    setSuggestions(result);
    setIsOptimizing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    onUpdate();
    setIsSaving(false);
  };

  const applySuggestion = (field: string, value: string, suggestionId: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setApplyMessage(`Updated ${field.replace('_', ' ')}!`);
    setHighlightedField(field);
    setLastAppliedId(suggestionId);
    setTimeout(() => {
      setApplyMessage(null);
      setHighlightedField(null);
      setLastAppliedId(null);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
      <div className="space-y-6">
        <div className="glass-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg">Your Profile</h3>
            <div className="flex items-center gap-4">
              {applyMessage && (
                <motion.span 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"
                >
                  {applyMessage}
                </motion.span>
              )}
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline"
              >
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Role</label>
                <input 
                  value={profile.target_role}
                  onChange={e => setProfile({...profile, target_role: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="e.g. Senior AI Engineer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Professional Bio</label>
              <textarea 
                value={profile.bio}
                onChange={e => setProfile({...profile, bio: e.target.value})}
                className={`w-full h-32 p-3 rounded-xl border text-sm outline-none resize-none transition-all duration-500 ${highlightedField === 'bio' ? 'ring-2 ring-emerald-500/50 border-emerald-500 bg-emerald-50/30' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20'}`} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Skills</label>
              <input 
                value={profile.skills}
                onChange={e => setProfile({...profile, skills: e.target.value})}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                placeholder="React, TypeScript, AI..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Experience Highlights</label>
              <textarea 
                value={profile.experience}
                onChange={e => setProfile({...profile, experience: e.target.value})}
                className="w-full h-32 p-3 rounded-xl border border-slate-200 text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" 
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Default Job Search Preferences</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</label>
                  <div className="flex flex-wrap gap-2">
                    {['Remote', 'On-site', 'Hybrid'].map(loc => {
                      const prefs = JSON.parse(profile.job_preferences);
                      return (
                        <button
                          key={loc}
                          onClick={() => setProfile({...profile, job_preferences: JSON.stringify({...prefs, location: loc})})}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${prefs.location === loc ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Job Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Full-time', 'Contract', 'Freelance'].map(type => {
                      const prefs = JSON.parse(profile.job_preferences);
                      return (
                        <button
                          key={type}
                          onClick={() => setProfile({...profile, job_preferences: JSON.stringify({...prefs, jobType: type})})}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${prefs.jobType === type ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleOptimize}
              disabled={isOptimizing || !profile.bio}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {isOptimizing ? 'Analyzing...' : <><Sparkles size={18} /> Analyze & Optimize with AI</>}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-5 md:p-6 min-h-full">
          <h3 className="font-display font-bold text-lg mb-6 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={20} /> AI Recommendations
          </h3>

          {suggestions ? (
            <div className="space-y-6">
              {suggestions.seoAnalysis && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SEO Analysis</h4>
                  <p className="text-sm text-slate-600 italic leading-relaxed">{suggestions.seoAnalysis}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Headline Suggestions</h4>
                <div className="space-y-3">
                  {(suggestions.headlineSuggestions || []).map((headline: string, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group">
                      <p className="text-sm font-medium text-slate-900 flex-1 pr-4">{headline}</p>
                      <button 
                        onClick={() => applySuggestion('bio', headline + '\n\n' + profile.bio, `headline-${i}`)}
                        className={`text-[10px] px-2 py-1 rounded border transition-all flex items-center gap-1 shrink-0 ${lastAppliedId === `headline-${i}` ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-indigo-600 border-slate-200 hover:bg-indigo-600 hover:text-white'}`}
                      >
                        {lastAppliedId === `headline-${i}` ? <><Check size={10} /> Applied</> : 'Apply'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Optimized Summary</h4>
                  <button 
                    onClick={() => applySuggestion('bio', suggestions.optimizedSummary, 'summary')}
                    className={`text-[10px] px-2 py-1 rounded border transition-all shadow-sm flex items-center gap-1 ${lastAppliedId === 'summary' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white'}`}
                  >
                    {lastAppliedId === 'summary' ? <><Check size={10} /> Applied</> : 'Apply'}
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-900 line-clamp-4 leading-relaxed">{suggestions.optimizedSummary}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">SEO Keyword Recommendations</h4>
                <div className="flex flex-wrap gap-2">
                  {(suggestions.keywordRecommendations || []).map((kw: string, i: number) => (
                    <span key={i} className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Skills to Acquire</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.skillSuggestions.map((skill: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <ArrowRight size={14} className="text-indigo-500" />
                      {skill}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Branding Advice</h4>
                <ul className="space-y-3">
                  {suggestions.brandingAdvice.map((advice: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {i + 1}
                      </div>
                      <span className="leading-relaxed">{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <RefreshCw size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Run the optimizer to see AI-powered suggestions for your personal brand.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ projects, onProjectAdded }: { projects: Project[], onProjectAdded: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', tech_stack: '', url: '' });
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [shareProjectId, setShareProjectId] = useState<number | null>(null);
  const [techStackFilter, setTechStackFilter] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProjectId) {
      await fetch(`/api/projects/${editingProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
    } else {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
    }
    onProjectAdded();
    setShowAdd(false);
    setEditingProjectId(null);
    setNewProject({ title: '', description: '', tech_stack: '', url: '' });
  };

  const handleEdit = (project: Project) => {
    setNewProject({
      title: project.title,
      description: project.description,
      tech_stack: project.tech_stack,
      url: project.url || ''
    });
    setEditingProjectId(project.id);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredProjects = projects.filter(project => {
    if (!techStackFilter) return true;
    const filterTerms = techStackFilter.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
    const projectTechs = project.tech_stack.toLowerCase().split(',').map(t => t.trim());
    return filterTerms.every(term => projectTechs.some(tech => tech.includes(term)));
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-xl md:text-2xl">Your Portfolio</h3>
          <p className="text-slate-500 text-sm">Manage projects and promote them automatically.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center justify-center gap-2 py-2.5 sm:py-2">
          <Plus size={18} /> Add Project
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Filter by tech stack (e.g. React, Node.js)" 
          className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          value={techStackFilter}
          onChange={(e) => setTechStackFilter(e.target.value)}
        />
      </div>

      {showAdd && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-5 md:p-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                <input 
                  required
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="e.g. BrandAI SaaS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tech Stack</label>
                <input 
                  required
                  value={newProject.tech_stack}
                  onChange={e => setNewProject({...newProject, tech_stack: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                  placeholder="e.g. React, Node.js, SQLite"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                required
                value={newProject.description}
                onChange={e => setNewProject({...newProject, description: e.target.value})}
                className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm outline-none resize-none" 
                placeholder="What does this project do?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
              <input 
                value={newProject.url}
                onChange={e => setNewProject({...newProject, url: e.target.value})}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none" 
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save Project</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <div key={project.id} className="glass-card p-6 group hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <FolderKanban size={24} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(project)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><Edit3 size={16} /></button>
                <button onClick={() => setShareProjectId(project.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><Share2 size={16} /></button>
                {project.url && !project.url.includes('github.com') && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><ExternalLink size={16} /></a>
                )}
                {project.url && project.url.includes('github.com') && (
                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><Github size={16} /></a>
                )}
              </div>
            </div>
            <h4 className="font-display font-bold text-lg mb-2">{project.title}</h4>
            <p className="text-sm text-slate-500 mb-4 line-clamp-3">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tech_stack.split(',').map(tech => (
                <span key={tech} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded">
                  {tech.trim()}
                </span>
              ))}
            </div>
            <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2">
              <Zap size={14} /> Generate Promo Post
            </button>
          </div>
        ))}
        {projects.length === 0 && !showAdd && (
          <div className="col-span-full py-20 text-center">
            <FolderKanban size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-500">No projects added yet. Showcase your work!</p>
          </div>
        )}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Search size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-500">No projects match your filter.</p>
          </div>
        )}
      </div>

      {/* Share Project Modal */}
      <AnimatePresence>
        {shareProjectId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShareProjectId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Share Project</h3>
                <button onClick={() => setShareProjectId(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 mb-4">Choose a platform to share this project:</p>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(projects.find(p => p.id === shareProjectId)?.url || window.location.origin)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Linkedin size={20} />
                    </div>
                    <span className="font-medium text-sm text-slate-700 group-hover:text-blue-700">LinkedIn</span>
                  </a>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my project: ${projects.find(p => p.id === shareProjectId)?.title} - ${projects.find(p => p.id === shareProjectId)?.description}`)}&url=${encodeURIComponent(projects.find(p => p.id === shareProjectId)?.url || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-500 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <Twitter size={20} />
                    </div>
                    <span className="font-medium text-sm text-slate-700 group-hover:text-sky-700">Twitter</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JobsView({ user, jobs, jobEvents, posts, onSearch, onEventsChange, onAddToTracker }: { user: User | null, jobs: Job[], jobEvents: JobEvent[], posts: Post[], onSearch: () => void, onEventsChange: () => void, onAddToTracker: (job: Job) => void }) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('devops and aws and sre');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchIndustry, setSearchIndustry] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [filterTitle, setFilterTitle] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState<'email' | 'in-app'>('email');
  const [notificationFrequency, setNotificationFrequency] = useState<'daily' | 'weekly' | 'instant'>('daily');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/job-alerts');
        const data = await response.json();
        setNotificationsEnabled(data.enabled === 1);
        setNotificationPreference(data.preference);
        setNotificationFrequency(data.frequency);
      } catch (e) {
        console.error("Failed to fetch job alerts", e);
      }
    };
    fetchAlerts();
  }, []);

  const handleSaveAlerts = async (enabled: boolean, preference: 'email' | 'in-app', frequency: 'daily' | 'weekly' | 'instant') => {
    try {
      await fetch('/api/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, preference, frequency })
      });
      setNotificationsEnabled(enabled);
      setNotificationPreference(preference);
      setNotificationFrequency(frequency);
      setShowNotificationPrompt(false);
    } catch (e) {
      console.error("Failed to save job alerts", e);
    }
  };
  const [minMatchScore, setMinMatchScore] = useState(70);
  const [analyzingJobId, setAnalyzingJobId] = useState<number | null>(null);
  const [jobAnalysisResults, setJobAnalysisResults] = useState<Record<number, any>>({});
  const [preferences, setPreferences] = useState(() => {
    if (user?.job_preferences) {
      try {
        return JSON.parse(user.job_preferences);
      } catch (e) {
        console.error("Failed to parse job preferences", e);
      }
    }
    return {
      location: 'Remote',
      jobType: 'Full-time',
      experienceLevel: 'Senior'
    };
  });

  useEffect(() => {
    if (user?.job_preferences) {
      try {
        setPreferences(JSON.parse(user.job_preferences));
      } catch (e) {}
    }
  }, [user?.job_preferences]);

  const handleSavePreferences = async () => {
    if (!user) return;
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, job_preferences: JSON.stringify(preferences) })
    });
    onSearch(); // Refresh user data
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setIsSearching(true);
    
    // Use AI to suggest jobs based on profile, recent content, search query and preferences
    const recentContent = posts.slice(0, 3).map(p => `Post: ${p.content}\nEngagement: ${p.likes || 0} likes, ${p.comments || 0} comments, ${p.shares || 0} shares`).join('\n\n');
    const searchContext = `
      Keywords: ${searchQuery}
      Location: ${searchLocation}
      Industry: ${searchIndustry}
    `;
    const suggestedJobs = await suggestJobs(user, `${recentContent}\nSearch Context: ${searchContext}`, { ...preferences, minMatchScore });
    
    // Save suggested jobs to backend
    if (suggestedJobs && suggestedJobs.length > 0) {
      await fetch('/api/jobs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: suggestedJobs })
      });
    }
    
    onSearch();
    setIsSearching(false);
  };

  const handleAnalyzeJob = async (job: Job) => {
    setAnalyzingJobId(job.id);
    const analysis = await analyzeJobDescription(job.title, job.company, job.description);
    if (analysis) {
      setJobAnalysisResults(prev => ({ ...prev, [job.id]: analysis }));
    }
    setAnalyzingJobId(null);
  };

  const handleSaveJob = async (id: number, currentSaved: boolean) => {
    await fetch(`/api/jobs/${id}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: !currentSaved })
    });
    onSearch();
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-xl md:text-2xl">Job Board</h3>
            <p className="text-slate-500 text-sm">AI-powered job matching based on your profile and content.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-slate-100 rounded-xl mr-2">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                List
              </button>
              <button 
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                Calendar
              </button>
            </div>
            <button 
              onClick={() => setShowPreferences(!showPreferences)}
              className={`p-2 rounded-xl border transition-all ${showPreferences ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600'}`}
            >
              <SlidersHorizontal size={20} />
            </button>
            <button 
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="btn-primary flex items-center justify-center gap-2 py-2.5 sm:py-2 whitespace-nowrap"
            >
              {isSearching ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <><Sparkles size={18} /> Get AI Matches</>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Keywords (e.g. React, Manager)..."
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              placeholder="Location..."
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchLocation && (
              <button 
                onClick={() => setSearchLocation('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative flex-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchIndustry}
              onChange={e => setSearchIndustry(e.target.value)}
              placeholder="Industry..."
              className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchIndustry && (
              <button 
                onClick={() => setSearchIndustry('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      <AnimatePresence>
        {showPreferences && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Location</label>
                <div className="flex flex-wrap gap-2">
                  {['Remote', 'On-site', 'Hybrid'].map(loc => (
                    <button
                      key={loc}
                      onClick={() => setPreferences({...preferences, location: loc})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${preferences.location === loc ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Full-time', 'Contract', 'Freelance'].map(type => (
                    <button
                      key={type}
                      onClick={() => setPreferences({...preferences, jobType: type})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${preferences.jobType === type ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Experience</label>
                <div className="flex flex-wrap gap-2">
                  {['Junior', 'Mid', 'Senior', 'Lead'].map(exp => (
                    <button
                      key={exp}
                      onClick={() => setPreferences({...preferences, experienceLevel: exp})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${preferences.experienceLevel === exp ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Minimum Match Score: {minMatchScore}%
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  value={minMatchScore} 
                  onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button 
                  onClick={handleSavePreferences}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'calendar' ? (
        <JobCalendarView jobEvents={jobEvents} jobs={jobs} onEventsChange={onEventsChange} />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row flex-1 gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by title..." 
              value={filterTitle}
              onChange={e => setFilterTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="relative flex-1">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by company..." 
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by location..." 
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-medium text-slate-700">Job Alerts</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={notificationsEnabled}
              onChange={() => {
                if (notificationsEnabled) {
                  handleSaveAlerts(false, notificationPreference, notificationFrequency);
                } else {
                  setShowNotificationPrompt(true);
                }
              }}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      <AnimatePresence>
        {showNotificationPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="font-display font-bold text-lg mb-2">Configure Job Alerts</h3>
              <p className="text-sm text-slate-500 mb-6">How would you like to receive your job matches?</p>
              
              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${notificationPreference === 'email' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="notification_pref" 
                    value="email" 
                    checked={notificationPreference === 'email'}
                    onChange={() => setNotificationPreference('email')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Email</p>
                    <p className="text-xs text-slate-500">Daily digest of top matches</p>
                  </div>
                </label>
                
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${notificationPreference === 'in-app' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="radio" 
                    name="notification_pref" 
                    value="in-app" 
                    checked={notificationPreference === 'in-app'}
                    onChange={() => setNotificationPreference('in-app')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">In-App</p>
                    <p className="text-xs text-slate-500">Notifications within the app</p>
                  </div>
                </label>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-slate-900 mb-3">Notification Frequency</p>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'instant'].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setNotificationFrequency(freq as any)}
                      className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${
                        notificationFrequency === freq 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowNotificationPrompt(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleSaveAlerts(true, notificationPreference, notificationFrequency)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Enable Alerts
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {jobs.filter(job => 
          (job.title || '').toLowerCase().includes(filterTitle.toLowerCase()) &&
          (job.company || '').toLowerCase().includes(filterCompany.toLowerCase()) &&
          (job.location || '').toLowerCase().includes(filterLocation.toLowerCase())
        ).map(job => (
          <div key={job.id} className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-indigo-200 transition-all group">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
              <Briefcase size={32} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-display font-bold text-lg">{job.title}</h4>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {job.match_score}% Match
                </span>
              </div>
              <p className="text-slate-600 font-medium">{job.company}</p>
              <p className="text-slate-400 text-sm mb-2">{job.location} • Posted {new Date(job.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-slate-500 line-clamp-2">{job.description}</p>
              
              {jobAnalysisResults[job.id] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-indigo-600" />
                    <h5 className="text-sm font-bold text-indigo-900">AI Analysis</h5>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{jobAnalysisResults[job.id].summary}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Key Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {jobAnalysisResults[job.id].keySkills.map((skill: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-medium rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2">Requirements</p>
                        <ul className="space-y-1">
                          {jobAnalysisResults[job.id].requirements.map((req: string, i: number) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {jobAnalysisResults[job.id].redFlags && jobAnalysisResults[job.id].redFlags.length > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <X size={12} /> Potential Red Flags
                        </p>
                        <ul className="space-y-1">
                          {jobAnalysisResults[job.id].redFlags.map((flag: string, i: number) => (
                            <li key={i} className="text-[11px] text-red-700 flex items-start gap-1.5">
                              <span className="mt-1 w-1 h-1 bg-red-400 rounded-full shrink-0" />
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2 border-t border-indigo-100">
                      <p className="text-[11px] italic text-indigo-600">
                        <span className="font-bold not-italic">AI Advice:</span> {jobAnalysisResults[job.id].advice}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
              <button 
                onClick={() => handleAnalyzeJob(job)}
                disabled={analyzingJobId === job.id}
                className={`flex-1 text-sm px-4 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  jobAnalysisResults[job.id]
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {analyzingJobId === job.id ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <><Sparkles size={14} /> {jobAnalysisResults[job.id] ? 'Re-Analyze' : 'AI Analyze'}</>
                )}
              </button>
              <a 
                href={job.url || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
              >
                Apply Now <ExternalLink size={14} />
              </a>
              <button 
                onClick={() => onAddToTracker(job)}
                className="btn-secondary flex-1 text-sm flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Track App
              </button>
              <button 
                onClick={() => handleSaveJob(job.id, !!job.is_saved)}
                className={`flex-1 text-sm px-4 py-2 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                  job.is_saved 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200'
                }`}
              >
                <Heart size={14} className={job.is_saved ? 'fill-white' : ''} />
                {job.is_saved ? 'Saved' : 'Save Job'}
              </button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && !isSearching && (
          <div className="py-20 text-center">
            <Search size={48} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-500">No jobs found. Click "Get AI Matches" to start.</p>
          </div>
        )}
        {isSearching && jobs.length === 0 && (
          <div className="py-20 text-center">
            <RefreshCw size={48} className="mx-auto mb-4 text-indigo-200 animate-spin" />
            <p className="text-slate-500">AI is scanning the market for your perfect match...</p>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function JobCalendarView({ jobEvents, jobs, onEventsChange }: { jobEvents: JobEvent[], jobs: Job[], onEventsChange: () => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'deadline' as const,
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    job_id: undefined as number | undefined
  });

  const handleAddEvent = async () => {
    await fetch('/api/job-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    setShowAddModal(false);
    setNewEvent({
      title: '',
      type: 'deadline',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      job_id: undefined
    });
    onEventsChange();
  };

  const handleDeleteEvent = async (id: number) => {
    await fetch(`/api/job-events/${id}`, { method: 'DELETE' });
    onEventsChange();
  };

  const eventsOnSelectedDate = jobEvents.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(selectedDate || new Date(), 'yyyy-MM-dd'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-lg">Job Application Calendar</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 py-2 text-sm"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>
        <div className="flex justify-center">
          <DayPicker 
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="text-sm"
            modifiers={{
              hasEvent: jobEvents.map(e => new Date(e.date))
            }}
            modifiersClassNames={{
              hasEvent: "font-bold text-indigo-600 underline"
            }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass-card p-6">
          <h4 className="font-display font-bold text-md mb-4 flex items-center gap-2">
            <Clock size={18} className="text-indigo-600" />
            Events for {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}
          </h4>
          <div className="space-y-3">
            {eventsOnSelectedDate.length > 0 ? eventsOnSelectedDate.map(event => (
              <div key={event.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between group">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      event.type === 'deadline' ? 'bg-red-500' : 
                      event.type === 'interview' ? 'bg-emerald-500' : 
                      event.type === 'follow-up' ? 'bg-amber-500' : 'bg-slate-500'
                    }`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{event.type}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{event.title}</p>
                  {event.notes && <p className="text-xs text-slate-500 mt-1">{event.notes}</p>}
                </div>
                <button 
                  onClick={() => handleDeleteEvent(event.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No events scheduled for this day.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h4 className="font-display font-bold text-md mb-4">Upcoming Deadlines</h4>
          <div className="space-y-3">
            {jobEvents.filter(e => e.type === 'deadline' && new Date(e.date) >= new Date()).slice(0, 3).map(event => (
              <div key={event.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-red-600 uppercase">{format(new Date(event.date), 'MMM')}</span>
                  <span className="text-sm font-bold text-red-700 leading-none">{format(new Date(event.date), 'd')}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                  <p className="text-xs text-slate-500">Deadline</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl">Add Job Event</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event Title</label>
                  <input 
                    type="text" 
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Interview with Google"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                      value={newEvent.type}
                      onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    >
                      <option value="deadline">Deadline</option>
                      <option value="interview">Interview</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      value={newEvent.date}
                      onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Related Job (Optional)</label>
                  <select 
                    value={newEvent.job_id || ''}
                    onChange={e => setNewEvent({...newEvent, job_id: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                  >
                    <option value="">None</option>
                    {jobs.filter(j => j.is_saved).map(job => (
                      <option key={job.id} value={job.id}>{job.title} at {job.company}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea 
                    value={newEvent.notes}
                    onChange={e => setNewEvent({...newEvent, notes: e.target.value})}
                    placeholder="Add any details..."
                    className="w-full h-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddEvent}
                  disabled={!newEvent.title || !newEvent.date}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Save Event
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContentIdeasView({ user, onUseIdea }: { user: User | null, onUseIdea: (draft: string, platform: string) => void }) {
  const [industry, setIndustry] = useState(user?.industry || '');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editedDraft, setEditedDraft] = useState('');

  const handleGenerateIdeas = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const suggestedIdeas = await suggestContentIdeas(user, industry);
      setIdeas(suggestedIdeas);
    } catch (err) {
      console.error("Error generating ideas:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditIdea = (idea: any) => {
    setEditingIdeaId(idea.id);
    setEditedDraft(idea.draft);
  };

  const handleSaveEdit = () => {
    setIdeas(ideas.map(idea => 
      idea.id === editingIdeaId ? { ...idea, draft: editedDraft } : idea
    ));
    setEditingIdeaId(null);
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles className="text-indigo-600" size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">AI Content Strategist</h3>
            <p className="text-slate-500">Get personalized post ideas and drafts tailored to your profile and industry trends.</p>
          </div>
          <div className="w-full md:w-auto flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
              <Building2 size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Your Industry (e.g. Fintech, SaaS)" 
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none w-full md:w-48"
              />
            </div>
            <button 
              onClick={handleGenerateIdeas}
              disabled={isGenerating || !industry}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
              {isGenerating ? 'Generating...' : 'Suggest Ideas'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas.map((idea) => (
          <motion.div 
            key={idea.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex flex-col h-full hover:border-indigo-200 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <PlatformIcon platform={idea.platform} size={16} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{idea.platform}</span>
              </div>
              <button 
                onClick={() => handleEditIdea(idea)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Edit3 size={16} />
              </button>
            </div>

            <h4 className="font-display font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors">{idea.title}</h4>
            <p className="text-sm text-slate-500 mb-4 italic">"{idea.concept}"</p>
            
            <div className="flex-1 bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 relative group/draft">
              {editingIdeaId === idea.id ? (
                <textarea 
                  value={editedDraft}
                  onChange={(e) => setEditedDraft(e.target.value)}
                  className="w-full h-40 bg-transparent text-sm leading-relaxed outline-none resize-none"
                  autoFocus
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-6 group-hover/draft:line-clamp-none transition-all">
                  {idea.draft}
                </p>
              )}
              {editingIdeaId === idea.id && (
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button onClick={() => setEditingIdeaId(null)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 transition-all">
                    <X size={14} />
                  </button>
                  <button onClick={handleSaveEdit} className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-700 transition-all">
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => onUseIdea(idea.draft, idea.platform)}
              className="w-full py-3 rounded-xl border border-indigo-100 text-indigo-600 font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              Use This Draft <ArrowRight size={16} />
            </button>
          </motion.div>
        ))}

        {ideas.length === 0 && !isGenerating && (
          <div className="md:col-span-2 py-20 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="text-slate-300" size={40} />
            </div>
            <h4 className="text-xl font-display font-bold text-slate-800 mb-2">Ready for some inspiration?</h4>
            <p className="text-slate-500 max-w-md mx-auto">Enter your industry above and let AI generate personalized content ideas for your personal brand.</p>
          </div>
        )}

        {isGenerating && ideas.length === 0 && (
          <div className="md:col-span-2 py-20 text-center">
            <RefreshCw className="mx-auto mb-4 text-indigo-600 animate-spin" size={48} />
            <p className="text-slate-500 font-medium">Analyzing trends and your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsView({ posts, followerGrowth, jobApplications }: { posts: any[], followerGrowth: any[], jobApplications: any[] }) {
  const [dateRange, setDateRange] = useState('7d');
  const [platform, setPlatform] = useState('all');
  const [postType, setPostType] = useState('all');

  // Filter posts based on selection
  const filteredPosts = posts.filter(post => {
    if (platform !== 'all' && post.platform !== platform) return false;
    // Post type filtering logic (assuming status or content structure for now)
    if (postType !== 'all') {
      if (postType === 'article' && !post.content.includes('#article')) return false; // Simple heuristic
      if (postType === 'post' && post.content.includes('#article')) return false;
    }
    
    const postDate = new Date(post.created_at);
    const now = new Date();
    if (dateRange === '7d') return (now.getTime() - postDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    if (dateRange === '30d') return (now.getTime() - postDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    if (dateRange === '90d') return (now.getTime() - postDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
    
    return true;
  });

  // Calculate metrics
  const totalReach = filteredPosts.reduce((sum, p) => sum + (p.reach || 0), 0);
  const totalImpressions = filteredPosts.reduce((sum, p) => sum + (p.impressions || 0), 0);
  const totalLikes = filteredPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = filteredPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
  const totalShares = filteredPosts.reduce((sum, p) => sum + (p.shares || 0), 0);
  const totalEngagement = totalLikes + totalComments + totalShares;
  const avgEngagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';

  // Format data for charts
  const platformFollowerData = followerGrowth
    .reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.name === curr.date);
      const platformMap: { [key: string]: string } = {
        'linkedin': 'LinkedIn',
        'twitter': 'Twitter',
        'instagram': 'Instagram',
        'youtube': 'Youtube'
      };
      const platformName = platformMap[curr.platform.toLowerCase()] || curr.platform;
      if (existing) {
        existing[platformName] = curr.count;
      } else {
        acc.push({ name: curr.date, [platformName]: curr.count });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
    .slice(-7);

  const audienceData = followerGrowth
    .filter(fg => platform === 'all' || fg.platform.toLowerCase() === platform)
    .reduce((acc: any[], curr) => {
      const existing = acc.find(a => a.name === curr.date);
      if (existing) {
        existing.followers += curr.count;
      } else {
        acc.push({ name: curr.date, followers: curr.count });
      }
      return acc;
    }, [])
    .slice(-7); // Last 7 entries for simplicity in trend

  const platformReachData = ['linkedin', 'twitter', 'instagram', 'youtube'].map(p => ({
    platform: p.charAt(0).toUpperCase() + p.slice(1),
    reach: posts.filter(post => post.platform === p).reduce((sum, post) => sum + (post.reach || 0), 0),
    impressions: posts.filter(post => post.platform === p).reduce((sum, post) => sum + (post.impressions || 0), 0),
  }));

  const engagementBreakdownData = filteredPosts.slice(-7).map(p => ({
    name: format(new Date(p.created_at), 'MMM dd'),
    likes: p.likes,
    comments: p.comments,
    shares: p.shares
  }));

  const engagementData = filteredPosts.slice(-7).map(p => ({
    name: p.content.substring(0, 10) + '...',
    rate: p.reach > 0 ? ((p.likes + p.comments + p.shares) / p.reach * 100).toFixed(1) : 0
  }));

  const contentTypeData = [
    { name: 'Articles', value: posts.filter(p => p.content.includes('#article')).length, color: '#4f46e5' },
    { name: 'Standard Posts', value: posts.filter(p => !p.content.includes('#article')).length, color: '#10b981' },
    { name: 'Videos', value: posts.filter(p => p.video_url).length, color: '#ef4444' },
  ];

  const jobStatusData = [
    { name: 'Applied', value: jobApplications.filter(a => a.status === 'Applied').length, color: '#4f46e5' },
    { name: 'Interviewing', value: jobApplications.filter(a => a.status === 'Interviewing').length, color: '#f59e0b' },
    { name: 'Offer', value: jobApplications.filter(a => a.status === 'Offer').length, color: '#10b981' },
    { name: 'Rejected', value: jobApplications.filter(a => a.status === 'Rejected').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Dynamic job application trend (last 30 days grouped by week)
  const getJobAppData = () => {
    const data = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);
      
      const count = jobApplications.filter(a => {
        const d = new Date(a.application_date);
        return d >= weekStart && d < weekEnd;
      }).length;
      
      data.push({
        name: i === 0 ? 'This Week' : `${i}w ago`,
        apps: count
      });
    }
    return data;
  };

  const jobAppData = getJobAppData();

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar size={16} className="text-slate-400" />
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer flex-1"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={platform} 
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer flex-1"
          >
            <option value="all">All Platforms</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="github">GitHub</option>
            <option value="youtube">YouTube</option>
            <option value="youtube-shorts">YouTube Shorts</option>
          </select>
        </div>
        <div className="hidden sm:block h-4 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FileText size={16} className="text-slate-400" />
          <select 
            value={postType} 
            onChange={(e) => setPostType(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer flex-1"
          >
            <option value="all">All Post Types</option>
            <option value="post">Standard Post</option>
            <option value="article">Article</option>
            <option value="thread">Thread</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Reach" value={totalReach.toLocaleString()} change="+15.2%" positive={true} />
        <StatCard label="Total Impressions" value={totalImpressions.toLocaleString()} change="+18.4%" positive={true} />
        <StatCard label="Avg. Engagement Rate" value={`${avgEngagementRate}%`} change="+0.8%" positive={true} />
        <StatCard label="Follower Growth" value={`+${followerGrowth.length > 0 ? (followerGrowth[followerGrowth.length - 1].count - followerGrowth[0].count) : 0}`} change="+12.4%" positive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reach vs Impressions Trend */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Reach vs Impressions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredPosts.slice(-7).map(p => ({
                name: format(new Date(p.created_at), 'MMM dd'),
                reach: p.reach,
                impressions: p.impressions
              }))} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="reach" stroke="#4f46e5" fillOpacity={1} fill="url(#colorReach)" strokeWidth={3} />
                <Area type="monotone" dataKey="impressions" stroke="#10b981" fillOpacity={1} fill="url(#colorImpressions)" strokeWidth={3} />
                <Legend verticalAlign="top" align="right" height={36}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Engagement Breakdown (Likes, Comments, Shares)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementBreakdownData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend verticalAlign="top" align="right" height={36}/>
                <Bar dataKey="likes" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="comments" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="shares" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Platform Reach & Impressions</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformReachData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 40 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="platform" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" align="right" height={36}/>
                <Bar dataKey="reach" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="impressions" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Follower Growth Trend per Platform */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Follower Growth by Platform (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformFollowerData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Legend verticalAlign="top" align="right" height={36}/>
                <Line type="monotone" dataKey="LinkedIn" stroke="#0077b5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Twitter" stroke="#1da1f2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Instagram" stroke="#e4405f" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Youtube" stroke="#ff0000" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Rate per Post */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Engagement Rate per Post (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Content Types */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Content Type Performance</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Applications Trend */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Job Application Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={jobAppData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="apps" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Application Status Breakdown */}
        <div className="glass-card p-6">
          <h3 className="font-display font-bold text-lg mb-6">Application Status Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {jobStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Content Performance List */}
      <div className="glass-card p-6">
        <h3 className="font-display font-bold text-lg mb-6">Top Performing Content</h3>
        <div className="space-y-4">
          {[
            { title: "Launched my new AI tool today! 🚀", engagement: "1.2K", platform: "linkedin", rate: "5.2%" },
            { title: "Why React 19 is a game changer for devs...", engagement: "842", platform: "twitter", rate: "4.8%" },
            { title: "My journey from junior to senior dev in 2 years", engagement: "654", platform: "linkedin", rate: "4.1%" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <PlatformIcon platform={item.platform} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{item.engagement} engagements</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{item.rate} rate</span>
                </div>
              </div>
              <ArrowRight className="text-slate-300" size={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, positive }: { label: string, value: string, change: string, positive: boolean }) {
  return (
    <div className="glass-card p-6">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className="text-2xl font-display font-bold text-slate-900">{value}</h4>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function JobTrackerView({ applications, onUpdate }: { applications: JobApplication[], onUpdate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState({
    company: '',
    role: '',
    application_date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Applied' as const,
    notes: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/job-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp)
    });
    setIsAdding(false);
    setNewApp({
      company: '',
      role: '',
      application_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Applied',
      notes: ''
    });
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    await fetch(`/api/job-applications/${id}`, { method: 'DELETE' });
    onUpdate();
  };

  const handleStatusChange = async (id: number, status: string) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    await fetch(`/api/job-applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...app, status })
    });
    onUpdate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return 'bg-blue-100 text-blue-700';
      case 'Interviewing': return 'bg-amber-100 text-amber-700';
      case 'Offer': return 'bg-emerald-100 text-emerald-700';
      case 'Rejected': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-display font-bold text-slate-900">Job Tracker</h3>
          <p className="text-slate-500">Keep track of your job applications and their status.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Add Application
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6"
          >
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input 
                    type="text" 
                    required
                    value={newApp.company}
                    onChange={e => setNewApp({...newApp, company: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input 
                    type="text" 
                    required
                    value={newApp.role}
                    onChange={e => setNewApp({...newApp, role: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Application Date</label>
                  <input 
                    type="date" 
                    required
                    value={newApp.application_date}
                    onChange={e => setNewApp({...newApp, application_date: e.target.value})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select 
                    value={newApp.status}
                    onChange={e => setNewApp({...newApp, status: e.target.value as any})}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea 
                  value={newApp.notes}
                  onChange={e => setNewApp({...newApp, notes: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 h-24 resize-none"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Application</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {applications.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="text-slate-300" size={32} />
            </div>
            <h4 className="text-lg font-display font-bold text-slate-800">No applications tracked yet</h4>
            <p className="text-slate-500">Start tracking your job search journey here.</p>
          </div>
        ) : (
          applications.map((app) => (
            <motion.div 
              key={app.id}
              layout
              className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h4 className="font-display font-bold text-lg text-slate-900">{app.role}</h4>
                  <p className="text-slate-500 font-medium">{app.company}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Applied On</p>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar size={14} />
                    <span className="text-sm font-medium">{format(new Date(app.application_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <select 
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none cursor-pointer ${getStatusColor(app.status)}`}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDelete(app.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

