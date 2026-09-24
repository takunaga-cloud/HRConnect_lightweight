from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import sys
import os
# バックエンドのルートディレクトリをパスに追加して app モジュールを読み込めるようにする
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# あなたのモデルの Base クラスをインポート
# ※ Cursorが作った構成によりますが、一般的には以下のような場所です
from app.models import Base
# もしエラーになる場合は from app.models import Base などを試してください

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # 環境変数の DATABASE_URL を最優先で適用する
    db_url = os.getenv("DATABASE_URL")
    
    # 非同期ドライバー表記がある場合は、Alembicの同期エンジン用に自動変換する
    if db_url:
        if db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        elif db_url.startswith("sqlite+aiosqlite://"):
            db_url = db_url.replace("sqlite+aiosqlite://", "sqlite://")
            
    section = config.get_section(config.config_ini_section, {})
    if db_url:
        section["sqlalchemy.url"] = db_url

    connectable = engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
