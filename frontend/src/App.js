import React, { Component } from 'react';
import Websocket from 'react-websocket';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 360,
      height: 640
    }
    // 1440 x 2560 - 360 x 640

    this.handleClose = this.handleClose.bind(this);
    this.handleData = this.handleData.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
  }

  handleClose() {
    console.log('onclose', arguments);
  }

  handleData(message) {
    // console.log(message)
    let g = this.refs.canvas.getContext('2d');
    let blob = new Blob([message], {type: 'image/jpeg'});
    let URL = window.URL || window.webkitURL;
    let img = new Image();
    let BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    let _this = this;

    img.onload = function() {
      console.log(img.width, img.height);
      _this.setState({
        width: img.width,
        height: img.height
      })
      g.drawImage(img, 0, 0);
      img.onload = null;
      img.src = BLANK_IMG;
      img = null;
      u = null;
      blob = null;
    }
    
    let u = URL.createObjectURL(blob);
    img.src = u;
    this.setState({
      img: img
    })
  }

  handleOpen() {
    console.log('onopen', arguments);
  }

  handleMouseDown(event) {
    var rect = this.refs.canvas.getBoundingClientRect()
    console.log((event.clientX - rect.x) + ", " + (event.clientY - rect.y));
  }

  // <img src={this.state.img} alt={"android"} height={this.state.height} width={this.state.width} />

  render() {
    return (
      <div className="App">
        <Websocket url='ws://localhost:9002/minicap'
          onClose={this.handleClose}
          onMessage={this.handleData}
          onOpen={this.handleOpen} />
        <div id="container">
          <h1>Ministf</h1>
          <canvas ref="canvas"
            width={this.state.width}
            height={this.state.height}
            onMouseDown={this.handleMouseDown} ></canvas>
        </div>
      </div>
    );
  }
}

export default App;
