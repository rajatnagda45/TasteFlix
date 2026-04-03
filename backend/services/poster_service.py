from base64 import b64encode
from html import escape


def build_poster_data_uri(title: str, year: int | None) -> str:
    display_year = str(year) if year else "TasteFlix"
    safe_title = escape(title[:28].title())
    svg = f"""
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#9f1239"/>
          <stop offset="50%" stop-color="#111827"/>
          <stop offset="100%" stop-color="#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="400" height="600" rx="28" fill="url(#g)"/>
      <rect x="24" y="24" width="352" height="552" rx="24" fill="none" stroke="rgba(255,255,255,0.15)"/>
      <text x="36" y="92" fill="#f9fafb" font-size="28" font-family="Arial, sans-serif" font-weight="700">TasteFlix</text>
      <text x="36" y="460" fill="#ffffff" font-size="34" font-family="Arial, sans-serif" font-weight="700">{safe_title}</text>
      <text x="36" y="510" fill="#cbd5e1" font-size="24" font-family="Arial, sans-serif">{display_year}</text>
    </svg>
    """.strip()
    return f"data:image/svg+xml;base64,{b64encode(svg.encode('utf-8')).decode('utf-8')}"
