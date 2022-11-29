const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");

describe("FundMe", async function() {
  let fundMe;
  let deployer;
  let MockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1"); // 1 ETH
  beforeEach(async function() {
    //deploy our FundMe contract
    //using hardhat-deploy
    // const accounts = await ethers.getSigner();
    // const accountsOne = accounts[0];
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    MockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", async function() {
    it("sets the aggregator addresses correctly!", async function() {
      const respose = await fundMe.priceFeed();
      assert.equal(respose, MockV3Aggregator.address);
    });
  });

  describe("fund", async function() {
    it("Fails if you dong't sent enough ETH", async function() {
      await expect(fundMe.fund()).to.be.revertedWith("Don't send enough!");
    });

    it("updated the amount funded data structure", async function() {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });

    it("Add funder to array of funders", async function() {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.funders(0);
      assert.equal(funder, deployer);
    });
  });

  describe("withdraw", async function() {
    beforeEach(async function() {
      await fundMe.fund({ value: sendValue });
    });

    it("withdraw ETH from a single funder", async function() {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withDraw();
      const transactionRecept = await transactionResponse.wait(1);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //gasCost
      const { gasUsed, effectiveGasPrice } = transactionRecept;
      gasCost = gasUsed.mul(effectiveGasPrice);

      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it("allows us to withdraw with multiple funders", async function() {
      //Arrange
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        const fundMeconnectedContract = await fundMe.connect(accounts[i]);
        await fundMeconnectedContract.fund({ value: sendValue });
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );

      //Act
      const transactionResponse = await fundMe.withDraw();
      const transactionRecept = await transactionResponse.wait(1);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //gasCost
      const { gasUsed, effectiveGasPrice } = transactionRecept;
      gasCost = gasUsed.mul(effectiveGasPrice);
      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      //Make sure that the funders are reset properly
      await expect(fundMe.funders(0)).to.be.reverted;

      for (i = 0; i < 6; i++) {
        assert.equal(
          await fundMe.addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

    it("Only allows the owner to withdraw", async function() {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withDraw()).to.be.revertedWith(
        "FundMe__NotOwner"
      );
    });
  });
});
