// ========================================
// DECOMPTE-SECU.DETAIL.JS - Orchestrateur du détail décompte
// Chemin: modules/decompte-secu/decompte-secu.detail.js
//
// DESCRIPTION:
// Orchestre l'affichage détaillé d'un décompte sécu avec Timeline
// Architecture IoC : les composants ne se connaissent pas
// L'orchestrateur crée la timeline et gère l'affichage
//
// STRUCTURE:
// 1. Affichage du détail avec toutes les sections
// 2. Timeline du workflow sécu
// 3. Tableau détaillé des actes médicaux
// 4. Gestion des actions selon le statut
// 5. Export des fonctions pour main.js
//
// DÉPENDANCES:
// - DecomptesSecuService (logique métier)
// - Timeline (composant UI générique)
// - config (factories)
// ========================================

import { DecomptesSecuService } from './decompte-secu.service.js';
import { 
    DECOMPTES_SECU_CONFIG,
    formaterDate,
    formaterMontant,
    formaterNSS,
    calculerMontantRembourse,
    calculerParticipations
} from './decompte-secu.data.js';
import config from './decompte-secu.config.js';
import { chargerDonnees } from './decompte-secu.list.js';
import { afficherSucces, afficherErreur, afficherInfo } from './decompte-secu.main.js';

// ========================================
// VARIABLES GLOBALES DU MODULE
// ========================================

// Décompte actuellement affiché
let decompteActuel = null;

// Instance de Timeline
let timelineInstance = null;

// ========================================
// FONCTION PRINCIPALE : AFFICHER LE DÉTAIL
// ========================================

export async function voirDetailDecompteSecu(decompteId) {
    try {
        const decompte = await DecomptesSecuService.getDecompte(decompteId);
        if (!decompte) return;
        
        decompteActuel = decompte;
        afficherDetailDecompteSecu(decompte);
        window.modalManager.open('modalDetailDecompteSecu');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    }
}

// ========================================
// AFFICHAGE DU DÉTAIL
// ========================================

function afficherDetailDecompteSecu(decompte) {
    // En-tête
    document.getElementById('detailNumDecompteSecu').textContent = decompte.numeroDecompte;
    
    // Timeline
    afficherTimeline(decompte);
    
    // Sections d'information
    afficherSectionBeneficiaire(decompte);
    afficherSectionRemboursements(decompte);
    afficherSectionCaisse(decompte);
    afficherSectionInformations(decompte);
    afficherSectionActesMedicaux(decompte);
    afficherSectionTracabilite(decompte);
    afficherSectionDocuments(decompte);
    afficherSectionHistorique(decompte);
    
    // Actions disponibles
    afficherActionsDecompte(decompte);
}

// ========================================
// TIMELINE
// ========================================

function afficherTimeline(decompte) {
    // Détruire l'ancienne timeline si elle existe
    if (timelineInstance) {
        timelineInstance.destroy();
        timelineInstance = null;
    }
    
    // Recréer le container
    const timelineWrapper = document.querySelector('.timeline-container');
    if (!timelineWrapper) {
        console.error('❌ Container .timeline-container non trouvé');
        return;
    }
    
    timelineWrapper.innerHTML = '<div class="timeline" id="timeline-secu"></div>';
    
    // Créer les items de timeline
    const items = creerItemsTimeline(decompte);
    
    // Créer la nouvelle timeline
    try {
        timelineInstance = config.createDecompteSecuTimeline('#timeline-secu', items, {
            orientation: 'horizontal',
            theme: 'colorful',
            animated: true,
            showDates: true,
            showLabels: true,
            clickable: false
        });
        console.log('✅ Timeline créée avec succès');
    } catch (error) {
        console.error('❌ Erreur création timeline:', error);
    }
}

function creerItemsTimeline(decompte) {
    const items = [];
    const sequence = ['nouveau', 'traitement_ia', 'controle_taux', 'traitement_effectue', 'paiement_effectue'];
    
    // Gérer le cas du rejet
    if (decompte.statut === 'rejet') {
        // Montrer jusqu'où on était allé avant le rejet
        const indexRejet = sequence.findIndex(s => !decompte.dates[getDateField(s)]);
        if (indexRejet > 0) {
            sequence.splice(indexRejet, 0, 'rejet');
        } else {
            sequence.push('rejet');
        }
    }
    
    sequence.forEach(statutKey => {
        const statutConfig = DECOMPTES_SECU_CONFIG.STATUTS[statutKey];
        if (!statutConfig) return;
        
        const isCompleted = isStatutComplete(decompte, statutKey);
        const isCurrent = decompte.statut === statutKey;
        
        items.push({
            label: statutConfig.label,
            icon: statutConfig.icon,
            date: getDateStatut(decompte, statutKey),
            status: isCurrent ? 'current' : (isCompleted ? 'completed' : 'pending'),
            details: statutConfig.description
        });
    });
    
    return items;
}

function isStatutComplete(decompte, statut) {
    const sequence = ['nouveau', 'traitement_ia', 'controle_taux', 'traitement_effectue', 'paiement_effectue'];
    const currentIndex = sequence.indexOf(decompte.statut);
    const statutIndex = sequence.indexOf(statut);
    
    // Cas spécial pour rejet
    if (statut === 'rejet') {
        return decompte.statut === 'rejet';
    }
    
    return statutIndex < currentIndex || decompte.dates[getDateField(statut)] !== null;
}

function getDateStatut(decompte, statut) {
    const dateField = getDateField(statut);
    const date = decompte.dates[dateField];
    
    if (date) {
        return formaterDate(date, 'complet');
    }
    
    return null;
}

function getDateField(statut) {
    const mapping = {
        'nouveau': 'creation',
        'traitement_ia': 'transmissionIA',
        'controle_taux': 'controleTaux',
        'traitement_effectue': 'traitementEffectue',
        'paiement_effectue': 'paiementEffectue',
        'rejet': 'rejet'
    };
    
    return mapping[statut] || 'creation';
}

// ========================================
// SECTIONS D'AFFICHAGE
// ========================================

function afficherSectionBeneficiaire(decompte) {
    const detailBeneficiaire = document.getElementById('detailBeneficiaire');
    
    // Gestion des valeurs null
    const nomComplet = (decompte.beneficiaire?.nom || decompte.beneficiaire?.prenom) 
        ? `${decompte.beneficiaire.prenom || ''} ${decompte.beneficiaire.nom || ''}`.trim()
        : '-';
    
    const nss = decompte.beneficiaire?.numeroSecuriteSociale 
        ? formaterNSS(decompte.beneficiaire.numeroSecuriteSociale)
        : '-';
    
    // Badges contexte médical
    let badgesHtml = '';
    if (decompte.contexteMedical) {
        if (decompte.contexteMedical.ald) {
            badgesHtml += '<span class="badge badge-ald">ALD 100%</span> ';
        }
        if (decompte.contexteMedical.maternite) {
            badgesHtml += '<span class="badge badge-maternite">Maternité</span> ';
        }
        if (decompte.contexteMedical.accidentTravail) {
            badgesHtml += '<span class="badge badge-accident-travail">AT/MP</span> ';
        }
        if (decompte.contexteMedical.invalidite) {
            badgesHtml += '<span class="badge badge-invalidite">Invalidité</span> ';
        }
    }
    
    detailBeneficiaire.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Nom complet</span>
                <span class="detail-value">${nomComplet}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">N° Sécurité Sociale</span>
                <span class="detail-value nss-value">${nss}</span>
            </div>
        </div>
        ${badgesHtml ? `
            <div style="margin-top: 15px;">
                <span class="detail-label">Contexte médical</span>
                <div style="margin-top: 8px;">${badgesHtml}</div>
            </div>
        ` : ''}
    `;
}

function afficherSectionRemboursements(decompte) {
    const detailRemboursements = document.getElementById('detailRemboursements');
    
    // Calculer les totaux si pas déjà fait
    let calculs = decompte;
    if (!decompte.montantTotalRembourseFinal && decompte.actesMedicaux) {
        calculs = DecomptesSecuService.calculerRemboursements(decompte);
    }
    
    detailRemboursements.innerHTML = `
        <div class="remboursements-detail">
            <div class="remboursement-row">
                <span class="remboursement-label">Montant total facturé</span>
                <span class="remboursement-value">${formaterMontant(calculs.montantTotalFacture || 0)}</span>
            </div>
            <div class="remboursement-row">
                <span class="remboursement-label">Base de remboursement</span>
                <span class="remboursement-value remboursement-base">${formaterMontant(calculs.montantTotalBase || 0)}</span>
            </div>
            <div class="remboursement-row">
                <span class="remboursement-label">Taux moyen</span>
                <span class="remboursement-value remboursement-taux">${calculs.tauxMoyenRemboursement || 0}%</span>
            </div>
            <div class="remboursement-row">
                <span class="remboursement-label">Remboursement brut</span>
                <span class="remboursement-value remboursement-brut">${formaterMontant(calculs.montantTotalRembourse || 0)}</span>
            </div>
            <div class="remboursement-row">
                <span class="remboursement-label">Participations</span>
                <span class="remboursement-value remboursement-participation">- ${formaterMontant(calculs.montantTotalParticipations || 0)}</span>
            </div>
            <div class="remboursement-row remboursement-total">
                <span class="remboursement-label">Montant remboursé</span>
                <span class="remboursement-value">${formaterMontant(calculs.montantTotalRembourseFinal || 0)}</span>
            </div>
        </div>
    `;
}

function afficherSectionCaisse(decompte) {
    const detailCaisse = document.getElementById('detailCaisse');
    detailCaisse.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Caisse primaire</span>
                <span class="detail-value">${decompte.caissePrimaire || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Régime</span>
                <span class="detail-value">${config.HTML_TEMPLATES.regime(decompte.regime)}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">N° Feuille de soins</span>
                <span class="detail-value">${decompte.numeroFeuilleSoins || '-'}</span>
            </div>
            ${decompte.numeroAffiliation ? `
                <div class="detail-info-item">
                    <span class="detail-label">N° Affiliation</span>
                    <span class="detail-value">${decompte.numeroAffiliation}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function afficherSectionInformations(decompte) {
    const detailInformationsSecu = document.getElementById('detailInformationsSecu');
    
    // Gestion de la date paiement
    const datePaiement = decompte.datePaiement 
        ? formaterDate(decompte.datePaiement, 'jour')
        : '-';
    
    // Date des soins
    const dateSoins = decompte.datesSoins && decompte.datesSoins.length > 0
        ? decompte.datesSoins.map(d => formaterDate(d, 'jour')).join(', ')
        : '-';
    
    detailInformationsSecu.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">N° Paiement</span>
                <span class="detail-value">${decompte.paiementId || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Date paiement</span>
                <span class="detail-value">${datePaiement}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Code magasin</span>
                <span class="detail-value">${decompte.codeMagasin || '-'}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Société</span>
                <span class="detail-value">${decompte.societe || '-'}</span>
            </div>
        </div>
        ${decompte.datesSoins ? `
            <div class="detail-info-item" style="margin-top: 15px;">
                <span class="detail-label">Date(s) des soins</span>
                <span class="detail-value">${dateSoins}</span>
            </div>
        ` : ''}
        ${decompte.motifRejet ? `
            <div class="detail-info-item" style="margin-top: 15px;">
                <span class="detail-label">Motif de rejet</span>
                <span class="detail-value" style="color: #dc3545;">${decompte.motifRejet}</span>
            </div>
        ` : ''}
    `;
}

// ========================================
// SECTION ACTES MÉDICAUX
// ========================================

function afficherSectionActesMedicaux(decompte) {
    const detailActesMedicaux = document.getElementById('detailActesMedicaux');
    
    if (!decompte.actesMedicaux || decompte.actesMedicaux.length === 0) {
        detailActesMedicaux.innerHTML = '<p style="color: #666;">Aucun acte médical</p>';
        return;
    }
    
    // Tableau des actes
    const tableHtml = `
        <table class="actes-medicaux-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Code</th>
                    <th>Libellé</th>
                    <th class="col-montant">Facturé</th>
                    <th class="col-montant">Base</th>
                    <th class="col-taux">Taux</th>
                    <th class="col-montant">Remboursé</th>
                    <th class="col-montant">Participation</th>
                    <th class="col-montant">Net</th>
                </tr>
            </thead>
            <tbody>
                ${decompte.actesMedicaux.map(acte => {
                    // Calculer les montants pour cet acte
                    const calcul = calculerMontantRembourse(
                        acte.montantFacture || 0,
                        acte.baseRemboursement || acte.montantFacture || 0,
                        acte.tauxRemboursement || 70
                    );
                    const participations = calculerParticipations(
                        acte.typeActe,
                        calcul.montantRembourse
                    );
                    
                    return `
                        <tr>
                            <td>${config.HTML_TEMPLATES.typeActe(acte.typeActe)}</td>
                            <td class="col-code">${acte.code || '-'}</td>
                            <td>${acte.libelle || '-'}</td>
                            <td class="col-montant">${formaterMontant(acte.montantFacture || 0)}</td>
                            <td class="col-montant montant-base">${formaterMontant(calcul.baseEffective)}</td>
                            <td class="col-taux">${config.HTML_TEMPLATES.taux(acte.tauxRemboursement || 70)}</td>
                            <td class="col-montant montant-rembourse">${formaterMontant(calcul.montantRembourse)}</td>
                            <td class="col-montant montant-participation">${participations.participations.total > 0 ? '- ' + formaterMontant(participations.participations.total) : '-'}</td>
                            <td class="col-montant montant-rembourse"><strong>${formaterMontant(participations.remboursementFinal)}</strong></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    detailActesMedicaux.innerHTML = tableHtml;
}

// ========================================
// SECTIONS COMMUNES
// ========================================

function afficherSectionTracabilite(decompte) {
    const detailTracabiliteSecu = document.getElementById('detailTracabiliteSecu');
    
    // Formater les intervenants
    const creePar = decompte.intervenants?.creePar ? 
        `${decompte.intervenants.creePar.prenom} ${decompte.intervenants.creePar.nom}` : '-';
    
    const traitePar = decompte.intervenants?.traitePar ? 
        `${decompte.intervenants.traitePar.prenom} ${decompte.intervenants.traitePar.nom}` : '-';
    
    const payePar = decompte.intervenants?.payePar ? 
        `${decompte.intervenants.payePar.prenom} ${decompte.intervenants.payePar.nom}` : '-';
    
    detailTracabiliteSecu.innerHTML = `
        <div class="detail-info-grid">
            <div class="detail-info-item">
                <span class="detail-label">Créé par</span>
                <span class="detail-value">${creePar}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Date création</span>
                <span class="detail-value">${formaterDate(decompte.dates.creation, 'complet')}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Traité par</span>
                <span class="detail-value">${traitePar}</span>
            </div>
            <div class="detail-info-item">
                <span class="detail-label">Payé par</span>
                <span class="detail-value">${payePar}</span>
            </div>
        </div>
    `;
}

function afficherSectionDocuments(decompte) {
    const detailDocumentsSecu = document.getElementById('detailDocumentsSecu');
    
    if (!decompte.documents || decompte.documents.length === 0) {
        detailDocumentsSecu.innerHTML = '<p style="color: #666;">Aucun document</p>';
        return;
    }
    
    const documentsHtml = decompte.documents.map(doc => `
        <div class="document-item" style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 6px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${doc.nomOriginal || doc.nom}</strong>
                    <div style="font-size: 12px; color: #666; margin-top: 4px;">
                        Uploadé le ${formaterDate(doc.dateUpload, 'complet')} • ${(doc.taille / 1024).toFixed(1)} KB
                    </div>
                </div>
                <a href="${doc.url}" target="_blank" class="btn btn-sm btn-secondary">
                    📄 Voir
                </a>
            </div>
        </div>
    `).join('');
    
    detailDocumentsSecu.innerHTML = documentsHtml;
}

function afficherSectionHistorique(decompte) {
    const detailHistoriqueSecu = document.getElementById('detailHistoriqueSecu');
    
    if (!decompte.historique || decompte.historique.length === 0) {
        detailHistoriqueSecu.innerHTML = '<p style="color: #666;">Aucun historique</p>';
        return;
    }
    
    // Trier par date décroissante (plus récent en premier)
    const historiqueTrie = [...decompte.historique].sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
    });
    
    const historiqueHtml = historiqueTrie.map(entry => {
        const utilisateur = entry.utilisateur ? 
            `${entry.utilisateur.prenom} ${entry.utilisateur.nom}` : 'Système';
        
        const actionIcon = {
            'creation': '🆕',
            'extraction_ia': '🤖',
            'changement_statut': '🔄',
            'controle_taux': '🧮',
            'validation': '✅',
            'paiement': '💰',
            'rejet': '❌',
            'suppression': '🗑️'
        }[entry.action] || '📝';
        
        return `
            <div class="historique-item" style="padding: 12px; border-left: 3px solid #0066cc; margin-bottom: 10px; background: #f7f9fb;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <strong>${actionIcon} ${entry.action.replace(/_/g, ' ').charAt(0).toUpperCase() + entry.action.replace(/_/g, ' ').slice(1)}</strong>
                        <div style="color: #666; font-size: 12px; margin-top: 4px;">
                            ${entry.details || ''}
                        </div>
                        <div style="color: #999; font-size: 11px; margin-top: 4px;">
                            Par ${utilisateur}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #666;">
                        ${formaterDate(entry.date, 'complet')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    detailHistoriqueSecu.innerHTML = historiqueHtml;
}

// ========================================
// ACTIONS SELON LE STATUT
// ========================================

function afficherActionsDecompte(decompte) {
    const detailActionsSecu = document.getElementById('detailActionsSecu');
    let actions = [];
    
    // Bouton IA toujours disponible sauf si supprimé ou payé
    if (decompte.statut !== 'supprime' && decompte.statut !== 'paiement_effectue') {
        actions.push(`
            <button class="btn btn-info btn-pill" onclick="transmettreIASecu('${decompte.id}')">
                🤖 ${decompte.statut === 'nouveau' ? 'Analyser avec l\'IA' : 'Relancer l\'analyse IA'}
            </button>
        `);
    }
    
    switch (decompte.statut) {
        case 'nouveau':
            // Plus de boutons spécifiques ici car l'IA est déjà ajoutée au-dessus
            break;
            
        case 'traitement_ia':
            actions.push(`
                <button class="btn btn-warning btn-pill" onclick="controlerTaux('${decompte.id}')">
                    🧮 Contrôler les taux
                </button>
            `);
            break;
            
        case 'controle_taux':
            actions.push(`
                <button class="btn btn-success btn-pill" onclick="validerTraitementSecu('${decompte.id}')">
                    ✅ Valider le traitement
                </button>
                <button class="btn btn-warning btn-pill" onclick="corrigerTaux('${decompte.id}')">
                    ✏️ Corriger les taux
                </button>
            `);
            break;
            
        case 'traitement_effectue':
            actions.push(`
                <button class="btn btn-primary btn-pill" onclick="confirmerPaiement('${decompte.id}')">
                    💰 Confirmer le paiement
                </button>
            `);
            break;
            
        case 'rejet':
            actions.push(`
                <button class="btn btn-warning btn-pill" onclick="retraiterDecompte('${decompte.id}')">
                    🔄 Retraiter le décompte
                </button>
            `);
            break;
    }
    
    // Action de suppression toujours disponible sauf si déjà supprimé ou payé
    if (decompte.statut !== 'supprime' && decompte.statut !== 'paiement_effectue') {
        actions.push(`
            <button class="btn btn-danger btn-sm" onclick="supprimerDecompteSecu('${decompte.id}')">
                🗑️ Supprimer
            </button>
        `);
    }
    
    // Bouton rejet disponible sauf si déjà rejeté, supprimé ou payé
    if (decompte.statut !== 'rejet' && decompte.statut !== 'supprime' && decompte.statut !== 'paiement_effectue') {
        actions.push(`
            <button class="btn btn-danger btn-sm" onclick="rejeterDecompte('${decompte.id}')">
                ❌ Rejeter
            </button>
        `);
    }
    
    detailActionsSecu.innerHTML = actions.join('');
}

// ========================================
// ACTIONS WINDOW
// ========================================

window.transmettreIASecu = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Lancer l\'analyse IA de ce décompte CPAM ?',
        'Analyse IA'
    );
    
    if (confirme) {
        try {
            // Afficher un loader
            afficherInfo('🤖 Analyse IA en cours...');
            
            // AJOUTER L'APPEL IA ICI
            const DecompteOpenAIService = await import('./decompte-secu.openai.service.js');
            const resultIA = await DecompteOpenAIService.default.analyserDocumentExistant(decompteId);
            
            console.log('✅ Résultat IA:', resultIA);
            
            // Recharger pour voir les nouvelles données
            await chargerDonnees();
            await voirDetailDecompteSecu(decompteId);
            
            afficherSucces('Analyse IA terminée !');
            
        } catch (error) {
            console.error('❌ Erreur IA:', error);
            afficherErreur('Erreur lors de l\'analyse IA : ' + error.message);
        }
    }
};

window.controlerTaux = async function(decompteId) {
    try {
        afficherInfo('🧮 Vérification des taux en cours...');
        
        // Récupérer le décompte
        const decompte = await DecomptesSecuService.getDecompte(decompteId);
        
        // Vérifier et corriger les taux
        const resultat = await DecomptesSecuService.verifierTauxRemboursement(decompte);
        
        if (resultat.correctionsEffectuees > 0) {
            const confirme = await config.Dialog.confirm(
                `${resultat.correctionsEffectuees} taux ont été corrigés.\n\nVoulez-vous appliquer ces corrections ?`,
                'Corrections de taux'
            );
            
            if (confirme) {
                await DecomptesSecuService.changerStatut(decompteId, 'controle_taux', {
                    tauxVerifies: resultat.actesMedicaux
                });
                
                // Mettre à jour les actes avec les taux corrigés
                await DecomptesSecuService.mettreAJourDecompte(decompteId, {
                    actesMedicaux: resultat.actesMedicaux
                });
                
                await chargerDonnees();
                await voirDetailDecompteSecu(decompteId);
                afficherSucces('Taux corrigés et remboursements recalculés');
            }
        } else {
            await DecomptesSecuService.changerStatut(decompteId, 'controle_taux');
            await chargerDonnees();
            await voirDetailDecompteSecu(decompteId);
            afficherSucces('Tous les taux sont corrects');
        }
        
    } catch (error) {
        afficherErreur(error.message || 'Erreur lors du contrôle des taux');
    }
};

window.validerTraitementSecu = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Confirmer la validation du traitement ?\n\nLes montants de remboursement sont-ils corrects ?',
        'Validation du traitement'
    );
    
    if (confirme) {
        try {
            await DecomptesSecuService.changerStatut(decompteId, 'traitement_effectue');
            await chargerDonnees();
            await voirDetailDecompteSecu(decompteId);
            afficherSucces('Traitement validé');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la validation');
        }
    }
};

window.confirmerPaiement = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Confirmer que le paiement a été effectué ?\n\nCette action est définitive.',
        'Confirmation de paiement'
    );
    
    if (confirme) {
        try {
            await DecomptesSecuService.changerStatut(decompteId, 'paiement_effectue');
            await chargerDonnees();
            window.modalManager.close('modalDetailDecompteSecu');
            afficherSucces('Paiement confirmé');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la confirmation');
        }
    }
};

window.rejeterDecompte = async function(decompteId) {
    const motif = await new Promise((resolve) => {
        const dialogHtml = `
            <div class="dialog-overlay"></div>
            <div class="dialog-box">
                <div class="dialog-header">
                    <div class="dialog-icon danger">❌</div>
                    <h3 class="dialog-title">Rejeter le décompte</h3>
                </div>
                <div class="dialog-body">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                            Motif du rejet *
                        </label>
                        <textarea id="motifRejet" 
                                  placeholder="Précisez la raison du rejet..." 
                                  rows="3"
                                  style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; 
                                         border-radius: 6px; box-sizing: border-box; resize: vertical;"
                                  required></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="dialog-btn secondary rejet-cancel">Annuler</button>
                    <button class="dialog-btn danger rejet-confirm">Rejeter</button>
                </div>
            </div>
        `;
        
        const dialogContainer = document.getElementById('dialog-container');
        if (!dialogContainer) {
            resolve(null);
            return;
        }
        
        dialogContainer.innerHTML = dialogHtml;
        dialogContainer.classList.add('active');
        
        const motifTextarea = document.getElementById('motifRejet');
        const confirmBtn = document.querySelector('.rejet-confirm');
        const cancelBtn = document.querySelector('.rejet-cancel');
        const overlay = document.querySelector('.dialog-overlay');
        
        setTimeout(() => {
            if (motifTextarea) motifTextarea.focus();
        }, 100);
        
        const handleConfirm = () => {
            const motif = motifTextarea ? motifTextarea.value.trim() : '';
            
            if (!motif) {
                if (motifTextarea) {
                    motifTextarea.style.borderColor = '#f44336';
                    motifTextarea.focus();
                }
                return;
            }
            
            dialogContainer.classList.remove('active');
            setTimeout(() => {
                dialogContainer.innerHTML = '';
            }, 200);
            
            resolve(motif);
        };
        
        const handleCancel = () => {
            dialogContainer.classList.remove('active');
            setTimeout(() => {
                dialogContainer.innerHTML = '';
            }, 200);
            resolve(null);
        };
        
        if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
        if (overlay) overlay.addEventListener('click', handleCancel);
        
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
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
    
    if (motif) {
        try {
            await DecomptesSecuService.changerStatut(decompteId, 'rejet', {
                motif: motif
            });
            await chargerDonnees();
            await voirDetailDecompteSecu(decompteId);
            afficherSucces('Décompte rejeté');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors du rejet');
        }
    }
};

window.supprimerDecompteSecu = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Êtes-vous sûr de vouloir supprimer ce décompte ?\n\nCette action est irréversible.',
        'Suppression du décompte',
        {
            confirmText: 'Supprimer',
            confirmClass: 'danger'
        }
    );
    
    if (confirme) {
        try {
            await DecomptesSecuService.supprimerDecompte(decompteId);
            await chargerDonnees();
            window.modalManager.close('modalDetailDecompteSecu');
            afficherSucces('Décompte supprimé');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors de la suppression');
        }
    }
};

window.corrigerTaux = async function(decompteId) {
    // TODO: Implémenter l'interface de correction manuelle des taux
    afficherInfo('Fonction de correction manuelle en cours de développement');
};

window.retraiterDecompte = async function(decompteId) {
    const confirme = await config.Dialog.confirm(
        'Voulez-vous retraiter ce décompte ?\n\nIl repassera en statut "Nouveau".',
        'Retraiter le décompte'
    );
    
    if (confirme) {
        try {
            await DecomptesSecuService.changerStatut(decompteId, 'nouveau');
            await chargerDonnees();
            await voirDetailDecompteSecu(decompteId);
            afficherSucces('Décompte remis en traitement');
        } catch (error) {
            afficherErreur(error.message || 'Erreur lors du retraitement');
        }
    }
};

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
    if (timelineInstance) {
        timelineInstance.destroy();
        timelineInstance = null;
    }
});

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Architecture IoC stricte
   - Timeline adaptée workflow sécu
   - Section actes médicaux avec calculs
   - Actions spécifiques (contrôle taux, paiement)
   - Gestion des participations et franchises
   
   NOTES POUR REPRISES FUTURES:
   - La logique métier est ICI, pas dans Timeline
   - Timeline est un composant générique
   - Les calculs sont faits par le service
   - Les actions changent selon le statut
   ======================================== */