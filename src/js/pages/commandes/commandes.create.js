// ========================================
// COMMANDES.CREATE.JS - Gestion de la création de commandes (MODULARISÉ)
// Chemin: src/js/pages/commandes/commandes.create.js
//
// DESCRIPTION:
// Module de création de commandes avec intégration du composant SearchDropdown
//
// MODIFICATIONS:
// [28/01/2025] - Intégration de SearchDropdown pour remplacer les recherches natives
// [28/01/2025] - Utilisation des bons sélecteurs ID (#clientSearch, #productSearch)
// [31/01/2025] - Centralisation des types de préparation et urgences depuis commandes.data.js
// ========================================

import { db } from '../../services/firebase.service.js';
import { ClientsService } from '../../services/clients.service.js';
import { ProduitsService } from '../../services/produits.service.js';
import { CommandesService } from '../../services/commandes.service.js';
import SearchDropdown from '../../shared/ui/search-dropdown.component.js';
import { 
    COMMANDES_CONFIG,
    genererOptionsTypesPreparation,
    genererOptionsUrgence 
} from '../../data/commandes.data.js';
import { Dialog, notify } from '../../shared/index.js';
import { chargerDonnees } from './commandes.list.js';
import { ouvrirModal, afficherSucces, afficherErreur } from './commandes.main.js';

// ... (reste du code inchangé jusqu'à afficherEtape) ...

function afficherEtape(etape) {
    // Mettre à jour l'étape actuelle
    etapeActuelle = etape;
    
    // Masquer toutes les étapes
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`stepContent${i}`).classList.add('hidden');
        document.getElementById(`step${i}`).classList.remove('active', 'completed');
    }
    
    // Afficher l'étape actuelle
    document.getElementById(`stepContent${etape}`).classList.remove('hidden');
    document.getElementById(`step${etape}`).classList.add('active');
    
    // Marquer les étapes précédentes comme complétées
    for (let i = 1; i < etape; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    // Gérer les boutons
    document.getElementById('btnPrevStep').disabled = etape === 1;
    document.getElementById('btnNextStep').style.display = etape < 4 ? 'block' : 'none';
    document.getElementById('btnValiderCommande').classList.toggle('hidden', etape !== 4);
    
    // Actions spécifiques par étape
    switch (etape) {
        case 1:
            // MODIFIÉ : Attendre plus longtemps et vérifier l'existence
            setTimeout(() => {
                const clientSearchContainer = document.querySelector('.client-search');
                if (clientSearchContainer) {
                    initClientSearch();
                } else {
                    console.error('Container .client-search introuvable');
                }
            }, 300);
            break;
            
        case 2:
            console.log('📍 Arrivée à l\'étape 2 - Chargement des packs');
            chargerPackTemplates();
            setTimeout(() => {
                const productSearchContainer = document.querySelector('.product-search');
                if (productSearchContainer) {
                    initProductSearch();
                } else {
                    console.error('Container .product-search introuvable');
                }
            }, 300);
            break;
            
        case 3:
            // NOUVEAU : Générer dynamiquement les options
            genererOptionsEtape3();
            chargerMagasins();
            setDateLivraisonDefaut();
            break;
            
        case 4:
            afficherRecapitulatif();
            break;
    }
}

// ========================================
// NOUVELLE FONCTION : Générer les options de l'étape 3
// ========================================
function genererOptionsEtape3() {
    // 1. Générer le select type de préparation
    const selectType = document.getElementById('typePreparation');
    if (selectType) {
        const typesPreparation = genererOptionsTypesPreparation();
        selectType.innerHTML = typesPreparation.map(type => 
            `<option value="${type.value}">${type.label}</option>`
        ).join('');
        
        // Restaurer la valeur si elle existe
        if (nouvelleCommande.typePreparation) {
            selectType.value = nouvelleCommande.typePreparation;
        }
    }
    
    // 2. Générer les boutons radio urgence
    const urgenceContainer = document.querySelector('.urgence-selector');
    if (urgenceContainer) {
        const optionsUrgence = genererOptionsUrgence();
        const urgenceConfig = COMMANDES_CONFIG.NIVEAUX_URGENCE;
        
        urgenceContainer.innerHTML = optionsUrgence.map((option, index) => {
            const config = urgenceConfig[option.value];
            return `
                <label class="urgence-option">
                    <input type="radio" name="urgence" value="${option.value}" 
                           ${index === 0 || nouvelleCommande.urgence === option.value ? 'checked' : ''}>
                    <span class="urgence-badge ${option.value}">
                        ${option.label} (${config.delai})
                    </span>
                </label>
            `;
        }).join('');
        
        // Ajouter les event listeners pour mettre à jour la date
        const radioButtons = urgenceContainer.querySelectorAll('input[name="urgence"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                nouvelleCommande.urgence = radio.value;
                setDateLivraisonDefaut();
            });
        });
    }
}

// ... (reste du code modifié pour setDateLivraisonDefaut) ...

function setDateLivraisonDefaut() {
    const dateInput = document.getElementById('dateLivraison');
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    
    // Utiliser calculerDelaiLivraison depuis commandes.data.js
    const { calculerDelaiLivraison } = COMMANDES_CONFIG;
    const date = calculerDelaiLivraison ? calculerDelaiLivraison(urgence) : new Date();
    
    // Si pas de fonction helper, utiliser l'ancienne logique
    if (!calculerDelaiLivraison) {
        const maintenant = new Date();
        switch (urgence) {
            case 'tres_urgent':
                maintenant.setDate(maintenant.getDate() + 1);
                break;
            case 'urgent':
                maintenant.setDate(maintenant.getDate() + 2);
                break;
            default:
                maintenant.setDate(maintenant.getDate() + 5);
        }
        date = maintenant;
    }
    
    dateInput.value = date.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
}

// ... (reste du code, notamment afficherRecapitulatif à modifier) ...

function afficherRecapitulatif() {
    const recapClient = document.getElementById('recapClient');
    if (nouvelleCommande.client) {
        recapClient.innerHTML = `
            <p><strong>${nouvelleCommande.client.prenom} ${nouvelleCommande.client.nom}</strong></p>
            <p>${nouvelleCommande.client.telephone || ''}</p>
            <p>${nouvelleCommande.client.email || ''}</p>
            <p><strong>Magasin de référence :</strong> ${nouvelleCommande.client.magasinReference}</p>
        `;
    }
    
    const recapProduits = document.getElementById('recapProduits');
    recapProduits.innerHTML = nouvelleCommande.produits.map(produit => `
        <div style="margin-bottom: 10px;">
            <strong>${produit.designation}</strong>
            ${produit.cote ? `(${produit.cote})` : ''}
            <br>
            Quantité: ${produit.quantite || 1}
        </div>
    `).join('');
    
    const recapLivraison = document.getElementById('recapLivraison');
    const typePrep = document.getElementById('typePreparation').value;
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    const magasinLivraison = document.getElementById('magasinLivraison').value;
    const dateLivraison = document.getElementById('dateLivraison').value;
    
    // Utiliser les configs centralisées pour afficher les bons labels et icônes
    const urgenceConfig = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    
    recapLivraison.innerHTML = `
        <p><strong>Type:</strong> ${COMMANDES_CONFIG.TYPES_PREPARATION[typePrep]?.label}</p>
        <p><strong>Urgence:</strong> ${urgenceConfig.icon} ${urgenceConfig.label}</p>
        <p><strong>Magasin de livraison:</strong> ${magasinLivraison}</p>
        <p><strong>Date prévue:</strong> ${new Date(dateLivraison).toLocaleDateString('fr-FR')}</p>
    `;
}

// ... (reste du code) ...

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [28/01/2025] - Intégration SearchDropdown
   - Remplacement des fonctions rechercherClient() et rechercherProduit()
   - Ajout des instances clientSearchDropdown et productSearchDropdown
   - Initialisation dans afficherEtape() avec setTimeout pour le timing
   - Clear() au lieu de manipulation DOM directe
   - Utilisation des bons sélecteurs ID (#clientSearch, #productSearch)
   - Ajout de fonctions vides pour compatibilité avec l'ancien code
   
   [31/01/2025] - Centralisation des options de l'étape 3
   - Import de genererOptionsTypesPreparation() et genererOptionsUrgence()
   - Nouvelle fonction genererOptionsEtape3() pour remplacer le HTML statique
   - Les icônes d'urgence viennent maintenant de COMMANDES_CONFIG
   - Utilisation de calculerDelaiLivraison() si disponible
   
   NOTES POUR REPRISES FUTURES:
   - Les instances de SearchDropdown doivent être détruites avant recréation
   - Le timing d'init est important (d'où les setTimeout)
   - Les containers doivent utiliser les IDs #clientSearch et #productSearch
   - Les options de l'étape 3 sont maintenant générées dynamiquement
   ======================================== */