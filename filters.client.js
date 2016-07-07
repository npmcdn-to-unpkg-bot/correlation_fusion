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
        scale.domain([0, 100]);
        scale.range([-100, 100]);
        return scale(nbr);
    };
});

filters.filter('emotionArgmax', function () {
    return function (screenshotsBySeg) {
       return  _.map(screenshotsBySeg, function (screenshotItem) {
            return _propPaisWiseArgmax(screenshotItem.scores)
        })
    };
});

filters.filter('emotionArgmaxCombine', function () {
    return function (emotionArgmax) {
        var groupedEmotions = {}
        _.forEach(emotionArgmax, function (array) {
            (groupedEmotions[array[0]] = groupedEmotions[array[0]] || []).push(array[1]);
        });

        return _.map(groupedEmotions, function (val, key) {
            return {emotion: key, mean_value: _.sum(val) / _.size(val), frequency: _.size(val) }
        });

        //return groupedEmotions;
    };
});

// Frequent
filters.filter('emotionArgmaxCombineFrequent', function () {
    return function (emotionArgmaxCombine) {
        var frequentEmotion = _.max(emotionArgmaxCombine, function (emotion) {
            return emotion.frequency;
        });

        return _.where(emotionArgmaxCombine, {frequency: frequentEmotion.frequency});
    };
});

function _propPaisWiseArgmax (object) {
    var vals = _.values(object);
    var keys = _.keys(object);
    var max = _.max(vals);
    return [ keys[ _.indexOf(vals, max) ].toUpperCase(), max ];
}