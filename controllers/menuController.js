/**
 * Created by Kevin on 4/9/2016.
 */
var http = require("http");

var mealInfo = [];
var dateRange = [];
var cannonClosed = "Sorry, but the Commons is closed all day";
var menuNotPublished = "Sorry, but it appears that the menu for that day has not been published yet";
var noMenu = "Sorry, but it appears that there is no menu for that meal.  The Cannon Center might be closed";

function mealData(mealname, mealid, servedate) {
    this.mealname = mealname;
    this.mealid = mealid;
    this.servedate = servedate;
}



module.exports.menu = function (req, res) {
    /*process.argv.forEach(function (val, index, array) {
        console.log(index + ': ' + val);
    });*/
    if (process.argv[2] === "-g") {
        console.log("%j", req.body);
    }

    var meal = req.body.result.parameters['meal-type'];
    var date;
    if (req.body.result.parameters['date'] === '') {
        date = convertTimeStampToDate(req.body['timestamp']);
    }
    else {
        date = getDate(req.body.result.parameters['date']);
    }

    var cached = false;
    var matchedMeal;
    for (i = 0; i < mealInfo.length; i++) {
        if (mealInfo[i].mealname === meal && mealInfo[i].servedate === date) {
            cached = true;
            matchedMeal = i;
            break;
        }
    }
    if (!cached) {
        getMealIds(date, req, res);
    }
    else {
        getMenu(mealInfo[matchedMeal], res);
    }


};


function getMealIds(date, req, res) {
    var options = {
        host: 'dining.byu.edu',
        port: 80,
        path: '/commons/menu_pass.php?servedate=' + date + '&viewname=MenusJSON&_=1457029106452',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*/*'
        }
    };

    var req2 = http.get(options, function (res2) {
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res2.on('data', function (chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function () {
            var body = Buffer.concat(bodyChunks);
            body = JSON.parse(body);
            if (body['menus'].length > 0) {
                body['menus'].forEach(function (meal) {
                    mealInfo.push(new mealData(meal.mealname, meal.mealid, meal.servedate));
                })
                module.exports.menu(req, res);
            }
            else {
                var slack_message = { "text": menuNotPublished }
                responseString = menuNotPublished;
                res.setHeader('Content-type', 'application/json');
                res.send(JSON.stringify({ speech: responseString, displayText: responseString, data: { "slack": slack_message }, contextOut: [], source: "The Cannon Center Menu" }));
                return;
            }
        });
        req2.end();
    });
}


function getMenu(mealData, res) {

    var options = {
        host: 'dining.byu.edu',
        port: 80,
        path: '/commons/menu_pass.php?servedate=' + mealData.servedate + '&mealname=' + mealData.mealname + '&mealid=' + mealData.mealid + '&viewname=MenuItemsJSON',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*/*'
        }
    };

    var euro = [];
    var expo = [];
    var fusion = [];
    var grainery = [];
    var grill = [];
    var req = http.get(options, function (res2) {
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res2.on('data', function (chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function () {
            var body = Buffer.concat(bodyChunks);
            body = JSON.parse(body);
            //getEvents(res, body, processMenu);
            var items = body.menus[0].recipes;
            var i;
            var speechString;
            var displayString;
            var menuException = false;
            if (items.length > 0) {
                for (i = 0; i < items.length; i++) {
                    if (items[i].description === "The Commons is Closed All Day") {
                        responseString = cannonClosed;
                        menuException = true;
                        break;
                    }
                    switch (items[i].category) {
                        case "Euro":
                            euro.push(items[i].description);
                            break;
                        case "Expo":
                            expo.push(items[i].description);
                            break;
                        case "Fusion":
                            fusion.push(items[i].description);
                            break;
                        case "Grainery":
                            grainery.push(items[i].description);
                            break;
                        case "Grill":
                            grill.push(items[i].description);
                            break;
                    }
                }
            }
            else {
                        responseString = noMenu;
                        menuException = true;
            }
            if (!menuException) {
                var slack_message = {
                    "text": "Menu for " + mealData.servedate,
                    "attachments": [
                        {
                            "title": mealData.mealname,
                            "title_link": 'http://dining.byu.edu/commons/menus.html',
                            "color": "#36a64f",

                            "fields": [
                                {
                                    "title": "Fusion",
                                    "value": fusion.toString(),
                                    "short": true
                                },
                                {
                                    "title": "Expo",
                                    "value": expo.toString(),
                                    "short": true
                                },
                                {
                                    "title": "Euro",
                                    "value": euro.toString(),
                                    "short": true
                                },
                                {
                                    "title": "Grill",
                                    "value": grill.toString(),
                                    "short": true
                                }
                            ],

                        }
                    ]
                }
            }
            else {
                var slack_message = { "text": cannonClosed }
            }
            if (!menuException) {
                responseString = "At the Fusion station they are serving," + fusion.toString() +
                    ".  At the Expo station They are serving," + expo.toString() +
                    ". At the Euro station they are serving," + euro.toString() +
                    ". At the Grill they are serving" + grill.toString()
            }
            res.setHeader('Content-type', 'application/json');
            res.send(JSON.stringify({ speech: responseString, displayText: responseString, data: { "slack": slack_message }, contextOut: [], source: "The Cannon Center Menu" }));


        });
        req.end();

    });
}


function getDate(queryDate) {
    var DateString = queryDate.replace(/-/g, '');
    return (DateString);
}

function convertTimeStampToDate(timeStamp) {
    var DateString = timeStamp.split('T')[0].replace(/-/g, '');
    return (DateString);
}
