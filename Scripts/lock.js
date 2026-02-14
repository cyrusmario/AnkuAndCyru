// ============================================================
// lock.js — Password Protection Manager
// ============================================================

const LockManager = (() => {
    let currentLockedId = null;

    function init() {
        if (typeof LOCKED_FEATURES === 'undefined') return;

        // Check Website Lock First
        if (LOCKED_FEATURES['website'] && isLocked('website')) {
            lockWebsite();
            return; // Stop other initializations until unlocked
        }

        // Check for already unlocked items to restore UI
        Object.keys(LOCKED_FEATURES).forEach(id => {
            if (id === 'website') {
                if (!isLocked('website')) {
                    addWebsiteRelockButton();
                }
            } else if (id === 'gallery') {
                // Return interception if locked, or restore unlock if unlocked
                if (!isLocked('gallery')) {
                    unlockGallery();
                } else {
                    lockGallery();
                }
            } else {
                if (LOCKED_FEATURES[id]) {
                    if (isLocked(id)) {
                        lockElement(id);
                    } else {
                        // Already unlocked: restore the re-lock button
                        addRelockButton(id);
                    }
                }
            }
        });

        setupModal();
    }

    function lockWebsite() {
        document.body.classList.add('locked-website');
        if (typeof MusicPlayer !== 'undefined') MusicPlayer.pauseAudio(true);
        // Create a dedicated overlay for the website
        const overlay = document.createElement('div');
        overlay.id = 'websiteLockOverlay';
        overlay.className = 'website-lock-overlay';
        overlay.innerHTML = `
            <div class="lock-content">
                <i class="fa-solid fa-lock"></i>
                <h1>Our World</h1>
                <p>A secret place for us. <br> Enter the magic key.</p>
                <div class="input-group">
                    <input type="password" id="sitePassword" placeholder="Secret Key..." autocomplete="off">
                    <button id="siteSubmit" class="btn btn-unlock">Enter</button>
                </div>
                <p id="siteError" class="error-msg">That's not the key! 🗝️</p>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#sitePassword');
        const btn = overlay.querySelector('#siteSubmit');
        const error = overlay.querySelector('#siteError');

        const attemptSiteUnlock = () => {
            if (input.value === LOCKED_FEATURES['website']) {
                unlockWebsite();
            } else {
                error.style.visibility = 'visible';
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 500);
            }
        };

        btn.addEventListener('click', attemptSiteUnlock);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptSiteUnlock();
        });

        input.focus();
    }

    function unlockWebsite() {
        sessionStorage.setItem('unlocked_website', 'true');
        document.body.classList.remove('locked-website');
        const overlay = document.getElementById('websiteLockOverlay');
        if (overlay) overlay.remove();

        addWebsiteRelockButton();

        // Resume normal init
        init();

        // Start music if unlocked
        if (typeof MusicPlayer !== 'undefined') {
            // Check if we previously said yes (autoplay depends on that)
            // Or just check if we should play? robustAutoplay handles checks internally?
            // robustAutoplay checks nothing, it just plays.
            // app.js checks 'sheSaidYes'.
            if (localStorage.getItem('sheSaidYes') === 'true') {
                MusicPlayer.robustAutoplay();
            }
        }
    }

    function addWebsiteRelockButton() {
        if (document.querySelector('.site-relock-btn')) return;

        const relockBtn = document.createElement('button');
        relockBtn.className = 'site-relock-btn';
        relockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
        relockBtn.title = 'Lock Website';
        relockBtn.onclick = () => {
            sessionStorage.removeItem('unlocked_website');
            location.reload(); // Reload to re-apply lock cleanly
        };
        document.body.appendChild(relockBtn);
    }

    function isLocked(id) {
        // Check session storage to see if already unlocked
        return !sessionStorage.getItem(`unlocked_${id}`);
    }

    function lockElement(id) {
        const parent = document.getElementById(id);
        if (!parent) return;

        // Try to find the media container (.memory-image)
        // If not found (e.g. story logic), fallback to parent
        const mediaContainer = parent.querySelector('.memory-image') || parent;

        mediaContainer.classList.add('locked-content');

        // Handle Video: Pause and Mute
        const video = mediaContainer.querySelector('video');
        if (video) {
            video.pause();
            video.muted = true;
            video.removeAttribute('controls');
        }

        // Create overlay if it doesn't exist
        if (!mediaContainer.querySelector('.lock-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'lock-overlay';
            overlay.innerHTML = '<i class="fa-solid fa-lock"></i><span>Locked Memory</span>';
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openUnlockModal(id);
            });
            mediaContainer.appendChild(overlay);
        }
    }

    function lockGallery() {
        // Robust Interception: Override the global Gallery.toggleGallery function
        if (!Gallery.originalToggle) {
            Gallery.originalToggle = Gallery.toggleGallery;
        }

        Gallery.toggleGallery = function () {
            if (isLocked('gallery')) {
                openUnlockModal('gallery');
            } else {
                Gallery.originalToggle.call(Gallery);
            }
        };
    }

    function unlockElement(id) {
        if (id === 'gallery') {
            unlockGallery();
            return;
        }

        const parent = document.getElementById(id);
        if (!parent) return;

        const mediaContainer = parent.querySelector('.memory-image') || parent;
        mediaContainer.classList.remove('locked-content');

        const overlay = mediaContainer.querySelector('.lock-overlay');
        if (overlay) overlay.remove();

        const video = mediaContainer.querySelector('video');
        if (video) {
            video.muted = false; // Optional: unmute on unlock
            // Check global audio state will handle play/pause logic via IntersectionObserver
        }

        // Persist unlock state
        sessionStorage.setItem(`unlocked_${id}`, 'true');

        addRelockButton(id);
    }

    function addRelockButton(id) {
        const parent = document.getElementById(id);
        if (!parent) return;
        const mediaContainer = parent.querySelector('.memory-image') || parent;

        if (mediaContainer.querySelector('.relock-btn')) return;

        const relockBtn = document.createElement('button');
        relockBtn.className = 'relock-btn';
        relockBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i>';
        relockBtn.title = 'Lock Memory';
        relockBtn.onclick = (e) => {
            e.stopPropagation();
            // Remove unlock state
            sessionStorage.removeItem(`unlocked_${id}`);
            relockBtn.remove();
            lockElement(id);
        };
        mediaContainer.appendChild(relockBtn);
    }

    function unlockGallery() {
        sessionStorage.setItem('unlocked_gallery', 'true');

        // Restore original functionality
        if (Gallery.originalToggle) {
            Gallery.toggleGallery = Gallery.originalToggle;
        }

        // Auto-lock on close (handled by checking valid close button or just re-wrapping if needed)
        // Actually, since we restored the original function, we lost the lock check.
        // But that's fine, it's unlocked now.
        // We only need to re-lock if the user closes it? 
        // Logic: if unlocked, we want it to stay unlocked until refresh? 
        // OR does the user want it to re-lock when closed? 
        // Based on previous code: "Auto-lock on close". 

        // If we want auto-lock on close, we need to LISTEN to the close event.
        const closeGalleryBtn = document.getElementById('closeGallery');
        if (closeGalleryBtn) {
            // Unify close behavior
            const newCloseBtn = closeGalleryBtn.cloneNode(true);
            closeGalleryBtn.parentNode.replaceChild(newCloseBtn, closeGalleryBtn);

            newCloseBtn.addEventListener('click', () => {
                Gallery.toggleGallery(); // Open/Close

                // If we are closing it (it was active), re-lock?
                // The toggleGallery toggles class. We can't easily know if it's opening or closing here 
                // without checking state AFTER click, or assuming.

                // Re-enforcing lock:
                if (LOCKED_FEATURES['gallery']) {
                    sessionStorage.removeItem('unlocked_gallery');
                    lockGallery(); // Re-apply interception
                }
            });
        }
    }

    function setupModal() {
        const modal = document.getElementById('unlockModal');
        const closeBtn = document.getElementById('closeUnlockModal');
        const submitBtn = document.getElementById('unlockSubmitBtn');
        const passwordInput = document.getElementById('unlockPassword');

        if (!modal) return;

        const closeModal = () => {
            modal.classList.add('hidden');
            passwordInput.value = '';
            currentLockedId = null;
            hideError();
        };

        closeBtn.addEventListener('click', closeModal);

        submitBtn.addEventListener('click', () => {
            attemptUnlock();
        });

        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptUnlock();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function openUnlockModal(id) {
        currentLockedId = id;
        const modal = document.getElementById('unlockModal');
        const passwordInput = document.getElementById('unlockPassword');
        modal.classList.remove('hidden');
        passwordInput.focus();
    }

    function attemptUnlock() {
        if (!currentLockedId) return;

        const passwordInput = document.getElementById('unlockPassword');
        const enteredPassword = passwordInput.value;
        const correctPassword = LOCKED_FEATURES[currentLockedId];

        if (enteredPassword === correctPassword) {
            unlockElement(currentLockedId);
            document.getElementById('unlockModal').classList.add('hidden');
            passwordInput.value = '';
            currentLockedId = null;
            hideError();
            // If it was gallery, maybe open it now?
            if (currentLockedId === 'gallery') {
                Gallery.toggleGallery();
            }
        } else {
            showError();
            passwordInput.classList.add('shake');
            setTimeout(() => passwordInput.classList.remove('shake'), 500);
        }
    }

    function showError() {
        const errorMsg = document.getElementById('unlockError');
        if (errorMsg) errorMsg.style.visibility = 'visible';
    }

    function hideError() {
        const errorMsg = document.getElementById('unlockError');
        if (errorMsg) errorMsg.style.visibility = 'hidden';
    }

    function isWebsiteLocked() {
        return LOCKED_FEATURES['website'] && isLocked('website');
    }

    return {
        init,
        isWebsiteLocked
    };
})();
