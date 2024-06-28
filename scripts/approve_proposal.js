require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');
const { SAFE_ABI, getArgument, loadProposalData, updateProposalData,generateSignature } = require('./utils');

async function approveHash(safeContract, hashToApprove) {
    const tx = await safeContract.approveHash(hashToApprove);
    await tx.wait();
}

async function main() {
    const args = process.argv.slice(2);

    const chain = getArgument(args, "--chain", "Please provide the chain ID using --chain argument.");
    const hashToApprove = getArgument(args, "--proposal-hash", "Please provide the hash to approve using --proposal-hash argument.");
    const privateKey = getArgument(args, "--private-key", "Please provide the private key using --private-key argument.");

    const rpcUrl = config[chain].rpc;
    const safeAddress = config[chain].safe;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, wallet);

    console.log(wallet.address);

    await approveHash(safeContract, hashToApprove);

    console.log('Signature added to the proposal in proposal_data.json');

    const signature = generateSignature(wallet, hashToApprove);

    console.log(`Hash ${hashToApprove} approved.`);
    console.log(`Signature: ${signature}`);

    const filePath = path.join(__dirname, 'proposal_data.json');
    const proposals = loadProposalData(filePath);

    const proposal = proposals.find(p => p.proposal === hashToApprove);
    if (!proposal) {
        console.error(`Proposal with hash ${hashToApprove} not found.`);
        process.exit(1);
    }

    if (!proposal.signatures) {
        proposal.signatures = [];
    }
    proposal.signatures.push(signature);

    updateProposalData(filePath, proposals);

    console.log('Signature added to the proposal in proposal_data.json');
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
