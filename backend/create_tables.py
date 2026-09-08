from backend.database import engine, Base

def main() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables created (or already existed).")


if __name__ == "__main__":
    main()
