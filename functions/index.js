const {onRequest} = require("firebase-functions/v2/https");
const cors = require("cors")({origin: true});
require("dotenv").config();

// ========== ANALYSE GÉNÉRIQUE GPT-5-MINI UNIQUEMENT ==========
exports.analyzeDocument = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 300,
    memory: "1GiB"
  },
  (request, response) => {
    cors(request, response, async () => {
      try {
        const { images, text, prompt, type } = request.body;
        
        // Validation : images OU text requis
        if (!images && !text) {
          return response.status(400).json({ 
            error: "Images ou texte requis" 
          });
        }
        
        // ===== CONFIGURATION GPT-5-MINI =====
        let inputContent;
        
        // CAS 1 : TEXTE (CSV)
        if (text) {
          // Pour du texte, GPT-5 accepte directement une string
          inputContent = prompt + "\n\nRÉPONDS UNIQUEMENT EN JSON VALIDE.\n\n" + text;
        }
        // CAS 2 : IMAGES (PDF converti ou images directes)
        else if (images && images.length > 0) {
          // Pour des images, utiliser le format structuré
          const userContent = [
            {
              type: "input_text",
              text: prompt + "\n\nRÉPONDS UNIQUEMENT EN JSON VALIDE."
            }
          ];
          
          // Ajouter chaque image
          images.forEach(img => {
            userContent.push({
              type: "input_image",
              image_url: `data:image/jpeg;base64,${img}`,
              detail: "high"
            });
          });
          
          // Format structuré pour les images
          inputContent = [
            {
              role: "user",
              content: userContent
            }
          ];
        }
        
        // ===== REQUÊTE GPT-5-MINI =====
        const requestBody = {
          model: "gpt-5-mini",
          input: inputContent,
          reasoning: {
            effort: "low"
          },
          text: {
            verbosity: "low"
          },
          temperature: 0.1,
          max_output_tokens: 4000,
          response_format: { type: "json_object" }
        };
        
        console.log(`📤 Requête GPT-5-mini (${text ? "texte" : "images"})...`);
        
        const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        const data = await openaiResponse.json();
        
        if (!openaiResponse.ok) {
          console.error("❌ Erreur GPT-5:", JSON.stringify(data, null, 2));
          throw new Error(data.error?.message || "Erreur OpenAI GPT-5");
        }
        
        // ===== EXTRACTION DE LA RÉPONSE GPT-5 =====
        let content;
        
        // GPT-5 retourne response.output qui est un tableau
        if (data.output && Array.isArray(data.output)) {
          for (const item of data.output) {
            if (item.content) {
              for (const contentItem of item.content) {
                if (contentItem.text) {
                  content = contentItem.text;
                  break;
                }
              }
            }
            if (content) break;
          }
        }
        
        // Autres formats possibles
        if (!content) {
          content = data.output_text || data.text || data.response || data.content;
        }
        
        if (!content) {
          console.error("Structure de réponse:", JSON.stringify(data, null, 2));
          throw new Error("Format de réponse GPT-5 non reconnu");
        }
        
        // Nettoyer et parser
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const result = JSON.parse(content);
        
        response.status(200).json({ 
          success: true, 
          data: result,
          type: type || "unknown",
          model: "gpt-5-mini"
        });
        
      } catch (error) {
        console.error("❌ Erreur:", error);
        response.status(500).json({ error: error.message });
      }
    });
  }
);