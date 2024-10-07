const { ethers, hre, deployments, network } = require("hardhat");
const config = require("./config.json");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = network.name;
  console.log("Deploying to network:", networkName);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Safe contract
  let safeSingleton = await deploySafe(deployer);
  console.log("Safe deployed to:", await safeSingleton.getAddress());

  // Deploy SafeProxyFactory contract
  let factory = await deployFactory(deployer);
  console.log("SafeProxyFactory deployed to:", await factory.getAddress());

  // Create Safe proxy using the factory
  let safeProxy = await createSafeProxy(factory, safeSingleton);
  console.log("Safe Proxy deployed to:", await safeProxy.getAddress());

  await saveDeploymentAddress(networkName, await safeProxy.getAddress());
  
}

const deploySafe = async (deployer) => {
  const SafeDeployment = await deployments.deploy("Safe", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });
  return await ethers.getContractAt("Safe", SafeDeployment.address);
};

const deployFactory = async (deployer) => {
  const FactoryDeployment = await deployments.deploy("SafeProxyFactory", {
    from: deployer.address,
    args: [],
    log: true,
    deterministicDeployment: true,
  });
  return await ethers.getContractAt("SafeProxyFactory", FactoryDeployment.address);
};

const getRandomInt = (min = 0, max = Number.MAX_SAFE_INTEGER) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomIntAsString = (min = 0, max = Number.MAX_SAFE_INTEGER) => {
  return getRandomInt(min, max).toString();
};

const saveDeploymentAddress = async (networkName, safeAddress) => {
  filePath = path.join(__dirname, 'config.json');

  if (!config[networkName]) {
    config[networkName] = {};
  }

  config[networkName].safe = safeAddress;

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  console.log(`Saved Safe address ${safeAddress} to network ${networkName} in config.json`);
};

const createSafeProxy = async (factory, singleton, saltNumber = 2) => {
  const singletonAddress = await singleton.getAddress();
  const proxyAddress = await factory.createProxyWithNonce.staticCall(singletonAddress, "0x", saltNumber);
  await factory.createProxyWithNonce(singletonAddress, "0x", saltNumber).then((tx) => tx.wait());
  const Safe = await ethers.getContractFactory("Safe");
  return Safe.attach(proxyAddress);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
