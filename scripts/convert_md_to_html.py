import os
import re
import html
from pathlib import Path

BASE_DIR = Path("/home/takunaga/HRConnect_lightweight")
MD_DIR = BASE_DIR / "docs" / "system_specifications" / "markdown"
HTML_OUT_DIR = BASE_DIR / "docs" / "system_specifications" / "html"
HTML_OUT_DIR.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("00_full_file_index", "全ファイル総索引"),
    ("1_infra_aws", "インフラ & AWS"),
    ("2_backend_core_db", "基盤 & DB"),
    ("3_backend_api", "APIエンドポイント"),
    ("4_backend_models_services", "モデル・スキーマ・サービス"),
    ("5_frontend_pages", "フロントエンド画面"),
    ("6_frontend_components", "フロントエンド部品"),
    ("7_scripts_tests", "スクリプト & テスト"),
    ("8_docs_and_others", "ドキュメント & 設定"),
]

def md_to_html(md_text):
    lines = md_text.splitlines()
    html_lines = []
    in_code_block = False
    in_table = False
    table_has_header = False

    for line in lines:
        # Code block
        if line.startswith("```"):
            if in_code_block:
                html_lines.append("</code></pre>")
                in_code_block = False
            else:
                lang = line[3:].strip()
                html_lines.append(f'<pre><code class="language-{lang}">')
                in_code_block = True
            continue

        if in_code_block:
            html_lines.append(html.escape(line))
            continue

        # Table
        if line.startswith("|") and line.endswith("|"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            # 区切り行 (| :--- | :--- |)
            if all(re.match(r"^:?-+:?$", p) for p in parts):
                continue
            
            if not in_table:
                html_lines.append('<div class="table-container"><table>')
                html_lines.append('<thead><tr>' + ''.join(f'<th>{parse_inline(p)}</th>' for p in parts) + '</tr></thead><tbody>')
                in_table = True
            else:
                html_lines.append('<tr>' + ''.join(f'<td>{parse_inline(p)}</td>' for p in parts) + '</tr>')
            continue
        else:
            if in_table:
                html_lines.append('</tbody></table></div>')
                in_table = False

        # Empty line
        if not line.strip():
            continue

        # Headers
        if line.startswith("# "):
            html_lines.append(f'<h1>{parse_inline(line[2:])}</h1>')
        elif line.startswith("## "):
            html_lines.append(f'<h2>{parse_inline(line[3:])}</h2>')
        elif line.startswith("### "):
            html_lines.append(f'<h3>{parse_inline(line[4:])}</h3>')
        elif line.startswith("#### "):
            html_lines.append(f'<h4>{parse_inline(line[5:])}</h4>')
        elif line.startswith("- "):
            html_lines.append(f'<ul><li>{parse_inline(line[2:])}</li></ul>')
        elif line.startswith("  - "):
            html_lines.append(f'<ul style="margin-left:2rem;"><li>{parse_inline(line[4:])}</li></ul>')
        elif line.strip() == "---":
            html_lines.append("<hr />")
        else:
            html_lines.append(f'<p>{parse_inline(line)}</p>')

    if in_code_block:
        html_lines.append("</code></pre>")
    if in_table:
        html_lines.append("</tbody></table></div>")

    return "\n".join(html_lines)

def parse_inline(text):
    # Anchor tags in text
    text = re.sub(r'<a id="([^"]+)"></a>', r'<span id="\1"></span>', text)
    # Inline code
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Markdown links
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    # Bold
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    return text

def build_page(key, title, body_html):
    nav_tabs = []
    for p_key, p_title in PAGES:
        active_class = "active" if p_key == key else ""
        nav_tabs.append(f'<a href="{p_key}.html" class="tab {active_class}">{p_title}</a>')
    nav_html = "\n".join(nav_tabs)

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - HRConnect 仕様書</title>
  <style>
    :root {{
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --bg-main: #f8fafc;
      --card-bg: #ffffff;
      --text: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --code-bg: #0f172a;
      --code-text: #f8fafc;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.75;
      color: var(--text);
      background-color: var(--bg-main);
    }}
    /* Top Navigation Tab Bar */
    .header-bar {{
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }}
    .nav-container {{
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      overflow-x: auto;
      padding: 0 1rem;
      gap: 0.25rem;
    }}
    .tab {{
      padding: 0.85rem 1rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      white-space: nowrap;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }}
    .tab:hover {{ color: var(--primary); }}
    .tab.active {{
      color: var(--primary);
      border-bottom-color: var(--primary);
      background: #eff6ff;
    }}
    .portal-link {{
      margin-left: auto;
      display: flex;
      align-items: center;
      font-size: 0.85rem;
      color: #0369a1;
      text-decoration: none;
      font-weight: 600;
      padding: 0 0.5rem;
    }}
    .portal-link:hover {{ text-decoration: underline; }}

    /* Main Content */
    .container {{
      max-width: 1200px;
      margin: 2rem auto;
      background: var(--card-bg);
      padding: 2.5rem 3rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }}
    h1 {{
      font-size: 2rem;
      color: #1e293b;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border);
    }}
    h2 {{
      font-size: 1.4rem;
      color: #1e293b;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid #f1f5f9;
    }}
    h3 {{
      font-size: 1.15rem;
      color: #334155;
      margin-top: 1.5rem;
      margin-bottom: 0.6rem;
    }}
    p {{
      margin-bottom: 1rem;
      color: #334155;
    }}
    ul {{
      margin-left: 1.5rem;
      margin-bottom: 0.75rem;
      color: #334155;
    }}
    li {{ margin-bottom: 0.35rem; }}
    hr {{
      border: 0;
      height: 1px;
      background: var(--border);
      margin: 2rem 0;
    }}
    pre {{
      background: var(--code-bg);
      color: var(--code-text);
      padding: 1.25rem;
      border-radius: 8px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88rem;
      line-height: 1.5;
      margin: 1rem 0;
    }}
    code {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background: #f1f5f9;
      color: #0f172a;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.88rem;
    }}
    pre code {{
      background: transparent;
      color: inherit;
      padding: 0;
    }}
    .table-container {{
      overflow-x: auto;
      margin: 1.5rem 0;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
    }}
    th, td {{
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      text-align: left;
    }}
    th {{
      background: #f8fafc;
      font-weight: 600;
      color: #1e293b;
    }}
    tr:nth-child(even) {{ background: #fbfcfe; }}
    a {{
      color: var(--primary);
      text-decoration: none;
    }}
    a:hover {{ text-decoration: underline; }}
    footer {{
      max-width: 1200px;
      margin: 0 auto 3rem auto;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }}
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="nav-container">
      {nav_html}
      <a href="../index.html" class="portal-link">🔍 インタラクティブポータルへ</a>
    </div>
  </div>

  <div class="container">
    {body_html}
  </div>

  <footer>
    <p>HRConnect Lightweight - Full System Specification Documentation</p>
    <p>© 2026 HRConnect. All rights reserved.</p>
  </footer>

</body>
</html>
"""

def main():
    for key, title in PAGES:
        md_file = MD_DIR / f"{key}.md"
        if not md_file.exists():
            print(f"Warning: {md_file} does not exist.")
            continue
        
        md_text = md_file.read_text(encoding="utf-8")
        body_html = md_to_html(md_text)
        page_html = build_page(key, title, body_html)
        
        out_file = HTML_OUT_DIR / f"{key}.html"
        out_file.write_text(page_html, encoding="utf-8")
        print(f"Generated HTML: {out_file.name}")

if __name__ == "__main__":
    main()

