app.controller('VideoController', function ($scope, $rootScope, $http, $sce, $compile, $log) {

  $scope.videoClient;
  $scope.roomName;
  $scope.activeRoom;
  $scope.previewMedia;

  $scope.channel;
  $scope.messages = [];
  $scope.session = {
    token: null,
    identity: null,
    isInitialized: false,
    isLoading: false,
    expired: false,
    showVideo: false
  };

  $scope.$on('ActivateVideo', function(event, data) {

    $log.log('ActivateVideo event received');
    $log.log(data);

    $scope.roomName = data.roomName;

    $scope.session.isLoading = true;

    if (!$scope.videoClient) {
      $scope.setupClient($scope.roomName);
    } else {
      $scope.joinRoom();
    }


  });

  $scope.$on('DestroyVideo', function(event, data) {

    $log.log('DestroyVideo event received');

    $log.log('Leaving room...');
    $scope.activeRoom.disconnect();
    $scope.session.showVideo = false;

  });


  $scope.setupClient = function(roomName){

    $log.log('setup video');

    $http.get('/api/video/token')
			.then(function onSuccess(response) {
				$scope.configuration = response.data;
        $scope.videoClient = new Twilio.Video.Client(response.data.token);
        $scope.joinRoom();
			}, function onError(response) {
				$log.error('error loading configuration');
				$log.error(response);
		});

   /*
    var accessManager = new Twilio.AccessManager($scope.session.token);

    accessManager.on('tokenExpired', function(){
      $log.error('token expired');
    });

    accessManager.on('error', function(){
      $log.error('An error occurred');
    });
    */
  };

  $scope.joinRoom = function() {

    //document.getElementById('room-controls').style.display = 'block';
    $scope.session.showVideo = true;
    $log.log("Joining room '" + $scope.roomName + "'...");
    $scope.videoClient.connect({ to: $scope.roomName}).then($scope.roomJoined,
      function(error) {
        $log.error('Could not connect to Twilio: ' + error.message);
      });

  }

  // Successfully connected!
  $scope.roomJoined = function(room) {
    $scope.activeRoom = room;

    //document.getElementById('button-join').style.display = 'none';
    //document.getElementById('button-leave').style.display = 'inline';

    // Draw local video, if not already previewing
    if (!$scope.previewMedia) {
      room.localParticipant.media.attach('#local-media');
    }

    room.participants.forEach(function(participant) {
      $log.log("Already in Room: '" + participant.identity + "'");
      participant.media.attach('#remote-media');
    });

    // When a participant joins, draw their video on screen
    room.on('participantConnected', function (participant) {
      $log.log("Joining: '" + participant.identity + "'");
      participant.media.attach('#remote-media');
    });

    // When a participant disconnects, note in log
    room.on('participantDisconnected', function (participant) {
      $log.log("Participant '" + participant.identity + "' left the room");
      participant.media.detach();
      room.localParticipant.media.detach();
    });

    // When we are disconnected, stop capturing local video
    // Also remove media for all remote participants
    room.on('disconnected', function () {
      $log.log('Left');
      room.localParticipant.media.detach();
      room.participants.forEach(function(participant) {
        participant.media.detach();
      });
      activeRoom = null;
      //document.getElementById('button-join').style.display = 'inline';
      //document.getElementById('button-leave').style.display = 'none';
    });
  }

});
