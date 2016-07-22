'use strict';

var filters = angular.module('filters.client', []);

filters.filter('capitalize', function () {
    return function (string) {
        return (!!string) ? string.charAt(0).toUpperCase() + string.substr(1).toLowerCase() : '';
    };
});

filters.filter('abs', function () {
    return function (number) {
        return Math.abs(number);
    };
});

filters.filter('round', function () {
    return function (nbr) {
        return Math.round(nbr);
    };
});

filters.filter('timeToStr', function () {
    return function (date) {
        var sec = date.getSeconds();
        if (sec.toString().length == 1)
            sec = '0' + sec.toString();
        return date.getMinutes().toString() + ':' + sec;
    };
});

filters.filter('timeToDate', function () {
    return function (offset) {
        return new Date(offset);
    };
});

filters.filter('strToNumber', function () {
    return function (str) {
        return Number(str);
    };
});


filters.filter('scale', function (d3) {
    return function (nbr) {
        var scale = d3.scale.linear();
        scale.domain([ 0, 100 ]);
        scale.range([ -100, 100 ]);
        return scale(nbr);
    };
});


filters.filter('emotionSum', function () {
    return function (screenshotsBySeg) {
        var emotionSum = {
            "SURPRISE": 0,
            "SADNESS": 0,
            "NEUTRAL": 0,
            "HAPPINESS": 0,
            "FEAR": 0,
            "DISGUST": 0,
            "CONTEMPT": 0,
            "ANGER": 0
        };
        _.forEach(screenshotsBySeg, function (screenshotItem) {
            _.forEach(screenshotItem.scores, function (val, key) {
                emotionSum[ key.toUpperCase() ] += val;
            });
        });

        emotionSum = _.mapValues(emotionSum, function (val) {
            return val / _.size(screenshotsBySeg);
        });

        return emotionSum;
    };
});

filters.filter('emotionSumGroup', function () {
    return function (emotionSum) {
        return {
            neg: (emotionSum[ 'ANGER' ] + emotionSum[ 'FEAR' ] + emotionSum[ 'SADNESS' ] + emotionSum[ 'CONTEMPT' ] + emotionSum[ 'DISGUST' ]) / 5,
            pos: (emotionSum[ 'HAPPINESS' ] + emotionSum[ 'NEUTRAL' ] + emotionSum[ 'SURPRISE' ]) / 3
        };
        ;
    };
});


filters.filter('emotionArgmax', function () {
    return function (screenshotsBySeg) {
        return _.map(screenshotsBySeg, function (screenshotItem) {
            return _propPaisWiseArgmax(screenshotItem.scores)
        })
    };
});

filters.filter('emotionArgmaxReduce', function () {
    return function (emotionArgmax) {
        var groupedEmotions = {}
        _.forEach(emotionArgmax, function (array) {
            (groupedEmotions[ array[ 0 ] ] = groupedEmotions[ array[ 0 ] ] || []).push(array[ 1 ]);
        });

        return _.map(groupedEmotions, function (val, key) {
            var matched = _.where(valenceArousalMappingTable, { 'emotion_name': key });
            return {
                emotion: key,
                mean_value: _.sum(val) / _.size(val),
                frequency: _.size(val),
                dim: _.first(_.pluck(matched, 'dim'))
            }
        });

        //return groupedEmotions;
    };
});

filters.filter('emotionArgmaxReduce2ForCASHEmotion', function () {
    return function (emotionArgmax) {
        var groupedEmotions = {}
        _.forEach(emotionArgmax, function (array) {
            (groupedEmotions[ array[ 0 ] ] = groupedEmotions[ array[ 0 ] ] || []).push(array[ 1 ]);
        });

        return _.map(groupedEmotions, function (val, key) {
            var matched = _.where(valenceArousalMappingTable2ForCASHEmotion, { 'emotion_name': key });
            return {
                emotion: key,
                mean_value: _.sum(val) / _.size(val),
                frequency: _.size(val),
                dim: _.first(_.pluck(matched, 'dim')),
                valence: _.first(_.pluck(matched, 'valence')),
                arousal: _.first(_.pluck(matched, 'arousal'))
            }
        });
    };
});

filters.filter('normalizeVector', function () {
    return function (vector) {
        return _.map(vector, function (nbr) {
            return nbr / _.sum(vector);
        });
    };
});

filters.filter('emotionWeightedMean', function () {
    return function (emotionArgmaxCombineFrequent) {
        var flatten = _.flatten(emotionArgmaxCombineFrequent);
        var meanValueVector = _.pluck(flatten, 'mean_value')
        var frequencyVector = _.pluck(flatten, 'frequency')

        meanValueVector = _.map(meanValueVector, function (nbr) {
            return nbr / _.sum(meanValueVector);
        });

        frequencyVector = _.map(frequencyVector, function (nbr) {
            return nbr / _.sum(frequencyVector);
        });

        var mean = { valence: 0, arousal: 0 };

        _.forEach(flatten, function (val, index) {
            mean[ 'valence' ] += frequencyVector[ index ] * meanValueVector[ index ] * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': _.get(val, 'emotion') })), 'valence');
            mean[ 'arousal' ] += frequencyVector[ index ] * meanValueVector[ index ] * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': _.get(val, 'emotion') })), 'arousal');
        });

        return mean;
    };
});

/**
 * This filter will compute the weighted mean for one image
 * given the score object
 */
filters.filter('imageScoresWeightedMean', function () {
    return function (scoresObject) {
        var mean = { valence: 0, arousal: 0 };

        _.forEach(scoresObject, function (val, key) {
            mean[ 'valence' ] += Number(val) * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': key.toUpperCase() })), 'valence');
            mean[ 'arousal' ] += Number(val) * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': key.toUpperCase() })), 'arousal');
        });

        return mean;
    };
});


filters.filter('meanValenceArousal', function () {
    return function (arrayObject) {
        var mean = { valence: 0, arousal: 0 };

        _.forEach(arrayObject, function (object) {
            mean[ 'valence' ] += _.get(object, 'valence');
            mean[ 'arousal' ] += _.get(object, 'arousal');
        });

        mean[ 'valence' ] /= _.size(arrayObject);
        mean[ 'arousal' ] /= _.size(arrayObject);

        return mean;
    };
});

filters.filter('emotionWeightedMean2', function () {
    return function (emotionArgmaxCombineFrequent) {
        var flatten = _.flatten(emotionArgmaxCombineFrequent);
        var v = _.pluck(flatten, 'mean_value')

        v = _.map(v, function (nbr) {
            return nbr / _.sum(v);
        });

        var mean = { valence: 0, arousal: 0 };

        _.forEach(flatten, function (val, index) {
            mean[ 'valence' ] += v[ index ] * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': _.get(val, 'emotion') })), 'valence');
            mean[ 'arousal' ] += v[ index ] * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': _.get(val, 'emotion') })), 'arousal');
        });

        return mean;
    };
});

// Frequent
filters.filter('emotionArgmaxCombineFrequent', function () {
    return function (emotionArgmaxCombine) {

        var groupByDim = _.groupBy(emotionArgmaxCombine, function (item) {
            return item.dim
        });

        return _.map(groupByDim, function (val, key) {
            var frequentEmotion = _.max(val, function (emotion) {
                return emotion.frequency;
            });

            return _.where(val, { frequency: frequentEmotion.frequency });
        });
    };
});

// Frequent 2 for cash emotion
filters.filter('emotionArgmaxCombineFrequent2ForCASHEmotion', function () {
    return function (emotionArgmaxCombineFrequent) {

        var frequentEmotion = _.max(_.flatten(emotionArgmaxCombineFrequent), function (emotion) {
            return emotion.frequency;
        });

        console.log('frequentEmotion===========', frequentEmotion)

        return frequentEmotion;
    };
});


/**
 * this filter will compute the valance value as follows
 * valence = Avg(MaxPos + MaxNeg) // without neutral if neutral second dominant emotion is taken
 */
filters.filter('valenceAsAvgMaxPosMaxNeg', function () {
    return function (imageScores) {
        // get rid of neutral emotion
        // group emotion by pos/neg

        var neutral = _.pick(imageScores, [ 'neutral' ]);
        var pos = _.pick(imageScores, [ 'happiness', 'surprise' ]);
        var neg = _.pick(imageScores, [ 'sadness', 'disgust', 'contempt', 'fear', 'anger' ]);

        var posVal = _propPaisWiseArgmax(pos)[ 1 ];
        var negVal = _propPaisWiseArgmax(neg)[ 1 ];

        var sign = (posVal >= negVal) ? 1 : -1;
        return ((posVal + negVal) * 0.5 + sign * 0.5 * (_.max([ posVal, negVal ]) + sign * _.get(neutral, 'neutral')) );
    };
});

function _propPaisWiseArgmax (object) {
    var vals = _.values(object);
    var keys = _.keys(object);
    var max = _.max(vals);
    return [ keys[ _.indexOf(vals, max) ].toUpperCase(), max ];
}

function _propPaisWiseSum (object) {
    var vals = _.values(object);
    var keys = _.keys(object);
    var max = _.max(vals);
    return [ keys[ _.indexOf(vals, max) ].toUpperCase(), max ];
}

var valenceArousalMappingTable = [
    { 'emotion_name': 'ANGER', 'valence': -37, 'arousal': 47, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'FEAR', 'valence': -61, 'arousal': 7, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'HAPPINESS', 'valence': 68, 'arousal': 7, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'SADNESS', 'valence': -68, 'arousal': -35, 'dim': 'nn', 'dim2': 'neg' },
    { 'emotion_name': 'NEUTRAL', 'valence': 0, 'arousal': 0, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'SURPRISE', 'valence': 30, 'arousal': 8, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'CONTEMPT', 'valence': -55, 'arousal': 43, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'DISGUST', 'valence': -68, 'arousal': 20, 'dim': 'np', 'dim2': 'neg' }
];


var valenceArousalMappingTable2ForCASHEmotion = [
    { 'emotion_name': 'ANGER', 'valence': -37, 'arousal': 47, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'FEAR', 'valence': -61, 'arousal': 7, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'HAPPINESS', 'valence': 68, 'arousal': 7, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'SADNESS', 'valence': -68, 'arousal': -35, 'dim': 'nn', 'dim2': 'neg' },
    { 'emotion_name': 'NEUTRAL', 'valence': 0, 'arousal': 0, 'dim': 'pn', 'dim2': 'pos' },
    { 'emotion_name': 'SURPRISE', 'valence': 30, 'arousal': 8, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'CONTEMPT', 'valence': -55, 'arousal': 43, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'DISGUST', 'valence': -68, 'arousal': 20, 'dim': 'np', 'dim2': 'neg' }
];

var valenceArousalMappingTable3LikertScale = [
    { 'emotion_name': 'ANGER', 'valence': 2.50, 'arousal': 5.93, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'FEAR', 'valence': 2.93, 'arousal': 6.14, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'HAPPINESS', 'valence': 8.48, 'arousal': 6.50, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'SADNESS', 'valence': 2.40, 'arousal': 2.81, 'dim': 'nn', 'dim2': 'neg' },
    { 'emotion_name': 'NEUTRAL', 'valence': 5.50, 'arousal': 3.45, 'dim': 'pn', 'dim2': 'pos' },
    { 'emotion_name': 'SURPRISE', 'valence': 7.44, 'arousal': 6.57, 'dim': 'pp', 'dim2': 'pos' },
    { 'emotion_name': 'CONTEMPT', 'valence': 3.22, 'arousal': 4.61, 'dim': 'np', 'dim2': 'neg' },
    { 'emotion_name': 'DISGUST', 'valence': 3.32, 'arousal': 5.00, 'dim': 'np', 'dim2': 'neg' }
];
