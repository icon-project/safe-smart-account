require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { SAFE_ABI, getArgument, loadProposalData, saveProposalData } = require('./utils');
const config = require('./config.json');

async function main() {
    const privateKey = process.env.PRIVATE_KEY;
    const args = process.argv.slice(2);

    const chain = getArgument(args, "--chain", "Please provide the chain ID using --chain argument.");
    const contract = getArgument(args, "--contract", "Please provide the contract name using --contract argument.");
    const remark = getArgument(args, "--remark", "Please provide the remark using --remark argument.");
    const implementationAddress = getArgument(args, "--new-impl", "Please provide the new implementation address using --new-impl argument.");

    const rpcUrl = config[chain].rpc;
    const safeAddress = config[chain].safe;
    const proxyAdminAddress = config[chain][`${contract}_proxy_admin`];
    const proxyAddress = config[chain][`${contract}_proxy_address`];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, wallet);

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
    const gasToken = ethers.ZeroAddress;
    const refundReceiver = ethers.ZeroAddress;

    const txHash = await safeContract.getTransactionHash(
        to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce
    );

    console.log(`Transaction Hash: ${txHash}`);

    const proposalData = {
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

    const filePath = path.join(__dirname, 'proposal_data.json');
    const proposals = loadProposalData(filePath);

    if (!proposals.some(proposal => proposal.proposal === proposalData.proposal)) {
        proposals.push(proposalData);
        saveProposalData(filePath, proposals);
        console.log('Proposal data saved to proposal_data.json');
    } else {
        console.log('Proposal hash already exists. No new proposal added.');
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
