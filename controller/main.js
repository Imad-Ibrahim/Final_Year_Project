import db from "./firebaseConfig.js";
import sendMail from "./sendEmail.js"
import { positionStackAPI } from "./config.js";

let loggedIn = false;

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
          eventsAttended: [],
          messages: []
        });
      }
    }).catch((error) => {
      alert("Error getting document for user sign up/sign in");
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
            <a href="../view/RegisterDriver.html?eID=` + doc.data().id + `" class="card-link">Driver</a>
            <a href="../view/RegisterPassenger.html?eID=` + doc.data().id + `" class="card-link">Passenger</a>
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
      document.getElementById("footer").style.display = "block";
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

function addDriver(address, username, eventId, driverId, driverLat, driverLon, driverReg, meetingPoint, numSeats, impact) {
  db.collection('events').doc(eventId).get().then((doc) => {
    if (doc.exists) {
      if (doc.data().drivers.some(driver => driver.driverId === driverId)) {
        alert("Already Driving to the event.")
      } else {
        db.collection('events').doc(eventId).update({
          drivers: firebase.firestore.FieldValue.arrayUnion({
            driverId: driverId,
            username: username,
            userEmail: firebase.auth().currentUser.email,
            latitude: driverLat,
            longitude: driverLon,
            address: address,
            carReg: driverReg,
            meetingPoint: meetingPoint,
            numSeats: parseInt(numSeats),
            impact: impact
          })
        });
        alert("Thanks for signing on to our platform! please keep an eye on your email and chat for further notifications.");
        document.getElementById('registerDriverForm').reset();
      }
    } else {
      // doc.data() will be undefined in this case
      alert("No event found with given id.");
    }
  }).catch((error) => {
    alert("Error getting document.");
  });
}
window.addDriver = addDriver;

function addAttendee(eventId, driverId) {
  // add event to attendee with selected driver
  db.collection('users').doc(firebase.auth().currentUser.uid).update({
    eventsAttended: firebase.firestore.FieldValue.arrayUnion(
      {
        eventId: eventId,
        driver: driverId
      })
  });
  //add event_passenger to driver in db
  db.collection('users').doc(driverId).get().then((doc) => {
    if (doc.exists) {
      db.collection('users').doc(driverId).update({
        eventPassanger: firebase.firestore.FieldValue.arrayUnion(
          {
            eventId: eventId,
            passengerId: firebase.auth().currentUser.uid
          })
      });
    } else {
      // doc.data() will be undefined in this case
      alert("No user found with given driverId.");
    }
  }).catch((error) => {
    alert("Error getting document.");
  });
}
window.addAttendee = addAttendee;

async function matchDriver(passengerLatitude, passengerLongitude, eventId, maxMatchRangekm, passengerKmRange) {
  db.collection('users').doc(firebase.auth().currentUser.uid).get().then((doc) => {
    if (doc.exists) {
      if (doc.data().eventsAttended.some(e => e.eventId === eventId)) {
        alert("You Are already going to this event.");
      }
      else {
        //get document
        var docRef = db.collection("events").doc(eventId);
        docRef.get().then((doc) => {
          if (doc.exists) {
            let driverList = doc.data().drivers;
            let eventName = doc.data().name;
            if (driverList.length == 0) {
              alert("Sorry, there is no driver for " + eventName + " event, please try again later.");
              return null;
            }

            //set default selection to first driver with free seats
            var j;
            var selectedDriver;
            var shortestDistance;
            for (j = 0; j < driverList.length; j++) {
              if (driverList[j].numSeats > 0) {
                selectedDriver = driverList[j].driverId;
                shortestDistance = distanceCalculation(passengerLatitude, driverList[j].latitude, passengerLongitude, driverList[j].longitude);
                break;
              }
            }

            //find optimal driver
            let i = j + 1;
            for (i; i < driverList.length; i++) {
              if (driverList[i].numSeats > 0) {
                let distance = distanceCalculation(passengerLatitude, driverList[i].latitude, passengerLongitude, driverList[i].longitude);
                if (distance < shortestDistance) {
                  selectedDriver = driverList[i].driverId;
                  shortestDistance = distance;
                }
              }
            }
            if (shortestDistance > maxMatchRangekm) {
              //Increase match range if no driver found up to max of passenger's km range OR 50km by defult.
              if (maxMatchRangekm >= passengerKmRange)
                return null;
              else {
                maxMatchRangekm += 5;
                matchDriver(passengerLatitude, passengerLongitude, getSelectedEventID(), maxMatchRangekm, passengerKmRange);
              }
            }
            else if (selectedDriver == firebase.auth().currentUser.uid) {
              alert("You are already a driver for this event.");
            }
            else {
              const selectedIndex = driverList.map(object => object.driverId).indexOf(selectedDriver);
              addAttendee(getSelectedEventID(), selectedDriver);

              // Show alert before seat number decrementing.
              alert("Match found\nDriver name: " + driverList[selectedIndex].username + "\n" + "Travelling from: " + driverList[selectedIndex].address + "\n" + "Meeting point: " + driverList[selectedIndex].meetingPoint + "\n");

              driverList[selectedIndex].numSeats = driverList[selectedIndex].numSeats - 1;
              db.collection('events').doc(getSelectedEventID()).update({
                drivers: driverList
              });
              sendMail(driverList[selectedIndex].username, driverList[selectedIndex].userEmail, eventName, firebase.auth().currentUser.displayName);
              document.getElementById('registerPassengerForm').reset();
              return {
                'driverId': selectedDriver,
                'username': driverList[selectedIndex].username,
                'driverAddress': driverList[selectedIndex].address,
                'driverMeetingPoint': driverList[selectedIndex].meetingPoint
              };
            }
          } else {
            // doc.data() will be undefined in this case
            alert("No event found with given id");
            return null
          }
        }).catch((error) => {
          alert("Something went wrong, there is either no driver or no free seats for this event, please try again later.");
          return null
        });
      }
    }
  }).catch((error) => {
    alert("Error getting document");
  });
}

function distanceCalculation(lat1, lat2, lon1, lon2) {
  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lon1 = lon1 * Math.PI / 180;
  lon2 = lon2 * Math.PI / 180;
  lat1 = lat1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;
  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result
  return (c * r);
}

async function registerPassenger() {
  var city = document.getElementById("passengerCity").value;
  var county = document.getElementById("passengerCounty").value;
  var passengerKmRange = document.getElementById("maxKmRange").value;
  var address = city + ", " + county;
  var url = 'http://api.positionstack.com/v1/forward?access_key=' + positionStackAPI + '&query=' + address;
  var passengerLatitude;
  var passengerLongitude;
  var passengerCountry;

  if (city.length > 0 && county.length > 0){
    $.ajax({
      url: url,
      complete: function (data) {
        passengerLatitude = data.responseJSON.data[0].latitude;
        passengerLongitude = data.responseJSON.data[0].longitude;
        passengerCountry = data.responseJSON.data[0].country;
        if (passengerCountry == 'Ireland') {
          if(passengerKmRange.length == 0)
            passengerKmRange = 50;
          matchDriver(passengerLatitude, passengerLongitude, getSelectedEventID(), 15, passengerKmRange);
        }
        else
          alert("Wrong address, the address you entered does not exists!!!");
      },
    }).catch((error) => {
      alert("Something went wrong.");
      console.log(error);
    });
  }else
    alert("All fields must be filled out!!!");
}
window.registerPassenger = registerPassenger;

function getSelectedEventID(){
  return new URLSearchParams(window.location.search).get('eID');
}

function registerDriver() {
  var carReg = document.getElementById("driverCarReg").value;
  var city = document.getElementById("driverCity").value;
  var county = document.getElementById("driverCounty").value;
  var meetingPoint = document.getElementById("driverMeetingPoint").value;
  var numSeats = document.getElementById("driverNumSeats").value;
  var address = city + ", " + county;
  var username = firebase.auth().currentUser.displayName;
  var url = 'http://api.positionstack.com/v1/forward?access_key=' + positionStackAPI + '&query=' + address;
  var impact = "";
  var carYear = carReg[0] + carReg[1];
  var driverLatitude;
  var driverLongitude;
  var driverCountry;
  carYear = parseInt(carYear);
  if(carReg.length > 0 && city.length > 0 && county.length > 0 && meetingPoint.length > 0 && numSeats.length > 0){
    $.ajax({
      url: url,
      complete: function (data) {
        driverLatitude = data.responseJSON.data[0].latitude;
        driverLongitude = data.responseJSON.data[0].longitude;
        driverCountry = data.responseJSON.data[0].country;        
        if (driverCountry == 'Ireland') {
          if (electric.checked)
            impact = "NONE";
          else {
            if (carYear >= 15)
              impact = "LOW";
            else if (carYear >= 8 && carYear < 15)
              impact = "MEDIUM";
            else
              impact = "HIGH";
          }
          addDriver(address, username, getSelectedEventID(), firebase.auth().currentUser.uid, driverLatitude, driverLongitude, carReg, meetingPoint, numSeats, impact); 
        }
        else {
          alert("Wrong address, the address you entered does not exists.");
        }
      },
    }).catch((error) => {
      alert("Something went wrong.");
      console.log(error);
    });
  }
  else{
    alert("All fields must be filled out!!!");
  }
}
window.registerDriver = registerDriver;

function navBar() {
  if (document.getElementById('navbarColor01').style.display === 'block') {
      document.getElementById("navbarColor01").style.display = "none";
  }
  else {
      document.getElementById("navbarColor01").style.display = "block";
  }
}
window.navBar = navBar;

function eventSearch(){
  document.getElementById("footer").style.display = "none";
  document.getElementById('eventList').innerHTML = '';
  let eventname = document.getElementById('eventName').value;
  let dateFrom = document.getElementById('dateFrom').value;
  let dateTo = document.getElementById('dateTo').value;
  if(eventname.length <= 0 && !dateFrom & !dateTo){
    alert("Please enter either event name, or date from and to.");
    window.location.href = "../view/index.html";
  }
  else{
    db.collection("events").get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {  
        let newDiv = document.createElement("div");
        newDiv.className = 'col-md-4 mx-auto';
        let date = doc.data().date_time.split(" ");
        if(loggedIn)
        {
          if(doc.data().name == eventname){
            newDiv.innerHTML = `
            <div class="card border-primary mb-3">
              <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
              <h6 class="card-header">`+ doc.data().name + `</h6>
              <div class="card-body">
                <a href="../view/RegisterDriver.html?eID=` + doc.data().id + `" class="card-link">Driver</a>
                <a href="../view/RegisterPassenger.html?eID=` + doc.data().id + `" class="card-link">Passenger</a>
                <a href="` + doc.data().url + `" class="card-link" target="_blank">More Details</a>
              </div>
              <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
            </div>`;
            document.getElementById('eventList').appendChild(newDiv);
          }
          else if(date[0] >= dateFrom && date[0] <= dateTo){
            document.getElementById("footer").style.display = "block";
            newDiv.innerHTML = `
            <div class="card border-primary mb-3">
              <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
              <h6 class="card-header">`+ doc.data().name + `</h6>
              <div class="card-body">
                <a href="../view/RegisterDriver.html?eID=` + doc.data().id + `" class="card-link">Driver</a>
                <a href="../view/RegisterPassenger.html?eID=` + doc.data().id + `" class="card-link">Passenger</a>
                <a href="` + doc.data().url + `" class="card-link" target="_blank">More Details</a>
              </div>
              <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
            </div>`;
            document.getElementById('eventList').appendChild(newDiv);
          } 
        }
        else{
          if(doc.data().name == eventname){
            newDiv.innerHTML = `
            <div class="card border-primary mb-3">
              <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
              <h6 class="card-header">`+ doc.data().name + `</h6>
              <ul class="list-group list-group-flush">
                <li class="list-group-item"><span class="bold underline">Please login to do actions</span></li>
              </ul>
              <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
            </div>`;
            document.getElementById('eventList').appendChild(newDiv);
          }
          else if(date[0] >= dateFrom && date[0] <= dateTo){
            document.getElementById("footer").style.display = "block";
            newDiv.innerHTML = `
            <div class="card border-primary mb-3">
              <img src=`+ doc.data().photo + ` alt=` + doc.data().name + `>
              <h6 class="card-header">`+ doc.data().name + `</h6>
              <ul class="list-group list-group-flush">
                <li class="list-group-item"><span class="bold underline">Please login to do actions</span></li>
              </ul>
              <div class="card-footer text-muted">`+ doc.data().date_time + `</div>
            </div>`;
            document.getElementById('eventList').appendChild(newDiv);
          }
        }      
      });
    });
  }
}
window.eventSearch = eventSearch;
