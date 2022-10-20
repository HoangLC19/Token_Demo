import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers"
import {expect} from "chai"
import {ethers, network} from "hardhat"
import {StakingToken20, Token20} from "../typechain-types"
import {BigNumber} from "ethers"

const calcReward = (
    amount: BigNumber,
    APY: BigNumber,
    timeRemaining: BigNumber,
    rewardToClaim: BigNumber
): BigNumber => {
    let reward: BigNumber
    reward = amount
        .mul(APY)
        .div(BigNumber.from(100))
        .mul(timeRemaining)
        .div(BigNumber.from(10 ** 6))
        .add(rewardToClaim)
    return reward
}

const timeRemaining = (
    timestamp: BigNumber,
    start: BigNumber,
    end: BigNumber,
    duration: BigNumber
): BigNumber => {
    
    let timeRemaining: BigNumber
    if (end > timestamp) {
        timeRemaining = duration.sub(timestamp.sub(start))
        return duration
            .sub(timeRemaining)
            .mul(BigNumber.from(10 ** 6))
            .div(duration)
    }
    timeRemaining = duration.sub(end.sub(start))
    return duration
        .sub(timeRemaining)
        .mul(BigNumber.from(10 ** 6))
        .div(duration)
}

const increaseTime = async (seconds: number) => {
    await network.provider.send("evm_increaseTime", [seconds])
    await network.provider.send("evm_mine", [])
}

describe("StakingToken20", () => {
    let admin: SignerWithAddress
    let user: SignerWithAddress
    let stakingToken20: StakingToken20
    let token20: Token20

    beforeEach(async () => {
        ;[admin, user] = await ethers.getSigners()
        const Token20 = await ethers.getContractFactory("Token20", admin)
        token20 = await Token20.deploy()
        await token20.deployed()
    })

    it("mint token for user", async () => {
        //admin mint some token20 for user
        await token20
            .connect(admin)
            .mint(user.address, ethers.utils.parseEther("1"))
        const userBalance = await token20.balanceOf(user.address)
        // console.log("user balance: ", userBalance.toString());
        expect(userBalance).to.equal(ethers.utils.parseEther("1"))
    })

    it("only admin can mint token", async () => {
        await expect(
            token20
                .connect(user)
                .mint(user.address, ethers.utils.parseEther("1"))
        ).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it("allow user to stake token when staking start", async () => {
        const StakingToken20 = await ethers.getContractFactory(
            "StakingToken20",
            admin
        )
        stakingToken20 = await StakingToken20.deploy(
            token20.address,
            5,
            5,
            ethers.utils.parseEther("1000000")
        )
        await stakingToken20.deployed()
        await stakingToken20.connect(admin).startStaking()
        await token20
            .connect(admin)
            .mint(user.address, ethers.utils.parseEther("1"))
        await token20
            .connect(user)
            .approve(stakingToken20.address, ethers.utils.parseEther("1"))
        await stakingToken20.connect(user).deposit(ethers.utils.parseEther("1"))
        const postStakeBalance = await token20.balanceOf(user.address)
        expect(postStakeBalance).to.equal(ethers.utils.parseEther("0"))
    })

    it("emit event when staking successfully", async () => {
        const StakingToken20 = await ethers.getContractFactory(
            "StakingToken20",
            admin
        )
        stakingToken20 = await StakingToken20.deploy(
            token20.address,
            5,
            5,
            ethers.utils.parseEther("1000000")
        )
        await stakingToken20.deployed()
        await stakingToken20.connect(admin).startStaking()
        await token20
            .connect(admin)
            .mint(user.address, ethers.utils.parseEther("1"))
        await token20
            .connect(user)
            .approve(stakingToken20.address, ethers.utils.parseEther("1"))

        expect(
            await stakingToken20
                .connect(user)
                .deposit(ethers.utils.parseEther("1"))
        )
            .to.emit("StakingToken20", "Staked")
            .withArgs(user.address, ethers.utils.parseEther("1"))
    })

    it("allow user to claim reward", async () => {
        const StakingToken20 = await ethers.getContractFactory(
            "StakingToken20",
            admin
        )
        stakingToken20 = await StakingToken20.deploy(
            token20.address,
            5,
            5,
            ethers.utils.parseEther("1000000")
        )
        await stakingToken20.deployed()
        await token20
            .connect(admin)
            .mint(stakingToken20.address, ethers.utils.parseEther("100000"))
        await stakingToken20.connect(admin).startStaking()
        await token20
            .connect(admin)
            .mint(user.address, ethers.utils.parseEther("1"))
        await token20
            .connect(user)
            .approve(stakingToken20.address, ethers.utils.parseEther("1"))
        await stakingToken20.connect(user).deposit(ethers.utils.parseEther("1"))
        await network.provider.send("evm_increaseTime", [60 * 3])
        await stakingToken20.connect(user).claimReward()
        const postClaimBalance = await token20.balanceOf(user.address)
        console.log("postClaimBalance: ", postClaimBalance.toString())
    })

    it("allow user to withdraw after 1 hours staking started", async () => {
        const StakingToken20 = await ethers.getContractFactory(
            "StakingToken20",
            admin
        )
        stakingToken20 = await StakingToken20.deploy(
            token20.address,
            5,
            5,
            ethers.utils.parseEther("1000000")
        )
        await stakingToken20.deployed()
        await token20
            .connect(admin)
            .mint(stakingToken20.address, ethers.utils.parseEther("1000000"))
        await stakingToken20.connect(admin).startStaking()
        await token20
            .connect(admin)
            .mint(user.address, ethers.utils.parseEther("1"))
        await token20
            .connect(user)
            .approve(stakingToken20.address, ethers.utils.parseEther("1"))
        await stakingToken20.connect(user).deposit(ethers.utils.parseEther("1"))
        await network.provider.send("evm_increaseTime", [60 * 60])
        await stakingToken20.connect(user).withdraw()
        const postWithdrawBalance = await token20.balanceOf(user.address)
        // console.log("postWithdrawBalance: ", postWithdrawBalance.toString())
    })

    it("revert when withdraw before locktime end", async () => {
        const StakingToken20 = await ethers.getContractFactory(
            "StakingToken20",
            admin
        )
        stakingToken20 = await StakingToken20.deploy(
            token20.address,
            5,
            5,
            ethers.utils.parseEther("1000000")
        )
        await stakingToken20.deployed()
        await token20
            .connect(admin)
            .mint(stakingToken20.address, ethers.utils.parseEther("1000000"))
        await stakingToken20.connect(admin).startStaking()
        await token20
            .connect(admin)
            .mint(user.address, ethers.utils.parseEther("1"))
        await token20
            .connect(user)
            .approve(stakingToken20.address, ethers.utils.parseEther("1"))
        await stakingToken20.connect(user).deposit(ethers.utils.parseEther("1"))
        await network.provider.send("evm_increaseTime", [60 * 15])
        await expect(
            stakingToken20.connect(user).withdraw()
        ).to.be.revertedWith("Lockup period not over")
    })

    describe("check the reward", () => {
        beforeEach(async () => {
            ;[admin, user] = await ethers.getSigners()
            const Token20 = await ethers.getContractFactory("Token20", admin)
            token20 = await Token20.deploy()
            await token20.deployed()

            const StakingToken20 = await ethers.getContractFactory(
                "StakingToken20",
                admin
            )
            stakingToken20 = await StakingToken20.deploy(
                token20.address,
                15,
                10,
                ethers.utils.parseEther("1000000")
            )
            await stakingToken20.deployed()
            await token20
                .connect(admin)
                .mint(
                    stakingToken20.address,
                    ethers.utils.parseEther("1000000")
                )

            await token20
                .connect(admin)
                .mint(user.address, ethers.utils.parseEther("1"))
        })

        it.only("check the APY", async () => {
            await stakingToken20.connect(admin).startStaking()
            await token20
                .connect(user)
                .approve(stakingToken20.address, ethers.utils.parseEther("1"))
            await stakingToken20
                .connect(user)
                .deposit(ethers.utils.parseEther("1"))
            await increaseTime(60 * 5)
            const rewardNow = await stakingToken20.rewardOf(user.address)
            const userStake = await stakingToken20.stakeInfoOf(user.address)
            const blockNumber = await ethers.provider.getBlockNumber()
            const timestamp = (await ethers.provider.getBlock(blockNumber))
                .timestamp
            
            const end = await stakingToken20.endTime()
            const duration = await stakingToken20.stakingDuration()
            const timeRemain = timeRemaining(
                BigNumber.from(timestamp),
                userStake.userStartTime,
                end,
                duration
            )
            const rewardEstimate = calcReward(
                ethers.utils.parseEther("1"),
                BigNumber.from(15),
                timeRemain,
                userStake.rewardsToClaim
            )
            console.log("time remain: ", timeRemain.toString())
            await stakingToken20.connect(user).claimReward()
            // const balance = await token20.balanceOf(user.address)
            // console.log("balance: ", balance.toString())
            expect(rewardEstimate).to.equal(rewardNow)
        })
    })
})
