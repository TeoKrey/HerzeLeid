from fastapi import FastAPI, HTTPException
import logging

from backend.database import SessionLocal
from backend.models import Song, Album, Lyrics
from backend.init_db import init_db

from pydantic import BaseModel

class SongResponse(BaseModel):
    id: int
    title: str
    track_number: int
    duration_seconds: int
    album_id: int

class AlbumResponse(BaseModel):
    id: int
    title: str
    year: int
    artist_id: int
    songs: list[SongResponse]

class LyricsResponse(BaseModel):
    song_id: int
    original_text: str
    translated_text: str

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

@app.get("/albums/{album_id}", response_model=AlbumResponse)
def get_album(album_id: int):
    db = SessionLocal()
    try:
        album = db.query(Album).filter(Album.id == album_id).first()
        if album is None:
            raise HTTPException(status_code=404, detail="Album not found")
        return AlbumResponse(
            id=album.id,
            title=album.title,
            year=album.year,
            artist_id=album.artist_id,
            songs=[
                SongResponse(
                    id=song.id,
                    title=song.title,
                    track_number=song.track_number
                )
                for song in album.songs
            ]
        )
    finally:
        db.close() 

@app.get("/songs/{song_id}/lyrics", response_model=LyricsResponse)
def get_song_lyrics(song_id: int):
    db = SessionLocal()
    try:
        lyrics = db.query(Lyrics).filter(Lyrics.song_id == song_id).first()
        if lyrics is None:
            raise HTTPException(status_code=404, detail="Lyrics not found")
        return LyricsResponse(
            song_id=lyrics.song_id,
            original_text=lyrics.original_text,
            translated_text=lyrics.translated_text,
        )
    finally:
        db.close()