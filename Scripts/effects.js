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

    // --- Get the .memory-card parent, or fall back to the container itself ---
    function getRoseTarget(imgContainer) {
        const card = imgContainer.closest('.memory-card');
        return card || imgContainer;
    }

    // --- Calculate image offset within the card ---
    function getImageOffsetInCard(imgContainer, card) {
        const imgRect = imgContainer.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        return {
            offsetX: imgRect.left - cardRect.left,
            offsetY: imgRect.top - cardRect.top,
            w: imgRect.width,
            h: imgRect.height,
        };
    }

    // --- Single-click: Roses burst from image edges and spread outward ---
    function createEdgeRoses(imgContainer) {
        const card = getRoseTarget(imgContainer);
        const imgRect = imgContainer.getBoundingClientRect();
        if (imgRect.width === 0 || imgRect.height === 0) return;

        const { offsetX, offsetY, w, h } = getImageOffsetInCard(imgContainer, card);

        const count = 14;
        const fragment = document.createDocumentFragment();
        const batch = [];
        const edges = ['top', 'bottom', 'left', 'right'];

        for (let i = 0; i < count; i++) {
            const rose = document.createElement('div');
            rose.className = 'falling-rose';
            rose.textContent = ROSE_EMOJIS[Math.floor(Math.random() * ROSE_EMOJIS.length)];

            const edge = edges[Math.floor(Math.random() * edges.length)];
            const travel = 150 + Math.random() * 200;
            const drift = (Math.random() - 0.5) * 200;
            let startX, startY, tx, ty;

            switch (edge) {
                case 'top': startX = offsetX + Math.random() * w; startY = offsetY; tx = drift; ty = -travel; break;
                case 'bottom': startX = offsetX + Math.random() * w; startY = offsetY + h; tx = drift; ty = travel; break;
                case 'left': startX = offsetX; startY = offsetY + Math.random() * h; tx = -travel; ty = drift; break;
                case 'right': startX = offsetX + w; startY = offsetY + Math.random() * h; tx = travel; ty = drift; break;
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

        card.appendChild(fragment);
        void card.offsetHeight;
        setTimeout(() => batch.forEach(r => r.parentNode && r.remove()), 6000);
    }

    // --- Double-click: Heart-shaped burst from image center ---
    function createHeartRoses(imgContainer) {
        const card = getRoseTarget(imgContainer);
        const imgRect = imgContainer.getBoundingClientRect();
        if (imgRect.width === 0 || imgRect.height === 0) return;

        const { offsetX, offsetY, w, h } = getImageOffsetInCard(imgContainer, card);

        const count = 22;
        const fragment = document.createDocumentFragment();
        const centerX = offsetX + w / 2;
        const centerY = offsetY + h / 2;
        const batch = [];
        const scale = Math.max(w, h, 200) * 0.9 + 80;

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

        card.appendChild(fragment);
        void card.offsetHeight;
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
        for (let i = 0; i < 30; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart-particle';
            heart.innerHTML = '❤️';
            const delay = Math.random() * 3;
            const duration = Math.random() * 3 + 2;
            Object.assign(heart.style, {
                left: Math.random() * 100 + 'vw',
                animationDelay: delay + 's',
                fontSize: (Math.random() * 20 + 10) + 'px',
                position: 'fixed',
                top: '-20px',
                zIndex: '1000',
                pointerEvents: 'none',
                animation: `fall ${duration}s linear ${delay}s forwards`,
            });
            fragment.appendChild(heart);
        }
        document.body.appendChild(fragment);
        setTimeout(() => {
            document.querySelectorAll('.heart-particle').forEach(h => h.remove());
        }, 6000);
    }

    // --- Background floating hearts ---
    function initBackgroundHearts() {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 20; i++) {
            const heart = document.createElement('div');
            heart.classList.add('bg-heart');
            heart.innerHTML = '❤️';
            Object.assign(heart.style, {
                left: `${Math.random() * 100}vw`,
                animationDuration: `${Math.random() * 15 + 15}s`,
                fontSize: `${Math.random() * 20 + 10}px`,
                animationDelay: `${Math.random() * -30}s`,
            });
            fragment.appendChild(heart);
        }
        document.body.appendChild(fragment);
    }

    return {
        initImageEffects,
        initBackgroundHearts,
        createHearts,
    };
})();
