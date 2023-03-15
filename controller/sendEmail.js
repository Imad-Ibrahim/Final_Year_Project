import { emailJS_Key } from "./config.js";
import { emailJS_Template_Key } from "./config.js";
import { emailJS_service_Key } from "./config.js";

(function () {
  emailjs.init(emailJS_Key);
})();

export default function sendMail(driverName, driverEmail, eventName, passengerName) {
  var templateParams = {
    toEmail: driverEmail,
    fromEmail: 'imadibrahim54@gmail.com',
    driverName: driverName,
    eventName: eventName,
    passengerName: passengerName
  };

  emailjs.send(emailJS_service_Key, emailJS_Template_Key, templateParams)
    .then(function (response) {
      alert("Thanks for signing on to our platform! an email has been sent to the driver, please keep an eye on your chat for further notifications.");    
    }, function (error) {
      console.log('Email failed to send', error);
    });
}
  