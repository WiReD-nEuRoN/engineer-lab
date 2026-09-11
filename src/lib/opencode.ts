import { spawn } from 'child_process';

const OPENCODE_BIN = process.env.OPENCODE_BIN || 'C:\\Users\\aayus\\AppData\\Roaming\\npm\\node_modules\\opencode-ai\\bin\\opencode.exe';
const DEFAULT_MODEL = process.env.OPENCODE_MODEL || 'nvidia/deepseek-ai/deepseek-v4-pro-0813';
const DEFAULT_AGENT = process.env.OPENCODE_AGENT || '';

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
    const args = ['run', '--format', 'json', '--auto'];
    args.push('--model', model || DEFAULT_MODEL);
    if (agent || DEFAULT_AGENT) args.push('--agent', agent || DEFAULT_AGENT);
    if (dir) args.push('--dir', dir);
    args.push(prompt);

    const proc = spawn(OPENCODE_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    const timeoutMs = Number(process.env.OPENCODE_TIMEOUT_MS) || 300000;
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`opencode timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    let buffer = '';
    let stderr = '';
    const texts: string[] = [];
    const errors: string[] = [];

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
          if (ev.type === 'error' && ev.error) errors.push(JSON.stringify(ev.error));
        } catch {
          // ignore non-JSON lines
        }
      }
    });
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (errors.length) reject(new Error(`opencode error: ${errors.join('\n')}`));
      else if (code === 0) {
        if (!texts.join('').trim()) reject(new Error('opencode returned no text output'));
        else resolve(texts.join('\n'));
      } else reject(new Error(`opencode exited ${code}: ${stderr || texts.join('\n')}`));
    });
    proc.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

