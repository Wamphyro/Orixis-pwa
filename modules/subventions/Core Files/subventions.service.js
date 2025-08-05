// ========================================
// SUBVENTIONS.SERVICE.JS - Logique métier
// Chemin: modules/subventions/subventions.service.js
//
// DESCRIPTION:
// Service contenant toute la logique métier :
// - Règles de workflow
// - Calcul des alertes
// - Validation des transitions
// - Gestion des délais
// ========================================

import { subventionsData } from './subventions.data.js';
import { subventionsConfig } from './subventions.config.js';

class SubventionsService {
    constructor() {
        this.data = subventionsData;
        this.config = subventionsConfig;
    }
    
    // ========================================
    // GESTION DU WORKFLOW
    // ========================================
    
    /**
     * Vérifie si une transition est possible
     */
    canTransition(workflow, from, to) {
        const transitions = workflow === 'mdph' 
            ? this.data.workflowMDPH.transitions 
            : this.data.workflowAGEFIPH.transitions;
            
        return transitions[from] && transitions[from].includes(to);
    }
    
    /**
     * Calcule la progression d'un workflow
     */
    calculateProgression(workflow, statut) {
        const etapes = workflow === 'mdph' 
            ? this.data.workflowMDPH.etapes 
            : this.data.workflowAGEFIPH.etapes;
            
        const etape = etapes.find(e => e.id === statut);
        return etape ? etape.progression : 0;
    }
    
    /**
     * Vérifie si l'AGEFIPH peut progresser
     */
    canProgressAgefiph(dossier) {
        const agefiph = dossier.workflow.agefiph;
        const mdph = dossier.workflow.mdph;
        
        // Vérifier le blocage par récépissé
        if (agefiph.statut === 'attente_recepisse') {
            return mdph.statut === 'recepisse' || mdph.statut === 'accord';
        }
        
        // Vérifier la règle des 50%
        if (!mdph.dates.recepisse && agefiph.progression >= 50) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Obtient les documents requis pour une étape
     */
    getRequiredDocuments(workflow, statut, situation = null) {
        let documents = [];
        
        // Documents de base selon l'étape
        const etapes = workflow === 'mdph' 
            ? this.data.workflowMDPH.etapes 
            : this.data.workflowAGEFIPH.etapes;
            
        const etape = etapes.find(e => e.id === statut);
        if (etape && etape.documentsRequis) {
            documents = [...etape.documentsRequis];
        }
        
        // Ajouter documents spécifiques selon situation
        if (situation && this.data.casParticuliers[situation]) {
            const cas = this.data.casParticuliers[situation];
            if (cas.documentsSpecifiques) {
                documents.push(...cas.documentsSpecifiques);
            }
        }
        
        return documents;
    }
    
    // ========================================
    // CALCUL DES ALERTES
    // ========================================
    
    /**
     * Calcule toutes les alertes pour un ensemble de dossiers
     */
    async calculateAlertes(dossiers) {
        const alertes = [];
        const maintenant = new Date();
        
        for (const dossier of dossiers) {
            // Alertes documents manquants
            const alertesDocuments = this.checkDocumentsManquants(dossier);
            alertes.push(...alertesDocuments);
            
            // Alertes délais MDPH
            const alertesDelais = this.checkDelaisMDPH(dossier);
            alertes.push(...alertesDelais);
            
            // Alertes attestation employeur
            const alertesAttestation = this.checkAttestationEmployeur(dossier);
            alertes.push(...alertesAttestation);
            
            // Alertes récépissé
            const alertesRecepisse = this.checkRecepisse(dossier);
            alertes.push(...alertesRecepisse);
        }
        
        // Trier par priorité et date
        return alertes.sort((a, b) => {
            if (a.niveau !== b.niveau) {
                const priorites = { urgent: 0, warning: 1, info: 2 };
                return priorites[a.niveau] - priorites[b.niveau];
            }
            return a.date - b.date;
        });
    }
    
    /**
     * Vérifie les documents manquants
     */
    checkDocumentsManquants(dossier) {
        const alertes = [];
        const documentsRequis = this.getAllRequiredDocuments(dossier);
        
        for (const docType of documentsRequis) {
            const doc = dossier.documents.mdph[docType] || dossier.documents.agefiph[docType];
            
            if (!doc || doc.statut === 'manquant') {
                const joursDepuis = this.getJoursEcoules(dossier.dates.creation);
                
                if (joursDepuis >= this.config.business.alertes.abandonDossier) {
                    alertes.push({
                        dossierId: dossier.id,
                        patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                        niveau: 'urgent',
                        type: 'document_manquant',
                        message: `Document manquant depuis ${joursDepuis} jours : ${this.data.documents[docType].label}`,
                        action: 'relancer',
                        actionLabel: 'Relancer',
                        date: new Date()
                    });
                } else if (joursDepuis >= this.config.business.alertes.relanceDocuments) {
                    alertes.push({
                        dossierId: dossier.id,
                        patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                        niveau: 'warning',
                        type: 'document_manquant',
                        message: `Document manquant : ${this.data.documents[docType].label}`,
                        date: new Date()
                    });
                }
            }
        }
        
        return alertes;
    }
    
    /**
     * Vérifie les délais MDPH
     */
    checkDelaisMDPH(dossier) {
        const alertes = [];
        
        if (dossier.workflow.mdph.statut === 'depot' && dossier.workflow.mdph.dates.depot) {
            const delais = this.getDelaisDepartement(dossier.patient.adresse.departement);
            const joursEcoules = this.getJoursEcoules(dossier.workflow.mdph.dates.depot);
            
            if (joursEcoules >= delais.delai + 30) {
                alertes.push({
                    dossierId: dossier.id,
                    patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                    niveau: 'urgent',
                    type: 'retard_mdph',
                    message: `RETARD CRITIQUE : ${joursEcoules} jours (délai normal : ${delais.delai}j)`,
                    action: 'escalade',
                    actionLabel: 'Escalader',
                    date: new Date()
                });
            } else if (joursEcoules >= delais.delai) {
                alertes.push({
                    dossierId: dossier.id,
                    patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                    niveau: 'warning',
                    type: 'retard_mdph',
                    message: `Relance MDPH recommandée (J+${joursEcoules})`,
                    action: 'relancer_mdph',
                    actionLabel: 'Relancer',
                    date: new Date()
                });
            } else if (joursEcoules >= delais.alerte) {
                alertes.push({
                    dossierId: dossier.id,
                    patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                    niveau: 'info',
                    type: 'delai_mdph',
                    message: `Récépissé attendu sous ${delais.delai - joursEcoules} jours`,
                    date: new Date()
                });
            }
        }
        
        return alertes;
    }
    
    /**
     * Vérifie l'attestation employeur
     */
    checkAttestationEmployeur(dossier) {
        const alertes = [];
        
        // Si salarié et récépissé reçu
        if (dossier.patient.situation === 'salarie' && 
            dossier.workflow.mdph.statut === 'recepisse' &&
            dossier.workflow.agefiph.statut === 'attente_recepisse') {
            
            alertes.push({
                dossierId: dossier.id,
                patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                niveau: 'urgent',
                type: 'attestation_requise',
                message: 'Récépissé reçu → Demander attestation employeur MAINTENANT',
                action: 'requestAttestation',
                actionLabel: 'Demander',
                date: new Date()
            });
        }
        
        // Vérifier expiration attestation existante
        const attestation = dossier.documents.agefiph.attestation_employeur;
        if (attestation && attestation.dateEmission) {
            const joursRestants = this.getJoursRestants(
                attestation.dateEmission, 
                this.config.business.validite.attestationEmployeur
            );
            
            if (joursRestants <= 0) {
                alertes.push({
                    dossierId: dossier.id,
                    patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                    niveau: 'urgent',
                    type: 'attestation_expiree',
                    message: 'Attestation employeur EXPIRÉE',
                    action: 'requestAttestation',
                    actionLabel: 'Renouveler',
                    date: new Date()
                });
            } else if (joursRestants <= this.config.business.alertes.attestationAvantExpiration) {
                alertes.push({
                    dossierId: dossier.id,
                    patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                    niveau: 'urgent',
                    type: 'attestation_expire',
                    message: `Attestation employeur expire dans ${joursRestants} jour${joursRestants > 1 ? 's' : ''}`,
                    action: 'requestAttestation',
                    actionLabel: 'Renouveler',
                    date: new Date()
                });
            }
        }
        
        return alertes;
    }
    
    /**
     * Vérifie l'approche du récépissé
     */
    checkRecepisse(dossier) {
        const alertes = [];
        
        if (dossier.workflow.mdph.statut === 'depot' && 
            dossier.patient.situation === 'salarie') {
            
            const delais = this.getDelaisDepartement(dossier.patient.adresse.departement);
            const joursEcoules = this.getJoursEcoules(dossier.workflow.mdph.dates.depot);
            const joursRestants = delais.delai - joursEcoules;
            
            if (joursRestants <= this.config.business.alertes.recepisseMDPHAvant && 
                joursRestants > 0) {
                alertes.push({
                    dossierId: dossier.id,
                    patient: `${dossier.patient.nom} ${dossier.patient.prenom}`,
                    niveau: 'warning',
                    type: 'recepisse_proche',
                    message: `Préparer attestation employeur dans ${joursRestants} jours`,
                    date: new Date()
                });
            }
        }
        
        return alertes;
    }
    
    // ========================================
    // CALCULS DE DÉLAIS
    // ========================================
    
    /**
     * Obtient les délais pour un département
     */
    getDelaisDepartement(departement) {
        return this.data.delaisMDPH[departement] || this.data.delaisMDPH.default;
    }
    
    /**
     * Calcule le nombre de jours écoulés
     */
    getJoursEcoules(dateDebut) {
        if (!dateDebut) return 0;
        
        const debut = new Date(dateDebut);
        const maintenant = new Date();
        const diffTime = maintenant - debut;
        
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Calcule le nombre de jours restants avant expiration
     */
    getJoursRestants(dateEmission, dureeValidite) {
        if (!dateEmission) return 0;
        
        const emission = new Date(dateEmission);
        const expiration = new Date(emission);
        expiration.setDate(expiration.getDate() + dureeValidite);
        
        const maintenant = new Date();
        const diffTime = expiration - maintenant;
        
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Obtient les événements de la semaine
     */
    getWeeklyEvents(dossiers) {
        const events = [];
        const startOfWeek = this.getStartOfWeek();
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        for (const dossier of dossiers) {
            // Événements basés sur les alertes
            const alertes = this.calculateAlertes([dossier]);
            
            for (const alerte of alertes) {
                if (alerte.date >= startOfWeek && alerte.date <= endOfWeek) {
                    events.push({
                        dossierId: dossier.id,
                        date: alerte.date,
                        title: alerte.message,
                        icon: this.getEventIcon(alerte.type),
                        priority: alerte.niveau === 'urgent' ? 'high' : 'normal',
                        shortLabel: dossier.patient.nom
                    });
                }
            }
            
            // Événements planifiés (rendez-vous, etc.)
            // TODO: Ajouter la gestion des rendez-vous
        }
        
        return events;
    }
    
    // ========================================
    // VALIDATION
    // ========================================
    
    /**
     * Valide un dossier avant transition
     */
    validateTransition(dossier, workflow, newStatut) {
        const errors = [];
        
        // Vérifier les documents requis
        const documentsRequis = this.getRequiredDocuments(
            workflow, 
            dossier.workflow[workflow].statut,
            dossier.patient.situation
        );
        
        for (const docType of documentsRequis) {
            const doc = dossier.documents[workflow][docType];
            if (!doc || doc.statut !== 'valide') {
                errors.push(`Document manquant ou invalide : ${this.data.documents[docType].label}`);
            }
        }
        
        // Vérifier les règles spécifiques
        if (workflow === 'agefiph' && newStatut === 'finalisation') {
            if (!dossier.workflow.mdph.dates.recepisse) {
                errors.push('Le récépissé MDPH est requis pour finaliser l\'AGEFIPH');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Vérifie l'éligibilité d'un patient
     */
    checkEligibilite(situation) {
        const cas = this.data.casParticuliers[situation];
        if (!cas) return { eligible: false, raison: 'Situation non reconnue' };
        
        if (cas.eligible === false) {
            return { 
                eligible: false, 
                raison: cas.raison,
                alternative: cas.alternative
            };
        }
        
        if (cas.eligible === 'conditionnel') {
            return {
                eligible: true,
                conditions: cas.conditions,
                alerte: 'Éligibilité sous conditions'
            };
        }
        
        return { eligible: true };
    }
    
    // ========================================
    // HELPERS
    // ========================================
    
    /**
     * Obtient tous les documents requis pour un dossier
     */
    getAllRequiredDocuments(dossier) {
        const documents = [];
        
        // Documents MDPH selon étape
        const mdphDocs = this.getRequiredDocuments(
            'mdph', 
            dossier.workflow.mdph.statut
        );
        documents.push(...mdphDocs);
        
        // Documents AGEFIPH selon étape et situation
        const agefiDocs = this.getRequiredDocuments(
            'agefiph', 
            dossier.workflow.agefiph.statut,
            dossier.patient.situation
        );
        documents.push(...agefiDocs);
        
        return [...new Set(documents)]; // Dédoublonner
    }
    
    /**
     * Obtient le début de la semaine
     */
    getStartOfWeek() {
        const date = new Date();
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(date.setDate(diff));
        start.setHours(0, 0, 0, 0);
        return start;
    }
    
    /**
     * Obtient l'icône pour un type d'événement
     */
    getEventIcon(type) {
        const icons = {
            'document_manquant': '📄',
            'retard_mdph': '⚠️',
            'attestation_requise': '📧',
            'attestation_expire': '⏰',
            'recepisse_proche': '📮',
            'relance': '☎️',
            'default': '📌'
        };
        
        return icons[type] || icons.default;
    }
    
    /**
     * Calcule la progression globale d'un dossier
     */
    getProgressionGlobale(dossier) {
        const mdph = dossier.workflow.mdph.progression || 0;
        const agefiph = dossier.workflow.agefiph.progression || 0;
        
        return Math.round((mdph + agefiph) / 2);
    }
    
    /**
     * Détermine le statut global d'un dossier
     */
    getStatutGlobal(dossier) {
        // Si retard MDPH
        if (this.hasRetard(dossier)) {
            return 'retard';
        }
        
        // Si bloqué
        if (dossier.workflow.agefiph.bloque) {
            return 'attente';
        }
        
        // Si terminé
        if (dossier.workflow.mdph.statut === 'accord' && 
            dossier.workflow.agefiph.statut === 'decision') {
            return 'termine';
        }
        
        return 'en_cours';
    }
    
    /**
     * Vérifie si un dossier est en retard
     */
    hasRetard(dossier) {
        if (dossier.workflow.mdph.statut === 'depot' && dossier.workflow.mdph.dates.depot) {
            const delais = this.getDelaisDepartement(dossier.patient.adresse.departement);
            const joursEcoules = this.getJoursEcoules(dossier.workflow.mdph.dates.depot);
            return joursEcoules > delais.delai;
        }
        return false;
    }
}

// Export de l'instance unique
export const subventionsService = new SubventionsService();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsService;