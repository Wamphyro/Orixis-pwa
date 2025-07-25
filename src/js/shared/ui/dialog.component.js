// ========================================
// DIALOG.COMPONENT.JS - Dialogues modernes et élégants (VERSION PROPRE)
// ========================================
// Chemin: src/js/shared/ui/dialog.component.js
//
// NETTOYAGE le 26/07/2025 : Suppression des styles intégrés
// Les styles sont maintenant dans src/css/commandes/commandes-modal.css
// Section 2: DIALOG STYLES (lignes 281-500)
//
// DÉPENDANCES:
// - Styles CSS dans commandes-modal.css (obligatoire)
// - Utilisé par les fonctions prompt/alert dans commandes.detail.js
// ========================================

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
        
        // ========================================
        // STYLES EXTERNES UNIQUEMENT
        // Les styles sont dans commandes-modal.css
        // Section 2: DIALOG STYLES (lignes 281-500)
        // ========================================
        console.log('✅ Dialog initialisé - Styles CSS externes');
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

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [26/07/2025] - Nettoyage des styles intégrés
   Avant: injectStyles() créait des styles CSS dans le JS
   Maintenant: Utilise uniquement commandes-modal.css
   Impact: Code plus propre, styles centralisés
   
   [26/07/2025] - Largeur fixe harmonisée
   Problème: Taille variable des dialogs selon le contenu
   Solution: Largeur fixe 480px dans le CSS (responsive)
   Impact: Cohérence visuelle pour tous les dialogs
   
   NOTES POUR REPRISES FUTURES:
   - OBLIGATOIRE: commandes-modal.css doit être chargé
   - La largeur fixe est dans .dialog-box (480px)
   - Responsive avec max-width: 90%
   - Aucun CSS intégré dans ce composant
   ======================================== */