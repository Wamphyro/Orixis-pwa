// ========================================
// SIGNATURE-MODAL.COMPONENT.JS - Modal de signature électronique
// Chemin: src/components/ui/signature-modal/signature-modal.component.js
//
// DESCRIPTION:
// Modal pour capturer une signature électronique
// Intègre un canvas de signature avec actions (effacer, valider)
// Totalement indépendant, aucune dépendance
//
// API PUBLIQUE:
// - constructor(config)
// - open(context)
// - close()
// - clear()
// - getSignature()
// - isValid()
// - destroy()
//
// CALLBACKS:
// - onSign: (signature) => void
// - onCancel: () => void
// - onClear: () => void
//
// EXEMPLE:
// const signatureModal = new SignatureModal({
//     title: 'Signature du formulaire MDPH',
//     subtitle: 'Veuillez signer dans le cadre ci-dessous',
//     onSign: (signature) => {
//         console.log('Signature:', signature);
//     }
// });
// signatureModal.open();
// ========================================

export class SignatureModal {
    constructor(config) {
        this.config = {
            title: 'Signature électronique',
            subtitle: '',
            placeholder: 'Signez ici',
            confirmText: 'Valider',
            cancelText: 'Annuler',
            clearText: 'Effacer',
            strokeColor: '#000',
            strokeWidth: 3,
            backgroundColor: '#fff',
            requireSignature: true,
            showTimestamp: true,
            // Callbacks
            onSign: null,
            onCancel: null,
            onClear: null,
            ...config
        };
        
        this.elements = {};
        this.state = {
            isOpen: false,
            isSigned: false,
            isDrawing: false,
            context: null
        };
        
        this.signatureData = null;
        this.timestamp = null;
        
        this.init();
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        this.loadStyles();
        this.createModal();
        this.setupCanvas();
        this.attachEvents();
    }
    
    loadStyles() {
        if (!document.getElementById('signature-modal-styles')) {
            const link = document.createElement('link');
            link.id = 'signature-modal-styles';
            link.rel = 'stylesheet';
            link.href = '/src/components/ui/signature-modal/signature-modal.css';
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // CRÉATION DU MODAL
    // ========================================
    
    createModal() {
        // Créer le container si nécessaire
        let container = document.getElementById('signature-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'signature-modal-container';
            document.body.appendChild(container);
        }
        
        // Structure HTML
        container.innerHTML = `
            <div class="signature-modal" id="signature-modal">
                <div class="signature-modal-overlay"></div>
                <div class="signature-modal-content">
                    <div class="signature-modal-header">
                        <h3 class="signature-modal-title">${this.escapeHtml(this.config.title)}</h3>
                        ${this.config.subtitle ? `
                            <p class="signature-modal-subtitle">${this.escapeHtml(this.config.subtitle)}</p>
                        ` : ''}
                        <button class="signature-modal-close" aria-label="Fermer">×</button>
                    </div>
                    
                    <div class="signature-modal-body">
                        <div class="signature-canvas-wrapper">
                            <canvas class="signature-canvas" id="signature-canvas"></canvas>
                            <div class="signature-placeholder">${this.escapeHtml(this.config.placeholder)}</div>
                        </div>
                        
                        ${this.config.showTimestamp ? `
                            <div class="signature-info">
                                <span class="signature-timestamp" id="signature-timestamp"></span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="signature-modal-footer">
                        <div class="signature-actions-left">
                            <button class="signature-btn signature-btn-clear" id="btn-clear">
                                🗑️ ${this.escapeHtml(this.config.clearText)}
                            </button>
                        </div>
                        <div class="signature-actions-right">
                            <button class="signature-btn signature-btn-cancel" id="btn-cancel">
                                ${this.escapeHtml(this.config.cancelText)}
                            </button>
                            <button class="signature-btn signature-btn-confirm" id="btn-confirm" disabled>
                                ✓ ${this.escapeHtml(this.config.confirmText)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Références
        this.elements.container = container;
        this.elements.modal = container.querySelector('.signature-modal');
        this.elements.overlay = container.querySelector('.signature-modal-overlay');
        this.elements.closeBtn = container.querySelector('.signature-modal-close');
        this.elements.canvas = container.querySelector('.signature-canvas');
        this.elements.placeholder = container.querySelector('.signature-placeholder');
        this.elements.clearBtn = container.querySelector('#btn-clear');
        this.elements.cancelBtn = container.querySelector('#btn-cancel');
        this.elements.confirmBtn = container.querySelector('#btn-confirm');
        this.elements.timestamp = container.querySelector('#signature-timestamp');
        
        // Context 2D
        this.ctx = this.elements.canvas.getContext('2d');
    }
    
    // ========================================
    // CONFIGURATION DU CANVAS
    // ========================================
    
    setupCanvas() {
        // Taille du canvas
        this.resizeCanvas();
        
        // Configuration du style de dessin
        this.ctx.strokeStyle = this.config.strokeColor;
        this.ctx.lineWidth = this.config.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Variables de dessin
        this.lastX = 0;
        this.lastY = 0;
    }
    
    resizeCanvas() {
        const wrapper = this.elements.canvas.parentElement;
        if (!wrapper) return;
        
        const rect = wrapper.getBoundingClientRect();
        
        // Adapter la taille
        const width = rect.width;
        const height = 300; // Hauteur fixe
        
        this.elements.canvas.width = width * 2; // Résolution x2
        this.elements.canvas.height = height * 2;
        this.elements.canvas.style.width = width + 'px';
        this.elements.canvas.style.height = height + 'px';
        
        // Scale pour la haute résolution
        this.ctx.scale(2, 2);
        
        // Réappliquer les styles
        this.ctx.strokeStyle = this.config.strokeColor;
        this.ctx.lineWidth = this.config.strokeWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Fermeture
        this.elements.closeBtn.addEventListener('click', () => this.cancel());
        this.elements.overlay.addEventListener('click', () => this.cancel());
        this.elements.cancelBtn.addEventListener('click', () => this.cancel());
        
        // Actions
        this.elements.clearBtn.addEventListener('click', () => this.clear());
        this.elements.confirmBtn.addEventListener('click', () => this.confirm());
        
        // Canvas - Mouse
        this.elements.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.elements.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.elements.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.elements.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Canvas - Touch
        this.elements.canvas.addEventListener('touchstart', (e) => this.startDrawing(e), { passive: false });
        this.elements.canvas.addEventListener('touchmove', (e) => this.draw(e), { passive: false });
        this.elements.canvas.addEventListener('touchend', () => this.stopDrawing(), { passive: false });
        
        // Resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (this.state.isOpen && e.key === 'Escape') {
                this.cancel();
            }
        });
    }
    
    // ========================================
    // DESSIN
    // ========================================
    
    getCoordinates(e) {
        const rect = this.elements.canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        
        return {
            x: (touch.clientX - rect.left) * (this.elements.canvas.width / rect.width / 2),
            y: (touch.clientY - rect.top) * (this.elements.canvas.height / rect.height / 2)
        };
    }
    
    startDrawing(e) {
        e.preventDefault();
        this.state.isDrawing = true;
        
        const coords = this.getCoordinates(e);
        this.lastX = coords.x;
        this.lastY = coords.y;
        
        // Première signature
        if (!this.state.isSigned) {
            this.state.isSigned = true;
            this.elements.placeholder.style.display = 'none';
            this.elements.confirmBtn.disabled = false;
            this.updateTimestamp();
        }
    }
    
    draw(e) {
        if (!this.state.isDrawing) return;
        e.preventDefault();
        
        const coords = this.getCoordinates(e);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
        
        this.lastX = coords.x;
        this.lastY = coords.y;
    }
    
    stopDrawing() {
        this.state.isDrawing = false;
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    open(context = null) {
        this.state.context = context;
        this.state.isOpen = true;
        this.elements.modal.classList.add('active');
        
        // Focus sur le canvas
        setTimeout(() => {
            this.elements.canvas.focus();
        }, 100);
    }
    
    close() {
        this.state.isOpen = false;
        this.elements.modal.classList.remove('active');
        this.clear();
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        this.state.isSigned = false;
        this.elements.placeholder.style.display = 'block';
        this.elements.confirmBtn.disabled = true;
        this.signatureData = null;
        this.timestamp = null;
        
        if (this.elements.timestamp) {
            this.elements.timestamp.textContent = '';
        }
        
        if (this.config.onClear) {
            this.config.onClear();
        }
    }
    
    getSignature() {
        if (!this.state.isSigned) return null;
        
        return {
            data: this.elements.canvas.toDataURL('image/png'),
            timestamp: this.timestamp,
            context: this.state.context
        };
    }
    
    isValid() {
        return this.state.isSigned;
    }
    
    destroy() {
        window.removeEventListener('resize', () => this.resizeCanvas());
        if (this.elements.container) {
            this.elements.container.remove();
        }
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    confirm() {
        if (!this.isValid() && this.config.requireSignature) {
            this.showError('Veuillez signer avant de valider');
            return;
        }
        
        const signature = this.getSignature();
        
        if (this.config.onSign) {
            this.config.onSign(signature);
        }
        
        this.close();
    }
    
    cancel() {
        if (this.config.onCancel) {
            this.config.onCancel();
        }
        this.close();
    }
    
    updateTimestamp() {
        this.timestamp = new Date();
        
        if (this.elements.timestamp) {
            const options = {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            this.elements.timestamp.textContent = 
                `Signé le ${this.timestamp.toLocaleDateString('fr-FR', options)}`;
        }
    }
    
    showError(message) {
        // Animation de secousse
        this.elements.canvas.classList.add('shake');
        setTimeout(() => {
            this.elements.canvas.classList.remove('shake');
        }, 600);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date] - Création initiale
   - Modal totalement indépendant
   - Support tactile et souris
   - Timestamp automatique
   - Validation de signature
   
   NOTES POUR REPRISES FUTURES:
   - Le composant ne dépend d'aucun autre
   - CSS chargé automatiquement
   - Peut être appelé de n'importe où
   - Retourne la signature en base64
   ======================================== */