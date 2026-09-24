from uuid import UUID, uuid4
from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """
    全てのデータベースモデルの基底クラス。
    
    共通のUUID主キー定義と、テーブル名の自動生成機能（DeclarativeBaseの機能）を提供します。
    すべてのモデルはこのクラスを継承する必要があります。
    """

    # to generate tablename from class name
    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        primary_key=True, default=uuid4, server_default=func.gen_random_uuid()
    )
