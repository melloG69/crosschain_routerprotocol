
const hre = require("hardhat")
const { ethers } = require('ethers');
const { chainConfig } = require('../utils/config.js');


const deployXERC20 = async (userPvtKey, networks, environment, adminAddress = null) => {
    let deployedAddress = {}
    try {
        // for every network
        for (var i = 0; i < networks.length; i++) {

            // initializing a few parameters using our chainConfig
            let chainId = networks[i]
            let chainDetails = chainConfig[chainId]
            let network = chainDetails.network

            // settting the provider for the network and fetching the gatewayContract and feePayerAddress
            const provider = new ethers.providers.JsonRpcProvider(chainDetails.rpc, chainId)
            const gatewayContract = chainDetails[environment].gatewayContract;
            const feePayerAddress = chainDetails[environment].feePayerAddress;

            // setting the user's wallet via which the contract will be deployed
            const wallet = new ethers.Wallet(userPvtKey, provider)
            console.log('>> Wallet setup for chain',chainId ,'done');

            // creating the dApp instance
            let dAppInstance = await hre.ethers.getContractFactory('XERC20', wallet);
            console.log('>> Deploying XERC20 on chain', chainId);

            // deploying the dApp instantiated in the previous step

            let dApp = await dAppInstance.deploy(
                gatewayContract,
                feePayerAddress
            );

            console.log("Transaction hash for deploying the contract - ", dApp.deployTransaction.hash);

            // waiting for the dApp to be deployed
            await dApp.deployed();

            // waiting for a few network confirmations to allow the block explorer to index the transaction
            await dApp.deployTransaction.wait(5);
            console.log("Deployed contract address - ", dApp.address);

            // setting the hre network to our current network
            hre.changeNetwork(network);

            // verifying the contract
            try {
                await hre.run("verify:verify", {
                    address: dApp.address,
                    constructorArguments: [gatewayContract, feePayerAddress]
                });
            }
            catch (e) {
                console.log('Error occurred while verifying the contract', e)
            }

            // adding the contract address to our object
            deployedAddresses[chainId] = dApp.address
        }
    }
    catch (e) {
        console.log('Transaction failed with error', e)
        internalStatus = 400
    }
    return deployedAddress
}
