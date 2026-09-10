import { NextRequest } from 'next/server';
import { runOpencode } from '@/lib/opencode';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { count = 3, categories = [] } = await req.json();
    const prompt = `
You are a project idea generator for an engineering portfolio.

Generate ${count} high-quality software/hardware project ideas in JSON format.
Return only a JSON array of objects, no prose.

Each object must have:
name, tagline, problem, whyItMatters, targetUsers, categories (array), difficulty (1-10), estimatedTime, technologies (array), portfolioScores {technicalDifficulty, originality, realWorldImpact, learningValue, portfolioValue, demoPotential}, scoreJustification

Constraints:
- Avoid trivial projects like todo apps, calculators, weather apps, basic CRUD.
- Ideas should be technically interesting and progressively difficult.
- If categories provided: ${categories.join(', ')}
- Distinguish prototypes from validated medical systems. Never claim clinical validation or certification unless true.

Return valid JSON only.
    `;

    const raw = await runOpencode({ prompt });
    let ideas: any[] = [];
    try {
      const parsed = JSON.parse(raw);
      ideas = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // fallback: try extract first JSON array
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) ideas = JSON.parse(match[0]);
      else throw new Error('opencode did not return valid JSON');
    }

    const stmt = db.prepare(`
      INSERT INTO ideas (name, tagline, problem, whyItMatters, targetUsers, categories, difficulty, estimatedTime, technologies, portfolioScores, scoreJustification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const inserted = ideas.map(i => {
      stmt.run(
        i.name,
        i.tagline,
        i.problem,
        i.whyItMatters,
        i.targetUsers,
        JSON.stringify(i.categories || []),
        i.difficulty,
        i.estimatedTime,
        JSON.stringify(i.technologies || []),
        JSON.stringify(i.portfolioScores || {}),
        i.scoreJustification
      );
      return i;
    });

    return Response.json({ ideas: inserted });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
