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
      console.log('Confirmation email sent successfully', response.status, response.text);
    }, function (error) {
      console.log('Email failed to send', error);
    });
}
  