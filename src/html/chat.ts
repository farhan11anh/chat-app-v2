import { layout } from './layout';

export interface ChatContact {
  id: number;
  username: string;
  display_name: string;
  last_message: string | null;
  last_time: number | null;
  unread_count: number;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  sent_at: number;
}

export interface ChatPageData {
  currentUser: { id: number; username: string; displayName: string };
  contacts: ChatContact[];
  activeContact: { id: number; username: string; display_name: string } | null;
  messages: ChatMessage[];
}

function timeAgo(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function avatarColor(id: number): string {
  const colors = ['#e91e8c', '#7c3aed', '#ff6b35', '#00d084', '#3b82f6', '#f59e0b'];
  return colors[id % colors.length];
}

function avatarSvg(name: string, id: number, size = 40): string {
  const color = avatarColor(id);
  const initial = name.charAt(0).toUpperCase();
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle"
      fill="#fff" font-family="Space Grotesk,sans-serif" font-weight="600"
      font-size="${size * 0.42}">${initial}</text>
  </svg>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function chatPage(data: ChatPageData): string {
  const { currentUser, contacts, activeContact, messages } = data;

  const contactListHtml = contacts
    .map((c) => {
      const isActive = activeContact && c.id === activeContact.id;
      const snippet = c.last_message
        ? escapeHtml(c.last_message.length > 28 ? c.last_message.slice(0, 28) + '…' : c.last_message)
        : '<span style="color:var(--text-muted)">No messages yet</span>';
      const time = c.last_time ? timeAgo(c.last_time) : '';
      const badge = c.unread_count > 0
        ? `<span class="unread-badge">${c.unread_count > 99 ? '99+' : c.unread_count}</span>`
        : '';
      return `
        <a href="/chat/${c.id}" class="contact-item ${isActive ? 'active' : ''}">
          <div class="contact-avatar">${avatarSvg(c.display_name, c.id, 44)}</div>
          <div class="contact-info">
            <div class="contact-top">
              <span class="contact-name">${escapeHtml(c.display_name)}</span>
              <span class="contact-time">${time}</span>
            </div>
            <div class="contact-bottom">
              <span class="contact-snippet">${snippet}</span>
              ${badge}
            </div>
          </div>
        </a>`;
    })
    .join('');

  const messagesHtml = messages
    .map((m, i) => {
      const isSelf = m.sender_id === currentUser.id;
      const senderName = isSelf
        ? currentUser.displayName
        : activeContact?.display_name || 'User';
      const senderId = isSelf ? currentUser.id : activeContact?.id || 0;
      const time = new Date(m.sent_at * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `
        <div class="message-row ${isSelf ? 'sent' : 'received'}" style="animation-delay:${i * 0.05}s" data-msg-id="${m.id}">
          ${!isSelf ? `<div class="msg-avatar">${avatarSvg(senderName, senderId, 32)}</div>` : ''}
          <div class="msg-bubble-wrap">
            <div class="msg-bubble">${escapeHtml(m.content)}</div>
            <div class="msg-time">${time}</div>
          </div>
          ${isSelf ? `<div class="msg-avatar">${avatarSvg(senderName, senderId, 32)}</div>` : ''}
        </div>`;
    })
    .join('');

  const chatTopBar = activeContact
    ? `<div class="chat-topbar">
        <div class="chat-topbar-left">
          ${avatarSvg(activeContact.display_name, activeContact.id, 40)}
          <div>
            <div class="chat-topbar-name">${escapeHtml(activeContact.display_name)}</div>
            <div class="chat-topbar-status"><span class="status-dot"></span> Active Now</div>
          </div>
        </div>
        <div class="chat-topbar-actions">
          <button class="icon-btn" title="Search">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="9" r="6"/><line x1="14" y1="14" x2="19" y2="19"/>
            </svg>
          </button>
        </div>
      </div>`
    : '<div class="chat-topbar"><div class="chat-topbar-name" style="padding:12px">Select a conversation</div></div>';

  const chatInput = activeContact
    ? `<div class="chat-input-bar">
        <button class="icon-btn emoji-btn" id="emojiToggle" title="Emoji">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
        <div id="emojiPicker" class="emoji-picker hidden">
          <div class="emoji-grid">
            ${['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','💯','🙏','✨','💀','🤣','😭','🥺','😤','🫡','💜','🧡'].map(e => `<button class="emoji-item" type="button">${e}</button>`).join('')}
          </div>
        </div>
        <input type="text" id="messageInput" placeholder="Type a message…" autocomplete="off">
        <button class="send-btn" id="sendBtn" title="Send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>`
    : '';

  const profilePanel = activeContact
    ? `<div class="profile-panel">
        <div class="profile-header">
          ${avatarSvg(activeContact.display_name, activeContact.id, 80)}
          <h3>${escapeHtml(activeContact.display_name)}</h3>
          <p class="profile-status"><span class="status-dot"></span> Active Now</p>
          <p class="profile-username">@${escapeHtml(activeContact.username)}</p>
        </div>
        <div class="profile-section">
          <h4>Shared Media</h4>
          <div class="media-grid">
            <div class="media-placeholder"></div>
            <div class="media-placeholder"></div>
            <div class="media-placeholder"></div>
            <div class="media-placeholder"></div>
            <div class="media-placeholder"></div>
            <div class="media-placeholder"></div>
          </div>
        </div>
      </div>`
    : `<div class="profile-panel"><div class="profile-header" style="padding-top:60px">
        ${avatarSvg(currentUser.displayName, currentUser.id, 80)}
        <h3>${escapeHtml(currentUser.displayName)}</h3>
        <p class="profile-username">@${escapeHtml(currentUser.username)}</p>
      </div></div>`;

  const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : 0;

  return layout(
    'Chat',
    `
    <div class="app">
      <!-- Left Icon Rail -->
      <div class="icon-rail">
        <div class="rail-logo">
          <svg width="32" height="32" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="24" fill="url(#gl)"/>
            <path d="M16 20c0-4.4 3.6-8 8-8s8 3.6 8 8v2H16v-2z" fill="#fff" opacity="0.9"/>
            <rect x="14" y="22" width="20" height="14" rx="3" fill="#fff"/>
            <defs><linearGradient id="gl" x1="0" y1="0" x2="48" y2="48">
              <stop stop-color="#e91e8c"/><stop offset="1" stop-color="#7c3aed"/>
            </linearGradient></defs>
          </svg>
        </div>
        <nav class="rail-nav">
          <a href="/chat" class="rail-icon active" title="Chats">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </a>
          <a href="/settings" class="rail-icon" title="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </a>
          <a href="/logout" class="rail-icon" title="Logout">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </a>
        </nav>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-user">
            ${avatarSvg(currentUser.displayName, currentUser.id, 36)}
            <span class="sidebar-username">${escapeHtml(currentUser.displayName)}</span>
          </div>
        </div>
        <div class="sidebar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
            <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
          <input type="text" id="searchInput" placeholder="Search contacts…">
        </div>
        <div class="contact-list" id="contactList">
          ${contactListHtml || '<div class="no-contacts">No contacts yet.<br>Other users will appear here.</div>'}
        </div>
      </div>

      <!-- Chat Panel -->
      <div class="chat-panel">
        ${chatTopBar}
        <div class="messages-area" id="messagesArea">
          ${messagesHtml || (activeContact
            ? '<div class="empty-chat">Send a message to start the conversation ✨</div>'
            : '<div class="empty-chat">Select a contact to start chatting 💬</div>')}
        </div>
        ${chatInput}
      </div>

      <!-- Profile Panel -->
      ${profilePanel}
    </div>

    <script>
    (function() {
      const currentUserId = ${currentUser.id};
      const activeUserId = ${activeContact ? activeContact.id : 'null'};
      let lastMessageId = ${lastMsgId};

      // Auto-scroll
      const area = document.getElementById('messagesArea');
      if (area) area.scrollTop = area.scrollHeight;

      // SSE
      let eventSource = null;
      function connectSSE() {
        if (!activeUserId) return;
        if (eventSource) eventSource.close();
        eventSource = new EventSource('/chat/' + activeUserId + '/events?lastId=' + lastMessageId);
        eventSource.onmessage = function(e) {
          try {
            const msg = JSON.parse(e.data);
            if (msg.id > lastMessageId) {
              lastMessageId = msg.id;
              if (msg.sender_id !== currentUserId) {
                appendMessage(msg, false);
              }
            }
          } catch(err) { console.error('SSE parse error:', err); }
        };
        eventSource.onerror = function() {
          eventSource.close();
          setTimeout(connectSSE, 3000);
        };
      }
      connectSSE();

      function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
      }

      function avatarSvg(name, id, size) {
        const colors = ['#e91e8c','#7c3aed','#ff6b35','#00d084','#3b82f6','#f59e0b'];
        const c = colors[id % colors.length];
        const i = name.charAt(0).toUpperCase();
        return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+
          '<circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+(size/2)+'" fill="'+c+'"/>'+
          '<text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Space Grotesk,sans-serif" font-weight="600" font-size="'+(size*0.42)+'">'+i+'</text></svg>';
      }

      function appendMessage(msg, isSelf) {
        const area = document.getElementById('messagesArea');
        if (!area) return;
        const empty = area.querySelector('.empty-chat');
        if (empty) empty.remove();

        const row = document.createElement('div');
        row.className = 'message-row ' + (isSelf ? 'sent' : 'received');
        row.setAttribute('data-msg-id', msg.id);
        row.style.animation = 'slideUp 0.3s ease forwards';

        const senderName = isSelf ? '${escapeHtml(currentUser.displayName)}' : '${activeContact ? escapeHtml(activeContact.display_name) : "User"}';
        const senderId = isSelf ? currentUserId : activeUserId;
        const time = new Date(msg.sent_at * 1000).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'});

        let html = '';
        if (!isSelf) html += '<div class="msg-avatar">' + avatarSvg(senderName, senderId, 32) + '</div>';
        html += '<div class="msg-bubble-wrap"><div class="msg-bubble">' + escapeHtml(msg.content) + '</div>';
        html += '<div class="msg-time">' + time + '</div></div>';
        if (isSelf) html += '<div class="msg-avatar">' + avatarSvg(senderName, senderId, 32) + '</div>';

        row.innerHTML = html;
        area.appendChild(row);
        area.scrollTop = area.scrollHeight;
      }

      // Send
      const input = document.getElementById('messageInput');
      const sendBtn = document.getElementById('sendBtn');
      if (sendBtn && input) {
        function doSend() {
          const content = input.value.trim();
          if (!content || !activeUserId) return;
          input.value = '';
          sendBtn.style.transform = 'scale(0.9)';
          setTimeout(() => sendBtn.style.transform = '', 150);

          fetch('/chat/' + activeUserId + '/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content})
          })
          .then(r => r.json())
          .then(data => {
            if (data.ok && data.message) {
              lastMessageId = data.message.id;
              appendMessage(data.message, true);
            }
          })
          .catch(err => console.error('Send error:', err));
        }
        sendBtn.addEventListener('click', doSend);
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
        });
      }

      // Emoji picker
      const emojiToggle = document.getElementById('emojiToggle');
      const emojiPicker = document.getElementById('emojiPicker');
      if (emojiToggle && emojiPicker) {
        emojiToggle.addEventListener('click', function(e) {
          e.stopPropagation();
          emojiPicker.classList.toggle('hidden');
        });
        emojiPicker.querySelectorAll('.emoji-item').forEach(function(btn) {
          btn.addEventListener('click', function() {
            if (input) {
              input.value += this.textContent;
              input.focus();
            }
            emojiPicker.classList.add('hidden');
          });
        });
        document.addEventListener('click', function() {
          emojiPicker.classList.add('hidden');
        });
      }

      // Search contacts
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          const q = this.value.toLowerCase();
          document.querySelectorAll('.contact-item').forEach(function(el) {
            const name = el.querySelector('.contact-name').textContent.toLowerCase();
            el.style.display = name.includes(q) ? '' : 'none';
          });
        });
      }
    })();
    </script>
    `,
    `<style>
      body { overflow: hidden; }

      .app {
        display: flex; height: 100vh; width: 100vw;
      }

      /* Icon Rail */
      .icon-rail {
        width: 60px; background: var(--bg-primary);
        border-right: 1px solid var(--border);
        display: flex; flex-direction: column; align-items: center;
        padding: 16px 0; flex-shrink: 0;
      }
      .rail-logo { margin-bottom: 24px; }
      .rail-nav { display: flex; flex-direction: column; gap: 8px; align-items: center; }
      .rail-icon {
        width: 42px; height: 42px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        color: var(--text-muted); transition: all 0.2s;
        text-decoration: none;
      }
      .rail-icon:hover { color: var(--text-primary); background: var(--bg-secondary); text-decoration: none; }
      .rail-icon.active { color: var(--accent-pink); background: rgba(233,30,140,0.12); }

      /* Sidebar */
      .sidebar {
        width: 280px; background: var(--bg-sidebar);
        border-right: 1px solid var(--border);
        display: flex; flex-direction: column; flex-shrink: 0;
      }
      .sidebar-header {
        padding: 20px 16px 12px;
      }
      .sidebar-user {
        display: flex; align-items: center; gap: 10px;
      }
      .sidebar-username {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600; font-size: 16px;
      }
      .sidebar-search {
        padding: 0 16px 12px; display: flex; align-items: center;
        gap: 8px; background: var(--bg-primary); margin: 0 12px;
        border-radius: 10px; padding: 10px 12px;
      }
      .sidebar-search input {
        background: none; border: none; color: var(--text-primary);
        font-size: 14px; width: 100%; font-family: 'DM Sans', sans-serif;
      }
      .sidebar-search input:focus { outline: none; }
      .sidebar-search input::placeholder { color: var(--text-muted); }

      .contact-list {
        flex: 1; overflow-y: auto; padding: 8px 0;
      }
      .contact-list::-webkit-scrollbar { width: 4px; }
      .contact-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

      .contact-item {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px; cursor: pointer;
        transition: background 0.2s; text-decoration: none; color: inherit;
      }
      .contact-item:hover { background: rgba(255,255,255,0.03); text-decoration: none; }
      .contact-item.active {
        background: var(--bg-card-active); border-radius: 14px; margin: 4px 8px;
        padding: 12px;
      }
      .contact-item.active .contact-name { color: #fff; }
      .contact-item.active .contact-snippet { color: rgba(255,255,255,0.75); }
      .contact-item.active .contact-time { color: rgba(255,255,255,0.65); }

      .contact-avatar { flex-shrink: 0; }
      .contact-info { flex: 1; min-width: 0; }
      .contact-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .contact-name {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600; font-size: 14px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .contact-time { font-size: 11px; color: var(--text-muted); flex-shrink: 0; margin-left: 8px; }
      .contact-bottom { display: flex; justify-content: space-between; align-items: center; }
      .contact-snippet {
        font-size: 13px; color: var(--text-secondary);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
      }
      .unread-badge {
        background: var(--badge); color: #fff; font-size: 11px; font-weight: 600;
        min-width: 20px; height: 20px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        padding: 0 6px; flex-shrink: 0; margin-left: 8px;
      }
      .no-contacts {
        text-align: center; padding: 40px 20px; color: var(--text-muted); font-size: 14px;
        line-height: 1.6;
      }

      /* Chat Panel */
      .chat-panel {
        flex: 1; display: flex; flex-direction: column;
        background: var(--bg-primary); min-width: 0;
      }
      .chat-topbar {
        display: flex; justify-content: space-between; align-items: center;
        padding: 16px 24px; border-bottom: 1px solid var(--border);
        background: var(--bg-secondary); flex-shrink: 0;
      }
      .chat-topbar-left { display: flex; align-items: center; gap: 12px; }
      .chat-topbar-name {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 600; font-size: 16px;
      }
      .chat-topbar-status { font-size: 12px; color: var(--online); display: flex; align-items: center; gap: 6px; }
      .status-dot {
        width: 8px; height: 8px; border-radius: 50%; background: var(--online);
        display: inline-block;
      }
      .chat-topbar-actions { display: flex; gap: 8px; }
      .icon-btn {
        width: 36px; height: 36px; border-radius: 10px; border: none;
        background: var(--bg-primary); color: var(--text-secondary);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: color 0.2s, background 0.2s;
      }
      .icon-btn:hover { color: var(--text-primary); background: var(--border); }

      .messages-area {
        flex: 1; overflow-y: auto; padding: 24px;
        display: flex; flex-direction: column; gap: 12px;
      }
      .messages-area::-webkit-scrollbar { width: 6px; }
      .messages-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 6px; }

      .empty-chat {
        display: flex; align-items: center; justify-content: center;
        flex: 1; color: var(--text-muted); font-size: 16px;
      }

      .message-row {
        display: flex; align-items: flex-end; gap: 8px;
        animation: slideUp 0.3s ease forwards; max-width: 70%;
      }
      .message-row.sent { align-self: flex-end; flex-direction: row; }
      .message-row.received { align-self: flex-start; }
      .msg-avatar { flex-shrink: 0; }
      .msg-bubble-wrap { display: flex; flex-direction: column; }
      .msg-bubble {
        padding: 12px 16px; border-radius: 18px;
        font-size: 14px; line-height: 1.5; word-break: break-word;
      }
      .message-row.received .msg-bubble {
        background: var(--bubble-received); color: #fff;
        border-bottom-left-radius: 6px;
      }
      .message-row.sent .msg-bubble {
        background: var(--bubble-sent); color: #fff;
        border-bottom-right-radius: 6px;
      }
      .msg-time {
        font-size: 11px; color: var(--text-muted); margin-top: 4px;
      }
      .message-row.sent .msg-time { text-align: right; }

      /* Chat Input */
      .chat-input-bar {
        display: flex; align-items: center; gap: 8px;
        padding: 16px 24px; border-top: 1px solid var(--border);
        background: var(--bg-secondary); flex-shrink: 0;
        position: relative;
      }
      .chat-input-bar input {
        flex: 1; padding: 14px 16px; background: var(--bg-primary);
        border: 1px solid var(--border); border-radius: 14px;
        color: var(--text-primary); font-size: 14px; font-family: 'DM Sans', sans-serif;
        transition: border-color 0.2s;
      }
      .chat-input-bar input:focus { outline: none; border-color: var(--accent-purple); }
      .chat-input-bar input::placeholder { color: var(--text-muted); }
      .send-btn {
        width: 44px; height: 44px; border-radius: 14px; border: none;
        background: linear-gradient(135deg, #e91e8c, #7c3aed);
        color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s, box-shadow 0.2s; flex-shrink: 0;
      }
      .send-btn:hover {
        box-shadow: 0 4px 15px rgba(233,30,140,0.4);
        transform: translateY(-1px);
      }
      .send-btn:active { transform: scale(0.95); }

      /* Emoji Picker */
      .emoji-picker {
        position: absolute; bottom: 70px; left: 16px;
        background: var(--bg-secondary); border: 1px solid var(--border);
        border-radius: 14px; padding: 12px; z-index: 100;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      }
      .emoji-picker.hidden { display: none; }
      .emoji-grid {
        display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;
      }
      .emoji-item {
        width: 36px; height: 36px; border: none; background: none;
        font-size: 20px; cursor: pointer; border-radius: 8px;
        transition: background 0.15s;
      }
      .emoji-item:hover { background: var(--border); }
      .emoji-btn { position: relative; }

      /* Profile Panel */
      .profile-panel {
        width: 280px; background: var(--bg-sidebar);
        border-left: 1px solid var(--border);
        display: flex; flex-direction: column;
        flex-shrink: 0; overflow-y: auto;
      }
      .profile-header {
        text-align: center; padding: 32px 20px 24px;
        border-bottom: 1px solid var(--border);
      }
      .profile-header h3 {
        font-size: 18px; margin-top: 16px;
      }
      .profile-status {
        font-size: 13px; color: var(--online); margin-top: 6px;
        display: flex; align-items: center; justify-content: center; gap: 6px;
      }
      .profile-username {
        font-size: 13px; color: var(--text-muted); margin-top: 4px;
      }
      .profile-section {
        padding: 20px;
      }
      .profile-section h4 {
        font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .media-grid {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
      }
      .media-placeholder {
        aspect-ratio: 1; background: var(--bg-primary); border-radius: 10px;
        border: 1px solid var(--border);
      }

      /* Responsive */
      @media (max-width: 1024px) {
        .profile-panel { display: none; }
      }
      @media (max-width: 768px) {
        .icon-rail { display: none; }
        .sidebar { width: 100%; }
        .chat-panel { display: none; }
        .app.has-active .sidebar { display: none; }
        .app.has-active .chat-panel { display: flex; }
      }
    </style>`
  );
}

export function settingsPage(
  currentUser: { displayName: string; username: string; id: number },
  success?: boolean,
  error?: string
): string {
  return layout(
    'Settings',
    `
    <div class="settings-container">
      <div class="settings-card">
        <a href="/chat" class="back-link">← Back to Chat</a>
        <h2>Settings</h2>
        ${success ? '<div class="success">Display name updated!</div>' : ''}
        ${error ? '<div class="error">' + error + '</div>' : ''}
        <form method="POST" action="/settings" class="settings-form">
          <div class="field">
            <label>Username</label>
            <input type="text" value="${escapeHtml(currentUser.username)}" disabled>
          </div>
          <div class="field">
            <label for="display_name">Display Name</label>
            <input type="text" id="display_name" name="display_name"
                   value="${escapeHtml(currentUser.displayName)}" required maxlength="50">
          </div>
          <button type="submit" class="btn-primary">Save Changes</button>
        </form>
      </div>
    </div>
    `,
    `<style>
      .settings-container {
        display: flex; align-items: center; justify-content: center;
        min-height: 100vh; padding: 20px;
      }
      .settings-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 20px; padding: 40px;
        width: 100%; max-width: 480px;
        animation: slideUp 0.5s ease;
      }
      .back-link {
        display: inline-block; margin-bottom: 20px;
        color: var(--text-secondary); font-size: 14px;
      }
      .back-link:hover { color: var(--accent-pink); }
      .settings-card h2 {
        font-size: 24px; margin-bottom: 24px;
        background: linear-gradient(135deg, #e91e8c, #7c3aed);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .success {
        background: rgba(0,208,132,0.15); border: 1px solid var(--online);
        color: var(--online); padding: 12px 16px; border-radius: 10px;
        margin-bottom: 20px; font-size: 14px; text-align: center;
      }
      .error {
        background: rgba(233,30,140,0.15); border: 1px solid var(--accent-pink);
        color: #ff6b9d; padding: 12px 16px; border-radius: 10px;
        margin-bottom: 20px; font-size: 14px; text-align: center;
      }
      .settings-form .field { margin-bottom: 20px; }
      .settings-form label {
        display: block; font-size: 13px; color: var(--text-secondary);
        margin-bottom: 8px; font-weight: 500;
      }
      .settings-form input {
        width: 100%; padding: 14px 16px; background: var(--bg-primary);
        border: 1px solid var(--border); border-radius: 12px;
        color: var(--text-primary); font-size: 15px; font-family: 'DM Sans', sans-serif;
      }
      .settings-form input:disabled { opacity: 0.5; cursor: not-allowed; }
      .settings-form input:focus { outline: none; border-color: var(--accent-purple); }
      .btn-primary {
        width: 100%; padding: 14px;
        background: linear-gradient(135deg, #e91e8c, #7c3aed);
        border: none; border-radius: 12px; color: #fff;
        font-size: 16px; font-weight: 600; cursor: pointer;
        font-family: 'Space Grotesk', sans-serif;
        transition: transform 0.15s, box-shadow 0.2s;
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(233,30,140,0.35);
      }
      .btn-primary:active { transform: scale(0.98); }
    </style>`
  );
}
