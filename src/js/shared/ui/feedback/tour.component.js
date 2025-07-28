/* ========================================
   TOUR.COMPONENT.JS - Système de tours guidés interactifs
   Chemin: src/js/shared/ui/feedback/tour.component.js
   
   DESCRIPTION:
   Composant complet pour créer des tours guidés, tutoriels et onboarding.
   Supporte plusieurs modes d'affichage, animations riches, et personnalisation complète.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 30-200)
   2. Gestionnaire principal (lignes 202-400)
   3. Création et rendu (lignes 402-800)
   4. Navigation et contrôles (lignes 802-1000)
   5. Animations et effets (lignes 1002-1200)
   6. Gestion du focus et accessibilité (lignes 1202-1400)
   7. Stockage et progression (lignes 1402-1600)
   8. API publique et exports (lignes 1602-1700)
   
   DÉPENDANCES:
   - tour.css (tous les styles)
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   ======================================== */

const Tour = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                backdrop: 'blur(20px) brightness(0.4)',
                popover: {
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    shadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }
            },
            'material': {
                backdrop: 'rgba(0, 0, 0, 0.5)',
                popover: {
                    background: '#ffffff',
                    shadow: '0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14)'
                }
            },
            'minimal': {
                backdrop: 'rgba(0, 0, 0, 0.3)',
                popover: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb'
                }
            },
            'neumorphism': {
                backdrop: 'rgba(0, 0, 0, 0.1)',
                popover: {
                    background: '#e0e5ec',
                    shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
                }
            },
            'flat': {
                backdrop: 'rgba(0, 0, 0, 0.4)',
                popover: {
                    background: '#ffffff',
                    border: '1px solid #d1d5db'
                }
            }
        },

        // Modes d'affichage
        modes: {
            'tooltip': {
                arrow: true,
                backdrop: false,
                closeOnClickOutside: true,
                positioning: 'auto'
            },
            'modal': {
                arrow: false,
                backdrop: true,
                closeOnClickOutside: false,
                positioning: 'center'
            },
            'spotlight': {
                arrow: true,
                backdrop: true,
                closeOnClickOutside: false,
                positioning: 'auto',
                highlight: true
            },
            'walkthrough': {
                arrow: true,
                backdrop: true,
                closeOnClickOutside: false,
                positioning: 'auto',
                highlight: true,
                scrollIntoView: true
            }
        },

        // Positions possibles
        positions: ['top', 'bottom', 'left', 'right', 'center'],
        
        // Animations
        animations: {
            'none': { enabled: false },
            'fade': { 
                enter: 'fadeIn 0.3s ease-out',
                exit: 'fadeOut 0.3s ease-in'
            },
            'slide': {
                enter: 'slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                exit: 'slideOut 0.3s ease-in'
            },
            'bounce': {
                enter: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                exit: 'bounceOut 0.3s ease-in'
            },
            'zoom': {
                enter: 'zoomIn 0.3s ease-out',
                exit: 'zoomOut 0.3s ease-in'
            },
            'flip': {
                enter: 'flipIn 0.6s ease-out',
                exit: 'flipOut 0.3s ease-in'
            }
        },

        // Effets de mise en évidence
        highlightEffects: {
            'none': null,
            'pulse': 'pulse 2s ease-in-out infinite',
            'glow': 'glow 2s ease-in-out infinite',
            'border': 'border-highlight 1s ease-in-out',
            'fill': 'fill-highlight 0.5s ease-out'
        },

        // Configuration par défaut
        defaults: {
            style: 'glassmorphism',
            mode: 'walkthrough',
            animation: 'slide',
            position: 'auto',
            showProgress: true,
            showNavigation: true,
            showClose: true,
            keyboard: true,
            scrollPadding: 100,
            backdropOpacity: 0.5,
            zIndex: 10000,
            storage: true,
            storageKey: 'tour-progress',
            autoStart: false,
            startDelay: 500,
            stepDelay: 300,
            locale: 'fr'
        },

        // Textes localisés
        i18n: {
            'fr': {
                next: 'Suivant',
                prev: 'Précédent',
                skip: 'Passer',
                finish: 'Terminer',
                close: 'Fermer',
                stepOf: 'Étape {current} sur {total}'
            },
            'en': {
                next: 'Next',
                prev: 'Previous',
                skip: 'Skip',
                finish: 'Finish',
                close: 'Close',
                stepOf: 'Step {current} of {total}'
            }
        }
    };

    // ========================================
    // GESTIONNAIRE PRINCIPAL
    // ========================================
    class TourManager {
        constructor() {
            this.tours = new Map();
            this.activeTour = null;
            this.styleElement = null;
            this.initialized = false;
        }

        async init() {
            if (this.initialized) return;
            
            await this.injectStyles();
            this.setupGlobalListeners();
            this.initialized = true;
        }

        async injectStyles() {
            if (document.getElementById('tour-styles')) return;

            const link = document.createElement('link');
            link.id = 'tour-styles';
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/tour.css';
            
            document.head.appendChild(link);
            
            return new Promise(resolve => {
                link.onload = resolve;
                link.onerror = () => {
                    console.warn('Failed to load tour.css');
                    resolve();
                };
            });
        }

        setupGlobalListeners() {
            // Gestion du redimensionnement
            window.addEventListener('resize', () => {
                if (this.activeTour) {
                    this.activeTour.reposition();
                }
            });

            // Gestion du scroll
            window.addEventListener('scroll', () => {
                if (this.activeTour && this.activeTour.options.mode !== 'modal') {
                    this.activeTour.reposition();
                }
            }, { passive: true });
        }

        register(id, tour) {
            this.tours.set(id, tour);
        }

        unregister(id) {
            const tour = this.tours.get(id);
            if (tour && tour === this.activeTour) {
                tour.end();
            }
            this.tours.delete(id);
        }

        setActive(tour) {
            if (this.activeTour && this.activeTour !== tour) {
                this.activeTour.pause();
            }
            this.activeTour = tour;
        }

        clearActive(tour) {
            if (this.activeTour === tour) {
                this.activeTour = null;
            }
        }
    }

    const manager = new TourManager();

    // ========================================
    // CLASSE TOUR
    // ========================================
    class TourInstance {
        constructor(options) {
            this.id = options.id || `tour-${Date.now()}`;
            this.options = { ...CONFIG.defaults, ...options };
            this.steps = this.normalizeSteps(options.steps || []);
            this.currentStep = 0;
            this.state = 'idle';
            this.elements = {};
            this.callbacks = {
                onStart: options.onStart || (() => {}),
                onComplete: options.onComplete || (() => {}),
                onSkip: options.onSkip || (() => {}),
                onStepChange: options.onStepChange || (() => {}),
                onClose: options.onClose || (() => {})
            };

            manager.register(this.id, this);
        }

        normalizeSteps(steps) {
            return steps.map((step, index) => ({
                id: step.id || `step-${index}`,
                target: step.target || null,
                title: step.title || '',
                content: step.content || '',
                position: step.position || this.options.position,
                highlight: step.highlight !== undefined ? step.highlight : true,
                buttons: step.buttons || this.getDefaultButtons(index, steps.length),
                beforeShow: step.beforeShow || (() => {}),
                afterShow: step.afterShow || (() => {}),
                canAdvance: step.canAdvance || (() => true),
                ...step
            }));
        }

        getDefaultButtons(index, total) {
            const buttons = [];
            const i18n = CONFIG.i18n[this.options.locale];

            if (index > 0) {
                buttons.push({
                    text: i18n.prev,
                    action: 'prev',
                    class: 'tour-btn-secondary'
                });
            }

            if (index < total - 1) {
                buttons.push({
                    text: i18n.next,
                    action: 'next',
                    class: 'tour-btn-primary'
                });
            } else {
                buttons.push({
                    text: i18n.finish,
                    action: 'complete',
                    class: 'tour-btn-primary'
                });
            }

            if (this.options.showSkip && index < total - 1) {
                buttons.push({
                    text: i18n.skip,
                    action: 'skip',
                    class: 'tour-btn-text'
                });
            }

            return buttons;
        }

        // ========================================
        // CRÉATION ET RENDU
        // ========================================
        async start(stepIndex = 0) {
            if (this.state !== 'idle') return;

            await manager.init();
            
            this.state = 'starting';
            this.currentStep = stepIndex;
            
            manager.setActive(this);
            
            if (this.options.storage) {
                this.loadProgress();
            }

            this.createElements();
            
            await this.callbacks.onStart(this);
            
            if (this.options.autoStart) {
                setTimeout(() => this.showStep(this.currentStep), this.options.startDelay);
            } else {
                this.showStep(this.currentStep);
            }

            this.state = 'active';
        }

        createElements() {
            // Conteneur principal
            this.elements.container = this.createElement('div', {
                className: `tour-container tour-${this.options.style} tour-${this.options.mode}`,
                'aria-label': 'Tour guidé',
                role: 'dialog'
            });

            // Backdrop
            if (this.options.mode !== 'tooltip') {
                this.elements.backdrop = this.createElement('div', {
                    className: 'tour-backdrop'
                });
                this.elements.container.appendChild(this.elements.backdrop);

                if (this.options.closeOnClickOutside) {
                    this.elements.backdrop.addEventListener('click', () => this.end());
                }
            }

            // Highlight
            this.elements.highlight = this.createElement('div', {
                className: 'tour-highlight'
            });
            this.elements.container.appendChild(this.elements.highlight);

            // Popover
            this.elements.popover = this.createPopover();
            this.elements.container.appendChild(this.elements.popover);

            document.body.appendChild(this.elements.container);
        }

        createPopover() {
            const popover = this.createElement('div', {
                className: 'tour-popover',
                role: 'tooltip'
            });

            // Flèche
            if (CONFIG.modes[this.options.mode].arrow) {
                this.elements.arrow = this.createElement('div', {
                    className: 'tour-arrow'
                });
                popover.appendChild(this.elements.arrow);
            }

            // Header
            const header = this.createElement('div', {
                className: 'tour-header'
            });

            // Progress
            if (this.options.showProgress) {
                this.elements.progress = this.createElement('div', {
                    className: 'tour-progress'
                });
                header.appendChild(this.elements.progress);
            }

            // Close button
            if (this.options.showClose) {
                const closeBtn = this.createElement('button', {
                    className: 'tour-close',
                    'aria-label': 'Fermer le tour',
                    innerHTML: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
                });
                closeBtn.addEventListener('click', () => this.end());
                header.appendChild(closeBtn);
            }

            popover.appendChild(header);

            // Content
            const content = this.createElement('div', {
                className: 'tour-content'
            });

            this.elements.title = this.createElement('h3', {
                className: 'tour-title'
            });
            content.appendChild(this.elements.title);

            this.elements.description = this.createElement('div', {
                className: 'tour-description'
            });
            content.appendChild(this.elements.description);

            popover.appendChild(content);

            // Footer avec navigation
            if (this.options.showNavigation) {
                this.elements.footer = this.createElement('div', {
                    className: 'tour-footer'
                });
                popover.appendChild(this.elements.footer);
            }

            return popover;
        }

        createElement(tag, props = {}) {
            const element = document.createElement(tag);
            Object.entries(props).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            return element;
        }

        // ========================================
        // AFFICHAGE DES ÉTAPES
        // ========================================
        async showStep(index) {
            if (index < 0 || index >= this.steps.length) return;

            const step = this.steps[index];
            const previousStep = this.steps[this.currentStep];

            // Animation de sortie
            if (this.currentStep !== index && this.state === 'active') {
                await this.animateOut();
            }

            this.currentStep = index;

            // Callback avant affichage
            await step.beforeShow(step, this);

            // Mise à jour du contenu
            this.updateContent(step);

            // Positionnement et highlight
            if (step.target) {
                const targetElement = typeof step.target === 'string' 
                    ? document.querySelector(step.target) 
                    : step.target;

                if (targetElement) {
                    this.highlightElement(targetElement, step);
                    await this.positionPopover(targetElement, step.position);
                    
                    if (this.options.scrollIntoView) {
                        this.scrollToElement(targetElement);
                    }
                } else {
                    console.warn(`Target not found for step ${step.id}`);
                    this.positionPopover(null, 'center');
                }
            } else {
                this.hideHighlight();
                this.positionPopover(null, 'center');
            }

            // Animation d'entrée
            await this.animateIn();

            // Callback après affichage
            await step.afterShow(step, this);
            await this.callbacks.onStepChange(step, index, this);

            // Sauvegarde progression
            if (this.options.storage) {
                this.saveProgress();
            }

            // Focus management
            this.manageFocus();
        }

        updateContent(step) {
            // Titre
            if (this.elements.title) {
                this.elements.title.textContent = step.title;
            }

            // Description
            if (this.elements.description) {
                if (typeof step.content === 'string') {
                    this.elements.description.innerHTML = step.content;
                } else if (step.content instanceof HTMLElement) {
                    this.elements.description.innerHTML = '';
                    this.elements.description.appendChild(step.content);
                }
            }

            // Progress
            if (this.elements.progress) {
                const i18n = CONFIG.i18n[this.options.locale];
                const progressText = i18n.stepOf
                    .replace('{current}', this.currentStep + 1)
                    .replace('{total}', this.steps.length);
                
                this.elements.progress.innerHTML = `
                    <span class="tour-progress-text">${progressText}</span>
                    <div class="tour-progress-bar">
                        <div class="tour-progress-fill" style="width: ${((this.currentStep + 1) / this.steps.length) * 100}%"></div>
                    </div>
                `;
            }

            // Boutons
            if (this.elements.footer) {
                this.elements.footer.innerHTML = '';
                step.buttons.forEach(btn => {
                    const button = this.createElement('button', {
                        className: `tour-btn ${btn.class || ''}`,
                        innerHTML: btn.text
                    });

                    button.addEventListener('click', () => this.handleButtonClick(btn.action));
                    this.elements.footer.appendChild(button);
                });
            }
        }

        // ========================================
        // POSITIONNEMENT
        // ========================================
        async positionPopover(target, preferredPosition) {
            const popover = this.elements.popover;
            if (!popover) return;

            if (!target || preferredPosition === 'center') {
                // Position centrale
                popover.style.position = 'fixed';
                popover.style.top = '50%';
                popover.style.left = '50%';
                popover.style.transform = 'translate(-50%, -50%)';
                
                if (this.elements.arrow) {
                    this.elements.arrow.style.display = 'none';
                }
                return;
            }

            const rect = target.getBoundingClientRect();
            const popoverRect = popover.getBoundingClientRect();
            const arrow = this.elements.arrow;
            
            // Calcul de la meilleure position
            const position = preferredPosition === 'auto' 
                ? this.calculateBestPosition(rect, popoverRect) 
                : preferredPosition;

            // Reset styles
            popover.style.position = 'fixed';
            popover.style.transform = '';
            
            // Calcul des positions selon la direction
            const gap = 10;
            const positions = {
                top: {
                    top: rect.top - popoverRect.height - gap,
                    left: rect.left + (rect.width - popoverRect.width) / 2
                },
                bottom: {
                    top: rect.bottom + gap,
                    left: rect.left + (rect.width - popoverRect.width) / 2
                },
                left: {
                    top: rect.top + (rect.height - popoverRect.height) / 2,
                    left: rect.left - popoverRect.width - gap
                },
                right: {
                    top: rect.top + (rect.height - popoverRect.height) / 2,
                    left: rect.right + gap
                }
            };

            const pos = positions[position];
            
            // Ajustements pour rester dans le viewport
            const margin = 20;
            pos.top = Math.max(margin, Math.min(pos.top, window.innerHeight - popoverRect.height - margin));
            pos.left = Math.max(margin, Math.min(pos.left, window.innerWidth - popoverRect.width - margin));

            popover.style.top = `${pos.top}px`;
            popover.style.left = `${pos.left}px`;

            // Position de la flèche
            if (arrow) {
                arrow.style.display = 'block';
                arrow.className = `tour-arrow tour-arrow-${position}`;
                
                // Ajustement de la position de la flèche
                if (position === 'top' || position === 'bottom') {
                    const arrowLeft = rect.left + rect.width / 2 - pos.left;
                    arrow.style.left = `${arrowLeft}px`;
                    arrow.style.top = '';
                } else {
                    const arrowTop = rect.top + rect.height / 2 - pos.top;
                    arrow.style.top = `${arrowTop}px`;
                    arrow.style.left = '';
                }
            }

            popover.setAttribute('data-position', position);
        }

        calculateBestPosition(targetRect, popoverRect) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const spaceAbove = targetRect.top;
            const spaceBelow = viewportHeight - targetRect.bottom;
            const spaceLeft = targetRect.left;
            const spaceRight = viewportWidth - targetRect.right;

            // Vérifier où il y a le plus d'espace
            const spaces = {
                top: spaceAbove,
                bottom: spaceBelow,
                left: spaceLeft,
                right: spaceRight
            };

            // Filtrer les positions où le popover peut tenir
            const viablePositions = Object.entries(spaces).filter(([position, space]) => {
                if (position === 'top' || position === 'bottom') {
                    return space >= popoverRect.height + 20;
                } else {
                    return space >= popoverRect.width + 20;
                }
            });

            // Si aucune position viable, utiliser celle avec le plus d'espace
            if (viablePositions.length === 0) {
                return Object.entries(spaces).sort((a, b) => b[1] - a[1])[0][0];
            }

            // Préférer bottom > right > top > left
            const preferenceOrder = ['bottom', 'right', 'top', 'left'];
            for (const pref of preferenceOrder) {
                if (viablePositions.find(([pos]) => pos === pref)) {
                    return pref;
                }
            }

            return viablePositions[0][0];
        }

        // ========================================
        // HIGHLIGHT
        // ========================================
        highlightElement(element, step) {
            const highlight = this.elements.highlight;
            if (!highlight) return;

            const rect = element.getBoundingClientRect();
            const padding = 5;

            highlight.style.position = 'fixed';
            highlight.style.display = 'block';
            highlight.style.top = `${rect.top - padding}px`;
            highlight.style.left = `${rect.left - padding}px`;
            highlight.style.width = `${rect.width + padding * 2}px`;
            highlight.style.height = `${rect.height + padding * 2}px`;

            // Effet de highlight
            const effect = step.highlightEffect || 'pulse';
            highlight.className = `tour-highlight tour-highlight-${effect}`;

            // Mise à jour du masque du backdrop si mode spotlight
            if (this.options.mode === 'spotlight' || this.options.mode === 'walkthrough') {
                this.updateBackdropMask(rect, padding);
            }
        }

        hideHighlight() {
            if (this.elements.highlight) {
                this.elements.highlight.style.display = 'none';
            }
            if (this.elements.backdrop) {
                this.elements.backdrop.style.clipPath = '';
            }
        }

        updateBackdropMask(rect, padding = 5) {
            if (!this.elements.backdrop) return;

            // Créer un path pour le clip-path qui exclut la zone highlight
            const top = rect.top - padding;
            const left = rect.left - padding;
            const right = rect.right + padding;
            const bottom = rect.bottom + padding;

            const clipPath = `polygon(
                0 0,
                100% 0,
                100% 100%,
                0 100%,
                0 0,
                ${left}px ${top}px,
                ${left}px ${bottom}px,
                ${right}px ${bottom}px,
                ${right}px ${top}px,
                ${left}px ${top}px
            )`;

            this.elements.backdrop.style.clipPath = clipPath;
        }

        // ========================================
        // ANIMATIONS
        // ========================================
        async animateIn() {
            const animation = CONFIG.animations[this.options.animation];
            if (!animation.enabled === false) return;

            this.elements.popover.style.animation = animation.enter;
            
            if (this.elements.highlight) {
                this.elements.highlight.style.animation = `${animation.enter}, ${CONFIG.highlightEffects[this.options.highlightEffect || 'pulse']}`;
            }

            return new Promise(resolve => {
                setTimeout(resolve, parseFloat(animation.enter.split(' ')[1]) * 1000);
            });
        }

        async animateOut() {
            const animation = CONFIG.animations[this.options.animation];
            if (!animation.enabled === false) return;

            this.elements.popover.style.animation = animation.exit;

            return new Promise(resolve => {
                setTimeout(resolve, parseFloat(animation.exit.split(' ')[1]) * 1000);
            });
        }

        // ========================================
        // NAVIGATION
        // ========================================
        async next() {
            const currentStep = this.steps[this.currentStep];
            
            if (!await currentStep.canAdvance()) {
                return;
            }

            if (this.currentStep < this.steps.length - 1) {
                await this.showStep(this.currentStep + 1);
            } else {
                await this.complete();
            }
        }

        async prev() {
            if (this.currentStep > 0) {
                await this.showStep(this.currentStep - 1);
            }
        }

        async goToStep(index) {
            if (index >= 0 && index < this.steps.length) {
                await this.showStep(index);
            }
        }

        async skip() {
            await this.callbacks.onSkip(this);
            await this.end();
        }

        async complete() {
            await this.callbacks.onComplete(this);
            await this.end();
        }

        async end() {
            if (this.state === 'ending' || this.state === 'idle') return;

            this.state = 'ending';

            await this.animateOut();
            
            if (this.elements.container) {
                this.elements.container.remove();
            }

            this.clearProgress();
            manager.clearActive(this);
            
            await this.callbacks.onClose(this);
            
            this.state = 'idle';
        }

        pause() {
            if (this.state === 'active') {
                this.state = 'paused';
                if (this.elements.container) {
                    this.elements.container.style.display = 'none';
                }
            }
        }

        resume() {
            if (this.state === 'paused') {
                this.state = 'active';
                if (this.elements.container) {
                    this.elements.container.style.display = '';
                    this.reposition();
                }
            }
        }

        // ========================================
        // GESTION DU CLAVIER
        // ========================================
        handleKeyboard(event) {
            if (!this.options.keyboard || this.state !== 'active') return;

            switch (event.key) {
                case 'Escape':
                    this.end();
                    break;
                case 'ArrowRight':
                case 'Enter':
                    this.next();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
            }
        }

        handleButtonClick(action) {
            switch (action) {
                case 'next':
                    this.next();
                    break;
                case 'prev':
                    this.prev();
                    break;
                case 'skip':
                    this.skip();
                    break;
                case 'complete':
                    this.complete();
                    break;
                case 'close':
                    this.end();
                    break;
                default:
                    if (typeof action === 'function') {
                        action(this);
                    }
            }
        }

        // ========================================
        // FOCUS MANAGEMENT
        // ========================================
        manageFocus() {
            // Trap focus dans le popover
            const focusableElements = this.elements.popover.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }

            // Gérer le focus trap
            this.elements.popover.addEventListener('keydown', (e) => {
                if (e.key !== 'Tab') return;

                const firstFocusable = focusableElements[0];
                const lastFocusable = focusableElements[focusableElements.length - 1];

                if (e.shiftKey && document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            });
        }

        // ========================================
        // UTILITAIRES
        // ========================================
        reposition() {
            const step = this.steps[this.currentStep];
            if (step && step.target) {
                const targetElement = typeof step.target === 'string' 
                    ? document.querySelector(step.target) 
                    : step.target;
                    
                if (targetElement) {
                    this.highlightElement(targetElement, step);
                    this.positionPopover(targetElement, step.position);
                }
            }
        }

        scrollToElement(element) {
            const rect = element.getBoundingClientRect();
            const isInViewport = rect.top >= 0 && 
                rect.bottom <= window.innerHeight &&
                rect.left >= 0 && 
                rect.right <= window.innerWidth;

            if (!isInViewport) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });
            }
        }

        // ========================================
        // STOCKAGE
        // ========================================
        loadProgress() {
            if (!this.options.storage) return;

            try {
                const stored = localStorage.getItem(this.options.storageKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data[this.id]) {
                        this.currentStep = data[this.id].step || 0;
                    }
                }
            } catch (e) {
                console.warn('Failed to load tour progress:', e);
            }
        }

        saveProgress() {
            if (!this.options.storage) return;

            try {
                const stored = localStorage.getItem(this.options.storageKey) || '{}';
                const data = JSON.parse(stored);
                
                data[this.id] = {
                    step: this.currentStep,
                    completed: this.currentStep === this.steps.length - 1,
                    timestamp: Date.now()
                };

                localStorage.setItem(this.options.storageKey, JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to save tour progress:', e);
            }
        }

        clearProgress() {
            if (!this.options.storage) return;

            try {
                const stored = localStorage.getItem(this.options.storageKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    delete data[this.id];
                    localStorage.setItem(this.options.storageKey, JSON.stringify(data));
                }
            } catch (e) {
                console.warn('Failed to clear tour progress:', e);
            }
        }

        // ========================================
        // DESTRUCTION
        // ========================================
        destroy() {
            this.end();
            manager.unregister(this.id);
            
            // Nettoyer les références
            this.elements = {};
            this.callbacks = {};
            this.steps = [];
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create: async (options) => {
            const tour = new TourInstance(options);
            if (options.autoStart) {
                await tour.start();
            }
            return tour;
        },

        // Créer et démarrer immédiatement
        start: async (options) => {
            const tour = new TourInstance(options);
            await tour.start();
            return tour;
        },

        // Récupérer un tour existant
        get: (id) => {
            return manager.tours.get(id);
        },

        // Détruire un tour
        destroy: (id) => {
            const tour = manager.tours.get(id);
            if (tour) {
                tour.destroy();
            }
        },

        // Détruire tous les tours
        destroyAll: () => {
            manager.tours.forEach(tour => tour.destroy());
        },

        // Configuration globale
        configure: (config) => {
            Object.assign(CONFIG.defaults, config);
        },

        // Ajouter des traductions
        addLocale: (locale, translations) => {
            CONFIG.i18n[locale] = translations;
        },

        // Exposer la configuration pour référence
        CONFIG,

        // Tours prédéfinis
        presets: {
            // Tour d'onboarding simple
            onboarding: (steps) => ({
                mode: 'walkthrough',
                style: 'glassmorphism',
                animation: 'slide',
                showProgress: true,
                showNavigation: true,
                storage: true,
                steps
            }),

            // Tooltip d'aide contextuelle
            help: (target, content) => ({
                mode: 'tooltip',
                style: 'minimal',
                animation: 'fade',
                showProgress: false,
                showNavigation: false,
                closeOnClickOutside: true,
                steps: [{
                    target,
                    content
                }]
            }),

            // Showcase de fonctionnalités
            showcase: (steps) => ({
                mode: 'spotlight',
                style: 'glassmorphism',
                animation: 'bounce',
                highlightEffect: 'glow',
                showProgress: true,
                steps
            })
        }
    };
})();

// Export pour utilisation
export default Tour;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Gestion du z-index avec modales
   Solution: Z-index dynamique et gestion des couches
   
   [2024-02] - Performance avec animations complexes
   Solution: Utilisation de transform et will-change
   
   [2024-03] - Repositionnement lors du scroll
   Solution: Throttling et optimisation des calculs
   
   NOTES POUR REPRISES FUTURES:
   - Le tour doit toujours être au-dessus des autres éléments
   - Attention aux conflits avec d'autres overlays
   - Tester sur mobile pour le touch et le scroll
   - Vérifier la compatibilité avec les SPA
   ======================================== */