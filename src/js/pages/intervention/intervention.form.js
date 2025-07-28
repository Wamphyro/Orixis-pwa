// ========================================
// INTERVENTION.FORM.JS - Gestion du formulaire d'intervention
// Chemin: src/js/pages/intervention/intervention.form.js
//
// DESCRIPTION:
// Module de gestion du formulaire d'intervention
// Gère la soumission, validation et envoi SAV
//
// STRUCTURE:
// 1. Imports
// 2. Initialisation des événements
// 3. Gestion de la soumission
// 4. Fonction reset
// 5. Envoi SAV
// ========================================

import { getClientSelectionne, resetClientSelection } from './intervention.client.js';
import { Dialog, notify } from '../../shared/index.js';

// ========================================
// INITIALISATION
// ========================================

export function initFormHandlers() {
    console.log('📝 Initialisation gestionnaires formulaire');
    
    // Gestion de la sélection des appareils
    initDeviceCards();
    
    // Gestion du résultat (afficher/masquer bouton SAV)
    initResultatHandler();
    
    // Gestion de la soumission
    initFormSubmit();
    
    // Protection contre fermeture accidentelle
    initBeforeUnloadHandler();
}

// ========================================
// GESTIONNAIRES D'ÉVÉNEMENTS
// ========================================

function initDeviceCards() {
    const deviceCards = document.querySelectorAll('.device-card');
    
    deviceCards.forEach(card => {
        card.addEventListener('click', function() {
            deviceCards.forEach(c => c.classList.remove('selected'));
            if (this.querySelector('input').checked) {
                this.classList.add('selected');
            }
        });
        
        const input = card.querySelector('input');
        input?.addEventListener('change', function() {
            deviceCards.forEach(c => c.classList.remove('selected'));
            if (this.checked) {
                card.classList.add('selected');
            }
        });
    });
}

function initResultatHandler() {
    const resultatSelect = document.getElementById('resultat');
    
    resultatSelect?.addEventListener('change', function() {
        const btnSAV = document.getElementById('btnSAV');
        if (btnSAV) {
            btnSAV.style.display = this.value === 'SAV' ? 'inline-block' : 'none';
        }
    });
}

function initFormSubmit() {
    const form = document.getElementById('interventionForm');
    
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validation HTML5
        if (!this.checkValidity()) {
            this.reportValidity();
            return;
        }
        
        // Vérifier qu'un client est sélectionné
        const client = getClientSelectionne();
        if (!client) {
            await Dialog.alert('Veuillez sélectionner un client dans la liste', 'Client requis');
            return;
        }
        
        // Collecter les données
        const formData = collectFormData(client);
        
        // Sauvegarder et rediriger
        localStorage.setItem('sav_intervention_data', JSON.stringify(formData));
        window.location.href = 'signature-client.html';
    });
}

function initBeforeUnloadHandler() {
    window.addEventListener('beforeunload', function(e) {
        const form = document.getElementById('interventionForm');
        if (!form) return;
        
        // Vérifier si des données ont été saisies
        const hasData = Array.from(form.elements).some(element => {
            if (element.type === 'checkbox' || element.type === 'radio') {
                return element.checked;
            }
            return element.value && 
                   element.value !== document.getElementById('date')?.value && 
                   element.value !== document.getElementById('heure')?.value;
        });
        
        if (hasData || getClientSelectionne()) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

// ========================================
// COLLECTE DES DONNÉES
// ========================================

function collectFormData(client) {
    // Toujours prendre la valeur ACTUELLE du champ téléphone
    const telephoneActuel = document.getElementById('telephone')?.value || '';
    
    return {
        // Informations client
        clientId: client.id,
        nom: `${client.prenom} ${client.nom}`,
        telephone: telephoneActuel,  // TOUJOURS prendre la valeur du champ !
        telephoneOriginal: client.telephone,  // Garder l'original pour référence
        
        // Informations intervention
        date: document.getElementById('date')?.value || '',
        heure: document.getElementById('heure')?.value || '',
        type_appareil: document.querySelector('input[name="type_appareil"]:checked')?.value || '',
        marque: document.getElementById('marque')?.value || '',
        
        // Problèmes et actions
        problemes: Array.from(document.querySelectorAll('input[name="probleme"]:checked'))
            .map(cb => cb.value),
        actions: Array.from(document.querySelectorAll('input[name="actions"]:checked'))
            .map(cb => cb.value),
        
        // Résultat et observations
        resultat: document.getElementById('resultat')?.value || '',
        observations: document.getElementById('observations')?.value || '',
        
        // Métadonnées
        timestamp: Date.now(),
        magasin: JSON.parse(localStorage.getItem('sav_auth') || '{}').magasin || ''
    };
}

// ========================================
// FONCTION RESET
// ========================================

export function resetForm() {
    Dialog.confirm('Êtes-vous sûr de vouloir effacer tous les champs ?', 'Confirmation')
        .then(confirmed => {
            if (!confirmed) return;
            
            const form = document.getElementById('interventionForm');
            if (form) {
                form.reset();
            }
            
            // Réinitialiser la date et l'heure
            const now = new Date();
            const dateInput = document.getElementById('date');
            const heureInput = document.getElementById('heure');
            
            if (dateInput) dateInput.value = now.toISOString().split('T')[0];
            if (heureInput) heureInput.value = now.toTimeString().slice(0, 5);
            
            // Réinitialiser la sélection client
            resetClientSelection();
            
            // Réinitialiser les device cards
            document.querySelectorAll('.device-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Masquer le bouton SAV
            const btnSAV = document.getElementById('btnSAV');
            if (btnSAV) btnSAV.style.display = 'none';
            
            notify.success('Formulaire réinitialisé');
        });
}

// ========================================
// ENVOI SAV
// ========================================

export async function envoyerSAV() {
    const confirmed = await Dialog.confirm(
        'Confirmer l\'envoi de l\'escalade SAV aux assistantes ?',
        'Envoi SAV'
    );
    
    if (!confirmed) return;
    
    const client = getClientSelectionne();
    if (!client) {
        await Dialog.alert('Veuillez sélectionner un client', 'Client requis');
        return;
    }
    
    const btnSAV = document.getElementById('btnSAV');
    const btnText = btnSAV?.innerHTML || '';
    
    try {
        // Afficher le loading
        if (btnSAV) {
            btnSAV.innerHTML = '⏳ Envoi en cours...';
            btnSAV.disabled = true;
        }
        
        // Préparer les données
        const templateParams = prepareEmailData(client);
        
        // Envoyer l'email
        await emailjs.send('service_6juwjvq', 'template_51rhrbr', templateParams);
        
        notify.success('✅ Escalade SAV envoyée avec succès !');
        console.log('Email SAV envoyé:', templateParams);
        
        // Proposer nouvelle fiche
        const newFiche = await Dialog.confirm(
            'Voulez-vous créer une nouvelle fiche ?',
            'Nouvelle fiche'
        );
        
        if (newFiche) {
            resetForm();
        }
        
    } catch (error) {
        console.error('Erreur envoi SAV:', error);
        
        let errorMessage = 'Erreur lors de l\'envoi : ';
        if (error.text) {
            errorMessage += error.text;
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Erreur inconnue';
        }
        
        notify.error(errorMessage);
        
    } finally {
        // Restaurer le bouton
        if (btnSAV) {
            btnSAV.innerHTML = btnText;
            btnSAV.disabled = false;
        }
    }
}

function prepareEmailData(client) {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    const date = new Date();
    
    // Toujours prendre le téléphone actuel du formulaire
    const telephoneActuel = document.getElementById('telephone')?.value || client.telephone || 'Non renseigné';
    
    return {
        // Destinataires
        to_email: 'korber@BROKERAUDIOLOGIE88.onmicrosoft.com',
        reply_to: 'noreply@orixis.fr',
        
        // Informations générales
        magasin: auth.magasin || 'Non spécifié',
        intervenant: auth.collaborateur 
            ? `${auth.collaborateur.prenom} ${auth.collaborateur.nom}` 
            : 'Non spécifié',
        date: date.toLocaleDateString('fr-FR'),
        heure: date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
        
        // Informations client
        nom_client: `${client.prenom} ${client.nom}`,
        telephone: telephoneActuel,  // Utiliser le téléphone actuel !
        
        // Informations intervention
        type_appareil: document.querySelector('input[name="type_appareil"]:checked')?.value || 'Non spécifié',
        marque: document.getElementById('marque')?.value || 'Non spécifiée',
        
        // Problèmes et actions
        probleme: Array.from(document.querySelectorAll('input[name="probleme"]:checked'))
            .map(cb => cb.parentElement.querySelector('label')?.textContent.trim())
            .filter(Boolean)
            .join(', ') || 'Non spécifié',
        
        actions: Array.from(document.querySelectorAll('input[name="actions"]:checked'))
            .map(cb => cb.parentElement.querySelector('label')?.textContent.trim())
            .filter(Boolean)
            .join(', ') || 'Aucune action',
        
        // Résultat et observations
        resultat: document.getElementById('resultat')?.selectedOptions[0]?.text || 'Non spécifié',
        observations: document.getElementById('observations')?.value || 'Aucune observation'
    };
}

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [28/01/2025] - Création du module
// - Gestion complète du formulaire
// - Validation avec client obligatoire
// - Envoi SAV avec EmailJS
//
// NOTES POUR REPRISES FUTURES:
// - prepareEmailData pourrait être factorisé
// - Les IDs EmailJS sont en dur
// - La validation pourrait être plus poussée
// ========================================