import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { runOpencode } from '@/lib/opencode';
import { extractJson } from '@/lib/json';

export async function POST(req: NextRequest) {
  try {
    const { ideaId } = await req.json();
    const ideaRow = db.prepare('SELECT * FROM ideas WHERE id = ?').get(ideaId) as any;
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

    const prompt = `Act as a senior software architect. Write a thorough project specification based on this idea:

${JSON.stringify(idea, null, 2)}

Provide a single JSON object (no extra text) with exactly these keys:
- overview: string
- problemStatement: string
- goals: array of strings
- nonGoals: array of strings
- targetUsers: string
- features: array of strings
- technologyStack: array of strings
- systemArchitecture: string
- folderStructure: string
- milestones: array of { title: string, description: string }
- testingStrategy: string
- documentationStrategy: string
- futureImprovements: array of strings

Put the result in a single JSON code block.`;

    const text = await runOpencode({ prompt });
    const spec = extractJson(text);

    const insert = db.prepare('INSERT INTO projects (ideaId, spec, status) VALUES (?, ?, ?)');
    const info = insert.run(ideaId, JSON.stringify(spec), 'spec_pending');
    const projectId = info.lastInsertRowid;

    return Response.json({ projectId, spec });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}