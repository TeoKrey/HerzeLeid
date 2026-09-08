from backend.database import SessionLocal
from backend.models import Artist, Album, Lyrics, Song

session = SessionLocal()

song = session.query(Song).filter_by(
    title="Deutschland"
).first()