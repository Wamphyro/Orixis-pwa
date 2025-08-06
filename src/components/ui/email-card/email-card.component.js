// ========================================
// EMAIL-CARD.COMPONENT.JS - Carte email réutilisable
// Chemin: src/components/ui/email-card/email-card.component.js
//
// DESCRIPTION:
// Composant carte email avec avatar, sujet, preview, actions
//
// API PUBLIQUE:
// - constructor(config)
// - setData(emailData)
// - markAsRead()
// - toggleStar()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onClick: (emailData) => void
// - onStar: (emailId, isStarred) => void
// - onArchive: (emailId) => void
// - onDelete: (emailId) => void
//
// DÉPENDANCES:
// - Aucune (100% indépendant)
// ========================================

export class EmailCard {
    constructor(config = {}) {
        this.config = {
            container: null,
            emailData: null,
            onClick: null,
            onStar: null,
            onArchive: null,
            onDelete: null,
            ...config
        };
        
        this.id = `email-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.emailData = this.config.emailData || {};
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
        if (document.getElementById('email-card-styles')) {
            return;
        }
        
        // ✅ NOUVELLE MÉTHODE : Chemin dynamique basé sur l'emplacement du JS
        const componentUrl = new URL(import.meta.url).href;
        const cssUrl = componentUrl.replace('.js', '.css');
        
        const link = document.createElement('link');
        link.id = 'email-card-styles';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        
        console.log('📦 EmailCard styles chargés depuis:', cssUrl);
    }

    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.querySelector(this.config.container);
        if (!container) return;
        
        const cardHtml = `
            <div id="${this.id}" class="email-card ${this.emailData.unread ? 'unread' : ''}" data-email-id="${this.emailData.id}">
                <div class="email-card-header">
                    <div class="email-avatar">
                        ${this.getAvatarInitials(this.emailData.from)}
                    </div>
                    <div class="email-info">
                        <div class="email-sender">${this.emailData.fromName || this.emailData.from}</div>
                        <div class="email-time">${this.formatTime(this.emailData.date)}</div>
                    </div>
                    <div class="email-actions">
                        <button class="action-btn ${this.emailData.starred ? 'starred' : ''}" data-action="star">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="${this.emailData.starred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                        </button>
                        <button class="action-btn" data-action="archive">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                                <line x1="10" y1="12" x2="14" y2="12"/>
                            </svg>
                        </button>
                        <button class="action-btn" data-action="delete">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <h3 class="email-subject">${this.emailData.subject}</h3>
                <p class="email-preview">${this.emailData.preview}</p>
                
                <div class="email-meta">
                    ${this.renderLabels()}
                    ${this.renderAttachments()}
                </div>
            </div>
        `;
        
        // Insérer ou remplacer
        const existingCard = document.getElementById(this.id);
        if (existingCard) {
            existingCard.outerHTML = cardHtml;
        } else {
            container.insertAdjacentHTML('beforeend', cardHtml);
        }
        
        this.element = document.getElementById(this.id);
    }
    
    renderLabels() {
        if (!this.emailData.labels || this.emailData.labels.length === 0) return '';
        
        return this.emailData.labels.map(label => `
            <span class="email-label ${label.type || ''}">${label.name || label}</span>
        `).join('');
    }
    
    renderAttachments() {
        if (!this.emailData.attachments || this.emailData.attachments === 0) return '';
        
        return `
            <span class="attachment-indicator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                ${this.emailData.attachments} pièce${this.emailData.attachments > 1 ? 's jointes' : ' jointe'}
            </span>
        `;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        if (!this.element) return;
        
        // Click sur la carte
        this.element.addEventListener('click', (e) => {
            // Ignorer si click sur action
            if (e.target.closest('.action-btn')) return;
            
            this.triggerCallback('onClick', this.emailData);
        });
        
        // Actions buttons
        this.element.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });
    }
    
    handleAction(action) {
        switch(action) {
            case 'star':
                this.toggleStar();
                break;
            case 'archive':
                this.archive();
                break;
            case 'delete':
                this.delete();
                break;
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    setData(emailData) {
        this.emailData = { ...this.emailData, ...emailData };
        this.render();
        this.attachEvents();
    }
    
    markAsRead() {
        this.emailData.unread = false;
        if (this.element) {
            this.element.classList.remove('unread');
        }
    }
    
    toggleStar() {
        this.emailData.starred = !this.emailData.starred;
        const starBtn = this.element.querySelector('[data-action="star"]');
        if (starBtn) {
            starBtn.classList.toggle('starred');
            const svg = starBtn.querySelector('svg');
            svg.setAttribute('fill', this.emailData.starred ? 'currentColor' : 'none');
        }
        
        this.triggerCallback('onStar', this.emailData.id, this.emailData.starred);
    }
    
    archive() {
        // Animation de glissement
        if (this.element) {
            this.element.style.transition = 'all 0.5s ease';
            this.element.style.transform = 'translateX(120%) rotate(10deg)';
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                this.triggerCallback('onArchive', this.emailData.id);
                this.destroy();
            }, 500);
        }
    }
    
    delete() {
        // Animation de suppression
        if (this.element) {
            this.element.style.transition = 'all 0.3s ease';
            this.element.style.transform = 'scale(0.8)';
            this.element.style.opacity = '0';
            
            setTimeout(() => {
                this.triggerCallback('onDelete', this.emailData.id);
                this.destroy();
            }, 300);
        }
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    getAvatarInitials(email) {
        if (!email) return '?';
        
        // Si c'est un nom
        if (email.includes(' ')) {
            return email.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        
        // Si c'est un email
        const name = email.split('@')[0];
        return name.slice(0, 2).toUpperCase();
    }
    
    formatTime(date) {
        if (!date) return '';
        
        const emailDate = new Date(date);
        const now = new Date();
        const diff = now - emailDate;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 7) {
            return emailDate.toLocaleDateString('fr-FR');
        } else if (days > 0) {
            return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return 'À l\'instant';
        }
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
   - Animations de suppression/archivage intégrées
   - Gestion des labels et attachements
   ======================================== */