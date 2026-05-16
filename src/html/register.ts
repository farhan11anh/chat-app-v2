import { layout } from './layout';

export function registerPage(error?: string): string {
  const errorHtml = error
    ? `<div class="error">${error}</div>`
    : '';

  return layout(
    'Register',
    `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="24" fill="url(#g2)"/>
            <path d="M24 14a6 6 0 110 12 6 6 0 010-12z" fill="#fff" opacity="0.9"/>
            <path d="M14 34c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#fff" stroke-width="2" fill="none"/>
            <defs><linearGradient id="g2" x1="0" y1="0" x2="48" y2="48">
              <stop stop-color="#7c3aed"/><stop offset="1" stop-color="#e91e8c"/>
            </linearGradient></defs>
          </svg>
          <h1>Join NeonChat</h1>
          <p class="subtitle">Create your account</p>
        </div>
        ${errorHtml}
        <form method="POST" action="/register" class="auth-form">
          <div class="field">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autocomplete="username"
                   placeholder="Choose a username" minlength="3" maxlength="30"
                   pattern="[a-zA-Z0-9_]+" title="Letters, numbers, and underscores only">
          </div>
          <div class="field">
            <label for="display_name">Display Name</label>
            <input type="text" id="display_name" name="display_name" required
                   placeholder="Your display name" maxlength="50">
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required autocomplete="new-password"
                   placeholder="Choose a password" minlength="6">
          </div>
          <button type="submit" class="btn-primary">Create Account</button>
        </form>
        <p class="auth-link">Already have an account? <a href="/login">Sign in</a></p>
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
        background: linear-gradient(135deg, #7c3aed, #e91e8c);
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
        background: linear-gradient(135deg, #7c3aed, #e91e8c);
        border: none; border-radius: 12px; color: #fff;
        font-size: 16px; font-weight: 600; cursor: pointer;
        font-family: 'Space Grotesk', sans-serif;
        transition: transform 0.15s, box-shadow 0.2s;
      }
      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 25px rgba(124,58,237,0.35);
      }
      .btn-primary:active { transform: scale(0.98); }
      .auth-link {
        text-align: center; margin-top: 24px;
        color: var(--text-secondary); font-size: 14px;
      }
    </style>`
  );
}
