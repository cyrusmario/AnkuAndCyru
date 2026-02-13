// ============================================================
// scroll.js — Custom Scroll Manager & Auto-Scroll
// ============================================================

const ScrollManager = {
    targets: [],
    currentIndex: 0,
    isScrolling: false,
    resizeObserver: null,

    init() {
        this.refreshTargets();

        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        // Wheel
        window.addEventListener('wheel', e => this.handleScroll(e), { passive: false });

        // Keyboard
        window.addEventListener('keydown', e => {
            const gallery = document.getElementById('photoGallery');
            const lightbox = document.getElementById('imageLightbox');
            if (gallery.classList.contains('active') || lightbox.classList.contains('active')) return;

            const keys = ['ArrowUp', 'ArrowDown', ' ', 'PageUp', 'PageDown'];
            if (keys.includes(e.key)) {
                e.preventDefault();
                this.changeIndex(
                    (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') ? 1 : -1
                );
            }
        });

        // Touch swipe
        let touchStartY = 0;
        window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: false });

        window.addEventListener('touchmove', e => {
            const gallery = document.getElementById('photoGallery');
            const lightbox = document.getElementById('imageLightbox');
            if (gallery.classList.contains('active') || lightbox.classList.contains('active')) return;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', e => {
            const gallery = document.getElementById('photoGallery');
            const lightbox = document.getElementById('imageLightbox');
            if (gallery.classList.contains('active') || lightbox.classList.contains('active')) return;

            const diff = touchStartY - e.changedTouches[0].clientY;
            if (Math.abs(diff) > 50) {
                this.changeIndex(diff > 0 ? 1 : -1);
            }
        }, { passive: false });
    },

    refreshTargets() {
        const hero = document.getElementById('hero');
        const story = document.getElementById('story');
        const memories = Array.from(document.querySelectorAll('.memory-card'));
        const finalNote = document.querySelector('.final-note');

        this.targets = [hero];

        const content = document.getElementById('content');
        const isUnlocked = localStorage.getItem('sheSaidYes') === 'true' ||
            (content && !content.classList.contains('hidden'));

        if (isUnlocked) {
            if (story) this.targets.push(story);
            this.targets.push(...memories);
            if (finalNote) this.targets.push(finalNote);
            this.setupResizeObserver();
        }
    },

    handleScroll(e) {
        const gallery = document.getElementById('photoGallery');
        const lightbox = document.getElementById('imageLightbox');
        if (gallery.classList.contains('active') || lightbox.classList.contains('active')) return;
        e.preventDefault();
        if (this.isScrolling) return;
        this.changeIndex(e.deltaY > 0 ? 1 : -1);
    },

    changeIndex(direction) {
        if (this.isScrolling) return;
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex < this.targets.length) {
            this.currentIndex = newIndex;
            this.scrollToTarget(this.targets[this.currentIndex]);
        }
    },

    setupResizeObserver() {
        if (this.resizeObserver) this.resizeObserver.disconnect();

        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target === this.targets[this.currentIndex] && !this.isScrolling) {
                    this.scrollToTarget(this.targets[this.currentIndex], 100);
                }
            }
        });

        this.targets.forEach(t => this.resizeObserver.observe(t));
    },

    scrollToTarget(target, duration = 1000) {
        this.isScrolling = true;
        const rect = target.getBoundingClientRect();
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

        const ease = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

        const animation = currentTime => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = ease(Math.min(elapsed / duration, 1));
            window.scrollTo(0, startY + distance * progress);

            if (elapsed < duration) {
                requestAnimationFrame(animation);
            } else {
                this.isScrolling = false;
            }
        };

        requestAnimationFrame(animation);
    },
};


// --- Auto Scroll Manager ---
const AutoScrollManager = {
    idleTimer: null,
    isAutoScrolling: false,

    init() {
        this.resetIdleTimer();
        const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel', 'scroll'];
        events.forEach(evt => {
            window.addEventListener(evt, e => this.handleUserInteraction(e), { passive: true });
        });
    },

    stop() {
        if (this.isAutoScrolling) {
            const target = ScrollManager.targets[ScrollManager.currentIndex];
            const video = target ? target.querySelector('video') : null;
            if (video) video.loop = true;
        }
        this.isAutoScrolling = false;
        if (this.idleTimer) clearTimeout(this.idleTimer);
    },

    handleUserInteraction(e) {
        if (e && e.type === 'scroll' && ScrollManager.isScrolling) return;
        this.stop();
        this.resetIdleTimer();
    },

    resetIdleTimer() {
        if (this.idleTimer) clearTimeout(this.idleTimer);
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && !bgMusic.paused) {
            this.idleTimer = setTimeout(() => this.startAutoScroll(), IDLE_DELAY);
        }
    },

    startAutoScroll() {
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && bgMusic.paused) return;
        this.isAutoScrolling = true;
        this.processCurrentSection();
    },

    processCurrentSection() {
        if (!this.isAutoScrolling || !ScrollManager.targets.length) return;

        const target = ScrollManager.targets[ScrollManager.currentIndex];
        const video = target ? target.querySelector('video') : null;

        if (video) {
            this.handleVideoSection(video);
        } else {
            this.moveToNextSection();
        }
    },

    handleVideoSection(video) {
        video.loop = false;
        if (video.paused) {
            video.play().catch(() => { });
        }

        const onEnd = () => {
            if (this.isAutoScrolling) this.moveToNextSection();
        };

        if (video.ended) {
            onEnd();
        } else {
            video.addEventListener('ended', onEnd, { once: true });
        }
    },

    moveToNextSection() {
        let nextIndex = ScrollManager.currentIndex + 1;
        if (nextIndex >= ScrollManager.targets.length) nextIndex = 0;

        ScrollManager.currentIndex = nextIndex;
        ScrollManager.scrollToTarget(ScrollManager.targets[nextIndex]);

        setTimeout(() => {
            if (!this.isAutoScrolling) return;

            const target = ScrollManager.targets[ScrollManager.currentIndex];
            const video = target ? target.querySelector('video') : null;

            if (video) {
                if (this.idleTimer) clearTimeout(this.idleTimer);
                this.handleVideoSection(video);
            } else {
                this.resetIdleTimer();
            }
        }, 1200);
    },
};
