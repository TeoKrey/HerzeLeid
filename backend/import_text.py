from pathlib import Path

from backend.database import SessionLocal
from backend.models import Song, Lyrics

session = SessionLocal()
lyrics_dir = Path("media/lyrics/Rammstein/Rammstein_2019")

for file_path in lyrics_dir.glob("*.txt"):
    song_title = file_path.stem.split("_", 1)[1].replace("_", " ")
    song = session.query(Song).filter_by(title=song_title).first()
    if song is None:
        print(f"Song not found: {song_title}")
        continue

    text = file_path.read_text(encoding="utf-8")

    original_text, translated_text = text.split("[TRANSLATION]", 1)

    original_text = original_text.replace("[ORIGINAL]", "").strip()
    translated_text = translated_text.strip()

    lyrics = Lyrics(
        song_id=song.id,
        original_text=original_text,
        translated_text=translated_text,
    )
    session.add(lyrics)
    
session.commit()
session.close()

print("Finished")
