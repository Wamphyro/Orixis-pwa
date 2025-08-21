/* ========================================
   ANALYSIS-PROGRESS.WIDGET.JS - Widget de progression d'analyse
   Chemin: /widgets/analysis-progress/analysis-progress.widget.js
   
   DESCRIPTION:
   Widget de barre de progression moderne avec style glassmorphism.
   Affiche la progression d'analyses (IA, upload, etc.) en haut de l'écran.
   Gère l'empilement de plusieurs barres et l'auto-fermeture.
   
   STRUCTURE DU FICHIER:
   1. CONFIGURATION ET ÉTAT
   2. INITIALISATION
   3. RENDU
   4. GESTION DE LA PROGRESSION
   5. GESTION DES INSTANCES
   6. ANIMATIONS
   7. DESTRUCTION
   
   UTILISATION:
   import { AnalysisProgressWidget } from '/Orixis-pwa/widgets/analysis-progress/analysis-progress.widget.js';
   const progress = new AnalysisProgressWidget({
       title: 'Analyse en cours',
       steps: ['Upload', 'Analyse IA', 'Sauvegarde']
   });
   
   API PUBLIQUE:
   - show() - Affiche la barre
   - setStep(index, message) - Change l'étape active
   - setProgress(percent, message) - Définit la progression
   - complete(message) - Marque comme terminé
   - error(message) - Affiche une erreur
   - destroy() - Détruit le widget
   
   OPTIONS:
   - title: string (défaut: 'Traitement en cours...') - Titre principal
   - steps: array (défaut: []) - Liste des étapes
   - autoClose: boolean (défaut: true) - Fermeture auto après succès
   - autoCloseDelay: number (défaut: 2000) - Délai avant fermeture (ms)
   - position: string (défaut: 'top') - Position (top/center)
   - theme: string (défaut: 'glass') - Thème visuel
   
   MODIFICATIONS:
   - 09/02/2025 : Création initiale avec gestion d'empilement
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

export class AnalysisProgressWidget {
    // Gestion des instances multiples
    static instances = [];
    static SPACING = 20; // Espacement entre barres
    static BASE_TOP = 20; // Position top de base
    
    constructor(config = {}) {
        // Charger le CSS
        this.loadCSS();
        
        // Configuration
        this.config = {
            // Apparence
            title: config.title || 'Traitement en cours...',
            subtitle: config.subtitle || '',
            theme: config.theme || 'glass', // 'glass' | 'solid' | 'minimal'
            
            // Étapes
            steps: config.steps || [],
            currentStep: 0,
            
            // Comportement
            autoClose: config.autoClose !== false,
            autoCloseDelay: config.autoCloseDelay || 2000,
            showPercent: config.showPercent !== false,
            animated: config.animated !== false,
            
            // Position
            position: config.position || 'top', // 'top' | 'center'
            
            // Callbacks
            onComplete: config.onComplete || null,
            onError: config.onError || null,
            onCancel: config.onCancel || null
        };
        
        // État
        this.state = {
            progress: 0,
            currentStep: 0,
            message: '',
            status: 'pending', // 'pending' | 'running' | 'success' | 'error'
            visible: false,
            destroyed: false
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            progressBar: null,
            progressFill: null,
            progressText: null,
            messageText: null,
            stepsContainer: null
        };
        
        // ID unique
        this.id = 'progress-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Timers
        this.autoCloseTimer = null;
        this.animationTimer = null;
        
        // Ajouter à la liste des instances
        AnalysisProgressWidget.instances.push(this);
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // SECTION 1 : INITIALISATION
    // ========================================
    
    /**
     * Charge le CSS
     */
    loadCSS() {
        const cssId = 'analysis-progress-widget-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = '/Orixis-pwa/widgets/analysis-progress/analysis-progress.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
        }
    }
    
    /**
     * Initialise le widget
     */
    init() {
        this.render();
        this.attachEvents();
        this.updatePosition();
        
        // Auto-show si des étapes sont définies
        if (this.config.steps.length > 0) {
            setTimeout(() => this.show(), 100);
        }
    }
    
    // ========================================
    // SECTION 2 : RENDU
    // ========================================
    
    /**
     * Génère le HTML
     */
    render() {
        // Créer le container principal
        const container = document.createElement('div');
        container.id = this.id;
        container.className = `analysis-progress-container theme-${this.config.theme}`;
        
        // Structure HTML
        container.innerHTML = `
            <div class="analysis-progress-wrapper">
                <!-- Header -->
                <div class="progress-header">
                    <div class="progress-title">
                        <span class="progress-icon">
                            <span class="spinner"></span>
                        </span>
                        <span class="progress-title-text">${this.config.title}</span>
                    </div>
                    <button class="progress-close" title="Fermer">×</button>
                </div>
                
                <!-- Subtitle si présent -->
                ${this.config.subtitle ? `
                    <div class="progress-subtitle">${this.config.subtitle}</div>
                ` : ''}
                
                <!-- Message -->
                <div class="progress-message"></div>
                
                <!-- Barre de progression -->
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                        <div class="progress-glow"></div>
                    </div>
                    <div class="progress-percent">0%</div>
                </div>
                
                <!-- Étapes si définies -->
                ${this.config.steps.length > 0 ? `
                    <div class="progress-steps">
                        ${this.config.steps.map((step, i) => `
                            <div class="progress-step ${i === 0 ? 'active' : ''}" data-step="${i}">
                                <span class="step-number">${i + 1}</span>
                                <span class="step-label">${step}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Ajouter au body
        document.body.appendChild(container);
        
        // Sauvegarder les références
        this.elements.container = container;
        this.elements.progressBar = container.querySelector('.progress-bar');
        this.elements.progressFill = container.querySelector('.progress-fill');
        this.elements.progressText = container.querySelector('.progress-percent');
        this.elements.messageText = container.querySelector('.progress-message');
        this.elements.stepsContainer = container.querySelector('.progress-steps');
    }
    
    // ========================================
    // SECTION 3 : GESTION DE LA PROGRESSION
    // ========================================
    
    /**
     * Affiche le widget
     */
    show() {
        if (this.state.destroyed) return;
        
        this.state.visible = true;
        this.state.status = 'running';
        
        // Animation d'apparition
        setTimeout(() => {
            this.elements.container.classList.add('visible');
        }, 10);
        
        // Mettre à jour les positions de toutes les barres
        this.updateAllPositions();
    }
    
    /**
     * Cache le widget
     */
    hide() {
        if (this.state.destroyed) return;
        
        this.state.visible = false;
        this.elements.container.classList.remove('visible');
        
        // Détruire après l'animation
        setTimeout(() => {
            this.destroy();
        }, 300);
    }
    
    /**
     * Définit l'étape active
     */
    setStep(index, message = '') {
        if (this.state.destroyed) return;
        
        this.state.currentStep = index;
        
        // Calculer la progression basée sur l'étape
        if (this.config.steps.length > 0) {
            const percent = ((index + 1) / this.config.steps.length) * 100;
            this.setProgress(percent, message || this.config.steps[index]);
        }
        
        // Mettre à jour les étapes visuellement
        if (this.elements.stepsContainer) {
            const steps = this.elements.stepsContainer.querySelectorAll('.progress-step');
            steps.forEach((step, i) => {
                step.classList.remove('active', 'completed');
                if (i < index) {
                    step.classList.add('completed');
                } else if (i === index) {
                    step.classList.add('active');
                }
            });
        }
    }
    
    /**
     * Définit la progression
     */
    setProgress(percent, message = '') {
        if (this.state.destroyed) return;
        
        // Limiter entre 0 et 100
        percent = Math.max(0, Math.min(100, percent));
        this.state.progress = percent;
        
        // Mettre à jour le message
        if (message) {
            this.state.message = message;
            this.elements.messageText.textContent = message;
        }
        
        // Animer la barre
        if (this.config.animated) {
            this.animateProgress(percent);
        } else {
            this.updateProgressBar(percent);
        }
        
        // Mettre à jour le texte
        if (this.config.showPercent) {
            this.elements.progressText.textContent = `${Math.round(percent)}%`;
        }
    }
    
    /**
     * Anime la progression
     */
    animateProgress(targetPercent) {
        const currentPercent = parseFloat(this.elements.progressFill.style.width) || 0;
        const diff = targetPercent - currentPercent;
        const duration = 500; // ms
        const steps = 30;
        const increment = diff / steps;
        let step = 0;
        
        clearInterval(this.animationTimer);
        
        this.animationTimer = setInterval(() => {
            step++;
            const newPercent = currentPercent + (increment * step);
            this.updateProgressBar(newPercent);
            
            if (step >= steps) {
                clearInterval(this.animationTimer);
                this.updateProgressBar(targetPercent);
            }
        }, duration / steps);
    }
    
    /**
     * Met à jour visuellement la barre
     */
    updateProgressBar(percent) {
        this.elements.progressFill.style.width = `${percent}%`;
        
        // Effet de glow plus intense vers la fin
        if (percent > 80) {
            this.elements.progressBar.classList.add('almost-done');
        }
    }
    
    /**
     * Marque comme terminé
     */
    complete(message = 'Terminé !') {
        if (this.state.destroyed) return;
        
        this.state.status = 'success';
        this.setProgress(100, message);
        
        // Changer l'icône
        const icon = this.elements.container.querySelector('.progress-icon');
        icon.innerHTML = '<span class="checkmark">✓</span>';
        
        // Ajouter la classe success
        this.elements.container.classList.add('success');
        
        // Callback
        if (this.config.onComplete) {
            this.config.onComplete();
        }
        
        // Auto-close
        if (this.config.autoClose) {
            this.autoCloseTimer = setTimeout(() => {
                this.hide();
            }, this.config.autoCloseDelay);
        }
    }
    
    /**
     * Affiche une erreur
     */
    error(message = 'Une erreur est survenue') {
        if (this.state.destroyed) return;
        
        this.state.status = 'error';
        this.state.message = message;
        
        // Mettre à jour l'affichage
        this.elements.messageText.textContent = message;
        this.elements.messageText.classList.add('error');
        
        // Changer l'icône
        const icon = this.elements.container.querySelector('.progress-icon');
        icon.innerHTML = '<span class="error-icon">⚠</span>';
        
        // Ajouter la classe error
        this.elements.container.classList.add('error');
        
        // Arrêter l'animation
        clearInterval(this.animationTimer);
        
        // Callback
        if (this.config.onError) {
            this.config.onError(message);
        }
        
        // Auto-close après un délai plus long
        if (this.config.autoClose) {
            this.autoCloseTimer = setTimeout(() => {
                this.hide();
            }, this.config.autoCloseDelay * 2);
        }
    }
    
    // ========================================
    // SECTION 4 : GESTION DES INSTANCES
    // ========================================
    
    /**
     * Met à jour la position de cette barre
     */
    updatePosition() {
        if (this.state.destroyed) return;
        
        const index = AnalysisProgressWidget.instances.indexOf(this);
        if (index === -1) return;
        
        // Calculer la position top
        const visibleBefore = AnalysisProgressWidget.instances
            .slice(0, index)
            .filter(w => w.state.visible && !w.state.destroyed);
        
        let topPosition = AnalysisProgressWidget.BASE_TOP;
        
        visibleBefore.forEach(widget => {
            const height = widget.elements.container.offsetHeight;
            topPosition += height + AnalysisProgressWidget.SPACING;
        });
        
        this.elements.container.style.top = `${topPosition}px`;
    }
    
    /**
     * Met à jour toutes les positions
     */
    updateAllPositions() {
        AnalysisProgressWidget.instances
            .filter(w => !w.state.destroyed)
            .forEach(w => w.updatePosition());
    }
    
    // ========================================
    // SECTION 5 : ÉVÉNEMENTS
    // ========================================
    
    /**
     * Attache les événements
     */
    attachEvents() {
        // Bouton fermer
        const closeBtn = this.elements.container.querySelector('.progress-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (this.config.onCancel) {
                    this.config.onCancel();
                }
                this.hide();
            });
        }
    }
    
    // ========================================
    // SECTION 6 : DESTRUCTION
    // ========================================
    
    /**
     * Détruit le widget
     */
    destroy() {
        if (this.state.destroyed) return;
        
        this.state.destroyed = true;
        
        // Clear timers
        clearTimeout(this.autoCloseTimer);
        clearInterval(this.animationTimer);
        
        // Retirer de la liste des instances
        const index = AnalysisProgressWidget.instances.indexOf(this);
        if (index > -1) {
            AnalysisProgressWidget.instances.splice(index, 1);
        }
        
        // Retirer du DOM
        if (this.elements.container && this.elements.container.parentNode) {
            this.elements.container.remove();
        }
        
        // Mettre à jour les positions des autres
        this.updateAllPositions();
        
        console.log('🗑️ AnalysisProgressWidget détruit:', this.id);
    }
    
    /**
     * Détruit toutes les instances
     */
    static destroyAll() {
        [...AnalysisProgressWidget.instances].forEach(w => w.destroy());
    }
}

// Export par défaut
export default AnalysisProgressWidget;