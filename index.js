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

const ig = new IgApiClient();
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var bans = fs.readFileSync('bans.txt', 'utf-8').split(",")

ig.state.generateDevice(process.env.USERNAME);

app.listen(port, () => {
  console.log(`Running on port ${port}`)
});

function wrap(text, length) {
  out = ""
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
    const hasher = crypto.createHmac("sha256", process.env.SALT);

    msg = req.body.msg
    var ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
    var hash = hasher.update(ip).digest("hex")
    console.log(msg + ' Hashed to: ' + hash)
    id = fs.readFileSync('logs.txt', 'utf8')
    id = id.split("%%\n").length
  
    log(`id:${id}, msg:${msg}, hash:${hash}`)

    console.log("id: " + id)
    
    if (bans.includes(hash)) {
      res.sendFile(__dirname + "/views/ban.html")
      console.log("Account is banned")
    } else {
      res.sendFile(__dirname + "/views/sent.html")
      console.log("Image Generated")
    makeImg(id + ": " + msg)
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
  ctx.fillStyle = 'rgb(50, 50, 75)';
  ctx.fillRect(0, 0, 1080, 1080)

  text = wrap(message, 27)
  ctx.font = '48px monospace';
  ctx.fillStyle = 'rgb(200, 255, 255)';
  ctx.fillText(text, 10, 48);
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('./post.png', buffer)
  
  png2jpg(message)

}