const express = require("express");
const router = express.Router();

router.get("/new", (req, res) => {
  res.redirect("/"); // or change to /ghostme or your app start page
});

module.exports = router;