from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from app.db.base import Base


class Producer(Base):
    __tablename__ = "productores"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    nombre_tienda = Column(String(120), nullable=False)
    descripcion = Column(Text)
    verificado = Column(Boolean, default=False)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())


class ProducerLocation(Base):
    __tablename__ = "ubicaciones_productor"
    id = Column(Integer, primary_key=True)
    productor_id = Column(Integer, ForeignKey("productores.id"), unique=True, nullable=False)
    latitud = Column(Numeric(10, 7), nullable=False)
    longitud = Column(Numeric(10, 7), nullable=False)
    radio_km = Column(Integer, default=10)


class Category(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(80), unique=True, nullable=False)
    descripcion = Column(String(200))


class Product(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True)
    productor_id = Column(Integer, ForeignKey("productores.id"), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(Text)
    precio = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    unidad = Column(String(30), default="unidad")
    es_ecologico = Column(Boolean, default=True)
    estado = Column(String(20), default="ACTIVO")
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())


class TokenSession(Base):
    __tablename__ = "sesiones_tokens"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    token = Column(Text, nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())


class Cart(Base):
    __tablename__ = "carritos"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())


class CartItem(Base):
    __tablename__ = "carrito_items"
    id = Column(Integer, primary_key=True)
    carrito_id = Column(Integer, ForeignKey("carritos.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)


class Order(Base):
    __tablename__ = "ordenes"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    estado = Column(String(20), default="PENDIENTE")
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())


class OrderItem(Base):
    __tablename__ = "orden_items"
    id = Column(Integer, primary_key=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)


class Payment(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True)
    orden_id = Column(Integer, ForeignKey("ordenes.id"), unique=True, nullable=False)
    metodo = Column(String(30), default="TRANSFERENCIA")
    estado = Column(String(20), default="PENDIENTE")
    referencia = Column(String(120))
    fecha_pago = Column(TIMESTAMP(timezone=True))


class Notification(Base):
    __tablename__ = "notificaciones"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(120), nullable=False)
    mensaje = Column(Text, nullable=False)
    leido = Column(Boolean, default=False)
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())
