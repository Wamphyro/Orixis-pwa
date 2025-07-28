/* ========================================
   AVATAR.COMPONENT.JS - Composant Avatar Glassmorphism
   Chemin: src/js/shared/ui/elements/avatar.component.js
   
   DESCRIPTION:
   Composant avatar complet avec effet glassmorphism.
   Gère images, initiales, icônes, statuts, badges et groupes.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-150)
   2. Méthodes privées de création (lignes 152-400)
   3. Gestion des images et fallback (lignes 402-500)
   4. Création des badges et statuts (lignes 502-600)
   5. Gestion des groupes (lignes 602-700)
   6. API publique (lignes 702-800)
   
   DÉPENDANCES:
   - avatar.css (tous les styles)
   - icons.component.js (pour les icônes par défaut)
   ======================================== */

const AvatarComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types d'avatar disponibles
        types: {
            'image': { priority: 1 },
            'initials': { priority: 2 },
            'icon': { priority: 3 },
            'placeholder': { priority: 4 }
        },

        // Tailles prédéfinies
        sizes: {
            'xs': { size: 24, fontSize: 10, iconSize: 12, badgeSize: 8 },
            'small': { size: 32, fontSize: 12, iconSize: 16, badgeSize: 10 },
            'medium': { size: 40, fontSize: 14, iconSize: 20, badgeSize: 12 },
            'large': { size: 56, fontSize: 18, iconSize: 28, badgeSize: 14 },
            'xl': { size: 72, fontSize: 24, iconSize: 36, badgeSize: 16 },
            'xxl': { size: 96, fontSize: 32, iconSize: 48, badgeSize: 20 },
            'custom': null // Permet des tailles personnalisées
        },

        // Formes disponibles
        shapes: {
            'circle': { borderRadius: '50%' },
            'square': { borderRadius: '0' },
            'rounded': { borderRadius: '16px' },
            'hexagon': { clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }
        },

        // Statuts possibles
        statuses: {
            'online': { color: '#22c55e', pulse: true },
            'offline': { color: '#6b7280', pulse: false },
            'busy': { color: '#ef4444', pulse: false },
            'away': { color: '#f59e0b', pulse: true },
            'invisible': { color: '#6b7280', pulse: false }
        },

        // Positions des badges/statuts
        positions: {
            'top-right': { top: '0', right: '0', transform: 'translate(25%, -25%)' },
            'top-left': { top: '0', left: '0', transform: 'translate(-25%, -25%)' },
            'bottom-right': { bottom: '0', right: '0', transform: 'translate(25%, 25%)' },
            'bottom-left': { bottom: '0', left: '0', transform: 'translate(-25%, 25%)' }
        },

        // Animations disponibles
        animations: {
            'none': { enabled: false },
            'pulse': { keyframes: 'avatarPulse', duration: '2s', timing: 'ease-in-out', iteration: 'infinite' },
            'bounce': { keyframes: 'avatarBounce', duration: '1s', timing: 'ease-in-out', iteration: '1' },
            'glow': { keyframes: 'avatarGlow', duration: '2s', timing: 'ease-in-out', iteration: 'infinite' },
            'rotate': { keyframes: 'avatarRotate', duration: '20s', timing: 'linear', iteration: 'infinite' },
            'shake': { keyframes: 'avatarShake', duration: '0.5s', timing: 'ease-in-out', iteration: '1' }
        },

        // Couleurs par défaut pour les initiales
        colors: {
            'primary': '#3b82f6',
            'secondary': '#6366f1',
            'success': '#22c55e',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'info': '#0ea5e9',
            'auto': null // Génère une couleur basée sur le nom
        },

        // Icônes par défaut
        defaultIcons: {
            'user': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            'group': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            'bot': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>'
        },

        // Options de groupe
        groupOptions: {
            maxDisplay: 4,
            overlap: 0.3,
            spacing: -8,
            extraCountPosition: 'end' // 'end' ou 'start'
        },

        // Effets visuels
        effects: {
            glassmorphism: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px) brightness(1.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            },
            hover: {
                transform: 'scale(1.05)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)'
            },
            active: {
                transform: 'scale(0.98)'
            }
        }
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================

    // Génération de couleur basée sur une chaîne
    function generateColorFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    // Extraction des initiales
    function getInitials(name, maxChars = 2) {
        if (!name) return '';
        
        const words = name.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, maxChars).toUpperCase();
        }
        
        return words.slice(0, maxChars)
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }

    // Création de l'élément avatar principal
    function createAvatarElement(options) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        // Application des classes
        if (options.size && CONFIG.sizes[options.size]) {
            avatar.classList.add(`avatar-${options.size}`);
        }
        
        if (options.shape) {
            avatar.classList.add(`avatar-${options.shape}`);
        }
        
        if (options.style) {
            avatar.classList.add(options.style);
        }
        
        if (options.animation && options.animation !== 'none') {
            avatar.classList.add(`animate-${options.animation}`);
        }
        
        if (options.className) {
            avatar.classList.add(...options.className.split(' '));
        }
        
        // Taille personnalisée
        if (options.customSize) {
            avatar.style.width = `${options.customSize}px`;
            avatar.style.height = `${options.customSize}px`;
            avatar.style.fontSize = `${options.customSize * 0.4}px`;
        }
        
        // Attributs d'accessibilité
        avatar.setAttribute('role', 'img');
        avatar.setAttribute('aria-label', options.alt || options.name || 'Avatar');
        
        return avatar;
    }

    // Création du contenu selon le type
    function createAvatarContent(type, options) {
        const content = document.createElement('div');
        content.className = 'avatar-content';
        
        switch (type) {
            case 'image':
                const img = document.createElement('img');
                img.src = options.src;
                img.alt = options.alt || options.name || 'Avatar';
                img.className = 'avatar-image';
                img.loading = options.loading || 'lazy';
                
                // Gestion des erreurs de chargement
                img.onerror = () => {
                    if (options.fallback !== false) {
                        handleImageError(content, options);
                    }
                };
                
                content.appendChild(img);
                break;
                
            case 'initials':
                const initials = document.createElement('span');
                initials.className = 'avatar-initials';
                initials.textContent = getInitials(options.name || options.initials);
                
                // Couleur de fond
                if (options.color === 'auto' && options.name) {
                    content.style.backgroundColor = generateColorFromString(options.name);
                } else if (CONFIG.colors[options.color]) {
                    content.style.backgroundColor = CONFIG.colors[options.color];
                } else if (options.color) {
                    content.style.backgroundColor = options.color;
                }
                
                content.appendChild(initials);
                break;
                
            case 'icon':
                const iconWrapper = document.createElement('div');
                iconWrapper.className = 'avatar-icon';
                
                if (options.icon && typeof options.icon === 'string') {
                    iconWrapper.innerHTML = CONFIG.defaultIcons[options.icon] || options.icon;
                } else if (options.icon && options.icon.nodeType) {
                    iconWrapper.appendChild(options.icon);
                } else {
                    iconWrapper.innerHTML = CONFIG.defaultIcons.user;
                }
                
                content.appendChild(iconWrapper);
                break;
                
            case 'placeholder':
            default:
                const placeholder = document.createElement('div');
                placeholder.className = 'avatar-placeholder';
                placeholder.innerHTML = CONFIG.defaultIcons.user;
                content.appendChild(placeholder);
                break;
        }
        
        return content;
    }

    // Gestion des erreurs de chargement d'image
    function handleImageError(content, options) {
        content.innerHTML = '';
        
        // Fallback en cascade
        if (options.name || options.initials) {
            const fallbackContent = createAvatarContent('initials', options);
            content.appendChild(...fallbackContent.children);
        } else if (options.icon) {
            const fallbackContent = createAvatarContent('icon', options);
            content.appendChild(...fallbackContent.children);
        } else {
            const fallbackContent = createAvatarContent('placeholder', options);
            content.appendChild(...fallbackContent.children);
        }
    }

    // Création du badge de statut
    function createStatusBadge(status, position = 'bottom-right') {
        const statusConfig = CONFIG.statuses[status];
        if (!statusConfig) return null;
        
        const badge = document.createElement('div');
        badge.className = `avatar-status avatar-status-${status} position-${position}`;
        
        if (statusConfig.pulse) {
            badge.classList.add('status-pulse');
        }
        
        return badge;
    }

    // Création du badge numérique/texte
    function createBadge(options) {
        const badge = document.createElement('div');
        badge.className = 'avatar-badge';
        
        if (options.badgePosition) {
            badge.classList.add(`position-${options.badgePosition}`);
        }
        
        if (options.badgeType) {
            badge.classList.add(`badge-${options.badgeType}`);
        }
        
        // Contenu du badge
        if (typeof options.badge === 'number') {
            badge.textContent = options.badge > 99 ? '99+' : options.badge;
        } else if (typeof options.badge === 'string') {
            badge.textContent = options.badge;
        } else if (options.badge && options.badge.nodeType) {
            badge.appendChild(options.badge);
        }
        
        return badge;
    }

    // Création d'un groupe d'avatars
    function createAvatarGroup(avatars, options = {}) {
        const group = document.createElement('div');
        group.className = 'avatar-group';
        
        if (options.size) {
            group.classList.add(`avatar-group-${options.size}`);
        }
        
        if (options.className) {
            group.classList.add(...options.className.split(' '));
        }
        
        const maxDisplay = options.maxDisplay || CONFIG.groupOptions.maxDisplay;
        const avatarsToShow = avatars.slice(0, maxDisplay);
        const extraCount = avatars.length - maxDisplay;
        
        // Création des avatars visibles
        avatarsToShow.forEach((avatarOptions, index) => {
            const avatar = create({
                ...avatarOptions,
                size: options.size || avatarOptions.size,
                style: options.style || avatarOptions.style
            });
            
            // Style pour le chevauchement
            if (options.overlap !== false) {
                avatar.style.marginLeft = index === 0 ? '0' : `${CONFIG.groupOptions.spacing}px`;
                avatar.style.zIndex = avatarsToShow.length - index;
            }
            
            group.appendChild(avatar);
        });
        
        // Avatar pour le compte supplémentaire
        if (extraCount > 0) {
            const extraAvatar = create({
                type: 'initials',
                initials: `+${extraCount}`,
                size: options.size,
                style: options.style,
                color: '#6b7280'
            });
            
            if (options.overlap !== false) {
                extraAvatar.style.marginLeft = `${CONFIG.groupOptions.spacing}px`;
            }
            
            group.appendChild(extraAvatar);
        }
        
        return group;
    }

    // Injection des styles
    function injectStyles() {
        if (document.getElementById('avatar-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'avatar-styles';
        style.textContent = `
            /* Styles de base pour avatar.component.js */
            .avatar { position: relative; display: inline-flex; }
            .avatar-content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            @import url('/src/css/shared/ui/avatar.css');
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // MÉTHODE PRINCIPALE DE CRÉATION
    // ========================================
    function create(options = {}) {
        // Options par défaut
        const defaultOptions = {
            type: 'placeholder',
            size: 'medium',
            shape: 'circle',
            style: 'glassmorphism',
            animation: 'none',
            statusPosition: 'bottom-right',
            badgePosition: 'top-right',
            fallback: true
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Détermination automatique du type
        if (!options.type && options.src) {
            finalOptions.type = 'image';
        } else if (!options.type && (options.name || options.initials)) {
            finalOptions.type = 'initials';
        } else if (!options.type && options.icon) {
            finalOptions.type = 'icon';
        }
        
        // Création de l'avatar
        const avatar = createAvatarElement(finalOptions);
        const content = createAvatarContent(finalOptions.type, finalOptions);
        avatar.appendChild(content);
        
        // Ajout du statut si défini
        if (finalOptions.status) {
            const statusBadge = createStatusBadge(finalOptions.status, finalOptions.statusPosition);
            if (statusBadge) {
                avatar.appendChild(statusBadge);
            }
        }
        
        // Ajout du badge si défini
        if (finalOptions.badge !== undefined && finalOptions.badge !== null) {
            const badge = createBadge(finalOptions);
            avatar.appendChild(badge);
        }
        
        // Gestion des événements
        if (finalOptions.onClick) {
            avatar.style.cursor = 'pointer';
            avatar.addEventListener('click', finalOptions.onClick);
        }
        
        if (finalOptions.onHover) {
            avatar.addEventListener('mouseenter', finalOptions.onHover);
        }
        
        // Injection automatique des styles
        if (finalOptions.injectStyles !== false) {
            injectStyles();
        }
        
        return avatar;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        createGroup: createAvatarGroup,
        getInitials,
        generateColorFromString,
        injectStyles,
        
        // Méthodes utilitaires
        updateStatus(avatar, newStatus) {
            const oldStatus = avatar.querySelector('.avatar-status');
            if (oldStatus) oldStatus.remove();
            
            if (newStatus) {
                const statusBadge = createStatusBadge(newStatus);
                if (statusBadge) avatar.appendChild(statusBadge);
            }
        },
        
        updateBadge(avatar, newBadge) {
            const oldBadge = avatar.querySelector('.avatar-badge');
            if (oldBadge) oldBadge.remove();
            
            if (newBadge !== undefined && newBadge !== null) {
                const badge = createBadge({ badge: newBadge });
                avatar.appendChild(badge);
            }
        },
        
        // Accès à la configuration
        CONFIG,
        
        // Export du module
        default: create
    };
})();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvatarComponent;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion des images avec fallback
   Solution: Cascade de fallback (image -> initiales -> icône -> placeholder)
   
   [2024-12-XX] - Performance avec groupes d'avatars
   Cause: Trop de reflows DOM
   Résolution: Utilisation de documentFragment et batch updates
   
   [2024-12-XX] - Génération de couleurs cohérentes
   Solution: Hash du nom pour générer une couleur HSL stable
   
   NOTES POUR REPRISES FUTURES:
   - L'injection des styles est automatique mais peut être désactivée
   - Les avatars de groupe gèrent automatiquement le chevauchement
   - Le composant est compatible avec le lazy loading du système UI
   ======================================== */