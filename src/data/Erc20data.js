

async function getErc20Tokens() {
  const erc20Data = {};
  const response = await fetch("http://localhost:5000/tokens");
  const data = await response.json();

  for (var i=0; i<data.length; i++) {
    erc20Data[data[i].contract_address] = data[i].token_name;
  }
  return erc20Data;
}

export const Erc20Data=getErc20Tokens();

/*
export const erc20NameMap = {
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "Wrapped ETH",
    "0xdac17f958d2ee523a2206206994597c13d831ec7": "Tether USD",
    "0xb8c77482e45f1f44de1745f52c74426c631bdd52": "Binance Coin",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USD Coin",
    "0x4fabb145d64652a948d72533023f6e7a623c7c53": "Binance USD",
    "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": "Matic",
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "stETH"
  }
*/