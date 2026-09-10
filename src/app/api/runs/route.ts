import { NextRequest } from 'next/server';
import { streamOpencode } from '@/lib/opencode';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const prompt = url.searchParams.get('prompt') || 'Explain async/await in JavaScript';
  const dir = url.searchParams.get('dir') || undefined;
  const agent = url.searchParams.get('agent') || undefined;
  const model = url.searchParams.get('model') || undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const push = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      push(JSON.stringify({ event: 'start', prompt }));
      streamOpencode(
        { prompt, dir, agent, model },
        (text) => push(JSON.stringify({ event: 'text', text })),
        (code) => {
          push(JSON.stringify({ event: 'end', code }));
          controller.close();
        }
      );
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
  });
}