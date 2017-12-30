
//Array containing unnecessary word input in User Input
const unnecesaryPatternsInUserName=['hi','hello','hey','hi,','hello,','hey,','i','i\'m','my','name','is','myslef','this','its','am',',','from','no','yes'];

module.exports={
    //Validate user name
    validateUserName: function(session, userReply){
        var alphanumericRegex='^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$';
        var specialCharCheck=/\`|\~|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\+|\=|\[|\{|\]|\}|\||\\|\<|\,|\.|\>|\?|\/|\;|\:|\"/g;
        if(!isNaN(userReply)||userReply.match(alphanumericRegex)||userReply.match(specialCharCheck))
        {
            session.send("You have entered an "+'**'+'Invalid'+'**'+" name."+"Please tell me your "+'**'+'Good Name'+'**'+" correctly");
            session.replaceDialog('askUserName');
        }
        else{
            userReply=module.exports.removeUnnecessaryWordsFromName(session, userReply);
            if(userReply==='')
                session.replaceDialog('askUserName');
            else{
                session.conversationData.userName=userReply;
                session.conversationData.firstName= userReply.split(" ")[0];
                //collectUserDetail=true;
            }
        }
    },
    //Delete Unnecessary Words From Name Response
    removeUnnecessaryWordsFromName: function(session,userGoodName){
        var nameArray=userGoodName.toLowerCase().split(" ");
        for(var i=0; i<nameArray.length;i++){
            if(unnecesaryPatternsInUserName.includes(nameArray[i])){
                nameArray.splice(i,1);
                i--;
            }
            else
                nameArray[i]=(nameArray[i].charAt(0).toUpperCase() + nameArray[i].slice(1).toLowerCase()); //Convert First Letter of Word to Uppercase and rest to Lowercase
            }
        userGoodName=nameArray.join(" ");
        console.log("User Name: "+userGoodName);
        return userGoodName;    //return actual name of user
    }
}