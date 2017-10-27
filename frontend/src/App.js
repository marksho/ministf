import React, { Component } from 'react';
import ReactWebsocket from 'react-websocket';
import axios from 'axios';
import './App.css';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      endpoint: "http://localhost:1111",
      contact: 0,
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
    const rect = this.refs.canvas.getBoundingClientRect()
    // const { socket } = this.state;

    console.log((event.clientX - rect.x) + ", " + (event.clientY - rect.y));
    axios.post("http://localhost:9002/", {
      x: (event.clientX - rect.x) * 4 - 1,
      y: (event.clientY - rect.y) * 4 - 1
    }).then((response) => {
      console.log('Data sent successfully');
    }).catch((error) => {
      console.log('Received error: ', error);
    })
    // socket.emit(`d ${this.state.contact} ${(event.clientX - rect.x) * 4 - 1} ${(event.clientY - rect.Y) * 4 - 1}`);
  }

  // <img src={this.state.img} alt={"android"} height={this.state.height} width={this.state.width} />

  render() {
    return (
      <div className="App">
        <ReactWebsocket url='ws://localhost:9002'
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
