// ========================================
// TOOLTIP.COMPONENT.JS - Infobulles élégantes et flexibles
// Chemin: src/components/ui/tooltip/tooltip.component.js
//
// DESCRIPTION:
// Système de tooltips modernes et personnalisables
// Support des positions multiples et du contenu HTML
// 100% autonome et réutilisable
//
// API PUBLIQUE:
// - new Tooltip(element, options)
// - attach(selector, options)
// - show()
// - hide()
// - update(content)
// - destroy()
//
// EXEMPLE:
// const tooltip = new Tooltip('#myElement', {
//     content: 'Aide contextuelle',
//     position: 'top',
//     theme: 'dark'
// });
// ========================================

export class Tooltip {
    constructor(element, options = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'tooltip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Élément cible
        this.element = typeof element === 'string' ? 
            document.querySelector(element) : element;
            
        if (!this.element) {
            console.error('❌ Tooltip: élément cible non trouvé');
            return;
        }
        
        // Configuration par défaut
        this.options = {
            content: '',
            position: 'top', // top, bottom, left, right, auto
            theme: 'dark', // dark, light, primary, success, warning, error
            delay: 0, // Délai avant affichage (ms)
            hideDelay: 0, // Délai avant masquage (ms)
            arrow: true, // Afficher la flèche
            html: false, // Permettre le HTML dans le contenu
            trigger: 'hover', // hover, click, focus, manual
            container: document.body, // Conteneur du tooltip
            offset: 5, // Distance de l'élément
            maxWidth: 250, // Largeur maximale
            zIndex: 9999,
            animation: 'fade', // fade, scale, none
            ...options
        };
        
        // État
        this.isVisible = false;
        this.tooltipElement = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        
        // Initialiser
        this.init();
        
        console.log('✅ Tooltip créé:', this.id);
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        // Créer l'élément tooltip
        this.createTooltipElement();
        
        // Charger les styles
        this.loadStyles();
        
        // Attacher les événements selon le trigger
        this.attachEvents();
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('tooltip-styles')) {
            return;
        }
        
        // Créer le lien vers le fichier CSS
        const link = document.createElement('link');
        link.id = 'tooltip-styles';
        link.rel = 'stylesheet';
        link.href = '/src/components/ui/tooltip/tooltip.css';
        document.head.appendChild(link);
        
        console.log('📦 Tooltip styles chargés');
    }
    
    createTooltipElement() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = this.id;
        this.tooltipElement.className = `tooltip tooltip-${this.options.theme}`;
        
        // Structure interne
        this.tooltipElement.innerHTML = `
            <div class="tooltip-content"></div>
            ${this.options.arrow ? '<div class="tooltip-arrow"></div>' : ''}
        `;
        
        // Style initial
        Object.assign(this.tooltipElement.style, {
            position: 'absolute',
            maxWidth: this.options.maxWidth + 'px',
            zIndex: this.options.zIndex,
            opacity: '0',
            visibility: 'hidden',
            pointerEvents: 'none'
        });
        
        // Ajouter au conteneur
        this.options.container.appendChild(this.tooltipElement);
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        const { trigger } = this.options;
        
        switch (trigger) {
            case 'hover':
                this.element.addEventListener('mouseenter', () => this.show());
                this.element.addEventListener('mouseleave', () => this.hide());
                break;
                
            case 'click':
                this.element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggle();
                });
                // Fermer au clic extérieur
                document.addEventListener('click', () => {
                    if (this.isVisible) this.hide();
                });
                break;
                
            case 'focus':
                this.element.addEventListener('focus', () => this.show());
                this.element.addEventListener('blur', () => this.hide());
                break;
                
            case 'manual':
                // Pas d'événements automatiques
                break;
        }
    }
    
    // ========================================
    // AFFICHAGE / MASQUAGE
    // ========================================
    
    show() {
        if (this.isVisible) return;
        
        // Annuler le hide timeout si existant
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        // Appliquer le délai si défini
        this.showTimeout = setTimeout(() => {
            // Mettre à jour le contenu
            this.updateContent();
            
            // Positionner
            this.position();
            
            // Afficher avec animation
            this.tooltipElement.style.visibility = 'visible';
            this.tooltipElement.style.opacity = '1';
            
            if (this.options.animation === 'scale') {
                this.tooltipElement.style.transform = 'scale(1)';
            }
            
            this.isVisible = true;
            
            // Émettre un événement custom
            this.element.dispatchEvent(new CustomEvent('tooltip:show', {
                detail: { tooltip: this }
            }));
            
        }, this.options.delay);
    }
    
    hide() {
        if (!this.isVisible) return;
        
        // Annuler le show timeout si existant
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        
        // Appliquer le délai si défini
        this.hideTimeout = setTimeout(() => {
            // Masquer avec animation
            this.tooltipElement.style.opacity = '0';
            
            if (this.options.animation === 'scale') {
                this.tooltipElement.style.transform = 'scale(0.8)';
            }
            
            setTimeout(() => {
                this.tooltipElement.style.visibility = 'hidden';
            }, 200);
            
            this.isVisible = false;
            
            // Émettre un événement custom
            this.element.dispatchEvent(new CustomEvent('tooltip:hide', {
                detail: { tooltip: this }
            }));
            
        }, this.options.hideDelay);
    }
    
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    
    // ========================================
    // POSITIONNEMENT
    // ========================================
    
    position() {
        const rect = this.element.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        const { position, offset } = this.options;
        
        let top = 0;
        let left = 0;
        let actualPosition = position;
        
        // Calculer la position initiale
        const positions = {
            top: {
                top: rect.top - tooltipRect.height - offset,
                left: rect.left + (rect.width - tooltipRect.width) / 2
            },
            bottom: {
                top: rect.bottom + offset,
                left: rect.left + (rect.width - tooltipRect.width) / 2
            },
            left: {
                top: rect.top + (rect.height - tooltipRect.height) / 2,
                left: rect.left - tooltipRect.width - offset
            },
            right: {
                top: rect.top + (rect.height - tooltipRect.height) / 2,
                left: rect.right + offset
            }
        };
        
        // Position auto : choisir la meilleure position
        if (position === 'auto') {
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            };
            
            // Ordre de préférence
            const order = ['top', 'bottom', 'right', 'left'];
            
            for (const pos of order) {
                const coords = positions[pos];
                const fitsHorizontally = coords.left >= 0 && 
                    coords.left + tooltipRect.width <= viewport.width;
                const fitsVertically = coords.top >= 0 && 
                    coords.top + tooltipRect.height <= viewport.height;
                    
                if (fitsHorizontally && fitsVertically) {
                    actualPosition = pos;
                    break;
                }
            }
        }
        
        // Appliquer la position
        const coords = positions[actualPosition] || positions.top;
        top = coords.top + window.scrollY;
        left = coords.left + window.scrollX;
        
        // Ajuster si déborde
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        if (left < 0) left = offset;
        if (left + tooltipRect.width > viewport.width) {
            left = viewport.width - tooltipRect.width - offset;
        }
        
        if (top < window.scrollY) top = window.scrollY + offset;
        if (top + tooltipRect.height > window.scrollY + viewport.height) {
            top = window.scrollY + viewport.height - tooltipRect.height - offset;
        }
        
        // Appliquer les styles
        Object.assign(this.tooltipElement.style, {
            top: top + 'px',
            left: left + 'px'
        });
        
        // Mettre à jour la classe de position pour la flèche
        this.tooltipElement.className = `tooltip tooltip-${this.options.theme} tooltip-${actualPosition}`;
    }
    
    // ========================================
    // MISE À JOUR DU CONTENU
    // ========================================
    
    updateContent() {
        const content = typeof this.options.content === 'function' ? 
            this.options.content(this.element) : 
            this.options.content;
            
        const contentElement = this.tooltipElement.querySelector('.tooltip-content');
        
        if (this.options.html) {
            contentElement.innerHTML = content;
        } else {
            contentElement.textContent = content;
        }
    }
    
    update(content) {
        this.options.content = content;
        if (this.isVisible) {
            this.updateContent();
            this.position();
        }
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    
    destroy() {
        // Nettoyer les timeouts
        if (this.showTimeout) clearTimeout(this.showTimeout);
        if (this.hideTimeout) clearTimeout(this.hideTimeout);
        
        // Retirer les événements
        this.element.removeEventListener('mouseenter', () => this.show());
        this.element.removeEventListener('mouseleave', () => this.hide());
        this.element.removeEventListener('click', () => this.toggle());
        this.element.removeEventListener('focus', () => this.show());
        this.element.removeEventListener('blur', () => this.hide());
        
        // Retirer l'élément tooltip
        if (this.tooltipElement && this.tooltipElement.parentNode) {
            this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        }
        
        console.log('🗑️ Tooltip détruit:', this.id);
    }
}

// ========================================
// MÉTHODE STATIQUE POUR ATTACHER À PLUSIEURS ÉLÉMENTS
// ========================================

Tooltip.attach = function(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    const tooltips = [];
    
    elements.forEach(element => {
        // Récupérer le contenu depuis l'attribut data ou title
        const content = options.content || 
            element.getAttribute('data-tooltip') || 
            element.getAttribute('title');
            
        if (content) {
            // Retirer l'attribut title pour éviter le tooltip natif
            element.removeAttribute('title');
            
            const tooltip = new Tooltip(element, {
                ...options,
                content
            });
            
            tooltips.push(tooltip);
        }
    });
    
    return tooltips;
};

// Export par défaut
export default Tooltip;