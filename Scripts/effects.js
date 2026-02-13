// ============================================================
// effects.js — Hearts, Roses & Visual Effects
// ============================================================

const Effects = (() => {
    // --- Parametric Heart Curve ---
    function heartPoint(t) {
        const sinT = Math.sin(t);
        const cosT = Math.cos(t);
        const x = 16 * sinT * sinT * sinT;
        const y = -(13 * cosT - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        return { x: x / 17, y: y / 17 };
    }

    // --- Single-click: Roses burst from edges ---
    function createEdgeRoses(container) {
        const count = 18;
        const fragment = document.createDocumentFragment();
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        const batch = [];
        const edges = ['top', 'bottom', 'left', 'right'];

        for (let i = 0; i < count; i++) {
            const rose = document.createElement('div');
            rose.className = 'falling-rose';
            rose.textContent = ROSE_EMOJIS[Math.floor(Math.random() * ROSE_EMOJIS.length)];

            const edge = edges[Math.floor(Math.random() * edges.length)];
            const travel = 60 + Math.random() * 120;
            const drift = (Math.random() - 0.5) * 80;
            let startX, startY, tx, ty;

            switch (edge) {
                case 'top': startX = Math.random() * w; startY = 0; tx = drift; ty = -travel; break;
                case 'bottom': startX = Math.random() * w; startY = h; tx = drift; ty = travel; break;
                case 'left': startX = 0; startY = Math.random() * h; tx = -travel; ty = drift; break;
                case 'right': startX = w; startY = Math.random() * h; tx = travel; ty = drift; break;
            }

            const size = 18 + Math.random() * 16;
            const duration = 2.5 + Math.random() * 2.5;
            const rotation = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);

            Object.assign(rose.style, {
                left: `${startX}px`,
                top: `${startY}px`,
                fontSize: `${size}px`,
            });
            rose.style.setProperty('--dur', `${duration}s`);
            rose.style.setProperty('--tx', `${tx}px`);
            rose.style.setProperty('--ty', `${ty}px`);
            rose.style.setProperty('--rot', `${rotation}deg`);

            fragment.appendChild(rose);
            batch.push(rose);
        }

        container.appendChild(fragment);
        setTimeout(() => batch.forEach(r => r.parentNode && r.remove()), 6000);
    }

    // --- Double-click: Heart-shaped burst ---
    function createHeartRoses(container) {
        const count = 28;
        const fragment = document.createDocumentFragment();
        const w = container.offsetWidth;
        const h = container.offsetHeight;
        const centerX = w / 2;
        const centerY = h / 2;
        const batch = [];
        const scale = Math.max(w, h, 200) * 0.65 + 40;

        for (let i = 0; i < count; i++) {
            const rose = document.createElement('div');
            rose.className = 'falling-rose';
            rose.textContent = ROSE_EMOJIS[Math.floor(Math.random() * ROSE_EMOJIS.length)];

            const t = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.25;
            const pt = heartPoint(t);
            const tx = pt.x * scale;
            const ty = pt.y * scale;

            const size = 18 + Math.random() * 16;
            const duration = 2.5 + Math.random() * 2.5;
            const rotation = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);

            Object.assign(rose.style, {
                left: `${centerX}px`,
                top: `${centerY}px`,
                fontSize: `${size}px`,
            });
            rose.style.setProperty('--dur', `${duration}s`);
            rose.style.setProperty('--tx', `${tx}px`);
            rose.style.setProperty('--ty', `${ty}px`);
            rose.style.setProperty('--rot', `${rotation}deg`);

            fragment.appendChild(rose);
            batch.push(rose);
        }

        container.appendChild(fragment);
        setTimeout(() => batch.forEach(r => r.parentNode && r.remove()), 6000);
    }

    // --- Press animation helper ---
    function pressImage(container) {
        container.classList.remove('pressed');
        void container.offsetWidth; // force reflow
        container.classList.add('pressed');
        setTimeout(() => container.classList.remove('pressed'), 500);
    }

    // --- Attach click/double-click rose effects to memory images ---
    function initImageEffects() {
        const clickDebounce = new WeakMap();

        document.querySelectorAll('.memory-image').forEach(imgContainer => {
            imgContainer.style.cursor = 'pointer';
            imgContainer.addEventListener('click', e => {
                if (e.target.closest('button')) return;
                pressImage(imgContainer);

                const pending = clickDebounce.get(imgContainer);
                if (pending) {
                    clearTimeout(pending);
                    clickDebounce.delete(imgContainer);
                    createHeartRoses(imgContainer);
                } else {
                    const timer = setTimeout(() => {
                        clickDebounce.delete(imgContainer);
                        createEdgeRoses(imgContainer);
                    }, 300);
                    clickDebounce.set(imgContainer, timer);
                }
            });
        });
    }

    // --- Falling hearts celebration ---
    function createHearts() {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 40; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerHTML = '❤️';
            Object.assign(heart.style, {
                left: Math.random() * 100 + 'vw',
                animationDelay: Math.random() * 3 + 's',
                fontSize: (Math.random() * 20 + 10) + 'px',
                position: 'fixed',
                top: '-20px',
                zIndex: '1000',
                pointerEvents: 'none',
                animation: `fall ${Math.random() * 3 + 2}s linear forwards`,
            });
            fragment.appendChild(heart);
        }
        document.body.appendChild(fragment);
        setTimeout(() => {
            document.querySelectorAll('.heart-particle').forEach(h => h.remove());
        }, 5000);
    }

    // --- Background floating hearts ---
    function initBackgroundHearts() {
        for (let i = 0; i < 40; i++) {
            const heart = document.createElement('div');
            heart.classList.add('bg-heart');
            heart.innerHTML = '❤️';
            Object.assign(heart.style, {
                left: `${Math.random() * 100}vw`,
                animationDuration: `${Math.random() * 15 + 15}s`,
                fontSize: `${Math.random() * 20 + 10}px`,
                animationDelay: `${Math.random() * -30}s`,
            });
            document.body.appendChild(heart);
        }
    }

    return {
        initImageEffects,
        initBackgroundHearts,
        createHearts,
    };
})();
