


const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); 
const dotenv = require('dotenv');
dotenv.config();
// Create new express app 
const app = express(); 
const twilio = require('twilio'); 

// How twilio will authenticate who i am 
const client = new twilio('ACcf6e85c90b5366ce1ea60bebcf0b0230','bf8311758d6ed4444841f05208342733')

//connect to mongodb database 
const URI = `mongodb+srv://anvakondak:${process.env.MONGOPASS}@cluster0.by2fn.mongodb.net/EW-chat?retryWrites=true&w=majority`;
mongoose.connect(URI, {useNewUrlParser : true, useUnifiedTopology: true}).then((result)=>{
    console.log('connected to db'); 
}).catch((err)=> console.log(err)); 

let MessageSchema = new mongoose.Schema({
    userNumber : String, 
    takeSurvey : String, 
    wasConnectedReentry : String, 
    whoConnected : String, 
    whatHousing : String, 
    whatOrganization : String, 
    onSupervision: String, 
    wasReferredBySupervisor : String, 
    basis : String, 
    heardOfDVSJA : String,
    wasResentencingSubmitted : String, 
    explainSupportServices : String
})

let Message = mongoose.model('Message', MessageSchema); 

//Ignoring the first key 'userNumber' which was updated only when creating a new document in the 'else' condition. 
const mongokeynames = [
  'takeSurvey', 
  'wasConnectedReentry',
  'whoConnected',
  'whatHousing',
  'whatOrganization',
  'onSupervision',
  'wasReferredBySupervisor',
  'basis',
  'heardOfDVSJA',
  'wasResentencingSubmitted',
  'explainSupportServices'];

const questions = [
  'Were you connected to any reentry services prior to release?  (Yes/No)', 
  'if yes, who connected you to these services?  (A-lawyer, B-yourself, C-referral)',
  'What type of services are you receiving? (A-housing, B-counseling, C-employment, D-healthcare, E-other). If other, please explain.', 
  'What organization is providing these services?',
  'Are you on any post Supervision? (Yes/No).',
  'Has your Parole or Supervising Officer referred you to any services? (Yes/No)', 
  'This section will now cover questions on DVSJA (Domestic  Violence Survivors Justice Act). What was the basis of your release? ( A-parole/PRS, B-clemency, C-DVSJA)', 
  'Have you heard of the DVSJA? (Yes/No)', 
  'If yes, were you able to submit an application for resentencing? ( Yes/No)', 
  'If yes, were you provided any support services durning this process? \n If no, can you explain why a DVSJA application was not submitted on your behalf?', 
  'Thank you for your feedback!'
]; 

// Puts requests in correct format so we can use them in our operations 
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (req, res) => {
    res.end(); 
})


app.post('/reply', (req, res) => {
    let from = req.body.From;
    let to = req.body.To;
    let body = req.body.Body;

    Message.find({userNumber: from}, (err, message) => {
      console.log(message);
      if (message.length !== 0) {

        for (let i = 0; i < questions.length; i++) {

          if (!message[0][mongokeynames[i]]) {
            Message.findByIdAndUpdate(message[0]._id, {"$set" : { [mongokeynames[i]] : body}}, { "new": true, "upsert": true }, () => {
              client.messages.create({
                body: questions[i],
                to: `${from}`,
                from: `${to}`
              })
              res.end();
            })
            break;  
          }
        }
       
      } 
      //If number that just texted us isnt in the database, save it to the database collection and text back the first question. 
      else {
          let newMessage = new Message();
          newMessage.userNumber = from;
          newMessage.save(() => {
            client.messages.create({
              body: 'Hey there! Type any character when you are ready to take the survey.',
              to: `${from}`,
              from: `${to}`
            })
  
            res.end();
          })
      }
    })
  })

app.listen(3000, ()=> {
    console.log('server connected'); 
})

