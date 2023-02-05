import db from "./firebaseConfig.js";
import { encrypt } from "./config.js"

let current_chat_driver = "";
let rateDriverId = "";
let ratePassengerId = "";
let theEventId = "";

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        document.getElementById("username").innerHTML = "Hey " + firebase.auth().currentUser.displayName;
        document.getElementById('noneToDisplay').innerHTML = "Loading...";
        populateEvents();
        setTimeout(() => {
            document.getElementById('noneToDisplay').innerHTML = "It looks like your chat page is empty.";
        }, 3500); 
    }
});

function populateEvents() {
    //events attending
    db.collection('users').doc(firebase.auth().currentUser.uid).get().then((doc) => {
        if (doc.exists) {
            if (doc.data().eventsAttended) {
                let eventsAttended = doc.data().eventsAttended; 
                eventsAttended.forEach(element => {                    
                    db.collection('users').doc(element.driver).get().then((doc) => {
                        let user_name = "";
                        if (doc.exists) {
                            user_name = doc.data().name;
                        }
                        db.collection('events').doc(element.eventId).get().then((doc) => {
                            if (doc.exists) {
                                let date = doc.data().date_time.split(" ");
                                let currentDate = new Date();
                                currentDate = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
                                if(date[0] >= currentDate){
                                    document.getElementById("attending").style.display = "block";
                                    document.getElementById('noneToDisplay').style.display = "none"; 
                                    let panel = document.createElement('div');
                                    panel.className = 'col-md-4 mx-auto';
                                    panel.innerHTML = `
                                    <div class="card border-primary mb-3">
                                        <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
                                        <h6 class="card-header">`+ doc.data().name + `</h6>
                                        <div class="card-body">
                                            <ul class="list-group list-group-flush">
                                                <span style="text-align: center; color: white;" class="bold">Your Driver Chat </span>
                                                <button class="btn btn-outline-success" id=`+ element.driver + `  onclick="openChat(this.id); closeChat(); setEventId('`+ element.eventId +`');">` + user_name + `</button>
                                            </ul>
                                        </div>
                                        <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                    </div>`;
                                    document.getElementById('attending_panels').appendChild(panel);
                                } 
                                else{
                                    document.getElementById("attended").style.display = "block";
                                    document.getElementById('noneToDisplay').style.display = "none";
                                    let panel = document.createElement('div');
                                    panel.className = 'col-md-4 mx-auto';
                                    panel.innerHTML = `
                                    <div class="card border-primary mb-3">
                                        <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
                                        <h6 class="card-header">`+ doc.data().name + `</h6>
                                        <div class="card-body">
                                            <ul class="list-group list-group-flush">
                                                <span style="text-align: center; color: white;" class="bold">Your Driver Chat </span>
                                                <button class="btn btn-outline-success" id=`+ element.driver + `  onclick="openChat(this.id); closeChat(); setEventId('`+ element.eventId +`');">` + user_name + `</button>
                                                <br><span style="text-align: center; color: white;" class="bold">Rate Your Driver </span>
                                                <button class="btn btn-outline-primary" id=`+ element.driver + ` onclick="setDriverId(this.id); closeRate(); setEventId('`+ element.eventId +`');"> Rate </button>
                                            </ul>
                                        </div>
                                        <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                    </div>`;
                                    document.getElementById('attended_panels').appendChild(panel);
                                    document.getElementById("sendBtn").style.display = "none";
                                    document.getElementById("messageText").disabled = true;
                                }                               
                            }
                        }).catch((error) => {
                            alert("Error getting document.");
                            console.log("Error getting document:", error);
                        });
                        
                    }).catch((error) => {
                        alert("Error getting document.");
                        console.log("Error getting document:", error);
                    });
                });
            }
            if (doc.data().eventPassanger) {
                let eventPassanger = doc.data().eventPassanger;  
                eventPassanger.forEach(element => {
                    let user_name = "";
                    db.collection('users').doc(element.passengerId).get().then((doc) => {
                        if (doc.exists) {
                            user_name = doc.data().name
                        }
                        db.collection('events').doc(element.eventId).get().then((doc) => {
                            if (doc.exists) {
                                let date = doc.data().date_time.split(" ");
                                let currentDate = new Date();
                                currentDate = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
                                if(date[0] >= currentDate){
                                    document.getElementById("driving").style.display = "block";
                                    document.getElementById('noneToDisplay').style.display = "none";
                                    let panel = document.createElement('div');
                                    panel.className = 'col-md-4 mx-auto';
                                    panel.innerHTML = `
                                    <div class="card border-primary mb-3">
                                        <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
                                        <h6 class="card-header">`+ doc.data().name + `</h6>
                                        <div class="card-body">
                                            <ul class="list-group list-group-flush">
                                                <span style="text-align: center; color: white;" class="bold">Your Passenger Chat </span>
                                                <button class="btn btn-outline-success" id=`+ element.passengerId + `  onclick="openChat(this.id); closeChat(); setEventId('`+ element.eventId +`');">` + user_name + `</button>
                                            </ul>
                                        </div>
                                        <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                    </div>`;
                                    document.getElementById('driving_panels').appendChild(panel);
                                }
                                else{
                                    document.getElementById("attended").style.display = "block";
                                    document.getElementById('noneToDisplay').style.display = "none";
                                    let panel = document.createElement('div');
                                    panel.className = 'col-md-4 mx-auto';
                                    panel.innerHTML = `
                                    <div class="card border-primary mb-3">
                                        <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
                                        <h6 class="card-header">`+ doc.data().name + `</h6>
                                        <div class="card-body">
                                            <ul class="list-group list-group-flush">
                                                <span style="text-align: center; color: white;" class="bold">Your Passenger Chat </span>
                                                <button class="btn btn-outline-success" id=`+ element.passengerId + `  onclick="openChat(this.id); closeChat(); setEventId('`+ element.eventId +`');">` + user_name + `</button>
                                            </ul>
                                        </div>
                                        <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                    </div>`;
                                    document.getElementById('attended_panels').appendChild(panel);
                                    document.getElementById("sendBtn").style.display = "none";
                                    document.getElementById("messageText").disabled = true;
                                }
                            }
                        }).catch((error) => {
                            alert("Error getting document.");
                            console.log("Error getting document:", error);
                        });                            
                    }).catch((error) => {
                        alert("Error getting document.");
                        console.log("Error getting document:", error);
                    });
                });
            }
        }        
    }).catch((error) => {
        alert("Error getting document.");
        console.log("Error getting document:", error);
    });
}
window.populateEvents = populateEvents

function closeChat() {
    if (document.getElementById('chatWindow').style.display == 'block') {
        document.getElementById("chatWindow").style.display = "none";
    }
    else {
        document.getElementById("chatWindow").style.display = "block";
    }
}
window.closeChat = closeChat;

let message_count = 0;
function openChat(driverId) {

    db.collection('users').doc(firebase.auth().currentUser.uid).onSnapshot((doc) => {
        if (message_count < doc.data().messages.length) {
            message_count = doc.data().messages.length;
            openChat(current_chat_driver);
        }
    });
    
    current_chat_driver = driverId;
    let filteredDriverMessages = [];
    let filteredUserMessages = [];

    //load messages from user
    db.collection('users').doc(firebase.auth().currentUser.uid)
        .get()
        .then((doc) => {
            if (doc.exists) {
                filteredUserMessages = doc.data().messages.filter(obj => obj.to == driverId && obj.eventId == theEventId);
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

    //load messages from Driver
    db.collection('users').doc(driverId).get().then((doc) => {
        if (doc.exists) {
            document.getElementById('chatMessages').innerHTML = '';
            let messagesFromDriver = doc.data().messages;
            filteredDriverMessages = messagesFromDriver.filter(obj => obj.to == firebase.auth().currentUser.uid && obj.eventId == theEventId);
            let allMessagesUnsorted = filteredDriverMessages.concat(filteredUserMessages);
            let allMessages = allMessagesUnsorted.sort((a, b) => a.time.seconds - b.time.seconds);
            for (let i = 0; i < allMessages.length; i++) {

                var newdiv = document.createElement('div');
                if (allMessages[i].to != driverId) {
                    newdiv.setAttribute('id', 'chatBoxLeft');
                    newdiv.classList = "col-sm-6";
                }
                else {
                    newdiv.setAttribute('id', 'chatBoxRight');
                    newdiv.classList = "col-sm-6";
                }
                const dFormat = new Date(allMessages[i].time.toDate());
                newdiv.innerHTML = '<p>' + CryptoJS.AES.decrypt(allMessages[i].message, encrypt).toString(CryptoJS.enc.Utf8) + '<br>' + dFormat.getHours() + ":" + dFormat.getMinutes() + ", "+ dFormat.toDateString() +'</p>';
                document.getElementById('chatMessages').appendChild(newdiv);
            }
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        alert("Something went wrong.");
        console.log(error);
    });
}
window.openChat = openChat;

function sendChat(driverId) {
    driverId = current_chat_driver;
    db.collection('users').doc(firebase.auth().currentUser.uid).get().then((doc) => {
        if (doc.exists) {
            db.collection('users').doc(firebase.auth().currentUser.uid).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    from: firebase.auth().currentUser.uid,
                    to: driverId,
                    time: firebase.firestore.Timestamp.now(),
                    message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString(),
                    eventId: theEventId
                })
            });

            db.collection('users').doc(driverId).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    from: firebase.auth().currentUser.uid,
                    to: driverId,
                    time: firebase.firestore.Timestamp.now(),
                    message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString(),
                    eventId: theEventId
                })
            });
            openChat(driverId);
            //clear textarea after message submission
            const textarea = document.getElementById('messageText');
            textarea.value = '';
        } else {
            alert("Something went wrong.");
            console.log("No such document!");
        }
    }).catch((error) => {
        alert("Something went wrong.");
        console.log("No such document! ", error);
    });
}
window.sendChat = sendChat

function setDriverId(driverId) {
    rateDriverId = driverId;
}
window.setDriverId = setDriverId;

function setPassengerId(passengerId) {
    ratePassengerId = passengerId;
}
window.setPassengerId = setPassengerId;

function setEventId(eventId) {
    theEventId = eventId;
}
window.setEventId = setEventId;

function closeRate() {
    if (document.getElementById('rate').style.display == 'block') {
        document.getElementById("rate").style.display = "none";
    }
    else {
        document.getElementById("rate").style.display = "block";
    }
}
window.closeRate = closeRate;

function addRate() {
    let rate = document.getElementById("rateInput").value;
    if(rate > 0 && rate < 6){
        db.collection('users').doc(rateDriverId).get().then((doc) => {
            if (doc.exists) {
                let rateNum, allRates;
                let rated = false, firstRate = false;
                if(!doc.data().ratedEvent){
                    firstRate = true;
                }
                else{
                    for(let i=0; i<doc.data().ratedEvent.length; i++){
                        if(doc.data().ratedEvent[i].eventId == theEventId)
                            rated = true;
                    }
                }
                if(!rated || firstRate){
                    if (isNaN(doc.data().numberOfRates)){
                        rateNum = parseFloat(1);
                        allRates = parseFloat(rate);
                    }
                    else{
                        rateNum = parseFloat(doc.data().numberOfRates) + 1;
                        allRates = parseFloat(doc.data().rateTotal) + parseFloat(rate);
                    }
                    let avgRounded = Math.round((allRates / rateNum) * 100) / 100;                    
                    db.collection('users').doc(rateDriverId).update({
                        ratedEvent: firebase.firestore.FieldValue.arrayUnion({
                            eventId: theEventId
                        }),
                        driverRate: avgRounded,
                        numberOfRates: rateNum,
                        rateTotal: allRates
                    });
                    alert("Thanks for the rate.");
                }
                else{
                   alert("You have reated this driver for this event.");
                }      
                document.getElementById("rateInput").value = "";          
            } else {
                alert("Something went wrong.");
                console.log("No such document!");
            }
        }).catch((error) => {
            alert("Something went wrong.");
            console.log("No such document! ", error);
        });
    }
    else{
        alert("Please enter rate range between 1 and 5");
    }
}
window.addRate = addRate;