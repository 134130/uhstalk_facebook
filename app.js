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

    console.log("receive(", senderId, "): ", content);

    switch (content) {
        case '/입장':
            waitOpenChat(senderId);
            break;
        case '/나가기':
            quitOpenChat(senderId);
            break;
        case '/도움말':
            var str = "지원되는 명령어: /입장, /나가기, /랭킹, /인사대, /경영대, /이공대, /예술대, /신학대"
            break;

        case '/랭킹':
            var str = "인사대: " + collegeRank[0] + "\n경영대: " + collegeRank[1] + "\n이공대: " + collegeRank[2] + "\n예술대: " + collegeRank[3] + "\n신학대: " + collegeRank[4];
            sendTextMessage(senderId, str);
            break;
        case '/인사대':
            rankingGame(senderId, 0);
            break;
        case '/경영대':
            rankingGame(senderId, 1);
            break;
        case '/이공대':
            rankingGame(senderId, 2);
            break;
        case '/예술대':
            rankingGame(senderId, 3);
            break;
        case '/신학대':
            rankingGame(senderId, 4);
            break;

        default:
            if (senderId in openChatDict2) {
                enterOpenChat(senderId, content);
                break;
            } else if (senderId in openChatDict) {
                randomTactGame();
                for (key in openChatDict) {
                    sendTextMessage(key, openChatDict[key] + ": " + content);
                }
                break;
            } else {
                sendTextMessage(senderId, "협성대학교 재학생들의 오픈채팅방입니다. /입장 /나가기 /도움말 를 통해 이용해주세요~");
                break;
            }
    }
}

var collegeRank = [0, 0, 0, 0, 0]
var collegeList = ['인사대', '경영대', '이공대', '예술대', '신학대']
var rank1st = 0;
function checkRankReversal(col) {
    if (collegeRank[col] > collegeRank[rank1st]) {
        var str = collegeList[col] + '가 ' + collegeList[rank1st] + '를 제치고 1등으로 역전!';
        for (var key in openChatDict) {
            sendTextMessage(key, str);
        }
        rank1st = col;
    }
}

function rankingGame(senderId, col) {
    collegeRank[col] += 1;
    checkRankReversal(col);
    sendTextMessage(senderId, collegeList[col] + "의 현재 점수는 " + collegeRank[col] + "점!");
}

function randomTactGame() {
    if (Math.floor(Math.random() * 100) < 5 ) {
        for (var key in openChatDict) {
            var str = "[[ 눈치게임 시작!! ]]";
            sendTextMessage(key, str);
        }
    }
}

function enterOpenChat(senderId, content) {
    delete openChatDict2[senderId];
    openChatDict[senderId] = content;
    for (var key in openChatDict) {
        var str = openChatDict[senderId] + "님이 채팅방에 입장했어요";
        sendTextMessage(key, str);
    }
}

function quitOpenChat(senderId) {
    if ((senderId in openChatDict)) {
        delete openChatDict[senderId];
        for (var key in openChatDict) {
            var str = openChatDict[senderId] + "님이 채팅방을 나갔어요";
            sendTextMessage(key, str);
        }
    }
}

function waitOpenChat(senderId) {
    if (!(senderId in openChatDict) && !(senderId in openChatDict2)) {
        sendTextMessage(senderId, '닉네임은 뭐로할거에요?');
        openChatDict2[senderId] = 1;
    }
}

// senderId: Nickname
var openChatDict = {};
var openChatDict2 = {};

function receivedPostback(event) {
    var senderId = event.sender.id;
    var recipientId = event.recipient.id;
    var timeOfPostback = event.timestamp;

    var payload = event.postback.payload;

    sendTextMessage(senderId, "Postback called");
}

function sendTextMessage(recipientId, message) {
    console.log("send: ", message);
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