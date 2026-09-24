# Backend Scripts

このディレクトリには、開発・運用・デバッグ用のスクリプトが含まれています。

## 実行方法

これらのスクリプトは `app` モジュール（バックエンドアプリケーション）に依存しているため、実行時には `backend` ディレクトリを `PYTHONPATH` に含める必要があります。

### プロジェクトルート (`HRConnect/`) から実行する場合

```bash
# 例: seed_data.py を実行
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
python backend/scripts/seed_data.py
```

### `backend` ディレクトリから実行する場合

```bash
cd backend
export PYTHONPATH=$PYTHONPATH:$(pwd)
python scripts/seed_data.py
```

または、ワンライナーで実行:

```bash
PYTHONPATH=. python scripts/seed_data.py
```
