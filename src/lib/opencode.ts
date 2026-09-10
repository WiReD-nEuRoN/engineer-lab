import { spawn } from 'child_process';

const OPENCODE_BIN = process.env.OPENCODE_BIN || 'C:\\Users\\aayus\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe';

export type OpencodeRunOptions = {
  prompt: string;
  dir?: string;
  model?: string;
  agent?: string;
};

export interface OpencodeEvent {
  type: string;
  text?: string;
  [k: string]: any;
}

/**
 * Runs opencode in non-interactive mode and resolves with the concatenated
 * text content from its JSON event stream.
 */
export function runOpencode({ prompt, dir, model, agent }: OpencodeRunOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['run', '--format', 'json'];
    if (model) args.push('--model', model);
    if (agent) args.push('--agent', agent);
    if (dir) args.push('--dir', dir);
    args.push(prompt);

    const proc = spawn(OPENCODE_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let buffer = '';
    let stderr = '';
    const texts: string[] = [];

    proc.stdout.on('data', (d) => {
      buffer += d.toString();
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          const ev: OpencodeEvent = JSON.parse(line);
          if (ev.type === 'text' && ev.text) texts.push(ev.text);
        } catch {
          // ignore non-JSON lines
        }
      }
    });
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code === 0) resolve(texts.join('\n'));
      else reject(new Error(`opencode exited ${code}: ${stderr || texts.join('\n')}`));
    });
    proc.on('error', (err) => reject(err));
  });
}

/**
 * Stream variant: emits text events via a callback. Used by the SSE route.
 */
export function streamOpencode(
  { prompt, dir, model, agent }: OpencodeRunOptions,
  onText: (chunk: string) => void,
  onDone: (code: number | null) => void
) {
  const args = ['run', '--format', 'json'];
  if (model) args.push('--model', model);
  if (agent) args.push('--agent', agent);
  if (dir) args.push('--dir', dir);
  args.push(prompt);

  const proc = spawn(OPENCODE_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  let buffer = '';
  proc.stdout.on('data', (d) => {
    buffer += d.toString();
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const ev: OpencodeEvent = JSON.parse(line);
        if (ev.type === 'text' && ev.text) onText(ev.text);
      } catch {
        // ignore
      }
    }
  });

  proc.on('close', (code) => onDone(code));
  proc.on('error', () => onDone(null));

  return proc;
}