from backend.database import SessionLocal
from backend.models import Artist, Album

session = SessionLocal()

artist = Artist(
    name = "Rammstein"
)
session.add(artist)
session.commit()
# session.close()
print(artist.id)

artist = session.query(Artist).filter_by(name="Rammstein").first()

album = Album(
    title = 'Rammstein_2019',
    year = 2019,
    cover_path = "media\covers\rammstein\rammstein_2019.jpg",
    artist = artist
)
session.add(album)
session.commit()

print(album.id)
print(album.artist_id)
print(album.artist.name)
print(artist.albums)
session.close()