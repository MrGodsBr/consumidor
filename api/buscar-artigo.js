import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      erro: "Método não permitido"
    });
  }

  const { query } = req.body || {};

  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      erro: "O número do artigo ou termo de busca é obrigatório."
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `
Você é um assistente especializado no Código de Defesa do Consumidor
(Lei nº 8.078/1990) do Brasil.

Consulta do usuário:
"${query.trim()}"

Regras:

1. Se a consulta indicar um artigo específico, retorne:

{
  "tipo": "artigo",
  "title": "Artigo X",
  "text": "<p>Conteúdo do artigo</p>"
}

2. Se a consulta for uma palavra-chave ou assunto, retorne:

{
  "tipo": "busca",
  "resultados": [
    {
      "id": "18",
      "title": "Artigo 18",
      "snippet": "Resumo do artigo."
    }
  ]
}

3. Nunca invente números de artigos.

4. Nunca invente conteúdo jurídico.

5. Não apresente interpretação ou opinião como se fosse texto oficial da lei.

6. Se não encontrar informação suficiente, retorne:

{
  "tipo": "nao_encontrado",
  "resultados": []
}

Retorne SOMENTE JSON válido.
`;

    const result = await model.generateContent(prompt);

    const textResponse = result.response.text();

    const data = JSON.parse(textResponse);

    return res.status(200).json(data);

  } catch (error) {
    console.error("Erro na Serverless Function CDC:", error);

    return res.status(500).json({
      erro: "Ocorreu uma falha temporária ao consultar a legislação. Tente novamente em instantes."
    });
  }
}

