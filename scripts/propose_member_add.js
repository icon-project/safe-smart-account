require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { SAFE_ABI, getArgument, loadProposalData, saveProposalData } = require('./utils');

async function main() {
    const privateKey = process.env.PRIVATE_KEY;

    const args = process.argv.slice(2);
    const chain = getArgument(args, "--chain", "Please provide the chain ID using --chain argument.");
    const owner = getArgument(args, "--address", "Please provide the new owner address using --address argument.");
    const newThreshold = getArgument(args, "--threshold", "Please provide the new threshold using --threshold argument.");
    const remark = getArgument(args, "--remark", "Please provide the remark using --remark argument.");

    const rpcUrl = config[chain].rpc;
    const safeAddress = config[chain].safe;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, wallet);
    console.log(`Safe Contract Address: ${await safeContract.getAddress()}`);

    const encodedData = safeContract.interface.encodeFunctionData('addOwnerWithThreshold', [owner, newThreshold]);

    const nonce = await safeContract.nonce();
    console.log(`Nonce: ${nonce}`);

    const to = safeAddress;
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
