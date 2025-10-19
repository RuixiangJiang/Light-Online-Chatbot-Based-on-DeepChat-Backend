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

  // here you can add a check: is req.headers['x-user-id'] mapped with sessionId?
  const messages = await getHistory(sessionId);
  return res.json({ messages });
});

export default router;
