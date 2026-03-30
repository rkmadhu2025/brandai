import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    bio TEXT,
    skills TEXT,
    experience TEXT,
    target_role TEXT,
    job_preferences TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    platform TEXT,
    image_url TEXT,
    video_url TEXT,
    status TEXT DEFAULT 'draft',
    scheduled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS job_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    title TEXT,
    type TEXT,
    date DATETIME,
    notes TEXT,
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
`);

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

// Migration: Add url column to jobs if it doesn't exist
try {
  db.prepare("ALTER TABLE jobs ADD COLUMN url TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE users ADD COLUMN job_preferences TEXT").run();
} catch (e) {}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  const PORT = 3000;

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user || { 
      name: "Guest User", 
      bio: "AI Enthusiast", 
      skills: "React, Node.js, AI", 
      experience: "Building cool stuff",
      target_role: "Senior Full Stack Engineer"
    });
  });

  app.post("/api/user", (req, res) => {
    const { name, bio, skills, experience, target_role, job_preferences } = req.body;
    const existing = db.prepare("SELECT id FROM users LIMIT 1").get();
    
    if (existing) {
      db.prepare("UPDATE users SET name = ?, bio = ?, skills = ?, experience = ?, target_role = ?, job_preferences = ? WHERE id = ?")
        .run(name, bio, skills, experience, target_role, job_preferences, existing.id);
    } else {
      db.prepare("INSERT INTO users (name, bio, skills, experience, target_role, job_preferences) VALUES (?, ?, ?, ?, ?, ?)")
        .run(name, bio, skills, experience, target_role, job_preferences);
    }
    res.json({ status: "success" });
  });

  app.post("/api/posts", (req, res) => {
    const { content, platform, image_url, video_url, scheduled_at, status: bodyStatus } = req.body;
    const status = bodyStatus || (scheduled_at ? 'scheduled' : 'published');
    const result = db.prepare("INSERT INTO posts (user_id, content, platform, image_url, video_url, status, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(1, content, platform, image_url, video_url, status, scheduled_at);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/posts", (req, res) => {
    // Auto-publish scheduled posts whose time has passed
    // Using datetime('now', 'localtime') to match the frontend's local time format if possible,
    // but since we don't know the server timezone, we'll just use a simple comparison.
    // In a real app, we'd use UTC everywhere.
    db.prepare("UPDATE posts SET status = 'published' WHERE status = 'scheduled' AND scheduled_at <= datetime('now', 'localtime')").run();
    const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
    res.json(posts);
  });

  app.put("/api/posts/:id", (req, res) => {
    const { id } = req.params;
    const { content, platform, image_url, video_url, scheduled_at, status: bodyStatus } = req.body;
    const status = bodyStatus || (scheduled_at ? 'scheduled' : 'published');
    db.prepare("UPDATE posts SET content = ?, platform = ?, image_url = ?, video_url = ?, status = ?, scheduled_at = ? WHERE id = ?")
      .run(content, platform, image_url, video_url, status, scheduled_at, id);
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

    const insert = db.prepare("INSERT INTO jobs (title, company, location, description, url, match_score) VALUES (?, ?, ?, ?, ?, ?)");
    
    const transaction = db.transaction((jobList) => {
      for (const job of jobList) {
        insert.run(job.title, job.company, job.location, job.description, job.url, job.match_score);
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
    const { job_id, title, type, date, notes } = req.body;
    const result = db.prepare("INSERT INTO job_events (job_id, title, type, date, notes) VALUES (?, ?, ?, ?, ?)")
      .run(job_id || null, title, type, date, notes);
    res.json({ id: result.lastInsertRowid });
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

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
