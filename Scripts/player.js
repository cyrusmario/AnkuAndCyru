// ============================================================
// player.js — Media Controller / Music Player
// ============================================================

const MusicPlayer = (() => {
    // DOM Elements
    const bgMusic = document.getElementById('bgMusic');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const loopBtn = document.getElementById('loopBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const totalDurationEl = document.getElementById('totalDuration');
    const volumeBar = document.getElementById('volumeBar');
    const muteBtn = document.getElementById('muteBtn');
    const songNameEl = document.querySelector('.song-name');
    const artistNameEl = document.querySelector('.artist-name');
    const albumArtEl = document.querySelector('.album-art');
    const playlistBtn = document.getElementById('playlistBtn');
    const playlistPanel = document.getElementById('playlistPanel');
    const closePlaylistBtn = document.getElementById('closePlaylist');
    const playlistList = document.getElementById('playlistList');

    // State
    let currentSongIndex = 0;
    let isPlaying = false;
    let userVolume = DEFAULT_VOLUME;
    let isMuted = false;
    let isShuffle = false;
    let loopMode = 'playlist'; // 'playlist' | 'song'
    let fadeInterval;

    // --- Core Functions ---

    function loadSong(song, playNow = false) {
        songNameEl.textContent = song.title;
        artistNameEl.textContent = song.artist;
        albumArtEl.src = song.art;
        bgMusic.src = song.src;
        progressBar.value = 0;
        currentTimeEl.textContent = '0:00';
        totalDurationEl.textContent = '0:00';
        // Remember last played song
        try { localStorage.setItem('lastSongIndex', currentSongIndex); } catch (e) { }
        if (playNow) playAudio();
    }

    function fadeIn(targetVolume, duration = 1000) {
        clearInterval(fadeInterval);
        bgMusic.volume = 0;
        bgMusic.play().then(() => {
            isPlaying = true;
            updatePlayBtn();
            albumArtEl.classList.add('rotating');
            document.title = `Now Playing: '${PLAYLIST[currentSongIndex].title}'`;

            let vol = 0;
            const step = targetVolume / (duration / 50);
            fadeInterval = setInterval(() => {
                vol += step;
                if (vol >= targetVolume) {
                    vol = targetVolume;
                    clearInterval(fadeInterval);
                }
                bgMusic.volume = vol;
            }, 50);
        }).catch(e => console.log('Play failed:', e));
    }

    function fadeOut(duration = 1000) {
        clearInterval(fadeInterval);
        isPlaying = false;
        updatePlayBtn();
        albumArtEl.classList.remove('rotating');
        document.title = 'Anku and Cyru';

        let vol = bgMusic.volume;
        const step = vol / (duration / 50);
        fadeInterval = setInterval(() => {
            vol -= step;
            if (vol <= 0) {
                vol = 0;
                bgMusic.pause();
                bgMusic.volume = isMuted ? 0 : userVolume;
                clearInterval(fadeInterval);
            } else {
                bgMusic.volume = vol;
            }
        }, 50);
    }

    function playAudio() {
        if (isMuted) {
            bgMusic.volume = 0;
            bgMusic.play();
            isPlaying = true;
            updatePlayBtn();
            albumArtEl.classList.add('rotating');
            document.title = `Now Playing: '${PLAYLIST[currentSongIndex].title}'`;
        } else {
            fadeIn(userVolume);
        }
    }

    function pauseAudio(instant = false) {
        if (instant) {
            bgMusic.pause();
            isPlaying = false;
            updatePlayBtn();
            albumArtEl.classList.remove('rotating');
        } else {
            fadeOut();
        }
    }

    function togglePlay() {
        bgMusic.paused ? playAudio() : pauseAudio();
    }

    function playSong(index) {
        currentSongIndex = index;
        loadSong(PLAYLIST[currentSongIndex]);
        playAudio();
    }

    function playNextSong() {
        if (isShuffle) {
            let idx = currentSongIndex;
            while (idx === currentSongIndex) {
                idx = Math.floor(Math.random() * PLAYLIST.length);
            }
            currentSongIndex = idx;
        } else {
            currentSongIndex = (currentSongIndex + 1) % PLAYLIST.length;
        }
        loadSong(PLAYLIST[currentSongIndex], true);
    }

    function playPrevSong() {
        if (bgMusic.currentTime > 3) {
            bgMusic.currentTime = 0;
        } else {
            if (isShuffle) {
                currentSongIndex = Math.floor(Math.random() * PLAYLIST.length);
            } else {
                currentSongIndex = (currentSongIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
            }
            loadSong(PLAYLIST[currentSongIndex], true);
        }
    }

    function handleSongEnd() {
        if (loopMode === 'song') {
            bgMusic.currentTime = 0;
            playAudio();
        } else {
            playNextSong();
        }
    }

    function updatePlayBtn() {
        const icon = playPauseBtn.querySelector('i');
        icon.classList.toggle('fa-play', bgMusic.paused);
        icon.classList.toggle('fa-pause', !bgMusic.paused);

        // Refresh playlist highlighting
        if (!playlistPanel.classList.contains('hidden')) {
            renderPlaylist();
        }
    }

    function updateVolumeIcon() {
        const icon = muteBtn.querySelector('i');
        icon.className = '';
        if (isMuted || userVolume === 0) {
            icon.className = 'fa-solid fa-volume-xmark';
        } else if (userVolume < 0.5) {
            icon.className = 'fa-solid fa-volume-low';
        } else {
            icon.className = 'fa-solid fa-volume-high';
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    // --- Playlist ---

    function renderPlaylist() {
        playlistList.innerHTML = '';
        PLAYLIST.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = `playlist-item ${index === currentSongIndex ? 'active' : ''}`;
            li.onclick = e => {
                e.stopPropagation();
                playSong(index);
                renderPlaylist();
            };
            li.innerHTML = `
                <div class="playlist-item-info">
                    <span class="playlist-item-title">${song.title}</span>
                    <span class="playlist-item-artist">${song.artist}</span>
                </div>
                <div class="playing-indicator"></div>
            `;
            playlistList.appendChild(li);
        });
    }

    function togglePlaylist() {
        const isHidden = playlistPanel.classList.contains('hidden');
        if (isHidden) {
            playlistPanel.classList.remove('hidden');
            renderPlaylist();
            playlistBtn.classList.add('active');
        } else {
            playlistPanel.classList.add('hidden');
            playlistBtn.classList.remove('active');
        }
    }

    // --- Event Bindings ---

    function bindEvents() {
        // Play/Pause
        playPauseBtn.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
        prevBtn.addEventListener('click', playPrevSong);
        nextBtn.addEventListener('click', playNextSong);

        // Shuffle
        shuffleBtn.classList.toggle('active', isShuffle);
        shuffleBtn.addEventListener('click', () => {
            isShuffle = !isShuffle;
            shuffleBtn.classList.toggle('active', isShuffle);
        });

        // Loop
        loopBtn.addEventListener('click', () => {
            if (loopMode === 'playlist') {
                loopMode = 'song';
                loopBtn.classList.add('active');
            } else {
                loopMode = 'playlist';
                loopBtn.classList.remove('active');
            }
        });

        // Volume
        volumeBar.addEventListener('input', () => {
            userVolume = parseFloat(volumeBar.value);
            if (!isMuted) bgMusic.volume = userVolume;
            updateVolumeIcon();
        });

        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            bgMusic.volume = isMuted ? 0 : userVolume;
            updateVolumeIcon();
        });

        // Progress
        bgMusic.addEventListener('timeupdate', () => {
            const { currentTime, duration } = bgMusic;
            if (!isNaN(duration)) {
                const pct = (currentTime / duration) * 100;
                progressBar.value = pct;
                currentTimeEl.textContent = formatTime(currentTime);
                totalDurationEl.textContent = formatTime(duration);
                progressBar.style.background =
                    `linear-gradient(to right, var(--text-light) ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;
            }
        });

        progressBar.addEventListener('input', () => {
            bgMusic.currentTime = (progressBar.value / 100) * bgMusic.duration;
        });

        // Song end
        bgMusic.addEventListener('ended', handleSongEnd);
        bgMusic.addEventListener('play', () => {
            updatePlayBtn();
            AutoScrollManager.resetIdleTimer();
        });
        bgMusic.addEventListener('pause', () => {
            updatePlayBtn();
            AutoScrollManager.stop();
        });

        // Playlist panel
        playlistBtn.addEventListener('click', e => { e.stopPropagation(); togglePlaylist(); });
        closePlaylistBtn.addEventListener('click', e => { e.stopPropagation(); togglePlaylist(); });
        playlistPanel.addEventListener('click', e => e.stopPropagation());

        // Prevent body scroll inside playlist
        playlistPanel.addEventListener('wheel', e => {
            const list = playlistList;
            const { scrollHeight, clientHeight, scrollTop } = list;
            if (clientHeight >= scrollHeight) { e.preventDefault(); return; }
            if ((scrollTop <= 0 && e.deltaY < 0) ||
                (Math.ceil(scrollTop + clientHeight) >= scrollHeight && e.deltaY > 0)) {
                e.preventDefault();
            }
            e.stopPropagation();
        }, { passive: false });

        // Close playlist on outside click
        document.addEventListener('click', e => {
            if (!playlistPanel.contains(e.target) && !playlistBtn.contains(e.target) &&
                !playlistPanel.classList.contains('hidden')) {
                togglePlaylist();
            }
        });
    }

    // --- Init ---

    function init() {
        bgMusic.volume = DEFAULT_VOLUME;
        // Restore last played song from memory
        try {
            const saved = localStorage.getItem('lastSongIndex');
            if (saved !== null) {
                const idx = parseInt(saved, 10);
                if (!isNaN(idx) && idx >= 0 && idx < PLAYLIST.length) {
                    currentSongIndex = idx;
                }
            }
        } catch (e) { }
        loadSong(PLAYLIST[currentSongIndex], false);

        // Update playlist header count
        const header = playlistPanel.querySelector('.playlist-header h3');
        if (header) header.textContent = `Our Mixtape (${PLAYLIST.length})`;

        volumeBar.value = userVolume;
        updateVolumeIcon();
        bindEvents();
    }

    // --- Autoplay Logic ---

    async function robustAutoplay() {
        try {
            bgMusic.volume = userVolume;
            await bgMusic.play();
            isPlaying = true;
            updatePlayBtn();
            albumArtEl.classList.add('rotating');
            document.title = `Now Playing: '${PLAYLIST[currentSongIndex].title}'`;
        } catch {
            console.warn('Autoplay blocked. Trying muted fallback...');
            try {
                bgMusic.muted = true;
                await bgMusic.play();
                isPlaying = true;
                updatePlayBtn();
                albumArtEl.classList.add('rotating');
                document.title = `Now Playing: '${PLAYLIST[currentSongIndex].title}'`;

                const unmute = () => {
                    bgMusic.muted = false;
                    bgMusic.volume = userVolume;
                    ['click', 'keydown', 'touchstart', 'wheel'].forEach(evt =>
                        document.removeEventListener(evt, unmute, { capture: true })
                    );
                };
                ['click', 'keydown', 'touchstart', 'wheel'].forEach(evt =>
                    document.addEventListener(evt, unmute, { capture: true, once: true })
                );
            } catch {
                console.warn('Muted autoplay also blocked. Waiting for interaction...');
                const playOnInteract = async () => {
                    try {
                        bgMusic.muted = false;
                        bgMusic.volume = userVolume;
                        await bgMusic.play();
                        isPlaying = true;
                        updatePlayBtn();
                        albumArtEl.classList.add('rotating');
                        document.title = `Now Playing: '${PLAYLIST[currentSongIndex].title}'`;
                    } catch (e) { console.error('Play failed on interaction', e); }
                };
                ['click', 'keydown', 'touchstart', 'wheel'].forEach(evt =>
                    document.addEventListener(evt, playOnInteract, { capture: true, once: true })
                );
            }
        }
    }

    // Public API
    return {
        init,
        playAudio,
        pauseAudio,
        robustAutoplay,
        getAudioElement: () => bgMusic,
        getCurrentIndex: () => currentSongIndex,
    };
})();
