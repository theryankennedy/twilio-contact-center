'use strict'

const request = require('request-promise');
const bodyParser = require('body-parser');

const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const workspaceSid = process.env.TWILIO_WORKSPACE_SID;
const syncAppSid = process.env.TWILIO_SYNC_APP_SID;

module.exports.assignment = function (req, res) {
	res.setHeader('Content-Type', 'application/json')
	res.setHeader('Cache-Control', 'public, max-age=0')
	res.send(JSON.stringify({ }, null, 3))
}

module.exports.taskrouterEventCallBack = function (req, res) {

	module.exports.syncWorkspaceStats()

	const phoneTaskQueue = req.configuration.queues.filter((value) => {return value.id === 'phone'})
	module.exports.syncTaskQueueStats(phoneTaskQueue[0].taskQueueSid)

	res.status(200);

}

module.exports.updatesync = function(req, res) {

	module.exports.syncWorkspaceStats()

	const phoneTaskQueue = req.configuration.queues.filter((value) => {return value.id === 'phone'})
	module.exports.syncTaskQueueStats(phoneTaskQueue[0].taskQueueSid)

	res.status(200);
}

module.exports.syncWorkspaceStats = function () {

	const workspaceStatsUrl = `https://${apiKey}:${apiSecret}@taskrouter.twilio.com/v1/Workspaces/${workspaceSid}/Statistics?Minutes=480`

	request({ url: workspaceStatsUrl, method: 'GET' })
		.then(response => {
			console.log('got the workspace stats, pushing to sync');
			const docName = 'WorkspaceStats';
			const url = `https://${apiKey}:${apiSecret}@preview.twilio.com/Sync/Services/${syncAppSid}/Documents/${docName}`
			const data = { Data : response }
			return request({ url: url, method: 'POST', formData: data})
		})
		.then(response => {
				console.log('workspace stats sent to sync successfully')
		})
		.catch(err => {
				console.log('error posting workspaceStats to sync: ' + err)
		})
}

module.exports.syncTaskQueueStats = function (taskQueueSid) {

	const statsUrl = `https://${apiKey}:${apiSecret}@taskrouter.twilio.com/v1/Workspaces/${workspaceSid}/TaskQueues/${taskQueueSid}/Statistics?Minutes=480`

	request({ url: statsUrl, method: 'GET' })
		.then(response => {
			console.log('got the taskQueues stats, pushing to sync');
			const docName = 'PhoneTaskQueueStats';
			const url = `https://${apiKey}:${apiSecret}@preview.twilio.com/Sync/Services/${syncAppSid}/Documents/${docName}`
			const data = { Data : response }
			return request({ url: url, method: 'POST', formData: data})
		})
		.then(response => {
				console.log('taskQueuesStats sent to sync successfully')
		})
		.catch(err => {
				console.log('error posting taskQueueStats to sync: ' + err)
		})
}
