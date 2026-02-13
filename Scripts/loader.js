// ============================================================
// loader.js — Loading Screen & Asset Preloading
// ============================================================

const Loader = (() => {
    const screen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');
    const percentageEl = document.getElementById('loadingPercentage');
    const textEl = document.getElementById('loadingText');

    function updateProgress(percent, text) {
        if (progressBar) progressBar.style.width = percent + '%';
        if (percentageEl) percentageEl.textContent = Math.round(percent) + '%';
        if (text && textEl) textEl.textContent = text;
    }

    async function preloadAllAssets() {
        const resources = [];
        let loadedCount = 0;
        let totalResources = 0;

        const trackResource = (promise, label) => {
            resources.push(
                promise.then(() => {
                    loadedCount++;
                    updateProgress((loadedCount / totalResources) * 100, `Loading ${label}...`);
                }).catch(() => {
                    loadedCount++;
                    updateProgress((loadedCount / totalResources) * 100, `Skipping ${label}...`);
                })
            );
        };

        // Gather assets
        const domImages = [...new Set(
            Array.from(document.querySelectorAll('img')).map(img => img.src).filter(Boolean)
        )];
        const domVideos = Array.from(document.querySelectorAll('video'));
        const songPaths = PLAYLIST.map(s => s.src);
        const fontCheck = document.fonts ? document.fonts.ready : Promise.resolve();

        totalResources = 1 + domImages.length + domVideos.length +
            GALLERY_IMAGES.length + songPaths.length + 1;

        // Fonts
        trackResource(
            Promise.race([fontCheck, new Promise(r => setTimeout(r, 3000))]),
            'Fonts'
        );

        // DOM Images
        domImages.forEach((src, i) => {
            const img = new Image();
            img.src = src;
            if (img.complete) {
                loadedCount++;
            } else {
                trackResource(new Promise(r => {
                    img.onload = r;
                    img.onerror = r;
                    setTimeout(r, 5000);
                }), `Image ${i + 1}`);
            }
        });

        // Gallery Images
        GALLERY_IMAGES.forEach((path, i) => {
            const img = new Image();
            img.src = `Assets/Gallery/${path}`;
            trackResource(new Promise(r => {
                img.onload = r;
                img.onerror = r;
                setTimeout(r, 5000);
            }), `Gallery Photo ${i + 1}`);
        });

        // DOM Videos
        domVideos.forEach((video, i) => {
            if (video.readyState >= 3) {
                loadedCount++;
            } else {
                trackResource(new Promise(r => {
                    const done = () => { cleanup(); r(); };
                    const cleanup = () => {
                        video.removeEventListener('loadeddata', done);
                        video.removeEventListener('canplay', done);
                        video.removeEventListener('error', done);
                    };
                    video.addEventListener('loadeddata', done);
                    video.addEventListener('canplay', done);
                    video.addEventListener('error', done);
                    setTimeout(() => { cleanup(); r(); }, 5000);
                }), `Memory Video ${i + 1}`);
            }
        });

        // Songs
        songPaths.forEach((src, i) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = src;
            trackResource(new Promise(r => {
                const done = () => { cleanup(); r(); };
                const cleanup = () => {
                    audio.removeEventListener('canplaythrough', done);
                    audio.removeEventListener('error', done);
                };
                audio.addEventListener('canplaythrough', done);
                audio.addEventListener('error', done);
                setTimeout(() => { cleanup(); r(); }, 4000);
            }), `Song ${i + 1}`);
        });

        // Window load
        trackResource(new Promise(r => {
            if (document.readyState === 'complete') r();
            else window.addEventListener('load', r);
            setTimeout(r, 5000);
        }), 'Finalizing');

        updateProgress(5, 'Initializing Assets...');

        await Promise.race([
            Promise.all(resources),
            new Promise(r => setTimeout(r, 15000)),
        ]);

        updateProgress(100, 'All Memories Loaded!');
    }

    function init() {
        const hasVisited = localStorage.getItem('hasVisited');

        if (hasVisited) {
            screen.style.display = 'none';
        } else {
            preloadAllAssets().then(() => {
                setTimeout(() => {
                    screen.classList.add('hidden');
                    setTimeout(() => {
                        screen.style.display = 'none';
                        localStorage.setItem('hasVisited', 'true');
                    }, 800);
                }, 500);
            });
        }
    }

    return { init };
})();
