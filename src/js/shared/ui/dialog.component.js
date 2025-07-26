// ========================================
// DIALOG.COMPONENT.JS - Dialogues modernes et élégants
// ========================================
// À placer dans : src/js/shared/ui/dialog.component.js

export class Dialog {
    static instance = null;
    static queue = [];
    static isShowing = false;
    
    constructor() {
        if (Dialog.instance) {
            return Dialog.instance;
        }
        
        this.container = null;
        this.currentDialog = null;
        this.init();
        Dialog.instance = this;
    }
    
    init() {
        // Créer le conteneur si inexistant
        if (!document.getElementById('dialog-container')) {
            this.container = document.createElement('div');
            this.container.id = 'dialog-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('dialog-container');
        }
        
        // Ajouter les styles si pas déjà présents
        if (!document.getElementById('dialog-styles')) {
            this.injectStyles();
        }
    }
    
    injectStyles() {
        const style = document.createElement('style');
        style.id = 'dialog-styles';
        style.textContent = `
            #dialog-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: none;
                z-index: 10000;
                animation: fadeIn 0.2s ease-out;
            }
            
            #dialog-container.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .dialog-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(2px);
            }
            
            .dialog-box {
                position: relative;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 90%;
                min-width: 320px;
                max-width: 480px;
                animation: slideUp 0.3s ease-out;
                overflow: hidden;
            }
            
            .dialog-header {
                padding: 20px 24px;
                border-bottom: 1px solid #e0e0e0;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .dialog-icon {
                font-size: 24px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                flex-shrink: 0;
            }
            
            .dialog-icon.info {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .dialog-icon.success {
                background: #e8f5e9;
                color: #2e7d32;
            }
            
            .dialog-icon.warning {
                background: #fff3e0;
                color: #f57c00;
            }
            
            .dialog-icon.error {
                background: #ffebee;
                color: #c62828;
            }
            
            .dialog-icon.confirm {
                background: #f3e5f5;
                color: #7b1fa2;
            }
            
            .dialog-title {
                font-size: 18px;
                font-weight: 600;
                color: #212121;
                margin: 0;
                flex: 1;
            }
            
            .dialog-body {
                padding: 24px;
                font-size: 15px;
                line-height: 1.6;
                color: #424242;
            }
            
            .dialog-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 15px;
                margin-top: 16px;
                transition: border-color 0.2s;
                font-family: inherit;
            }
            
            .dialog-input:focus {
                outline: none;
                border-color: #1976d2;
            }
            
            .dialog-footer {
                padding: 16px 24px;
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                background: #fafafa;
            }
            
            .dialog-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                font-family: inherit;
                min-width: 80px;
            }
            
            .dialog-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .dialog-btn:active {
                transform: translateY(0);
            }
            
            .dialog-btn.primary {
                background: #1976d2;
                color: white;
            }
            
            .dialog-btn.primary:hover {
                background: #1565c0;
            }
            
            .dialog-btn.secondary {
                background: #f5f5f5;
                color: #424242;
            }
            
            .dialog-btn.secondary:hover {
                background: #e0e0e0;
            }
            
            .dialog-btn.danger {
                background: #f44336;
                color: white;
            }
            
            .dialog-btn.danger:hover {
                background: #d32f2f;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 480px) {
                .dialog-box {
                    margin: 16px;
                    max-width: calc(100% - 32px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    show(options) {
        return new Promise((resolve) => {
            const dialogData = { options, resolve };
            
            if (Dialog.isShowing) {
                Dialog.queue.push(dialogData);
                return;
            }
            
            Dialog.isShowing = true;
            this.createDialog(options, resolve);
        });
    }
    
    createDialog(options, resolve) {
        const {
            type = 'info',
            title = '',
            message = '',
            confirmText = 'OK',
            cancelText = 'Annuler',
            showCancel = false,
            inputOptions = null,
            danger = false,
            icon = this.getIcon(type)
        } = options;
        
        const dialogHtml = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                ${title || icon ? `
                    <div class="dialog-header">
                        ${icon ? `<div class="dialog-icon ${type}">${icon}</div>` : ''}
                        ${title ? `<h3 class="dialog-title">${title}</h3>` : ''}
                    </div>
                ` : ''}
                <div class="dialog-body">
                    ${message}
                    ${inputOptions ? `
                        <input type="${inputOptions.type || 'text'}" 
                               class="dialog-input" 
                               placeholder="${inputOptions.placeholder || ''}"
                               value="${inputOptions.defaultValue || ''}"
                               ${inputOptions.required ? 'required' : ''}>
                    ` : ''}
                </div>
                <div class="dialog-footer">
                    ${showCancel ? `
                        <button class="dialog-btn secondary dialog-cancel">
                            ${cancelText}
                        </button>
                    ` : ''}
                    <button class="dialog-btn ${danger ? 'danger' : 'primary'} dialog-confirm">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;
        
        this.container.innerHTML = dialogHtml;
        this.container.classList.add('active');
        
        // Gérer les événements
        const confirmBtn = this.container.querySelector('.dialog-confirm');
        const cancelBtn = this.container.querySelector('.dialog-cancel');
        const overlay = this.container.querySelector('.dialog-overlay');
        const input = this.container.querySelector('.dialog-input');
        
        // Focus sur l'input ou le bouton
        setTimeout(() => {
            if (input) {
                input.focus();
                input.select();
            } else {
                confirmBtn.focus();
            }
        }, 100);
        
        const handleConfirm = () => {
            let result = true;
            if (input) {
                result = input.value;
                if (inputOptions?.required && !result) {
                    input.style.borderColor = '#f44336';
                    return;
                }
            }
            this.close(resolve, result);
        };
        
        const handleCancel = () => {
            this.close(resolve, showCancel ? false : true);
        };
        
        // Event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', handleCancel);
        }
        if (showCancel) {
            overlay.addEventListener('click', handleCancel);
        }
        
        // Enter pour confirmer, Escape pour annuler
        const handleKeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleConfirm();
            } else if (e.key === 'Escape' && showCancel) {
                e.preventDefault();
                handleCancel();
            }
        };
        
        document.addEventListener('keydown', handleKeydown);
        this.currentDialog = { handleKeydown };
    }
    
    close(resolve, result) {
        // Retirer les event listeners
        if (this.currentDialog?.handleKeydown) {
            document.removeEventListener('keydown', this.currentDialog.handleKeydown);
        }
        
        // Animation de fermeture
        this.container.classList.remove('active');
        
        setTimeout(() => {
            this.container.innerHTML = '';
            Dialog.isShowing = false;
            resolve(result);
            
            // Traiter la queue
            if (Dialog.queue.length > 0) {
                const next = Dialog.queue.shift();
                this.show(next.options).then(next.resolve);
            }
        }, 200);
    }
    
    getIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            confirm: '❓'
        };
        return icons[type] || icons.info;
    }
}

// Instance unique
const dialog = new Dialog();

// ========================================
// API PUBLIQUE
// ========================================

export default {
    // Alerte simple (remplace alert)
    alert: (message, title = '') => {
        return dialog.show({
            type: 'info',
            title,
            message,
            showCancel: false
        });
    },
    
    // Confirmation (remplace confirm)
    confirm: (message, title = 'Confirmation') => {
        return dialog.show({
            type: 'confirm',
            title,
            message,
            showCancel: true,
            confirmText: 'Confirmer',
            cancelText: 'Annuler'
        });
    },
    
    // Prompt (remplace prompt)
    prompt: (message, defaultValue = '', title = '') => {
        return dialog.show({
            type: 'info',
            title,
            message,
            showCancel: true,
            inputOptions: {
                type: 'text',
                defaultValue,
                required: true
            },
            confirmText: 'OK',
            cancelText: 'Annuler'
        });
    },
    
    // Dialogues personnalisés
    success: (message, title = 'Succès') => {
        return dialog.show({
            type: 'success',
            title,
            message,
            showCancel: false
        });
    },
    
    error: (message, title = 'Erreur') => {
        return dialog.show({
            type: 'error',
            title,
            message,
            showCancel: false
        });
    },
    
    warning: (message, title = 'Attention') => {
        return dialog.show({
            type: 'warning',
            title,
            message,
            showCancel: false
        });
    },
    
    // Confirmation dangereuse
    confirmDanger: (message, title = 'Attention') => {
        return dialog.show({
            type: 'warning',
            title,
            message,
            showCancel: true,
            danger: true,
            confirmText: 'Supprimer',
            cancelText: 'Annuler'
        });
    },
    
    // Custom complet
    custom: (options) => {
        return dialog.show(options);
    }
};