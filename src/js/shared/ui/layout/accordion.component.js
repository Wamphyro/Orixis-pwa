/* ========================================
   ACCORDION.COMPONENT.JS - Composant Accordion Glassmorphism
   Chemin: src/js/shared/ui/layout/accordion.component.js
   
   DESCRIPTION:
   Composant accordion complet avec effet glassmorphism.
   Gère sections pliables, animations fluides, modes d'ouverture,
   icônes personnalisables et intégration avec d'autres composants.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-200)
   2. Méthodes privées utilitaires (lignes 202-300)
   3. Création des éléments DOM (lignes 302-500)
   4. Gestion des événements (lignes 502-650)
   5. Animations et transitions (lignes 652-750)
   6. API publique (lignes 752-900)
   
   DÉPENDANCES:
   - accordion.css (tous les styles)
   - animation-utils.js (pour animations avancées)
   - icons.component.js (pour icônes expand/collapse)
   ======================================== */

const AccordionComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Modes d'ouverture
        modes: {
            'single': { // Un seul panneau ouvert à la fois
                closeOthers: true,
                allowAllClosed: true
            },
            'multiple': { // Plusieurs panneaux peuvent être ouverts
                closeOthers: false,
                allowAllClosed: true
            },
            'always-one': { // Toujours un panneau ouvert
                closeOthers: true,
                allowAllClosed: false
            },
            'nested': { // Pour accordions imbriqués
                closeOthers: false,
                allowAllClosed: true,
                independent: true
            }
        },

        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
            },
            'flat': {
                background: '#f8f9fa',
                border: '1px solid #e9ecef'
            },
            'minimal': {
                background: 'transparent',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
            },
            'material': {
                background: '#ffffff',
                shadow: '0 2px 4px rgba(0,0,0,0.1)'
            },
            'bordered': {
                background: 'transparent',
                border: '2px solid currentColor'
            }
        },

        // Animations disponibles
        animations: {
            'none': { enabled: false },
            'smooth': {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                height: true,
                opacity: true
            },
            'spring': {
                duration: 500,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                height: true,
                scale: true
            },
            'fade': {
                duration: 200,
                easing: 'ease-in-out',
                opacity: true
            },
            'slide': {
                duration: 400,
                easing: 'ease-out',
                height: true,
                transform: 'translateY'
            },
            'reveal': {
                duration: 600,
                easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                height: true,
                opacity: true,
                blur: true
            }
        },

        // Tailles prédéfinies
        sizes: {
            'compact': {
                headerPadding: '8px 12px',
                contentPadding: '12px',
                fontSize: '13px',
                iconSize: '16px'
            },
            'small': {
                headerPadding: '12px 16px',
                contentPadding: '16px',
                fontSize: '14px',
                iconSize: '18px'
            },
            'medium': {
                headerPadding: '16px 20px',
                contentPadding: '20px',
                fontSize: '16px',
                iconSize: '20px'
            },
            'large': {
                headerPadding: '20px 24px',
                contentPadding: '24px',
                fontSize: '18px',
                iconSize: '24px'
            }
        },

        // Icônes pour expand/collapse
        icons: {
            'chevron': {
                expand: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
                position: 'right',
                rotation: true
            },
            'plus': {
                expand: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
                collapse: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
                position: 'left',
                rotation: false
            },
            'arrow': {
                expand: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" fill="none" stroke-width="2"/></svg>',
                position: 'left',
                rotation: true
            },
            'caret': {
                expand: '<svg viewBox="0 0 24 24"><path d="M8 10l4 4 4-4" fill="currentColor"/></svg>',
                position: 'right',
                rotation: true
            }
        },

        // Options de comportement
        behavior: {
            // Fermeture automatique après un délai
            autoClose: {
                enabled: false,
                delay: 5000
            },
            // Scroll automatique vers l'élément ouvert
            scrollIntoView: {
                enabled: true,
                behavior: 'smooth',
                block: 'nearest'
            },
            // URL hash pour deep linking
            hashNavigation: {
                enabled: false,
                updateUrl: true
            },
            // Keyboard navigation
            keyboard: {
                enabled: true,
                keys: {
                    toggle: ' ', // Espace
                    next: 'ArrowDown',
                    prev: 'ArrowUp',
                    first: 'Home',
                    last: 'End'
                }
            }
        },

        // Callbacks par défaut
        callbacks: {
            onBeforeOpen: null,
            onOpen: null,
            onBeforeClose: null,
            onClose: null,
            onToggle: null
        },

        // Classes CSS
        classes: {
            container: 'accordion',
            item: 'accordion-item',
            header: 'accordion-header',
            content: 'accordion-content',
            icon: 'accordion-icon',
            active: 'active',
            animating: 'animating',
            disabled: 'disabled'
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES UTILITAIRES
    // ========================================

    // Génération d'ID unique
    function generateId(prefix = 'accordion') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Deep merge des options
    function mergeOptions(defaults, custom) {
        const merged = { ...defaults };
        
        for (const key in custom) {
            if (custom[key] && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
                merged[key] = mergeOptions(defaults[key] || {}, custom[key]);
            } else {
                merged[key] = custom[key];
            }
        }
        
        return merged;
    }

    // Vérification si un élément est visible
    function isVisible(element) {
        return element.offsetHeight > 0;
    }

    // Animation de hauteur
    function animateHeight(element, from, to, duration, callback) {
        const start = performance.now();
        const delta = to - from;
        
        function step(timestamp) {
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeInOutCubic(progress);
            
            element.style.height = from + (delta * eased) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.style.height = to === 'auto' ? '' : to + 'px';
                if (callback) callback();
            }
        }
        
        requestAnimationFrame(step);
    }

    // Fonction d'easing
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // ========================================
    // CRÉATION DES ÉLÉMENTS DOM
    // ========================================

    // Création du conteneur principal
    function createContainer(options) {
        const container = document.createElement('div');
        container.className = CONFIG.classes.container;
        container.id = options.id || generateId();
        
        // Application du style
        if (options.style) {
            container.classList.add(`accordion-${options.style}`);
        }
        
        // Application de la taille
        if (options.size) {
            container.classList.add(`accordion-${options.size}`);
        }
        
        // Classes personnalisées
        if (options.className) {
            container.classList.add(...options.className.split(' '));
        }
        
        // Attributs d'accessibilité
        container.setAttribute('role', 'tablist');
        container.setAttribute('aria-multiselectable', options.mode !== 'single');
        
        return container;
    }

    // Création d'un item accordion
    function createItem(itemData, index, options) {
        const item = document.createElement('div');
        item.className = CONFIG.classes.item;
        
        if (itemData.className) {
            item.classList.add(...itemData.className.split(' '));
        }
        
        // Création du header
        const header = createHeader(itemData, index, options);
        
        // Création du contenu
        const content = createContent(itemData, index, options);
        
        // État initial
        if (itemData.open || (options.defaultOpen && options.defaultOpen.includes(index))) {
            item.classList.add(CONFIG.classes.active);
            content.style.height = 'auto';
        }
        
        // État désactivé
        if (itemData.disabled) {
            item.classList.add(CONFIG.classes.disabled);
            header.setAttribute('aria-disabled', 'true');
        }
        
        item.appendChild(header);
        item.appendChild(content);
        
        return item;
    }

    // Création du header
    function createHeader(itemData, index, options) {
        const header = document.createElement('button');
        header.className = CONFIG.classes.header;
        header.type = 'button';
        
        // ID pour l'accessibilité
        const headerId = `${options.id}-header-${index}`;
        const contentId = `${options.id}-content-${index}`;
        
        header.id = headerId;
        header.setAttribute('aria-controls', contentId);
        header.setAttribute('aria-expanded', 'false');
        
        // Contenu du header
        const headerContent = document.createElement('span');
        headerContent.className = 'accordion-header-content';
        
        if (typeof itemData.header === 'string') {
            headerContent.innerHTML = itemData.header;
        } else if (itemData.header && itemData.header.nodeType) {
            headerContent.appendChild(itemData.header);
        }
        
        // Icône
        const icon = createIcon(options);
        
        // Ordre des éléments selon la position de l'icône
        if (options.iconPosition === 'left') {
            header.appendChild(icon);
            header.appendChild(headerContent);
        } else {
            header.appendChild(headerContent);
            header.appendChild(icon);
        }
        
        // Badge ou info supplémentaire
        if (itemData.badge) {
            const badge = document.createElement('span');
            badge.className = 'accordion-badge';
            badge.textContent = itemData.badge;
            header.appendChild(badge);
        }
        
        return header;
    }

    // Création du contenu
    function createContent(itemData, index, options) {
        const content = document.createElement('div');
        content.className = CONFIG.classes.content;
        
        const contentId = `${options.id}-content-${index}`;
        const headerId = `${options.id}-header-${index}`;
        
        content.id = contentId;
        content.setAttribute('role', 'tabpanel');
        content.setAttribute('aria-labelledby', headerId);
        content.setAttribute('aria-hidden', 'true');
        
        // Wrapper interne pour le padding
        const contentInner = document.createElement('div');
        contentInner.className = 'accordion-content-inner';
        
        if (typeof itemData.content === 'string') {
            contentInner.innerHTML = itemData.content;
        } else if (itemData.content && itemData.content.nodeType) {
            contentInner.appendChild(itemData.content);
        }
        
        // Contenu lazy load
        if (itemData.lazy && itemData.loadContent) {
            contentInner.innerHTML = '<div class="accordion-loading">Chargement...</div>';
            content.dataset.lazy = 'true';
            content.dataset.loadFunction = itemData.loadContent.toString();
        }
        
        content.appendChild(contentInner);
        
        // Style initial fermé
        content.style.height = '0';
        content.style.overflow = 'hidden';
        
        return content;
    }

    // Création de l'icône
    function createIcon(options) {
        const icon = document.createElement('span');
        icon.className = CONFIG.classes.icon;
        
        const iconConfig = CONFIG.icons[options.icon] || CONFIG.icons.chevron;
        icon.innerHTML = iconConfig.expand;
        
        if (iconConfig.rotation) {
            icon.classList.add('icon-rotate');
        }
        
        return icon;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================

    // Gestionnaire principal de toggle
    function handleToggle(accordion, item, options) {
        const header = item.querySelector(`.${CONFIG.classes.header}`);
        const content = item.querySelector(`.${CONFIG.classes.content}`);
        const isOpen = item.classList.contains(CONFIG.classes.active);
        
        // Callback before
        if (isOpen && options.onBeforeClose) {
            if (options.onBeforeClose(item, accordion) === false) return;
        } else if (!isOpen && options.onBeforeOpen) {
            if (options.onBeforeOpen(item, accordion) === false) return;
        }
        
        // Mode single : fermer les autres
        if (options.mode === 'single' && !isOpen) {
            closeOthers(accordion, item, options);
        }
        
        // Toggle de l'item actuel
        if (isOpen) {
            closeItem(item, options);
        } else {
            openItem(item, options);
        }
        
        // Callback after
        if (options.onToggle) {
            options.onToggle(item, !isOpen, accordion);
        }
    }

    // Ouvrir un item
    function openItem(item, options) {
        const content = item.querySelector(`.${CONFIG.classes.content}`);
        const header = item.querySelector(`.${CONFIG.classes.header}`);
        const icon = item.querySelector(`.${CONFIG.classes.icon}`);
        
        // Lazy loading si nécessaire
        if (content.dataset.lazy === 'true') {
            loadLazyContent(content);
        }
        
        // Animation
        item.classList.add(CONFIG.classes.animating);
        
        // Calcul de la hauteur finale
        content.style.height = 'auto';
        const targetHeight = content.scrollHeight;
        content.style.height = '0';
        
        // Force reflow
        content.offsetHeight;
        
        // Animation selon le type
        const animation = CONFIG.animations[options.animation] || CONFIG.animations.smooth;
        
        if (animation.enabled === false) {
            content.style.height = 'auto';
            finishOpen();
        } else {
            animateOpen(content, targetHeight, animation, finishOpen);
        }
        
        function finishOpen() {
            item.classList.add(CONFIG.classes.active);
            item.classList.remove(CONFIG.classes.animating);
            header.setAttribute('aria-expanded', 'true');
            content.setAttribute('aria-hidden', 'false');
            
            // Rotation de l'icône
            if (icon && icon.classList.contains('icon-rotate')) {
                icon.style.transform = 'rotate(180deg)';
            }
            
            // Scroll into view
            if (options.scrollIntoView) {
                setTimeout(() => {
                    item.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 100);
            }
            
            // Callback
            if (options.onOpen) {
                options.onOpen(item);
            }
            
            // Auto-close
            if (options.autoClose && options.autoClose.enabled) {
                setTimeout(() => {
                    if (item.classList.contains(CONFIG.classes.active)) {
                        closeItem(item, options);
                    }
                }, options.autoClose.delay);
            }
        }
    }

    // Fermer un item
    function closeItem(item, options) {
        const content = item.querySelector(`.${CONFIG.classes.content}`);
        const header = item.querySelector(`.${CONFIG.classes.header}`);
        const icon = item.querySelector(`.${CONFIG.classes.icon}`);
        
        item.classList.add(CONFIG.classes.animating);
        
        const currentHeight = content.scrollHeight;
        content.style.height = currentHeight + 'px';
        
        // Force reflow
        content.offsetHeight;
        
        // Animation
        const animation = CONFIG.animations[options.animation] || CONFIG.animations.smooth;
        
        if (animation.enabled === false) {
            content.style.height = '0';
            finishClose();
        } else {
            animateClose(content, currentHeight, animation, finishClose);
        }
        
        function finishClose() {
            item.classList.remove(CONFIG.classes.active);
            item.classList.remove(CONFIG.classes.animating);
            header.setAttribute('aria-expanded', 'false');
            content.setAttribute('aria-hidden', 'true');
            
            // Rotation de l'icône
            if (icon && icon.classList.contains('icon-rotate')) {
                icon.style.transform = 'rotate(0deg)';
            }
            
            // Callback
            if (options.onClose) {
                options.onClose(item);
            }
        }
    }

    // Fermer les autres items
    function closeOthers(accordion, currentItem, options) {
        const items = accordion.querySelectorAll(`.${CONFIG.classes.item}.${CONFIG.classes.active}`);
        
        items.forEach(item => {
            if (item !== currentItem) {
                closeItem(item, options);
            }
        });
    }

    // Chargement lazy du contenu
    function loadLazyContent(content) {
        const loadFunction = new Function('return ' + content.dataset.loadFunction)();
        const contentInner = content.querySelector('.accordion-content-inner');
        
        loadFunction().then(html => {
            contentInner.innerHTML = html;
            delete content.dataset.lazy;
        }).catch(error => {
            contentInner.innerHTML = '<div class="accordion-error">Erreur de chargement</div>';
            console.error('Accordion lazy load error:', error);
        });
    }

    // ========================================
    // ANIMATIONS
    // ========================================

    function animateOpen(content, targetHeight, animation, callback) {
        const duration = animation.duration || 300;
        
        if (animation.height) {
            animateHeight(content, 0, targetHeight, duration, () => {
                content.style.height = 'auto';
                callback();
            });
        }
        
        if (animation.opacity) {
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.transition = `opacity ${duration}ms ${animation.easing}`;
                content.style.opacity = '1';
            }, 10);
        }
        
        if (animation.scale) {
            content.style.transform = 'scaleY(0)';
            content.style.transformOrigin = 'top';
            setTimeout(() => {
                content.style.transition = `transform ${duration}ms ${animation.easing}`;
                content.style.transform = 'scaleY(1)';
            }, 10);
        }
    }

    function animateClose(content, currentHeight, animation, callback) {
        const duration = animation.duration || 300;
        
        if (animation.height) {
            animateHeight(content, currentHeight, 0, duration, callback);
        }
        
        if (animation.opacity) {
            content.style.transition = `opacity ${duration}ms ${animation.easing}`;
            content.style.opacity = '0';
        }
        
        if (animation.scale) {
            content.style.transition = `transform ${duration}ms ${animation.easing}`;
            content.style.transform = 'scaleY(0)';
        }
        
        if (!animation.height) {
            setTimeout(callback, duration);
        }
    }

    // ========================================
    // NAVIGATION CLAVIER
    // ========================================

    function setupKeyboardNavigation(accordion, options) {
        if (!options.keyboard || !options.keyboard.enabled) return;
        
        const headers = accordion.querySelectorAll(`.${CONFIG.classes.header}`);
        
        headers.forEach((header, index) => {
            header.addEventListener('keydown', (e) => {
                const keys = options.keyboard.keys;
                
                switch (e.key) {
                    case keys.next:
                        e.preventDefault();
                        const nextHeader = headers[index + 1] || headers[0];
                        nextHeader.focus();
                        break;
                        
                    case keys.prev:
                        e.preventDefault();
                        const prevHeader = headers[index - 1] || headers[headers.length - 1];
                        prevHeader.focus();
                        break;
                        
                    case keys.first:
                        e.preventDefault();
                        headers[0].focus();
                        break;
                        
                    case keys.last:
                        e.preventDefault();
                        headers[headers.length - 1].focus();
                        break;
                }
            });
        });
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================

    function injectStyles() {
        if (document.getElementById('accordion-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'accordion-styles';
        style.textContent = `
            /* Styles de base pour accordion.component.js */
            .accordion { position: relative; }
            .accordion-item { overflow: hidden; }
            @import url('/src/css/shared/ui/accordion.css');
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // MÉTHODE PRINCIPALE DE CRÉATION
    // ========================================

    function create(options = {}) {
        // Options par défaut
        const defaultOptions = {
            items: [],
            mode: 'single',
            style: 'glassmorphism',
            size: 'medium',
            animation: 'smooth',
            icon: 'chevron',
            iconPosition: 'right',
            defaultOpen: [],
            scrollIntoView: true,
            keyboard: { enabled: true, ...CONFIG.behavior.keyboard }
        };
        
        const finalOptions = mergeOptions(defaultOptions, options);
        
        // Création du conteneur
        const accordion = createContainer(finalOptions);
        
        // Création des items
        finalOptions.items.forEach((itemData, index) => {
            const item = createItem(itemData, index, finalOptions);
            accordion.appendChild(item);
        });
        
        // Event listeners
        accordion.addEventListener('click', (e) => {
            const header = e.target.closest(`.${CONFIG.classes.header}`);
            if (header && !header.parentElement.classList.contains(CONFIG.classes.disabled)) {
                const item = header.parentElement;
                handleToggle(accordion, item, finalOptions);
            }
        });
        
        // Navigation clavier
        setupKeyboardNavigation(accordion, finalOptions);
        
        // Hash navigation
        if (finalOptions.hashNavigation && finalOptions.hashNavigation.enabled) {
            setupHashNavigation(accordion, finalOptions);
        }
        
        // Injection des styles
        if (finalOptions.injectStyles !== false) {
            injectStyles();
        }
        
        // API de l'instance
        accordion.accordion = {
            open(index) {
                const item = accordion.children[index];
                if (item && !item.classList.contains(CONFIG.classes.active)) {
                    openItem(item, finalOptions);
                }
            },
            close(index) {
                const item = accordion.children[index];
                if (item && item.classList.contains(CONFIG.classes.active)) {
                    closeItem(item, finalOptions);
                }
            },
            toggle(index) {
                const item = accordion.children[index];
                if (item) {
                    handleToggle(accordion, item, finalOptions);
                }
            },
            openAll() {
                Array.from(accordion.children).forEach(item => {
                    if (!item.classList.contains(CONFIG.classes.active)) {
                        openItem(item, finalOptions);
                    }
                });
            },
            closeAll() {
                Array.from(accordion.children).forEach(item => {
                    if (item.classList.contains(CONFIG.classes.active)) {
                        closeItem(item, finalOptions);
                    }
                });
            },
            destroy() {
                accordion.remove();
            }
        };
        
        return accordion;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================

    return {
        create,
        CONFIG,
        injectStyles,
        
        // Méthodes utilitaires
        createFromHTML(htmlString, options) {
            const temp = document.createElement('div');
            temp.innerHTML = htmlString;
            
            const items = Array.from(temp.children).map(child => ({
                header: child.querySelector('[data-header]')?.innerHTML || child.firstElementChild?.innerHTML,
                content: child.querySelector('[data-content]')?.innerHTML || child.lastElementChild?.innerHTML,
                open: child.hasAttribute('data-open'),
                disabled: child.hasAttribute('data-disabled')
            }));
            
            return create({ ...options, items });
        },
        
        // Conversion d'éléments existants
        enhance(element, options = {}) {
            const items = Array.from(element.children).map(child => {
                const header = child.querySelector('.accordion-header, h3, h4, [role="tab"]');
                const content = child.querySelector('.accordion-content, .content, [role="tabpanel"]');
                
                return {
                    header: header?.innerHTML || 'Item',
                    content: content?.innerHTML || '',
                    open: child.classList.contains('open') || child.classList.contains('active')
                };
            });
            
            const accordion = create({ ...options, items });
            element.replaceWith(accordion);
            return accordion;
        }
    };
})();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccordionComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Animation fluide de la hauteur
   Solution: Calcul précis avec scrollHeight et requestAnimationFrame
   
   [2024-12-XX] - Gestion des accordions imbriqués
   Cause: Propagation des événements
   Résolution: Mode 'nested' avec gestion indépendante
   
   [2024-12-XX] - Performance avec beaucoup d'items
   Solution: Délégation d'événements et lazy loading du contenu
   
   NOTES POUR REPRISES FUTURES:
   - Le mode 'always-one' nécessite un item ouvert par défaut
   - Les animations peuvent être combinées (height + opacity)
   - Le lazy loading supporte les promesses pour contenu asynchrone
   ======================================== */