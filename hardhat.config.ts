import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";
import "hardhat-deploy";
import dotenv from "dotenv";
import yargs from "yargs";
import { getSingletonFactoryInfo } from "@safe-global/safe-singleton-factory";

const argv = yargs
    .option("network", {
        type: "string",
        default: "hardhat",
    })
    .help(false)
    .version(false)
    .parseSync();

// Load environment variables.
dotenv.config();
const { NODE_URL, INFURA_KEY, MNEMONIC,
    BSCSCAN_API_KEY,
    ETHERSCAN_API_KEY,
    BASESCAN_API_KEY,
    OPTIMISMSCAN_API_KEY,
    ARBITRUMSCAN_API_KEY,
    SNOWSCAN_API_KEY,
    POLYSCAN_API_KEY,
    BSCTEST_RPC_URL,
    SEPOLIA_RPC_URL,
    FUJI_RPC_URL,
    OPTIMISM_SEPOLIA_RPC_URL,
    ARBITRUM_SEPOLIA_RPC_URL,
    BASE_SEPOLIA_RPC_URL,


    BINANCE_RPC_URL,
    ETHEREUM_RPC_URL,
    BASE_RPC_URL,
    OPTIMISM_RPC_URL,
    ARBITRUM_RPC_URL,
    AVALANCHE_RPC_URL,
    POLYGON_RPC_URL,

    PRIVATE_KEY, SOLIDITY_VERSION, SOLIDITY_SETTINGS } = process.env;

const DEFAULT_MNEMONIC = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (PRIVATE_KEY) {
    sharedNetworkConfig.accounts = [PRIVATE_KEY];
} else {
    sharedNetworkConfig.accounts = {
        mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
    };
}

if (["mainnet", "rinkeby", "kovan", "goerli", "ropsten", "mumbai", "polygon"].includes(argv.network) && INFURA_KEY === undefined) {
    throw new Error(`Could not find Infura key in env, unable to connect to network ${argv.network}`);
}

import "./src/tasks/local_verify";
import "./src/tasks/deploy_contracts";
import "./src/tasks/show_codesize";
import { BigNumber } from "@ethersproject/bignumber";
import { DeterministicDeploymentInfo } from "hardhat-deploy/dist/types";

const defaultSolidityVersion = "0.7.6";
const primarySolidityVersion = SOLIDITY_VERSION || defaultSolidityVersion;
const soliditySettings = SOLIDITY_SETTINGS ? JSON.parse(SOLIDITY_SETTINGS) : undefined;

const deterministicDeployment = (network: string): DeterministicDeploymentInfo => {
    const info = getSingletonFactoryInfo(parseInt(network));
    if (!info) {
        throw new Error(`
        Safe factory not found for network ${network}. You can request a new deployment at https://github.com/safe-global/safe-singleton-factory.
        For more information, see https://github.com/safe-global/safe-smart-account#replay-protection-eip-155
      `);
    }
    return {
        factory: info.address,
        deployer: info.signerAddress,
        funding: BigNumber.from(info.gasLimit).mul(BigNumber.from(info.gasPrice)).toString(),
        signedTx: info.transaction,
    };
};

const userConfig: HardhatUserConfig = {
    paths: {
        artifacts: "build/artifacts",
        cache: "build/cache",
        deploy: "src/deploy",
        sources: "contracts",
    },
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },
    solidity: {
        compilers: [{ version: primarySolidityVersion, settings: soliditySettings }, { version: defaultSolidityVersion }],
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
            blockGasLimit: 100000000,
            gas: 100000000,
        },
        ethereum: {
            ...sharedNetworkConfig,
            url: ETHEREUM_RPC_URL,
        },
        avalanche: {
            ...sharedNetworkConfig,
            url: AVALANCHE_RPC_URL,
        },
        optimism: {
            ...sharedNetworkConfig,
            url: OPTIMISM_RPC_URL,
        },
        arbitrum: {
            ...sharedNetworkConfig,
            url: ARBITRUM_RPC_URL,
        },
        binance: {
            ...sharedNetworkConfig,
            url: BINANCE_RPC_URL,
        },
        base: {
            ...sharedNetworkConfig,
            url: BASE_RPC_URL,
        },
        polygon: {
            ...sharedNetworkConfig,
            url: POLYGON_RPC_URL,
        },
        fuji: {
            ...sharedNetworkConfig,
            url: "https://api.avax-test.network/ext/bc/C/rpc",
        },
        sepolia: {
            ...sharedNetworkConfig,
            url: "https://eth-sepolia.g.alchemy.com/v2/JxPqX6PhmfdYfoQ1avgoBFwCxNUCKzu2",
        },
        binance_testnet: {
            ...sharedNetworkConfig,
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
        },
        optimism_sepolia: {
            ...sharedNetworkConfig,
            url: "https://sepolia.optimism.io",
        },
        arbitrum_sepolia: {
            ...sharedNetworkConfig,
            url: "https://sepolia-rollup.arbitrum.io/rpc",
        },
        base_sepolia: {
            ...sharedNetworkConfig,
            url: "https://sepolia.base.org",
        },
        polygon_testnet: {
            ...sharedNetworkConfig,
            url: "https://matic-mumbai.chainstacklabs.com",
        }
    },
    deterministicDeployment,
    namedAccounts: {
        deployer: 0,
    },
    mocha: {
        timeout: 2000000,
    },
    etherscan: {
        apiKey: {
            ethereum: ETHERSCAN_API_KEY || "",
            polygon: POLYSCAN_API_KEY || "",
            binance: BSCSCAN_API_KEY || "",
            arbitrum: ARBITRUMSCAN_API_KEY || "",
            optimism: OPTIMISMSCAN_API_KEY || "",
            avalanche: SNOWSCAN_API_KEY || "",
            base: BASESCAN_API_KEY || "",

            arbitrum_sepolia: ARBITRUMSCAN_API_KEY || "",
            fuji: SNOWSCAN_API_KEY || "",
            sepolia: ETHERSCAN_API_KEY || "",
            base_sepolia: BASESCAN_API_KEY || "",
            optimism_sepolia: OPTIMISMSCAN_API_KEY || "",
            binance_testnet: BSCSCAN_API_KEY || "",
            polygon_testnet: POLYSCAN_API_KEY || "",
        },
    },
};
if (NODE_URL) {
    userConfig.networks!.custom = {
        ...sharedNetworkConfig,
        url: NODE_URL,
    };
}
export default userConfig;
