const API_URL = "http://127.0.0.1:8000";


let currentSongs = [];
let currentSongIndex = -1;
let currentSong = null;
let albumCovers = {};
const PLAYER_STATE_KEY = "herzelied-player-state";
const SONGS_KEY = "herzelied-songs";


/* =========================================================
   HELPERS
========================================================= */

function formatDuration(seconds) {

    if (!seconds || isNaN(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}


function getMediaPath(path) {

    if (!path) {
        return "";
    }

    if (path.startsWith("http")) {
        return path;
    }

    return `${API_URL}/${path.replace(/^\/+/, "")}`;
}


function getAudioPath(song) {
    const normalizedTitle = song.title
        .replace(/[äÄ]/g, "a")
        .replace(/[öÖ]/g, "o")
        .replace(/[üÜ]/g, "u")
        .replace(/ß/g, "ss")
        .replace(/\s+/g, "_");

    return `${API_URL}/media/songs/Rammstein/Rammstein_2019/${String(song.track_number).padStart(2, "0")}_${normalizedTitle}.mp3`;
}


function setPlayerCover(song) {
    const cover = document.getElementById("player-cover");
    if (!cover || !song) {
        return;
    }

    const coverPath = albumCovers[song.album_id] || "media/covers/rammstein/rammstein_2019.jpg";
    cover.style.backgroundImage = `url("${getMediaPath(coverPath)}")`;
    cover.style.backgroundSize = "cover";
    cover.style.backgroundPosition = "center";
}


function clearActivePlayerTranslations() {
    document.getElementById("player-title")?.removeAttribute("data-translation");
    document.getElementById("player-subtitle")?.removeAttribute("data-translation");
}


function savePlayerState(audio) {
    if (!currentSong || !audio) {
        return;
    }

    localStorage.setItem(
        PLAYER_STATE_KEY,
        JSON.stringify({
            songId: currentSong.id,
            currentTime: audio.currentTime,
            paused: audio.paused,
            volume: audio.volume,
        })
    );
}


function saveSongList(songs) {
    localStorage.setItem(SONGS_KEY, JSON.stringify(songs));
}


function getSavedSongList() {
    try {
        return JSON.parse(localStorage.getItem(SONGS_KEY)) || [];
    } catch {
        return [];
    }
}


function getPageFile(pathname) {
    if (pathname === "/album" || pathname === "/frontend/album.html") {
        return "/frontend/album.html";
    }

    if (pathname === "/song" || pathname === "/frontend/song.html") {
        return "/frontend/song.html";
    }

    return "/frontend/index.html";
}


async function loadCurrentPage() {
    const pathname = window.location.pathname;

    if (pathname === "/album" || pathname === "/frontend/album.html") {
        await loadAlbum();
        return;
    }

    if (pathname === "/song" || pathname === "/frontend/song.html") {
        await loadSong();
        return;
    }

    await Promise.all([
        loadAlbums(),
        loadSongs(),
    ]);
}


async function navigateTo(url, addHistory = true) {
    const target = new URL(url, window.location.origin);
    const audio = document.getElementById("global-audio");

    savePlayerState(audio);

    const response = await fetch(getPageFile(target.pathname));
    if (!response.ok) {
        window.location.assign(target.href);
        return;
    }

    const html = await response.text();
    const nextDocument = new DOMParser().parseFromString(html, "text/html");
    const nextMain = nextDocument.querySelector("main");
    const currentMain = document.querySelector("main");

    if (!nextMain || !currentMain) {
        window.location.assign(target.href);
        return;
    }

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title;

    if (addHistory) {
        window.history.pushState({}, "", target.href);
    }

    await loadCurrentPage();
}


function initializeNavigation() {
    document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");

        if (
            !link ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            link.target === "_blank"
        ) {
            return;
        }

        const target = new URL(link.href, window.location.origin);

        if (
            target.origin !== window.location.origin ||
            ![
                "/",
                "/album",
                "/song",
                "/frontend/album.html",
                "/frontend/song.html",
            ].includes(target.pathname)
        ) {
            return;
        }

        event.preventDefault();
        navigateTo(target.href).catch(error => console.error(error));
    });

    window.addEventListener("popstate", () => {
        navigateTo(window.location.href, false)
            .catch(error => console.error(error));
    });
}


async function restorePlayerState() {
    const audio = document.getElementById("global-audio");
    if (!audio) {
        return;
    }

    let state;
    try {
        state = JSON.parse(localStorage.getItem(PLAYER_STATE_KEY));
    } catch {
        return;
    }

    if (!state?.songId) {
        return;
    }

    let song = currentSongs.find(item => item.id === state.songId);
    if (!song) {
        const response = await fetch(`${API_URL}/songs/${state.songId}`);
        if (!response.ok) {
            return;
        }
        song = await response.json();
        currentSongs = getSavedSongList();
    }

    currentSong = song;
    currentSongIndex = currentSongs.findIndex(item => item.id === song.id);
    audio.volume = typeof state.volume === "number" ? state.volume : 1;
    audio.src = getAudioPath(song);

    document.getElementById("player-title").textContent = song.title;
    document.getElementById("player-subtitle").textContent = "Rammstein";
    clearActivePlayerTranslations();
    setPlayerCover(song);
    document.getElementById("player-duration").textContent = formatDuration(song.duration_seconds);

    audio.addEventListener("loadedmetadata", () => {
        audio.currentTime = state.currentTime || 0;
    }, { once: true });

    if (!state.paused) {
        audio.play().catch(() => {});
    }
}


/* =========================================================
   PLAYER
========================================================= */

function initializePlayer() {

    const audio =
        document.getElementById("global-audio");

    if (!audio) {
        return;
    }


    const playButton =
        document.getElementById("player-play");


    const previousButton =
        document.getElementById("player-prev");


    const nextButton =
        document.getElementById("player-next");


    const progressContainer =
        document.getElementById("progress-container");


    const volumeControl =
        document.getElementById("volume-control");


    /*
        PLAY / PAUSE
    */

    playButton?.addEventListener("click", () => {

        if (!currentSong) {
            return;
        }

        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }

    });


    /*
        PREVIOUS
    */

    previousButton?.addEventListener(
        "click",
        playPreviousSong
    );


    /*
        NEXT
    */

    nextButton?.addEventListener(
        "click",
        playNextSong
    );


    /*
        PROGRESS
    */

    audio.addEventListener("timeupdate", () => {

        updateProgress(audio);

    });


    audio.addEventListener("loadedmetadata", () => {

        document.getElementById(
            "player-duration"
        ).textContent =
            formatDuration(audio.duration);

    });


    /*
        SONG FINISHED
    */

    audio.addEventListener("ended", () => {

        playNextSong();

    });


    /*
        PLAY / PAUSE STATE
    */

    audio.addEventListener("play", () => {

        updatePlayerState(true);

    });


    audio.addEventListener("pause", () => {

        updatePlayerState(false);
        savePlayerState(audio);

    });


    /*
        CLICK ON PROGRESS BAR
    */

    progressContainer?.addEventListener(
        "click",
        (event) => {

            if (!audio.duration) {
                return;
            }


            const rect =
                progressContainer.getBoundingClientRect();


            const percent =
                (event.clientX - rect.left) /
                rect.width;


            audio.currentTime =
                percent * audio.duration;

        }
    );


    /*
        VOLUME
    */

    volumeControl?.addEventListener(
        "input",
        () => {

            audio.volume =
                volumeControl.value;

        }
    );


    /*
        DEFAULT VOLUME
    */

    audio.volume = 1;

    audio.addEventListener("timeupdate", () => savePlayerState(audio));

    window.addEventListener("beforeunload", () => savePlayerState(audio));
}


/* =========================================================
   UPDATE PLAYER
========================================================= */

function updatePlayerState(isPlaying) {

    const button =
        document.getElementById("player-play");


    if (button) {

        button.textContent =
            isPlaying ? "Ⅱ" : "▶";

    }


    /*
        Highlight current song
    */

    document
        .querySelectorAll(".song-card")
        .forEach(card => {

            const songId =
                Number(card.dataset.songId);


            if (
                currentSong &&
                songId === currentSong.id
            ) {

                card.classList.add(
                    "playing"
                );

            } else {

                card.classList.remove(
                    "playing"
                );

            }

        });


    /*
        Update every play button
    */

    document
        .querySelectorAll(".song-play")
        .forEach(button => {

            const card =
                button.closest(".song-card");


            if (!card || !currentSong) {
                button.textContent = "▶";
                return;
            }


            const songId =
                Number(card.dataset.songId);


            button.textContent =
                songId === currentSong.id && isPlaying
                    ? "Ⅱ"
                    : "▶";

        });
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress(audio) {

    const progressBar =
        document.getElementById("progress-bar");


    const currentTime =
        document.getElementById("player-current");


    if (!progressBar || !currentTime) {
        return;
    }


    if (!audio.duration) {
        return;
    }


    const percentage =
        (audio.currentTime / audio.duration) * 100;


    progressBar.style.width =
        `${percentage}%`;


    currentTime.textContent =
        formatDuration(audio.currentTime);
}


/* =========================================================
   PLAY SONG
========================================================= */

function playSong(song, songs = currentSongs) {

    const audio =
        document.getElementById("global-audio");


    if (!audio) {
        return;
    }


    currentSong =
        song;


    currentSongs =
        songs;


    currentSongIndex =
        currentSongs.findIndex(
            item => item.id === song.id
        );


    audio.src = getAudioPath(song);


    document.getElementById(
        "player-title"
    ).textContent =
        song.title;


    document.getElementById(
        "player-subtitle"
    ).textContent =
        "Rammstein";

    clearActivePlayerTranslations();
    setPlayerCover(song);


    document.getElementById(
        "player-current"
    ).textContent =
        "0:00";


    document.getElementById(
        "player-duration"
    ).textContent =
        formatDuration(song.duration_seconds);


    /*
        Save current song
    */

    localStorage.setItem(
        "herzelied-song-id",
        song.id
    );


    localStorage.setItem(
        "herzelied-song-title",
        song.title
    );

    saveSongList(currentSongs);


    /*
        Start playback
    */

    audio.play()
        .catch(error => {

            console.log(
                "Die Wiedergabe erfordert eine Benutzeraktion.",
                error
            );

        });


    updatePlayerState(true);
}


/* =========================================================
   NEXT
========================================================= */

function playNextSong() {
    if (!currentSongs.length) {
        return;
    }

    if (currentSongIndex === -1) {
        return;
    }


    const nextIndex =
        (currentSongIndex + 1)
        % currentSongs.length;


    playSong(
        currentSongs[nextIndex],
        currentSongs
    );
}


/* =========================================================
   PREVIOUS
========================================================= */

function playPreviousSong() {

    if (!currentSongs.length) {
        return;
    }


    if (currentSongIndex === -1) {
        return;
    }


    const previousIndex =
        (
            currentSongIndex -
            1 +
            currentSongs.length
        )
        % currentSongs.length;


    playSong(
        currentSongs[previousIndex],
        currentSongs
    );
}


/* =========================================================
   SONG CARD
========================================================= */

function createSongCard(song, songs) {

    const card =
        document.createElement("div");


    card.className =
        "song-card";


    card.dataset.songId =
        song.id;


    card.innerHTML = `

        <div class="song-number">
            ${String(song.track_number).padStart(2, "0")}
        </div>


        <div class="song-info">

            <h2>
                ${song.title}
            </h2>

            <p>
                ${formatDuration(song.duration_seconds)}
            </p>

        </div>


        <button
            class="song-play"
            aria-label="Abspielen: ${song.title}"
        >
            ▶
        </button>


        <a
            class="song-open"
            href="/frontend/song.html?id=${song.id}"
            aria-label="Öffnen: ${song.title}"
        >
            →
        </a>

    `;


    /*
        CLICK ANYWHERE ON CARD
    */

    card.addEventListener(
        "click",
        event => {

            /*
                Don't trigger player when
                clicking the arrow link.
            */

            if (
                event.target.closest(".song-open")
            ) {
                return;
            }


            /*
                Clicking the play button
                also comes here.
            */

            playSong(song, songs);

        }
    );


    /*
        Play button
    */

    const playButton =
        card.querySelector(".song-play");


    playButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            /*
                If this exact song is playing,
                clicking the button pauses it.
            */

            if (
                currentSong &&
                currentSong.id === song.id
            ) {

                const audio =
                    document.getElementById(
                        "global-audio"
                    );


                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }

                return;
            }


            playSong(song, songs);

        }
    );


    return card;
}


/* =========================================================
   ALBUMS
========================================================= */

async function loadAlbums() {

    const container =
        document.getElementById(
            "albums-container"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/albums`
            );


        if (!response.ok) {
            throw new Error(
                "Failed to load albums"
            );
        }


        const albums =
            await response.json();


        container.replaceChildren();


        albums.forEach(album => {

            albumCovers[album.id] = album.cover_path;

            const card =
                document.createElement("a");


            card.className =
                "album-card";


            card.href =
                `/frontend/album.html?id=${album.id}`;


            const cover =
                getMediaPath(
                    album.cover_path
                );


            card.innerHTML = `

                <div class="album-cover">

                    <img
                        src="${cover}"
                        alt="${album.title}"
                    >

                    <div class="album-overlay">
                        <span data-translation="Открыть альбом">ALBUM ÖFFNEN</span>
                    </div>

                </div>


                <div class="album-info">

                    <h3>
                        ${album.title}
                    </h3>

                    <p>
                        ${album.year}
                    </p>

                </div>

            `;


            container.appendChild(card);

        });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p class="error">
                Alben konnten nicht geladen werden.
            </p>
        `;
    }
}


/* =========================================================
   SONGS
========================================================= */

async function loadSongs() {

    const container =
        document.getElementById(
            "songs-container"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/songs`
            );


        if (!response.ok) {
            throw new Error(
                "Failed to load songs"
            );
        }


        const songs =
            await response.json();


        songs.sort(
            (a, b) =>
                a.track_number -
                b.track_number
        );


        currentSongs =
            songs;

        saveSongList(songs);


        container.replaceChildren();


        songs.forEach(song => {

            container.appendChild(
                createSongCard(
                    song,
                    songs
                )
            );

        });

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p class="error">
                Lieder konnten nicht geladen werden.
            </p>
        `;
    }
}


/* =========================================================
   ALBUM PAGE
========================================================= */

async function loadAlbum() {

    const albumTitle =
        document.getElementById(
            "album-title"
        );


    if (!albumTitle) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const albumId =
        params.get("id");


    if (!albumId) {

        albumTitle.textContent =
            "Album not found";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/albums/${albumId}`
            );


        if (!response.ok) {
            throw new Error(
                "Album not found"
            );
        }


        const album =
            await response.json();

        albumCovers[album.id] = album.cover_path;


        document.title =
            `${album.title} — HerzeLied`;


        albumTitle.textContent =
            album.title;


        document.getElementById(
            "album-year"
        ).textContent =
            album.year;


        document.getElementById(
            "album-track-count"
        ).textContent =
            `${album.songs.length} Titel`;


        /*
            COVER
        */

        const cover =
            document.getElementById(
                "album-cover"
            );


        if (album.cover_path) {

            cover.src =
                getMediaPath(
                    album.cover_path
                );

        }


        /*
            SONGS
        */

        const container =
            document.getElementById(
                "album-songs"
            );


        const albumSongs =
            [...album.songs].sort(
                (a, b) =>
                    a.track_number -
                    b.track_number
            );

        if (!currentSong) {
            currentSongs = albumSongs;
        }


        container.replaceChildren();


        albumSongs.forEach(song => {

            container.appendChild(
                createSongCard(
                    song,
                    currentSongs
                )
            );

        });

    } catch (error) {

        console.error(error);

        albumTitle.textContent =
            "Album konnte nicht geladen werden";
    }
}


/* =========================================================
   SONG PAGE
========================================================= */

async function loadSong() {

    const titleElement =
        document.getElementById(
            "song-title"
        );


    if (!titleElement) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const songId =
        params.get("id");


    if (!songId) {

        titleElement.textContent =
            "Song not found";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/songs/${songId}`
            );


        if (!response.ok) {
            throw new Error(
                "Song not found"
            );
        }


        const song =
            await response.json();


        document.title =
            `${song.title} — HerzeLied`;


        titleElement.textContent =
            song.title;


        document.getElementById(
            "track-number"
        ).textContent =
            `TITEL ${String(song.track_number).padStart(2, "0")}`;


        document.getElementById(
            "song-duration"
        ).textContent =
            formatDuration(
                song.duration_seconds
            );


        /*
            Set song in player,
            but don't autoplay.
        */

        const audio =
            document.getElementById("global-audio");

        const keepCurrentPlayback =
            currentSong && audio && audio.src;

        if (!keepCurrentPlayback) {
            currentSong = song;
        }


        const songsResponse = await fetch(`${API_URL}/songs`);
        const songs = songsResponse.ok ? await songsResponse.json() : [song];

        currentSongs = songs.sort(
            (firstSong, secondSong) => firstSong.track_number - secondSong.track_number
        );

        if (!keepCurrentPlayback) {
            currentSong = song;
        }

        currentSongIndex = currentSongs.findIndex(
            item => item.id === currentSong.id
        );


        if (audio && !keepCurrentPlayback) {

            audio.src =
                `${API_URL}/songs/${song.id}/audio`;

        }


        if (!keepCurrentPlayback) {
            document.getElementById(
                "player-title"
            ).textContent =
                song.title;
        }


        document.getElementById(
            "player-subtitle"
        ).textContent =
            "Rammstein";


        await loadLyrics(songId);

    } catch (error) {

        console.error(error);

        titleElement.textContent =
            "Lied konnte nicht geladen werden";
    }
}


/* =========================================================
   LYRICS
========================================================= */

async function loadLyrics(songId) {

    const container =
        document.getElementById(
            "lyrics-rows"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/songs/${songId}/lyrics`
            );


        if (!response.ok) {
            throw new Error(
                "Lyrics not found"
            );
        }


        const data =
            await response.json();


        renderLyrics(
            container,
            data.lyrics
        );

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="lyrics-state">
                Liedtexte wurden nicht gefunden.
            </div>
        `;
    }
}


function renderLyrics(
    container,
    lyrics
) {

    container.replaceChildren();


    lyrics.forEach(line => {

        const pair =
            document.createElement("div");


        const original =
            document.createElement("div");


        const translation =
            document.createElement("div");


        pair.className =
            "lyrics-pair";


        original.className =
            "lyrics-line";


        translation.className =
            "lyrics-line translation";


        original.textContent =
            line.original;


        translation.textContent =
            line.translation;


        pair.append(
            original,
            translation
        );


        container.appendChild(
            pair
        );

    });
}


/* =========================================================
   INIT
========================================================= */

function initialize() {

    initializeNavigation();

    initializePlayer();

    loadCurrentPage()
        .then(restorePlayerState)
        .catch(error => console.error(error));

}


initialize();