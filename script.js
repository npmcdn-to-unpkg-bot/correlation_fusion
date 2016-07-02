// Code goes here

var app = angular.module('myAPP', ['ng', 'ngMaterial', 'ngMdIcons']);

app.factory('d3', function() {
  return d3;
});

app.filter('capitalize', function() {
  return function(string) {
    return (!!string) ? string.charAt(0).toUpperCase() + string.substr(1).toLowerCase() : '';
  };
});

app.filter('abs', function() {
  return function(number) {
    return Math.abs(number);
  };
});

app.filter('round', function() {
  return function(nbr) {
    return Math.round(nbr);
  };
});


app.controller('MainCtrl', function($scope, $mdDialog, $http, $mdToast) {
  $scope.spSessions = [];
  //$scope.selfReportedEmotions = [];
  $scope.selectedSpSessions = [];

  // initialization
  _init();

  function _init() {
    // start async waterfall
    async.waterfall([
      // load self reported json data
      function(callback) {
        $http.get('./emoselfreporteds.json').then(function(res) {
          callback(null, res.data.selfReported);
          $scope.selfReportedEmotions = _.sortBy(res.data.selfReported, 'created.$date');
        }, function(error) {
          callback(error);
        });
      },
      // fill session filter after loading json data
      function(data, callback) {
        var sp_sessions = _.sortBy(data, 'created.$date');
        sp_sessions = _.map(sp_sessions, _.partialRight(_.pick, 'sp_session'));
        sp_sessions = _.uniq(_.pluck(sp_sessions, 'sp_session.$oid'));
        callback(null, data, sp_sessions);
      }
    ], function(err, data, sessions) {
      if (err) {
        console.log(err);
        return;
      }
      // put filtered spSession & selfReportedEmotions in the scope
      $scope.spSessions = sessions;
      $scope.selfReportedEmotions = _.sortBy(data, 'created.$date');
    });
  }

  function _fillSessionsFilter(selfreportedObj) {
    var sp_sessions = _.sortBy(selfreportedObj, 'created.$date');
    sp_sessions = _.map(sp_sessions, _.partialRight(_.pick, 'sp_session'));
    $scope.sessions = _.uniq(_.pluck(sp_sessions, 'sp_session.$oid'));
  }

  function _getEmotionsFromJsonDataBySessions(jsonData, selectedSpSessions, callback) {
    console.log('jsonData, selectedSpSessions === ', jsonData, selectedSpSessions);
    var emotions = [];
    _.forEach(selectedSpSessions, function(spSessionId) {
      var filtered = _.where(jsonData, {
        'sp_session': {
          '$oid': spSessionId
        }
      });
      console.log('=== ', filtered);
      filtered = _.map(filtered, _.partialRight(_.pick, 'sp_session', 'emotions', 'check_point', 'created'));
      emotions.push(filtered);
    });
    callback(emotions);
  }

  // lostr logic
  var last = {
    bottom: false,
    top: true,
    left: false,
    right: true
  };
  
  $scope.toastPosition = angular.extend({}, last);
  
  $scope.getToastPosition = function() {
    sanitizePosition();
    return Object.keys($scope.toastPosition)
      .filter(function(pos) {
        return $scope.toastPosition[pos];
      })
      .join(' ');
  };

  function sanitizePosition() {
    var current = $scope.toastPosition;
    if (current.bottom && last.top) current.top = false;
    if (current.top && last.bottom) current.bottom = false;
    if (current.right && last.left) current.left = false;
    if (current.left && last.right) current.right = false;
    last = angular.extend({}, current);
  }
  
  $scope.showSimpleToast = function(message) {
    var pinTo = $scope.getToastPosition();
    $mdToast.show(
      $mdToast.simple()
      .textContent(message)
      .position(pinTo)
      .hideDelay(3000)
    );
  };
  
  $scope.applyFilter = function() {
    console.log(_.size($scope.selectedSpSessions));
    if (_.size($scope.selectedSpSessions) === 0) {
      $scope.showSimpleToast('Please select session(s)!');
      return;
    };
    _getEmotionsFromJsonDataBySessions($scope.selfReportedEmotions, $scope.selectedSpSessions, function(groupedEmotions) {
      console.log('============ groupedEmotions', groupedEmotions);
    });
  }

  $scope.mood = {
    xValue: 0,
    yValue: 0,
    bMoodMapClicked: false
  };

  $scope.moodPoints = [{
    x: 20,
    y: 34
  }, {
    x: 25,
    y: 67
  }];

  var originatorEv;
  $scope.announceClick = function(index) {
    $mdDialog.show(
      $mdDialog.alert()
      .title('You clicked!')
      .textContent('You clicked the menu item at index ' + index)
      .ok('Nice')
      .targetEvent(originatorEv)
    );
    originatorEv = null;
  };

  $scope.onMoodChange = function( /*data*/ ) {
    //$scope.$digest(); //We optimize stuff and only digest our own watchers
  };
});


app.directive('moodMapChart', function() {
  return {
    restricted: 'E',
    scope: {
      mood: '=data',
      changeHandler: '=',
      moodPoints: '='
    },
    controller: function($scope, $element, $attrs, $log, $mdDialog, d3, absFilter, roundFilter) {

      console.log($scope);

      var moodMapLabels = {
        y_top: 'intensity.positive',
        y_bottom: 'intensity.negative',
        x_right: 'feeling.positive',
        x_left: 'feeling.negative'
      };

      var circle = null;

      // Start SVG
      // -------------------------------------------------
      var svg = d3.select($element[0])
        .append('svg')
        .attr('class', 'svg-mood-map-chart');

      svg.append('image')
        .attr('xlink:href', 'http://img15.hostingpics.net/pics/43163359bg.png')
        .attr('class', 'svg-mood-map-chart')
        .attr('height', '100%')
        .attr('width', '100%')
        .attr('x', '0')
        .attr('y', '0');

      var margin = {
        top: 15,
        right: 15,
        bottom: 15,
        left: 15
      };

      var percent = d3.format('%');

      var width = 325;
      var height = 325;

      svg.attr({
        width: width,
        height: height
      });

      //noinspection JSUnresolvedFunction
      var xScale = d3.scale.linear()
        .domain([-1, 1])
        .range([margin.left, width - margin.right])
        .nice();

      //noinspection JSUnresolvedFunction
      var yScale = d3.scale.linear()
        .domain([-1, 1])
        .nice()
        .range([height - margin.top, margin.bottom])
        .nice();

      //noinspection JSUnresolvedFunction
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .tickFormat(percent);

      //noinspection JSUnresolvedFunction
      var yAxis = d3.svg.axis()
        .orient('left')
        .scale(yScale)
        .tickFormat(percent);

      var y_axis_g = svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + width / 2 + ',0)');

      y_axis_g.call(yAxis);

      svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height / 2 + ')')
        .call(xAxis);


      // ---------------------------------------------
      // Add labels to our moodmap svg
      // ---------------------------------------------
      svg.append('text')
        .attr('class', 'x_right_label')
        .attr('text-anchor', 'end')
        .attr('x', width - margin.right)
        .attr('y', height / 2 - 5)
        .text(moodMapLabels.x_right);

      svg.append('text')
        .attr('class', 'x_left_label')
        .attr('text-anchor', 'start')
        .attr('x', margin.left)
        .attr('y', height / 2 - 5)
        .text(moodMapLabels.x_left);

      svg.append('text')
        .attr('class', 'y_top_label')
        .attr('text-anchor', 'end')
        .attr('x', -margin.top)
        .attr('y', width / 2 + 5)
        .attr('dy', '.75em')
        .attr('transform', 'rotate(-90)')
        .text(moodMapLabels.y_top);

      svg.append('text')
        .attr('class', 'y_bottom_label')
        .attr('text-anchor', 'end')
        .attr('x', -height + 95)
        .attr('y', height / 2 + 5)
        .attr('dy', '.75em')
        .attr('transform', 'rotate(-90)')
        .text(moodMapLabels.y_bottom);

      // ---------------------------------------------
      // End adding labels to our moodmap svg
      // ---------------------------------------------


      // -------------------------------------------------
      // Add focuse to the svg element
      // -------------------------------------------------
      $scope.mood.bMoodMapClicked = false;

      var div = d3.select($element[0])
        .append('div')
        .attr('class', 'mood-map-chart-tooltip')
        .style('display', 'none');

      function mousemove() {
        if ($scope.mood.bMoodMapClicked) {
          return;
        }

        // removing circle if exist
        if (circle) {
          circle.transition()
            .attr('r', 15)
            .style('fill', '#FF9800')
            .duration(500)
            .each('end', function() {
              d3.select(this).remove();
            });
        }

        /* jshint -W040 */
        var pos = d3.mouse(this);
        $scope.mood.xValue = absFilter(xScale.invert(pos[0])) > 1 ? Math.sign(xScale.invert(pos[0])) * 1 : xScale.invert(pos[0]);
        $scope.mood.yValue = absFilter(yScale.invert(pos[1])) > 1 ? Math.sign(yScale.invert(pos[1])) * 1 : yScale.invert(pos[1]);

        console.log($scope.mood.xValue);
        console.log($scope.mood.yValue);
        // add x, y position to the div
        div.text(roundFilter($scope.mood.xValue * 100) + ', ' + roundFilter($scope.mood.yValue * 100))
          .style('left', (d3.event.pageX - 28) + 'px')
          .style('top', (d3.event.pageY - 17) + 'px');

        if ($scope.changeHandler) {
          $scope.changeHandler($scope.mood);
        }
      }

      function mouseover() {
        div.style('display', 'inline');
      }

      function mouseout() {
        div.style('display', 'none');
      }

      svg.append('rect')
        .attr('class', 'overlay')
        //.attr('fill', 'url(#bg)')
        // .classed('filled', true)
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);
      //----------------------------------------------------
      // End adding focus
      //----------------------------------------------------


      // ------------------------------------
      // OnClick event on the moodMap
      // ------------------------------------
      svg.on('click', function() {
        if ($scope.mood.bMoodMapClicked) {
          return;
        }

        var e = d3.event;
        // Get relative cursor position
        var xpos = (e.offsetX === undefined) ? e.layerX : e.offsetX;
        var ypos = (e.offsetY === undefined) ? e.layerY : e.offsetY;


        console.log('==== click', e.offsetX, e.layerX);
        console.log('==== click', e.offsetY, e.layerY);

        circle = svg.append('circle')
          .attr('cx', xpos)
          .attr('cy', ypos)
          .style('fill', '#26a9df')
          .attr('r', 5);

        var pos = d3.mouse(this);
        $scope.mood.xValue = absFilter(xScale.invert(pos[0])) > 1 ? Math.sign(xScale.invert(pos[0])) * 1 : xScale.invert(pos[0]);
        $scope.mood.yValue = absFilter(yScale.invert(pos[1])) > 1 ? Math.sign(yScale.invert(pos[1])) * 1 : yScale.invert(pos[1]);

        $scope.mood.bMoodMapClicked = true;
      });

      plotMoodsPoints($scope.moodPoints);

      // plot points on the moodMap
      function plotMoodsPoints(arrayMoods) {
        svg.append('circle')
          .attr('cx', 100)
          .attr('cy', yScale.invert(0))
          .style('fill', '#26a9df')
          .attr('r', 5);

        /*for(var mood in arrayMoods) {
          svg.append('circle')
          .attr('cx', xScale(mood.x))
          .attr('cy', yScale(mood.y))
          .style('fill', '#26a9df')
          .attr('r', 5);
        }*/
      }
    }

  };
});

app.directive('discreteEmotions', function() {
  // controller
  return {
    restricted: 'E',
    templateUrl: 'emoviz-discrete-emotions.client.view.html',
    scope: {
      discrete_emotions: '=data',
      ngDisabled: '='
    },
    controller: function($scope) {

      // Discrete Emotions
      // 'ANGER', 'CONTEMPT', 'DISGUST', 'FEAR', 'HAPPINESS', 'NEUTRAL', 'SADNESS', 'SURPRISE'
      // ----------------------------
      $scope.discrete_emotions = $scope.discrete_emotions || [];
      $scope.discrete_emotions.push({
          emotion_name: 'SURPRISE',
          emotion_display_name: 'surprise',
          emotion_icon: 'sentiment_very_satisfied',
          emotion_level: 20
        }, {
          emotion_name: 'HAPPINESS',
          emotion_display_name: 'happiness',
          emotion_icon: 'mood',
          emotion_level: 0
        }, {
          emotion_name: 'NEUTRAL',
          emotion_display_name: 'neutral',
          emotion_icon: 'sentiment_neutral',
          emotion_level: 0
        }, {
          emotion_name: 'SADNESS',
          emotion_display_name: 'sadness',
          emotion_icon: 'mood_bad',
          emotion_level: 0
        }, {
          emotion_name: 'ANGER',
          emotion_display_name: 'anger',
          emotion_icon: 'sentiment_dissatisfied',
          emotion_level: 0
        },
        // {
        //     emotion_name: 'CONTEMPT',
        //     emotion_icon: 'sentiment_very_dissatisfied',
        //     emotion_level: 0
        // },
        // {
        //     emotion_name: 'DISGUST',
        //     emotion_icon: 'mood_bad',
        //     emotion_level: 0
        // },
        {
          emotion_name: 'FEAR',
          emotion_display_name: 'fear',
          emotion_icon: 'sentiment_very_dissatisfied',
          emotion_level: 0
        }
      );
    }
  };
});