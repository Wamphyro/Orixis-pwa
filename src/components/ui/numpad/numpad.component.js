// ========================================
// NUMPAD.COMPONENT.JS - Composant pavé numérique réutilisable
// Chemin: src/components/ui/numpad/numpad.component.js
//
// DESCRIPTION:
// Composant autonome de pavé numérique virtuel
// Utilisable pour saisie de numéros, codes PIN, montants, etc.
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - constructor(config)
// - open(initialValue)
// - close()
// - getValue()
// - setValue(value)
// - clear()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onInput: (value) => void
// - onSubmit: (value) => void
// - onCancel: () => void
// - onClose: () => void
//
// EXEMPLE:
// const numpad = new Numpad({
//     title: 'Entrez le code',
//     maxLength: 6,
//     onSubmit: (value) => console.log('Code:', value)
// });
// numpad.open();
// ========================================

export class Numpad {
    constructor(config) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'numpad-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            title: 'Saisir un nombre',
            placeholder: '0',
            maxLength: 10,
            allowDecimal: true,
            allowNegative: false,
            autoSubmitLength: null,  // Submit auto après N caractères
            showDisplay: true,
            showCancel: true,
            showSubmit: true,
            showClear: true,
            submitText: 'Valider',
            cancelText: 'Annuler',
            theme: 'default',
            
            // Callbacks
            onInput: null,
            onSubmit: null,
            onCancel: null,
            onClose: null,
            
            ...config
        };
        
        // État interne
        this.state = {
            isOpen: false,
            value: '',
            cursorPosition: 0
        };
        
        // Éléments DOM
        this.elements = {
            overlay: null,
            container: null,
            display: null,
            buttons: {},
            submitBtn: null,
            cancelBtn: null
        };
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        // Charger les styles
        this.loadStyles();
        
        // Créer la structure mais ne pas l'afficher
        this.createStructure();
        
        console.log('✅ Numpad initialisé:', this.id);
    }
    
    loadStyles() {
        const styleId = 'numpad-styles';
        
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = '../src/components/ui/numpad/numpad.css';
            document.head.appendChild(link);
            
            console.log('📦 CSS Numpad chargé');
        }
    }
    
    createStructure() {
        // Créer l'overlay
        this.elements.overlay = document.createElement('div');
        this.elements.overlay.className = 'numpad-overlay';
        this.elements.overlay.style.display = 'none';
        
        // Créer le container
        this.elements.container = document.createElement('div');
        this.elements.container.className = `numpad-container theme-${this.config.theme}`;
        this.elements.container.id = this.id;
        
        // Structure HTML
        this.elements.container.innerHTML = this.generateHTML();
        
        // Ajouter au DOM
        this.elements.overlay.appendChild(this.elements.container);
        document.body.appendChild(this.elements.overlay);
        
        // Cacher les éléments DOM
        this.cacheElements();
        
        // Attacher les événements
        this.attachEvents();
    }
    
    generateHTML() {
        return `
            <div class="numpad-header">
                <h3 class="numpad-title">${this.config.title}</h3>
                <button class="numpad-close" aria-label="Fermer">×</button>
            </div>
            
            ${this.config.showDisplay ? `
                <div class="numpad-display">
                    <input type="text" 
                           class="numpad-input" 
                           readonly 
                           placeholder="${this.config.placeholder}"
                           maxlength="${this.config.maxLength}">
                </div>
            ` : ''}
            
            <div class="numpad-buttons">
                <div class="numpad-grid">
                    ${this.generateButtons()}
                </div>
                
                <div class="numpad-actions">
                    ${this.config.showClear ? `
                        <button class="numpad-btn numpad-clear">C</button>
                    ` : ''}
                    ${this.config.allowDecimal ? `
                        <button class="numpad-btn numpad-decimal">.</button>
                    ` : ''}
                    ${this.config.allowNegative ? `
                        <button class="numpad-btn numpad-negative">+/-</button>
                    ` : ''}
                    <button class="numpad-btn numpad-backspace">⌫</button>
                </div>
                
                ${this.config.showCancel || this.config.showSubmit ? `
                    <div class="numpad-footer">
                        ${this.config.showCancel ? `
                            <button class="numpad-btn numpad-cancel">${this.config.cancelText}</button>
                        ` : ''}
                        ${this.config.showSubmit ? `
                            <button class="numpad-btn numpad-submit">${this.config.submitText}</button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    generateButtons() {
        let html = '';
        
        // Boutons 1-9
        for (let i = 1; i <= 9; i++) {
            html += `<button class="numpad-btn numpad-digit" data-value="${i}">${i}</button>`;
        }
        
        // Bouton 0
        html += `<button class="numpad-btn numpad-digit numpad-zero" data-value="0">0</button>`;
        
        return html;
    }
    
    cacheElements() {
        const container = this.elements.container;
        
        this.elements.display = container.querySelector('.numpad-input');
        this.elements.closeBtn = container.querySelector('.numpad-close');
        this.elements.submitBtn = container.querySelector('.numpad-submit');
        this.elements.cancelBtn = container.querySelector('.numpad-cancel');
        
        // Boutons numériques
        container.querySelectorAll('.numpad-digit').forEach(btn => {
            this.elements.buttons[btn.dataset.value] = btn;
        });
        
        // Boutons spéciaux
        this.elements.buttons.clear = container.querySelector('.numpad-clear');
        this.elements.buttons.decimal = container.querySelector('.numpad-decimal');
        this.elements.buttons.negative = container.querySelector('.numpad-negative');
        this.elements.buttons.backspace = container.querySelector('.numpad-backspace');
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Fermeture
        this.elements.closeBtn.addEventListener('click', () => this.close());
        this.elements.overlay.addEventListener('click', (e) => {
            if (e.target === this.elements.overlay) {
                this.close();
            }
        });
        
        // Boutons numériques
        Object.entries(this.elements.buttons).forEach(([key, btn]) => {
            if (btn && key.match(/^\d$/)) {
                btn.addEventListener('click', () => this.inputDigit(key));
            }
        });
        
        // Boutons spéciaux
        if (this.elements.buttons.clear) {
            this.elements.buttons.clear.addEventListener('click', () => this.clear());
        }
        
        if (this.elements.buttons.decimal) {
            this.elements.buttons.decimal.addEventListener('click', () => this.inputDecimal());
        }
        
        if (this.elements.buttons.negative) {
            this.elements.buttons.negative.addEventListener('click', () => this.toggleNegative());
        }
        
        if (this.elements.buttons.backspace) {
            this.elements.buttons.backspace.addEventListener('click', () => this.backspace());
        }
        
        // Actions
        if (this.elements.submitBtn) {
            this.elements.submitBtn.addEventListener('click', () => this.submit());
        }
        
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', () => this.cancel());
        }
        
        // Clavier physique
        this.handleKeyboard = (e) => this.onKeyPress(e);
    }
    
    onKeyPress(e) {
        if (!this.state.isOpen) return;
        
        // Chiffres
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            this.inputDigit(e.key);
        }
        // Point décimal
        else if (e.key === '.' && this.config.allowDecimal) {
            e.preventDefault();
            this.inputDecimal();
        }
        // Effacer
        else if (e.key === 'Backspace') {
            e.preventDefault();
            this.backspace();
        }
        // Valider
        else if (e.key === 'Enter') {
            e.preventDefault();
            this.submit();
        }
        // Annuler
        else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }
    
    // ========================================
    // MÉTHODES DE SAISIE
    // ========================================
    
    inputDigit(digit) {
        // Vérifier la longueur max
        if (this.state.value.length >= this.config.maxLength) {
            return;
        }
        
        // Ajouter le chiffre
        this.state.value += digit;
        this.updateDisplay();
        
        // Callback
        if (this.config.onInput) {
            this.config.onInput(this.state.value);
        }
        
        // Auto-submit si longueur atteinte
        if (this.config.autoSubmitLength && 
            this.state.value.length === this.config.autoSubmitLength) {
            setTimeout(() => this.submit(), 100);
        }
    }
    
    inputDecimal() {
        // Vérifier qu'il n'y a pas déjà un point
        if (this.state.value.includes('.')) {
            return;
        }
        
        // Ajouter le point
        this.state.value += '.';
        this.updateDisplay();
        
        if (this.config.onInput) {
            this.config.onInput(this.state.value);
        }
    }
    
    toggleNegative() {
        if (this.state.value.startsWith('-')) {
            this.state.value = this.state.value.substring(1);
        } else {
            this.state.value = '-' + this.state.value;
        }
        
        this.updateDisplay();
        
        if (this.config.onInput) {
            this.config.onInput(this.state.value);
        }
    }
    
    backspace() {
        if (this.state.value.length > 0) {
            this.state.value = this.state.value.slice(0, -1);
            this.updateDisplay();
            
            if (this.config.onInput) {
                this.config.onInput(this.state.value);
            }
        }
    }
    
    clear() {
        this.state.value = '';
        this.updateDisplay();
        
        if (this.config.onInput) {
            this.config.onInput(this.state.value);
        }
    }
    
    updateDisplay() {
        if (this.elements.display) {
            this.elements.display.value = this.state.value;
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Ouvrir le pavé numérique
     * @param {string} initialValue - Valeur initiale
     */
    open(initialValue = '') {
        this.state.value = String(initialValue);
        this.state.isOpen = true;
        
        this.updateDisplay();
        
        // Afficher
        this.elements.overlay.style.display = 'flex';
        
        // Animation
        setTimeout(() => {
            this.elements.overlay.classList.add('numpad-open');
        }, 10);
        
        // Focus sur le display
        if (this.elements.display) {
            this.elements.display.focus();
        }
        
        // Écouter le clavier
        document.addEventListener('keydown', this.handleKeyboard);
    }
    
    /**
     * Fermer le pavé numérique
     */
    close() {
        this.state.isOpen = false;
        
        // Animation
        this.elements.overlay.classList.remove('numpad-open');
        
        // Masquer après animation
        setTimeout(() => {
            this.elements.overlay.style.display = 'none';
        }, 300);
        
        // Arrêter d'écouter le clavier
        document.removeEventListener('keydown', this.handleKeyboard);
        
        // Callback
        if (this.config.onClose) {
            this.config.onClose();
        }
    }
    
    /**
     * Valider la saisie
     */
    submit() {
        if (this.config.onSubmit) {
            this.config.onSubmit(this.state.value);
        }
        
        this.close();
    }
    
    /**
     * Annuler la saisie
     */
    cancel() {
        if (this.config.onCancel) {
            this.config.onCancel();
        }
        
        this.close();
    }
    
    /**
     * Obtenir la valeur actuelle
     */
    getValue() {
        return this.state.value;
    }
    
    /**
     * Définir la valeur
     */
    setValue(value) {
        this.state.value = String(value);
        this.updateDisplay();
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        // Fermer si ouvert
        if (this.state.isOpen) {
            this.close();
        }
        
        // Retirer du DOM
        if (this.elements.overlay) {
            this.elements.overlay.remove();
        }
        
        // Nettoyer
        this.elements = {};
        this.state = {
            isOpen: false,
            value: '',
            cursorPosition: 0
        };
        
        console.log('🧹 Numpad détruit:', this.id);
    }
}

// Export par défaut
export default Numpad;