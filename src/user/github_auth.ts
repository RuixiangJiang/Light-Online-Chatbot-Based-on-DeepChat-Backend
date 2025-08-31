import { Router, Request, Response, NextFunction } from 'express';
import { getOrCreateSession } from './session_store';

const router = Router();
router.post('/auth/github/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code: string = req.body?.code;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const client_id = process.env.GITHUB_CLIENT_ID!;
    const client_secret = process.env.GITHUB_CLIENT_SECRET!;
    const redirect_uri = process.env.GITHUB_CALLBACK_URL || undefined;

    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id,
        client_secret,
        code,
        ...(redirect_uri ? { redirect_uri } : {})
      })
    });
    const tokenJson: any = await tokenResp.json();
    if (!tokenResp.ok || !tokenJson.access_token) {
      return res.status(400).json({ error: 'Failed to exchange token' });
    }

    const emailResp = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'simple-demo'
      }
    });

    interface GitHubEmail {
      email: string;
      primary?: boolean;
      verified?: boolean;
      visibility?: string | null;
    }
    const emails = (await emailResp.json()) as GitHubEmail[];
    if (!emailResp.ok || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'Failed to fetch emails' });
    }

    const pick =
      emails.find(e => e.primary && e.verified)?.email ||
      emails.find(e => e.verified)?.email ||
      emails[0].email;
    if (!pick) return res.status(400).json({ error: 'No email available' });

    const userId = String(pick);

    console.log('Email from Github is: ' + userId);

    const { sessionId } = await getOrCreateSession(userId);

    return res.json({ ok: true, userId, sessionId });
  } catch (e) {
    return next(e);
  }
});

export default router;
