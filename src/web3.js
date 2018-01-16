import Web3 from 'web3';

let web3Injected = window.web3;

let web3Connection;

if(typeof web3Injected !== 'undefined'){
    console.log("saw injected web3!");
    web3Connection = new Web3(web3Injected.currentProvider);
} else {
    console.log("did not see web3 injected!");
    web3Connection = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

export const web3 = web3Connection;


