// ========================================
// LOGIN.CONFIG.JS - Configuration locale du module login
// Chemin: modules/login/login.config.js
//
// DESCRIPTION:
// Configuration et factories pour le module login
// ========================================

import { 
    DropdownList,
    Numpad,
    notify
} from '../../src/components/index.js';

// ========================================
// FACTORY : DROPDOWN UTILISATEURS
// ========================================

export function createUserDropdown(container, options = {}) {
    return new DropdownList({
        container,
        placeholder: '-- Choisir un utilisateur --',
        searchable: true,
        showIcons: true,
        keepPlaceholder: false,
        ...options
    });
}

// ========================================
// FACTORY : NUMPAD
// ========================================

export function createLoginNumpad(container, options = {}) {
    // Créer un numpad custom pour le login
    const numpadHTML = `
        <div class="login-numpad-grid">
            <button type="button" class="login-numpad-btn" data-value="1">1</button>
            <button type="button" class="login-numpad-btn" data-value="2">2</button>
            <button type="button" class="login-numpad-btn" data-value="3">3</button>
            <button type="button" class="login-numpad-btn" data-value="4">4</button>
            <button type="button" class="login-numpad-btn" data-value="5">5</button>
            <button type="button" class="login-numpad-btn" data-value="6">6</button>
            <button type="button" class="login-numpad-btn" data-value="7">7</button>
            <button type="button" class="login-numpad-btn" data-value="8">8</button>
            <button type="button" class="login-numpad-btn" data-value="9">9</button>
            <button type="button" class="login-numpad-btn login-numpad-clear" data-action="clear">C</button>
            <button type="button" class="login-numpad-btn login-numpad-zero" data-value="0">0</button>
            <button type="button" class="login-numpad-btn login-numpad-delete" data-action="delete">⌫</button>
        </div>
    `;
    
    container.innerHTML = numpadHTML;
    
    // Retourner un objet avec les méthodes nécessaires
    const numpadApi = {
        value: '',
        maxLength: options.maxLength || 4,
        onInput: options.onInput || null,
        
        clear() {
            this.value = '';
            if (this.onInput) this.onInput(this.value);
        },
        
        inputDigit(digit) {
            if (this.value.length < this.maxLength) {
                this.value += digit;
                if (this.onInput) this.onInput(this.value);
            }
        },
        
        backspace() {
            if (this.value.length > 0) {
                this.value = this.value.slice(0, -1);
                if (this.onInput) this.onInput(this.value);
            }
        },
        
        setDisabled(disabled) {
            const buttons = container.querySelectorAll('.login-numpad-btn');
            buttons.forEach(btn => {
                btn.disabled = disabled;
            });
        },
        
        // Pour compatibilité avec le code existant
        open() {},
        getValue() { return this.value; },
        setValue(val) { this.value = val; }
    };
    
    // Attacher les événements
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.login-numpad-btn');
        if (!btn) return;
        
        const value = btn.dataset.value;
        const action = btn.dataset.action;
        
        if (value) {
            numpadApi.inputDigit(value);
        } else if (action === 'clear') {
            numpadApi.clear();
        } else if (action === 'delete') {
            numpadApi.backspace();
        }
    });
    
    return numpadApi;
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
        invalidCode: 'Code incorrect',
        attemptsRemaining: (remaining) => `${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`,
        tooManyAttempts: 'Trop de tentatives. Veuillez attendre 3 minutes.',
        success: 'Connexion réussie ! Redirection...',
        error: 'Erreur lors de la connexion',
        noUsers: 'Aucun utilisateur trouvé'
    }
};

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    createUserDropdown,
    createLoginNumpad,
    LOGIN_CONFIG,
    notify
};