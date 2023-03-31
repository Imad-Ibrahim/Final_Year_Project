import { apiKey } from "./config.js";
import { authDomain } from "./config.js";
import { projectId } from "./config.js";
import { storageBucket } from "./config.js";
import { messagingSenderId } from "./config.js";
import { appId } from "./config.js";
import { measurementId } from "./config.js";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
var provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().useDeviceLanguage();
const db = firebase.firestore();

async function signIn() {
  firebase.auth()
    .signInWithPopup(provider)
    .then((result) => {
      /** @type {firebase.auth.OAuthCredential} */
      var credential = result.credential;
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = credential.accessToken;
      // The signed-in user info.
      var user = result.user;

      document.getElementById("username").innerHTML = "Hey " + user.displayName;
      document.getElementById("signOut").style.display = "block";
      document.getElementById("chat").style.display = "block";
      document.getElementById("signIn").style.display = "none";
    }).catch((error) => {
      document.getElementById("signIn").style.display = "block";
      alert("Something went Wrong: " + error.message);
    });
}
window.signIn = signIn;

function signOut() {
  let message = "Are you sure you want to log out?";
  if (confirm(message)) {
    firebase.auth().signOut()
    .then(function () {
      document.getElementById("signOut").style.display = "none";
      document.getElementById("signIn").style.display = "block";
      window.location.replace("../index.html"); 
    }, function (error) {
      alert("Something went Wrong: " + error.message);
    });
  }
}
window.signOut = signOut;
export default db;
