/**
 * @api {get} /api/stockdata Fetch stock data from Yahoo Finance
 * @apiName GetStockData
 * @apiGroup Stock
 *
 * @apiParam {String} tickers Comma-separated list of stock tickers (e.g., "0700.HK,9988.HK").
 *
 * @apiSuccess {Object} data A map of ticker symbols to their corresponding data objects.
 * @apiSuccess {Null} error Null on success.
 *
 * @apiError {Null} data Null on error.
 * @apiError {String} error A description of the error.
 */
export default async function handler(request, response) {
  // Set CORS headers to allow requests from any origin
  // For a production environment, you might want to restrict this to your specific domain
  // e.g., response.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  // Handle OPTIONS preflight request for CORS
  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  // Ensure the request is a GET request
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET', 'OPTIONS']);
    return response.status(405).json({
      data: null,
      error: `Method ${request.method} Not Allowed`,
    });
  }

  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      // This is a server configuration error, so we log it and return a generic error.
      console.error('Server configuration error: RAPIDAPI_KEY is not set.');
      return response.status(500).json({
        data: null,
        error: 'Internal Server Error: API key not configured.',
      });
    }

    // Vercel automatically parses query parameters.
    // We access them from the `request.query` object.
    const { tickers } = request.query;

    if (!tickers || typeof tickers !== 'string') {
      return response.status(400).json({
        data: null,
        error: 'Bad Request: Missing or invalid "tickers" query parameter.',
      });
    }

    const externalApiUrl = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes?symbol=${tickers}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'yahoo-finance15.p.rapidapi.com',
      },
    };

    const apiResponse = await fetch(externalApiUrl, options);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`Upstream API error: ${apiResponse.status}`, errorBody);
      return response.status(502).json({
        data: null,
        error: `Bad Gateway: Failed to fetch data from the upstream API. Status: ${apiResponse.status}`,
      });
    }

    const result = await apiResponse.json();
    
    // The external API returns a 'body' array. We transform it into a ticker-keyed object
    // as expected by the client-side code and implementation plan.
    const transformedData = result.body.reduce((acc, stock) => {
      // Ensure the stock object and its symbol exist before processing
      if (stock && stock.symbol) {
        acc[stock.symbol] = {
          ticker: stock.symbol,
          shortName: stock.shortName,
          regularMarketPrice: stock.regularMarketPrice?.raw ?? null,
          regularMarketChange: stock.regularMarketChange?.raw ?? null,
          // The client multiplies this by 100, so we pass the raw decimal value.
          regularMarketChangePercent: stock.regularMarketChangePercent?.raw ?? null, 
          regularMarketPreviousClose: stock.regularMarketPreviousClose?.raw ?? null,
          currency: stock.currency
        };
      }
      return acc;
    }, {});


    // Set cache headers to optimize performance and reduce API calls.
    // Cache for 5 minutes (300 seconds).
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return response.status(200).json({
      data: transformedData,
      error: null,
    });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return response.status(500).json({
      data: null,
      error: 'Internal Server Error.',
    });
  }
}
