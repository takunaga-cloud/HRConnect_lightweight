from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.models import Base

class SystemDefinition(Base):
    __tablename__ = "system_definitions"

    category_code: Mapped[str] = mapped_column(String, nullable=False, index=True)
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
