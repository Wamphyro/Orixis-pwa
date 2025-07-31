// ========================================
// INTERVENTION.CREATE.JS - Gestion de la création d'interventions
// Chemin: src/js/pages/intervention/intervention.create.js
//
// DESCRIPTION:
// Module de création d'interventions avec stepper et gestion modale
// ========================================

import { db } from '../../services/firebase.service.js';
import { ClientsService } from '../../services/clients.service.js';
import { InterventionService } from '../../services/intervention.service.js';
import { SearchDropdown, DropdownList, Dialog, notify } from '../../shared/index.js';
import { 
    INTERVENTION_CONFIG,
    MARQUES_APPAREILS,
    genererNumeroIntervention
} from '../../data/intervention.data.js';
import { chargerDonnees } from './intervention.list.js';
import { afficherSucces, afficherErreur } from './intervention.main.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let etapeActuelle = 1;
let nouvelleIntervention = {
    clientId: null,
    client: null,
    appareil: {
        type: '',
        marque: '',
        modele: '',
        numeroSerie: ''
    },
    problemes: [],
    actions: [],
    resultat: '',
    observations: '',
    magasin: ''
};

// Instances des composants
let clientSearchDropdown = null;
let dropdownMarque = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationIntervention() {
    console.log('✅ Module création intervention initialisé');
}

// ========================================
// NOUVELLE INTERVENTION
// ========================================

export function ouvrirNouvelleIntervention() {
    resetNouvelleIntervention();
    afficherEtape(1);
    window.modalManager.open('modalNouvelleIntervention');
}

function resetNouvelleIntervention() {
    etapeActuelle = 1;
    
    // Récupérer le magasin de l'utilisateur
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    
    nouvelleIntervention = {
        clientId: null,
        client: null,
        appareil: {
            type: '',
            marque: '',
            modele: '',
            numeroSerie: ''
        },
        problemes: [],
        actions: [],
        resultat: '',
        observations: '',
        magasin: auth.magasin || ''
    };
    
    // Réinitialiser les composants
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
    if (dropdownMarque) {
        dropdownMarque.destroy();
        dropdownMarque = null;
    }
    
    // Réinitialiser l'UI
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    const telephoneGroup = document.getElementById('telephoneGroup');
    if (telephoneGroup) {
        telephoneGroup.style.display = 'none';
    }
    
    // Réinitialiser les checkboxes
    document.querySelectorAll('#modalNouvelleIntervention input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Réinitialiser les radios
    document.querySelectorAll('#modalNouvelleIntervention .device-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Réinitialiser le select résultat
    const selectResultat = document.getElementById('resultat');
    if (selectResultat) {
        selectResultat.value = '';
    }
    
    // Réinitialiser les observations
    const textareaObservations = document.getElementById('observations');
    if (textareaObservations) {
        textareaObservations.value = '';
    }
}

// ========================================
// GESTION DU STEPPER
// ========================================

function afficherEtape(etape) {
    etapeActuelle = etape;
    
    // Masquer toutes les étapes
    for (let i = 1; i <= 4; i++) {
        const stepContent = document.getElementById(`stepContent${i}`);
        const step = document.getElementById(`step${i}`);
        
        if (stepContent) stepContent.classList.add('hidden');
        if (step) {
            step.classList.remove('active', 'completed');
        }
    }
    
    // Afficher l'étape actuelle
    const currentStepContent = document.getElementById(`stepContent${etape}`);
    const currentStep = document.getElementById(`step${etape}`);
    
    if (currentStepContent) currentStepContent.classList.remove('hidden');
    if (currentStep) currentStep.classList.add('active');
    
    // Marquer les étapes précédentes comme complétées
    for (let i = 1; i < etape; i++) {
        const step = document.getElementById(`step${i}`);
        if (step) step.classList.add('completed');
    }
    
    // Gérer les boutons
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnValider = document.getElementById('btnValiderIntervention');
    
    if (btnPrev) btnPrev.disabled = etape === 1;
    if (btnNext) btnNext.style.display = etape < 4 ? 'block' : 'none';
    if (btnValider) btnValider.classList.toggle('hidden', etape !== 4);
    
    // Actions spécifiques par étape
    switch (etape) {
        case 1:
            setTimeout(() => initClientSearch(), 300);
            initDeviceSelection();
            initMarqueDropdown();
            break;
        case 4:
            afficherRecapitulatif();
            break;
    }
}

export function etapePrecedente() {
    if (etapeActuelle > 1) {
        afficherEtape(etapeActuelle - 1);
    }
}

export async function etapeSuivante() {
    if (!await validerEtape(etapeActuelle)) {
        return;
    }
    
    if (etapeActuelle < 4) {
        afficherEtape(etapeActuelle + 1);
    }
}

// ========================================
// VALIDATION DES ÉTAPES
// ========================================

async function validerEtape(etape) {
    switch (etape) {
        case 1:
            if (!nouvelleIntervention.clientId) {
                await Dialog.alert('Veuillez sélectionner un client', 'Attention');
                return false;
            }
            if (!nouvelleIntervention.appareil.type) {
                await Dialog.alert('Veuillez sélectionner un type d\'appareil', 'Attention');
                return false;
            }
            if (!nouvelleIntervention.appareil.marque) {
                await Dialog.alert('Veuillez sélectionner une marque', 'Attention');
                return false;
            }
            
            // Collecter modèle et numéro de série
            nouvelleIntervention.appareil.modele = document.getElementById('modele')?.value || '';
            nouvelleIntervention.appareil.numeroSerie = document.getElementById('numeroSerie')?.value || '';
            break;
            
        case 2:
            // Collecter les problèmes cochés
            nouvelleIntervention.problemes = Array.from(
                document.querySelectorAll('input[name="probleme"]:checked')
            ).map(cb => cb.value);
            
            if (nouvelleIntervention.problemes.length === 0) {
                await Dialog.alert('Veuillez sélectionner au moins un problème', 'Attention');
                return false;
            }
            break;
            
        case 3:
            // Collecter les actions cochées
            nouvelleIntervention.actions = Array.from(
                document.querySelectorAll('input[name="actions"]:checked')
            ).map(cb => cb.value);
            
            // Collecter le résultat
            nouvelleIntervention.resultat = document.getElementById('resultat')?.value || '';
            
            if (!nouvelleIntervention.resultat) {
                await Dialog.alert('Veuillez sélectionner un résultat', 'Attention');
                return false;
            }
            
            // Collecter les observations
            nouvelleIntervention.observations = document.getElementById('observations')?.value || '';
            break;
    }
    
    return true;
}

// ========================================
// GESTION DU CLIENT
// ========================================

function initClientSearch() {
    const searchWrapper = document.querySelector('.client-search-wrapper');
    if (!searchWrapper) return;
    
    if (clientSearchDropdown) {
        clientSearchDropdown.destroy();
    }
    
    clientSearchDropdown = new SearchDropdown({
        container: '.client-search-wrapper',
        placeholder: 'Rechercher un client (nom, prénom, téléphone...)',
        minLength: 2,
        noResultsText: 'Aucun client trouvé',
        loadingText: 'Recherche en cours...',
        showClearButton: true,
        onSearch: async (query) => {
            try {
                return await ClientsService.rechercherClients(query);
            } catch (error) {
                console.error('Erreur recherche client:', error);
                throw error;
            }
        },
        onSelect: (client) => {
            selectionnerClient(client);
        },
        renderItem: (client) => {
            return `
                <div>
                    <strong>${client.prenom} ${client.nom}</strong>
                    <small style="display: block; color: #6c757d;">
                        ${client.telephone || 'Pas de téléphone'} 
                        ${client.magasinReference ? `• Magasin: ${client.magasinReference}` : ''}
                    </small>
                </div>
            `;
        },
        getValue: (client) => {
            return client ? `${client.prenom} ${client.nom}` : '';
        }
    });
}

function selectionnerClient(client) {
    nouvelleIntervention.clientId = client.id;
    nouvelleIntervention.client = client;
    
    // Masquer la recherche
    const searchContainer = document.querySelector('.client-search-container');
    if (searchContainer) {
        const searchWrapper = searchContainer.querySelector('.client-search-wrapper');
        if (searchWrapper) searchWrapper.style.display = 'none';
    }
    
    // Afficher le client sélectionné
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'block';
        
        const selectedClientName = document.getElementById('selectedClientName');
        const selectedClientInfo = document.getElementById('selectedClientInfo');
        
        if (selectedClientName) {
            selectedClientName.textContent = `${client.prenom} ${client.nom}`;
        }
        
        if (selectedClientInfo) {
            let infoText = '';
            if (client.telephone) infoText += client.telephone;
            if (client.magasinReference) {
                infoText += (infoText ? ' • ' : '') + `Magasin: ${client.magasinReference}`;
            }
            selectedClientInfo.textContent = infoText;
        }
    }
    
    // Afficher et remplir le téléphone
    const telephoneGroup = document.getElementById('telephoneGroup');
    const telephoneInput = document.getElementById('telephone');
    
    if (telephoneGroup) {
        telephoneGroup.style.display = 'block';
    }
    
    if (telephoneInput) {
        telephoneInput.value = client.telephone || '';
        telephoneInput.readOnly = true;
        telephoneInput.style.backgroundColor = '#f8f9fa';
        telephoneInput.style.cursor = 'not-allowed';
        telephoneInput.style.opacity = '0.8';
    }
}

export function changerClient() {
    nouvelleIntervention.clientId = null;
    nouvelleIntervention.client = null;
    
    // Réafficher la recherche
    const searchWrapper = document.querySelector('.client-search-wrapper');
    if (searchWrapper) {
        searchWrapper.style.display = 'block';
    }
    
    // Masquer le client sélectionné
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    // Masquer le téléphone
    const telephoneGroup = document.getElementById('telephoneGroup');
    if (telephoneGroup) {
        telephoneGroup.style.display = 'none';
    }
    
    // Réinitialiser le SearchDropdown
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
}

// ========================================
// GESTION DE L'APPAREIL
// ========================================

function initDeviceSelection() {
    const deviceCards = document.querySelectorAll('#modalNouvelleIntervention .device-card');
    
    deviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const input = this.querySelector('input[type="radio"]');
            if (input) {
                input.checked = true;
                nouvelleIntervention.appareil.type = input.value;
                
                // Mettre à jour l'UI
                deviceCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
            }
        });
    });
}

function initMarqueDropdown() {
    const container = document.getElementById('marqueAppareil');
    if (!container) return;
    
    if (dropdownMarque) {
        dropdownMarque.destroy();
    }
    
    dropdownMarque = new DropdownList({
        container: '#marqueAppareil',
        placeholder: 'Sélectionner une marque',
        searchable: true,
        options: MARQUES_APPAREILS.map(marque => ({
            value: marque,
            label: marque
        })),
        onChange: (value) => {
            nouvelleIntervention.appareil.marque = value;
        }
    });
}

// ========================================
// RÉCAPITULATIF
// ========================================

function afficherRecapitulatif() {
    // Client
    const recapClient = document.getElementById('recapClient');
    if (recapClient && nouvelleIntervention.client) {
        recapClient.innerHTML = `
            <p><strong>${nouvelleIntervention.client.prenom} ${nouvelleIntervention.client.nom}</strong></p>
            <p>Tél: ${nouvelleIntervention.client.telephone || '-'}</p>
            <p>Magasin: ${nouvelleIntervention.client.magasinReference || '-'}</p>
        `;
    }
    
    // Appareil
    const recapAppareil = document.getElementById('recapAppareil');
    if (recapAppareil) {
        const typeConfig = INTERVENTION_CONFIG.TYPES_APPAREILS[nouvelleIntervention.appareil.type];
        recapAppareil.innerHTML = `
            <p><strong>Type:</strong> ${typeConfig?.icon} ${typeConfig?.label}</p>
            <p><strong>Marque:</strong> ${nouvelleIntervention.appareil.marque}</p>
            ${nouvelleIntervention.appareil.modele ? 
                `<p><strong>Modèle:</strong> ${nouvelleIntervention.appareil.modele}</p>` : ''}
            ${nouvelleIntervention.appareil.numeroSerie ? 
                `<p><strong>N° Série:</strong> ${nouvelleIntervention.appareil.numeroSerie}</p>` : ''}
        `;
    }
    
    // Diagnostic
    const recapDiagnostic = document.getElementById('recapDiagnostic');
    if (recapDiagnostic) {
        const problemesLabels = nouvelleIntervention.problemes.map(p => {
            const config = Object.entries(INTERVENTION_CONFIG.PROBLEMES)
                .find(([key, val]) => val.label.includes(p));
            return config ? `${config[1].icon} ${config[1].label}` : p;
        });
        
        const actionsLabels = nouvelleIntervention.actions.map(a => {
            const config = Object.entries(INTERVENTION_CONFIG.ACTIONS)
                .find(([key, val]) => val.label.includes(a));
            return config ? `${config[1].icon} ${config[1].label}` : a;
        });
        
        recapDiagnostic.innerHTML = `
            <div class="mb-3">
                <strong>Problèmes:</strong>
                <ul>${problemesLabels.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
            <div>
                <strong>Actions:</strong>
                <ul>${actionsLabels.map(a => `<li>${a}</li>`).join('')}</ul>
            </div>
        `;
    }
    
    // Résultat
    const recapResultat = document.getElementById('recapResultat');
    if (recapResultat) {
        const resultatConfig = INTERVENTION_CONFIG.RESULTATS[nouvelleIntervention.resultat];
        recapResultat.innerHTML = `
            <p><strong>Résultat:</strong> ${resultatConfig?.icon} ${resultatConfig?.label}</p>
            ${nouvelleIntervention.observations ? 
                `<p><strong>Observations:</strong> ${nouvelleIntervention.observations}</p>` : ''}
        `;
    }
}

// ========================================
// VALIDATION FINALE
// ========================================

export async function validerIntervention() {
    try {
        // Préparer les données pour le service
        const interventionData = {
            numeroIntervention: genererNumeroIntervention(nouvelleIntervention.magasin),
            clientId: nouvelleIntervention.clientId,
            client: nouvelleIntervention.client,
            appareil: nouvelleIntervention.appareil,
            problemes: nouvelleIntervention.problemes,
            actions: nouvelleIntervention.actions,
            resultat: nouvelleIntervention.resultat,
            observations: nouvelleIntervention.observations,
            magasin: nouvelleIntervention.magasin,
            statut: 'nouvelle'
        };
        
        // Créer l'intervention
        const interventionId = await InterventionService.creerIntervention(interventionData);
        
        // Fermer le modal
        window.modalManager.close('modalNouvelleIntervention');
        
        // Recharger les données
        await chargerDonnees();
        
        // Afficher le succès
        afficherSucces('Intervention créée avec succès !');
        
        // Proposer de passer directement à la signature
        setTimeout(async () => {
            const demarrer = await Dialog.confirm(
                'Voulez-vous démarrer l\'intervention maintenant ?',
                'Démarrer l\'intervention'
            );
            
            if (demarrer) {
                // Stocker les données pour la signature
                localStorage.setItem('sav_intervention_data', JSON.stringify({
                    interventionId,
                    ...interventionData
                }));
                
                // Rediriger vers la signature
                window.location.href = 'signature-client.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur création intervention:', error);
        afficherErreur('Erreur lors de la création de l\'intervention: ' + error.message);
    }
}