// ========================================
// STEPPER.COMPONENT.JS - Composant stepper réutilisable
// Chemin: src/js/shared/ui/stepper.component.js
//
// DESCRIPTION:
// Composant stepper (indicateur d'étapes) réutilisable avec navigation
// Extrait du module commandes pour réutilisation
//
// API PUBLIQUE:
// - constructor(config)
// - goToStep(step)
// - nextStep()
// - prevStep()
// - getCurrentStep()
// - setStepCompleted(step)
// - setStepActive(step)
// - updateStepContent(step, content)
// - destroy()
//
// CALLBACKS:
// - onStepChange: (step, direction) => void
// - onValidateStep: (step) => Promise<boolean>
// - onStepCompleted: (step) => void
//
// EXEMPLE:
// const stepper = new Stepper({
//     container: '.stepper',
//     steps: [
//         {id: 1, label: 'Client', content: 'stepContent1'},
//         {id: 2, label: 'Produits', content: 'stepContent2'}
//     ],
//     onStepChange: (step) => console.log('Étape:', step)
// });
// ========================================

import { generateId } from '../../index.js';

export class Stepper {
    constructor(config) {
        this.id = generateId('stepper');
        
        // Configuration par défaut
        this.config = {
            container: null,
            steps: [],
            currentStep: 1,
            showStepNumbers: true,
            showStepLabels: true,
            allowSkipSteps: false,
            
            // Classes CSS (compatibilité avec le code existant)
            classes: {
                stepper: 'stepper',
                step: 'step',
                stepNumber: 'step-number',
                stepLabel: 'step-label',
                stepContent: 'step-content',
                active: 'active',
                completed: 'completed',
                hidden: 'hidden'
            },
            
            // Sélecteurs pour compatibilité
            selectors: {
                stepPrefix: 'step',        // step1, step2, etc.
                contentPrefix: 'stepContent' // stepContent1, stepContent2, etc.
            },
            
            // Callbacks
            onStepChange: null,
            onValidateStep: null,
            onStepCompleted: null,
            onInit: null,
            
            ...config
        };
        
        // État interne
        this.state = {
            currentStep: this.config.currentStep,
            completedSteps: new Set(),
            initialized: false
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            steppers: new Map(),
            contents: new Map(),
            navigationButtons: new Map()
        };
        
        this.init();
    }
    
    /**
     * Initialisation du composant
     */
    init() {
        try {
            // Récupérer le container
            if (typeof this.config.container === 'string') {
                this.elements.container = document.querySelector(this.config.container);
            } else {
                this.elements.container = this.config.container;
            }
            
            if (!this.elements.container) {
                console.error('Stepper: Container non trouvé');
                return;
            }
            
            // Auto-charger les styles
            this.loadStyles();
            
            // Détecter les étapes existantes ou créer
            if (this.config.steps.length === 0) {
                this.detectExistingSteps();
            } else {
                this.createSteps();
            }
            
            // Récupérer les références DOM
            this.getElementReferences();
            
            // Initialiser l'affichage
            this.updateDisplay();
            
            // Marquer comme initialisé
            this.state.initialized = true;
            
            // Callback d'initialisation
            if (this.config.onInit) {
                this.config.onInit(this);
            }
            
            console.log('✅ Stepper initialisé:', this.id);
            
        } catch (error) {
            console.error('❌ Erreur initialisation Stepper:', error);
        }
    }
    
    /**
     * Charger les styles automatiquement
     */
    loadStyles() {
        const existingLink = document.querySelector('link[href*="stepper.css"]');
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../src/css/shared/ui/stepper.css';
            document.head.appendChild(link);
            console.log('📦 CSS Stepper chargé');
        }
    }
    
    /**
     * Détecter les étapes existantes dans le DOM (mode compatibilité)
     */
    detectExistingSteps() {
        const stepElements = this.elements.container.querySelectorAll(`.${this.config.classes.step}`);
        
        stepElements.forEach((stepEl, index) => {
            const stepNumber = index + 1;
            const labelEl = stepEl.querySelector(`.${this.config.classes.stepLabel}`);
            const label = labelEl ? labelEl.textContent : `Étape ${stepNumber}`;
            
            this.config.steps.push({
                id: stepNumber,
                label: label,
                content: `${this.config.selectors.contentPrefix}${stepNumber}`
            });
        });
        
        console.log(`🔍 ${this.config.steps.length} étapes détectées`);
    }
    
    /**
     * Créer les étapes dans le DOM
     */
    createSteps() {
        if (this.elements.container.querySelector(`.${this.config.classes.step}`)) {
            console.log('🔄 Étapes existantes détectées, mise à jour...');
            return;
        }
        
        let html = '';
        
        this.config.steps.forEach((step, index) => {
            const stepNumber = step.id || (index + 1);
            html += `
                <div class="${this.config.classes.step}" id="${this.config.selectors.stepPrefix}${stepNumber}">
                    ${this.config.showStepNumbers ? `<div class="${this.config.classes.stepNumber}">${stepNumber}</div>` : ''}
                    ${this.config.showStepLabels ? `<div class="${this.config.classes.stepLabel}">${step.label}</div>` : ''}
                </div>
            `;
        });
        
        this.elements.container.innerHTML = html;
        console.log(`✅ ${this.config.steps.length} étapes créées`);
    }
    
    /**
     * Récupérer les références DOM
     */
    getElementReferences() {
        // Références des étapes
        this.config.steps.forEach((step, index) => {
            const stepNumber = step.id || (index + 1);
            
            // Élément stepper
            const stepEl = document.getElementById(`${this.config.selectors.stepPrefix}${stepNumber}`);
            if (stepEl) {
                this.elements.steppers.set(stepNumber, stepEl);
            }
            
            // Élément contenu
            const contentEl = document.getElementById(step.content || `${this.config.selectors.contentPrefix}${stepNumber}`);
            if (contentEl) {
                this.elements.contents.set(stepNumber, contentEl);
            }
        });
        
        console.log(`📋 Références DOM: ${this.elements.steppers.size} steppers, ${this.elements.contents.size} contenus`);
    }
    
    /**
     * Mettre à jour l'affichage
     */
    updateDisplay() {
        const currentStep = this.state.currentStep;
        
        // Mettre à jour tous les steppers
        this.elements.steppers.forEach((stepEl, stepNumber) => {
            stepEl.classList.remove(this.config.classes.active, this.config.classes.completed);
            
            if (stepNumber === currentStep) {
                stepEl.classList.add(this.config.classes.active);
            } else if (stepNumber < currentStep || this.state.completedSteps.has(stepNumber)) {
                stepEl.classList.add(this.config.classes.completed);
            }
        });
        
        // Mettre à jour les contenus
        this.elements.contents.forEach((contentEl, stepNumber) => {
            if (stepNumber === currentStep) {
                contentEl.classList.remove(this.config.classes.hidden);
            } else {
                contentEl.classList.add(this.config.classes.hidden);
            }
        });
        
        console.log(`🎨 Affichage mis à jour pour l'étape ${currentStep}`);
    }
    
    /**
     * Aller à une étape spécifique
     */
    async goToStep(step, force = false) {
        try {
            // Vérifier si l'étape existe
            if (!this.elements.steppers.has(step)) {
                console.warn(`⚠️ Étape ${step} n'existe pas`);
                return false;
            }
            
            // Vérifier si on peut passer à cette étape
            if (!force && !this.config.allowSkipSteps && step > this.state.currentStep + 1) {
                console.warn(`⚠️ Impossible de passer directement à l'étape ${step}`);
                return false;
            }
            
            // Valider l'étape actuelle si on avance
            if (step > this.state.currentStep && this.config.onValidateStep) {
                const isValid = await this.config.onValidateStep(this.state.currentStep);
                if (!isValid) {
                    console.log(`❌ Validation échouée pour l'étape ${this.state.currentStep}`);
                    return false;
                }
            }
            
            const previousStep = this.state.currentStep;
            const direction = step > previousStep ? 'next' : 'prev';
            
            // Marquer l'étape précédente comme complétée si on avance
            if (step > previousStep) {
                this.state.completedSteps.add(previousStep);
                
                if (this.config.onStepCompleted) {
                    this.config.onStepCompleted(previousStep);
                }
            }
            
            // Changer l'étape
            this.state.currentStep = step;
            
            // Mettre à jour l'affichage
            this.updateDisplay();
            
            // Callback de changement d'étape
            if (this.config.onStepChange) {
                this.config.onStepChange(step, direction, previousStep);
            }
            
            console.log(`✅ Passage à l'étape ${step}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erreur passage étape ${step}:`, error);
            return false;
        }
    }
    
    /**
     * Aller à l'étape suivante
     */
    async nextStep() {
        const nextStep = this.state.currentStep + 1;
        
        if (nextStep <= this.config.steps.length) {
            return await this.goToStep(nextStep);
        }
        
        console.log('🏁 Dernière étape atteinte');
        return false;
    }
    
    /**
     * Aller à l'étape précédente
     */
    async prevStep() {
        const prevStep = this.state.currentStep - 1;
        
        if (prevStep >= 1) {
            return await this.goToStep(prevStep, true); // Force car on recule
        }
        
        console.log('🏁 Première étape atteinte');
        return false;
    }
    
    /**
     * Obtenir l'étape actuelle
     */
    getCurrentStep() {
        return this.state.currentStep;
    }
    
    /**
     * Marquer une étape comme complétée
     */
    setStepCompleted(step, completed = true) {
        if (completed) {
            this.state.completedSteps.add(step);
        } else {
            this.state.completedSteps.delete(step);
        }
        
        this.updateDisplay();
    }
    
    /**
     * Forcer une étape comme active
     */
    setStepActive(step) {
        this.state.currentStep = step;
        this.updateDisplay();
    }
    
    /**
     * Mettre à jour le contenu d'une étape
     */
    updateStepContent(step, content) {
        const contentEl = this.elements.contents.get(step);
        if (contentEl) {
            contentEl.innerHTML = content;
        }
    }
    
    /**
     * Obtenir les étapes complétées
     */
    getCompletedSteps() {
        return Array.from(this.state.completedSteps);
    }
    
    /**
     * Réinitialiser le stepper
     */
    reset() {
        this.state.currentStep = 1;
        this.state.completedSteps.clear();
        this.updateDisplay();
    }
    
    /**
     * Vérifier si une étape est accessible
     */
    isStepAccessible(step) {
        if (this.config.allowSkipSteps) return true;
        return step <= this.state.currentStep + 1;
    }
    
    /**
     * Obtenir les informations sur l'état
     */
    getState() {
        return {
            currentStep: this.state.currentStep,
            completedSteps: this.getCompletedSteps(),
            totalSteps: this.config.steps.length,
            isFirstStep: this.state.currentStep === 1,
            isLastStep: this.state.currentStep === this.config.steps.length
        };
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        // Nettoyer les références
        this.elements.steppers.clear();
        this.elements.contents.clear();
        this.elements.navigationButtons.clear();
        
        // Réinitialiser l'état
        this.state = {
            currentStep: 1,
            completedSteps: new Set(),
            initialized: false
        };
        
        console.log('🧹 Stepper détruit:', this.id);
    }
}

// ========================================
// FONCTIONS DE COMPATIBILITÉ LEGACY
// Pour maintenir la compatibilité avec le code existant
// ========================================

/**
 * Créer un stepper en mode compatibilité avec le code commandes existant
 */
export function createLegacyStepper(container = '.stepper') {
    const stepper = new Stepper({
        container: container,
        // Les étapes seront auto-détectées depuis le DOM existant
        steps: [],
        onStepChange: (step, direction, previousStep) => {
            console.log(`🔄 Stepper legacy: étape ${previousStep} → ${step}`);
        }
    });
    
    // Exposer les méthodes legacy
    window.stepperGoToStep = (step) => stepper.goToStep(step);
    window.stepperNextStep = () => stepper.nextStep();
    window.stepperPrevStep = () => stepper.prevStep();
    window.stepperGetCurrentStep = () => stepper.getCurrentStep();
    window.stepperSetCompleted = (step) => stepper.setStepCompleted(step);
    
    return stepper;
}

export default Stepper;