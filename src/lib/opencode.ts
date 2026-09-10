import { spawn } from 'child_process';

export type OpencodeRunOptions = {
  prompt: string;
  dir?: string;
  model?: string;
  agent?: string;
};

export function runOpencode({ prompt, dir, model, agent }: OpencodeRunOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['run'];
    if (model) args.push('--model', model);
    if (agent) args.push('--agent', agent);
    if (dir) args.push('--dir', dir);
    args.push(prompt);

    const proc = spawn('opencode', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`opencode exited ${code}: ${stderr}`));
    });
  });
}
