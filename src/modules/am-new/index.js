import React, { Component } from 'react';

class AMNew extends Component {
  render() {
    return (
      <div>
          Enter Auto mobile details
          <div>
              Make : <input type = "text" />
              Model : <input type = "text" />
              <input type = "button" value = "Deploy" />
          </div>
      </div>
    );
  }
}

export default AMNew;
