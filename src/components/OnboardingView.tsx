import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Linkedin, Twitter, Github, Target, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { User } from '../types';

interface OnboardingViewProps {
  user: User;
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [targetRole, setTargetRole] = useState(user.target_role || '');
  const [location, setLocation] = useState(user.job_preferences || '');

  const handleNext = async () => {
    if (step === 3) {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...user, 
          is_onboarded: true,
          target_role: targetRole,
          job_preferences: location
        })
      });
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-display font-bold">Welcome to BrandAI</h2>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4">Connect Social Media</h3>
                <p className="text-slate-500 mb-6 font-medium">To start building your brand, connect your platforms.</p>
                <div className="space-y-3">
                  {['LinkedIn', 'Twitter', 'GitHub'].map(platform => (
                    <button key={platform} className="w-full p-4 flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all">
                      <div className="flex items-center gap-3">
                        {platform === 'LinkedIn' && <Linkedin className="text-blue-600" />}
                        {platform === 'Twitter' && <Twitter className="text-sky-500" />}
                        {platform === 'GitHub' && <Github className="text-slate-900" />}
                        {platform}
                      </div>
                      <span className="text-xs font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg">Connect</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4">Generate Your First Post</h3>
                <p className="text-slate-500 mb-6 font-medium">Use AI to jumpstart your content strategy.</p>
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
                    <Sparkles className="w-12 h-12 text-indigo-600 mb-4" />
                    <h4 className="font-bold text-indigo-900 mb-2">AI-Powered Content Studio</h4>
                    <p className="text-sm text-indigo-600">Draft your first post automatically with just a topic input.</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="text-lg font-bold mb-4">Set Job Search Preferences</h3>
                <p className="text-slate-500 mb-6 font-medium">Help us find the right opportunities for you.</p>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Target Role</label>
                    <input 
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="e.g. Senior Frontend Engineer" 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Preferred Location</label>
                    <input 
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" 
                      placeholder="e.g. Remote" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => <div key={i} className={`w-2 h-2 rounded-full ${step === i ? 'bg-indigo-600' : 'bg-slate-300'}`} />)}
          </div>
          <button onClick={handleNext} className="btn-primary flex items-center gap-2">
            {step === 3 ? 'Get Started' : 'Next'} <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
