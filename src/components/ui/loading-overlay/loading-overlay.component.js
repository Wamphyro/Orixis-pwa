// ========================================
// LOADING-OVERLAY.COMPONENT.JS - Composant de chargement réutilisable
// Chemin: src/components/ui/loading-overlay/loading-overlay.component.js
//
// DESCRIPTION:
// Overlay de chargement avec animation glassmorphism
// Utilisable dans toute l'application
//
// CRÉÉ le 02/02/2025:
// - Composant 100% autonome
// - Génération d'ID autonome
// - Support de plusieurs thèmes
//
// API PUBLIQUE:
// - show(message)
// - hide()
// - update(message)
// - setIcon(icon)
// - destroy()
// ========================================

export class LoadingOverlay {
    constructor(config = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'loading-overlay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.config = {
            message: 'Chargement...',
            icon: '⚙️',
            theme: 'gradient', // gradient, dark, light, minimal
            showSpinner: true,
            blur: true,
            container: document.body,
            zIndex: 9999,
            ...config
        };
        
        this.state = {
            isVisible: false,
            isAnimating: false
        };
        
        this.element = null;
        
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        this.loadStyles();
        this.createElement();
        console.log('✅ LoadingOverlay initialisé:', this.id);
    }
    
    loadStyles() {
        const styleId = 'loading-overlay-styles';
        
        if (!document.getElementById(styleId)) {
            // ✅ MÊME SYNTAXE QUE LES AUTRES COMPOSANTS
            const componentUrl = new URL(import.meta.url).href;
            const cssUrl = componentUrl.replace('.js', '.css');
            
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = cssUrl;
            document.head.appendChild(link);
            
            console.log('📦 LoadingOverlay styles chargés depuis:', cssUrl);
        }
    }
    
    createElement() {
        // Créer l'élément
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = `loading-overlay theme-${this.config.theme} hidden`;
        this.element.style.zIndex = this.config.zIndex;
        
        this.element.innerHTML = `
            <div class="loading-container">
                <div class="loading-content">
                    ${this.config.showSpinner ? `
                        <span class="loading-icon">${this.config.icon}</span>
                    ` : ''}
                    <p class="loading-message">${this.config.message}</p>
                </div>
            </div>
        `;
        
        // Ajouter au container
        this.config.container.appendChild(this.element);
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Afficher le loading
     * @param {string} message - Message optionnel
     * @returns {LoadingOverlay} Pour le chaînage
     */
    show(message) {
        if (this.state.isAnimating) return this;
        
        if (message) {
            this.update(message);
        }
        
        this.state.isVisible = true;
        this.state.isAnimating = true;
        
        // Retirer la classe hidden
        this.element.classList.remove('hidden');
        
        // Force reflow pour l'animation
        void this.element.offsetWidth;
        
        // Ajouter la classe visible
        this.element.classList.add('visible');
        
        // Fin de l'animation
        setTimeout(() => {
            this.state.isAnimating = false;
        }, 300);
        
        return this;
    }
    
    /**
     * Masquer le loading
     * @returns {LoadingOverlay} Pour le chaînage
     */
    hide() {
        if (this.state.isAnimating || !this.state.isVisible) return this;
        
        this.state.isVisible = false;
        this.state.isAnimating = true;
        
        // Retirer la classe visible
        this.element.classList.remove('visible');
        
        // Attendre la fin de l'animation
        setTimeout(() => {
            if (!this.state.isVisible) {
                this.element.classList.add('hidden');
            }
            this.state.isAnimating = false;
        }, 300);
        
        return this;
    }
    
    /**
     * Mettre à jour le message
     * @param {string} message - Nouveau message
     * @returns {LoadingOverlay} Pour le chaînage
     */
    update(message) {
        const messageEl = this.element.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        return this;
    }
    
    /**
     * Changer l'icône
     * @param {string} icon - Nouvelle icône
     * @returns {LoadingOverlay} Pour le chaînage
     */
    setIcon(icon) {
        const iconEl = this.element.querySelector('.loading-icon');
        if (iconEl) {
            iconEl.textContent = icon;
        }
        return this;
    }
    
    /**
     * Changer le thème
     * @param {string} theme - Nouveau thème
     * @returns {LoadingOverlay} Pour le chaînage
     */
    setTheme(theme) {
        // Retirer l'ancien thème
        this.element.className = this.element.className.replace(/theme-\w+/, '');
        // Ajouter le nouveau
        this.element.classList.add(`theme-${theme}`);
        this.config.theme = theme;
        return this;
    }
    
    /**
     * Vérifier si visible
     * @returns {boolean}
     */
    isVisible() {
        return this.state.isVisible;
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        this.hide();
        
        setTimeout(() => {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }, 300);
        
        console.log('🧹 LoadingOverlay détruit:', this.id);
    }
}

// ========================================
// SINGLETON GLOBAL
// ========================================

let globalInstance = null;

export const loader = {
    /**
     * Afficher le loader global
     * @param {string} message - Message à afficher
     */
    show(message = 'Chargement...') {
        if (!globalInstance) {
            globalInstance = new LoadingOverlay({
                theme: 'gradient'
            });
        }
        return globalInstance.show(message);
    },
    
    /**
     * Masquer le loader global
     */
    hide() {
        if (globalInstance) {
            return globalInstance.hide();
        }
    },
    
    /**
     * Mettre à jour le message
     * @param {string} message - Nouveau message
     */
    update(message) {
        if (globalInstance) {
            return globalInstance.update(message);
        }
    },
    
    /**
     * Détruire le loader global
     */
    destroy() {
        if (globalInstance) {
            globalInstance.destroy();
            globalInstance = null;
        }
    }
};

// Export par défaut
export default LoadingOverlay;