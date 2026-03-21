from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base


class User(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    telefono = Column(String(20))
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    estado = Column(String(20), default="ACTIVO", nullable=False)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())
