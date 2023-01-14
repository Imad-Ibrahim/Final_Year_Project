(function () {
  emailjs.init("hXjFXpHI1Sjfo-K-9");
})();

export default function sendMail(driverName, driverEmail, eventName, passengerName) {
  var templateParams = {
    toEmail: driverEmail,
    fromEmail: 'imadibrahim54@gmail.com',
    driverName: driverName,
    eventName: eventName,
    passengerName: passengerName
  };

  emailjs.send("service_b1n2mv3", "template_4nv4b6o", templateParams)
    .then(function (response) {
      console.log('Confirmation email sent successfully', response.status, response.text);
    }, function (error) {
      console.log('Email failed to send', error);
    });
}
  