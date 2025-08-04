// ========================================
// OPERATIONS-BANCAIRES.SERVICE.JS - 🎯 SERVICE MÉTIER PRINCIPAL
// 
// RÔLE : Logique business des opérations bancaires
// - CRUD des opérations
// - Calcul des statistiques
// - Gestion des catégories
// - Import/Export
// ========================================

import { db } from '../../src/services/firebase.service.js';
import { 
    OPERATIONS_CONFIG, 
    formaterMontant,
    formaterDate,
    calculerBalance,
    getStatistiquesParCategorie,
    detecterCategorie,
    ajouterCompteBancaire
} from './operations-bancaires.data.js';

/**
 * Service de gestion des opérations bancaires
 */
export class OperationsBancairesService {
    
    /**
     * Récupérer les opérations selon des critères
     * @param {Object} criteres - Critères de recherche
     * @returns {Promise<Array>} Liste des opérations
     */
    static async getOperations(criteres = {}) {
        try {
            const { collection, getDocs, query, where, orderBy, limit } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            let constraints = [];
            
            // Filtrer par type
            if (criteres.type) {
                constraints.push(where('type', '==', criteres.type));
            }
            
            // Filtrer par catégorie
            if (criteres.categorie) {
                constraints.push(where('categorie', '==', criteres.categorie));
            }
            
            // Filtrer par compte
            if (criteres.compte) {
                constraints.push(where('accountNumber', '==', criteres.compte));
            }
            
            // Filtrer par période
            if (criteres.dateDebut) {
                constraints.push(where('date', '>=', criteres.dateDebut));
            }
            
            if (criteres.dateFin) {
                constraints.push(where('date', '<=', criteres.dateFin));
            }
            
            // Tri par date décroissant par défaut
            constraints.push(orderBy('date', 'desc'));
            
            // Limite si spécifiée
            if (criteres.limite) {
                constraints.push(limit(criteres.limite));
            }
            
            const q = query(collection(db, 'operations_bancaires'), ...constraints);
            const snapshot = await getDocs(q);
            
            const operations = [];
            snapshot.forEach((doc) => {
                operations.push({ id: doc.id, ...doc.data() });
            });
            
            return operations;
            
        } catch (error) {
            console.error('❌ Erreur récupération opérations:', error);
            return [];
        }
    }
    
    /**
     * Récupérer une opération par son ID
     * @param {string} operationId - ID de l'opération
     * @returns {Promise<Object>} Données de l'opération
     */
    static async getOperation(operationId) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const operationDoc = await getDoc(doc(db, 'operations_bancaires', operationId));
            
            if (operationDoc.exists()) {
                return { id: operationDoc.id, ...operationDoc.data() };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération opération:', error);
            return null;
        }
    }
    
    /**
     * Créer une nouvelle opération
     * @param {Object} data - Données de l'opération
     * @returns {Promise<string>} ID de l'opération créée
     */
    static async creerOperation(data) {
        try {
            const { collection, addDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const operationData = {
                date: data.date,
                dateValeur: data.dateValeur || data.date,
                libelle: data.libelle,
                montant: parseFloat(data.montant),
                type: data.montant >= 0 ? 'credit' : 'debit',
                categorie: data.categorie || detecterCategorie(data.libelle),
                accountNumber: data.accountNumber || null,
                accountName: data.accountName || null,
                reference: data.reference || null,
                solde: data.solde || null,
                devise: data.devise || 'EUR',
                pointee: false,
                createdAt: serverTimestamp(),
                createdBy: this.getUtilisateurActuel()
            };
            
            const docRef = await addDoc(collection(db, 'operations_bancaires'), operationData);
            
            console.log('✅ Opération créée:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création opération:', error);
            throw error;
        }
    }
    
    /**
     * Importer plusieurs opérations
     * @param {Array} operations - Liste des opérations à importer
     * @returns {Promise<Object>} Résultat de l'import
     */
    static async importerOperations(operations) {
        const resultats = {
            reussies: 0,
            echecs: 0,
            doublons: 0,
            total: operations.length
        };
        
        try {
            // Détecter et enregistrer les comptes bancaires
            const comptesDetectes = new Set();
            operations.forEach(op => {
                if (op.accountNumber && !comptesDetectes.has(op.accountNumber)) {
                    comptesDetectes.add(op.accountNumber);
                    ajouterCompteBancaire(op.accountNumber, {
                        maskedNumber: op.accountNumber.slice(-4),
                        accountName: op.accountName,
                        bank: op.bank
                    });
                }
            });
            
            // Importer les opérations
            for (const operation of operations) {
                try {
                    // Vérifier les doublons (même date, montant, libellé)
                    const existante = await this.verifierDoublon(operation);
                    if (existante) {
                        resultats.doublons++;
                        continue;
                    }
                    
                    await this.creerOperation(operation);
                    resultats.reussies++;
                    
                } catch (error) {
                    console.error('Erreur import opération:', error);
                    resultats.echecs++;
                }
            }
            
            console.log('📊 Import terminé:', resultats);
            return resultats;
            
        } catch (error) {
            console.error('❌ Erreur import global:', error);
            throw error;
        }
    }
    
    /**
     * Vérifier si une opération existe déjà (doublon)
     */
    static async verifierDoublon(operation) {
        try {
            const { collection, query, where, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'operations_bancaires'),
                where('date', '==', operation.date),
                where('montant', '==', operation.montant),
                where('libelle', '==', operation.libelle)
            );
            
            const snapshot = await getDocs(q);
            return !snapshot.empty;
            
        } catch (error) {
            console.error('Erreur vérification doublon:', error);
            return false;
        }
    }
    
    /**
     * Mettre à jour une opération
     * @param {string} operationId - ID de l'opération
     * @param {Object} updates - Mises à jour à appliquer
     * @returns {Promise<boolean>} Succès
     */
    static async mettreAJourOperation(operationId, updates) {
        try {
            const { doc, updateDoc, serverTimestamp } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const updatesAvecMeta = {
                ...updates,
                updatedAt: serverTimestamp(),
                updatedBy: this.getUtilisateurActuel()
            };
            
            await updateDoc(doc(db, 'operations_bancaires', operationId), updatesAvecMeta);
            
            console.log('✅ Opération mise à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour opération:', error);
            throw error;
        }
    }
    
    /**
     * Supprimer une opération
     * @param {string} operationId - ID de l'opération
     * @returns {Promise<void>}
     */
    static async supprimerOperation(operationId) {
        try {
            const { doc, deleteDoc } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await deleteDoc(doc(db, 'operations_bancaires', operationId));
            
            console.log('✅ Opération supprimée:', operationId);
            
        } catch (error) {
            console.error('❌ Erreur suppression opération:', error);
            throw new Error('Impossible de supprimer l\'opération : ' + error.message);
        }
    }
    
    /**
     * Pointer/Dépointer une opération
     * @param {string} operationId - ID de l'opération
     * @param {boolean} pointee - État pointé
     */
    static async pointerOperation(operationId, pointee = true) {
        return this.mettreAJourOperation(operationId, { pointee });
    }
    
    /**
     * Catégoriser plusieurs opérations
     * @param {Array<string>} operationIds - IDs des opérations
     * @param {string} categorie - Nouvelle catégorie
     */
    static async categoriserOperations(operationIds, categorie) {
        const resultats = {
            reussies: 0,
            echecs: 0
        };
        
        for (const id of operationIds) {
            try {
                await this.mettreAJourOperation(id, { categorie });
                resultats.reussies++;
            } catch (error) {
                resultats.echecs++;
            }
        }
        
        return resultats;
    }
    
    /**
     * Rechercher des opérations
     * @param {string} recherche - Terme de recherche
     * @returns {Promise<Array>} Opérations trouvées
     */
    static async rechercherOperations(recherche) {
        try {
            if (!recherche || recherche.length < 2) {
                return await this.getOperations({ limite: 100 });
            }
            
            // Récupérer toutes les opérations récentes
            const operations = await this.getOperations({ limite: 500 });
            
            const termeRecherche = recherche.toLowerCase();
            
            // Filtrer localement
            return operations.filter(operation => {
                const libelle = operation.libelle?.toLowerCase() || '';
                const reference = operation.reference?.toLowerCase() || '';
                const categorie = operation.categorie?.toLowerCase() || '';
                const montant = operation.montant?.toString() || '';
                
                return libelle.includes(termeRecherche) ||
                       reference.includes(termeRecherche) ||
                       categorie.includes(termeRecherche) ||
                       montant.includes(termeRecherche);
            });
            
        } catch (error) {
            console.error('❌ Erreur recherche opérations:', error);
            return [];
        }
    }
    
    /**
     * Obtenir les statistiques des opérations
     * @returns {Promise<Object>} Statistiques
     */
    static async getStatistiques() {
        try {
            const operations = await this.getOperations({ limite: 1000 });
            
            const stats = {
                total: operations.length,
                credits: 0,
                debits: 0,
                montantCredits: 0,
                montantDebits: 0,
                balance: 0,
                parCategorie: {},
                parCompte: {},
                pointees: 0,
                nonPointees: 0
            };
            
            // Calculer les statistiques
            operations.forEach(operation => {
                // Par type
                if (operation.type === 'credit' || operation.montant > 0) {
                    stats.credits++;
                    stats.montantCredits += Math.abs(operation.montant);
                } else {
                    stats.debits++;
                    stats.montantDebits += Math.abs(operation.montant);
                }
                
                // Balance
                stats.balance += operation.montant;
                
                // Par catégorie
                const cat = operation.categorie || 'autre';
                if (!stats.parCategorie[cat]) {
                    stats.parCategorie[cat] = {
                        nombre: 0,
                        montant: 0,
                        credits: 0,
                        debits: 0
                    };
                }
                stats.parCategorie[cat].nombre++;
                stats.parCategorie[cat].montant += operation.montant;
                if (operation.montant > 0) {
                    stats.parCategorie[cat].credits += operation.montant;
                } else {
                    stats.parCategorie[cat].debits += Math.abs(operation.montant);
                }
                
                // Par compte
                const compte = operation.accountNumber || 'inconnu';
                if (!stats.parCompte[compte]) {
                    stats.parCompte[compte] = {
                        nombre: 0,
                        balance: 0
                    };
                }
                stats.parCompte[compte].nombre++;
                stats.parCompte[compte].balance += operation.montant;
                
                // Pointage
                if (operation.pointee) {
                    stats.pointees++;
                } else {
                    stats.nonPointees++;
                }
            });
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                credits: 0,
                debits: 0,
                montantCredits: 0,
                montantDebits: 0,
                balance: 0,
                parCategorie: {},
                parCompte: {},
                pointees: 0,
                nonPointees: 0
            };
        }
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Récupérer l'utilisateur actuel
     */
    static getUtilisateurActuel() {
        const auth = localStorage.getItem('sav_auth');
        if (auth) {
            const authData = JSON.parse(auth);
            return authData.collaborateur || { id: 'unknown', prenom: 'Inconnu', nom: '' };
        }
        return { id: 'unknown', prenom: 'Inconnu', nom: '' };
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création basée sur decompte-mutuelle
   - Service CRUD pour opérations bancaires
   - Gestion des imports avec détection doublons
   - Statistiques par catégorie et compte
   - Fonction de pointage
   
   NOTES POUR REPRISES FUTURES:
   - Les doublons sont détectés par date+montant+libellé
   - Les catégories sont auto-détectées
   - Support multi-comptes bancaires
   ======================================== */