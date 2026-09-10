import { db } from '@/lib/db';

export async function GET() {
  const rows = db.prepare('SELECT id, name, tagline, difficulty, estimatedTime, technologies FROM ideas ORDER BY createdAt DESC LIMIT 50').all();
  const ideas = (rows as any[]).map(r => ({
    ...r,
    technologies: (() => { try { return JSON.parse(r.technologies || '[]').join(', '); } catch { return '' } })()
  }));
  return Response.json({ ideas });
}
