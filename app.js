'use strict'

const http = require('http');
setInterval(function () {
    http.get("http://agile-castle-50630.herokuapp.com/");
}, 6000000);

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

var PAGE_ACCESS_TOKEN = 'EAAM9kSWFrwsBACrMllZBuQ9LazjqKFMQBURpDYB7IZBa2XiyIR69El2axH6d8jwuaZCy9mk04gsVtbdEhOtvTNOz6F0uZAQ1DpiNpvdvjIj8caRLa1ZADYhFuWm8unbULVkzvi2tLHZAMcB2UVe3wad7sGTmQw99aKzebrQpHlewZBxcVRNvA5I';

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.send('Hello world');
})

app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'VERIFY_TOKEN') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
})

app.post('/webhook', function (req, res) {
    var data = req.body;

    if (data.object == 'page') {
        data.entry.forEach(function (pageEntry) {
            var PageID = pageEntry.id;
            var timeOfEvent = pageEntry.time;

            pageEntry.messaging.forEach(function (messagingEvent) {
                if (messagingEvent.optin) {
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else {
                    console.log('unknown messagingEvent: ');
                }
            });
        });

        res.sendStatus(200);
    }
});

function receivedMessage(event) {
    var senderId = event.sender.id;
    var content = event.message.text;

    console.log("receive");

    if (senderId in openChatDict) {
        if (content == '/나가기') {
            delete openChatDict[senderId];
        } else {
            setTimeout(() => {
                for (var key in openChatDict) {
                    var str = openChatDict[senderId] + ": " + content;
                    sendTextMessage(key, str);
                }
            }, 1);
        }
    } else {
        if (senderId in openChatDict2) {
            openChatDict[senderId] = content;
            delete openChatDict2[senderId];
        }
        else if (content =='/입장') {
            setTimeout(sendTextMessage, 1, senderId, '닉네임을 입력해주세요');
            openChatDict2[senderId] = 1;
        } else {
            sendTextMessage(senderId, "협성대학교 재학생들의 오픈채팅방입니다. /입장 /나가기 를 통해 이용해주세요~");
        }
    }

    /*if (!randomChatQueue.dataStore.includes(senderId)) {
        if (content == '1') {
            randomChatInit(senderId);
        } else {
            sendTextMessage(sendrId, '1. 랜덤채팅시작');
        }
    }
    else {
        
    }*/
}

// senderId: Nickname
var openChatDict = {};
var openChatDict2 = {};

/******
var randomChatQueue = new Queue();
var randomChatDict = {};
function randomChatInit(senderId) {
    var str = '대기중이야 조금만 기다려!';
    setTimeout(sendTextMessage, 1, senderId, str);
    setTimeout(function() {
        if (randomChatQueue.dataStore.length >= 1) {
            var user = randomChatQueue.dequeue();
            sendTextMessage(senderId, '매칭 완료!');
            sendTextMessage(user, '매칭 완료!');
        } else {
            randomChatQueue.enqueue(senderId);
        }
    }, 1);
}

********/

function receivedPostback(event) {
    var senderId = event.sender.id;
    var recipientId = event.recipient.id;
    var timeOfPostback = event.timestamp;

    var payload = event.postback.payload;

    sendTextMessage(senderId, "Postback called");
}

function sendTextMessage(recipientId, message) {
    console.log("send");
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: recipientId
            },
            message: {
                text: message
            }
        }
    }, function (err, res, body) {
        if (err) {
            console.log('Error sending message: ' + response.error);
        }
    });
}

function Queue() {
    this.dataStore = [];
    this.enqueue = function enqueue(element) {
        this.dataStore.push(element);
    };
    this.dequeue = function dequeue() {
        return this.dataStore.shift();
    };
    this.front = function front() {
        return this.dataStore[0]
    };
    this.back = function back() {
        return this.dataStore[this.dataStore.length - 1];
    };
    this.toString = function toString() {
        var retStr = "";
        for (var i = 0; i < this.dataStore.length; ++i) {
            retStr += this.dataStore[i] + "\n";
        }
        return retStr;
    }
    this.empty = function empty() {
        if (this.dataStore.length == 0) {
            return true;
        } else return false;
    }
}

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'));
})