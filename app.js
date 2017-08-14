require('dotenv-extended').load();

var restify = require('restify'),
	//builder = require('botbuilder');
	builder = require('./core');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get(/^\/?.*/, restify.plugins.serveStatic({
    directory: __dirname
}));

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function(session){
	var text = session.message.text,
		name, action;

	if(text.startsWith("~S:") || text.startsWith("~L:")){
		session.userData.selectionType = text.startsWith("~S:") ? 'server' : 'lan';

		text = text.split(':')[1];
		
		name = text.split(' ')[0];
		action = text.split(' ')[1];

		session.userData.serverName = name;
		session.userData.action = action;

		session.beginDialog(session.userData.selectionType === 'server' ? 'serverAction' : 'lanAction');		
	}
	else{
		session.beginDialog('init');
	}
});



var menuItemsJson = [{
	title: "Server",
	subtitle: "You can view the status and you can manage start and stop state of server.",
	text: "Few details about the server.",
	img: "http://localhost:3978/client/img/servers.png"
},{
	title: "Database",
	subtitle: "You can view the status and you can manage start and stop state of server.",
	text: "Few details about the server.",
	img: "http://localhost:3978/client/img/db.png"
},{
	title: "Lan",
	subtitle: "You can view the status and you can manage start and stop state of server.",
	text: "Few details about the server.",
	img: "http://localhost:3978/client/img/lan-nw.jpg"
},{
	title: "Cluster",
	subtitle: "You can view the status and you can manage start and stop state of server.",
	text: "Few details about the server.",
	img: "http://localhost:3978/client/img/cluster.png"
}
];

// Main menu
var menuItems = { 
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
		"Status of Server": {
	        item: "status"
	    },
	    "Start Server": {
	        item: "start"
	    },
	    "Stop Server": {
	    	item: "stop"
	    }
	};


bot.dialog('init',[
    function (session) {       
        session.beginDialog('greetings');
        //session.beginDialog('mainMenuUX');
    },
    function (session) {        
        session.beginDialog('askName');
    },
    function (session) {        
        session.beginDialog('mainMenu');
    }
]);

// Show Start up Message.
bot.dialog('greetings', [
    function (session) {
        session.send('Welcome to KLM Bot Service. Here you can find All Server related information...');
        session.endDialog();
    }
]);

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

// Add dialog to return main Menu in UX format
bot.dialog('mainMenuUX', function (session) {
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

// Add dialog for displaying all action of Lan.
bot.dialog('lanAction', function (session) {
    var name = session.userData.serverName, action = session.userData.action;

    if(action === "Details"){
    	var details = lan.Details.data[name];
    	
    	if(typeof details !== 'undefined'){
    		text = 'Details:\n\n	Name: '+details.name+'\n	Type: '+details.type+'\n	OutageDependency:'+details.OutageDependency+'\n	SubType: '+ details.SubType+'\n	Location: '+ details.Location;        
    
    		session.send(text);
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
    matches: /^help$/i,
});
