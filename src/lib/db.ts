import Database from 'better-sqlite3';
import { join } from 'path';
import fs from 'fs';

const DB_DIR = join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = join(DB_DIR, 'app.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tagline TEXT,
      problem TEXT,
      whyItMatters TEXT,
      targetUsers TEXT,
      categories TEXT,
      difficulty INTEGER,
      estimatedTime TEXT,
      technologies TEXT,
      portfolioScores TEXT,
      scoreJustification TEXT,
      status TEXT DEFAULT 'generated',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ideaId INTEGER,
      spec TEXT,
      status TEXT DEFAULT 'spec_pending',
      workspacePath TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ideaId) REFERENCES ideas(id)
    );
  `);
}

migrate();
