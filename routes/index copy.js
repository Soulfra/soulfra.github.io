const express = require('express');
const router = express.Router();

router.use('/log-agent', require('./logAgent'));
router.use("/generate-traits", require("./generateTraits"));
router.use("/log-error", require("./logError"));
router.use('/record-feedback', require('./recordFeedback'));
router.use("/run-agent", require("./runAgent"));
router.post('/admin-bot', require('./adminBot'));
router.use('/update-agent', require('./updateAgent'));
router.use('/route-intent', require('./routeIntent'));
router.use('/generate-ui', require('./generateUI'));
router.use('/summarize-user', require('./summarizeUser'));
router.use('/create-drop', require('./createDrop'));

module.exports = router;