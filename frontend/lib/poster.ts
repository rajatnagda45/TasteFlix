export function fallbackPoster(title: string, year?: number | null) {
  const safeTitle = title
    .replace(/[<>&"']/g, "")
    .slice(0, 34)
    .toUpperCase();
  const safeYear = year ? String(year) : "TASTEFLIX";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#b91c1c"/>
          <stop offset="45%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
        <radialGradient id="r" cx="50%" cy="25%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect width="400" height="600" rx="30" fill="url(#g)"/>
      <rect width="400" height="600" rx="30" fill="url(#r)"/>
      <rect x="28" y="28" width="344" height="544" rx="24" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
      <text x="42" y="96" fill="#fecdd3" font-size="22" font-family="Verdana, sans-serif" letter-spacing="6">TASTEFLIX</text>
      <text x="42" y="420" fill="#ffffff" font-size="30" font-family="Verdana, sans-serif" font-weight="700">${safeTitle}</text>
      <text x="42" y="472" fill="#cbd5e1" font-size="24" font-family="Verdana, sans-serif">${safeYear}</text>
      <text x="42" y="522" fill="#94a3b8" font-size="16" font-family="Verdana, sans-serif" letter-spacing="4">POSTER UNAVAILABLE</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
