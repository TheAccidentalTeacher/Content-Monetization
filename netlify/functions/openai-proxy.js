// netlify/functions/openai-proxy.js
// Netlify serverless function to securely proxy OpenAI API requests

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Get the OpenAI API key from Netlify environment variables
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key not configured.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Parse the incoming request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Forward the request to OpenAI API
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await openaiResponse.json();
    return {
      statusCode: openaiResponse.status,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to contact OpenAI API.' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
