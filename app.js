//Import required Node Modules
const restify= require('restify');
const builder= require('botbuilder');

//Import File based Modules
const globalActions=require('./globalActions.js');
const validateGeneralUser=require('./GeneralUserValidateUser.js');
const validateInternalUser=require('./InternalUserValidation.js')
const searchInternalDocument= require('./searchDocumentAndFindAnswerForInternalUser.js');
const searchGeneralDocument= require('./searchDocumentAndFindAnswerForGeneralUser.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

//ADDING ERROR EVENT LISTENER FOR SERVER
server.on('error', function (err) {
    if (err)
        throw err;
    console.log(err);
});

//=========================================================
// Bot Setup
//=========================================================

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector); 

//=========================================================
// Bots Global Actions
//=========================================================

//Regular Expression to Detect a query
const askQuery=/\bwhat|\bwhy\b|\bwho\b|\bwhom\b|\bwhen\b|\bhow|\bwhere|\bwhich|\bwhose\b|^can\b|^may\b|^shall\b|^do\b|^did\b|^does\b|^is\b|^will\b|^should\b|^are\b|^am\b|^let\b|tell me\b|i want to know|i would like to know|i am asking|i'm asking|give me|show me|\?/gi;
const askForVideoOrNot= /open video|watch video|show video|see video|video/gim
//global.collectUserDetail=false;
//Check wether user asks a question
bot.use({
    botbuilder: function (session, next) {
        var msg = session.message.text.toString().toLowerCase();
        if(msg.match(askForVideoOrNot))
            globalActions.checkUserMessageAndDoOperationsAccordingly(session, msg, next);

        else if(msg.match(askQuery))  //User ask a question
            globalActions.checkWetherUserAskingAQuestion(session, msg);
    
        //User only gives Search String
        else if(session.conversationData.userName && !msg.match( /thanks|thank you|^ok|^okay\b|goodbye|bye|tata|good night|see you|c u later|sayonara|yes|no/gi))
            globalActions.checkWetherUserAskingForInformationByKeywords(session, msg);

        else
            next();
    }
});
bot.beginDialogAction('sayThankYou','thankYouDialog', { matches: /thanks|thank you|^ok|^okay\b/i});
bot.beginDialogAction('waveoff','byeDialog',{ matches: /goodbye|bye|tata|good night|see you|c u later|sayonara/gi})
//Starting Root dialog

bot.dialog('/',[
    function(session){
        var logo= __dirname+'//Kingfisher-Interiors-Reference-Docs//KingfisherPLMLogo.PNG'
        var card = new builder.HeroCard(session)
        .images([
            builder.CardImage.create(session, logo)])
        .text("Hi, I am digital trainee assistant of "+"**"+"Kingfisher Interiors"+"**"+".\n\nI can help you in finding appropiate answer of your query regarding our product.")

        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);

        session.beginDialog('chooseTypeOfUser');
    }
]);
//Ask User wether he/she is Internal Employee or Vendor
bot.dialog('chooseTypeOfUser', [
    function(session){
        var msg = new builder.Message(session)
        .text("May I know whether you are an **" + "Internal User or General User?" + "**")
        .suggestedActions(
            builder.SuggestedActions.create(
                    session, [
                        builder.CardAction.imBack(session, "I am an Internal User", "Internal User"),
                        builder.CardAction.imBack(session, "I am a General User", "General User"),
                    ]
                ));
        builder.Prompts.text(session, msg);
    },
    function(session, results){
        var userType = results.response.toString().toLowerCase();
        if(userType.match(/internal/g)){
            session.conversationData.userType='Internal';
            session.beginDialog('internalUserIdentificationWithMail');
        }
        else if(userType.match(/external|venodr|general/g)){
            session.conversationData.userType='External';
            session.beginDialog('askUserName');
        }
        else{
            session.send("Sorry, I didn't understand what you are saying.\n\nPlease choose an option from below.");
            session.replaceDialog('chooseTypeOfUser');
        }

    }
]);

/************************************************
**********General User Section Starts************
 ***********************************************/
bot.dialog('askUserName',[
    function(session){
        if(session.conversationData.firstName)
                session.send("Hi "+"**"+session.conversationData.firstName+"**"+", tell me how can I help you?")
        else
            builder.Prompts.text(session,"May I know your "+"**"+'good name'+"**"+'?');
    },
    function(session, results){
        var userReply= results.response.toString().toLowerCase().trim();
        validateGeneralUser.validateUserName(session, userReply);
        session.send("Hi "+"**"+session.conversationData.firstName+"**"+", tell me how can I help you?");
    }
])

/************************************************
**********General User Section Ends************
 ***********************************************/


/************************************************
**********Internal User Section Starts************
 ***********************************************/
bot.dialog('internalUserIdentificationWithMail', [
    function (session) {
        if(session.conversationData.firstName)
            session.send("Hi "+"**"+session.conversationData.firstName+"**"+", tell me how can I help you?")
        else
            builder.Prompts.text(session, "Please share your **" + "Kingfisher Email ID" + "**");
    },
    function (session, results) {
        validateInternalUser.validateUserEmailIdByDomain(session,results);
    }
]);

// Mail Id verification When E-mail Is present //
bot.dialog('mailIdCheckingAtRoot', [
    function (session){
        validateInternalUser.validateUserEmailIdByDomain(session);
    }
]);
// ON FAULTY MAIL ID INPUT //
bot.dialog('onFalseMailIdRoot', [
    function (session) {
        session.send('I am unable to identify you as an internal user of '+'**'+'Kingfisher'+'**'+'.\n\nPlease Check your email id and enter again.');
        session.delay(1000);
        builder.Prompts.text(session, "Let me know your " + "**" + "Kingfisher Email ID" + "**" + " please");
    },
    function (session, results) {
        validateInternalUser.validateUserEmailIdByDomain(session, results);
    }
]);
// ON CORRECT MAIL ID INPUT //
bot.dialog('onCorrectMailIdRoot', [
    function (session) {
        validateInternalUser.getUserDetailsFromInternalEmplyeeFile(session);
    }
]);

bot.dialog('greetUserByFirstName',[
    function(session){
        session.send("Hi "+"**"+session.conversationData.firstName+"**"+", tell me how can I help you?")
    }
])

 /************************************************
**********General User Section Ends************
 ***********************************************/
// THE THANK YOU DILAOG PROMPT //
bot.dialog('thankYouDialog', [
    function (session) {
        session.send("It's my "+"**"+"pleasure"+"**"+" to help you!");
         // INITIATING THE CARD LAYOUT //
            var card = new builder.HeroCard(session)
            .title("Is there anything else"+"\n\n"+"I can do for you?")
             .buttons([
                builder.CardAction.imBack(session, 'Yes', 'Yes'),
                builder.CardAction.imBack(session, 'No', 'No')
            ]);
            var msg = new builder.Message(session).addAttachment(card);
            builder.Prompts.text(session, msg);
    },  
    function(session, results){
        var reply=results.response.toString().toLowerCase();
        if(reply.match(/yes|yup|sure|why not/g))
                session.beginDialog('askUserName');
        else if(reply.match(/no/g)){
            session.endConversation("Goodbye "+'**'+session.conversationData.firstName+'**'+", take care.");
        }
    }
]);

//The GOOd BYE Dialog
bot.dialog('byeDialog', [
    function (session) {
        var goodByeArray=["Take care.","Have a nice day.","Bye bye!","Goodbye, see you soon.",
                          "Bye, looking forward to our next meeting.","Bye, it was nice seeing you.",
                           "Bye, see you later.","Goodbye, have a nice day."];
    
        var length=goodByeArray.length;
        var randomBid=Math.floor(Math.random()*length);
        var bidMessage=goodByeArray[randomBid];
        exitIntent=0;
        session.endConversation(bidMessage);
    }
]);
