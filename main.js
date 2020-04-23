const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const {Blockchain, Transaction} = require('./blockchain')

// Initialize my keys
const myKey = ec.keyFromPrivate('3dc17e176c0ff54b8c675588653108dd9a7591eec4e3cb5bcb2b7efca7739e89')
const myWalletAddress = myKey.getPublic('hex')

// Make my blockchain
let grahamCoin = new Blockchain();

// Mine 100 coin for Graham, check balance
console.log(`\n Starting the miner for ${myWalletAddress}...`)
grahamCoin.minePendingTransactions(myWalletAddress)
console.log(`\n Balance is`, grahamCoin.getBalanceOfAddress(myWalletAddress))

// Do a transaction
const tx1 = new Transaction(myWalletAddress, 'public key--dest. wallet address--goes here', 50)
tx1.signTransaction(myKey)
grahamCoin.addTransaction(tx1)

// Mine 100 coin for Graham, check balance
console.log(`\n Starting the miner for ${myWalletAddress}...`)
grahamCoin.minePendingTransactions(myWalletAddress)
console.log(`\n Balance is`, grahamCoin.getBalanceOfAddress(myWalletAddress))

grahamCoin.chain[1]

// Check validity
console.log('Is chain valid?', grahamCoin.isChainValid())