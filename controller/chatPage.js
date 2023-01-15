import db from "./firebaseConfig.js";
import { encrypt } from "./config.js"

let numOfMessages = 0;
let current_chat_driver = ""

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        // User is signed in.
        console.log("hello", user)

        document.getElementById("username").innerHTML = "Hey " + firebase.auth().currentUser.displayName

        populateEvents();

    } else {
        // No user is signed in.

    }
});

function populateEvents() {
    //events attending
    let user_name = "";
    db.collection('users').doc(firebase.auth().currentUser.uid).get().then((doc) => {
        user_name = doc.data().name
        if (doc.exists) {
            if (doc.data().eventsAttended) {
                let eventsAttended = doc.data().eventsAttended;  
                eventsAttended.forEach(element => {
                    
                    db.collection('users').doc(element.driver).get().then((doc) => {
                        if (doc.exists) {
                            user_name = doc.data().name
                        }
                        db.collection('events').doc(element.eventId).get().then((doc) => {
                            if (doc.exists) {
                                document.getElementById("attending").style.display = "block";
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
            let array_split = [];
            let events_driven = doc.data().eventPassanger;
            if (doc.data().eventPassanger) {
                events_driven.forEach(element => {
                    let event_driver_array = element.split("_");
                    if (array_split.some(e => e[0] === event_driver_array[0])) {
                        console.log("duplicate")
                    } else {
                        array_split.push(event_driver_array);
                        db.collection('events').doc(event_driver_array[0]).get().then((doc) => {
                            if (doc.exists) {
                                //user_name = doc.data().name
                                document.getElementById("driving").style.display = "block";
                                let panel = document.createElement('div');
                                panel.setAttribute("id", event_driver_array[0]);
                                panel.className = 'col-md-4 mx-auto';
                                events_driven.forEach(e => {
                                    let user_name = "";
                                    let event_driver = e.split("_");
                                    if (event_driver[0] == event_driver_array[0]) {
                                        db.collection('users').doc(event_driver[1]).get().then((d) => {
                                            if (d.exists) {
                                                user_name = d.data().name
                                            }
                                            panel.innerHTML = `
                                            <div class="card border-primary mb-3">
                                                <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
                                                <h6 class="card-header">`+ doc.data().name + `</h6>
                                                <div class="card-body">
                                                    <ul class="list-group list-group-flush">
                                                        <span style="text-align: center; color: white;" class="bold">Your Passenger Chat </span>
                                                        <button class="btn btn-outline-success" id=`+ event_driver[1] + ` onclick="openChat(this.id); closeChat();">` + user_name + `</button>
                                                    </ul>
                                                </div>
                                                <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
                                            </div>`;
                                        }).catch((error) => {
                                            alert("Error getting document.");
                                            console.log("Error getting document:", error);
                                        });
                                    }
                                });
                                document.getElementById('driving_panels').appendChild(panel);
                            }
                        }).catch((error) => {
                            alert("Error getting document.");
                            console.log("Error getting document:", error);
                        });
                    }
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
function openChat(driverId, eventID) {

    db.collection('users').doc(firebase.auth().currentUser.uid).onSnapshot((doc) => {
        if (message_count < doc.data().messages.length) {
            /* Message from other passenger will trigger
                this check too. Not permanent solution */
            console.log("change detected");
            message_count = doc.data().messages.length
            openChat(driverId, eventID);
        }
    });

    current_chat_driver = driverId;
    let filteredDriverMessages = [];
    let filteredUserMessages = [];

    //load messages from user

    //let eid = document.getElementById('ID').value;
    
    db.collection('users').doc(firebase.auth().currentUser.uid)
        .get()
        .then((doc) => {
            if (doc.exists) {
                //alert(eid);
                //if(doc.data().messages[10].eventId == eid){
                    let messagesFromUser = doc.data().messages;

                    filteredUserMessages = messagesFromUser.filter(obj => obj.to == driverId);                    
                //}
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

    //load messages from Driver

    db.collection('users').doc(driverId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                document.getElementById('chatMessages').innerHTML = '';
                let messagesFromDriver = doc.data().messages;
                filteredDriverMessages = messagesFromDriver.filter(obj => obj.to == firebase.auth().currentUser.uid)
                let allMessagesUnsorted = filteredDriverMessages.concat(filteredUserMessages)
                let allMessages = allMessagesUnsorted.sort((a, b) => a.time.seconds - b.time.seconds)
                numOfMessages = allMessages.length
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
                    //newdiv.innerHTML = '<p>' + plaintextArray + '<br>' + dFormat.getHours() + ":" + dFormat.getMinutes() + ", "+ dFormat.toDateString() +'</p>';
                    document.getElementById('chatMessages').appendChild(newdiv);
                }

            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            alert("Error getting document.");
            console.log(error);
        });

}
window.openChat = openChat;


let set = false;

function sendChat(driverId) {

    driverId = current_chat_driver;

    // if(!set){
    //     db.collection('passengerChat').doc(firebase.auth().currentUser.uid).set({
    //         from: firebase.auth().currentUser.uid,
    //         to: driverId,
    //         time: firebase.firestore.Timestamp.now(),
    //         //message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
    //         message: document.getElementById("messageText").value.toString()
    //     });
    
    //     db.collection('driverChat').doc(driverId).set({
    //         from: firebase.auth().currentUser.uid,
    //         to: driverId,
    //         time: firebase.firestore.Timestamp.now(),
    //         //message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
    //         message: document.getElementById("messageText").value.toString()
    //     });
    //     set = true;
    // }
    // else{
    //     db.collection('passengerChat').doc(firebase.auth().currentUser.uid).get().then((doc) => {
    //         if (doc.exists) {
    
    //             db.collection('passengerChat').doc(firebase.auth().currentUser.uid).update({
    //                 messages: firebase.firestore.FieldValue.arrayUnion({
    //                     from: firebase.auth().currentUser.uid,
    //                     to: driverId,
    //                     time: firebase.firestore.Timestamp.now(),
    //                     //message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
    //                     message: document.getElementById("messageText").value.toString()
    //                 })
    //             });
    
    //             db.collection('driverChat').doc(driverId).update({
    //                 messages: firebase.firestore.FieldValue.arrayUnion({
    //                     from: firebase.auth().currentUser.uid,
    //                     to: driverId,
    //                     time: firebase.firestore.Timestamp.now(),
    //                     //message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
    //                     message: document.getElementById("messageText").value.toString()
    //                 })
    //             });
    //             openChat(driverId)
    //             //clear textarea after message submission
    //             const textarea = document.getElementById('messageText');
    //         textarea.value = '';
    //         } else {
    //             // doc.data() will be undefined in this case
    //             console.log("No such document!");
    //         }
    //     }).catch((error) => {
    //         alert("Error getting document.");
    //     });
    // }

    // let eid = document.getElementById('ID').value;

    // db.collection('users').doc(firebase.auth().currentUser.uid).get().then((doc) => {
    //     if (doc.exists) {

    //         db.collection('users').doc(firebase.auth().currentUser.uid).update({
    //             messages: firebase.firestore.FieldValue.arrayUnion({
    //                 eventId: eid,
    //                 from: firebase.auth().currentUser.uid,
    //                 to: driverId,
    //                 time: firebase.firestore.Timestamp.now(),
    //                 //message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
    //                 message: document.getElementById("messageText").value.toString()
                       
    //             })
    //         });

    //         db.collection('users').doc(driverId).update({
    //             messages: firebase.firestore.FieldValue.arrayUnion({
    //                 eventId: eid,
    //                 from: firebase.auth().currentUser.uid,
    //                 to: driverId,
    //                 time: firebase.firestore.Timestamp.now(),
    //                 //message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
    //                 message: document.getElementById("messageText").value.toString()
    //             })
    //         });
    //         openChat(driverId)
    //         //clear textarea after message submission
    //         const textarea = document.getElementById('messageText').value = '';
    //     } else {
    //         // doc.data() will be undefined in this case
    //         console.log("No such document!");
    //     }
    // }).catch((error) => {
    //     alert("Error getting document.");
    //     console.log("No such document! ", error);
    // });


    

    db.collection('users').doc(firebase.auth().currentUser.uid).get().then((doc) => {
        if (doc.exists) {

            db.collection('users').doc(firebase.auth().currentUser.uid).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    from: firebase.auth().currentUser.uid,
                    to: driverId,
                    time: firebase.firestore.Timestamp.now(),
                    message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
                    //message: document.getElementById("messageText").value.toString()
                })
            });

            db.collection('users').doc(driverId).update({
                messages: firebase.firestore.FieldValue.arrayUnion({
                    from: firebase.auth().currentUser.uid,
                    to: driverId,
                    time: firebase.firestore.Timestamp.now(),
                    message: CryptoJS.AES.encrypt(document.getElementById("messageText").value, encrypt).toString()
                    //message: document.getElementById("messageText").value.toString()
                })
            });
            openChat(driverId)
            //clear textarea after message submission
            const textarea = document.getElementById('messageText');
            textarea.value = '';
        } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
        }
    }).catch((error) => {
        alert("Error getting document.");
    });
    console.log("Chat sent");

}
window.sendChat = sendChat