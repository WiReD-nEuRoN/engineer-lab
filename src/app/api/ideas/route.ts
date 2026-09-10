import { NextRequest } from 'next/server';
import { runOpencode } from '@/lib/opencode';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { count = 3, categories = [] } = await req.json();

    const prompt = `Act as a project ideation assistant for a student's engineering portfolio.

Propose ${count} genuinely interesting, technically substantial software or hardware projects. The ideas should build a strong portfolio for college applications and should NOT be trivial (no todo apps, calculators, weather apps, or basic CRUD).

${categories.length ? `Focus on these areas: ${categories.join(', ')}.` : ''}

For each idea, provide a JSON object with exactly these fields and no others:
- name: a concise camelCase project name
- tagline: one sentence
- problem: the problem it solves
- whyItMatters: why the project is worth building
- targetUsers: who it serves
- categories: array of strings
- difficulty: integer 1-10
- estimatedTime: string like "2-3 weeks"
- technologies: array of strings
- portfolioScores: object with keys technicalDifficulty, originality, realWorldImpact, learningValue, portfolioValue, demoPotential, each an integer 1-10
- scoreJustification: short explanation of the scores

Please put the results in a single JSON code block, formatted as an object with an "ideas" array. Do not add any text after the code block.

Important: be honest about what is a prototype vs a validated system. Never claim clinical validation, certification, or production readiness unless that is genuinely true.`;

    const text = await runOpencode({ prompt });

    let ideas: any[] = [];
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fence ? fence[1] : text;
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) ideas = parsed;
      else if (Array.isArray(parsed.ideas)) ideas = parsed.ideas;
      else ideas = [parsed];
    } catch {
      try {
        const arrMatch = jsonText.match(/\[[\s\S]*\]/);
        if (arrMatch) ideas = JSON.parse(arrMatch[0]);
        else throw new Error('no array match');
      } catch (e2: any) {
        throw new Error(`Could not parse ideas from opencode output: ${e2.message}. Raw text preview: ${text.slice(0, 1500)}`);
      }
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