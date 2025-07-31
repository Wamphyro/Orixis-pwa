// ========================================
// COMMANDES.DETAIL.JS - Orchestrateur du détail commande
// Chemin: modules/commandes/commandes.detail.js
//
// DESCRIPTION:
// Orchestre l'affichage détaillé d'une commande avec Timeline et DropdownList
// Architecture IoC : les composants ne se connaissent pas
//
// MODIFIÉ le 01/02/2025:
// - Utilisation de Timeline générique (pas de logique métier dedans)
// - La logique createOrderTimeline est ICI dans l'orchestrateur
// - Tous les dropdowns utilisent DropdownList harmonisé
// - Gestion propre du cycle de vie des composants
//
// DÉPENDANCES:
// - CommandesService (logique métier)
// - Timeline, DropdownList, Dialog, notify (composants UI)
// - COMMANDES_CONFIG (configuration)
// ========================================

import { CommandesService } from '../../src/services/commandes.service.js';
import { 
    COMMANDES_CONFIG, 
    genererOptionsUrgence, 
    genererOptionsTransporteurs,
    genererOptionsTypesPreparation 
} from '../../src/data/commandes.data.js';
import { 
    Timeline,
    DropdownList,
    Dialog, 
    notify 
} from '../../src/components/index.js';
import { chargerDonnees } from './commandes.list.js';
import { afficherSucces, afficherErreur } from './commandes.main.js';

// ========================================
// VARIABLES GLOBALES DU MODULE
// ========================================

// Commande actuellement affichée
let commandeActuelle = null;

// Instance de Timeline
let timelineInstance = null;

// Instances des dropdowns (pour pouvoir les détruire)
const dropdownInstances = {
    editMagasin: null,
    editUrgence: null,
    editTransporteur: null,
    expeditionTransporteur: null
};

// ========================================
// FONCTION PRINCIPALE : AFFICHER LE DÉTAIL
// ========================================

export async function voirDetailCommande(commandeId) {
    try {
        const commande = await CommandesService.getCommande(commandeId);
        if (!commande) return;
        
        commandeActuelle = commande;
        afficherDetailCommande(commande);
        window.modalManager.open('modalDetailCommande');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    }
}

// ========================================
// LOGIQUE DE CRÉATION DE TIMELINE POUR COMMANDES
// Cette fonction est ICI car c'est de la logique métier
// ========================================

function createOrderTimeline(container, commande, options = {}) {
    // Utiliser la configuration centralisée
    const statuts = COMMANDES_CONFIG.TIMELINE_CONFIG.sequence;
    
    // Transformer les données commande en items génériques pour Timeline
    const items = statuts.map(statut => {
        const config = COMMANDES_CONFIG.STATUTS[statut];
        
        const item = {
            id: statut,
            label: config.label,
            icon: config.icon,
            date: getDateForStatut(commande, statut),
            description: config.description || null
        };
        
        // Déterminer le statut visuel
        if (commande.statut === 'annulee') {
            item.status = 'disabled';
        } else if (statut === commande.statut) {
            item.status = 'active';
        } else if (statuts.indexOf(statut) < statuts.indexOf(commande.statut)) {
            item.status = 'completed';
        } else {
            item.status = 'pending';
        }
        
        return item;
    });
    
    // Fusionner les options par défaut avec celles fournies
    const finalOptions = {
        ...COMMANDES_CONFIG.TIMELINE_CONFIG.defaultOptions,
        ...options,
        container,
        items
    };
    
    // Créer l'instance Timeline avec la configuration
    return new Timeline(finalOptions);
}

function getDateForStatut(commande, statut) {
    // Utiliser le mapping centralisé
    const dateField = COMMANDES_CONFIG.TIMELINE_CONFIG.dateFields[statut];
    if (!dateField) return '';
    
    const date = commande.dates?.[dateField];
    if (!date) return '';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('fr-FR');
}

// ========================================
// AFFICHAGE DU DÉTAIL
// ========================================

function afficherDetailCommande(commande) {
    // En-tête
    document.getElementById('detailNumCommande').textContent = commande.numeroCommande;
    
    // Timeline - Détruire l'ancienne si elle existe
    if (timelineInstance) {
        timelineInstance.destroy();
        timelineInstance = null;
    }
    
    const timelineContainer = document.getElementById('timeline');
    timelineContainer.innerHTML = '';
    
    // Créer la nouvelle timeline
    timelineInstance = createOrderTimeline(timelineContainer, commande, {
        orientation: 'horizontal',
        theme: 'colorful',
        animated: true,
        showDates: true,
        showLabels: true
    });
    
    // Informations client
    afficherSectionClient(commande);
    
    // Produits commandés
    afficherSectionProduits(commande);
    
    // Informations de livraison
    afficherSectionLivraison(commande);
    
    // Section expédition
    afficherSectionExpedition(commande);
    
    // Actions disponibles
    afficherActionsCommande(commande);
}

// ========================================
// SECTIONS D'AFFICHAGE
// ========================================

function afficherSectionClient(commande) {
    const detailClient = document.getElementById('detailClient');
    detailClient.innerHTML = `
        <button class="btn btn-icon btn-sm btn-primary section-edit-icon" 
                onclick="editerClient()" 
                title="Modifier les informations client">
            ✏️
        </button>
        <div class="detail-info-compact" id="clientReadOnly">
            <div class="info-row">
                <span class="detail-label">Nom :</span>
                <span class="detail-value">${commande.client.prenom} ${commande.client.nom}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Tél :</span>
                <span class="detail-value">${commande.client.telephone || '-'}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Email :</span>
                <span class="detail-value">${commande.client.email || '-'}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Magasin :</span>
                <span class="detail-value">${commande.magasinReference}</span>
            </div>
        </div>
        <div class="edit-form" id="clientEditForm">
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Prénom *</label>
                    <input type="text" id="editClientPrenom" value="${commande.client.prenom}" required>
                </div>
                <div class="edit-form-group">
                    <label>Nom *</label>
                    <input type="text" id="editClientNom" value="${commande.client.nom}" required>
                </div>
            </div>
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Téléphone</label>
                    <input type="tel" id="editClientTelephone" value="${commande.client.telephone || ''}">
                </div>
                <div class="edit-form-group">
                    <label>Email</label>
                    <input type="email" id="editClientEmail" value="${commande.client.email || ''}">
                </div>
            </div>
            <div class="edit-actions">
                <button class="btn btn-secondary" onclick="annulerEditionClient()">Annuler</button>
                <button class="btn btn-primary" onclick="sauvegarderClient()">Sauvegarder</button>
            </div>
        </div>
    `;
}

function afficherSectionProduits(commande) {
    const detailProduits = document.getElementById('detailProduits');
    const peutModifierProduits = ['nouvelle', 'preparation'].includes(commande.statut);
    
    detailProduits.innerHTML = `
        ${peutModifierProduits ? `
            <button class="btn btn-icon btn-sm btn-primary section-edit-icon" 
                    onclick="editerProduits()" 
                    title="Modifier les produits">
                ✏️
            </button>
        ` : ''}
        <div class="produits-list" id="produitsReadOnly">
            ${commande.produits.map((p, index) => `
                <div class="produit-item" data-index="${index}">
                    <div class="produit-header">
                        <div class="produit-nom">
                            ${p.designation}
                            ${p.cote ? `<span class="produit-cote">(${p.cote})</span>` : ''}
                        </div>
                        <div class="produit-quantite">
                            <span class="qty-label">Qté:</span>
                            <span class="qty-value">${p.quantite}</span>
                        </div>
                    </div>
                    ${(p.type === 'appareil_auditif' || p.necessiteCote || p.numeroSerie) ? `
                        <div class="produit-serial ${p.numeroSerie ? 'serial-ok' : 'serial-missing'}">
                            <span class="serial-icon">${p.numeroSerie ? '✓' : '⚠️'}</span>
                            <span class="serial-label">N° Série :</span>
                            <span class="serial-value">
                                ${p.numeroSerie ? `<code>${p.numeroSerie}</code>` : 'Non saisi'}
                            </span>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="edit-form" id="produitsEditForm">
            <!-- Formulaire d'édition des produits -->
        </div>
    `;
}

function afficherSectionLivraison(commande) {
    const detailLivraison = document.getElementById('detailLivraison');
    
    detailLivraison.innerHTML = `
        <button class="btn btn-icon btn-sm btn-primary section-edit-icon" 
                onclick="editerLivraison()" 
                title="Modifier les informations de livraison">
            ✏️
        </button>
        <div class="detail-info-compact" id="livraisonReadOnly">
            <div class="info-row">
                <span class="detail-label">Type :</span>
                <span class="detail-value">${COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Urgence :</span>
                <span class="detail-value">${COMMANDES_CONFIG.NIVEAUX_URGENCE[commande.niveauUrgence]?.label}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Magasin :</span>
                <span class="detail-value">${commande.magasinLivraison}</span>
            </div>
            <div class="info-row">
                <span class="detail-label">Date :</span>
                <span class="detail-value">${formatDate(commande.dates.livraisonPrevue)}</span>
            </div>
            ${commande.commentaires ? `
                <div class="info-row">
                    <span class="detail-label">Note :</span>
                    <span class="detail-value">${commande.commentaires}</span>
                </div>
            ` : ''}
        </div>
        <div class="edit-form" id="livraisonEditForm">
            <div class="edit-form-group">
                <label>Magasin de livraison *</label>
                <div id="editMagasinLivraison"></div>
            </div>
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>Niveau d'urgence *</label>
                    <div id="editNiveauUrgence"></div>
                </div>
                <div class="edit-form-group">
                    <label>Date de livraison prévue *</label>
                    <input type="date" id="editDateLivraison" value="${formatDateForInput(commande.dates.livraisonPrevue)}" required>
                </div>
            </div>
            <div class="edit-form-group">
                <label>Commentaires</label>
                <textarea id="editCommentaires" rows="3">${commande.commentaires || ''}</textarea>
            </div>
            <div class="edit-actions">
                <button class="btn btn-secondary" onclick="annulerEditionLivraison()">Annuler</button>
                <button class="btn btn-primary" onclick="sauvegarderLivraison()">Sauvegarder</button>
            </div>
        </div>
    `;
}

function afficherSectionExpedition(commande) {
    const sectionExpedition = document.getElementById('sectionExpedition');
    
    if (commande.expedition?.necessiteExpedition || commande.expedition?.envoi?.numeroSuivi) {
        sectionExpedition.style.display = 'block';
        const detailExpedition = document.getElementById('detailExpedition');
        
        if (commande.expedition.envoi?.numeroSuivi) {
            detailExpedition.innerHTML = `
                <button class="btn btn-icon btn-sm btn-primary section-edit-icon" 
                        onclick="editerExpedition()" 
                        title="Modifier les informations d'expédition">
                    ✏️
                </button>
                <div id="expeditionReadOnly">
                    <div class="detail-info">
                        <span class="detail-label">Transporteur :</span>
                        <span class="detail-value">${commande.expedition.envoi.transporteur}</span>
                    </div>
                    <div class="detail-info">
                        <span class="detail-label">N° suivi envoi :</span>
                        <span class="detail-value"><strong>${commande.expedition.envoi.numeroSuivi}</strong></span>
                    </div>
                    <div class="detail-info">
                        <span class="detail-label">Date envoi :</span>
                        <span class="detail-value">${formatDate(commande.expedition.envoi.dateEnvoi)}</span>
                    </div>
                    ${commande.expedition.reception?.numeroSuiviRecu ? `
                        <hr style="margin: 15px 0;">
                        <div class="detail-info">
                            <span class="detail-label">N° suivi réception :</span>
                            <span class="detail-value"><strong>${commande.expedition.reception.numeroSuiviRecu}</strong></span>
                        </div>
                        <div class="detail-info">
                            <span class="detail-label">Date réception :</span>
                            <span class="detail-value">${formatDate(commande.expedition.reception.dateReception)}</span>
                        </div>
                        <div class="detail-info">
                            <span class="detail-label">Colis conforme :</span>
                            <span class="detail-value">${commande.expedition.reception.colisConforme ? '✅ Oui' : '❌ Non'}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="edit-form" id="expeditionEditForm">
                    <div class="edit-form-row">
                        <div class="edit-form-group">
                            <label>Transporteur</label>
                            <div id="editTransporteur"></div>
                        </div>
                        <div class="edit-form-group">
                            <label>Numéro de suivi envoi</label>
                            <input type="text" id="editNumeroSuivi" value="${commande.expedition.envoi.numeroSuivi}">
                        </div>
                    </div>
                    ${commande.expedition.reception?.numeroSuiviRecu ? `
                        <div class="edit-form-row">
                            <div class="edit-form-group">
                                <label>Numéro de suivi réception</label>
                                <input type="text" id="editNumeroSuiviRecu" value="${commande.expedition.reception.numeroSuiviRecu}">
                            </div>
                            <div class="edit-form-group">
                                <label>Colis conforme</label>
                                <select id="editColisConforme">
                                    <option value="true" ${commande.expedition.reception.colisConforme ? 'selected' : ''}>✅ Oui</option>
                                    <option value="false" ${!commande.expedition.reception.colisConforme ? 'selected' : ''}>❌ Non</option>
                                </select>
                            </div>
                        </div>
                        <div class="edit-form-group">
                            <label>Commentaires réception</label>
                            <textarea id="editCommentairesReception" rows="2">${commande.expedition.reception.commentaires || ''}</textarea>
                        </div>
                    ` : ''}
                    <div class="edit-actions">
                        <button class="btn btn-secondary" onclick="annulerEditionExpedition()">Annuler</button>
                        <button class="btn btn-primary" onclick="sauvegarderExpedition()">Sauvegarder</button>
                    </div>
                </div>
            `;
        } else {
            detailExpedition.innerHTML = '<p>En attente d\'expédition</p>';
        }
    } else {
        sectionExpedition.style.display = 'none';
    }
}

// ========================================
// FONCTIONS D'ÉDITION AVEC DROPDOWNLIST
// ========================================

window.editerLivraison = async function() {
    const section = document.querySelector('#detailLivraison').parentElement;
    section.classList.add('editing');
    
    document.getElementById('livraisonReadOnly').style.display = 'none';
    document.getElementById('livraisonEditForm').classList.add('active');
    
    try {
        // Charger les magasins
        const { chargerMagasins } = await import('../../src/services/firebase.service.js');
        const magasinsData = await chargerMagasins();
        
        const magasins = [];
        if (magasinsData) {
            Object.entries(magasinsData).forEach(([id, data]) => {
                if (data.actif !== false) {
                    magasins.push({
                        value: data.code || id,
                        label: data.nom || data.code || id
                    });
                }
            });
        }
        
        magasins.sort((a, b) => a.label.localeCompare(b.label));
        
        // Détruire les anciennes instances si elles existent
        cleanupDropdowns(['editMagasin', 'editUrgence']);
        
        // Créer le dropdown magasin
        dropdownInstances.editMagasin = new DropdownList({
            container: '#editMagasinLivraison',
            searchable: true,
            placeholder: 'Sélectionner un magasin',
            options: magasins,
            value: commandeActuelle.magasinLivraison
        });
        
        // Créer le dropdown urgence
        const optionsUrgence = genererOptionsUrgence();
        dropdownInstances.editUrgence = new DropdownList({
            container: '#editNiveauUrgence',
            placeholder: 'Sélectionner l\'urgence',
            options: optionsUrgence.map(opt => ({
                value: opt.value,
                label: opt.label,
                icon: COMMANDES_CONFIG.NIVEAUX_URGENCE[opt.value]?.icon
            })),
            value: commandeActuelle.niveauUrgence,
            showIcons: true
        });
        
    } catch (error) {
        console.error('Erreur chargement dropdowns:', error);
        notify.error('Erreur lors du chargement des options');
    }
};

window.annulerEditionLivraison = function() {
    const section = document.querySelector('#detailLivraison').parentElement;
    section.classList.remove('editing');
    
    document.getElementById('livraisonReadOnly').style.display = 'block';
    document.getElementById('livraisonEditForm').classList.remove('active');
    
    // Nettoyer les dropdowns
    cleanupDropdowns(['editMagasin', 'editUrgence']);
};

window.sauvegarderLivraison = async function() {
    try {
        const updates = {
            magasinLivraison: dropdownInstances.editMagasin?.getValue() || '',
            niveauUrgence: dropdownInstances.editUrgence?.getValue() || '',
            'dates.livraisonPrevue': new Date(document.getElementById('editDateLivraison').value),
            commentaires: document.getElementById('editCommentaires').value
        };
        
        await CommandesService.mettreAJourCommande(commandeActuelle.id, updates);
        
        annulerEditionLivraison();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Informations de livraison mises à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde livraison:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

window.editerExpedition = async function() {
    const section = document.getElementById('sectionExpedition');
    section.classList.add('editing');
    
    document.getElementById('expeditionReadOnly').style.display = 'none';
    document.getElementById('expeditionEditForm').classList.add('active');
    
    // Détruire l'ancienne instance
    cleanupDropdowns(['editTransporteur']);
    
    // Créer le dropdown transporteur
    const transporteurs = genererOptionsTransporteurs();
    dropdownInstances.editTransporteur = new DropdownList({
        container: '#editTransporteur',
        placeholder: 'Sélectionner un transporteur',
        options: transporteurs.map(t => ({
            value: t.value,
            label: t.label
        })),
        value: commandeActuelle.expedition.envoi.transporteur
    });
};

window.annulerEditionExpedition = function() {
    const section = document.getElementById('sectionExpedition');
    section.classList.remove('editing');
    
    document.getElementById('expeditionReadOnly').style.display = 'block';
    document.getElementById('expeditionEditForm').classList.remove('active');
    
    cleanupDropdowns(['editTransporteur']);
};

window.sauvegarderExpedition = async function() {
    try {
        const updates = {
            'expedition.envoi.transporteur': dropdownInstances.editTransporteur?.getValue() || '',
            'expedition.envoi.numeroSuivi': document.getElementById('editNumeroSuivi').value
        };
        
        if (commandeActuelle.expedition.reception?.numeroSuiviRecu) {
            updates['expedition.reception.numeroSuiviRecu'] = document.getElementById('editNumeroSuiviRecu').value;
            updates['expedition.reception.colisConforme'] = document.getElementById('editColisConforme').value === 'true';
            updates['expedition.reception.commentaires'] = document.getElementById('editCommentairesReception').value;
        }
        
        await CommandesService.mettreAJourCommande(commandeActuelle.id, updates);
        
        annulerEditionExpedition();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Informations d\'expédition mises à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde expédition:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

// ========================================
// ACTIONS ET CHANGEMENT DE STATUT
// ========================================

function afficherActionsCommande(commande) {
    const detailActions = document.getElementById('detailActions');
    let actions = [];
    
    switch (commande.statut) {
        case 'nouvelle':
            actions.push(`
                <button class="btn btn-primary" onclick="changerStatutDetail('${commande.id}', 'preparation')">
                    🔵 Commencer la préparation
                </button>
            `);
            break;
            
        case 'preparation':
            actions.push(`
                <button class="btn btn-primary" onclick="saisirNumerosSerie('${commande.id}')">
                    📝 Saisir les numéros de série
                </button>
                <button class="btn btn-success" onclick="terminerPreparation('${commande.id}')">
                    ✅ Terminer la préparation
                </button>
            `);
            break;
            
        case 'terminee':
            actions.push(`
                <button class="btn btn-primary" onclick="saisirExpedition('${commande.id}')">
                    📦 Expédier le colis
                </button>
                <button class="btn btn-success" onclick="livrerDirectement('${commande.id}')">
                    ✅ Livrer directement au patient
                </button>
            `);
            break;
            
        case 'expediee':
            actions.push(`
                <button class="btn btn-primary" onclick="validerReception('${commande.id}')">
                    📥 Valider la réception
                </button>
            `);
            break;
            
        case 'receptionnee':
            if (!commande.patientPrevenu) {
                actions.push(`
                    <button class="btn btn-secondary" onclick="marquerPatientPrevenu('${commande.id}')">
                        📞 Patient prévenu
                    </button>
                `);
            }
            actions.push(`
                <button class="btn btn-success" onclick="changerStatutDetail('${commande.id}', 'livree')">
                    ✅ Livrer au patient
                </button>
            `);
            break;
    }
    
    if (commande.statut !== 'annulee' && commande.statut !== 'livree') {
        actions.push(`
            <button class="btn btn-danger" onclick="annulerCommande('${commande.id}')">
                ❌ Annuler la commande
            </button>
        `);
    }
    
    detailActions.innerHTML = actions.join('');
}

// ========================================
// ACTION: SAISIR EXPÉDITION AVEC DROPDOWN
// ========================================

window.saisirExpedition = async function(commandeId) {
    try {
        console.log('🚀 Début saisir expédition pour commande:', commandeId);
        
        const transporteurs = genererOptionsTransporteurs();
        
        const result = await new Promise((resolve) => {
            const dialogHtml = `
                <div class="dialog-overlay"></div>
                <div class="dialog-box">
                    <div class="dialog-header">
                        <div class="dialog-icon info">📦</div>
                        <h3 class="dialog-title">Expédition du colis</h3>
                    </div>
                    <div class="dialog-body">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Transporteur :</label>
                            <div id="expeditionTransporteurDropdown"></div>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Numéro de suivi :</label>
                            <input type="text" id="expeditionNumeroSuivi" 
                                   placeholder="Ex: 1234567890" 
                                   style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; border-radius: 6px; box-sizing: border-box;"
                                   required>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn secondary expedition-cancel">Annuler</button>
                        <button class="dialog-btn primary expedition-confirm">Valider l'expédition</button>
                    </div>
                </div>
            `;
            
            const dialogContainer = document.getElementById('dialog-container');
            if (!dialogContainer) {
                console.error('❌ Dialog container introuvable');
                resolve(null);
                return;
            }
            
            dialogContainer.innerHTML = dialogHtml;
            dialogContainer.classList.add('active');
            
            // Créer le dropdown pour le transporteur
            dropdownInstances.expeditionTransporteur = new DropdownList({
                container: '#expeditionTransporteurDropdown',
                placeholder: 'Sélectionner un transporteur',
                options: transporteurs.map(t => ({
                    value: t.value,
                    label: t.label
                })),
                value: 'Colissimo'
            });
            
            const numeroSuiviInput = document.getElementById('expeditionNumeroSuivi');
            const confirmBtn = document.querySelector('.expedition-confirm');
            const cancelBtn = document.querySelector('.expedition-cancel');
            const overlay = document.querySelector('.dialog-overlay');
            
            setTimeout(() => {
                if (numeroSuiviInput) {
                    numeroSuiviInput.focus();
                }
            }, 100);
            
            const handleConfirm = () => {
                const transporteur = dropdownInstances.expeditionTransporteur?.getValue();
                const numeroSuivi = numeroSuiviInput ? numeroSuiviInput.value.trim() : '';
                
                console.log('📝 Validation - Transporteur:', transporteur);
                console.log('📝 Validation - Numéro:', numeroSuivi);
                
                if (!numeroSuivi) {
                    if (numeroSuiviInput) {
                        numeroSuiviInput.style.borderColor = '#f44336';
                        numeroSuiviInput.focus();
                    }
                    return;
                }
                
                // Capturer les valeurs AVANT de détruire
                const resultData = {
                    transporteur: transporteur,
                    numeroSuivi: numeroSuivi
                };
                
                // Détruire le dropdown
                cleanupDropdowns(['expeditionTransporteur']);
                
                // Fermer le dialog
                setTimeout(() => {
                    dialogContainer.classList.remove('active');
                    setTimeout(() => {
                        dialogContainer.innerHTML = '';
                        resolve(resultData);
                    }, 200);
                }, 50);
            };

            const handleCancel = () => {
                // Détruire le dropdown
                cleanupDropdowns(['expeditionTransporteur']);
                
                // Fermer le dialog
                setTimeout(() => {
                    dialogContainer.classList.remove('active');
                    setTimeout(() => {
                        dialogContainer.innerHTML = '';
                        resolve(null);
                    }, 200);
                }, 50);
            };
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleConfirm);
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
            }
            
            if (overlay) {
                overlay.addEventListener('click', handleCancel);
            }
            
            const handleKeydown = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                }
            };
            
            document.addEventListener('keydown', handleKeydown);
            
            const originalResolve = resolve;
            resolve = (value) => {
                document.removeEventListener('keydown', handleKeydown);
                originalResolve(value);
            };
        });
        
        if (!result) {
            console.log('❌ Annulation utilisateur');
            return;
        }
        
        console.log('✅ Données récupérées:', result);
        
        await CommandesService.changerStatut(commandeId, 'expediee', {
            numeroSuivi: result.numeroSuivi,
            transporteur: result.transporteur
        });
        
        await chargerDonnees();
        await voirDetailCommande(commandeId);
        
        afficherSucces(`Expédition validée - ${result.transporteur} - N° ${result.numeroSuivi}`);
        
    } catch (error) {
        console.error('❌ Erreur validation expédition:', error);
        afficherErreur(error.message || 'Erreur lors de la validation de l\'expédition');
    }
};

// ========================================
// UTILITAIRES
// ========================================

/**
 * Nettoyer les instances de dropdowns
 * @param {string[]} keys - Les clés des dropdowns à détruire
 */
function cleanupDropdowns(keys) {
    keys.forEach(key => {
        if (dropdownInstances[key]) {
            try {
                dropdownInstances[key].destroy();
                dropdownInstances[key] = null;
            } catch (e) {
                console.warn(`Erreur destroy dropdown ${key}:`, e);
            }
        }
    });
}

/**
 * Nettoyer toutes les instances au déchargement du module
 */
window.addEventListener('beforeunload', () => {
    // Détruire la timeline
    if (timelineInstance) {
        timelineInstance.destroy();
        timelineInstance = null;
    }
    
    // Détruire tous les dropdowns
    cleanupDropdowns(Object.keys(dropdownInstances));
});

// ========================================
// AUTRES FONCTIONS (inchangées)
// ========================================

window.changerStatutDetail = async function(commandeId, nouveauStatut, skipConfirmation = false) {
    // [Code existant conservé]
    console.log('🔄 Changement statut:', { commandeId, nouveauStatut });
    
    try {
        const labelStatut = COMMANDES_CONFIG.STATUTS[nouveauStatut]?.label || nouveauStatut;
        let confirme = skipConfirmation;
        
        if (!skipConfirmation) {
            confirme = await Dialog.confirm(
                `Êtes-vous sûr de vouloir passer la commande au statut "${labelStatut}" ?`,
                'Confirmation du changement de statut'
            );
        }
        
        if (confirme) {
            await CommandesService.changerStatut(commandeId, nouveauStatut);
            await chargerDonnees();
            
            const commandeMAJ = await CommandesService.getCommande(commandeId);
            if (commandeMAJ) {
                commandeActuelle = commandeMAJ;
                afficherDetailCommande(commandeMAJ);
            }
            
            afficherSucces(`Commande passée au statut : ${labelStatut}`);
        }
    } catch (error) {
        console.error('❌ Erreur changement statut:', error);
        afficherErreur(error.message || 'Erreur lors du changement de statut');
    }
};

window.editerClient = function() {
    const section = document.querySelector('#detailClient').parentElement;
    section.classList.add('editing');
    
    document.getElementById('clientReadOnly').style.display = 'none';
    document.getElementById('clientEditForm').classList.add('active');
};

window.annulerEditionClient = function() {
    const section = document.querySelector('#detailClient').parentElement;
    section.classList.remove('editing');
    
    document.getElementById('clientReadOnly').style.display = 'block';
    document.getElementById('clientEditForm').classList.remove('active');
};

window.sauvegarderClient = async function() {
    try {
        const updates = {
            'client.prenom': document.getElementById('editClientPrenom').value,
            'client.nom': document.getElementById('editClientNom').value,
            'client.telephone': document.getElementById('editClientTelephone').value,
            'client.email': document.getElementById('editClientEmail').value
        };
        
        await CommandesService.mettreAJourCommande(commandeActuelle.id, updates);
        
        annulerEditionClient();
        await voirDetailCommande(commandeActuelle.id);
        notify.success('Informations client mises à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde client:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

// [Autres fonctions window.* conservées...]

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
}

function formatDateForInput(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [01/02/2025] - Architecture harmonisée complète
   - Timeline générique : logique métier createOrderTimeline dans l'orchestrateur
   - Tous les dropdowns utilisent DropdownList harmonisé
   - Gestion propre du cycle de vie (création/destruction)
   - Fonction cleanupDropdowns() pour éviter les fuites mémoire
   - Architecture IoC : aucun composant ne se connaît
   
   [01/02/2025 v2] - Utilisation de la configuration centralisée
   - TIMELINE_CONFIG.sequence pour l'ordre des statuts
   - TIMELINE_CONFIG.dateFields pour le mapping des dates
   - TIMELINE_CONFIG.defaultOptions pour les options par défaut
   - Fusion des options avec l'opérateur spread
   
   NOTES POUR REPRISES FUTURES:
   - La logique métier est ICI, pas dans les composants
   - Toujours détruire les instances avant d'en créer de nouvelles
   - Les composants UI sont 100% génériques et réutilisables
   - La configuration est dans commandes.data.js
   ======================================== */