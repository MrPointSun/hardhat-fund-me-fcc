// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8; //0.8.8

import "./PriceConverter.sol";
error FundMe__NotOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 10**18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner;

    AggregatorV3Interface private s_priceFeed;

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    function fund() public payable {
        //msg.value.getConversionRate() is getConversionRate(msg.value)
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Don't send enough!"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;
    }

    function withDraw() public payable onlyOwner {
        for (uint256 fundIndex = 0; fundIndex < s_funders.length; fundIndex++) {
            address funder = s_funders[fundIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        //reset the array
        s_funders = new address[](0);

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

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
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

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
