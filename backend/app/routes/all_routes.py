from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.models import (
    Category, Product, Producer, ProducerLocation,
    Cart, CartItem, Order, OrderItem, Payment, Notification
)
import math

# ── Categorías ────────────────────────────────────────────────────────────────
category_router = APIRouter(prefix="/categorias", tags=["Categorías"])

@category_router.get("/")
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@category_router.post("/", status_code=201)
def create_category(body: dict, db: Session = Depends(get_db), _=Depends(get_current_user)):
    cat = Category(nombre=body["nombre"], descripcion=body.get("descripcion"))
    db.add(cat); db.commit(); db.refresh(cat)
    return cat


# ── Productos ─────────────────────────────────────────────────────────────────
product_router = APIRouter(prefix="/productos", tags=["Productos"])

@product_router.get("/")
def list_products(
    categoria_id: Optional[int] = None,
    q: Optional[str] = None,
    min_precio: Optional[float] = None,
    max_precio: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.estado == "ACTIVO")
    if categoria_id:
        query = query.filter(Product.categoria_id == categoria_id)
    if q:
        query = query.filter(Product.nombre.ilike(f"%{q}%"))
    if min_precio is not None:
        query = query.filter(Product.precio >= min_precio)
    if max_precio is not None:
        query = query.filter(Product.precio <= max_precio)
    products = query.all()
    result = []
    for p in products:
        prod = db.query(Producer).filter(Producer.id == p.productor_id).first()
        result.append({
            "id": p.id, "nombre": p.nombre, "descripcion": p.descripcion,
            "precio": float(p.precio), "stock": p.stock, "unidad": p.unidad,
            "es_ecologico": p.es_ecologico, "categoria_id": p.categoria_id,
            "productor_id": p.productor_id,
            "productor_nombre": prod.nombre_tienda if prod else None,
            "productor_verificado": prod.verificado if prod else False,
        })
    return result

@product_router.post("/", status_code=201)
def create_product(body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    producer = db.query(Producer).filter(Producer.usuario_id == current_user.id).first()
    if not producer:
        raise HTTPException(status_code=403, detail="Solo productores pueden crear productos")
    product = Product(
        productor_id=producer.id,
        categoria_id=body["categoria_id"],
        nombre=body["nombre"],
        descripcion=body.get("descripcion"),
        precio=body["precio"],
        stock=body.get("stock", 0),
        unidad=body.get("unidad", "unidad"),
    )
    db.add(product); db.commit(); db.refresh(product)
    return product


# ── Productores ───────────────────────────────────────────────────────────────
producer_router = APIRouter(prefix="/productores", tags=["Productores"])

@producer_router.post("/mi-ubicacion")
def set_location(body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    producer = db.query(Producer).filter(Producer.usuario_id == current_user.id).first()
    if not producer:
        raise HTTPException(status_code=403, detail="Solo productores")
    loc = db.query(ProducerLocation).filter(ProducerLocation.productor_id == producer.id).first()
    if loc:
        loc.latitud = body["latitud"]; loc.longitud = body["longitud"]
        loc.radio_km = body.get("radio_km", 10)
    else:
        loc = ProducerLocation(
            productor_id=producer.id,
            latitud=body["latitud"], longitud=body["longitud"],
            radio_km=body.get("radio_km", 10)
        )
        db.add(loc)
    db.commit()
    return {"message": "Ubicación guardada", "latitud": body["latitud"], "longitud": body["longitud"]}

@producer_router.get("/cercanos")
def nearby_producers(lat: float, lng: float, radio_km: int = 20, db: Session = Depends(get_db)):
    locations = db.query(ProducerLocation).all()
    result = []
    for loc in locations:
        # Fórmula Haversine simplificada
        dlat = math.radians(float(loc.latitud) - lat)
        dlng = math.radians(float(loc.longitud) - lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(float(loc.latitud))) * math.sin(dlng/2)**2
        dist = 6371 * 2 * math.asin(math.sqrt(a))
        if dist <= radio_km:
            prod = db.query(Producer).filter(Producer.id == loc.productor_id).first()
            result.append({
                "productor_id": prod.id, "nombre_tienda": prod.nombre_tienda,
                "verificado": prod.verificado, "distancia_km": round(dist, 2),
                "latitud": float(loc.latitud), "longitud": float(loc.longitud),
            })
    result.sort(key=lambda x: x["distancia_km"])
    return result


# ── Carrito ───────────────────────────────────────────────────────────────────
cart_router = APIRouter(prefix="/carrito", tags=["Carrito"])

@cart_router.get("/")
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.usuario_id == current_user.id).first()
    if not cart:
        return {"items": [], "total": 0}
    items = db.query(CartItem).filter(CartItem.carrito_id == cart.id).all()
    result = []
    total = 0
    for item in items:
        prod = db.query(Product).filter(Product.id == item.producto_id).first()
        subtotal = float(item.precio_unitario) * item.cantidad
        total += subtotal
        result.append({
            "id": item.id, "producto_id": item.producto_id,
            "nombre": prod.nombre if prod else "—",
            "cantidad": item.cantidad, "precio_unitario": float(item.precio_unitario),
            "subtotal": subtotal,
        })
    return {"items": result, "total": round(total, 2)}

@cart_router.post("/items", status_code=201)
def add_to_cart(body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.usuario_id == current_user.id).first()
    if not cart:
        cart = Cart(usuario_id=current_user.id)
        db.add(cart); db.flush()
    product = db.query(Product).filter(Product.id == body["producto_id"]).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    existing = db.query(CartItem).filter(
        CartItem.carrito_id == cart.id, CartItem.producto_id == body["producto_id"]
    ).first()
    if existing:
        existing.cantidad += body.get("cantidad", 1)
    else:
        db.add(CartItem(
            carrito_id=cart.id, producto_id=product.id,
            cantidad=body.get("cantidad", 1), precio_unitario=product.precio,
        ))
    db.commit()
    return {"message": "Producto agregado al carrito"}

@cart_router.post("/checkout")
def checkout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cart = db.query(Cart).filter(Cart.usuario_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=400, detail="Carrito vacío")
    items = db.query(CartItem).filter(CartItem.carrito_id == cart.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="Carrito vacío")
    total = sum(float(i.precio_unitario) * i.cantidad for i in items)
    order = Order(usuario_id=current_user.id, total=total)
    db.add(order); db.flush()
    for item in items:
        db.add(OrderItem(
            orden_id=order.id, producto_id=item.producto_id,
            cantidad=item.cantidad, precio_unitario=item.precio_unitario,
            subtotal=float(item.precio_unitario) * item.cantidad,
        ))
        db.delete(item)
    db.commit()
    # Notificación automática
    db.add(Notification(
        usuario_id=current_user.id,
        titulo="Orden creada",
        mensaje=f"Tu orden #{order.id} por ${total:.2f} fue creada exitosamente.",
    ))
    db.commit()
    return {"message": "Orden creada", "orden_id": order.id, "total": total}


# ── Órdenes ───────────────────────────────────────────────────────────────────
order_router = APIRouter(prefix="/ordenes", tags=["Órdenes"])

@order_router.get("/mias")
def my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    orders = db.query(Order).filter(Order.usuario_id == current_user.id).order_by(Order.fecha_creacion.desc()).all()
    return [{"id": o.id, "total": float(o.total), "estado": o.estado, "fecha": str(o.fecha_creacion)} for o in orders]


# ── Pagos ─────────────────────────────────────────────────────────────────────
payment_router = APIRouter(prefix="/pagos", tags=["Pagos"])

@payment_router.post("/confirmar")
def confirm_payment(body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from datetime import datetime
    order = db.query(Order).filter(Order.id == body["orden_id"], Order.usuario_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    payment = Payment(
        orden_id=order.id,
        metodo=body.get("metodo", "TRANSFERENCIA"),
        estado="COMPLETADO",
        referencia=body.get("referencia"),
        fecha_pago=datetime.utcnow(),
    )
    order.estado = "PAGADA"
    db.add(payment); db.commit()
    return {"message": "Pago confirmado", "orden_id": order.id, "estado": "PAGADA"}


# ── Notificaciones ────────────────────────────────────────────────────────────
notification_router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])

@notification_router.get("/")
def get_notifications(
    no_leidas: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Notification).filter(Notification.usuario_id == current_user.id)
    if no_leidas:
        query = query.filter(Notification.leido == False)
    notifs = query.order_by(Notification.fecha_creacion.desc()).all()
    return [{"id": n.id, "titulo": n.titulo, "mensaje": n.mensaje, "leido": n.leido, "fecha": str(n.fecha_creacion)} for n in notifs]

@notification_router.put("/{notif_id}/leer")
def mark_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.usuario_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    notif.leido = True; db.commit()
    return {"message": "Marcada como leída"}
