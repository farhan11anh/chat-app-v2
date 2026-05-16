export interface User {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: number;
}

export interface Conversation {
  id: number;
  user_a: number;
  user_b: number;
  created_at: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  attachment_url: string | null;
  sent_at: number;
}

export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  return db
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first<User>();
}

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function createUser(
  db: D1Database,
  username: string,
  displayName: string,
  passwordHash: string
): Promise<User> {
  const result = await db
    .prepare('INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?) RETURNING *')
    .bind(username, displayName, passwordHash)
    .first<User>();
  return result!;
}

export async function updateDisplayName(db: D1Database, userId: number, displayName: string) {
  await db
    .prepare('UPDATE users SET display_name = ? WHERE id = ?')
    .bind(displayName, userId)
    .run();
}

export async function getAllUsersExcept(db: D1Database, userId: number): Promise<User[]> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id != ? ORDER BY display_name')
    .bind(userId)
    .all<User>();
  return result.results;
}

export async function getOrCreateConversation(
  db: D1Database,
  userA: number,
  userB: number
): Promise<Conversation> {
  const minId = Math.min(userA, userB);
  const maxId = Math.max(userA, userB);

  const existing = await db
    .prepare('SELECT * FROM conversations WHERE user_a = ? AND user_b = ?')
    .bind(minId, maxId)
    .first<Conversation>();

  if (existing) return existing;

  const created = await db
    .prepare('INSERT INTO conversations (user_a, user_b) VALUES (?, ?) RETURNING *')
    .bind(minId, maxId)
    .first<Conversation>();
  return created!;
}

export async function getMessages(
  db: D1Database,
  conversationId: number,
  limit = 50
): Promise<Message[]> {
  const result = await db
    .prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at DESC, id DESC LIMIT ?'
    )
    .bind(conversationId, limit)
    .all<Message>();
  return result.results.reverse();
}

export async function getNewMessages(
  db: D1Database,
  conversationId: number,
  afterId: number
): Promise<Message[]> {
  const result = await db
    .prepare(
      'SELECT * FROM messages WHERE conversation_id = ? AND id > ? ORDER BY sent_at ASC, id ASC'
    )
    .bind(conversationId, afterId)
    .all<Message>();
  return result.results;
}

export async function insertMessage(
  db: D1Database,
  conversationId: number,
  senderId: number,
  content: string
): Promise<Message> {
  const result = await db
    .prepare(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?) RETURNING *'
    )
    .bind(conversationId, senderId, content)
    .first<Message>();
  return result!;
}

export interface ContactInfo {
  id: number;
  username: string;
  display_name: string;
  last_message: string | null;
  last_time: number | null;
  unread_count: number;
}

export async function getContacts(db: D1Database, userId: number): Promise<ContactInfo[]> {
  const users = await getAllUsersExcept(db, userId);

  const contacts: ContactInfo[] = [];
  for (const user of users) {
    const minId = Math.min(userId, user.id);
    const maxId = Math.max(userId, user.id);

    const conv = await db
      .prepare('SELECT id FROM conversations WHERE user_a = ? AND user_b = ?')
      .bind(minId, maxId)
      .first<{ id: number }>();

    let lastMessage: string | null = null;
    let lastTime: number | null = null;
    let unreadCount = 0;

    if (conv) {
      const last = await db
        .prepare(
          'SELECT content, sent_at FROM messages WHERE conversation_id = ? ORDER BY sent_at DESC, id DESC LIMIT 1'
        )
        .bind(conv.id)
        .first<{ content: string; sent_at: number }>();

      if (last) {
        lastMessage = last.content;
        lastTime = last.sent_at;
      }

      const unread = await db
        .prepare(
          'SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ? AND sender_id = ?'
        )
        .bind(conv.id, user.id)
        .first<{ cnt: number }>();
      unreadCount = unread?.cnt || 0;
    }

    contacts.push({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      last_message: lastMessage,
      last_time: lastTime,
      unread_count: unreadCount,
    });
  }

  contacts.sort((a, b) => (b.last_time || 0) - (a.last_time || 0));
  return contacts;
}
