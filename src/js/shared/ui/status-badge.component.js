// ========================================
// STATUS BADGE COMPONENT
// Composant de badges/pills pour statuts et labels
// Version: 1.0.0
// ========================================

/**
 * Composant StatusBadge
 * Génère des badges colorés pour afficher des statuts, urgences, etc.
 * 
 * @example
 * // Badge simple
 * const badge = StatusBadge.create('success', 'Livré');
 * 
 * // Badge avec icône
 * const urgentBadge = StatusBadge.create('warning', 'Urgent', { icon: '🟡' });
 * 
 * // Badge pour statut de commande
 * const statusBadge = StatusBadge.createStatus('preparation', 'En préparation');
 */

const StatusBadge = (() => {
    
    // ========================================
    // CONFIGURATION DES THÈMES
    // ========================================
    const THEMES = {
        // Statuts de commande
        nouvelle: {
            background: 'rgba(156, 163, 175, 0.1)',
            color: '#6b7280',
            border: 'rgba(156, 163, 175, 0.2)',
            icon: '🆕'
        },
        preparation: {
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.2)',
            icon: '🔵'
        },
        terminee: {
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            border: 'rgba(34, 197, 94, 0.2)',
            icon: '✅'
        },
        expediee: {
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#a855f7',
            border: 'rgba(168, 85, 247, 0.2)',
            icon: '📦'
        },
        receptionnee: {
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.2)',
            icon: '📥'
        },
        livree: {
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            border: 'rgba(34, 197, 94, 0.2)',
            icon: '✅'
        },
        annulee: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: 'rgba(239, 68, 68, 0.2)',
            icon: '❌'
        },
        
        // Niveaux d'urgence
        normal: {
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            border: 'rgba(34, 197, 94, 0.2)',
            textColor: '#166534'
        },
        urgent: {
            background: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            border: 'rgba(251, 191, 36, 0.2)',
            textColor: '#92400e',
            icon: '🟡'
        },
        tres_urgent: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: 'rgba(239, 68, 68, 0.2)',
            textColor: '#991b1b',
            icon: '🔴'
        },
        
        // Types génériques
        primary: {
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.2)'
        },
        secondary: {
            background: 'rgba(107, 114, 128, 0.1)',
            color: '#6b7280',
            border: 'rgba(107, 114, 128, 0.2)'
        },
        success: {
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#22c55e',
            border: 'rgba(34, 197, 94, 0.2)'
        },
        warning: {
            background: 'rgba(251, 191, 36, 0.1)',
            color: '#fbbf24',
            border: 'rgba(251, 191, 36, 0.2)'
        },
        danger: {
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: 'rgba(239, 68, 68, 0.2)'
        },
        info: {
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#3b82f6',
            border: 'rgba(59, 130, 246, 0.2)'
        },
        light: {
            background: 'rgba(249, 250, 251, 0.9)',
            color: '#6b7280',
            border: 'rgba(229, 231, 235, 0.8)'
        },
        dark: {
            background: 'rgba(31, 41, 55, 0.9)',
            color: '#e5e7eb',
            border: 'rgba(75, 85, 99, 0.8)'
        }
    };
    
    // Mapping des statuts français
    const STATUS_MAPPING = {
        'nouvelle': 'nouvelle',
        'en préparation': 'preparation',
        'préparée': 'terminee',
        'expédiée': 'expediee',
        'réceptionnée': 'receptionnee',
        'livrée': 'livree',
        'annulée': 'annulee'
    };
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Normaliser le nom du thème
     */
    function normalizeTheme(theme) {
        // Convertir en minuscules et remplacer les espaces par des underscores
        const normalized = theme.toLowerCase().replace(/\s+/g, '_');
        
        // Vérifier le mapping des statuts
        if (STATUS_MAPPING[normalized]) {
            return STATUS_MAPPING[normalized];
        }
        
        return normalized;
    }
    
    /**
     * Créer l'élément badge
     */
    function createBadgeElement(theme, text, options = {}) {
        const {
            icon,
            size = 'medium',
            className = '',
            animated = false,
            clickable = false,
            onClick,
            tooltip,
            id
        } = options;
        
        // Normaliser le thème
        const normalizedTheme = normalizeTheme(theme);
        const themeConfig = THEMES[normalizedTheme] || THEMES.secondary;
        
        // Créer l'élément
        const element = clickable ? 'button' : 'span';
        const badge = document.createElement(element);
        
        // Classes
        badge.className = `status-badge ${normalizedTheme} ${size} ${className}`.trim();
        if (animated) badge.classList.add('animated');
        if (clickable) badge.classList.add('clickable');
        
        // Attributs
        if (id) badge.id = id;
        if (tooltip) badge.title = tooltip;
        
        // Styles personnalisés basés sur le thème
        badge.style.setProperty('--badge-bg', themeConfig.background);
        badge.style.setProperty('--badge-color', themeConfig.textColor || themeConfig.color);
        badge.style.setProperty('--badge-border', themeConfig.border);
        
        // Contenu
        let content = '';
        
        // Icône (depuis options ou thème)
        const displayIcon = icon || themeConfig.icon;
        if (displayIcon) {
            content += `<span class="badge-icon">${displayIcon}</span>`;
        }
        
        // Texte
        content += `<span class="badge-text">${text}</span>`;
        
        badge.innerHTML = content;
        
        // Gestionnaire de clic
        if (clickable && onClick) {
            badge.addEventListener('click', onClick);
        }
        
        return badge;
    }
    
    /**
     * Déterminer automatiquement le thème pour un statut
     */
    function getThemeForStatus(status) {
        const normalized = status.toLowerCase();
        
        // Vérifier le mapping
        if (STATUS_MAPPING[normalized]) {
            return STATUS_MAPPING[normalized];
        }
        
        // Vérifier les thèmes directs
        if (THEMES[normalized]) {
            return normalized;
        }
        
        // Par défaut
        return 'secondary';
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    return {
        /**
         * Créer un badge simple
         * @param {string} theme - Thème du badge
         * @param {string} text - Texte à afficher
         * @param {Object} options - Options de configuration
         * @returns {HTMLElement} Element badge
         */
        create(theme, text, options = {}) {
            return createBadgeElement(theme, text, options);
        },
        
        /**
         * Créer un badge de statut (détection automatique du thème)
         * @param {string} status - Statut de la commande
         * @param {string} text - Texte à afficher (optionnel)
         * @param {Object} options - Options
         * @returns {HTMLElement} Badge de statut
         */
        createStatus(status, text = null, options = {}) {
            const theme = getThemeForStatus(status);
            const displayText = text || status;
            return createBadgeElement(theme, displayText, options);
        },
        
        /**
         * Créer un badge d'urgence
         * @param {string} level - Niveau d'urgence (normal, urgent, tres_urgent)
         * @param {Object} options - Options
         * @returns {HTMLElement} Badge d'urgence
         */
        createUrgency(level, options = {}) {
            const levelMap = {
                'normal': { text: 'Normal', theme: 'normal' },
                'urgent': { text: 'Urgent', theme: 'urgent' },
                'tres_urgent': { text: 'Très urgent', theme: 'tres_urgent' }
            };
            
            const config = levelMap[level] || levelMap.normal;
            return createBadgeElement(config.theme, config.text, options);
        },
        
        /**
         * Créer un groupe de badges
         * @param {Array} badges - Liste des badges à créer
         * @returns {HTMLElement} Container avec les badges
         */
        createGroup(badges) {
            const container = document.createElement('div');
            container.className = 'status-badge-group';
            
            badges.forEach(badgeConfig => {
                const { theme, text, ...options } = badgeConfig;
                const badge = this.create(theme, text, options);
                container.appendChild(badge);
            });
            
            return container;
        },
        
        /**
         * Remplacer le contenu d'un élément par un badge
         * @param {HTMLElement|string} element - Élément ou sélecteur
         * @param {string} theme - Thème
         * @param {string} text - Texte
         * @param {Object} options - Options
         */
        replace(element, theme, text, options = {}) {
            const el = typeof element === 'string' 
                ? document.querySelector(element) 
                : element;
                
            if (!el) return;
            
            const badge = this.create(theme, text, options);
            el.replaceWith(badge);
            return badge;
        },
        
        /**
         * Mettre à jour un badge existant
         * @param {HTMLElement|string} badge - Badge ou sélecteur
         * @param {Object} updates - Mises à jour
         */
        update(badge, updates) {
            const el = typeof badge === 'string' 
                ? document.querySelector(badge) 
                : badge;
                
            if (!el || !el.classList.contains('status-badge')) return;
            
            const { theme, text, icon } = updates;
            
            if (theme) {
                // Retirer l'ancien thème
                Object.keys(THEMES).forEach(t => el.classList.remove(t));
                // Ajouter le nouveau
                el.classList.add(normalizeTheme(theme));
                
                // Mettre à jour les styles
                const themeConfig = THEMES[normalizeTheme(theme)] || THEMES.secondary;
                el.style.setProperty('--badge-bg', themeConfig.background);
                el.style.setProperty('--badge-color', themeConfig.textColor || themeConfig.color);
                el.style.setProperty('--badge-border', themeConfig.border);
            }
            
            if (text) {
                const textEl = el.querySelector('.badge-text');
                if (textEl) textEl.textContent = text;
            }
            
            if (icon !== undefined) {
                const iconEl = el.querySelector('.badge-icon');
                if (icon) {
                    if (iconEl) {
                        iconEl.textContent = icon;
                    } else {
                        const newIcon = document.createElement('span');
                        newIcon.className = 'badge-icon';
                        newIcon.textContent = icon;
                        el.insertBefore(newIcon, el.firstChild);
                    }
                } else if (iconEl) {
                    iconEl.remove();
                }
            }
        },
        
        /**
         * Injecter les styles CSS
         */
        injectStyles(force = false) {
            const styleId = 'status-badge-styles';
            
            if (!force && document.getElementById(styleId)) {
                return;
            }
            
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/status-badge.css';
            document.head.appendChild(link);
        },
        
        /**
         * Ajouter un thème personnalisé
         */
        addCustomTheme(name, config) {
            THEMES[name] = config;
        }
    };
})();

// Export pour modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusBadge;
}

// Export pour utilisation globale
window.StatusBadge = StatusBadge;