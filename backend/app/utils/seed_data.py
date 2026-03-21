"""
Seed inicial: roles + categorías
Ejecutar: python -m app.utils.seed_data
"""
from app.db.session import SessionLocal
from app.models.role import Role
from app.models.models import Category


def seed():
    db = SessionLocal()
    try:
        roles = ["ADMIN", "CLIENTE", "PRODUCTOR"]
        for nombre in roles:
            if not db.query(Role).filter(Role.nombre == nombre).first():
                db.add(Role(nombre=nombre))

        categorias = [
            ("Alimentos", "Productos orgánicos y naturales"),
            ("Hogar", "Artículos sostenibles para el hogar"),
            ("Higiene", "Cuidado personal ecológico"),
            ("Agricultura", "Productos locales del campo"),
        ]
        for nombre, desc in categorias:
            if not db.query(Category).filter(Category.nombre == nombre).first():
                db.add(Category(nombre=nombre, descripcion=desc))

        db.commit()
        print("✅ Seed completado: roles y categorías insertados")
    except Exception as e:
        print(f"❌ Error en seed: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
