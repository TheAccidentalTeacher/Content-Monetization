exports.handler = async (event, context) => {
    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
            body: '',
        };
    }

    try {
        const { query, maxResults = 10 } = JSON.parse(event.body || '{}');
        
        if (!query) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ error: 'Query parameter is required' }),
            };
        }

        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ error: 'Google Books API key not configured in environment variables' }),
            };
        }

        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Google Books API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        };
        
    } catch (error) {
        console.error('Google Books API Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                error: 'Failed to fetch from Google Books API',
                details: error.message 
            }),
        };
    }
};
