'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setIdeas(data.ideas);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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
          {ideas.map((i, idx) => (
            <div key={idx} className="rounded-lg border border-zinc-800 p-4 bg-zinc-900">
              <h2 className="font-semibold">{i.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">{i.tagline}</p>
              <p className="text-xs text-zinc-500 mt-2">Difficulty: {i.difficulty}/10 • {i.estimatedTime}</p>
              <p className="text-xs text-zinc-500">Tech: {(i.technologies || []).join(', ')}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
