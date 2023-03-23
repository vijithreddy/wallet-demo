const express = require("express");
require("dotenv").config({ path: "../db/config.env" });
const { CoinbaseCloud, Network } = require("@coinbase/coinbase-cloud-sdk");
const ethers = require("ethers");
const pino = require('pino-http')()


// recordRoutes is an instance of the express router.
// We use it to define our routes.
const recordRoutes = express.Router();
recordRoutes.use(pino)


// This will help us connect to the database
const dbo = require("../db/conn");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// This section will help you get a list of all the tokens.
recordRoutes
  .route("/tokens")
  .get(function (req, res) {
    let db_connect = dbo.getDb("etherScan");
    db_connect
      .collection("ERC20Tokens")
      .find({}, { _id: 0 })
      .toArray((err, result) => {
        if (err) throw err;
        result = result.map(({ _id, ...all }) => all);
        res.status(200).json(result);
      });
  })
  .post(async (req, res) => {
    let contract_address = req.body.contract_address;
    const settings = {
      apiUsername: process.env.CB_USERNAME,
      apiPassword: process.env.CB_PASSWORD,
      network: Network.ETH_MAINNET,
    };
    const coinbaseCloud = new CoinbaseCloud(settings);
    let db_connect = dbo.getDb("etherScan");
    let collection = db_connect.collection("ERC20Tokens");
    let status = await writePayLoad(contract_address, collection);
    if (status == "400") {
      res.status(400).send("Invalid contract address");
    } else if (status == "409") {
      res.status(409).send("Contract address already exists");
    } else {
      let token_metadata_obj = await getTokenMetadata(
        contract_address,
        coinbaseCloud
      );
      req.log.info({body: req.body.method})
      try {
        await collection.insertOne(token_metadata_obj);
      } catch (err) {
        console.log(err);
      }
      res
        .status(200)
        .send(
          "The following has been added to the database " +
            JSON.stringify(token_metadata_obj)
        );
    }
  })
  .delete(async (req, res) => {
    let contract_address = req.body.contract_address;
    console.log(contract_address)
    let db_connect = dbo.getDb("etherScan");
    let collection = db_connect.collection("ERC20Tokens");
    let status = await deletePayLoad(contract_address, collection);
    req.log.info({body: req.body})
    if (status == "400") {
      res.status(400).send("Invalid contract address");
    } else if (status == "404") {
      res.status(404).send("Contract address does not exist");
    } else {
      try {
        await collection.deleteOne({
          contract_address: contract_address,
        });
      } catch (err) {
        console.log(err);
      }
      res
        .status(200)
        .send(
          "The following has been deleted from the database " + contract_address
        );
    }
  });

async function writePayLoad(contract_address, collection) {
  if (ethers.utils.isAddress(contract_address)) {
    let doc_count = await collection.countDocuments({
      contract_address: contract_address,
    });
    if (doc_count != 0) {
      return "409";
    } else {
      return "200";
    }
  } else {
    return "400";
  }
}

async function deletePayLoad(contract_address, collection) {
  if (ethers.utils.isAddress(contract_address)) {
    let doc_count = await collection.countDocuments({
      contract_address: contract_address,
    });
    if (doc_count == 0) {
      return "404";
    } else {
      return "200";
    }
  } else {
    return "400";
  }
}

async function getTokenMetadata(contract_address, coinbaseCloud) {
  const response = await coinbaseCloud.advanced.getTokenMetadata(
    contract_address
  );
  const metadata = response.tokenMetadata;
  let token_metadata_obj = {
    contract_address: contract_address,
    token_name: metadata.name,
    token_symbol: metadata.symbol,
  };
  return token_metadata_obj;
}

module.exports = recordRoutes;
