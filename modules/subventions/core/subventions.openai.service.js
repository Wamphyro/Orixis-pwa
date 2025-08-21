// ========================================
// SUBVENTIONS.OPENAI.SERVICE.JS - Analyse IA documents
// Chemin: modules/subventions/subventions.openai.service.js
//
// DESCRIPTION:
// Service d'analyse des documents avec OpenAI
// Extraction d'informations des décisions MDPH/AGEFIPH
// ========================================

// import { openaiService } from '../../../src/services/openai.service.js';

// Service OpenAI temporairement désactivé
const openaiService = {
    analyzeDocument: async () => ({ error: 'Service OpenAI non disponible' }),
    analyzeMultipleDocuments: async () => ({ error: 'Service OpenAI non disponible' }),
    complete: async () => ({ error: 'Service OpenAI non disponible' })
};
import { subventionsConfig } from './subventions.config.js';

class SubventionsOpenAIService {
    constructor() {
        this.prompts = {
            analyseDecisionMDPH: this.getPromptDecisionMDPH(),
            analyseDecisionAGEFIPH: this.getPromptDecisionAGEFIPH(),
            extractionMontants: this.getPromptExtractionMontants(),
            verificationCoherence: this.getPromptVerificationCoherence()
        };
    }
    
    // ========================================
    // ANALYSE DE DÉCISIONS
    // ========================================
    
    /**
     * Analyser une décision MDPH
     */
    async analyseDecisionMDPH(documentContent) {
        try {
            const prompt = this.prompts.analyseDecisionMDPH;
            
            const response = await openaiService.analyzeDocument({
                content: documentContent,
                prompt: prompt,
                extractStructured: true
            });
            
            // Parser la réponse
            const result = this.parseDecisionMDPH(response);
            
            // Valider les données extraites
            this.validateDecisionMDPH(result);
            
            return {
                success: true,
                data: result,
                confidence: this.calculateConfidence(result)
            };
            
        } catch (error) {
            console.error('Erreur analyse décision MDPH:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
    
    /**
     * Analyser une décision AGEFIPH
     */
    async analyseDecisionAGEFIPH(documentContent) {
        try {
            const prompt = this.prompts.analyseDecisionAGEFIPH;
            
            const response = await openaiService.analyzeDocument({
                content: documentContent,
                prompt: prompt,
                extractStructured: true
            });
            
            // Parser la réponse
            const result = this.parseDecisionAGEFIPH(response);
            
            // Valider les données extraites
            this.validateDecisionAGEFIPH(result);
            
            return {
                success: true,
                data: result,
                confidence: this.calculateConfidence(result),
                numeroDossier: result.numeroDossier // Important pour le rapprochement bancaire
            };
            
        } catch (error) {
            console.error('Erreur analyse décision AGEFIPH:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }
    
    // ========================================
    // EXTRACTION SPÉCIFIQUE
    // ========================================
    
    /**
     * Extraire les montants d'un document
     */
    async extractMontants(documentContent) {
        try {
            const prompt = this.prompts.extractionMontants;
            
            const response = await openaiService.analyzeDocument({
                content: documentContent,
                prompt: prompt,
                extractNumbers: true
            });
            
            return this.parseMontants(response);
            
        } catch (error) {
            console.error('Erreur extraction montants:', error);
            return {
                montantTotal: 0,
                montantAccorde: 0,
                resteACharge: 0
            };
        }
    }
    
    /**
     * Vérifier la cohérence d'un dossier
     */
    async verifyCoherence(documents) {
        try {
            const prompt = this.prompts.verificationCoherence;
            const documentsContent = documents.map(doc => ({
                type: doc.type,
                content: doc.content
            }));
            
            const response = await openaiService.analyzeMultipleDocuments({
                documents: documentsContent,
                prompt: prompt,
                compareData: true
            });
            
            return {
                coherent: response.coherent || false,
                anomalies: response.anomalies || [],
                suggestions: response.suggestions || []
            };
            
        } catch (error) {
            console.error('Erreur vérification cohérence:', error);
            return {
                coherent: true,
                anomalies: [],
                suggestions: []
            };
        }
    }
    
    // ========================================
    // RAPPROCHEMENT BANCAIRE
    // ========================================
    
    /**
     * Analyser un libellé bancaire pour rapprochement
     */
    async analyzeLibelleBancaire(libelle) {
        try {
            // Extraire les informations du libellé
            const patterns = {
                agefiph: /AGEFIPH/i,
                numeroDossier: /(?:DOS|DOSSIER|REF)?\.?\s*(\d{6,})/i,
                montant: /(\d+[\s,]?\d*)\s*(?:EUR|€)/i,
                nom: /([A-Z]{2,}(?:\s+[A-Z]{2,})*)/
            };
            
            const result = {
                isAgefiph: patterns.agefiph.test(libelle),
                numeroDossier: null,
                montant: null,
                nomPossible: null
            };
            
            // Extraire le numéro de dossier
            const matchDossier = libelle.match(patterns.numeroDossier);
            if (matchDossier) {
                result.numeroDossier = matchDossier[1];
            }
            
            // Extraire le montant
            const matchMontant = libelle.match(patterns.montant);
            if (matchMontant) {
                result.montant = parseFloat(
                    matchMontant[1].replace(/[\s,]/g, '')
                );
            }
            
            // Extraire un nom possible
            const matchNom = libelle.match(patterns.nom);
            if (matchNom) {
                result.nomPossible = matchNom[1];
            }
            
            // Si les patterns ne suffisent pas, utiliser l'IA
            if (result.isAgefiph && !result.numeroDossier) {
                const iaResult = await this.extractWithAI(libelle);
                result.numeroDossier = iaResult.numeroDossier || result.numeroDossier;
                result.nomPossible = iaResult.nom || result.nomPossible;
            }
            
            return result;
            
        } catch (error) {
            console.error('Erreur analyse libellé bancaire:', error);
            return {
                isAgefiph: false,
                numeroDossier: null,
                montant: null,
                nomPossible: null
            };
        }
    }
    
    /**
     * Extraction avec IA si les patterns échouent
     */
    async extractWithAI(libelle) {
        const prompt = `
            Analyser ce libellé bancaire et extraire :
            1. Le numéro de dossier AGEFIPH (généralement 6-8 chiffres)
            2. Le nom du bénéficiaire (nom de famille en majuscules)
            
            Libellé : "${libelle}"
            
            Répondre au format JSON :
            {
                "numeroDossier": "...",
                "nom": "..."
            }
        `;
        
        try {
            const response = await openaiService.complete({
                prompt: prompt,
                maxTokens: 100,
                temperature: 0.1
            });
            
            return JSON.parse(response);
        } catch {
            return { numeroDossier: null, nom: null };
        }
    }
    
    // ========================================
    // PROMPTS
    // ========================================
    
    getPromptDecisionMDPH() {
        return `
            Analyser cette décision MDPH et extraire les informations suivantes :
            
            1. DÉCISION PRINCIPALE
               - Type de décision : RQTH / PCH / Refus
               - Date de la décision
               - Durée de validité
               - Taux d'incapacité si mentionné
            
            2. BÉNÉFICIAIRE
               - Nom et prénom
               - Date de naissance
               - Numéro de dossier MDPH
            
            3. DROITS ACCORDÉS
               - RQTH : Oui/Non, période
               - PCH : Oui/Non, montant si précisé
               - Orientation professionnelle si mentionnée
            
            4. MONTANTS (si PCH accordée)
               - Montant aide technique
               - Montant total accordé
               - Modalités de versement
            
            Répondre UNIQUEMENT au format JSON structuré.
        `;
    }
    
    getPromptDecisionAGEFIPH() {
        return `
            Analyser cette décision AGEFIPH et extraire :
            
            1. IDENTIFICATION
               - Numéro de dossier AGEFIPH (TRÈS IMPORTANT)
               - Date de décision
               - Référence interne
            
            2. BÉNÉFICIAIRE
               - Nom et prénom
               - Numéro de sécurité sociale (masquer sauf 5 derniers chiffres)
            
            3. DÉCISION
               - Accord / Refus
               - Motif si refus
            
            4. FINANCEMENT ACCORDÉ
               - Montant total accordé
               - Part AGEFIPH
               - Reste à charge
               - Nature de l'aide (appareillage auditif)
            
            5. MODALITÉS
               - Versement direct ou tiers payant
               - Conditions particulières
            
            Le numéro de dossier est CRITIQUE pour le rapprochement bancaire.
            Répondre au format JSON.
        `;
    }
    
    getPromptExtractionMontants() {
        return `
            Extraire tous les montants mentionnés dans ce document :
            
            1. Identifier chaque montant avec son contexte
            2. Distinguer :
               - Coût total de l'équipement
               - Montants accordés (MDPH, AGEFIPH, autres)
               - Reste à charge
               - Base sécurité sociale
            
            3. Convertir tous les montants en centimes (nombre entier)
            
            Format de réponse :
            {
                "coutTotal": ...,
                "montants": [
                    {"source": "...", "montant": ..., "type": "..."}
                ],
                "resteACharge": ...
            }
        `;
    }
    
    getPromptVerificationCoherence() {
        return `
            Vérifier la cohérence entre ces documents d'un dossier de subvention :
            
            1. Vérifier que les informations patient correspondent
               - Nom, prénom, date de naissance
               - Adresse
               - Cohérence des dates
            
            2. Vérifier les montants
               - Le devis correspond aux montants demandés
               - Les montants accordés sont cohérents
               - Le reste à charge est correct
            
            3. Identifier les anomalies
               - Informations contradictoires
               - Documents manquants évidents
               - Dates incohérentes
            
            4. Suggestions d'amélioration
            
            Répondre avec :
            {
                "coherent": true/false,
                "anomalies": [...],
                "suggestions": [...]
            }
        `;
    }
    
    // ========================================
    // PARSING ET VALIDATION
    // ========================================
    
    parseDecisionMDPH(response) {
        try {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            
            return {
                decision: {
                    type: data.decision?.type || 'inconnu',
                    date: data.decision?.date || null,
                    validite: data.decision?.validite || null,
                    tauxIncapacite: data.decision?.tauxIncapacite || null
                },
                beneficiaire: {
                    nom: data.beneficiaire?.nom || '',
                    prenom: data.beneficiaire?.prenom || '',
                    dateNaissance: data.beneficiaire?.dateNaissance || null,
                    numeroDossier: data.beneficiaire?.numeroDossier || ''
                },
                droits: {
                    rqth: {
                        accorde: data.droits?.rqth?.accorde || false,
                        dateDebut: data.droits?.rqth?.dateDebut || null,
                        dateFin: data.droits?.rqth?.dateFin || null
                    },
                    pch: {
                        accorde: data.droits?.pch?.accorde || false,
                        montant: data.droits?.pch?.montant || 0
                    }
                }
            };
        } catch (error) {
            console.error('Erreur parsing décision MDPH:', error);
            throw new Error('Format de réponse invalide');
        }
    }
    
    parseDecisionAGEFIPH(response) {
        try {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            
            return {
                numeroDossier: data.identification?.numeroDossier || '',
                dateDecision: data.identification?.dateDecision || null,
                beneficiaire: {
                    nom: data.beneficiaire?.nom || '',
                    prenom: data.beneficiaire?.prenom || ''
                },
                decision: {
                    statut: data.decision?.statut || 'inconnu',
                    motifRefus: data.decision?.motifRefus || null
                },
                financement: {
                    montantAccorde: data.financement?.montantAccorde || 0,
                    partAgefiph: data.financement?.partAgefiph || 0,
                    resteACharge: data.financement?.resteACharge || 0
                }
            };
        } catch (error) {
            console.error('Erreur parsing décision AGEFIPH:', error);
            throw new Error('Format de réponse invalide');
        }
    }
    
    parseMontants(response) {
        try {
            const data = typeof response === 'string' ? JSON.parse(response) : response;
            
            return {
                coutTotal: data.coutTotal || 0,
                montants: data.montants || [],
                resteACharge: data.resteACharge || 0
            };
        } catch {
            return {
                coutTotal: 0,
                montants: [],
                resteACharge: 0
            };
        }
    }
    
    validateDecisionMDPH(data) {
        const required = [
            'decision.type',
            'beneficiaire.nom',
            'beneficiaire.numeroDossier'
        ];
        
        for (const field of required) {
            const value = field.split('.').reduce((obj, key) => obj?.[key], data);
            if (!value) {
                throw new Error(`Champ requis manquant : ${field}`);
            }
        }
    }
    
    validateDecisionAGEFIPH(data) {
        const required = [
            'numeroDossier',
            'decision.statut',
            'beneficiaire.nom'
        ];
        
        for (const field of required) {
            const value = field.split('.').reduce((obj, key) => obj?.[key], data);
            if (!value) {
                throw new Error(`Champ requis manquant : ${field}`);
            }
        }
    }
    
    calculateConfidence(data) {
        // Calculer un score de confiance basé sur les champs remplis
        let filledFields = 0;
        let totalFields = 0;
        
        const countFields = (obj) => {
            for (const value of Object.values(obj)) {
                totalFields++;
                if (value !== null && value !== '' && value !== 0) {
                    filledFields++;
                }
                if (typeof value === 'object' && !Array.isArray(value)) {
                    countFields(value);
                }
            }
        };
        
        countFields(data);
        
        return Math.round((filledFields / totalFields) * 100);
    }
}

// Export de l'instance unique
export const subventionsOpenAIService = new SubventionsOpenAIService();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsOpenAIService;