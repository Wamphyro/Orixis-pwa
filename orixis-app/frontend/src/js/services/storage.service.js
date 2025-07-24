// src/js/services/storage.service.js
import { APP_CONFIG, getStorageKey } from '../config/app.config.js';

class StorageService {
    constructor() {
        this.prefix = APP_CONFIG.storage.prefix;
    }

    /**
     * Sauvegarde une intervention
     * @param {Object} interventionData 
     * @returns {Object}
     */
    saveIntervention(interventionData) {
        try {
            const interventions = this.getInterventions();
            
            // Générer un ID unique
            const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            
            const intervention = {
                id,
                ...interventionData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: interventionData.status || 'completed'
            };
            
            interventions.push(intervention);
            
            // Sauvegarder
            localStorage.setItem(
                getStorageKey('interventions'), 
                JSON.stringify(interventions)
            );
            
            // Sauvegarder aussi comme intervention courante
            this.setCurrentIntervention(intervention);
            
            return {
                success: true,
                data: intervention
            };
        } catch (error) {
            console.error('Erreur sauvegarde intervention:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Récupère toutes les interventions
     * @returns {Array}
     */
    getInterventions() {
        try {
            const data = localStorage.getItem(getStorageKey('interventions'));
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Erreur lecture interventions:', error);
            return [];
        }
    }

    /**
     * Récupère une intervention par ID
     * @param {string} id 
     * @returns {Object|null}
     */
    getInterventionById(id) {
        const interventions = this.getInterventions();
        return interventions.find(i => i.id === id) || null;
    }

    /**
     * Met à jour une intervention
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Object}
     */
    updateIntervention(id, updates) {
        try {
            const interventions = this.getInterventions();
            const index = interventions.findIndex(i => i.id === id);
            
            if (index === -1) {
                return {
                    success: false,
                    error: 'Intervention non trouvée'
                };
            }
            
            interventions[index] = {
                ...interventions[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem(
                getStorageKey('interventions'), 
                JSON.stringify(interventions)
            );
            
            return {
                success: true,
                data: interventions[index]
            };
        } catch (error) {
            console.error('Erreur mise à jour intervention:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Supprime une intervention
     * @param {string} id 
     * @returns {Object}
     */
    deleteIntervention(id) {
        try {
            const interventions = this.getInterventions();
            const filtered = interventions.filter(i => i.id !== id);
            
            localStorage.setItem(
                getStorageKey('interventions'), 
                JSON.stringify(filtered)
            );
            
            return {
                success: true
            };
        } catch (error) {
            console.error('Erreur suppression intervention:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Sauvegarde l'intervention en cours
     * @param {Object} data 
     */
    setCurrentIntervention(data) {
        localStorage.setItem(
            getStorageKey('intervention'), 
            JSON.stringify(data)
        );
    }

    /**
     * Récupère l'intervention en cours
     * @returns {Object|null}
     */
    getCurrentIntervention() {
        try {
            const data = localStorage.getItem(getStorageKey('intervention'));
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erreur lecture intervention courante:', error);
            return null;
        }
    }

    /**
     * Efface l'intervention en cours
     */
    clearCurrentIntervention() {
        localStorage.removeItem(getStorageKey('intervention'));
    }

    /**
     * Recherche des interventions
     * @param {Object} criteria 
     * @returns {Array}
     */
    searchInterventions(criteria = {}) {
        let interventions = this.getInterventions();
        
        // Filtrer par magasin
        if (criteria.magasin) {
            interventions = interventions.filter(i => 
                i.magasin === criteria.magasin
            );
        }
        
        // Filtrer par date
        if (criteria.dateDebut) {
            interventions = interventions.filter(i => 
                new Date(i.date) >= new Date(criteria.dateDebut)
            );
        }
        
        if (criteria.dateFin) {
            interventions = interventions.filter(i => 
                new Date(i.date) <= new Date(criteria.dateFin)
            );
        }
        
        // Filtrer par client
        if (criteria.client) {
            const search = criteria.client.toLowerCase();
            interventions = interventions.filter(i => 
                i.nom?.toLowerCase().includes(search) ||
                i.telephone?.includes(search)
            );
        }
        
        // Filtrer par statut
        if (criteria.resultat) {
            interventions = interventions.filter(i => 
                i.resultat === criteria.resultat
            );
        }
        
        // Trier par date décroissante
        interventions.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        return interventions;
    }

    /**
     * Obtient les statistiques
     * @returns {Object}
     */
    getStatistics() {
        const interventions = this.getInterventions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        return {
            total: interventions.length,
            today: interventions.filter(i => 
                new Date(i.createdAt) >= today
            ).length,
            thisMonth: interventions.filter(i => 
                new Date(i.createdAt) >= thisMonth
            ).length,
            byResult: interventions.reduce((acc, i) => {
                acc[i.resultat] = (acc[i.resultat] || 0) + 1;
                return acc;
            }, {}),
            byDevice: interventions.reduce((acc, i) => {
                acc[i.type_appareil] = (acc[i.type_appareil] || 0) + 1;
                return acc;
            }, {})
        };
    }

    /**
     * Exporte les interventions en JSON
     * @param {Object} criteria 
     * @returns {string}
     */
    exportInterventions(criteria = {}) {
        const interventions = this.searchInterventions(criteria);
        return JSON.stringify(interventions, null, 2);
    }

    /**
     * Importe des interventions
     * @param {string} jsonData 
     * @returns {Object}
     */
    importInterventions(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            if (!Array.isArray(imported)) {
                throw new Error('Format invalide');
            }
            
            const current = this.getInterventions();
            const merged = [...current, ...imported];
            
            localStorage.setItem(
                getStorageKey('interventions'), 
                JSON.stringify(merged)
            );
            
            return {
                success: true,
                count: imported.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Nettoie les anciennes données
     * @param {number} daysToKeep 
     */
    cleanOldData(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        const interventions = this.getInterventions();
        const filtered = interventions.filter(i => 
            new Date(i.createdAt) > cutoffDate
        );
        
        localStorage.setItem(
            getStorageKey('interventions'), 
            JSON.stringify(filtered)
        );
        
        return {
            removed: interventions.length - filtered.length
        };
    }
}

// Export singleton
export const storageService = new StorageService();
export default StorageService;