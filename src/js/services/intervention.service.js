import { StorageService } from './storage.service.js';
import { APP_CONFIG } from '../config/app.config.js';

// Service de gestion des interventions
export class InterventionService {
    static STORAGE_KEY = APP_CONFIG.storageKeys.intervention;
    
    /**
     * Créer une nouvelle intervention
     */
    static create(data) {
        const intervention = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            magasin: this.getCurrentMagasin(),
            status: 'draft',
            ...data
        };
        
        StorageService.save(this.STORAGE_KEY, intervention);
        return intervention;
    }
    
    /**
     * Récupérer l'intervention en cours
     */
    static getCurrent() {
        return StorageService.get(this.STORAGE_KEY);
    }
    
    /**
     * Mettre à jour l'intervention en cours
     */
    static update(data) {
        const current = this.getCurrent();
        if (!current) {
            throw new Error('Aucune intervention en cours');
        }
        
        const updated = {
            ...current,
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        StorageService.save(this.STORAGE_KEY, updated);
        return updated;
    }
    
    /**
     * Ajouter une signature
     */
    static addSignature(type, signatureData) {
        const validTypes = ['client', 'intervenant'];
        if (!validTypes.includes(type)) {
            throw new Error('Type de signature invalide');
        }
        
        return this.update({
            [`signature${type.charAt(0).toUpperCase() + type.slice(1)}`]: signatureData,
            [`signature${type.charAt(0).toUpperCase() + type.slice(1)}At`]: new Date().toISOString()
        });
    }
    
    /**
     * Finaliser l'intervention
     */
    static finalize() {
        const intervention = this.getCurrent();
        if (!intervention) {
            throw new Error('Aucune intervention en cours');
        }
        
        // Vérifier que toutes les signatures sont présentes
        if (!intervention.signatureClient || !intervention.signatureIntervenant) {
            throw new Error('Signatures manquantes');
        }
        
        // Mettre à jour le statut
        const finalized = this.update({
            status: 'completed',
            completedAt: new Date().toISOString()
        });
        
        // Sauvegarder dans l'historique (pour plus tard avec Firebase)
        this.saveToHistory(finalized);
        
        return finalized;
    }
    
    /**
     * Effacer l'intervention en cours
     */
    static clear() {
        StorageService.remove(this.STORAGE_KEY);
    }
    
    /**
     * Générer un ID unique
     */
    static generateId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const magasin = this.getCurrentMagasin() || 'XX';
        return `INT-${magasin}-${timestamp}-${random}`;
    }
    
    /**
     * Récupérer le magasin actuel
     */
    static getCurrentMagasin() {
        const auth = StorageService.get(APP_CONFIG.storageKeys.auth);
        return auth?.magasin || null;
    }
    
    /**
     * Sauvegarder dans l'historique (localStorage pour l'instant)
     */
    static saveToHistory(intervention) {
        const historyKey = 'sav_interventions_history';
        const history = StorageService.get(historyKey) || [];
        
        // Ajouter l'intervention à l'historique
        history.push(intervention);
        
        // Garder seulement les 50 dernières interventions
        if (history.length > 50) {
            history.shift();
        }
        
        StorageService.save(historyKey, history);
    }
    
    /**
     * Récupérer l'historique des interventions
     */
    static getHistory() {
        const historyKey = 'sav_interventions_history';
        return StorageService.get(historyKey) || [];
    }
    
    /**
     * Préparer les données pour l'impression
     */
    static prepareForPrint() {
        const intervention = this.getCurrent();
        if (!intervention) {
            throw new Error('Aucune intervention en cours');
        }
        
        // Formater les données pour l'impression
        return {
            ...intervention,
            dateFormatted: new Date(intervention.date).toLocaleDateString('fr-FR'),
            problemsList: intervention.problemes?.join(', ') || 'Aucun',
            actionsList: intervention.actions?.join(', ') || 'Aucune',
            magasinInfo: this.getCurrentMagasin()
        };
    }
    
    /**
     * Valider les données de l'intervention
     */
    static validate(data) {
        const errors = [];
        
        // Champs obligatoires
        const requiredFields = ['nom', 'telephone', 'type_appareil', 'marque', 'resultat'];
        
        requiredFields.forEach(field => {
            if (!data[field]) {
                errors.push(`Le champ ${field} est obligatoire`);
            }
        });
        
        // Validation du téléphone
        if (data.telephone && !/^[0-9+\s-]+$/.test(data.telephone)) {
            errors.push('Le numéro de téléphone est invalide');
        }
        
        // Au moins un problème doit être sélectionné
        if (!data.problemes || data.problemes.length === 0) {
            errors.push('Au moins un problème doit être sélectionné');
        }
        
        // Au moins une action doit être sélectionnée
        if (!data.actions || data.actions.length === 0) {
            errors.push('Au moins une action doit être sélectionnée');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
