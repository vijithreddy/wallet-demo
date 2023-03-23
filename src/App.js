import { useState } from "react";
import "bulma/css/bulma.css";
import { ethers } from "ethers";
import { CoinbaseCloud, Network } from "@coinbase/coinbase-cloud-sdk";
import { Erc20Data } from "./data/Erc20data";
import Balances from "./components/Balances";
import Transactions from "./components/Transactions";
import React from "react";
import "./App.css";

function App() {
  const settings = {
    apiUsername: process.env.REACT_APP_NODE_USERNAME, // You can find this in your Node project's settings
    apiPassword: process.env.REACT_APP_NODE_PASSWORD, // Password associated with the username
    network: Network.ETH_MAINNET,
  };
  const coinbaseCloud = new CoinbaseCloud(settings);
  
  const [walletAddress, setWalletAddress] = useState("");
  const [walletScan, setWalletScan] = useState({
    network: "",
    balance: "",
    latest_block: "",
  });
  const [table_data, setTableData] = useState([]);
  const [transaction_data, setTransactionData] = useState([]);
  const [count, setCount] = useState(1);

  function toFixedValue(value, dp) {
    return +parseFloat(value).toFixed(dp);
  }

  function payLoad_erc20Tokens(walletAddress, contract_list) {
    let tmp;
    var address_contract_list = [];
    for (var i = 0; i < contract_list.length; i++) {
      tmp = { address: walletAddress, contract: contract_list[i] };
      address_contract_list.push(tmp);
    }
    return address_contract_list;
  }

  function populateBalanceData(token_balances, erc20NameMap, ethBalance) {
    let tmp;
    let ethVal;
    var balance_data = [];
    ethVal = { token_name: "ETH", balance: ethBalance };
    balance_data.push(ethVal);
    for (var i = 0; i < token_balances.length; i++) {
      const preFormattedBalance = token_balances[i].amount;
      const formattedBalance = ethers.utils.formatUnits(
        preFormattedBalance,
        token_balances[i].decimals
      );
      if (formattedBalance > 0) {
        console.log(
          "Contract is",
          token_balances[i].contract,
          "Name is ",
          erc20NameMap[token_balances[i].contract]
        );
        tmp = {
          token_name: erc20NameMap[token_balances[i].contract],
          balance: toFixedValue(formattedBalance, 4),
        };
        balance_data.push(tmp);
      }
    }
    return balance_data;
  }

  function populateTransactionData(transaction_list) {
    let tmp;
    var transaction_data = [];
    for (var i = 0; i < transaction_list.length; i++) {
      let block_timestamp = parseInt(transaction_list[i].blockTimestamp);
      let time_diff = new Date().getTime() - block_timestamp * 1000;
      let time_diff_days = Math.floor(time_diff / (1000 * 60 * 60 * 24));
      let time_diff_hours = Math.floor(
        (time_diff % (1000 * 3600 * 24)) / (1000 * 3600)
      );
      let time_diff_minutes = Math.floor(
        (time_diff % (1000 * 3600)) / (1000 * 60)
      );
      let time_diff_seconds = Math.floor((time_diff % (1000 * 60)) / 1000);
      let age;
      const days_in_string = time_diff_days.toString();
      const hours_in_string = time_diff_hours.toString();
      const minutes_in_string = time_diff_minutes.toString();
      const seconds_in_string = time_diff_seconds.toString();
      if (time_diff_days > 0) {
        if (time_diff_days === 1) {
          age = days_in_string + " day " + hours_in_string + " hours ago";
        } else {
          age = days_in_string + " days " + hours_in_string + " hours ago";
        }
      } else if (time_diff_hours > 0) {
        if (time_diff_hours === 1) {
          age = hours_in_string + " hour ago";
        } else {
          age = hours_in_string + " hours ago";
        }
      } else if (time_diff_minutes > 0) {
        if (time_diff_minutes === 1) {
          age = minutes_in_string + " minute ago";
        } else {
          age = minutes_in_string + " minutes ago";
        }
      } else {
        age = seconds_in_string + " seconds ago";
      }

      tmp = {
        from: transaction_list[i].from,
        to: transaction_list[i].to,
        value: toFixedValue(
          ethers.utils.formatEther(transaction_list[i].value),
          4
        ),
        hash: transaction_list[i].transactionHash,
        block_number: parseInt(transaction_list[i].blockNumber),
        age: age,
      };
      transaction_data.push(tmp);
    }
    return transaction_data;
  }

  async function scanWallet() {
    setTableData([]);
    setTransactionData([]);
    
    let erc20NameMap = await Erc20Data;
    

    if (ethers.utils.isAddress(walletAddress)) {
      const cbProvider = coinbaseCloud.provider;
      const network_obj = await cbProvider.getNetwork();
      const latest_block = await cbProvider.getBlockNumber();
      const contract_list = Object.keys(erc20NameMap);
      const contract_params = payLoad_erc20Tokens(walletAddress, contract_list);

      console.log("contract params", contract_params);

      //call advanced API for erc20 tokens
      const cb_balances = await coinbaseCloud.advanced.getBalances(
        contract_params
      );
      console.log(cb_balances);
      let token_balances = cb_balances.balances[0].tokenBalances;
      console.log("token balances are", token_balances);
      const network = network_obj.name;
      const preformat_balance = ethers.utils.formatEther(
        await cbProvider.getBalance(walletAddress)
      );

      const balance = toFixedValue(preformat_balance, 4);
      const table_data = populateBalanceData(
        token_balances,
        erc20NameMap,
        balance
      );
      setCount(count+1);
      console.log("Count is: ", count);
      setTableData(table_data);

      setWalletScan({
        network,
        balance,
        latest_block,
      });

      //transactions
      const transactions =
        await coinbaseCloud.advanced.getTransactionsByAddress(
          walletAddress,
          "0x0", //start block
          ethers.utils.hexlify(latest_block), //end block
          "SENDER_OR_RECEIVER",
          "desc",
          10,
          1
        );

      console.log("Verify my transactions", transactions.transactions);
      let transaction_list = transactions.transactions;
      const transaction_data = populateTransactionData(transaction_list);
      setTransactionData(transaction_data);
    } else {
      alert("Please enter the correct eth address");
    }
  }

  const setWalletAddr = (event) => {
    setWalletAddress(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // 👇️ value of input field
    scanWallet();
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <section className="hero is-primary">
            <div className="hero-body">
              <p className="title">Wallet Address Entered: {walletAddress}</p>
            </div>
          </section>
        </div>
        <h3>Network Name: {walletScan.network}</h3>
        <h4>Latest Block: {walletScan.latest_block}</h4>
        <div className="form-style-6">
          <h1>Wallet Scanner</h1>
          <form onSubmit={handleSubmit}>
            <input
              id="walletAddress"
              type="text"
              name="walletAddress"
              value={walletAddress}
              onChange={setWalletAddr}
            />
            <input type="submit" value="Send" />
          </form>
        </div>
        <Balances table_data={table_data} cb_cloud_obj={coinbaseCloud} wallet_address={walletAddress} count={count}/>
        <Transactions transaction_data={transaction_data} />
        
      </header>
    </div>
  );
}

export default App;
