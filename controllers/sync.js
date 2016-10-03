const AccessToken = require('../twilio-node/index.js').jwt.AccessToken
const SyncGrant = AccessToken.SyncGrant
const randomUsername = require('../randos')
const request = require('request-promise')


const accountSid = process.env.TWILIO_ACCOUNT_SID
const syncServiceSid = process.env.TWILIO_SYNC_SERVICE_SID
const apiKey = process.env.TWILIO_API_KEY
const apiSecret = process.env.TWILIO_API_SECRET

/*
Generate an Access Token for a sync application user - it generates a random
username for the client requesting a token, and takes a device ID as a query
parameter.
*/
module.exports.token = function(request, response) {
  let appName = 'twilio-contact-center'
  let identity = randomUsername()
  let deviceId = request.query.device

  // Create a unique ID for the client on their current device
  let endpointId = `${appName}:${identity}:${deviceId}`

  // Create a "grant" which enables a client to use Sync as a given user,
  // on a given device
  let syncGrant = new SyncGrant({
    serviceSid: syncServiceSid,
    endpointId: endpointId
  })

  // Create an access token which we will sign and return to the client,
  // containing the grant we just created
  let token = new AccessToken(
    accountSid,
    apiKey,
    apiSecret
  )
  token.addGrant(syncGrant)
  token.identity = identity

  // Serialize the token to a JWT string and include it in a JSON response
  response.send({
    identity: identity,
    token: token.toJwt()
  })
}

module.exports.createSyncService = (req, res) => {

  let serviceName = 'ContactCenterSyncServiceInstance';
  let url = `https://${apiKey}:${apiSecret}@preview.twilio.com/Sync/Services`
  let data = { FriendlyName : 'ContactCenterSyncServiceInstance' }
  request({ url: url, method: 'POST', formData: data})
  .then(response => {
    res.send(response)
  })
  .catch(err => {
    res.status(err.statusCode).send(err.message)
  })

}

module.exports.createSyncDocs = (req, res) => {

  // create the docs
  let docName = 'WorkspaceStats';
  let url = `https://${apiKey}:${apiSecret}@preview.twilio.com/Sync/Services/${syncSerivceSid}/Documents`
  let data = { UniqueName : 'WorkspaceStats', Data : '{}' }

  request({ url: url, method: 'POST', formData: data})
  .then(response => {

    docName = 'PhoneTaskQueueStats';
    url = `https://${apiKey}:${apiSecret}@preview.twilio.com/Sync/Services/${syncSerivceSid}/Documents`
    data = { UniqueName : 'PhoneTaskQueueStats', Data : '{}' }
    return request({ url: url, method: 'POST', formData: data})

  })
  .then(response => {
    res.send(response)
  })
  .catch(err => {
    res.status(err.statusCode).send(err.message)
  })

}
