import React, { Component } from 'react';
import AMNewContract from './am-new-contract.sol';
import { web3 } from '../../web3';
import _ from 'lodash';


//  var solc = require('solc');

class AMNew extends Component {

    constructor(props) {
        super(props);
        this.state = {
            amNewContract: undefined,
            compiledAMNewContract : undefined
        }
        this.compileAndDeploy = this.compileAndDeploy.bind(this);
    }

    
    
    componentWillMount() {
        this.readAMNewContract(AMNewContract);
        this.getInfo();
        this.setupCompiler();
    }

    getInfo() {
        var outerThis = this;
        if(typeof web3.eth !== 'undefined'){
          console.log("saw eth accounts: ");
          console.log(web3.eth.accounts);
          //console.debug(web3.eth)
          // web3.eth.getCompilers(function(err,resp){
          //   console.log("available compilers: " + resp);
          // });
          web3.version.getNetwork((err, netId) => {
            var tempNetId = ''
            if(err) {
              tempNetId = err;
              console.log('web3.version.getNetwork() saw err: ' + err);
            }
            console.log("saw netId:" + netId);
            switch (netId) {
              case "1":
                tempNetId = "mainnet";
                console.log('This is mainnet');
                break
              case "2":
                tempNetId = "Morden  test network";
                console.log('This is the deprecated Morden test network.');
                break
              case "3":
                tempNetId = "ropsten test network";
                console.log('This is the ropsten test network.');
                break
              default:
                tempNetId = "localhost";
                console.log('This is an unknown/localhost network: ' + tempNetId);
            }
            outerThis.setState({
              thisNetId: tempNetId
            });
          });
        }
      }    

    setupCompiler() {
        var outerThis = this;
        setTimeout(function(){
          console.log('BrowserSolc Our log',window.BrowserSolc);
          window.BrowserSolc.getVersions(function(soljsonSources, soljsonReleases) {
            var compilerVersion = soljsonReleases[_.keys(soljsonReleases)[0]];
            console.log("Browser-solc compiler version : " + compilerVersion);
            window.BrowserSolc.loadVersion(compilerVersion, function(c) {
              outerThis.compiler = c;
              outerThis.setState({statusMessage:"ready!"},function(){
                console.log("Solc Version Loaded: " + compilerVersion);
              });
            });
          });
        },1000);
    }

    compileAndDeploy() {
        var optimize = 1;
        var outerThis = this;
        var compiler = this.compiler;
        console.log("compileAndDeploy called!");
        this.setState({
          statusMessage: "compiling and deploying!"
        });
    
        var result = compiler.compile(this.amNewConctract(), optimize);
        if(result.errors && JSON.stringify(result.errors).match(/error/i)){
          outerThis.setState({
            statusMessage: JSON.stringify(result.errors)
          });
        } else {
          console.log(result);
          // we need to find which of the contracts contains the bytecode for deployment
          // thisContractSorted = _.sortBy _.map(result.contracts, function(val,key) {
          //   // ugly mapsort in react
          //     return [val['abi'],key];
          //   }
          // ), (val) ->
          //   return -1*parseFloat(val[0])  # this grabs the hidden timestampms from above, to sort by
          var thisMap = _.sortBy(_.map(result.contracts, function(val,key) {
            // ugly mapsort in react
              return [key,val];
            }), function(val) {
              return -1*parseFloat(val[1].bytecode);
            });
    
          console.log(thisMap);
    
          var abi = JSON.parse(thisMap[0][1].interface);
          var bytecode = "0x" + thisMap[0][1].bytecode;
    
          var myContract = web3.eth.contract(abi);
          console.log("bytecode: " + JSON.stringify(bytecode));
          console.log("abi: " + JSON.stringify(abi));
          console.log("myContract: ");
          console.log(myContract);
          //console.log("myAddress: " + web3.eth.accounts[0]);
          web3.eth.getGasPrice((err,gasPrice) => {
            if(err){
              console.log("deployment web3.eth.getGasPrice error: " + err);
              outerThis.setState({
                statusMessage: "deployment web3.eth.getGasPrice error: " + err
              });
              return null;
            } else {
              console.log("current gasPrice (gas / ether): " + gasPrice);
              web3.eth.estimateGas({data: bytecode},function(err,gasEstimate){
                if(err) {
                  console.log("deployment web3.eth.estimateGas error: " + err);
                  outerThis.setState({
                    statusMessage: "deployment web3.eth.estimateGas error: " + err
                  });
                  return null;
                } else {
                  console.log("deployment web3.eth.estimateGas amount: " + gasEstimate);
                  var inflatedGasCost = Math.round(1.2*gasEstimate);
                  var ethCost = gasPrice * inflatedGasCost / 10000000000 / 100000000;
                  var warnings = ""
                  if(result.errors){
                    warnings = JSON.stringify(result.errors) + ", " // show warnings if they exist
                  }
                  outerThis.setState({
                    statusMessage: warnings + "Compiled! (inflated) estimateGas amount: " + inflatedGasCost + " (" + ethCost+ " Ether)"
                  });
                  myContract.new({from:web3.eth.accounts[0],data:bytecode,gas:inflatedGasCost},function(err, newContract){
                    console.log("newContract: " + newContract);
                    if(err) {
                      console.log("deployment err: " + err);
                      outerThis.setState({
                        statusMessage: "deployment error: " + err
                      });
                      return null;
                    } else {
                      // NOTE: The callback will fire twice!
                      // Once the contract has the transactionHash property set and once its deployed on an address.
                      // e.g. check tx hash on the first call (transaction send)
                      if(!newContract.address) {
                        console.log("Contract transaction send: TransactionHash: " + newContract.transactionHash + " waiting to be mined...");
                        outerThis.setState({
                          statusMessage: "Please wait a minute.",
                          thisTxHash: newContract.transactionHash,
                          thisAddress: "waiting to be mined..."
                        });
                      } else {
                        console.log("Contract mined! Address: " + newContract.address);
                        console.log(JSON.stringify(newContract));
                        var thisNewStatus = "Contract Deployed to " + outerThis.state.thisNetId;
                        outerThis.setState({
                          statusMessage: thisNewStatus,
                          thisAddress: newContract.address
                        });
                        return null;
                      }
                    }
                  });
                }
              });
            }
          });
        }
        return null;
      }

    readAMNewContract(contractFile) {
        const rawFile = new XMLHttpRequest();
        rawFile.open('GET', contractFile, false);
        rawFile.onreadystatechange = () => {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status === 0)
                {
                    this.setState({
                        amNewContract: rawFile.responseText
                    }, () => {
                        this.setState({
                            //  compiledAMNewContract: solc.compile(this.amNewConctract(), 1)
                            compiledAMNewContract: 'solc.compile(this.amNewConctract(), 1)'
                        });
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
                <input type = "button" value = "Deploy" onClick={ this.compileAndDeploy } /> <br/>
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
