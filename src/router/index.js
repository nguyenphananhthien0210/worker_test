const router = require("express").Router();
const Worker = require("../model/worker");

router.post("/create-worker", async (req, res) => {
  try {
    const contractAddress = req.body.contract_address;
    const rpcs = req.body.rpcs;
    const blockNumber = req.body.blockNumber;
    const eventName = req.body.eventName
    const dbName = req.body.dbName;
    const collectionName = req.body.collectionName

    const worker = new Worker(contractAddress, rpcs, blockNumber, eventName, dbName, collectionName);

    worker.run();

    res.status(200).json({
      message: `Worker with contract address ${contractAddress} is running`,
    });
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

module.exports = router;
