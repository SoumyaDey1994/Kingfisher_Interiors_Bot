//Import required Node Modules
const builder= require('botbuilder');
const fs= require("fs");

//Import Third party node modules
const removeWords= require('remove-words');
const stringMatch= require('string-similarity');

module.exports={
    checkForAnswer: function(session, msg){
        var query= msg.split("?")[0];   //Remove ? mark from query
        module.exports.removeUnnecessaryWords(session,query);
    },
    // Remove unnecessary words from user Query
    removeUnnecessaryWords: function(session,query){
        var keywordArray=removeWords(query);
        console.log(keywordArray);
        var searchString=keywordArray.join(' ');
        module.exports.searchAgainstIndexFile(session, searchString);
    },
    //Read Contents of Index File
    searchAgainstIndexFile: function(session, searchString){
        const file=__dirname+'//Kingfisher-Interiors-Reference-Docs//Keywords Index Files//Internal_Doc_Search_Keywords.json';  //Path to Index JSOn File
        fs.readFile(file, 'utf8', function (err, data) {
            if (err) throw err;
            try{
                var indexList = JSON.parse(data);
                session.conversationData.index=indexList;   //Register index File in bot memory
                module.exports.separateAllTitles(session,indexList,searchString);
            }catch(exception){
                console.log("Exception Occured: "+exception);
                session.send("Sorry there is an error in getting response.\n\nPlease try after some time.");
            }
          });
    },
    //Separate all Titles of index file
    separateAllTitles: function(session,indexList,searchString){
        var noOfTitles= indexList.length;
        console.log(" Total No of Titles are: "+noOfTitles);

        session.conversationData.titles=[]; //Array to hold all titles
        for(var index=0; index<noOfTitles; index++)
            session.conversationData.titles.push(indexList[index].title);   //Push all titles of index file in an array
        module.exports.matchSearchStringWithTitles(session, searchString);
    },
    //Search through the titles and find match with serach string
    matchSearchStringWithTitles: function(session, searchString){
        var matchResult= stringMatch.findBestMatch(searchString, session.conversationData.titles);  //Match the search string with all titles
        console.log('Best Match: \n'+JSON.stringify(matchResult.bestMatch));    //Print the best match result

        var ListOfMatchConfidence= matchResult.ratings;
        ListOfMatchConfidence.sort((a,b)=>{  //sort all matches based on confidence in decending order of confidence
            return parseFloat(b.rating)-parseFloat(a.rating);
        });

        var topResults= ListOfMatchConfidence.slice(0,3); //get Top 3 Result having highest confidence score
        console.log("Top Results:\n"+topResults.join('\n'));
        console.log("Rating:\n"+topResults[0].rating);
        
        module.exports.filterResults(session, topResults);  //Get Relevent Results in HeroCard
    },
    //Filter Top Results aginst cutOff
    filterResults: function(session, topResults){
        const relevenceCutoff= 60;   //Thresold limit for relevent answer's eligibility
        for(var i=0; i<topResults.length; i++){      //Filter Results base on cutoff
            var score=Math.floor(topResults[i].rating*100);
            console.log("Score"+i+": "+score);
            if(score< relevenceCutoff){
                topResults.splice(i,1);     //Remove non-relevent result
                i--;
            }
        }
        console.log("Top Results after refinement:\n"+topResults.join('\n'));
        module.exports.getResultsInCards(session, topResults);
    },
    //Get cards for relevent search results
    getResultsInCards: function(session, topResults){
       
        var indexOfSerachResult, detailedInfo=[];
        var noOfTopScoreResults=topResults.length;  //Get No of to results
        console.log("\n No of top result: "+noOfTopScoreResults);

        for(var i=0; i<noOfTopScoreResults; i++){
            indexOfSerachResult=session.conversationData.titles.indexOf(topResults[i].target);
            detailedInfo.push(session.conversationData.index[indexOfSerachResult]);
        }
        var cards=module.exports.getResultsIncards(session,detailedInfo,noOfTopScoreResults);
        if(cards==null)
            session.send("Sorry "+'**'+session.conversationData.firstName+'**'+", currently I dont have any answer for your query."+
                        "\n\nI will get back to you shortly");
        else{
                var response=new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel).attachments(cards);
                session.send(response);
        }

        session.conversationData.titles=[]; //Clear info from Bot Memory
        session.conversationData.index=[];
    },
    //get cards containing results
    getResultsIncards: function(session,detailedInfo,noOfTopScoreResults){
        switch(noOfTopScoreResults){
            case 1:
                    var card=module.exports.getCard(session,detailedInfo[0]);
                    return [card];
                    break;
            case 2:
                    var card1=module.exports.getCard(session,detailedInfo[0])
                    var card2=module.exports.getCard(session,detailedInfo[1])
                    return [card1, card2];
                    break;
            case 3:
                    var card1=module.exports.getCard(session,detailedInfo[0])
                    var card2=module.exports.getCard(session,detailedInfo[1])
                    var card3=module.exports.getCard(session,detailedInfo[2])
                    return [card1, card2, card3];
                    break;
            default:
                    return null;
        }
    },
    //Fillup the details in cards
    getCard: function(session,detailedInfo){
        if(detailedInfo.file==='Part1'){
            var card=new builder.HeroCard(session)
                    .title(detailedInfo.title)
                    .subtitle("Division: "+'**'+detailedInfo.file+'**'+'\n\n'+'Page No: '+"**"+detailedInfo.page+'**'+'\n\n'+'Section No: '+'**'+detailedInfo.section+"**")
                    .text(detailedInfo.description)
                    .buttons([
                        builder.CardAction.openUrl(session,"http://localhost:24652/index.html?page="+detailedInfo.page,'View Document')
                    ]);
            return card;
            }
        else{
            var card=new builder.HeroCard(session)
            .title(detailedInfo.title)
            .subtitle("Division: "+'**'+detailedInfo.file+'**'+'\n\n'+'Page No: '+"**"+(detailedInfo.page)+'**'+'\n\n'+'Section No: '+'**'+detailedInfo.section+"**")
            .text(detailedInfo.description)
            .buttons([
                builder.CardAction.openUrl(session,"http://localhost:24644/index.html?page="+detailedInfo.page,'View Document')
            ]);
            return card;
        }
    }
}