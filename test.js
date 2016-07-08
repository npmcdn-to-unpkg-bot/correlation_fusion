'use strict';


'use strict';

var _ = require('lodash');


var emotions = [
    { "emotion": "NEUTRAL", "mean_value": 0.88901712375, "frequency": 4, dim: 'pp' },
    { "emotion": "HAPPINESS", "mean_value": 0.8065083755, "frequency": 2, dim: 'pp' },
    { "emotion": "CONTEMPT", "mean_value": 0.440965384, "frequency": 1, dim: 'np' }
];

var t = [
    [ { "emotion": "NEUTRAL", "mean_value": 0.915623181, "frequency": 8, "dim": "pp" } ],
    [ { "emotion": "CONTEMPT", "mean_value": 0.5183647, "frequency": 1, "dim": "np" } ]
];

t = [[{"emotion":"NEUTRAL","mean_value":0.7894572859999999,"frequency":3,"dim":"pp"}]]

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

var flatten = _.flatten(t);

console.log(flatten)
var v = _.pluck(flatten, 'mean_value')
v = _.map(v, function (nbr) {
    return nbr / _.sum(v);
});
var mean = { valence: 0, arousal: 0 };
_.forEach(flatten, function (val, index) {
    mean[ 'valence' ] += v[ index ] * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': _.get(val, 'emotion') })), 'valence');
    mean[ 'arousal' ] += v[ index ] * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': _.get(val, 'emotion') })), 'arousal');
});

console.log(_.remove(['a', 'd', 5, 4] , function(n) {
    return n !== 'a'
}))