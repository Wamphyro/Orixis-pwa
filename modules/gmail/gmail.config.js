// ========================================
// GMAIL.CONFIG.JS - Configuration locale du module Gmail
// Chemin: modules/gmail/gmail.config.js
//
// DESCRIPTION:
// Configuration et factories pour tous les composants UI
// utilisés dans le module Gmail
//
// DÉPENDANCES:
// - Components UI globaux
// ========================================

import { 
    Modal,
    Button,
    Dialog,
    notify
} from '../../src/components/index.js';

// Import des composants Gmail
import { EmailCard } from '../../src/components/ui/email-card/email-card.component.js';
import { MailboxSidebar } from '../../src/components/ui/mailbox-sidebar/mailbox-sidebar.component.js';
import { ComposeModal } from '../../src/components/ui/compose-modal/compose-modal.component.js';

// ========================================
// FACTORIES DE COMPOSANTS
// ========================================

export function createEmailCard(container, emailData, callbacks = {}) {
    return new EmailCard({
        container,
        emailData,
        ...callbacks
    });
}

export function createMailboxSidebar(container, options = {}) {
    return new MailboxSidebar({
        container,
        ...options
    });
}

export function createComposeModal(callbacks = {}) {
    return new ComposeModal({
        container: document.body,
        ...callbacks
    });
}

// ========================================
// CONFIGURATION DES TEMPLATES HTML
// ========================================

export const HTML_TEMPLATES = {
    emailListContainer: () => `
        <div class="email-list-container">
            <div class="email-list-header">
                <div class="list-actions">
                    <button class="btn-select-all">
                        <input type="checkbox" class="select-all-checkbox">
                    </button>
                    <button class="btn-refresh" title="Actualiser">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                    </button>
                    <button class="btn-archive" title="Archiver">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                            <line x1="10" y1="12" x2="14" y2="12"/>
                        </svg>
                    </button>
                    <button class="btn-delete" title="Supprimer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        </svg>
                    </button>
                </div>
                <div class="list-info">
                    <span class="email-count">0 emails</span>
                </div>
            </div>
            <div class="email-list-body"></div>
        </div>
    `,
    
    emptyState: () => `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-10 5L2 7"/>
            </svg>
            <h3>Aucun email</h3>
            <p>Votre boîte de réception est vide</p>
        </div>
    `,
    
    loadingState: () => `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des emails...</p>
        </div>
    `
};

// ========================================
// CONFIGURATION DES DOSSIERS
// ========================================

export const FOLDER_CONFIG = [
    { id: 'inbox', label: 'Boîte de réception', icon: 'inbox' },
    { id: 'starred', label: 'Favoris', icon: 'star' },
    { id: 'sent', label: 'Envoyés', icon: 'send' },
    { id: 'drafts', label: 'Brouillons', icon: 'file-text' },
    { id: 'spam', label: 'Spam', icon: 'alert-circle' },
    { id: 'trash', label: 'Corbeille', icon: 'trash-2' }
];

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // Factories
    createEmailCard,
    createMailboxSidebar,
    createComposeModal,
    
    // Config
    HTML_TEMPLATES,
    FOLDER_CONFIG,
    
    // Composants directs
    Modal,
    Button,
    Dialog,
    notify
};