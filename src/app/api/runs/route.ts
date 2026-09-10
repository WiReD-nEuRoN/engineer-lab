import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const prompt = url.searchParams.get('prompt') || 'Explain async/await in JavaScript';
  const dir = url.searchParams.get('dir') || undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const push = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      push(JSON.stringify({ event: 'start', prompt }));
      const args = ['run'];
      if (dir) args.push('--dir', dir);
      args.push(prompt);
      const proc = spawn('opencode', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      proc.stdout.on('data', d => push(d.toString()));
      proc.stderr.on('data', d => push('ERR: ' + d.toString()));
      proc.on('close', code => {
        push(JSON.stringify({ event: 'end', code }));
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
  });
}
