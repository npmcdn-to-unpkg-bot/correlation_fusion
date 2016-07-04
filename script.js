'use strict';

// Code goes here

function log () {
    console.log(arguments);
}

var app = angular.module('myAPP', ['ng', 'ngMaterial', 'ngMdIcons', 'filters.client', 'controllers.client']);

app.factory('d3', function () {
    return d3;
});

app.directive('moodMapChart', function () {
    return {
        restricted: 'E',
        scope: {
            mood: '=data',
            changeHandler: '=',
            moodPoints: '=',
            checkPoint: '='
        },
        controller: function ($scope, $element, $attrs, $log, $mdDialog, d3, absFilter, roundFilter) {

            $scope.$watch('moodPoints + checkPoint', function (/*newVal*/) {
                console.log('$scope.moodPoints ======', $scope.moodPoints);
                if ($scope.moodPoints) {
                    _plotMoodsPoints($scope.moodPoints);
                }
            }, true);

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

            var width = 300;
            var height = 300;

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

            function mousemove () {
                if ($scope.mood.bMoodMapClicked) {
                    return;
                }

                // removing circle if exist
                if (circle) {
                    circle.transition()
                        .attr('r', 15)
                        .style('fill', '#FF9800')
                        .duration(500)
                        .each('end', function () {
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

            function mouseover () {
                div.style('display', 'inline');
            }

            function mouseout () {
                div.style('display', 'none');
            }

            svg.append('rect')
                .attr('class', 'overlay')
                //.attr('fill', 'url(#bg)')
                // .classed('filled', true)
                .attr('width', width)
                .attr('height', height);
            //.on('mouseover', mouseover)
            //.on('mousemove', mousemove)
            //.on('mouseout', mouseout);
            //----------------------------------------------------
            // End adding focus
            //----------------------------------------------------


            // ------------------------------------
            // OnClick event on the moodMap
            // ------------------------------------
            // svg.on('click', function() {
            //   if ($scope.mood.bMoodMapClicked) {
            //     return;
            //   }

            //   var e = d3.event;
            //   // Get relative cursor position
            //   var xpos = (e.offsetX === undefined) ? e.layerX : e.offsetX;
            //   var ypos = (e.offsetY === undefined) ? e.layerY : e.offsetY;


            //   console.log('==== click', e.offsetX, e.layerX);
            //   console.log('==== click', e.offsetY, e.layerY);

            //   circle = svg.append('circle')
            //     .attr('cx', xpos)
            //     .attr('cy', ypos)
            //     .style('fill', '#26a9df')
            //     .attr('r', 5);

            //   var pos = d3.mouse(this);
            //   $scope.mood.xValue = absFilter(xScale.invert(pos[0])) > 1 ? Math.sign(xScale.invert(pos[0])) * 1 : xScale.invert(pos[0]);
            //   $scope.mood.yValue = absFilter(yScale.invert(pos[1])) > 1 ? Math.sign(yScale.invert(pos[1])) * 1 : yScale.invert(pos[1]);

            //   $scope.mood.bMoodMapClicked = true;
            // });

            var div = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            // plot points on the moodMap

            function _plotMoodsPoints (arrayMoods) {

                svg
                    .selectAll('circle')
                    //.exit()
                    .transition()
                    .duration(100)
                    .delay(100)
                    .style('fill', 'red')
                    .transition()
                    .duration(100)
                    .delay(500)
                    .attr('r', 0)
                    .transition()
                    .each('end', function () {
                        d3.select(this).remove();
                    });

                svg
                    .selectAll('circles')
                    .data(arrayMoods)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d[0]); })
                    .style('fill', 'black')
                    .attr('cy', function (d) { return yScale(d[1]); })
                    .attr('r', 5)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);

                        var emotionName = d[2] ? '<br/>' + d[2].toString() : '';

                        console.log('emotionName====',d[2], emotionName);
                        div.html(roundFilter(d[0] * 100) + ', ' + roundFilter(d[1] * 100) + '' + emotionName)
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal'}).transition()
                            .duration(100).attr("r", function (d) {return Math.floor(10)});
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d) {return 'black'}).transition()
                            .duration(100).attr('r', function (d) {return 5});
                    });
            }


        }

    };
});

app.directive('discreteEmotions', function () {
    // controller
    return {
        restricted: 'E',
        templateUrl: 'emoviz-discrete-emotions.client.view.html',
        scope: {
            discrete_emotions: '=data',
            ngDisabled: '='
        },
        controller: function ($scope) {

            // Discrete Emotions
            // 'ANGER', 'CONTEMPT', 'DISGUST', 'FEAR', 'HAPPINESS', 'NEUTRAL', 'SADNESS', 'SURPRISE'
            // ----------------------------
            $scope.discrete_emotions = $scope.discrete_emotions || [];
        }
    };
});

app.directive('discreteEmotionsTl', function () {
    return {
        restricted: 'E',
        scope: {
            emotionLevelValues: '=',
            options: '=',
            checkPoint: '='
        },
        controller: function ($scope, $element, $attrs, $log, d3, absFilter, roundFilter) {

            $scope.$watch('emotionLevelValues + checkPoint', function () {
                if ($scope.emotionLevelValues) {
                    _plotDiscreteEmotionsPoints($scope.emotionLevelValues);
                }
            }, true);

            // Start SVG
            // -------------------------------------------------
            var svg = d3.select($element[0])
                .append('svg')
                .attr('class', 'discrete-emotions-tl');

            var margin = {
                top: 15,
                right: 15,
                bottom: 15,
                left: 15
            };

            var percent = d3.format('%');

            var width = 300;
            var height = 50;

            svg.attr({
                width: width,
                height: height
            });

            //noinspection JSUnresolvedFunction
            var xScale = d3.scale.linear()
                .domain([0, 100])
                .range([margin.left, width - margin.right])
                .nice();

            //noinspection JSUnresolvedFunction
            var xAxis = d3.svg.axis()
                .scale(xScale);
            //.tickFormat(percent);

            svg.append('g')
                .attr('class', 'axis')
                .attr('transform', 'translate(0,' + height / 2 + ')')
                .call(xAxis);

            var div = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            function _plotDiscreteEmotionsPoints (discreteEmotions) {
                svg
                    .selectAll('circle')
                    //.exit()
                    .transition()
                    .duration(100)
                    .delay(100)
                    .style('fill', 'red')
                    .transition()
                    .duration(100)
                    .delay(500)
                    .attr('r', 0)
                    .transition()
                    .remove();

                svg
                    .selectAll('circle')
                    .data(discreteEmotions)
                    .enter()
                    .append('circle')
                    .attr('cx', function (d) { return xScale(d); })
                    .style('fill', 'black')
                    .attr('cy', function (d) { return (height / 2); })
                    .attr('r', 5)
                    .on('mouseover', function (d) {
                        div.transition()
                            .duration(200)
                            .style('opacity', .9);
                        div.html(d + ' %')
                            .style('left', (d3.event.pageX) + 'px')
                            .style('top', (d3.event.pageY - 30) + 'px');

                        d3.select(this)
                            .style('fill', function (d) { return 'teal'}).transition()
                            .duration(100).attr("r", function (d) {return Math.floor(10)});
                    })
                    .on('mouseout', function (d) {
                        div.transition()
                            .duration(500)
                            .style('opacity', 0);
                        d3.select(this)
                            .style('fill', function (d) {return 'black'}).transition()
                            .duration(100).attr('r', function (d) {return 5});
                    });
            }

        }
    }
});