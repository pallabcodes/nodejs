// create a simple server with express.js in JS

const express = require("express");

const app = express(); // this create an express instance internally

const httpServer = require("http").createServer(app);

// Example SSL key and certificate (replace with actual key and cert)
const key = {}; // Replace with your SSL key
const cert = {}; // Replace with your SSL certificate
const credentials = { key, cert };

const httpsServer = require("https").createServer(app, credentials);

// global middlewares

app.use(express.json()); // so, it simply deserializes the incoming request (i.e. stream) into a plain object onto request object


app.use("/", (req, res) => res.status(200).json({ message: "HOMEPAGE" }));



// global error middlewares

app.use((err, req, res, next) => {
  err.status = err.status || 500;
  err.message = err.message || "INTERNAL SERVER ERROR";

  next(err)
});


const PORT = 5001;

// The below line means , ok I have now I am creating or opening a server with this port and this is where I will be listening for incoming request
app.listen(PORT, () => console.log(`Server is running successfully ${PORT}`));



