/* ========================================
   TOAST.WIDGET.JS - Widget de notifications toast
   Chemin: /widgets/toast/toast.widget.js
   
   VERSION: 2.0.0 - AVEC ACTIONS, HTML, QUEUE, PRIORITY
   100% RÉTROCOMPATIBLE avec v1.0.0
   
   NOUVELLES FONCTIONNALITÉS:
   - Actions (boutons dans les toasts)
   - Support HTML
   - Système de queue
   - Niveaux de priorité
   
   UTILISATION CLASSIQUE (inchangée):
   toast.success('Message');
   
   UTILISATION AVANCÉE:
   toast.show({
       message: 'Erreur',
       type: 'error',
       priority: 'high',
       actions: [{label: 'Retry', onClick: () => {}}]
   });
   ======================================== */

export class ToastWidget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec spread pour défauts
        this.config = {
            // Position
            position: config.position || 'top-right',
            
            // Comportement (INCHANGÉ)
            maxToasts: config.maxToasts || 5,
            duration: config.duration || 4000,
            animated: config.animated !== false,
            pauseOnHover: config.pauseOnHover !== false,
            showProgress: config.showProgress !== false,
            
            // Apparence (INCHANGÉ)
            theme: config.theme || 'gradient',
            size: config.size || 'md',
            
            // === NOUVELLES OPTIONS ===
            // Queue (désactivée par défaut pour compatibilité)
            queue: {
                enabled: config.queue?.enabled || false,
                mode: config.queue?.mode || 'wait', // 'wait' | 'replace' | 'stack'
                maxVisible: config.queue?.maxVisible || config.maxToasts || 5,
                ...config.queue
            },
            
            // HTML (désactivé par défaut pour sécurité)
            allowHtml: config.allowHtml || false,
            
            // Sons (optionnel)
            sounds: {
                enabled: config.sounds?.enabled || false,
                error: config.sounds?.error || null,
                success: config.sounds?.success || null,
                ...config.sounds
            },
            
            // Priorités
            priorities: {
                critical: { duration: 0, weight: 100 }, // 0 = permanent
                high: { duration: 8000, weight: 75 },
                normal: { duration: 4000, weight: 50 },
                low: { duration: 2000, weight: 25 },
                ...config.priorities
            },
            
            // Spread pour surcharger
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            toasts: [],
            queue: [],          // NOUVEAU: File d'attente
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
    // SECTION 1 : INITIALISATION (INCHANGÉE)
    // ========================================
    
loadCSS() {
    const cssId = 'toast-widget-css';
    const existing = document.getElementById(cssId);
    if (existing) existing.remove();
    
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = '../../widgets/toast/toast.widget.css?v=' + Date.now();
    
    // DEBUG : Vérifier vraiment le chargement
    link.onload = () => {
        console.log('✅ CSS chargé, vérification...');
        // Vérifier si les styles sont appliqués
        setTimeout(() => {
            const container = document.querySelector('.toast-widget-container');
            if (container) {
                const styles = window.getComputedStyle(container);
                console.log('📍 Position:', styles.position);
                console.log('📍 Z-index:', styles.zIndex);
                console.log('📍 Top:', styles.top);
                console.log('📍 Right:', styles.right);
            }
        }, 100);
    };
    
    link.onerror = () => {
        console.error('❌ ERREUR chargement CSS');
        console.log('📁 Tentative de chargement depuis:', link.href);
    };
    
    document.head.appendChild(link);
    console.log('📁 Chargement CSS depuis:', link.href);
}
    
    async init() {
        try {
            this.createContainer();
            this.attachGlobalStyles();
            this.showWithDelay();
            
            console.log('✅ ToastWidget v2.0 initialisé:', this.id);
        } catch (error) {
            console.error('❌ Erreur init ToastWidget:', error);
        }
    }
    
    createContainer() {
        const existingContainer = document.querySelector('.toast-widget-container');
        if (existingContainer) {
            this.elements.container = existingContainer;
            return;
        }
        
        const container = document.createElement('div');
        container.className = this.buildContainerClasses();
        container.id = this.id;
        container.dataset.position = this.config.position;
        
        document.body.appendChild(container);
        this.elements.container = container;
    }
    
    buildContainerClasses() {
        const classes = ['toast-widget-container'];
        classes.push(`position-${this.config.position}`);
        classes.push(`theme-${this.config.theme}`);
        classes.push(`size-${this.config.size}`);
        if (!this.config.animated) classes.push('no-animation');
        return classes.join(' ');
    }
    
    attachGlobalStyles() {
        // Styles additionnels si besoin
    }
    
    // ========================================
    // SECTION 2 : MÉTHODE SHOW AMÉLIORÉE
    // ========================================
    
    /**
     * Méthode principale show() - RÉTROCOMPATIBLE
     * Accepte l'ancien format (message, type, duration) ET le nouveau format objet
     */
    show(messageOrConfig, type = 'info', duration = null) {
        let config = {};
        
        // === RÉTROCOMPATIBILITÉ ===
        if (typeof messageOrConfig === 'string') {
            // Ancien format : show('message', 'type', duration)
            config = {
                message: messageOrConfig,
                type: type,
                duration: duration,
                priority: 'normal'
            };
        } else {
            // Nouveau format : show({ message, type, actions, ... })
            config = {
                type: 'info',
                priority: 'normal',
                duration: null,
                ...messageOrConfig
            };
        }
        
        // Gestion de la priorité et durée
        if (!config.duration) {
            const priority = this.config.priorities[config.priority] || this.config.priorities.normal;
            config.duration = priority.duration || this.config.duration;
        }
        
        // === SYSTÈME DE QUEUE ===
        if (this.config.queue.enabled) {
            return this.addToQueue(config);
        }
        
        // === LIMITE DE TOASTS ===
        if (this.state.toasts.length >= this.config.maxToasts) {
            if (config.priority === 'critical' || config.priority === 'high') {
                // Les priorités hautes remplacent les basses
                this.removeLowestPriority();
            } else {
                this.removeOldest();
            }
        }
        
        // Créer et afficher le toast
        const toast = this.createToast(config);
        this.elements.container.appendChild(toast);
        this.state.toasts.push(toast);
        
        // Animation d'entrée
        if (this.config.animated) {
            this.animateIn(toast);
        }
        
        // Son (si activé)
        if (this.config.sounds.enabled && this.config.sounds[config.type]) {
            this.playSound(config.type);
        }
        
        // Auto-fermeture
        if (config.duration > 0) {
            this.setAutoClose(toast, config.duration);
        }
        
        return toast;
    }
    
    /**
     * Crée un élément toast - AMÉLIORÉ avec actions et HTML
     */
    createToast(config) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${config.type} priority-${config.priority || 'normal'}`;
        toast.dataset.toastId = Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        toast.dataset.priority = config.priority || 'normal';
        
        // Structure interne améliorée
        const icon = this.getIcon(config.type);
        
        // === SUPPORT HTML ===
        const messageContent = (this.config.allowHtml && config.html) 
            ? config.html 
            : (config.message || '');
        
        const messageClass = (this.config.allowHtml && config.html) 
            ? 'toast-html' 
            : 'toast-message';
        
        let html = `
            <span class="toast-icon">${icon}</span>
            <span class="${messageClass}">${messageContent}</span>
            <button class="toast-close" aria-label="Fermer">×</button>
        `;
        
        // === PROGRESS BAR ===
        if (this.config.showProgress && config.duration > 0) {
            html += '<div class="toast-progress"></div>';
        }
        
        toast.innerHTML = html;
        
        // === ACTIONS (NOUVEAU) ===
        if (config.actions && config.actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'toast-actions';
            
            config.actions.forEach((action, index) => {
                const btn = document.createElement('button');
                btn.className = `toast-action-btn ${action.style || 'default'}`;
                btn.textContent = action.label;
                btn.onclick = () => {
                    if (action.onClick) action.onClick();
                    if (action.closeOnClick !== false) {
                        this.remove(toast);
                    }
                };
                actionsDiv.appendChild(btn);
            });
            
            toast.insertBefore(actionsDiv, toast.querySelector('.toast-close'));
        }
        
        // Événements
        this.attachToastEvents(toast);
        
        return toast;
    }
    
    // ========================================
    // SECTION 3 : SYSTÈME DE QUEUE (NOUVEAU)
    // ========================================
    
    addToQueue(config) {
        // Ajouter à la queue selon la priorité
        const priority = this.config.priorities[config.priority] || this.config.priorities.normal;
        config.weight = priority.weight;
        
        // Insérer dans la queue par ordre de priorité
        let inserted = false;
        for (let i = 0; i < this.state.queue.length; i++) {
            if (config.weight > this.state.queue[i].weight) {
                this.state.queue.splice(i, 0, config);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            this.state.queue.push(config);
        }
        
        // Traiter la queue
        this.processQueue();
    }
    
    processQueue() {
        // Si on peut afficher plus de toasts
        while (this.state.toasts.length < this.config.queue.maxVisible && this.state.queue.length > 0) {
            const config = this.state.queue.shift();
            this.show(config);
        }
    }
    
    removeLowestPriority() {
        // Trouver le toast avec la priorité la plus basse
        let lowestPriority = null;
        let lowestWeight = 100;
        
        this.state.toasts.forEach(toast => {
            const priority = toast.dataset.priority || 'normal';
            const weight = this.config.priorities[priority]?.weight || 50;
            if (weight < lowestWeight) {
                lowestWeight = weight;
                lowestPriority = toast;
            }
        });
        
        if (lowestPriority) {
            this.remove(lowestPriority);
        }
    }
    
    // ========================================
    // SECTION 4 : SONS (NOUVEAU)
    // ========================================
    
    playSound(type) {
        const soundUrl = this.config.sounds[type];
        if (soundUrl) {
            const audio = new Audio(soundUrl);
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    }
    
    // ========================================
    // SECTION 5 : MÉTHODES EXISTANTES (INCHANGÉES)
    // ========================================
    
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    attachToastEvents(toast) {
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.onclick = () => this.remove(toast);
        }
        
        if (this.config.pauseOnHover) {
            toast.onmouseenter = () => this.pauseTimer(toast);
            toast.onmouseleave = () => this.resumeTimer(toast);
        }
    }
    
    setAutoClose(toast, duration) {
        const toastId = toast.dataset.toastId;
        
        if (this.config.showProgress) {
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animationDuration = duration + 'ms';
            }
        }
        
        const timer = setTimeout(() => {
            this.remove(toast);
        }, duration);
        
        this.state.timers.set(toastId, {
            timer: timer,
            remaining: duration,
            startTime: Date.now()
        });
    }
    
    pauseTimer(toast) {
        const toastId = toast.dataset.toastId;
        const timerData = this.state.timers.get(toastId);
        
        if (timerData) {
            clearTimeout(timerData.timer);
            timerData.remaining = timerData.remaining - (Date.now() - timerData.startTime);
            
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animationPlayState = 'paused';
            }
        }
    }
    
    resumeTimer(toast) {
        const toastId = toast.dataset.toastId;
        const timerData = this.state.timers.get(toastId);
        
        if (timerData && timerData.remaining > 0) {
            timerData.startTime = Date.now();
            timerData.timer = setTimeout(() => {
                this.remove(toast);
            }, timerData.remaining);
            
            const progress = toast.querySelector('.toast-progress');
            if (progress) {
                progress.style.animationPlayState = 'running';
            }
        }
    }
    
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
    
    remove(toast) {
        if (!toast || !toast.parentNode) return;
        
        const toastId = toast.dataset.toastId;
        const timerData = this.state.timers.get(toastId);
        if (timerData) {
            clearTimeout(timerData.timer);
            this.state.timers.delete(toastId);
        }
        
        const index = this.state.toasts.indexOf(toast);
        if (index > -1) {
            this.state.toasts.splice(index, 1);
        }
        
        if (this.config.animated) {
            this.animateOut(toast).onfinish = () => {
                if (toast.parentNode) toast.remove();
                // Traiter la queue après suppression
                if (this.config.queue.enabled) {
                    this.processQueue();
                }
            };
        } else {
            toast.remove();
            if (this.config.queue.enabled) {
                this.processQueue();
            }
        }
    }
    
    removeOldest() {
        if (this.state.toasts.length > 0) {
            this.remove(this.state.toasts[0]);
        }
    }
    
    // ========================================
    // API PUBLIQUE (100% RÉTROCOMPATIBLE)
    // ========================================
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
    
    // === NOUVELLE API (optionnelle) ===
    critical(messageOrConfig) {
        if (typeof messageOrConfig === 'string') {
            return this.show({ message: messageOrConfig, type: 'error', priority: 'critical' });
        }
        return this.show({ ...messageOrConfig, priority: 'critical' });
    }
    
    clear() {
        [...this.state.toasts].forEach(toast => this.remove(toast));
        this.state.queue = []; // Vider aussi la queue
    }
    
    showWithDelay() {
        setTimeout(() => {
            this.showContainer();
        }, 100);
    }
    
    showContainer() {
        if (this.elements.container) {
            this.elements.container.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    destroy() {
        this.state.timers.forEach(timerData => {
            clearTimeout(timerData.timer);
        });
        this.state.timers.clear();
        
        this.clear();
        
        if (this.elements.container) {
            this.elements.container.remove();
        }
        
        this.state = {
            toasts: [],
            queue: [],
            timers: new Map(),
            loaded: false
        };
        
        this.elements = {
            container: null
        };
        
        console.log('🗑️ ToastWidget détruit:', this.id);
    }
}

// ========================================
// SINGLETON GLOBAL (INCHANGÉ)
// ========================================

let toastInstance = null;

export function getToast(config) {
    if (!toastInstance) {
        toastInstance = new ToastWidget(config);
    }
    return toastInstance;
}

export default getToast();