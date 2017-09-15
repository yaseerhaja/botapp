require('dotenv-extended').load();

var restify = require('restify'),	
    builder = require('./core');

const path = require('path');
    
    //builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   //console.log('%s listening to %s', server.name, server.url);

   console.log('Server is up and running');   
});

global.appRoot = path.resolve(__dirname);

server.get(/\/client\/?.*/, restify.plugins.serveStatic({
    directory: path.join(__dirname, 'client')
}));

console.log(appRoot);

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var dir = server.url;


var menuItemsJson = [{
    title: "Server",
    subtitle: "You can view the status and you can manage start and stop state of server.",
    text: "Few details about the server.",
    img: appRoot+ "/client/img/servers.png"
},{
    title: "Database",
    subtitle: "You can view the status and you can manage start and stop state of server.",
    text: "Few details about the server.",
    img: appRoot+ "/client/img/db.png"
},{
    title: "Lan",
    subtitle: "You can view the status and you can manage start and stop state of server.",
    text: "Few details about the server.",
    img: appRoot+ "/client/img/lan-nw.jpg"
},{
    title: "Cluster",
    subtitle: "You can view the status and you can manage start and stop state of server.",
    text: "Few details about the server.",
    img: appRoot+ "/client/img/cluster.png"
}],    
menuItems = { 
                "Server": {
                    item: "server"
                },
                "LAN": {
                    item: "lan"
                }
            },
server = {
            "Details":{
                item: "details",
                data: {
                    "KL12345": {
                        name: "KL12345",
                        type: "Software Instance",
                        Location: "Amsterdam",
                        OutageDependency : "N",
                        SubType : "INTERNET SOFTWARE INSTANCE"
                    }
                }
            },
            "Status": {
                item: "status",
                data:{
                    "KL12345": {
                        name: "KL12345",
                        state: "Started"
                    }
                }
            },
            "Start": {
                item: "start"
            },
            "Stop": {
                item: "stop"
            }
        },
search = {
            'contentType':'application/vnd.microsoft.card.adaptive',
            'content':{
                '$schema':'http://adaptivecards.io/schemas/adaptive-card.json',
                'type':'AdaptiveCard',
                'version':'1.0',
                'body':[
                    {
                        'type':'Container',
                        'speak':'Hello!Are you looking for a flight or a hotel?',
                        'items':[
                        {
                            'type':'ColumnSet',
                            'columns':[
                                {
                                    'type':'Column',
                                    'size':'auto',
                                    'items':[
                                    {
                                        'type':'Image',
                                        'url':'https://placeholdit.imgix.net/~text?txtsize=65&txt=Adaptive+Cards&w=300&h=300',
                                        'size':'medium',
                                        'style':'person'
                                    }
                                    ]
                                },
                                {
                                    'type':'Column',
                                    'size':'stretch',
                                    'items':[
                                    {
                                        'type':'TextBlock',
                                        'text':'Hello!',
                                        'weight':'bolder',
                                        'isSubtle':true
                                    },
                                    {
                                        'type':'TextBlock',
                                        'text':'Are you looking for a flight or a hotel?',
                                        'wrap':true
                                    }
                                    ]
                                }
                            ]
                        }
                        ]
                    }
                ],
                'actions':[
                    // Hotels Search form         
                    {
                        'type':'Action.ShowCard',
                        'title':'Hotels',
                        'speak':'Hotels',
                        'card':{
                        'type':'AdaptiveCard',
                        'body':[
                            {
                                'type':'TextBlock',
                                'text':'Welcome to the Hotels finder!',
                                'speak':'Welcome to the Hotels finder!',
                                'weight':'bolder',
                                'size':'large'
                            },
                            {
                                'type':'TextBlock',
                                'text':'Please enter your destination:'
                            },
                            {
                                'type':'Input.Text',
                                'id':'destination',
                                'speak':'Please enter your destination',
                                'placeholder':'Miami, Florida',
                                'style':'text'
                            },
                            {
                                'type':'TextBlock',
                                'text':'When do you want to check in?'
                            },
                            {
                                'type':'Input.Date',
                                'id':'checkin',
                                'speak':'When do you want to check in?'
                            },
                            {
                                'type':'TextBlock',
                                'text':'How many nights do you want to stay?'
                            },
                            {
                                'type':'Input.Number',
                                'id':'nights',
                                'min':1,
                                'max':60,
                                'speak':'How many nights do you want to stay?'
                            }
                        ],
                        'actions':[
                            {
                                'type':'Action.Submit',
                                'title':'Search',
                                'speak':'Search',
                                'data':{
                                    'type':'hotelSearch'
                                }
                            }
                        ]
                        }
                    },
                    {
                        'type':'Action.ShowCard',
                        'title':'Flights',
                        'speak':'Flights',
                        'card':{
                        'type':'AdaptiveCard',
                        'body':[
                            {
                                'type':'TextBlock',
                                'text':'Flights is not implemented =(',
                                'speak':'Flights is not implemented',
                                'weight':'bolder'
                            }
                        ]
                        }
                    }
                ]
            }
    };

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function(session){
	var text = session.message.text;  
        
    if (session.message && session.message.value) {
        // A Card's Submit Action obj was received
        processSubmitAction(session, session.message.value);
        return;
    }

	if(text.startsWith("~S:") || text.startsWith("~L:")){
		processKeyCommand(session, text);			
	}
	else{        
		session.beginDialog('init');
	}
});

bot.dialog('init',[
    function (session) {       
        session.beginDialog('greetings');        
    }
]);

// Show Start up Message.
bot.dialog('greetings', [
    function (session) {
        var card =  greetingCard(session);        
        var msg = new builder.Message(session).addAttachment(card);                
        //session.send(msg).endDialog();
        builder.Prompts.text(session, msg);
    },
    function(session, results){        
        if(results.response === "Start"){
            var card = aboutYouCard(); 
            var msg = new builder.Message(session)
                .addAttachment(card);
            session.send(msg).endDialog();
            //builder.Prompts.text(session, msg);
        }
    } 
]);

function processKeyCommand(session, text){
    var name, action;
    session.userData.selectionType = text.startsWith("~S:") ? 'server' : 'lan';
    
    text = text.split(':')[1];

    if(text.trim() !== ''){
        name = text.split(' ')[0] || '';
        action = text.split(' ')[1] || '';

        if(name.trim()!== '' && action.trim()!== ''){
            session.userData.serverName = name;
            session.userData.action = action;

            session.beginDialog(session.userData.selectionType === 'server' ? 'serverAction' : 'lanAction');
        }
        else{
            session.send('Sorry!! I cant get your query. I need Server Name and Action to get you Details.. Type `shortcut` see the how to use command.');
        }            
    }
    else{
        session.send('Sorry!! I cant get your query. Please type `shortcut` to see list of action you can perform in bot..');
    }
}

function processSubmitAction(session, value) {
    var defaultErrorMessage = 'Please complete all parameters';    
    switch (value.type) {
        case 'aboutYou':
            // aboutYou, validate parameters
            if (validateAboutYou(value)) {
                // proceed to search
                session.beginDialog('listService', value);
            } else {
                session.send(defaultErrorMessage);
            }           
            break;    

        default:
            // A form data was received, invalid or incomplete since the previous validation did not pass
            session.send(defaultErrorMessage);
    }
}

function validateAboutYou(val){
    // todo - form validator to be done
    return true;
}

function greetingCard(session){
    return new builder.ThumbnailCard(session)
                .title('Hey!! Welcome to BotApp')
                .subtitle('New way of accessing Infra Network Component details')
                .text('Welcome to Bot Service. Here you can find All Server related information...\n\n At any point of conversion type following keywords.\n\n Exit - To Exit the conversation\n\n Help - To get help menu of botapp\n\n shortcut - shorcut commands for direct access of services')
                .images([
                    builder.CardImage.create(session, appRoot+ '/client/img/chatbot.png')
                ])
                .buttons([                
                    builder.CardAction.imBack(session, 'Start', "Get Started")
                ]);
}

function aboutYouCard(){
    return {        
            'contentType':'application/vnd.microsoft.card.adaptive',
            'content':{
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "0.5",
                "body": [
                    {
                    "type": "ColumnSet",
                    "columns": [
                        {
                        "type": "Column",
                        "size": 2,
                        "items": [
                            {
                            "type": "TextBlock",
                            "text": "Tell us about yourself...",
                            "weight": "bolder",
                            "size": "large"
                            },
                            {
                            "type": "TextBlock",
                            "text": "We just need a few details to know About you!",
                            "isSubtle": true,
                            "wrap": true
                            },
                            {
                            "type": "TextBlock",
                            "text": "Don't worry, we'll never share or sell your information.",
                            "isSubtle": true,
                            "wrap": true,
                            "size": "small"
                            },
                            {
                            "type": "TextBlock",
                            "text": "Your name",
                            "wrap": true
                            },
                            {
                            "type": "Input.Text",
                            "id": "myName",
                            "placeholder": "Last, First"
                            },
                            {
                            "type": "TextBlock",
                            "text": "Your email",
                            "wrap": true
                            },
                            {
                            "type": "Input.Text",
                            "id": "myEmail",
                            "placeholder": "youremail@example.com",
                            "style": "email"
                            }
                        ]
                        },
                        {
                        "type": "Column",
                        "size": 1,
                        "items": [
                            {
                            "type": "Image",
                            "url": appRoot+ "/client/img/about-you-logo.jpg",
                            "size": "auto"
                            }
                        ]
                        }
                    ]
                    }
                ],
                "actions": [
                    {
                    "type": "Action.Submit",
                    "title": "Submit",
                    "data": {
                        "type": "aboutYou"
                    }
                    }
                ]
                } 
            };
}

// Ask the user for their name and greet them by name.
bot.dialog('askName', [
    function (session) {
        builder.Prompts.text(session, 'May i know your name?');
    },
    function (session, results) {
    	session.userData.name = results.response;       
        session.send('Hello %s!!! Please select any one of below items.', results.response);   
        session.endDialog();     
    }
]);

// Ask the user for their name and greet them by name.
bot.dialog('server', [
    function (session) {
        session.send('Hey %s! Do select which detail you need to check under Server.', session.userData.name);
        builder.Prompts.choice(session, "Server:", server);
    },
    function (session, results) {        
        if(results.response){
            session.beginDialog(server[results.response.entity].item);
        }     
    }
]).triggerAction({
    matches: /^server$/i,
});

// Ask the user for their name and greet them by name.
bot.dialog('details', [
    function (session) {
        builder.Prompts.text(session, 'Please enter the Name of the Server.');        
    },
    function (session, results) {     
        
        if(results.response === "KL12345"){        	
        	var details = server.Details.data[results.response];
        	text = 'Details:\n\n	Name: '+details.name+'\n	Type: '+details.type+'\n	OutageDependency:'+details.OutageDependency+'\n	SubType: '+ details.SubType+'\n	Location: '+ details.Location;        
        
        	session.send(text);
        	builder.Prompts.text(session,'To go back type `Back`\n\nTo Exit type `Exit | End | Stop`');
        }
        else{
        	session.send('We cant get details for Server : %s you looking for', results.response);
        	session.endDialog();
        	session.beginDialog('retry');
        }            
    },
    function (session, results) {
    	if(results.response === "back" || results.response === "Back"){
    		session.endDialog();
    		session.beginDialog('server');
    	}
    	else if(results.response === "Exit" || results.response === "End" || results.response === "Stop"){
    		session.endDialog();    		
    	}
    }
]);

// Ask the user for their name and greet them by name.
bot.dialog('retry', [
    function (session) {
        builder.Prompts.confirm(session, 'Do you wish to try for another server.');        
    },
    function (session, results) {        
        if(results.response === "yes"){
        	session.endDialog();
        	session.beginDialog('details');
        }
        else{
        	session.endDialog();
        	session.beginDialog('server');
        }            
    }
]);

// Get General user input.
bot.dialog('getUserInfo', [
    function(session) {
        var msg = new builder.Message(session)
            .addAttachment(aboutYou);

        builder.Prompts.text(session, msg);
    },
    function(session, results) {
        session.send(results.response);
        session.endDialog()
    }
]);

// Add dialog to return main Menu in UX format
bot.dialog('listService', function (session) {
    var msg = new builder.Message(session);
    var components = [];
    msg.attachmentLayout(builder.AttachmentLayout.carousel)

    for(var i in menuItemsJson){
    	components.push(new builder.HeroCard(session)
            .title(menuItemsJson[i].title)
            .subtitle(menuItemsJson[i].subtitle)
            .text(menuItemsJson[i].text)
            .images([builder.CardImage.create(session, menuItemsJson[i].img)])
            .buttons([
                builder.CardAction.imBack(session, menuItemsJson[i].title, "Select")
            ]));
    }
    msg.attachments(components);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i });

// Add dialog for displaying list of shortcut available.
bot.dialog('shortcut', function (session) {
    session.endDialog();
    session.send('Use below shortcut for quick access\n\n	Server: ~S:<ServerName> <Details|Status|Start|Stop>\n	Lan: ~L:<LanName> <Details|Status>');
}).triggerAction({ matches: /^(shortcut|keys)/i });

// Add dialog for displaying all action of server.
bot.dialog('serverAction', function (session) {
    var name = session.userData.serverName, action = session.userData.action;

    if(action === "Details"){
    	var details = server.Details.data[name];
    	if(typeof details !== 'undefined'){
    		text = 'Details:\n\n	Name: '+details.name+'\n	Type: '+details.type+'\n	OutageDependency:'+details.OutageDependency+'\n	SubType: '+ details.SubType+'\n	Location: '+ details.Location;        
    
    		session.send(text);
            session.endDialog();
    	}        
    	else{
    		session.send('We cant get details for Server : %s you looking for', name);
        	session.endDialog();
    	}
    }
    else if(action === "Status"){
        var details = server.Status.data[name];
        if(typeof details !== 'undefined'){
            text = 'Details:\n\n    Name: '+details.name+'\n    Status: '+details.state;        
    
            session.send(text);
            session.endDialog();
        }        
        else{
            session.send('We cant get Status for Server : %s you looking for', name);
            session.endDialog();
        }
    }
    else if(action === "Start"){
        var details = server.Status.data[name];        
        if(typeof details !== 'undefined'){
            
            details.state = "Started";              
    
            session.send('Server %s is Started', name);
            session.endDialog();
        }        
        else{
            session.send('We cant Start the  Server : %s', name);
            session.endDialog();
        }
    }
    else if(action === "Stop"){
        var details = server.Status.data[name];
        if(typeof details !== 'undefined'){
            details.state = "Stopped";              
    
            session.send('Server %s is Stopped', name);
            session.endDialog();
        }        
        else{
            session.send('We cant Stop the  Server : %s', name);
            session.endDialog();
        }
    }
    else{
    	session.endDialog();
    }
});

// Add dialog for displaying all action of Lan.
bot.dialog('lanAction', function (session) {
    var name = session.userData.serverName, action = session.userData.action;

    if(action === "Details"){
    	var details = lan.Details.data[name];
    	
    	if(typeof details !== 'undefined'){
    		text = 'Details:\n\n	Name: '+details.name+'\n	Type: '+details.type+'\n	OutageDependency:'+details.OutageDependency+'\n	SubType: '+ details.SubType+'\n	Location: '+ details.Location;        
    
    		session.send(text);
            session.endDialog();
    	}
    	else{
    		session.send('We cant get details for Server : %s you looking for', name);
        	session.endDialog();
    	}
    	
    }
    else{
    	session.endDialog();
    }
});

// Show the Default Menu Option.
bot.dialog("mainMenu", [
    function(session){        
        builder.Prompts.choice(session, "Main Menu:", menuItems);
    },
    function(session, results){
        if(results.response){
            session.beginDialog(menuItems[results.response.entity].item);
        }
    }
])
.triggerAction({
    // The user can request this at any time.
    // Once triggered, it clears the stack and prompts the main menu again.
    matches: /^main menu$/i,
    confirmPrompt: "This will cancel your request. Are you sure?"
});


// Help Action.
// The dialog stack is cleared and this dialog is invoked when the user enters 'help'.
bot.dialog('help', function (session, args, next) {
    session.endDialog("This is a bot that can help. <br/>Please say 'next' to continue");
})
.triggerAction({
    matches: /^help$/i
});

// Exit the session.
bot.dialog('exit', function (session, args, next) {
    session.endDialog("This is converstation is Ended.");
})
.triggerAction({
    matches: /^(exit|Exit|End|end|stop|Stop)$/i
});

