from fastapi import FastAPI, HTTPException
import logging

from backend.database import SessionLocal
from backend.models import Song, Album, Lyrics
from backend.init_db import init_db

from pydantic import BaseModel

from fastapi.responses import FileResponse

####### для фронта
from fastapi.staticfiles import StaticFiles
#######

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
    cover_path: str | None
    artist_id: int
    songs: list[SongResponse]


class LyricsLine(BaseModel):
    original: str
    translation: str


class LyricsResponse(BaseModel):
    song_id: int
    lyrics: list[LyricsLine]

app = FastAPI()
app.mount(
    "/frontend", 
    StaticFiles(directory="frontend"), 
    name="frontend"
    )
app.mount(
    "/media",
    StaticFiles(directory="media"),
    name="media"
)

@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
        logging.info("Database initialized via init_db.init_db()")
    except Exception as exc:
        logging.exception("Failed to initialize database tables: %s", exc)

@app.get("/song")
def song_page():
    return FileResponse("frontend/song.html")

@app.get("/")
def read_root():
    return FileResponse("frontend/index.html")

@app.get("/songs")
def get_songs():
    db = SessionLocal()
    try:
        songs = (
            db.query(Song)
            .order_by(Song.track_number)
            .all()
        )
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
            cover_path=album.cover_path,
            songs=[
                SongResponse(
                    id=song.id,
                    title=song.title,
                    track_number=song.track_number,
                    duration_seconds=song.duration_seconds,
                    album_id=song.album_id,
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

        original_lines = lyrics.original_text.splitlines()
        translated_lines = lyrics.translated_text.splitlines()
        line_count = max(len(original_lines), len(translated_lines))

        return LyricsResponse(
            song_id=lyrics.song_id,
            lyrics=[
                LyricsLine(
                    original=original_lines[index] if index < len(original_lines) else "",
                    translation=(
                        translated_lines[index]
                        if index < len(translated_lines)
                        else ""
                    ),
                )
                for index in range(line_count)
            ],
        )
    finally:
        db.close()

@app.get("/songs/{song_id}", response_model=SongResponse)
def get_song(song_id: int):
    db = SessionLocal()
    try:
        song = db.query(Song).filter(Song.id == song_id).first()
        if song is None:
            raise HTTPException(status_code=404, detail="Song not found")
        return SongResponse(
            id=song.id,
            title=song.title,
            track_number=song.track_number,
            duration_seconds=song.duration_seconds,
            album_id=song.album_id,
        )
    finally:
        db.close()

# передача мп3 файла браузеру
@app.get("/songs/{song_id}/audio")
def get_song_audio(song_id: int):
    db = SessionLocal()
    try:
        song = db.query(Song).filter(Song.id == song_id).first()
        if song is None:
            raise HTTPException(status_code=404, detail="Song not found")
        return FileResponse(
            song.audio_path,
            media_type="audio/mpeg",
            content_disposition_type="inline",
        )
    finally:
        db.close()