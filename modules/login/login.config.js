// ========================================
// LOGIN.CONFIG.JS - Configuration locale
// Chemin: modules/login/login.config.js
// ========================================

import { 
    DropdownList,
    notify
} from '../../src/components/index.js';

// ========================================
// FACTORIES
// ========================================

export function createUserDropdown(container, options = {}) {
    return new DropdownList({
        container,
        placeholder: '-- Choisir un utilisateur --',
        searchable: true,
        showIcons: true,
        size: 'large',
        ...options
    });
}

export function createLoginNumpad(container, options = {}) {
    // Créer le numpad HTML personnalisé
    const numpadHTML = `
        <div class="login-numpad-grid">
            ${[1,2,3,4,5,6,7,8,9].map(n => 
                `<button type="button" class="login-numpad-btn" data-value="${n}">${n}</button>`
            ).join('')}
            <button type="button" class="login-numpad-btn login-numpad-clear" data-action="clear">C</button>
            <button type="button" class="login-numpad-btn login-numpad-zero" data-value="0">0</button>
            <button type="button" class="login-numpad-btn login-numpad-delete" data-action="delete">⌫</button>
        </div>
    `;
    
    container.innerHTML = numpadHTML;
    
    // API du numpad
    const api = {
        value: '',
        maxLength: options.maxLength || 4,
        onInput: options.onInput || null,
        onComplete: options.onComplete || null,
        
        init() {
            container.addEventListener('click', this.handleClick.bind(this));
        },
        
        handleClick(e) {
            const btn = e.target.closest('.login-numpad-btn');
            if (!btn || btn.disabled) return;
            
            const value = btn.dataset.value;
            const action = btn.dataset.action;
            
            if (value) {
                this.inputDigit(value);
            } else if (action === 'clear') {
                this.clear();
            } else if (action === 'delete') {
                this.backspace();
            }
        },
        
        inputDigit(digit) {
            if (this.value.length < this.maxLength) {
                this.value += digit;
                if (this.onInput) this.onInput(this.value);
                
                if (this.value.length === this.maxLength && this.onComplete) {
                    this.onComplete(this.value);
                }
            }
        },
        
        backspace() {
            if (this.value.length > 0) {
                this.value = this.value.slice(0, -1);
                if (this.onInput) this.onInput(this.value);
            }
        },
        
        clear() {
            this.value = '';
            if (this.onInput) this.onInput(this.value);
        },
        
        setDisabled(disabled) {
            const buttons = container.querySelectorAll('.login-numpad-btn');
            buttons.forEach(btn => btn.disabled = disabled);
        },
        
        reset() {
            this.clear();
        }
    };
    
    api.init();
    return api;
}

// ========================================
// CONFIGURATION
// ========================================

export const LOGIN_CONFIG = {
    maxAttempts: 3,
    lockDuration: 3 * 60 * 1000, // 3 minutes
    rememberDays: 30,
    successRedirect: '../home/home.html',
    
    messages: {
        loading: 'Chargement des utilisateurs...',
        selectUser: 'Veuillez sélectionner votre nom',
        enterPin: 'Veuillez entrer votre code PIN',
        invalidCode: 'Code incorrect',
        attemptsRemaining: (n) => `${n} tentative${n > 1 ? 's' : ''} restante${n > 1 ? 's' : ''}`,
        tooManyAttempts: 'Trop de tentatives. Veuillez attendre 3 minutes.',
        success: 'Connexion réussie ! Redirection...',
        error: 'Erreur lors de la connexion',
        noUsers: 'Aucun utilisateur trouvé'
    }
};

// ========================================
// EXPORT
// ========================================

export default {
    createUserDropdown,
    createLoginNumpad,
    LOGIN_CONFIG,
    notify
};