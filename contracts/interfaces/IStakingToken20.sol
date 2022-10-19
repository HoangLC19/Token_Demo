//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakingToken20 {
    event Staked(address indexed user, uint256 amount);

    event Claim(address indexed stakeHolder, uint256 amount);

    event Withdraw(address indexed stakeHolder, uint256 amount);

    event StakingStart(uint256 startTime, uint256 lockTime, uint256 endTime);

    function startStaking() external;

    function deposit(uint256 _amount) external;

    function withdraw() external;

    function claimReward() external;

    function amountStaked(address _stakeHolder) external view returns (uint256);

    function totalDeposited() external view returns (uint256);

    function rewardOf(address _stakeHolder) external view returns (uint256);
}
