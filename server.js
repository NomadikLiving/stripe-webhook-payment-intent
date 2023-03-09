// The library needs to be configured with your account's secret key.
// Ensure the key is kept out of any version control system you might be using.
const stripe = require("stripe")(process.env.stripeSecretKey);
const fetch = require("node-fetch");
const express = require("express");
const app = express();

// You can find your endpoint's secret in your webhook settings
const endpointSecret = process.env.endpointSecret;

// Use body-parser to retrieve the raw body as a buffer
const bodyParser = require("body-parser");

const sendBubble = async (pi_id, decline_code) => {
  const body = { pi_id, decline_code };

  await fetch(process.env.bubbleURL, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.bubblePrivateKey}`,
    },
  })
    .then(res => res.json())
    .then(json => console.log(json));
};

// Use JSON parser for all non-webhook routes
/* app.use((req, res, next) => {
  if (req.originalUrl === "/pi-webhook") {
    next();
  } else {
    console.log(`not sent to /pi-webhook. Sent to ${req.originalUrl}`);
    bodyParser.json()(req, res, next);
  }
}); */

app.post("/pi-webhook", express.raw({ type: "application/json" }), (request, response) => {
  const sig = request.headers["stripe-signature"];
  console.log("POST Webhook request received");
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.payment_failed":
      const paymentIntentPaymentFailed = event.data.object;
      const pi_id = paymentIntentPaymentFailed.id;
      const decline_code = paymentIntentPaymentFailed.last_payment_error.decline_code;

      console.log(`❌ payment_intent.payment_failed`);
      console.log(`id = ${pi_id}`);
      console.log(`decline_code = ${decline_code}`);

      sendBubble(pi_id, decline_code);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
