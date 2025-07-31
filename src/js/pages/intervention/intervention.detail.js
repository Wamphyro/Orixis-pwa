// ========================================
// INTERVENTION.DETAIL.JS - Gestion du détail des interventions
// Chemin: src/js/pages/intervention/intervention.detail.js
//
// DESCRIPTION:
// Gère l'affichage détaillé d'une intervention et les actions
// Basé sur l'architecture de commandes.detail.js
//
// STRUCTURE:
// 1. Imports et configuration
// 2. Affichage du détail
// 3. Actions selon le statut
// 4. Édition des informations
// 5. Changement de statut
// ========================================

import { InterventionService } from '../../services/intervention.service.js';
import { 
    INTERVENTION_CONFIG,
    getProchainStatut,
    peutEtreAnnulee
} from '../../data/intervention.data.js';
import { Dialog, confirmerAction, createOrderTimeline, notify, DropdownList } from '../../shared/index.js';
import { chargerDonnees } from './intervention.list.js';
import { afficherSucces, afficherErreur } from './intervention.main.js';

// Variable globale pour stocker l'intervention en cours
let interventionActuelle = null;

// Variables pour les dropdowns d'édition
let dropdownEditMarque = null;
let dropdownEditResultat = null;

// ========================================
// DÉTAIL INTERVENTION
// ========================================

export async function voirDetailIntervention(interventionId) {
    try {
        const intervention = await InterventionService.getIntervention(interventionId);
        if (!intervention) return;
        
        interventionActuelle = intervention;
        creerModalSiNecessaire();
        afficherDetailIntervention(intervention);
        window.modalManager.open('modalDetailIntervention');
        
    } catch (error) {
        console.error('Erreur chargement détail:', error);
        afficherErreur('Erreur lors du chargement des détails');
    }
}

function afficherDetailIntervention(intervention) {
    // Numéro d'intervention
    const detailNum = document.getElementById('detailNumIntervention');
    if (detailNum) {
        detailNum.textContent = intervention.numeroIntervention;
    }
    
    // Timeline du statut
    const timelineContainer = document.getElementById('timeline');
    if (timelineContainer) {
        timelineContainer.innerHTML = '';
        
        // Créer une timeline simple pour les statuts d'intervention
        const statuts = ['nouvelle', 'en_cours', 'terminee'];
        const indexActuel = statuts.indexOf(intervention.statut);
        
        const timeline = document.createElement('div');
        timeline.className = 'timeline-horizontal';
        
        statuts.forEach((statut, index) => {
            const step = document.createElement('div');
            step.className = 'timeline-step';
            
            if (index < indexActuel) {
                step.classList.add('completed');
            } else if (index === indexActuel) {
                step.classList.add('active');
            }
            
            const config = INTERVENTION_CONFIG.STATUTS[statut];
            step.innerHTML = `
                <div class="timeline-icon">${config.icon}</div>
                <div class="timeline-label">${config.label}</div>
            `;
            
            timeline.appendChild(step);
        });
        
        timelineContainer.appendChild(timeline);
    }
    
    // Informations client
    const detailClient = document.getElementById('detailClient');
    if (detailClient) {
        detailClient.innerHTML = `
            <div class="detail-info-compact">
                <div class="info-row">
                    <span class="detail-label">Nom :</span>
                    <span class="detail-value">${intervention.client.prenom} ${intervention.client.nom}</span>
                </div>
                <div class="info-row">
                    <span class="detail-label">Tél :</span>
                    <span class="detail-value">${intervention.client.telephone || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="detail-label">Email :</span>
                    <span class="detail-value">${intervention.client.email || '-'}</span>
                </div>
                <div class="info-row">
                    <span class="detail-label">Magasin :</span>
                    <span class="detail-value">${intervention.magasin || '-'}</span>
                </div>
            </div>
        `;
    }
    
    // Informations appareil
    const detailAppareil = document.getElementById('detailAppareil');
    if (detailAppareil) {
        const typeConfig = INTERVENTION_CONFIG.TYPES_APPAREILS[intervention.appareil.type];
        detailAppareil.innerHTML = `
            <div class="detail-info-compact">
                <div class="info-row">
                    <span class="detail-label">Type :</span>
                    <span class="detail-value">${typeConfig?.icon} ${typeConfig?.label}</span>
                </div>
                <div class="info-row">
                    <span class="detail-label">Marque :</span>
                    <span class="detail-value">${intervention.appareil.marque}</span>
                </div>
                ${intervention.appareil.modele ? `
                    <div class="info-row">
                        <span class="detail-label">Modèle :</span>
                        <span class="detail-value">${intervention.appareil.modele}</span>
                    </div>
                ` : ''}
                ${intervention.appareil.numeroSerie ? `
                    <div class="info-row">
                        <span class="detail-label">N° Série :</span>
                        <span class="detail-value"><code>${intervention.appareil.numeroSerie}</code></span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Diagnostic et actions
    const detailDiagnostic = document.getElementById('detailDiagnostic');
    if (detailDiagnostic) {
        const problemesHtml = intervention.problemes.map(p => {
            const config = Object.entries(INTERVENTION_CONFIG.PROBLEMES)
                .find(([key, val]) => val.label.includes(p));
            return config ? `<li>${config[1].icon} ${config[1].label}</li>` : `<li>${p}</li>`;
        }).join('');
        
        const actionsHtml = intervention.actions.map(a => {
            const config = Object.entries(INTERVENTION_CONFIG.ACTIONS)
                .find(([key, val]) => val.label.includes(a));
            return config ? `<li>${config[1].icon} ${config[1].label}</li>` : `<li>${a}</li>`;
        }).join('');
        
        detailDiagnostic.innerHTML = `
            <div class="diagnostic-section">
                <h4>Problèmes identifiés :</h4>
                <ul class="diagnostic-list">${problemesHtml}</ul>
            </div>
            <div class="diagnostic-section">
                <h4>Actions réalisées :</h4>
                <ul class="diagnostic-list">${actionsHtml || '<li>Aucune action enregistrée</li>'}</ul>
            </div>
        `;
    }
    
    // Résultat et observations
    const detailResultat = document.getElementById('detailResultat');
    if (detailResultat) {
        const resultatConfig = INTERVENTION_CONFIG.RESULTATS[intervention.resultat];
        
        detailResultat.innerHTML = `
            ${intervention.statut === 'nouvelle' || intervention.statut === 'en_cours' ? `
                <button class="btn btn-icon btn-sm btn-primary section-edit-icon" 
                        onclick="window.editerResultat()" 
                        title="Modifier le résultat">✏️</button>
            ` : ''}
            
            <div id="resultatReadOnly">
                <div class="detail-info-compact">
                    <div class="info-row">
                        <span class="detail-label">Résultat :</span>
                        <span class="detail-value">
                            ${resultatConfig ? 
                                `<span class="badge badge-resultat-${intervention.resultat.toLowerCase()}">
                                    ${resultatConfig.icon} ${resultatConfig.label}
                                </span>` : 
                                intervention.resultat || '-'}
                        </span>
                    </div>
                    ${intervention.observations ? `
                        <div class="info-row">
                            <span class="detail-label">Observations :</span>
                            <span class="detail-value">${intervention.observations}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="edit-form" id="resultatEditForm">
                <div class="edit-form-group">
                    <label>Résultat *</label>
                    <div id="editResultat"></div>
                </div>
                <div class="edit-form-group">
                    <label>Observations</label>
                    <textarea id="editObservations" rows="3">${intervention.observations || ''}</textarea>
                </div>
                <div class="edit-actions">
                    <button class="btn btn-secondary" onclick="window.annulerEditionResultat()">Annuler</button>
                    <button class="btn btn-primary" onclick="window.sauvegarderResultat()">Sauvegarder</button>
                </div>
            </div>
        `;
    }
    
    // Signatures si terminée
    const sectionSignatures = document.getElementById('sectionSignatures');
    if (sectionSignatures) {
        if (intervention.statut === 'terminee' && intervention.signatures) {
            sectionSignatures.style.display = 'block';
            
            const detailSignatures = document.getElementById('detailSignatures');
            if (detailSignatures) {
                detailSignatures.innerHTML = `
                    <div class="signatures-grid">
                        ${intervention.signatures.client ? `
                            <div class="signature-box">
                                <h5>Signature client</h5>
                                <img src="${intervention.signatures.client}" alt="Signature client" 
                                     style="max-width: 200px; border: 1px solid #dee2e6;">
                                <p class="text-muted mt-2">
                                    ${new Date(intervention.dates.signatureClient).toLocaleString('fr-FR')}
                                </p>
                            </div>
                        ` : ''}
                        ${intervention.signatures.intervenant ? `
                            <div class="signature-box">
                                <h5>Signature intervenant</h5>
                                <img src="${intervention.signatures.intervenant}" alt="Signature intervenant" 
                                     style="max-width: 200px; border: 1px solid #dee2e6;">
                                <p class="text-muted mt-2">
                                    ${new Date(intervention.dates.signatureIntervenant).toLocaleString('fr-FR')}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        } else {
            sectionSignatures.style.display = 'none';
        }
    }
    
    // Actions disponibles
    afficherActionsIntervention(intervention);
}

// ========================================
// ACTIONS SELON LE STATUT
// ========================================

function afficherActionsIntervention(intervention) {
    const detailActions = document.getElementById('detailActions');
    if (!detailActions) return;
    
    let actions = [];
    
    switch (intervention.statut) {
        case 'nouvelle':
            actions.push(`
                <button class="btn btn-primary" onclick="window.demarrerIntervention('${intervention.id}')">
                    ▶️ Démarrer l'intervention
                </button>
            `);
            break;
            
        case 'en_cours':
            actions.push(`
                <button class="btn btn-success" onclick="window.terminerIntervention('${intervention.id}')">
                    ✅ Terminer l'intervention
                </button>
            `);
            
            if (intervention.resultat === 'SAV') {
                actions.push(`
                    <button class="btn btn-warning" onclick="window.envoyerSAVDetail('${intervention.id}')">
                        📧 Envoyer l'escalade SAV
                    </button>
                `);
            }
            break;
            
        case 'terminee':
            actions.push(`
                <button class="btn btn-secondary" onclick="window.imprimerIntervention('${intervention.id}')">
                    🖨️ Imprimer le rapport
                </button>
            `);
            break;
    }
    
    // Toujours possible d'annuler sauf si déjà annulée
    if (intervention.statut !== 'annulee') {
        actions.push(`
            <button class="btn btn-danger" onclick="window.annulerIntervention('${intervention.id}')">
                ❌ Annuler l'intervention
            </button>
        `);
    }
    
    detailActions.innerHTML = actions.join('');
}

// ========================================
// CHANGEMENT DE STATUT
// ========================================

window.demarrerIntervention = async function(interventionId) {
    try {
        const confirme = await confirmerAction({
            titre: 'Démarrer l\'intervention',
            message: 'Confirmer le démarrage de l\'intervention ?',
            boutonConfirmer: 'Démarrer',
            boutonAnnuler: 'Annuler',
            danger: false
        });
        
        if (confirme) {
            await InterventionService.changerStatut(interventionId, 'en_cours');
            await chargerDonnees();
            await voirDetailIntervention(interventionId);
            afficherSucces('Intervention démarrée');
        }
    } catch (error) {
        console.error('Erreur démarrage intervention:', error);
        afficherErreur('Erreur lors du démarrage de l\'intervention');
    }
};

window.terminerIntervention = async function(interventionId) {
    try {
        // Vérifier que le résultat est renseigné
        if (!interventionActuelle.resultat) {
            await Dialog.alert('Veuillez renseigner le résultat avant de terminer', 'Résultat requis');
            return;
        }
        
        const confirme = await confirmerAction({
            titre: 'Terminer l\'intervention',
            message: 'L\'intervention sera marquée comme terminée. Les signatures seront requises.',
            boutonConfirmer: 'Terminer',
            boutonAnnuler: 'Annuler',
            danger: false
        });
        
        if (confirme) {
            // Sauvegarder les données pour la signature
            localStorage.setItem('sav_intervention_data', JSON.stringify({
                interventionId,
                ...interventionActuelle
            }));
            
            // Rediriger vers la signature client
            window.location.href = 'signature-client.html';
        }
    } catch (error) {
        console.error('Erreur fin intervention:', error);
        afficherErreur('Erreur lors de la fin de l\'intervention');
    }
};

window.annulerIntervention = async function(interventionId) {
    try {
        const result = await new Promise((resolve) => {
            const dialogHtml = `
                <div class="dialog-overlay"></div>
                <div class="dialog-box">
                    <div class="dialog-header">
                        <div class="dialog-icon danger">❌</div>
                        <h3 class="dialog-title">Annuler l'intervention</h3>
                    </div>
                    <div class="dialog-body">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">
                                Motif d'annulation *
                            </label>
                            <textarea id="motifAnnulation" 
                                      placeholder="Précisez la raison de l'annulation..." 
                                      rows="3"
                                      style="width: 100%; padding: 8px; border: 2px solid #e0e0e0; 
                                             border-radius: 6px; box-sizing: border-box; resize: vertical;"
                                      required></textarea>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="dialog-btn secondary annulation-cancel">Annuler</button>
                        <button class="dialog-btn danger annulation-confirm">Confirmer l'annulation</button>
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
            
            const motifTextarea = document.getElementById('motifAnnulation');
            const confirmBtn = document.querySelector('.annulation-confirm');
            const cancelBtn = document.querySelector('.annulation-cancel');
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
                
                resolve({ motif });
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
        });
        
        if (result && result.motif) {
            await InterventionService.changerStatut(interventionId, 'annulee', {
                motifAnnulation: result.motif
            });
            
            await chargerDonnees();
            window.modalManager.close('modalDetailIntervention');
            
            afficherSucces('Intervention annulée');
        }
    } catch (error) {
        console.error('Erreur annulation:', error);
        afficherErreur('Erreur lors de l\'annulation');
    }
};

// ========================================
// ÉDITION DU RÉSULTAT
// ========================================

window.editerResultat = function() {
    const section = document.querySelector('#detailResultat').parentElement;
    section.classList.add('editing');
    
    document.getElementById('resultatReadOnly').style.display = 'none';
    document.getElementById('resultatEditForm').classList.add('active');
    
    // Créer le dropdown résultat
    const optionsResultat = Object.entries(INTERVENTION_CONFIG.RESULTATS).map(([key, config]) => ({
        value: key,
        label: config.label,
        icon: config.icon
    }));
    
    dropdownEditResultat = new DropdownList({
        container: '#editResultat',
        placeholder: 'Sélectionner un résultat',
        options: optionsResultat,
        value: interventionActuelle.resultat,
        showIcons: true,
        onChange: (value) => {
            // Si SAV sélectionné, afficher un message
            if (value === 'SAV') {
                notify.info('Une escalade SAV sera nécessaire');
            }
        }
    });
};

window.annulerEditionResultat = function() {
    const section = document.querySelector('#detailResultat').parentElement;
    section.classList.remove('editing');
    
    document.getElementById('resultatReadOnly').style.display = 'block';
    document.getElementById('resultatEditForm').classList.remove('active');
    
    if (dropdownEditResultat) {
        dropdownEditResultat.destroy();
        dropdownEditResultat = null;
    }
};

window.sauvegarderResultat = async function() {
    try {
        const updates = {
            resultat: dropdownEditResultat ? dropdownEditResultat.getValue() : '',
            observations: document.getElementById('editObservations').value
        };
        
        await InterventionService.mettreAJourIntervention(interventionActuelle.id, updates);
        
        annulerEditionResultat();
        await voirDetailIntervention(interventionActuelle.id);
        notify.success('Résultat mis à jour');
        
    } catch (error) {
        console.error('Erreur sauvegarde résultat:', error);
        notify.error('Erreur lors de la sauvegarde');
    }
};

// ========================================
// ACTIONS SPÉCIFIQUES
// ========================================

window.envoyerSAVDetail = async function(interventionId) {
    try {
        const intervention = await InterventionService.getIntervention(interventionId);
        if (!intervention) return;
        
        const confirme = await Dialog.confirm(
            'Confirmer l\'envoi de l\'escalade SAV aux assistantes ?',
            'Envoi SAV'
        );
        
        if (!confirme) return;
        
        // Utiliser EmailJS comme dans intervention.form.js
        const templateParams = {
            to_email: 'korber@BROKERAUDIOLOGIE88.onmicrosoft.com',
            reply_to: 'noreply@orixis.fr',
            
            // Informations générales
            magasin: intervention.magasin || 'Non spécifié',
            intervenant: intervention.intervenant ? 
                `${intervention.intervenant.prenom} ${intervention.intervenant.nom}` : 
                'Non spécifié',
            date: new Date(intervention.dates.intervention).toLocaleDateString('fr-FR'),
            heure: new Date(intervention.dates.intervention).toLocaleTimeString('fr-FR', {
                hour: '2-digit', 
                minute: '2-digit'
            }),
            
            // Informations client
            nom_client: `${intervention.client.prenom} ${intervention.client.nom}`,
            telephone: intervention.client.telephone || 'Non renseigné',
            
            // Informations intervention
            numero_intervention: intervention.numeroIntervention,
            type_appareil: intervention.appareil.type,
            marque: intervention.appareil.marque,
            modele: intervention.appareil.modele || 'Non spécifié',
            numero_serie: intervention.appareil.numeroSerie || 'Non spécifié',
            
            // Problèmes et actions
            probleme: intervention.problemes.join(', ') || 'Non spécifié',
            actions: intervention.actions.join(', ') || 'Aucune action',
            
            // Résultat et observations
            resultat: INTERVENTION_CONFIG.RESULTATS[intervention.resultat]?.label || intervention.resultat,
            observations: intervention.observations || 'Aucune observation'
        };
        
        await emailjs.send('service_6juwjvq', 'template_51rhrbr', templateParams);
        
        notify.success('✅ Escalade SAV envoyée avec succès !');
        
        // Mettre à jour l'intervention
        await InterventionService.mettreAJourIntervention(interventionId, {
            savEnvoye: true,
            dateSavEnvoye: new Date()
        });
        
    } catch (error) {
        console.error('Erreur envoi SAV:', error);
        notify.error('Erreur lors de l\'envoi SAV');
    }
};

window.imprimerIntervention = function(interventionId) {
    // Ouvrir la page d'impression avec l'ID de l'intervention
    window.open(`print-preview.html?intervention=${interventionId}`, '_blank');
};

// ========================================
// CRÉATION DYNAMIQUE DU MODAL
// ========================================

function creerModalSiNecessaire() {
    if (document.getElementById('modalDetailIntervention')) {
        return;
    }
    
    // Le modal est maintenant créé depuis le HTML
    console.warn('Modal détail intervention devrait être dans le HTML');
}

// ========================================
// EXPOSITION GLOBALE
// ========================================

window.voirDetailIntervention = voirDetailIntervention;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Création du module
   - Architecture basée sur commandes.detail.js
   - Gestion des actions selon le statut
   - Édition du résultat avec DropdownList
   - Envoi SAV avec EmailJS
   - Redirection vers signatures
   
   NOTES POUR REPRISES FUTURES:
   - Le modal est dans le HTML (intervention.html)
   - Les signatures sont gérées dans signature-client.html
   - L'envoi SAV utilise EmailJS comme dans form.js
   - L'impression ouvre print-preview.html
   ======================================== */