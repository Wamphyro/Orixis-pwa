# 📊 AnalysisProgressWidget

Un widget moderne de barre de progression avec effet glassmorphism pour afficher l'avancement des analyses et traitements.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Caractéristiques

- 🎨 **Design moderne** avec effet glassmorphism
- 📱 **Responsive** : S'adapte à toutes les tailles d'écran
- 🎯 **Non-bloquant** : Permet l'interaction avec la page
- 📚 **Empilement intelligent** : Gère plusieurs barres simultanées
- ⚡ **Animations fluides** : Transitions et effets visuels soignés
- 🔄 **Auto-fermeture** : Se ferme automatiquement après succès
- 🎯 **Étapes visuelles** : Affichage optionnel des étapes du processus

## 📦 Installation

```javascript
// Importer le widget
import { AnalysisProgressWidget } from '/widgets/analysis-progress/analysis-progress.widget.js';

🚀 Utilisation rapide
Exemple simple

// Créer une barre de progression
const progress = new AnalysisProgressWidget({
    title: 'Analyse en cours'
});

// Afficher
progress.show();

// Mettre à jour la progression
progress.setProgress(25, 'Chargement des données...');
progress.setProgress(50, 'Analyse IA...');
progress.setProgress(75, 'Traitement des résultats...');

// Terminer avec succès
progress.complete('✅ Analyse terminée !');

Avec étapes prédéfinies


const progress = new AnalysisProgressWidget({
    title: 'Import de factures',
    steps: ['Upload', 'Analyse IA', 'Validation', 'Sauvegarde']
});

// Changer d'étape
progress.setStep(0, 'Upload des fichiers...');
// ... après upload
progress.setStep(1, 'Extraction des données...');
// ... après IA
progress.setStep(2, 'Validation des montants...');
// ... après validation
progress.setStep(3, 'Enregistrement en base...');
// Terminer
progress.complete('✅ 5 factures importées !');

Gestion d'erreur

const progress = new AnalysisProgressWidget({
    title: 'Traitement du document'
});

progress.show();
progress.setProgress(30, 'Lecture du fichier...');

try {
    // Traitement...
} catch (error) {
    progress.error('❌ Erreur : ' + error.message);
}

⚙️ Configuration
OptionTypeDéfautDescriptiontitlestring'Traitement en cours...'Titre principalsubtitlestring''Sous-titre optionnelstepsarray[]Liste des étapesthemestring'glass'Thème visuel ('glass', 'solid', 'minimal')autoClosebooleantrueFermeture automatique après succèsautoCloseDelaynumber2000Délai avant fermeture (ms)showPercentbooleantrueAfficher le pourcentageanimatedbooleantrueActiver les animationsonCompletefunctionnullCallback de succèsonErrorfunctionnullCallback d'erreuronCancelfunctionnullCallback d'annulation

📖 API
Méthodes principales
show()
Affiche la barre de progression.
javascriptprogress.show();
hide()
Cache et détruit la barre.
javascriptprogress.hide();
setProgress(percent, message)
Définit la progression (0-100).
javascriptprogress.setProgress(50, 'Traitement en cours...');
setStep(index, message)
Active une étape spécifique.
javascriptprogress.setStep(2, 'Validation des données...');
complete(message)
Marque comme terminé avec succès.
javascriptprogress.complete('✅ Terminé avec succès !');
error(message)
Affiche une erreur.
javascriptprogress.error('❌ Une erreur est survenue');
destroy()
Détruit manuellement le widget.
javascriptprogress.destroy();
Méthode statique
AnalysisProgressWidget.destroyAll()
Détruit toutes les instances actives.
javascriptAnalysisProgressWidget.destroyAll();
🎨 Personnalisation CSS
Les variables CSS peuvent être personnalisées :
css:root {
    --progress-primary: #667eea;      /* Couleur principale */
    --progress-success: #48bb78;      /* Couleur succès */
    --progress-error: #f56565;        /* Couleur erreur */
    --progress-blur: 20px;             /* Intensité du blur */
    --progress-width: min(90%, 600px); /* Largeur responsive */
}
💡 Cas d'usage
1. Upload de fichiers
javascriptasync function uploadFiles(files) {
    const progress = new AnalysisProgressWidget({
        title: 'Upload de fichiers',
        steps: files.map(f => f.name)
    });
    
    progress.show();
    
    for (let i = 0; i < files.length; i++) {
        progress.setStep(i, `Upload de ${files[i].name}...`);
        await uploadFile(files[i]);
    }
    
    progress.complete(`✅ ${files.length} fichiers uploadés !`);
}
2. Analyse IA
javascriptasync function analyzeDocument(doc) {
    const progress = new AnalysisProgressWidget({
        title: 'Analyse du document',
        steps: ['Préparation', 'Extraction', 'Validation']
    });
    
    try {
        progress.setStep(0, 'Conversion en images...');
        const images = await convertToImages(doc);
        
        progress.setStep(1, 'Analyse IA en cours...');
        const data = await callOpenAI(images);
        
        progress.setStep(2, 'Validation des données...');
        const validated = await validateData(data);
        
        progress.complete('✅ Document analysé avec succès !');
        return validated;
        
    } catch (error) {
        progress.error(`❌ Erreur : ${error.message}`);
        throw error;
    }
}
3. Import en masse
javascriptasync function importFactures(factures) {
    const progress = new AnalysisProgressWidget({
        title: `Import de ${factures.length} factures`,
        autoCloseDelay: 3000
    });
    
    progress.show();
    
    for (let i = 0; i < factures.length; i++) {
        const percent = ((i + 1) / factures.length) * 100;
        progress.setProgress(
            percent, 
            `Facture ${i + 1}/${factures.length}`
        );
        
        await processFacture(factures[i]);
    }
    
    progress.complete(`✅ ${factures.length} factures importées !`);
}
🎯 Gestion des instances multiples
Le widget gère automatiquement l'empilement de plusieurs barres :
javascript// Première barre
const progress1 = new AnalysisProgressWidget({
    title: 'Analyse 1'
});
progress1.show();

// Deuxième barre (s'affiche en dessous)
const progress2 = new AnalysisProgressWidget({
    title: 'Analyse 2'
});
progress2.show();

// Troisième barre (s'empile)
const progress3 = new AnalysisProgressWidget({
    title: 'Analyse 3'
});
progress3.show();
Les barres se réorganisent automatiquement quand l'une d'elles se ferme.
🔧 Intégration avec les modules
Factures fournisseurs
javascript// Dans handleCreateFacture()
const progress = new AnalysisProgressWidget({
    title: 'Création des factures',
    steps: ['Upload', 'Analyse IA', 'Validation', 'Enregistrement']
});

progress.show();

// Upload
progress.setStep(0, `Upload de ${files.length} fichier(s)...`);
const urls = await this.uploadFiles(files);

// Analyse IA
progress.setStep(1, 'Extraction des données par IA...');
const analyses = await this.analyzeDocuments(urls);

// Validation
progress.setStep(2, 'Validation des données...');
const validated = await this.validateData(analyses);

// Sauvegarde
progress.setStep(3, 'Enregistrement en base...');
await this.saveToFirestore(validated);

progress.complete(`✅ ${validated.length} factures créées !`);
📊 Performances

Légèreté : ~15KB (JS + CSS)
Animations : 60 FPS avec CSS transforms
Mémoire : Auto-nettoyage après destruction
Compatibilité : Chrome 90+, Firefox 88+, Safari 14+

🐛 Dépannage
La barre ne s'affiche pas

Vérifier que le CSS est bien chargé
S'assurer que show() est appelé

Les animations saccadent

Désactiver avec animated: false
Vérifier les performances GPU

Empilement incorrect

Ne pas détruire manuellement pendant l'animation
Utiliser hide() plutôt que destroy()

📝 Changelog
v1.0.0 (09/02/2025)

✨ Version initiale
🎨 Design glassmorphism
📚 Gestion de l'empilement
🔄 Auto-fermeture
📱 Support responsive

📄 License
MIT License - Libre d'utilisation
👨‍💻 Auteur
Créé avec ❤️ par Assistant Claude