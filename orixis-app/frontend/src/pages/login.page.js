// src/js/pages/login.page.js
import { APP_CONFIG, getMessage } from '../config/app.config.js';
import { authService } from '../services/auth.service.js';
import { $, toggleClass, setDisabled } from '../utils/dom.utils.js';

export class LoginPage {
    constructor() {
        this.pinCode = '';
        this.attempts = 0;
        this.lockoutTimer = null;
        
        this.init();
    }

    init() {
        // Vérifier si déjà connecté
        if (authService.isAuthenticated()) {
            window.location.href = APP_CONFIG.urls.home;
            return;
        }

        // Remplir la liste des magasins
        this.populateStores();
        
        // Attacher les événements
        this.attachEvents();
        
        // Vérifier le lockout
        this.checkLockout();
    }

    populateStores() {
        const selectElement = $('#magasin');
        if (!selectElement) return;

        // Trier les magasins par code
        const storesSorted = Object.entries(APP_CONFIG.stores)
            .sort((a, b) => a[0].localeCompare(b[0]));

        storesSorted.forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            selectElement.appendChild(option);
        });
    }

    attachEvents() {
        // Boutons du pavé numérique
        for (let i = 0; i <= 9; i++) {
            const btn = $(`#btn-${i}`) || document.querySelector(`button[onclick="addDigit(${i})"]`);
            if (btn) {
                btn.onclick = () => this.addDigit(i);
            }
        }

        // Bouton effacer
        const deleteBtn = $('#btn-delete') || document.querySelector('button[onclick="deleteDigit()"]');
        if (deleteBtn) {
            deleteBtn.onclick = () => this.deleteDigit();
        }

        // Bouton valider
        const validateBtn = $('#btn-validate') || document.querySelector('button[onclick="validatePin()"]');
        if (validateBtn) {
            validateBtn.onclick = () => this.validatePin();
        }

        // Entrée clavier pour le PIN
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                this.addDigit(parseInt(e.key));
            } else if (e.key === 'Backspace') {
                this.deleteDigit();
            } else if (e.key === 'Enter' && this.pinCode.length === 4) {
                this.validatePin();
            }
        });
    }

    addDigit(digit) {
        if (this.pinCode.length < 4) {
            this.pinCode += digit;
            this.updatePinDisplay();

            // Auto-validation à 4 chiffres
            if (this.pinCode.length === 4) {
                setTimeout(() => this.validatePin(), 200);
            }
        }
    }

    deleteDigit() {
        if (this.pinCode.length > 0) {
            this.pinCode = this.pinCode.slice(0, -1);
            this.updatePinDisplay();
        }
    }

    updatePinDisplay() {
        for (let i = 1; i <= 4; i++) {
            const dot = $(`#pin${i}`);
            if (dot) {
                if (i <= this.pinCode.length) {
                    dot.textContent = '•';
                    dot.classList.add('filled');
                } else {
                    dot.textContent = '';
                    dot.classList.remove('filled');
                }
            }
        }
    }

    async validatePin() {
        if (this.pinCode.length !== 4) {
            this.showError('Veuillez entrer un code à 4 chiffres');
            return;
        }

        const storeCode = $('#magasin')?.value;
        if (!storeCode) {
            this.showError('Veuillez sélectionner un magasin');
            return;
        }

        // Cacher les messages précédents
        this.hideMessages();

        // Tentative de connexion
        const remember = $('#remember')?.checked || false;
        const result = authService.login(storeCode, this.pinCode, remember);

        if (result.success) {
            // Connexion réussie
            this.showSuccess(getMessage('success', 'loginSuccess'));
            
            // Redirection après animation
            setTimeout(() => {
                window.location.href = APP_CONFIG.urls.home;
            }, 1000);
            
        } else {
            // Échec
            this.attempts++;
            this.showError(result.error);
            
            if (result.locked) {
                this.handleLockout();
            }
            
            // Reset le code
            this.pinCode = '';
            this.updatePinDisplay();
            
            // Animation shake
            const container = $('.login-container');
            if (container) {
                container.classList.add('shake');
                setTimeout(() => {
                    container.classList.remove('shake');
                }, 500);
            }
        }
    }

    checkLockout() {
        const remaining = authService.getLockoutRemaining();
        if (remaining > 0) {
            this.handleLockout();
        }
    }

    handleLockout() {
        this.disableNumpad(true);
        
        const updateTimer = () => {
            const remaining = authService.getLockoutRemaining();
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                this.showError(`Trop de tentatives. Veuillez attendre ${minutes}:${seconds.toString().padStart(2, '0')}`);
            } else {
                // Lockout terminé
                this.disableNumpad(false);
                this.hideMessages();
                this.attempts = 0;
                clearInterval(this.lockoutTimer);
            }
        };

        updateTimer();
        this.lockoutTimer = setInterval(updateTimer, 1000);
    }

    disableNumpad(disabled) {
        const buttons = document.querySelectorAll('.numpad-btn');
        buttons.forEach(btn => setDisabled(btn, disabled));
    }

    showError(message) {
        const errorMsg = $('#errorMsg');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
    }

    showSuccess(message) {
        const successMsg = $('#successMsg');
        if (successMsg) {
            successMsg.textContent = message;
            successMsg.style.display = 'block';
        }
    }

    hideMessages() {
        const errorMsg = $('#errorMsg');
        const successMsg = $('#successMsg');
        
        if (errorMsg) errorMsg.style.display = 'none';
        if (successMsg) successMsg.style.display = 'none';
    }
}