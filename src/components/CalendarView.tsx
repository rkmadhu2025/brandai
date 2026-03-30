import React, { useState, useMemo, FC } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays,
  startOfDay,
  parseISO,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon, 
  Clock, 
  Linkedin, 
  Twitter, 
  Youtube,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Download,
  List,
  Filter,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CalendarViewProps {
  posts: Post[];
  onPostUpdated: () => void;
  onSchedulePost: (date: Date) => void;
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

// Removed getPlatformIcon helper function

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'scheduled': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'failed': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusIcon = (status: string, size: number) => {
  switch (status) {
    case 'published': return <CheckCircle2 size={size} className="text-emerald-500" />;
    case 'scheduled': return <Clock size={size} className="text-indigo-500" />;
    case 'failed': return <AlertCircle size={size} className="text-rose-500" />;
    default: return null;
  }
};

export default function CalendarView({ posts, onPostUpdated, onSchedulePost }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [pendingReschedule, setPendingReschedule] = useState<{
    postId: number;
    newDate: string;
    originalTime: string;
    content: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const scheduledPosts = useMemo(() => {
    return posts.filter(post => {
      if (!post.scheduled_at && post.status !== 'published') return false;
      if (filterPlatform !== 'all' && post.platform !== filterPlatform) return false;
      if (filterStatus !== 'all' && post.status !== filterStatus) return false;
      return true;
    });
  }, [posts, filterPlatform, filterStatus]);

  const visiblePosts = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      startDate = startOfWeek(monthStart);
      endDate = endOfWeek(monthEnd);
    } else if (viewMode === 'week') {
      startDate = startOfWeek(currentDate);
      endDate = endOfWeek(startDate);
    } else {
      // For day and agenda views
      startDate = startOfDay(currentDate);
      endDate = startOfDay(currentDate);
    }

    return scheduledPosts.filter(post => {
      if (!post.scheduled_at) return false;
      const postDate = parseISO(post.scheduled_at.replace(' ', 'T'));
      return postDate >= startDate && postDate <= addDays(endDate, 1);
    });
  }, [scheduledPosts, viewMode, currentDate]);

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over) {
      const postId = active.id as number;
      let targetDateStr = String(over.id);
      
      // If dropped over another post, get that post's date
      if (!targetDateStr.startsWith('date-')) {
        const overPostId = parseInt(targetDateStr);
        if (!isNaN(overPostId)) {
          const overPost = posts.find(p => p.id === overPostId);
          if (overPost && overPost.scheduled_at) {
            targetDateStr = `date-${overPost.scheduled_at.split(' ')[0]}`;
          }
        }
      }
      
      const post = posts.find(p => p.id === postId);
      
      if (post && targetDateStr.startsWith('date-')) {
        const newDateStr = targetDateStr.replace('date-', '');
        const originalTime = post.scheduled_at ? post.scheduled_at.split(' ')[1] : '12:00:00';

        // Don't update if it's the same date
        if (post.scheduled_at && post.scheduled_at.startsWith(newDateStr)) {
          return;
        }

        setPendingReschedule({
          postId,
          newDate: newDateStr,
          originalTime,
          content: post.content
        });
      }
    }
  };

  const confirmReschedule = async () => {
    if (!pendingReschedule) return;

    const { postId, newDate, originalTime } = pendingReschedule;
    const newScheduledAt = `${newDate} ${originalTime}`;
    const post = posts.find(p => p.id === postId);

    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...post,
          scheduled_at: newScheduledAt,
          status: 'scheduled'
        }),
      });
      onPostUpdated();
    } catch (err) {
      console.error("Failed to reschedule post:", err);
    } finally {
      setPendingReschedule(null);
    }
  };

  const getVisiblePosts = () => {
    let startDate: Date;
    let endDate: Date;

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      startDate = startOfWeek(monthStart);
      endDate = endOfWeek(monthEnd);
    } else if (viewMode === 'week') {
      startDate = startOfWeek(currentDate);
      endDate = endOfWeek(startDate);
    } else {
      // For day and agenda views
      startDate = startOfDay(currentDate);
      endDate = startOfDay(currentDate);
    }

    return scheduledPosts.filter(post => {
      if (!post.scheduled_at) return false;
      const postDate = parseISO(post.scheduled_at.replace(' ', 'T'));
      return postDate >= startDate && postDate <= addDays(endDate, 1);
    });
  };

  const handleExportCSV = () => {
    if (visiblePosts.length === 0) {
      return;
    }

    setIsExporting(true);

    const headers = ['Date', 'Time', 'Platform', 'Status', 'Content', 'Image URL', 'Video URL'];
    
    const csvContent = [
      headers.join(','),
      ...visiblePosts.sort((a, b) => {
        const dateA = parseISO(a.scheduled_at!.replace(' ', 'T'));
        const dateB = parseISO(b.scheduled_at!.replace(' ', 'T'));
        return dateA.getTime() - dateB.getTime();
      }).map(post => {
        const date = parseISO(post.scheduled_at!.replace(' ', 'T'));
        const formattedDate = format(date, 'yyyy-MM-dd');
        const formattedTime = format(date, 'HH:mm');
        
        // Escape quotes and wrap content in quotes to handle commas and newlines
        const escapedContent = `"${post.content.replace(/"/g, '""')}"`;
        const imageUrl = post.image_url ? `"${post.image_url}"` : '';
        const videoUrl = post.video_url ? `"${post.video_url}"` : '';
        
        return [
          formattedDate,
          formattedTime,
          post.platform,
          post.status,
          escapedContent,
          imageUrl,
          videoUrl
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `content_calendar_${viewMode}_${format(currentDate, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setIsExporting(false), 2000);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-fr overflow-hidden">
            {calendarDays.map((day) => {
              const dayPosts: Post[] = scheduledPosts.filter(post => 
                post.scheduled_at && isSameDay(parseISO(post.scheduled_at.replace(' ', 'T')), day)
              );
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDay = isToday(day);

              return (
                <CalendarDay 
                  key={day.toISOString()} 
                  day={day} 
                  isCurrentMonth={isCurrentMonth}
                  isToday={isTodayDay}
                  posts={dayPosts}
                  onClick={() => onSchedulePost(day)}
                />
              );
            })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(startDate);
    const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="border-r border-slate-100 w-16"></div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className={`py-3 text-center border-r border-slate-100 last:border-r-0 ${isToday(day) ? 'bg-indigo-50/30' : ''}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{format(day, 'EEE')}</p>
              <p className={`text-lg font-bold mt-0.5 ${isToday(day) ? 'text-indigo-600' : 'text-slate-700'}`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 relative">
          <div className="grid grid-cols-8 min-h-[800px]">
            <div className="border-r border-slate-100 w-16 flex flex-col">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-20 border-b border-slate-50 text-[10px] text-slate-400 font-medium p-1 text-right">
                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </div>
              ))}
            </div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className={`relative border-r border-slate-100 last:border-r-0 ${isToday(day) ? 'bg-indigo-50/10' : ''}`}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-20 border-b border-slate-50"></div>
                ))}
                {scheduledPosts
                  .filter(post => post.scheduled_at && isSameDay(parseISO(post.scheduled_at.replace(' ', 'T')), day))
                  .map(post => {
                    const date = parseISO(post.scheduled_at!.replace(' ', 'T'));
                    const hour = date.getHours();
                    const minutes = date.getMinutes();
                    const top = (hour * 80) + (minutes / 60 * 80);
                    
                    return (
                      <div 
                        key={post.id}
                        className={`absolute left-1 right-1 p-2 rounded-lg border shadow-sm z-20 overflow-hidden ${getStatusColor(post.status)}`}
                        style={{ top: `${top}px`, minHeight: '60px' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <PlatformIcon platform={post.platform} size={12} />
                          <span className="text-[10px] font-bold opacity-70">{format(date, 'h:mm a')}</span>
                        </div>
                        <p className="text-[10px] font-medium line-clamp-2 leading-tight">{post.content}</p>
                      </div>
                    );
                  })
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayPosts = scheduledPosts.filter(post => 
      post.scheduled_at && isSameDay(parseISO(post.scheduled_at.replace(' ', 'T')), currentDate)
    );

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h4 className="text-xl font-display font-bold text-slate-800">{format(currentDate, 'EEEE, MMMM do')}</h4>
          <p className="text-sm text-slate-500 mt-1">{dayPosts.length} posts scheduled for today</p>
        </div>
        <div className="flex-1 p-6">
          <div className="space-y-4 max-w-2xl">
            {dayPosts.length > 0 ? (
              dayPosts.sort((a, b) => {
                const dateA = parseISO(a.scheduled_at!.replace(' ', 'T'));
                const dateB = parseISO(b.scheduled_at!.replace(' ', 'T'));
                return dateA.getTime() - dateB.getTime();
              }).map(post => {
                const date = parseISO(post.scheduled_at!.replace(' ', 'T'));
                const isExpanded = expandedPostId === post.id;
                
                return (
                  <div key={post.id} className="flex gap-4 group">
                    <div className="w-16 pt-1 text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700">{format(date, 'h:mm')}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{format(date, 'a')}</p>
                    </div>
                    <div 
                      className={`flex-1 p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-pointer ${getStatusColor(post.status)} ${isExpanded ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white rounded-lg shadow-sm">
                            <PlatformIcon platform={post.platform} size={16} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider opacity-70">{post.platform}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/50 border border-white/20`}>
                            {post.status}
                          </span>
                          <div className="flex items-center gap-1">
                            {isExpanded ? <ChevronUp size={14} className="opacity-50" /> : <ChevronDown size={14} className="opacity-50" />}
                            <button 
                              className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                // More options logic if any
                              }}
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <p className={`text-sm leading-relaxed ${isExpanded ? 'mb-4' : 'line-clamp-2 mb-2'}`}>
                          {post.content}
                        </p>
                        {!isExpanded && post.content.length > 100 && (
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Click to read more</div>
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {post.image_url && (
                              <div className="rounded-xl overflow-hidden mb-4 border border-black/5">
                                <img src={post.image_url} alt="Post preview" className="w-full h-auto max-h-96 object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {post.video_url && (
                              <div className="rounded-xl overflow-hidden mb-4 border border-black/5">
                                <video src={post.video_url} controls className="w-full h-auto max-h-96 object-cover" />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center justify-between pt-3 border-t border-black/5">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1 text-[10px] font-bold opacity-60">
                            <CheckCircle2 size={12} />
                            <span>Ready</span>
                          </div>
                        </div>
                        <button 
                          className="text-[10px] font-bold text-indigo-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Edit logic
                          }}
                        >
                          Edit Post
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="text-slate-300" size={32} />
                </div>
                <h5 className="font-display font-bold text-slate-800">No posts scheduled</h5>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">Take a break or use the Content Studio to plan your next viral post.</p>
                <button 
                  onClick={() => onSchedulePost(currentDate)}
                  className="mt-6 btn-primary text-sm px-6"
                >
                  Schedule a Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const dayPosts = scheduledPosts.filter(post => 
      post.scheduled_at && isSameDay(parseISO(post.scheduled_at.replace(' ', 'T')), currentDate)
    );

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-auto">
        <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h4 className="text-xl font-display font-bold text-slate-800">{format(currentDate, 'EEEE, MMMM do')}</h4>
            <p className="text-sm text-slate-500 mt-1">{dayPosts.length} posts scheduled for today</p>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            {dayPosts.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 w-24">Time</th>
                      <th className="p-4 w-32">Platform</th>
                      <th className="p-4 w-24">Status</th>
                      <th className="p-4">Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dayPosts.sort((a, b) => {
                      const dateA = parseISO(a.scheduled_at!.replace(' ', 'T'));
                      const dateB = parseISO(b.scheduled_at!.replace(' ', 'T'));
                      return dateA.getTime() - dateB.getTime();
                    }).map(post => {
                      const date = parseISO(post.scheduled_at!.replace(' ', 'T'));
                      return (
                        <tr key={post.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="p-4 align-top">
                            <p className="text-sm font-bold text-slate-700">{format(date, 'h:mm a')}</p>
                          </td>
                          <td className="p-4 align-top">
                            <div className="flex items-center gap-2">
                              <PlatformIcon platform={post.platform} size={16} />
                              <span className="text-sm font-medium capitalize">{post.platform}</span>
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(post.status)}`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            <p className="text-sm text-slate-700 line-clamp-2 group-hover:line-clamp-none transition-all">{post.content}</p>
                            {post.image_url && (
                              <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs font-medium text-indigo-600 hover:underline">
                                View Image
                              </a>
                            )}
                            {post.video_url && (
                              <a href={post.video_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 ml-3 text-xs font-medium text-indigo-600 hover:underline">
                                View Video
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <List className="text-slate-300" size={32} />
                </div>
                <h5 className="font-display font-bold text-slate-800">No posts scheduled</h5>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">Your agenda is clear for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-xl p-1 overflow-x-auto">
              <button 
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'month' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarDays size={14} /> Month
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'week' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarRange size={14} /> Week
              </button>
              <button 
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'day' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarCheck size={14} /> Day
              </button>
              <button 
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${viewMode === 'agenda' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <List size={14} /> Agenda
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <button 
              onClick={handleToday}
              className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors shadow-sm ${showFilters ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600'}`}
              title="Filter posts"
            >
              <Filter size={14} /> Filters
              {(filterPlatform !== 'all' || filterStatus !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1"></span>
              )}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={visiblePosts.length === 0 || isExporting}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                visiblePosts.length === 0 
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                  : isExporting
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600'
              }`}
              title={visiblePosts.length === 0 ? "No posts to export" : "Export current view to CSV"}
            >
              {isExporting ? <CheckCircle2 size={14} /> : <Download size={14} />}
              {isExporting ? 'Exported!' : 'Export CSV'}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-lg font-display font-bold text-slate-800 min-w-[140px] text-center">
                {viewMode === 'month' ? format(currentDate, 'MMMM yyyy') : 
                 viewMode === 'week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}` :
                 format(currentDate, 'MMMM d, yyyy')}
              </h3>
              <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform:</span>
                  <select 
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Platforms</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter</option>
                    <option value="youtube">YouTube</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="all">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                {(filterPlatform !== 'all' || filterStatus !== 'all') && (
                  <button 
                    onClick={() => { setFilterPlatform('all'); setFilterStatus('all'); }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode + currentDate.toISOString()}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'agenda' && renderAgendaView()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <DragOverlay>
          {activeId ? (
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xl w-48 opacity-90 cursor-grabbing ring-2 ring-white/20">
              <p className="text-[10px] font-bold truncate">Rescheduling post...</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Reschedule Confirmation Modal */}
      <AnimatePresence>
        {pendingReschedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <CalendarIcon size={24} />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-800">Confirm Reschedule</h3>
                <p className="text-sm text-slate-500 mt-1">Are you sure you want to move this post?</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Post Content</p>
                  <p className="text-sm text-slate-700 line-clamp-2 font-medium italic">"{pendingReschedule.content}"</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">New Date</p>
                    <p className="text-sm font-bold text-indigo-700">{format(parseISO(pendingReschedule.newDate), 'MMM do, yyyy')}</p>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</p>
                    <p className="text-sm font-bold text-slate-700">{pendingReschedule.originalTime.substring(0, 5)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setPendingReschedule(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReschedule}
                  className="flex-1 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all"
                >
                  Confirm Move
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer / Legend */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Failed</span>
          </div>
        </div>
        <div className="h-4 w-px bg-slate-200"></div>
        <p className="text-[10px] font-medium text-slate-400 italic">Tip: Drag and drop posts in Month view to reschedule them instantly.</p>
      </div>
    </div>
  );
}

interface CalendarDayProps {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
  onClick: () => void;
}

const CalendarDay: FC<CalendarDayProps> = ({ day, isCurrentMonth, isToday, posts, onClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `date-${format(day, 'yyyy-MM-dd')}`,
  });

  return (
    <div 
      ref={setNodeRef}
      onClick={(e) => {
        // Only trigger if clicking the day area, not a post
        if (e.target === e.currentTarget) {
          onClick();
        }
      }}
      className={`min-h-[100px] p-2 border-r border-b border-slate-100 last:border-r-0 flex flex-col gap-1 transition-all cursor-pointer group relative ${
        !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'
      } ${isToday ? 'bg-indigo-50/30' : ''} ${isOver ? 'bg-indigo-50 ring-4 ring-indigo-500/20 ring-inset z-10' : ''}`}
    >
      {isOver && (
        <div className="absolute inset-0 bg-indigo-500/5 flex items-center justify-center pointer-events-none">
          <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
            Drop to Reschedule
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-1 pointer-events-none">
        <span className={`text-[10px] font-bold ${
          isToday ? 'w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center' : 
          isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
        }`}>
          {format(day, 'd')}
        </span>
        <Plus size={10} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-hide">
        {posts.map((post: Post) => (
          <DraggablePost key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

interface DraggablePostProps {
  post: Post;
}

const DraggablePost: FC<DraggablePostProps> = ({ post }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({ id: post.id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const date = post.scheduled_at ? parseISO(post.scheduled_at.replace(' ', 'T')) : null;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`px-1.5 py-1 rounded-md border text-[9px] font-bold truncate cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-shadow hover:shadow-sm ${getStatusColor(post.status)}`}
    >
      <PlatformIcon platform={post.platform} size={10} />
      <span className="flex-1 truncate">{post.content}</span>
      {date && <span className="opacity-60 shrink-0">{format(date, 'h:mm a')}</span>}
    </div>
  );
}
