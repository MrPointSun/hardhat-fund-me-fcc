// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8; //0.8.8

import "./PriceConverter.sol";
error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 10**18;

    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    address public immutable i_owner;

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        //msg.value.getConversionRate() is getConversionRate(msg.value)
        require(
            msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
            "Don't send enough!"
        );
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    function withDraw() public onlyOwner {
        for (uint256 fundIndex = 0; fundIndex < funders.length; fundIndex++) {
            address funder = funders[fundIndex];
            addressToAmountFunded[funder] = 0;
        }

        //reset the array
        funders = new address[](0);

        /*
        //return money
        //transfer
        payable(msg.sender).transfer(address(this).balance);
        //send
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send failed");
        */
        //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Sender is not owner!");
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    //无参数
    receive() external payable {
        fund();
    }

    //有参数
    fallback() external payable {
        fund();
    }
}
