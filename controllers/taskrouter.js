'use strict'

const request = require('request-promise');
const bodyParser = require('body-parser');


module.exports.assignment = function (req, res) {
	res.setHeader('Content-Type', 'application/json')
	res.setHeader('Cache-Control', 'public, max-age=0')
	res.send(JSON.stringify({ }, null, 3))
}

module.exports.taskrouterEventCallBack = function (req, res) {
	const apiKey = process.env.TWILIO_API_KEY;
	const apiSecret = process.env.TWILIO_API_SECRET;
	const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
	const syncAppSid = req.configuration.twilio.syncAppSid;

console.log(req.body);
	const workspaceStatsUrl = `https://${apiKey}:${apiSecret}@taskrouter.twilio.com/v1/Workspaces/${workspaceSid}/Statistics`
		request({ url: workspaceStatsUrl, method: 'GET' })
			.then(response => {
console.log('in response');
				// update sync doc
				const docName = 'WorkspaceStats';
				const url = `https://${apiKey}:${apiSecret}@preview.twilio.com/Sync/Services/${syncAppSid}/Documents/${docName}`
				const data = {
					Data : response
				}
				return request({ url: url, method: 'POST', formData: data})

			})
			.then(response => {
					res.status(200);
			})
			.catch(err => {
					console.log('error posting workspaceStats to sync: ' + err)
			})

}
