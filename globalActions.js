//Import required Node Modules
const builder= require('botbuilder');

//Import File Based Modules
const searchInternalDocument= require('./searchDocumentAndFindAnswerForInternalUser.js');
const searchGeneralDocument= require('./searchDocumentAndFindAnswerForGeneralUser.js');

module.exports={
    checkUserMessageAndDoOperationsAccordingly: function(session, msg, next){
        if(msg==="don't open video"){
            if(session.conversationData.userType==='Internal' && session.conversationData.firstName && session.conversationData.category==='material')
                session.send("Ok as you wish "+'**'+session.conversationData.firstName+'**'+'.');
            else
                next();
        }
        else if(msg.match(/open video|watch video|show video|see video|video/gim)){
            if(session.conversationData.userType==='Internal' && session.conversationData.firstName && session.conversationData.category==='material')
                    openTheVideo(session);
            else
                session.send("I can help you with functionalities and activities which sourcing team has to complete in FlexPLM." + "\n\nPlease ask a relevent question!");
        }
        
    },

    checkWetherUserAskingAQuestion: function(session, msg, next){
        if(session.conversationData.userType){
            if(session.conversationData.userName){
                    session.conversationData.userQuery=msg; //Register User Query to BOT's Memory
                    if(session.conversationData.userType==='Internal')
                        searchInternalDocument.checkForAnswer(session, msg);
                    else    
                        searchGeneralDocument.checkForAnswer(session, msg);
            }
            else{
                if(session.conversationData.userType==='Internal')
                    session.beginDialog('internalUserIdentificationWithMail');
                else
                    session.beginDialog('askUserName');
            }
        }
        else
            session.beginDialog('chooseTypeOfUser');
    },

    checkWetherUserAskingForInformationByKeywords: function(session, msg){
        session.conversationData.userQuery=msg; //Register User Query to BOT's Memory
        if(session.conversationData.userType==='Internal')
            searchInternalDocument.checkForAnswer(session, msg);
        else    
            searchGeneralDocument.checkForAnswer(session, msg);
    }
}

//Function to open the video
function openTheVideo(session){
    // INITIATING THE VIDEO CARD WITH VIDEO //
        var videoCard = new builder.VideoCard(session)
                    .title("Material Management Tutorial")  //Title Of The Video
                    .media([
                        { url: __dirname + "/Material Management_v1.0.mp4"} //path of the Video File
                    ]);
        var response = new builder.Message(session).addAttachment(videoCard);
        session.send(response);
}