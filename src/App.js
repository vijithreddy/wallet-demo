import { useState } from 'react';
import { ethers } from 'ethers';
import { CoinbaseCloud, Network } from '@coinbase/coinbase-cloud-sdk';
import './App.css';

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [walletScan, setWalletScan] = useState({
    network: "",
    balance: "",
    latest_block: ""
  });
  const [table_data, setTableData] = useState([]);;
  const [transaction_data, setTransactionData] = useState([]);;

  function toFixedValue(value, dp) {
    return +parseFloat(value).toFixed(dp);
  }

  function payLoad_erc20Tokens(walletAddress, contract_list) {
    let tmp;
    var address_contract_list = []
    for (var i = 0; i < contract_list.length; i++) {
      tmp = { "address": walletAddress, "contract": contract_list[i] }
      address_contract_list.push(tmp)
    }
    return address_contract_list
  }



  function populateBalanceData(token_balances, erc20NameMap, ethBalance) {
    let tmp;
    let ethVal;
    var balance_data = []
    ethVal = { "token_name": "ETH", "balance": ethBalance }
    balance_data.push(ethVal)
    for (var i = 0; i < token_balances.length; i++) {
      const preFormattedBalance = token_balances[i].amount
      const formattedBalance = ethers.utils.formatUnits(preFormattedBalance, token_balances[i].decimals)
      if (formattedBalance > 0) {
        console.log("Contract is", token_balances[i].contract, "Name is ", erc20NameMap[token_balances[i].contract])
        tmp = { "token_name": erc20NameMap[token_balances[i].contract], "balance": toFixedValue(formattedBalance, 4) }
        balance_data.push(tmp)
      }
    }
    return balance_data

  }

  function populateTransactionData(transaction_list) {
    let tmp;
    var transaction_data = []
    for (var i = 0; i < transaction_list.length; i++) {
      let block_timestamp = parseInt(transaction_list[i].blockTimestamp);
      let time_diff = new Date().getTime() - block_timestamp * 1000;
      let time_diff_days = Math.floor(time_diff / (1000 * 60 * 60 * 24));
      let time_diff_hours = Math.floor((time_diff % (1000 * 3600 * 24)) / (1000 * 3600));
      let time_diff_minutes = Math.floor((time_diff % (1000 * 3600)) / (1000 * 60));
      let time_diff_seconds = Math.floor((time_diff % (1000 * 60)) / 1000);
      let age;
      const days_in_string = time_diff_days.toString()
      const hours_in_string = time_diff_hours.toString()
      const minutes_in_string = time_diff_minutes.toString()
      const seconds_in_string = time_diff_seconds.toString()
      if (time_diff_days > 0) {
        age = days_in_string + " days " + hours_in_string + " hours ago"
      } else if (time_diff_hours > 0) {
        age = hours_in_string + " hours ago"
      } else if (time_diff_minutes > 0) {
        if (time_diff_minutes === 1) {
          age = minutes_in_string + " minute ago"
        }
        else {
          age = minutes_in_string + " minutes ago"
        }
      } else {
        age = seconds_in_string + " seconds ago"
      }

      tmp = { "from": transaction_list[i].from, "to": transaction_list[i].to, "value": ethers.utils.formatEther(transaction_list[i].value), "hash": transaction_list[i].transactionHash, "block_number": parseInt(transaction_list[i].blockNumber), "age": age }
      transaction_data.push(tmp)
    }
    return transaction_data
  }

  async function scanWallet() {

    setTableData([]);
    setTransactionData([]);
    const settings = {
      apiUsername: process.env.REACT_APP_NODE_USERNAME, // You can find this in your Node project's settings
      apiPassword: process.env.REACT_APP_NODE_PASSWORD, // Password associated with the username
      network: Network.ETH_MAINNET
    }
    const erc20NameMap = {
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "Wrapped ETH",
      "0xdac17f958d2ee523a2206206994597c13d831ec7": "Tether USD",
      "0xb8c77482e45f1f44de1745f52c74426c631bdd52": "Binance Coin",
      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USD Coin",
      "0x4fabb145d64652a948d72533023f6e7a623c7c53": "Binance USD",
      "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": "Matic",
      "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "stETH"
    }

    console.log("All Contracts", Object.keys(erc20NameMap))

    if (ethers.utils.isAddress(walletAddress)) {
      const coinbaseCloud = new CoinbaseCloud(settings)
      const cbProvider = coinbaseCloud.provider

      const network_obj = await cbProvider.getNetwork();
      const latest_block = await cbProvider.getBlockNumber()
      const contract_list = Object.keys(erc20NameMap)
      const contract_params = payLoad_erc20Tokens(walletAddress, contract_list);

      console.log("contract params", contract_params)


      //call advanced API for erc20 tokens 
      const cb_balances = await coinbaseCloud.advanced.getBalances(contract_params)
      console.log(cb_balances)
      let token_balances = cb_balances.balances[0].tokenBalances
      console.log("token balances are", token_balances)
      const network = network_obj.name;
      const preformat_balance = ethers.utils.formatEther(await cbProvider.getBalance(walletAddress));

      const balance = toFixedValue(preformat_balance, 4)
      const table_data = populateBalanceData(token_balances, erc20NameMap, balance)
      setTableData(table_data);

      setWalletScan({
        network,
        balance,
        latest_block
      });

      //transactions
      const transactions = await coinbaseCloud.advanced
        .getTransactionsByAddress(
          walletAddress,
          '0x0',//start block
          ethers.utils.hexlify(latest_block),//end block
          'SENDER_OR_RECEIVER',
          'desc',
          10,
          1
        );

      console.log("Verify my transactions", transactions.transactions)
      let transaction_list = transactions.transactions;
      const transaction_data = populateTransactionData(transaction_list)
      setTransactionData(transaction_data)
    } else {
      alert("Please enter the correct eth address");
    }



  }


  const setWalletAddr = event => {
    setWalletAddress(event.target.value);
  };


  const handleSubmit = event => {
    event.preventDefault();
    // 👇️ value of input field
    scanWallet();
    console.log("table data is", typeof (table_data));
    console.log('WalletAddress ', walletAddress);

  };

  return (
    <div className="App">
      <header className="App-header">
        <h3>Wallet Address Entered: {walletAddress}</h3>
        <h3>Network Name: {walletScan.network}</h3>
        <h4>Latest Block: {walletScan.latest_block}</h4>
        <div className="form-style-6">
          <h1>Wallet Scanner</h1>
          <form onSubmit={handleSubmit}>
            <input id="walletAddress" type="text" name="walletAddress" value={walletAddress} onChange={setWalletAddr} />
            <input type="submit" value="Send" />
          </form>
        </div>

        <h3> Balances: </h3>
        <table className="styled-table">
          <thead>
            <tr>
              <th>Token Name</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {
              table_data.map((value, key) => {
                return (
                  <tr key={key}>
                    <td>{value.token_name}</td>
                    <td>{value.balance}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>


        <h3> Transactions: </h3>
        <table className="styled-table1">

          <thead>
            <tr>
              <th>Age</th>
              <th>Block Number</th>
              <th>From</th>
              <th>To</th>
              <th>Transaction Hash</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {
              transaction_data.map((value, key) => {
                return (
                  <tr key={key}>
                    <td>{value.age}</td>
                    <td>{value.block_number}</td>
                    <td>{value.from}</td>
                    <td>{value.to}</td>
                    <td>{value.hash}</td>
                    <td>{value.value}</td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </header>
    </div>
  );
}

export default App;
