const {onRequest} = require("firebase-functions/v2/https");
const cors = require("cors")({origin: true});
require("dotenv").config();

// ========== ANALYSE D'IMAGES GÉNÉRIQUE ==========
exports.analyzeDocument = onRequest(
  {
    region: "europe-west1",
    timeoutSeconds: 300,
    memory: "1GiB"
  },
  (request, response) => {
    cors(request, response, async () => {
      try {
        const { images, prompt, type } = request.body;
        
        if (!images || images.length === 0) {
          return response.status(400).json({ error: "Images requises" });
        }
        
        // FONCTION OPENAI INLINE
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: "Tu es un expert en extraction de données. Réponds UNIQUEMENT avec du JSON valide, sans aucun texte, sans backticks, sans markdown."
              },
              {
                role: "user",
                content: [
                  { type: "text", text: prompt + "\n\nRÉPONDS UNIQUEMENT EN JSON VALIDE." },
                  ...images.map(img => ({
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${img}` }
                  }))
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 4000,
            response_format: { type: "json_object" }
          })
        });

        const data = await openaiResponse.json();
        
        if (!openaiResponse.ok) {
          throw new Error(data.error?.message || "Erreur OpenAI");
        }
        
        // Nettoyer la réponse
        let content = data.choices[0].message.content;
        content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        const result = JSON.parse(content);
        
        response.status(200).json({ 
          success: true, 
          data: result,
          type: type || "unknown"
        });
        
      } catch (error) {
        response.status(500).json({ error: error.message });
      }
    });
  }
);