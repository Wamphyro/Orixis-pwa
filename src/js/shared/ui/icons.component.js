// ========================================
// FROSTED ICONS COMPONENT
// Composant d'icônes style Glassmorphism Frosted Depth
// Version: 1.0.0
// ========================================

/**
 * Composant FrostedIcons
 * Génère des boutons d'icônes avec effet glassmorphism
 * 
 * @example
 * // Créer une icône simple
 * const viewBtn = FrostedIcons.create('view', { 
 *   onClick: () => console.log('Voir'), 
 *   title: 'Voir les détails' 
 * });
 * 
 * // Créer un groupe d'actions
 * const actions = FrostedIcons.createActionGroup(['view', 'edit', 'delete'], {
 *   onView: () => console.log('Voir'),
 *   onEdit: () => console.log('Éditer'),
 *   onDelete: () => console.log('Supprimer')
 * });
 */

const FrostedIcons = (() => {
    
    // ========================================
    // DÉFINITION DES ICÔNES SVG
    // ========================================
    const ICONS = {
        // Actions principales
        view: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                   <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>`,
            defaultTitle: "Voir"
        },
        edit: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>`,
            defaultTitle: "Éditer"
        },
        delete: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>`,
            defaultTitle: "Supprimer"
        },
        
        // Navigation
        plus: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>`,
            defaultTitle: "Ajouter"
        },
        close: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>`,
            defaultTitle: "Fermer"
        },
        menu: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>`,
            defaultTitle: "Menu"
        },
        
        // Flèches
        arrowLeft: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path>`,
            defaultTitle: "Précédent"
        },
        arrowRight: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"></path>`,
            defaultTitle: "Suivant"
        },
        arrowUp: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"></path>`,
            defaultTitle: "Haut"
        },
        arrowDown: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>`,
            defaultTitle: "Bas"
        },
        
        // États et notifications
        check: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>`,
            defaultTitle: "Valider"
        },
        warning: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>`,
            defaultTitle: "Attention"
        },
        info: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
            defaultTitle: "Information"
        },
        
        // Documents et fichiers
        document: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>`,
            defaultTitle: "Document"
        },
        download: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>`,
            defaultTitle: "Télécharger"
        },
        upload: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>`,
            defaultTitle: "Téléverser"
        },
        
        // Communication
        mail: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>`,
            defaultTitle: "Email"
        },
        phone: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>`,
            defaultTitle: "Téléphone"
        },
        
        // Autres
        search: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>`,
            defaultTitle: "Rechercher"
        },
        settings: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>`,
            defaultTitle: "Paramètres"
        },
        print: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>`,
            defaultTitle: "Imprimer"
        },
        calendar: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>`,
            defaultTitle: "Calendrier"
        },
        clock: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`,
            defaultTitle: "Heure"
        },
        user: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>`,
            defaultTitle: "Utilisateur"
        },
        refresh: {
            viewBox: "0 0 24 24",
            path: `<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>`,
            defaultTitle: "Actualiser"
        }
    };

    // ========================================
    // CONFIGURATION DES COULEURS PAR TYPE
    // ========================================
    const COLORS = {
        view: '#3b82f6',      // Bleu
        edit: '#22c55e',      // Vert
        delete: '#ef4444',    // Rouge
        warning: '#f59e0b',   // Orange
        info: '#3b82f6',      // Bleu
        check: '#22c55e',     // Vert
        default: '#6b7280'    // Gris
    };

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Créer l'élément SVG pour une icône
     */
    function createSVG(iconName) {
        const icon = ICONS[iconName];
        if (!icon) {
            console.warn(`Icône "${iconName}" non trouvée`);
            return null;
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('viewBox', icon.viewBox);
        svg.innerHTML = icon.path;
        
        return svg;
    }

    /**
     * Obtenir la couleur pour une icône
     */
    function getColor(iconName) {
        return COLORS[iconName] || COLORS.default;
    }

    /**
     * Créer le bouton complet
     */
    function createButton(iconName, options = {}) {
        const {
            onClick,
            title,
            className = '',
            size = 'medium',
            disabled = false,
            id
        } = options;

        // Créer le bouton
        const button = document.createElement('button');
        button.className = `frosted-icon ${iconName} ${size} ${className}`.trim();
        
        if (id) button.id = id;
        if (disabled) button.disabled = true;
        
        // Titre (tooltip)
        const icon = ICONS[iconName];
        button.title = title || icon?.defaultTitle || iconName;
        
        // Gestionnaire de clic
        if (onClick && !disabled) {
            button.addEventListener('click', onClick);
        }

        // Ajouter l'icône SVG
        const svg = createSVG(iconName);
        if (svg) {
            button.appendChild(svg);
        }

        // Définir la couleur
        button.style.setProperty('--icon-color', getColor(iconName));

        return button;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    return {
        /**
         * Créer une icône unique
         * @param {string} iconName - Nom de l'icône
         * @param {Object} options - Options de configuration
         * @returns {HTMLElement} Bouton avec icône
         */
        create(iconName, options = {}) {
            return createButton(iconName, options);
        },

        /**
         * Créer un groupe d'actions (view, edit, delete)
         * @param {Array} icons - Liste des icônes à créer
         * @param {Object} handlers - Gestionnaires d'événements
         * @returns {HTMLElement} Container avec les icônes
         */
        createActionGroup(icons = ['view', 'edit', 'delete'], handlers = {}) {
            const container = document.createElement('div');
            container.className = 'frosted-icons-group';

            icons.forEach(iconName => {
                const handlerName = `on${iconName.charAt(0).toUpperCase()}${iconName.slice(1)}`;
                const button = this.create(iconName, {
                    onClick: handlers[handlerName] || handlers[iconName]
                });
                container.appendChild(button);
            });

            return container;
        },

        /**
         * Remplacer le contenu d'un élément par une icône
         * @param {HTMLElement|string} element - Élément ou sélecteur
         * @param {string} iconName - Nom de l'icône
         * @param {Object} options - Options
         */
        replace(element, iconName, options = {}) {
            const el = typeof element === 'string' 
                ? document.querySelector(element) 
                : element;
                
            if (!el) return;

            const button = this.create(iconName, options);
            el.replaceWith(button);
            return button;
        },

        /**
         * Injecter les styles CSS nécessaires
         * @param {boolean} force - Forcer la réinjection
         */
        injectStyles(force = false) {
            const styleId = 'frosted-icons-styles';
            
            if (!force && document.getElementById(styleId)) {
                return;
            }

            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = 'frosted-icons.css';
            document.head.appendChild(link);
        },

        /**
         * Obtenir la liste des icônes disponibles
         * @returns {Array} Noms des icônes
         */
        getAvailableIcons() {
            return Object.keys(ICONS);
        },

        /**
         * Ajouter une icône personnalisée
         * @param {string} name - Nom de l'icône
         * @param {Object} config - Configuration (viewBox, path, defaultTitle)
         * @param {string} color - Couleur optionnelle
         */
        addCustomIcon(name, config, color) {
            ICONS[name] = config;
            if (color) {
                COLORS[name] = color;
            }
        }
    };
})();

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrostedIcons;
}

// Export pour utilisation globale
window.FrostedIcons = FrostedIcons;