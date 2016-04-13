/**
 * Created by Kevin on 4/9/2016.
 */
var http = require("http");

var mealId = [];
var dateRange = [];



module.exports.getMenu = function(req, res){
    var queryMealId;
    var status = 200
    var meal = req.query['meal']
    var date = req.query['date']
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


    getMenu(options, res);

};

module.exports.getMenuInfo = function(req, res)
{
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

    var nextOptions = {
        host: 'dining.byu.edu',
        port: 80,
        path: '/commons/menu_pass.php?servedate='+getDate(getMonday(0))+'&viewname=MenusJSON&_=1457029106452',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*/*'
        }
    };

    var lastOptions = {
        host: 'dining.byu.edu',
        port: 80,
        path: '/commons/menu_pass.php?servedate='+getDate(getMonday(7))+'&viewname=MenusJSON&_=1457029106452',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*!/!*'
        }
    };

    //set current week info
    callBYUAPI(currentOptions, 0);
    callBYUAPI(nextOptions, 1);
    callBYUAPI(lastOptions, 2);


    if(res){
        res.sendStatus(200);
    }
};

function callBYUAPI(options, timeVar){
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
            }
        });
        req.end();
    });
}

function getMenu(options, res){
    var req = http.get(options, function(res2){
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res2.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            body = JSON.parse(body);
            getEvents(res, body, processMenu);


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


function sendNotification(date, meal, event){
    if(!event){
        return;
    }
    else{
        console.log("Send Event: " + JSON.stringify(event));
    }
    var mealStart;
    var mealEnd;

    var formattedDate = dateCreator(date, meal);
    if(meal == "BREAKFAST"){
        mealStart = formattedDate+'07:00:00-08:00';
        mealEnd = formattedDate+'10:00:00-08:00';
    }
    else if(meal === "LUNCH"){
        mealStart = formattedDate+'11:00:00-8:00';
        mealEnd = formattedDate+'14:30:00-08:00';
    }
    else if(meal === "DINNER"){
        mealStart = formattedDate+'17:00:00-8:00';
        mealEnd = formattedDate+'19:30:00-08:00';
    }
    else{
        throw new TypeError('Not correct meal type', 'menuController.js', 196);
    }



    var post_data = '{"EventInformation": ["' + event['Name'] + '","' + event['Description'] + '","' + mealStart +'","' + mealEnd + '","Cannon Center"]}';

    if (event['Name'] === "Pumpkin Pie"){
        console.log("***********************Pumpkin Pie**********************************");
    }
    console.log(post_data);
    var post_options = {
        host: 'stoutsuidae.com',
        port: 8000,
        path: '/api/providers/570c6ef419bc7e711da68fe6/events'+event['ID']+'/fire',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (body) {
            //console.log('Body: ' + body);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
}

function registerEvents(date, meal, name, description){

    //console.log("Event Name: " + name);
    var post_data = '{"Event": {"Name":"' + name + '","Description": "' + description + '"},"Secret": "mONXXDhim8DmClKPdHlKLib0ebd7nRs6hlvBMe0BeeE91DUmBVaXwN7OCrHrnEOKxaCHG_nAULz3ucdT0GdIBZtKUMG0TU_HMSJMYUwlw_kSnlSAXjmMjudtOKOq_DXotubEkw=="}';

    //console.log(post_data);
    var post_options = {
        host: 'stoutsuidae.com',
        port: 8000,
        path: '/api/providers/570c6ef419bc7e711da68fe6/events',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function(res) {
        //console.log('Headers: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (body) {
           // console.log('Registration Body: ' + body);
            body = JSON.parse(body);
            sendNotification(date, meal, body);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();

}

function getEvents(res, menu, processMenu){

    var options = {
        host: 'stoutsuidae.com',
        port: 8000,
        path: '/api/providers/570c6ef419bc7e711da68fe6/events',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            accept: '*/*'
        }
    };

    var req = http.get(options, function(res2){
        // Buffer the body entirely for processing as a whole.
        var bodyChunks = [];
        res2.on('data', function(chunk) {
            // You can process streamed parts here...
            bodyChunks.push(chunk);
        }).on('end', function() {
            var body = Buffer.concat(bodyChunks);
            body = JSON.parse(body);
            console.log("Event Body!: %j", body);
            processMenu(res, menu, body)
        });
        req.end();
    });


}


function getDate(queryDate){
    var DateString = queryDate.getFullYear()+ ('0' + (queryDate.getMonth()+1)).slice(-2) + ('0' + queryDate.getDate()).slice(-2);
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