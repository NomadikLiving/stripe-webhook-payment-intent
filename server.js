// The library needs to be configured with your account's secret key.
// Ensure the key is kept out of any version control system you might be using.
const stripe = require("stripe")(process.env.stripeSecretKey);
const express = require("express");
const app = express();

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.endpointSecret;

// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/pi-webhook") {
    next();
  } else {
    console.log(`not sent to /pi-webhook. Sent to ${req.originalUrl}`);
    bodyParser.json()(req, res, next);
  }
});

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
      console.log("❌ payment_intent.payment_failed");
      console.log("event.data.object = ", paymentIntentPaymentFailed);
      // Then define and call a function to handle the event payment_intent.payment_failed
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
