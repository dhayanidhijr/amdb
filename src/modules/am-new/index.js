import React, { Component } from 'react';
import AMNewContract from './am-new-contract.sol';
import { web3 } from '../../web3';
import _ from 'lodash';


class AMNew extends Component {

    constructor(props) {

        super(props);

        this.state = {
            readyToCompileAndCreateContract: false,
            amNewContract: undefined,
            statusMessage: 'Connecting to block chain plese wait...',
            thisTxHash: undefined,
            thisAddress: undefined,
            make: 'Honda',
            model: 'CRV',
            year: '2010',
            price: '7500',
            vin: 'some vin number'
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

                console.log('Browser-solc compiler version',compilerVersion);

                window.BrowserSolc.loadVersion(compilerVersion, (c) => {
                    this.compiler = c;
                    this.setState({
                        statusMessage: 'Ready to create compile and deploy car contracts',
                        readyToCompileAndCreateContract: true
                    }, () => {
                        console.log('Solc Version Loaded', compilerVersion);
                    });
                });
            });

        }, 1000);
    }

    compileAndDeployCarContract() {
        
        const optimize = 1,
            compiler = this.compiler,
            { make, model, year, price, vin } = this.state;

        console.log('Compile And Deploy started');
        
        this.setState({
            statusMessage: 'Compiling and deploying car contract'
        });
    
        var result = compiler.compile(this.amNewConctract(), optimize);

        if(result.errors && JSON.stringify(result.errors).match(/error/i)) {
            
            this.setState({
                statusMessage: JSON.stringify(result.errors)
            });

            return false;
        } 

        this.getGasPriceAndEstimate(result, (err, gasPrice, gasEstimate) => {
            this.deployCarContract(result, gasPrice, gasEstimate, make, model, year, price, vin);
        });

        return true;
    }

    getGasPriceAndEstimate(result, callBackGasPriceAndEstimate) {

        const bytecode = '0x' + result.contracts[':Car'].bytecode;

        web3.eth.getGasPrice((err, gasPrice) => {                
        
            if(err) {

                console.log('deployment web3.eth.getGasPrice error', err);

                this.setState({
                    statusMessage: 'deployment web3.eth.getGasPrice error: ' + err
                });

                callBackGasPriceAndEstimate(err, 0, 0);

            } else {
                
                console.log('current gasPrice (gas / ether)', gasPrice);

                web3.eth.estimateGas({data: bytecode}, (err, gasEstimate) => {

                    if(err) {

                        console.log('deployment web3.eth.estimateGas error', err);

                        this.setState({
                            statusMessage: 'deployment web3.eth.estimateGas error: ' + err
                        });

                        callBackGasPriceAndEstimate(err, 0, 0);

                    } else {

                        console.log('deployment web3.eth.estimateGas amount', gasEstimate);
                        callBackGasPriceAndEstimate(err, gasPrice, gasEstimate);

                    }                    
                });
            }
        });        
    }

    deployCarContract(result, gasPrice, gasEstimate, make, model, year, price, vin) {

        const carContract = result.contracts[':Car'],
            abi = JSON.parse(carContract.interface),
            bytecode = '0x' + carContract.bytecode,
            myContract = web3.eth.contract(abi);

        console.log('carContract', carContract);              
        console.log('bytecode', JSON.stringify(bytecode));
        console.log('abi', JSON.stringify(abi));
        console.log('myContract', myContract);
                        
        const inflatedGasCost = Math.round(1.2 * gasEstimate),
            ethCost = gasPrice * inflatedGasCost / 10000000000 / 100000000,
            warnings = result.errors ? JSON.stringify(result.errors) + ',' : ''; // show warnings if they exist

        this.setState({
            statusMessage: warnings + 'Compiled! (inflated) estimateGas amount: ' + inflatedGasCost + ' (' + ethCost+ ' Ether)'
        });

        myContract.new(make, model, year, price, vin, web3.eth.accounts[0], 
            {from:web3.eth.accounts[0],data:bytecode,gas:inflatedGasCost}, 
            (err, newContract) => { 

                console.log('newContract', newContract);

                if(err) {

                    console.log('deployment err', err);
                    this.setState({
                        statusMessage: 'deployment error: ' + err
                    });

                    return null;

                } else {
        
                    if(!newContract.address) {

                        console.log('Contract transaction send: TransactionHash waiting for mining', newContract.transactionHash);

                        this.setState({
                            statusMessage: 'Contract transaction send and waiting for mining...',
                            thisTxHash: newContract.transactionHash,
                            thisAddress: 'waiting to be mined for contract address...'
                        });

                    } else {

                        console.log('Contract mined! Address', newContract.address);
                        console.log('newContract Mined', newContract);
                        console.log('Car Details', newContract.carDetails());
                        this.setState({
                            statusMessage: 'Contract Deployed ' + newContract.carDetails(),
                            thisAddress: newContract.address
                        });

                        return null;
                    }
                }
            }
        );
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

    onCarDataChange(field, { target }) {
        const { value } = target,
            { make, model, year, price, vin } = { ...this.state },
            updateState = {make, model, year, price, vin};

        updateState[field] = value;

        updateState.year = (parseInt(updateState.year, 10) || 0).toString();
        updateState.price = parseInt(updateState.price, 10) || 0;

        this.setState(updateState);       
    }
    
    render() {

        const { 
            readyToCompileAndCreateContract,
            statusMessage,
            thisTxHash,
            thisAddress,
            make, model, year, price, vin
        } = this.state;

        return (
        <div>
            <div>                
                <p>{statusMessage}</p> <br/>
            </div>
            {(readyToCompileAndCreateContract && web3.isConnected()) && <div>

                <h3>Enter Auto mobile details</h3> <br /><br />

                <div>

                    Make: <input type = "text" value = { make } onChange = { this.onCarDataChange.bind(this, 'make') } /> <br /><br />
                    
                    Model: <input type = "text" value = { model } onChange = { this.onCarDataChange.bind(this, 'model') } /> <br /><br /> 

                    Year: <input type = "text" value = { year } onChange = { this.onCarDataChange.bind(this, 'year') } /> <br /><br /> 

                    Price: <input type = "text" value = { price } onChange = { this.onCarDataChange.bind(this, 'price') } /> <br /><br /> 

                    Vin: <input type = "text" value = { vin } onChange = { this.onCarDataChange.bind(this, 'vin') } /> <br /><br /> 

                    <br />

                    <input type = "button" value = "Deploy" onClick = { this.compileAndDeployCarContract } /> <br /> <br />
                </div>

                <div>
                    {thisTxHash && <p>Transaction Hash: {thisTxHash}</p>} <br/>
                    {thisAddress && <p>Contract Address: {thisAddress}</p>} <br/>
                </div>
            </div>}

        </div>
        );
    }
}

export default AMNew;
