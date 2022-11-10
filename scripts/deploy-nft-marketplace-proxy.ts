import { ethers, upgrades } from "hardhat";

const MARKETPLACE_SETTLEMENT_TOKEN = process.env.MARKETPLACE_SETTLEMENT_TOKEN || "";
const MARKETPLACE_TRADE_FEE_PERCENT = process.env.MARKETPLACE_TRADE_FEE_PERCENT || "";

const MARKETPLACE_PROXY_UPGRADABLE_ADDRESS = process.env.MARKETPLACE_PROXY_UPGRADABLE_ADDRESS || "";

async function main() {

  const factory = await ethers.getContractFactory("ArtBlockMarket");

  if (MARKETPLACE_PROXY_UPGRADABLE_ADDRESS == "0x0000000000000000000000000000000000000000") {
    const market = await upgrades.deployProxy(factory, [
      MARKETPLACE_SETTLEMENT_TOKEN,
      MARKETPLACE_TRADE_FEE_PERCENT,
    ]);
    await market.deployed();
    console.log("marketplace deployed to:", market.address);
  } else {
    await upgrades.upgradeProxy(MARKETPLACE_PROXY_UPGRADABLE_ADDRESS, factory);
    console.log("marketplace upgraded"); 
  }

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });