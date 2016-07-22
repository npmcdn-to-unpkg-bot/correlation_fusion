'use strict';

var fs = require('fs');

var controllers = angular.module('controllers.client', []);

controllers.controller('MainCtrl', function ($scope, $http, $mdToast, d3, roundFilter, $log, scaleFilter, emotionSumFilter, emotionSumGroupFilter, emotionArgmaxFilter, emotionArgmaxReduceFilter, emotionArgmaxCombineFrequentFilter, emotionWeightedMeanFilter) {

    $scope.spSessions = [];
    //$scope.selfReportedEmotions = [];
    $scope.selectedSpSessions = [];
    $scope.moodPoints = [];
    $scope.startEndSwitcher = 'START';

    $scope.discrete_emotions = [ {
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
        } ];

    var valenceArousalMappingTable = [
        { 'emotion_name': 'ANGER', 'valence': -37, 'arousal': 47, dim: 'np' },
        { 'emotion_name': 'FEAR', 'valence': -61, 'arousal': 7, dim: 'np' },
        { 'emotion_name': 'HAPPINESS', 'valence': 68, 'arousal': 7, dim: 'pp' },
        { 'emotion_name': 'SADNESS', 'valence': -68, 'arousal': -35, dim: 'nn' },
        { 'emotion_name': 'NEUTRAL', 'valence': 0, 'arousal': 0, dim: 'pp' },
        { 'emotion_name': 'SURPRISE', 'valence': 30, 'arousal': 8, dim: 'pp' },
        { 'emotion_name': 'CONTEMPT', 'valence': -55, 'arousal': 43, dim: 'np' },
        { 'emotion_name': 'DISGUST', 'valence': -68, 'arousal': 20, dim: 'np' }
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
                /*sp_sessions = _.remove(sp_sessions , function(session) {
                 return session !== '575ef103f1a57a61252b4fe7';
                 });*/
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
            selectedSpSessions = [ selectedSpSessions ];
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
        return Object.keys($scope.toastPosition).filter(function (pos) {
            return $scope.toastPosition[ pos ];
        }).join(' ');
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
            $mdToast.simple().textContent(message).position(pinTo).hideDelay(3000)
        );
    };

    $scope.projectedDiscreteEmotions = [];
    $scope.applyProjectDiscreteEmotions = function () {

        $scope.projectedDiscreteEmotions = [];
        var filter = _.filter($scope.discrete_emotions, function (item) {
            return _.size(item.emotion_level) > 0;
        });

        if (_.size(filter)) {
            _.forEach(filter, function (item) {
                var matchedValenceArousal = _.where(valenceArousalMappingTable, { 'emotion_name': item.emotion_name });
                $scope.projectedDiscreteEmotions.push([ _.first(_.pluck(matchedValenceArousal, 'valence')) / 100.00, _.first(_.pluck(matchedValenceArousal, 'arousal')) / 100.00, item.emotion_name, item.emotion_level ])
            });

            // get
            $scope.projectedDiscreteEmotions.push(_getWeightedMeanPoint($scope.projectedDiscreteEmotions));
        } else {
            $scope.showSimpleToast('Nothing to map!');
        }
    };

    /**
     * Map projected points discrete emotions
     *
     * @param projectedPoints
     * @private
     */
    function _getWeightedMeanPoint (projectedPoints) {
        // get positive points with weights
        var weightsPoisitivesPoints = { points: [], weights: [] };
        _.forEach(projectedPoints, function (item) {
            //if (item[ 0 ] > 0 && item[ 1 ] > 0) {
            weightsPoisitivesPoints[ 'points' ].push([ item[ 0 ], item[ 1 ] ]);
            weightsPoisitivesPoints[ 'weights' ].push(item[ 3 ]);
            ///}
        });
        // normalize weights
        var W = _.map(weightsPoisitivesPoints[ 'weights' ], function (w) {
            return w / _.sum(weightsPoisitivesPoints[ 'weights' ]);
        });

        // compute mean weight
        var xMean = 0, yMean = 0;
        weightsPoisitivesPoints[ 'weights' ][ 0 ] = 100;

        _.forEach(weightsPoisitivesPoints[ 'points' ], function (xy, index) {
            xMean += W[ index ] * xy[ 0 ];
            yMean += W[ index ] * xy[ 1 ];
        });

        return [ xMean, yMean, 'Weighted Mean' ];
    }

    function _propPaisWiseArgmax (object) {
        var vals = _.values(object);
        var keys = _.keys(object);
        var max = _.max(vals);
        return [ keys[ _.indexOf(vals, max) ].toUpperCase(), max ];
    }

    function _getEmotionsFromVideoJsonData (jsonData, spSession) {

        var videoemotions = _.where(jsonData, { 'sp_session': { '$oid': spSession } });
        videoemotions = _.first(videoemotions);

        if (!videoemotions) {
            return [];
        }

        var res = _.map(videoemotions.video_emotion_scores, function (item) {
            var _max = _propPaisWiseArgmax(item.scores);
            var matchedValenceArousal = _.where(valenceArousalMappingTable, { 'emotion_name': _max[ 0 ] });
            return [ _.first(_.pluck(matchedValenceArousal, 'valence')) / 100.00, _.first(_.pluck(matchedValenceArousal, 'arousal')) / 100.00 ].concat(_max);
        });

        return res;
    }

    // scale VB emotions as arousal & valence are between 0 and 100
    var scale = d3.scale.linear();
    scale.domain([ 0, 100 ]);
    scale.range([ -100, 100 ]);
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
                return [ emotion.valence_level, emotion.arousal_level ];
            });

            var discrete_emotions = _.pluck(emotions, 'discrete_emotions');

            discrete_emotions = _.reduceRight(discrete_emotions, function (flattened, other) {
                return flattened.concat(other);
            }, []);

            discrete_emotions = _.chain(discrete_emotions).groupBy('emotion_name').value();

            discrete_emotions = _.mapValues(discrete_emotions, function (tab) {
                return _.pluck(tab, 'emotion_level')
            });

            _.map($scope.discrete_emotions, function (item) {
                item.emotion_level = [];

                return item
            });

            _.forEach(discrete_emotions, function (emotionLevelValues, emotionName) {
                var objectToChange = _.find($scope.discrete_emotions, { emotion_name: emotionName });
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
        var audioEmotions = _.where($scope.audioEmotions, { 'sp_session': { '$oid': $scope.selectedSpSessions } });
        audioEmotions = _.first(audioEmotions);
        if (audioEmotions) {
            $scope.bShowTtable = true;
            $scope.jTotableAudioEmotions = audioEmotions[ 'audio_emotion_scores' ];

            // FIXME-EMOVIZ remove this from here
            var audioValenceArousalBySegment = [];
            _.forEach($scope.jTotableAudioEmotions.result.analysisSegments, function (sig) {
                var from = sig.offset;
                from = new Date(from);
                from = TimeTostr(from);

                var to = new Date(Number(sig.duration) + sig.offset);
                to = TimeTostr(to);

                audioValenceArousalBySegment.push([ scale(sig.analysis.Valence.Value) / 100.00, scale(sig.analysis.Arousal.Value) / 100.00, '', from, to ]);
            });

            $scope.audioValenceArousalBySegment = audioValenceArousalBySegment;
            // console.log('$scope.audioValenceArousalBySegment', $scope.audioValenceArousalBySegment);
        } else {
            $scope.bShowTtable = false;
        }

        // project discrete emotions
        $scope.applyProjectDiscreteEmotions();

        $scope.videoEmotionsForMoodMap = _getEmotionsFromVideoJsonData($scope.videoEmotions, $scope.selectedSpSessions);

        // _plotVideoEmotionsLineChart($scope.videoEmotions, $scope.selectedSpSessions);
        _plotAudioEmotionsLineChart($scope.audioEmotions, $scope.selectedSpSessions);

        // FIXME-EMOVIZ 
        $scope.screenshotsOfAudioSegment = _getScreenshotsOfAudioSegment($scope.audioEmotions, 4, $scope.videoEmotions, $scope.selectedSpSessions)
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
            $mdDialog.alert().title('You clicked!').textContent('You clicked the menu item at index ' + index).ok('Nice').targetEvent(originatorEv)
        );
        originatorEv = null;
    };

    function TimeTostr (date) {
        var sec = date.getSeconds();
        if (sec.toString().length == 1)
            sec = '0' + sec.toString();
        return date.getMinutes().toString() + ':' + sec;
    }

    function _plotVideoEmotionsLineChart (jsonData, spSession) {

        var res = [];
        var videoemotions = _.where(jsonData, { 'sp_session': { '$oid': spSession } });
        videoemotions = _.first(videoemotions);

        if (!videoemotions) {
            return res;
        }
        var res = _.map(videoemotions.video_emotion_scores, function (item, index) {
            var merged = _.merge({ x: index + 1 }, item.scores);
            return merged;
        });

        $scope.data = {
            dataset0: [ {
                x: 0,
                "surprise": 0,
                "sadness": 0,
                "neutral": 0,
                "happiness": 0,
                "fear": 0,
                "disgust": 0,
                "contempt": 0,
                "anger": 0
            } ].concat(res)
        };

        $log.info('$scope.data', $scope.data.dataset0.slice(0, 3))

        $scope.options = {
            series: [
                {
                    axis: "y",
                    dataset: "dataset0",
                    key: "surprise",
                    label: "surprise",
                    color: "#1f77b4",
                    type: [ 'dot' ],
                    id: 'surprise'
                },
                {
                    axis: "y",
                    dataset: "dataset0",
                    key: "neutral",
                    label: "neutral",
                    color: "red",
                    type: [ 'dot' ],
                    id: 'neutral'
                },
                {
                    axis: "y",
                    dataset: "dataset0",
                    key: "happiness",
                    label: "happiness",
                    color: "green",
                    type: [ 'dot' ],
                    id: 'happiness'
                }
            ],
            axes: { x: { key: "x" } }
        };
    }

    /**
     * Get screenshots by audio segment
     *
     * @param lisSegments
     * @param interval
     * @param jsonData
     * @param spSession
     * @private
     */
    function _getScreenshotsOfAudioSegmentOld (lisSegments, interval, jsonData, spSession) {
        // get video data by spSession
        var videoEmotions = _.where(jsonData, { 'sp_session': { '$oid': spSession } });
        videoEmotions = _.first(videoEmotions);
        videoEmotions = _.get(videoEmotions, 'video_emotion_scores');

        console.log('$$$ videoEmotions', videoEmotions);

        var screenshotsOrderedByAudioSegments = [];
        var start = 1, end = 0;
        _.forEach(lisSegments, function (seg) {

            // 1 get screenshots number to take
            try {
                seg /= 1000.00; // ms to s
                var number = Math.floor(seg / interval);
            } catch (e) {
                $log.error('error getting screenshots number to take');
                throw e;
            }

            // get screenshots of the segment
            end += number;
            // generate seg screenshots
            var segScreenshotNames = [];
            for (var i = start; i <= end; i++) {
                segScreenshotNames.push('screenshot' + i + '-cropped.jpg');
            }

            // find objects by names
            var segScreenshots = _(videoEmotions).indexBy('screenshot').at(segScreenshotNames).value()
            // get rid of undefined null '' is exist
            segScreenshots = _.filter(segScreenshots, function (item) {
                return !!item;
            });

            screenshotsOrderedByAudioSegments.push(segScreenshots);
            start = end + 1;
        });

        // console.log('$$$ screenshotsOrderedByAudioSegments', screenshotsOrderedByAudioSegments);
    }


    function _getScreenshotsOfAudioSegment (audioJsonData, interval, videoJsonData, spSession) {
        // get video data by spSession
        var videoEmotions = _.where(videoJsonData, { 'sp_session': { '$oid': spSession } });
        videoEmotions = _.first(videoEmotions);
        videoEmotions = _.get(videoEmotions, 'video_emotion_scores');

        // console.log('$$$ videoEmotions', videoEmotions);

        var audioEmotions = _.where(audioJsonData, { 'sp_session': { '$oid': spSession } });
        audioEmotions = _.first(audioEmotions);
        audioEmotions = _.get(audioEmotions, 'audio_emotion_scores');

        var screenshotBySegs = {};
        _.forEach(videoEmotions, function (vItem) {

            // compute screenshot time position
            // get screenshot number
            var screenshotNbr = Number(vItem[ 'screenshot' ].slice(10).replace('-cropped.jpg', ''));
            var screenshotTimePosition = ((screenshotNbr * interval) - interval) * 1000;

            _.forEach(audioEmotions.result.analysisSegments, function (oItem, index) {
                var oSegsTimeEnd = _.last(audioEmotions.result.analysisSegments).offset + _.last(audioEmotions.result.analysisSegments).duration;
                var oSegTimeEnd = oItem.offset + oItem.duration;
                var oSegTimeStart = oItem.offset;

                if (screenshotTimePosition >= oSegsTimeEnd) {
                    (screenshotBySegs[ _.size(audioEmotions.result.analysisSegments) - 1 ] = (screenshotBySegs[ _.size(audioEmotions.result.analysisSegments) - 1 ] || [])).push(vItem);
                    return false;
                } else if (screenshotTimePosition >= oSegTimeStart && screenshotTimePosition <= oSegTimeEnd) {
                    (screenshotBySegs[ index ] = (screenshotBySegs[ index ] || [])).push(vItem);
                    return false;
                }
            })
        });

        return screenshotBySegs;
    }

    function mapScreenshotBySegs (screenshotBySegs) {
        if (!_.size(screenshotBySegs)) {
            return {};
        }

        _.mapValues(screenshotBySegs, function (item) {

            _.map(item, function (screenshotItem) {
                return _propPaisWiseArgmax(screenshotItem.scores)
            })

        });

    }

    $scope.showIt = true;

    function _plotAudioEmotionsLineChart (jsonData, spSession) {

        $scope.showIt = true;

        if ($scope.selectedSpSessions === '575ef103f1a57a61252b4fe7') {
            $scope.showIt = false;
        }


        var valenceArousalAsPosNegNeu = {
            'positive': 100,
            'negative': -100,
            'neutral': 0,
            'low': -100,
            'high': 100
        };

        var valenceArousalAsPosNeg = {
            'positive': 100,
            'negative': -100,
            'neutral': 100,
            'low': -100,
            'high': 100
        };

        var resVA = [];
        var resPosNegNeu = [];
        var resPosNeg = [];
        var resPosNegNeuArousal = [];
        var resMeanStrategy = [];

        var audioemotions = _.where(jsonData, { 'sp_session': { '$oid': spSession } });
        audioemotions = _.first(audioemotions);

        if (!audioemotions) {
            return resVA;
        }
        resVA = _.map(audioemotions.audio_emotion_scores.result.analysisSegments, function (seg, index1) {
            return {
                x: index1,
                valence: roundFilter(scaleFilter(seg.analysis.Valence.Value)),
                arousal: roundFilter(scaleFilter(seg.analysis.Arousal.Value))
            };
        });

        resPosNegNeu = _.map(audioemotions.audio_emotion_scores.result.analysisSegments, function (seg, index) {
            return {
                x: index,
                valence: valenceArousalAsPosNegNeu[ seg.analysis.Valence.Group ],
                arousal: valenceArousalAsPosNegNeu[ seg.analysis.Arousal.Group ]
            };
        });

        resPosNeg = _.map(audioemotions.audio_emotion_scores.result.analysisSegments, function (seg, index2) {
            return {
                x: index2,
                valence: valenceArousalAsPosNeg[ seg.analysis.Valence.Group ],
                arousal: valenceArousalAsPosNeg[ seg.analysis.Arousal.Group ]
            };
        });

        var valence = 0;
        var screenshotsBySeg = _getScreenshotsOfAudioSegment($scope.audioEmotions, 4, $scope.videoEmotions, $scope.selectedSpSessions);

        var valenceArousal = {};
        _.forEach(screenshotsBySeg, function (vItems, index) {
            // strategy sum pos > neg
            valence = (emotionSumGroupFilter(emotionSumFilter(vItems))[ 'pos' ] >= emotionSumGroupFilter(emotionSumFilter(vItems))[ 'neg' ]) ? 1 : -1;
            resPosNegNeuArousal.push({ x: Number(index), valence: valence * 100 });

            // strategy mean
            valenceArousal = emotionArgmaxFilter(vItems);
            valenceArousal = emotionArgmaxReduceFilter(valenceArousal);
            valenceArousal = emotionArgmaxCombineFrequentFilter(valenceArousal);
            valenceArousal = emotionWeightedMeanFilter(valenceArousal);

            resMeanStrategy.push({
                x: Number(index),
                valence: _.get(valenceArousal, 'valence'),
                arousal: _.get(valenceArousal, 'arousal')
            });
        });


        var resAudioVideoMeanFusion = [];
        _.forEach(resMeanStrategy, function (va, index) {

            resAudioVideoMeanFusion.push({
                x: index,
                valence: (_.get(va, 'valence') + _.get(resVA[ index ], 'valence')) / 2,
                arousal: (_.get(va, 'arousal') + _.get(resVA[ index ], 'arousal')) / 2
            });
        });


        // map resMeanStrategy to moodmap
        var resMeanStrategyMoodMap = _.map(resMeanStrategy, function (item) {
            return [ item.valence / 100.00, item.arousal / 100.00, '', '' ];
        });

        $scope.audiodata = {
            dataset0: [
                //{ x: 0, valence: 0, arousal: 0 },
            ].concat(resVA),
            dataset1: [
                //{ x: 0, valence: 0, arousal: 0 },
            ].concat(resPosNegNeu),
            dataset2: [
                //{ x: 0, valence: 0 },
            ].concat(resPosNegNeuArousal),
            dataset3: [
                //{ x: 0, valence: 0 },
            ].concat(resPosNeg),
            dataset4: [
                //{ x: 0, valence: 0 },
            ].concat(resMeanStrategy),
            dataset5: resMeanStrategyMoodMap,
            dataset6: resAudioVideoMeanFusion
        };


        $scope.audiooptionsVA = {
            series: [
                {
                    axis: "y",
                    dataset: "dataset0",
                    key: "valence",
                    label: "Valence Audio",
                    color: "#FFD600",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries0'
                },
                {
                    axis: "y",
                    dataset: "dataset4",
                    key: "valence",
                    label: "Valence Video",
                    color: "#64DD17",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries00'
                },
                {
                    axis: "y",
                    dataset: "dataset6",
                    key: "valence",
                    label: "Mean Valence",
                    color: "#D500F9",
                    type: [ 'line', 'dot' ],
                    id: 'mySeriesMean2'
                },
                {
                    axis: "y",
                    dataset: "dataset0",
                    key: "arousal",
                    label: "Arousal Audio",
                    color: "#01579B",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries1'
                },
                {
                    axis: "y",
                    dataset: "dataset4",
                    key: "arousal",
                    label: "Arousal Video",
                    color: "#00B8D4",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries11'
                },
                {
                    axis: "y",
                    dataset: "dataset6",
                    key: "arousal",
                    label: "Mean Arousal",
                    color: "#F50057",
                    type: [ 'line', 'dot' ],
                    id: 'mySeriesMean1'
                }
            ],
            axes: { x: { key: "x" } }
        };


        fs.writeFile('./datasetsBySession.json', $scope.audiooptionsVA, function (err) {
            if (err) throw err;
            $log.info('It\'s saved!');
        });

        $scope.audiooptionsPosNegNeu = {
            series: [
                {
                    axis: "y",
                    dataset: "dataset1",
                    key: "valence",
                    label: "Valence Audio",
                    color: "#FFD600",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries0'
                },
                {
                    axis: "y",
                    dataset: "dataset2",
                    key: "valence",
                    label: "Valence Video",
                    color: "#64DD17",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries2'
                },
                {
                    axis: "y",
                    dataset: "dataset1",
                    key: "arousal",
                    label: "Arousal Audio",
                    color: "#01579B",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries1'
                }
            ],
            axes: { x: { key: "x" } }

        };


        $scope.audiooptionsPosNeg = {
            series: [
                {
                    axis: "y",
                    dataset: "dataset3",
                    key: "valence",
                    label: "Valence Audio",
                    color: "#FFD600",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries0'
                },
                {
                    axis: "y",
                    dataset: "dataset2",
                    key: "arousal",
                    label: "Valence Video",
                    color: "#64DD17",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries2'
                },
                {
                    axis: "y",
                    dataset: "dataset3",
                    key: "arousal",
                    label: "Arousal Audio",
                    color: "#01579B",
                    type: [ 'line', 'dot' ],
                    id: 'mySeries1'
                }
            ],
            axes: { x: { key: "x" } }
        }

    }


});
