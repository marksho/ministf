import React, { Component } from 'react';
import ReactWebsocket from 'react-websocket';
import axios from 'axios';
import keyMap from './keyMap.js'
import './App.css';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      contact: 0,
      width: 360,
      height: 640,
      x: 1,
      y: 1,
      update: 1
    }
    // 1440 x 2560 - 360 x 640

    this.handleClose = this.handleClose.bind(this);
    this.handleData = this.handleData.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseDrag = this.handleMouseDrag.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.setUpdate = this.setUpdate.bind(this);
  }

  componentWillMount() {
    window.addEventListener("keydown", function(e) {
      const keyCode = e.code;
      console.log(keyMap[keyCode]);
      const output = `adb shell input keyevent ${keyMap[keyCode]}`
      axios.post("http://localhost:9002/", {
        type: "key",
        data: output
      }).then((response) => {
        console.log('Data sent successfully');
      }).catch((error) => {
        console.log('Received error: ', error);
      })
      e.preventDefault()
    })
  }

  handleOpen() {
    console.log('onopen', arguments);
  }

  handleClose() {
    console.log('onclose', arguments);
  }

  handleData(message) {
    // const obj = JSON.parse(data);
    // console.log(obj);
    // const message = obj.data
    // const message = "temp";

    // console.log(message)
    // const display = true;
    // if (display == true) {
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
    // }
  }

  handleMouseDown(event) {
    const rect = this.refs.canvas.getBoundingClientRect()

    const mouseX = event.clientX - rect.x;
    const mouseY = event.clientY - rect.y;
    const output = `d ${this.state.contact} ${mouseX * 4 - 1} ${mouseY * 4 - 1} ${50}\n`;
    console.log(`mouseDown: ${mouseX}, ${mouseY}`);
    
    axios.post("http://localhost:9002/", {
      type: "mouse",
      data: output
    }).then((response) => {
      console.log('Data sent successfully');
    }).catch((error) => {
      console.log('Received error: ', error);
    })
  }

  handleMouseUp(event) {
    // const rect = this.refs.canvas.getBoundingClientRect()

    // const mouseX = event.clientX - rect.x;
    // const mouseY = event.clientY - rect.y;
    // const output
    // console.log(`mouseUp: ${mouseX}, ${mouseY}`);
    const output = `u ${this.state.contact}\n`;

    axios.post("http://localhost:9002/", {
      type: "mouse",
      data: output
    }).then((response) => {
      console.log('Data sent successfully');
    }).catch((error) => {
      console.log('Received error: ', error);
    })
  }

  handleMouseDrag(event) {
    const rect = this.refs.canvas.getBoundingClientRect()

    const mouseX = event.clientX - rect.x;
    const mouseY = event.clientY - rect.y;
    const output = `m ${this.state.contact} ${mouseX * 4 - 1} ${mouseY * 4 - 1} ${50}\n`;
    if (this.state.update === 1 && mouseX > 0 && mouseX <= this.state.width && mouseY > 0 && mouseY <= this.state.height) {
      console.log(`drag: ${mouseX}, ${mouseY}`);
      this.setState({
        update: 0
      })
      setTimeout(this.setUpdate, 50);

      axios.post("http://localhost:9002/", {
        type: "mouse",
        data: output
      }).then((response) => {
        console.log('Data sent successfully');
      }).catch((error) => {
        console.log('Received error: ', error);
      })
    }
  }

  handleKeyPress(event) {
    var keynum = event.keyCode;
    console.log(event)

    console.log(keynum);
  }

  setUpdate() {
    // console.log("hi im updating");
    this.setState({
      update: 1
    });
  }

  render() {
    return (
      <div className="App">
        <ReactWebsocket url='ws://localhost:9002'
          onClose={this.handleClose}
          onMessage={this.handleData}
          onOpen={this.handleOpen} />
        <div id="container">
          <h1 id="header">Ministf</h1>
          <div id="phone">
            <canvas ref="canvas"
              width={this.state.width}
              height={this.state.height}
              onMouseDown={this.handleMouseDown}
              onMouseUp={this.handleMouseUp}
              onDrag={this.handleMouseDrag}
              onDragEnd={this.handleMouseUp}
              draggable={true} ></canvas>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
