const PRIVACY = require('./../../privacy.json')
const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx')
const fs = require('fs')
const path = require('path')
const ERC20_ADDR = require('./../../erc_contract_address.json')

async function erctokens(params) {
  const mainnet = `http://${PRIVACY.BLOCKCHAINS.ETHEREUM.IP}:${PRIVACY.BLOCKCHAINS.ETHEREUM.PORT}`
  let web3

  if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider)
  } else {
    web3 = new Web3(new Web3.providers.HttpProvider(mainnet))
  }

  let result = {}
  let contractAddress = ''
  let abiArray = ''

  if (params.do === 'sendtransaction') {
    const smartcontractInfo = {};
    smartcontractInfo.abi = await getAbi(params.tokenName)
    smartcontractInfo.contractAddress = getContractAddress(params.tokenName)

    const gasInfo = {}
    gasInfo.gasLimit = await getGasLimit(web3)
    gasInfo.gasPrice = await getGasPrice(web3)
    const nonce = await web3.eth.getTransactionCount(params.frompubKey)

    result.hash = await sendTransaction(params, web3, gasInfo, nonce, smartcontractInfo.contractAddress, smartcontractInfo.abi)

  } else if (params.do === 'getbalance') {
    if (params.tokenName === '*') {
      result.balance = {}
      const tokens = Object.keys(ERC20_ADDR)
      const start = params.from
      const end = params.to
      for(let i = start ; i < end ; i++) {
        const smartcontractInfo = {};
        smartcontractInfo.abi = await getAbi(tokens[i])
        smartcontractInfo.contractAddress = ERC20_ADDR[tokens[i]]
        result.balance[tokens[i]] = await getBalance(params, web3, smartcontractInfo.contractAddress, smartcontractInfo.abi)
      }
    } else {
      const smartcontractInfo = {};
      smartcontractInfo.abi = await getAbi(params.tokenName)
      smartcontractInfo.contractAddress = getContractAddress(params.tokenName)
      result.balance = await getBalance(params, web3, smartcontractInfo.contractAddress, smartcontractInfo.abi)
    }

  } else if (params.do === 'createaccount') {
    // 어떻게 하는것일까 ...
  } else if (params.do === 'gettransaction') {
    result.transaction = await getTransaction(params, web3)
    
  } else {
    // get count of tokens
    const tokens = Object.keys(ERC20_ADDR)
    result.count = tokens.length
  }

  if(isEmpty(result)) {
    return undefined
  } else {
    return result
  }
  
}

function getContractAddress(token) {
  contractAddress = ERC20_ADDR[token]
  return contractAddress
}

async function getAbi(token) {
  abiArray = await JSON.parse(fs.readFileSync(path.resolve(__dirname+'/../../erc_abis', `./${token}-contract-abi.json`), 'utf-8'))
  return abiArray
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}


function getGasLimit(web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getBlock('latest').then(function(result) {
      resolve(result.gasLimit)
    })
  })
}

function getGasPrice(web3) {
  return new Promise((resolve, reject) => {
    web3.eth.getGasPrice().then(function(price) {
      resolve(price)
    })
  })
}


function sendTransaction(params, web3, gasInfo, nonce, contractAddress, abiArray) {

  return new Promise((resolve, reject) => {
    const privateKey = new Buffer(params.fromprivKey.substr(2), 'hex')
    const value = web3.utils.toHex(web3.utils.toWei(params.amount))
    const contract = new web3.eth.Contract(abiArray, contractAddress, {
        from: params.frompubKey
    })
    const chainId = 1
    const rawTransaction = {
        from: params.frompubKey,
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasInfo.gasPrice),
        gasLimit: web3.utils.toHex(gasInfo.gasLimit),
        to: contractAddress,
        value: "0x0",
        data: contract.methods.transfer(params.topubKey, 1).encodeABI(),
        chainId: chainId
    }
  
    const tx = new EthereumTx(rawTransaction)
    tx.sign(privateKey)
    const serializedTx = tx.serialize()
    
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {                
        if (!err){
          resolve(hash)
        }
        else {
          console.log(err)
          reject(err)
        }
    })
  })

}

function getBalance(params, web3, contractAddress, abiArray) {

  // 이 방법으로 해야 됨.
  return new Promise((resolve, reject) => {
    var fromPubKey = params.frompubKey;  
    var addr = fromPubKey;
    var contractAddr = contractAddress;
    var tknAddress = (addr).substring(2)
    var contractData = ('0x70a08231000000000000000000000000' + tknAddress)
    web3.eth.call({
      to: contractAddr, 
      data: contractData 
    },
    function(err, result) {
      if (result) {                
        resolve(web3.utils.fromWei(result));
      }
      else {
        reject(err);
        console.log(err);
      }
    });
  })
}

async function getTransaction(params, web3) {
  const hash = await web3.eth.getTransaction(params.hash)
  return hash
}

exports.erctokens = erctokens