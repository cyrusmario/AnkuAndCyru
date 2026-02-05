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
    let NORMAL_VOLUME = 0.5;
    bgMusic.volume = NORMAL_VOLUME; // Set initial volume

    // --- Custom Scroll Manager (Hoisted) ---
    const scrollManager = {
        targets: [],
        currentIndex: 0,
        isScrolling: false,

        init() {
            this.refreshTargets();

            // Initial scroll position reset
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }
            window.scrollTo(0, 0);

            // Wheel Event
            window.addEventListener('wheel', (e) => this.handleScroll(e), { passive: false });

            // Keyboard Event
            window.addEventListener('keydown', (e) => {
                const keys = ['ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown'];
                if (keys.includes(e.key)) {
                    e.preventDefault();
                    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
                        this.changeIndex(1);
                    } else {
                        this.changeIndex(-1);
                    }
                }
            });

            // Touch Swipe Support (Basic)
            let touchStartY = 0;
            window.addEventListener('touchstart', e => {
                touchStartY = e.touches[0].clientY;
            }, { passive: false });

            window.addEventListener('touchmove', e => {
                e.preventDefault(); // Prevent native scroll
            }, { passive: false });

            window.addEventListener('touchend', e => {
                const touchEndY = e.changedTouches[0].clientY;
                const diff = touchStartY - touchEndY;
                if (Math.abs(diff) > 50) { // Threshold
                    if (diff > 0) this.changeIndex(1); // Swipe Up -> Scroll Down
                    else this.changeIndex(-1); // Swipe Down -> Scroll Up
                }
            }, { passive: false });
        },

        refreshTargets() {
            // Collect all logical sections
            const hero = document.getElementById('hero');
            const story = document.getElementById('story');
            const memories = Array.from(document.querySelectorAll('.memory-card'));
            const finalNote = document.querySelector('.final-note');

            this.targets = [hero];

            // Only add others if content is unlocked
            const isUnlocked = localStorage.getItem('sheSaidYes') === 'true' ||
                (document.getElementById('content') && !document.getElementById('content').classList.contains('hidden'));

            if (isUnlocked) {
                if (story) this.targets.push(story);
                this.targets.push(...memories);
                if (finalNote) this.targets.push(finalNote);

                // Re-attach observer whenever targets refresh
                this.setupResizeObserver();
            }
        },

        handleScroll(e) {
            e.preventDefault();
            if (this.isScrolling) return;

            const direction = e.deltaY > 0 ? 1 : -1;
            this.changeIndex(direction);
        },

        changeIndex(direction) {
            if (this.isScrolling) return;

            const newIndex = this.currentIndex + direction;

            if (newIndex >= 0 && newIndex < this.targets.length) {
                this.currentIndex = newIndex;
                this.scrollToTarget(this.targets[this.currentIndex]);
            }
        },

        // New: Observer to handle dynamic resizes
        resizeObserver: null,

        setupResizeObserver() {
            if (this.resizeObserver) this.resizeObserver.disconnect();

            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === this.targets[this.currentIndex] && !this.isScrolling) {
                        this.scrollToTarget(this.targets[this.currentIndex], 100);
                    }
                }
            });

            this.targets.forEach(t => this.resizeObserver.observe(t));
        },

        scrollToTarget(target, duration = 1000) {
            this.isScrolling = true;

            // Calculate Center
            const rect = target.getBoundingClientRect();
            // detailed calculation to center the element
            const absoluteTop = window.scrollY + rect.top;
            let targetScroll = absoluteTop + (rect.height / 2) - (window.innerHeight / 2);

            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

            this.smoothScrollTo(targetScroll, duration);
        },

        smoothScrollTo(targetY, duration) {
            const startY = window.scrollY;
            const distance = targetY - startY;
            let startTime = null;

            const animation = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;

                // Ease In Out Cubic
                const ease = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

                const run = ease(Math.min(timeElapsed / duration, 1));

                window.scrollTo(0, startY + (distance * run));

                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                } else {
                    this.isScrolling = false;
                }
            };

            requestAnimationFrame(animation);
        }
    };



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

        // Start background music via the player controller
        playAudio();
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

        // Update scroll targets now that content is visible
        setTimeout(() => {
            scrollManager.refreshTargets();
        }, 100);
    }

    // --- Auto Scroll Feature ---
    const autoScrollManager = {
        idleTimer: null,
        idleDelay: 10000, // 10 seconds timeout
        isAutoScrolling: false,

        init() {
            // Start monitoring
            this.resetIdleTimer();

            // User Interaction Listeners
            // These events indicate the user is active, so we reset the timer
            const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel', 'scroll'];
            events.forEach(event => {
                window.addEventListener(event, (e) => this.handleUserInteraction(e), { passive: true });
            });
        },

        handleUserInteraction(e) {
            // Ignore programmatic scrolls triggered by our manager
            if (e && e.type === 'scroll' && scrollManager.isScrolling) {
                return;
            }

            // If we were auto-scrolling and user interrupts, reset state
            if (this.isAutoScrolling) {
                const currentTarget = scrollManager.targets[scrollManager.currentIndex];
                const video = currentTarget ? currentTarget.querySelector('video') : null;
                // Restore video loop if it was disabled by auto-scroller
                if (video) {
                    video.loop = true;
                }
            }

            this.isAutoScrolling = false;
            this.resetIdleTimer();
        },

        resetIdleTimer() {
            if (this.idleTimer) clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => this.startAutoScroll(), this.idleDelay);
        },

        startAutoScroll() {
            this.isAutoScrolling = true;
            this.processCurrentSection();
        },

        processCurrentSection() {
            if (!this.isAutoScrolling) return;

            // Use the scrollManager's targets
            if (!scrollManager.targets || scrollManager.targets.length === 0) return;

            const currentTarget = scrollManager.targets[scrollManager.currentIndex];
            const video = currentTarget ? currentTarget.querySelector('video') : null;

            if (video) {
                this.handleVideoSection(video);
            } else {
                // If it's a photo/text section, and we are here via the idle timer,
                // it means we've waited 10s. So we move.
                this.moveToNextSection();
            }
        },

        handleVideoSection(video) {
            // In auto-scroll mode, we don't want the video to loop indefinitely.
            // We want it to play once, then move on.
            video.loop = false;

            // Ensure it's playing
            if (video.paused) {
                video.play().catch(e => console.log('Auto-play blocked', e));
            }

            // Helper to move when done
            const onEnd = () => {
                if (this.isAutoScrolling) {
                    this.moveToNextSection();
                }
            };

            if (video.ended) {
                onEnd();
            } else {
                // Listen for end
                video.addEventListener('ended', onEnd, { once: true });
            }
        },

        moveToNextSection() {
            // Loop logic
            let nextIndex = scrollManager.currentIndex + 1;
            if (nextIndex >= scrollManager.targets.length) {
                nextIndex = 0; // Scroll back to first part
            }

            // Perform Scroll
            scrollManager.currentIndex = nextIndex;
            scrollManager.scrollToTarget(scrollManager.targets[nextIndex]);

            // Wait for scroll animation to settle (approx 1000-1200ms)
            // Then setup the timer for this NEW section
            setTimeout(() => {
                if (!this.isAutoScrolling) return;

                const newTarget = scrollManager.targets[scrollManager.currentIndex];
                const newVideo = newTarget ? newTarget.querySelector('video') : null;

                if (newVideo) {
                    // If the new section is a video, we switch to "Video Logic" (Wait for End)
                    // We CLEAR the idle timer so it doesn't fire mid-video
                    if (this.idleTimer) clearTimeout(this.idleTimer);
                    this.handleVideoSection(newVideo);
                } else {
                    // If the new section is a photo, we "Wait 10s".
                    // resetting the idle timer effectively starts a 10s wait.
                    this.resetIdleTimer();
                }
            }, 1200);
        }
    };

    // Initialize the scroll manager
    scrollManager.init();
    // Initialize auto scroll manager
    autoScrollManager.init();

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

    const intersectingVideos = new Set();
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video in view
                intersectingVideos.add(video);
                video.muted = true; // Always start muted
                video.play().catch(e => console.log("Autoplay blocked", e));
            } else {
                intersectingVideos.delete(video);
                video.pause();
            }
        });

        // Check global state when visibility changes
        checkGlobalAudioState();
    }, videoObserverOptions);

    function checkGlobalAudioState() {
        let isAnyVideoAudible = false;

        document.querySelectorAll('.memory-video').forEach(video => {
            if (!video.paused && !video.muted) {
                isAnyVideoAudible = true;
            }
        });

        if (isAnyVideoAudible) {
            // Pause background music if an audible video is playing
            if (typeof pauseAudio === 'function') {
                if (!bgMusic.paused) pauseAudio();
            } else if (!bgMusic.paused) {
                bgMusic.pause();
            }
        } else {
            // Resume music if no audible videos are playing (and site is unlocked)
            if (localStorage.getItem('sheSaidYes') === 'true') {
                if (typeof playAudio === 'function') {
                    if (bgMusic.paused) playAudio();
                } else if (bgMusic.paused) {
                    bgMusic.play();
                }
            }
        }
    }

    document.querySelectorAll('.memory-video').forEach(video => {
        videoObserver.observe(video);

        // Listen for state changes to handle audio conflict
        video.addEventListener('volumechange', checkGlobalAudioState);
        video.addEventListener('play', checkGlobalAudioState);
        video.addEventListener('pause', checkGlobalAudioState);

        // Click to Unmute
        video.addEventListener('click', () => {
            if (video.muted) {
                video.muted = false;
                video.volume = 1.0;
                video.controls = true; // Enable controls
            }
        });
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

    // Style injection moved to CSS file


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

    // --- Media Controller Logic (Local Files Only) ---
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
    let isPlaying = false;
    let userVolume = 0.4;
    let isMuted = false;
    let isShuffle = false;
    let loopMode = 'playlist'; // 'playlist', 'song'
    let fadeInterval;

    // Initial Load
    loadSong(playlist[currentSongIndex], false);

    function loadSong(song, playNow = false) {
        songNameEl.textContent = song.title;
        artistNameEl.textContent = song.artist;
        albumArtEl.src = song.art;
        bgMusic.src = song.src;

        // Reset progress
        progressBar.value = 0;
        currentTimeEl.textContent = "0:00";
        totalDurationEl.textContent = "0:00";

        if (playNow) {
            playAudio();
        }
    }

    // Play/Pause with FADE
    function fadeIn(targetVolume, duration = 1000) {
        clearInterval(fadeInterval);

        bgMusic.volume = 0;
        bgMusic.play().then(() => {
            isPlaying = true;
            updatePlayBtn();
            document.querySelector('.album-art').classList.add('rotating');
            document.title = `Now Playing: '${playlist[currentSongIndex].title}'`;

            let currentVol = 0;
            const step = targetVolume / (duration / 50);

            fadeInterval = setInterval(() => {
                currentVol += step;
                if (currentVol >= targetVolume) {
                    currentVol = targetVolume;
                    clearInterval(fadeInterval);
                }
                bgMusic.volume = currentVol;
            }, 50);

        }).catch(e => console.log("Play failed:", e));
    }

    function fadeOut(duration = 1000) {
        clearInterval(fadeInterval);

        // Immediate UI update
        isPlaying = false;
        updatePlayBtn();
        document.querySelector('.album-art').classList.remove('rotating');
        document.title = "Anku and Cyru";

        let currentVol = bgMusic.volume;
        const step = currentVol / (duration / 50);

        fadeInterval = setInterval(() => {
            currentVol -= step;
            if (currentVol <= 0) {
                currentVol = 0;
                bgMusic.pause();
                bgMusic.volume = isMuted ? 0 : userVolume; // Reset volume for next play
                clearInterval(fadeInterval);
            } else {
                bgMusic.volume = currentVol;
            }
        }, 50);
    }

    // Direct Play
    function playAudio() {
        if (isMuted) {
            bgMusic.volume = 0;
            bgMusic.play();
            isPlaying = true;
            updatePlayBtn();
            document.querySelector('.album-art').classList.add('rotating');
            document.title = `Now Playing: '${playlist[currentSongIndex].title}'`;
        } else {
            fadeIn(userVolume);
        }
    }

    // Direct Pause
    function pauseAudio(instant = false) {
        if (instant) {
            bgMusic.pause();
            isPlaying = false;
            updatePlayBtn();
            document.querySelector('.album-art').classList.remove('rotating');
        } else {
            fadeOut();
        }
    }

    function togglePlay() {
        if (bgMusic.paused) {
            playAudio();
        } else {
            pauseAudio();
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

    function playNextSong() {
        if (isShuffle) {
            let newIndex = currentSongIndex;
            while (newIndex === currentSongIndex) {
                newIndex = Math.floor(Math.random() * playlist.length);
            }
            currentSongIndex = newIndex;
        } else {
            currentSongIndex++;
            if (currentSongIndex >= playlist.length) {
                currentSongIndex = 0;
            }
        }
        loadSong(playlist[currentSongIndex], true);
    }

    function playPrevSong() {
        if (bgMusic.currentTime > 3) {
            bgMusic.currentTime = 0;
        } else {
            if (isShuffle) {
                currentSongIndex = Math.floor(Math.random() * playlist.length);
            } else {
                currentSongIndex--;
                if (currentSongIndex < 0) {
                    currentSongIndex = playlist.length - 1;
                }
            }
            loadSong(playlist[currentSongIndex], true);
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

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    // Track Progress
    bgMusic.addEventListener('timeupdate', () => {
        const current = bgMusic.currentTime;
        const duration = bgMusic.duration;

        if (!isNaN(duration)) {
            const progressPercent = (current / duration) * 100;
            progressBar.value = progressPercent;
            currentTimeEl.textContent = formatTime(current);
            totalDurationEl.textContent = formatTime(duration);
            progressBar.style.background = `linear-gradient(to right, var(--text-light) ${progressPercent}%, rgba(255, 255, 255, 0.2) ${progressPercent}%)`;
        }
    });

    // Seek
    progressBar.addEventListener('input', (e) => {
        const seekTime = (progressBar.value / 100) * bgMusic.duration;
        bgMusic.currentTime = seekTime;
    });

    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    prevBtn.addEventListener('click', playPrevSong);
    nextBtn.addEventListener('click', playNextSong);

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
    });

    loopBtn.addEventListener('click', () => {
        if (loopMode === 'playlist') {
            loopMode = 'song';
            loopBtn.classList.add('active');
            loopBtn.querySelector('i').className = 'fa-solid fa-repeat';
        } else {
            loopMode = 'playlist';
            loopBtn.classList.remove('active');
        }
    });

    volumeBar.addEventListener('input', (e) => {
        userVolume = parseFloat(e.target.value);
        NORMAL_VOLUME = userVolume;

        if (!isMuted) {
            bgMusic.volume = userVolume;
        }
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
        icon.className = '';
        if (isMuted || userVolume === 0) {
            icon.className = 'fa-solid fa-volume-xmark';
        } else if (userVolume < 0.5) {
            icon.className = 'fa-solid fa-volume-low';
        } else {
            icon.className = 'fa-solid fa-volume-high';
        }
    }

    // Handlers
    bgMusic.addEventListener('ended', handleSongEnd);
    bgMusic.addEventListener('play', updatePlayBtn);
    bgMusic.addEventListener('pause', updatePlayBtn);

    // Initial Sync
    volumeBar.value = userVolume;
    updateVolumeIcon();

    // Check if she already said yes (Moved to end to ensure Media Controller is ready)
    const savedTime = localStorage.getItem('sheSaidYesTime');
    const hasSaidYes = localStorage.getItem('sheSaidYes') === 'true';

    if (hasSaidYes) {
        showSuccessState(false, savedTime);

        // Try to autoplay immediately
        if (!FORCE_RESET) {
            // Attempt immediate play
            const attemptPlay = () => {
                if (bgMusic.paused) {
                    playAudio();
                }
            };

            attemptPlay();

            // Fallback for browser blocking policies (User Gesture Required)
            // We attach to capture phase to catch events early
            const playMusicAndCleanup = () => {
                attemptPlay();

                // Remove listeners only if play was successful or we want to stop trying every event
                // But better to keep trying until it plays
                if (!bgMusic.paused) {
                    ['click', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(evt =>
                        document.removeEventListener(evt, playMusicAndCleanup, { capture: true })
                    );
                }
            };

            ['click', 'mousedown', 'keydown', 'touchstart', 'wheel'].forEach(evt =>
                document.addEventListener(evt, playMusicAndCleanup, { capture: true, once: false })
            );
        }
    }
});

// Add floating heart styles dynamically (Outside DOMContentLoaded)
// Floating heart styles moved to CSS file

