// ========================================
// MAILBOX-SIDEBAR.COMPONENT.JS - Sidebar navigation
// Chemin: src/components/ui/mailbox-sidebar/mailbox-sidebar.component.js
//
// DESCRIPTION:
// Sidebar avec navigation mail, labels et chat intégré
//
// API PUBLIQUE:
// - constructor(config)
// - setFolders(folders)
// - setChats(chats)
// - updateBadge(folderId, count)
// - setActiveFolder(folderId)
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onFolderSelect: (folderId) => void
// - onCompose: () => void
// - onChatSelect: (chatId) => void
// - onSearch: (query) => void
//
// DÉPENDANCES:
// - Aucune (100% indépendant)
// ========================================

export class MailboxSidebar {
    constructor(config = {}) {
        this.config = {
            container: null,
            folders: [],
            chats: [],
            onFolderSelect: null,
            onCompose: null,
            onChatSelect: null,
            onSearch: null,
            ...config
        };
        
        this.id = `mailbox-sidebar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.activeFolder = 'inbox';
        this.folders = this.config.folders;
        this.chats = this.config.chats;
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
        if (document.getElementById('mailbox-sidebar-styles')) {
            return;
        }
        
        // ✅ NOUVELLE MÉTHODE : Chemin dynamique basé sur l'emplacement du JS
        const componentUrl = new URL(import.meta.url).href;
        const cssUrl = componentUrl.replace('.js', '.css');
        
        const link = document.createElement('link');
        link.id = 'mailbox-sidebar-styles';
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
        
        console.log('📦 MailboxSidebar styles chargés depuis:', cssUrl);
    }

    // ========================================
    // RENDU
    // ========================================
    
    render() {
        const container = document.querySelector(this.config.container);
        if (!container) return;
        
        const sidebarHtml = `
            <aside id="${this.id}" class="mailbox-sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="m22 7-10 5L2 7"/>
                        </svg>
                        <span>MailBox Pro</span>
                    </div>
                    <button class="compose-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Nouveau message
                    </button>
                </div>
                
                <div class="sidebar-content">
                    <!-- Navigation Mail -->
                    <nav class="nav-menu">
                        ${this.renderFolders()}
                    </nav>
                    
                    <!-- Section Chat -->
                    <div class="chat-section">
                        <div class="section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            CHAT
                        </div>
                        ${this.renderChats()}
                    </div>
                </div>
                
                <!-- Toggle Mobile -->
                <button class="sidebar-toggle-mobile">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
            </aside>
        `;
        
        container.innerHTML = sidebarHtml;
        this.element = document.getElementById(this.id);
    }
    
    renderFolders() {
        const defaultFolders = this.folders.length > 0 ? this.folders : [
            { id: 'inbox', label: 'Boîte de réception', icon: 'inbox', badge: 12 },
            { id: 'starred', label: 'Favoris', icon: 'star', badge: 3 },
            { id: 'sent', label: 'Envoyés', icon: 'send' },
            { id: 'drafts', label: 'Brouillons', icon: 'file-text', badge: 2 },
            { id: 'spam', label: 'Spam', icon: 'alert-circle', badge: 5 },
            { id: 'trash', label: 'Corbeille', icon: 'trash-2', badge: 8 }
        ];
        
        return defaultFolders.map(folder => `
            <div class="nav-item ${folder.id === this.activeFolder ? 'active' : ''}" 
                 data-folder="${folder.id}">
                ${this.getIcon(folder.icon)}
                <span class="nav-text">${folder.label}</span>
                ${folder.badge ? `<span class="nav-badge" data-badge="${folder.id}">${folder.badge}</span>` : ''}
            </div>
        `).join('');
    }
    
    renderChats() {
        const defaultChats = this.chats.length > 0 ? this.chats : [
            { id: 1, name: 'Marie Dubois', initials: 'MD', preview: 'Super ! On se voit demain alors 👍', online: true, unread: 2 },
            { id: 2, name: 'Jean Martin', initials: 'JM', preview: 'J\'ai fini la review du code', online: true },
            { id: 3, name: 'Sophie Laurent', initials: 'SL', preview: 'Merci pour ton aide !', online: false },
            { id: 4, name: 'Alexandre Blanc', initials: 'AB', preview: 'Tu as regardé le nouveau design ?', online: true, unread: 5 }
        ];
        
        return defaultChats.map(chat => `
            <div class="chat-item" data-chat="${chat.id}">
                <div class="chat-avatar">
                    ${chat.initials}
                    <span class="status-indicator ${chat.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${chat.name}</div>
                    <div class="chat-preview">${chat.preview}</div>
                </div>
                ${chat.unread ? `<div class="chat-badge">${chat.unread}</div>` : ''}
            </div>
        `).join('');
    }
    
    getIcon(iconName) {
        const icons = {
            'inbox': '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
            'star': '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            'send': '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
            'file-text': '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
            'alert-circle': '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
            'trash-2': '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
        };
        
        return icons[iconName] || '';
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        if (!this.element) return;
        
        // Compose button
        const composeBtn = this.element.querySelector('.compose-btn');
        if (composeBtn) {
            composeBtn.addEventListener('click', () => {
                this.triggerCallback('onCompose');
            });
        }
        
        // Folder navigation
        this.element.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const folderId = item.dataset.folder;
                this.setActiveFolder(folderId);
                this.triggerCallback('onFolderSelect', folderId);
            });
        });
        
        // Chat items
        this.element.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chat;
                
                // Remove unread badge
                const badge = item.querySelector('.chat-badge');
                if (badge) {
                    badge.style.display = 'none';
                }
                
                this.triggerCallback('onChatSelect', chatId);
            });
        });
        
        // Mobile toggle
        const toggleBtn = this.element.querySelector('.sidebar-toggle-mobile');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.element.classList.toggle('open');
            });
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    
    setFolders(folders) {
        this.folders = folders;
        this.render();
        this.attachEvents();
    }
    
    setChats(chats) {
        this.chats = chats;
        this.render();
        this.attachEvents();
    }
    
    updateBadge(folderId, count) {
        const badge = this.element.querySelector(`[data-badge="${folderId}"]`);
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    setActiveFolder(folderId) {
        this.activeFolder = folderId;
        
        // Update active state
        this.element.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.folder === folderId) {
                item.classList.add('active');
            }
        });
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
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
   - Gestion mobile avec toggle
   - Badges dynamiques pour notifications
   ======================================== */