require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");

const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || "https://eth-goerli/";
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "0xkey";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "key";
const COINMARKETCAP_AIP_KEY = process.env.COINMARKETCAP_AIP_KEY || "key";

// set proxy
const proxyUrl = "http://127.0.0.1:8001"; // change to yours, With the global proxy enabled, change the proxyUrl to your own proxy link. The port may be different for each client.
const { ProxyAgent, setGlobalDispatcher } = require("undici");
const proxyAgent = new ProxyAgent(proxyUrl);
setGlobalDispatcher(proxyAgent);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //solidity: "0.8.8",
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
  },
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      //hardhat 的本地测试网络不需要accounts
      chainId: 31337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      31337: 1,
    },
    user: {
      default: 1,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COINMARKETCAP_AIP_KEY,
  },
};
