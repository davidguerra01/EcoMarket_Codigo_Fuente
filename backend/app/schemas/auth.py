from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    role_id: int = 2  # CLIENTE por defecto
    nombre_tienda: Optional[str] = None  # solo para PRODUCTOR


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: int
    nombre: str
    email: str
    role_id: int
    estado: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True
