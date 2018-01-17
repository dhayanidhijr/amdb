import React, { Component } from 'react';
import AMNewContract from './am-new-contract.sol';
import { web3 } from '../../web3';
import _ from 'lodash';


class AMNew extends Component {

    constructor(props) {

        super(props);

        this.state = {
            amNewContract: undefined
        }

        this.compileAndDeployCarContract = this.compileAndDeployCarContract.bind(this);
    }

    
    
    componentWillMount() {

        this.readAMNewContract(AMNewContract);

        this.setupCompiler();

    }

    setupCompiler() {

        setTimeout(() => {

            console.log('BrowserSolc Our log', window.BrowserSolc);

            window.BrowserSolc.getVersions((soljsonSources, soljsonReleases) => {

                const compilerVersion = soljsonReleases[_.keys(soljsonReleases)[0]];

                console.log("Browser-solc compiler version : " + compilerVersion);

                window.BrowserSolc.loadVersion(compilerVersion, (c) => {
                    this.compiler = c;
                    this.setState({statusMessage:"ready!"}, () => {
                        console.log("Solc Version Loaded: " + compilerVersion);
                    });
                });
            });

        }, 1000);
    }

    compileAndDeployCarContract() {
        this.compileAndDeploy('Honda', 'CRV', '2015', '7500', 'asdfasdfadsfasdf');
    }

    compileAndDeploy(make, model, year, price, vin) {
        
        const optimize = 1,
            outerThis = this,
            compiler = this.compiler;

        console.log("compileAndDeploy called!");
        
        this.setState({
            statusMessage: "compiling and deploying!"
        });
    
        var result = compiler.compile(this.amNewConctract(), optimize);

        if(result.errors && JSON.stringify(result.errors).match(/error/i)) {
            
            outerThis.setState({
                statusMessage: JSON.stringify(result.errors)
            });

            return false;
        } 

        this.deployCarContract(result, make, model, year, price, vin);

        return true;
    }

    deployCarContract(result, make, model, year, price, vin) {

        const carContract = result.contracts[':Car'],
            abi = JSON.parse(carContract.interface),
            bytecode = '0x' + carContract.bytecode,
            myContract = web3.eth.contract(abi);

        console.log('carContract', carContract);              
        console.log('bytecode', JSON.stringify(bytecode));
        console.log('abi', JSON.stringify(abi));
        console.log('myContract', myContract);

        web3.eth.getGasPrice((err,gasPrice) => {                
            
            if(err) {

                console.log('deployment web3.eth.getGasPrice error ', err);

                this.setState({
                    statusMessage: 'deployment web3.eth.getGasPrice error: ' + err
                });

                return false;

            } else {
                
                console.log("current gasPrice (gas / ether): " + gasPrice);

                web3.eth.estimateGas({data: bytecode}, (err,gasEstimate) => {

                    if(err) {

                        console.log("deployment web3.eth.estimateGas error: " + err);

                        this.setState({
                            statusMessage: "deployment web3.eth.estimateGas error: " + err
                        });

                        return null;

                    } else {

                        console.log("deployment web3.eth.estimateGas amount: " + gasEstimate);
                        
                        const inflatedGasCost = Math.round(1.2 * gasEstimate),
                            ethCost = gasPrice * inflatedGasCost / 10000000000 / 100000000,
                            warnings = result.errors ? JSON.stringify(result.errors) + ',' : ''; // show warnings if they exist

                        this.setState({
                            statusMessage: warnings + "Compiled! (inflated) estimateGas amount: " + inflatedGasCost + " (" + ethCost+ " Ether)"
                        });

                        myContract.new(make, model, year, price, vin, web3.eth.accounts[0], 
                            {from:web3.eth.accounts[0],data:bytecode,gas:inflatedGasCost}, 
                            (err, newContract) => { 

                                console.log("newContract: ", newContract);

                                if(err) {

                                    console.log("deployment err: " + err);
                                    this.setState({
                                        statusMessage: "deployment error: " + err
                                    });

                                    return null;

                                } else {
                        
                                    if(!newContract.address) {

                                        console.log("Contract transaction send: TransactionHash: " + newContract.transactionHash + " waiting to be mined...");
                                        this.setState({
                                            statusMessage: "Please wait a minute.",
                                            thisTxHash: newContract.transactionHash,
                                            thisAddress: "waiting to be mined..."
                                        });

                                    } else {

                                        console.log("Contract mined! Address: " + newContract.address);
                                        console.log('newContract Mined', newContract);
                                        console.log('Car Details', newContract.carDetails());
                                        this.setState({
                                            statusMessage: "Contract Deployed to " + this.state.thisNetId,
                                            thisAddress: newContract.address
                                        });

                                        return null;
                                    }
                                }
                            }
                        );
                    }
                });
            }
        });
    }

    readAMNewContract(contractFile) {
        const rawFile = new XMLHttpRequest();
        rawFile.open('GET', contractFile, false);
        rawFile.onreadystatechange = () => {
            if(rawFile.readyState === 4) {
                if(rawFile.status === 200 || rawFile.status === 0) {
                    this.setState({
                        amNewContract: rawFile.responseText
                    });
                }
            }
        }
        rawFile.send(null);
    }

    amNewConctract() {
        return this.state.amNewContract;
    }

    compiledAMNewContract() {
        return this.state.compiledAMNewContract;
    }
    
    render() {
        return (
        <div>
            Enter Auto mobile details
            <div>
                Make : <input type = "text" />
                Model : <input type = "text" />
                IsConnected : {web3.isConnected().toString()}
                <textarea>{this.compiledAMNewContract()}</textarea>
                <input type = "button" value = "Deploy" onClick={ this.compileAndDeployCarContract } /> <br/>
                statusMessage: {this.state.statusMessage} <br/>
                thisNetId: {this.state.thisNetId} <br/>
                thisTxHash: {this.state.thisTxHash} <br/>
                thisAddress: {this.state.thisAddress} <br/>
                {/*this.amNewConctract()*/}

            </div>
        </div>
        );
    }
}

export default AMNew;
