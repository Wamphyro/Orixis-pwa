// ========================================
// BADGE.COMPONENT.JS - Composant badge unifié
// Chemin: src/components/ui/badge/badge.component.js
//
// DESCRIPTION:
// Composant badge réutilisable avec style soft
// 100% indépendant, aucune dépendance externe
//
// CRÉÉ le 06/02/2025:
// - Architecture unifiée pour tous les badges
// - Style soft avec variantes couleur
// - Tailles multiples (sm, md, lg)
//
// API PUBLIQUE:
// - constructor(config)
// - setText(text)
// - setColor(color)
// - setSize(size)
// - setIcon(icon)
// - show()
// - hide()
// - pulse()
// - stopPulse()
// - getElement()
// - updateConfig(config)
// - destroy()
//
// ÉVÉNEMENTS:
// - onClick: (event, badge) => void
// - onClose: (event, badge) => void
// - onMouseEnter: (event, badge) => void
// - onMouseLeave: (event, badge) => void
//
// EXEMPLE:
// const badge = new Badge({
//     text: 'Nouveau',
//     color: 'blue',
//     size: 'md',
//     icon: '✨',
//     closable: true,
//     onClick: () => console.log('Badge cliqué!')
// });
// document.body.appendChild(badge.getElement());
// ========================================

export class Badge {
    constructor(config = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'badge-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            // Contenu
            text: '',
            icon: null,
            iconPosition: 'left', // 'left' ou 'right'
            
            // Apparence
            color: 'gray', // blue, green, red, yellow, purple, orange, pink, gray
            size: 'md', // sm, md, lg
            shape: 'default', // default, pill, square, circle
            
            // Options
            closable: false, // Afficher bouton de fermeture
            dot: false, // Afficher un point indicateur
            pulse: false, // Animation pulsation
            clickable: false, // Badge cliquable
            outline: false, // Style outline
            shadow: false, // Avec ombre
            
            // États
            disabled: false,
            visible: true,
            
            // Contexte
            context: null, // null, 'dark', 'light'
            
            // Position
            container: null, // Sélecteur ou élément DOM
            inline: false, // Pour insertion dans du texte
            fixed: false, // Position absolute
            
            // Classes additionnelles
            className: '',
            
            // Événements
            onClick: null,
            onClose: null,
            onMouseEnter: null,
            onMouseLeave: null,
            
            ...config
        };
        
        // État interne
        this.state = {
            rendered: false,
            visible: true,
            pulsing: false
        };
        
        // Éléments DOM
        this.element = null;
        this.iconElement = null;
        this.textElement = null;
        this.closeElement = null;
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        // Charger les styles une seule fois
        this.loadStyles();
        
        // Créer l'élément
        this.createElement();
        
        // Mettre à jour l'apparence
        this.updateAppearance();
        
        // Attacher les événements
        this.attachEvents();
        
        // Ajouter au container si spécifié
        if (this.config.container) {
            this.appendToContainer();
        }
        
        this.state.rendered = true;
        console.log('✅ Badge créé:', this.id);
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('badge-styles')) {
            return;
        }
        
        // ✅ NOUVELLE MÉTHODE : Chemin dynamique basé sur l'emplacement du JS
        const componentUrl = new URL(import.meta.url).href;
        const cssUrl = componentUrl.replace('.js', '.css');
        
        const link = document.createElement('link');
        link.id = 'badge-styles';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        
        console.log('📦 Badge styles chargés depuis:', cssUrl);
    }
    
    // ========================================
    // CRÉATION DU DOM
    // ========================================
    
    createElement() {
        // Créer l'élément principal
        this.element = document.createElement('span');
        this.element.id = this.id;
        
        // Structure interne
        this.createInnerStructure();
        
        // États initiaux
        if (!this.config.visible) {
            this.hide();
        }
        
        if (this.config.disabled) {
            this.setDisabled(true);
        }
        
        if (this.config.pulse) {
            this.pulse();
        }
    }
    
    createInnerStructure() {
        // Vider l'élément
        this.element.innerHTML = '';
        
        // Icône gauche
        if (this.config.icon && this.config.iconPosition === 'left') {
            this.iconElement = this.createIconElement();
            this.element.appendChild(this.iconElement);
        }
        
        // Texte
        if (this.config.text) {
            this.textElement = document.createElement('span');
            this.textElement.className = 'badge-text';
            this.textElement.textContent = this.config.text;
            this.element.appendChild(this.textElement);
        }
        
        // Icône droite
        if (this.config.icon && this.config.iconPosition === 'right') {
            this.iconElement = this.createIconElement();
            this.element.appendChild(this.iconElement);
        }
        
        // Bouton de fermeture
        if (this.config.closable) {
            this.closeElement = document.createElement('span');
            this.closeElement.className = 'badge-close';
            this.closeElement.innerHTML = '×';
            this.closeElement.setAttribute('role', 'button');
            this.closeElement.setAttribute('aria-label', 'Fermer');
            this.element.appendChild(this.closeElement);
        }
    }
    
    createIconElement() {
        const icon = document.createElement('span');
        icon.className = 'badge-icon';
        
        // Si c'est une URL d'image
        if (typeof this.config.icon === 'string' && 
            (this.config.icon.startsWith('http') || this.config.icon.startsWith('/'))) {
            const img = document.createElement('img');
            img.src = this.config.icon;
            img.alt = '';
            icon.appendChild(img);
        } else {
            // Sinon, texte/emoji/HTML
            icon.innerHTML = this.config.icon;
        }
        
        return icon;
    }
    
    // ========================================
    // MISE À JOUR DE L'APPARENCE
    // ========================================
    
    updateAppearance() {
        const classes = ['badge'];
        
        // Couleur
        if (this.config.color) {
            classes.push(`badge-${this.config.color}`);
        }
        
        // Taille
        if (this.config.size !== 'md') {
            classes.push(`badge-${this.config.size}`);
        }
        
        // Forme
        if (this.config.shape !== 'default') {
            classes.push(`badge-${this.config.shape}`);
        }
        
        // Contexte
        if (this.config.context === 'dark') {
            classes.push('on-dark');
        } else if (this.config.context === 'light') {
            classes.push('on-light');
        }
        
        // Options
        if (this.config.clickable) {
            classes.push('clickable');
        }
        
        if (this.config.dot) {
            classes.push('badge-dot');
        }
        
        if (this.config.outline) {
            classes.push('badge-outline');
        }
        
        if (this.config.shadow) {
            classes.push('badge-shadow');
        }
        
        if (this.config.inline) {
            classes.push('badge-inline');
        }
        
        if (this.config.fixed) {
            classes.push('badge-fixed');
        }
        
        // États
        if (this.config.disabled) {
            classes.push('disabled');
        }
        
        if (this.state.pulsing) {
            classes.push('badge-pulse');
        }
        
        // Classes additionnelles
        if (this.config.className) {
            classes.push(...this.config.className.split(' '));
        }
        
        // Appliquer toutes les classes
        this.element.className = classes.join(' ');
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Click sur le badge
        if (this.config.clickable || this.config.onClick) {
            this.element.style.cursor = 'pointer';
            this.element.addEventListener('click', (e) => {
                if (this.config.disabled) {
                    e.preventDefault();
                    return;
                }
                
                // Ne pas déclencher si c'est le bouton de fermeture
                if (e.target === this.closeElement) {
                    return;
                }
                
                if (this.config.onClick) {
                    this.config.onClick(e, this);
                }
            });
        }
        
        // Bouton de fermeture
        if (this.closeElement) {
            this.closeElement.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (this.config.onClose) {
                    this.config.onClose(e, this);
                } else {
                    // Par défaut, supprimer le badge
                    this.destroy();
                }
            });
        }
        
        // Mouse events
        if (this.config.onMouseEnter) {
            this.element.addEventListener('mouseenter', (e) => {
                this.config.onMouseEnter(e, this);
            });
        }
        
        if (this.config.onMouseLeave) {
            this.element.addEventListener('mouseleave', (e) => {
                this.config.onMouseLeave(e, this);
            });
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Définir le texte
     */
    setText(text) {
        this.config.text = text;
        
        if (!this.textElement) {
            // Créer l'élément texte s'il n'existe pas
            this.textElement = document.createElement('span');
            this.textElement.className = 'badge-text';
            
            // L'insérer après l'icône ou au début
            if (this.iconElement && this.config.iconPosition === 'left') {
                this.iconElement.after(this.textElement);
            } else {
                this.element.prepend(this.textElement);
            }
        }
        
        this.textElement.textContent = text;
    }
    
    /**
     * Définir la couleur
     */
    setColor(color) {
        // Retirer l'ancienne couleur
        if (this.config.color) {
            this.element.classList.remove(`badge-${this.config.color}`);
        }
        
        // Appliquer la nouvelle couleur
        this.config.color = color;
        this.element.classList.add(`badge-${color}`);
    }
    
    /**
     * Définir la taille
     */
    setSize(size) {
        // Retirer l'ancienne taille
        if (this.config.size !== 'md') {
            this.element.classList.remove(`badge-${this.config.size}`);
        }
        
        // Appliquer la nouvelle taille
        this.config.size = size;
        if (size !== 'md') {
            this.element.classList.add(`badge-${size}`);
        }
    }
    
    /**
     * Définir l'icône
     */
    setIcon(icon, position = 'left') {
        this.config.icon = icon;
        this.config.iconPosition = position;
        
        // Recréer la structure interne
        this.createInnerStructure();
    }
    
    /**
     * Afficher
     */
    show() {
        this.element.style.display = '';
        this.element.classList.add('badge-appear');
        setTimeout(() => {
            this.element.classList.remove('badge-appear');
        }, 300);
        this.state.visible = true;
        this.config.visible = true;
    }
    
    /**
     * Masquer
     */
    hide() {
        this.element.classList.add('badge-disappear');
        setTimeout(() => {
            this.element.style.display = 'none';
            this.element.classList.remove('badge-disappear');
        }, 300);
        this.state.visible = false;
        this.config.visible = false;
    }
    
    /**
     * Activer la pulsation
     */
    pulse() {
        this.element.classList.add('badge-pulse');
        this.state.pulsing = true;
    }
    
    /**
     * Arrêter la pulsation
     */
    stopPulse() {
        this.element.classList.remove('badge-pulse');
        this.state.pulsing = false;
    }
    
    /**
     * État disabled
     */
    setDisabled(disabled) {
        this.config.disabled = disabled;
        
        if (disabled) {
            this.element.classList.add('disabled');
        } else {
            this.element.classList.remove('disabled');
        }
    }
    
    /**
     * Obtenir l'élément DOM
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Mettre à jour la configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Recréer la structure si nécessaire
        if (newConfig.text !== undefined || 
            newConfig.icon !== undefined || 
            newConfig.closable !== undefined) {
            this.createInnerStructure();
        }
        
        // Mettre à jour l'apparence
        this.updateAppearance();
        
        // Réattacher les événements si nécessaire
        if (newConfig.onClick || newConfig.onClose) {
            this.attachEvents();
        }
    }
    
    /**
     * Obtenir l'état
     */
    getState() {
        return {
            ...this.state,
            disabled: this.config.disabled,
            visible: this.state.visible,
            color: this.config.color,
            size: this.config.size
        };
    }
    
    /**
     * Ajouter au container
     */
    appendToContainer() {
        const container = typeof this.config.container === 'string' 
            ? document.querySelector(this.config.container)
            : this.config.container;
            
        if (container) {
            container.appendChild(this.element);
        }
    }
    
    /**
     * Détruire
     */
    destroy() {
        // Animation de disparition
        if (this.state.visible) {
            this.hide();
            setTimeout(() => {
                this.removeFromDOM();
            }, 300);
        } else {
            this.removeFromDOM();
        }
    }
    
    /**
     * Retirer du DOM
     */
    removeFromDOM() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Nettoyer
        this.element = null;
        this.iconElement = null;
        this.textElement = null;
        this.closeElement = null;
        
        console.log('🧹 Badge détruit:', this.id);
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Créer un badge rapidement
 */
export function createBadge(text, color = 'gray', options = {}) {
    return new Badge({
        text,
        color,
        ...options
    });
}

/**
 * Créer un badge de statut
 */
export function createStatusBadge(status) {
    const statusConfig = {
        'active': { text: 'Actif', color: 'green', icon: '●' },
        'inactive': { text: 'Inactif', color: 'gray', icon: '○' },
        'pending': { text: 'En attente', color: 'yellow', icon: '◐' },
        'error': { text: 'Erreur', color: 'red', icon: '⚠' },
        'success': { text: 'Succès', color: 'green', icon: '✓' },
        'warning': { text: 'Attention', color: 'orange', icon: '!' },
        'info': { text: 'Info', color: 'blue', icon: 'ℹ' },
        'new': { text: 'Nouveau', color: 'purple', icon: '✨' }
    };
    
    const config = statusConfig[status] || statusConfig['info'];
    
    return new Badge({
        ...config,
        size: 'sm',
        pill: true
    });
}

/**
 * Créer un groupe de badges
 */
export class BadgeGroup {
    constructor(config = {}) {
        this.config = {
            badges: [],
            gap: '6px',
            vertical: false,
            className: '',
            container: null,
            ...config
        };
        
        this.container = document.createElement('div');
        this.container.className = `badge-group ${this.config.vertical ? 'badge-group-vertical' : ''} ${this.config.className}`;
        this.container.style.gap = this.config.gap;
        
        this.badges = [];
        
        // Créer les badges
        this.config.badges.forEach(badgeConfig => {
            const badge = new Badge(badgeConfig);
            this.badges.push(badge);
            this.container.appendChild(badge.getElement());
        });
        
        // Ajouter au container si spécifié
        if (this.config.container) {
            const targetContainer = typeof this.config.container === 'string'
                ? document.querySelector(this.config.container)
                : this.config.container;
                
            if (targetContainer) {
                targetContainer.appendChild(this.container);
            }
        }
    }
    
    getElement() {
        return this.container;
    }
    
    getBadges() {
        return this.badges;
    }
    
    addBadge(badgeConfig) {
        const badge = new Badge(badgeConfig);
        this.badges.push(badge);
        this.container.appendChild(badge.getElement());
        return badge;
    }
    
    removeBadge(badge) {
        const index = this.badges.indexOf(badge);
        if (index > -1) {
            this.badges.splice(index, 1);
            badge.destroy();
        }
    }
    
    clear() {
        this.badges.forEach(badge => badge.destroy());
        this.badges = [];
    }
    
    destroy() {
        this.clear();
        this.container.remove();
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default Badge;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [06/02/2025] - Création initiale
   Solution: Architecture calquée sur Button
   Impact: Composant 100% indépendant
   
   NOTES POUR REPRISES FUTURES:
   - CSS auto-chargé avec ID unique
   - Callbacks optionnels pour tous les événements
   - Animations d'apparition/disparition
   - Support des badges dans du texte (inline)
   ======================================== */