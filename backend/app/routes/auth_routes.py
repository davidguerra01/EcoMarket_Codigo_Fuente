from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role
from app.models.models import Producer, TokenSession
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    """Lista todos los roles disponibles."""
    roles = db.query(Role).all()
    return [{"id": r.id, "nombre": r.nombre} for r in roles]


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registro de usuario (CLIENTE o PRODUCTOR).
    Genera Access Token + Refresh Token al registrarse.
    """
    # Validar que el rol exista
    role = db.query(Role).filter(Role.id == body.role_id).first()
    if not role:
        raise HTTPException(status_code=400, detail="Rol no válido")

    # Email único
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

    # Crear usuario
    user = User(
        nombre=body.nombre,
        email=body.email,
        password_hash=hash_password(body.password),
        telefono=body.telefono,
        role_id=body.role_id,
    )
    db.add(user)
    db.flush()  # obtener user.id sin commit

    # Si es PRODUCTOR, crear perfil de productor
    if role.nombre == "PRODUCTOR":
        if not body.nombre_tienda:
            raise HTTPException(status_code=400, detail="nombre_tienda es requerido para PRODUCTOR")
        producer = Producer(usuario_id=user.id, nombre_tienda=body.nombre_tienda)
        db.add(producer)

    db.commit()
    db.refresh(user)

    # Generar tokens
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})

    # Persistir sesión en BD
    db.add(TokenSession(usuario_id=user.id, token=access))
    db.commit()

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "email": user.email,
            "role": role.nombre,
        },
    }


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Autenticación con email/contraseña.
    Retorna Access Token (60 min) + Refresh Token (7 días).
    """
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if user.estado != "ACTIVO":
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    role = db.query(Role).filter(Role.id == user.role_id).first()

    # Generar tokens
    access = create_access_token({"sub": str(user.id)})
    refresh = create_refresh_token({"sub": str(user.id)})

    # Persistir sesión
    db.add(TokenSession(usuario_id=user.id, token=access))
    db.commit()

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre": user.nombre,
            "email": user.email,
            "role": role.nombre if role else "CLIENTE",
        },
    }


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    credentials=Depends(__import__("app.core.security", fromlist=["bearer_scheme"]).bearer_scheme),
):
    """Invalida el token activo en base de datos."""
    token = credentials.credentials
    session = db.query(TokenSession).filter(TokenSession.token == token).first()
    if session:
        session.activo = False
        db.commit()
    return {"message": "Sesión cerrada correctamente"}


@router.post("/refresh")
def refresh_token(body: dict, db: Session = Depends(get_db)):
    """Genera un nuevo Access Token usando el Refresh Token."""
    from app.core.security import decode_token

    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token requerido")

    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token de refresco inválido")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    new_access = create_access_token({"sub": str(user.id)})
    db.add(TokenSession(usuario_id=user.id, token=new_access))
    db.commit()

    return {"access_token": new_access, "token_type": "bearer"}
