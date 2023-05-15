const cron = require("node-cron");
const Web3 = require("web3");
const MongoClient = require('mongodb').MongoClient;
const uri = 'mongodb+srv://<user>:<password>@cluster0.ebcthbg.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const abi = require('./ABI-TEST.json')

class Worker {
  constructor(contractAddress, rpcs, blockNumber, eventName, dbName, collectionName) {
    this.contractAddress = contractAddress;
    this.rpcs = rpcs;
    this.blockNumber = blockNumber;
    this.eventName = eventName
    this.dbName = dbName;
    this.collectionName = collectionName
  }

  async saveEventsToMongo(events) {

    try {
      await client.connect();
      const db = client.db(this.dbName);
      const collection = db.collection(this.collectionName);
      const docs = [];
      //events = await this.getTransferEvents();
      for (const e of events) {
        docs.push({
          blockNumber: e.blockNumber,
          transactionHash: e.transactionHash,
          from: e.returnValues.from,
          to: e.returnValues.to,
          value: e.returnValues.value,
        });
      }
      await collection.insertMany(docs);
      console.log('Saved to MongoDB');
    } catch (error) {
      console.error(error);
    } finally {
      await client.close();
    }
  }

  async getCurrentBlock() {
    for (let i = 0; i < this.rpcs.length; i++) {
      this.web3 = new Web3(this.rpcs[i]);
      const currentBlock = await this.web3.eth.getBlockNumber();
      return currentBlock
    }
  }

  async getTransferEvent() {
    let startBlock = this.blockNumber
    let currentBlock = await this.getCurrentBlock()
    let flagBlock = startBlock
    for (let i = 0; i < this.rpcs.length; i++) {
      try {
        this.web3 = new Web3(this.rpcs[i]);
        this.contract = new this.web3.eth.Contract(abi, this.contractAddress);
        for (; flagBlock <= currentBlock; flagBlock += 201) {
          const events = await this.contract.getPastEvents(this.eventName, {
            fromBlock: flagBlock,
            toBlock: flagBlock + 200
          })
          for (let k = 0; k < events.length; k++) {
            console.log(`Transfer events at block number ${events[k].blockNumber} from ${events[k].returnValues.from} to ${events[k].returnValues.to} value: ${events[k].returnValues.value}`)
            await this.saveEventsToMongo(events)
          }
        }
      } catch (error) {
        console.log(`Failed to run worker with rpc ${this.rpcs[i]} - error ${error}`);
      }
    }
  }

  async getStartBlock() {
    let startBlock = this.blockNumber;
    return startBlock
  }

  contracts = [];

  async run() {
    this.contracts.push(this.contractAddress);
    let isRunning = false;

    let startBlock = this.blockNumber;

    cron.schedule("*/10 * * * * *", async () => {
      console.log(`Worker ${this.contractAddress} from block ${this.blockNumber} is running`)
      if (isRunning) return;
      //console.log(`Worker starts at block ${startBlock}`);
      isRunning = true;

      if (isRunning) {

        const currentBlock = await this.getCurrentBlock()
        console.log('CUREENT', currentBlock)

        await this.getTransferEvent()


        isRunning = false;
        startBlock = currentBlock - 1;
      }
    });
  }
}

module.exports = Worker;
