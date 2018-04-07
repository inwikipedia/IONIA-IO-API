const http = require('../modules/http')
const crypto = require('../modules/crypto')


async function getbalances(data) {
    const baseUrl = 'https://api.bitfinex.com'
    const serviceUri = '/v1/balances'

    const requestBody = {
        request: serviceUri,
        nonce: Date.now().toString()
    }

    const payload = crypto.encode('base64', JSON.stringify(requestBody))
    const signature = crypto.hmac('sha384', data.bitfinex.secretKey, payload)

    const headers = {
        'X-BFX-APIKEY': data.bitfinex.apiKey,
        'X-BFX-PAYLOAD': payload,
        'X-BFX-SIGNATURE': signature
    }

    const response = await http.request(baseUrl + serviceUri, 'POST', headers, requestBody)
    console.log(response)
    return response.message === undefined ? makeResult(response) : {}
}

function makeResult(tokens) {
    const result = {}
    const bitfinexObject = result['bitfinex'] = {}

    for(let i = 0; i < tokens.length; i++) {
        const token = tokens[i]

        if(token.type === 'deposit' && token.name !== 'usd') {
            bitfinexObject[token.currency] = {
                available: parseFloat(token.available),
                balance: parseFloat(token.amount),
                pending: 0,
                address: null
            }
        }
    }

    return result
}

exports.getbalances = getbalances