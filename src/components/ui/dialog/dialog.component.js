// ========================================
// DIALOG.COMPONENT.JS - Dialogues modernes et élégants
// Chemin: src/components/ui/dialog/dialog.component.js
//
// DESCRIPTION:
// Système de dialogues modaux remplaçant alert/confirm/prompt natifs
// Composant singleton avec file d'attente
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - alert(message, title)
// - confirm(message, title)
// - prompt(message, defaultValue, title)
// - success(message, title)
// - error(message, title)
// - warning(message, title)
// - confirmDanger(message, title)
// - custom(options)
//
// EXEMPLE:
// Dialog.alert('Opération réussie !');
// const confirmed = await Dialog.confirm('Êtes-vous sûr ?');
// const name = await Dialog.prompt('Votre nom ?', 'John');
// ========================================

export class Dialog {
    static instance = null;
    static queue = [];
    static isShowing = false;
    
    constructor() {
        if (Dialog.instance) {
            return Dialog.instance;
        }
        
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'dialog-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.container = null;
        this.currentDialog = null;
        this.init();
        Dialog.instance = this;
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Créer le conteneur si inexistant
        if (!document.getElementById('dialog-container')) {
            this.container = document.createElement('div');
            this.container.id = 'dialog-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('dialog-container');
        }
        
        // Charger les styles
        this.loadStyles();
        
        console.log('✅ Dialog initialisé:', this.id);
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('dialog-styles')) {
            return;
        }
        
        // Créer le lien vers le fichier CSS
        const link = document.createElement('link');
        link.id = 'dialog-styles';
        link.rel = 'stylesheet';
        link.href = '../../src/components/ui/dialog/dialog.css';
        document.head.appendChild(link);
        
        console.log('📦 Dialog styles chargés');
        
        // Charger aussi les styles Button si on utilise des buttonFactory
        if (!document.getElementById('button-component-styles')) {
            const buttonLink = document.createElement('link');
            buttonLink.id = 'button-component-styles';
            buttonLink.rel = 'stylesheet';
            buttonLink.href = '../../src/components/ui/button/button.css';
            document.head.appendChild(buttonLink);
            console.log('📦 Button styles chargés pour Dialog');
        }
    }
    
    // ========================================
    // MÉTHODE PRINCIPALE SHOW
    // ========================================
    
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
                    ${this.createButtons(options, showCancel, cancelText, confirmText, danger)}
                </div>
            </div>
        `;
        
        this.container.innerHTML = dialogHtml;
        this.container.classList.add('active');
        
        // Gérer les événements
        const confirmBtn = this.container.querySelector('.dialog-confirm, .dialog-confirm-wrapper button');
        const cancelBtn = this.container.querySelector('.dialog-cancel, .dialog-cancel-wrapper button');
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
                if (inputOptions?.required && !result.trim()) {
                    input.style.borderColor = '#f44336';
                    input.focus();
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

    createButtons(options, showCancel, cancelText, confirmText, danger) {
        // Si une factory est fournie, l'utiliser
        if (options.buttonFactory) {
            const buttonsHtml = [];
            
            if (showCancel) {
                // Créer temporairement pour récupérer le HTML
                const cancelBtn = options.buttonFactory({
                    text: cancelText,
                    variant: 'ghost',
                    pill: true
                });
                buttonsHtml.push(`<span class="dialog-cancel-wrapper">${cancelBtn.element.outerHTML}</span>`);
            }
            
            const confirmBtn = options.buttonFactory({
                text: confirmText,
                variant: danger ? 'danger' : 'primary',
                pill: true
            });
            buttonsHtml.push(`<span class="dialog-confirm-wrapper">${confirmBtn.element.outerHTML}</span>`);
            
            return buttonsHtml.join('');
        }
        
        // Sinon, comportement par défaut (HTML actuel)
        return `
            ${showCancel ? `
                <button class="dialog-btn secondary dialog-cancel">
                    ${cancelText}
                </button>
            ` : ''}
            <button class="dialog-btn ${danger ? 'danger' : 'primary'} dialog-confirm">
                ${confirmText}
            </button>
        `;
    }
    
    // ========================================
    // FERMETURE ET NETTOYAGE
    // ========================================
    
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