// ========================================
// GMAIL.COMPOSE.JS - Orchestrateur composition
// Chemin: modules/gmail/gmail.compose.js
//
// DESCRIPTION:
// Gère la composition et l'envoi d'emails
//
// DÉPENDANCES:
// - gmail.config.js (configuration locale)
// - gmail.main.js (état global)
// ========================================

import config from './gmail.config.js';
import { getState } from './gmail.main.js';

// ========================================
// VARIABLES LOCALES
// ========================================

let composeModal = null;
let drafts = new Map(); // Stockage des brouillons

// ========================================
// INITIALISATION
// ========================================

export async function initCompose() {
    console.log('✍️ Initialisation du module de composition...');
    
    // Créer le modal de composition
    composeModal = config.createComposeModal({
        onSend: handleSend,
        onSaveDraft: handleSaveDraft,
        onAttach: handleAttachment,
        onClose: handleClose
    });
    
    // Exposer l'API globalement
    window.gmailCompose = {
        open: openCompose,
        reply: replyToEmail,
        forward: forwardEmail,
        getDrafts: () => Array.from(drafts.values())
    };
    
    // Raccourcis clavier globaux
    attachKeyboardShortcuts();
    
    return true;
}

// ========================================
// OUVERTURE DU MODAL
// ========================================

function openCompose(data = {}) {
    if (!composeModal) return;
    
    // Réinitialiser le formulaire
    composeModal.open({
        to: data.to || '',
        subject: data.subject || '',
        body: data.body || generateSignature()
    });
}

function replyToEmail(emailData) {
    if (!composeModal || !emailData) return;
    
    const replyData = {
        to: emailData.from,
        subject: emailData.subject.startsWith('Re:') 
            ? emailData.subject 
            : `Re: ${emailData.subject}`,
        body: generateReplyBody(emailData)
    };
    
    composeModal.open(replyData);
}

function forwardEmail(emailData) {
    if (!composeModal || !emailData) return;
    
    const forwardData = {
        to: '',
        subject: emailData.subject.startsWith('Fwd:') 
            ? emailData.subject 
            : `Fwd: ${emailData.subject}`,
        body: generateForwardBody(emailData)
    };
    
    composeModal.open(forwardData);
}

// ========================================
// GESTION DES ÉVÉNEMENTS
// ========================================

async function handleSend(emailData) {
    console.log('📤 Envoi de l\'email:', emailData);
    
    // Validation
    if (!validateEmail(emailData)) {
        return;
    }
    
    // Afficher un loader
    showSendingLoader();
    
    try {
        // Simuler l'envoi (remplacer par l'API Gmail plus tard)
        await simulateSend(emailData);
        
        // Ajouter à la liste des emails envoyés
        addToSentFolder(emailData);
        
        // Supprimer le brouillon s'il existe
        const draftId = getDraftId(emailData);
        if (draftId && drafts.has(draftId)) {
            drafts.delete(draftId);
        }
        
        config.notify.success('Email envoyé avec succès');
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        config.notify.error('Erreur lors de l\'envoi de l\'email');
    } finally {
        hideSendingLoader();
    }
}

function handleSaveDraft(emailData) {
    console.log('💾 Sauvegarde du brouillon:', emailData);
    
    const draftId = getDraftId(emailData) || `draft_${Date.now()}`;
    
    drafts.set(draftId, {
        id: draftId,
        ...emailData,
        savedAt: new Date()
    });
    
    // Mettre à jour le badge des brouillons
    if (window.gmailSidebar) {
        window.gmailSidebar.updateBadge('drafts', drafts.size);
    }
    
    console.log(`Brouillon sauvegardé (${drafts.size} brouillons au total)`);
}

function handleAttachment() {
    console.log('📎 Ajout de pièce jointe');
    
    // Créer un input file temporaire
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    input.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            console.log('Fichiers sélectionnés:', files.map(f => f.name));
            config.notify.info(`${files.length} fichier(s) sélectionné(s)`);
            
            // TODO: Implémenter l'upload et l'affichage des pièces jointes
        }
    });
    
    input.click();
}

function handleClose() {
    console.log('❌ Fermeture du modal de composition');
    
    // Proposer de sauvegarder le brouillon si contenu non vide
    // TODO: Implémenter la vérification du contenu
}

// ========================================
// VALIDATION ET ENVOI
// ========================================

function validateEmail(emailData) {
    // Vérifier le destinataire
    if (!emailData.to || emailData.to.trim() === '') {
        config.notify.error('Veuillez entrer au moins un destinataire');
        return false;
    }
    
    // Vérifier le format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipients = emailData.to.split(',').map(e => e.trim());
    
    for (const recipient of recipients) {
        if (!emailRegex.test(recipient)) {
            config.notify.error(`Adresse email invalide : ${recipient}`);
            return false;
        }
    }
    
    // Avertir si pas de sujet
    if (!emailData.subject || emailData.subject.trim() === '') {
        return confirm('Envoyer sans objet ?');
    }
    
    return true;
}

async function simulateSend(emailData) {
    // Simuler un délai d'envoi
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Email envoyé (simulation):', emailData);
            resolve();
        }, 1500);
    });
}

function addToSentFolder(emailData) {
    const state = getState();
    const sentEmail = {
        id: `sent_${Date.now()}`,
        threadId: `thread_${Date.now()}`,
        from: state.user.email,
        fromName: state.user.name,
        to: emailData.to.split(',').map(e => e.trim()),
        subject: emailData.subject || '(Sans objet)',
        preview: emailData.body.substring(0, 150),
        body: emailData.body,
        date: new Date(),
        unread: false,
        starred: false,
        labels: [],
        attachments: 0, // TODO: Compter les vraies pièces jointes
        folder: 'sent'
    };
    
    state.emails.unshift(sentEmail);
}

// ========================================
// TEMPLATES
// ========================================

function generateSignature() {
    const state = getState();
    return `



Cordialement,
${state.user.name}
${state.user.email}`;
}

function generateReplyBody(emailData) {
    const date = new Date(emailData.date).toLocaleString('fr-FR');
    return `



Le ${date}, ${emailData.fromName} <${emailData.from}> a écrit :
> ${emailData.body.split('\n').join('\n> ')}`;
}

function generateForwardBody(emailData) {
    const date = new Date(emailData.date).toLocaleString('fr-FR');
    return `



---------- Message transféré ----------
De : ${emailData.fromName} <${emailData.from}>
Date : ${date}
Objet : ${emailData.subject}
À : ${emailData.to.join(', ')}

${emailData.body}`;
}

// ========================================
// UTILITAIRES
// ========================================

function getDraftId(emailData) {
    // Générer un ID unique basé sur le contenu
    return emailData.draftId || null;
}

function showSendingLoader() {
    // Créer un overlay de chargement
    const loader = document.createElement('div');
    loader.id = 'sending-loader';
    loader.className = 'sending-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="spinner"></div>
            <p>Envoi en cours...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideSendingLoader() {
    const loader = document.getElementById('sending-loader');
    if (loader) {
        loader.remove();
    }
}

function attachKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N : Nouveau message
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            openCompose();
        }
    });
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [01/02/2025] - Gestion des brouillons
   Solution: Map pour stocker temporairement
   Impact: Sauvegarde automatique fonctionnelle
   
   NOTES POUR REPRISES FUTURES:
   - Brouillons en mémoire (Map)
   - Validation des emails
   - Templates pour reply/forward
   ======================================== */