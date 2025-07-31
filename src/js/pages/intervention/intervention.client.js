// ========================================
// INTERVENTION.CLIENT.JS - Gestion de la recherche client (VERSION CORRIGÉE)
// Chemin: src/js/pages/intervention/intervention.client.js
//
// DESCRIPTION:
// Module de gestion de la recherche et sélection client
// CORRIGÉ pour gérer l'absence du champ nom
//
// STRUCTURE:
// 1. Imports et variables
// 2. Initialisation SearchDropdown
// 3. Gestion de la sélection
// 4. API publique
// ========================================

import { ClientsService } from '../../services/clients.service.js';
import SearchDropdown from '../../shared/ui/search-dropdown.component.js';

// ========================================
// VARIABLES PRIVÉES
// ========================================

let clientSearchDropdown = null;
let clientSelectionne = null;

// ========================================
// INITIALISATION
// ========================================

export async function initClientSearch() {
    console.log('🔍 Initialisation recherche client');
    
    // Chercher différents emplacements possibles pour le champ client
    let container = null;
    
    // Option 1 : Chercher le champ nom
    const nomField = document.querySelector('#nom');
    if (nomField) {
        container = nomField.parentElement;
    }
    
    // Option 2 : Chercher un conteneur de recherche client
    if (!container) {
        container = document.querySelector('.client-search-container') || 
                   document.querySelector('.client-search') ||
                   document.querySelector('.form-group');
    }
    
    if (!container) {
        console.error('❌ Aucun conteneur trouvé pour la recherche client');
        console.log('HTML actuel:', document.body.innerHTML.substring(0, 500));
        
        // Créer un conteneur temporaire si aucun n'existe
        const firstFormGroup = document.querySelector('.form-group');
        if (firstFormGroup) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'form-group client-search-container';
            searchContainer.innerHTML = `
                <label for="client-search">Rechercher un client <span style="color: #dc3545;">*</span></label>
                <div class="client-search-wrapper"></div>
            `;
            firstFormGroup.parentNode.insertBefore(searchContainer, firstFormGroup);
            container = searchContainer;
        } else {
            console.error('❌ Impossible de créer le conteneur de recherche');
            return;
        }
    }
    
    // Si on a trouvé un champ nom, le remplacer par SearchDropdown
    if (nomField) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'form-group client-search-container';
        searchContainer.innerHTML = `
            <label for="client-search">Nom du client <span style="color: #dc3545;">*</span></label>
            <div class="client-search-wrapper"></div>
        `;
        container.replaceWith(searchContainer);
        container = searchContainer;
    }
    
    // Initialiser SearchDropdown
    try {
        clientSearchDropdown = new SearchDropdown({
            container: container.querySelector('.client-search-wrapper') || container,
            placeholder: 'Rechercher un client (nom, prénom, téléphone...)',
            minLength: 2,
            noResultsText: 'Aucun client trouvé',
            loadingText: 'Recherche en cours...',
            showClearButton: true,
            closeOnSelect: true,
            onSearch: async (query) => {
                try {
                    const clients = await ClientsService.rechercherClients(query);
                    console.log(`📋 ${clients.length} clients trouvés pour "${query}"`);
                    return clients;
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
        
        console.log('✅ SearchDropdown initialisé');
    } catch (error) {
        console.error('❌ Erreur initialisation SearchDropdown:', error);
    }
}

// ========================================
// GESTION DE LA SÉLECTION
// ========================================

function selectionnerClient(client) {
    clientSelectionne = client;
    
    // Remplir automatiquement le téléphone
    const telInput = document.getElementById('telephone');
    if (telInput) {
        telInput.value = client.telephone || '';
        
        // Bloquer la modification
        telInput.readOnly = true;
        telInput.style.backgroundColor = '#f8f9fa';
        telInput.style.cursor = 'not-allowed';
        telInput.style.opacity = '0.8';
        
        // Texte d'aide
        const helpText = document.createElement('small');
        helpText.style.color = '#6c757d';
        helpText.style.fontSize = '0.875rem';
        helpText.style.display = 'block';
        helpText.style.marginTop = '5px';
        helpText.textContent = '🔒 Téléphone du client en base';
        
        // Retirer l'ancien si existe
        const oldHelp = telInput.parentElement.querySelector('.phone-help');
        if (oldHelp) oldHelp.remove();
        
        helpText.className = 'phone-help';
        telInput.parentElement.appendChild(helpText);
    }
    
    console.log('✅ Client sélectionné:', client);
    
    // Afficher les infos du client sélectionné
    showClientInfo(client);
}

function showClientInfo(client) {
    // Chercher ou créer un conteneur pour afficher les infos
    let infoContainer = document.querySelector('.client-info-display');
    
    if (!infoContainer) {
        const searchContainer = document.querySelector('.client-search-container');
        if (searchContainer) {
            infoContainer = document.createElement('div');
            infoContainer.className = 'client-info-display';
            infoContainer.style.cssText = `
                background: #e8f5e9;
                border: 2px solid #4caf50;
                border-radius: 8px;
                padding: 12px;
                margin-top: 10px;
                font-size: 14px;
            `;
            searchContainer.appendChild(infoContainer);
        }
    }
    
    if (infoContainer) {
        infoContainer.innerHTML = `
            <strong>Client sélectionné :</strong> ${client.prenom} ${client.nom}<br>
            ${client.telephone ? `<small>Tél: ${client.telephone}</small><br>` : ''}
            ${client.magasinReference ? `<small>Magasin: ${client.magasinReference}</small>` : ''}
        `;
    }
}

// ========================================
// API PUBLIQUE
// ========================================

/**
 * Obtenir le client actuellement sélectionné
 */
export function getClientSelectionne() {
    return clientSelectionne;
}

/**
 * Réinitialiser la sélection client
 */
export function resetClientSelection() {
    clientSelectionne = null;
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
    
    // Débloquer et nettoyer
    const telInput = document.getElementById('telephone');
    if (telInput) {
        telInput.value = '';
        telInput.readOnly = false;
        telInput.style.backgroundColor = '';
        telInput.style.cursor = '';
        telInput.style.opacity = '';
        
        // Retirer le texte d'aide
        const helpText = telInput.parentElement.querySelector('.phone-help');
        if (helpText) helpText.remove();
    }
    
    // Retirer l'affichage des infos client
    const infoContainer = document.querySelector('.client-info-display');
    if (infoContainer) {
        infoContainer.remove();
    }
}

/**
 * Définir un client par programmation
 */
export function setClient(client) {
    if (client && clientSearchDropdown) {
        clientSelectionne = client;
        clientSearchDropdown.setSelectedItem(client);
        
        // Remplir le téléphone
        const telInput = document.getElementById('telephone');
        if (telInput && client.telephone) {
            telInput.value = client.telephone;
        }
    }
}

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [28/01/2025] - Création du module
// [02/02/2025] - Correction pour gérer l'absence du champ nom
// - Ajout de recherche dans plusieurs emplacements possibles
// - Création automatique du conteneur si nécessaire
// - Meilleure gestion des erreurs
//
// NOTES POUR REPRISES FUTURES:
// - Ce module est temporaire, migrer vers intervention.create.js
// - La nouvelle architecture utilise des modals au lieu d'un formulaire
// ========================================