const express = require("express");
const router = require("./src/router");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is successfully running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
