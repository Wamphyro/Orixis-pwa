// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                    STOCK-PRODUIT.FIRESTORE.SERVICE.JS                      ║
// ║                         Service Firestore                                  ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Service CRUD pour Firebase/Firestore                               ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

import { db } from '../../src/services/firebase.service.js';

// ╔════════════════════════════════════════╗
// ║     SECTION 1: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const COLLECTION_NAME = 'stockProduit';

// ─── TEMPLATE ARTICLE ───
const PVT_TEMPLATE = {
    // ─── Identification ───
    numeroSerie: null,
    libelle: null,
    codeBarres: null,
    
    // ─── Stock ───
    quantite: 0,
    quantiteMin: 0,
    quantiteMax: 0,
    magasin: null,
    
    // ─── Prix ───
    prixAchat: 0,
    prixVente: 0,
    tauxMarge: 0,
    montantMarge: 0,
    
    // ─── Classification ───
    categorie: null,
    famille: null,
    fournisseur: null,
    marque: null,
    
    // ─── Client ───
    client: null,
    
    // ─── Statut (13 statuts possibles) ───
    statut: 'STO',
    
    // ─── Dates ───
    dateEntree: null,
    dateDernierMouvement: null,
    datePeremption: null,
    
    // ─── États ───
    actif: true,
    enRupture: false,
    aCommander: false,
    
    // ─── Import ───
    codeMagasin: null,
    importSource: null,
    dateImport: null,
    hash: null,
    
    // ─── Workflow ───
    dates: {
        creation: null,
        modification: null
    },
    
    intervenants: {
        creePar: null,
        modifiePar: null
    },
    
    // ─── Historique ───
    historique: []
};

// ─── RÈGLES DÉTECTION CATÉGORIES AUDIOPROTHÈSE ───
const DETECTION_RULES = [
    // ─── Appareils auditifs ───
    { pattern: /audeo|virto|moxi|pure|opn|more|lumity|paradise/i, categorie: 'appareil', famille: 'contour' },
    { pattern: /ric|rite|receiver/i, categorie: 'appareil', famille: 'ric' },
    { pattern: /bte|behind/i, categorie: 'appareil', famille: 'bte' },
    { pattern: /cic|iic|invisible/i, categorie: 'appareil', famille: 'intra' },
    
    // ─── Piles ───
    { pattern: /pile|battery|675|312|13|10|duracell|rayovac|powerone/i, categorie: 'pile', famille: 'zinc_air' },
    { pattern: /rechargeable|lithium/i, categorie: 'pile', famille: 'rechargeable' },
    
    // ─── Entretien ───
    { pattern: /spray|lingette|pastille|nettoyant|cleaning|cerustop/i, categorie: 'entretien', famille: 'nettoyage' },
    { pattern: /deshumidificateur|dry|seche/i, categorie: 'entretien', famille: 'sechage' },
    
    // ─── Embouts ───
    { pattern: /embout|dome|tulipe|olive|tip|mould/i, categorie: 'embout', famille: 'standard' },
    { pattern: /mesure|custom|sur-mesure/i, categorie: 'embout', famille: 'surmesure' },
    
    // ─── Accessoires connectivité ───
    { pattern: /chargeur|charger|charge/i, categorie: 'accessoire', famille: 'chargeur' },
    { pattern: /tv|television|streamer/i, categorie: 'accessoire', famille: 'tv' },
    { pattern: /phone|telephone|bluetooth/i, categorie: 'accessoire', famille: 'telephone' },
    { pattern: /roger|microphone|mic/i, categorie: 'accessoire', famille: 'microphone' },
    
    // ─── Protections ───
    { pattern: /bouchon|protection|anti-bruit|ear|plug/i, categorie: 'protection', famille: 'standard' },
    { pattern: /musician|musicien|er-/i, categorie: 'protection', famille: 'musicien' }
];

// ╔════════════════════════════════════════╗
// ║   SECTION 2: SERVICE FIRESTORE         ║
// ╚════════════════════════════════════════╝

class StockProduitFirestoreService {
    
    // ┌────────────────────────────────────────┐
    // │         CRÉATION ARTICLE                │
    // └────────────────────────────────────────┘
    
    async creerArticle(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('📦 Création article...');
            
            const article = this.createNewArticle();
            
            // ─── Génération référence ───
            if (!data.numeroSerie) {
                article.numeroSerie = await this.genererReference();
            } else {
                article.numeroSerie = data.numeroSerie;
            }
            
            // ─── Récupération utilisateur ───
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            // ─── Données article ───
            article.libelle = data.libelle;
            article.codeBarres = data.codeBarres || null;
            article.quantite = parseFloat(data.quantite) || 0;
            article.quantiteMin = parseFloat(data.quantiteMin) || 0;
            article.quantiteMax = parseFloat(data.quantiteMax) || 999;
            article.magasin = data.magasin || null;
            article.prixAchat = parseFloat(data.prixAchat) || 0;
            article.prixVente = parseFloat(data.prixVente) || 0;
            
            // ─── Calcul marges ───
            if (article.prixAchat > 0 && article.prixVente > 0) {
                article.montantMarge = article.prixVente - article.prixAchat;
                article.tauxMarge = ((article.montantMarge / article.prixAchat) * 100).toFixed(2);
            }
            
            // ─── Catégorisation ───
            article.categorie = data.categorie || this.detecterCategorie(data.libelle);
            article.famille = data.famille || null;
            article.fournisseur = data.fournisseur || null;
            article.marque = data.marque || null;
            article.client = data.client || '-';
            article.statut = data.statut || 'STO';
            
            // ─── Dates ───
            article.dateEntree = data.dateEntree || new Date().toISOString().split('T')[0];
            article.dateDernierMouvement = new Date().toISOString().split('T')[0];
            article.datePeremption = data.datePeremption || null;
            
            // ─── États ───
            article.enRupture = article.quantite <= 0;
            article.aCommander = article.quantite <= article.quantiteMin;
            
            // ─── Import ───
            article.codeMagasin = data.codeMagasin || '-';
            article.importSource = data.importSource || null;
            
            // ─── Métadonnées ───
            article.dates.creation = serverTimestamp();
            article.intervenants.creePar = {
                id: auth.collaborateur?.id || 'import',
                nom: auth.collaborateur?.nom || 'Import',
                prenom: auth.collaborateur?.prenom || 'CSV'
            };
            
            // ─── Historique ───
            article.historique = [{
                date: new Date().toISOString(),
                action: 'creation',
                details: 'Article créé',
                utilisateur: article.intervenants.creePar
            }];
            
            // ─── Sauvegarde Firestore ───
            const docRef = await addDoc(collection(db, COLLECTION_NAME), article);
            
            console.log('✅ Article créé:', article.numeroSerie, 'ID:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création article:', error);
            throw new Error(`Erreur création: ${error.message}`);
        }
    }
    
    createNewArticle() {
        return JSON.parse(JSON.stringify(PVT_TEMPLATE));
    }
    
    async genererReference() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PVT-${dateStr}-${random}`;
    }
    
    // ┌────────────────────────────────────────┐
    // │         LECTURE ARTICLES                │
    // └────────────────────────────────────────┘
    
    async getArticles(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, COLLECTION_NAME);
            const constraints = [];
            
            // ─── Application filtres ───
            if (filtres.categorie) {
                constraints.push(where('categorie', '==', filtres.categorie));
            }
            
            if (filtres.fournisseur) {
                constraints.push(where('fournisseur', '==', filtres.fournisseur));
            }
            
            if (filtres.magasin) {
                constraints.push(where('magasin', '==', filtres.magasin));
            }
            
            if (filtres.client) {
                constraints.push(where('client', '==', filtres.client));
            }
            
            if (filtres.statut) {
                constraints.push(where('statut', '==', filtres.statut));
            }
            
            if (filtres.enRupture !== undefined) {
                constraints.push(where('enRupture', '==', filtres.enRupture));
            }
            
            // ─── Tri par défaut ───
            constraints.push(orderBy('libelle', 'asc'));
            
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
            
            const articles = [];
            snapshot.forEach((doc) => {
                articles.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 ${articles.length} articles trouvés`);
            return articles;
            
        } catch (error) {
            console.error('❌ Erreur récupération articles:', error);
            return [];
        }
    }
    
    async getStatistiques() {
        try {
            const articles = await this.getArticles({ limite: 5000 });
            
            const stats = {
                total: articles.length,
                valeurStock: 0,
                valeurAchat: 0,
                margeGlobale: 0,
                enRupture: 0,
                stockBas: 0,
                stockOk: 0,
                parCategorie: {},
                parFournisseur: {},
                parMagasin: {}
            };
            
            articles.forEach(article => {
                const qte = article.quantite || 0;
                stats.valeurStock += qte * (article.prixVente || 0);
                stats.valeurAchat += qte * (article.prixAchat || 0);
                
                // ─── États stock ───
                if (article.enRupture) {
                    stats.enRupture++;
                } else if (article.aCommander) {
                    stats.stockBas++;
                } else {
                    stats.stockOk++;
                }
                
                // ─── Par catégorie ───
                const cat = article.categorie || 'autre';
                if (!stats.parCategorie[cat]) {
                    stats.parCategorie[cat] = {
                        nombre: 0,
                        valeur: 0,
                        quantite: 0
                    };
                }
                stats.parCategorie[cat].nombre++;
                stats.parCategorie[cat].valeur += qte * (article.prixVente || 0);
                stats.parCategorie[cat].quantite += qte;
                
                // ─── Par fournisseur ───
                const fourn = article.fournisseur || 'inconnu';
                if (!stats.parFournisseur[fourn]) {
                    stats.parFournisseur[fourn] = {
                        nombre: 0,
                        valeur: 0
                    };
                }
                stats.parFournisseur[fourn].nombre++;
                stats.parFournisseur[fourn].valeur += qte * (article.prixVente || 0);
                
                // ─── Par magasin ───
                const mag = article.codeMagasin || '-';
                if (!stats.parMagasin[mag]) {
                    stats.parMagasin[mag] = {
                        nombre: 0,
                        valeur: 0
                    };
                }
                stats.parMagasin[mag].nombre++;
                stats.parMagasin[mag].valeur += qte * (article.prixVente || 0);
            });
            
            stats.margeGlobale = stats.valeurStock - stats.valeurAchat;
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                valeurStock: 0,
                valeurAchat: 0,
                margeGlobale: 0,
                enRupture: 0,
                stockBas: 0,
                stockOk: 0,
                parCategorie: {},
                parFournisseur: {},
                parMagasin: {}
            };
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │      MISE À JOUR ARTICLE                │
    // └────────────────────────────────────────┘
    
    async mettreAJourArticle(articleId, updates) {
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
            
            // ─── Recalcul marges ───
            if (updates.prixAchat !== undefined || updates.prixVente !== undefined) {
                const pa = updates.prixAchat || 0;
                const pv = updates.prixVente || 0;
                if (pa > 0 && pv > 0) {
                    updates.montantMarge = pv - pa;
                    updates.tauxMarge = ((updates.montantMarge / pa) * 100).toFixed(2);
                }
            }
            
            // ─── Vérification états ───
            if (updates.quantite !== undefined) {
                updates.enRupture = updates.quantite <= 0;
                updates.aCommander = updates.quantite <= (updates.quantiteMin || 0);
                updates.dateDernierMouvement = new Date().toISOString().split('T')[0];
            }
            
            const updatesAvecMeta = {
                ...updates,
                'dates.modification': serverTimestamp(),
                'intervenants.modifiePar': utilisateur,
                historique: arrayUnion({
                    date: new Date().toISOString(),
                    action: 'modification',
                    details: 'Article modifié',
                    utilisateur: utilisateur
                })
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, articleId), updatesAvecMeta);
            
            console.log('✅ Article mis à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour:', error);
            throw error;
        }
    }
    
    async mouvementStock(articleId, quantite, type = 'entree') {
        try {
            const article = await this.getArticleById(articleId);
            if (!article) throw new Error('Article introuvable');
            
            const nouvelleQte = type === 'entree' 
                ? article.quantite + quantite 
                : article.quantite - quantite;
            
            if (nouvelleQte < 0) {
                throw new Error('Stock insuffisant');
            }
            
            await this.mettreAJourArticle(articleId, {
                quantite: nouvelleQte,
                dateDernierMouvement: new Date().toISOString().split('T')[0]
            });
            
            return true;
        } catch (error) {
            console.error('❌ Erreur mouvement stock:', error);
            throw error;
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │        SUPPRESSION ARTICLE              │
    // └────────────────────────────────────────┘
    
    async supprimerArticle(articleId) {
        try {
            const { doc, deleteDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            await deleteDoc(doc(db, COLLECTION_NAME, articleId));
            
            console.log('✅ Article supprimé:', articleId);
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw new Error('Impossible de supprimer l\'article');
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │         IMPORT ARTICLES                 │
    // └────────────────────────────────────────┘
    
    async trouverCodeParACM(nomFichier) {
        if (!nomFichier) return '-';
        
        try {
            const { collection, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const nomNettoye = nomFichier.replace(/\.[^/.]+$/, '');
            console.log('🔍 Recherche ACM dans le nom:', nomNettoye);
            
            // ─── Recherche dans magasins ───
            const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
            for (const doc of magasinsSnapshot.docs) {
                const magasin = doc.data();
                const numeroACM = magasin.identification?.numeroCompteACM;
                if (numeroACM && nomNettoye.includes(numeroACM)) {
                    console.log(`✅ Magasin trouvé: ${magasin.code} (ACM: ${numeroACM})`);
                    return magasin.code;
                }
            }
            
            // ─── Recherche dans sociétés ───
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
    
    async importerArticles(articles, nomFichier = null) {
        try {
            const { collection, addDoc, query, where, limit, getDocs, serverTimestamp, updateDoc, doc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // ─── Recherche code magasin ───
            let codeMagasinACM = '-';
            if (nomFichier) {
                codeMagasinACM = await this.trouverCodeParACM(nomFichier);
                console.log(`🏪 Code magasin ACM trouvé: ${codeMagasinACM} pour fichier: ${nomFichier}`);
            }
            
            const resultats = {
                reussies: 0,
                doublons: 0,
                miseAJour: 0,
                erreurs: []
            };
            
            for (const article of articles) {
                try {
                    // ─── Normalisation données ───
                    const articleNormalise = {
                        numeroSerie: article.numeroSerie || null,
                        libelle: article.libelle || null,
                        codeBarres: article.codeBarres || null,
                        
                        quantite: parseFloat(article.quantite) || 0,
                        quantiteMin: 0,
                        quantiteMax: 999,
                        magasin: article.magasin || '-',
                        
                        prixAchat: parseFloat(article.prixAchat) || 0,
                        prixVente: parseFloat(article.prixVente) || 0,
                        tauxMarge: 0,
                        montantMarge: 0,
                        
                        categorie: this.detecterCategorie(article.libelle),
                        famille: null,
                        fournisseur: article.fournisseur || '-',
                        marque: article.marque || '-',
                        
                        client: article.client || '-',
                        
                        statut: article.statut || 'STO',
                        
                        dateEntree: new Date().toISOString().split('T')[0],
                        dateDernierMouvement: new Date().toISOString().split('T')[0],
                        datePeremption: null,
                        
                        actif: true,
                        enRupture: false,
                        aCommander: false
                    };
                    
                    // ─── Vérification états ───
                    articleNormalise.enRupture = articleNormalise.quantite <= 0;
                    articleNormalise.aCommander = articleNormalise.quantite <= articleNormalise.quantiteMin;
                    
                    // ─── Vérification doublon ───
                    if (articleNormalise.numeroSerie) {
                        const doublonQuery = query(
                            collection(db, COLLECTION_NAME),
                            where('numeroSerie', '==', articleNormalise.numeroSerie),
                            where('magasin', '==', articleNormalise.magasin),
                            limit(1)
                        );
                        const existant = await getDocs(doublonQuery);
                        
                        if (!existant.empty) {
                            const docExistant = existant.docs[0];
                            const dataExistant = docExistant.data();
                            
                            // ─── Mise à jour si statut ou client changé ───
                            if (dataExistant.statut !== articleNormalise.statut || 
                                dataExistant.client !== articleNormalise.client) {
                                console.log(`🔄 Mise à jour: ${articleNormalise.numeroSerie}`);
                                
                                await updateDoc(doc(db, COLLECTION_NAME, docExistant.id), {
                                    statut: articleNormalise.statut,
                                    client: articleNormalise.client,
                                    dateDernierMouvement: new Date().toISOString().split('T')[0],
                                    'dates.modification': serverTimestamp()
                                });
                                
                                resultats.miseAJour++;
                            } else {
                                console.log('⚠️ Doublon ignoré:', articleNormalise.numeroSerie);
                                resultats.doublons++;
                            }
                            continue;
                        }
                    }
                    
                    // ─── Génération hash ───
                    const hash = this.genererHashArticle(articleNormalise);
                    
                    // ─── Article final ───
                    const articleFinal = {
                        ...articleNormalise,
                        hash: hash,
                        
                        codeMagasin: codeMagasinACM,
                        importSource: nomFichier,
                        dateImport: serverTimestamp(),
                        
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
                    
                    // ─── Calcul marges ───
                    if (articleFinal.prixAchat > 0 && articleFinal.prixVente > 0) {
                        articleFinal.montantMarge = articleFinal.prixVente - articleFinal.prixAchat;
                        articleFinal.tauxMarge = ((articleFinal.montantMarge / articleFinal.prixAchat) * 100).toFixed(2);
                    }
                    
                    // ─── Sauvegarde ───
                    await addDoc(collection(db, COLLECTION_NAME), articleFinal);
                    resultats.reussies++;
                    console.log(`✅ Importé: ${articleNormalise.numeroSerie || articleNormalise.libelle}`);
                    
                } catch (error) {
                    console.error('❌ Erreur import article:', error);
                    resultats.erreurs.push({
                        article: article.libelle || article.numeroSerie || 'Inconnu',
                        erreur: error.message
                    });
                }
            }
            
            console.log('✅ Import terminé:', resultats);
            return resultats;
            
        } catch (error) {
            console.error('❌ Erreur import articles:', error);
            throw error;
        }
    }
    
    genererHashArticle(article) {
        const numeroSerie = article.numeroSerie || '';
        const magasin = article.magasin || '';
        
        if (!numeroSerie) {
            const libelle = article.libelle || '';
            const hash = `${libelle}_${magasin}`.toLowerCase().trim();
            return btoa(hash).substring(0, 16);
        }
        
        const hash = `${numeroSerie}_${magasin}`.toLowerCase().trim();
        return btoa(hash).substring(0, 16);
    }
    
    async getArticleById(id) {
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
            console.error('❌ Erreur récupération article:', error);
            return null;
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │      DÉTECTION CATÉGORIE                │
    // └────────────────────────────────────────┘
    
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

// ╔════════════════════════════════════════╗
// ║      SECTION 3: EXPORT SINGLETON       ║
// ╚════════════════════════════════════════╝

const service = new StockProduitFirestoreService();
export default service;