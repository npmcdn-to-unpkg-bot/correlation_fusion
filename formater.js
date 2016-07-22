'use strict'

let fs = require('fs'),
    _ = require('lodash')

let file = JSON.parse(fs.readFileSync('./emovuResult.json'));

let result = []
_.forEach(file['video_emotion_scores'], function(item) {
    result.push(
        {
            'scores': _.omit(_.get(item.scores, 'FaceAnalysisResults[0].EmotionResult'), 'Computed'),
            'screenshot': _.get(item, 'screenshot')
        }
     )
});


console.log('==== ',{'video_emotion_scores': result})

fs.writeFileSync('./emovuResultFormated.json', JSON.stringify({'video_emotion_scores': result}));
