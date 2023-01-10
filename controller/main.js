import db from "./firebaseConfig.js";
// import sendMail from "./sendEmail.js"
// import { positionStackAPI } from "./config.js";
// import { motorcheckAPI } from "./config.js";


let selected_event_id = "";
let loggedIn = false;
let useMotorCheck = false;


firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    document.getElementById("username").innerHTML = "Hey " + firebase.auth().currentUser.displayName;
    document.getElementById("signOut").style.display = "block";
    document.getElementById("chat").style.display = "block";
    document.getElementById("signIn").style.display = "none";
    loggedIn = true;
    if(window.location.pathname == "/view/index.html")
      displayEvents();
    db.collection("users").doc(firebase.auth().currentUser.uid).get().then((doc) => {
      if (doc.exists) {
        console.log("User verified");
      } else {
        // doc.data() will be undefined in this case
        console.log("Created new user account");
        db.collection('users').doc(firebase.auth().currentUser.uid).set({
          name: firebase.auth().currentUser.displayName,
          email: firebase.auth().currentUser.email,
          photoUrl: firebase.auth().currentUser.photoURL,
          events_Attended: [],
          messages: []
        });
      }
    }).catch((error) => {
      alert("Error getting document for user sign up/sign in: " + error);
    });
  } else {
    // No user is signed in.
    loggedIn = false;
    if(window.location.pathname == "/view/index.html")
      displayEvents();
    document.getElementById("signIn").style.display = "block";
    document.getElementById("signOut").style.display = "none";
    document.getElementById("chat").style.display = "none";
  }
});

function displayEvents() {
  document.getElementById('eventList').innerHTML = '';
  db.collection("events").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {  
      let newDiv = document.createElement("div");
      newDiv.className = 'col-md-4 mx-auto';
      if(loggedIn){
        newDiv.innerHTML = `
        <div class="card border-primary mb-3">
          <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
          <h6 class="card-header">`+ doc.data().name + `</h6>
          <div class="card-body">
            <a href="#" class="card-link">Driver</a>
            <a href="#" class="card-link">Passenger</a>
            <a href="` + doc.data().url + `" class="card-link" target="_blank">More Details</a>
          </div>
          <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
        </div>`;
      }
      else{
        newDiv.innerHTML = `
        <div class="card border-primary mb-3">
          <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
          <h6 class="card-header">`+ doc.data().name + `</h6>
          <ul class="list-group list-group-flush">
            <li class="list-group-item"><span class="bold underline">Please login to do actions</span></li>
          </ul>
          <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
        </div>`;
      }     
      document.getElementById('eventList').appendChild(newDiv);
    });
  });
}

function sendComments(){
  let name = document.getElementById('name').value;
  let email = document.getElementById('email').value;
  let comments = document.getElementById('comments').value;
  if(name.length > 0 && email.length > 0 && comments.length > 0){
    if(loggedIn){
      db.collection('comments').doc(firebase.auth().currentUser.uid).set({
        name: name,
        email: email,
        comments: comments
      });
      alert("Successfully sent");
      document.getElementById('contactUsForm').reset();
    }
    else{
      alert("Please login first");
    }
  }else{
    alert("All fields are required");
  }

}
window.sendComments = sendComments;
