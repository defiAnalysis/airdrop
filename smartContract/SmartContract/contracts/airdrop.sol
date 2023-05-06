// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract airdrop {
    address public owner;
    constructor() {
        owner = msg.sender;
    }

    /// @notice 向多个地址转账ERC20代币，使用前需要先授权
    ///
    /// @param _token 转账的ERC20代币地址
    /// @param _addresses 空投地址数组
    /// @param _amounts 代币数量数组（每个地址的空投数量）
    function multiTransferToken(
        address _token,
        address[] calldata _addresses,
        uint256[] calldata _amounts
        ) external {
        
        require(msg.sender == owner,"onlyOwner");

        // 检查：_addresses和_amounts数组的长度相等
        require(_addresses.length == _amounts.length, "Lengths of Addresses and Amounts NOT EQUAL");
        IERC20 token = IERC20(_token); // 声明IERC合约变量
        // uint _amountSum = getSum(_amounts); // 计算空投代币总量
        // 检查：授权代币数量 >= 空投代币总量
        // require(token.allowance(msg.sender, address(this)) >= _amountSum, "Need Approve ERC20 token");
        
        // for循环，利用transferFrom函数发送空投
        for (uint8 i; i < _addresses.length; i++) {
            token.transferFrom(msg.sender, _addresses[i], _amounts[i]);
        }
    }

    // // 数组求和函数
    // function getSum(uint256[] calldata _arr) public pure returns(uint sum)
    // {
    //     for(uint i = 0; i < _arr.length; i++)
    //         sum = sum + _arr[i];
    // }
}