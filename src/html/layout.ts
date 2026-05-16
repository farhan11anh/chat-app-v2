export function layout(title: string, body: string, extraHead = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — NeonChat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-primary: #0f0f1a;
      --bg-secondary: #16162a;
      --bg-sidebar: #12121f;
      --bg-card-active: linear-gradient(135deg, #e91e8c, #7c3aed);
      --accent-pink: #e91e8c;
      --accent-purple: #7c3aed;
      --accent-orange: #ff6b35;
      --bubble-received: linear-gradient(135deg, #ff6b35, #e91e8c);
      --bubble-sent: linear-gradient(135deg, #7c3aed, #e91e8c);
      --text-primary: #ffffff;
      --text-secondary: #8888aa;
      --text-muted: #555577;
      --border: #1e1e3a;
      --online: #00d084;
      --badge: #e91e8c;
    }
    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Space Grotesk', sans-serif;
    }
    a { color: var(--accent-pink); text-decoration: none; }
    a:hover { text-decoration: underline; }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
  ${extraHead}
</head>
<body>
  ${body}
</body>
</html>`;
}
