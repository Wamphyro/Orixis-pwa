// ========================================
// MODAL.COMPONENT.JS - Composant Modal réutilisable
// Chemin: src/components/ui/modal/modal.component.js
//
// DESCRIPTION:
// Système de modales avec gestionnaire pour multiple instances
// Support des callbacks et animations fluides
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - constructor(modalId, options)
// - open()
// - close()
// - toggle()
// - setContent(selector, content)
// - getElement(selector)
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onOpen: (modal) => void | Promise<boolean>
// - onClose: (modal) => void
// - onBeforeClose: (modal) => Promise<boolean>
//
// EXEMPLE:
// const modal = new Modal('myModal', {
//     closeOnOverlayClick: true,
//     closeOnEscape: true,
//     onOpen: () => console.log('Modal ouverte'),
//     onClose: () => console.log('Modal fermée')
// });
// modal.open();
// ========================================

export class Modal {
    constructor(modalId, options = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'modal-instance-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.modalElement = document.getElementById(modalId);
        if (!this.modalElement) {
            console.error(`Modal avec l'ID "${modalId}" introuvable`);
            return;
        }
        
        this.modalId = modalId;
        this.options = {
            closeOnOverlayClick: false,
            closeOnEscape: true,
            onOpen: null,
            onClose: null,
            onBeforeClose: null,
            animationDuration: 300,
            ...options
        };
        
        this.isOpen = false;
        this.init();
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Charger les styles
        this.loadStyles();
        
        // Trouver le bouton de fermeture
        this.closeButton = this.modalElement.querySelector('.modal-close');
        
        // Attacher les événements
        this.attachEvents();
        
        // S'assurer que la modal est cachée au départ
        this.modalElement.classList.remove('active');
        
        console.log('✅ Modal initialisée:', this.id, 'pour element:', this.modalId);
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('modal-styles')) {
            return;
        }
        
        // Créer le lien vers le fichier CSS
        const link = document.createElement('link');
        link.id = 'modal-styles';
        link.rel = 'stylesheet';
        link.href = '../src/components/ui/modal/modal.css';
        document.head.appendChild(link);
        
        console.log('📦 Modal styles chargés');
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Bouton de fermeture
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
        
        // Clic sur l'overlay (si activé)
        if (this.options.closeOnOverlayClick) {
            this.modalElement.addEventListener('click', (e) => {
                if (e.target === this.modalElement) {
                    this.close();
                }
            });
        }
        
        // Touche Escape
        if (this.options.closeOnEscape) {
            this.escapeHandler = (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            };
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    async open() {
        // Callback avant ouverture
        if (this.options.onOpen && typeof this.options.onOpen === 'function') {
            const result = await this.options.onOpen(this);
            if (result === false) return;
        }
        
        // Ouvrir la modal
        this.modalElement.classList.add('active');
        this.isOpen = true;
        
        // Ajouter l'écouteur Escape
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this.escapeHandler);
        }
        
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        
        // Focus sur le premier élément focusable
        setTimeout(() => {
            const focusable = this.modalElement.querySelector(
                'button:not(.modal-close), input, select, textarea'
            );
            if (focusable) focusable.focus();
        }, this.options.animationDuration);
    }
    
    async close() {
        // Callback avant fermeture (peut annuler)
        if (this.options.onBeforeClose && typeof this.options.onBeforeClose === 'function') {
            const shouldClose = await this.options.onBeforeClose(this);
            if (shouldClose === false) return;
        }
        
        // Fermer la modal
        this.modalElement.classList.remove('active');
        this.isOpen = false;
        
        // Retirer l'écouteur Escape
        if (this.options.closeOnEscape && this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Restaurer le scroll du body
        document.body.style.overflow = '';
        
        // Callback après fermeture
        if (this.options.onClose && typeof this.options.onClose === 'function') {
            setTimeout(() => {
                this.options.onClose(this);
            }, this.options.animationDuration);
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    // Méthodes utilitaires
    setContent(selector, content) {
        const element = this.modalElement.querySelector(selector);
        if (element) {
            element.innerHTML = content;
        }
    }
    
    getElement(selector) {
        return this.modalElement.querySelector(selector);
    }
    
    destroy() {
        // Nettoyer les événements
        if (this.closeButton) {
            this.closeButton.removeEventListener('click', () => this.close());
        }
        
        if (this.options.closeOnEscape && this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
        
        // Fermer si ouvert
        if (this.isOpen) {
            this.close();
        }
        
        console.log('🧹 Modal détruite:', this.id);
    }
}

// ========================================
// GESTIONNAIRE DE MODALES
// ========================================

export class ModalManager {
    constructor() {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'modal-manager-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.modals = new Map();
        
        console.log('✅ ModalManager initialisé:', this.id);
    }
    
    register(modalId, options = {}) {
        if (this.modals.has(modalId)) {
            console.warn(`Modal "${modalId}" déjà enregistrée`);
            return this.modals.get(modalId);
        }
        
        const modal = new Modal(modalId, options);
        this.modals.set(modalId, modal);
        return modal;
    }
    
    get(modalId) {
        return this.modals.get(modalId);
    }
    
    open(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.open();
        } else {
            console.error(`Modal "${modalId}" non trouvée`);
        }
    }
    
    close(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.close();
        }
    }
    
    closeAll() {
        this.modals.forEach(modal => {
            if (modal.isOpen) {
                modal.close();
            }
        });
    }
    
    destroy(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.destroy();
            this.modals.delete(modalId);
        }
    }
    
    destroyAll() {
        this.modals.forEach(modal => modal.destroy());
        this.modals.clear();
    }
}

// Instance globale du gestionnaire
export const modalManager = new ModalManager();

// ========================================
// HELPERS POUR MODALES DE CONFIRMATION
// ========================================

export function confirmerAction(options) {
    return new Promise((resolve) => {
        const {
            titre = 'Confirmation',
            message = 'Êtes-vous sûr ?',
            boutonConfirmer = 'Confirmer',
            boutonAnnuler = 'Annuler',
            danger = false
        } = options;
        
        // Créer une modal de confirmation temporaire
        const modalHtml = `
            <div id="modalConfirmation" class="modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>${titre}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 16px; margin: 20px 0;">${message}</p>
                    </div>
                    <div class="modal-footer" style="justify-content: flex-end; gap: 15px;">
                        <button class="btn btn-secondary btn-annuler">${boutonAnnuler}</button>
                        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-confirmer">
                            ${boutonConfirmer}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Créer et ouvrir la modal
        const modal = new Modal('modalConfirmation', {
            closeOnOverlayClick: false,
            closeOnEscape: true,
            onClose: () => {
                // Nettoyer après fermeture
                setTimeout(() => {
                    document.getElementById('modalConfirmation').remove();
                }, 300);
            }
        });
        
        // Gérer les boutons
        const btnConfirmer = modal.getElement('.btn-confirmer');
        const btnAnnuler = modal.getElement('.btn-annuler');
        
        btnConfirmer.addEventListener('click', () => {
            modal.close();
            resolve(true);
        });
        
        btnAnnuler.addEventListener('click', () => {
            modal.close();
            resolve(false);
        });
        
        // Ouvrir la modal
        modal.open();
    });
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

// Exports nommés (modalManager est déjà exporté ligne 307)
export { Modal, ModalManager };

// Export par défaut pour confirmerAction
export default {
    confirmerAction
};