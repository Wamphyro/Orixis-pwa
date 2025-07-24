import { EMAILJS_CONFIG, initEmailJS } from '../config/emailjs.config.js';
import { InterventionService } from './intervention.service.js';

// Service d'envoi d'emails
export class EmailService {
    static initialized = false;
    
    /**
     * Initialiser EmailJS
     */
    static init() {
        if (!this.initialized) {
            this.initialized = initEmailJS();
        }
        return this.initialized;
    }
    
    /**
     * Envoyer une escalade SAV
     */
    static async sendSAVEscalade(interventionData) {
        try {
            // S'assurer qu'EmailJS est initialisé
            if (!this.init()) {
                throw new Error('EmailJS non initialisé');
            }
            
            // Préparer les données pour l'email
            const templateParams = this.prepareTemplateParams(interventionData);
            
            // Envoyer l'email
            const response = await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.templateId,
                templateParams
            );
            
            console.log('Email envoyé avec succès', response);
            return { success: true, response };
            
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            return { 
                success: false, 
                error: this.formatError(error) 
            };
        }
    }
    
    /**
     * Préparer les paramètres du template
     */
    static prepareTemplateParams(intervention) {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        const date = new Date();
        
        return {
            // Informations générales
            magasin: auth.magasin || 'Non spécifié',
            date: intervention.date ? 
                new Date(intervention.date).toLocaleDateString('fr-FR') : 
                date.toLocaleDateString('fr-FR'),
            heure: intervention.heure || 
                date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
            
            // Informations client
            nom_client: intervention.nom || 'Non spécifié',
            telephone: intervention.telephone || 'Non spécifié',
            
            // Informations appareil
            type_appareil: intervention.type_appareil || 'Non spécifié',
            marque: intervention.marque || 'Non spécifié',
            
            // Problème et actions
            probleme: this.formatList(intervention.problemes),
            actions: this.formatList(intervention.actions),
            
            // Résultat et observations
            resultat: this.getResultatText(intervention.resultat),
            observations: intervention.observations || 'Aucune observation',
            
            // ID de l'intervention
            intervention_id: intervention.id || 'Non spécifié',
            
            // Informations supplémentaires
            intervenant: auth.magasin ? `Intervenant du magasin ${auth.magasin}` : 'Non spécifié',
            urgence: intervention.resultat === 'SAV' ? 'URGENT' : 'Normal'
        };
    }
    
    /**
     * Formater une liste pour l'email
     */
    static formatList(items) {
        if (!items || items.length === 0) {
            return 'Aucun élément spécifié';
        }
        
        if (Array.isArray(items)) {
            return items.join(', ');
        }
        
        return items.toString();
    }
    
    /**
     * Obtenir le texte du résultat
     */
    static getResultatText(resultat) {
        const resultats = {
            'Résolu': '✅ Problème résolu',
            'Partiel': '⚠️ Amélioration partielle',
            'SAV': '❌ Sans effet - Escalade SAV URGENTE',
            'OK': '🔧 Contrôle OK'
        };
        return resultats[resultat] || resultat || 'Non spécifié';
    }
    
    /**
     * Formater les erreurs
     */
    static formatError(error) {
        let errorMessage = 'Erreur lors de l\'envoi';
        
        if (error.text) {
            errorMessage = error.text;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.status === 400) {
            errorMessage = 'Paramètres invalides. Vérifiez votre configuration EmailJS.';
        } else if (error.status === 401) {
            errorMessage = 'Authentification EmailJS échouée. Vérifiez votre clé publique.';
        } else if (error.status === 404) {
            errorMessage = 'Service ou template EmailJS introuvable.';
        }
        
        return errorMessage;
    }
    
    /**
     * Envoyer un email de test
     */
    static async sendTestEmail() {
        const testData = {
            nom: 'Client Test',
            telephone: '0123456789',
            type_appareil: 'BTE',
            marque: 'Phonak',
            problemes: ['Pas de son', 'Sifflement'],
            actions: ['Pile changée', 'Nettoyage complet'],
            resultat: 'SAV',
            observations: 'Email de test'
        };
        
        return this.sendSAVEscalade(testData);
    }
    
    /**
     * Vérifier si EmailJS est configuré
     */
    static isConfigured() {
        return !!(
            EMAILJS_CONFIG.serviceId && 
            EMAILJS_CONFIG.templateId && 
            EMAILJS_CONFIG.publicKey
        );
    }
    
    /**
     * Obtenir le statut du service
     */
    static getStatus() {
        return {
            configured: this.isConfigured(),
            initialized: this.initialized,
            config: {
                serviceId: EMAILJS_CONFIG.serviceId ? '✓' : '✗',
                templateId: EMAILJS_CONFIG.templateId ? '✓' : '✗',
                publicKey: EMAILJS_CONFIG.publicKey ? '✓' : '✗'
            }
        };
    }
}
