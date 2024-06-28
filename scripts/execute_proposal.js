require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const config = require('./config.json');
const { SAFE_ABI, getArgument, loadProposalData } = require('./utils');

async function executeProposalTransaction(wallet, safeAddress, proposal) {
    const safeContract = new ethers.Contract(safeAddress, SAFE_ABI, wallet);

    const encodedSignatures = ethers.concat(proposal.signatures);

    const tx = await safeContract.executeTransaction(
        proposal.to,
        proposal.value,
        proposal.data,
        proposal.operation,
        proposal.safeTxGas,
        proposal.baseGas,
        proposal.gasPrice,
        proposal.gasToken,
        proposal.refundReceiver,
        encodedSignatures,
        proposal.remark
    );

    await tx.wait();

    console.log(`Transaction executed with hash ${proposal.proposal}.`);
}

async function main() {
    const args = process.argv.slice(2);

    const hashToExecute = getArgument(args, "--proposal-hash", "Please provide the hash to approve using --proposal-hash argument.");
    const privateKey = getArgument(args, "--private-key", "Please provide the private key using --private-key argument.");
    const chain = getArgument(args, "--chain", "Please provide the chain ID using --chain argument.");

    const rpcUrl = config[chain].rpc;
    const safeAddress = process.env.SAFE_ADDRESS;
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const filePath = path.join(__dirname, 'proposal_data.json');
    const proposals = loadProposalData(filePath);

    const proposal = proposals.find(p => p.proposal === hashToExecute);
    if (!proposal) {
        console.error(`Proposal with hash ${hashToExecute} not found.`);
        process.exit(1);
    }

    await executeProposalTransaction(wallet, safeAddress, proposal);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
