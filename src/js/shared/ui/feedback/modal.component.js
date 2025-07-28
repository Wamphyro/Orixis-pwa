/* ========================================
   MODAL.COMPONENT.JS - Système de modales ultra-complet
   Chemin: src/js/shared/ui/feedback/modal.component.js
   
   DESCRIPTION:
   Composant modal avec TOUTES les options possibles : styles (glassmorphism, 
   neumorphism, flat, material), animations (none à rich), tailles, positions,
   transitions, overlays personnalisables, etc.
   
   STRUCTURE:
   1. Configuration complète (lignes 15-250)
   2. Classe Modal principale (lignes 252-800)
   3. Modal Manager (lignes 802-950)
   4. Helpers et présets (lignes 952-1200)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   - Styles CSS intégrés ou via fichiers séparés
   ======================================== */

const Modal = (() => {
    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    webkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    borderRadius: '20px'
                },
                overlay: {
                    background: 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(5px)'
                },
                header: {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)'
                }
            },
            'glassmorphism-dark': {
                container: {
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(20px)',
                    webkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    borderRadius: '20px',
                    color: '#ffffff'
                },
                overlay: {
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(10px)'
                },
                header: {
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)'
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    borderRadius: '20px',
                    boxShadow: '20px 20px 60px #bebebe, -20px -20px 60px #ffffff'
                },
                overlay: {
                    background: 'rgba(224, 229, 236, 0.8)'
                },
                header: {
                    background: 'transparent',
                    borderBottom: 'none'
                }
            },
            'neumorphism-dark': {
                container: {
                    background: '#1e1e1e',
                    borderRadius: '20px',
                    boxShadow: '20px 20px 60px #0a0a0a, -20px -20px 60px #323232',
                    color: '#ffffff'
                },
                overlay: {
                    background: 'rgba(30, 30, 30, 0.8)'
                },
                header: {
                    background: 'transparent',
                    borderBottom: 'none'
                }
            },
            'flat': {
                container: {
                    background: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
                },
                overlay: {
                    background: 'rgba(0, 0, 0, 0.5)'
                },
                header: {
                    borderBottom: '1px solid #e5e7eb'
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    borderRadius: '4px',
                    boxShadow: '0 11px 15px -7px rgba(0,0,0,0.2), 0 24px 38px 3px rgba(0,0,0,0.14)'
                },
                overlay: {
                    background: 'rgba(0, 0, 0, 0.5)'
                },
                header: {
                    background: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0'
                }
            },
            'minimal': {
                container: {
                    background: '#ffffff',
                    borderRadius: '0',
                    boxShadow: 'none',
                    border: '1px solid #e5e7eb'
                },
                overlay: {
                    background: 'rgba(255, 255, 255, 0.9)'
                },
                header: {
                    borderBottom: '1px solid #e5e7eb'
                }
            },
            'gradient': {
                container: {
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                },
                overlay: {
                    background: 'linear-gradient(135deg, rgba(76, 0, 255, 0.1) 0%, rgba(255, 0, 218, 0.1) 100%)'
                },
                header: {
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                duration: 0
            },
            'subtle': {
                enabled: true,
                duration: 200,
                openAnimation: 'fadeIn',
                closeAnimation: 'fadeOut',
                overlayAnimation: 'fadeIn'
            },
            'smooth': {
                enabled: true,
                duration: 300,
                openAnimation: 'slideInUp',
                closeAnimation: 'slideOutDown',
                overlayAnimation: 'fadeIn',
                bounce: false
            },
            'rich': {
                enabled: true,
                duration: 400,
                openAnimation: 'zoomInBounce',
                closeAnimation: 'zoomOutBounce',
                overlayAnimation: 'blurIn',
                bounce: true,
                particles: true,
                glow: true
            },
            'elegant': {
                enabled: true,
                duration: 350,
                openAnimation: 'slideInUpSmooth',
                closeAnimation: 'slideOutDownSmooth',
                overlayAnimation: 'fadeInBlur',
                ripple: true
            },
            'playful': {
                enabled: true,
                duration: 500,
                openAnimation: 'rotateIn',
                closeAnimation: 'rotateOut',
                overlayAnimation: 'fadeIn',
                wobble: true,
                confetti: true
            }
        },

        // Tailles prédéfinies
        sizes: {
            'xs': { width: '300px', maxWidth: '90%' },
            'sm': { width: '400px', maxWidth: '90%' },
            'md': { width: '600px', maxWidth: '90%' },
            'lg': { width: '800px', maxWidth: '90%' },
            'xl': { width: '1000px', maxWidth: '90%' },
            'full': { width: '95%', maxWidth: '1400px' },
            'auto': { width: 'auto', maxWidth: '90%' },
            'fullscreen': { width: '100%', height: '100%', maxWidth: '100%' }
        },

        // Positions
        positions: {
            'center': { alignItems: 'center', justifyContent: 'center' },
            'top': { alignItems: 'flex-start', justifyContent: 'center', paddingTop: '50px' },
            'bottom': { alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '50px' },
            'left': { alignItems: 'center', justifyContent: 'flex-start' },
            'right': { alignItems: 'center', justifyContent: 'flex-end' },
            'top-left': { alignItems: 'flex-start', justifyContent: 'flex-start' },
            'top-right': { alignItems: 'flex-start', justifyContent: 'flex-end' },
            'bottom-left': { alignItems: 'flex-end', justifyContent: 'flex-start' },
            'bottom-right': { alignItems: 'flex-end', justifyContent: 'flex-end' }
        },

        // Fonctionnalités
        features: {
            'draggable': { cursor: 'move', handle: '.modal-header' },
            'resizable': { handles: 'all', minWidth: 200, minHeight: 100 },
            'stackable': { zIndexBase: 1000, increment: 10 },
            'fullscreenable': { button: true, doubleClick: false },
            'minimizable': { button: true, position: 'bottom-right' },
            'maximizable': { button: true },
            'printable': { button: true, style: 'clean' },
            'keyboard': { closeOnEscape: true, focusTrap: true, navigation: true },
            'accessibility': { ariaLabel: true, announcements: true, highContrast: false },
            'responsive': { breakpoints: { mobile: 768, tablet: 1024 } },
            'theme': { switcher: true, persist: true },
            'sound': { open: 'soft-pop', close: 'soft-whoosh', enabled: false }
        },

        // Types de contenu spécialisés
        contentTypes: {
            'default': {},
            'form': { 
                validation: true, 
                autosave: true, 
                steps: false,
                submitButton: true 
            },
            'media': { 
                gallery: true, 
                zoom: true, 
                slideshow: true,
                download: true 
            },
            'wizard': { 
                steps: true, 
                progress: true, 
                navigation: true,
                validation: true 
            },
            'alert': { 
                icon: true, 
                timer: false, 
                actions: ['ok'],
                severity: 'info' 
            },
            'confirm': { 
                icon: true, 
                actions: ['cancel', 'confirm'],
                danger: false 
            },
            'iframe': { 
                loading: 'lazy', 
                sandbox: true,
                allowFullscreen: true 
            },
            'terminal': { 
                syntax: 'bash', 
                theme: 'dark',
                copyButton: true 
            }
        },

        // Animations CSS
        keyframes: {
            fadeIn: `@keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }`,
            fadeOut: `@keyframes modalFadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }`,
            slideInUp: `@keyframes modalSlideInUp {
                from { transform: translateY(100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }`,
            slideOutDown: `@keyframes modalSlideOutDown {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(100px); opacity: 0; }
            }`,
            zoomInBounce: `@keyframes modalZoomInBounce {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); opacity: 1; }
            }`,
            zoomOutBounce: `@keyframes modalZoomOutBounce {
                0% { transform: scale(1); opacity: 1; }
                20% { transform: scale(1.1); }
                100% { transform: scale(0.3); opacity: 0; }
            }`,
            rotateIn: `@keyframes modalRotateIn {
                from { transform: rotate(-200deg) scale(0); opacity: 0; }
                to { transform: rotate(0) scale(1); opacity: 1; }
            }`,
            rotateOut: `@keyframes modalRotateOut {
                from { transform: rotate(0) scale(1); opacity: 1; }
                to { transform: rotate(200deg) scale(0); opacity: 0; }
            }`,
            blurIn: `@keyframes modalBlurIn {
                from { filter: blur(20px); opacity: 0; }
                to { filter: blur(0); opacity: 1; }
            }`
        }
    };

    // ========================================
    // CLASSE MODAL PRINCIPALE
    // ========================================
    class Modal {
        constructor(options = {}) {
            // Configuration par défaut avec fusion des options
            this.options = this.mergeOptions({
                id: `modal-${Date.now()}`,
                style: 'glassmorphism',
                animation: 'smooth',
                size: 'md',
                position: 'center',
                title: '',
                content: '',
                contentType: 'default',
                features: {
                    closeButton: true,
                    closeOnOverlay: true,
                    closeOnEscape: true,
                    draggable: false,
                    resizable: false,
                    fullscreenable: false,
                    keyboard: true,
                    accessibility: true
                },
                callbacks: {
                    onOpen: null,
                    onClose: null,
                    onBeforeOpen: null,
                    onBeforeClose: null,
                    onResize: null,
                    onDrag: null,
                    onFullscreen: null
                },
                customClass: '',
                customStyles: {},
                autoOpen: false,
                appendTo: document.body,
                zIndex: 1000
            }, options);

            this.isOpen = false;
            this.isFullscreen = false;
            this.isMinimized = false;
            this.isDragging = false;
            this.isResizing = false;
            
            this.init();
        }

        mergeOptions(defaults, options) {
            const merged = { ...defaults };
            
            for (const key in options) {
                if (options.hasOwnProperty(key)) {
                    if (typeof options[key] === 'object' && !Array.isArray(options[key]) && options[key] !== null) {
                        merged[key] = this.mergeOptions(defaults[key] || {}, options[key]);
                    } else {
                        merged[key] = options[key];
                    }
                }
            }
            
            return merged;
        }

        init() {
            this.injectStyles();
            this.createElement();
            this.attachEvents();
            
            if (this.options.autoOpen) {
                this.open();
            }
        }

        injectStyles() {
            if (document.getElementById('modal-system-styles')) return;

            const styleContent = `
                /* Base modal styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: var(--modal-z-index, 1000);
                }

                .modal-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }

                .modal-container {
                    position: relative;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s ease;
                }

                .modal-header {
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .modal-title {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                .modal-controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .modal-control-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    color: inherit;
                }

                .modal-control-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }

                .modal-body {
                    padding: 20px;
                    overflow-y: auto;
                    flex: 1;
                }

                .modal-footer {
                    padding: 20px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    flex-shrink: 0;
                }

                /* Draggable styles */
                .modal-draggable .modal-header {
                    cursor: move;
                    user-select: none;
                }

                .modal-dragging {
                    opacity: 0.8;
                }

                /* Resizable styles */
                .modal-resizable .modal-resize-handle {
                    position: absolute;
                    background: transparent;
                }

                .modal-resize-handle-n { top: 0; left: 0; right: 0; height: 5px; cursor: n-resize; }
                .modal-resize-handle-e { top: 0; right: 0; bottom: 0; width: 5px; cursor: e-resize; }
                .modal-resize-handle-s { bottom: 0; left: 0; right: 0; height: 5px; cursor: s-resize; }
                .modal-resize-handle-w { top: 0; left: 0; bottom: 0; width: 5px; cursor: w-resize; }
                .modal-resize-handle-ne { top: 0; right: 0; width: 10px; height: 10px; cursor: ne-resize; }
                .modal-resize-handle-se { bottom: 0; right: 0; width: 10px; height: 10px; cursor: se-resize; }
                .modal-resize-handle-sw { bottom: 0; left: 0; width: 10px; height: 10px; cursor: sw-resize; }
                .modal-resize-handle-nw { top: 0; left: 0; width: 10px; height: 10px; cursor: nw-resize; }

                /* Fullscreen styles */
                .modal-fullscreen {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    border-radius: 0 !important;
                }

                .modal-fullscreen .modal-overlay {
                    padding: 0 !important;
                }

                /* Minimized styles */
                .modal-minimized {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 250px !important;
                    height: auto !important;
                    min-height: auto !important;
                }

                .modal-minimized .modal-body,
                .modal-minimized .modal-footer {
                    display: none;
                }

                /* Animation classes */
                ${Object.values(CONFIG.keyframes).join('\n')}

                /* Responsive */
                @media (max-width: 768px) {
                    .modal-container {
                        width: 95% !important;
                        max-width: 95% !important;
                        margin: 20px;
                    }
                }

                /* Accessibility */
                .modal-focus-trap:focus {
                    outline: 2px solid #4CAF50;
                    outline-offset: 2px;
                }

                /* High contrast mode */
                @media (prefers-contrast: high) {
                    .modal-container {
                        border: 2px solid currentColor !important;
                    }
                }

                /* Reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .modal-overlay,
                    .modal-container,
                    .modal-control-btn {
                        transition: none !important;
                        animation: none !important;
                    }
                }
            `;

            const style = document.createElement('style');
            style.id = 'modal-system-styles';
            style.textContent = styleContent;
            document.head.appendChild(style);
        }

        createElement() {
            // Créer l'overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'modal-overlay';
            this.overlay.id = this.options.id;
            
            // Appliquer le style de l'overlay
            const overlayStyle = CONFIG.styles[this.options.style]?.overlay || {};
            Object.assign(this.overlay.style, overlayStyle);
            
            // Appliquer la position
            const position = CONFIG.positions[this.options.position] || CONFIG.positions.center;
            Object.assign(this.overlay.style, position);

            // Créer le container
            this.container = document.createElement('div');
            this.container.className = `modal-container ${this.options.customClass}`;
            
            // Appliquer le style du container
            const containerStyle = CONFIG.styles[this.options.style]?.container || {};
            const sizeStyle = CONFIG.sizes[this.options.size] || CONFIG.sizes.md;
            Object.assign(this.container.style, containerStyle, sizeStyle, this.options.customStyles);

            // Créer la structure interne
            this.createHeader();
            this.createBody();
            this.createFooter();
            
            // Ajouter les handles de redimensionnement si nécessaire
            if (this.options.features.resizable) {
                this.createResizeHandles();
            }

            // Assembler
            this.overlay.appendChild(this.container);
            this.options.appendTo.appendChild(this.overlay);

            // Définir le z-index
            this.overlay.style.setProperty('--modal-z-index', this.options.zIndex);
        }

        createHeader() {
            this.header = document.createElement('div');
            this.header.className = 'modal-header';
            
            // Appliquer le style du header
            const headerStyle = CONFIG.styles[this.options.style]?.header || {};
            Object.assign(this.header.style, headerStyle);

            // Titre
            this.titleElement = document.createElement('h2');
            this.titleElement.className = 'modal-title';
            this.titleElement.textContent = this.options.title;

            // Contrôles
            this.controls = document.createElement('div');
            this.controls.className = 'modal-controls';

            // Boutons de contrôle selon les features
            if (this.options.features.minimizable) {
                this.createControlButton('minimize', '−', () => this.minimize());
            }
            
            if (this.options.features.maximizable || this.options.features.fullscreenable) {
                this.createControlButton('maximize', '□', () => this.toggleFullscreen());
            }
            
            if (this.options.features.closeButton) {
                this.createControlButton('close', '×', () => this.close());
            }

            this.header.appendChild(this.titleElement);
            this.header.appendChild(this.controls);
            this.container.appendChild(this.header);
        }

        createControlButton(type, icon, handler) {
            const button = document.createElement('button');
            button.className = `modal-control-btn modal-${type}`;
            button.innerHTML = icon;
            button.addEventListener('click', handler);
            this.controls.appendChild(button);
            return button;
        }

        createBody() {
            this.body = document.createElement('div');
            this.body.className = 'modal-body';
            
            // Contenu selon le type
            const contentConfig = CONFIG.contentTypes[this.options.contentType] || {};
            
            if (typeof this.options.content === 'string') {
                this.body.innerHTML = this.options.content;
            } else if (this.options.content instanceof HTMLElement) {
                this.body.appendChild(this.options.content);
            }

            this.container.appendChild(this.body);
        }

        createFooter() {
            // Ne créer le footer que si nécessaire
            const contentConfig = CONFIG.contentTypes[this.options.contentType] || {};
            
            if (this.options.footer || contentConfig.actions) {
                this.footer = document.createElement('div');
                this.footer.className = 'modal-footer';
                
                if (this.options.footer) {
                    if (typeof this.options.footer === 'string') {
                        this.footer.innerHTML = this.options.footer;
                    } else if (this.options.footer instanceof HTMLElement) {
                        this.footer.appendChild(this.options.footer);
                    }
                }
                
                this.container.appendChild(this.footer);
            }
        }

        createResizeHandles() {
            const handles = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
            
            handles.forEach(handle => {
                const div = document.createElement('div');
                div.className = `modal-resize-handle modal-resize-handle-${handle}`;
                div.dataset.handle = handle;
                this.container.appendChild(div);
            });
            
            this.container.classList.add('modal-resizable');
        }

        attachEvents() {
            // Fermeture sur clic overlay
            if (this.options.features.closeOnOverlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) {
                        this.close();
                    }
                });
            }

            // Keyboard events
            if (this.options.features.keyboard) {
                this.keyboardHandler = (e) => this.handleKeyboard(e);
            }

            // Draggable
            if (this.options.features.draggable) {
                this.initDraggable();
            }

            // Resizable
            if (this.options.features.resizable) {
                this.initResizable();
            }

            // Animations
            if (CONFIG.animations[this.options.animation]?.enabled) {
                this.initAnimations();
            }
        }

        handleKeyboard(e) {
            if (!this.isOpen) return;

            // Escape
            if (e.key === 'Escape' && this.options.features.closeOnEscape) {
                this.close();
                return;
            }

            // Tab trap
            if (e.key === 'Tab' && this.options.features.keyboard) {
                this.handleTabTrap(e);
            }
        }

        handleTabTrap(e) {
            const focusableElements = this.container.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }

        initDraggable() {
            let isDragging = false;
            let startX, startY, initialX, initialY;

            const dragStart = (e) => {
                if (this.isFullscreen || this.isMinimized) return;
                
                isDragging = true;
                this.isDragging = true;
                this.container.classList.add('modal-dragging');
                
                startX = e.clientX || e.touches[0].clientX;
                startY = e.clientY || e.touches[0].clientY;
                
                const rect = this.container.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;
                
                e.preventDefault();
            };

            const dragMove = (e) => {
                if (!isDragging) return;
                
                const currentX = e.clientX || e.touches[0].clientX;
                const currentY = e.clientY || e.touches[0].clientY;
                
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;
                
                this.container.style.position = 'fixed';
                this.container.style.left = `${initialX + deltaX}px`;
                this.container.style.top = `${initialY + deltaY}px`;
                this.container.style.transform = 'none';
                
                if (this.options.callbacks.onDrag) {
                    this.options.callbacks.onDrag({ x: initialX + deltaX, y: initialY + deltaY });
                }
            };

            const dragEnd = () => {
                if (!isDragging) return;
                
                isDragging = false;
                this.isDragging = false;
                this.container.classList.remove('modal-dragging');
            };

            // Mouse events
            this.header.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            
            // Touch events
            this.header.addEventListener('touchstart', dragStart);
            document.addEventListener('touchmove', dragMove);
            document.addEventListener('touchend', dragEnd);
            
            this.container.classList.add('modal-draggable');
        }

        initResizable() {
            const handles = this.container.querySelectorAll('.modal-resize-handle');
            
            handles.forEach(handle => {
                let isResizing = false;
                let startX, startY, startWidth, startHeight;
                
                const resizeStart = (e) => {
                    if (this.isFullscreen) return;
                    
                    isResizing = true;
                    this.isResizing = true;
                    
                    startX = e.clientX || e.touches[0].clientX;
                    startY = e.clientY || e.touches[0].clientY;
                    
                    const rect = this.container.getBoundingClientRect();
                    startWidth = rect.width;
                    startHeight = rect.height;
                    
                    e.preventDefault();
                };
                
                const resizeMove = (e) => {
                    if (!isResizing) return;
                    
                    const currentX = e.clientX || e.touches[0].clientX;
                    const currentY = e.clientY || e.touches[0].clientY;
                    
                    const deltaX = currentX - startX;
                    const deltaY = currentY - startY;
                    
                    const direction = handle.dataset.handle;
                    
                    // Calculate new dimensions based on handle
                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    
                    if (direction.includes('e')) newWidth = startWidth + deltaX;
                    if (direction.includes('w')) newWidth = startWidth - deltaX;
                    if (direction.includes('s')) newHeight = startHeight + deltaY;
                    if (direction.includes('n')) newHeight = startHeight - deltaY;
                    
                    // Apply constraints
                    const minWidth = CONFIG.features.resizable.minWidth || 200;
                    const minHeight = CONFIG.features.resizable.minHeight || 100;
                    
                    newWidth = Math.max(minWidth, newWidth);
                    newHeight = Math.max(minHeight, newHeight);
                    
                    this.container.style.width = `${newWidth}px`;
                    this.container.style.height = `${newHeight}px`;
                    
                    if (this.options.callbacks.onResize) {
                        this.options.callbacks.onResize({ width: newWidth, height: newHeight });
                    }
                };
                
                const resizeEnd = () => {
                    if (!isResizing) return;
                    
                    isResizing = false;
                    this.isResizing = false;
                };
                
                // Mouse events
                handle.addEventListener('mousedown', resizeStart);
                document.addEventListener('mousemove', resizeMove);
                document.addEventListener('mouseup', resizeEnd);
                
                // Touch events
                handle.addEventListener('touchstart', resizeStart);
                document.addEventListener('touchmove', resizeMove);
                document.addEventListener('touchend', resizeEnd);
            });
        }

        initAnimations() {
            const animConfig = CONFIG.animations[this.options.animation];
            
            if (animConfig.openAnimation) {
                this.container.style.animation = `${animConfig.openAnimation} ${animConfig.duration}ms ease-out`;
            }
            
            if (animConfig.overlayAnimation) {
                this.overlay.style.animation = `${animConfig.overlayAnimation} ${animConfig.duration}ms ease-out`;
            }
        }

        async open() {
            // Callback avant ouverture
            if (this.options.callbacks.onBeforeOpen) {
                const result = await this.options.callbacks.onBeforeOpen(this);
                if (result === false) return;
            }

            // Ouvrir
            this.overlay.classList.add('active');
            this.isOpen = true;
            
            // Keyboard events
            if (this.keyboardHandler) {
                document.addEventListener('keydown', this.keyboardHandler);
            }
            
            // Focus management
            if (this.options.features.keyboard) {
                setTimeout(() => {
                    const firstFocusable = this.container.querySelector(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    if (firstFocusable) firstFocusable.focus();
                }, 100);
            }
            
            // Empêcher le scroll du body
            document.body.style.overflow = 'hidden';
            
            // Callback après ouverture
            if (this.options.callbacks.onOpen) {
                const animDuration = CONFIG.animations[this.options.animation]?.duration || 0;
                setTimeout(() => {
                    this.options.callbacks.onOpen(this);
                }, animDuration);
            }
            
            return this;
        }

        async close() {
            // Callback avant fermeture
            if (this.options.callbacks.onBeforeClose) {
                const result = await this.options.callbacks.onBeforeClose(this);
                if (result === false) return;
            }

            // Animations de fermeture
            const animConfig = CONFIG.animations[this.options.animation];
            if (animConfig?.enabled && animConfig.closeAnimation) {
                this.container.style.animation = `${animConfig.closeAnimation} ${animConfig.duration}ms ease-in`;
                
                setTimeout(() => {
                    this.finishClose();
                }, animConfig.duration);
            } else {
                this.finishClose();
            }
            
            return this;
        }

        finishClose() {
            this.overlay.classList.remove('active');
            this.isOpen = false;
            
            // Retirer les event listeners
            if (this.keyboardHandler) {
                document.removeEventListener('keydown', this.keyboardHandler);
            }
            
            // Restaurer le scroll
            document.body.style.overflow = '';
            
            // Callback après fermeture
            if (this.options.callbacks.onClose) {
                this.options.callbacks.onClose(this);
            }
        }

        toggleFullscreen() {
            if (this.isFullscreen) {
                this.exitFullscreen();
            } else {
                this.enterFullscreen();
            }
        }

        enterFullscreen() {
            this.isFullscreen = true;
            this.container.classList.add('modal-fullscreen');
            
            if (this.options.callbacks.onFullscreen) {
                this.options.callbacks.onFullscreen(true, this);
            }
        }

        exitFullscreen() {
            this.isFullscreen = false;
            this.container.classList.remove('modal-fullscreen');
            
            if (this.options.callbacks.onFullscreen) {
                this.options.callbacks.onFullscreen(false, this);
            }
        }

        minimize() {
            this.isMinimized = !this.isMinimized;
            this.container.classList.toggle('modal-minimized');
        }

        // API Publique
        setTitle(title) {
            this.titleElement.textContent = title;
            return this;
        }

        setContent(content) {
            if (typeof content === 'string') {
                this.body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                this.body.innerHTML = '';
                this.body.appendChild(content);
            }
            return this;
        }

        setFooter(footer) {
            if (!this.footer) {
                this.createFooter();
            }
            
            if (typeof footer === 'string') {
                this.footer.innerHTML = footer;
            } else if (footer instanceof HTMLElement) {
                this.footer.innerHTML = '';
                this.footer.appendChild(footer);
            }
            return this;
        }

        updateOptions(options) {
            this.options = this.mergeOptions(this.options, options);
            // Réappliquer les styles si nécessaire
            if (options.style || options.size) {
                const containerStyle = CONFIG.styles[this.options.style]?.container || {};
                const sizeStyle = CONFIG.sizes[this.options.size] || {};
                Object.assign(this.container.style, containerStyle, sizeStyle);
            }
            return this;
        }

        destroy() {
            // Fermer si ouvert
            if (this.isOpen) {
                this.close();
            }
            
            // Nettoyer après animation
            const animDuration = CONFIG.animations[this.options.animation]?.duration || 0;
            setTimeout(() => {
                this.overlay.remove();
            }, animDuration);
        }
    }

    // ========================================
    // MODAL MANAGER
    // ========================================
    class ModalManager {
        constructor() {
            this.modals = new Map();
            this.activeModals = [];
            this.zIndexBase = 1000;
        }

        create(options) {
            const modal = new Modal({
                ...options,
                zIndex: this.zIndexBase + (this.activeModals.length * 10)
            });
            
            this.modals.set(modal.options.id, modal);
            
            // Gérer la pile des modales actives
            const originalOpen = modal.open.bind(modal);
            modal.open = async () => {
                await originalOpen();
                if (!this.activeModals.includes(modal)) {
                    this.activeModals.push(modal);
                }
                return modal;
            };
            
            const originalClose = modal.close.bind(modal);
            modal.close = async () => {
                await originalClose();
                const index = this.activeModals.indexOf(modal);
                if (index > -1) {
                    this.activeModals.splice(index, 1);
                }
                return modal;
            };
            
            return modal;
        }

        get(id) {
            return this.modals.get(id);
        }

        getActive() {
            return this.activeModals[this.activeModals.length - 1];
        }

        closeAll() {
            const promises = this.activeModals.map(modal => modal.close());
            return Promise.all(promises);
        }

        destroyAll() {
            this.modals.forEach(modal => modal.destroy());
            this.modals.clear();
            this.activeModals = [];
        }
    }

    // ========================================
    // HELPERS ET PRESETS
    // ========================================
    const Presets = {
        // Alert simple
        alert: (message, options = {}) => {
            const modal = modalManager.create({
                ...options,
                contentType: 'alert',
                size: 'sm',
                content: `
                    <div style="text-align: center; padding: 20px;">
                        ${options.icon ? `<div style="font-size: 48px; margin-bottom: 20px;">${options.icon}</div>` : ''}
                        <p style="font-size: 16px; margin: 0;">${message}</p>
                    </div>
                `,
                footer: '<button class="modal-btn-primary" onclick="this.closest(\'.modal-overlay\').querySelector(\'.modal-close\').click()">OK</button>',
                features: {
                    ...options.features,
                    closeOnOverlay: false
                }
            });
            
            modal.open();
            return modal;
        },

        // Confirmation
        confirm: (message, options = {}) => {
            return new Promise((resolve) => {
                const modal = modalManager.create({
                    ...options,
                    contentType: 'confirm',
                    size: 'sm',
                    content: `
                        <div style="text-align: center; padding: 20px;">
                            ${options.icon ? `<div style="font-size: 48px; margin-bottom: 20px;">${options.icon}</div>` : ''}
                            <p style="font-size: 16px; margin: 0;">${message}</p>
                        </div>
                    `,
                    features: {
                        ...options.features,
                        closeOnOverlay: false,
                        closeOnEscape: false
                    },
                    callbacks: {
                        ...options.callbacks,
                        onClose: () => resolve(false)
                    }
                });

                // Créer les boutons
                const footer = document.createElement('div');
                footer.style.cssText = 'display: flex; gap: 10px; justify-content: center;';
                
                const btnCancel = document.createElement('button');
                btnCancel.className = 'modal-btn-secondary';
                btnCancel.textContent = options.cancelText || 'Annuler';
                btnCancel.onclick = () => {
                    resolve(false);
                    modal.close();
                };
                
                const btnConfirm = document.createElement('button');
                btnConfirm.className = options.danger ? 'modal-btn-danger' : 'modal-btn-primary';
                btnConfirm.textContent = options.confirmText || 'Confirmer';
                btnConfirm.onclick = () => {
                    resolve(true);
                    modal.close();
                };
                
                footer.appendChild(btnCancel);
                footer.appendChild(btnConfirm);
                
                modal.setFooter(footer);
                modal.open();
            });
        },

        // Prompt
        prompt: (message, options = {}) => {
            return new Promise((resolve) => {
                const inputId = `prompt-input-${Date.now()}`;
                
                const modal = modalManager.create({
                    ...options,
                    size: 'sm',
                    content: `
                        <div style="padding: 20px;">
                            <p style="margin-bottom: 15px;">${message}</p>
                            <input 
                                id="${inputId}" 
                                type="${options.inputType || 'text'}" 
                                class="modal-input" 
                                placeholder="${options.placeholder || ''}"
                                value="${options.defaultValue || ''}"
                                style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.2); 
                                       background: rgba(255,255,255,0.1); border-radius: 8px; color: inherit;"
                            />
                        </div>
                    `,
                    features: {
                        ...options.features,
                        closeOnOverlay: false
                    },
                    callbacks: {
                        ...options.callbacks,
                        onOpen: () => {
                            setTimeout(() => {
                                const input = document.getElementById(inputId);
                                input.focus();
                                input.select();
                            }, 100);
                        },
                        onClose: () => resolve(null)
                    }
                });

                // Créer les boutons
                const footer = document.createElement('div');
                footer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
                
                const btnCancel = document.createElement('button');
                btnCancel.className = 'modal-btn-secondary';
                btnCancel.textContent = 'Annuler';
                btnCancel.onclick = () => {
                    resolve(null);
                    modal.close();
                };
                
                const btnOK = document.createElement('button');
                btnOK.className = 'modal-btn-primary';
                btnOK.textContent = 'OK';
                btnOK.onclick = () => {
                    const input = document.getElementById(inputId);
                    resolve(input.value);
                    modal.close();
                };
                
                footer.appendChild(btnCancel);
                footer.appendChild(btnOK);
                
                modal.setFooter(footer);
                
                // Enter pour valider
                setTimeout(() => {
                    const input = document.getElementById(inputId);
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            btnOK.click();
                        }
                    });
                }, 100);
                
                modal.open();
            });
        },

        // Loading
        loading: (message = 'Chargement...', options = {}) => {
            const modal = modalManager.create({
                ...options,
                size: 'xs',
                content: `
                    <div style="text-align: center; padding: 40px;">
                        <div class="modal-spinner" style="
                            width: 50px; 
                            height: 50px; 
                            border: 3px solid rgba(255,255,255,0.1); 
                            border-top-color: #3b82f6; 
                            border-radius: 50%; 
                            animation: spin 1s linear infinite;
                            margin: 0 auto 20px;
                        "></div>
                        <p style="margin: 0;">${message}</p>
                    </div>
                    <style>
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    </style>
                `,
                features: {
                    closeButton: false,
                    closeOnOverlay: false,
                    closeOnEscape: false,
                    draggable: false,
                    resizable: false
                }
            });
            
            modal.open();
            return modal;
        },

        // Image viewer
        image: (src, options = {}) => {
            const modal = modalManager.create({
                ...options,
                size: 'full',
                contentType: 'media',
                content: `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 20px;">
                        <img src="${src}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                    </div>
                `,
                style: 'glassmorphism-dark'
            });
            
            modal.open();
            return modal;
        },

        // Form modal
        form: (fields, options = {}) => {
            const formId = `form-${Date.now()}`;
            const formHTML = fields.map(field => `
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">
                        ${field.label}
                    </label>
                    <input 
                        name="${field.name}" 
                        type="${field.type || 'text'}" 
                        placeholder="${field.placeholder || ''}"
                        value="${field.value || ''}"
                        ${field.required ? 'required' : ''}
                        style="width: 100%; padding: 10px; border: 1px solid rgba(255,255,255,0.2); 
                               background: rgba(255,255,255,0.1); border-radius: 8px; color: inherit;"
                    />
                </div>
            `).join('');

            const modal = modalManager.create({
                ...options,
                contentType: 'form',
                content: `
                    <form id="${formId}" style="padding: 20px;">
                        ${formHTML}
                    </form>
                `,
                callbacks: {
                    ...options.callbacks,
                    onSubmit: null
                }
            });

            // Créer les boutons
            const footer = document.createElement('div');
            footer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';
            
            const btnCancel = document.createElement('button');
            btnCancel.className = 'modal-btn-secondary';
            btnCancel.textContent = 'Annuler';
            btnCancel.type = 'button';
            btnCancel.onclick = () => modal.close();
            
            const btnSubmit = document.createElement('button');
            btnSubmit.className = 'modal-btn-primary';
            btnSubmit.textContent = options.submitText || 'Valider';
            btnSubmit.type = 'submit';
            
            footer.appendChild(btnCancel);
            footer.appendChild(btnSubmit);
            
            modal.setFooter(footer);

            // Gérer la soumission
            setTimeout(() => {
                const form = document.getElementById(formId);
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    
                    if (options.onSubmit) {
                        options.onSubmit(data, modal);
                    }
                });
            }, 100);

            modal.open();
            return modal;
        }
    };

    // Instance globale
    const modalManager = new ModalManager();

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Créer une modal custom
        create: (options) => modalManager.create(options),
        
        // Presets
        alert: Presets.alert,
        confirm: Presets.confirm,
        prompt: Presets.prompt,
        loading: Presets.loading,
        image: Presets.image,
        form: Presets.form,
        
        // Gestionnaire
        manager: modalManager,
        
        // Configuration
        CONFIG,
        
        // Utilitaires
        injectStyles: () => {
            const modal = new Modal({ autoOpen: false });
            modal.injectStyles();
        }
    };
})();

// Export par défaut
export default Modal;

// Exports nommés pour plus de flexibilité
export const { create, alert, confirm, prompt, loading, image, form, manager, CONFIG } = Modal;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-XX-XX] - Conflit CSS avec styles existants
   Solution: Styles centralisés dans commandes-modal.css
   
   [2024-XX-XX] - Z-index stacking avec plusieurs modales
   Solution: Gestionnaire avec incrémentation automatique
   
   [2024-XX-XX] - Performance avec animations complexes
   Solution: Utilisation de transform et opacity uniquement
   
   NOTES POUR REPRISES FUTURES:
   - Les styles glassmorphism nécessitent backdrop-filter
   - Préfixer -webkit-backdrop-filter pour Safari
   - Focus trap important pour l'accessibilité
   - Les animations riches peuvent impacter les performances
   ======================================== */