from fastapi import FastAPI
import logging

from backend.database import SessionLocal
from backend.models import Song, Album

from backend.init_db import init_db

app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
        logging.info("Database initialized via init_db.init_db()")
    except Exception as exc:
        logging.exception("Failed to initialize database tables: %s", exc)


@app.get('/')
def read_root():
    return {"message": "Herzenlich willkommen bei der FastAPI-Anwendung!"}


@app.get("/songs")
def get_songs():
    db = SessionLocal()
    try:
        songs = db.query(Song).all()
        return [
            {
                "id": song.id,
                "title": song.title,
                "track_number": song.track_number,
                "duration_seconds": song.duration_seconds,
                "album_id": song.album_id,
            }
            for song in songs
        ]
    finally:
        db.close()

@app.get("/albums")
def get_albums():
    db = SessionLocal()
    try:
        albums = db.query(Album).all()
        return [
            {
                "id": album.id,
                "title": album.title,
                "year": album.year,
                "cover_path": album.cover_path,
                "artist_id": album.artist_id,
            }
            for album in albums
        ]
    finally:
        db.close()
