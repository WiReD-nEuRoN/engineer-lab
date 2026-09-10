'use client';

import { useEffect, useState } from 'react';

type Idea = {
  id: number;
  name: string;
  tagline: string;
  difficulty: number;
  estimatedTime: string;
  technologies: string;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadIdeas = async () => {
    const res = await fetch('/api/ideas/list');
    const data = await res.json();
    setIdeas(data.ideas || []);
  };

  useEffect(() => { loadIdeas(); }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3, categories: ['AI','Computer Vision'] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await loadIdeas();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startProject = async (ideaId: number) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      alert(`Project ${data.projectId} created. Spec generated.`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-semibold">Engineer Lab</h1>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={generate} disabled={loading} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate Ideas'}
          </button>
          <span className="text-sm text-zinc-400">Uses opencode to generate ideas</span>
        </div>
        {error && <div className="text-red-400 mb-4">{error}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((i) => (
            <div key={i.id} className="rounded-lg border border-zinc-800 p-4 bg-zinc-900">
              <h2 className="font-semibold">{i.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">{i.tagline}</p>
              <p className="text-xs text-zinc-500 mt-2">Difficulty: {i.difficulty}/10 • {i.estimatedTime}</p>
              <p className="text-xs text-zinc-500">Tech: {i.technologies}</p>
              <button onClick={() => startProject(i.id)} className="mt-3 text-xs px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Start Project</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
