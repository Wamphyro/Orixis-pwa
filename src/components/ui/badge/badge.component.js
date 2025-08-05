// ========================================
// BADGE.COMPONENT.JS - Composant badge réutilisable
// Chemin: src/components/ui/badge/badge.component.js
//
// DESCRIPTION:
// Badge avec gestion dynamique des tailles et types
// Composant 100% indépendant pour harmonisation
//
// API PUBLIQUE:
// - constructor(config)
// - setText(text)
// - setType(type)
// - setSize(size)
// - update(config)
// - getElement()
// - destroy()
//
// CALLBACKS:
// - onClick: (event) => void
//
// EXEMPLE:
// const badge = new Badge({
//     text: 'Urgent',
//     type: 'danger',
//     size: 'table',
//     icon: '🔥'
// });
// ========================================

export class Badge {
    constructor(config) {
        // ID unique
        this.id = 'badge-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            text: '',
            type: 'default',      // default, primary, success, danger, warning, info, status-*
            size: 'md',           // sm, md, lg, table
            icon: null,           // Emoji ou icône optionnelle
            pill: true,           // Coins arrondis
            outline: false,       // Style outline
            animated: false,      // Animation pulse
            container: null,      // Conteneur DOM ou créer inline
            className: '',        // Classes CSS additionnelles
            tooltip: null,        // Texte de tooltip optionnel
            
            // Callbacks
            onClick: null,
            
            ...config
        };
        
        // État
        this.element = null;
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        // Charger les styles
        this.loadStyles();
        
        // Créer l'élément
        this.createElement();
        
        // Rendre
        this.render();
        
        // Attacher les événements
        this.attachEvents();
    }
    
    loadStyles() {
        const styleId = 'badge-styles';
        
        if (!document.getElementById(styleId)) {
            // ✅ MÊME SYNTAXE QUE LES AUTRES COMPOSANTS
            const componentUrl = new URL(import.meta.url).href;
            const cssUrl = componentUrl.replace('.js', '.css');
            
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = cssUrl;
            document.head.appendChild(link);
            
            console.log('📦 Badge styles chargés depuis:', cssUrl);
        }
    }
    
    createElement() {
        this.element = document.createElement('span');
        this.element.id = this.id;
        this.updateClasses();
        
        // Si tooltip, ajouter wrapper
        if (this.config.tooltip) {
            const wrapper = document.createElement('span');
            wrapper.className = 'badge-wrapper';
            wrapper.appendChild(this.element);
            
            const tooltip = document.createElement('span');
            tooltip.className = 'badge-tooltip';
            tooltip.textContent = this.config.tooltip;
            wrapper.appendChild(tooltip);
            
            this.wrapper = wrapper;
        }
    }
    
    updateClasses() {
        const classes = ['badge'];
        
        // Type
        if (this.config.type !== 'default') {
            classes.push(`badge-${this.config.type}`);
        }
        
        // Taille
        classes.push(`badge-${this.config.size}`);
        
        // Options
        if (this.config.pill) classes.push('badge-pill');
        if (this.config.outline) classes.push('badge-outline');
        if (this.config.animated) classes.push('badge-pulse');
        
        // Classes custom
        if (this.config.className) {
            classes.push(this.config.className);
        }
        
        this.element.className = classes.join(' ');
    }
    
    // ========================================
    // RENDU
    // ========================================
    
    render() {
        // Contenu
        let content = '';
        
        if (this.config.icon) {
            content += `<span class="badge-icon">${this.config.icon}</span>`;
        }
        
        if (this.config.text) {
            content += `<span class="badge-text">${this.config.text}</span>`;
        }
        
        this.element.innerHTML = content;
        
        // Insérer dans le DOM
        if (this.config.container) {
            const container = typeof this.config.container === 'string' 
                ? document.querySelector(this.config.container)
                : this.config.container;
                
            if (container) {
                container.appendChild(this.wrapper || this.element);
            }
        }
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        if (this.config.onClick) {
            this.element.style.cursor = 'pointer';
            this.element.addEventListener('click', (e) => {
                this.config.onClick(e);
            });
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    setText(text) {
        this.config.text = text;
        this.render();
    }
    
    setType(type) {
        this.config.type = type;
        this.updateClasses();
    }
    
    setSize(size) {
        this.config.size = size;
        this.updateClasses();
    }
    
    update(config) {
        this.config = { ...this.config, ...config };
        this.updateClasses();
        this.render();
    }
    
    getElement() {
        return this.wrapper || this.element;
    }
    
    toString() {
        // Pour utilisation dans innerHTML
        return (this.wrapper || this.element).outerHTML;
    }
    
    destroy() {
        if (this.wrapper || this.element) {
            (this.wrapper || this.element).remove();
        }
    }
}

// ========================================
// FACTORY HELPERS
// ========================================

// Factory pour badges de statut
export function createStatusBadge(status, options = {}) {
    const statusConfig = {
        nouvelle: { text: 'Nouvelle', type: 'status-nouvelle', icon: '🆕' },
        preparation: { text: 'En préparation', type: 'status-preparation', icon: '⚙️' },
        terminee: { text: 'Terminée', type: 'status-terminee', icon: '✅' },
        expediee: { text: 'Expédiée', type: 'status-expediee', icon: '📦' },
        receptionnee: { text: 'Réceptionnée', type: 'status-receptionnee', icon: '📥' },
        livree: { text: 'Livrée', type: 'status-livree', icon: '✅' },
        annulee: { text: 'Annulée', type: 'status-annulee', icon: '❌' }
    };
    
    const config = statusConfig[status] || { text: status, type: 'default' };
    
    return new Badge({
        ...config,
        ...options
    });
}

// Factory pour badges d'urgence
export function createUrgenceBadge(urgence, options = {}) {
    const urgenceConfig = {
        normal: { text: 'Normal', type: 'urgence-normal', icon: '🕐' },
        urgent: { text: 'Urgent', type: 'urgence-urgent', icon: '⚡' },
        tres_urgent: { text: 'Très urgent', type: 'urgence-tres-urgent', icon: '🔥' }
    };
    
    const config = urgenceConfig[urgence] || { text: urgence, type: 'default' };
    
    return new Badge({
        ...config,
        ...options
    });
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default Badge;