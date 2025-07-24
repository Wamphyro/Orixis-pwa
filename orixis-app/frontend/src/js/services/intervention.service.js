// src/js/services/intervention.service.js
import { storageService } from './storage.service.js';
import { emailService } from './email.service.js';
import { authService } from './auth.service.js';
import { getCurrentDateTime } from '../utils/date.utils.js';
import { PROBLEMS, ACTIONS, INTERVENTION_RESULTS } from '../data/index.js';

class InterventionService {
    constructor() {
        this.currentIntervention = null;
    }

    /**
     * Crée une nouvelle intervention
     * @param {Object} formData 
     * @returns {Object}
     */
    createIntervention(formData) {
        const user = authService.getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Utilisateur non authentifié'
            };
        }

        const dateTime = getCurrentDateTime();
        
        const intervention = {
            ...formData,
            magasin: user.magasin,
            date: formData.date || dateTime.date,
            heure: formData.heure || dateTime.time,
            createdBy: user.magasin,
            status: 'draft'
        };

        // Sauvegarder temporairement
        storageService.setCurrentIntervention(intervention);
        this.currentIntervention = intervention;

        return {
            success: true,
            data: intervention
        };
    }

    /**
     * Ajoute les signatures à l'intervention
     * @param {string} type - 'client' ou 'intervenant'
     * @param {string} signatureData - Data URL de la signature
     * @returns {Object}
     */
    addSignature(type, signatureData) {
        const current = storageService.getCurrentIntervention();
        if (!current) {
            return {
                success: false,
                error: 'Aucune intervention en cours'
            };
        }

        if (type === 'client') {
            current.signatureClient = signatureData;
        } else if (type === 'intervenant') {
            current.signatureIntervenant = signatureData;
        }

        storageService.setCurrentIntervention(current);

        return {
            success: true,
            data: current
        };
    }

    /**
     * Finalise et sauvegarde l'intervention
     * @returns {Object}
     */
    async completeIntervention() {
        const current = storageService.getCurrentIntervention();
        if (!current) {
            return {
                success: false,
                error: 'Aucune intervention en cours'
            };
        }

        // Vérifier les signatures
        if (!current.signatureClient || !current.signatureIntervenant) {
            return {
                success: false,
                error: 'Signatures manquantes'
            };
        }

        // Mettre à jour le statut
        current.status = 'completed';
        current.completedAt = new Date().toISOString();

        // Sauvegarder
        const result = storageService.saveIntervention(current);

        if (result.success) {
            // Si escalade SAV, envoyer l'email
            if (current.resultat === 'SAV') {
                await this.sendSAVNotification(result.data);
            }

            // Nettoyer
            storageService.clearCurrentIntervention();
            this.currentIntervention = null;
        }

        return result;
    }

    /**
     * Envoie la notification SAV
     * @param {Object} intervention 
     * @returns {Promise<Object>}
     */
    async sendSAVNotification(intervention) {
        const user = authService.getCurrentUser();
        
        // Formater les données pour l'email
        const formattedData = this.formatInterventionForEmail(intervention);
        
        return await emailService.sendSAVEscalade(formattedData, user);
    }

    /**
     * Formate les données pour l'email
     * @param {Object} intervention 
     * @returns {Object}
     */
    formatInterventionForEmail(intervention) {
        return {
            ...intervention,
            problemes: this.getLabelsFromIds(intervention.problemes, PROBLEMS),
            actions: this.getLabelsFromIds(intervention.actions, ACTIONS),
            resultatLabel: this.getResultLabel(intervention.resultat)
        };
    }

    /**
     * Convertit les IDs en labels
     * @param {Array} ids 
     * @param {Array} dataSource 
     * @returns {Array}
     */
    getLabelsFromIds(ids, dataSource) {
        if (!ids || !Array.isArray(ids)) return [];
        
        return ids.map(id => {
            const item = dataSource.find(d => d.value === id);
            return item ? item.label : id;
        });
    }

    /**
     * Obtient le label du résultat
     * @param {string} value 
     * @returns {string}
     */
    getResultLabel(value) {
        const result = INTERVENTION_RESULTS.find(r => r.value === value);
        return result ? result.label : value;
    }

    /**
     * Charge une intervention pour modification
     * @param {string} id 
     * @returns {Object}
     */
    loadIntervention(id) {
        const intervention = storageService.getInterventionById(id);
        if (!intervention) {
            return {
                success: false,
                error: 'Intervention non trouvée'
            };
        }

        this.currentIntervention = intervention;
        storageService.setCurrentIntervention(intervention);

        return {
            success: true,
            data: intervention
        };
    }

    /**
     * Annule l'intervention en cours
     */
    cancelCurrentIntervention() {
        storageService.clearCurrentIntervention();
        this.currentIntervention = null;
    }

    /**
     * Génère un PDF de l'intervention
     * @param {string} interventionId 
     * @returns {Object}
     */
    generatePDF(interventionId) {
        // Pour l'instant, on redirige vers la page d'impression
        const intervention = storageService.getInterventionById(interventionId);
        if (!intervention) {
            return {
                success: false,
                error: 'Intervention non trouvée'
            };
        }

        // Sauvegarder pour l'impression
        storageService.setCurrentIntervention(intervention);

        return {
            success: true,
            printUrl: '/fiche-impression.html'
        };
    }

    /**
     * Obtient les interventions récentes
     * @param {number} limit 
     * @returns {Array}
     */
    getRecentInterventions(limit = 10) {
        const user = authService.getCurrentUser();
        if (!user) return [];

        return storageService.searchInterventions({
            magasin: user.magasin
        }).slice(0, limit);
    }

    /**
     * Obtient les statistiques du magasin
     * @returns {Object}
     */
    getStoreStatistics() {
        const user = authService.getCurrentUser();
        if (!user) return {};

        const allStats = storageService.getStatistics();
        const storeInterventions = storageService.searchInterventions({
            magasin: user.magasin
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        return {
            total: storeInterventions.length,
            today: storeInterventions.filter(i => 
                new Date(i.createdAt) >= today
            ).length,
            thisMonth: storeInterventions.filter(i => 
                new Date(i.createdAt) >= thisMonth
            ).length,
            byResult: storeInterventions.reduce((acc, i) => {
                acc[i.resultat] = (acc[i.resultat] || 0) + 1;
                return acc;
            }, {}),
            globalStats: allStats
        };
    }
}

// Export singleton
export const interventionService = new InterventionService();
export default InterventionService;