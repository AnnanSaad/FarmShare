from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .seed import seed
from .database import Base, engine
from .routers import equipment, bookings, admin

Base.metadata.create_all(bind=engine)
seed()
app = FastAPI(
    title="FarmShare API",
    description="Shared farm equipment management system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    equipment.router,
    prefix="/api/equipment",
    tags=["Equipment"],
)

app.include_router(
    bookings.router,
    prefix="/api/bookings",
    tags=["Bookings"],
)

app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin"],
)


@app.get("/")
def root():
    return {
        "name": "FarmShare",
        "status": "operational",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "farmshare-api",
    }