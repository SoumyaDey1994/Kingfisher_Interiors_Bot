var builder = require('botbuilder');
var fs = require('fs');

module.exports={
    
validateUserEmailIdByDomain: function(session, results){

        var mailBool = false;
        session.userData.dummyMailResp = results.response.toString().toLowerCase().trim();
        const regex8 = /@kingfisher.com/g;
        
        if(session.userData.dummyMailResp.match(regex8))
                mailBool = true;

        if (mailBool === true) {
            session.beginDialog('onCorrectMailIdRoot');
        }
        else {
            session.send("The domain name should be " + "**" + "@kingfishar.com" + "**" + ".\nPlease check your input and re-enter.");
            session.beginDialog('onFalseMailIdRoot');
        }
    },

getUserDetailsFromInternalEmplyeeFile: function(session){
    
    var mail = session.userData.dummyMailResp.toString();
    var checkBool = false;

    var content = fs.readFileSync(__dirname + "//internalEmployeeDetails.json");
    var mailContener = JSON.parse(content);

    mailContener.forEach(function(element) {
        if(element.mail_address.toString().toLowerCase() === mail){
            session.conversationData.userName= element.name;
            session.conversationData.firstName = element.name;
            checkBool = true;
        }
    }, this);

    if(checkBool == true)
        session.beginDialog('greetUserByFirstName');
    else
        session.beginDialog('onFalseMailIdRoot');
    
},
   
}