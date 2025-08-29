import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';

export type ChatMsg = { role: 'user' | 'ai'; text: string };
type HistoryMap = Record<string, ChatMsg[]>; // sessionId -> messages

const FILE = resolve(process.cwd(), 'data/history.json');
let cache: HistoryMap | null = null;

async function ensureLoaded() {
  if (cache) return;
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    cache = JSON.parse(raw) as HistoryMap;
  } catch {
    cache = {};
  }
}
async function persist() {
  await fs.mkdir(dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cache, null, 2), 'utf8');
}

export async function getHistory(sessionId: string): Promise<ChatMsg[]> {
  await ensureLoaded();
  return cache![sessionId] ?? [];
}

export async function appendInteraction(sessionId: string, userText: string, aiText: string) {
  await ensureLoaded();
  if (!cache![sessionId]) cache![sessionId] = [];
  if (userText) cache![sessionId].push({ role: 'user', text: userText });
  if (aiText)   cache![sessionId].push({ role: 'ai',   text: aiText });
  await persist();
}
