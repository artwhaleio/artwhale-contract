import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { tryVerify } from "../helpers/tryVerify";

const MARKETPLACE_SETTLEMENT_TOKEN = process.env.MARKETPLACE_SETTLEMENT_TOKEN || "";
const MARKETPLACE_TRADE_FEE_PERCENT = process.env.MARKETPLACE_TRADE_FEE_PERCENT || "";

const MARKETPLACE_PROXY_UPGRADABLE_ADDRESS = process.env.MARKETPLACE_PROXY_UPGRADABLE_ADDRESS || "";

async function main() {

  const factory = await ethers.getContractFactory("ArtWhaleMarketplace");

  let market: Contract;

  if (MARKETPLACE_PROXY_UPGRADABLE_ADDRESS == "0x0000000000000000000000000000000000000000") {
    market = await upgrades.deployProxy(factory, [
      MARKETPLACE_SETTLEMENT_TOKEN,
      MARKETPLACE_TRADE_FEE_PERCENT,
    ]);
    await market.deployed();
    console.log("marketplace deployed to:", market.address);
  } else {
    market = await upgrades.upgradeProxy(MARKETPLACE_PROXY_UPGRADABLE_ADDRESS, factory);
    console.log("marketplace upgraded", MARKETPLACE_PROXY_UPGRADABLE_ADDRESS); 
  }

  await new Promise(r => setTimeout(r, 10000));
  
  await tryVerify(market.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });