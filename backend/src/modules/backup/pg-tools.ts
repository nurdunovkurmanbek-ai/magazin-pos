import { spawn } from 'child_process';
import { env } from '../../config/env';

const DOCKER_CONTAINER = 'magazin_pos_db';

export interface DbConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

export function parseDatabaseUrl(url: string): DbConfig {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

function runCommand(
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; stdin?: NodeJS.ReadableStream } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      env: { ...process.env, ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    if (options.stdin) {
      options.stdin.pipe(proc.stdin);
      options.stdin.on('end', () => proc.stdin.end());
    } else {
      proc.stdin.end();
    }

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `Command failed: ${command} (code ${code})`));
    });
  });
}

async function tryDockerDump(db: DbConfig): Promise<string | null> {
  try {
    const { stdout } = await runCommand('docker', [
      'exec', DOCKER_CONTAINER,
      'pg_dump', '-U', db.user, '-d', db.database,
      '--no-owner', '--no-acl', '--clean', '--if-exists',
    ]);
    return stdout;
  } catch {
    return null;
  }
}

async function tryLocalDump(db: DbConfig): Promise<string> {
  const { stdout } = await runCommand('pg_dump', [
    '-h', db.host, '-p', db.port, '-U', db.user, '-d', db.database,
    '--no-owner', '--no-acl', '--clean', '--if-exists',
  ], { env: { PGPASSWORD: db.password } });
  return stdout;
}

export async function dumpDatabase(): Promise<string> {
  const db = parseDatabaseUrl(env.database.url);
  const dockerResult = await tryDockerDump(db);
  if (dockerResult) return dockerResult;
  return tryLocalDump(db);
}

async function tryDockerRestore(db: DbConfig, sql: string): Promise<boolean> {
  try {
    const { Readable } = await import('stream');
    const stream = Readable.from([sql]);
    await runCommand('docker', [
      'exec', '-i', DOCKER_CONTAINER,
      'psql', '-U', db.user, '-d', db.database, '-v', 'ON_ERROR_STOP=1',
    ], { stdin: stream });
    return true;
  } catch {
    return false;
  }
}

async function tryLocalRestore(db: DbConfig, sql: string): Promise<void> {
  const { Readable } = await import('stream');
  const stream = Readable.from([sql]);
  await runCommand('psql', [
    '-h', db.host, '-p', db.port, '-U', db.user, '-d', db.database, '-v', 'ON_ERROR_STOP=1',
  ], { env: { PGPASSWORD: db.password }, stdin: stream });
}

export async function restoreDatabase(sql: string): Promise<void> {
  const db = parseDatabaseUrl(env.database.url);
  const dockerOk = await tryDockerRestore(db, sql);
  if (dockerOk) return;
  await tryLocalRestore(db, sql);
}
