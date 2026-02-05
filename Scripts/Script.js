document.addEventListener('DOMContentLoaded', () => {
    // DEVELOPER CONTROL: Set to 'true' to clear the status, or keep 'false' for normal operation
    const FORCE_RESET = true;

    if (FORCE_RESET) {
        localStorage.removeItem('sheSaidYes');
        localStorage.removeItem('sheSaidYesTime');
    }

    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const contentSection = document.getElementById('content');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const yesStamp = document.getElementById('yesStamp');
    const yesTimestamp = document.getElementById('yesTimestamp');
    const bgMusic = document.getElementById('bgMusic');

    // Set initial volumes
    const DUCKED_VOLUME = 0.05;
    let NORMAL_VOLUME = 0.4;
    bgMusic.volume = NORMAL_VOLUME; // Set initial volume

    // Check if she already said yes
    const savedTime = localStorage.getItem('sheSaidYesTime');
    if (localStorage.getItem('sheSaidYes') === 'true') {
        showSuccessState(false, savedTime); // false means no smooth scroll on load

        // Browsers usually block autoplay, so we try to play on the first click anywhere
        const playMusicOnFirstClick = () => {
            bgMusic.play().catch(e => console.log("Waiting for interaction to play music"));
            document.removeEventListener('click', playMusicOnFirstClick);
        };
        document.addEventListener('click', playMusicOnFirstClick);
    }

    // Make the "No" button move away on hover
    noBtn.addEventListener('mouseover', () => {
        const x = Math.random() * (window.innerWidth - noBtn.offsetWidth);
        const y = Math.random() * (window.innerHeight - noBtn.offsetHeight);

        noBtn.style.position = 'fixed';
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
    });

    // Handle "Yes" Button Click
    yesBtn.addEventListener('click', () => {
        const now = new Date();
        const timeString = now.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) + ' at ' + now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        localStorage.setItem('sheSaidYes', 'true');
        localStorage.setItem('sheSaidYesTime', timeString);

        showSuccessState(true, timeString);
        createHearts();

        // Start background music
        bgMusic.play().catch(error => console.log("Music play failed:", error));
    });

    function showSuccessState(shouldScroll, timestamp) {
        // Show content and stamp
        contentSection.classList.remove('hidden');
        yesStamp.classList.remove('hidden');
        scrollIndicator.style.display = 'flex';

        if (timestamp) {
            yesTimestamp.textContent = `Captured on: ${timestamp}`;
        }

        // Hide/Disable buttons once "Yes" is confirmed
        yesBtn.style.display = 'none';
        noBtn.style.display = 'none';

        // Indicate scrolling is unlocked instead of auto-scrolling
        const scrollText = scrollIndicator.querySelector('p');
        if (scrollText) {
            scrollText.textContent = "Unlocking our story... Scroll down ❤️";
        }
    }

    // Reveal Memory Cards on Scroll
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.memory-card, .story-card').forEach(card => {
        observer.observe(card);
    });

    // Auto-play videos when they come on screen
    const videoObserverOptions = {
        threshold: 0.6 // Play when 60% of the video is visible
    };

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Only lower background music volume if the video is NOT muted
                if (!video.muted) {
                    bgMusic.volume = DUCKED_VOLUME;
                }

                video.play().catch(error => {
                    console.log("Autoplay prevented by browser. User interaction might be required.");
                });
            } else {
                video.pause();

                // Restore background music volume ONLY if no other UNMUTED videos are playing
                const playingUnmutedVideos = Array.from(document.querySelectorAll('.memory-video')).filter(v => !v.paused && !v.muted);
                if (playingUnmutedVideos.length === 0) {
                    bgMusic.volume = NORMAL_VOLUME;
                }
            }
        });
    }, videoObserverOptions);

    document.querySelectorAll('.memory-video').forEach(video => {
        videoObserver.observe(video);
    });

    // Fun Heart Animation Effect
    function createHearts() {
        const container = document.body;
        const heartCount = 40;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerHTML = '❤️';
            heart.style.left = Math.random() * 100 + 'vw';
            heart.style.animationDelay = Math.random() * 3 + 's';
            heart.style.fontSize = (Math.random() * 20 + 10) + 'px';
            heart.style.position = 'fixed';
            heart.style.top = '-20px';
            heart.style.zIndex = '1000';
            heart.style.pointerEvents = 'none';
            heart.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
            fragment.appendChild(heart);
        }

        container.appendChild(fragment);

        // Clean up hearts after animation
        setTimeout(() => {
            const hearts = document.querySelectorAll('.heart-particle');
            hearts.forEach(h => h.remove());
        }, 5000);
    }

    // --- Auto-Scroll Removed ---

    // Add CSS for falling hearts if not already there
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fall {
            to {
                transform: translateY(110vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // --- Background Hearts Animation ---
    function initBackgroundHearts() {
        const heartCount = 20; // Number of background hearts
        const container = document.body;

        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('div');
            heart.classList.add('bg-heart');
            heart.innerHTML = '❤️';

            // Random properties
            const left = Math.random() * 100; // 0 to 100vw
            const duration = Math.random() * 15 + 15; // 15s to 30s (Very slow)
            const size = Math.random() * 20 + 10; // 10px to 30px
            const delay = Math.random() * -30; // Negative delay to start mid-animation

            heart.style.left = `${left}vw`;
            heart.style.animationDuration = `${duration}s`;
            heart.style.fontSize = `${size}px`;
            heart.style.animationDelay = `${delay}s`;

            container.appendChild(heart);
        }
    }

    // Initialize background hearts immediately
    initBackgroundHearts();

    // --- Media Controller Logic ---
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

    // UI Elements for Song Info
    const songNameEl = document.querySelector('.song-name');
    const artistNameEl = document.querySelector('.artist-name');
    const albumArtEl = document.querySelector('.album-art');

    // Playlist Definition
    const playlist = [
        {
            title: "Sang Rahiyo 🫶",
            artist: "Anku & Cyru",
            src: "Assets/Songs/Sang Rahiyo🫶.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "Dandelions 🌼",
            artist: "Ruth B.",
            src: "Assets/Songs/Dandelions🌼.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "10,000 Hours 🕒",
            artist: "Dan + Shay, Justin Bieber",
            src: "Assets/Songs/10,000 Hours.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "Perfect 💍",
            artist: "Ed Sheeran",
            src: "Assets/Songs/Perfect.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "A Thousand Years ⏳",
            artist: "Christina Perri",
            src: "Assets/Songs/A Thousand Years.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "Photograph 📸",
            artist: "Ed Sheeran",
            src: "Assets/Songs/Photograph.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "All of Me",
            artist: "John Legend",
            src: "Assets/Songs/All of Me.webm",
            art: "Assets/website_icon.png"
        },
        {
            title: "I Think They Call This Love",
            artist: "Elliot James Reay",
            src: "Assets/Songs/I Think They Call This Love.webm",
            art: "Assets/website_icon.png"
        }
    ];

    // Initial State
    let currentSongIndex = 0;
    let isPlaying = false; // Start paused or based on previous logic, usually paused until interaction
    let userVolume = 0.4;
    let isMuted = false;
    let isShuffle = false;
    let loopMode = 'playlist'; // 'playlist' (default) or 'song'

    // Load Initial Song
    loadSong(playlist[currentSongIndex]);

    function loadSong(song) {
        songNameEl.textContent = song.title;
        artistNameEl.textContent = song.artist;
        albumArtEl.src = song.art;
        bgMusic.src = song.src;
        // Reset progress
        progressBar.value = 0;
        currentTimeEl.textContent = "0:00";
        totalDurationEl.textContent = "0:00";
    }

    // Format time: MM:SS
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    // Fade In/Out Logic
    let fadeInterval;

    function fadeIn(targetVolume, duration = 1000) {
        clearInterval(fadeInterval);
        bgMusic.volume = 0;
        bgMusic.play().then(() => {
            isPlaying = true;
            updatePlayBtn();

            const step = targetVolume / (duration / 50);
            fadeInterval = setInterval(() => {
                if (bgMusic.volume + step >= targetVolume) {
                    bgMusic.volume = targetVolume;
                    clearInterval(fadeInterval);
                } else {
                    bgMusic.volume += step;
                }
            }, 50);
        }).catch(e => console.log("Play failed:", e));
    }

    function fadeOut(duration = 1000) {
        clearInterval(fadeInterval);
        const startVolume = bgMusic.volume;
        const step = startVolume / (duration / 50);

        fadeInterval = setInterval(() => {
            if (bgMusic.volume - step <= 0) {
                bgMusic.volume = 0;
                bgMusic.pause();
                isPlaying = false;
                updatePlayBtn();
                clearInterval(fadeInterval);
                bgMusic.volume = startVolume;
            } else {
                bgMusic.volume -= step;
            }
        }, 50);
    }

    // Toggle Play/Pause
    function togglePlay() {
        if (bgMusic.paused) {
            fadeIn(isMuted ? 0 : userVolume);
        } else {
            fadeOut();
        }
    }

    function updatePlayBtn() {
        const icon = playPauseBtn.querySelector('i');
        if (bgMusic.paused) {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        } else {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
        }
    }

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    // Track Progress
    bgMusic.addEventListener('timeupdate', () => {
        const current = bgMusic.currentTime;
        const duration = bgMusic.duration;

        if (!isNaN(duration)) {
            const progressPercent = (current / duration) * 100;
            progressBar.value = progressPercent;
            currentTimeEl.textContent = formatTime(current);
            totalDurationEl.textContent = formatTime(duration);

            // Update background of slider to show progress visually
            progressBar.style.background = `linear-gradient(to right, var(--text-light) ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)`;
        }
    });

    // Seek
    progressBar.addEventListener('input', (e) => {
        const seekTime = (progressBar.value / 100) * bgMusic.duration;
        bgMusic.currentTime = seekTime;
    });

    // Volume Control
    volumeBar.addEventListener('input', (e) => {
        clearInterval(fadeInterval);
        userVolume = parseFloat(e.target.value);
        if (!isMuted) {
            bgMusic.volume = userVolume;
        }
        NORMAL_VOLUME = userVolume;
        updateVolumeIcon();
    });

    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            bgMusic.volume = 0;
        } else {
            bgMusic.volume = userVolume;
        }
        updateVolumeIcon();
    });

    function updateVolumeIcon() {
        const icon = muteBtn.querySelector('i');
        icon.className = ''; // Clear classes

        if (isMuted || userVolume === 0) {
            icon.className = 'fa-solid fa-volume-xmark';
        } else if (userVolume < 0.5) {
            icon.className = 'fa-solid fa-volume-low';
        } else {
            icon.className = 'fa-solid fa-volume-high';
        }
    }

    // Play Song Helper
    function playSong() {
        loadSong(playlist[currentSongIndex]);
        bgMusic.volume = isMuted ? 0 : userVolume;
        bgMusic.play();
        isPlaying = true;
        updatePlayBtn();
    }

    // Shuffle Logic
    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    });

    // Loop Logic
    loopBtn.addEventListener('click', () => {
        if (loopMode === 'playlist') {
            loopMode = 'song';
            loopBtn.classList.add('active'); // Active means "Repeat One"
            // Optional: Change icon to represent '1' if you had one, but color change is fine
            loopBtn.querySelector('i').className = 'fa-solid fa-repeat';
            // Could use fa-1 or overlap, but standard icon + active color is commonly understood as "Repeated or Locked"
            // Wait, standard UI:
            // Grey Loop: Loop Off (Play once through)
            // White/Color Loop: Loop Playlist
            // White/Color Loop + 1: Loop Song

            // User request: "select between loop song or loop playlist".
            // So default is Loop Playlist. Button click -> Loop Song. Click again -> Loop Playlist.
        } else {
            loopMode = 'playlist';
            loopBtn.classList.remove('active');
        }
    });

    // Prev Button
    prevBtn.addEventListener('click', () => {
        if (bgMusic.currentTime > 3) {
            bgMusic.currentTime = 0;
        } else {
            if (isShuffle) {
                // Random index
                currentSongIndex = Math.floor(Math.random() * playlist.length);
            } else {
                currentSongIndex--;
                if (currentSongIndex < 0) {
                    currentSongIndex = playlist.length - 1;
                }
            }
            playSong();
        }
    });

    // Next Button
    nextBtn.addEventListener('click', () => {
        if (isShuffle) {
            let newIndex = currentSongIndex;
            while (newIndex === currentSongIndex) {
                newIndex = Math.floor(Math.random() * playlist.length);
            }
            currentSongIndex = newIndex;
        } else {
            currentSongIndex++;
            if (currentSongIndex > playlist.length - 1) {
                currentSongIndex = 0;
            }
        }
        playSong();
    });

    // Auto-play next song when ended
    bgMusic.addEventListener('ended', () => {
        if (loopMode === 'song') {
            bgMusic.currentTime = 0;
            bgMusic.play();
        } else {
            // Playlist Loop or Shuffle
            if (isShuffle) {
                let newIndex = currentSongIndex;
                while (newIndex === currentSongIndex) {
                    newIndex = Math.floor(Math.random() * playlist.length);
                }
                currentSongIndex = newIndex;
            } else {
                currentSongIndex++;
                if (currentSongIndex > playlist.length - 1) {
                    currentSongIndex = 0;
                }
            }
            playSong();
        }
    });

    // Sync UI on load
    bgMusic.addEventListener('play', () => {
        updatePlayBtn();
        const song = playlist[currentSongIndex];
        document.title = `Now Playing: '${song.title}'`;
        document.querySelector('.album-art').classList.add('rotating');
    });

    bgMusic.addEventListener('pause', () => {
        updatePlayBtn();
        document.title = "Anku and Cyru";
        document.querySelector('.album-art').classList.remove('rotating');
    });

    volumeBar.value = userVolume;
    updateVolumeIcon();
});

// Add floating heart styles dynamically
if (!document.getElementById('heart-styles')) {
    const style = document.createElement('style');
    style.id = 'heart-styles';
    style.innerHTML = `
        .floating-heart {
            position: fixed;
            z-index: 1000;
            pointer-events: none;
            animation: floatUp linear forwards;
        }

        @keyframes floatUp {
            to {
                transform: translateY(-110vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
