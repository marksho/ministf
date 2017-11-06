var WebSocketServer = require('ws').Server
  , http = require('http')
  , express = require('express')
  , path = require('path')
  , net = require('net')
  , app = express()
  , cors = require('cors')
  , bodyParser = require('body-parser')
  , exec = require('child_process').exec
  , fs = require('fs')
  , d = new Date();

var PORT = process.env.PORT || 9002

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../frontend/build')))

var server = http.createServer(app)
var wss = new WebSocketServer({ server: server })

wss.on('connection', function(ws) {
  console.info('Got a client')

  var stream = net.connect({
    port: 1717
  })

  var stream_minitouch = net.connect({
    port: 1111
  })

  var stream_views = net.connect({
    port: 1699
  })

  stream.on('error', function() {
    console.error('Be sure to run `adb forward tcp:1717 localabstract:minicap`')
    process.exit(1)
  })

  stream_minitouch.on('error', function() {
    console.error('Be sure to run `adb forward tcp:1111 localabstract:minitouch`')
    process.exit(1)
  })

  stream_views.on('error', function() {
    console.error('Be sure to run `adb forward tcp:1699 tcp:1699`')
    process.exit(1)
  })

  var readBannerBytes = 0
  var bannerLength = 2
  var readFrameBytes = 0
  var frameBodyLength = 0
  var frameBody = new Buffer(0)
  var banner = {
    version: 0
  , length: 0
  , pid: 0
  , realWidth: 0
  , realHeight: 0
  , virtualWidth: 0
  , virtualHeight: 0
  , orientation: 0
  , quirks: 0
  }

  var debug = false;

  function tryTouch() {
    console.log(`minitouch sent: ${stream_minitouch.read()}`);
  }

  function tryRead() {;
    for (var chunk; (chunk = stream.read());) {
      if (debug == true)
        console.info('chunk(length=%d)', chunk.length)
      for (var cursor = 0, len = chunk.length; cursor < len;) {
        if (readBannerBytes < bannerLength) {
          switch (readBannerBytes) {
          case 0:
            // version
            banner.version = chunk[cursor]
            break
          case 1:
            // length
            banner.length = bannerLength = chunk[cursor]
            break
          case 2:
          case 3:
          case 4:
          case 5:
            // pid
            banner.pid +=
              (chunk[cursor] << ((readBannerBytes - 2) * 8)) >>> 0
            break
          case 6:
          case 7:
          case 8:
          case 9:
            // real width
            banner.realWidth +=
              (chunk[cursor] << ((readBannerBytes - 6) * 8)) >>> 0
            break
          case 10:
          case 11:
          case 12:
          case 13:
            // real height
            banner.realHeight +=
              (chunk[cursor] << ((readBannerBytes - 10) * 8)) >>> 0
            break
          case 14:
          case 15:
          case 16:
          case 17:
            // virtual width
            banner.virtualWidth +=
              (chunk[cursor] << ((readBannerBytes - 14) * 8)) >>> 0
            break
          case 18:
          case 19:
          case 20:
          case 21:
            // virtual height
            banner.virtualHeight +=
              (chunk[cursor] << ((readBannerBytes - 18) * 8)) >>> 0
            break
          case 22:
            // orientation
            banner.orientation += chunk[cursor] * 90
            break
          case 23:
            // quirks
            banner.quirks = chunk[cursor]
            break
          }

          cursor += 1
          readBannerBytes += 1

          if (readBannerBytes === bannerLength) {
            if (debug == true)
              console.log('banner', banner)
          }
        }
        else if (readFrameBytes < 4) {
          frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0
          cursor += 1
          readFrameBytes += 1
          if (debug == true)
            console.info('headerbyte%d(val=%d)', readFrameBytes, frameBodyLength)
        }
        else {
          if (len - cursor >= frameBodyLength) {
            if (debug == true)
              console.info('bodyfin(len=%d,cursor=%d)', frameBodyLength, cursor)

            frameBody = Buffer.concat([
              frameBody
            , chunk.slice(cursor, cursor + frameBodyLength)
            ])

            // Sanity check for JPG header, only here for debugging purposes.
            if (frameBody[0] !== 0xFF || frameBody[1] !== 0xD8) {
              console.error(
                'Frame body does not start with JPG header', frameBody)
              process.exit(1)
            }

            // setTimeout(function timeout() {
            //   ws.send(frameBody, {
            //     binary: true
            //   })
            // }, 100);

            ws.send(frameBody, {
              binary: true
            })

            cursor += frameBodyLength
            frameBodyLength = readFrameBytes = 0
            frameBody = new Buffer(0)
          }
          else {
            if (debug == true)
              console.info('body(len=%d)', len - cursor)

            frameBody = Buffer.concat([
              frameBody
            , chunk.slice(cursor, len)
            ])

            frameBodyLength -= len - cursor
            readFrameBytes += len - cursor
            cursor = len
          }
        }
      }
    }
  }

  let touch_events = [];
  let file_no = 0;
  let write_file = 1;
  // let time = d.getTime();

  function tryViews() {
    // console.log(`view hierarchy: ${stream_views.read()}`);
    if (write_file == 1) {
      let view_hierarchy = stream_views.read() + "";
      // let time = d.getTime();
      // if (view_hierarchy != null && view_hierarchy.includes("RICO_JSON_END")) {
      //   d = new Date();
      //   time = d.getTime();
      // }
      // // console.log(d.getTime());
      // // fs.writeFile(`../output/view${time}.txt`);
      // while (view_hierarchy) {
      //   time = d.getTime();
      //   fs.appendFile(`../output/view${time}.txt`, `${view_hierarchy}`, function(err) {
      //     if (err) {
      //       return console.log(err)
      //     }
      //   });
      //   view_hierarchy = stream_views.read();
      //   if (view_hierarchy != null && view_hierarchy.includes("RICO_JSON_END")) {
      //     d = new Date();
      //     time = d.getTime();
      //   }
      // }
      let arr = [];
      let times = [];
      if (view_hierarchy) {
        const lines = view_hierarchy.split("\n");
        let time = d.getTime();
        let cur_line = "";

        for (let i = 0; i < lines.length; i++) {
          cur_line += lines[i]+"\n";
          
          if (lines[i].includes("RICO_JSON_END")) {
            d = new Date();
            time = d.getTime();
            times.push(time)
            arr.push(cur_line);
            cur_line = "";
          }
        }

        for (let i = 0; i < arr.length; i++) {
          fs.appendFile(`../output/view${file_no}.txt`, `${arr[i]}`, function(err) {
            if (err) {
              return console.log(err)
            }
          });
          file_no += 1;
        }
        if (cur_line != "") {
          fs.appendFile(`../output/view${file_no}.txt`, `${cur_line}`, function(err) {
            if (err) {
              return console.log(err)
            }
          });
        }
      }
    }
    while (touch_events.length > 0) {
      let data = touch_events.shift();
      console.log(`writing: ${data}`);
      stream_minitouch.write(data);
      stream_minitouch.write('c\n');
    }
  }

  // cap to 10fps
  setTimeout(function timeout() {
    stream.on('readable', tryRead)
  }, 100);
  // stream.on('readable', tryRead)

  stream_minitouch.on('readable', tryTouch)

  stream_views.on('readable', tryViews)

  ws.on('close', function() {
    console.info('Lost a client')
    stream.end()
    stream_minitouch.end()
    stream_views.end()
  })

  app.post('/',function(req,res){
        const data = req.body.data;
        if (req.body.type == "mouse") {
          // console.log(data[0])
          if (data[0] == 'd') {
            console.log('stream_views')
            stream_views.write("d\n")
          }
          console.log(`received: ${data}`);
          // stream_minitouch.write(data);
          // stream_minitouch.write('c\n');
          touch_events.push(data);
          return res.sendStatus(200);
        } else if (req.body.type == "key") {
          console.log(`${data}`);
          exec(data, function(error, stdout, stderr) {
            if (error != null) {
              console.log(`exec error: ${error}`);
            }
          })
          return res.sendStatus(200);
        } else {
          console.log(`unknown data type: ${req.body.type}`);
        }
      // }
  })
})

server.listen(PORT)
console.info('Listening on port %d', PORT)
