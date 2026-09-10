import { NextRequest } from 'next/server';
import { spawn } from 'child_process';

const OPENCODE_BIN = process.env.OPENCODE_BIN || 'C:\\Users\\aayus\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe';

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
      const proc = spawn(OPENCODE_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true });
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
