import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import AMNew from './modules/am-new';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to AMDB</h1>
        </header>
        <AMNew />
      </div>
    );
  }
}

export default App;
