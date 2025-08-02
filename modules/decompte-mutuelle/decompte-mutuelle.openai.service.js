// ========================================
// DECOMPTE-MUTUELLE.OPENAI.SERVICE.JS - Service d'analyse IA des décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des documents décomptes mutuelles via OpenAI GPT-4.1-mini
// Adapté du service TypeScript existant pour le module décomptes
//
// FONCTIONS PUBLIQUES:
// - analyserDocument(documentUrl, documentType) : Analyser un document
// - analyserDocumentExistant(decompteId) : Analyser un décompte existant
// - extractDecompteData(images) : Extraire les données via GPT-4
//
// DÉPENDANCES:
// - OpenAI API (GPT-4.1-mini avec vision)
// - Firebase Storage pour récupérer les documents
// ========================================

// ========================================
// CONFIGURATION
// ========================================

// Configuration de la Cloud Function
const CLOUD_FUNCTION_URL = 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDecompte';


// ========================================
// SERVICE PRINCIPAL
// ========================================

export class DecompteOpenAIService {
    
    /**
     * Analyser un document décompte complet
     * @param {string} documentUrl - URL du document dans Firebase Storage
     * @param {string} documentType - Type MIME du document
     * @param {Array} magasinsData - Données des magasins pour FINESS
     * @returns {Promise<Object>} Données extraites formatées pour Firestore
     */
    static async analyserDocument(documentUrl, documentType, magasinsData = []) {
        try {
            console.log('🤖 Début analyse IA du document décompte...');
            
            // Convertir le document en image(s) base64
            const images = await this.prepareDocumentImages(documentUrl, documentType);
            
            // Extraire les données via GPT-4
            const donneesExtraites = await this.extractDecompteData(images, magasinsData);
            
            // Formater pour notre structure Firestore
            const donneesFormatees = this.formaterPourFirestore(donneesExtraites);
            
            console.log('✅ Analyse IA terminée avec succès');
            return donneesFormatees;
            
        } catch (error) {
            console.error('❌ Erreur analyse IA:', error);
            throw new Error(`Erreur analyse IA: ${error.message}`);
        }
    }
    
    /**
     * Extraire les données via GPT-4 Vision
     * @param {Array<string>} images - Images en base64
     * @param {Array} magasinsArray - Tableau des magasins
     * @returns {Promise<Object>} Données brutes extraites
     */
    static async extractDecompteData(images, magasinsArray = []) {
    try {
        console.log(`🤖 Appel Cloud Function pour ${images.length} image(s)...`);
        
        // Appeler la Cloud Function
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                images: images,
                magasinsArray: magasinsArray
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur Cloud Function');
        }
        
        const result = await response.json();
        
        // Pour l'instant, la fonction retourne des données de test
        console.log('✅ Réponse Cloud Function:', result);
        
        // Retourner les données (actuellement mockées)
        return result.data || {};
        
    } catch (error) {
        console.error('❌ Erreur appel Cloud Function:', error);
        throw error;
    }
}
    
    /**
     * Analyser un décompte déjà existant
     * @param {string} decompteId - ID du décompte
     * @returns {Promise<Object>} Données mises à jour
     */
    static async analyserDocumentExistant(decompteId) {
        try {
            // Récupérer le décompte
            const firestoreService = await import('./decompte-mutuelle.firestore.service.js');
            const decompte = await firestoreService.getDecompteById(decompteId);
            
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            if (!decompte.documents || decompte.documents.length === 0) {
                throw new Error('Aucun document à analyser');
            }
            
            // Charger les magasins pour la recherche FINESS
            const { chargerMagasins } = await import('../../src/services/firebase.service.js');
            const magasinsData = await chargerMagasins();
            const magasinsArray = Object.entries(magasinsData).map(([code, data]) => ({
                code,
                ...data
            }));
            
            // Analyser le premier document
            const document = decompte.documents[0];
            const donneesExtraites = await this.analyserDocument(
                document.url,
                document.type,
                magasinsArray
            );
            
            // Mettre à jour le décompte
            await firestoreService.ajouterDonneesExtraites(decompteId, donneesExtraites);
            
            return {
                decompteId,
                donneesExtraites,
                documentAnalyse: document.nom
            };
            
        } catch (error) {
            console.error('❌ Erreur analyse décompte existant:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Préparer les images du document
     * @private
     */
    static async prepareDocumentImages(documentUrl, documentType) {
        if (documentType === 'application/pdf') {
            // TODO: Implémenter conversion PDF → Images
            throw new Error('Conversion PDF non implémentée. Utilisez des images JPG/PNG.');
        }
        
        // Image directe
        const base64 = await this.fetchImageAsBase64(documentUrl);
        return [base64];
    }
    
    /**
     * Récupérer une image et la convertir en base64
     * @private
     */
    static async fetchImageAsBase64(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            throw new Error('Impossible de récupérer l\'image');
        }
    }

    
    /**
     * Formater les données pour Firestore
     * @private
     */
    static formaterPourFirestore(donneesBrutes) {
    // Pour l'instant, on travaille avec les données de test de la Cloud Function
    if (donneesBrutes.client) {
        // Données déjà au bon format depuis la Cloud Function
        return donneesBrutes;
    }
    
    // Fallback pour l'ancien format (sera utile quand on ajoutera le vrai OpenAI)
    const premierVirement = donneesBrutes.virements?.[0] || {};
    const premierClient = premierVirement.clients?.[0] || {};
    
    // Calculer le type de décompte
    const nombreClients = premierVirement.nb_clients || 1;
    const typeDecompte = nombreClients > 1 ? 'groupe' : 'individuel';
    
    return {
        // Client principal
        client: {
            nom: premierClient.ClientNom || null,
            prenom: premierClient.ClientPrenom || null,
            numeroSecuriteSociale: this.nettoyerNSS(premierClient.NumeroSecuriteSociale)
        },
        
        // Mutuelle et prestataire
        mutuelle: donneesBrutes.organisme_mutuelle || null,
        prestataireTP: donneesBrutes.prestataireTP || donneesBrutes.reseau_soins || null,
        
        // Montants
        montantRemboursementClient: premierClient.Montant || 0,
        montantVirement: premierVirement.MontantVirementGlobal || 0,
        
        // Type et nombre
        typeDecompte: typeDecompte,
        nombreClients: nombreClients,
        
        // Références
        virementId: premierVirement.VirementLibelle || null,
        dateVirement: this.parseDate(premierVirement.DateVirement),
        
        // Magasin
        codeMagasin: donneesBrutes.centre !== 'INCONNU' ? donneesBrutes.centre : null,
        
        // Tous les clients (pour référence)
        clientsDetails: premierVirement.clients || [],
        
        // Métadonnées
        extractionIA: {
            timestamp: donneesBrutes.timestamp_analyse,
            modele: 'gpt-4.1-mini',
            societeDetectee: donneesBrutes.societe,
            periode: donneesBrutes.periode
        }
    };
}
    
    /**
     * Nettoyer un NSS
     * @private
     */
    static nettoyerNSS(nss) {
        if (!nss) return null;
        const cleaned = String(nss).replace(/\D/g, '');
        return (cleaned.length === 13 || cleaned.length === 15) ? cleaned : nss;
    }
    
    /**
     * Parser une date
     * @private
     */
    static parseDate(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    }
}

// ========================================
// EXPORT
// ========================================

export default {
    initializeService: DecompteOpenAIService.initializeService.bind(DecompteOpenAIService),
    analyserDocument: DecompteOpenAIService.analyserDocument.bind(DecompteOpenAIService),
    analyserDocumentExistant: DecompteOpenAIService.analyserDocumentExistant.bind(DecompteOpenAIService),
    extractDecompteData: DecompteOpenAIService.extractDecompteData.bind(DecompteOpenAIService)
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création basée sur le service TypeScript
   - Adaptation du service existant en JavaScript
   - Utilisation de gpt-4.1-mini au lieu de gpt-4-vision
   - Gestion du FINESS et recherche magasins
   
   NOTES POUR REPRISES FUTURES:
   - La clé API doit être initialisée avant utilisation
   - Conversion PDF → Images à implémenter
   - Le prompt est optimisé pour les décomptes mutuelles FR
   ======================================== */