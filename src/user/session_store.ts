import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import crypto from 'crypto';

type SessionMap = Record<string, string>; // userId -> sessionId

const FILE = resolve(process.cwd(), 'data/sessions.json');
let cache: SessionMap | null = null;

async function ensureLoaded() {
  if (cache) return;
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    cache = JSON.parse(raw) as SessionMap;
  } catch {
    cache = {};
  }
}

async function persist() {
  await fs.mkdir(dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function newSessionId() {
  return 'sess_' + crypto.randomBytes(12).toString('base64url');
}

export async function getOrCreateSession(userId: string) {
  await ensureLoaded();
  const id = userId.trim();
  let sessionId = cache![id];
  let created = false;
  if (!sessionId) {
    sessionId = newSessionId();
    cache![id] = sessionId;
    created = true;
    await persist();
  }
  return { sessionId, created };
}

export async function getSession(userId: string) {
  await ensureLoaded();
  return cache![userId.trim()] ?? null;
}
