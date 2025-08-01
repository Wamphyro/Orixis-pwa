// ========================================
// BUTTON.COMPONENT.JS - Composant bouton unifié
// Chemin: src/components/ui/common/button.component.js
//
// DESCRIPTION:
// Composant bouton réutilisable avec glassmorphism
// Remplace toute la gestion de classes dispersée
//
// CRÉÉ le 02/02/2025:
// - Architecture unifiée pour tous les boutons
// - 100% indépendant
//
// API PUBLIQUE:
// - constructor(config)
// - setText(text)
// - setIcon(icon)
// - setLoading(loading)
// - setDisabled(disabled)
// - show()
// - hide()
// - focus()
// - click()
// - getElement()
// - updateConfig(config)
// - destroy()
//
// ÉVÉNEMENTS:
// - onClick: (event, button) => void
// - onMouseEnter: (event, button) => void
// - onMouseLeave: (event, button) => void
//
// EXEMPLE:
// const btn = new Button({
//     text: 'Valider',
//     variant: 'primary',
//     size: 'lg',
//     pill: true,
//     icon: '✓',
//     onClick: () => console.log('Cliqué!')
// });
// document.body.appendChild(btn.getElement());
// ========================================

export class Button {
    constructor(config = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'btn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            // Contenu
            text: '',
            icon: null,
            iconPosition: 'left', // 'left' ou 'right'
            
            // Apparence
            variant: 'primary', // primary, secondary, danger, success, warning, ghost
            size: 'md', // sm, md, lg
            shape: 'default', // default, pill, square, circle
            
            // États
            disabled: false,
            loading: false,
            active: false,
            
            // Comportement
            type: 'button', // button, submit, reset
            href: null, // Si défini, crée un <a> au lieu d'un <button>
            target: null, // Pour les liens
            
            // Classes additionnelles
            className: '',
            
            // Contexte
            context: 'dark', // dark, light (pour on-dark, on-light)
            
            // Événements
            onClick: null,
            onMouseEnter: null,
            onMouseLeave: null,
            onFocus: null,
            onBlur: null,
            
            ...config
        };
        
        // État interne
        this.state = {
            rendered: false,
            visible: true
        };
        
        // Élément DOM
        this.element = null;
        this.iconElement = null;
        this.textElement = null;
        this.loadingElement = null;
        
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
        
        this.state.rendered = true;
        console.log('✅ Button créé:', this.id);
    }
    
    loadStyles() {
        const styleId = 'button-component-styles';
        
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = '../../src/components/ui/common/button.css';
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // CRÉATION DU DOM
    // ========================================
    
    createElement() {
        // Créer l'élément principal (button ou a)
        if (this.config.href) {
            this.element = document.createElement('a');
            this.element.href = this.config.href;
            if (this.config.target) {
                this.element.target = this.config.target;
            }
        } else {
            this.element = document.createElement('button');
            this.element.type = this.config.type;
        }
        
        // ID et attributs de base
        this.element.id = this.id;
        
        // Structure interne
        this.createInnerStructure();
        
        // États initiaux
        if (this.config.disabled) {
            this.setDisabled(true);
        }
        
        if (this.config.loading) {
            this.setLoading(true);
        }
    }
    
    createInnerStructure() {
        // Conteneur interne pour flexbox
        const inner = document.createElement('span');
        inner.className = 'btn-inner';
        
        // Icône gauche
        if (this.config.icon && this.config.iconPosition === 'left') {
            this.iconElement = this.createIconElement();
            inner.appendChild(this.iconElement);
        }
        
        // Texte
        if (this.config.text) {
            this.textElement = document.createElement('span');
            this.textElement.className = 'btn-text';
            this.textElement.textContent = this.config.text;
            inner.appendChild(this.textElement);
        }
        
        // Icône droite
        if (this.config.icon && this.config.iconPosition === 'right') {
            this.iconElement = this.createIconElement();
            inner.appendChild(this.iconElement);
        }
        
        // Indicateur de chargement (caché par défaut)
        this.loadingElement = document.createElement('span');
        this.loadingElement.className = 'btn-loading';
        this.loadingElement.innerHTML = '<span class="btn-spinner"></span>';
        this.loadingElement.style.display = 'none';
        
        // Assembler
        this.element.appendChild(inner);
        this.element.appendChild(this.loadingElement);
    }
    
    createIconElement() {
        const icon = document.createElement('span');
        icon.className = 'btn-icon';
        
        // Si c'est une URL d'image
        if (this.config.icon.startsWith('http') || this.config.icon.startsWith('/')) {
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
        const classes = ['btn'];
        
        // Variante
        classes.push(`btn-${this.config.variant}`);
        
        // Taille
        if (this.config.size !== 'md') {
            classes.push(`btn-${this.config.size}`);
        }
        
        // Forme
        if (this.config.shape !== 'default') {
            classes.push(`btn-${this.config.shape}`);
        }
        
        // Contexte
        if (this.config.context === 'light') {
            classes.push('on-light');
        } else {
            classes.push('on-dark');
        }
        
        // États
        if (this.config.active) {
            classes.push('active');
        }
        
        if (this.config.loading) {
            classes.push('loading');
        }
        
        // Classes additionnelles
        if (this.config.className) {
            classes.push(...this.config.className.split(' '));
        }
        
        // Cas spéciaux
        if (this.config.variant === 'action') {
            classes.push('btn-action');
        }
        
        if (this.config.variant === 'export') {
            classes.push('btn-export');
        }
        
        if (this.config.variant === 'reset') {
            classes.push('btn-reset');
        }
        
        // Appliquer toutes les classes
        this.element.className = classes.join(' ');
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Click
        this.element.addEventListener('click', (e) => {
            if (this.config.disabled || this.config.loading) {
                e.preventDefault();
                return;
            }
            
            if (this.config.onClick) {
                this.config.onClick(e, this);
            }
        });
        
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
        
        // Focus/Blur
        if (this.config.onFocus) {
            this.element.addEventListener('focus', (e) => {
                this.config.onFocus(e, this);
            });
        }
        
        if (this.config.onBlur) {
            this.element.addEventListener('blur', (e) => {
                this.config.onBlur(e, this);
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
            this.textElement.className = 'btn-text';
            const inner = this.element.querySelector('.btn-inner');
            inner.appendChild(this.textElement);
        }
        
        this.textElement.textContent = text;
    }
    
    /**
     * Définir l'icône
     */
    setIcon(icon, position = 'left') {
        this.config.icon = icon;
        this.config.iconPosition = position;
        
        // Recréer la structure interne
        const inner = this.element.querySelector('.btn-inner');
        inner.innerHTML = '';
        
        // Reconstruire avec la nouvelle icône
        if (icon && position === 'left') {
            this.iconElement = this.createIconElement();
            inner.appendChild(this.iconElement);
        }
        
        if (this.textElement) {
            inner.appendChild(this.textElement);
        }
        
        if (icon && position === 'right') {
            this.iconElement = this.createIconElement();
            inner.appendChild(this.iconElement);
        }
    }
    
    /**
     * État loading
     */
    setLoading(loading) {
        this.config.loading = loading;
        
        if (loading) {
            this.element.classList.add('loading');
            this.loadingElement.style.display = '';
            this.element.disabled = true;
        } else {
            this.element.classList.remove('loading');
            this.loadingElement.style.display = 'none';
            this.element.disabled = this.config.disabled;
        }
    }
    
    /**
     * État disabled
     */
    setDisabled(disabled) {
        this.config.disabled = disabled;
        
        if (this.element.tagName === 'BUTTON') {
            this.element.disabled = disabled;
        } else {
            // Pour les liens
            if (disabled) {
                this.element.classList.add('disabled');
                this.element.style.pointerEvents = 'none';
            } else {
                this.element.classList.remove('disabled');
                this.element.style.pointerEvents = '';
            }
        }
    }
    
    /**
     * Afficher
     */
    show() {
        this.element.style.display = '';
        this.state.visible = true;
    }
    
    /**
     * Masquer
     */
    hide() {
        this.element.style.display = 'none';
        this.state.visible = false;
    }
    
    /**
     * Focus
     */
    focus() {
        this.element.focus();
    }
    
    /**
     * Simuler un clic
     */
    click() {
        if (!this.config.disabled && !this.config.loading) {
            this.element.click();
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
        this.updateAppearance();
    }
    
    /**
     * Obtenir l'état
     */
    getState() {
        return {
            ...this.state,
            disabled: this.config.disabled,
            loading: this.config.loading,
            visible: this.state.visible
        };
    }
    
    /**
     * Détruire
     */
    destroy() {
        // Retirer du DOM si présent
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Nettoyer
        this.element = null;
        this.iconElement = null;
        this.textElement = null;
        this.loadingElement = null;
        
        console.log('🧹 Button détruit:', this.id);
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Créer un bouton rapidement
 */
export function createButton(text, variant = 'primary', onClick = null) {
    return new Button({
        text,
        variant,
        onClick
    });
}

/**
 * Créer un groupe de boutons
 */
export class ButtonGroup {
    constructor(config = {}) {
        this.config = {
            buttons: [],
            gap: '8px',
            vertical: false,
            className: '',
            ...config
        };
        
        this.container = document.createElement('div');
        this.container.className = `btn-group ${this.config.vertical ? 'btn-group-vertical' : ''} ${this.config.className}`;
        this.container.style.gap = this.config.gap;
        
        this.buttons = [];
        
        // Créer les boutons
        this.config.buttons.forEach(btnConfig => {
            const btn = new Button(btnConfig);
            this.buttons.push(btn);
            this.container.appendChild(btn.getElement());
        });
    }
    
    getElement() {
        return this.container;
    }
    
    getButtons() {
        return this.buttons;
    }
    
    destroy() {
        this.buttons.forEach(btn => btn.destroy());
        this.container.remove();
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export { Button };
export default Button;