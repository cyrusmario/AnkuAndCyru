// ============================================================
// loader.js — Loading Screen & Asset Preloading
// ============================================================

const Loader = (() => {
    const screen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgress');
    const percentageEl = document.getElementById('loadingPercentage');
    const textEl = document.getElementById('loadingText');

    function updateProgress(percent, text) {
        const clamped = Math.min(100, Math.max(0, percent));
        if (progressBar) progressBar.style.width = clamped + '%';
        if (percentageEl) percentageEl.textContent = Math.round(clamped) + '%';
        if (text && textEl) textEl.textContent = text;
    }

    // --- Retry helper: attempts a loader function up to maxRetries ---
    function withRetry(loaderFn, maxRetries = 3, baseDelay = 1000) {
        return new Promise((resolve) => {
            let attempt = 0;
            function tryOnce() {
                attempt++;
                loaderFn().then(() => {
                    resolve(true); // loaded successfully
                }).catch(() => {
                    if (attempt < maxRetries) {
                        const delay = baseDelay * Math.pow(2, attempt - 1);
                        setTimeout(tryOnce, delay);
                    } else {
                        resolve(false); // give up after all retries
                    }
                });
            }
            tryOnce();
        });
    }

    // --- Load a single image with retry ---
    function loadImage(src) {
        return () => new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
            // Per-attempt timeout
            setTimeout(() => reject(new Error('timeout')), 15000);
        });
    }

    // --- Load a single song with retry ---
    function loadSong(src) {
        return () => new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';

            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onSuccess);
                audio.removeEventListener('error', onError);
            };
            const onSuccess = () => { cleanup(); resolve(); };
            const onError = () => { cleanup(); reject(new Error('audio error')); };

            audio.addEventListener('canplaythrough', onSuccess);
            audio.addEventListener('error', onError);
            audio.src = src;

            // Per-attempt timeout — songs can be large
            setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 30000);
        });
    }

    // --- Load a DOM video element ---
    function loadVideo(video) {
        return () => new Promise((resolve, reject) => {
            if (video.readyState >= 3) { resolve(); return; }

            const cleanup = () => {
                video.removeEventListener('canplay', onSuccess);
                video.removeEventListener('loadeddata', onSuccess);
                video.removeEventListener('error', onError);
            };
            const onSuccess = () => { cleanup(); resolve(); };
            const onError = () => { cleanup(); reject(new Error('video error')); };

            video.addEventListener('canplay', onSuccess);
            video.addEventListener('loadeddata', onSuccess);
            video.addEventListener('error', onError);

            // Per-attempt timeout
            setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 20000);
        });
    }

    async function preloadAllAssets() {
        let loadedCount = 0;
        let totalResources = 0;
        let failedItems = [];

        function onLoaded(label, success) {
            loadedCount++;
            const percent = (loadedCount / totalResources) * 100;
            if (success) {
                updateProgress(percent, `Loaded ${label} ✓`);
            } else {
                failedItems.push(label);
                updateProgress(percent, `Retries exhausted: ${label}`);
            }
        }

        // --- Gather all assets ---
        const domImages = [...new Set(
            Array.from(document.querySelectorAll('img')).map(img => img.src).filter(Boolean)
        )];
        const domVideos = Array.from(document.querySelectorAll('video'));
        const songPaths = PLAYLIST.map(s => s.src);

        // Count: fonts + domImages + galleryImages + videos + songs + window.load
        totalResources = 1 + domImages.length + GALLERY_IMAGES.length +
            domVideos.length + songPaths.length + 1;

        updateProgress(2, 'Gathering assets...');

        const tasks = [];

        // --- Fonts (no retry needed, just wait) ---
        tasks.push(
            Promise.race([
                document.fonts ? document.fonts.ready : Promise.resolve(),
                new Promise(r => setTimeout(r, 5000)),
            ]).then(() => onLoaded('Fonts', true))
        );

        // --- DOM Images (retry up to 2 times) ---
        domImages.forEach((src, i) => {
            tasks.push(
                withRetry(loadImage(src), 2, 1000)
                    .then(ok => onLoaded(`Image ${i + 1}`, ok))
            );
        });

        // --- Gallery Images (retry up to 2 times) ---
        GALLERY_IMAGES.forEach((path, i) => {
            const src = `Assets/Gallery/${path}`;
            tasks.push(
                withRetry(loadImage(src), 2, 1000)
                    .then(ok => onLoaded(`Gallery Photo ${i + 1}`, ok))
            );
        });

        // --- DOM Videos (retry up to 2 times) ---
        domVideos.forEach((video, i) => {
            tasks.push(
                withRetry(loadVideo(video), 2, 2000)
                    .then(ok => onLoaded(`Memory Video ${i + 1}`, ok))
            );
        });

        // --- Songs (retry up to 3 times — critical) ---
        songPaths.forEach((src, i) => {
            tasks.push(
                withRetry(loadSong(src), 3, 2000)
                    .then(ok => onLoaded(`Song ${i + 1}`, ok))
            );
        });

        // --- Window load ---
        tasks.push(
            new Promise(r => {
                if (document.readyState === 'complete') r();
                else window.addEventListener('load', r);
            }).then(() => onLoaded('Page Resources', true))
        );

        // Wait for ALL tasks to complete — no overall timeout bypass
        await Promise.all(tasks);

        if (failedItems.length > 0) {
            updateProgress(100, `Loaded! (${failedItems.length} items unavailable)`);
        } else {
            updateProgress(100, 'All Memories Loaded! ❤️');
        }
    }

    function dismiss() {
        setTimeout(() => {
            screen.classList.add('hidden');
            setTimeout(() => {
                screen.style.display = 'none';
            }, 800);
        }, 600);
    }

    function init() {
        // Always show loading screen and wait for all assets
        preloadAllAssets().then(() => {
            dismiss();
        });
    }

    return { init };
})();
