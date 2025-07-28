/* ========================================
   STATUS-BADGE.COMPONENT.JS - Composant Badge de Statut
   Chemin: src/js/shared/ui/elements/status-badge.component.js
   
   DESCRIPTION:
   Système de badges de statut ultra-complet avec tous les styles,
   animations, tailles et configurations possibles.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Gestion des styles (lignes 302-350)
   3. Création du composant (lignes 352-500)
   4. Construction du contenu (lignes 502-700)
   5. Animations et effets (lignes 702-900)
   6. Méthodes utilitaires (lignes 902-1000)
   7. API publique (lignes 1002-1100)
   
   DÉPENDANCES:
   - status-badge.css (styles associés)
   - animation-utils.js (pour les animations)
   ======================================== */

const StatusBadgeComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Tous les types de statuts prédéfinis
        statuses: {
            // Statuts généraux
            'active': { 
                color: '#22c55e', 
                icon: 'check-circle', 
                pulse: true,
                description: 'Actif'
            },
            'inactive': { 
                color: '#6b7280', 
                icon: 'x-circle', 
                pulse: false,
                description: 'Inactif'
            },
            'pending': { 
                color: '#f59e0b', 
                icon: 'clock', 
                pulse: true,
                animation: 'rotate',
                description: 'En attente'
            },
            'processing': { 
                color: '#3b82f6', 
                icon: 'loader', 
                pulse: true,
                animation: 'spin',
                description: 'En cours'
            },
            'completed': { 
                color: '#22c55e', 
                icon: 'check-double', 
                pulse: false,
                description: 'Terminé'
            },
            'failed': { 
                color: '#ef4444', 
                icon: 'x-octagon', 
                pulse: false,
                shake: true,
                description: 'Échec'
            },
            'warning': { 
                color: '#f59e0b', 
                icon: 'alert-triangle', 
                pulse: true,
                description: 'Attention'
            },
            'error': { 
                color: '#ef4444', 
                icon: 'alert-circle', 
                pulse: true,
                description: 'Erreur'
            },
            'success': { 
                color: '#22c55e', 
                icon: 'check', 
                pulse: false,
                description: 'Succès'
            },
            'info': { 
                color: '#0ea5e9', 
                icon: 'info-circle', 
                pulse: false,
                description: 'Information'
            },
            
            // Statuts de connexion
            'online': { 
                color: '#22c55e', 
                icon: 'wifi', 
                pulse: true,
                description: 'En ligne'
            },
            'offline': { 
                color: '#6b7280', 
                icon: 'wifi-off', 
                pulse: false,
                description: 'Hors ligne'
            },
            'away': { 
                color: '#f59e0b', 
                icon: 'moon', 
                pulse: false,
                description: 'Absent'
            },
            'busy': { 
                color: '#ef4444', 
                icon: 'minus-circle', 
                pulse: false,
                description: 'Occupé'
            },
            
            // Statuts de paiement
            'paid': { 
                color: '#22c55e', 
                icon: 'dollar-sign', 
                pulse: false,
                description: 'Payé'
            },
            'unpaid': { 
                color: '#ef4444', 
                icon: 'dollar-sign', 
                pulse: false,
                description: 'Impayé'
            },
            'refunded': { 
                color: '#6b7280', 
                icon: 'rotate-ccw', 
                pulse: false,
                description: 'Remboursé'
            },
            
            // Statuts de livraison
            'shipped': { 
                color: '#3b82f6', 
                icon: 'truck', 
                pulse: false,
                description: 'Expédié'
            },
            'delivered': { 
                color: '#22c55e', 
                icon: 'package-check', 
                pulse: false,
                description: 'Livré'
            },
            'returned': { 
                color: '#f59e0b', 
                icon: 'package-x', 
                pulse: false,
                description: 'Retourné'
            },
            
            // Statuts custom
            'new': { 
                color: '#8b5cf6', 
                icon: 'sparkles', 
                pulse: true,
                sparkle: true,
                description: 'Nouveau'
            },
            'hot': { 
                color: '#ef4444', 
                icon: 'flame', 
                pulse: true,
                animation: 'flame',
                description: 'Populaire'
            },
            'cold': { 
                color: '#06b6d4', 
                icon: 'snowflake', 
                pulse: false,
                animation: 'float',
                description: 'Froid'
            },
            'premium': { 
                color: '#fbbf24', 
                icon: 'crown', 
                pulse: false,
                shine: true,
                description: 'Premium'
            },
            'vip': { 
                color: '#a855f7', 
                icon: 'star', 
                pulse: false,
                glow: true,
                description: 'VIP'
            }
        },

        // Tous les styles disponibles
        styles: {
            'glassmorphism': {
                class: 'glassmorphism',
                blur: 20,
                opacity: 0.1,
                glow: true,
                description: 'Effet verre dépoli moderne'
            },
            'neumorphism': {
                class: 'neumorphism',
                shadow: 'soft',
                description: 'Style relief doux'
            },
            'flat': {
                class: 'flat',
                shadow: 'none',
                description: 'Style plat simple'
            },
            'material': {
                class: 'material',
                elevation: 2,
                description: 'Material Design'
            },
            'minimal': {
                class: 'minimal',
                border: false,
                description: 'Style minimaliste'
            },
            'outline': {
                class: 'outline',
                filled: false,
                description: 'Contour uniquement'
            },
            'gradient': {
                class: 'gradient',
                gradientAngle: 135,
                description: 'Fond dégradé'
            },
            'neon': {
                class: 'neon',
                glow: 'intense',
                description: 'Effet néon lumineux'
            }
        },

        // Toutes les tailles
        sizes: {
            'xs': { class: 'xs', size: 6, fontSize: 10 },
            'small': { class: 'small', size: 8, fontSize: 11 },
            'medium': { class: 'medium', size: 10, fontSize: 12 },
            'large': { class: 'large', size: 12, fontSize: 14 },
            'xl': { class: 'xl', size: 16, fontSize: 16 }
        },

        // Toutes les formes
        shapes: {
            'circle': { class: 'circle' },
            'square': { class: 'square' },
            'rounded': { class: 'rounded' },
            'hexagon': { class: 'hexagon' },
            'diamond': { class: 'diamond' },
            'triangle': { class: 'triangle' }
        },

        // Positions du texte
        positions: {
            'right': { class: 'text-right' },
            'left': { class: 'text-left' },
            'top': { class: 'text-top' },
            'bottom': { class: 'text-bottom' },
            'none': { class: 'text-none' }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                description: 'Aucune animation'
            },
            'subtle': {
                pulse: true,
                transition: '0.3s ease',
                description: 'Animations subtiles'
            },
            'smooth': {
                pulse: true,
                breathe: true,
                transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                description: 'Transitions fluides'
            },
            'rich': {
                pulse: true,
                breathe: true,
                morph: true,
                particles: true,
                transition: '0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                description: 'Animations riches'
            }
        },

        // Classes CSS
        classes: {
            container: 'status-badge-container',
            badge: 'status-badge',
            dot: 'status-badge-dot',
            icon: 'status-badge-icon',
            text: 'status-badge-text',
            pulse: 'status-badge-pulse',
            particles: 'status-badge-particles'
        }
    };

    // ========================================
    // GESTION DES STYLES
    // ========================================
    let stylesInjected = false;

    function injectStyles() {
        if (stylesInjected || document.querySelector('#status-badge-styles')) return;

        const link = document.createElement('link');
        link.id = 'status-badge-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/status-badge.css';
        document.head.appendChild(link);
        stylesInjected = true;
    }

    // ========================================
    // CRÉATION DU COMPOSANT
    // ========================================
    function create(options = {}) {
        // Options par défaut
        const settings = {
            status: options.status || 'active',
            style: options.style || 'glassmorphism',
            size: options.size || 'medium',
            shape: options.shape || 'circle',
            position: options.position || 'right',
            animation: options.animation || 'smooth',
            text: options.text,
            showIcon: options.showIcon !== false,
            showText: options.showText !== false,
            showPulse: options.showPulse,
            customColor: options.customColor,
            customIcon: options.customIcon,
            tooltip: options.tooltip,
            clickable: options.clickable || false,
            className: options.className || '',
            id: options.id || `status-badge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            data: options.data || {},
            ...options
        };

        // Si status custom non défini dans CONFIG
        if (!CONFIG.statuses[settings.status] && settings.customColor) {
            CONFIG.statuses[settings.status] = {
                color: settings.customColor,
                icon: settings.customIcon || 'circle',
                description: settings.text || settings.status
            };
        }

        // Injection des styles
        injectStyles();

        // Création du conteneur
        const container = document.createElement('div');
        container.className = buildContainerClassName(settings);
        container.id = settings.id;

        // Attributs
        if (settings.tooltip || CONFIG.statuses[settings.status]?.description) {
            container.setAttribute('title', settings.tooltip || CONFIG.statuses[settings.status].description);
        }

        if (settings.clickable) {
            container.setAttribute('role', 'button');
            container.setAttribute('tabindex', '0');
        }

        // Données personnalisées
        container.dataset.status = settings.status;
        Object.entries(settings.data).forEach(([key, value]) => {
            container.dataset[key] = value;
        });

        // Construction du contenu
        container.innerHTML = buildContent(settings);

        // Application du style personnalisé
        applyCustomStyles(container, settings);

        // Gestion des événements
        if (settings.clickable) {
            attachEventHandlers(container, settings);
        }

        // Démarrage des animations
        if (settings.animation !== 'none') {
            startAnimations(container, settings);
        }

        // API du composant
        container.statusBadgeComponent = {
            getStatus: () => container.dataset.status,
            setStatus: (newStatus) => updateStatus(container, newStatus, settings),
            getText: () => container.querySelector(`.${CONFIG.classes.text}`)?.textContent,
            setText: (newText) => updateText(container, newText),
            startPulse: () => startPulse(container),
            stopPulse: () => stopPulse(container),
            shake: () => shakeEffect(container),
            highlight: () => highlightEffect(container),
            morph: (toStatus) => morphToStatus(container, toStatus, settings),
            updateColor: (color) => updateColor(container, color),
            enable: () => enableBadge(container),
            disable: () => disableBadge(container),
            destroy: () => destroyBadge(container)
        };

        return container;
    }

    // ========================================
    // CONSTRUCTION DU CONTENU
    // ========================================
    function buildContainerClassName(settings) {
        const classes = [CONFIG.classes.container];

        // Style
        if (CONFIG.styles[settings.style]) {
            classes.push(CONFIG.styles[settings.style].class);
        }

        // Taille
        if (CONFIG.sizes[settings.size]) {
            classes.push(CONFIG.sizes[settings.size].class);
        }

        // Forme
        if (CONFIG.shapes[settings.shape]) {
            classes.push(CONFIG.shapes[settings.shape].class);
        }

        // Position du texte
        if (settings.showText && CONFIG.positions[settings.position]) {
            classes.push(CONFIG.positions[settings.position].class);
        }

        // Animation
        if (settings.animation !== 'none') {
            classes.push(`animate-${settings.animation}`);
        }

        // État clickable
        if (settings.clickable) {
            classes.push('clickable');
        }

        // Classes personnalisées
        if (settings.className) {
            classes.push(...settings.className.split(' '));
        }

        return classes.join(' ');
    }

    function buildContent(settings) {
        const statusConfig = CONFIG.statuses[settings.status] || {};
        const parts = [];

        // Badge principal
        const badgeContent = [];

        // Pulse effect
        if (settings.showPulse !== false && (settings.showPulse || statusConfig.pulse)) {
            parts.push(`<span class="${CONFIG.classes.pulse}"></span>`);
        }

        // Icône
        if (settings.showIcon && statusConfig.icon) {
            badgeContent.push(buildIcon(statusConfig.icon));
        }

        // Badge
        parts.push(`<span class="${CONFIG.classes.badge}" data-status="${settings.status}">
            ${badgeContent.join('')}
        </span>`);

        // Texte
        if (settings.showText && (settings.text || settings.position !== 'none')) {
            const text = settings.text || statusConfig.description || settings.status;
            parts.push(`<span class="${CONFIG.classes.text}">${escapeHtml(text)}</span>`);
        }

        // Particules pour effet riche
        if (settings.animation === 'rich' && (statusConfig.sparkle || statusConfig.particles)) {
            parts.push(buildParticles(settings.status));
        }

        return parts.join('');
    }

    function buildIcon(iconName) {
        return `<span class="${CONFIG.classes.icon}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${getIconPath(iconName)}
            </svg>
        </span>`;
    }

    function buildParticles(status) {
        const particles = [];
        const count = 6;
        
        for (let i = 0; i < count; i++) {
            particles.push(`<span class="particle particle-${i}"></span>`);
        }
        
        return `<div class="${CONFIG.classes.particles}">${particles.join('')}</div>`;
    }

    // ========================================
    // APPLICATION DES STYLES
    // ========================================
    function applyCustomStyles(container, settings) {
        const badge = container.querySelector(`.${CONFIG.classes.badge}`);
        const statusConfig = CONFIG.statuses[settings.status] || {};
        const color = settings.customColor || statusConfig.color;

        if (color) {
            // Conversion couleur hex en RGB
            const rgb = hexToRgb(color);
            if (rgb) {
                container.style.setProperty('--status-color', color);
                container.style.setProperty('--status-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
            }
        }

        // Effets spéciaux
        if (statusConfig.glow && settings.style === 'glassmorphism') {
            badge.style.boxShadow = `0 0 20px ${color}`;
        }

        if (statusConfig.shine) {
            badge.classList.add('shine-effect');
        }
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function attachEventHandlers(container, settings) {
        // Click
        container.addEventListener('click', (e) => {
            if (settings.onClick) {
                settings.onClick(container.statusBadgeComponent, e);
            }
        });

        // Keyboard
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                container.click();
            }
        });

        // Hover effects
        container.addEventListener('mouseenter', () => {
            if (settings.onHover) {
                settings.onHover(container.statusBadgeComponent);
            }
        });
    }

    // ========================================
    // ANIMATIONS ET EFFETS
    // ========================================
    function startAnimations(container, settings) {
        const statusConfig = CONFIG.statuses[settings.status] || {};

        // Animation spécifique au statut
        if (statusConfig.animation) {
            const badge = container.querySelector(`.${CONFIG.classes.badge}`);
            badge.classList.add(`animate-${statusConfig.animation}`);
        }

        // Shake effect pour erreurs
        if (statusConfig.shake) {
            setTimeout(() => shakeEffect(container), 100);
        }

        // Float effect
        if (statusConfig.animation === 'float') {
            container.classList.add('float-animation');
        }

        // Flame effect
        if (statusConfig.animation === 'flame') {
            createFlameEffect(container);
        }
    }

    function startPulse(container) {
        const pulse = container.querySelector(`.${CONFIG.classes.pulse}`);
        if (!pulse) {
            const newPulse = document.createElement('span');
            newPulse.className = CONFIG.classes.pulse;
            container.insertBefore(newPulse, container.firstChild);
        }
        container.classList.add('pulsing');
    }

    function stopPulse(container) {
        container.classList.remove('pulsing');
        const pulse = container.querySelector(`.${CONFIG.classes.pulse}`);
        if (pulse) {
            pulse.style.animation = 'pulseOut 0.5s ease-out';
            setTimeout(() => pulse.remove(), 500);
        }
    }

    function shakeEffect(container) {
        container.style.animation = 'badgeShake 0.5s ease-in-out';
        container.addEventListener('animationend', () => {
            container.style.animation = '';
        }, { once: true });
    }

    function highlightEffect(container) {
        container.style.animation = 'badgeHighlight 1s ease-in-out';
        container.addEventListener('animationend', () => {
            container.style.animation = '';
        }, { once: true });
    }

    function morphToStatus(container, toStatus, settings) {
        const badge = container.querySelector(`.${CONFIG.classes.badge}`);
        
        // Animation de morphing
        badge.style.animation = 'badgeMorph 0.6s ease-in-out';
        
        setTimeout(() => {
            updateStatus(container, toStatus, settings);
            badge.style.animation = '';
        }, 300);
    }

    function createFlameEffect(container) {
        const badge = container.querySelector(`.${CONFIG.classes.badge}`);
        const flames = document.createElement('div');
        flames.className = 'flame-particles';
        
        for (let i = 0; i < 5; i++) {
            const flame = document.createElement('span');
            flame.className = `flame flame-${i}`;
            flames.appendChild(flame);
        }
        
        badge.appendChild(flames);
    }

    // ========================================
    // MÉTHODES DE MISE À JOUR
    // ========================================
    function updateStatus(container, newStatus, settings) {
        const oldStatus = container.dataset.status;
        if (oldStatus === newStatus) return;

        // Mise à jour des données
        container.dataset.status = newStatus;

        // Reconstruction du contenu
        const newSettings = { ...settings, status: newStatus };
        container.className = buildContainerClassName(newSettings);
        container.innerHTML = buildContent(newSettings);

        // Réapplication des styles
        applyCustomStyles(container, newSettings);

        // Redémarrage des animations
        if (newSettings.animation !== 'none') {
            startAnimations(container, newSettings);
        }

        // Event
        const event = new CustomEvent('statuschange', {
            detail: { oldStatus, newStatus }
        });
        container.dispatchEvent(event);
    }

    function updateText(container, newText) {
        const textElement = container.querySelector(`.${CONFIG.classes.text}`);
        if (textElement) {
            textElement.textContent = newText;
        } else if (newText) {
            // Créer l'élément texte s'il n'existe pas
            const text = document.createElement('span');
            text.className = CONFIG.classes.text;
            text.textContent = newText;
            container.appendChild(text);
        }
    }

    function updateColor(container, color) {
        const rgb = hexToRgb(color);
        if (rgb) {
            container.style.setProperty('--status-color', color);
            container.style.setProperty('--status-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
    }

    function enableBadge(container) {
        container.classList.remove('disabled');
        container.removeAttribute('aria-disabled');
    }

    function disableBadge(container) {
        container.classList.add('disabled');
        container.setAttribute('aria-disabled', 'true');
    }

    function destroyBadge(container) {
        // Animation de sortie
        container.style.animation = 'badgeOut 0.3s ease-out';
        container.addEventListener('animationend', () => {
            container.remove();
        }, { once: true });
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function getIconPath(iconName) {
        const icons = {
            // Statuts généraux
            'check-circle': '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
            'x-circle': '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
            'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
            'loader': '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
            'check-double': '<path d="M18 6L7 17l-4-4M22 6l-11 11"/>',
            'x-octagon': '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><path d="M15 9l-6 6M9 9l6 6"/>',
            'alert-triangle': '<path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
            'alert-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
            'check': '<path d="M20 6L9 17l-5-5"/>',
            'info-circle': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
            
            // Connexion
            'wifi': '<path d="M5 12.55a11 11 0 0 1 14.08 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
            'wifi-off': '<path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
            'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
            'minus-circle': '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>',
            
            // Paiement
            'dollar-sign': '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
            'rotate-ccw': '<path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
            
            // Livraison
            'truck': '<path d="M1 3h15v10h-15zM16 8h5l3 3v5h-8v-8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>',
            'package-check': '<path d="M16 16l2 2 4-4"/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14M16.5 9.4L7.55 4.24"/>',
            'package-x': '<path d="M12.22 2L2 9v11l10.22 7L20 22.5V11l2-1.5v-1L12.22 2zM12 12l-10-7"/>',
            
            // Spéciaux
            'sparkles': '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM5 19l.75 2.25L8 22l-2.25.75L5 25l-.75-2.25L2 22l2.25-.75zM19 5l.75 2.25L22 8l-2.25.75L19 11l-.75-2.25L16 8l2.25-.75z"/>',
            'flame': '<path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 1 1 8.5 14c0-1.5.5-2.5 2-4.5C9.5 8 8 6.5 8 3c1 1.5 2.5 2 4 2z"/>',
            'snowflake': '<path d="M12 2v20M8 16l4-4 4 4M16 8l-4 4-4-4M3 11h18M6.24 6.24l11.52 11.52M17.76 6.24L6.24 17.76"/>',
            'crown': '<path d="M5 12l-3 9h18l-3-9M5 12l7-10 7 10M12 2v10"/>',
            'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
            'circle': '<circle cx="12" cy="12" r="10"/>'
        };
        
        return icons[iconName] || icons['circle'];
    }

    // ========================================
    // BADGES GROUPÉS
    // ========================================
    function createGroup(badges = [], options = {}) {
        const groupSettings = {
            gap: options.gap || 8,
            align: options.align || 'center',
            wrap: options.wrap !== false,
            className: options.className || '',
            ...options
        };

        const group = document.createElement('div');
        group.className = `status-badge-group ${groupSettings.className}`;
        
        // Styles
        group.style.display = 'flex';
        group.style.gap = `${groupSettings.gap}px`;
        group.style.alignItems = groupSettings.align;
        group.style.flexWrap = groupSettings.wrap ? 'wrap' : 'nowrap';

        // Ajout des badges
        badges.forEach(badgeOptions => {
            const badge = create(badgeOptions);
            group.appendChild(badge);
        });

        // API du groupe
        group.badgeGroup = {
            addBadge: (badgeOptions) => {
                const badge = create(badgeOptions);
                group.appendChild(badge);
                return badge;
            },
            removeBadge: (badgeId) => {
                const badge = group.querySelector(`#${badgeId}`);
                if (badge) badge.statusBadgeComponent.destroy();
            },
            getBadges: () => Array.from(group.querySelectorAll('.status-badge-container')),
            updateAll: (status) => {
                group.querySelectorAll('.status-badge-container').forEach(badge => {
                    badge.statusBadgeComponent.setStatus(status);
                });
            },
            clear: () => {
                group.innerHTML = '';
            }
        };

        return group;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        createGroup,
        CONFIG,
        injectStyles,
        
        // Méthodes utilitaires
        utils: {
            escapeHtml,
            hexToRgb,
            getIconPath
        },
        
        // Présets de statuts
        presets: {
            connection: ['online', 'offline', 'away', 'busy'],
            payment: ['paid', 'unpaid', 'pending', 'refunded'],
            delivery: ['pending', 'processing', 'shipped', 'delivered'],
            general: ['active', 'inactive', 'pending', 'completed', 'failed']
        }
    };
})();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusBadgeComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Performance des animations
   Solution: Utilisation de transform et opacity uniquement
   
   [2024-01] - Support des couleurs custom
   Solution: Variables CSS avec conversion RGB
   
   [2024-01] - Accessibilité des badges
   Solution: Tooltips et attributs ARIA appropriés
   
   NOTES POUR REPRISES FUTURES:
   - Les animations peuvent être désactivées globalement
   - Les icônes SVG sont inline pour la performance
   - Le système de particules est optionnel (rich)
   - Les badges peuvent être groupés avec une API
   ======================================== */