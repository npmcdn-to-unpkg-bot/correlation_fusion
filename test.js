'use strict';


'use strict';

var _ = require('lodash');

var users = require('./data/emovideos.js')

var valenceArousalMappingTable = [
    {'emotion_name': 'ANGER', 'valence': -37, 'arousal': 47},
    {'emotion_name': 'FEAR', 'valence': -61, 'arousal': 7},
    {'emotion_name': 'HAPPINESS', 'valence': 68, 'arousal': 7},
    {'emotion_name': 'SADNESS', 'valence': -68, 'arousal': -35},
    {'emotion_name': 'NEUTRAL', 'valence': 0, 'arousal': 0},
    {'emotion_name': 'SURPRISE', 'valence': 30, 'arousal': 8},
    {'emotion_name': 'CONTEMPT', 'valence': -55, 'arousal': 43}
];



function _propPaisWiseArgmax(object) {
    var vals = _.values(object);
    var keys  =_.keys(object);
    var max = _.max(vals);
    return [keys[_.indexOf(vals, max)].toUpperCase(), max];
}

var res = _.map(users[0].video_emotion_scores, function(item) {
    var _max = _propPaisWiseArgmax(item.scores);
    var matchedValenceArousal = _.where(valenceArousalMappingTable, {'emotion_name': _max[0]});
    return [_.first(_.pluck(matchedValenceArousal, 'valence')) / 100.00, _.first(_.pluck(matchedValenceArousal, 'arousal')) / 100.00].concat(_max);
});

console.log(res);