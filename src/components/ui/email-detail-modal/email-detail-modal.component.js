// ========================================
// EMAIL-DETAIL-MODAL.COMPONENT.JS - Modal détail email
// Chemin: src/components/ui/email-detail-modal/email-detail-modal.component.js
//
// DESCRIPTION:
// Modal pour afficher le détail d'un email avec options de réponse
//
// API PUBLIQUE:
// - constructor(config)
// - open(emailData)
// - close()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onReply: (emailData) => void
// - onReplyAll: (emailData) => void
// - onForward: (emailData) => void
// - onDelete: (emailId) => void
// - onArchive: (emailId) => void
// - onClose: () => void
//
// DÉPENDANCES:
// - Aucune (100% indépendant)
// ========================================

export class EmailDetailModal {
    constructor(config = {}) {
        this.config = {
            container: document.body,
            onReply: null,
            onReplyAll: null,
            onForward: null,
            onDelete: null,
            onArchive: null,
            onClose: null,
            ...config
        };
        
        this.id = `email-detail-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.isOpen = false;
        this.emailData = null;
        
        this.init();
    }

    // ========================================
    // INITIALISATION
    // ========================================
    
    init() {
        this.loadStyles();
        this.render();
        this.attachEvents();
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('email-detail-modal-styles')) {
            return;
        }
        
        // ✅ NOUVELLE MÉTHODE : Chemin dynamique basé sur l'emplacement du JS
        const componentUrl = new URL(import.meta.url).href;
        const cssUrl = componentUrl.replace('.js', '.css');
        
        const link = document.createElement('link');
        link.id = 'email-detail-modal-styles';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        
        console.log('📦 EmailDetailModal styles chargés depuis:', cssUrl);
    }

    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const modalHtml = `
            <div id="${this.id}" class="email-detail-modal">
                <div class="email-detail-backdrop"></div>
                <div class="email-detail-content">
                    <div class="email-detail-header">
                        <h2 class="email-detail-subject"></h2>
                        <button class="email-detail-close" title="Fermer">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="email-detail-meta">
                        <div class="email-detail-from">
                            <div class="email-avatar-large"></div>
                            <div class="email-from-info">
                                <div class="email-from-name"></div>
                                <div class="email-from-address"></div>
                            </div>
                            <div class="email-date"></div>
                        </div>
                        <div class="email-recipients">
                            <div class="email-to"></div>
                            <div class="email-cc" style="display: none;"></div>
                        </div>
                    </div>
                    
                    <div class="email-detail-body-wrapper">
                        <div class="email-detail-body"></div>
                        
                        <div class="email-attachments" style="display: none;">
                            <h4>Pièces jointes</h4>
                            <div class="attachments-list"></div>
                        </div>
                    </div>
                    
                    <div class="email-detail-actions">
                        <button class="btn-reply">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>
                            </svg>
                            Répondre
                        </button>
                        <button class="btn-reply-all">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="7 10 2 15 7 20"/><polyline points="15 10 10 15 15 20"/>
                                <path d="M22 4v7a4 4 0 0 1-4 4H2"/>
                            </svg>
                            Répondre à tous
                        </button>
                        <button class="btn-forward">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 1 4 4h12"/>
                            </svg>
                            Transférer
                        </button>
                        <div class="email-detail-actions-right">
                            <button class="btn-archive" title="Archiver">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                                    <line x1="10" y1="12" x2="14" y2="12"/>
                                </svg>
                            </button>
                            <button class="btn-delete" title="Supprimer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const container = typeof this.config.container === 'string' 
            ? document.querySelector(this.config.container) 
            : this.config.container;
            
        container.insertAdjacentHTML('beforeend', modalHtml);
        this.element = document.getElementById(this.id);
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        if (!this.element) return;
        
        // Fermeture
        this.element.querySelector('.email-detail-close').addEventListener('click', () => this.close());
        this.element.querySelector('.email-detail-backdrop').addEventListener('click', () => this.close());
        
        // Actions
        this.element.querySelector('.btn-reply').addEventListener('click', () => {
            this.triggerCallback('onReply', this.emailData);
            this.close();
        });
        
        this.element.querySelector('.btn-reply-all').addEventListener('click', () => {
            this.triggerCallback('onReplyAll', this.emailData);
            this.close();
        });
        
        this.element.querySelector('.btn-forward').addEventListener('click', () => {
            this.triggerCallback('onForward', this.emailData);
            this.close();
        });
        
        this.element.querySelector('.btn-archive').addEventListener('click', () => {
            this.triggerCallback('onArchive', this.emailData.id);
            this.close();
        });
        
        this.element.querySelector('.btn-delete').addEventListener('click', () => {
            this.triggerCallback('onDelete', this.emailData.id);
            this.close();
        });
        
        // Échap pour fermer
        this.handleEscape = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        document.addEventListener('keydown', this.handleEscape);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    open(emailData) {
        if (!emailData) return;
        
        this.emailData = emailData;
        this.updateContent();
        this.element.classList.add('active');
        this.isOpen = true;
    }
    
    close() {
        this.element.classList.remove('active');
        this.isOpen = false;
        this.triggerCallback('onClose');
    }
    
    destroy() {
        if (this.handleEscape) {
            document.removeEventListener('keydown', this.handleEscape);
        }
        if (this.element) {
            this.element.remove();
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    updateContent() {
        if (!this.element || !this.emailData) return;
        
        // Subject
        this.element.querySelector('.email-detail-subject').textContent = this.emailData.subject;
        
        // Avatar
        const avatar = this.element.querySelector('.email-avatar-large');
        avatar.textContent = this.getAvatarInitials(this.emailData.from);
        
        // From info
        this.element.querySelector('.email-from-name').textContent = this.emailData.fromName || this.emailData.from;
        this.element.querySelector('.email-from-address').textContent = `<${this.emailData.from}>`;
        
        // Date
        this.element.querySelector('.email-date').textContent = this.formatDate(this.emailData.date);
        
        // Recipients
        this.element.querySelector('.email-to').innerHTML = `<strong>À :</strong> ${this.emailData.to.join(', ')}`;
        
        if (this.emailData.cc && this.emailData.cc.length > 0) {
            const ccElement = this.element.querySelector('.email-cc');
            ccElement.style.display = 'block';
            ccElement.innerHTML = `<strong>Cc :</strong> ${this.emailData.cc.join(', ')}`;
        }
        
        // Body
        this.element.querySelector('.email-detail-body').innerHTML = this.formatBody(this.emailData.body);
        
        // Attachments
        if (this.emailData.attachments && this.emailData.attachments > 0) {
            const attachmentsDiv = this.element.querySelector('.email-attachments');
            attachmentsDiv.style.display = 'block';
            
            // Simuler des pièces jointes
            const attachmentsList = attachmentsDiv.querySelector('.attachments-list');
            attachmentsList.innerHTML = Array.from({ length: this.emailData.attachments }, (_, i) => `
                <div class="attachment-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>Document_${i + 1}.pdf</span>
                    <button class="attachment-download">Télécharger</button>
                </div>
            `).join('');
        }
    }
    
    getAvatarInitials(email) {
        if (!email) return '?';
        
        if (email.includes(' ')) {
            return email.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        
        const name = email.split('@')[0];
        return name.slice(0, 2).toUpperCase();
    }
    
    formatDate(date) {
        if (!date) return '';
        
        const emailDate = new Date(date);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return emailDate.toLocaleDateString('fr-FR', options);
    }
    
    formatBody(body) {
        if (!body) return '';
        
        // Convertir les retours à la ligne en <br>
        let formatted = body.replace(/\n/g, '<br>');
        
        // Détecter et convertir les URLs en liens
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        
        // Détecter les emails
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
        formatted = formatted.replace(emailRegex, '<a href="mailto:$1">$1</a>');
        
        return formatted;
    }
    
    triggerCallback(name, ...args) {
        if (this.config[name] && typeof this.config[name] === 'function') {
            this.config[name](...args);
        }
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [01/02/2025] - Composant 100% indépendant
   Solution: Aucun import, callbacks uniquement
   Impact: Réutilisable dans tous les modules
   
   NOTES POUR REPRISES FUTURES:
   - CSS chargé dynamiquement avec import.meta.url
   - Support des pièces jointes
   - Actions de réponse intégrées
   ======================================== */