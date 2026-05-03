import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database;

function initializeDatabase() {
  const dbPath = "database.sqlite";
  try {
    db = new Database(dbPath);
    db.pragma("schema_version");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    bio TEXT,
    skills TEXT,
    experience TEXT,
    education TEXT,
    career_goals TEXT,
    target_role TEXT,
    job_preferences TEXT,
    is_onboarded INTEGER DEFAULT 0
  );
`);

try {
  const tableInfo = db.pragma("table_info(users)") as any[];
  const hasIsOnboarded = tableInfo.some(col => col.name === 'is_onboarded');
  if (!hasIsOnboarded) {
    db.exec("ALTER TABLE users ADD COLUMN is_onboarded INTEGER DEFAULT 0;");
  }
} catch (e) {
  // ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    platform TEXT,
    image_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_at DATETIME,
    recurrence_pattern TEXT,
    recurrence_end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    watch_time INTEGER DEFAULT 0,
    audience_retention REAL DEFAULT 0,
    click_through_rate REAL DEFAULT 0,
    transcription TEXT
  );

  CREATE TABLE IF NOT EXISTS follower_growth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    platform TEXT,
    count INTEGER,
    date DATE DEFAULT CURRENT_DATE
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    tech_stack TEXT,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    url TEXT,
    match_score INTEGER,
    is_saved INTEGER DEFAULT 0,
    job_type TEXT,
    experience_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    title TEXT,
    type TEXT,
    date DATETIME,
    notes TEXT,
    recurrence_pattern TEXT,
    recurrence_end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    company TEXT,
    role TEXT,
    application_date DATETIME,
    status TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    enabled INTEGER DEFAULT 0,
    preference TEXT DEFAULT 'in-app',
    frequency TEXT DEFAULT 'daily',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    platform TEXT,
    handle TEXT,
    name TEXT,
    avatar_url TEXT,
    is_connected INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.prepare("ALTER TABLE posts ADD COLUMN transcription TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE posts ADD COLUMN video_style TEXT").run();
  db.prepare("ALTER TABLE posts ADD COLUMN video_length TEXT").run();
  db.prepare("ALTER TABLE posts ADD COLUMN video_aspect_ratio TEXT").run();
  db.prepare("ALTER TABLE posts ADD COLUMN video_resolution TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE jobs ADD COLUMN job_type TEXT").run();
  db.prepare("ALTER TABLE jobs ADD COLUMN experience_level TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE job_events ADD COLUMN recurrence_pattern TEXT").run();
  db.prepare("ALTER TABLE job_events ADD COLUMN recurrence_end_date DATETIME").run();
} catch (e) {}

// Seed some follower growth data if empty
const followerCount = db.prepare("SELECT COUNT(*) as count FROM follower_growth").get() as { count: number };
if (followerCount.count === 0) {
  const platforms = ['LinkedIn', 'Twitter', 'Instagram', 'YouTube'];
  const insertFollower = db.prepare("INSERT INTO follower_growth (user_id, platform, count, date) VALUES (?, ?, ?, ?)");
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    platforms.forEach(p => {
      const base = p === 'LinkedIn' ? 1000 : p === 'Twitter' ? 500 : 200;
      const growth = Math.floor(Math.random() * 10) + 1;
      insertFollower.run(1, p, base + (30 - i) * growth, dateStr);
    });
  }
}

// Seed some job events if empty
const eventCount = db.prepare("SELECT COUNT(*) as count FROM job_events").get() as { count: number };
if (eventCount.count === 0) {
  const insertEvent = db.prepare("INSERT INTO job_events (job_id, title, type, date, notes) VALUES (?, ?, ?, ?, ?)");
  const today = new Date();
  
  const events = [
    { title: 'Interview with Google', type: 'interview', days: 2, notes: 'Technical round with SRE team' },
    { title: 'Deadline for Meta Application', type: 'deadline', days: 5, notes: 'Submit updated portfolio' },
    { title: 'Follow-up with Amazon Recruiter', type: 'follow-up', days: 1, notes: 'Ask about the next steps' },
    { title: 'System Design Interview at Netflix', type: 'interview', days: 7, notes: 'Focus on scalability and distributed systems' },
    { title: 'Deadline for Microsoft SRE Role', type: 'deadline', days: 10, notes: 'Check if referral is active' },
    { title: 'Follow-up with Apple Hiring Manager', type: 'follow-up', days: 4, notes: 'Thank you note after interview' }
  ];

  events.forEach(e => {
    const date = new Date(today);
    date.setDate(today.getDate() + e.days);
    insertEvent.run(null, e.title, e.type, date.toISOString(), e.notes);
  });
}

// Seed some channels if empty
const channelCount = db.prepare("SELECT COUNT(*) as count FROM channels").get() as { count: number };
if (channelCount.count === 0) {
  const insertChannel = db.prepare("INSERT INTO channels (user_id, platform, handle, name, avatar_url) VALUES (?, ?, ?, ?, ?)");
  insertChannel.run(1, 'linkedin', 'rajkumar-madhu-b604a33b1', 'Rajkumar Madhu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajkumar');
  insertChannel.run(1, 'twitter', '@rajkumar_dev', 'Rajkumar Dev', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev');
} else {
  // Update existing linkedin handle to the requested one
  try {
    db.prepare("UPDATE channels SET handle = 'rajkumar-madhu-b604a33b1' WHERE platform = 'linkedin'").run();
  } catch (e) {}
}

try {
  db.exec("ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0;");
  db.exec("ALTER TABLE posts ADD COLUMN comments INTEGER DEFAULT 0;");
  db.exec("ALTER TABLE posts ADD COLUMN shares INTEGER DEFAULT 0;");
  db.exec("ALTER TABLE posts ADD COLUMN reach INTEGER DEFAULT 0;");
  db.exec("ALTER TABLE posts ADD COLUMN impressions INTEGER DEFAULT 0;");
} catch (e) {}

try {
  db.exec("ALTER TABLE posts ADD COLUMN video_url TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE posts ADD COLUMN thumbnail_url TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE posts ADD COLUMN recurrence_pattern TEXT;");
  db.exec("ALTER TABLE posts ADD COLUMN recurrence_end_date DATETIME;");
} catch (e) {}

// Seed some posts if empty
const postCount = db.prepare("SELECT COUNT(*) as count FROM posts").get() as { count: number };
if (postCount.count === 0) {
  const insertPost = db.prepare("INSERT INTO posts (user_id, content, platform, status, likes, comments, shares, reach, impressions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertPost.run(1, 'Just launched my new portfolio! Check it out #webdev #portfolio', 'linkedin', 'published', 45, 12, 5, 1200, 1800, '2026-03-20 10:00:00');
  insertPost.run(1, 'Excited to start my new journey as a Senior Frontend Engineer at TechCorp! #newjob #career', 'linkedin', 'published', 120, 35, 10, 3500, 5200, '2026-03-22 14:30:00');
  insertPost.run(1, 'Top 5 React Hooks you should know in 2026 🧵 #reactjs #javascript', 'twitter', 'published', 85, 15, 40, 2800, 4500, '2026-03-24 09:15:00');
  insertPost.run(1, 'Why I love using Tailwind CSS for all my projects #css #webdesign', 'twitter', 'published', 50, 8, 12, 1500, 2200, '2026-03-25 16:45:00');
  insertPost.run(1, 'Building a real-time chat app with WebSockets and Node.js #nodejs #backend', 'linkedin', 'published', 65, 20, 8, 2100, 3100, '2026-03-26 11:20:00');
}

// Seed a DevOps post if it doesn't exist
const devopsPostCount = db.prepare("SELECT COUNT(*) as count FROM posts WHERE content LIKE '%DevOps%'").get() as { count: number };
if (devopsPostCount.count === 0) {
  const insertPost = db.prepare("INSERT INTO posts (user_id, content, platform, status, likes, comments, shares, reach, impressions, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertPost.run(1, 'Just automated our entire CI/CD pipeline using GitHub Actions and ArgoCD! 🚀 Deployments that used to take hours now happen in minutes with zero downtime. The power of GitOps is real. What are your favorite DevOps tools right now? #DevOps #GitOps #Kubernetes #CICD #Tech', 'linkedin', 'published', 145, 28, 15, 4200, 6500, new Date().toISOString());
} else {
  // Fix the date format if it was inserted with a space
  try {
    db.prepare("UPDATE posts SET created_at = ? WHERE content LIKE '%DevOps%'").run(new Date().toISOString());
  } catch (e) {}
}

// Seed some YouTube posts if none exist
const youtubePostCount = db.prepare("SELECT COUNT(*) as count FROM posts WHERE platform LIKE 'youtube%'").get() as { count: number };
if (youtubePostCount.count === 0) {
  const insertPost = db.prepare("INSERT INTO posts (user_id, content, platform, status, likes, comments, shares, reach, impressions, watch_time, audience_retention, click_through_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  // Videos
  insertPost.run(1, 'TITLE: Building a SaaS with React and Node.js\nDESCRIPTION: A complete guide to building a production-ready SaaS.', 'youtube', 'published', 450, 85, 120, 15000, 25000, 4500, 0.45, 0.08, '2026-03-20 10:00:00');
  insertPost.run(1, 'TITLE: 10 Tips for Better CSS\nDESCRIPTION: Master CSS with these 10 simple tips.', 'youtube', 'published', 320, 45, 80, 8000, 15000, 2800, 0.38, 0.06, '2026-03-22 14:30:00');
  insertPost.run(1, 'TITLE: Why I switched to Neovim\nDESCRIPTION: My journey from VS Code to Neovim.', 'youtube', 'published', 850, 150, 300, 45000, 80000, 12000, 0.55, 0.12, '2026-03-25 09:15:00');
  insertPost.run(1, 'TITLE: React vs Vue in 2026\nDESCRIPTION: Which one should you choose?', 'youtube', 'published', 500, 90, 150, 22000, 40000, 6500, 0.42, 0.07, '2026-03-28 16:45:00');

  // Shorts
  insertPost.run(1, 'TITLE: React Hook Tip #1\nDESCRIPTION: Use useMemo wisely!', 'youtube-shorts', 'published', 1200, 45, 200, 50000, 75000, 800, 0.85, 0.15, '2026-03-21 11:00:00');
  insertPost.run(1, 'TITLE: CSS Grid is Amazing\nDESCRIPTION: One line of CSS for complex layouts.', 'youtube-shorts', 'published', 850, 30, 150, 35000, 50000, 600, 0.78, 0.12, '2026-03-23 15:20:00');
  insertPost.run(1, 'TITLE: VS Code Shortcut\nDESCRIPTION: Save hours with this one trick.', 'youtube-shorts', 'published', 2500, 120, 500, 120000, 180000, 1500, 0.92, 0.18, '2026-03-26 10:45:00');
  insertPost.run(1, 'TITLE: TypeScript Utility Types\nDESCRIPTION: Partial, Pick, and more.', 'youtube-shorts', 'published', 600, 25, 100, 25000, 35000, 450, 0.72, 0.10, '2026-03-29 13:10:00');
}

// Seed follower growth data if empty
const fgCount = db.prepare("SELECT COUNT(*) as count FROM follower_growth").get() as { count: number };
if (fgCount.count === 0) {
  const platforms = ['linkedin', 'twitter', 'instagram', 'youtube'];
  platforms.forEach(p => {
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const baseCount = p === 'linkedin' ? 1200 : p === 'twitter' ? 800 : p === 'instagram' ? 500 : 300;
      const count = baseCount + (14 - i) * Math.floor(Math.random() * 20 + 5);
      db.prepare("INSERT INTO follower_growth (user_id, platform, count, date) VALUES (?, ?, ?, ?)")
        .run(1, p, count, dateStr);
    }
  });
}

// Migration: Add url column to jobs if it doesn't exist
try {
  db.prepare("ALTER TABLE jobs ADD COLUMN url TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE users ADD COLUMN job_preferences TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE posts ADD COLUMN watch_time INTEGER DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE posts ADD COLUMN audience_retention REAL DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE posts ADD COLUMN click_through_rate REAL DEFAULT 0").run();
} catch (e) {}

// Seed some analytics for existing youtube posts
db.prepare(`
  UPDATE posts 
  SET watch_time = ABS(RANDOM() % 5000) + 500,
      audience_retention = (ABS(RANDOM() % 40) + 30) / 100.0,
      click_through_rate = (ABS(RANDOM() % 10) + 2) / 100.0
  WHERE platform LIKE 'youtube%' AND (watch_time = 0 OR watch_time IS NULL)
`).run();

    // Additional Migrations
    const migrations = [
      "ALTER TABLE users ADD COLUMN education TEXT",
      "ALTER TABLE users ADD COLUMN career_goals TEXT",
      "ALTER TABLE users ADD COLUMN linkedin_url TEXT",
      "ALTER TABLE users ADD COLUMN twitter_url TEXT",
      "ALTER TABLE users ADD COLUMN github_url TEXT",
      "ALTER TABLE users ADD COLUMN portfolio_url TEXT",
      "ALTER TABLE users ADD COLUMN industry TEXT"
    ];
    for (const m of migrations) {
      try {
        db.prepare(m).run();
      } catch (e) {}
    }

  } catch (e: any) {
    if (e.code === 'SQLITE_CORRUPT') {
      console.error("Database corrupted, recreating...");
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      initializeDatabase();
    } else {
      throw e;
    }
  }
}

initializeDatabase();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  const PORT = 3000;

  // Add request logging
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`${req.method} ${req.url}`);
    }
    next();
  });

  // API Routes
  app.post("/api/transcribe", async (req, res) => {
    const { postId, content } = req.body;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Transcribe the following content into a structured transcript: ${content}`,
      });
      const transcription = response.text;
      db.prepare("UPDATE posts SET transcription = ? WHERE id = ?").run(transcription, postId);
      res.json({ transcription });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({ error: "Failed to generate transcription" });
    }
  });

  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get() as any;
    if (user) {
      user.is_onboarded = !!user.is_onboarded;
      res.json(user);
    } else {
      res.json({ 
        name: "Guest User", 
        bio: "AI Enthusiast", 
        skills: "React, Node.js, AI", 
        experience: "Building cool stuff",
        education: "BS in Computer Science",
        career_goals: "Become a Senior Full Stack Engineer",
        target_role: "Senior Full Stack Engineer",
        is_onboarded: false
      });
    }
  });

  app.post("/api/user", (req, res) => {
    let { name, bio, skills, experience, education, career_goals, target_role, industry, job_preferences, linkedin_url, twitter_url, github_url, portfolio_url, is_onboarded } = req.body;
    const existing = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
    
    // Prevent undefined values from crashing better-sqlite3
    name = name ?? null;
    bio = bio ?? null;
    skills = skills ?? null;
    experience = experience ?? null;
    education = education ?? null;
    career_goals = career_goals ?? null;
    target_role = target_role ?? null;
    industry = industry ?? null;
    job_preferences = job_preferences ?? null;
    linkedin_url = linkedin_url ?? null;
    twitter_url = twitter_url ?? null;
    github_url = github_url ?? null;
    portfolio_url = portfolio_url ?? null;

    if (existing) {
      db.prepare("UPDATE users SET name = ?, bio = ?, skills = ?, experience = ?, education = ?, career_goals = ?, target_role = ?, industry = ?, job_preferences = ?, linkedin_url = ?, twitter_url = ?, github_url = ?, portfolio_url = ?, is_onboarded = ? WHERE id = ?")
        .run(name, bio, skills, experience, education, career_goals, target_role, industry, job_preferences, linkedin_url, twitter_url, github_url, portfolio_url, is_onboarded ? 1 : 0, existing.id);
    } else {
      db.prepare("INSERT INTO users (name, bio, skills, experience, education, career_goals, target_role, industry, job_preferences, linkedin_url, twitter_url, github_url, portfolio_url, is_onboarded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(name, bio, skills, experience, education, career_goals, target_role, industry, job_preferences, linkedin_url, twitter_url, github_url, portfolio_url, is_onboarded ? 1 : 0);
    }
    res.json({ status: "success" });
  });

  app.post("/api/posts", (req, res) => {
    const { content, platform, image_url, video_url, thumbnail_url, scheduled_at, recurrence_pattern, recurrence_end_date, video_style, video_length, video_aspect_ratio, video_resolution, status: bodyStatus } = req.body;
    const status = bodyStatus || (scheduled_at ? 'scheduled' : 'published');
    
    // For demo purposes, generate some random analytics for youtube posts
    const watch_time = platform.startsWith('youtube') ? Math.floor(Math.random() * 5000) + 500 : 0;
    const audience_retention = platform.startsWith('youtube') ? (Math.random() * 0.4 + 0.3) : 0;
    const click_through_rate = platform.startsWith('youtube') ? (Math.random() * 0.1 + 0.02) : 0;

    const result = db.prepare("INSERT INTO posts (user_id, content, platform, image_url, video_url, thumbnail_url, status, scheduled_at, recurrence_pattern, recurrence_end_date, video_style, video_length, video_aspect_ratio, video_resolution, watch_time, audience_retention, click_through_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(1, content, platform, image_url, video_url, thumbnail_url, status, scheduled_at, recurrence_pattern, recurrence_end_date, video_style, video_length, video_aspect_ratio, video_resolution, watch_time, audience_retention, click_through_rate);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/posts", (req, res) => {
    // Auto-publish scheduled posts whose time has passed
    const duePosts = db.prepare("SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= datetime('now', 'localtime')").all() as any[];
    
    if (duePosts.length > 0) {
      const insertPost = db.prepare(`
        INSERT INTO posts (user_id, content, platform, image_url, video_url, thumbnail_url, status, scheduled_at, recurrence_pattern, recurrence_end_date, watch_time, audience_retention, click_through_rate) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateStatus = db.prepare("UPDATE posts SET status = 'published' WHERE id = ?");
      
      const transaction = db.transaction((posts) => {
        for (const post of posts) {
          if (post.recurrence_pattern && post.recurrence_pattern !== 'none') {
            const nextDate = new Date(post.scheduled_at.replace(' ', 'T'));
            if (post.recurrence_pattern === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            else if (post.recurrence_pattern === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (post.recurrence_pattern === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            
            const endDate = post.recurrence_end_date ? new Date(post.recurrence_end_date.replace(' ', 'T')) : null;
            if (endDate) {
              endDate.setHours(23, 59, 59, 999);
            }
            
            if (!endDate || nextDate <= endDate) {
              // Format nextDate back to YYYY-MM-DD HH:MM:SS
              const pad = (n: number) => n.toString().padStart(2, '0');
              const formattedNextDate = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())} ${pad(nextDate.getHours())}:${pad(nextDate.getMinutes())}:${pad(nextDate.getSeconds())}`;
              
              insertPost.run(
                post.user_id, post.content, post.platform, post.image_url, post.video_url, post.thumbnail_url, 
                'scheduled', formattedNextDate, post.recurrence_pattern, post.recurrence_end_date, 
                0, 0, 0
              );
            }
          }
          updateStatus.run(post.id);
        }
      });
      transaction(duePosts);
    }

    const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    res.json(posts);
  });

  app.put("/api/posts/:id", (req, res) => {
    const { id } = req.params;
    const { content, platform, image_url, video_url, thumbnail_url, scheduled_at, recurrence_pattern, recurrence_end_date, video_style, video_length, video_aspect_ratio, video_resolution, status: bodyStatus } = req.body;
    const status = bodyStatus || (scheduled_at ? 'scheduled' : 'published');
    db.prepare("UPDATE posts SET content = ?, platform = ?, image_url = ?, video_url = ?, thumbnail_url = ?, status = ?, scheduled_at = ?, recurrence_pattern = ?, recurrence_end_date = ?, video_style = ?, video_length = ?, video_aspect_ratio = ?, video_resolution = ? WHERE id = ?")
      .run(content, platform, image_url, video_url, thumbnail_url, status, scheduled_at, recurrence_pattern, recurrence_end_date, video_style, video_length, video_aspect_ratio, video_resolution, id);
    res.json({ status: "success" });
  });

  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { title, description, tech_stack, url } = req.body;
    const result = db.prepare("INSERT INTO projects (user_id, title, description, tech_stack, url) VALUES (?, ?, ?, ?, ?)")
      .run(1, title, description, tech_stack, url);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/projects/:id", (req, res) => {
    const { id } = req.params;
    const { title, description, tech_stack, url } = req.body;
    db.prepare("UPDATE projects SET title = ?, description = ?, tech_stack = ?, url = ? WHERE id = ?")
      .run(title, description, tech_stack, url, id);
    res.json({ status: "success" });
  });

  app.get("/api/jobs", (req, res) => {
    const jobs = db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all();
    res.json(jobs);
  });

  app.post("/api/jobs/bulk", (req, res) => {
    const { jobs } = req.body;
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: "Invalid jobs data" });
    }

    const insert = db.prepare("INSERT INTO jobs (title, company, location, description, url, match_score, job_type, experience_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    const transaction = db.transaction((jobList) => {
      for (const job of jobList) {
        insert.run(job.title, job.company, job.location, job.description, job.url, job.match_score, job.job_type || null, job.experience_level || null);
      }
    });
    transaction(jobs);
    res.json({ status: "success", count: jobs.length });
  });

  app.post("/api/jobs/:id/save", (req, res) => {
    const { id } = req.params;
    const { saved } = req.body;
    db.prepare("UPDATE jobs SET is_saved = ? WHERE id = ?").run(saved ? 1 : 0, id);
    res.json({ status: "success" });
  });

  app.get("/api/job-events", (req, res) => {
    const events = db.prepare("SELECT * FROM job_events ORDER BY date ASC").all();
    res.json(events);
  });

  app.post("/api/job-events", (req, res) => {
    const { job_id, title, type, date, notes, recurrence_pattern, recurrence_end_date } = req.body;
    const result = db.prepare("INSERT INTO job_events (job_id, title, type, date, notes, recurrence_pattern, recurrence_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(job_id || null, title, type, date, notes, recurrence_pattern || null, recurrence_end_date || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/job-events/:id", (req, res) => {
    const { id } = req.params;
    const { job_id, title, type, date, notes, recurrence_pattern, recurrence_end_date } = req.body;
    db.prepare("UPDATE job_events SET job_id = ?, title = ?, type = ?, date = ?, notes = ?, recurrence_pattern = ?, recurrence_end_date = ? WHERE id = ?")
      .run(job_id || null, title, type, date, notes, recurrence_pattern || null, recurrence_end_date || null, id);
    res.json({ status: "success" });
  });

  app.delete("/api/job-events/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM job_events WHERE id = ?").run(id);
    res.json({ status: "success" });
  });

  app.get("/api/job-applications", (req, res) => {
    const applications = db.prepare("SELECT * FROM job_applications ORDER BY application_date DESC").all();
    res.json(applications);
  });

  app.post("/api/job-applications", (req, res) => {
    const { company, role, application_date, status, notes } = req.body;
    const result = db.prepare("INSERT INTO job_applications (user_id, company, role, application_date, status, notes) VALUES (?, ?, ?, ?, ?, ?)")
      .run(1, company, role, application_date, status, notes);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/job-applications/:id", (req, res) => {
    const { id } = req.params;
    const { company, role, application_date, status, notes } = req.body;
    db.prepare("UPDATE job_applications SET company = ?, role = ?, application_date = ?, status = ?, notes = ? WHERE id = ?")
      .run(company, role, application_date, status, notes, id);
    res.json({ status: "success" });
  });

  app.delete("/api/job-applications/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM job_applications WHERE id = ?").run(id);
    res.json({ status: "success" });
  });

  app.get("/api/job-alerts", (req, res) => {
    const alert = db.prepare("SELECT * FROM job_alerts WHERE user_id = 1 LIMIT 1").get();
    res.json(alert || { enabled: 0, preference: 'in-app', frequency: 'daily' });
  });

  app.post("/api/job-alerts", (req, res) => {
    const { enabled, preference, frequency } = req.body;
    const existing = db.prepare("SELECT id FROM job_alerts WHERE user_id = 1 LIMIT 1").get();
    
    if (existing) {
      db.prepare("UPDATE job_alerts SET enabled = ?, preference = ?, frequency = ? WHERE id = ?")
        .run(enabled ? 1 : 0, preference, frequency, existing.id);
    } else {
      db.prepare("INSERT INTO job_alerts (user_id, enabled, preference, frequency) VALUES (?, ?, ?, ?)")
        .run(1, enabled ? 1 : 0, preference, frequency);
    }
    res.json({ status: "success" });
  });
  
  app.get("/api/channels", (req, res) => {
    const channels = db.prepare("SELECT * FROM channels WHERE user_id = 1").all();
    res.json(channels);
  });
  
  app.post("/api/channels", (req, res) => {
    const { platform, handle, name, avatar_url } = req.body;
    const result = db.prepare("INSERT INTO channels (user_id, platform, handle, name, avatar_url) VALUES (?, ?, ?, ?, ?)")
      .run(1, platform, handle, name, avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`);
    res.json({ id: result.lastInsertRowid });
  });
  
  app.delete("/api/channels/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM channels WHERE id = ? AND user_id = 1").run(id);
    res.json({ status: "success" });
  });

  app.get("/api/analytics/follower-growth", (req, res) => {
    const { platform, days } = req.query;
    let query = "SELECT * FROM follower_growth WHERE user_id = 1";
    const params: any[] = [];

    if (platform && platform !== 'all') {
      query += " AND platform = ?";
      params.push(platform);
    }

    if (days && days !== 'all') {
      const daysInt = parseInt(days as string);
      const date = new Date();
      date.setDate(date.getDate() - daysInt);
      query += " AND date >= ?";
      params.push(date.toISOString().split('T')[0]);
    }

    query += " ORDER BY date ASC";
    const data = db.prepare(query).all(...params);
    res.json(data);
  });

  app.post("/api/analytics/follower-growth", (req, res) => {
    const { platform, count, date } = req.body;
    const result = db.prepare("INSERT INTO follower_growth (user_id, platform, count, date) VALUES (?, ?, ?, ?)")
      .run(1, platform, count, date || new Date().toISOString().split('T')[0]);
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
