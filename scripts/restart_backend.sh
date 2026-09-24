#!/bin/bash
# バックエンドを全インターフェース(0.0.0.0)で待機するように再起動します。
# これにより、localhost (IPv6/IPv4 の両方) からのアクセスを確実に受け取れるようになります。

echo "Restarting backend with host 0.0.0.0..."
pkill -f "uvicorn app.main:app"
cd /home/takunaga/HRConnect/backend
nohup ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1 &
echo "Backend restarted in background. Logging to backend/uvicorn.log"
