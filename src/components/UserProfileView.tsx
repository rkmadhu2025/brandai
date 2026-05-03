import React, { useState, useEffect } from 'react';
import { User, Save, Edit3, X, Linkedin, Twitter, Github, Globe, Building2, Target, GraduationCap, Briefcase, Sparkles, Share2, Check } from 'lucide-react';
import { User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { optimizeProfile } from '../services/geminiService';

export function UserProfileView({ user, onUpdate }: { user: UserType | null, onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [bioSuggestion, setBioSuggestion] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserType>(user || {
    id: 0,
    name: '',
    email: '',
    bio: '',
    skills: '',
    experience: '',
    education: '',
    career_goals: '',
    target_role: '',
    industry: '',
    job_preferences: '',
    linkedin_url: '',
    twitter_url: '',
    github_url: '',
    portfolio_url: ''
  });

  useEffect(() => {
    if (user) setFormData(user);
  }, [user]);

  const handleSave = async () => {
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setIsEditing(false);
    onUpdate();
  };

  const handleOptimizeBio = async () => {
    setIsOptimizing(true);
    try {
      const result = await optimizeProfile(formData.bio, formData.skills, formData.experience, formData.target_role);
      // Assuming result has an optimizedSummary or similar field
      setBioSuggestion(result.optimizedSummary || result.seoAnalysis || 'Could not generate suggestion.');
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applySuggestion = () => {
    if (bioSuggestion) {
      setFormData({...formData, bio: bioSuggestion});
      setBioSuggestion(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-xl">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <User size={48} />
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-xl transition-all"
          >
            {isEditing ? <X size={20} /> : <Edit3 size={20} />}
          </button>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900">{formData.name || 'Your Name'}</h2>
              <p className="text-indigo-600 font-medium">{formData.target_role || 'Target Role'}</p>
            </div>
            <div className="flex gap-2">
              {formData.linkedin_url && (
                <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Linkedin size={20} />
                </a>
              )}
              {formData.twitter_url && (
                <a href={formData.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all">
                  <Twitter size={20} />
                </a>
              )}
              {formData.github_url && (
                <a href={formData.github_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                  <Github size={20} />
                </a>
              )}
              {formData.portfolio_url && (
                <a href={formData.portfolio_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                  <Globe size={20} />
                </a>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Full Name</label>
                      <input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="e.g. John Doe" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Industry</label>
                      <input 
                        value={formData.industry} 
                        onChange={e => setFormData({...formData, industry: e.target.value})} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="e.g. Fintech, SaaS" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 ml-1">Target Role</label>
                      <input 
                        value={formData.target_role} 
                        onChange={e => setFormData({...formData, target_role: e.target.value})} 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        placeholder="e.g. Senior Product Designer" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 ml-1">Professional Bio</label>
                      <button 
                        onClick={handleOptimizeBio} 
                        disabled={isOptimizing || !formData.bio}
                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles size={12} /> {isOptimizing ? 'Optimizing...' : 'Optimize with AI'}
                      </button>
                    </div>
                    <textarea 
                      value={formData.bio} 
                      onChange={e => setFormData({...formData, bio: e.target.value})} 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="Tell your story..." 
                    />
                    {bioSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-slate-700"
                      >
                        <p className="font-bold text-emerald-800 text-xs mb-1">AI Suggestion:</p>
                        <p className="mb-2">{bioSuggestion}</p>
                        <div className="flex gap-2">
                          <button onClick={applySuggestion} className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1">
                            <Check size={10} /> Apply
                          </button>
                          <button onClick={() => setBioSuggestion(null)} className="px-3 py-1 bg-white text-slate-600 text-[10px] font-bold rounded-lg border border-slate-200">
                            Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Experience & Education</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Experience</label>
                    <textarea 
                      value={formData.experience} 
                      onChange={e => setFormData({...formData, experience: e.target.value})} 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="List your key roles and achievements..." 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Education</label>
                    <textarea 
                      value={formData.education} 
                      onChange={e => setFormData({...formData, education: e.target.value})} 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="Degrees, certifications..." 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Goals & Skills</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Career Goals</label>
                    <textarea 
                      value={formData.career_goals} 
                      onChange={e => setFormData({...formData, career_goals: e.target.value})} 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="Where do you want to be in 5 years?" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 ml-1">Skills</label>
                    <textarea 
                      value={formData.skills} 
                      onChange={e => setFormData({...formData, skills: e.target.value})} 
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="React, TypeScript, Product Strategy..." 
                    />
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Social Media & Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <Linkedin size={18} className="text-blue-600" />
                      <input 
                        value={formData.linkedin_url} 
                        onChange={e => setFormData({...formData, linkedin_url: e.target.value})} 
                        className="bg-transparent text-sm outline-none w-full" 
                        placeholder="LinkedIn URL" 
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <Twitter size={18} className="text-sky-500" />
                      <input 
                        value={formData.twitter_url} 
                        onChange={e => setFormData({...formData, twitter_url: e.target.value})} 
                        className="bg-transparent text-sm outline-none w-full" 
                        placeholder="Twitter URL" 
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <Github size={18} className="text-slate-900" />
                      <input 
                        value={formData.github_url} 
                        onChange={e => setFormData({...formData, github_url: e.target.value})} 
                        className="bg-transparent text-sm outline-none w-full" 
                        placeholder="GitHub URL" 
                      />
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <Globe size={18} className="text-indigo-600" />
                      <input 
                        value={formData.portfolio_url} 
                        onChange={e => setFormData({...formData, portfolio_url: e.target.value})} 
                        className="bg-transparent text-sm outline-none w-full" 
                        placeholder="Portfolio/Website URL" 
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    onClick={handleSave} 
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} /> Save Profile
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                <div className="md:col-span-2 space-y-8">
                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-500" /> About
                    </h3>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{formData.bio || 'No bio provided yet.'}</p>
                  </section>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Briefcase size={16} className="text-indigo-500" /> Experience
                      </h3>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{formData.experience || 'No experience listed.'}</p>
                    </section>
                    <section>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <GraduationCap size={16} className="text-indigo-500" /> Education
                      </h3>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{formData.education || 'No education listed.'}</p>
                    </section>
                  </div>

                  <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Target size={16} className="text-indigo-500" /> Career Goals
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{formData.career_goals || 'No goals set yet.'}</p>
                  </section>
                </div>

                <div className="space-y-8">
                  <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 size={16} className="text-indigo-500" /> Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry</p>
                        <p className="text-sm font-bold text-slate-700">{formData.industry || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Role</p>
                        <p className="text-sm font-bold text-slate-700">{formData.target_role || 'Not specified'}</p>
                      </div>
                    </div>
                  </section>

                  <section className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Share2 size={16} className="text-indigo-500" /> Social Profiles
                    </h3>
                    <div className="space-y-3">
                      {formData.linkedin_url && (
                        <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors group">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                            <Linkedin size={16} />
                          </div>
                          <span className="text-xs font-medium">LinkedIn</span>
                        </a>
                      )}
                      {formData.twitter_url && (
                        <a href={formData.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-sky-500 transition-colors group">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-sky-50 group-hover:border-sky-100 transition-all">
                            <Twitter size={16} />
                          </div>
                          <span className="text-xs font-medium">Twitter</span>
                        </a>
                      )}
                      {formData.github_url && (
                        <a href={formData.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors group">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-slate-100 group-hover:border-slate-200 transition-all">
                            <Github size={16} />
                          </div>
                          <span className="text-xs font-medium">GitHub</span>
                        </a>
                      )}
                      {formData.portfolio_url && (
                        <a href={formData.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-indigo-600 transition-colors group">
                          <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                            <Globe size={16} />
                          </div>
                          <span className="text-xs font-medium">Portfolio</span>
                        </a>
                      )}
                      {!formData.linkedin_url && !formData.twitter_url && !formData.github_url && !formData.portfolio_url && (
                        <p className="text-xs text-slate-400 italic">No social profiles linked.</p>
                      )}
                    </div>
                  </section>

                  <section className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills ? formData.skills.split(',').map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 shadow-sm">
                          {skill.trim()}
                        </span>
                      )) : <p className="text-xs text-slate-400 italic">No skills listed.</p>}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
