// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                      REGLEMENT.FIRESTORE.SERVICE.JS                        ║
// ║                         Service Firestore Règlements                       ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Service CRUD pour les règlements                                   ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import { db } from '../../src/services/firebase.service.js';

// ╔════════════════════════════════════════╗
// ║     SECTION 1: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const COLLECTION_NAME = 'reglements';

// ─── TEMPLATE RÈGLEMENT ───
const REGLEMENT_TEMPLATE = {
    // ─── DONNÉES PRINCIPALES (visibles dans tableau) ───
    date: null,                    // Date du règlement
    client: null,                   // Nom complet du client (affiché)
    magasin: null,                  // Code magasin
    typeReglement: null,            // CHEQUE, CB, VIREMENT, ESPECES, TP
    montant: 0,                     // Montant en euros
    
    // ─── DONNÉES CLIENT DÉTAILLÉES ───
    nomClient: null,                // Nom de famille du client
    prenomClient: null,             // Prénom du client
    numeroClient: null,             // Référence client
    
    // ─── DONNÉES COMPLÉMENTAIRES ───
    numeroSecu: null,               // N° sécurité sociale
    numeroCheque: null,             // N° du chèque (si applicable)
    tiersPayeur: null,              // Organisme tiers payeur (MGEN, etc.)
    
    // ─── MÉTADONNÉES ───
    reference: null,                // Référence unique du règlement
    statut: 'VALIDE',              // VALIDE, ANNULE, EN_ATTENTE, REJETE
    remarque: null,                 // Remarques éventuelles
    
    // ─── IMPORT ───
    importSource: null,             // Nom du fichier d'import
    dateImport: null,               // Date d'import
    hash: null,                     // Hash pour détection doublons
    
    // ─── WORKFLOW ───
    dates: {
        creation: null,
        modification: null
    },
    
    intervenants: {
        creePar: null,
        modifiePar: null
    },
    
    // ─── HISTORIQUE ───
    historique: []
};

// ─── TYPES DE RÈGLEMENT COMPLETS ───
const TYPES_REGLEMENT = {
    // Paiements classiques
    CB: { label: 'Carte Bancaire', icon: '💳', color: 'success' },
    CHEQUE: { label: 'Chèque', icon: '📝', color: 'primary' },
    ESPECES: { label: 'Espèces', icon: '💵', color: 'warning' },
    VIREMENT: { label: 'Virement', icon: '🏦', color: 'info' },
    
    // Bons et avoirs
    BON_ACHAT: { label: 'Bon d\'achat', icon: '🎁', color: 'purple' },
    
    // Tiers payeurs
    TP_SECU: { label: 'Tiers Payeur Sécu', icon: '🏥', color: 'danger' },
    TP_MUTUELLE: { label: 'Tiers Payeur Mutuelle', icon: '🏥', color: 'secondary' },
    
    // Financements
    COFIDIS: { label: 'Cofidis', icon: '💰', color: 'info' },
    FRANFINANCE: { label: 'Franfinance', icon: '💰', color: 'info' },
    EUROSSUR: { label: 'Eurossur', icon: '💰', color: 'info' },
    SOFEMO: { label: 'NextYear', icon: '💰', color: 'info' },
    PAIEMENT_NFOIS: { label: 'Paiement N fois', icon: '🔄', color: 'secondary' },
    
    // Organismes
    MDPH: { label: 'MDPH', icon: '♿', color: 'primary' },
    AGEFIPH: { label: 'AGEFIPH', icon: '♿', color: 'primary' },
    FIPHFP: { label: 'FIPHFP', icon: '♿', color: 'primary' },
    
    // Autres
    WEB_STORE: { label: 'Web Store', icon: '🛒', color: 'success' },
    OD: { label: 'Opération Diverse', icon: '📋', color: 'secondary' },
    
    // Défaut
    AUTRE: { label: 'Autre', icon: '❓', color: 'secondary' }
};

// ╔════════════════════════════════════════╗
// ║   SECTION 2: SERVICE FIRESTORE         ║
// ╚════════════════════════════════════════╝

class ReglementFirestoreService {
    
    // ┌────────────────────────────────────────┐
    // │         CRÉATION RÈGLEMENT              │
    // └────────────────────────────────────────┘
    
    async creerReglement(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('💰 Création règlement...');
            
            const reglement = this.createNewReglement();
            
            // ─── Génération référence ───
            reglement.reference = await this.genererReference();
            
            // ─── Récupération utilisateur ───
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            // ─── Données principales ───
            reglement.date = data.date || new Date().toISOString().split('T')[0];
            reglement.client = data.client || null;
            reglement.magasin = data.magasin || null;
            reglement.typeReglement = data.typeReglement || 'CHEQUE';
            reglement.montant = parseFloat(data.montant) || 0;
            
            // ─── Données client détaillées ───
            reglement.nomClient = data.nomClient || null;
            reglement.prenomClient = data.prenomClient || null;
            reglement.numeroClient = data.numeroClient || null;
            
            // ─── Si nom et prénom fournis mais pas de client complet ───
            if ((data.nomClient || data.prenomClient) && !data.client) {
                reglement.client = `${data.nomClient || ''} ${data.prenomClient || ''}`.trim();
            }
            
            // ─── Données complémentaires ───
            reglement.numeroSecu = data.numeroSecu || null;
            reglement.numeroCheque = data.numeroCheque || null;
            reglement.tiersPayeur = data.tiersPayeur || null;
            
            // ─── Métadonnées ───
            reglement.statut = data.statut || 'VALIDE';
            reglement.remarque = data.remarque || null;
            
            // ─── Import ───
            reglement.importSource = data.importSource || null;
            reglement.dateImport = serverTimestamp();
            
            // ─── Workflow ───
            reglement.dates.creation = serverTimestamp();
            reglement.intervenants.creePar = {
                id: auth.collaborateur?.id || 'import',
                nom: auth.collaborateur?.nom || 'Import',
                prenom: auth.collaborateur?.prenom || 'CSV'
            };
            
            // ─── Historique ───
            reglement.historique = [{
                date: new Date().toISOString(),
                action: 'creation',
                details: 'Règlement créé',
                utilisateur: reglement.intervenants.creePar
            }];
            
            // ─── Hash pour détection doublons ───
            reglement.hash = this.genererHashReglement(reglement);
            
            // ─── Sauvegarde Firestore ───
            const docRef = await addDoc(collection(db, COLLECTION_NAME), reglement);
            
            console.log('✅ Règlement créé:', reglement.reference, 'ID:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création règlement:', error);
            throw new Error(`Erreur création: ${error.message}`);
        }
    }
    
    createNewReglement() {
        return JSON.parse(JSON.stringify(REGLEMENT_TEMPLATE));
    }
    
    async genererReference() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `REG-${dateStr}-${random}`;
    }
    
    // ┌────────────────────────────────────────┐
    // │         LECTURE RÈGLEMENTS              │
    // └────────────────────────────────────────┘
    
    async getReglements(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, COLLECTION_NAME);
            const constraints = [];
            
            // ─── Application filtres ───
            if (filtres.client) {
                constraints.push(where('client', '==', filtres.client));
            }
            
            if (filtres.magasin) {
                constraints.push(where('magasin', '==', filtres.magasin));
            }
            
            if (filtres.typeReglement) {
                constraints.push(where('typeReglement', '==', filtres.typeReglement));
            }
            
            if (filtres.dateDebut) {
                constraints.push(where('date', '>=', filtres.dateDebut));
            }
            
            if (filtres.dateFin) {
                constraints.push(where('date', '<=', filtres.dateFin));
            }
            
            if (filtres.statut) {
                constraints.push(where('statut', '==', filtres.statut));
            }
            
            // ─── Tri par défaut (date décroissante) ───
            constraints.push(orderBy('date', 'desc'));
            
            // ─── Limite ───
            if (filtres.limite) {
                constraints.push(limit(filtres.limite));
            }
            
            // ─── Construction requête ───
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }
            
            // ─── Exécution ───
            const snapshot = await getDocs(q);
            
            const reglements = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // ─── Reconstruction du nom complet si nécessaire ───
                if (!data.client && (data.nomClient || data.prenomClient)) {
                    data.client = `${data.nomClient || ''} ${data.prenomClient || ''}`.trim();
                }
                
                reglements.push({
                    id: doc.id,
                    ...data
                });
            });
            
            console.log(`💰 ${reglements.length} règlements trouvés`);
            return reglements;
            
        } catch (error) {
            console.error('❌ Erreur récupération règlements:', error);
            return [];
        }
    }
    
    async getStatistiques() {
        try {
            const reglements = await this.getReglements({ limite: 10000 });
            
            const stats = {
                total: reglements.length,
                montantTotal: 0,
                parType: {},
                parMagasin: {},
                parMois: {},
                moyenneJournaliere: 0
            };
            
            const montantParJour = {};
            
            reglements.forEach(reglement => {
                const montant = reglement.montant || 0;
                stats.montantTotal += montant;
                
                // ─── Par type de règlement ───
                const type = reglement.typeReglement || 'AUTRE';
                if (!stats.parType[type]) {
                    stats.parType[type] = {
                        nombre: 0,
                        montant: 0
                    };
                }
                stats.parType[type].nombre++;
                stats.parType[type].montant += montant;
                
                // ─── Par magasin ───
                const magasin = reglement.magasin || 'INCONNU';
                if (!stats.parMagasin[magasin]) {
                    stats.parMagasin[magasin] = {
                        nombre: 0,
                        montant: 0
                    };
                }
                stats.parMagasin[magasin].nombre++;
                stats.parMagasin[magasin].montant += montant;
                
                // ─── Par mois ───
                if (reglement.date) {
                    const mois = reglement.date.substring(0, 7); // YYYY-MM
                    if (!stats.parMois[mois]) {
                        stats.parMois[mois] = {
                            nombre: 0,
                            montant: 0
                        };
                    }
                    stats.parMois[mois].nombre++;
                    stats.parMois[mois].montant += montant;
                    
                    // ─── Pour moyenne journalière ───
                    const jour = reglement.date.substring(0, 10);
                    if (!montantParJour[jour]) {
                        montantParJour[jour] = 0;
                    }
                    montantParJour[jour] += montant;
                }
            });
            
            // ─── Calcul moyenne journalière ───
            const joursUniques = Object.keys(montantParJour).length;
            if (joursUniques > 0) {
                stats.moyenneJournaliere = stats.montantTotal / joursUniques;
            }
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                montantTotal: 0,
                parType: {},
                parMagasin: {},
                parMois: {},
                moyenneJournaliere: 0
            };
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │      MISE À JOUR RÈGLEMENT              │
    // └────────────────────────────────────────┘
    
    async mettreAJourReglement(reglementId, updates) {
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
            
            // ─── Reconstruction nom complet si nom/prénom modifiés ───
            if (updates.nomClient !== undefined || updates.prenomClient !== undefined) {
                const nom = updates.nomClient || '';
                const prenom = updates.prenomClient || '';
                updates.client = `${nom} ${prenom}`.trim();
            }
            
            const updatesAvecMeta = {
                ...updates,
                'dates.modification': serverTimestamp(),
                'intervenants.modifiePar': utilisateur,
                historique: arrayUnion({
                    date: new Date().toISOString(),
                    action: 'modification',
                    details: 'Règlement modifié',
                    utilisateur: utilisateur
                })
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, reglementId), updatesAvecMeta);
            
            console.log('✅ Règlement mis à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour:', error);
            throw error;
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │        SUPPRESSION RÈGLEMENT            │
    // └────────────────────────────────────────┘
    
    async supprimerReglement(reglementId) {
        try {
            const { doc, deleteDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            await deleteDoc(doc(db, COLLECTION_NAME, reglementId));
            
            console.log('✅ Règlement supprimé:', reglementId);
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw new Error('Impossible de supprimer le règlement');
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │         IMPORT RÈGLEMENTS               │
    // └────────────────────────────────────────┘
    
    async importerReglements(reglements, nomFichier = null) {
        try {
            const { collection, addDoc, query, where, limit, getDocs, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const resultats = {
                reussies: 0,
                doublons: 0,
                erreurs: []
            };
            
            for (const reglement of reglements) {
                try {
                    // ─── Traitement nom/prénom ───
                    let nomClient = reglement.nomClient || null;
                    let prenomClient = reglement.prenomClient || null;
                    let clientComplet = reglement.client || null;
                    
                    // Si on a un client mais pas nom/prénom séparés, essayer de les extraire
                    if (clientComplet && !nomClient && !prenomClient) {
                        const parts = clientComplet.split(' ');
                        if (parts.length >= 2) {
                            nomClient = parts[0];
                            prenomClient = parts.slice(1).join(' ');
                        } else {
                            nomClient = clientComplet;
                        }
                    }
                    
                    // Si on a nom/prénom mais pas client complet
                    if (!clientComplet && (nomClient || prenomClient)) {
                        clientComplet = `${nomClient || ''} ${prenomClient || ''}`.trim();
                    }
                    
                    // ❌ DÉSACTIVÉ : VÉRIFICATION DOUBLONS
                    /*
                    const hash = this.genererHashReglement(reglement);
                    
                    const doublonQuery = query(
                        collection(db, COLLECTION_NAME),
                        where('hash', '==', hash),
                        limit(1)
                    );
                    const existant = await getDocs(doublonQuery);
                    
                    if (!existant.empty) {
                        console.log('⚠️ Doublon ignoré:', clientComplet, reglement.date);
                        resultats.doublons++;
                        continue;
                    }
                    */
                    
                    // ─── Création du règlement ───
                    const reglementFinal = {
                        // Données principales
                        date: reglement.date || new Date().toISOString().split('T')[0],
                        client: clientComplet,
                        magasin: reglement.magasin || '-',
                        typeReglement: reglement.typeReglement || 'CHEQUE',
                        montant: parseFloat(reglement.montant) || 0,
                        
                        // Données client détaillées
                        nomClient: nomClient,
                        prenomClient: prenomClient,
                        numeroClient: reglement.numeroClient || null,
                        
                        // Données complémentaires
                        numeroSecu: reglement.numeroSecu || null,
                        numeroCheque: reglement.numeroCheque || null,
                        tiersPayeur: reglement.tiersPayeur || null,
                        
                        // Métadonnées
                        reference: await this.genererReference(),
                        // hash: hash,  // ❌ DÉSACTIVÉ
                        importSource: nomFichier,
                        dateImport: serverTimestamp(),
                        statut: 'VALIDE',
                        
                        dates: {
                            creation: serverTimestamp(),
                            modification: null
                        },
                        
                        intervenants: {
                            creePar: {
                                id: 'import',
                                nom: 'Import CSV',
                                prenom: ''
                            },
                            modifiePar: null
                        },
                        
                        historique: [{
                            date: new Date().toISOString(),
                            action: 'import',
                            details: `Importé depuis ${nomFichier || 'CSV'}`
                        }]
                    };
                    
                    // ─── Sauvegarde ───
                    await addDoc(collection(db, COLLECTION_NAME), reglementFinal);
                    resultats.reussies++;
                    console.log(`✅ Importé: ${clientComplet} - ${reglement.montant}€`);
                    
                } catch (error) {
                    console.error('❌ Erreur import règlement:', error);
                    resultats.erreurs.push({
                        reglement: `${reglement.client} - ${reglement.date}`,
                        erreur: error.message
                    });
                }
            }
            
            console.log('✅ Import terminé:', resultats);
            return resultats;
            
        } catch (error) {
            console.error('❌ Erreur import règlements:', error);
            throw error;
        }
    }
    
    genererHashReglement(reglement) {
        // Hash unique basé sur : date + client + montant + type
        const key = `${reglement.date}_${reglement.client}_${reglement.montant}_${reglement.typeReglement}`;
        return btoa(key).substring(0, 16);
    }
    
    async getReglementById(id) {
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
            console.error('❌ Erreur récupération règlement:', error);
            return null;
        }
    }
}

// ╔════════════════════════════════════════╗
// ║      SECTION 3: EXPORT SINGLETON       ║
// ╚════════════════════════════════════════╝

const service = new ReglementFirestoreService();
export default service;