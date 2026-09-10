import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { runOpencode } from '@/lib/opencode';

export async function POST(req: NextRequest) {
  try {
    const { ideaId } = await req.json();
    const ideaRow = db.prepare('SELECT * FROM ideas WHERE id = ?').get(ideaId);
    if (!ideaRow) return Response.json({ error: 'Idea not found' }, { status: 404 });

    const idea = {
      name: ideaRow.name,
      tagline: ideaRow.tagline,
      problem: ideaRow.problem,
      targetUsers: ideaRow.targetUsers,
      categories: JSON.parse(ideaRow.categories || '[]'),
      technologies: JSON.parse(ideaRow.technologies || '[]'),
      difficulty: ideaRow.difficulty,
      estimatedTime: ideaRow.estimatedTime,
    };

    const prompt = `
You are a senior software architect. Create a detailed project specification for the following idea.

Idea:
${JSON.stringify(idea, null, 2)}

Return ONLY a JSON object with keys:
overview, problemStatement, goals, nonGoals, targetUsers, features (array), technologyStack, systemArchitecture, folderStructure, milestones (array of {title, description}), testingStrategy, documentationStrategy, futureImprovements

No prose outside JSON.
    `;

    const raw = await runOpencode({ prompt });
    const match = raw.match(/\{[\s\S]*\}/);
    const spec = match ? JSON.parse(match[0]) : JSON.parse(raw);

    const insert = db.prepare('INSERT INTO projects (ideaId, spec, status) VALUES (?, ?, ?)');
    const info = insert.run(ideaId, JSON.stringify(spec), 'spec_pending');
    const projectId = info.lastInsertRowid;

    return Response.json({ projectId, spec });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
