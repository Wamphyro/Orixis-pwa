// ========================================
// GMAIL.MAIN.JS - Point d'entrée principal
// Chemin: modules/gmail/gmail.main.js
//
// DESCRIPTION:
// Initialise le module Gmail et coordonne tous les orchestrateurs
//
// DÉPENDANCES:
// - gmail.config.js (configuration locale)
// - gmail.inbox.js (orchestrateur inbox)
// - gmail.compose.js (orchestrateur composition)
// - gmail.data.js (données mockées)
// ========================================

import config from './gmail.config.js';
import { initInbox } from './gmail.inbox.js';
import { initCompose } from './gmail.compose.js';
import { MOCK_EMAILS, MOCK_CHATS } from './gmail.data.js';

// ========================================
// ÉTAT GLOBAL DU MODULE
// ========================================

export const state = {
    emails: [],
    chats: [],
    currentFolder: 'inbox',
    currentEmail: null,
    searchQuery: '',
    selectedEmails: [],
    user: {
        email: 'moi@entreprise.fr',
        name: 'Utilisateur'
    }
};

// ========================================
// INITIALISATION
// ========================================

window.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🚀 Initialisation du module Gmail...');
        
        // Charger les styles du module
        loadModuleStyles();
        
        // Initialiser l'état avec les données mockées
        state.emails = [...MOCK_EMAILS];
        state.chats = [...MOCK_CHATS];
        
        // Créer la structure HTML de base
        createBaseStructure();
        
        // Initialiser les orchestrateurs
        await initSidebar();
        await initInbox();
        await initCompose();
        await initSearch();
        
        // Charger les emails du dossier actuel
        loadCurrentFolder();
        
        console.log('✅ Module Gmail initialisé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        config.notify.error('Erreur lors du chargement de Gmail');
    }
});

// ========================================
// INITIALISATION DES COMPOSANTS
// ========================================

function loadModuleStyles() {
    if (!document.getElementById('gmail-module-styles')) {
        const link = document.createElement('link');
        link.id = 'gmail-module-styles';
        link.rel = 'stylesheet';
        link.href = './gmail.css';
        document.head.appendChild(link);
    }
}

function createBaseStructure() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div class="gmail-container">
            <div class="gmail-sidebar-container"></div>
            <main class="gmail-main">
                <header class="gmail-header">
                    <div class="search-bar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input type="text" class="search-input" placeholder="Rechercher dans les emails...">
                    </div>
                    
                    <div class="header-actions">
                        <button class="icon-btn" title="Filtres">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="22 3 10 12.46 10 19 14 21 14 12.46 2 3 2 3 22 3"/>
                            </svg>
                        </button>
                        <button class="icon-btn" title="Notifications">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                        </button>
                        <button class="icon-btn" title="Paramètres">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 9.54l4.24 4.24M1.54 14.46l4.24-4.24M18.46 14.46l4.24-4.24"/>
                            </svg>
                        </button>
                    </div>
                </header>
                
                <div class="gmail-content">
                    <div class="email-list-wrapper"></div>
                </div>
            </main>
        </div>
    `;
}

async function initSidebar() {
    const sidebar = config.createMailboxSidebar('.gmail-sidebar-container', {
        folders: config.FOLDER_CONFIG,
        chats: state.chats,
        onFolderSelect: (folderId) => {
            state.currentFolder = folderId;
            loadCurrentFolder();
        },
        onCompose: () => {
            window.gmailCompose.open();
        },
        onChatSelect: (chatId) => {
            console.log('Chat sélectionné:', chatId);
            config.notify.info(`Chat avec ID ${chatId} - Fonctionnalité à implémenter`);
        }
    });
    
    // Exposer globalement pour les autres orchestrateurs
    window.gmailSidebar = sidebar;
}

async function initSearch() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = e.target.value;
            loadCurrentFolder();
        }, 300);
    });
}

// ========================================
// GESTION DES DOSSIERS
// ========================================

export function loadCurrentFolder() {
    const { emails, currentFolder, searchQuery } = state;
    
    // Filtrer par dossier
    let filteredEmails = emails.filter(e => {
        if (currentFolder === 'starred') return e.starred;
        if (currentFolder === 'sent') return e.from === state.user.email;
        return e.folder === currentFolder;
    });
    
    // Appliquer la recherche si nécessaire
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEmails = filteredEmails.filter(e =>
            e.subject.toLowerCase().includes(query) ||
            e.preview.toLowerCase().includes(query) ||
            e.fromName.toLowerCase().includes(query)
        );
    }
    
    // Mettre à jour l'affichage via l'orchestrateur inbox
    if (window.gmailInbox) {
        window.gmailInbox.displayEmails(filteredEmails);
    }
    
    // Mettre à jour le badge du dossier
    updateFolderBadges();
}

function updateFolderBadges() {
    const { emails } = state;
    
    // Compter les emails non lus par dossier
    const unreadCounts = {
        inbox: emails.filter(e => e.folder === 'inbox' && e.unread).length,
        starred: emails.filter(e => e.starred && e.unread).length,
        drafts: 2, // Mock
        spam: 5,   // Mock
        trash: 8   // Mock
    };
    
    // Mettre à jour les badges
    Object.keys(unreadCounts).forEach(folder => {
        if (window.gmailSidebar && unreadCounts[folder] > 0) {
            window.gmailSidebar.updateBadge(folder, unreadCounts[folder]);
        }
    });
}

// ========================================
// API PUBLIQUE
// ========================================

export function getState() {
    return state;
}

export function refreshEmails() {
    console.log('🔄 Actualisation des emails...');
    // Simuler un refresh
    setTimeout(() => {
        config.notify.success('Emails actualisés');
        loadCurrentFolder();
    }, 1000);
}

export function deleteEmail(emailId) {
    const index = state.emails.findIndex(e => e.id === emailId);
    if (index !== -1) {
        state.emails.splice(index, 1);
        loadCurrentFolder();
        config.notify.success('Email supprimé');
    }
}

export function archiveEmail(emailId) {
    const email = state.emails.find(e => e.id === emailId);
    if (email) {
        email.folder = 'archive';
        loadCurrentFolder();
        config.notify.success('Email archivé');
    }
}

export function toggleStar(emailId) {
    const email = state.emails.find(e => e.id === emailId);
    if (email) {
        email.starred = !email.starred;
        updateFolderBadges();
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [01/02/2025] - Architecture modulaire
   Solution: Orchestrateurs séparés par fonctionnalité
   Impact: Code maintenable et évolutif
   
   NOTES POUR REPRISES FUTURES:
   - État centralisé dans main.js
   - Orchestrateurs indépendants
   - Données mockées pour le développement
   ======================================== */