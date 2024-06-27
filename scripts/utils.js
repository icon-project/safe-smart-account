
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const SAFE_ABI = [
    'function getTransactionHash(address to, uint256 value, bytes memory data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, uint256 _nonce) public view returns (bytes32)',
    'function nonce() view returns (uint256)',
    'function addOwnerWithThreshold(address owner, uint256 _threshold) public override',
    'function removeOwner(address prevOwner, address owner, uint256 _threshold) public override',
    'function getOwners() public view override returns (address[] memory)',
    'function approveHash(bytes32 hash) public',
    'function executeTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, bytes memory signatures, string memory remark) public returns (bool success)',
    'function changeThreshold(uint256 _threshold) public override',
    'function swapOwner(address prevOwner, address oldOwner, address newOwner) public override',
    'function getOwners() public view override returns (address[] memory)',
    'function getThreshold() public view override returns (uint256)',
    'function setup(address[] calldata _owners,uint256 _threshold,address to,bytes calldata data,address fallbackHandler,address paymentToken,uint256 payment,address payable paymentReceiver) public'
];

const SENITAL_OWNERS = '0x0000000000000000000000000000000000000001';

function getArgument(args, argName, errorMessage) {
    const argIndex = args.indexOf(argName);
    if (argIndex === -1 || argIndex + 1 >= args.length) {
        console.error(errorMessage);
        process.exit(1);
    }
    return args[argIndex + 1];
}

function updateProposalData(filePath, proposals) {
    fs.writeFileSync(filePath, JSON.stringify(proposals, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
}

function loadProposalData(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const existingData = fs.readFileSync(filePath);
    try {
        return JSON.parse(existingData);
    } catch (error) {
        return [];
    }
}

function saveProposalData(filePath, proposals) {
    
    fs.writeFileSync(filePath, JSON.stringify(proposals, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));
}

async function createProposal(safeContract, proxyAdminAddress, proxyAddress, implementationAddress, remark, chain, contract) {
    const proxyAdminInterface = new ethers.Interface([
        "function upgradeAndCall(address proxy, address implementation, bytes data)"
    ]);

    const encodedData = proxyAdminInterface.encodeFunctionData('upgradeAndCall', [proxyAddress, implementationAddress, "0x"]);

    const nonce = await safeContract.nonce();
    console.log(`Nonce: ${nonce}`);

    const to = proxyAdminAddress;
    const value = 0;
    const data = encodedData;
    const operation = 0;
    const safeTxGas = 0;
    const baseGas = 0;
    const gasPrice = 0;
    const gasToken = ethers.constants.AddressZero;
    const refundReceiver = ethers.constants.AddressZero;

    const txHash = await safeContract.getTransactionHash(
        to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce
    );

    console.log(`Transaction Hash: ${txHash}`);

    return {
        proposal: txHash,
        to,
        value,
        data,
        operation,
        safeTxGas,
        baseGas,
        gasPrice,
        gasToken,
        refundReceiver,
        nonce,
        chain,
        contract,
        remark
    };
}

function generateSignature(wallet, hashToApprove) {
    const approverAddress = wallet.address;
    const r = ethers.zeroPadValue(approverAddress, 32);
    const s = ethers.zeroPadValue(ethers.toBeHex(65), 32);
    const v = 1;
    return ethers.concat([r, s, ethers.toBeHex(v)]);
}

module.exports = {
    SAFE_ABI,
    SENITAL_OWNERS,
    getArgument,
    loadProposalData,
    saveProposalData,
    updateProposalData,
    generateSignature
};
