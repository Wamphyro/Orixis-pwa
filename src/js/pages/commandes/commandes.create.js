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
// [31/01/2025] - Intégration du composant Stepper réutilisable
// ========================================

import { db } from '../../services/firebase.service.js';
import { ClientsService } from '../../services/clients.service.js';
import { ProduitsService } from '../../services/produits.service.js';
import { CommandesService } from '../../services/commandes.service.js';

// 🔧 CORRECTION : Importer SearchDropdown directement depuis son fichier
import SearchDropdown from '../../shared/ui/search-dropdown.component.js';

// Importer Stepper et autres depuis shared/index.js
import { Stepper, Dialog, notify } from '../../shared/index.js';

import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { chargerDonnees } from './commandes.list.js';
import { ouvrirModal, afficherSucces, afficherErreur } from './commandes.main.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let nouvelleCommande = {
    clientId: null,
    client: null,
    produits: [],
    typePreparation: 'livraison_accessoire',
    urgence: 'normal',
    magasinLivraison: null,
    dateLivraison: null,
    commentaires: ''
};
let produitEnCoursSelection = null;

// Instances des search dropdowns
let clientSearchDropdown = null;
let productSearchDropdown = null;

// 🆕 Instance du stepper
let stepperInstance = null;

// Exposer l'état pour le module principal
window.commandeCreateState = { nouvelleCommande };

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationCommande() {
    console.log('🚀 Init module création commande');
    
    // Vérifier les imports
    console.log('SearchDropdown disponible ?', typeof SearchDropdown);
    console.log('ClientsService disponible ?', typeof ClientsService);
    console.log('Stepper disponible ?', typeof Stepper);
    
    // Exposer les fonctions nécessaires
    window.resetNouvelleCommande = resetNouvelleCommande;
    window.setDateLivraisonDefaut = setDateLivraisonDefaut;
    
    // 🆕 Initialiser le stepper une seule fois
    initStepper();
    
    console.log('✅ Module création commande initialisé avec Stepper');
}

// ========================================
// 🆕 INITIALISATION DU STEPPER
// ========================================

function initStepper() {
    // Vérifier si le container existe
    const stepperContainer = document.querySelector('.stepper');
    if (!stepperContainer) {
        console.warn('Container .stepper non trouvé, initialisation différée');
        return;
    }
    
    // Créer l'instance du stepper
    stepperInstance = new Stepper({
        container: '.stepper',
        steps: [
            { id: 1, label: 'Client', content: 'stepContent1' },
            { id: 2, label: 'Produits', content: 'stepContent2' },
            { id: 3, label: 'Livraison', content: 'stepContent3' },
            { id: 4, label: 'Validation', content: 'stepContent4' }
        ],
        currentStep: 1,
        
        // Callbacks
        onStepChange: (step, direction, previousStep) => {
            console.log(`📍 Changement d'étape: ${previousStep} → ${step}`);
            
            // Actions spécifiques par étape
            executeStepActions(step);
            
            // Gérer les boutons de navigation
            updateNavigationButtons(step);
        },
        
        onValidateStep: async (step) => {
            return await validerEtape(step);
        },
        
        onStepCompleted: (step) => {
            console.log(`✅ Étape ${step} complétée`);
        }
    });
    
    console.log('✅ Stepper initialisé avec succès');
}

// ========================================
// 🆕 ACTIONS SPÉCIFIQUES PAR ÉTAPE
// ========================================

function executeStepActions(step) {
    console.log(`🎯 Exécution actions étape ${step}`);
    
    switch (step) {
        case 1:
            console.log('📍 Étape 1 - Initialisation recherche client');
            
            setTimeout(() => {
                const clientSearchContainer = document.querySelector('.client-search');
                console.log('Container client-search trouvé ?', !!clientSearchContainer);
                
                if (clientSearchContainer) {
                    // Vérifier que SearchDropdown est disponible
                    if (typeof SearchDropdown === 'undefined') {
                        console.error('❌ SearchDropdown non défini !');
                        return;
                    }
                    
                    initClientSearch();
                } else {
                    console.error('❌ Container .client-search introuvable');
                    
                    // Lister tous les éléments pour debug
                    console.log('Contenu du stepContent1:');
                    const stepContent = document.getElementById('stepContent1');
                    if (stepContent) {
                        console.log(stepContent.innerHTML);
                    }
                }
            }, 500); // Augmenté pour être sûr que le DOM est prêt
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
            }, 500);
            break;
            
        case 3:
            chargerMagasins();
            setDateLivraisonDefaut();
            break;
            
        case 4:
            afficherRecapitulatif();
            break;
    }
}

// ========================================
// 🆕 GESTION DES BOUTONS DE NAVIGATION
// ========================================

function updateNavigationButtons(step) {
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnValider = document.getElementById('btnValiderCommande');
    
    if (btnPrev) btnPrev.disabled = step === 1;
    if (btnNext) btnNext.style.display = step < 4 ? 'block' : 'none';
    if (btnValider) btnValider.classList.toggle('hidden', step !== 4);
}

// ========================================
// NOUVELLE COMMANDE
// ========================================

export function ouvrirNouvelleCommande() {
    // S'assurer que le stepper est initialisé
    if (!stepperInstance) {
        initStepper();
    }
    
    resetNouvelleCommande();
    ouvrirModal('modalNouvelleCommande');
}

function resetNouvelleCommande() {
    // Réinitialiser l'état
    nouvelleCommande = {
        clientId: null,
        client: null,
        produits: [],
        typePreparation: 'livraison_accessoire',
        urgence: 'normal',
        magasinLivraison: null,
        dateLivraison: null,
        commentaires: ''
    };
    
    // Mettre à jour la référence globale
    window.commandeCreateState.nouvelleCommande = nouvelleCommande;
    
    // 🆕 Réinitialiser le stepper
    if (stepperInstance) {
        stepperInstance.reset();
        updateNavigationButtons(1);
    }
    
    // Réinitialiser l'affichage
    const searchContainer = document.querySelector('.client-search');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }
    
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    // Réinitialiser les search dropdowns
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
    if (productSearchDropdown) {
        productSearchDropdown.clear();
    }
    
    const tempCartItems = document.getElementById('tempCartItems');
    if (tempCartItems) {
        tempCartItems.innerHTML = '<p>Aucun produit sélectionné</p>';
    }
}

// ========================================
// 🆕 NAVIGATION AVEC LE STEPPER
// ========================================

export function etapePrecedente() {
    if (stepperInstance) {
        stepperInstance.prevStep();
    } else {
        console.error('Stepper non initialisé');
    }
}

export async function etapeSuivante() {
    if (stepperInstance) {
        const success = await stepperInstance.nextStep();
        if (!success) {
            console.log('Validation échouée, reste sur l\'étape actuelle');
        }
    } else {
        console.error('Stepper non initialisé');
    }
}

// ========================================
// VALIDATION DES ÉTAPES
// ========================================

async function validerEtape(etape) {
    switch (etape) {
        case 1:
            if (!nouvelleCommande.clientId) {
                await Dialog.alert('Veuillez sélectionner un client', 'Attention');
                return false;
            }
            break;
        case 2:
            if (nouvelleCommande.produits.length === 0) {
                await Dialog.alert('Veuillez ajouter au moins un produit', 'Attention');
                return false;
            }
            break;
        case 3:
            if (!nouvelleCommande.magasinLivraison) {
                await Dialog.alert('Veuillez sélectionner un magasin de livraison', 'Attention');
                return false;
            }
            break;
    }
    return true;
}

// ========================================
// INITIALISATION DES SEARCH DROPDOWNS
// ========================================

function initClientSearch() {
    console.log('🔍 Initialisation recherche client...');
    
    // Vérifier que le container existe
    const container = document.querySelector('.client-search');
    if (!container) {
        console.error('❌ Container .client-search introuvable !');
        return;
    }
    
    console.log('✅ Container trouvé:', container);
    console.log('SearchDropdown disponible ?', typeof SearchDropdown);
    
    // Détruire l'instance précédente si elle existe
    if (clientSearchDropdown) {
        console.log('🧹 Destruction instance précédente');
        clientSearchDropdown.destroy();
    }
    
    try {
        // Créer la nouvelle instance avec le bon sélecteur
        clientSearchDropdown = new SearchDropdown({
            container: '.client-search',
            placeholder: 'Rechercher un client (nom, prénom, téléphone...)',
            minLength: 2,
            noResultsText: 'Aucun client trouvé',
            loadingText: 'Recherche en cours...',
            onSearch: async (query) => {
                console.log('🔎 Recherche client avec query:', query);
                try {
                    const results = await ClientsService.rechercherClients(query);
                    console.log('📊 Résultats trouvés:', results?.length || 0);
                    return results;
                } catch (error) {
                    console.error('❌ Erreur recherche client:', error);
                    throw error;
                }
            },
            onSelect: (client) => {
                console.log('👤 Client sélectionné:', client);
                selectionnerClient(client.id);
            },
            renderItem: (client) => {
                return `
                    <strong>${client.prenom} ${client.nom}</strong>
                    <small>
                        ${client.telephone || ''} 
                        ${client.email ? '- ' + client.email : ''}
                        ${client.magasinReference ? '- Magasin: ' + client.magasinReference : ''}
                    </small>
                `;
            }
        });
        
        console.log('✅ SearchDropdown client initialisé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur initialisation SearchDropdown:', error);
        console.error('Stack:', error.stack);
    }
}

export async function selectionnerClient(clientId) {
    try {
        const client = await ClientsService.getClient(clientId);
        if (client) {
            nouvelleCommande.clientId = clientId;
            nouvelleCommande.client = client;
            
            // Cacher le conteneur SearchDropdown
            const searchContainer = document.querySelector('.client-search');
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }
            
            // Afficher la section client sélectionné
            const clientSelected = document.getElementById('clientSelected');
            if (clientSelected) {
                clientSelected.style.display = 'block';
            }
            
            // Mettre à jour les informations
            const selectedClientName = document.getElementById('selectedClientName');
            if (selectedClientName) {
                selectedClientName.textContent = `${client.prenom} ${client.nom}`;
            }
            
            let infoText = '';
            if (client.telephone) infoText += client.telephone;
            if (client.email) infoText += (infoText ? ' - ' : '') + client.email;
            if (client.magasinReference) {
                infoText += (infoText ? ' - ' : '') + `Magasin: ${client.magasinReference}`;
            }
            
            const selectedClientInfo = document.getElementById('selectedClientInfo');
            if (selectedClientInfo) {
                selectedClientInfo.textContent = infoText;
            }
        }
    } catch (error) {
        console.error('Erreur sélection client:', error);
        notify.error('Erreur lors de la sélection du client');
    }
}

export function changerClient() {
    nouvelleCommande.clientId = null;
    nouvelleCommande.client = null;
    
    // Afficher le conteneur SearchDropdown
    const searchContainer = document.querySelector('.client-search');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }
    
    // Cacher la section client sélectionné
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    // Réinitialiser le search dropdown
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
}

export function ouvrirNouveauClient() {
    // Marquer qu'on veut passer d'une modal à l'autre sans confirmation
    window.skipConfirmation = true;
    
    // Fermer la modal actuelle
    window.fermerModal('modalNouvelleCommande');
    
    // Charger les magasins et ouvrir la modal nouveau client
    chargerMagasinsPourNouveauClient();
    
    // Attendre un peu avant d'ouvrir la nouvelle modal
    setTimeout(() => {
        ouvrirModal('modalNouveauClient');
    }, 300);
}

async function chargerMagasinsPourNouveauClient() {
    try {
        const select = document.getElementById('newClientMagasin');
        select.innerHTML = '';
        
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        
        const magasins = [];
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actif !== false) {
                magasins.push({
                    id: doc.id,
                    code: data.code || doc.id,
                    nom: data.nom || data.code || doc.id
                });
            }
        });
        
        magasins.sort((a, b) => a.code.localeCompare(b.code));
        
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin.code;
            option.textContent = magasin.nom;
            if (magasin.code === auth.magasin || magasin.id === auth.magasin) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('newClientMagasin');
        const magasins = auth.magasins || [auth.magasin];
        
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin;
            option.textContent = magasin;
            if (magasin === auth.magasin) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
}

export async function creerNouveauClient() {
    const form = document.getElementById('formNouveauClient');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const clientData = {
        nom: document.getElementById('newClientNom').value,
        prenom: document.getElementById('newClientPrenom').value,
        telephone: document.getElementById('newClientTel').value,
        email: document.getElementById('newClientEmail').value,
        magasinReference: document.getElementById('newClientMagasin').value
    };
    
    try {
        const clientId = await ClientsService.creerClient(clientData);
        await selectionnerClient(clientId);
        
        window.fermerModal('modalNouveauClient');
        ouvrirModal('modalNouvelleCommande');
        
        form.reset();
        
    } catch (error) {
        console.error('Erreur création client:', error);
        await Dialog.error('Erreur lors de la création du client: ' + error.message);
    }
}

// ========================================
// GESTION DES PRODUITS
// ========================================

async function chargerPackTemplates() {
    console.log('🔄 Chargement des packs...');
    try {
        const select = document.getElementById('packTemplate');
        if (!select) {
            console.error('❌ Select packTemplate introuvable');
            return;
        }
        
        select.innerHTML = '<option value="">-- Commande personnalisée --</option>';
        
        const { collection, getDocs, query, where, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        console.log('📦 Requête Firebase packTemplates...');
        
        // Essayer d'abord sans filtre pour voir s'il y a des données
        const snapshot = await getDocs(collection(db, 'packTemplates'));
        
        console.log(`✅ ${snapshot.size} packs trouvés`);
        
        const packs = [];
        snapshot.forEach((doc) => {
            const pack = doc.data();
            console.log('Pack:', doc.id, pack);
            if (pack.actif !== false) { // Inclure si actif est true ou undefined
                packs.push({
                    id: doc.id,
                    ...pack
                });
            }
        });
        
        // Trier par ordre
        packs.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
        
        // Ajouter au select
        packs.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.id;
            option.textContent = pack.nom;
            if (pack.description) {
                option.dataset.description = pack.description;
            }
            select.appendChild(option);
        });
        
        console.log(`✅ ${packs.length} packs ajoutés au select`);
        
    } catch (error) {
        console.error('❌ Erreur chargement packs:', error);
        notify.error('Erreur lors du chargement des packs');
    }
}

export async function appliquerPack() {
    const packId = document.getElementById('packTemplate').value;
    if (!packId) return;
    
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const packDoc = await getDoc(doc(db, 'packTemplates', packId));
        if (!packDoc.exists()) return;
        
        const pack = packDoc.data();
        
        // Vider le panier actuel
        nouvelleCommande.produits = [];
        
        // Traiter chaque produit du pack
        for (const produitPack of pack.produits) {
            if (produitPack.reference) {
                // Si on a une référence directe, chercher le produit
                const produits = await ProduitsService.rechercherProduits(produitPack.reference);
                if (produits.length > 0) {
                    const produit = produits[0];
                    
                    if (produit.necessiteCote && produitPack.cote === 'both') {
                        // Ajouter les deux côtés
                        nouvelleCommande.produits.push({
                            ...produit,
                            cote: 'droit',
                            quantite: produitPack.quantite || 1
                        });
                        nouvelleCommande.produits.push({
                            ...produit,
                            cote: 'gauche',
                            quantite: produitPack.quantite || 1
                        });
                    } else {
                        nouvelleCommande.produits.push({
                            ...produit,
                            quantite: produitPack.quantite || 1
                        });
                    }
                }
            } else if (produitPack.categorie) {
                // Si on a une catégorie, chercher un produit de cette catégorie
                const { collection, getDocs, query, where, limit } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                let q = query(
                    collection(db, 'produits'),
                    where('actif', '==', true),
                    where('categorie', '==', produitPack.categorie),
                    limit(1)
                );
                
                // Si on a un type spécifique
                if (produitPack.type) {
                    q = query(
                        collection(db, 'produits'),
                        where('actif', '==', true),
                        where('type', '==', produitPack.type),
                        where('categorie', '==', produitPack.categorie),
                        limit(1)
                    );
                }
                
                const snapshot = await getDocs(q);
                
                if (!snapshot.empty) {
                    const produitDoc = snapshot.docs[0];
                    const produit = { id: produitDoc.id, ...produitDoc.data() };
                    
                    if (produit.necessiteCote && produitPack.cote === 'both') {
                        // Pour les appareils auditifs, demander la sélection
                        produitEnCoursSelection = produit;
                        produitEnCoursSelection.quantiteFromPack = produitPack.quantite || 1;
                        
                        // Afficher le sélecteur de côté
                        afficherSelecteurCotePourPack(produit);
                    } else {
                        nouvelleCommande.produits.push({
                            ...produit,
                            quantite: produitPack.quantite || 1
                        });
                    }
                }
            }
        }
        
        // Rafraîchir l'affichage
        afficherPanierTemporaire();
        
        notify.success(`Pack "${pack.nom}" appliqué avec succès`);
        
    } catch (error) {
        console.error('Erreur application pack:', error);
        notify.error('Erreur lors de l\'application du pack');
    }
}

function afficherSelecteurCotePourPack(produit) {
    const selectorHtml = `
        <div id="coteSelector" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
             background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
             z-index: 10000; min-width: 400px;">
            <h3 style="margin-bottom: 20px; text-align: center; color: #2c3e50;">
                Sélectionner les appareils pour le pack<br><strong>${produit.designation}</strong>
            </h3>
            <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                <button onclick="selectionnerCotePack('both')" style="background: white; border: 3px solid #9C27B0; 
                        border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                        display: flex; flex-direction: column; align-items: center; gap: 10px;"
                        onmouseover="this.style.background='#F3E5F5'" onmouseout="this.style.background='white'">
                    <span style="font-size: 40px;">👂👂</span>
                    <span style="color: #9C27B0; font-weight: bold;">Les deux côtés</span>
                </button>
            </div>
            <button onclick="annulerSelectionCote()" style="background: #f8f9fa; border: 2px solid #e9ecef; 
                    border-radius: 10px; padding: 10px 20px; cursor: pointer; width: 100%; 
                    color: #6c757d; font-weight: 500;">
                Annuler le pack
            </button>
        </div>
        <div id="coteSelectorOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
             background: rgba(0,0,0,0.5); z-index: 9999;" onclick="annulerSelectionCote()"></div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', selectorHtml);
}

window.selectionnerCotePack = function(cote) {
    if (!produitEnCoursSelection) return;
    
    if (cote === 'both') {
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'droit',
            quantite: produitEnCoursSelection.quantiteFromPack || 1
        });
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'gauche',
            quantite: produitEnCoursSelection.quantiteFromPack || 1
        });
    }
    
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    
    produitEnCoursSelection = null;
    
    afficherPanierTemporaire();
};

function initProductSearch() {
    console.log('🔍 Initialisation recherche produit...');
    
    // Vérifier que le container existe
    const container = document.querySelector('.product-search');
    if (!container) {
        console.error('❌ Container .product-search introuvable !');
        return;
    }
    
    console.log('✅ Container produit trouvé:', container);
    
    // Détruire l'instance précédente si elle existe
    if (productSearchDropdown) {
        console.log('🧹 Destruction instance produit précédente');
        productSearchDropdown.destroy();
    }
    
    try {
        // Créer la nouvelle instance
        productSearchDropdown = new SearchDropdown({
            container: '.product-search',
            placeholder: 'Rechercher un produit...',
            minLength: 2,
            noResultsText: 'Aucun produit trouvé',
            loadingText: 'Recherche en cours...',
            onSearch: async (query) => {
                console.log('🔎 Recherche produit avec query:', query);
                try {
                    const results = await ProduitsService.rechercherProduits(query);
                    console.log('📊 Produits trouvés:', results?.length || 0);
                    return results;
                } catch (error) {
                    console.error('❌ Erreur recherche produit:', error);
                    throw error;
                }
            },
            onSelect: (produit) => {
                console.log('📦 Produit sélectionné:', produit);
                ajouterProduit(produit.id);
            },
            renderItem: (produit) => {
                return `
                    <div style="padding: 8px 0;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">
                            ${produit.designation}
                        </div>
                        <div style="background: #e0e0e0; padding: 2px 8px; border-radius: 4px; 
                                    font-size: 12px; display: inline-block; margin-bottom: 4px;">
                            ${produit.reference}
                        </div>
                        <div style="font-size: 14px; color: #666;">
                            ${produit.marque} - ${produit.categorie}
                        </div>
                    </div>
                `;
            }
        });
        
        console.log('✅ SearchDropdown produit initialisé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur initialisation SearchDropdown produit:', error);
        console.error('Stack:', error.stack);
    }
}

export async function ajouterProduit(produitId) {
    try {
        const produit = await ProduitsService.getProduit(produitId);
        if (!produit) return;
        
        if (produit.necessiteCote) {
            produitEnCoursSelection = produit;
            
            const selectorHtml = `
                <div id="coteSelector" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                     background: white; border-radius: 20px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
                     z-index: 10000; min-width: 400px;">
                    <h3 style="margin-bottom: 20px; text-align: center; color: #2c3e50;">
                        Sélectionner le côté pour<br><strong>${produit.designation}</strong>
                    </h3>
                    <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 20px;">
                        <button onclick="selectionnerCote('gauche')" style="background: white; border: 3px solid #2196F3; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#E3F2FD'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂</span>
                            <span style="color: #2196F3; font-weight: bold;">Gauche</span>
                        </button>
                        <button onclick="selectionnerCote('droit')" style="background: white; border: 3px solid #F44336; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#FFEBEE'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂</span>
                            <span style="color: #F44336; font-weight: bold;">Droit</span>
                        </button>
                        <button onclick="selectionnerCote('both')" style="background: white; border: 3px solid #9C27B0; 
                                border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease;
                                display: flex; flex-direction: column; align-items: center; gap: 10px;"
                                onmouseover="this.style.background='#F3E5F5'" onmouseout="this.style.background='white'">
                            <span style="font-size: 40px;">👂👂</span>
                            <span style="color: #9C27B0; font-weight: bold;">Les deux</span>
                        </button>
                    </div>
                    <button onclick="annulerSelectionCote()" style="background: #f8f9fa; border: 2px solid #e9ecef; 
                            border-radius: 10px; padding: 10px 20px; cursor: pointer; width: 100%; 
                            color: #6c757d; font-weight: 500;">
                        Annuler
                    </button>
                </div>
                <div id="coteSelectorOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); z-index: 9999;" onclick="annulerSelectionCote()"></div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', selectorHtml);
            
        } else {
            nouvelleCommande.produits.push({
                ...produit,
                quantite: 1
            });
            
            afficherPanierTemporaire();
            
            // Réinitialiser le search dropdown
            if (productSearchDropdown) {
                productSearchDropdown.clear();
            }
        }
        
    } catch (error) {
        console.error('Erreur ajout produit:', error);
    }
}

export function selectionnerCote(cote) {
    if (!produitEnCoursSelection) return;
    
    if (cote === 'both') {
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'droit',
            quantite: 1
        });
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: 'gauche',
            quantite: 1
        });
    } else {
        nouvelleCommande.produits.push({
            ...produitEnCoursSelection,
            cote: cote,
            quantite: 1
        });
    }
    
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    
    produitEnCoursSelection = null;
    
    afficherPanierTemporaire();
    
    // Réinitialiser le search dropdown
    if (productSearchDropdown) {
        productSearchDropdown.clear();
    }
}

export function annulerSelectionCote() {
    const selector = document.getElementById('coteSelector');
    const overlay = document.getElementById('coteSelectorOverlay');
    if (selector) selector.remove();
    if (overlay) overlay.remove();
    produitEnCoursSelection = null;
}

function afficherPanierTemporaire() {
    const container = document.getElementById('tempCartItems');
    
    if (nouvelleCommande.produits.length === 0) {
        container.innerHTML = '<p>Aucun produit sélectionné</p>';
        return;
    }
    
    container.innerHTML = nouvelleCommande.produits.map((produit, index) => `
        <div class="temp-cart-item">
            <div class="temp-cart-item-info">
                <div class="temp-cart-item-name">${produit.designation}</div>
                <div class="temp-cart-item-details">
                    ${produit.cote ? `Côté: ${produit.cote}` : ''}
                </div>
            </div>
            <div class="temp-cart-item-actions">
                <button class="btn-action" onclick="window.retirerProduit(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
}

export function retirerProduit(index) {
    nouvelleCommande.produits.splice(index, 1);
    afficherPanierTemporaire();
}

// ========================================
// INFORMATIONS DE LIVRAISON
// ========================================

async function chargerMagasins() {
    try {
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('magasinLivraison');
        select.innerHTML = '';
        
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        
        const magasins = [];
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actif !== false) {
                magasins.push({
                    id: doc.id,
                    code: data.code || doc.id,
                    nom: data.nom || data.code || doc.id
                });
            }
        });
        
        if (nouvelleCommande.client && nouvelleCommande.client.magasinReference) {
            const magasinClient = nouvelleCommande.client.magasinReference;
            const existeDeja = magasins.some(m => m.code === magasinClient || m.id === magasinClient);
            
            if (!existeDeja) {
                magasins.push({
                    id: magasinClient,
                    code: magasinClient,
                    nom: magasinClient + ' (Référence client)'
                });
            }
        }
        
        magasins.sort((a, b) => a.code.localeCompare(b.code));
        
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin.code;
            option.textContent = magasin.nom;
            
            if (nouvelleCommande.client && 
                (magasin.code === nouvelleCommande.client.magasinReference || 
                 magasin.id === nouvelleCommande.client.magasinReference)) {
                option.selected = true;
            } else if (!nouvelleCommande.client && magasin.code === auth.magasin) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        if (!select.value && magasins.length > 0) {
            select.value = magasins[0].code;
        }
        
        nouvelleCommande.magasinLivraison = select.value;
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('magasinLivraison');
        let magasins = auth.magasins || [auth.magasin];
        
        if (nouvelleCommande.client && nouvelleCommande.client.magasinReference) {
            const magasinClient = nouvelleCommande.client.magasinReference;
            if (!magasins.includes(magasinClient)) {
                magasins.push(magasinClient);
            }
        }
        
        magasins.forEach(magasin => {
            const option = document.createElement('option');
            option.value = magasin;
            option.textContent = magasin;
            
            if (nouvelleCommande.client && magasin === nouvelleCommande.client.magasinReference) {
                option.selected = true;
            } else if (!nouvelleCommande.client && magasin === auth.magasin) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        nouvelleCommande.magasinLivraison = select.value;
    }
}

function setDateLivraisonDefaut() {
    const dateInput = document.getElementById('dateLivraison');
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    
    const date = new Date();
    switch (urgence) {
        case 'tres_urgent':
            date.setDate(date.getDate() + 1);
            break;
        case 'urgent':
            date.setDate(date.getDate() + 2);
            break;
        default:
            date.setDate(date.getDate() + 5);
    }
    
    dateInput.value = date.toISOString().split('T')[0];
    dateInput.min = new Date().toISOString().split('T')[0];
}

// ========================================
// RÉCAPITULATIF ET VALIDATION
// ========================================

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
    
    recapLivraison.innerHTML = `
        <p><strong>Type:</strong> ${COMMANDES_CONFIG.TYPES_PREPARATION[typePrep]?.label}</p>
        <p><strong>Urgence:</strong> ${COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence]?.label}</p>
        <p><strong>Magasin de livraison:</strong> ${magasinLivraison}</p>
        <p><strong>Date prévue:</strong> ${new Date(dateLivraison).toLocaleDateString('fr-FR')}</p>
    `;
}

export async function validerCommande() {
    nouvelleCommande.typePreparation = document.getElementById('typePreparation').value;
    nouvelleCommande.urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    nouvelleCommande.magasinLivraison = document.getElementById('magasinLivraison').value;
    nouvelleCommande.dateLivraison = new Date(document.getElementById('dateLivraison').value);
    nouvelleCommande.commentaires = document.getElementById('commentaires').value;
    
    try {
        const commandeId = await CommandesService.creerCommande(nouvelleCommande);
        
        window.fermerModal('modalNouvelleCommande');
        
        await chargerDonnees();
        
        afficherSucces('Commande créée avec succès !');
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        afficherErreur('Erreur lors de la création de la commande: ' + error.message);
    }
}

// ========================================
// 🆕 NETTOYAGE DU STEPPER
// ========================================

export function cleanupStepper() {
    if (stepperInstance) {
        stepperInstance.destroy();
        stepperInstance = null;
        console.log('🧹 Stepper nettoyé');
    }
}

// ========================================
// EXPORTS GLOBAUX POUR COMPATIBILITÉ
// ========================================
// Fonctions vides pour éviter les erreurs si appelées depuis le HTML
window.rechercherClient = () => {
    console.warn('rechercherClient() est remplacé par SearchDropdown');
};
window.rechercherProduit = () => {
    console.warn('rechercherProduit() est remplacé par SearchDropdown');
};

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [28/01/2025] - Intégration SearchDropdown
// - Remplacement des fonctions rechercherClient() et rechercherProduit()
// - Ajout des instances clientSearchDropdown et productSearchDropdown
// - Initialisation dans afficherEtape() avec setTimeout pour le timing
// - Clear() au lieu de manipulation DOM directe
// - Utilisation des bons sélecteurs ID (#clientSearch, #productSearch)
// - Ajout de fonctions vides pour compatibilité avec l'ancien code
//
// [31/01/2025] - Intégration du composant Stepper
// - Import du composant depuis shared/index.js
// - Création de l'instance dans initCreationCommande()
// - Remplacement de afficherEtape() par l'API du composant
// - Migration de la logique dans les callbacks du stepper
// - Ajout de cleanupStepper() pour le nettoyage
// - Les IDs HTML restent inchangés pour la compatibilité
//
// NOTES POUR REPRISES FUTURES:
// - Les instances de SearchDropdown doivent être détruites avant recréation
// - Le timing d'init est important (d'où les setTimeout)
// - Les containers doivent utiliser les IDs #clientSearch et #productSearch
// - Le stepper gère maintenant toute la navigation entre étapes
// - La logique métier reste dans ce fichier, le stepper ne fait que l'UI
// ========================================