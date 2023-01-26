import db from "./firebaseConfig.js";
import { encrypt } from "./config.js"

let current_chat_driver = "";

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
                                            <button class="btn btn-outline-success" id=`+ element.driver + `  onclick="openChat(this.id); closeChat();">` + user_name + `</button>
                                        </ul>
                                    </div>
                                    <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                </div>`;
                                document.getElementById('attending_panels').appendChild(panel);
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
                                document.getElementById("driving").style.display = "block";
                                document.getElementById('noneToDisplay').style.display = "none";
                                emptyChat = true;
                                let panel = document.createElement('div');
                                panel.className = 'col-md-4 mx-auto';
                                panel.innerHTML = `
                                <div class="card border-primary mb-3">
                                    <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
                                    <h6 class="card-header">`+ doc.data().name + `</h6>
                                    <div class="card-body">
                                        <ul class="list-group list-group-flush">
                                            <span style="text-align: center; color: white;" class="bold">Your Passenger Chat </span>
                                            <button class="btn btn-outline-success" id=`+ element.passengerId + `  onclick="openChat(this.id); closeChat();">` + user_name + `</button>
                                        </ul>
                                    </div>
                                    <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                </div>`;
                                document.getElementById('driving_panels').appendChild(panel);
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
                filteredUserMessages = doc.data().messages.filter(obj => obj.to == driverId);
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
            filteredDriverMessages = messagesFromDriver.filter(obj => obj.to == firebase.auth().currentUser.uid);
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
                    message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
                })
            });

            db.collection('users').doc(driverId).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    from: firebase.auth().currentUser.uid,
                    to: driverId,
                    time: firebase.firestore.Timestamp.now(),
                    message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
                })
            });
            openChat(driverId);
            //clear textarea after message submission
            const textarea = document.getElementById('messageText');
            textarea.value = '';
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        alert("Something went wrong.");
        console.log("No such document! ", error);
    });
}
window.sendChat = sendChat