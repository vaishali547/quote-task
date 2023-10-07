const express = require("express");
const app = express();
const dotenv = require("dotenv");
const quoteRoute = require("./quote");
dotenv.config();
app.use(express.json());
app.use("/api/", quoteRoute);

app.listen(3000, () => console.log("Server Connected "));
