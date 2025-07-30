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
// [31/01/2025] - Champs vides par défaut (type, magasin, date)
// ========================================

import { db } from '../../services/firebase.service.js';
import { ClientsService } from '../../services/clients.service.js';
import { ProduitsService } from '../../services/produits.service.js';
import { CommandesService } from '../../services/commandes.service.js';
import SearchDropdown from '../../shared/ui/search-dropdown.component.js';
import { 
    COMMANDES_CONFIG,
    genererOptionsTypesPreparation,
    genererOptionsUrgence,
    calculerDelaiLivraison 
} from '../../data/commandes.data.js';
import { Dialog, notify } from '../../shared/index.js';
import { chargerDonnees } from './commandes.list.js';
import { ouvrirModal, afficherSucces, afficherErreur } from './commandes.main.js';

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let etapeActuelle = 1;
let nouvelleCommande = {
    clientId: null,
    client: null,
    produits: [],
    typePreparation: '',  // 🆕 VIDE par défaut
    urgence: 'normal',
    magasinLivraison: '',  // 🆕 VIDE par défaut
    dateLivraison: null,
    commentaires: ''
};
let produitEnCoursSelection = null;

// Instances des search dropdowns
let clientSearchDropdown = null;
let productSearchDropdown = null;

// Exposer l'état pour le module principal
window.commandeCreateState = { nouvelleCommande };

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationCommande() {
    // Exposer les fonctions nécessaires
    window.resetNouvelleCommande = resetNouvelleCommande;
    window.setDateLivraisonDefaut = setDateLivraisonDefaut;
    
    console.log('Module création commande initialisé');
}

// ========================================
// NOUVELLE COMMANDE
// ========================================

export function ouvrirNouvelleCommande() {
    resetNouvelleCommande();
    afficherEtape(1);
    ouvrirModal('modalNouvelleCommande');
}

function resetNouvelleCommande() {
    etapeActuelle = 1;
    nouvelleCommande = {
        clientId: null,
        client: null,
        produits: [],
        typePreparation: '',  // 🆕 VIDE par défaut
        urgence: 'normal',
        magasinLivraison: '',  // 🆕 VIDE par défaut
        dateLivraison: null,
        commentaires: ''
    };
    
    // Mettre à jour la référence globale
    window.commandeCreateState.nouvelleCommande = nouvelleCommande;
    
    // Réinitialiser l'affichage
    afficherEtape(1);
    
    // MODIFIÉ : Utiliser le conteneur au lieu de l'input
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
            }, 300); // Augmenté de 100 à 300ms
            break;
        case 2:
            console.log('📍 Arrivée à l\'étape 2 - Chargement des packs');
            chargerPackTemplates();
            // MODIFIÉ : Même chose pour les produits
            setTimeout(() => {
                const productSearchContainer = document.querySelector('.product-search');
                if (productSearchContainer) {
                    initProductSearch();
                } else {
                    console.error('Container .product-search introuvable');
                }
            }, 300); // Augmenté de 100 à 300ms
            break;
        case 3:
            // 🆕 AJOUT : Générer dynamiquement les options
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
// 🆕 NOUVELLE FONCTION : Générer les options de l'étape 3
// ========================================
function genererOptionsEtape3() {
    // 1. Générer le select type de préparation avec option vide
    const selectType = document.getElementById('typePreparation');
    if (selectType) {
        const typesPreparation = genererOptionsTypesPreparation();
        
        // 🆕 Ajouter une option vide en premier
        selectType.innerHTML = '<option value="">-- Sélectionner un type --</option>' + 
            typesPreparation.map(type => 
                `<option value="${type.value}">${type.label}</option>`
            ).join('');
        
        // Pas de restauration de valeur (laisser vide)
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

export function etapePrecedente() {
    if (etapeActuelle > 1) {
        etapeActuelle--;
        afficherEtape(etapeActuelle);
    }
}

export async function etapeSuivante() {
    if (!await validerEtape(etapeActuelle)) {
        return;
    }
    
    if (etapeActuelle < 4) {
        etapeActuelle++;
        afficherEtape(etapeActuelle);
    }
}

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
            // 🆕 Vérifier que tous les champs sont remplis
            if (!nouvelleCommande.typePreparation) {
                await Dialog.alert('Veuillez sélectionner un type de préparation', 'Attention');
                return false;
            }
            if (!nouvelleCommande.magasinLivraison) {
                await Dialog.alert('Veuillez sélectionner un magasin de livraison', 'Attention');
                return false;
            }
            if (!document.getElementById('dateLivraison').value) {
                await Dialog.alert('Veuillez sélectionner une date de livraison', 'Attention');
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
    // Détruire l'instance précédente si elle existe
    if (clientSearchDropdown) {
        clientSearchDropdown.destroy();
    }
    
    // Créer la nouvelle instance avec le bon sélecteur ID
    clientSearchDropdown = new SearchDropdown({
    container: '.client-search',  // MODIFIÉ: ID au lieu de classe
        placeholder: 'Rechercher un client (nom, prénom, téléphone...)',
        minLength: 2,
        noResultsText: 'Aucun client trouvé',
        loadingText: 'Recherche en cours...',
        onSearch: async (query) => {
            try {
                return await ClientsService.rechercherClients(query);
            } catch (error) {
                console.error('Erreur recherche client:', error);
                throw error;
            }
        },
        onSelect: (client) => {
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
}

export async function selectionnerClient(clientId) {
    try {
        const client = await ClientsService.getClient(clientId);
        if (client) {
            nouvelleCommande.clientId = clientId;
            nouvelleCommande.client = client;
            
            // MODIFIÉ : Cacher le conteneur SearchDropdown, pas l'input qui n'existe plus
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
            
            // SUPPRIMÉ : Ces lignes ne servent plus à rien
            // document.getElementById('clientSearchResults').classList.remove('active');
            // document.getElementById('clientSearchResults').innerHTML = '';
        }
    } catch (error) {
        console.error('Erreur sélection client:', error);
        notify.error('Erreur lors de la sélection du client');
    }
}

export function changerClient() {
    nouvelleCommande.clientId = null;
    nouvelleCommande.client = null;
    
    // MODIFIÉ : Afficher le conteneur SearchDropdown
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
    // Détruire l'instance précédente si elle existe
    if (productSearchDropdown) {
        productSearchDropdown.destroy();
    }
    
    // Créer la nouvelle instance avec le bon sélecteur ID
    productSearchDropdown = new SearchDropdown({
    container: '.product-search',  // MODIFIÉ: ID au lieu de classe
        placeholder: 'Rechercher un produit...',
        minLength: 2,
        noResultsText: 'Aucun produit trouvé',
        loadingText: 'Recherche en cours...',
        onSearch: async (query) => {
            try {
                return await ProduitsService.rechercherProduits(query);
            } catch (error) {
                console.error('Erreur recherche produit:', error);
                throw error;
            }
        },
        onSelect: (produit) => {
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
        
        // 🆕 Ajouter une option vide en premier
        const firstOption = document.createElement('option');
        firstOption.value = '';
        firstOption.textContent = '-- Sélectionner un magasin --';
        select.appendChild(firstOption);
        
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
            select.appendChild(option);
        });
        
        // 🆕 NE PAS sélectionner automatiquement
        select.value = ''; // Forcer la sélection vide
        
        // 🆕 Mise à jour pour gérer l'événement onchange
        select.addEventListener('change', (e) => {
            nouvelleCommande.magasinLivraison = e.target.value;
        });
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const select = document.getElementById('magasinLivraison');
        
        // 🆕 Option vide aussi en cas d'erreur
        const firstOption = document.createElement('option');
        firstOption.value = '';
        firstOption.textContent = '-- Sélectionner un magasin --';
        select.appendChild(firstOption);
        
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
            select.appendChild(option);
        });
        
        // 🆕 Forcer la sélection vide
        select.value = '';
        
        // 🆕 Gérer l'événement onchange
        select.addEventListener('change', (e) => {
            nouvelleCommande.magasinLivraison = e.target.value;
        });
    }
}

// 🆕 MODIFIÉ : Plus de date par défaut
function setDateLivraisonDefaut() {
    const dateInput = document.getElementById('dateLivraison');
    
    // Définir seulement la date minimum (aujourd'hui)
    dateInput.min = new Date().toISOString().split('T')[0];
    
    // 🆕 NE PAS définir de valeur par défaut
    dateInput.value = '';
}

// ========================================
// RÉCAPITULATIF ET VALIDATION
// ========================================

// 🆕 MODIFIÉ : Utiliser les configs centralisées pour l'affichage
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

export async function validerCommande() {
    // 🆕 Mise à jour avec les valeurs du formulaire
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
// [31/01/2025] - Centralisation des options de l'étape 3
// - Import de genererOptionsTypesPreparation() et genererOptionsUrgence()
// - Nouvelle fonction genererOptionsEtape3() pour remplacer le HTML statique
// - Les icônes d'urgence viennent maintenant de COMMANDES_CONFIG
// - Utilisation de calculerDelaiLivraison() si disponible
// - Ajout des exports pour corriger l'erreur d'import dans commandes.main.js
//
// [31/01/2025] - Champs vides par défaut
// - typePreparation et magasinLivraison initialisés à vide
// - Ajout d'options vides "-- Sélectionner... --" 
// - Pas de date par défaut
// - Validation renforcée pour vérifier que tous les champs sont remplis
//
// NOTES POUR REPRISES FUTURES:
// - Les instances de SearchDropdown doivent être détruites avant recréation
// - Le timing d'init est important (d'où les setTimeout)
// - Les containers doivent utiliser les IDs #clientSearch et #productSearch
// - Les options de l'étape 3 sont maintenant générées dynamiquement
// - Les champs sont vides par défaut pour forcer la sélection
// ========================================