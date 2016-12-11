/**
 * Created by Kevin on 4/9/2016.
 */
var http = require("http");

var mealId = [];
var dateRange = [];



module.exports.menu = function(req, res){
    console.log(req.body);

    var meal = req.body.result.parameters['meal-type'];
    var date = getDate(req.body['timestamp']);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify({speech: "At the Expo They are having pizza, At the Fusion they are having BBQ ribs, at the Grill they are having Hamburgers",displayText: "They are having BBQ Ribs",data: [],contextOut: [],source: "The Cannon Center Menu"})); 
};

module.exports.getMenu = function(req, res){
    var meal = req.query['meal'];
    var date = req.query['date'];
    var currentOptions = {
        host: 'dining.byu.edu',
        port: 80,
        path: '/commons/menu_pass.php?servedate='+getDate(new Date())+'&viewname=MenusJSON&_=1457029106452',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*/*'
        }
    };
    callBYUAPI(currentOptions, 0, meal, date);
};

function getDetailedMenu(meal, date){
    var queryMealId;
    var status = 200

    var day = date.slice(-2);

    if(mealId[0] && parseInt(day) >= parseInt(dateRange[0][0]) && parseInt(day) <= parseInt(dateRange[0][1])&& mealId[0])
    {
        queryMealId = mealId[0];
    }
    else if(mealId[1] && parseInt(day) >= parseInt(dateRange[1][0]) && parseInt(day) <= parseInt(dateRange[1][1])){
        queryMealId = mealId[1]
    }
    else if(mealId[2] && parseInt(day) >= parseInt(dateRange[2][0]) && parseInt(day) <= parseInt(dateRange[2][1])){
        queryMealId = mealId[2];
    }
    else{
        res.sendStatus(404);
        return;
    }


    var options = {
        host: 'dining.byu.edu',
        port: 80,
        path: '/commons/menu_pass.php?servedate='+date+'&mealname='+meal+'&mealid='+queryMealId+'&viewname=MenuItemsJSON',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*/*'
        }
    };


    getMenu(options);
}


function callBYUAPI(options, timeVar, meal, date){
    var req = http.get(options, function(res2){
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res2.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            body = JSON.parse(body);
            if(body['menus'].length > 0){
                mealId[timeVar] = body['menus'][0]['mealid'];
                dateRange[timeVar] = body['menus'][0]['shortname'].slice(-7).trim().split(' - ');
                getDetailedMenu(meal, date);
            }
        });
        req.end();
    });
}

function getMenu(options){
    var req = http.get(options, function(res2){
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res2.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            body = JSON.parse(body);
            //getEvents(res, body, processMenu);


        });
        req.end();
    });
}

function processMenu(res, menu, events){

    for(var i = 0; i<menu['menus'][0]['recipes'].length; i++){
        var eventFired = false;
        for(var j = 0; j<events.length; j++) {
            if (menu['menus'][0]['recipes'][i]['shortname'] === events[j]['Name']) {
                console.log("Event in For Loop: " + JSON.stringify(events[j]));
                sendNotification(menu['menus'][0]['servedate'], menu['menus'][0]['mealname'], events[j]);
                eventFired = true;
                break
            }
        }
        if(!eventFired){
            registerEvents(menu['menus'][0]['servedate'], menu['menus'][0]['mealname'], menu['menus'][0]['recipes'][i]['shortname'], menu['menus'][0]['recipes'][i]['description']);

        }
    }

    res.send(menu);
}

function dateCreator(date, meal){

    var mealStart;
    var mealEnd;

    var year = date.slice(0,4);
    var month =date.slice(4, 6);
    var day = date.slice(-2);
    var formattedDate = year+'-'+month+'-'+day+'T';

    return formattedDate;

}

function getDate(queryDate){
    var DateString = queryDate.split('T')[0].replace(/-/g, '');
    return (DateString);
}

function getMonday(weekAdjuster) {
    d = new Date();
    d.setDate(d.getDate() +weekAdjuster);

    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? 1:8); // adjust when day is sunday
    var date = new Date(d.setDate(diff));

    return date;
}
