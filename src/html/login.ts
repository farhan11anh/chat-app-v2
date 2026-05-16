import { layout } from './layout';

export function loginPage(error?: string): string {
  const errorHtml = error
    ? `<div class="error">${error}</div>`
    : '';

  return layout(
    'Login',
    `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="url(#g1)"/>
            <path d="M16 20c0-4.4 3.6-8 8-8s8 3.6 8 8v2H16v-2z" fill="#fff" opacity="0.9"/>
            <rect x="14" y="22" width="20" height="14" rx="3" fill="#fff"/>
            <circle cx="24" cy="29" r="2" fill="#7c3aed"/>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="48" y2="48">
              <stop stop-color="#e91e8c"/><stop offset="1" stop-color="#7c3aed"/>
            </linearGradient></defs>
          </svg>
          <h1>NeonChat</h1>
          <p class="subtitle">Sign in to continue</p>
        </div>
        ${errorHtml}
        <form method="POST" action="/login" class="auth-form">
          <div class="field">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autocomplete="username" placeholder="Enter your username">
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Enter your password">
          </div>
          <button type="submit" class="btn-primary">Sign In</button>
        </form>
        <p class="auth-link">Don't have an account? <a href="/register">Create one</a></p>
      </div>
    </div>
    `,
    `<style>
      .auth-container {
        display: flex; align-items: center; justify-content: center;
        min-height: 100vh; padding: 20px;
      }
      .auth-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 48px 40px;
        width: 100%; max-width: 420px;
        animation: slideUp 0.5s ease;
      }
      .auth-logo {
        text-align: center; margin-bottom: 32px;
      }
      .auth-logo h1 {
        font-size: 28px; margin-top: 16px;
        background: linear-gradient(135deg, #e91e8c, #7c3aed);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      }
      .auth-logo .subtitle {
        color: var(--text-secondary); margin-top: 8px; font-size: 14px;
      }
      .error {
        background: rgba(233,30,140,0.15); border: 1px solid var(--accent-pink);
        color: #ff6b9d; padding: 12px 16px; border-radius: 10px;
        margin-bottom: 20px; font-size: 14px; text-align: center;
      }
      .auth-form .field { margin-bottom: 20px; }
      .auth-form label {
        display: block; font-size: 13px; color: var(--text-secondary);
        margin-bottom: 8px; font-weight: 500;
      }
      .auth-form input {
        width: 100%; padding: 14px 16px; background: var(--bg-primary);
        border: 1px solid var(--border); border-radius: 12px;
        color: var(--text-primary); font-size: 15px; font-family: 'DM Sans', sans-serif;
        transition: border-color 0.2s;
      }
      .auth-form input:focus {
        outline: none; border-color: var(--accent-purple);
      }
      .auth-form input::placeholder { color: var(--text-muted); }
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
      .auth-link {
        text-align: center; margin-top: 24px;
        color: var(--text-secondary); font-size: 14px;
      }
    </style>`
  );
}
