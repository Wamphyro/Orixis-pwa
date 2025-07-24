// src/js/services/email.service.js
import { APP_CONFIG, getMessage } from '../config/app.config.js';

class EmailService {
    constructor() {
        this.isInitialized = false;
        this.initializeEmailJS();
    }

    /**
     * Initialise EmailJS
     */
    initializeEmailJS() {
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS non chargé');
            return;
        }

        try {
            emailjs.init(APP_CONFIG.emailjs.publicKey);
            this.isInitialized = true;
            console.log('EmailJS initialisé avec succès');
        } catch (error) {
            console.error('Erreur initialisation EmailJS:', error);
        }
    }

    /**
     * Envoie un email via EmailJS
     * @param {string} templateId - ID du template EmailJS
     * @param {Object} templateParams - Paramètres du template
     * @param {HTMLElement} button - Bouton optionnel pour feedback visuel
     * @returns {Promise<Object>}
     */
    async sendEmail(templateId, templateParams, button = null) {
        if (!this.isInitialized) {
            throw new Error('EmailJS non initialisé');
        }

        // État du bouton pendant l'envoi
        let originalButtonContent = null;
        if (button) {
            originalButtonContent = button.innerHTML;
            button.innerHTML = '⏳ Envoi en cours...';
            button.disabled = true;
        }

        try {
            const response = await emailjs.send(
                APP_CONFIG.emailjs.serviceId,
                templateId,
                templateParams
            );

            console.log('Email envoyé avec succès', response);
            
            return {
                success: true,
                response,
                message: getMessage('success', 'emailSent')
            };

        } catch (error) {
            console.error('Erreur envoi email:', error);
            
            let errorMessage = 'Erreur lors de l\'envoi';
            if (error.text) {
                errorMessage = error.text;
            } else if (error.message) {
                errorMessage = error.message;
            } else if (error.status === 400) {
                errorMessage = 'Paramètres invalides';
            }

            return {
                success: false,
                error: errorMessage,
                details: error
            };

        } finally {
            // Restaurer l'état du bouton
            if (button && originalButtonContent) {
                button.innerHTML = originalButtonContent;
                button.disabled = false;
            }
        }
    }

    /**
     * Envoie une escalade SAV
     * @param {Object} interventionData - Données de l'intervention
     * @param {Object} authData - Données d'authentification
     * @returns {Promise<Object>}
     */
    async sendSAVEscalade(interventionData, authData) {
        const templateParams = this.buildSAVTemplateParams(interventionData, authData);
        return await this.sendEmail(APP_CONFIG.emailjs.templates.sav, templateParams);
    }

    /**
     * Construit les paramètres pour le template SAV
     * @param {Object} interventionData - Données de l'intervention
     * @param {Object} authData - Données d'authentification
     * @returns {Object}
     */
    buildSAVTemplateParams(interventionData, authData) {
        const date = new Date();
        
        return {
            // Informations magasin
            magasin: authData.magasin || 'Non spécifié',
            
            // Date et heure
            date: date.toLocaleDateString('fr-FR'),
            heure: date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
            
            // Client
            nom_client: interventionData.nom || 'Non spécifié',
            telephone: interventionData.telephone || 'Non spécifié',
            
            // Appareil
            type_appareil: interventionData.type_appareil || 'Non spécifié',
            marque: interventionData.marque || 'Non spécifié',
            
            // Problème et actions
            probleme: this.formatArrayForEmail(interventionData.problemes),
            actions: this.formatArrayForEmail(interventionData.actions),
            
            // Résultat
            resultat: interventionData.resultat || 'Non spécifié',
            observations: interventionData.observations || 'Aucune observation',
            
            // Métadonnées
            date_intervention: interventionData.date || date.toLocaleDateString('fr-FR'),
            heure_intervention: interventionData.heure || date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
        };
    }

    /**
     * Formate un tableau pour l'email
     * @param {Array} array - Tableau à formater
     * @returns {string}
     */
    formatArrayForEmail(array) {
        if (!array || !Array.isArray(array) || array.length === 0) {
            return 'Aucun';
        }
        return array.join(', ');
    }

    /**
     * Envoie un email de confirmation d'intervention
     * @param {Object} interventionData - Données de l'intervention
     * @param {string} clientEmail - Email du client
     * @returns {Promise<Object>}
     */
    async sendConfirmation(interventionData, clientEmail) {
        // Si un template de confirmation existe
        if (APP_CONFIG.emailjs.templates.confirmation) {
            const templateParams = {
                to_email: clientEmail,
                client_name: interventionData.nom,
                intervention_date: interventionData.date,
                intervention_type: interventionData.type_appareil,
                ...this.buildSAVTemplateParams(interventionData, { magasin: interventionData.magasin })
            };

            return await this.sendEmail(
                APP_CONFIG.emailjs.templates.confirmation, 
                templateParams
            );
        }

        return {
            success: false,
            error: 'Template de confirmation non configuré'
        };
    }

    /**
     * Teste la connexion EmailJS
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            // Tentative d'envoi avec des paramètres de test
            const testParams = {
                test: true,
                timestamp: new Date().toISOString()
            };

            // Utiliser un template de test si disponible
            if (APP_CONFIG.emailjs.templates.test) {
                const result = await this.sendEmail(
                    APP_CONFIG.emailjs.templates.test,
                    testParams
                );
                return result.success;
            }

            return this.isInitialized;
        } catch (error) {
            console.error('Erreur test EmailJS:', error);
            return false;
        }
    }
}

// Export singleton
export const emailService = new EmailService();

// Export de la classe pour les tests
export default EmailService;