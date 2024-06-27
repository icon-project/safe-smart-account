require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { SAFE_ABI, getArgument, loadProposalData, updateProposalData } = require('./utils');
const config = require('./config.json');

async function main() {
    const args = process.argv.slice(2);
    const privateKey = process.env.PRIVATE_KEY;

    const chain = getArgument(args, "--chain", "Please provide the chain ID using --chain argument.");
    const ownerToDelete = getArgument(args, "--address", "Please provide the new owner address using --newOwner argument.");
    const newThreshold = getArgument(args, "--threshold", "Please provide the new threshold using --newThreshold argument.");
    const remark = getArgument(args, "--remark", "Please provide the new owner address using --remark argument.");

    const rpcUrl = config[chain].rpc;
    const safeAddress = config[chain].safe;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, wallet);

    const owners = await safeContract.getOwners();
    const prevOwnerIndex = owners.indexOf(ownerToDelete) - 1;
    const prevOwner = prevOwnerIndex < 0 ? SENITAL_OWNERS : owners[prevOwnerIndex];

    const encodedData = safeContract.interface.encodeFunctionData('removeOwner', [prevOwner, ownerToDelete, newThreshold]);

    const nonce = await safeContract.nonce();
    const txHash = await safeContract.getTransactionHash(
        safeAddress, 0, encodedData, 0, 0, 0, 0, ethers.ZeroAddress, ethers.ZeroAddress, nonce
    );

    const proposalData = {
        proposal: txHash,
        to: safeAddress,
        value: 0,
        data: encodedData,
        operation: 0,
        safeTxGas: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: ethers.ZeroAddress,
        refundReceiver: ethers.ZeroAddress,
        nonce,
        chain,
        remark
    };

    const filePath = path.join(__dirname, 'proposal_data.json');
    const proposals = loadProposalData(filePath);

    if (!proposals.some(proposal => proposal.proposal === txHash)) {
        proposals.push(proposalData);
        updateProposalData(filePath, proposals);
        console.log('Proposal data saved to proposal_data.json');
    } else {
        console.log('Proposal hash already exists. No new proposal added.');
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
