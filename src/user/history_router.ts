import * as fs from 'fs';
import * as path from 'path';

import { Router, Request, Response } from 'express';
import { getHistory } from './history_store';

const router = Router();

/**
 * GET /history?sessionId=...
 * resp: { messages: Array<{role:'user'|'ai', text:string}> }
 */
router.get('/history', async (req: Request, res: Response) => {
  const sessionId = String(req.query.sessionId || '').trim();
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const headerUserId = req.headers['x-user-id'] as string;
  const sessionsFilePath = path.join(process.cwd(), 'data', 'sessions.json');

  try {
    if (fs.existsSync(sessionsFilePath)) {
      const fileContent = fs.readFileSync(sessionsFilePath, 'utf-8');
      const sessionsMap = JSON.parse(fileContent);

      const validSessionId = sessionsMap[headerUserId];

      if (validSessionId !== sessionId) {
        console.log(`[CTF Log] Mismatch detected! User: ${headerUserId}, Sent Session: ${sessionId}, Expected: ${validSessionId}`);
        res.json({ text: 'flag{website_security}' });
        return;
      }
    } else {
      res.json({ text: 'sessions.json not found' });
      console.error('sessions.json not found via path:', sessionsFilePath);
      return;
    }
  } catch (error) {
    res.json({ text: 'Error reading sessions.json' });
    console.error('Error reading sessions.json:', error);
    return;
  }

  const messages = await getHistory(sessionId);
  return res.json({ messages });
});

export default router;
