'use strict';

var controllers = angular.module('controllers.client', []);

controllers.controller('MainCtrl', function ($scope, $http, $mdToast, d3, roundFilter) {
        $scope.spSessions = [];
        //$scope.selfReportedEmotions = [];
        $scope.selectedSpSessions = [];
        $scope.moodPoints = [];
        $scope.startEndSwitcher = 'START';

        $scope.discrete_emotions = [{
            emotion_name: 'SURPRISE',
            emotion_display_name: 'surprise',
            emotion_icon: 'sentiment_very_satisfied',
            emotion_level: []
        }, {
            emotion_name: 'HAPPINESS',
            emotion_display_name: 'happiness',
            emotion_icon: 'mood',
            emotion_level: []
        }, {
            emotion_name: 'NEUTRAL',
            emotion_display_name: 'neutral',
            emotion_icon: 'sentiment_neutral',
            emotion_level: []
        }, {
            emotion_name: 'SADNESS',
            emotion_display_name: 'sadness',
            emotion_icon: 'mood_bad',
            emotion_level: []
        }, {
            emotion_name: 'ANGER',
            emotion_display_name: 'anger',
            emotion_icon: 'sentiment_dissatisfied',
            emotion_level: []
        },
            {
                emotion_name: 'FEAR',
                emotion_display_name: 'fear',
                emotion_icon: 'sentiment_very_dissatisfied',
                emotion_level: []
            }];

        var valenceArousalMappingTable = [
                {'emotion_name': 'ANGER', 'valence': -37, 'arousal': 47},
                {'emotion_name': 'FEAR', 'valence': -61, 'arousal': 7},
                {'emotion_name': 'HAPPINESS', 'valence': 68, 'arousal': 7},
                {'emotion_name': 'SADNESS', 'valence': -68, 'arousal': -35},
                {'emotion_name': 'NEUTRAL', 'valence': 0, 'arousal': 0},
                {'emotion_name': 'SURPRISE', 'valence': 30, 'arousal': 8},
                {'emotion_name': 'CONTEMPT', 'valence': -55, 'arousal': 43}
        ];

        // initialization
        _init();

        // loading json data
        // --------------------
        function _init () {
            // load self reported json data
            async.waterfall([
                function (callback) {
                    $http.get('./data/emoselfreporteds.json').then(function (res) {
                        callback(null, res.data.selfReported);
                        $scope.selfReportedEmotions = _.sortBy(res.data.selfReported, 'created.$date');
                    }, function (error) {
                        callback(error);
                    });
                },
                // fill session filter after loading json data
                function (data, callback) {
                    var sp_sessions = _.sortBy(data, 'created.$date');
                    sp_sessions = _.map(sp_sessions, _.partialRight(_.pick, 'sp_session'));
                    sp_sessions = _.uniq(_.pluck(sp_sessions, 'sp_session.$oid'));
                    callback(null, data, sp_sessions);
                }
            ], function (err, data, sessions) {
                if (err) {
                    console.log(err);
                    return;
                }
                // put filtered spSession & selfReportedEmotions in the scope
                $scope.spSessions = sessions;
                $scope.selfReportedEmotions = _.sortBy(data, 'created.$date');
            });

            // start loading audios json data
            async.waterfall([
                function (callback) {
                    $http.get('./data/emoaudios.json').then(function (res) {
                        $scope.audioEmotions = res.data;
                        callback(null, $scope.audioEmotions);
                    }, function (err) {
                        callback(err);
                    });
                }
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return;
                }
                $scope.audioEmotions = data;
            });

            // start loading videos json data
            async.waterfall([
                function (callback) {
                    $http.get('./data/emovideos.json').then(function (res) {
                        $scope.videoEmotions = res.data;
                        callback(null, $scope.videoEmotions);
                    }, function (err) {
                        callback(err);
                    });
                }
            ], function (err, data) {
                if (err) {
                    console.log(err);
                    return;
                }
                $scope.videoEmotions = data;
            });
        }


        function _getEmotionsFromJsonDataBySessions (jsonData, selectedSpSessions, callback) {

            if (typeof selectedSpSessions === 'string') {
                selectedSpSessions = [selectedSpSessions];
            }

            var emotions = [];
            _.forEach(selectedSpSessions, function (spSessionId) {
                var filtered = _.where(jsonData, {
                    'sp_session': {
                        '$oid': spSessionId
                    },
                    'check_point': $scope.startEndSwitcher
                });

                filtered = _.map(filtered, _.partialRight(_.pick, 'sp_session', 'emotions', 'check_point', 'created'));
                emotions = emotions.concat(filtered);
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

        $scope.getToastPosition = function () {
            sanitizePosition();
            return Object.keys($scope.toastPosition)
                .filter(function (pos) {
                    return $scope.toastPosition[pos];
                })
                .join(' ');
        };

        function sanitizePosition () {
            var current = $scope.toastPosition;
            if (current.bottom && last.top) current.top = false;
            if (current.top && last.bottom) current.bottom = false;
            if (current.right && last.left) current.left = false;
            if (current.left && last.right) current.right = false;
            last = angular.extend({}, current);
        }

        $scope.showSimpleToast = function (message) {
            var pinTo = $scope.getToastPosition();
            $mdToast.show(
                $mdToast.simple()
                    .textContent(message)
                    .position(pinTo)
                    .hideDelay(3000)
            );
        };

        $scope.projectedDiscreteEmotions = [];
        $scope.applyProjectDiscreteEmotions = function () {

            $scope.projectedDiscreteEmotions = [];
            var filter = _.filter($scope.discrete_emotions, function (item) {
               return  _.size(item.emotion_level) > 0;
            });

            if (_.size(filter)) {
                _.forEach(filter, function (item) {
                    var matchedValenceArousal = _.where(valenceArousalMappingTable, {'emotion_name': item.emotion_name});
                    $scope.projectedDiscreteEmotions.push([_.first(_.pluck(matchedValenceArousal, 'valence')) / 100.00, _.first(_.pluck(matchedValenceArousal, 'arousal')) / 100.00, item.emotion_name, item.emotion_level])
                 });

                console.log('$scope.projectedDiscreteEmotions', $scope.projectedDiscreteEmotions);
            } else {
                $scope.showSimpleToast('Nothing to map!');
            }
        };

        function _propPaisWiseArgmax(object) {
            var vals = _.values(object);
            var keys  =_.keys(object);
            var max = _.max(vals);
            return [keys[_.indexOf(vals, max)].toUpperCase(), max];
        }

        function _getEmotionsFromVideoJsonData (jsonData, spSession) {

            var videoemotions = _.where(jsonData, {'sp_session': {'$oid': spSession}});
            videoemotions = _.first(videoemotions);

            var res = _.map(videoemotions.video_emotion_scores, function(item) {
                var _max = _propPaisWiseArgmax(item.scores);
                var matchedValenceArousal = _.where(valenceArousalMappingTable, {'emotion_name': _max[0]});
                return [_.first(_.pluck(matchedValenceArousal, 'valence')) / 100.00, _.first(_.pluck(matchedValenceArousal, 'arousal')) / 100.00].concat(_max);
            });

            console.log('videoemotions res', res);

            return res;
        }

        // scale VB emotions as arousal & valence are between 0 and 100
        var scale = d3.scale.linear();
        scale.domain([0, 100]);
        scale.range([-100, 100]);
        $scope.applyFilter = function () {
            if (_.size($scope.selectedSpSessions) === 0) {
                $scope.showSimpleToast('Please select a session!');
                return;
            }

            // get and display discrete emotions & moodmap
            _getEmotionsFromJsonDataBySessions($scope.selfReportedEmotions, $scope.selectedSpSessions, function (groupedEmotions) {

                var filter = _.map(groupedEmotions, _.partialRight(_.pick, 'emotions'));

                var emotions = _.pluck(filter, 'emotions');

                var mood = _.map(emotions, function (emotion) {
                    return [emotion.valence_level, emotion.arousal_level];
                });

                var discrete_emotions = _.pluck(emotions, 'discrete_emotions');

                discrete_emotions = _.reduceRight(discrete_emotions, function (flattened, other) {
                    return flattened.concat(other);
                }, []);

                discrete_emotions = _.chain(discrete_emotions)
                    .groupBy('emotion_name')
                    .value();

                discrete_emotions = _.mapValues(discrete_emotions, function (tab) {
                    return _.pluck(tab, 'emotion_level')
                });

                _.map($scope.discrete_emotions, function (item) {
                    item.emotion_level = [];

                    return item
                });

                _.forEach(discrete_emotions, function (emotionLevelValues, emotionName) {
                    var objectToChange = _.find($scope.discrete_emotions, {emotion_name: emotionName});
                    var index = _.indexOf($scope.discrete_emotions, objectToChange);
                    $scope.discrete_emotions.splice(index, 1, {
                        emotion_name: emotionName,
                        emotion_display_name: objectToChange.emotion_display_name,
                        emotion_icon: objectToChange.emotion_icon,
                        emotion_level: emotionLevelValues
                    });
                });

                $scope.discrete_emotions = _.cloneDeep($scope.discrete_emotions);
                $scope.moodPoints = mood;
            });

            // display audio emotions
            // -----------------------
            $scope.bShowTtable = false;
            var audioEmotions = _.where($scope.audioEmotions, {'sp_session': {'$oid': $scope.selectedSpSessions}});
            audioEmotions = _.first(audioEmotions);
            if (audioEmotions) {
                $scope.bShowTtable = true;
                $scope.jTotableAudioEmotions = audioEmotions['audio_emotion_scores'];

                // FIXME-EMOVIZ remove this from here
                var audioValenceArousalBySegment = [];
                _.forEach($scope.jTotableAudioEmotions.result.analysisSegments, function (sig) {
                    var from = sig.offset;
                    from = new Date(from);
                    from = TimeTostr(from);

                    var to = new Date(Number(sig.duration) + sig.offset);
                    to = TimeTostr(to);

                    audioValenceArousalBySegment.push([scale(sig.analysis.Valence.Value) / 100.00, scale(sig.analysis.Arousal.Value) / 100.00, '', from, to]);
                });

                $scope.audioValenceArousalBySegment = audioValenceArousalBySegment;
                console.log('$scope.audioValenceArousalBySegment', $scope.audioValenceArousalBySegment)
            } else {
                $scope.bShowTtable = false;
            }

            // project discrete emotions
            $scope.applyProjectDiscreteEmotions();

            $scope.videoEmotionsForMoodMap = _getEmotionsFromVideoJsonData($scope.videoEmotions, $scope.selectedSpSessions);
        };

        $scope.mood = {
            xValue: 0,
            yValue: 0,
            bMoodMapClicked: false
        };

        //// $scope.moodPoints = [[0.20, 0.34], [0.25, 0.67]];

        var originatorEv;
        $scope.announceClick = function (index) {
            $mdDialog.show(
                $mdDialog.alert()
                    .title('You clicked!')
                    .textContent('You clicked the menu item at index ' + index)
                    .ok('Nice')
                    .targetEvent(originatorEv)
            );
            originatorEv = null;
        };

        function jTotable (json, tblName) {

            console.log(json);
            try {
                if (json.result.analysisSegments) {
                    var duration = Number(json.result.duration);
                    json.result.analysisSegments.forEach(function (sig, indx) {
                        var tr = $('<tr>');
                        var time = sig.offset;
                        var fr = new Date(time);
                        tr.append($('<td>').text(TimeTostr(fr)));//(fr.getMinutes() + ':' + fr.getSeconds()));
                        var to = new Date(Number(sig.duration) + time);
                        tr.append($('<td>').text(TimeTostr(to)));
                        tr.append($('<td>').text(TimeTostr(new Date(Number(sig.duration)))));
                        tr.append($('<td>').text(sig.analysis.Temper.Group + ' : ' + sig.analysis.Temper.Value));
                        tr.append($('<td>').text(sig.analysis.Valence.Group + ' : ' + sig.analysis.Valence.Value));
                        tr.append($('<td>').text(sig.analysis.Arousal.Group + ' : ' + sig.analysis.Arousal.Value));
                        //tr.append($('<td>').html('<span class="p">' + sig.analysis.Mood.Group11.Primary.Phrase + '</span><br/><span class="s">' + sig.analysis.Mood.Group11.Secondary.Phrase + '</span>'));
                        //tr.append($('<td>').html('<span class="p">' + sig.analysis.Mood.Composite.Primary.Phrase + '</span><br/><span class="s">' + sig.analysis.Mood.Composite.Secondary.Phrase + '</span>'));


                        $('table#' + tblName + ' tbody').append(tr);//prepend
                    });

                }
            }
            catch (err) {

            }
        }


        function TimeTostr (date) {
            var sec = date.getSeconds();
            if (sec.toString().length == 1)
                sec = '0' + sec.toString();
            return date.getMinutes().toString() + ':' + sec;
        }


    }
);
