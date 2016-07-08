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
                emotionSum[key.toUpperCase()] += val;
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
        return {neg: (emotionSum['ANGER'] + emotionSum['FEAR'] + emotionSum['SADNESS'] + emotionSum['CONTEMPT'] + emotionSum['DISGUST']) / 5, pos: (emotionSum['HAPPINESS'] + emotionSum['NEUTRAL'] + emotionSum['SURPRISE']) / 3};;
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
