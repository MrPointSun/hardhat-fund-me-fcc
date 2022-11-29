/*没有main函数，使用默认函数即可
function deployFunc(hre) {
  console.log("Hi!");
}

//设定默认函数为deployFunc
module.exports.default = deployFunc;
*/

//和上面完全相同
//module.exports = async (hre) => {};

/*
module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  //hre.getNamedAccounts
  //hre.deployments
  //完全相同
};
*/

// const helperConfig = require("../helper-hardhat-config.js");
// const networkConfig = helperConfig.networkConfig;
//完全等同
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config.js");
const { network } = require("hardhat");
const { verify } = require("../utils/verify.js");

//将const {getNamedAccounts, deployments} = hre 带入async(hre)
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //如果chainId 是X，那么address是AX
  //如果chainId 是Y，那么address是AY
  //const ethUsdPriceFeed = networkConfig[chainId]["ethUsdPriceFeed"];
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  //如果要改变chains，怎么做？
  //当从localhost 或者 hardhat network 部署时，我们用mock
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, //喂feed address
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log("----------------------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
