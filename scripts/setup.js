const { ethers } = require("ethers");
require('dotenv').config();
const configs = require('./config.json');
const {SAFE_ABI} = require('./utils');


async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  const [chain, membersArg, threshold] = args;
  if (!chain || !membersArg || !threshold) {
    process.exit(1);
  }
  const members = membersArg.split(',');
  const rpc = configs[chain].rpc
  const safeAddress = configs[chain].safe
  const provider = new ethers.JsonRpcProvider(rpc);
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const Safe = new ethers.Contract(
    safeAddress,
    SAFE_ABI,
    deployer
  );

  try {
    await Safe.setup(
      members,
      parseInt(threshold, 10),
      ethers.ZeroAddress,
      "0x",
      ethers.ZeroAddress,
      ethers.ZeroAddress,
      0,
      ethers.ZeroAddress
    );
    console.log("Safe setup completed with members:", members, "threshold:", threshold, "on chain", chain);
  } catch (error) {
    console.log("Safe setup failed with error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
