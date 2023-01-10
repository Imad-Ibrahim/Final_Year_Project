import db from "./firebaseConfig.js"

let events = [];
let url = 'https://app.ticketmaster.com/discovery/v2/events.json?countryCode=IE&apikey=HXGAu9U70Dep03uyz1QMaAgP2fBor6zx';

$.getJSON(url, function (data) {
    events = data;
    for (let i = 0; i < 20; i++) {
        var docRef = db.collection("events").doc(events._embedded.events[i].id);
        //Ensure high quality image is selected
        let selected_image = events._embedded.events[i].images[0].url;
        for (let j = 0; j < events._embedded.events[i].images.length; j++) {
            if (events._embedded.events[i].images[j].url.includes("TABLET_LANDSCAPE_LARGE_16_9.jpg"))
                selected_image = events._embedded.events[i].images[j].url;
        }
        docRef.get().then((doc) => {
            if (!doc.exists) {
                db.collection("events").doc(events._embedded.events[i].id).set({
                    id: events._embedded.events[i].id,
                    name: events._embedded.events[i].name,
                    url: events._embedded.events[i].url,
                    photo: selected_image,
                    date_time: events._embedded.events[i].dates.start.localDate + " " + events._embedded.events[i].dates.start.localTime,
                    location: [parseFloat(events._embedded.events[i]._embedded.venues[0].location.latitude),
                    parseFloat(events._embedded.events[i]._embedded.venues[0].location.longitude)],
                    drivers: []
                });
            }
        });
    }
});