/* ========================================
   TOOLTIP.COMPONENT.JS - Composant Tooltip glassmorphism
   Chemin: src/js/shared/ui/elements/tooltip.component.js
   
   DESCRIPTION:
   Composant tooltip complet avec effet glassmorphism et toutes les options possibles.
   Gère le positionnement automatique, les animations, et les interactions.
   
   STRUCTURE:
   1. Configuration complète (lignes 30-150)
   2. Gestion du pool de tooltips (lignes 152-200)
   3. Création et initialisation (lignes 202-350)
   4. Positionnement automatique (lignes 352-500)
   5. Gestion des événements (lignes 502-650)
   6. API publique (lignes 652-700)
   
   DÉPENDANCES:
   - tooltip.css (styles glassmorphism et animations)
   - Aucune dépendance externe
   ======================================== */

const Tooltip = (() => {
    'use strict';
    
    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                className: 'glassmorphism',
                backdrop: true,
                blur: 20,
                opacity: 0.08
            },
            'neumorphism': {
                className: 'neumorphism',
                backdrop: false,
                shadow: 'complex'
            },
            'flat': {
                className: 'flat',
                backdrop: false,
                minimal: true
            },
            'minimal': {
                className: 'minimal',
                backdrop: false,
                border: 'left'
            },
            'material': {
                className: 'material',
                backdrop: false,
                elevation: true
            },
            'gradient': {
                className: 'gradient',
                backdrop: true,
                blur: 15
            }
        },
        
        // Positions
        positions: {
            'top': { main: 'top', fallbacks: ['bottom', 'right', 'left'] },
            'bottom': { main: 'bottom', fallbacks: ['top', 'right', 'left'] },
            'left': { main: 'left', fallbacks: ['right', 'top', 'bottom'] },
            'right': { main: 'right', fallbacks: ['left', 'top', 'bottom'] },
            'top-start': { main: 'top-start', fallbacks: ['top-end', 'bottom-start'] },
            'top-end': { main: 'top-end', fallbacks: ['top-start', 'bottom-end'] },
            'bottom-start': { main: 'bottom-start', fallbacks: ['bottom-end', 'top-start'] },
            'bottom-end': { main: 'bottom-end', fallbacks: ['bottom-start', 'top-end'] },
            'left-start': { main: 'left-start', fallbacks: ['left-end', 'right-start'] },
            'left-end': { main: 'left-end', fallbacks: ['left-start', 'right-end'] },
            'right-start': { main: 'right-start', fallbacks: ['right-end', 'left-start'] },
            'right-end': { main: 'right-end', fallbacks: ['right-start', 'left-end'] },
            'auto': { main: 'auto', fallbacks: [] }
        },
        
        // Animations
        animations: {
            'none': { in: null, out: null },
            'fade': { in: 'fadeIn', out: 'fadeOut', duration: 200 },
            'scale': { in: 'scaleIn', out: 'scaleOut', duration: 250 },
            'slide': { in: 'slideIn', out: 'slideOut', duration: 300 },
            'bounce': { in: 'bounceIn', out: 'bounceOut', duration: 400 },
            'rotate': { in: 'rotateIn', out: 'rotateOut', duration: 350 },
            'zoom': { in: 'zoomIn', out: 'zoomOut', duration: 300 }
        },
        
        // Déclencheurs
        triggers: {
            'hover': { events: ['mouseenter', 'mouseleave'], touch: false },
            'click': { events: ['click'], touch: true },
            'focus': { events: ['focus', 'blur'], touch: false },
            'manual': { events: [], touch: false },
            'hover-click': { events: ['mouseenter', 'mouseleave', 'click'], touch: true }
        },
        
        // Tailles
        sizes: {
            'small': { padding: '4px 8px', fontSize: '12px', maxWidth: '200px' },
            'medium': { padding: '8px 12px', fontSize: '14px', maxWidth: '300px' },
            'large': { padding: '12px 16px', fontSize: '16px', maxWidth: '400px' },
            'auto': { padding: '8px 12px', fontSize: '14px', maxWidth: 'none' }
        },
        
        // Délais
        delays: {
            show: 0,
            hide: 0,
            hover: 500
        },
        
        // Options avancées
        advanced: {
            interactive: false,
            followCursor: false,
            hideOnClick: true,
            hideOnScroll: false,
            hideOnResize: true,
            allowHTML: false,
            zIndex: 9999,
            offset: 8,
            boundary: 'viewport',
            flipBehavior: 'auto',
            preventOverflow: true,
            arrow: true,
            arrowSize: 8
        }
    };
    
    // ========================================
    // POOL DE TOOLTIPS
    // ========================================
    const tooltipPool = [];
    const activeTooltips = new Map();
    let tooltipIdCounter = 0;
    
    function getTooltipFromPool() {
        let tooltip = tooltipPool.pop();
        if (!tooltip) {
            tooltip = createTooltipElement();
        }
        return tooltip;
    }
    
    function returnTooltipToPool(tooltip) {
        tooltip.className = 'tooltip';
        tooltip.innerHTML = '';
        tooltip.removeAttribute('style');
        tooltip.removeAttribute('data-position');
        tooltip.removeAttribute('data-animation');
        tooltipPool.push(tooltip);
    }
    
    // ========================================
    // CRÉATION DES ÉLÉMENTS
    // ========================================
    function createTooltipElement() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('aria-hidden', 'true');
        
        const content = document.createElement('div');
        content.className = 'tooltip-content';
        
        const arrow = document.createElement('div');
        arrow.className = 'tooltip-arrow';
        
        tooltip.appendChild(content);
        tooltip.appendChild(arrow);
        
        return tooltip;
    }
    
    function createTooltipInstance(element, options = {}) {
        const settings = mergeSettings(options);
        const tooltipId = `tooltip-${++tooltipIdCounter}`;
        
        const instance = {
            id: tooltipId,
            element,
            tooltip: null,
            settings,
            isVisible: false,
            showTimeout: null,
            hideTimeout: null,
            listeners: new Map()
        };
        
        // Ajouter l'attribut aria
        element.setAttribute('aria-describedby', tooltipId);
        
        // Initialiser les événements
        initializeEvents(instance);
        
        // Stocker l'instance
        activeTooltips.set(element, instance);
        
        return instance;
    }
    
    // ========================================
    // FUSION DES PARAMÈTRES
    // ========================================
    function mergeSettings(options) {
        const defaults = {
            content: '',
            style: 'glassmorphism',
            position: 'top',
            animation: 'scale',
            trigger: 'hover',
            size: 'medium',
            delay: { ...CONFIG.delays },
            ...CONFIG.advanced
        };
        
        const settings = { ...defaults, ...options };
        
        // Fusionner les délais
        if (typeof options.delay === 'number') {
            settings.delay = {
                show: options.delay,
                hide: options.delay
            };
        } else if (typeof options.delay === 'object') {
            settings.delay = { ...defaults.delay, ...options.delay };
        }
        
        return settings;
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function initializeEvents(instance) {
        const { element, settings } = instance;
        const triggerConfig = CONFIG.triggers[settings.trigger];
        
        if (!triggerConfig) return;
        
        triggerConfig.events.forEach(event => {
            let handler;
            
            switch (event) {
                case 'mouseenter':
                    handler = () => show(instance);
                    break;
                case 'mouseleave':
                    handler = () => hide(instance);
                    break;
                case 'click':
                    handler = (e) => {
                        e.stopPropagation();
                        toggle(instance);
                    };
                    break;
                case 'focus':
                    handler = () => show(instance);
                    break;
                case 'blur':
                    handler = () => hide(instance);
                    break;
            }
            
            if (handler) {
                element.addEventListener(event, handler);
                instance.listeners.set(event, handler);
            }
        });
        
        // Gestion du suivi de curseur
        if (settings.followCursor && settings.trigger.includes('hover')) {
            const moveHandler = (e) => updatePosition(instance, e);
            element.addEventListener('mousemove', moveHandler);
            instance.listeners.set('mousemove', moveHandler);
        }
        
        // Gestion des clics extérieurs
        if (settings.hideOnClick && settings.trigger === 'click') {
            const clickOutHandler = (e) => {
                if (!element.contains(e.target) && !instance.tooltip?.contains(e.target)) {
                    hide(instance);
                }
            };
            instance.listeners.set('clickout', clickOutHandler);
        }
    }
    
    // ========================================
    // AFFICHAGE/MASQUAGE
    // ========================================
    function show(instance) {
        if (instance.isVisible) return;
        
        clearTimeout(instance.hideTimeout);
        
        instance.showTimeout = setTimeout(() => {
            // Obtenir ou créer le tooltip
            if (!instance.tooltip) {
                instance.tooltip = getTooltipFromPool();
                instance.tooltip.id = instance.id;
                
                // Appliquer les styles
                applyStyles(instance);
                
                // Définir le contenu
                updateContent(instance);
                
                document.body.appendChild(instance.tooltip);
            }
            
            // Positionner
            position(instance);
            
            // Animer l'entrée
            const animation = CONFIG.animations[instance.settings.animation];
            if (animation && animation.in) {
                instance.tooltip.style.animation = `${animation.in} ${animation.duration}ms ease-out`;
            }
            
            instance.tooltip.style.opacity = '1';
            instance.tooltip.style.visibility = 'visible';
            instance.tooltip.setAttribute('aria-hidden', 'false');
            
            instance.isVisible = true;
            
            // Gérer les événements globaux
            if (instance.settings.hideOnScroll) {
                window.addEventListener('scroll', instance._scrollHandler = () => hide(instance), true);
            }
            if (instance.settings.hideOnResize) {
                window.addEventListener('resize', instance._resizeHandler = () => hide(instance));
            }
            if (instance.listeners.has('clickout')) {
                document.addEventListener('click', instance.listeners.get('clickout'));
            }
            
        }, instance.settings.delay.show);
    }
    
    function hide(instance) {
        if (!instance.isVisible) return;
        
        clearTimeout(instance.showTimeout);
        
        instance.hideTimeout = setTimeout(() => {
            if (!instance.tooltip) return;
            
            // Animer la sortie
            const animation = CONFIG.animations[instance.settings.animation];
            if (animation && animation.out) {
                instance.tooltip.style.animation = `${animation.out} ${animation.duration}ms ease-in`;
                
                setTimeout(() => {
                    removeTooltip(instance);
                }, animation.duration);
            } else {
                removeTooltip(instance);
            }
            
        }, instance.settings.delay.hide);
    }
    
    function removeTooltip(instance) {
        if (!instance.tooltip) return;
        
        instance.tooltip.style.opacity = '0';
        instance.tooltip.style.visibility = 'hidden';
        instance.tooltip.setAttribute('aria-hidden', 'true');
        
        // Retirer de la page
        if (instance.tooltip.parentNode) {
            instance.tooltip.parentNode.removeChild(instance.tooltip);
        }
        
        // Retourner au pool
        returnTooltipToPool(instance.tooltip);
        instance.tooltip = null;
        instance.isVisible = false;
        
        // Nettoyer les événements globaux
        if (instance._scrollHandler) {
            window.removeEventListener('scroll', instance._scrollHandler, true);
            instance._scrollHandler = null;
        }
        if (instance._resizeHandler) {
            window.removeEventListener('resize', instance._resizeHandler);
            instance._resizeHandler = null;
        }
        if (instance.listeners.has('clickout')) {
            document.removeEventListener('click', instance.listeners.get('clickout'));
        }
    }
    
    function toggle(instance) {
        if (instance.isVisible) {
            hide(instance);
        } else {
            show(instance);
        }
    }
    
    // ========================================
    // POSITIONNEMENT
    // ========================================
    function position(instance) {
        const { element, tooltip, settings } = instance;
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let position = settings.position;
        if (position === 'auto') {
            position = calculateBestPosition(rect, tooltipRect);
        }
        
        const coords = calculatePosition(rect, tooltipRect, position, settings.offset);
        
        // Vérifier les débordements
        if (settings.preventOverflow) {
            const overflow = checkOverflow(coords, tooltipRect);
            if (overflow) {
                // Essayer les positions de fallback
                const positionConfig = CONFIG.positions[position];
                for (const fallback of positionConfig.fallbacks) {
                    const newCoords = calculatePosition(rect, tooltipRect, fallback, settings.offset);
                    const newOverflow = checkOverflow(newCoords, tooltipRect);
                    if (!newOverflow) {
                        coords.x = newCoords.x;
                        coords.y = newCoords.y;
                        position = fallback;
                        break;
                    }
                }
            }
        }
        
        // Appliquer la position
        tooltip.style.transform = `translate(${coords.x}px, ${coords.y}px)`;
        tooltip.setAttribute('data-position', position);
        
        // Positionner la flèche
        if (settings.arrow) {
            positionArrow(instance, position);
        }
    }
    
    function calculatePosition(targetRect, tooltipRect, position, offset) {
        const coords = { x: 0, y: 0 };
        
        switch (position) {
            case 'top':
                coords.x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                coords.y = targetRect.top - tooltipRect.height - offset;
                break;
            case 'bottom':
                coords.x = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                coords.y = targetRect.bottom + offset;
                break;
            case 'left':
                coords.x = targetRect.left - tooltipRect.width - offset;
                coords.y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
            case 'right':
                coords.x = targetRect.right + offset;
                coords.y = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                break;
            case 'top-start':
                coords.x = targetRect.left;
                coords.y = targetRect.top - tooltipRect.height - offset;
                break;
            case 'top-end':
                coords.x = targetRect.right - tooltipRect.width;
                coords.y = targetRect.top - tooltipRect.height - offset;
                break;
            case 'bottom-start':
                coords.x = targetRect.left;
                coords.y = targetRect.bottom + offset;
                break;
            case 'bottom-end':
                coords.x = targetRect.right - tooltipRect.width;
                coords.y = targetRect.bottom + offset;
                break;
            case 'left-start':
                coords.x = targetRect.left - tooltipRect.width - offset;
                coords.y = targetRect.top;
                break;
            case 'left-end':
                coords.x = targetRect.left - tooltipRect.width - offset;
                coords.y = targetRect.bottom - tooltipRect.height;
                break;
            case 'right-start':
                coords.x = targetRect.right + offset;
                coords.y = targetRect.top;
                break;
            case 'right-end':
                coords.x = targetRect.right + offset;
                coords.y = targetRect.bottom - tooltipRect.height;
                break;
        }
        
        return coords;
    }
    
    function calculateBestPosition(targetRect, tooltipRect) {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        const spaceTop = targetRect.top;
        const spaceBottom = viewport.height - targetRect.bottom;
        const spaceLeft = targetRect.left;
        const spaceRight = viewport.width - targetRect.right;
        
        // Privilégier les positions avec le plus d'espace
        if (spaceTop > tooltipRect.height && spaceTop > spaceBottom) {
            return 'top';
        } else if (spaceBottom > tooltipRect.height) {
            return 'bottom';
        } else if (spaceRight > tooltipRect.width && spaceRight > spaceLeft) {
            return 'right';
        } else if (spaceLeft > tooltipRect.width) {
            return 'left';
        }
        
        return 'top'; // Position par défaut
    }
    
    function checkOverflow(coords, rect) {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        return coords.x < 0 ||
               coords.y < 0 ||
               coords.x + rect.width > viewport.width ||
               coords.y + rect.height > viewport.height;
    }
    
    function positionArrow(instance, position) {
        const arrow = instance.tooltip.querySelector('.tooltip-arrow');
        if (!arrow) return;
        
        // Réinitialiser les styles
        arrow.style.top = '';
        arrow.style.bottom = '';
        arrow.style.left = '';
        arrow.style.right = '';
        arrow.style.transform = '';
        
        const arrowSize = instance.settings.arrowSize;
        
        switch (position) {
            case 'top':
            case 'top-start':
            case 'top-end':
                arrow.style.bottom = `-${arrowSize}px`;
                arrow.style.left = '50%';
                arrow.style.transform = 'translateX(-50%) rotate(45deg)';
                break;
            case 'bottom':
            case 'bottom-start':
            case 'bottom-end':
                arrow.style.top = `-${arrowSize}px`;
                arrow.style.left = '50%';
                arrow.style.transform = 'translateX(-50%) rotate(225deg)';
                break;
            case 'left':
            case 'left-start':
            case 'left-end':
                arrow.style.right = `-${arrowSize}px`;
                arrow.style.top = '50%';
                arrow.style.transform = 'translateY(-50%) rotate(315deg)';
                break;
            case 'right':
            case 'right-start':
            case 'right-end':
                arrow.style.left = `-${arrowSize}px`;
                arrow.style.top = '50%';
                arrow.style.transform = 'translateY(-50%) rotate(135deg)';
                break;
        }
    }
    
    // ========================================
    // MISE À JOUR
    // ========================================
    function updateContent(instance) {
        const contentEl = instance.tooltip.querySelector('.tooltip-content');
        if (!contentEl) return;
        
        const { content, allowHTML } = instance.settings;
        
        if (allowHTML) {
            contentEl.innerHTML = content;
        } else {
            contentEl.textContent = content;
        }
    }
    
    function updatePosition(instance, event) {
        if (!instance.isVisible || !instance.settings.followCursor) return;
        
        const offset = instance.settings.offset;
        instance.tooltip.style.transform = `translate(${event.clientX + offset}px, ${event.clientY + offset}px)`;
    }
    
    // ========================================
    // STYLES
    // ========================================
    function applyStyles(instance) {
        const { tooltip, settings } = instance;
        const styleConfig = CONFIG.styles[settings.style];
        const sizeConfig = CONFIG.sizes[settings.size];
        
        // Classes de base
        tooltip.className = `tooltip ${styleConfig.className}`;
        
        // Taille
        if (sizeConfig) {
            tooltip.style.padding = sizeConfig.padding;
            tooltip.style.fontSize = sizeConfig.fontSize;
            tooltip.style.maxWidth = sizeConfig.maxWidth;
        }
        
        // Animation
        tooltip.setAttribute('data-animation', settings.animation);
        
        // Z-index
        tooltip.style.zIndex = settings.zIndex;
        
        // Flèche
        const arrow = tooltip.querySelector('.tooltip-arrow');
        if (arrow) {
            arrow.style.display = settings.arrow ? 'block' : 'none';
            if (settings.arrow) {
                arrow.style.width = `${settings.arrowSize * 2}px`;
                arrow.style.height = `${settings.arrowSize * 2}px`;
            }
        }
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    function destroy(element) {
        const instance = activeTooltips.get(element);
        if (!instance) return;
        
        // Masquer le tooltip
        hide(instance);
        
        // Retirer les événements
        instance.listeners.forEach((handler, event) => {
            if (event === 'clickout') {
                document.removeEventListener('click', handler);
            } else if (event === 'mousemove') {
                element.removeEventListener('mousemove', handler);
            } else {
                element.removeEventListener(event, handler);
            }
        });
        
        // Retirer les attributs
        element.removeAttribute('aria-describedby');
        
        // Supprimer l'instance
        activeTooltips.delete(element);
    }
    
    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('tooltip-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'tooltip-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/tooltip.css';
        document.head.appendChild(link);
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(element, options = {}) {
            if (!element) {
                console.error('Tooltip: Element is required');
                return null;
            }
            
            // Injecter les styles si nécessaire
            injectStyles();
            
            // Détruire l'instance existante si elle existe
            if (activeTooltips.has(element)) {
                destroy(element);
            }
            
            // Créer la nouvelle instance
            const instance = createTooltipInstance(element, options);
            
            return {
                show: () => show(instance),
                hide: () => hide(instance),
                toggle: () => toggle(instance),
                update: (newOptions) => {
                    instance.settings = mergeSettings({ ...instance.settings, ...newOptions });
                    if (instance.isVisible) {
                        updateContent(instance);
                        position(instance);
                    }
                },
                destroy: () => destroy(element)
            };
        },
        
        // Méthode pour initialiser plusieurs tooltips
        init(selector = '[data-tooltip]', options = {}) {
            const elements = document.querySelectorAll(selector);
            const instances = [];
            
            elements.forEach(element => {
                const content = element.getAttribute('data-tooltip') || element.getAttribute('title');
                if (content) {
                    element.removeAttribute('title'); // Éviter le tooltip natif
                    const instanceOptions = {
                        content,
                        ...options,
                        ...element.dataset
                    };
                    instances.push(this.create(element, instanceOptions));
                }
            });
            
            return instances;
        },
        
        // Détruire tous les tooltips
        destroyAll() {
            activeTooltips.forEach((instance, element) => {
                destroy(element);
            });
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Injecter les styles manuellement
        injectStyles
    };
})();

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tooltip;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-01-28] - Positionnement automatique
   Solution: Système de fallback avec calcul des débordements
   
   [2025-01-28] - Performance avec plusieurs tooltips
   Solution: Pool de réutilisation des éléments DOM
   
   [2025-01-28] - Support tactile
   Solution: Désactivation du hover sur les appareils tactiles
   
   NOTES POUR REPRISES FUTURES:
   - Le pool de tooltips améliore les performances
   - Le positionnement auto nécessite des calculs viewport
   - Les animations doivent être synchronisées avec le DOM
   - Attention aux fuites mémoire avec les listeners
   ======================================== */