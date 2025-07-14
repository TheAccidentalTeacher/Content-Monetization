// netlify/functions/amazon-books-proxy.js
// Amazon Product Advertising API proxy for book searches and bestseller data

const crypto = require('crypto');

exports.handler = async function(event, context) {
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

    // Only allow POST requests for actual API calls
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    // Get Amazon API credentials from environment variables
    const accessKey = process.env.AMAZON_ACCESS_KEY_ID;
    const secretKey = process.env.AMAZON_SECRET_ACCESS_KEY;
    const partnerTag = process.env.AMAZON_PARTNER_TAG;
    
    if (!accessKey || !secretKey || !partnerTag) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Amazon API credentials not configured',
                missing: {
                    accessKey: !accessKey,
                    secretKey: !secretKey,
                    partnerTag: !partnerTag
                }
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        const { searchType, query, category, maxResults = 10 } = JSON.parse(event.body || '{}');
        
        if (!searchType || !query) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    error: 'Missing required parameters: searchType and query' 
                }),
            };
        }

        // Amazon Product Advertising API 5.0 endpoint
        const endpoint = 'webservices.amazon.com';
        const uri = '/paapi5/searchitems';
        const region = 'us-east-1';
        const service = 'ProductAdvertisingAPI';
        
        // Build request payload based on search type
        let payload;
        
        switch (searchType) {
            case 'search':
                payload = {
                    Keywords: query,
                    SearchIndex: 'Books',
                    ItemCount: Math.min(maxResults, 50),
                    PartnerTag: partnerTag,
                    PartnerType: 'Associates',
                    Resources: [
                        'Images.Primary.Large',
                        'ItemInfo.Title',
                        'ItemInfo.ByLineInfo',
                        'ItemInfo.ContentInfo',
                        'ItemInfo.ContentRating',
                        'ItemInfo.Classifications',
                        'ItemInfo.ExternalIds',
                        'ItemInfo.Features',
                        'ItemInfo.ManufactureInfo',
                        'ItemInfo.ProductInfo',
                        'ItemInfo.TechnicalInfo',
                        'Offers.Listings.Price',
                        'Offers.Listings.ProgramEligibility.IsPrimeExclusive',
                        'Offers.Listings.ProgramEligibility.IsPrimePantry',
                        'Offers.Summaries.HighestPrice',
                        'Offers.Summaries.LowestPrice',
                        'Offers.Summaries.OfferCount',
                        'BrowseNodeInfo.BrowseNodes',
                        'BrowseNodeInfo.BrowseNodes.Ancestor',
                        'BrowseNodeInfo.BrowseNodes.SalesRank',
                        'BrowseNodeInfo.WebsiteSalesRank'
                    ]
                };
                
                // Add category filter if specified
                if (category) {
                    payload.BrowseNodeId = category;
                }
                break;
                
            case 'bestsellers':
                payload = {
                    BrowseNodeId: '17', // Books category
                    ItemCount: Math.min(maxResults, 50),
                    PartnerTag: partnerTag,
                    PartnerType: 'Associates',
                    SortBy: 'Relevance',
                    Resources: [
                        'Images.Primary.Large',
                        'ItemInfo.Title',
                        'ItemInfo.ByLineInfo',
                        'ItemInfo.ContentInfo',
                        'ItemInfo.Classifications',
                        'Offers.Listings.Price',
                        'Offers.Summaries.LowestPrice',
                        'BrowseNodeInfo.BrowseNodes.SalesRank',
                        'BrowseNodeInfo.WebsiteSalesRank'
                    ]
                };
                break;
                
            default:
                return {
                    statusCode: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        error: 'Invalid searchType. Use "search" or "bestsellers"' 
                    }),
                };
        }

        // Create AWS Signature Version 4
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const date = timestamp.substr(0, 8);
        
        const credentialScope = `${date}/${region}/${service}/aws4_request`;
        const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
        
        const canonicalRequest = [
            'POST',
            uri,
            '',
            `content-type:application/json; charset=utf-8`,
            `host:${endpoint}`,
            `x-amz-date:${timestamp}`,
            `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems`,
            '',
            signedHeaders,
            crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
        ].join('\n');

        const stringToSign = [
            'AWS4-HMAC-SHA256',
            timestamp,
            credentialScope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex')
        ].join('\n');

        const signingKey = getSignatureKey(secretKey, date, region, service);
        const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

        const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        // Make the API request
        const response = await fetch(`https://${endpoint}${uri}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Host': endpoint,
                'X-Amz-Date': timestamp,
                'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
                'Authorization': authorizationHeader
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Amazon API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Transform Amazon data to match our book format
        const transformedBooks = data.SearchResult?.Items?.map(item => {
            const itemInfo = item.ItemInfo || {};
            const title = itemInfo.Title?.DisplayValue || 'Unknown Title';
            const authors = itemInfo.ByLineInfo?.Contributors?.map(c => c.Name).join(', ') || 'Unknown Author';
            const price = item.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount || 'Price not available';
            const salesRank = item.BrowseNodeInfo?.WebsiteSalesRank?.SalesRank || null;
            const category = item.BrowseNodeInfo?.BrowseNodes?.[0]?.DisplayName || 'Books';
            
            return {
                title,
                author: authors,
                price,
                salesRank,
                category,
                isbn: itemInfo.ExternalIds?.ISBNs?.[0]?.DisplayValue || null,
                publisher: itemInfo.ByLineInfo?.Manufacturer?.DisplayValue || 'Unknown',
                publicationDate: itemInfo.ContentInfo?.PublicationDate?.DisplayValue || 'Unknown',
                description: itemInfo.Features?.DisplayValues?.join(' ') || 'No description available',
                rating: 'N/A', // Amazon doesn't provide ratings in PA API
                reviews: 0,
                genre: category,
                amazonUrl: item.DetailPageURL || null,
                imageUrl: item.Images?.Primary?.Large?.URL || null,
                source: 'Amazon'
            };
        }) || [];

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                books: transformedBooks,
                totalResults: transformedBooks.length,
                searchType,
                query
            }),
        };

    } catch (error) {
        console.error('Amazon Books API Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                error: 'Failed to fetch from Amazon Books API',
                details: error.message 
            }),
        };
    }
};

// Helper function to create AWS signature key
function getSignatureKey(key, date, region, service) {
    const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(date).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    return kSigning;
}
