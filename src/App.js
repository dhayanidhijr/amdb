import React, { Component } from 'react';
import './App.css';
import AMNew from './modules/am-new';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Welcome to amDB</h1>
        </header>
        <AMNew />
      </div>
    );
  }
}

export default App;
