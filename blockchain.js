const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

class Transaction{
    constructor(fromAddress, toAddress, amount){
        this.fromAddress = fromAddress
        this.toAddress = toAddress
        this.amount = amount
    }

    calculateHash(){
        return SHA256(this.fromAddress +
                this.toAddress +
                this.amount
            ).toString()
    }

    signTransaction(signingKey){
        // Make sure we're using our own public key as the "from" address
        if(signingKey.getPublic('hex') !== this.fromAddress){
            throw new Error('You cannot sign transactions for other wallets!')
        }

        // Hash the transaction before signing
        const hashTx = this.calculateHash()

        // Sign (encrypt) hash with our private key. Only our public key can decrypt
        const sig = signingKey.sign(hashTx, 'base64')
        this.signature = sig.toDER('hex')
    }

    isValid(){
        // If "from" is null, it must have been from the Source
        if(this.fromAddress === null) return true

        // Otherwise, there better be a signature
        if(!this.signature || this.signature.length === 0){
            throw new Error('No signature in this transaction')
        }

        // If there is a signature, verify it with the from address (public key)
        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex')
        return publicKey.verify(this.calculateHash(), this.signature)
    }
}

class Block {
    constructor(timestamp, transactions, previousHash = ''){
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash(){
        return SHA256(
                this.previousHash +
                this.timestamp + 
                JSON.stringify(this.transactions) +
                this.nonce
            )
            .toString();
    }

    mineBlock(difficulty){
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            this.nonce++
            this.hash = this.calculateHash()
        }

        console.log("Block mined: " + this.hash)
    }

    hasValidTransactions(){
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false
            }
        }

        return true
    }
}

class Blockchain{
    constructor(){
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2
        this.pendingTransactions = []
        this.miningReward = 100;
    }

    createGenesisBlock(){
        return new Block("03/07/2020", "Genesis Block", "0");
    }

    getLatestBlock(){
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress){
        // Create a transaction record showing we mined this new block
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        // Create block and mine hash
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        console.log('Block successfully mined!');
        this.chain.push(block);

        // Reset pending transactions
        this.pendingTransactions = [];
    }

    addTransaction(transaction){
        if(!transaction.fromAddress || !transaction.toAddress){
            throw new Error('Transaction must include a from and a to address')
        }

        if(transaction.amount > this.getBalanceOfAddress(transaction.fromAddress)){
            throw new Error('There must be sufficient money in the wallet!')
        }

        if(!transaction.isValid()){
            throw new Error('Cannot add invalid transaction to chain.')
        }

        this.pendingTransactions.push(transaction)
    }

    getBalanceOfAddress(address){
        let balance = 0

        for(const block of this.chain){
            for(const transa of block.transactions){
                if(transa.fromAddress === address){
                    balance -= transa.amount
                }

                if(transa.toAddress === address){
                    balance += transa.amount
                }
            }
        }

        return balance
    }

    isChainValid(){
        for(let i = 1; i < this.chain.length; i++){
            const currentBlock = this.chain[i]
            const previousBlock = this.chain[i - 1]

            if(!currentBlock.hasValidTransactions()){
                return false
            }

            if(currentBlock.hash != currentBlock.calculateHash()){
                return false;
            }

            if(currentBlock.previousHash != previousBlock.hash){
                return false;
            }
        }
        
        return true
    }
}

module.exports.Blockchain = Blockchain
module.exports.Transaction = Transaction