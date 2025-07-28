// ========================================
// INTERVENTION.CLIENT.JS - Gestion de la recherche client
// Chemin: src/js/pages/intervention/intervention.client.js
//
// DESCRIPTION:
// Module de gestion de la recherche et sélection client
// Utilise SearchDropdown pour l'interface
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
    
    // Remplacer la structure HTML existante
    const nomGroup = document.querySelector('#nom')?.parentElement;
    if (!nomGroup) {
        console.error('❌ Champ nom introuvable');
        return;
    }
    
    // Créer le nouveau conteneur
    const searchContainer = document.createElement('div');
    searchContainer.className = 'form-group client-search-container';
    searchContainer.innerHTML = `
        <label for="nom">Nom du client <span style="color: #dc3545;">*</span></label>
        <div class="client-search-wrapper"></div>
    `;
    
    // Remplacer l'ancien form-group
    nomGroup.replaceWith(searchContainer);
    
    // Initialiser SearchDropdown
    try {
        clientSearchDropdown = new SearchDropdown({
            container: '.client-search-wrapper',
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
    if (telInput && client.telephone) {
        telInput.value = client.telephone;
        telInput.classList.add('auto-filled');
        
        // Animation visuelle
        telInput.style.backgroundColor = '#e8f5e9';
        setTimeout(() => {
            telInput.style.backgroundColor = '';
        }, 1000);
    }
    
    console.log('✅ Client sélectionné:', {
        id: client.id,
        nom: `${client.prenom} ${client.nom}`,
        telephone: client.telephone,
        magasin: client.magasinReference
    });
    
    // Déclencher un événement personnalisé
    document.dispatchEvent(new CustomEvent('clientSelected', {
        detail: { client }
    }));
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
    
    // Vider aussi le téléphone
    const telInput = document.getElementById('telephone');
    if (telInput) {
        telInput.value = '';
        telInput.classList.remove('auto-filled');
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
// - Gestion de la recherche client avec SearchDropdown
// - Auto-remplissage du téléphone
// - API publique pour accéder au client sélectionné
//
// NOTES POUR REPRISES FUTURES:
// - Le style auto-filled pourrait être dans le CSS
// - L'animation backgroundColor pourrait utiliser une classe CSS
// ========================================