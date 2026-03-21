from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.protected_routes import router as protected_router
from app.routes.all_routes import (
    category_router, product_router, producer_router,
    cart_router, order_router, payment_router, notification_router
)

app = FastAPI(
    title="🌿 EcoMarket API",
    description="API REST para EcoMarket — Plataforma de comercio ecológico local. FastAPI + PostgreSQL + JWT",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(protected_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(producer_router)
app.include_router(cart_router)
app.include_router(order_router)
app.include_router(payment_router)
app.include_router(notification_router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "✅ EcoMarket Backend funcionando",
        "version": "2.0.0",
        "docs": "/docs",
    }
