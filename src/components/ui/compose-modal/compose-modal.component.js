// ========================================
// COMPOSE-MODAL.COMPONENT.JS - Modal composition email
// Chemin: src/components/ui/compose-modal/compose-modal.component.js
//
// DESCRIPTION:
// Modal pour composer et envoyer des emails
//
// API PUBLIQUE:
// - constructor(config)
// - open(data)
// - close()
// - setRecipient(email)
// - setSubject(subject)
// - setBody(body)
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onSend: (emailData) => void
// - onSaveDraft: (emailData) => void
// - onAttach: () => void
// - onClose: () => void
//
// DÉPENDANCES:
// - Aucune (100% indépendant)
// ========================================

export class ComposeModal {
    constructor(config = {}) {
        this.config = {
            container: document.body,
            onSend: null,
            onSaveDraft: null,
            onAttach: null,
            onClose: null,
            ...config
        };
        
        this.id = `compose-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.isOpen = false;
        this.emailData = {
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            body: '',
            attachments: []
        };
        
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
        if (document.getElementById('compose-modal-styles')) {
            return;
        }
        
        // ✅ NOUVELLE MÉTHODE : Chemin dynamique basé sur l'emplacement du JS
        const componentUrl = new URL(import.meta.url).href;
        const cssUrl = componentUrl.replace('.js', '.css');
        
        const link = document.createElement('link');
        link.id = 'compose-modal-styles';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        
        console.log('📦 ComposeModal styles chargés depuis:', cssUrl);
    }

    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const modalHtml = `
            <div id="${this.id}" class="compose-modal">
                <div class="compose-backdrop"></div>
                <div class="compose-content">
                    <div class="compose-header">
                        <h3>Nouveau message</h3>
                        <div class="compose-header-actions">
                            <button class="compose-minimize" title="Réduire">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                            <button class="compose-fullscreen" title="Plein écran">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                                </svg>
                            </button>
                            <button class="compose-close" title="Fermer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <form class="compose-form">
                        <div class="form-group">
                            <label class="form-label">À</label>
                            <input type="email" class="form-input" name="to" placeholder="Destinataires" required>
                            <button type="button" class="form-cc-bcc">Cc/Cci</button>
                        </div>
                        
                        <div class="form-group form-cc" style="display: none;">
                            <label class="form-label">Cc</label>
                            <input type="email" class="form-input" name="cc" placeholder="Copie carbone">
                        </div>
                        
                        <div class="form-group form-bcc" style="display: none;">
                            <label class="form-label">Cci</label>
                            <input type="email" class="form-input" name="bcc" placeholder="Copie carbone invisible">
                        </div>
                        
                        <div class="form-group">
                            <input type="text" class="form-input" name="subject" placeholder="Objet">
                        </div>
                        
                        <div class="form-group form-body">
                            <textarea class="form-textarea" name="body" placeholder="Écrivez votre message..."></textarea>
                        </div>
                        
                        <div class="compose-attachments" style="display: none;">
                            <div class="attachments-list"></div>
                        </div>
                    </form>
                    
                    <div class="compose-toolbar">
                        <div class="toolbar-formatting">
                            <button type="button" class="toolbar-btn" data-action="bold" title="Gras">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                                    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
                                </svg>
                            </button>
                            <button type="button" class="toolbar-btn" data-action="italic" title="Italique">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="19" y1="4" x2="10" y2="4"/>
                                    <line x1="14" y1="20" x2="5" y2="20"/>
                                    <line x1="15" y1="4" x2="9" y2="20"/>
                                </svg>
                            </button>
                            <button type="button" class="toolbar-btn" data-action="underline" title="Souligné">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
                                    <line x1="4" y1="21" x2="20" y2="21"/>
                                </svg>
                            </button>
                            <span class="toolbar-separator"></span>
                            <button type="button" class="toolbar-btn" data-action="link" title="Lien">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="compose-actions">
                        <button type="button" class="btn btn-primary btn-send">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            Envoyer
                        </button>
                        <button type="button" class="btn btn-secondary btn-attach">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            Joindre
                        </button>
                        <button type="button" class="btn btn-secondary btn-draft">
                            Brouillon
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Ajouter au container
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
        this.element.querySelector('.compose-close').addEventListener('click', () => this.close());
        this.element.querySelector('.compose-backdrop').addEventListener('click', () => this.close());
        
        // Minimiser/Maximiser
        this.element.querySelector('.compose-minimize').addEventListener('click', () => this.minimize());
        this.element.querySelector('.compose-fullscreen').addEventListener('click', () => this.toggleFullscreen());
        
        // Cc/Bcc toggle
        this.element.querySelector('.form-cc-bcc').addEventListener('click', () => {
            this.element.querySelector('.form-cc').style.display = 'block';
            this.element.querySelector('.form-bcc').style.display = 'block';
            this.element.querySelector('.form-cc-bcc').style.display = 'none';
        });
        
        // Actions
        this.element.querySelector('.btn-send').addEventListener('click', () => this.send());
        this.element.querySelector('.btn-attach').addEventListener('click', () => this.attach());
        this.element.querySelector('.btn-draft').addEventListener('click', () => this.saveDraft());
        
        // Formatting toolbar
        this.element.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.applyFormatting(action);
            });
        });
        
        // Auto-save draft
        let saveTimeout;
        this.element.querySelectorAll('input, textarea').forEach(field => {
            field.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.updateEmailData();
                }, 2000);
            });
        });
        
        // Raccourcis clavier
        this.element.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.send();
            }
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    open(data = {}) {
        if (data.to) this.setRecipient(data.to);
        if (data.subject) this.setSubject(data.subject);
        if (data.body) this.setBody(data.body);
        
        this.element.classList.add('active');
        this.isOpen = true;
        
        // Focus sur le premier champ
        setTimeout(() => {
            const firstInput = this.element.querySelector('input[name="to"]');
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    close() {
        this.element.classList.remove('active');
        this.isOpen = false;
        this.triggerCallback('onClose');
    }
    
    minimize() {
        this.element.classList.toggle('minimized');
    }
    
    toggleFullscreen() {
        this.element.classList.toggle('fullscreen');
    }
    
    setRecipient(email) {
        const input = this.element.querySelector('input[name="to"]');
        if (input) input.value = email;
    }
    
    setSubject(subject) {
        const input = this.element.querySelector('input[name="subject"]');
        if (input) input.value = subject;
    }
    
    setBody(body) {
        const textarea = this.element.querySelector('textarea[name="body"]');
        if (textarea) textarea.value = body;
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    updateEmailData() {
        const form = this.element.querySelector('.compose-form');
        const formData = new FormData(form);
        
        this.emailData = {
            to: formData.get('to'),
            cc: formData.get('cc'),
            bcc: formData.get('bcc'),
            subject: formData.get('subject'),
            body: formData.get('body'),
            attachments: this.emailData.attachments
        };
    }
    
    send() {
        this.updateEmailData();
        
        // Validation basique
        if (!this.emailData.to) {
            this.showError('Veuillez entrer au moins un destinataire');
            return;
        }
        
        this.triggerCallback('onSend', this.emailData);
        this.close();
    }
    
    saveDraft() {
        this.updateEmailData();
        this.triggerCallback('onSaveDraft', this.emailData);
        
        // Feedback visuel
        this.showNotification('Brouillon enregistré');
    }
    
    attach() {
        this.triggerCallback('onAttach');
    }
    
    applyFormatting(action) {
        const textarea = this.element.querySelector('textarea[name="body"]');
        if (!textarea) return;
        
        // Ici on pourrait implémenter un éditeur riche
        // Pour l'instant, on ajoute juste des marqueurs
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let formattedText = selectedText;
        switch(action) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `_${selectedText}_`;
                break;
            case 'underline':
                formattedText = `__${selectedText}__`;
                break;
        }
        
        textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    }
    
    showError(message) {
        // Créer une notification d'erreur temporaire
        const error = document.createElement('div');
        error.className = 'compose-error';
        error.textContent = message;
        this.element.querySelector('.compose-content').appendChild(error);
        
        setTimeout(() => error.remove(), 3000);
    }
    
    showNotification(message) {
        // Créer une notification temporaire
        const notif = document.createElement('div');
        notif.className = 'compose-notification';
        notif.textContent = message;
        this.element.querySelector('.compose-content').appendChild(notif);
        
        setTimeout(() => notif.remove(), 2000);
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
   - Support minimiser/maximiser/plein écran
   - Auto-save des brouillons
   - Raccourcis clavier
   ======================================== */