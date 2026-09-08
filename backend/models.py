from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Artist(Base):
    __tablename__ = "artists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    albums: Mapped[list[Album]] = relationship(
        "Album",
        back_populates="artist",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Artist(id={self.id!r}, name={self.name!r})>"


class Album(Base):
    __tablename__ = "albums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    cover_path: Mapped[str] = mapped_column(String(255), nullable=True)
    artist_id: Mapped[int] = mapped_column(
        ForeignKey("artists.id", ondelete="CASCADE"), nullable=False
    )

    artist: Mapped[Artist] = relationship("Artist", back_populates="albums")
    songs: Mapped[list[Song]] = relationship(
        "Song",
        back_populates="album",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Album(id={self.id!r}, title={self.title!r}, year={self.year!r})>"


class Song(Base):
    __tablename__ = "songs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    track_number: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    audio_path: Mapped[str] = mapped_column(String(255), nullable=False)
    album_id: Mapped[int] = mapped_column(
        ForeignKey("albums.id", ondelete="CASCADE"), nullable=False
    )

    album: Mapped[Album] = relationship("Album", back_populates="songs")
    lyrics: Mapped[Lyrics] = relationship(
        "Lyrics",
        back_populates="song",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Song(id={self.id!r}, title={self.title!r}, track_number={self.track_number!r})>"


class Lyrics(Base):
    __tablename__ = "lyrics"

    song_id: Mapped[int] = mapped_column(
        ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True
    )
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    translated_text: Mapped[str] = mapped_column(Text, nullable=False)

    song: Mapped[Song] = relationship("Song", back_populates="lyrics")

    def __repr__(self) -> str:
        return f"<Lyrics(song_id={self.song_id!r})>"
