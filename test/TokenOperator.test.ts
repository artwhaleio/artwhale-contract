import hre from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat'
import { BigNumber } from "ethers";
import { TokenOperatorUpgradeableMock } from "../typechain-types/contracts/mocks/TokenOperatorUpgradeableMock";

describe("RoyaltyUpgradeable", () => {

    let signers: SignerWithAddress[];
    let tokenOperator: TokenOperatorUpgradeableMock;

    beforeEach(async () => {
        signers = await ethers.getSigners();

        const TokenOperatorUpgradeableMockFactory = await ethers.getContractFactory("TokenOperatorUpgradeableMock");
        
        tokenOperator = await TokenOperatorUpgradeableMockFactory.deploy() as TokenOperatorUpgradeableMock;
        await tokenOperator.deployed();

    });

    describe("operator value", () =>  {
        it("default value", async () => {
            expect(await tokenOperator.operator()).to.equal(ethers.constants.AddressZero);
        });

        it("set another operator", async () => {
            await tokenOperator.setOperator(signers[1].address);
            expect(await tokenOperator.operator()).to.equal(signers[1].address);
        });

        it("negative cases", async () => {
            // not owner
            await expect(tokenOperator.connect(signers[1]).setOperator(signers[1].address)).to.be.revertedWith('Ownable: caller is not the owner');
        });
    });

    it('only operator modifier', async () => {
        await tokenOperator.setOperator(signers[0].address);
        await tokenOperator.onlyForOperator();
        
        await expect(tokenOperator.connect(signers[1]).onlyForOperator()).to.be.revertedWith('TokenOperatorUpgradeable: caller is not the operator');
    });
});