// ========================================
// COMMANDES.CREATE.JS - Gestion de la création de commandes avec DropdownList
// Chemin: src/js/pages/commandes/commandes.create.js
//
// DESCRIPTION:
// Module de création de commandes avec SearchDropdown et DropdownList
//
// MODIFICATIONS:
// [28/01/2025] - Intégration de SearchDropdown
// [31/01/2025] - Centralisation des configs
// [01/02/2025] - Intégration de DropdownList pour tous les selects
// ========================================

// TOUS LES IMPORTS EN PREMIER (SANS INTERRUPTION)
import { db } from '../../src/services/firebase.service.js';
import { ClientsService } from '../../src/services/clients.service.js';
import { ProduitsService } from '../../src/services/produits.service.js';
import { CommandesService } from './commandes.service.js';
import { Timeline } from '../../src/components/ui/timeline/timeline.component.js';
import { 
    COMMANDES_CONFIG,
    calculerDelaiLivraison
} from './commandes.data.js';
import config from './commandes.config.js';
import { ouvrirModal, afficherSucces, afficherErreur } from './commandes.main.js';
import { chargerDonnees } from './commandes.list.js';

// MAINTENANT LES FONCTIONS (APRÈS TOUS LES IMPORTS)
function genererOptionsUrgence() {
    return Object.entries(COMMANDES_CONFIG.NIVEAUX_URGENCE).map(([key, urgence]) => ({
        value: key,
        label: `${urgence.icon} ${urgence.label}`
    }));
}

function genererOptionsTypesPreparation() {
    return Object.entries(COMMANDES_CONFIG.TYPES_PREPARATION).map(([key, type]) => ({
        value: key,
        label: type.label,
        description: type.description,
        icon: type.icon
    }));
}

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let etapeActuelle = 1;
let nouvelleCommande = {
    clientId: null,
    client: null,
    produits: [],
    typePreparation: '',
    urgence: 'normal',
    magasinLivraison: '',
    dateLivraison: null,
    commentaires: ''
};
let produitEnCoursSelection = null;

// Instances des composants
let clientSearchDropdown = null;
let productSearchDropdown = null;
let dropdownPack = null;
let dropdownType = null;
let dropdownMagasin = null;
let dropdownMagasinClient = null;
let timeline = null;

// Exposer l'état pour le module principal
window.commandeCreateState = { nouvelleCommande };

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationCommande() {
    window.resetNouvelleCommande = resetNouvelleCommande;
    window.setDateLivraisonDefaut = setDateLivraisonDefaut;
    
    console.log('Module création commande initialisé');
}

// ========================================
// NOUVELLE COMMANDE
// ========================================

export function ouvrirNouvelleCommande() {
    resetNouvelleCommande();
    // afficherEtape(1) est déjà appelé dans resetNouvelleCommande
    ouvrirModal('modalNouvelleCommande');
}

function resetNouvelleCommande() {
    console.log('🔄 Reset nouvelle commande');
    
    etapeActuelle = 1;
    nouvelleCommande = {
        clientId: null,
        client: null,
        produits: [],
        typePreparation: '',
        urgence: 'normal',
        magasinLivraison: '',
        dateLivraison: null,
        commentaires: ''
    };
    
    window.commandeCreateState.nouvelleCommande = nouvelleCommande;
    
    // Nettoyer la timeline si elle existe
    if (timeline) {
        try {
            timeline.destroy();
            timeline = null;
        } catch (e) {
            console.warn('⚠️ Erreur destruction timeline:', e);
            timeline = null;
        }
    }
    
    // Réinitialiser l'affichage client
    const searchContainer = document.querySelector('.client-search');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }
    
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    // Détruire et réinitialiser tous les composants
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
    if (productSearchDropdown) {
        productSearchDropdown.clear();
    }
    if (dropdownPack) {
        dropdownPack.destroy();
        dropdownPack = null;
    }
    if (dropdownType) {
        dropdownType.destroy();
        dropdownType = null;
    }
    if (dropdownMagasin) {
        dropdownMagasin.destroy();
        dropdownMagasin = null;
    }
    if (dropdownMagasinClient) {
        dropdownMagasinClient.destroy();
        dropdownMagasinClient = null;
    }
    
    // Réinitialiser le panier
    const tempCartItems = document.getElementById('tempCartItems');
    if (tempCartItems) {
        tempCartItems.innerHTML = '<p>Aucun produit sélectionné</p>';
    }
    
    // Attendre que la modal soit visible puis afficher l'étape 1
    setTimeout(() => {
        console.log('📍 Affichage initial étape 1');
        afficherEtape(1);
    }, 100);
}

function afficherEtape(etape) {
    etapeActuelle = etape;
    
    console.log(`📍 Affichage étape ${etape}`);
    
    // Masquer toutes les étapes de contenu
    for (let i = 1; i <= 4; i++) {
        const stepContent = document.getElementById(`stepContent${i}`);
        if (stepContent) {
            stepContent.classList.add('hidden');
        }
    }
    
    // Afficher l'étape actuelle
    const currentStepContent = document.getElementById(`stepContent${etape}`);
    if (currentStepContent) {
        currentStepContent.classList.remove('hidden');
    }
    
    // Créer les items pour la timeline
    const items = COMMANDES_CONFIG.ETAPES_CREATION.map((etapeData, index) => {
        let status = 'pending';
        if (index + 1 < etape) status = 'completed';
        else if (index + 1 === etape) status = 'active';
        
        return {
            id: etapeData.id || `step${index + 1}`,
            label: etapeData.label,
            icon: etapeData.icon,
            status: status
        };
    });
    
    // Gérer la timeline
    const timelineContainer = document.querySelector('#modalNouvelleCommande .timeline-container');
    if (timelineContainer) {
        // Détruire l'ancienne timeline si elle existe
        if (timeline) {
            try {
                timeline.destroy();
                timeline = null;
            } catch (e) {
                console.warn('Erreur destroy:', e);
            }
        }
        
        // Vider le container
        timelineContainer.innerHTML = '';
        
        // Créer la nouvelle timeline DIRECTEMENT
        try {
            timeline = new Timeline({
                container: timelineContainer,
                items: items,
                orientation: 'horizontal',
                theme: 'colorful',
                animated: true,
                clickable: true,
                showDates: false,
                showLabels: true,
                onClick: (item, index) => {
                    const targetStep = index + 1;
                    if (targetStep < etapeActuelle) {
                        console.log(`📍 Navigation vers étape ${targetStep}`);
                        afficherEtape(targetStep);
                    }
                }
            });
            console.log('✅ Timeline créée pour étape', etape);
        } catch (error) {
            console.error('❌ Erreur création timeline:', error);
        }
    } else {
        console.warn('⚠️ Container timeline introuvable');
    }
    
    // Gérer les boutons
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnValidate = document.getElementById('btnValiderCommande');
    
    if (btnPrev) btnPrev.disabled = etape === 1;
    if (btnNext) btnNext.style.display = etape < 4 ? 'block' : 'none';
    if (btnValidate) btnValidate.classList.toggle('hidden', etape !== 4);
    
    // Actions spécifiques par étape
    switch (etape) {
        case 1:
            setTimeout(() => {
                const clientSearchContainer = document.querySelector('.client-search');
                if (clientSearchContainer) {
                    initClientSearch();
                }
            }, 300);
            break;
        case 2:
            console.log('📍 Étape 2 - Chargement des packs');
            chargerPackTemplates();
            setTimeout(() => {
                const productSearchContainer = document.querySelector('.product-search');
                if (productSearchContainer) {
                    initProductSearch();
                }
            }, 300);
            break;
        case 3:
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
// ÉTAPE 3 : OPTIONS DE LIVRAISON
// ========================================

function genererOptionsEtape3() {
    // 1. Type de préparation avec DropdownList
    const typesPreparation = genererOptionsTypesPreparation();
    
    dropdownType = config.createDropdown('#typePreparation', {
        placeholder: '-- Sélectionner un type --',
        options: typesPreparation.map(type => ({
            value: type.value,
            label: type.label,
            icon: COMMANDES_CONFIG.TYPES_PREPARATION[type.value]?.icon
        })),
        value: nouvelleCommande.typePreparation,
        showIcons: true,
        onChange: (value) => {
            nouvelleCommande.typePreparation = value;
            console.log('Type sélectionné:', value);
        }
    });
    
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
                await config.Dialog.alert('Veuillez sélectionner un client', 'Attention');
                return false;
            }
            break;
        case 2:
            if (nouvelleCommande.produits.length === 0) {
                await config.Dialog.alert('Veuillez ajouter au moins un produit', 'Attention');
                return false;
            }
            break;
        case 3:
            if (!nouvelleCommande.typePreparation) {
                await config.Dialog.alert('Veuillez sélectionner un type de préparation', 'Attention');
                return false;
            }
            if (!nouvelleCommande.magasinLivraison) {
                await config.Dialog.alert('Veuillez sélectionner un magasin de livraison', 'Attention');
                return false;
            }
            if (!document.getElementById('dateLivraison').value) {
                await config.Dialog.alert('Veuillez sélectionner une date de livraison', 'Attention');
                return false;
            }
            break;
    }
    return true;
}

// ========================================
// GESTION DES CLIENTS
// ========================================

function initClientSearch() {
    if (clientSearchDropdown) {
        clientSearchDropdown.destroy();
    }
    
    clientSearchDropdown = config.createSearchDropdown('.client-search', {
        placeholder: 'Rechercher un client (nom, prénom, téléphone...)',
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
            
            const searchContainer = document.querySelector('.client-search');
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }
            
            const clientSelected = document.getElementById('clientSelected');
            if (clientSelected) {
                clientSelected.style.display = 'block';
            }
            
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
        config.notify.error('Erreur lors de la sélection du client');
    }
}

export function changerClient() {
    nouvelleCommande.clientId = null;
    nouvelleCommande.client = null;
    
    const searchContainer = document.querySelector('.client-search');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }
    
    const clientSelected = document.getElementById('clientSelected');
    if (clientSelected) {
        clientSelected.style.display = 'none';
    }
    
    if (clientSearchDropdown) {
        clientSearchDropdown.clear();
    }
}

export function ouvrirNouveauClient() {
    window.skipConfirmation = true;
    window.fermerModal('modalNouvelleCommande');
    chargerMagasinsPourNouveauClient();
    setTimeout(() => {
        ouvrirModal('modalNouveauClient');
    }, 300);
}

async function chargerMagasinsPourNouveauClient() {
    try {
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
        
        // Créer le dropdown pour nouveau client
        dropdownMagasinClient = config.createDropdown('#newClientMagasin', {
            placeholder: '-- Sélectionner un magasin --',
            searchable: true,
            options: magasins.map(magasin => ({
                value: magasin.code,
                label: magasin.nom
            })),
            value: auth.magasin || '',
            onChange: (value) => {
                console.log('Magasin client sélectionné:', value);
            }
        });
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        const magasins = auth.magasins || [auth.magasin];
        
        dropdownMagasinClient = new DropdownList({
            container: '#newClientMagasin',
            placeholder: '-- Sélectionner un magasin --',
            searchable: true,
            options: magasins.map(magasin => ({
                value: magasin,
                label: magasin
            })),
            value: auth.magasin || ''
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
        magasinReference: dropdownMagasinClient ? dropdownMagasinClient.getValue() : ''
    };
    
    try {
        const clientId = await ClientsService.creerClient(clientData);
        await selectionnerClient(clientId);
        
        if (dropdownMagasinClient) {
            dropdownMagasinClient.destroy();
            dropdownMagasinClient = null;
        }
        
        window.fermerModal('modalNouveauClient');
        ouvrirModal('modalNouvelleCommande');
        
        form.reset();
        
    } catch (error) {
        console.error('Erreur création client:', error);
        await config.Dialog.error('Erreur lors de la création du client: ' + error.message);
    }
}

// ========================================
// GESTION DES PRODUITS
// ========================================

async function chargerPackTemplates() {
    console.log('🔄 Chargement des packs...');
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const snapshot = await getDocs(collection(db, 'packTemplates'));
        console.log(`✅ ${snapshot.size} packs trouvés`);
        
        const packs = [];
        snapshot.forEach((doc) => {
            const pack = doc.data();
            if (pack.actif !== false) {
                packs.push({
                    id: doc.id,
                    ...pack
                });
            }
        });
        
        packs.sort((a, b) => (a.ordre || 999) - (b.ordre || 999));
        
        // Créer le dropdown des packs
        dropdownPack = config.createDropdown('#packTemplate', {
            placeholder: '-- Commande personnalisée --',
            options: packs.map(pack => ({
                value: pack.id,
                label: pack.nom,
                description: pack.description
            })),
            onChange: (value) => {
                if (value) {
                    appliquerPack();
                }
            }
        });
        
        console.log(`✅ ${packs.length} packs ajoutés au dropdown`);
        
    } catch (error) {
        console.error('❌ Erreur chargement packs:', error);
        config.notify.error('Erreur lors du chargement des packs');
    }
}

export async function appliquerPack() {
    const packId = dropdownPack ? dropdownPack.getValue() : '';
    if (!packId) return;
    
    console.log('🔍 Application du pack:', packId);
    
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const packDoc = await getDoc(doc(db, 'packTemplates', packId));
        if (!packDoc.exists()) return;
        
        const pack = packDoc.data();
        console.log('📦 Données du pack:', pack);
        
        // Vérifier que le pack a bien des produits
        if (!pack.produits || !Array.isArray(pack.produits) || pack.produits.length === 0) {
            config.notify.warning(`Le pack "${pack.nom}" ne contient aucun produit`);
            return;
        }
        
        // Vider le panier actuel
        nouvelleCommande.produits = [];
        
        // Traiter chaque produit du pack
        for (const produitPack of pack.produits) {
            console.log('🔍 Traitement produit du pack:', produitPack);
            
            let produitsFound = [];
            
            // Si on a une référence, rechercher par référence
            if (produitPack.reference) {
                produitsFound = await ProduitsService.rechercherProduits(produitPack.reference);
            } 
            // Sinon, rechercher par catégorie et type
            else if (produitPack.categorie || produitPack.type) {
                // Rechercher tous les produits qui correspondent
                produitsFound = await ProduitsService.rechercherProduits('', {
                    categorie: produitPack.categorie,
                    type: produitPack.type
                });
                
                // Si on n'a pas trouvé de produits, essayer avec seulement la catégorie
                if (produitsFound.length === 0 && produitPack.categorie) {
                    produitsFound = await ProduitsService.rechercherProduits(produitPack.categorie);
                }
            }
            
            console.log('✅ Produits trouvés:', produitsFound);
            
            if (produitsFound.length > 0) {
                const produit = produitsFound[0]; // Prendre le premier produit trouvé
                
                // Si le produit nécessite un côté et que le pack indique "both"
                if ((produit.necessiteCote || produitPack.type === 'appareil_auditif') && produitPack.cote === 'both') {
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
            } else {
                console.warn(`⚠️ Aucun produit trouvé pour:`, produitPack);
                config.notify.warning(`Produit non trouvé: ${produitPack.reference || produitPack.categorie || 'Inconnu'}`);
            }
        }
        
        afficherPanierTemporaire();
        config.notify.success(`Pack "${pack.nom}" appliqué avec succès`);
        
    } catch (error) {
        console.error('Erreur application pack:', error);
        config.notify.error('Erreur lors de l\'application du pack');
    }
}

function initProductSearch() {
    if (productSearchDropdown) {
        productSearchDropdown.destroy();
    }
    
    productSearchDropdown = config.createSearchDropdown('.product-search', {
        placeholder: 'Rechercher un produit...',
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
            afficherSelecteurCote(produit);
        } else {
            nouvelleCommande.produits.push({
                ...produit,
                quantite: 1
            });
            
            afficherPanierTemporaire();
            
            if (productSearchDropdown) {
                productSearchDropdown.clear();
            }
        }
        
    } catch (error) {
        console.error('Erreur ajout produit:', error);
    }
}

function afficherSelecteurCote(produit) {
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
        
        // Créer le dropdown avec recherche
        dropdownMagasin = config.createDropdown('#magasinLivraison', {
            placeholder: '-- Sélectionner un magasin --',
            searchable: true,
            options: magasins.map(magasin => ({
                value: magasin.code,
                label: magasin.nom
            })),
            value: nouvelleCommande.magasinLivraison,
            onChange: (value) => {
                nouvelleCommande.magasinLivraison = value;
                console.log('Magasin sélectionné:', value);
            }
        });
        
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        let magasins = auth.magasins || [auth.magasin];
        
        if (nouvelleCommande.client && nouvelleCommande.client.magasinReference) {
            const magasinClient = nouvelleCommande.client.magasinReference;
            if (!magasins.includes(magasinClient)) {
                magasins.push(magasinClient);
            }
        }
        
        dropdownMagasin = config.createDropdown('#magasinLivraison', {
            placeholder: '-- Sélectionner un magasin --',
            searchable: true,
            options: magasins.map(magasin => ({
                value: magasin,
                label: magasin
            })),
            value: nouvelleCommande.magasinLivraison,
            onChange: (value) => {
                nouvelleCommande.magasinLivraison = value;
            }
        });
    }
}

function setDateLivraisonDefaut() {
    const dateInput = document.getElementById('dateLivraison');
    
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = '';
    
    dateInput.addEventListener('change', (e) => {
        nouvelleCommande.dateLivraison = new Date(e.target.value);
        console.log('Date sélectionnée:', nouvelleCommande.dateLivraison);
    });
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
    const typePrep = dropdownType ? dropdownType.getValue() : '';
    const urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    const magasinLivraison = dropdownMagasin ? dropdownMagasin.getValue() : '';
    const dateLivraison = document.getElementById('dateLivraison').value;
    
    const urgenceConfig = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    
    recapLivraison.innerHTML = `
        <p><strong>Type:</strong> ${COMMANDES_CONFIG.TYPES_PREPARATION[typePrep]?.label}</p>
        <p><strong>Urgence:</strong> ${urgenceConfig.icon} ${urgenceConfig.label}</p>
        <p><strong>Magasin de livraison:</strong> ${magasinLivraison}</p>
        <p><strong>Date prévue:</strong> ${new Date(dateLivraison).toLocaleDateString('fr-FR')}</p>
    `;
}

export async function validerCommande() {
    nouvelleCommande.typePreparation = dropdownType ? dropdownType.getValue() : '';
    nouvelleCommande.urgence = document.querySelector('input[name="urgence"]:checked')?.value || 'normal';
    nouvelleCommande.magasinLivraison = dropdownMagasin ? dropdownMagasin.getValue() : '';
    nouvelleCommande.dateLivraison = new Date(document.getElementById('dateLivraison').value);
    nouvelleCommande.commentaires = document.getElementById('commentaires').value;
    
    try {
        const commandeId = await CommandesService.creerCommande(nouvelleCommande);
        
        // AJOUT : Empêcher la confirmation de fermeture car on vient de sauvegarder
        window.skipConfirmation = true;
        
        window.fermerModal('modalNouvelleCommande');
        
        // LIGNE SUPPRIMÉE : // Notifier le module principal pour rafraîchir les données
if (window.chargerDonnees && typeof window.chargerDonnees === 'function') {
    await window.chargerDonnees();
}
        window.location.reload();
        
        afficherSucces('Commande créée avec succès !');
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        afficherErreur('Erreur lors de la création de la commande: ' + error.message);
    }
}

// ========================================
// EXPORTS GLOBAUX POUR COMPATIBILITÉ
// ========================================

window.rechercherClient = () => {
    console.warn('rechercherClient() est remplacé par SearchDropdown');
};
window.rechercherProduit = () => {
    console.warn('rechercherProduit() est remplacé par SearchDropdown');
};

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [01/02/2025] - Intégration complète de DropdownList
// - Remplacement de tous les <select> par DropdownList
// - Pack templates avec dropdown simple
// - Type de préparation avec icônes
// - Magasins avec recherche activée
// - Gestion propre du destroy() sur tous les dropdowns
// ========================================