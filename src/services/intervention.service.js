// ========================================
// INTERVENTION.SERVICE.JS - Gestion des interventions Firebase
// Chemin: src/js/services/intervention.service.js
//
// DESCRIPTION:
// Service de gestion des interventions avec Firebase
// Basé sur l'architecture de commandes.service.js
//
// STRUCTURE:
// 1. Imports et configuration
// 2. Méthodes CRUD principales
// 3. Gestion des statuts
// 4. Méthodes d'édition
// 5. Statistiques et helpers
// ========================================

import { db } from './firebase.service.js';
import { ClientsService } from './clients.service.js';
import { 
    INTERVENTION_CONFIG, 
    genererNumeroIntervention,
    getProchainStatut,
    peutEtreAnnulee
} from '../data/intervention.data.js';

/**
 * Service de gestion des interventions
 */
export class InterventionService {
    
    /**
     * Créer une nouvelle intervention
     * @param {Object} interventionData - Données de l'intervention
     * @returns {Promise<string>} ID de l'intervention créée
     */
    static async creerIntervention(interventionData) {
        try {
            // Validation des données essentielles
            if (!interventionData.clientId) {
                throw new Error('Client requis');
            }
            
            if (!interventionData.appareil?.type) {
                throw new Error('Type d\'appareil requis');
            }
            
            if (!interventionData.problemes || interventionData.problemes.length === 0) {
                throw new Error('Au moins un problème requis');
            }
            
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer les infos du client si pas déjà fournies
            let client = interventionData.client;
            if (!client && interventionData.clientId) {
                client = await ClientsService.getClient(interventionData.clientId);
                if (!client) {
                    throw new Error('Client introuvable');
                }
            }
            
            // Récupérer l'utilisateur actuel
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const intervenant = auth.collaborateur || null;
            
            // Préparer les données de l'intervention
            const nouvelleIntervention = {
                // Identifiant
                numeroIntervention: interventionData.numeroIntervention || 
                                   genererNumeroIntervention(interventionData.magasin || auth.magasin),
                
                // Statut initial
                statut: interventionData.statut || 'nouvelle',
                
                // Client
                clientId: interventionData.clientId,
                client: {
                    id: client.id,
                    nom: client.nom,
                    prenom: client.prenom,
                    telephone: client.telephone || '',
                    email: client.email || '',
                    magasinReference: client.magasinReference || ''
                },
                
                // Appareil
                appareil: {
                    type: interventionData.appareil.type,
                    marque: interventionData.appareil.marque || '',
                    modele: interventionData.appareil.modele || '',
                    numeroSerie: interventionData.appareil.numeroSerie || ''
                },
                
                // Diagnostic
                problemes: interventionData.problemes,
                actions: interventionData.actions || [],
                
                // Résultat
                resultat: interventionData.resultat || '',
                observations: interventionData.observations || '',
                
                // Magasin et intervenant
                magasin: interventionData.magasin || auth.magasin || '',
                intervenant: intervenant ? {
                    id: intervenant.id || 'unknown',
                    nom: intervenant.nom || '',
                    prenom: intervenant.prenom || ''
                } : null,
                
                // Dates
                dates: {
                    intervention: serverTimestamp(),
                    demarrage: null,
                    cloture: null,
                    signatureClient: null,
                    signatureIntervenant: null
                },
                
                // Signatures (vides au départ)
                signatures: {
                    client: null,
                    intervenant: null
                },
                
                // SAV
                savEnvoye: false,
                dateSavEnvoye: null,
                
                // Historique
                historique: [{
                    date: new Date(),
                    action: 'creation',
                    utilisateur: intervenant,
                    details: 'Intervention créée',
                    timestamp: Date.now()
                }]
            };
            
            // Créer dans Firebase
            const docRef = await addDoc(collection(db, 'interventions'), nouvelleIntervention);
            
            console.log('✅ Intervention créée:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création intervention:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer une intervention par son ID
     * @param {string} interventionId - ID de l'intervention
     * @returns {Promise<Object>} Données de l'intervention
     */
    static async getIntervention(interventionId) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const interventionDoc = await getDoc(doc(db, 'interventions', interventionId));
            
            if (interventionDoc.exists()) {
                return { id: interventionDoc.id, ...interventionDoc.data() };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération intervention:', error);
            return null;
        }
    }
    
    /**
     * Récupérer les interventions selon des critères
     * @param {Object} criteres - Critères de recherche
     * @returns {Promise<Array>} Liste des interventions
     */
    static async getInterventions(criteres = {}) {
        try {
            const { collection, getDocs, query, where, orderBy, limit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let constraints = [];
            
            // Filtrer par magasin de l'utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            if (auth.magasin) {
                constraints.push(where('magasin', '==', auth.magasin));
            }
            
            // Autres filtres
            if (criteres.statut) {
                constraints.push(where('statut', '==', criteres.statut));
            }
            
            if (criteres.resultat) {
                constraints.push(where('resultat', '==', criteres.resultat));
            }
            
            if (criteres.clientId) {
                constraints.push(where('clientId', '==', criteres.clientId));
            }
            
            // Tri et limite
            constraints.push(orderBy('dates.intervention', 'desc'));
            
            if (criteres.limite) {
                constraints.push(limit(criteres.limite));
            }
            
            const q = query(collection(db, 'interventions'), ...constraints);
            const snapshot = await getDocs(q);
            
            const interventions = [];
            snapshot.forEach((doc) => {
                interventions.push({ id: doc.id, ...doc.data() });
            });
            
            return interventions;
            
        } catch (error) {
            console.error('❌ Erreur récupération interventions:', error);
            return [];
        }
    }
    
    /**
     * Rechercher des interventions
     * @param {string} recherche - Terme de recherche
     * @returns {Promise<Array>} Interventions trouvées
     */
    static async rechercherInterventions(recherche) {
        try {
            if (!recherche || recherche.length < 2) {
                return await this.getInterventions({ limite: 50 });
            }
            
            // Récupérer toutes les interventions récentes
            const interventions = await this.getInterventions({ limite: 200 });
            
            const termeRecherche = recherche.toLowerCase();
            
            // Filtrer localement
            return interventions.filter(intervention => {
                const clientNom = `${intervention.client.prenom} ${intervention.client.nom}`.toLowerCase();
                const numero = intervention.numeroIntervention?.toLowerCase() || '';
                const marque = intervention.appareil?.marque?.toLowerCase() || '';
                
                return clientNom.includes(termeRecherche) ||
                       numero.includes(termeRecherche) ||
                       marque.includes(termeRecherche);
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche interventions:', error);
            return [];
        }
    }
    
    /**
     * Changer le statut d'une intervention
     * @param {string} interventionId - ID de l'intervention
     * @param {string} nouveauStatut - Nouveau statut
     * @param {Object} donnees - Données additionnelles
     * @returns {Promise<boolean>} Succès du changement
     */
    static async changerStatut(interventionId, nouveauStatut, donnees = {}) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Récupérer l'intervention actuelle
            const intervention = await this.getIntervention(interventionId);
            if (!intervention) {
                throw new Error('Intervention introuvable');
            }
            
            // Vérifier que le changement est valide
            const statutSuivantAttendu = getProchainStatut(intervention.statut);
            if (nouveauStatut !== 'annulee' && nouveauStatut !== statutSuivantAttendu) {
                throw new Error(`Passage de ${intervention.statut} à ${nouveauStatut} non autorisé`);
            }
            
            // Récupérer l'utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = auth.collaborateur || { prenom: 'Utilisateur', nom: '' };
            
            // Préparer les mises à jour
            const updates = {
                statut: nouveauStatut,
                historique: arrayUnion({
                    date: new Date(),
                    action: `statut_${nouveauStatut}`,
                    utilisateur: utilisateur,
                    details: `Statut changé en ${INTERVENTION_CONFIG.STATUTS[nouveauStatut].label}`,
                    timestamp: Date.now()
                })
            };
            
            // Mises à jour spécifiques selon le statut
            switch (nouveauStatut) {
                case 'en_cours':
                    updates['dates.demarrage'] = serverTimestamp();
                    break;
                    
                case 'terminee':
                    updates['dates.cloture'] = serverTimestamp();
                    
                    // Vérifier que le résultat est renseigné
                    if (!intervention.resultat) {
                        throw new Error('Le résultat doit être renseigné avant de terminer');
                    }
                    
                    // Si signatures fournies
                    if (donnees.signatures) {
                        updates.signatures = donnees.signatures;
                        updates['dates.signatureClient'] = serverTimestamp();
                        updates['dates.signatureIntervenant'] = serverTimestamp();
                    }
                    break;
                    
                case 'annulee':
                    if (!peutEtreAnnulee(intervention.statut)) {
                        throw new Error('Cette intervention ne peut plus être annulée');
                    }
                    updates.annulation = {
                        date: serverTimestamp(),
                        par: utilisateur,
                        motif: donnees.motifAnnulation || 'Non spécifié'
                    };
                    break;
            }
            
            // Effectuer la mise à jour
            await updateDoc(doc(db, 'interventions', interventionId), updates);
            
            console.log(`✅ Statut changé: ${intervention.statut} → ${nouveauStatut}`);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur changement statut:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour une intervention
     * @param {string} interventionId - ID de l'intervention
     * @param {Object} updates - Mises à jour
     * @returns {Promise<boolean>} Succès
     */
    static async mettreAJourIntervention(interventionId, updates) {
        try {
            const { doc, updateDoc, arrayUnion } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Ajouter à l'historique
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = auth.collaborateur || { prenom: 'Utilisateur', nom: '' };
            
            updates.historique = arrayUnion({
                date: new Date(),
                action: 'modification',
                utilisateur: utilisateur,
                details: 'Intervention modifiée',
                timestamp: Date.now()
            });
            
            await updateDoc(doc(db, 'interventions', interventionId), updates);
            
            console.log('✅ Intervention mise à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour intervention:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir les statistiques des interventions
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        try {
            const interventions = await this.getInterventions({ limite: 1000 });
            
            const stats = {
                total: interventions.length,
                nouvelles: 0,
                en_cours: 0,
                terminees_jour: 0,
                sav_semaine: 0
            };
            
            const aujourd_hui = new Date();
            aujourd_hui.setHours(0, 0, 0, 0);
            
            const debutSemaine = new Date();
            debutSemaine.setDate(debutSemaine.getDate() - 7);
            debutSemaine.setHours(0, 0, 0, 0);
            
            interventions.forEach(intervention => {
                // Par statut
                if (intervention.statut === 'nouvelle') stats.nouvelles++;
                else if (intervention.statut === 'en_cours') stats.en_cours++;
                
                // Terminées aujourd'hui
                if (intervention.statut === 'terminee' && intervention.dates?.cloture) {
                    const dateCloture = intervention.dates.cloture.toDate ? 
                        intervention.dates.cloture.toDate() : 
                        new Date(intervention.dates.cloture);
                    
                    if (dateCloture >= aujourd_hui) {
                        stats.terminees_jour++;
                    }
                }
                
                // SAV cette semaine
                if (intervention.resultat === 'SAV' && intervention.dates?.intervention) {
                    const dateIntervention = intervention.dates.intervention.toDate ? 
                        intervention.dates.intervention.toDate() : 
                        new Date(intervention.dates.intervention);
                    
                    if (dateIntervention >= debutSemaine) {
                        stats.sav_semaine++;
                    }
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                nouvelles: 0,
                en_cours: 0,
                terminees_jour: 0,
                sav_semaine: 0
            };
        }
    }
    
    /**
     * Ajouter les signatures à une intervention
     * @param {string} interventionId - ID de l'intervention
     * @param {Object} signatures - Signatures client et intervenant
     * @returns {Promise<boolean>} Succès
     */
    static async ajouterSignatures(interventionId, signatures) {
        try {
            const { doc, updateDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const updates = {
                signatures: signatures,
                'dates.signatureClient': serverTimestamp(),
                'dates.signatureIntervenant': serverTimestamp()
            };
            
            // Si les signatures sont fournies, on peut terminer l'intervention
            if (signatures.client && signatures.intervenant) {
                updates.statut = 'terminee';
                updates['dates.cloture'] = serverTimestamp();
            }
            
            await updateDoc(doc(db, 'interventions', interventionId), updates);
            
            console.log('✅ Signatures ajoutées');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur ajout signatures:', error);
            throw error;
        }
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Création du service
   - Architecture basée sur commandes.service.js
   - Adaptation au contexte des interventions
   - Gestion des signatures
   - Support du SAV
   
   NOTES POUR REPRISES FUTURES:
   - Les signatures sont gérées séparément (signature-client.html)
   - L'envoi SAV utilise EmailJS (géré dans detail.js)
   - Les statistiques incluent les interventions du jour et SAV semaine
   - Pas de gestion de prix contrairement aux commandes
   ======================================== */