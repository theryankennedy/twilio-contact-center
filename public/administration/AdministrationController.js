var app = angular.module('administrationApplication', ['checklist-model', 'chart.js']);

app.controller('AdministrationController', function ($scope, $http, $log, $interval) {

  $scope.init = function(){

    $scope.tab = 'agents';
    $scope.channels = {
      phone: 'Phone',
      chat: 'Chat',
      video: 'Video'
    };

    // DISABLED:  poll the endpoint to update the sync data
    var stop;
    $scope.updateStats = function() {
      // Don't start a new poll if we are already polling
      if ( angular.isDefined(stop) ) return;

      stop = $interval(function() {
        console.log('calling endpoint')
        $http.get('/api/taskrouter/updatesync');
      }, 5000);
    };
    $scope.stopPoll = function() {
      if (angular.isDefined(stop)) {
        $interval.cancel(stop);
        stop = undefined;
      }
    };
    $scope.$on('$destroy', function() {
      // Make sure that the interval is destroyed too
      $scope.stopPoll();
    });

    $scope.syncDoc = null;
    $scope.stats = {};
    $scope.phoneQueueDoc = null;
    $scope.phoneQueueStats = {};

    $scope.longest_task = {
      name : "",
      sid : "",
      age: "",
      startTime: 0
    };

    $scope.activity_statistics_labels;
    $scope.activity_statistics_data;
    $scope.activity_statistics_options = {
      title: {
        display : true,
        text : "agent status"
      }
    }

    $scope.tasks_by_status_labels;
    $scope.tasks_by_status_data;
    $scope.tasks_by_status_options = {
        title: {
          display : true,
          text : "queue status"
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true,
                    suggestedMax: 10
                }
            }]
        }
    };

    $scope.bar_chart_labels;
    $scope.bar_chart_data;

    $scope.bar_chart_options = {
      title: {
        display : true,
        text : "completed calls"
      },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true,
                    suggestedMax: 20
                }
            }]
        }
    };

    //timer with interval
    $scope.timerWithInterval = 0;
    $scope.startTimerWithInterval = function(ms) {
     $scope.timerWithInterval = ms || 0;
     if($scope.myInterval){
       $interval.cancel($scope.myInterval);
     }
     $scope.onInterval = function(){
         $scope.timerWithInterval++;
     }
     $scope.myInterval = $interval($scope.onInterval,1000);
    };

    $scope.resetTimerWithInterval = function(){
     $scope.timerWithInterval = 0;
     $interval.cancel($scope.myInterval);
    }

    // update get the latest data into sync
    $http.get('/api/taskrouter/updatesync')

    // get a sync access token
    // https://rkennedy2.ngrok.io/token
    $http.get('/api/sync/token')
      .then(function onSuccess(response) {

        // start the poll
        //$scope.updateStats();

        const accessManager = new Twilio.AccessManager(response.data.token);
        $scope.client = new Twilio.Sync.Client(accessManager);
        $log.log('sync client has initialized');

        // get the WorkspaceStats document
        $scope.client.document('WorkspaceStats')
        .then(function(doc) {

          // store it
          $scope.syncDoc = doc;

          // get the initial data
          $scope.getWorkspaceData();

          // Let's subscribe to changes on this document, so when something
          // changes on this document, we can trigger our UI to update
          $scope.syncDoc.on('updated', function(data) {
            $scope.stats = data;

            // get the initial data
            $scope.getWorkspaceData();

          }, function onError(response) {
            alert(response.data);
          });
        });

        // get the PhoneQueueStats document
        $scope.client.document('PhoneTaskQueueStats')
        .then(function(doc) {

          // store it
          $scope.phoneQueueDoc = doc;

          // get the initial data
          $scope.getPhoneTaskQueueData();

          // Let's subscribe to changes on this document, so when something
          // changes on this document, we can trigger our UI to update
          $scope.phoneQueueDoc.on('updated', function(data) {
            $scope.phoneQueueStats = data;

            // get the initial data
            $scope.getPhoneTaskQueueData();

          }, function onError(response) {
            alert(response.data);
          });
        });

    });

    $scope.createForm = false;
    $scope.configuration = null;
    $scope.agent = { channels: []};

    $http.get('/api/setup')

      .then(function onSuccess(response) {

        $scope.configuration = response.data;
        $scope.listWorkers();

      }, function onError(response) {

        alert(response.data);

      });

  };

  $scope.getWorkspaceData = function() {
    $scope.stats = $scope.syncDoc.get();

    // charts!
    $scope.activity_statistics_labels = $scope.stats.realtime.activity_statistics.map(x => x.friendly_name);
    $scope.activity_statistics_data = $scope.stats.realtime.activity_statistics.map(x => x.workers);

    $scope.tasks_by_status_labels = ['reserved', 'pending', 'assigned'];
    $scope.tasks_by_status_data = [$scope.stats.realtime.tasks_by_status.reserved,
                                    $scope.stats.realtime.tasks_by_status.pending,
                                    $scope.stats.realtime.tasks_by_status.assigned];

    let cumulative = $scope.stats.cumulative;
    $scope.bar_chart_labels = [
      "tasks_created",
      "tasks_completed",
      "tasks_canceled",
      "reservations_created",
      "reservations_accepted",
      "reservations_timed_out"
    ];
    $scope.bar_chart_data = [
        cumulative.tasks_created,
        cumulative.tasks_completed,
        cumulative.tasks_canceled,
        cumulative.reservations_created,
        cumulative.reservations_accepted,
        cumulative.reservations_timed_out
    ];

    $scope.$apply();
  }

  $scope.getPhoneTaskQueueData = function() {
    $scope.phoneQueueStats = $scope.phoneQueueDoc.get();

    // longest call waiting
    $scope.longest_task.sid = $scope.phoneQueueStats.realtime.longest_task_waiting_sid;
    $scope.longest_task.age = $scope.phoneQueueStats.realtime.longest_task_waiting_age;
    $scope.startTimerWithInterval($scope.longest_task.age);

    // calls in queue
    $scope.callsInQueue = $scope.phoneQueueStats.realtime.tasks_by_status.pending;

    $scope.$apply();
  }


  $scope.listWorkers = function(){

    $http.get('/api/workers')

      .then(function onSuccess(response) {

        $scope.workers = [];

        response.data.forEach(function(worker) {

        var attributes = JSON.parse(worker.attributes);

        worker.attributes = attributes;

        for (var i = 0; i < $scope.configuration.ivr.options.length; i++) {
          if($scope.configuration.ivr.options[i].id == worker.attributes.team){
            worker.team = $scope.configuration.ivr.options[i].friendlyName;
          }
        }

        worker.channelsFriendlyName = '';

        for (i = 0; i < worker.attributes.channels.length; i++) {
          worker.channelsFriendlyName += $scope.channels[worker.attributes.channels[i]];

          if(i < (worker.attributes.channels.length -1)){
            worker.channelsFriendlyName += ', ';
          }

        }

        $scope.workers.push(worker);

      });

    }, function onError(response) {

      alert(response.data);

    });

  };

  $scope.expandAgentCreate = function(){

    $scope.createForm = true;

  };

  $scope.createWorker = function(){

    var attributes = {
      contact_uri: 'client:' + $scope.agent.friendlyName.toLowerCase(),
      channels: $scope.agent.channels,
      team: $scope.agent.team
    };

    var worker =  {
      friendlyName:  $scope.agent.friendlyName,
      attributes: JSON.stringify(attributes)
    };

    $http.post('/api/workers', worker)

      .then(function onSuccess(response) {

        $log.log(response.data);

        $scope.createForm = false;
        $scope.agent = { channels: []};

        $scope.listWorkers();

      }, function onError(response) {

        $log.error(response);
        alert(response.data);

      });

  };

  $scope.removeWorker = function(worker){

    for (var i = 0; i < $scope.workers.length; i++) {

      if($scope.workers[i].sid == worker.sid){
        $scope.workers.splice(i, 1);
        break;
      }

    }

    $http.delete('/api/workers/' + worker.sid);

  };

  $scope.setTab = function (tab) {

    $scope.tab = tab;

  };

  $scope.removeIvrOption = function(array, index) {

    $scope.configuration.ivr.options.splice(index, 1);

  };

  $scope.createIvrOption = function(){

    var option = { friendlyName: 'unknown' };

    $scope.configuration.ivr.options.push(option);
    $scope.createForm = false;

  };

  $scope.saveConfig = function(){

    for (var i = 0; i < $scope.configuration.ivr.options.length; i++) {
      var tmpId = $scope.configuration.ivr.options[i].friendlyName.toLowerCase();

      tmpId = tmpId.replace(/[^a-z0-9 ]/g, '');
      tmpId = tmpId.replace(/[ ]/g, '_');

      $scope.configuration.ivr.options[i].id = tmpId;

    }

    $http.post('/api/setup', { configuration: $scope.configuration })

      .then(function onSuccess(response) {

        $log.log('setup saved');
        $log.log(response.data);

      }, function onError(response) {

        alert(response.data);

      });

  };

});

app.filter('hhmmss', function () {
  return function (time) {
    var sec_num = parseInt(time, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
  }
});
