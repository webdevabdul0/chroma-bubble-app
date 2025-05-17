const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: 'OK',
    };
  }

  const { embedding, pdfId } = JSON.parse(event.body);
  const apiKey = process.env.PINECONE_API_KEY;
  const url = `https://pdfai-openai-us-east-1-aws.pinecone.io/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vector: embedding,
      topK: 3,
      includeMetadata: true,
      namespace: pdfId,
    }),
  });

  const data = await response.json();
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // ← Important!
    },
    body: JSON.stringify(data),
  };
};
