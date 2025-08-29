import { Router, Request, Response } from 'express';
import { getOrCreateSession } from './session_store';

const router = Router();

/**
 * POST /users/identify
 * body: { userId: string }
 * resp: { ok: true, userId: string, sessionId: string }
 */
router.post('/users/identify', async (req: Request, res: Response) => {
  const { userId } = req.body ?? {};
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const { sessionId, created } = await getOrCreateSession(userId);
  return res.json({ ok: true, userId: userId.trim(), sessionId, created });
});

export default router;