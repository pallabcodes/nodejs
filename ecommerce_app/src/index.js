const Payment = require("./events/payment.js");
const Marketing = require("./observers/marketing.js");
const Shipment = require("./observers/shipment.js");
const PaymentSubject = require("./subjects/paymentSubject.js");

const subject = new PaymentSubject();

const marketing = new Marketing();
subject.subscribe(marketing);

const shipment = new Shipment();
subject.subscribe(shipment);

const payment = new Payment(subject);
payment.creditCard({ id: 1, userName: 'erick', age: 27 });

subject.unsubscribe(marketing);

// this will only trigger the shipment area
payment.creditCard({ id: 2, userName: 'wendel', age:30 });
