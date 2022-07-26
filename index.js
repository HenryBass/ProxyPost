const { IgApiClient } = require('instagram-private-api');
const express = require('express')
require('dotenv').config()
const fs = require('fs')
const app = express()
const port = 3000
const { createCanvas, loadImage } = require('canvas')
const canvas = createCanvas(1080, 1080);
const ctx = canvas.getContext('2d');
var qs = require('querystring');
var bodyParser = require('body-parser')
const Jimp = require("jimp");
const crypto = require("crypto");
var mod = false
var lasttime = Math.floor(Date.now()/1000);
console.log(lasttime)

const ig = new IgApiClient();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var bans = fs.readFileSync('bans.txt', 'utf-8').split(",")

ig.state.generateDevice(process.env.USERNAME);

app.listen(port, () => {
  console.log(`Running on port ${port}`)
});

function wrap(text, length) {
  let out = ""
  let words = text.split(" ")
  let count = 0
  for (let i = 0; i < words.length; i++) {
    count += words[i].length + 1
    if (count <= length) {
      out += words[i] + " "
    } else {
      out += "\n"
      out += words[i] + " "
      count = 0
    }
  }
  return out
}

  console.log("Trying to log in...")
  ig.account.login(process.env.USERNAME, process.env.PASSWORD);
  console.log("Logged into " + process.env.USERNAME)

  app.get('/', (req, res) => {
    res.sendFile(__dirname + "/views/index.html")
  })

  app.get('/ban', (req, res) => {
    res.sendFile(__dirname + "/views/ban.html")
  })

  app.get('/rules', (req, res) => {
    res.sendFile(__dirname + "/views/rules.html")
  })
  
  app.get('/style.css', function(req, res) {
    res.sendFile(__dirname + "/views/style.css");
  });
  
  app.post('/', urlencodedParser, (req, res) => {
    
    mod = false
    let  msg = req.body.msg
    var key = req.body.key
    var ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    const hasher = crypto.createHmac("sha256", process.env.SALT);
    var hash = hasher.update(ip).digest("hex")
    
    const keyhasher = crypto.createHmac("sha256", process.env.SALT);
    var keyhash = keyhasher.update(key).digest("hex")

    if (keyhash == process.env.KEY) {
      mod = true
    }

    console.log(msg + ' Hashed to: ' + hash)
    let id = fs.readFileSync('logs.txt', 'utf8')
    id = id.split("%%\n").length
  
    log(`id:${id}, msg:${msg}, hash:${hash}`)

    console.log("id: " + id)
    
    if (bans.includes(hash)) {
      res.sendFile(__dirname + "/views/ban.html")
      console.log("Account is banned")
    } else if ((Math.floor(Date.now()/1000) - lasttime) <= 20) {
      res.sendFile(__dirname + "/views/ratelimited.html")
      console.log("RateLimited")
    }
    else if (typeof msg == "string") {
      if(msg.length >= 3) {
        res.sendFile(__dirname + "/views/sent.html")
        console.log("Image Generated")
        lasttime = Math.floor(Date.now()/1000)
        makeImg(id + ": " + msg)
      }

    }

  });

function log(newLog) {
  fs.appendFileSync('logs.txt', newLog + "%%\n");
}

function png2jpg(msg) {
  Jimp.read('post.png').then(img => {
    img.write('post.jpg');
  }).then(() => {
    setTimeout(function() {
      return post(msg)
    }, 5000);
    
  })
  
}

function post(msg) {
  ig.publish.photo({ file: fs.readFileSync("post.jpg"), caption: msg });
  console.log(msg + " Posted")
}

function makeImg(message) {
  if (mod == false) {
    ctx.fillStyle = 'rgb(50, 75, 50)';
  } else {
    ctx.fillStyle = 'rgb(75, 50, 50)'
  }
  
  ctx.fillRect(0, 0, 1080, 1080)

  let text = wrap(message, 27)
  ctx.font = '48px monospace';
  if (mod == false) {
    ctx.fillStyle = 'rgb(200, 255, 200)';
  } else {
    ctx.fillStyle = 'rgb(255, 200, 200)';
  }
  
  ctx.fillText(text, 10, 48);
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('./post.png', buffer)
  
  png2jpg(message)

}