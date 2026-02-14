const express = require("express");
const licenseGuard = require("../middlewares/licenseMiddleware");

const app = express();

app.use(licenseGuard);

module.exports = app
