// ============================================================
// app.js — Main Application Controller
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM References ---
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');
    const contentSection = document.getElementById('content');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const yesStamp = document.getElementById('yesStamp');
    const yesTimestamp = document.getElementById('yesTimestamp');
    const sideNav = document.getElementById('sideNav');
    const mediaController = document.getElementById('mediaController');
    const navHome = document.getElementById('navHome');
    const navGallery = document.getElementById('navGallery');

    // --- Apply Memory Visibility Controls ---
    Object.keys(MEMORY_CONTROLS).forEach(id => {
        const el = document.getElementById(id);
        if (el && !MEMORY_CONTROLS[id]) el.style.display = 'none';
    });

    // --- Initialize All Modules ---
    // --- Initialize All Modules ---
    // Loader.init() is called at the end now to chain logic
    MusicPlayer.init();
    ScrollManager.init();
    AutoScrollManager.init();
    Effects.initBackgroundHearts();
    Effects.initImageEffects();
    Effects.initImageEffects();
    Gallery.init();
    LockManager.init();

    // --- Intersection Observer for Reveal Animations ---
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.memory-card, .story-card').forEach(card => {
        revealObserver.observe(card);
    });

    // --- Video Auto-play & Audio Ducking ---
    const intersectingVideos = new Set();

    const videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                intersectingVideos.add(video);
                video.muted = true;
                video.play().catch(() => { });
            } else {
                intersectingVideos.delete(video);
                video.pause();
            }
        });
        checkGlobalAudioState();
    }, { threshold: 0.6 });

    function checkGlobalAudioState() {
        const bgMusic = MusicPlayer.getAudioElement();
        let anyAudible = false;

        document.querySelectorAll('.memory-video').forEach(video => {
            if (!video.paused && !video.muted) anyAudible = true;
        });

        if (anyAudible) {
            if (!bgMusic.paused) MusicPlayer.pauseAudio();
        } else if (localStorage.getItem('sheSaidYes') === 'true') {
            if (bgMusic.paused) MusicPlayer.playAudio();
        }
    }

    document.querySelectorAll('.memory-video').forEach(video => {
        videoObserver.observe(video);
        video.addEventListener('volumechange', checkGlobalAudioState);
        video.addEventListener('play', checkGlobalAudioState);
        video.addEventListener('pause', checkGlobalAudioState);
        video.addEventListener('click', () => {
            if (video.muted) {
                video.muted = false;
                video.volume = 1.0;
                video.controls = true;
            }
        });
    });

    // --- "No" Button Dodge ---
    noBtn.addEventListener('mouseover', () => {
        const x = Math.random() * (window.innerWidth - noBtn.offsetWidth);
        const y = Math.random() * (window.innerHeight - noBtn.offsetHeight);
        noBtn.style.position = 'fixed';
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
    });

    // --- "Yes" Button ---
    yesBtn.addEventListener('click', () => {
        const timeString = '14th February 2026';
        localStorage.setItem('sheSaidYes', 'true');
        localStorage.setItem('sheSaidYesTime', timeString);
        showSuccessState(true, timeString);
        Effects.createHearts();
        MusicPlayer.playAudio();
    });

    // --- Success State ---
    function showSuccessState(shouldScroll, timestamp) {
        contentSection.classList.remove('hidden');
        yesStamp.classList.remove('hidden');
        yesStamp.style.display = '';  // Clear inline display:none
        scrollIndicator.style.display = 'flex';

        if (timestamp) yesTimestamp.textContent = timestamp;

        yesBtn.style.display = 'none';
        noBtn.style.display = 'none';

        const scrollText = scrollIndicator.querySelector('p');
        if (scrollText) scrollText.textContent = "Unlocking our story... ❤️";

        if (sideNav) sideNav.classList.remove('hidden-nav');
        if (mediaController) mediaController.classList.remove('hidden-player');

        setTimeout(() => ScrollManager.refreshTargets(), 100);
    }

    // --- Navigation ---
    navHome.addEventListener('click', () => {
        const photoGallery = document.getElementById('photoGallery');
        if (photoGallery.classList.contains('active')) Gallery.toggleGallery();
        ScrollManager.currentIndex = 0;
        ScrollManager.scrollToTarget(ScrollManager.targets[0]);
    });

    navGallery.addEventListener('click', () => Gallery.toggleGallery());

    // --- Restore State (Developer Control / LocalStorage) ---
    let hasSaidYes;
    if (SHOW_ACCEPTED_VIEW !== null) {
        hasSaidYes = SHOW_ACCEPTED_VIEW;
        if (!hasSaidYes) localStorage.clear();
    } else {
        hasSaidYes = localStorage.getItem('sheSaidYes') === 'true';
    }

    const savedTime = localStorage.getItem('sheSaidYesTime') || '14th February 2026';

    // STARTUP LOGIC: Wait for Loader, then check state
    Loader.init().then(() => {
        if (hasSaidYes) {
            showSuccessState(false, savedTime);

            // Only autoplay if NOT locked
            if (!LockManager.isWebsiteLocked()) {
                MusicPlayer.robustAutoplay();
            }
        }
    });
});
