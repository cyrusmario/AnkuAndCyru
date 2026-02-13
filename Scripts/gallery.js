// ============================================================
// gallery.js — Photo Gallery Modal & Lightbox
// ============================================================

const Gallery = (() => {
    const photoGallery = document.getElementById('photoGallery');
    const closeGalleryBtn = document.getElementById('closeGallery');
    const galleryGrid = document.getElementById('galleryGrid');
    const imageLightbox = document.getElementById('imageLightbox');
    const focusedImage = document.getElementById('focusedImage');
    const closeLightboxBtn = document.getElementById('closeLightbox');
    const navGallery = document.getElementById('navGallery');

    function toggleGallery() {
        const isActive = photoGallery.classList.toggle('active');
        document.body.style.overflow = isActive ? 'hidden' : '';
        navGallery.classList.toggle('active', isActive);
    }

    function toggleLightbox(imgSrc = '') {
        const isActive = imageLightbox.classList.toggle('active');
        if (isActive) focusedImage.src = imgSrc;
    }

    function populateGrid() {
        const fragment = document.createDocumentFragment();
        GALLERY_IMAGES.forEach(imgName => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = `Assets/Gallery/${imgName}`;
            img.alt = 'Memory Item';
            img.loading = 'lazy';
            item.appendChild(img);

            item.addEventListener('click', () => toggleLightbox(img.src));
            fragment.appendChild(item);
        });
        galleryGrid.appendChild(fragment);
    }

    function init() {
        populateGrid();

        closeGalleryBtn.addEventListener('click', toggleGallery);
        document.querySelector('.modal-overlay').addEventListener('click', toggleGallery);

        closeLightboxBtn.addEventListener('click', () => toggleLightbox());
        document.querySelector('.lightbox-overlay').addEventListener('click', () => toggleLightbox());
    }

    return { init, toggleGallery };
})();
