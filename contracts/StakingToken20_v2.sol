//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IStakingToken20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract StakingToken20 is IStakingToken20, Ownable {
    using SafeERC20 for IERC20;
    IERC20 public immutable token;

    struct StakeInfo {
        uint256 userStartTime;
        uint256 rewardsToClaim;
        uint256 amount;
        uint256 claimed;
    }
    uint8 public immutable fixedAPY;

    uint256 public immutable stakingDuration;
    uint256 public constant LOCK_DURATION = 1 hours;
    uint256 public immutable maxStake;

    uint256 public startTime;
    uint256 public lockTime;
    uint256 public endTime;

    uint256 private _totalStaked;
    uint256 private _precision = 10e6;

    mapping(address => StakeInfo) public stakedUser;
    mapping(address => bool) private _staked;

    constructor(
        address _tokenContract,
        uint8 _fixedAPY,
        uint256 _durations,
        uint256 _maxStake
    ) {
        require(_tokenContract != address(0), "Invalid Token Address");
        token = IERC20(_tokenContract);
        fixedAPY = _fixedAPY;
        stakingDuration = _durations * 1 minutes;
        maxStake = _maxStake;
    }

    //StartStaking
    function startStaking() external override onlyOwner {
        require(startTime == 0, "Staking already started");
        startTime = block.timestamp;
        lockTime = startTime + LOCK_DURATION;
        endTime = startTime + stakingDuration;
        emit StakingStart(startTime, lockTime, endTime);
    }

    //Deposit
    function deposit(uint256 _amount) external override {
        require(startTime > 0, "Staking not started");
        require(endTime > block.timestamp, "Staking already ended");
        require(_totalStaked + _amount <= maxStake, "Max stake reached");
        require(_amount > 0, "Amount must be larger than 0");

        if (stakedUser[_msgSender()].userStartTime == 0) {
            stakedUser[_msgSender()].userStartTime = block.timestamp;
        }
        _updateReward();
        stakedUser[_msgSender()].amount += _amount;
        _totalStaked += _amount;
        token.safeTransferFrom(_msgSender(), address(this), _amount);
        emit Staked(_msgSender(), _amount);
    }

    //Withdraw
    function withdraw() external override {
        require(block.timestamp >= lockTime, "Lockup period not over");
        _updateReward();

        if (stakedUser[_msgSender()].rewardsToClaim > 0) {
            _claimReward();
        }

        uint256 amountStake = stakedUser[_msgSender()].amount;
        _totalStaked -= stakedUser[_msgSender()].amount;
        delete stakedUser[_msgSender()];
        token.safeTransfer(_msgSender(), amountStake);
        emit Withdraw(_msgSender(), amountStake);
    }

    //Claim Rewards
    function claimReward() external override {
        _claimReward();
    }

    function amountStaked(address _stakeHolder)
        external
        view
        override
        returns (uint256)
    {
        return stakedUser[_stakeHolder].amount;
    }

    function totalDeposited() external view override returns (uint256) {
        return _totalStaked;
    }

    function rewardOf(address _stakeHolder)
        external
        view
        override
        returns (uint256)
    {
        return _calcReward(_stakeHolder);
    }

    function _claimReward() internal {
        _updateReward();
        uint256 reward = stakedUser[_msgSender()].rewardsToClaim;
        require(reward > 0, "No rewards to claim");

        stakedUser[_msgSender()].rewardsToClaim = 0;
        token.safeTransfer(_msgSender(), reward);
        emit Claim(_msgSender(), reward);
    }

    //Calculate Rewards
    function _calcReward(address _stakeHolder) internal view returns (uint256) {
        uint256 reward = ((((stakedUser[_stakeHolder].amount * fixedAPY) /
            100) * _percentageTimeRemaining(_stakeHolder)) / (_precision)) +
            stakedUser[_stakeHolder].rewardsToClaim;
        return reward;
    }

    function _percentageTimeRemaining(address _stakeHolder)
        private
        view
        returns (uint256)
    {
        uint256 timeRemaining;
        if (endTime > block.timestamp) {
            timeRemaining =
                stakingDuration -
                (block.timestamp - stakedUser[_stakeHolder].userStartTime);
            return
                (_precision * (stakingDuration - timeRemaining)) /
                stakingDuration;
        }
        timeRemaining =
            stakingDuration -
            (endTime - stakedUser[_stakeHolder].userStartTime);
        uint256 percentage = (_precision * (stakingDuration - timeRemaining)) /
            stakingDuration;
        return
            (_precision * (stakingDuration - timeRemaining)) / stakingDuration;
    }

    function _updateReward() internal {
        stakedUser[_msgSender()].rewardsToClaim = _calcReward(_msgSender());
        stakedUser[_msgSender()].userStartTime = (block.timestamp >= endTime)
            ? endTime
            : block.timestamp;
    }
}
