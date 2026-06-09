document.addEventListener('DOMContentLoaded', function() {
    const flipBookElement = document.getElementById('flipbook');
    const wrapperElement = document.querySelector('.flipbook-wrapper');
    const totalPages = document.querySelectorAll('.page').length;
    
    // Obtener la primera imagen para calcular su tamaño REAL
    // De esta forma, las páginas de la revista tendrán EXACTAMENTE
    // la misma forma geométrica que tu imagen, eliminando cualquier franja blanca.
    const firstImg = document.querySelector('.page-content img');
    
    if (firstImg.complete && firstImg.naturalWidth) {
        initFlipbook(firstImg.naturalWidth, firstImg.naturalHeight);
    } else {
        // Fallback de seguridad
        const fallbackTimer = setTimeout(() => {
            if (!firstImg.complete) initFlipbook(1000, 1414);
        }, 3000);
        
        firstImg.onload = function() {
            clearTimeout(fallbackTimer);
            initFlipbook(firstImg.naturalWidth, firstImg.naturalHeight);
        };
    }

    function initFlipbook(baseW, baseH) {
        // Evitar doble inicialización
        if (window.flipbookInitialized) return;
        window.flipbookInitialized = true;

        if (!baseW || !baseH) {
            baseW = 1000;
            baseH = 1414;
        }

        const pageFlip = new St.PageFlip(flipBookElement, {
            width: baseW, 
            height: baseH,
            size: "stretch", 
            minWidth: 300,
            maxWidth: 3000,
            minHeight: 400,
            maxHeight: 4000,
            maxShadowOpacity: 0.5,
            showCover: true,
            mobileScrollSupport: false,
            usePortrait: true
        });

        let isInitialized = false;

        function resizeWrapper() {
            // Utilizamos el 98% de la pantalla para que ocupe todo lo posible
            let availableWidth = window.innerWidth * 0.98; 
            let availableHeight = window.innerHeight * 0.98;

            let isPortrait = false;
            if (pageFlip && typeof pageFlip.getOrientation === 'function' && isInitialized) {
                isPortrait = (pageFlip.getOrientation() === 'portrait');
            } else {
                isPortrait = (availableWidth < availableHeight);
            }

            const targetRatio = isPortrait ? (baseW / baseH) : ((baseW * 2) / baseH);
            const screenRatio = availableWidth / availableHeight;
            
            if (screenRatio > targetRatio) {
                wrapperElement.style.height = availableHeight + 'px';
                wrapperElement.style.width = (availableHeight * targetRatio) + 'px';
            } else {
                wrapperElement.style.width = availableWidth + 'px';
                wrapperElement.style.height = (availableWidth / targetRatio) + 'px';
            }
            
            if (isInitialized && typeof pageFlip.update === 'function') {
                pageFlip.update();
            }
        }

        function updateCentering(pageIndex, orientation) {
            flipBookElement.classList.remove('center-cover', 'center-backcover', 'center-open');
            if (orientation === 'portrait') {
                flipBookElement.classList.add('center-open');
            } else if (pageIndex === 0) {
                flipBookElement.classList.add('center-cover');
            } else if (pageIndex >= totalPages - 1) {
                flipBookElement.classList.add('center-backcover');
            } else {
                flipBookElement.classList.add('center-open');
            }
        }

        pageFlip.on('flip', (e) => {
            updateCentering(e.data, pageFlip.getOrientation());
        });

        pageFlip.on('changeOrientation', (e) => {
            resizeWrapper();
            updateCentering(pageFlip.getCurrentPageIndex(), e.data);
        });

        window.addEventListener('resize', resizeWrapper);

        let autoplayInterval;
        let autoplayTimeout;
        const intervalMs = 3000;
        
        function startAutoplay() {
            stopAutoplay();
            autoplayInterval = setInterval(() => {
                let currentIndex = pageFlip.getCurrentPageIndex();
                
                if (currentIndex >= totalPages - 1) {
                    // La librería tiene una animación nativa y suave para saltar múltiples páginas
                    if (typeof pageFlip.flip === 'function') {
                        pageFlip.flip(0); 
                    } else if (typeof pageFlip.turnToPage === 'function') {
                        pageFlip.turnToPage(0);
                    }
                } else {
                    pageFlip.flipNext();
                }
            }, intervalMs);
        }

        function stopAutoplay() {
            if (autoplayInterval) clearInterval(autoplayInterval);
            if (autoplayTimeout) clearTimeout(autoplayTimeout);
            autoplayInterval = null;
            autoplayTimeout = null;
        }

        function pauseAndResumeAutoplay() {
            stopAutoplay();
            autoplayTimeout = setTimeout(() => {
                startAutoplay();
            }, 6000);
        }

        resizeWrapper();

        pageFlip.on('init', () => {
            isInitialized = true;
            resizeWrapper();
            updateCentering(pageFlip.getCurrentPageIndex(), pageFlip.getOrientation());
            
            // Ocultar pantalla de carga suavemente
            const loadingScreen = document.getElementById('loading-screen');
            const appContainer = document.querySelector('.app-container');
            
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                if (appContainer) appContainer.style.opacity = '1';
                
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    startAutoplay();
                }, 500); // 500ms para hacer coincidir la transición CSS
            } else {
                startAutoplay();
            }
        });

        pageFlip.on('changeState', (e) => {
            if (e.data === 'user_fold' || e.data === 'flipping') {
                pauseAndResumeAutoplay();
            }
        });

        flipBookElement.addEventListener('mousedown', pauseAndResumeAutoplay);
        flipBookElement.addEventListener('touchstart', pauseAndResumeAutoplay, {passive: true});

        pageFlip.loadFromHTML(document.querySelectorAll('.page'));
    }
});
