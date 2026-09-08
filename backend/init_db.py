from backend.database import engine, Base

def init_db() -> None:
    # Import models to ensure they are registered with Base.metadata
    import backend.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
