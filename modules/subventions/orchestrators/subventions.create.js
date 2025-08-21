// ========================================
// SUBVENTIONS.CREATE.JS - Gestion de la création de dossiers MDPH/AGEFIPH
// Chemin: modules/subventions/orchestrators/subventions.create.js
//
// DESCRIPTION:
// Module de création de dossiers de subvention avec workflow par étapes
// Basé sur le modèle du module commandes qui fonctionne
//
// ARCHITECTURE:
// - 4 étapes avec Timeline
// - SearchDropdown pour la recherche patient
// - Validation progressive
// ========================================

// ========================================
// IMPORTS
// ========================================

import config from '../core/subventions.config.js';
import { ClientsService } from '../../../src/services/clients.service.js';
import { Timeline } from '../../../src/components/ui/timeline/timeline.component.js';

// ========================================
// CONFIGURATION DES ÉTAPES
// ========================================

const ETAPES_CREATION = [
    { label: 'Patient', icon: '👤' },
    { label: 'Type dossier', icon: '📋' },
    { label: 'Informations', icon: '📝' },
    { label: 'Validation', icon: '✅' }
];

// ========================================
// ÉTAT LOCAL DU MODULE
// ========================================

let etapeActuelle = 1;
let nouveauDossier = {
    // Patient
    patientId: null,
    patient: null,
    
    // Type de dossier
    typeDossier: 'mdph_agefiph',
    
    // Situation professionnelle
    situationPro: '',
    
    // Montants
    montantAppareil: 3500,
    
    // Notes
    notes: '',
    
    // Dates
    dateCreation: new Date()
};

// Instances des composants
let patientSearchDropdown = null;
let dropdownSituation = null;
let timeline = null;

// Exposer l'état pour le module principal
window.subventionCreateState = { nouveauDossier };

// ========================================
// INITIALISATION DU MODULE
// ========================================

export function initCreationSubvention() {
    // Exposer les fonctions globales
    window.resetNouveauDossier = resetNouveauDossier;
    
    console.log('✅ Module création subvention initialisé');
}

// ========================================
// OUVERTURE NOUVEAU DOSSIER
// ========================================

export function ouvrirNouveauDossier() {
    console.log('📋 Ouverture nouveau dossier subvention');
    
    // Réinitialiser l'état
    resetNouveauDossier();
    
    // Créer la modal si elle n'existe pas
    if (!document.getElementById('modalNouveauDossier')) {
        createModalHTML();
    }
    
    // Ouvrir la modal
    config.modalManager.register('modalNouveauDossier', {
        closeOnOverlayClick: false,
        closeOnEscape: true,
        onBeforeClose: async () => {
            if (window.skipConfirmation) {
                window.skipConfirmation = false;
                return true;
            }
            
            if (nouveauDossier.patientId || nouveauDossier.montantAppareil !== 3500) {
                return await config.Dialog.confirm(
                    'Voulez-vous vraiment fermer ? Les données non sauvegardées seront perdues.'
                );
            }
            return true;
        }
    });
    
    config.modalManager.open('modalNouveauDossier');
    
    // Afficher l'étape 1 après ouverture
    setTimeout(() => {
        afficherEtape(1);
    }, 100);
}

// ========================================
// CRÉATION DU HTML DE LA MODAL
// ========================================

function createModalHTML() {
    const modalHTML = `
        <div id="modalNouveauDossier" class="modal" style="display: none;">
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h2>Nouveau Dossier de Subvention</h2>
                    <button class="modal-close">&times;</button>
                </div>
                
                <!-- Timeline ENTRE header et body comme dans commandes -->
                <div class="timeline-container" style="margin: 20px 0;">
                    <div class="timeline" id="timeline-nouveau-dossier"></div>
                </div>
                
                <div class="modal-body">
                    <!-- ÉTAPE 1 : Sélection patient -->
                    <div class="step-content" id="stepContent1">
                        <h3>Sélection du patient</h3>
                        
                        <!-- Recherche avec CLASSE comme dans commandes -->
                        <div class="patient-search">
                            <!-- SearchDropdown sera initialisé ici -->
                        </div>
                        
                        <!-- Patient sélectionné (caché par défaut) -->
                        <div class="patient-selected" id="patientSelected" style="display: none;">
                            <h4>Patient sélectionné :</h4>
                            <div class="patient-card" style="
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                border-radius: 12px;
                                padding: 20px;
                                color: white;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                
                                <div style="display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <p style="margin: 0 0 8px 0; font-size: 1.2rem; font-weight: 600;">
                                            <span id="selectedPatientName"></span>
                                        </p>
                                        <p style="margin: 0; opacity: 0.9;" id="selectedPatientInfo"></p>
                                    </div>
                                    <button type="button" class="btn-link" onclick="changerPatient()"
                                            style="background: rgba(255,255,255,0.2); 
                                                   border: 1px solid rgba(255,255,255,0.3);
                                                   color: white; padding: 6px 16px; 
                                                   border-radius: 20px;">
                                        Changer
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Alerte éligibilité -->
                            <div id="patientEligibilite" style="margin-top: 15px;"></div>
                        </div>
                        
                        <div class="divider" style="text-align: center; margin: 30px 0; color: #999;">
                            OU
                        </div>
                        
                        <button class="btn btn-secondary btn-with-icon pill" onclick="ouvrirNouveauPatient()">
                            <span>➕</span> Créer un nouveau patient
                        </button>
                    </div>
                    
                    <!-- ÉTAPE 2 : Type de dossier -->
                    <div class="step-content hidden" id="stepContent2">
                        <h3>Type de dossier</h3>
                        
                        <div class="radio-group" style="display: flex; flex-direction: column; gap: 15px;">
                            <label class="radio-card" style="cursor: pointer;">
                                <input type="radio" name="typeDossier" value="mdph_agefiph" checked
                                       style="display: none;">
                                <div class="radio-content" style="
                                    border: 2px solid #e0e0e0;
                                    border-radius: 12px;
                                    padding: 20px;
                                    transition: all 0.3s;">
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <span style="font-size: 30px;">📋</span>
                                        <div>
                                            <strong style="font-size: 1.1rem;">MDPH + AGEFIPH</strong>
                                            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">
                                                Dossier complet avec demande RQTH/PCH et financement AGEFIPH
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="radio-card" style="cursor: pointer;">
                                <input type="radio" name="typeDossier" value="mdph_pch"
                                       style="display: none;">
                                <div class="radio-content" style="
                                    border: 2px solid #e0e0e0;
                                    border-radius: 12px;
                                    padding: 20px;
                                    transition: all 0.3s;">
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <span style="font-size: 30px;">🏥</span>
                                        <div>
                                            <strong style="font-size: 1.1rem;">MDPH avec PCH uniquement</strong>
                                            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">
                                                Patient ayant déjà la RQTH, demande PCH uniquement
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="radio-card" style="cursor: pointer;">
                                <input type="radio" name="typeDossier" value="mdph_seul"
                                       style="display: none;">
                                <div class="radio-content" style="
                                    border: 2px solid #e0e0e0;
                                    border-radius: 12px;
                                    padding: 20px;
                                    transition: all 0.3s;">
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <span style="font-size: 30px;">📄</span>
                                        <div>
                                            <strong style="font-size: 1.1rem;">MDPH seul</strong>
                                            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">
                                                Uniquement la demande MDPH (sans AGEFIPH)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <!-- ÉTAPE 3 : Informations -->
                    <div class="step-content hidden" id="stepContent3">
                        <h3>Informations complémentaires</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Situation professionnelle *</label>
                                <div id="situationPro"></div>
                            </div>
                            
                            <div class="form-group">
                                <label>Montant de l'appareil (€) *</label>
                                <input type="number" id="montantAppareil" 
                                       value="${nouveauDossier.montantAppareil}"
                                       min="0" step="0.01" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes internes (optionnel)</label>
                            <textarea id="notes" rows="4"
                                      placeholder="Informations particulières sur ce dossier..."></textarea>
                        </div>
                    </div>
                    
                    <!-- ÉTAPE 4 : Validation -->
                    <div class="step-content hidden" id="stepContent4">
                        <h3>Récapitulatif du dossier</h3>
                        
                        <div class="recap-section" style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <h4 style="color: #667eea; margin-bottom: 15px;">Patient</h4>
                            <div id="recapPatient"></div>
                        </div>
                        
                        <div class="recap-section" style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <h4 style="color: #667eea; margin-bottom: 15px;">Type de dossier</h4>
                            <div id="recapType"></div>
                        </div>
                        
                        <div class="recap-section" style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
                            <h4 style="color: #667eea; margin-bottom: 15px;">Informations</h4>
                            <div id="recapInfos"></div>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary pill" id="btnPrevStep" 
                            onclick="etapePrecedente()" disabled>
                        ← Précédent
                    </button>
                    <button class="btn btn-primary pill" id="btnNextStep" 
                            onclick="etapeSuivante()">
                        Suivant →
                    </button>
                    <button class="btn btn-success pill hidden" id="btnValiderDossier" 
                            onclick="validerDossier()">
                        ✓ Créer le dossier
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter au body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Ajouter les styles pour les radio cards
    addModalStyles();
}

// ========================================
// GESTION DES ÉTAPES
// ========================================

function afficherEtape(etape) {
    etapeActuelle = etape;
    
    console.log(`📍 Affichage étape ${etape}`);
    
    // Masquer toutes les étapes
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
    
    // Gérer la timeline (comme dans commandes)
    updateTimeline(etape);
    
    // Gérer les boutons
    const btnPrev = document.getElementById('btnPrevStep');
    const btnNext = document.getElementById('btnNextStep');
    const btnValidate = document.getElementById('btnValiderDossier');
    
    if (btnPrev) btnPrev.disabled = etape === 1;
    if (btnNext) btnNext.style.display = etape < 4 ? 'block' : 'none';
    if (btnValidate) btnValidate.classList.toggle('hidden', etape !== 4);
    
    // Actions spécifiques par étape
    switch (etape) {
        case 1:
            // Initialiser la recherche patient
            setTimeout(() => {
                initPatientSearch();
            }, 100);
            break;
            
        case 2:
            // Radio cards déjà dans le HTML
            initRadioCards();
            break;
            
        case 3:
            // Charger les options de situation
            chargerSituations();
            break;
            
        case 4:
            // Afficher le récapitulatif
            afficherRecapitulatif();
            break;
    }
}

// ========================================
// TIMELINE (COMME DANS COMMANDES)
// ========================================

function updateTimeline(etapeActive) {
    // Détruire l'ancienne timeline
    if (timeline) {
        try {
            timeline.destroy();
        } catch (e) {
            console.warn('Timeline destroy error:', e);
        }
        timeline = null;
    }
    
    // Container pour la timeline
    const timelineContainer = document.querySelector('#modalNouveauDossier .timeline-container');
    if (!timelineContainer) {
        console.error('❌ Container timeline non trouvé');
        return;
    }
    
    // Vider et recréer le contenu
    timelineContainer.innerHTML = '<div class="timeline" id="timeline-nouveau-dossier"></div>';
    
    // Créer les items
    const items = ETAPES_CREATION.map((etapeData, index) => {
        const stepNumber = index + 1;
        let status = 'pending';
        
        if (stepNumber < etapeActive) {
            status = 'completed';
        } else if (stepNumber === etapeActive) {
            status = 'active';
        }
        
        return {
            id: `step${stepNumber}`,
            label: etapeData.label,
            icon: etapeData.icon,
            status: status
        };
    });
    
    // Créer la nouvelle timeline
    try {
        timeline = new Timeline({
            container: '#timeline-nouveau-dossier',
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
                    afficherEtape(targetStep);
                }
            }
        });
        
        console.log(`✅ Timeline créée pour étape ${etapeActive}`);
        
    } catch (error) {
        console.error('❌ Erreur création timeline:', error);
    }
}

// ========================================
// ÉTAPE 1 : RECHERCHE PATIENT
// ========================================

function initPatientSearch() {
    // Détruire l'ancienne instance
    if (patientSearchDropdown) {
        patientSearchDropdown.destroy();
    }
    
    // IMPORTANT : Utiliser un sélecteur STRING comme dans commandes
    patientSearchDropdown = config.createSearchDropdown('.patient-search', {
        placeholder: 'Rechercher un patient (nom, prénom, téléphone...)',
        onSearch: async (query) => {
            try {
                return await ClientsService.rechercherClients(query);
            } catch (error) {
                console.error('Erreur recherche patient:', error);
                throw error;
            }
        },
        onSelect: (patient) => {
            selectionnerPatient(patient.id);
        },
        renderItem: (patient) => {
            return `
                <div style="padding: 10px;">
                    <strong>${patient.nom} ${patient.prenom}</strong>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">
                        ${patient.telephone || ''} 
                        ${patient.email ? '• ' + patient.email : ''}
                    </div>
                </div>
            `;
        }
    });
}

export async function selectionnerPatient(patientId) {
    try {
        const patient = await ClientsService.getClient(patientId);
        if (patient) {
            nouveauDossier.patientId = patientId;
            nouveauDossier.patient = patient;
            
            // Masquer la recherche
            const searchContainer = document.querySelector('.patient-search');
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }
            
            // Afficher le patient sélectionné
            const patientSelected = document.getElementById('patientSelected');
            if (patientSelected) {
                patientSelected.style.display = 'block';
            }
            
            // Remplir les infos
            const selectedPatientName = document.getElementById('selectedPatientName');
            if (selectedPatientName) {
                selectedPatientName.textContent = `${patient.prenom} ${patient.nom}`;
            }
            
            const selectedPatientInfo = document.getElementById('selectedPatientInfo');
            if (selectedPatientInfo) {
                let infoText = [];
                if (patient.telephone) infoText.push(`📱 ${patient.telephone}`);
                if (patient.email) infoText.push(`✉️ ${patient.email}`);
                selectedPatientInfo.innerHTML = infoText.join(' • ');
            }
            
            // Vérifier l'éligibilité si on a la situation
            if (patient.situation) {
                checkEligibilite(patient.situation);
            }
        }
    } catch (error) {
        console.error('Erreur sélection patient:', error);
        config.notify.error('Erreur lors de la sélection du patient');
    }
}

export function changerPatient() {
    nouveauDossier.patientId = null;
    nouveauDossier.patient = null;
    
    // Afficher la recherche
    const searchContainer = document.querySelector('.patient-search');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }
    
    // Masquer le patient sélectionné
    const patientSelected = document.getElementById('patientSelected');
    if (patientSelected) {
        patientSelected.style.display = 'none';
    }
    
    // Clear le SearchDropdown
    if (patientSearchDropdown) {
        patientSearchDropdown.clear();
    }
}

// ========================================
// ÉTAPE 2 : TYPE DE DOSSIER
// ========================================

function initRadioCards() {
    // Gérer le style des radio cards
    const radioCards = document.querySelectorAll('.radio-card');
    
    radioCards.forEach(card => {
        const input = card.querySelector('input[type="radio"]');
        const content = card.querySelector('.radio-content');
        
        // État initial
        if (input.checked) {
            content.style.borderColor = '#667eea';
            content.style.background = '#f8f9ff';
        }
        
        // Au clic
        card.addEventListener('click', () => {
            // Reset tous les cards
            document.querySelectorAll('.radio-content').forEach(c => {
                c.style.borderColor = '#e0e0e0';
                c.style.background = 'white';
            });
            
            // Activer celui-ci
            input.checked = true;
            content.style.borderColor = '#667eea';
            content.style.background = '#f8f9ff';
            
            // Sauvegarder la valeur
            nouveauDossier.typeDossier = input.value;
        });
    });
}

// ========================================
// ÉTAPE 3 : INFORMATIONS
// ========================================

function chargerSituations() {
    const situations = [
        { value: 'salarie', label: 'Salarié' },
        { value: 'independant', label: 'Indépendant' },
        { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
        { value: 'retraite', label: 'Retraité' },
        { value: 'etudiant', label: 'Étudiant' }
    ];
    
    // Créer le dropdown
    dropdownSituation = config.createDropdown('#situationPro', {
        placeholder: '-- Sélectionner --',
        options: situations,
        value: nouveauDossier.situationPro,
        onChange: (value) => {
            nouveauDossier.situationPro = value;
            checkEligibilite(value);
        }
    });
    
    // Listeners pour le montant
    const montantInput = document.getElementById('montantAppareil');
    if (montantInput) {
        montantInput.addEventListener('change', (e) => {
            nouveauDossier.montantAppareil = parseFloat(e.target.value) || 0;
        });
    }
    
    // Listeners pour les notes
    const notesInput = document.getElementById('notes');
    if (notesInput) {
        notesInput.addEventListener('change', (e) => {
            nouveauDossier.notes = e.target.value;
        });
    }
}

function checkEligibilite(situation) {
    const alertDiv = document.getElementById('patientEligibilite');
    if (!alertDiv) return;
    
    const eligible = situation === 'salarie' || situation === 'independant';
    
    if (!eligible) {
        alertDiv.innerHTML = `
            <div style="background: #fff3cd; border: 1px solid #ffc107; 
                        border-radius: 8px; padding: 12px; color: #856404;">
                ⚠️ <strong>Attention :</strong> Non éligible AGEFIPH
            </div>
        `;
        
        // Forcer MDPH seul
        const radioMdphSeul = document.querySelector('input[value="mdph_seul"]');
        if (radioMdphSeul) {
            radioMdphSeul.click();
        }
    } else {
        alertDiv.innerHTML = `
            <div style="background: #d4edda; border: 1px solid #28a745; 
                        border-radius: 8px; padding: 12px; color: #155724;">
                ✅ Éligible MDPH et AGEFIPH
            </div>
        `;
    }
}

// ========================================
// ÉTAPE 4 : RÉCAPITULATIF
// ========================================

function afficherRecapitulatif() {
    // Patient
    const recapPatient = document.getElementById('recapPatient');
    if (recapPatient && nouveauDossier.patient) {
        recapPatient.innerHTML = `
            <p><strong>${nouveauDossier.patient.prenom} ${nouveauDossier.patient.nom}</strong></p>
            <p>${nouveauDossier.patient.telephone || ''}</p>
            <p>${nouveauDossier.patient.email || ''}</p>
        `;
    }
    
    // Type
    const recapType = document.getElementById('recapType');
    if (recapType) {
        const typeLabels = {
            'mdph_agefiph': 'MDPH + AGEFIPH',
            'mdph_pch': 'MDPH avec PCH uniquement',
            'mdph_seul': 'MDPH seul'
        };
        recapType.innerHTML = `<p>${typeLabels[nouveauDossier.typeDossier]}</p>`;
    }
    
    // Infos
    const recapInfos = document.getElementById('recapInfos');
    if (recapInfos) {
        const situationLabels = {
            'salarie': 'Salarié',
            'independant': 'Indépendant',
            'demandeur_emploi': 'Demandeur d\'emploi',
            'retraite': 'Retraité',
            'etudiant': 'Étudiant'
        };
        
        recapInfos.innerHTML = `
            <p><strong>Situation :</strong> ${situationLabels[nouveauDossier.situationPro] || '-'}</p>
            <p><strong>Montant appareil :</strong> ${nouveauDossier.montantAppareil.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            ${nouveauDossier.notes ? `<p><strong>Notes :</strong> ${nouveauDossier.notes}</p>` : ''}
        `;
    }
}

// ========================================
// NAVIGATION ENTRE ÉTAPES
// ========================================

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
            if (!nouveauDossier.patientId) {
                await config.Dialog.alert('Veuillez sélectionner un patient', 'Attention');
                return false;
            }
            break;
            
        case 2:
            // Type déjà sélectionné par défaut
            break;
            
        case 3:
            if (!nouveauDossier.situationPro) {
                await config.Dialog.alert('Veuillez sélectionner une situation professionnelle', 'Attention');
                return false;
            }
            if (!nouveauDossier.montantAppareil || nouveauDossier.montantAppareil <= 0) {
                await config.Dialog.alert('Veuillez indiquer le montant de l\'appareil', 'Attention');
                return false;
            }
            break;
    }
    return true;
}

// ========================================
// VALIDATION FINALE
// ========================================

export async function validerDossier() {
    try {
        // Préparer les données
        const dossierData = {
            patient: {
                id: nouveauDossier.patient.id,
                nom: nouveauDossier.patient.nom,
                prenom: nouveauDossier.patient.prenom,
                telephone: nouveauDossier.patient.telephone,
                email: nouveauDossier.patient.email
            },
            type: nouveauDossier.typeDossier,
            situation: nouveauDossier.situationPro,
            montants: {
                appareil: Math.round(nouveauDossier.montantAppareil * 100), // En centimes
                accordeMDPH: 0,
                accordeAGEFIPH: 0,
                mutuelle: 0,
                resteACharge: Math.round(nouveauDossier.montantAppareil * 100)
            },
            notes: nouveauDossier.notes,
            dateCreation: new Date()
        };
        
        // TODO : Appeler le service pour créer le dossier
        console.log('📋 Création dossier:', dossierData);
        
        // Empêcher la confirmation de fermeture
        window.skipConfirmation = true;
        
        // Fermer la modal
        config.modalManager.close('modalNouveauDossier');
        
        // Notifier
        config.notify.success('Dossier créé avec succès !');
        
        // Recharger la liste
        if (window.chargerDonnees) {
            await window.chargerDonnees();
        }
        
    } catch (error) {
        console.error('Erreur création dossier:', error);
        config.notify.error('Erreur lors de la création du dossier');
    }
}

// ========================================
// RESET
// ========================================

function resetNouveauDossier() {
    console.log('🔄 Reset nouveau dossier');
    
    etapeActuelle = 1;
    nouveauDossier = {
        patientId: null,
        patient: null,
        typeDossier: 'mdph_agefiph',
        situationPro: '',
        montantAppareil: 3500,
        notes: '',
        dateCreation: new Date()
    };
    
    // Nettoyer la timeline
    if (timeline) {
        try {
            timeline.destroy();
            timeline = null;
        } catch (e) {
            console.warn('Timeline destroy error:', e);
        }
    }
    
    // Détruire les composants
    if (patientSearchDropdown) {
        patientSearchDropdown.destroy();
        patientSearchDropdown = null;
    }
    if (dropdownSituation) {
        dropdownSituation.destroy();
        dropdownSituation = null;
    }
}

// ========================================
// STYLES ADDITIONNELS
// ========================================

function addModalStyles() {
    if (document.getElementById('subvention-modal-styles')) return;
    
    const styles = `
        <style id="subvention-modal-styles">
            .hidden { display: none !important; }
            
            .radio-card input[type="radio"]:checked + .radio-content {
                border-color: #667eea !important;
                background: #f8f9ff !important;
            }
            
            .form-row {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .form-row .form-group {
                flex: 1;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #495057;
            }
            
            .form-group input,
            .form-group textarea {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .form-group input:focus,
            .form-group textarea:focus {
                outline: none;
                border-color: #667eea;
            }
            
            #modalNouveauDossier .modal-content {
                width: 900px;
                max-width: 95%;
                height: 80vh;
                max-height: 90vh;
            }
            
            .patient-selected {
                margin: 20px 0;
            }
            
            .divider {
                position: relative;
                text-align: center;
                margin: 30px 0;
            }
            
            .divider::before,
            .divider::after {
                content: '';
                position: absolute;
                top: 50%;
                width: 45%;
                height: 1px;
                background: #e0e0e0;
            }
            
            .divider::before { left: 0; }
            .divider::after { right: 0; }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
}

// ========================================
// NOUVEAU PATIENT (STUB)
// ========================================

export function ouvrirNouveauPatient() {
    window.skipConfirmation = true;
    config.modalManager.close('modalNouveauDossier');
    
    setTimeout(() => {
        config.notify.info('Création de patient à implémenter');
        config.modalManager.open('modalNouveauDossier');
    }, 300);
}

// ========================================
// EXPORTS GLOBAUX
// ========================================

// Exposer les fonctions pour le HTML
window.etapePrecedente = etapePrecedente;
window.etapeSuivante = etapeSuivante;
window.validerDossier = validerDossier;
window.changerPatient = changerPatient;
window.ouvrirNouveauPatient = ouvrirNouveauPatient;
window.ouvrirNouveauDossier = ouvrirNouveauDossier;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date] - Refonte complète basée sur commandes
   Solution: Copier exactement la structure de commandes.create.js
   - Timeline entre header et body
   - SearchDropdown avec sélecteur string
   - 4 étapes avec navigation
   - Reset propre des composants
   
   NOTES POUR REPRISES FUTURES:
   - NE PAS passer d'élément DOM à SearchDropdown
   - TOUJOURS utiliser un sélecteur string (.classe)
   - Timeline dans son propre container
   - Détruire proprement tous les composants
   ======================================== */