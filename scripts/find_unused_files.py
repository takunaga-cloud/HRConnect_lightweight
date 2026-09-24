# -*- coding: utf-8 -*-
import os
import re
import sys

def find_ts_unused_files():
    frontend_dir = "/home/takunaga/HRConnect_Next/HRConnect/frontend"
    src_dir = os.path.join(frontend_dir, "src")
    
    # 1. すべてのTS/TSXファイルを取得
    all_files = []
    for root, dirs, files in os.walk(src_dir):
        # node_modules や .next などの除外は os.walk の時点で src に絞っているので不要
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir)
                all_files.append(rel_path)
                
    # 2. エントリーポイントと定義
    # Next.js のルーティングファイルや特別なファイルは自動的に「使用中」とする
    entry_patterns = [
        r'^middleware\.ts$',
        r'.*page\.tsx$',
        r'.*layout\.tsx$',
        r'.*route\.ts$',
        r'.*loading\.tsx$',
        r'.*error\.tsx$',
        r'.*not-found\.tsx$',
        r'^types/.*',  # 型定義ファイルはグローバル参照やコンパイル対象として一旦除外
    ]
    
    used_files = set()
    for rel_path in all_files:
        for pattern in entry_patterns:
            if re.match(pattern, rel_path):
                used_files.add(rel_path)
                break

    # 3. 各ファイルのインポート関係を解析
    # インポートパターンの抽出 (es6 import / dynamic import / export ... from)
    # 例: import ... from '@/components/...'
    # 例: import ... from '../hooks/...'
    import_re = re.compile(r"(?:import|export)\s+.*?\s+from\s+['\"]([^'\"]+)['\"]")
    dynamic_import_re = re.compile(r"import\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")

    imports_map = {} # file -> list of imports

    for rel_path in all_files:
        full_path = os.path.join(src_dir, rel_path)
        imports = []
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # コメントは簡易的に除外しないが、誤検知を避けるため最低限の検索
                for match in import_re.finditer(content):
                    imports.append(match.group(1))
                for match in dynamic_import_re.finditer(content):
                    imports.append(match.group(1))
        except Exception as e:
            pass
        imports_map[rel_path] = imports

    # インポートパスを実際のファイルパスに解決する
    def resolve_path(current_file, import_path):
        # @/ から始まる絶対パス
        if import_path.startswith('@/'):
            clean_path = import_path[2:]
        elif import_path.startswith('.'):
            # 相対パス
            curr_dir = os.path.dirname(current_file)
            clean_path = os.path.normpath(os.path.join(curr_dir, import_path))
        else:
            # 外部ライブラリ
            return None

        # 拡張子の解決
        candidates = [
            clean_path,
            clean_path + '.ts',
            clean_path + '.tsx',
            os.path.join(clean_path, 'index.ts'),
            os.path.join(clean_path, 'index.tsx'),
        ]
        
        for cand in candidates:
            # 正規化
            cand = cand.replace('\\', '/')
            if cand in all_files:
                return cand
        return None

    # すべてのファイルからインポートされているファイルをマーク
    referred_files = set()
    for rel_path, imports in imports_map.items():
        for imp in imports:
            resolved = resolve_path(rel_path, imp)
            if resolved:
                referred_files.add(resolved)

    # 4. 未使用ファイルの洗い出し
    unused_files = []
    for rel_path in all_files:
        if rel_path not in used_files and rel_path not in referred_files:
            unused_files.append(rel_path)

    return sorted(unused_files)

def find_py_unused_files():
    backend_dir = "/home/takunaga/HRConnect_Next/HRConnect/backend"
    app_dir = os.path.join(backend_dir, "app")
    
    if not os.path.exists(app_dir):
        return []

    # 1. すべてのPyファイルを取得
    all_files = []
    for root, dirs, files in os.walk(app_dir):
        for file in files:
            if file.endswith('.py'):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, app_dir)
                all_files.append(rel_path)

    # 2. エントリーポイントと定義
    entry_patterns = [
        r'^main\.py$',
        r'^__init__\.py$',
    ]
    
    used_files = set()
    for rel_path in all_files:
        for pattern in entry_patterns:
            if re.match(pattern, rel_path):
                used_files.add(rel_path)
                break

    # 3. 各ファイルのインポート関係を解析
    # Python の import パターン:
    # from app.xxx import yyy
    # import app.xxx
    # from .xxx import yyy
    import_from_re = re.compile(r"from\s+([\w\.]+)\s+import")
    import_direct_re = re.compile(r"import\s+([\w\.,\s]+)")

    referred_files = set()

    for rel_path in all_files:
        full_path = os.path.join(app_dir, rel_path)
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # from app.xxx import ...
                for match in import_from_re.finditer(content):
                    imp_mod = match.group(1)
                    resolved = resolve_py_mod(rel_path, imp_mod, all_files)
                    if resolved:
                        referred_files.add(resolved)
                
                # import app.xxx
                for match in import_direct_re.finditer(content):
                    imp_mods = match.group(1).split(',')
                    for imp_mod in imp_mods:
                        imp_mod = imp_mod.strip()
                        resolved = resolve_py_mod(rel_path, imp_mod, all_files)
                        if resolved:
                            referred_files.add(resolved)
        except Exception as e:
            pass

    unused_files = []
    for rel_path in all_files:
        if rel_path not in used_files and rel_path not in referred_files:
            unused_files.append(rel_path)

    return sorted(unused_files)

def resolve_py_mod(current_file, mod_path, all_files):
    # 例: app.core.config -> core/config.py
    # 例: .config -> current_dir/config.py
    if mod_path.startswith('app.'):
        clean_path = mod_path[4:].replace('.', '/')
    elif mod_path.startswith('.'):
        curr_dir = os.path.dirname(current_file)
        dots = len(mod_path) - len(mod_path.lstrip('.'))
        mod_sub = mod_path.lstrip('.')
        # 相対パスの階層移動
        for _ in range(dots - 1):
            curr_dir = os.path.dirname(curr_dir)
        clean_path = os.path.normpath(os.path.join(curr_dir, mod_sub.replace('.', '/')))
    else:
        # サードパーティライブラリなど
        clean_path = mod_path.replace('.', '/')

    candidates = [
        clean_path + '.py',
        os.path.join(clean_path, '__init__.py')
    ]
    for cand in candidates:
        cand = cand.replace('\\', '/')
        if cand in all_files:
            return cand
    return None

if __name__ == "__main__":
    print("--- Frontend Unused Files ---")
    fe_unused = find_ts_unused_files()
    for f in fe_unused:
        print(f"frontend/src/{f}")
        
    print("\n--- Backend Unused Files ---")
    be_unused = find_py_unused_files()
    for f in be_unused:
        print(f"backend/app/{f}")
