import React, { Component } from 'react';
import AMNewContract from './am-new-contract.sol';
//  import solc from 'solc';
import { web3 } from '../../web3';

class AMNew extends Component {

    constructor(props) {
        super(props);
        this.state = {
            amNewContract: undefined,
            compiledAMNewContract : undefined
        }
    }
    
    componentWillMount() {
        this.readAMNewContract(AMNewContract);
    }

    readAMNewContract(contractFile) {
        const rawFile = new XMLHttpRequest();
        rawFile.open("GET", contractFile, false);
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
                            compiledAMNewContract: "solc.compile(this.amNewConctract(), 1)"
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
                <input type = "button" value = "Deploy" />
                {this.amNewConctract()}

            </div>
        </div>
        );
    }
}

export default AMNew;
