import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  type SessionData,
} from './auth';
import {
  getUserByUsername,
  getUserById,
  createUser,
  updateDisplayName,
  getOrCreateConversation,
  getMessages,
  getNewMessages,
  insertMessage,
  getContacts,
} from './db';
import { loginPage } from './html/login';
import { registerPage } from './html/register';
import { chatPage, settingsPage } from './html/chat';

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
}

const app = new Hono<{ Bindings: Env; Variables: { session: SessionData } }>();

// Session middleware helper
async function getSession(
  cookie: string | undefined,
  secret: string
): Promise<SessionData | null> {
  if (!cookie) return null;
  return verifySessionToken(cookie, secret);
}

// --- Public routes ---

app.get('/', (c) => c.redirect('/login'));

app.get('/login', (c) => c.html(loginPage()));

app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const username = (body['username'] as string || '').trim();
  const password = body['password'] as string || '';

  if (!username || !password) {
    return c.html(loginPage('Please fill in all fields'));
  }

  const user = await getUserByUsername(c.env.DB, username);
  if (!user) {
    return c.html(loginPage('Invalid username or password'));
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.html(loginPage('Invalid username or password'));
  }

  const token = await createSessionToken(
    { userId: user.id, username: user.username, displayName: user.display_name },
    c.env.SESSION_SECRET || 'default-secret-change-me'
  );

  setCookie(c, 'session', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.redirect('/chat');
});

app.get('/register', (c) => c.html(registerPage()));

app.post('/register', async (c) => {
  const body = await c.req.parseBody();
  const username = (body['username'] as string || '').trim().toLowerCase();
  const displayName = (body['display_name'] as string || '').trim();
  const password = body['password'] as string || '';

  if (!username || !displayName || !password) {
    return c.html(registerPage('Please fill in all fields'));
  }

  if (username.length < 3) {
    return c.html(registerPage('Username must be at least 3 characters'));
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return c.html(registerPage('Username can only contain letters, numbers, and underscores'));
  }

  if (password.length < 6) {
    return c.html(registerPage('Password must be at least 6 characters'));
  }

  const existing = await getUserByUsername(c.env.DB, username);
  if (existing) {
    return c.html(registerPage('Username is already taken'));
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(c.env.DB, username, displayName, passwordHash);

  const token = await createSessionToken(
    { userId: user.id, username: user.username, displayName: user.display_name },
    c.env.SESSION_SECRET || 'default-secret-change-me'
  );

  setCookie(c, 'session', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.redirect('/chat');
});

app.get('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' });
  return c.redirect('/login');
});

// --- Auth middleware for protected routes ---

app.use('/chat/*', async (c, next) => {
  const cookie = getCookie(c, 'session');
  const session = await getSession(cookie, c.env.SESSION_SECRET || 'default-secret-change-me');
  if (!session) return c.redirect('/login');
  c.set('session', session);
  await next();
});

app.use('/chat', async (c, next) => {
  const cookie = getCookie(c, 'session');
  const session = await getSession(cookie, c.env.SESSION_SECRET || 'default-secret-change-me');
  if (!session) return c.redirect('/login');
  c.set('session', session);
  await next();
});

app.use('/settings', async (c, next) => {
  const cookie = getCookie(c, 'session');
  const session = await getSession(cookie, c.env.SESSION_SECRET || 'default-secret-change-me');
  if (!session) return c.redirect('/login');
  c.set('session', session);
  await next();
});

app.use('/api/*', async (c, next) => {
  const cookie = getCookie(c, 'session');
  const session = await getSession(cookie, c.env.SESSION_SECRET || 'default-secret-change-me');
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  c.set('session', session);
  await next();
});

// --- Protected routes ---

app.get('/chat', async (c) => {
  const session = c.get('session');
  const contacts = await getContacts(c.env.DB, session.userId);

  return c.html(
    chatPage({
      currentUser: { id: session.userId, username: session.username, displayName: session.displayName },
      contacts,
      activeContact: null,
      messages: [],
    })
  );
});

app.get('/chat/:userId', async (c) => {
  const session = c.get('session');
  const targetId = parseInt(c.req.param('userId'), 10);

  if (isNaN(targetId) || targetId === session.userId) {
    return c.redirect('/chat');
  }

  const targetUser = await getUserById(c.env.DB, targetId);
  if (!targetUser) return c.redirect('/chat');

  const conversation = await getOrCreateConversation(c.env.DB, session.userId, targetId);
  const messages = await getMessages(c.env.DB, conversation.id, 50);
  const contacts = await getContacts(c.env.DB, session.userId);

  return c.html(
    chatPage({
      currentUser: { id: session.userId, username: session.username, displayName: session.displayName },
      contacts,
      activeContact: {
        id: targetUser.id,
        username: targetUser.username,
        display_name: targetUser.display_name,
      },
      messages,
    })
  );
});

app.post('/chat/:userId/send', async (c) => {
  const session = c.get('session');
  const targetId = parseInt(c.req.param('userId'), 10);

  if (isNaN(targetId) || targetId === session.userId) {
    return c.json({ ok: false, error: 'Invalid target' }, 400);
  }

  const targetUser = await getUserById(c.env.DB, targetId);
  if (!targetUser) {
    return c.json({ ok: false, error: 'User not found' }, 404);
  }

  const body = await c.req.json<{ content: string }>();
  const content = (body.content || '').trim();

  if (!content) {
    return c.json({ ok: false, error: 'Message cannot be empty' }, 400);
  }

  if (content.length > 2000) {
    return c.json({ ok: false, error: 'Message too long' }, 400);
  }

  const conversation = await getOrCreateConversation(c.env.DB, session.userId, targetId);
  const message = await insertMessage(c.env.DB, conversation.id, session.userId, content);

  return c.json({ ok: true, message });
});

// SSE endpoint
app.get('/chat/:userId/events', async (c) => {
  const session = c.get('session');
  const targetId = parseInt(c.req.param('userId'), 10);
  const lastId = parseInt(c.req.query('lastId') || '0', 10);

  if (isNaN(targetId) || targetId === session.userId) {
    return c.text('Invalid', 400);
  }

  const targetUser = await getUserById(c.env.DB, targetId);
  if (!targetUser) return c.text('Not found', 404);

  const conversation = await getOrCreateConversation(c.env.DB, session.userId, targetId);

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  let currentLastId = lastId;
  let running = true;

  async function poll() {
    try {
      const newMessages = await getNewMessages(c.env.DB, conversation.id, currentLastId);
      for (const msg of newMessages) {
        await writer.write(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        currentLastId = msg.id;
      }
      if (!newMessages.length) {
        await writer.write(encoder.encode(`: keepalive\n\n`));
      }
    } catch (e) {
      running = false;
    }
  }

  // Initial poll + periodic polling
  const intervalId = setInterval(async () => {
    if (!running) {
      clearInterval(intervalId);
      try { await writer.close(); } catch {}
      return;
    }
    await poll();
  }, 2000);

  // First immediate poll
  await poll();

  // Close after 30 seconds to avoid long-running connections on free tier
  setTimeout(async () => {
    running = false;
    clearInterval(intervalId);
    try { await writer.close(); } catch {}
  }, 30000);

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

// API contacts
app.get('/api/contacts', async (c) => {
  const session = c.get('session');
  const contacts = await getContacts(c.env.DB, session.userId);
  return c.json(contacts);
});

// Settings
app.get('/settings', async (c) => {
  const session = c.get('session');
  return c.html(
    settingsPage({ displayName: session.displayName, username: session.username, id: session.userId })
  );
});

app.post('/settings', async (c) => {
  const session = c.get('session');
  const body = await c.req.parseBody();
  const displayName = (body['display_name'] as string || '').trim();

  if (!displayName) {
    return c.html(
      settingsPage(
        { displayName: session.displayName, username: session.username, id: session.userId },
        false,
        'Display name cannot be empty'
      )
    );
  }

  await updateDisplayName(c.env.DB, session.userId, displayName);

  // Update session cookie with new display name
  const token = await createSessionToken(
    { userId: session.userId, username: session.username, displayName },
    c.env.SESSION_SECRET || 'default-secret-change-me'
  );

  setCookie(c, 'session', token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.html(
    settingsPage({ displayName, username: session.username, id: session.userId }, true)
  );
});

export default app;
