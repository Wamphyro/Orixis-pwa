// ========================================
// PROGRESS-BAR.COMPONENT.JS - Composant barre de progression réutilisable
// Chemin: src/components/ui/progress-bar/progress-bar.component.js
//
// DESCRIPTION:
// Composant de barre de progression 100% indépendant
// Supporte modes déterminé/indéterminé, étiquettes, animations
//
// API PUBLIQUE:
// - constructor(config)
// - setProgress(value, animated)
// - increment(amount)
// - decrement(amount)
// - setLabel(text)
// - setStatus(status)
// - start()
// - complete()
// - reset()
// - pause()
// - resume()
// - setMode(mode)
// - destroy()
//
// CALLBACKS:
// - onProgress: (value, previousValue) => void
// - onComplete: () => void
// - onStart: () => void
// - onPause: () => void
// - onResume: () => void
// - onStatusChange: (status, previousStatus) => void
//
// EXEMPLE:
// const progress = new ProgressBar({
//     container: '#progress',
//     value: 0,
//     max: 100,
//     label: 'Conversion en cours...',
//     showPercent: true,
//     animated: true,
//     onProgress: (val) => console.log(`Progress: ${val}%`),
//     onComplete: () => console.log('Terminé!')
// });
// ========================================

export class ProgressBar {
    constructor(config) {
        // Génération d'ID unique
        this.id = 'progress-bar-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            container: null,
            value: 0,
            min: 0,
            max: 100,
            mode: 'determinate', // 'determinate' | 'indeterminate' | 'buffer'
            
            // Affichage
            label: '',
            sublabel: '',
            showPercent: true,
            showValue: false,
            showRemaining: false,
            unit: '',
            
            // Style
            height: 'default', // 'thin' | 'default' | 'thick' | nombre en px
            variant: 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info'
            striped: false,
            animated: true,
            rounded: true,
            
            // Comportement
            smoothAnimation: true,
            animationDuration: 300,
            autoHide: false,
            autoHideDelay: 1000,
            
            // Buffer mode
            bufferValue: 0,
            
            // Callbacks
            onProgress: null,
            onComplete: null,
            onStart: null,
            onPause: null,
            onResume: null,
            onStatusChange: null,
            
            ...config
        };
        
        // État interne
        this.state = {
            value: this.config.value,
            bufferValue: this.config.bufferValue,
            status: 'idle', // 'idle' | 'active' | 'paused' | 'completed' | 'error'
            isAnimating: false,
            isPaused: false,
            startTime: null,
            pauseTime: null,
            animationFrame: null
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            wrapper: null,
            track: null,
            fill: null,
            buffer: null,
            label: null,
            sublabel: null,
            percent: null,
            value: null,
            remaining: null
        };
        
        // Timer pour auto-hide
        this.autoHideTimer = null;
        
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        // Récupérer le container
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            console.error('ProgressBar: Container non trouvé');
            return;
        }
        
        // Charger les styles
        this.loadStyles();
        
        // Créer la structure
        this.createStructure();
        
        // Appliquer la configuration initiale
        this.applyConfiguration();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
        console.log('✅ ProgressBar initialisée:', this.id);
    }
    
    loadStyles() {
        if (!document.getElementById('progress-bar-styles')) {
            // ✅ NOUVELLE MÉTHODE : Chemin dynamique
            const componentUrl = new URL(import.meta.url).href;
            const cssUrl = componentUrl.replace('.js', '.css');
            
            const link = document.createElement('link');
            link.id = 'progress-bar-styles';
            link.rel = 'stylesheet';
            link.href = cssUrl;
            document.head.appendChild(link);
            
            console.log('📦 ProgressBar styles chargés depuis:', cssUrl);
        }
    }
    
    createStructure() {
        const html = `
            <div class="progress-bar-wrapper" id="${this.id}">
                <div class="progress-bar-header">
                    <div class="progress-bar-labels">
                        <span class="progress-bar-label"></span>
                        <span class="progress-bar-sublabel"></span>
                    </div>
                    <div class="progress-bar-info">
                        <span class="progress-bar-percent"></span>
                        <span class="progress-bar-value"></span>
                        <span class="progress-bar-remaining"></span>
                    </div>
                </div>
                <div class="progress-bar-track">
                    <div class="progress-bar-buffer"></div>
                    <div class="progress-bar-fill">
                        <div class="progress-bar-glow"></div>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.container.innerHTML = html;
        
        // Récupérer les références
        this.elements.wrapper = document.getElementById(this.id);
        this.elements.track = this.elements.wrapper.querySelector('.progress-bar-track');
        this.elements.fill = this.elements.wrapper.querySelector('.progress-bar-fill');
        this.elements.buffer = this.elements.wrapper.querySelector('.progress-bar-buffer');
        this.elements.label = this.elements.wrapper.querySelector('.progress-bar-label');
        this.elements.sublabel = this.elements.wrapper.querySelector('.progress-bar-sublabel');
        this.elements.percent = this.elements.wrapper.querySelector('.progress-bar-percent');
        this.elements.value = this.elements.wrapper.querySelector('.progress-bar-value');
        this.elements.remaining = this.elements.wrapper.querySelector('.progress-bar-remaining');
    }
    
    applyConfiguration() {
        // Classes de base
        this.elements.wrapper.className = 'progress-bar-wrapper';
        
        // Variante de couleur
        this.elements.wrapper.classList.add(`progress-bar-${this.config.variant}`);
        
        // Mode
        this.elements.wrapper.classList.add(`progress-bar-${this.config.mode}`);
        
        // Hauteur
        if (this.config.height === 'thin') {
            this.elements.wrapper.classList.add('progress-bar-thin');
        } else if (this.config.height === 'thick') {
            this.elements.wrapper.classList.add('progress-bar-thick');
        } else if (typeof this.config.height === 'number') {
            this.elements.track.style.height = `${this.config.height}px`;
        }
        
        // Options visuelles
        if (this.config.striped) {
            this.elements.wrapper.classList.add('progress-bar-striped');
        }
        
        if (this.config.animated && this.config.striped) {
            this.elements.wrapper.classList.add('progress-bar-animated');
        }
        
        if (!this.config.rounded) {
            this.elements.wrapper.classList.add('progress-bar-square');
        }
        
        // Animation fluide
        if (this.config.smoothAnimation) {
            this.elements.fill.style.transition = `width ${this.config.animationDuration}ms ease-out`;
            this.elements.buffer.style.transition = `width ${this.config.animationDuration}ms ease-out`;
        }
        
        // Labels
        if (this.config.label) {
            this.elements.label.textContent = this.config.label;
        }
        
        if (this.config.sublabel) {
            this.elements.sublabel.textContent = this.config.sublabel;
        }
        
        // Masquer les éléments non utilisés
        if (!this.config.showPercent) {
            this.elements.percent.style.display = 'none';
        }
        
        if (!this.config.showValue) {
            this.elements.value.style.display = 'none';
        }
        
        if (!this.config.showRemaining) {
            this.elements.remaining.style.display = 'none';
        }
        
        // Mode buffer
        if (this.config.mode !== 'buffer') {
            this.elements.buffer.style.display = 'none';
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    setProgress(value, animated = true) {
        const previousValue = this.state.value;
        
        // Clamp la valeur
        value = Math.max(this.config.min, Math.min(this.config.max, value));
        
        // Mise à jour de l'état
        this.state.value = value;
        
        // Si on démarre
        if (this.state.status === 'idle' && value > this.config.min) {
            this.start();
        }
        
        // Animation ou direct
        if (animated && this.config.smoothAnimation) {
            this.animateProgress(previousValue, value);
        } else {
            this.updateDisplay();
        }
        
        // Callback
        if (this.config.onProgress) {
            this.config.onProgress(value, previousValue);
        }
        
        // Auto-complétion
        if (value >= this.config.max && this.state.status !== 'completed') {
            this.complete();
        }
        
        return this;
    }
    
    increment(amount = 1) {
        return this.setProgress(this.state.value + amount);
    }
    
    decrement(amount = 1) {
        return this.setProgress(this.state.value - amount);
    }
    
    setLabel(text) {
        this.config.label = text;
        this.elements.label.textContent = text;
        return this;
    }
    
    setSublabel(text) {
        this.config.sublabel = text;
        this.elements.sublabel.textContent = text;
        return this;
    }
    
    setStatus(status) {
        const previousStatus = this.state.status;
        this.state.status = status;
        
        // Mettre à jour les classes
        this.elements.wrapper.classList.remove(
            'progress-bar-idle',
            'progress-bar-active', 
            'progress-bar-paused',
            'progress-bar-completed',
            'progress-bar-error'
        );
        this.elements.wrapper.classList.add(`progress-bar-${status}`);
        
        // Callback
        if (this.config.onStatusChange) {
            this.config.onStatusChange(status, previousStatus);
        }
        
        return this;
    }
    
    start() {
        this.state.startTime = Date.now();
        this.setStatus('active');
        
        if (this.config.onStart) {
            this.config.onStart();
        }
        
        return this;
    }
    
    complete() {
        this.state.value = this.config.max;
        this.updateDisplay();
        this.setStatus('completed');
        
        if (this.config.onComplete) {
            this.config.onComplete();
        }
        
        // Auto-hide si configuré
        if (this.config.autoHide) {
            this.autoHideTimer = setTimeout(() => {
                this.hide();
            }, this.config.autoHideDelay);
        }
        
        return this;
    }
    
    reset() {
        // Annuler les timers
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
        
        // Reset état
        this.state.value = this.config.min;
        this.state.bufferValue = this.config.min;
        this.state.status = 'idle';
        this.state.startTime = null;
        this.state.pauseTime = null;
        
        // Reset affichage
        this.updateDisplay();
        this.show();
        
        return this;
    }
    
    pause() {
        if (this.state.status === 'active') {
            this.state.pauseTime = Date.now();
            this.state.isPaused = true;
            this.setStatus('paused');
            
            if (this.config.onPause) {
                this.config.onPause();
            }
        }
        
        return this;
    }
    
    resume() {
        if (this.state.status === 'paused') {
            this.state.isPaused = false;
            this.setStatus('active');
            
            if (this.config.onResume) {
                this.config.onResume();
            }
        }
        
        return this;
    }
    
    setMode(mode) {
        // Retirer l'ancien mode
        this.elements.wrapper.classList.remove(
            'progress-bar-determinate',
            'progress-bar-indeterminate',
            'progress-bar-buffer'
        );
        
        // Appliquer le nouveau
        this.config.mode = mode;
        this.elements.wrapper.classList.add(`progress-bar-${mode}`);
        
        // Gérer l'affichage du buffer
        if (mode === 'buffer') {
            this.elements.buffer.style.display = '';
        } else {
            this.elements.buffer.style.display = 'none';
        }
        
        return this;
    }
    
    setBufferValue(value) {
        if (this.config.mode === 'buffer') {
            this.state.bufferValue = Math.max(this.config.min, Math.min(this.config.max, value));
            this.updateDisplay();
        }
        
        return this;
    }
    
    show() {
        this.elements.wrapper.style.display = '';
        return this;
    }
    
    hide() {
        this.elements.wrapper.style.display = 'none';
        return this;
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    updateDisplay() {
        const percentage = this.calculatePercentage(this.state.value);
        
        // Barre de progression
        if (this.config.mode !== 'indeterminate') {
            this.elements.fill.style.width = `${percentage}%`;
        }
        
        // Buffer
        if (this.config.mode === 'buffer') {
            const bufferPercentage = this.calculatePercentage(this.state.bufferValue);
            this.elements.buffer.style.width = `${bufferPercentage}%`;
        }
        
        // Pourcentage
        if (this.config.showPercent) {
            this.elements.percent.textContent = `${Math.round(percentage)}%`;
        }
        
        // Valeur
        if (this.config.showValue) {
            this.elements.value.textContent = `${this.state.value}${this.config.unit}`;
        }
        
        // Restant
        if (this.config.showRemaining) {
            const remaining = this.config.max - this.state.value;
            this.elements.remaining.textContent = `${remaining}${this.config.unit} restant`;
        }
    }
    
    calculatePercentage(value) {
        const range = this.config.max - this.config.min;
        if (range === 0) return 0;
        return ((value - this.config.min) / range) * 100;
    }
    
    animateProgress(fromValue, toValue) {
        if (this.state.animationFrame) {
            cancelAnimationFrame(this.state.animationFrame);
        }
        
        const duration = this.config.animationDuration;
        const startTime = performance.now();
        const fromPercentage = this.calculatePercentage(fromValue);
        const toPercentage = this.calculatePercentage(toValue);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            
            const currentPercentage = fromPercentage + (toPercentage - fromPercentage) * easeOutQuad;
            this.elements.fill.style.width = `${currentPercentage}%`;
            
            if (progress < 1) {
                this.state.animationFrame = requestAnimationFrame(animate);
            } else {
                this.updateDisplay();
            }
        };
        
        this.state.animationFrame = requestAnimationFrame(animate);
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    
    destroy() {
        // Annuler les animations
        if (this.state.animationFrame) {
            cancelAnimationFrame(this.state.animationFrame);
        }
        
        // Annuler les timers
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
        
        // Nettoyer le DOM
        if (this.elements.wrapper) {
            this.elements.wrapper.remove();
        }
        
        // Reset
        this.elements = {};
        this.state = {};
        
        console.log('🧹 ProgressBar détruite:', this.id);
    }
}

// ========================================
// FONCTION HELPER POUR PROGRESS MULTI-ÉTAPES
// ========================================

export function createSteppedProgress(container, steps) {
    const totalSteps = steps.length;
    let currentStep = 0;
    
    const progress = new ProgressBar({
        container,
        max: totalSteps,
        showPercent: true,
        showValue: false,
        label: steps[0] || 'Initialisation...',
        variant: 'primary',
        animated: true
    });
    
    return {
        progressBar: progress,
        
        nextStep() {
            if (currentStep < totalSteps - 1) {
                currentStep++;
                progress.setProgress(currentStep);
                progress.setLabel(steps[currentStep] || `Étape ${currentStep + 1}`);
            }
        },
        
        setStep(index) {
            if (index >= 0 && index < totalSteps) {
                currentStep = index;
                progress.setProgress(currentStep);
                progress.setLabel(steps[currentStep] || `Étape ${currentStep + 1}`);
            }
        },
        
        complete() {
            progress.complete();
            progress.setLabel('Terminé !');
        },
        
        error(message) {
            progress.setStatus('error');
            progress.setLabel(message || 'Erreur');
        }
    };
}

export default ProgressBar;