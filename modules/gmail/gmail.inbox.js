// ========================================
// GMAIL.INBOX.JS - Orchestrateur boîte de réception
// Chemin: modules/gmail/gmail.inbox.js
//
// DESCRIPTION:
// Gère l'affichage et les interactions de la liste d'emails
//
// DÉPENDANCES:
// - gmail.config.js (configuration locale)
// - gmail.main.js (état global)
// ========================================

import config from './gmail.config.js';
import { getState, deleteEmail, archiveEmail, toggleStar } from './gmail.main.js';

// ========================================
// VARIABLES LOCALES
// ========================================

let emailCards = [];
let selectedEmails = new Set();

// ========================================
// INITIALISATION
// ========================================

export async function initInbox() {
    console.log('📧 Initialisation de la boîte de réception...');
    
    // Créer le conteneur de liste
    createListContainer();
    
    // Attacher les événements globaux
    attachGlobalEvents();
    
    // Exposer l'API globalement
    window.gmailInbox = {
        displayEmails,
        clearSelection,
        getSelectedEmails: () => Array.from(selectedEmails)
    };
    
    return true;
}

// ========================================
// CRÉATION DE L'INTERFACE
// ========================================

function createListContainer() {
    const wrapper = document.querySelector('.email-list-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = config.HTML_TEMPLATES.emailListContainer();
    
    // Attacher les événements des boutons d'action
    attachListActions();
}

function attachListActions() {
    const container = document.querySelector('.email-list-container');
    if (!container) return;
    
    // Select all
    const selectAll = container.querySelector('.select-all-checkbox');
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectAllEmails();
            } else {
                clearSelection();
            }
        });
    }
    
    // Refresh
    const refreshBtn = container.querySelector('.btn-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            animateRefresh(refreshBtn);
            const { refreshEmails } = require('./gmail.main.js');
            refreshEmails();
        });
    }
    
    // Archive selected
    const archiveBtn = container.querySelector('.btn-archive');
    if (archiveBtn) {
        archiveBtn.addEventListener('click', () => {
            archiveSelected();
        });
    }
    
    // Delete selected
    const deleteBtn = container.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteSelected();
        });
    }
}

// ========================================
// AFFICHAGE DES EMAILS
// ========================================

export function displayEmails(emails) {
    const listBody = document.querySelector('.email-list-body');
    if (!listBody) return;
    
    // Clear existing cards
    clearEmailCards();
    
    // Update count
    updateEmailCount(emails.length);
    
    if (emails.length === 0) {
        listBody.innerHTML = config.HTML_TEMPLATES.emptyState();
        return;
    }
    
    // Create cards for each email
    emails.forEach((email, index) => {
        const card = config.createEmailCard(
            '.email-list-body',
            email,
            {
                onClick: (emailData) => handleEmailClick(emailData),
                onStar: (emailId, isStarred) => handleStar(emailId, isStarred),
                onArchive: (emailId) => handleArchive(emailId),
                onDelete: (emailId) => handleDelete(emailId)
            }
        );
        
        // Animation décalée
        setTimeout(() => {
            const element = document.querySelector(`#${card.id}`);
            if (element) {
                element.style.animation = `cardFadeIn 0.5s ease-out forwards`;
                element.style.animationDelay = `${index * 0.05}s`;
            }
        }, 10);
        
        emailCards.push(card);
    });
}

function clearEmailCards() {
    emailCards.forEach(card => card.destroy());
    emailCards = [];
    selectedEmails.clear();
}

function updateEmailCount(count) {
    const countElement = document.querySelector('.email-count');
    if (countElement) {
        countElement.textContent = `${count} email${count !== 1 ? 's' : ''}`;
    }
}

// ========================================
// GESTION DES ÉVÉNEMENTS
// ========================================

function attachGlobalEvents() {
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + A : Sélectionner tout
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            const listContainer = document.querySelector('.email-list-container');
            if (listContainer && listContainer.contains(document.activeElement)) {
                e.preventDefault();
                selectAllEmails();
            }
        }
        
        // Delete : Supprimer sélection
        if (e.key === 'Delete' && selectedEmails.size > 0) {
            deleteSelected();
        }
        
        // E : Archiver sélection
        if (e.key === 'e' && !e.ctrlKey && !e.metaKey && selectedEmails.size > 0) {
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                archiveSelected();
            }
        }
    });
}

function handleEmailClick(emailData) {
    // Marquer comme lu
    const card = emailCards.find(c => c.emailData.id === emailData.id);
    if (card) {
        card.markAsRead();
    }
    
    // Mettre à jour l'état
    const state = getState();
    const email = state.emails.find(e => e.id === emailData.id);
    if (email) {
        email.unread = false;
    }
    
    // Ouvrir le détail (à implémenter)
    openEmailDetail(emailData);
}

function handleStar(emailId, isStarred) {
    toggleStar(emailId);
}

function handleArchive(emailId) {
    archiveEmail(emailId);
}

function handleDelete(emailId) {
    deleteEmail(emailId);
}

// ========================================
// SÉLECTION MULTIPLE
// ========================================

function selectAllEmails() {
    emailCards.forEach(card => {
        if (card.element) {
            card.element.classList.add('selected');
            selectedEmails.add(card.emailData.id);
        }
    });
    updateSelectionUI();
}

function clearSelection() {
    emailCards.forEach(card => {
        if (card.element) {
            card.element.classList.remove('selected');
        }
    });
    selectedEmails.clear();
    updateSelectionUI();
}

function updateSelectionUI() {
    const selectAll = document.querySelector('.select-all-checkbox');
    if (selectAll) {
        selectAll.checked = selectedEmails.size === emailCards.length && emailCards.length > 0;
        selectAll.indeterminate = selectedEmails.size > 0 && selectedEmails.size < emailCards.length;
    }
    
    // Activer/désactiver les boutons d'action
    const hasSelection = selectedEmails.size > 0;
    document.querySelectorAll('.btn-archive, .btn-delete').forEach(btn => {
        btn.style.opacity = hasSelection ? '1' : '0.5';
        btn.style.pointerEvents = hasSelection ? 'auto' : 'none';
    });
}

// ========================================
// ACTIONS GROUPÉES
// ========================================

function archiveSelected() {
    if (selectedEmails.size === 0) return;
    
    const count = selectedEmails.size;
    selectedEmails.forEach(emailId => {
        archiveEmail(emailId);
    });
    
    clearSelection();
    config.notify.success(`${count} email${count > 1 ? 's archivés' : ' archivé'}`);
}

function deleteSelected() {
    if (selectedEmails.size === 0) return;
    
    config.Dialog.confirm({
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer ${selectedEmails.size} email${selectedEmails.size > 1 ? 's' : ''} ?`,
        onConfirm: () => {
            const count = selectedEmails.size;
            selectedEmails.forEach(emailId => {
                deleteEmail(emailId);
            });
            
            clearSelection();
            config.notify.success(`${count} email${count > 1 ? 's supprimés' : ' supprimé'}`);
        }
    });
}

// ========================================
// DÉTAIL EMAIL
// ========================================

function openEmailDetail(emailData) {
    // Pour l'instant, afficher dans un modal
    const modal = new config.Modal({
        title: emailData.subject,
        size: 'large',
        content: `
            <div class="email-detail">
                <div class="email-detail-header">
                    <div class="detail-from">
                        <strong>De :</strong> ${emailData.fromName} &lt;${emailData.from}&gt;
                    </div>
                    <div class="detail-to">
                        <strong>À :</strong> ${emailData.to.join(', ')}
                    </div>
                    <div class="detail-date">
                        <strong>Date :</strong> ${new Date(emailData.date).toLocaleString('fr-FR')}
                    </div>
                </div>
                <div class="email-detail-body">
                    ${emailData.body.replace(/\n/g, '<br>')}
                </div>
                ${emailData.attachments > 0 ? `
                    <div class="email-detail-attachments">
                        <strong>${emailData.attachments} pièce${emailData.attachments > 1 ? 's jointes' : ' jointe'}</strong>
                    </div>
                ` : ''}
            </div>
        `,
        buttons: [
            {
                text: 'Répondre',
                class: 'btn-primary',
                onClick: () => {
                    modal.close();
                    if (window.gmailCompose) {
                        window.gmailCompose.reply(emailData);
                    }
                }
            },
            {
                text: 'Fermer',
                class: 'btn-secondary',
                onClick: () => modal.close()
            }
        ]
    });
    
    modal.open();
}

// ========================================
// UTILITAIRES
// ========================================

function animateRefresh(button) {
    const icon = button.querySelector('svg');
    if (icon) {
        icon.style.animation = 'spin 1s linear';
        setTimeout(() => {
            icon.style.animation = '';
        }, 1000);
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [01/02/2025] - Gestion de la sélection multiple
   Solution: Set pour stocker les IDs sélectionnés
   Impact: Sélection/désélection rapide
   
   NOTES POUR REPRISES FUTURES:
   - Cards créées dynamiquement
   - Sélection multiple avec Set
   - Actions groupées (archiver, supprimer)
   ======================================== */