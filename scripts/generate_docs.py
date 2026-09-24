
import os
import ast
import re
from pathlib import Path

# Config
BASE_DIR = Path("/home/takunaga/HRConnect")
OUTPUT_DIR = BASE_DIR / "md_file"
EXCLUDE_DIRS = {
    "node_modules", "venv", ".venv", "__pycache__", ".git", ".next", 
    "dist", "build", "md_file", ".idea", ".vscode", "coverage", ".pytest_cache"
}
EXCLUDE_EXTENSIONS = {
    ".pyc", ".pyo", ".pyd", ".db", ".sq3", ".sqlite", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", 
    ".woff", ".woff2", ".ttf", ".eot", ".map", ".log", ".lock", ".md"
}
TARGET_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".d.ts",
    ".css", ".scss", ".sass", ".less", ".html", 
    ".sh", ".bash", 
    ".yml", ".yaml", ".json", ".toml", ".ini", ".conf", ".cfg", ".xml", ".txt", ".properties",
    ".sql"
}

# --- Metadata Extraction ---

def extract_python_metadata(code: str) -> dict:
    meta = {
        "docstring": "",
        "classes": [],
        "functions": [],
        "imports": []
    }
    try:
        tree = ast.parse(code)
        
        # Docstring
        doc = ast.get_docstring(tree)
        if doc:
            meta["docstring"] = doc

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for n in node.names:
                    meta["imports"].append(n.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module if node.module else ""
                for n in node.names:
                    meta["imports"].append(f"{module}.{n.name}")
            elif isinstance(node, ast.ClassDef):
                class_doc = ast.get_docstring(node)
                desc = f"`{node.name}`"
                if class_doc:
                    first_line = class_doc.split('\n')[0]
                    desc += f": {first_line}"
                meta["classes"].append(desc)
            elif isinstance(node, ast.FunctionDef):
                # Only top level or method? ast.walk hits all.
                # Let's simple list name and docstring summary
                func_doc = ast.get_docstring(node)
                desc = f"`{node.name}`"
                if func_doc:
                    first_line = func_doc.split('\n')[0]
                    desc += f": {first_line}"
                meta["functions"].append(desc)
                
    except Exception:
        pass
    
    # Filter duplicates and limit length if needed
    meta["imports"] = sorted(list(set(meta["imports"])))
    return meta

def extract_ts_js_metadata(code: str) -> dict:
    meta = {
        "docstring": "",
        "exports": [],
        "imports": []
    }
    
    # Top level comment (heuristic)
    lines = code.split('\n')
    if lines and (lines[0].startswith("/**") or lines[0].startswith("//")):
        comment_block = []
        for line in lines:
            s = line.strip()
            if s.startswith("/*") or s.startswith("*") or s.startswith("//"):
                clean = s.replace("/**", "").replace("*/", "").replace("*", "").replace("//", "").strip()
                if clean:
                    comment_block.append(clean)
            else:
                break
        meta["docstring"] = " ".join(comment_block)

    # Imports
    import_matches = re.findall(r'import\s+.*?\s+from\s+[\'"](.*?)[\'"]', code)
    meta["imports"] = sorted(list(set(import_matches)))

    # Exports (Simple Regex)
    export_const = re.findall(r'export\s+const\s+(\w+)', code)
    export_func = re.findall(r'export\s+function\s+(\w+)', code)
    export_default = re.findall(r'export\s+default\s+function\s+(\w+)', code)
    export_class = re.findall(r'export\s+class\s+(\w+)', code)
    export_interface = re.findall(r'export\s+interface\s+(\w+)', code)
    export_type = re.findall(r'export\s+type\s+(\w+)', code)
    
    all_exports = export_const + export_func + export_default + export_class + export_interface + export_type
    meta["exports"] = [f"`{e}`" for e in sorted(list(set(all_exports)))]
    
    return meta

# --- Parsers (V2 Logic Preserved) ---

def get_python_explanation(line: str, line_num: int, ast_map: dict) -> str:
    stripped = line.strip()
    if not stripped: return "空行"
    if stripped.startswith("#"): return "コメント"
    if line_num in ast_map: return ast_map[line_num]
    
    if stripped.startswith("import ") or stripped.startswith("from "): return "モジュールのインポート"
    if stripped.startswith("@"): return "デコレータの適用"
    if stripped.startswith("def "): return "関数定義"
    if stripped.startswith("class "): return "クラス定義"
    if stripped.startswith("return"): return "戻り値の返却"
    if stripped.startswith("if "): return "条件分岐 (if)"
    if stripped.startswith("elif "): return "条件分岐 (elif)"
    if stripped.startswith("else:"): return "条件分岐 (else)"
    if stripped.startswith("for "): return "ループ処理 (for)"
    if stripped.startswith("while "): return "ループ処理 (while)"
    if stripped.startswith("try:"): return "例外処理ブロック (try)"
    if stripped.startswith("except"): return "例外補足 (except)"
    if "=" in stripped: return "変数の定義または値の代入"
    
    return "処理の実行"

def analyze_python_ast(code: str) -> dict:
    mapping = {}
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if hasattr(node, 'lineno'):
                desc = None
                if isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom): desc = "モジュールのインポート"
                elif isinstance(node, ast.FunctionDef): desc = f"関数定義: {node.name}"
                elif isinstance(node, ast.AsyncFunctionDef): desc = f"非同期関数定義: {node.name}"
                elif isinstance(node, ast.ClassDef): desc = f"クラス定義: {node.name}"
                elif isinstance(node, ast.Return): desc = "関数の終了・値の返却"
                elif isinstance(node, ast.Assign): desc = "変数の定義・代入"
                elif isinstance(node, ast.AnnAssign): desc = "型付き変数の定義・代入"
                elif isinstance(node, ast.Call): desc = "関数呼び出し"
                elif isinstance(node, ast.If): desc = "条件分岐"
                elif isinstance(node, ast.For): desc = "ループ処理"
                
                if desc and node.lineno not in mapping:
                    mapping[node.lineno] = desc
    except:
        pass
    return mapping

def get_ts_js_explanation(line: str) -> str:
    s = line.strip()
    if not s: return "空行"
    if s.startswith("//") or s.startswith("/*"): return "コメント"
    if "import " in s and "from" in s: return "インポート"
    if "export " in s: return "エクスポート定義"
    if s.startswith("const") or s.startswith("let"): return "変数定義"
    if "function" in s: return "関数定義"
    if "return " in s: return "戻り値"
    if "<" in s and ">" in s: return "JSX/HTML要素"
    return "コード処理" # Simplification for V3 script to focus on Metadata, keeping minimal valid logic

# --- Inference Logic (V4) ---

def infer_file_purpose(file_path: Path) -> str:
    path_str = str(file_path)
    filename = file_path.name
    parent = file_path.parent.name
    
    # --- Backend Patterns ---
    
    if "backend/app/api/endpoints" in path_str:
        feature = file_path.stem
        return f"{feature} に関するAPIエンドポイント定義 (Router)。"
    
    if "backend/app/crud" in path_str:
        feature = file_path.stem.replace("crud_", "")
        return f"{feature} に関するデータベースCRUD操作定義。"
        
    if "backend/app/schemas" in path_str:
        feature = file_path.stem
        return f"{feature} に関するPydanticデータスキーマ（リクエスト/レスポンス定義）。"
        
    if "backend/app/models" in path_str:
        feature = file_path.stem
        return f"{feature} に関するSQLAlchemyデータベースモデル定義。"

    if "backend/app/services" in path_str:
        feature = file_path.stem
        return f"{feature} に関するビジネスロジック・サービスクラス定義。"

    if "backend/app/core" in path_str:
        if "config" in filename: return "アプリケーション全体の設定定義 (環境変数等)。"
        if "security" in filename: return "認証・セキュリティ関連のユーティリティ定義。"
        if "db" in filename or "database" in filename: return "データベース接続設定。"

    if "backend/alembic/versions" in path_str:
        return "データベース構造変更のためのAlembicマイグレーションスクリプト。"

    if filename == "main.py" and "backend/app" in path_str:
        return "FastAPIアプリケーションのエントリーポイント（初期化・ミドルウェア設定）。"

    # --- Frontend Patterns ---

    if "frontend/src/app/(admin)" in path_str:
        feature = parent
        if filename == "page.tsx":
            return f"管理者向け機能「{feature}」のメインページコンポーネント。"
        if filename == "layout.tsx":
            return f"管理者向け機能「{feature}」のレイアウト定義。"

    if "frontend/src/app/(user)" in path_str:
        feature = parent
        if filename == "page.tsx":
            return f"一般ユーザー向け機能「{feature}」のメインページコンポーネント。"

    if "frontend/src/app/(auth)" in path_str:
        if "login" in path_str: return "ログイン画面のコンポーネント。"
    
    if "frontend/src/components/ui" in path_str:
        return f"汎用UIコンポーネント「{file_path.stem}」の定義。"
        
    if "frontend/src/lib" in path_str:
        return f"フロントエンド用ユーティリティ・ライブラリ「{file_path.stem}」。"

    if "frontend/src/app" in path_str and filename == "globals.css":
        return "アプリケーション全体のグローバルスタイル定義。"

    # --- Config Files ---
    
    if filename == "docker-compose.yml": return "Dockerコンテナ構成定義ファイル。"
    if filename == "Dockerfile": return "Dockerイメージビルド設定ファイル。"
    if filename == "requirements.txt": return "Pythonバックエンドの依存パッケージ一覧。"
    if filename == "package.json": return "Node.jsフロントエンドの依存パッケージ管理ファイル。"
    if "tsconfig" in filename: return "TypeScriptコンパイラ設定ファイル。"
    if "next.config" in filename: return "Next.jsフレームワーク設定ファイル。"
    if "tailwind.config" in filename: return "Tailwind CSS設定ファイル。"
    if "postcss.config" in filename: return "PostCSS設定ファイル。"
    if ".cursorrules" in filename: return "AIアシスタント(Cursor)への指示・ルール定義ファイル。"
    if "deploy.sh" in filename: return "デプロイメント用シェルスクリプト。"

    # Fallback
    return f"ファイル `{filename}` のソースコード。"

def generate_markdown_content(file_path: Path) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            code = f.read()
            lines = code.split("\n")
    except Exception as e:
        return f"# Error reading file: {e}"

    relative_path = file_path.relative_to(BASE_DIR)
    ext = file_path.suffix.lower()
    
    # Metadata Extraction
    meta_overview = ""
    meta_components = []
    meta_deps = []
    
    # Logic to choose best overview
    inferred_purpose = infer_file_purpose(file_path)
    
    if ext == ".py":
        meta = extract_python_metadata(code)
        # Prefer Docstring if it looks descriptive (longer than 10 chars), else use inferred
        if meta["docstring"] and len(meta["docstring"]) > 10:
             meta_overview = meta["docstring"]
        else:
             meta_overview = inferred_purpose
             
        meta_components = meta["classes"] + meta["functions"]
        meta_deps = meta["imports"]
        parser_type = "python"
        python_ast_map = analyze_python_ast(code)
    elif ext in [".ts", ".tsx", ".js", ".jsx"]:
        meta = extract_ts_js_metadata(code)
        if meta["docstring"] and len(meta["docstring"]) > 10:
            meta_overview = meta["docstring"]
        else:
            meta_overview = inferred_purpose
            
        meta_components = meta["exports"]
        meta_deps = meta["imports"]
        parser_type = "ts_js"
    else:
        parser_type = "generic"
        meta_overview = inferred_purpose

    # Build Markdown
    md_lines = []
    md_lines.append(f"# {relative_path} 詳細解説")
    md_lines.append("")
    
    md_lines.append("## 概要")
    md_lines.append(meta_overview)
    md_lines.append("")
    
    if meta_components:
        md_lines.append("## 主要コンポーネント / 関数")
        for c in meta_components[:20]: # Limit to avoid massive lists
            md_lines.append(f"- {c}")
        if len(meta_components) > 20:
            md_lines.append("- (他)")
        md_lines.append("")
        
    if meta_deps:
        md_lines.append("## 依存関係 (Import)")
        for d in meta_deps[:20]:
            md_lines.append(f"- `{d}`")
        if len(meta_deps) > 20:
             md_lines.append("- (他)")
        md_lines.append("")

    md_lines.append("## ソースコード詳細解説")
    md_lines.append("| 行番号 | ソースコード | 解説 |")
    md_lines.append("| :--- | :--- | :--- |")

    for i, line in enumerate(lines, 1):
        code_escaped = line.replace("|", "\\|").replace("`", "\\`") 
        if len(code_escaped) > 200:
             code_escaped = code_escaped[:200] + "..."
        if not code_escaped.strip():
             code_escaped = "&nbsp;"

        explanation = ""
        if parser_type == "python":
            explanation = get_python_explanation(line, i, python_ast_map)
        elif parser_type == "ts_js":
            explanation = get_ts_js_explanation(line)
        else:
            explanation = "設定・データ定義" if not line.strip().startswith(("#", "//")) else "コメント"
            
        md_lines.append(f"| {i} | `{code_escaped}` | {explanation} |")
        
    return "\n".join(md_lines)

def main():
    print(f"Starting V4 documentation generation in {BASE_DIR}")
    files_processed = 0
    for root, dirs, files in os.walk(BASE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            file_path = Path(root) / file
            
            # Check targets
            is_target = False
            if file_path.suffix in TARGET_EXTENSIONS: is_target = True
            elif file in [".cursorrules", ".gitignore", "Dockerfile", "Makefile", ".env.example"]: is_target = True
            if file_path.suffix in EXCLUDE_EXTENSIONS: is_target = False
            
            if not is_target: continue

            # Generate
            output_file = OUTPUT_DIR / f"{file_path.relative_to(BASE_DIR)}_詳細解説.md"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(generate_markdown_content(file_path))
            files_processed += 1
            if files_processed % 50 == 0:
                print(f"Processed {files_processed} files...")
                
    print(f"Done. Processed {files_processed} files.")

if __name__ == "__main__":
    main()
