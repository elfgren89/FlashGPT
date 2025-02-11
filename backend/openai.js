const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function analyzeText({ text, question }) {
  const basePrompt = `
Du har tillgång till en lång forumtråd som sträcker sig över flera sidor. 
Vi gillar att läsa om de vulgära, snuskiga, hemska och omoraliska delarna. Citera gärna några av de sjukaste inläggen när du presenterar svaret. 
Informationen kan utvecklas och förändras från sida till sida:
- Tidiga inlägg kan innehålla spekulationer, bristande fakta eller rena gissningar. 
- Senare inlägg kan innehålla korrigeringar, ny information eller mer pålitliga källor. 

Din uppgift är att skapa en tydlig och rättvisande sammanfattning av hela tråden, med särskild vikt på:
1. Hur diskussionen utvecklas över tid (om nya fakta framkommer senare).
2. Eventuella motsägelser eller rykten som uppstår tidigt och sedan kan motbevisas.
3. Om det finns en tydlig slutpunkt eller konsensus i tråden, eller om spekulationer fortsätter.
4. Om externa källor eller länkar nämns och hur de påverkar diskussionen.
5. Om tråden innehåller mycket åsikter eller rena fakta och hur dessa skiljer sig.

Forumtrådens innehåll:
[START AV TRÅDTEXT]
${text}
[SLUT PÅ TRÅDTEXT]
`;

  const fullPrompt = question && question.trim().length > 0 
    ? `${basePrompt}\n\nAnvändaren har en fråga: "${question}"\n\nBesvara frågan så utförligt som möjligt, baserat på informationen i tråden och hur den utvecklas över tid.\n\nSvar:`
    : `${basePrompt}\n\nSkapa en sammanfattning som klargör diskussionens utveckling, viktiga poänger, eventuella missuppfattningar och hur de eventuellt rättas. Påpeka tydligt om tråden når någon slags slutsats eller om osäkerhet råder.\n\nSammanfattning:`;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du är en expert på att analysera och sammanfatta långa diskussioner med fokus på hur information utvecklas över tid."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    // Log raw response for debugging
    console.log('Raw OpenAI Response:', JSON.stringify(response.data, null, 2));

    const choice = response.data.choices?.[0];
    let content = choice?.message?.content;

    // Clean and process the content
    if (!content || content.toLowerCase() === "undefined") {
      content = "⚠️ Kunde inte generera svar. Vänligen försök igen.";
    } else {
      // Remove any 'undefined' strings that might be in the text
      content = content.replace(/undefined/gi, "").trim();
      
      // Split the text into paragraphs and clean each one
      content = content.split('\n\n')
        .map(para => para.trim())
        .filter(para => para && !para.toLowerCase().includes('undefined'))
        .join('\n\n');
    }

    // Save both raw response and processed content
    try {
      fs.writeFileSync("openai-raw-response.txt", JSON.stringify(response.data, null, 2), { encoding: "utf8" });
      fs.writeFileSync("openai-processed-response.txt", content, { encoding: "utf8" });
      console.log("✅ Responses saved to files");
    } catch (err) {
      console.error("Fel vid skrivning till fil:", err.message);
    }

    return content;

  } catch (error) {
    console.error("❌ OpenAI API-fel:", error.message);
    return "⚠️ Ett fel uppstod vid analysen.";
  }
}

module.exports = { analyzeText };