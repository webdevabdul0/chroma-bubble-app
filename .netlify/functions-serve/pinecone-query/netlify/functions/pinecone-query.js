var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/pinecone-query.js
var pinecone_query_exports = {};
__export(pinecone_query_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(pinecone_query_exports);
async function handler(event) {
  console.log("Received event:", event);
  if (event.httpMethod === "OPTIONS") {
    console.log("OPTIONS preflight request");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: "OK"
    };
  }
  try {
    console.log("Parsing event body...");
    const { embedding, pdfId } = JSON.parse(event.body);
    console.log("Parsed embedding and pdfId:", { embedding, pdfId });
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error("Invalid embedding vector");
    }
    const namespace = pdfId || "__default__";
    console.log("Using namespace:", namespace);
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      console.error("Missing Pinecone API key");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Pinecone API key" })
      };
    }
    const url = "https://pdfai-openai-w6dhxr9.svc.aped-4627-b74a.pinecone.io/query";
    const bodyPayload = {
      vector: embedding,
      topK: 3,
      includeMetadata: true,
      namespace
    };
    console.log("Sending request to Pinecone:", JSON.stringify(bodyPayload));
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });
    console.log("Response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinecone API error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: errorText })
      };
    }
    const responseText = await response.text();
    console.log("Raw response text:", responseText);
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid JSON response from Pinecone", rawResponse: responseText })
      };
    }
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=pinecone-query.js.map
