require("dotenv").config({ path: "../db/config.env" });
const { CoinbaseCloud, Network } = require("@coinbase/coinbase-cloud-sdk");

let cbCloud = (function() {
    const settings = {
        apiUsername: process.env.CB_USERNAME,
        apiPassword: process.env.CB_PASSWORD,
        network: Network.ETH_MAINNET,
      };
      var instance;
        function createInstance() {
            const coinbaseCloud = new CoinbaseCloud(settings);
            return coinbaseCloud;
        }
        return {
            getInstance: function() {
                if (!instance) {
                    instance = createInstance();
                }
                return instance;
            }  
        };
})();

function run(){
    var instance1 = cbCloud.getInstance();
    var instance2 = cbCloud.getInstance();
    console.log("Same instance? ", instance1 === instance2); 
}
run();

module.exports = cbCloud;
