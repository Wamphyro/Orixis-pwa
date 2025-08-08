/* ========================================
   TOAST.WIDGET.JS - Widget de notifications toast
   Chemin: /widgets/toast/toast.widget.js
   
   DESCRIPTION:
   Widget autonome de notifications toast avec animations.
   Gère une pile de notifications avec limite configurable.
   Design glassmorphism avec gradients colorés.
   100% indépendant, aucune dépendance externe.
   
   STRUCTURE DU FICHIER:
   1. CONSTRUCTOR ET CONFIGURATION
   2. INITIALISATION ET CHARGEMENT CSS
   3. CRÉATION DU CONTAINER
   4. MÉTHODES D'AFFICHAGE
   5. GESTION DE LA PILE
   6. ANIMATIONS
   7. API PUBLIQUE
   8. DESTRUCTION
   
   UTILISATION:
   import { ToastWidget } from '/widgets/toast/toast.widget.js';
   const toast = new ToastWidget({ position: 'top-right' });
   toast.success('Message');
   
   API PUBLIQUE:
   - show(message, type, duration) - Affiche un toast
   - success(message) - Toast de succès
   - error(message) - Toast d'erreur
   - warning(message) - Toast d'avertissement
   - info(message) - Toast d'information
   - clear() - Supprime tous les toasts
   - destroy() - Détruit le widget
   
   OPTIONS:
   - position: string (défaut: 'top-right') - Position des toasts
   - maxToasts: number (défaut: 5) - Nombre max de toasts
   - duration: number (défaut: 4000) - Durée d'affichage en ms
   - animated: boolean (défaut: true) - Activer les animations
   - pauseOnHover: boolean (défaut: true) - Pause sur survol
   - showProgress: boolean (défaut: true) - Barre de progression
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale selon guide v2.0
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

export class ToastWidget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec spread pour défauts
        this.config = {
            // Position
            position: config.position || 'top-right', // top-right, top-left, bottom-right, bottom-left
            
            // Comportement
            maxToasts: config.maxToasts || 5,
            duration: config.duration || 4000,
            animated: config.animated !== false,
            pauseOnHover: config.pauseOnHover !== false,
            showProgress: config.showProgress !== false,
            
            // Apparence
            theme: config.theme || 'gradient', // gradient, solid, glass
            size: config.size || 'md', // sm, md, lg
            
            // Spread pour surcharger
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            toasts: [],
            timers: new Map(),
            loaded: false
        };
        
        // 4. Références DOM
        this.elements = {
            container: null
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // 6. Initialiser
        this.init();
    }
    
    // ========================================
    // SECTION 1 : INITIALISATION
    // ========================================
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
        const cssId = 'toast-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/toast/toast.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
        
        console.log('✅ CSS ToastWidget chargé');
    }
    
    /**
     * Initialisation asynchrone
     */
    async init() {
        try {
            this.createContainer();
            this.attachGlobalStyles();
            this.showWithDelay();
            
            console.log('✅ ToastWidget initialisé:', this.id);
        } catch (error) {
            console.error('❌ Erreur init ToastWidget:', error);
        }
    }
    
    /**
     * Crée le container principal
     */
    createContainer() {
        // Vérifier si un container existe déjà
        const existingContainer = document.querySelector('.toast-widget-container');
        if (existingContainer) {
            this.elements.container = existingContainer;
            return;
        }
        
        // Créer nouveau container
        const container = document.createElement('div');
        container.className = this.buildContainerClasses();
        container.id = this.id;
        container.dataset.position = this.config.position;
        
        document.body.appendChild(container);
        this.elements.container = container;
    }
    
    /**
     * Construit les classes du container
     */
    buildContainerClasses() {
        const classes = ['toast-widget-container'];
        
        // Position
        classes.push(`position-${this.config.position}`);
        
        // Theme
        classes.push(`theme-${this.config.theme}`);
        
        // Size
        classes.push(`size-${this.config.size}`);
        
        // Animation
        if (!this.config.animated) {
            classes.push('no-animation');
        }
        
        return classes.join(' ');
    }
    
    /**
     * Ajoute des styles globaux si nécessaire
     */
    attachGlobalStyles() {
        // Styles additionnels si besoin
    }
    
    // ========================================
    // SECTION 2 : AFFICHAGE DES TOASTS
    // ========================================
    
    /**
     * Affiche un toast
     */
    show(message, type = 'info', duration = null) {
        // Vérifier limite
        if (this.state.toasts.length >= this.config.maxToasts) {
            this.removeOldest();
        }
        
        // Créer le toast
        const toast = this.createToast(message, type);
        
        // Ajouter au container
        this.elements.container.appendChild(toast);
        
        // Ajouter à l'état
        this.state.toasts.push(toast);
        
        // Animation d'entrée
        if (this.config.animated) {
            this.animateIn(toast);
        }
        
        // Auto-fermeture
        const finalDuration = duration || this.config.duration;
        if (finalDuration > 0) {
            this.setAutoClose(toast, finalDuration);
        }
        
        return toast;
    }
    
    /**
     * Crée un élément toast
     */
    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.dataset.toastId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Structure interne
        const icon = this.getIcon(type);
        const html = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Fermer">×</button>
            ${this.config.showProgress ? '<div class="toast-progress"></div>' : ''}
        `;
        
        toast.innerHTML = html;
        
        // Événements
        this.attachToastEvents(toast);
        
        return toast;
    }
    
    /**
     * Obtient l'icône selon le type
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '🚧',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Attache les événements d'un toast
     */
    attachToastEvents(toast) {
        // Fermeture manuelle
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.remove(toast);
        }
        
        // Pause sur survol
        if (this.config.pauseOnHover) {
            toast.onmouseenter = () => this.pauseTimer(toast);
            toast.onmouseleave = () => this.resumeTimer(toast);
        }
    }
    
    // ========================================
    // SECTION 3 : GESTION DES TIMERS
    // ========================================
    
    /**
     * Configure l'auto-fermeture
     */
    setAutoClose(toast, duration) {
        const toastId = toast.dataset.toastId;
        
        // Animation de progression
        if (this.config.showProgress) {
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animationDuration = duration + 'ms';
            }
        }
        
        // Timer de fermeture
        const timer = setTimeout(() => {
            this.remove(toast);
        }, duration);
        
        this.state.timers.set(toastId, {
            timer: timer,
            remaining: duration,
            startTime: Date.now()
        });
    }
    
    /**
     * Met en pause le timer
     */
    pauseTimer(toast) {
        const toastId = toast.dataset.toastId;
        const timerData = this.state.timers.get(toastId);
        
        if (timerData) {
            clearTimeout(timerData.timer);
            timerData.remaining = timerData.remaining - (Date.now() - timerData.startTime);
            
            // Pause animation
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
        }
    }
    
    /**
     * Reprend le timer
     */
    resumeTimer(toast) {
        const toastId = toast.dataset.toastId;
        const timerData = this.state.timers.get(toastId);
        
        if (timerData && timerData.remaining > 0) {
            timerData.startTime = Date.now();
            timerData.timer = setTimeout(() => {
                this.remove(toast);
            }, timerData.remaining);
            
            // Reprendre animation
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animationPlayState = 'running';
            }
        }
    }
    
    // ========================================
    // SECTION 4 : ANIMATIONS
    // ========================================
    
    /**
     * Animation d'entrée
     */
    animateIn(toast) {
        toast.animate([
            { transform: 'translateY(-20px)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
        ], { 
            duration: 300, 
            easing: 'ease-out',
            fill: 'forwards'
        });
    }
    
    /**
     * Animation de sortie
     */
    animateOut(toast) {
        return toast.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-20px)', opacity: 0 }
        ], { 
            duration: 300, 
            easing: 'ease-in',
            fill: 'forwards'
        });
    }
    
    // ========================================
    // SECTION 5 : SUPPRESSION
    // ========================================
    
    /**
     * Supprime un toast
     */
    remove(toast) {
        if (!toast || !toast.parentNode) return;
        
        // Nettoyer timer
        const toastId = toast.dataset.toastId;
        const timerData = this.state.timers.get(toastId);
        if (timerData) {
            clearTimeout(timerData.timer);
            this.state.timers.delete(toastId);
        }
        
        // Retirer de l'état
        const index = this.state.toasts.indexOf(toast);
        if (index > -1) {
            this.state.toasts.splice(index, 1);
        }
        
        // Animation de sortie
        if (this.config.animated) {
            this.animateOut(toast).onfinish = () => {
                if (toast.parentNode) toast.remove();
            };
        } else {
            toast.remove();
        }
    }
    
    /**
     * Supprime le plus ancien
     */
    removeOldest() {
        if (this.state.toasts.length > 0) {
            this.remove(this.state.toasts[0]);
        }
    }
    
    // ========================================
    // SECTION 6 : API PUBLIQUE
    // ========================================
    
    /**
     * Toast de succès
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    /**
     * Toast d'erreur
     */
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    /**
     * Toast d'avertissement
     */
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    /**
     * Toast d'information
     */
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
    
    /**
     * Supprime tous les toasts
     */
    clear() {
        [...this.state.toasts].forEach(toast => this.remove(toast));
    }
    
    // ========================================
    // SECTION 7 : AFFICHAGE (ANTI-FOUC)
    // ========================================
    
    /**
     * Anti-FOUC : affichage avec délai
     */
    showWithDelay() {
        setTimeout(() => {
            this.showContainer();
        }, 100);
    }
    
    /**
     * Affiche le container
     */
    showContainer() {
        if (this.elements.container) {
            this.elements.container.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    // ========================================
    // SECTION 8 : DESTRUCTION
    // ========================================
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy() {
        // Nettoyer tous les timers
        this.state.timers.forEach(timerData => {
            clearTimeout(timerData.timer);
        });
        this.state.timers.clear();
        
        // Supprimer tous les toasts
        this.clear();
        
        // Vider container
        if (this.elements.container) {
            this.elements.container.remove();
        }
        
        // Réinitialiser état
        this.state = {
            toasts: [],
            timers: new Map(),
            loaded: false
        };
        
        // Réinitialiser éléments
        this.elements = {
            container: null
        };
        
        console.log('🗑️ ToastWidget détruit:', this.id);
    }
}

// ========================================
// SINGLETON GLOBAL
// ========================================

// Instance unique partagée
let toastInstance = null;

export function getToast(config) {
    if (!toastInstance) {
        toastInstance = new ToastWidget(config);
    }
    return toastInstance;
}

// Export par défaut du singleton
export default getToast();