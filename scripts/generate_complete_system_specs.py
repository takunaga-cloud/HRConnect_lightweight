import os
import re
import ast
import json
import html
from pathlib import Path

BASE_DIR = Path("/home/takunaga/HRConnect_lightweight")
DOCS_DIR = BASE_DIR / "docs" / "system_specifications"
MD_DIR = DOCS_DIR / "markdown"
DOCS_DIR.mkdir(parents=True, exist_ok=True)
MD_DIR.mkdir(parents=True, exist_ok=True)

EXCLUDE_DIRS = {
    'node_modules', '.next', '.venv', 'venv', '__pycache__',
    '.git', '.pytest_cache', 'coverage', 'test-results', '.mypy_cache',
    'dist', 'build', '.idea', '.vscode'
}

EXCLUDE_EXTS = {
    '.pyc', '.db', '.zip', '.tar.gz', '.log', '.ico', '.png', '.jpg', '.svg'
}

CATEGORIES = {
    "1_infra_aws": "インフラ & AWSサーバーレス構成",
    "2_backend_core_db": "バックエンド基盤 & DBリポジトリ",
    "3_backend_api": "バックエンドAPIルーティング & 依存性注入",
    "4_backend_models_services": "バックエンド業務ロジック (Models / Schemas / Services)",
    "5_frontend_pages": "フロントエンド画面 (Next.js App Router / BFF)",
    "6_frontend_components": "フロントエンドUI部品 & 状態管理 & 共通関数",
    "7_scripts_tests": "運用スクリプト & 結合・単体テスト",
    "8_docs_and_others": "ドキュメント & プロジェクト共通設定"
}

def scan_files():
    file_list = []
    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        if 'docs/system_specifications' in root:
            continue
        for f in files:
            p = Path(root) / f
            if p.suffix in EXCLUDE_EXTS:
                continue
            if p.name in ['package-lock.json', 'hr_connect.db', '.DS_Store']:
                continue
            rel_path = p.relative_to(BASE_DIR)
            file_list.append(rel_path)
    return sorted(file_list)

def categorize_file(rel_path: Path):
    s = str(rel_path)
    if s.startswith("infra/") or s in ["template.yaml", "amplify.yml", "deploy.sh", "backend/Dockerfile.lambda", "docker-compose.prod.yml", ".env.production.template"]:
        return "1_infra_aws"
    elif s.startswith("backend/app/core/") or s.startswith("backend/app/db/") or s == "backend/app/main.py":
        return "2_backend_core_db"
    elif s.startswith("backend/app/api/"):
        return "3_backend_api"
    elif s.startswith("backend/app/models/") or s.startswith("backend/app/schemas/") or s.startswith("backend/app/services/"):
        return "4_backend_models_services"
    elif s.startswith("frontend/src/app/"):
        return "5_frontend_pages"
    elif s.startswith("frontend/src/components/") or s.startswith("frontend/src/context/") or s.startswith("frontend/src/hooks/") or s.startswith("frontend/src/lib/") or s.startswith("frontend/src/types/"):
        return "6_frontend_components"
    elif s.startswith("backend/scripts/") or s.startswith("scripts/") or s.startswith("backend/tests/") or s.startswith("frontend/e2e/"):
        return "7_scripts_tests"
    else:
        return "8_docs_and_others"

def analyze_file_content(path: Path):
    try:
        content = path.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        return {"lines": 0, "summary": f"読み込みエラー: {e}", "details": {}}
    
    lines = len(content.splitlines())
    suffix = path.suffix
    details = {}
    summary = ""
    
    if suffix == ".py":
        try:
            tree = ast.parse(content)
            docstring = ast.get_docstring(tree) or ""
            classes = []
            functions = []
            imports = []
            for node in ast.walk(tree):
                if isinstance(node, ast.ClassDef):
                    methods = [m.name for m in node.body if isinstance(m, (ast.FunctionDef, ast.AsyncFunctionDef))]
                    classes.append({"name": node.name, "methods": methods, "doc": ast.get_docstring(node) or ""})
                elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if hasattr(node, 'col_offset') and node.col_offset == 0:
                        args = [a.arg for a in node.args.args]
                        functions.append({"name": node.name, "args": args, "doc": ast.get_docstring(node) or ""})
                elif isinstance(node, ast.Import):
                    for n in node.names: imports.append(n.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module: imports.append(node.module)
            details["classes"] = classes
            details["functions"] = functions
            details["imports"] = sorted(list(set(imports)))[:15]
            summary = docstring.strip().split("\n")[0] if docstring else ""
        except Exception:
            pass
    elif suffix in [".ts", ".tsx", ".js", ".mjs"]:
        funcs = re.findall(r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)', content)
        const_funcs = re.findall(r'(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*(?:=>|:)', content)
        interfaces = re.findall(r'(?:export\s+)?interface\s+([A-Za-z0-9_]+)', content)
        types = re.findall(r'(?:export\s+)?type\s+([A-Za-z0-9_]+)', content)
        imports = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', content)
        details["components_or_funcs"] = list(set(funcs + const_funcs))[:10]
        details["interfaces"] = list(set(interfaces + types))[:10]
        details["imports"] = list(set(imports))[:12]
    elif suffix in [".yml", ".yaml", ".json", ".sh", ".md", ".ini", ".env"]:
        comments = [line.strip("#/ \t") for line in content.splitlines() if line.strip().startswith(("#", "//", ";"))]
        if comments:
            summary = comments[0][:100]

    # 特徴に応じたデフォルト概要
    name = path.name
    rel_str = str(path.relative_to(BASE_DIR))
    if not summary:
        if "main.py" in name: summary = "FastAPIエントリーポイント & AWS Lambda (Mangum) ハンドラー"
        elif "dynamodb.py" in name: summary = "DynamoDB非同期セッション・リソース管理 & テーブル初期化"
        elif "dynamodb_repo.py" in name: summary = "DynamoDBシングルテーブル設計用リポジトリ (CRUD・Query・Scan)"
        elif "config.py" in name: summary = "環境変数設定 (Pydantic Settings)"
        elif "infra-stack" in name or "hrconnect-serverless-stack" in name: summary = "AWS CDK サーバーレススタック定義 (DynamoDB/S3/Cognito/Lambda/API Gateway)"
        elif "template.yaml" in name: summary = "AWS SAM サーバーレスインフラ定義"
        elif "amplify.yml" in name: summary = "AWS Amplify Hosting CI/CDビルド設定"
        elif "deploy.sh" in name: summary = "サーバーレスインフラ一括デプロイスクリプト"
        elif "init_dynamodb.py" in name: summary = "DynamoDBテーブル作成 & 初期シードデータ投入スクリプト"
        elif "page.tsx" in name:
            dir_name = path.parent.name
            summary = f"画面UIコンポーネント ({dir_name} 画面)"
        elif "route.ts" in name:
            summary = "Next.js Route Handler (BFF API / 認証プロキシ)"
        elif suffix == ".md":
            summary = "設計書 / 仕様書 / ガイドライン文書"
        else:
            summary = f"{name} モジュール / 設定ファイル"

    return {
        "lines": lines,
        "summary": summary,
        "details": details,
        "raw_preview": "\n".join(content.splitlines()[:15])
    }

def generate_docs():
    files = scan_files()
    categorized_data = {cat_id: [] for cat_id in CATEGORIES}

    print(f"Total files scanned: {len(files)}")
    
    file_records = []
    for rel_path in files:
        full_path = BASE_DIR / rel_path
        cat_id = categorize_file(rel_path)
        analysis = analyze_file_content(full_path)
        record = {
            "rel_path": str(rel_path),
            "filename": full_path.name,
            "category_id": cat_id,
            "category_name": CATEGORIES[cat_id],
            "lines": analysis["lines"],
            "summary": analysis["summary"],
            "details": analysis["details"],
            "preview": analysis["raw_preview"]
        }
        file_records.append(record)
        categorized_data[cat_id].append(record)

    # 1. 各カテゴリごとのMarkdownファイル生成
    for cat_id, cat_name in CATEGORIES.items():
        cat_files = categorized_data[cat_id]
        md_content = f"# {cat_name} 仕様詳細書\n\n"
        md_content += f"本ドキュメントは、HRConnectにおける「{cat_name}」カテゴリに属する全ファイルの仕様・構成・詳細を網羅した資料です。\n\n"
        md_content += f"**対象ファイル数:** {len(cat_files)} ファイル\n\n---\n\n"
        
        # 目次
        md_content += "## 掲載ファイル一覧\n\n"
        for cf in cat_files:
            md_content += f"- [`{cf['rel_path']}`](#{cf['rel_path'].replace('/', '-').replace('.', '-')}) : {cf['summary']}\n"
        md_content += "\n---\n\n"
        
        # ファイル別詳細
        for cf in cat_files:
            anchor = cf['rel_path'].replace('/', '-').replace('.', '-')
            md_content += f"## <a id=\"{anchor}\"></a> {cf['rel_path']}\n\n"
            md_content += f"- **ファイル概要:** {cf['summary']}\n"
            md_content += f"- **行数:** {cf['lines']} 行\n"
            md_content += f"- **カテゴリ:** {cf['category_name']}\n\n"
            
            det = cf['details']
            if "classes" in det and det["classes"]:
                md_content += "### 定義クラス\n"
                for cls in det["classes"]:
                    methods = ", ".join(f"`{m}()`" for m in cls["methods"][:8]) if cls["methods"] else "なし"
                    md_content += f"- **`class {cls['name']}`**: {cls['doc'] or '詳細なし'}\n"
                    md_content += f"  - メソッド: {methods}\n"
                md_content += "\n"
                
            if "functions" in det and det["functions"]:
                md_content += "### 定義関数・エンドポイント\n"
                for fn in det["functions"][:12]:
                    args = ", ".join(fn["args"])
                    md_content += f"- **`def {fn['name']}({args})`**: {fn['doc'] or ''}\n"
                md_content += "\n"

            if "components_or_funcs" in det and det["components_or_funcs"]:
                md_content += "### コンポーネント / 関数\n"
                for fn in det["components_or_funcs"]:
                    md_content += f"- `{fn}`\n"
                md_content += "\n"

            if "interfaces" in det and det["interfaces"]:
                md_content += "### 型定義 / インターフェース\n"
                for inf in det["interfaces"]:
                    md_content += f"- `{inf}`\n"
                md_content += "\n"

            if "imports" in det and det["imports"]:
                md_content += "### 主な依存モジュール (Imports)\n"
                md_content += ", ".join(f"`{imp}`" for imp in det["imports"]) + "\n\n"

            md_content += "### コード先頭プレビュー\n```text\n"
            md_content += cf["preview"] + "\n```\n\n---\n\n"

        md_file = MD_DIR / f"{cat_id}.md"
        md_file.write_text(md_content, encoding="utf-8")
        print(f"Generated Markdown: {md_file.name}")

    # 2. 全ファイル辞書Markdown (総まとめ)
    index_md = "# HRConnect 全ソース・全ファイル完全仕様辞書 (Master Index)\n\n"
    index_md += f"プロジェクト総ファイル数: **{len(file_records)}** ファイル\n\n"
    index_md += "| カテゴリ | ファイルパス | 行数 | 概要・役割 |\n"
    index_md += "| :--- | :--- | :--- | :--- |\n"
    for fr in file_records:
        index_md += f"| {fr['category_name']} | `{fr['rel_path']}` | {fr['lines']} | {fr['summary']} |\n"
    (MD_DIR / "00_full_file_index.md").write_text(index_md, encoding="utf-8")

    # 3. 統合インタラクティブHTMLポータル (index.html) の生成
    # タブ、サイドバー、検索機能、全ファイル詳細ビューアを完備
    json_data = json.dumps(file_records, ensure_ascii=False)
    
    html_content = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HRConnect - 全ファイル仕様・詳細完全ポータル</title>
  <style>
    :root {{
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --sidebar-bg: #1e293b;
      --sidebar-text: #f1f5f9;
      --sidebar-hover: #334155;
      --sidebar-active: #2563eb;
      --content-bg: #f8fafc;
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
      color: var(--text);
      background-color: var(--content-bg);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }}
    /* Sidebar */
    #sidebar {{
      width: 340px;
      background: var(--sidebar-bg);
      color: var(--sidebar-text);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      border-right: 1px solid #334155;
    }}
    #sidebar-header {{
      padding: 1.25rem;
      border-bottom: 1px solid #334155;
    }}
    #sidebar-header h2 {{
      font-size: 1.15rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }}
    #search-box {{
      width: 100%;
      padding: 0.6rem 0.8rem;
      margin-top: 0.75rem;
      border-radius: 6px;
      border: 1px solid #475569;
      background: #0f172a;
      color: #fff;
      font-size: 0.85rem;
    }}
    #search-box:focus {{
      outline: none;
      border-color: var(--primary);
    }}
    #file-list {{
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem 0.5rem;
    }}
    .file-item {{
      padding: 0.6rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      transition: background 0.15s;
      margin-bottom: 0.25rem;
    }}
    .file-item:hover {{ background: var(--sidebar-hover); }}
    .file-item.active {{ background: var(--sidebar-active); font-weight: 600; }}
    .file-item-name {{ color: #ffffff; word-break: break-all; font-family: ui-monospace, monospace; }}
    .file-item-desc {{ color: #94a3b8; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
    
    /* Main Content */
    #main {{
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f8fafc;
    }}
    /* Category Tabs */
    #tab-bar {{
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      display: flex;
      overflow-x: auto;
      padding: 0 1rem;
      gap: 0.5rem;
      flex-shrink: 0;
    }}
    .tab {{
      padding: 0.85rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;
    }}
    .tab:hover {{ color: var(--primary); }}
    .tab.active {{
      color: var(--primary);
      border-bottom-color: var(--primary);
    }}
    
    /* Content Area */
    #content {{
      flex: 1;
      overflow-y: auto;
      padding: 2rem 2.5rem;
    }}
    .spec-header {{
      background: #ffffff;
      padding: 1.75rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }}
    .spec-title {{
      font-size: 1.5rem;
      font-family: ui-monospace, monospace;
      color: #1e293b;
      margin-bottom: 0.5rem;
      word-break: break-all;
    }}
    .spec-badge {{
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #e0f2fe;
      color: #0369a1;
      margin-right: 0.5rem;
    }}
    .spec-summary {{
      font-size: 1.05rem;
      color: #334155;
      margin-top: 0.75rem;
      line-height: 1.6;
    }}
    .spec-card {{
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }}
    .spec-card h3 {{
      font-size: 1.1rem;
      color: #1e293b;
      margin-bottom: 1rem;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid #f1f5f9;
    }}
    .detail-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }}
    .detail-table th, .detail-table td {{
      padding: 0.6rem 0.8rem;
      border: 1px solid var(--border);
      text-align: left;
    }}
    .detail-table th {{ background: #f8fafc; font-weight: 600; }}
    pre.code-preview {{
      background: var(--code-bg);
      color: var(--code-text);
      padding: 1rem;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      font-size: 0.85rem;
      overflow-x: auto;
      line-height: 1.45;
    }}
    .tag {{
      display: inline-block;
      background: #f1f5f9;
      color: #475569;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.8rem;
      margin: 0.2rem;
      font-family: monospace;
    }}
  </style>
</head>
<body>

  <!-- Left Sidebar -->
  <div id="sidebar">
    <div id="sidebar-header">
      <h2>📁 HRConnect 仕様書</h2>
      <input type="text" id="search-box" placeholder="ファイルを検索 (例: dynamodb, auth...)" />
    </div>
    <div id="file-list"></div>
  </div>

  <!-- Main Right Panel -->
  <div id="main">
    <div id="tab-bar">
      <div class="tab active" data-cat="all">すべて ({len(file_records)})</div>
      <div class="tab" data-cat="1_infra_aws">インフラ・AWS ({len(categorized_data['1_infra_aws'])})</div>
      <div class="tab" data-cat="2_backend_core_db">基盤・DB ({len(categorized_data['2_backend_core_db'])})</div>
      <div class="tab" data-cat="3_backend_api">API ({len(categorized_data['3_backend_api'])})</div>
      <div class="tab" data-cat="4_backend_models_services">モデル・サービス ({len(categorized_data['4_backend_models_services'])})</div>
      <div class="tab" data-cat="5_frontend_pages">画面・Routes ({len(categorized_data['5_frontend_pages'])})</div>
      <div class="tab" data-cat="6_frontend_components">部品・ロジック ({len(categorized_data['6_frontend_components'])})</div>
      <div class="tab" data-cat="7_scripts_tests">テスト・スクリプト ({len(categorized_data['7_scripts_tests'])})</div>
      <div class="tab" data-cat="8_docs_and_others">設計書・他 ({len(categorized_data['8_docs_and_others'])})</div>
    </div>

    <div id="content">
      <div id="spec-view"></div>
    </div>
  </div>

  <script>
    const filesData = {json_data};
    let currentCategory = "all";
    let selectedFilePath = filesData[0]?.rel_path || "";

    const fileListEl = document.getElementById("file-list");
    const searchBox = document.getElementById("search-box");
    const specViewEl = document.getElementById("spec-view");
    const tabs = document.querySelectorAll(".tab");

    function renderFileList() {{
      const query = searchBox.value.toLowerCase();
      fileListEl.innerHTML = "";

      const filtered = filesData.filter(f => {{
        const matchCat = (currentCategory === "all" || f.category_id === currentCategory);
        const matchQuery = f.rel_path.toLowerCase().includes(query) || f.summary.toLowerCase().includes(query);
        return matchCat && matchQuery;
      }});

      filtered.forEach(f => {{
        const item = document.createElement("div");
        item.className = "file-item" + (f.rel_path === selectedFilePath ? " active" : "");
        item.innerHTML = `
          <div class="file-item-name">${{escapeHtml(f.rel_path)}}</div>
          <div class="file-item-desc">${{escapeHtml(f.summary)}}</div>
        `;
        item.onclick = () => {{
          selectedFilePath = f.rel_path;
          renderFileList();
          renderDetail(f);
        }};
        fileListEl.appendChild(item);
      }});

      if (filtered.length > 0 && !filtered.some(f => f.rel_path === selectedFilePath)) {{
        selectedFilePath = filtered[0].rel_path;
        renderDetail(filtered[0]);
      }}
    }}

    function renderDetail(file) {{
      if (!file) {{
        specViewEl.innerHTML = "<p>ファイルが選択されていません。</p>";
        return;
      }}

      let classesHtml = "";
      if (file.details.classes && file.details.classes.length > 0) {{
        classesHtml = `
          <div class="spec-card">
            <h3>🏛️ 定義クラス (${{file.details.classes.length}})</h3>
            <table class="detail-table">
              <tr><th>クラス名</th><th>メソッド一覧</th><th>Docstring / 役割</th></tr>
              ${{file.details.classes.map(c => `
                <tr>
                  <td><code>${{escapeHtml(c.name)}}</code></td>
                  <td>${{c.methods.map(m => `<code>${{escapeHtml(m)}}()</code>`).join(", ") || "なし"}}</td>
                  <td>${{escapeHtml(c.doc || "説明なし")}}</td>
                </tr>
              `).join("")}}
            </table>
          </div>
        `;
      }}

      let funcsHtml = "";
      if (file.details.functions && file.details.functions.length > 0) {{
        funcsHtml = `
          <div class="spec-card">
            <h3>⚡ 定義関数 / エンドポイント (${{file.details.functions.length}})</h3>
            <table class="detail-table">
              <tr><th>関数名</th><th>引数</th><th>Docstring / 概要</th></tr>
              ${{file.details.functions.map(fn => `
                <tr>
                  <td><code>${{escapeHtml(fn.name)}}</code></td>
                  <td><code>${{escapeHtml(fn.args.join(", "))}}</code></td>
                  <td>${{escapeHtml(fn.doc || "なし")}}</td>
                </tr>
              `).join("")}}
            </table>
          </div>
        `;
      }}

      let tsCompsHtml = "";
      if (file.details.components_or_funcs && file.details.components_or_funcs.length > 0) {{
        tsCompsHtml = `
          <div class="spec-card">
            <h3>⚛️ コンポーネント / 関数 (${{file.details.components_or_funcs.length}})</h3>
            <div>${{file.details.components_or_funcs.map(cf => `<span class="tag">${{escapeHtml(cf)}}</span>`).join("")}}</div>
          </div>
        `;
      }}

      let tsInterfacesHtml = "";
      if (file.details.interfaces && file.details.interfaces.length > 0) {{
        tsInterfacesHtml = `
          <div class="spec-card">
            <h3>📋 インターフェース / 型定義 (${{file.details.interfaces.length}})</h3>
            <div>${{file.details.interfaces.map(inf => `<span class="tag">${{escapeHtml(inf)}}</span>`).join("")}}</div>
          </div>
        `;
      }}

      let importsHtml = "";
      if (file.details.imports && file.details.imports.length > 0) {{
        importsHtml = `
          <div class="spec-card">
            <h3>🔗 主な依存関係 (Imports)</h3>
            <div>${{file.details.imports.map(imp => `<span class="tag">${{escapeHtml(imp)}}</span>`).join("")}}</div>
          </div>
        `;
      }}

      specViewEl.innerHTML = `
        <div class="spec-header">
          <div class="spec-title">${{escapeHtml(file.rel_path)}}</div>
          <div>
            <span class="spec-badge">${{escapeHtml(file.category_name)}}</span>
            <span class="spec-badge" style="background:#f1f5f9; color:#475569;">${{file.lines}} 行</span>
          </div>
          <div class="spec-summary">${{escapeHtml(file.summary)}}</div>
        </div>

        ${{classesHtml}}
        ${{funcsHtml}}
        ${{tsCompsHtml}}
        ${{tsInterfacesHtml}}
        ${{importsHtml}}

        <div class="spec-card">
          <h3>📄 コードプレビュー (先頭部)</h3>
          <pre class="code-preview"><code>${{escapeHtml(file.preview)}}</code></pre>
        </div>
      `;
    }}

    function escapeHtml(str) {{
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }}

    // Tab Events
    tabs.forEach(tab => {{
      tab.onclick = () => {{
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentCategory = tab.dataset.cat;
        renderFileList();
      }};
    }});

    searchBox.oninput = () => renderFileList();

    // Initial render
    renderFileList();
    renderDetail(filesData[0]);
  </script>
</body>
</html>
"""
    portal_file = DOCS_DIR / "index.html"
    portal_file.write_text(html_content, encoding="utf-8")
    print(f"Generated HTML Portal: {portal_file.name}")
    print("Done generating complete system specifications!")

if __name__ == "__main__":
    generate_docs()

