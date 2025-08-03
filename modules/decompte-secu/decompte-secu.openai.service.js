// ========================================
// DECOMPTE-SECU.OPENAI.SERVICE.JS - 🤖 EXTRACTION IA
// 
// RÔLE : Analyse des documents via GPT-4
// - Extraction des données spécifiques sécu (OCR + IA)
// - Identification bénéficiaire, NSS, actes médicaux
// - Détection des taux de remboursement et participations
// - Identification du contexte médical (ALD, maternité...)
// ========================================

// ========================================
// DECOMPTE-SECU.OPENAI.SERVICE.JS - Service d'analyse IA des décomptes sécu
// Chemin: modules/decompte-secu/decompte-secu.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des documents décomptes sécurité sociale via OpenAI GPT-4.1-mini
// Adapté pour extraire les données spécifiques CPAM
//
// FONCTIONS PUBLIQUES:
// - analyserDocument(documentUrl, documentType) : Analyser un document
// - analyserDocumentExistant(decompteId) : Analyser un décompte existant
// - extractDecompteSecuData(images) : Extraire les données via GPT-4
//
// DÉPENDANCES:
// - OpenAI API (GPT-4.1-mini avec vision)
// - Firebase Storage pour récupérer les documents
// ========================================

// ========================================
// CONFIGURATION
// ========================================

// Configuration de la Cloud Function
const CLOUD_FUNCTION_URL = 'https://europe-west1-orixis-pwa.cloudfunctions.net/analyzeDocument';

// ========================================
// SERVICE PRINCIPAL
// ========================================

export class DecompteSecuOpenAIService {
    
    /**
     * Analyser un document décompte sécu complet
     * @param {string} documentUrl - URL du document dans Firebase Storage
     * @param {string} documentType - Type MIME du document
     * @param {Array} magasinsData - Données des magasins pour FINESS
     * @returns {Promise<Object>} Données extraites formatées pour Firestore
     */
    static async analyserDocument(documentUrl, documentType, magasinsData = []) {
        try {
            console.log('🤖 Début analyse IA du décompte sécurité sociale...');
            
            // Préparer le tableau des magasins au format attendu par le prompt
            let magasinsArray = [];
            
            // Si magasinsData est un objet (format Firebase)
            if (!Array.isArray(magasinsData) && typeof magasinsData === 'object') {
                console.log('🔍 Transformation des magasins Firebase vers format FINESS...');
                
                magasinsArray = Object.entries(magasinsData).map(([code, data]) => {
                    const finess = data.numeroFINESS || data.finess || data.FINESS || '';
                    const societe = data.societe?.raisonSociale || data.raisonSociale || data.societe || data.nom || '';
                    const rue = data.adresse?.rue || data.rue || '';
                    const codePostal = data.adresse?.codePostal || data.codePostal || '';
                    const ville = data.adresse?.ville || data.ville || '';
                    const adresse = `${rue} ${codePostal} ${ville}`.trim();
                    
                    return {
                        "FINESS": finess,
                        "CODE MAGASIN": code,
                        "SOCIETE": societe,
                        "ADRESSE": adresse,
                        "VILLE": ville
                    };
                });
            } 
            // Si c'est déjà un tableau
            else if (Array.isArray(magasinsData)) {
                magasinsArray = magasinsData.map(data => ({
                    "FINESS": data.numeroFINESS || data.finess || data.FINESS || '',
                    "CODE MAGASIN": data.code || '',
                    "SOCIETE": data.societe?.raisonSociale || data.societe || data.nom || '',
                    "ADRESSE": `${data.adresse?.rue || ''} ${data.adresse?.codePostal || ''} ${data.adresse?.ville || ''}`.trim(),
                    "VILLE": data.adresse?.ville || data.ville || ''
                }));
            }
            
            console.log(`📍 ${magasinsArray.length} magasins pour recherche FINESS`);
            
            // Convertir le document en image(s) base64
            const images = await this.prepareDocumentImages(documentUrl, documentType);
            
            // Extraire les données via GPT-4
            console.log('🚀 Appel extractDecompteSecuData avec', magasinsArray.length, 'magasins');
            const donneesExtraites = await DecompteSecuOpenAIService.extractDecompteSecuData(images, magasinsArray);
            
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
    static async extractDecompteSecuData(images, magasinsArray = []) {
        try {
            console.log(`🤖 Appel Cloud Function pour ${images.length} image(s)...`);
            
            // Préparer la chaîne JSON des magasins
            const magasinsJSON = JSON.stringify(magasinsArray, null, 2);
            console.log('📋 Magasins qui seront envoyés dans le prompt:', magasinsJSON);
            
            // PROMPT SPÉCIFIQUE SÉCURITÉ SOCIALE
            const prompt = `Tu es un expert en traitement des décomptes de remboursement de la Sécurité Sociale française (CPAM).
Tu analyses ${images.length} image(s) d'un document PDF et tu dois retourner UNIQUEMENT un objet JSON valide, sans aucun texte ni balise.

FORMAT JSON OBLIGATOIRE :
{
    "timestamp_analyse": "yyyy-MM-ddTHH:mm:ss",
    "societe": "string",
    "centre": "string",
    "periode": "yyyy-MM",
    "caisse_primaire": "string",
    "regime": "string",
    "beneficiaire": {
        "nom": "string",
        "prenom": "string",
        "numero_securite_sociale": "string",
        "numero_affiliation": "string"
    },
    "numero_feuille_soins": "string",
    "contexte_medical": {
        "ald": boolean,
        "maternite": boolean,
        "accident_travail": boolean,
        "invalidite": boolean
    },
    "actes_medicaux": [{
        "date_acte": "yyyy-MM-dd",
        "type_acte": "string",
        "code": "string",
        "libelle": "string",
        "professionnel": "string",
        "montant_facture": 0.0,
        "base_remboursement": 0.0,
        "taux_remboursement": 0,
        "montant_rembourse": 0.0,
        "participation_forfaitaire": 0.0,
        "franchise": 0.0
    }],
    "totaux": {
        "montant_total_facture": 0.0,
        "montant_total_base": 0.0,
        "montant_total_rembourse": 0.0,
        "montant_total_participations": 0.0,
        "montant_net_rembourse": 0.0
    },
    "paiement": {
        "date_paiement": "yyyy-MM-dd",
        "numero_paiement": "string",
        "mode_paiement": "string"
    }
}

EXTRACTION DU FINESS ET RECHERCHE SOCIÉTÉ :
1. Chercher "N° AM", "Numéro AMC", "FINESS" ou "N° d'identification"
2. Extraire le nombre qui suit (exactement 9 chiffres)
3. Supprimer tous les zéros initiaux
4. Rechercher ce FINESS dans le tableau fourni
5. Si trouvé : centre = "CODE MAGASIN", societe = "SOCIETE"
6. Si non trouvé, chercher l'ADRESSE du professionnel et chercher une correspondance
7. Si trouvé par adresse : centre = "CODE MAGASIN", societe = "SOCIETE"
8. Sinon : centre = "INCONNU", societe = ""

EXTRACTION DE LA CAISSE PRIMAIRE :
- Chercher "CPAM", "Caisse Primaire", "Caisse d'Assurance Maladie"
- Extraire le nom complet avec la ville (ex: "CPAM PARIS", "CPAM DES YVELINES")
- En MAJUSCULES

EXTRACTION DU RÉGIME :
- Chercher dans l'en-tête ou les mentions
- "Régime Général" → regime = "general"
- "RSI" ou "Régime Social des Indépendants" → regime = "rsi"
- "MSA" ou "Mutualité Sociale Agricole" → regime = "msa"
- Régimes spéciaux (SNCF, RATP, etc.) → regime = "special"
- Par défaut → regime = "general"

EXTRACTION DU BÉNÉFICIAIRE :
- nom : Nom en MAJUSCULES
- prenom : Prénom en MAJUSCULES  
- numero_securite_sociale : 13 ou 15 chiffres
  Chercher : "N° SS", "NSS", "N° Sécu", "N° Sécurité Sociale", "N° Assuré", "NIR"
  Format : 1 ou 2 + 12 ou 14 chiffres (ex: 1 85 05 78 006 048 22)
- numero_affiliation : si présent (peut être vide)

EXTRACTION DU CONTEXTE MÉDICAL :
- ald : true si mention "ALD", "100%", "Affection Longue Durée"
- maternite : true si mention "Maternité", "Grossesse"
- accident_travail : true si mention "AT", "Accident du travail", "MP", "Maladie professionnelle"
- invalidite : true si mention "Invalidité", "Pension d'invalidité"

EXTRACTION DES ACTES MÉDICAUX :
Pour chaque ligne d'acte médical :
- date_acte : Date de l'acte ou des soins
- type_acte : Déterminer le type
  * "consultation" pour consultations médicales
  * "pharmacie" pour médicaments
  * "analyses" pour examens biologiques
  * "radiologie" pour imagerie médicale
  * "hospitalisation" pour séjours hospitaliers
  * "transport" pour transports médicaux
  * "auxiliaires" pour soins infirmiers, kiné, etc.
  * "optique" pour lunettes/lentilles
  * "dentaire" pour soins dentaires
- code : Code CCAM, code acte ou code médicament
- libelle : Description de l'acte
- professionnel : Nom du professionnel de santé
- montant_facture : Montant facturé/honoraires
- base_remboursement : Base de remboursement Sécu (peut être < montant_facture)
- taux_remboursement : Taux en % (70, 65, 30, 100, etc.)
- montant_rembourse : Montant remboursé par la Sécu
- participation_forfaitaire : 1€ pour consultations (0 si pas applicable)
- franchise : 0.50€ pour médicaments/actes paramédicaux, 2€ pour transports

CALCULS DES TOTAUX :
- montant_total_facture : Somme des montants facturés
- montant_total_base : Somme des bases de remboursement
- montant_total_rembourse : Somme des montants remboursés
- montant_total_participations : Somme des participations + franchises
- montant_net_rembourse : montant_total_rembourse - montant_total_participations

EXTRACTION DU PAIEMENT :
- date_paiement : Date du virement/paiement
- numero_paiement : Référence du paiement
- mode_paiement : "Virement" par défaut

IDENTIFICATION DU NUMÉRO DE FEUILLE DE SOINS :
- Chercher "N° Feuille de soins", "Feuille n°", "N° Décompte"
- Format généralement numérique (10-15 chiffres)

IMPORTANT pour les documents multi-pages :
- Parcourir TOUTES les pages pour extraire TOUS les actes
- Ne pas dupliquer les informations
- Consolider les données de toutes les pages en un seul JSON

Tableau des magasins pour la recherche FINESS :
${magasinsJSON}

VALIDATION NSS :
- Le NSS doit avoir 13 chiffres (ou 15 avec la clé)
- Commence par 1 (homme) ou 2 (femme)
- Format : [1-2] AA MM DD DDD CCC [CC]
- Si le NSS trouvé n'a pas le bon format, chercher ailleurs

RAPPELS CRITIQUES :
- CPAM = Caisse qui paie (expéditeur)
- SOCIÉTÉ = Professionnel de santé qui reçoit
- Les taux standards : 70% (consultations), 65% (pharmacie service médical rendu important), 30% (SMR modéré), 15% (SMR faible)
- ALD = remboursement à 100%
- Participation forfaitaire de 1€ sur les consultations (sauf exceptions)
- Analyser TOUTES les pages fournies`;
            
            // LOG DU PROMPT POUR DEBUG
            console.log('🤖 ===== PROMPT ENVOYÉ À GPT =====');
            console.log(prompt);
            console.log('🤖 ===== FIN DU PROMPT =====');
            
            // Préparer le body de la requête
            const requestBody = {
                images: images,
                prompt: prompt,
                type: 'secu'
            };
            
            console.log('📤 Requête Cloud Function:', {
                url: CLOUD_FUNCTION_URL,
                bodySize: JSON.stringify(requestBody).length,
                promptLength: prompt.length,
                imagesCount: images.length
            });
            
            // Appeler la Cloud Function avec votre prompt
            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur Cloud Function');
            }
            
            const result = await response.json();
            
            console.log('✅ Réponse Cloud Function:', result);
            
            // Retourner les données extraites
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
            const firestoreService = await import('./decompte-secu.firestore.service.js');
            const decompte = await firestoreService.getDecompteById(decompteId);
            
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            if (!decompte.documents || decompte.documents.length === 0) {
                throw new Error('Aucun document à analyser');
            }
            
            // Charger les magasins directement depuis Firestore
            console.log('🏪 Chargement COMPLET des magasins depuis Firestore...');
            
            const { collection, getDocs, query, where } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            const { db } = await import('../../src/services/firebase.service.js');
            
            // Créer une requête pour récupérer TOUS les magasins actifs
            const magasinsRef = collection(db, 'magasins');
            const q = query(magasinsRef, where('actif', '==', true));
            
            // Récupérer TOUS les documents
            const magasinsSnapshot = await getDocs(q);
            const magasinsData = {};
            
            console.log(`📊 ${magasinsSnapshot.size} magasins trouvés dans Firestore`);
            
            magasinsSnapshot.forEach((doc) => {
                const data = doc.data();
                // Stocker par code pour faciliter l'accès
                if (data.code) {
                    magasinsData[data.code] = {
                        ...data,
                        id: doc.id
                    };
                }
            });
            
            console.log('🏪 Magasins chargés:', Object.keys(magasinsData).length);
            
            // Stocker les magasins en localStorage pour la conversion FINESS → Code
            localStorage.setItem('orixis_magasins', JSON.stringify(magasinsData));
            
            // Analyser le premier document
            const document = decompte.documents[0];
            const donneesExtraites = await this.analyserDocument(
                document.url,
                document.type,
                magasinsData
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
        console.log('📄 Type de document:', documentType);
        
        // HACK TEMPORAIRE : On envoie le PDF tel quel à OpenAI
        if (documentType === 'application/pdf') {
            console.warn('⚠️ Envoi PDF direct à OpenAI - fonctionnalité expérimentale');
        }
        
        try {
            // On récupère le fichier comme blob peu importe le type
            const response = await fetch(documentUrl);
            const blob = await response.blob();
            
            // Convertir en base64
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            
            console.log('✅ Document converti en base64, taille:', base64.length);
            return [base64];
            
        } catch (error) {
            console.error('❌ Erreur conversion:', error);
            throw new Error('Impossible de lire le document');
        }
    }
    
    /**
     * Formater les données pour Firestore
     * @private
     */
    static formaterPourFirestore(donneesBrutes) {
        // Extraction du bénéficiaire
        const beneficiaire = donneesBrutes.beneficiaire || {};
        
        // Déterminer le type d'acte principal
        let typeActePrincipal = null;
        const typesCount = {};
        donneesBrutes.actes_medicaux?.forEach(acte => {
            typesCount[acte.type_acte] = (typesCount[acte.type_acte] || 0) + 1;
        });
        
        if (Object.keys(typesCount).length > 0) {
            typeActePrincipal = Object.keys(typesCount).reduce((a, b) => 
                typesCount[a] > typesCount[b] ? a : b
            );
        }
        
        // Extraire les dates des soins
        const datesSoins = donneesBrutes.actes_medicaux
            ?.map(acte => this.parseDate(acte.date_acte))
            .filter(date => date !== null) || [];
        
        return {
            // Bénéficiaire
            beneficiaire: {
                nom: beneficiaire.nom || null,
                prenom: beneficiaire.prenom || null,
                numeroSecuriteSociale: this.nettoyerNSS(beneficiaire.numero_securite_sociale),
                numeroAffiliation: beneficiaire.numero_affiliation || null
            },
            
            // Caisse et régime
            caissePrimaire: donneesBrutes.caisse_primaire || null,
            regime: donneesBrutes.regime || 'general',
            
            // Références
            numeroFeuilleSoins: donneesBrutes.numero_feuille_soins || null,
            
            // Contexte médical
            contexteMedical: donneesBrutes.contexte_medical || {
                ald: false,
                maternite: false,
                accidentTravail: false,
                invalidite: false
            },
            
            // Actes médicaux
            actesMedicaux: this.formaterActesMedicaux(donneesBrutes.actes_medicaux || []),
            typeActePrincipal: typeActePrincipal,
            
            // Montants
            montantTotalFacture: donneesBrutes.totaux?.montant_total_facture || 0,
            montantTotalBase: donneesBrutes.totaux?.montant_total_base || 0,
            montantTotalRembourse: donneesBrutes.totaux?.montant_total_rembourse || 0,
            montantTotalParticipations: donneesBrutes.totaux?.montant_total_participations || 0,
            montantTotalRembourseFinal: donneesBrutes.totaux?.montant_net_rembourse || 0,
            
            // Calcul du taux moyen
            tauxMoyenRemboursement: donneesBrutes.totaux?.montant_total_facture > 0 
                ? Math.round((donneesBrutes.totaux.montant_net_rembourse / donneesBrutes.totaux.montant_total_facture) * 10000) / 100
                : 0,
            
            // Dates
            datesSoins: datesSoins,
            datePaiement: this.parseDate(donneesBrutes.paiement?.date_paiement),
            
            // Paiement
            paiementId: donneesBrutes.paiement?.numero_paiement || null,
            
            // Magasin - Convertir FINESS en code magasin
            codeMagasin: donneesBrutes.centre !== 'INCONNU' ? 
                this.findCodeMagasinByFiness(donneesBrutes.centre) : 
                null,
            
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
     * Formater les actes médicaux
     * @private
     */
    static formaterActesMedicaux(actesBruts) {
        return actesBruts.map(acte => ({
            typeActe: acte.type_acte || 'autre',
            code: acte.code || null,
            libelle: acte.libelle || null,
            professionnel: acte.professionnel || null,
            dateActe: this.parseDate(acte.date_acte),
            montantFacture: acte.montant_facture || 0,
            baseRemboursement: acte.base_remboursement || acte.montant_facture || 0,
            tauxRemboursement: acte.taux_remboursement || 70,
            montantRembourse: acte.montant_rembourse || 0,
            participationForfaitaire: acte.participation_forfaitaire || 0,
            franchise: acte.franchise || 0
        }));
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
     * Trouver le code magasin à partir du FINESS
     * @private
     */
    static findCodeMagasinByFiness(finess) {
        // Récupérer les magasins depuis le localStorage
        const magasinsStored = localStorage.getItem('orixis_magasins');
        if (!magasinsStored) return finess;
        
        try {
            const magasins = JSON.parse(magasinsStored);
            // Chercher le magasin par FINESS
            for (const [code, data] of Object.entries(magasins)) {
                if (data.numeroFINESS === finess) {
                    console.log(`✅ FINESS ${finess} → Code magasin ${code}`);
                    return code;
                }
            }
        } catch (error) {
            console.error('❌ Erreur recherche code magasin:', error);
        }
        
        console.warn(`⚠️ Code magasin non trouvé pour FINESS ${finess}`);
        return finess; // Retourner le FINESS si pas trouvé
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
    analyserDocument: DecompteSecuOpenAIService.analyserDocument.bind(DecompteSecuOpenAIService),
    analyserDocumentExistant: DecompteSecuOpenAIService.analyserDocumentExistant.bind(DecompteSecuOpenAIService),
    extractDecompteSecuData: DecompteSecuOpenAIService.extractDecompteSecuData.bind(DecompteSecuOpenAIService)
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création adaptée pour sécurité sociale
   - Prompt spécifique CPAM avec taux et participations
   - Extraction du contexte médical (ALD, maternité...)
   - Détection des actes médicaux et codes CCAM
   - Calcul des participations forfaitaires et franchises
   
   NOTES POUR REPRISES FUTURES:
   - Le prompt est optimisé pour les décomptes CPAM FR
   - Gestion des taux standards (70%, 65%, 30%, 100%)
   - Participations : 1€ consultation, 0.50€ médicaments
   - Contexte médical important pour le taux (ALD = 100%)
   ======================================== */