// ========================================
// OPERATIONS-BANCAIRES.FIRESTORE.SERVICE.JS - 🗄️ SERVICE FIRESTORE
// Chemin: modules/operations-bancaires/operations-bancaires.firestore.service.js
//
// DESCRIPTION:
// Service CRUD Firestore pour opérations bancaires
// Inclut les constantes métier et la détection de catégories
//
// VERSION: 2.0.0
// DATE: 03/02/2025
// ========================================

import { db } from '../../src/services/firebase.service.js';
import template from './operations-bancaires.template.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'operationsBancaires';

// ========================================
// RÈGLES DE DÉTECTION DES CATÉGORIES
// ========================================

const DETECTION_RULES = [
    { pattern: /SALAIRE|PAIE|VIREMENT\s+EMPLOYEUR/, categorie: 'salaires' },
    { pattern: /CPAM|SECU|SECURITE\s+SOCIALE|REMBT\s+SS/, categorie: 'remboursement_secu' },
    { pattern: /MUTUELLE|MMA|ALMERYS|HARMONIE/, categorie: 'remboursement_mutuelle' },
    { pattern: /IMPOT|IMPOTS|DGFIP|TRESOR\s+PUBLIC/, categorie: 'impots' },
    { pattern: /EDF|ENGIE|GAZ|ELECTRICITE/, categorie: 'energie' },
    { pattern: /ORANGE|SFR|BOUYGUES|FREE/, categorie: 'telecom' },
    { pattern: /ASSURANCE|MAIF|MACIF|AXA/, categorie: 'assurances' },
    { pattern: /CARREFOUR|LECLERC|AUCHAN|LIDL/, categorie: 'alimentation' },
    { pattern: /ESSENCE|CARBURANT|TOTAL|SHELL/, categorie: 'carburant' },
    { pattern: /RESTAURANT|RESTO|BRASSERIE/, categorie: 'restaurant' },
    { pattern: /AMAZON|FNAC|CDISCOUNT/, categorie: 'ecommerce' },
    { pattern: /CREDIT\s+IMMOBILIER|PRET\s+HABITAT/, categorie: 'credit_immobilier' },
    { pattern: /LOYER|LOCATION/, categorie: 'loyer' },
    { pattern: /PHARMACIE|DOCTEUR|MEDECIN/, categorie: 'sante' },
    { pattern: /RETRAIT|DAB|DISTRIBUTEUR/, categorie: 'retrait_especes' },
    { pattern: /VIREMENT|VIR\s+/, categorie: 'virement' },
    { pattern: /CHEQUE|CHQ/, categorie: 'cheque' },
    { pattern: /FRAIS|COMMISSION|AGIOS/, categorie: 'frais_bancaires' },
    { pattern: /NETFLIX|SPOTIFY|CANAL/, categorie: 'abonnements' },
    { pattern: /C A T\s+\d+|INTERETS/, categorie: 'epargne' }
];

// ========================================
// SERVICE FIRESTORE
// ========================================

class OperationsBancairesFirestoreService {
    
    // ========================================
    // CRÉATION
    // ========================================
    
    async creerOperation(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('📝 Création opération...');
            
            // Créer le template de base
            const operation = template.createNewOperation();
            
            // Générer la référence
            operation.reference = await this.genererReference();
            
            // Récupérer les infos utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            // Remplir les données
            operation.date = data.date;
            operation.dateValeur = data.dateValeur || data.date;
            operation.libelle = data.libelle;
            operation.montant = parseFloat(data.montant);
            operation.type = data.montant >= 0 ? 'credit' : 'debit';
            operation.categorie = data.categorie || this.detecterCategorie(data.libelle);
            operation.compte = data.compte || data.accountNumber || null;
            operation.banque = data.banque || data.bank || null;
            operation.reference = data.reference || null;
            operation.solde = data.solde || null;
            operation.pointee = false;
            operation.rapprochee = false;
            
            // Métadonnées
            operation.dates.creation = serverTimestamp();
            operation.intervenants.creePar = {
                id: auth.collaborateur?.id || 'import',
                nom: auth.collaborateur?.nom || 'Import',
                prenom: auth.collaborateur?.prenom || 'CSV'
            };
            
            // Historique initial
            operation.historique = [
                template.createHistoriqueEntry(
                    'creation',
                    'Opération importée',
                    operation.intervenants.creePar
                )
            ];
            
            // Créer dans Firestore
            const docRef = await addDoc(collection(db, COLLECTION_NAME), operation);
            
            console.log('✅ Opération créée:', operation.reference, 'ID:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création opération:', error);
            throw new Error(`Erreur création: ${error.message}`);
        }
    }
    
    async genererReference() {
        try {
            const date = new Date();
            const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `OP-${dateStr}-${random}`;
        } catch (error) {
            return `OP-${Date.now()}`;
        }
    }
    
    // ========================================
    // LECTURE
    // ========================================
    
    async getOperations(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, COLLECTION_NAME);
            const constraints = [];
            
            // Filtre par type
            if (filtres.type) {
                constraints.push(where('type', '==', filtres.type));
            }
            
            // Filtre par catégorie
            if (filtres.categorie) {
                constraints.push(where('categorie', '==', filtres.categorie));
            }
            
            // Filtre par compte
            if (filtres.compte) {
                constraints.push(where('compte', '==', filtres.compte));
            }
            
            // Tri par date décroissant
            constraints.push(orderBy('date', 'desc'));
            
            // Limite
            if (filtres.limite) {
                constraints.push(limit(filtres.limite));
            }
            
            // Appliquer les contraintes
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }
            
            // Exécuter la requête
            const snapshot = await getDocs(q);
            
            const operations = [];
            snapshot.forEach((doc) => {
                operations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 ${operations.length} opérations trouvées`);
            return operations;
            
        } catch (error) {
            console.error('❌ Erreur récupération opérations:', error);
            return [];
        }
    }
    
    async getOperationById(id) {
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération opération:', error);
            return null;
        }
    }
    
    async getStatistiques() {
        try {
            const operations = await this.getOperations({ limite: 1000 });
            
            const stats = {
                total: operations.length,
                credits: 0,
                debits: 0,
                montantCredits: 0,
                montantDebits: 0,
                balance: 0,
                pointees: 0,
                nonPointees: 0,
                parCategorie: {},
                parCompte: {}
            };
            
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
                
                // Pointage
                if (operation.pointee) {
                    stats.pointees++;
                } else {
                    stats.nonPointees++;
                }
                
                // Par catégorie
                const cat = operation.categorie || 'autre';
                if (!stats.parCategorie[cat]) {
                    stats.parCategorie[cat] = {
                        nombre: 0,
                        montant: 0
                    };
                }
                stats.parCategorie[cat].nombre++;
                stats.parCategorie[cat].montant += operation.montant;
                
                // Par compte
                const compte = operation.compte || 'inconnu';
                if (!stats.parCompte[compte]) {
                    stats.parCompte[compte] = {
                        nombre: 0,
                        balance: 0
                    };
                }
                stats.parCompte[compte].nombre++;
                stats.parCompte[compte].balance += operation.montant;
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
                pointees: 0,
                nonPointees: 0,
                parCategorie: {},
                parCompte: {}
            };
        }
    }
    
    // ========================================
    // MISE À JOUR
    // ========================================
    
    async mettreAJourOperation(operationId, updates) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || ''
            };
            
            const updatesAvecMeta = {
                ...updates,
                'dates.derniereModification': serverTimestamp(),
                'intervenants.modifiePar': utilisateur,
                historique: arrayUnion(
                    template.createHistoriqueEntry(
                        'modification',
                        'Opération modifiée',
                        utilisateur
                    )
                )
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, operationId), updatesAvecMeta);
            
            console.log('✅ Opération mise à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour:', error);
            throw error;
        }
    }
    
    async pointerOperation(operationId, pointee = true) {
        return this.mettreAJourOperation(operationId, { pointee });
    }
    
    async categoriserOperation(operationId, categorie) {
        return this.mettreAJourOperation(operationId, { categorie });
    }
    
    async rapprocherOperation(operationId, donneesRapprochement) {
        const updates = {
            rapprochee: true,
            'rapprochement.date': new Date(),
            'rapprochement.reference': donneesRapprochement.reference || null,
            'rapprochement.document': donneesRapprochement.document || null
        };
        
        return this.mettreAJourOperation(operationId, updates);
    }
    
    // ========================================
    // SUPPRESSION
    // ========================================
    
    async supprimerOperation(operationId) {
        try {
            const { doc, deleteDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            await deleteDoc(doc(db, COLLECTION_NAME, operationId));
            
            console.log('✅ Opération supprimée:', operationId);
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw new Error('Impossible de supprimer l\'opération');
        }
    }
    
    // ========================================
    // IMPORT
    // ========================================
    
async trouverCodeParACM(nomFichier) {
    if (!nomFichier) return '-';
    
    try {
        const { collection, getDocs } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Nettoyer le nom du fichier (enlever .csv)
        const nomNettoye = nomFichier.replace(/\.[^/.]+$/, '');
        console.log('🔍 Recherche ACM dans le nom:', nomNettoye);
        
        // 1. Récupérer TOUS les magasins
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        for (const doc of magasinsSnapshot.docs) {
            const magasin = doc.data();
            const numeroACM = magasin.identification?.numeroCompteACM;
            if (numeroACM && nomNettoye.includes(numeroACM)) {
                console.log(`✅ Magasin trouvé: ${magasin.code} (ACM: ${numeroACM})`);
                return magasin.code;
            }
        }
        
        // 2. Récupérer TOUTES les sociétés
        const societesSnapshot = await getDocs(collection(db, 'societes'));
        for (const doc of societesSnapshot.docs) {
            const societe = doc.data();
            const numeroACM = societe.identification?.numeroCompteACM;
            if (numeroACM && nomNettoye.includes(numeroACM)) {
                console.log(`✅ Société trouvée: ${societe.code} (ACM: ${numeroACM})`);
                return societe.code;
            }
        }
        
        console.log(`⚠️ Aucune correspondance ACM dans: ${nomNettoye}`);
        return '-';
        
    } catch (error) {
        console.error('❌ Erreur recherche ACM:', error);
        return '-';
    }
}

async importerOperations(operations, nomFichier = null) {
    try {
        const { collection, addDoc, query, where, limit, getDocs, serverTimestamp } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
        );
        
        // Trouver le code magasin/société depuis le nom du fichier
        let codeMagasin = '-';
        if (nomFichier) {
            codeMagasin = await this.trouverCodeParACM(nomFichier);
            console.log(`📍 Code magasin/société trouvé: ${codeMagasin} pour fichier: ${nomFichier}`);
        }
        
        const resultats = {
            reussies: 0,
            doublons: 0,
            erreurs: []
        };
        
        for (const operation of operations) {
            try {
                // Nettoyer l'opération
                const operationClean = { ...operation };
                delete operationClean.numeroACM; // Retirer le champ temporaire si présent
                
                // Vérifier si doublon
                const hash = this.genererHashOperation(operationClean);
                const doublonQuery = query(
                    collection(db, 'operationsBancaires'),
                    where('hash', '==', hash),
                    limit(1)
                );
                const existant = await getDocs(doublonQuery);
                
                if (!existant.empty) {
                    console.log('⚠️ Doublon détecté:', operationClean.libelle);
                    resultats.doublons++;
                    continue;
                }
                
                // Enrichir avec métadonnées
                const operationEnrichie = {
                    ...operationClean,
                    codeMagasin: codeMagasin, // Ajouter le code magasin
                    hash: hash,
                    pointee: false,
                    categorie: this.detecterCategorie(operationClean.libelle),
                    dateImport: serverTimestamp(),
                    metadata: {
                        source: 'import_csv',
                        dateImport: new Date().toISOString(),
                        fichierSource: nomFichier
                    }
                };
                
                // Sauvegarder
                await addDoc(collection(db, 'operationsBancaires'), operationEnrichie);
                resultats.reussies++;
                
            } catch (error) {
                console.error('❌ Erreur import opération:', error);
                resultats.erreurs.push({
                    operation: operation.libelle,
                    erreur: error.message
                });
            }
        }
        
        console.log('✅ Import terminé:', resultats);
        return resultats;
        
    } catch (error) {
        console.error('❌ Erreur import opérations:', error);
        throw error;
    }
}

genererHashOperation(operation) {
    const str = `${operation.date}_${operation.libelle}_${operation.montant}`;
    return btoa(str).substring(0, 16);
}

categoriserAutomatiquement(operation) {
    return this.detecterCategorie(operation.libelle);
}
    
    // ========================================
    // DÉTECTION DE CATÉGORIE
    // ========================================
    
    detecterCategorie(libelle) {
        if (!libelle) return 'autre';
        
        const libelleUpper = libelle.toUpperCase();
        
        for (const rule of DETECTION_RULES) {
            if (rule.pattern.test(libelleUpper)) {
                return rule.categorie;
            }
        }
        
        return 'autre';
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new OperationsBancairesFirestoreService();
export default service;