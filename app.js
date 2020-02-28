'use strict'

const http = require('http');
setInterval(function() {
    http.get("http://agile-castle-50630.herokuapp.com/");
}, 6000000);

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

var PAGE_ACCESS_TOKEN = 'EAAM9kSWFrwsBAFa96QfqMX3ZBhJjPO3UM3zVmTnZArtVGjqLw0s0REtNZBzdyxB8Q0mzt75ndqc4SGqYF0FIz5sf2lntPopFvZCjdjZBLbVFlf50Nn5DzecEnJmD2yyuYZBf4EO9ElMiKzEByEA6ITaYOpI0yqEqKAfsZA2IHFLZC1fn1tcNQSoM';

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
    console.log(data);

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
                    console.log('unknown messagingEvent: ', messagingEvent);
                }
            });
        });

        res.sendStatus(200);
    }
});

function receivedMessage(event) {
    var senderId = event.sender.id;
    var content = event.message.text;

    console.log(content);
    
    if (content == '1') {
        randomChatInit(senderId);
    }

    sendTextMessage(senderId, '1. 랜덤채팅');
}

var randomChatQueue = new Queue();
function randomChatInit(senderId) {
    randomChatQueue.enqueue(senderId);
    var str = randomChatQueue.dataStore.length.toString() + '명과 랜덤매칭 시작!';
    setTimeout(sendTextMessage, 1, senderId, str);
}

function receivedPostback(event) {
    var senderId = event.sender.id;
    var recipientId = event.recipient.id;
    var timeOfPostback = event.timestamp;

    var payload = event.postback.payload;

    sendTextMessage(senderId, "Postback called");
}

function sendTextMessage(recipientId, message) {
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
        return this.dataStore[this.dataStore.length-1];
    };
    this.toString = function toString() {
        var retStr = "";
        for (var i=0; i<this.dataStore.length; ++i) {
            retStr += this.dataStore[i] + "\n";
        }
        return retStr;
    }
    this.empty = function empty() {
        if(this.dataStore.length == 0) {
            return true;
        } else return false;
    }
}

app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'));
})