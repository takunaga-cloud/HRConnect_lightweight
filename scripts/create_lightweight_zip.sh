#!/bin/bash
# HRConnect 純粋ローカル(SQLite)構成用 ZIP作成スクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_ZIP="$PROJECT_ROOT/HRConnect_lightweight.zip"

echo "=== 純粋ローカル構成（AWS非依存）軽量ZIPの作成を開始します ==="

# 不要な生成テキスト・不要ZIPファイルを事前に削除
rm -f "$PROJECT_ROOT"/HRConnect_*.txt "$PROJECT_ROOT"/HRConnect_*.zip

cd "$PROJECT_ROOT" || exit 1

# Python zipfile で不要パッケージ・キャッシュ・生成物を確実除外
python3 -c "
import os, zipfile

project_root = '$PROJECT_ROOT'
output_zip = '$OUTPUT_ZIP'

exclude_dirs = {
    'node_modules', '.venv', 'venv', '.next', '__pycache__', '.pytest_cache',
    '.git', 'coverage', 'test-results', 'out', 'dist', 'build', 'infra',
    '.mypy_cache', 'playwright-report', '.idea', '.vscode', 'scripts'
}
exclude_exts = {'.tar.gz', '.zip', '.pyc', '.DS_Store', '.tmp', '.log', '.sh', '.bat', '.cmd', '.ps1', '.exe'}

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(project_root):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in exclude_exts):
                continue
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, project_root)
            if arcname == os.path.basename(output_zip):
                continue
            zipf.write(file_path, arcname)
"

if [ -f "$OUTPUT_ZIP" ]; then
    SIZE_ZIP=$(du -h "$OUTPUT_ZIP" | cut -f1)
    echo "=========================================="
    echo "【超軽量ローカル専用ZIP作成完了】: $OUTPUT_ZIP ($SIZE_ZIP)"
    echo "=========================================="
else
    echo "エラー: ZIPファイルの作成に失敗しました。"
    exit 1
fi
