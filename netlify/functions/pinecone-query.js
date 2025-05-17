export async function handler(event) {
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

  try {
    const { embedding, pdfId } = JSON.parse(event.body);
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      console.error('Missing Pinecone API key');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing Pinecone API key' }),
      };
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pinecone API error:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorText }),
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
