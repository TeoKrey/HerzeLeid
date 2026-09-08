from backend.database import SessionLocal
from backend.models import Artist, Album, Song

session = SessionLocal()

album = session.query(Album).filter_by(
    title="Rammstein_2019"
).first()

songs = [
    Song(
    title="Deutschland",
    track_number=1,
    duration_seconds=322,
    audio_path="media/songs/Rammstein/Rammstein_2019/01_Deutschland.mp3",
    album_id=album.id
    ),
    Song(
    title="Radio",
    track_number=2,
    duration_seconds=277,
    audio_path="media/songs/Rammstein/Rammstein_2019/02_Radio.mp3",
    album_id=album.id
    ),
    Song(
    title="Zeig Dich",
    track_number=3,
    duration_seconds=256,
    audio_path="media/songs/Rammstein/Rammstein_2019/03_Zeig_Dich.mp3",
    album_id=album.id
    ),
    Song(
    title="Ausländer",
    track_number=4,
    duration_seconds=230,
    audio_path="media/songs/Rammstein/Rammstein_2019/04_Ausländer.mp3",
    album_id=album.id
    ),
    Song(
    title="Sex",
    track_number=5,
    duration_seconds=237,
    audio_path="media/songs/Rammstein/Rammstein_2019/05_Sex.mp3",
    album_id=album.id
    ),
    Song(
    title="Puppe",
    track_number=6,
    duration_seconds=274,
    audio_path="media/songs/Rammstein/Rammstein_2019/06_Puppe.mp3",
    album_id=album.id
    ),
    Song(
    title="Was Ich Liebe",
    track_number=7,
    duration_seconds=269,
    audio_path="media/songs/Rammstein/Rammstein_2019/07_Was_ich_liebe.mp3",
    album_id=album.id
    ),
    Song(
    title="Diamant",
    track_number=8,
    duration_seconds=154,
    audio_path="media/songs/Rammstein/Rammstein_2019/08_Diamant.mp3",
    album_id=album.id
    ),
    Song(
    title="Weit Weg",
    track_number=9,
    duration_seconds=261,  
    audio_path="media/songs/Rammstein/Rammstein_2019/09_Weit_weg.mp3",
    album_id=album.id
    ),
    Song(
    title="Tattoo",
    track_number=10,
    duration_seconds=252,
    audio_path="media/songs/Rammstein/Rammstein_2019/10_Tattoo.mp3",
    album_id=album.id
    ),
    Song(
    title="Hallomann",
    track_number=11,
    duration_seconds=252,
    audio_path="media/songs/Rammstein/Rammstein_2019/11_Hallomann.mp3",
    album_id=album.id
    )
]
session.add_all(songs)
session.commit()
session.close()