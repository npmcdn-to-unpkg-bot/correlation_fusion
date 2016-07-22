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

t = [ [ { "emotion": "NEUTRAL", "mean_value": 0.7894572859999999, "frequency": 3, "dim": "pp" } ] ]

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

var before = [ 0.000011010633, 0.00006188035, 0.9854224, 0.008629642, 4.97763644e-8, 0.00000174475224, 0.00586750964, 0.00000576942057 ];
var after;
after = _.map(before, function (score) {
    return score / _.sum(before);
});


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

var val = _.pluck(valenceArousalMappingTable, 'valence')
var aro = _.pluck(valenceArousalMappingTable, 'arousal')

var valenceArousalMappingTable2 = [
    {
        'emotion_name': 'ANGER',
        'valence': (-37 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (47 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'np',
        'dim2': 'neg'
    },
    {
        'emotion_name': 'FEAR',
        'valence': (-61 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (7 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'np',
        'dim2': 'neg'
    },
    {
        'emotion_name': 'HAPPINESS',
        'valence': (68 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (7 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'pp',
        'dim2': 'pos'
    },
    {
        'emotion_name': 'SADNESS',
        'valence': (-68 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (-35 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'nn',
        'dim2': 'neg'
    },
    {
        'emotion_name': 'NEUTRAL',
        'valence': (0 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (0 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'pp',
        'dim2': 'pos'
    },
    {
        'emotion_name': 'SURPRISE',
        'valence': (30 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (8 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'pp',
        'dim2': 'pos'
    },
    {
        'emotion_name': 'CONTEMPT',
        'valence': (-55 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (43 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'np',
        'dim2': 'neg'
    },
    {
        'emotion_name': 'DISGUST',
        'valence': (-68 - _.min(val)) / (_.max(val) - _.min(val)),
        'arousal': (20 - _.min(aro)) / (_.max(aro) - _.min(aro)),
        'dim': 'np',
        'dim2': 'neg'
    }
];

var emoimage = {
    "scores": {
        "surprise": 0.0011384387,
        "sadness": 0.0259804484,
        "neutral": 0.104876392,
        "happiness": 0.0151742185,
        "fear": 6.458906E-4,
        "disgust": 0.3660874,
        "contempt": 0.440965384,
        "anger": 0.0451318175
    },
    "screenshot": "screenshot116-cropped.jpg"
};


function weightedMean (scoresObject) {
    var mean = { valence: 0, arousal: 0 };

    _.forEach(scoresObject, function (val, key) {
        mean[ 'valence' ] += Number(val) * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': key.toUpperCase() })), 'valence');
        mean[ 'arousal' ] += Number(val) * _.get(_.first(_.where(valenceArousalMappingTable, { 'emotion_name': key.toUpperCase() })), 'arousal');
    });

    return mean;
}

var array = [ [ 2, 4 ], [ 2, 5 ], [ 5, 7 ] ];
_.each(array, function (item, index) {
    console.log(item, index)
})