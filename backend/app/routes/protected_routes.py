from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/protected", tags=["Protegido"])


@router.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_user)):
    """
    Endpoint protegido — requiere Authorization: Bearer <token>
    Valida el token y retorna datos del usuario autenticado.
    """
    return {
        "message": f"¡Bienvenido a EcoMarket, {current_user.nombre}!",
        "user_id": current_user.id,
        "email": current_user.email,
        "role_id": current_user.role_id,
        "estado": current_user.estado,
    }


@router.get("/perfil")
def perfil(current_user: User = Depends(get_current_user)):
    """Perfil completo del usuario autenticado."""
    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "email": current_user.email,
        "telefono": current_user.telefono,
        "role_id": current_user.role_id,
        "estado": current_user.estado,
    }
