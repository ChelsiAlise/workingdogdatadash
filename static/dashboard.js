//bar chart 1 - Rest, Active, and Awake Times for Each Dog
$(document).ready(function () {
    var processed_json_rest = new Array();
    var processed_json_active = new Array();
    var processed_json_awake = new Array();

    var options = {
        chart: {
            renderTo: 'chart1',
            type: 'column',
            zoomType: 'x'
        },
        title: {
            text: 'Rest, Active, and Awake Times for Each Dog'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'category',
            title: {
                text: "Dog Name"
            },
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Time /min(s)'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.1f} mins</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [{
            name: 'Rest',
        }, {
            name: 'Active',
        }, {
            name: 'Awake',
        }]
    };

    $.getJSON('/api/cached/data/filtered/dogs', function (data) {
        for (i = 0; i < data.length; i++) {
            processed_json_rest.push([data[i].name, data[i].rest]);
            processed_json_active.push([data[i].name, data[i].active]);
            processed_json_awake.push([data[i].name, data[i].awake]);
        }

        options.series[0].data = processed_json_rest;
        options.series[1].data = processed_json_active;
        options.series[2].data = processed_json_awake;
        var chart = new Highcharts.Chart(options);
    });

});


//chart 2 Awake Versus Rest of 123 Dogs by Name
$(document).ready(function () {
    var processed_json = new Array();
    var processed_json_name = new Array();

    var options = {
        chart: {
            renderTo: 'chart2',
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'Awake Versus Rest of 123 Dogs by Name'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            title: {
                enabled: true,
                text: 'Awake /min(s)'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: 'Rest /min(s)'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 70,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x} mins, {point.y} mins'
                }
            }
        },
        series: [{
            name: "Dog Name (still working on displaying dog names)",
            color: 'rgba(119, 152, 191, .5)',
        }]
    };

    $.getJSON('/api/cached/data/filtered/dogs', function (data) {
        for (i = 0; i < data.length; i++) {
            processed_json.push([data[i].awake, data[i].rest]);
            processed_json_name.push([data[i].name]);
            //console.log(data[i].awake);
        }

        options.series[0].data = processed_json;
        var chart = new Highcharts.Chart(options);
    });

});

//EXAMPLE PLACEHOLDER
//box plots
$(function () {
    Highcharts.chart('chart3', {

        chart: {
            type: 'boxplot'
        },

        title: {
            text: 'Highcharts Box Plot Example'
        },
        legend: {
            enabled: false
        },

        xAxis: {
            categories: ['1', '2', '3', '4', '5'],
            title: {
                text: 'Experiment No.'
            }
        },

        yAxis: {
            title: {
                text: 'Observations'
            },
            plotLines: [{
                value: 932,
                color: 'red',
                width: 1,
                label: {
                    text: 'Theoretical mean: 932',
                    align: 'center',
                    style: {
                        color: 'gray'
                    }
                }
            }]
        },

        series: [{
            name: 'Observations',
            data: [
                [760, 801, 848, 895, 965],
                [733, 853, 939, 980, 1080],
                [714, 762, 817, 870, 918],
                [724, 802, 806, 871, 950],
                [834, 836, 864, 882, 910]
            ],
            tooltip: {
                headerFormat: '<em>Experiment No {point.key}</em><br/>'
            }
        }, {
            name: 'Outlier',
            color: Highcharts.getOptions().colors[0],
            type: 'scatter',
            data: [ // x, y positions where 0 is the first category
                [0, 644],
                [4, 718],
                [4, 951],
                [4, 969]
            ],
            marker: {
                fillColor: 'white',
                lineWidth: 1,
                lineColor: Highcharts.getOptions().colors[0]
            },
            tooltip: {
                pointFormat: 'Observation: {point.y}'
            }
        }]

    });
});

//EXAMPLE PLACEHOLDER
$(function () {
    Highcharts.chart('chart4', {
        chart: {
            type: 'spline',
            zoomType: 'xy'
        },
        title: {
            text: 'Snow depth at Vikjafjellet, Norway'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { // don't display the dummy year
                month: '%e. %b',
                year: '%b'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Snow depth (m)'
            },
            min: 0
        },
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
        },

        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                }
            }
        },

        series: [{
            name: 'Winter 2012-2013',
            // Define the data points. All series have a dummy year
            // of 1970/71 in order to be compared on the same x axis. Note
            // that in JavaScript, months start at 0 for January, 1 for February etc.
            data: [
                [Date.UTC(1970, 9, 21), 0],
                [Date.UTC(1970, 10, 4), 0.28],
                [Date.UTC(1970, 10, 9), 0.25],
                [Date.UTC(1970, 10, 27), 0.2],
                [Date.UTC(1970, 11, 2), 0.28],
                [Date.UTC(1970, 11, 26), 0.28],
                [Date.UTC(1970, 11, 29), 0.47],
                [Date.UTC(1971, 0, 11), 0.79],
                [Date.UTC(1971, 0, 26), 0.72],
                [Date.UTC(1971, 1, 3), 1.02],
                [Date.UTC(1971, 1, 11), 1.12],
                [Date.UTC(1971, 1, 25), 1.2],
                [Date.UTC(1971, 2, 11), 1.18],
                [Date.UTC(1971, 3, 11), 1.19],
                [Date.UTC(1971, 4, 1), 1.85],
                [Date.UTC(1971, 4, 5), 2.22],
                [Date.UTC(1971, 4, 19), 1.15],
                [Date.UTC(1971, 5, 3), 0]
            ]
        }, {
            name: 'Winter 2013-2014',
            data: [
                [Date.UTC(1970, 9, 29), 0],
                [Date.UTC(1970, 10, 9), 0.4],
                [Date.UTC(1970, 11, 1), 0.25],
                [Date.UTC(1971, 0, 1), 1.66],
                [Date.UTC(1971, 0, 10), 1.8],
                [Date.UTC(1971, 1, 19), 1.76],
                [Date.UTC(1971, 2, 25), 2.62],
                [Date.UTC(1971, 3, 19), 2.41],
                [Date.UTC(1971, 3, 30), 2.05],
                [Date.UTC(1971, 4, 14), 1.7],
                [Date.UTC(1971, 4, 24), 1.1],
                [Date.UTC(1971, 5, 10), 0]
            ]
        }, {
            name: 'Winter 2014-2015',
            data: [
                [Date.UTC(1970, 10, 25), 0],
                [Date.UTC(1970, 11, 6), 0.25],
                [Date.UTC(1970, 11, 20), 1.41],
                [Date.UTC(1970, 11, 25), 1.64],
                [Date.UTC(1971, 0, 4), 1.6],
                [Date.UTC(1971, 0, 17), 2.55],
                [Date.UTC(1971, 0, 24), 2.62],
                [Date.UTC(1971, 1, 4), 2.5],
                [Date.UTC(1971, 1, 14), 2.42],
                [Date.UTC(1971, 2, 6), 2.74],
                [Date.UTC(1971, 2, 14), 2.62],
                [Date.UTC(1971, 2, 24), 2.6],
                [Date.UTC(1971, 3, 2), 2.81],
                [Date.UTC(1971, 3, 12), 2.63],
                [Date.UTC(1971, 3, 28), 2.77],
                [Date.UTC(1971, 4, 5), 2.68],
                [Date.UTC(1971, 4, 10), 2.56],
                [Date.UTC(1971, 4, 15), 2.39],
                [Date.UTC(1971, 4, 20), 2.3],
                [Date.UTC(1971, 5, 5), 2],
                [Date.UTC(1971, 5, 10), 1.85],
                [Date.UTC(1971, 5, 15), 1.49],
                [Date.UTC(1971, 5, 23), 1.08]
            ]
        }]
    });
});


//chart 2 Awake Versus Rest of 123 Dogs by Name
$(document).ready(function () {
    var processed_json = new Array();
    var processed_json_name = new Array();

    var options = {
        chart: {
            renderTo: 'chart5',
            zoomType: 'x'
        },
        title: {
            text: 'Dog Activity Percentages'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'Dog Name'
        },
        yAxis: {
            title: {
                text: 'Activity Percentage /%'
            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },

        series: [{
            type: 'area',
            name: 'Activity Percentage',
        }]
    };

    $.getJSON('/api/cached/data/filtered/dogs', function (data) {

        data.sort(function (a, b) {
            return (a.active / a.total) - (b.active / b.total);
        });

        for (i = 0; i < data.length; i++) {
            var ratio = data[i].active / data[i].total;
            var per = ratio * 100;
            processed_json.push([data[i].name, per]);
        };

        options.series[0].data = processed_json;
        var chart = new Highcharts.Chart(options);
    });

});



// $(function () {
//     $.getJSON('https://www.highcharts.com/samples/data/jsonp.php?filename=usdeur.json&callback=?', function (data) {

//         Highcharts.chart('chart5', {
//             chart: {
//                 zoomType: 'x'
//             },
//             title: {
//                 text: 'USD to EUR exchange rate over time'
//             },
//             subtitle: {
//                 text: document.ontouchstart === undefined ?
//                         'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
//             },
//             xAxis: {
//                 type: 'datetime'
//             },
//             yAxis: {
//                 title: {
//                     text: 'Exchange rate'
//                 }
//             },
//             legend: {
//                 enabled: false
//             },
//             plotOptions: {
//                 area: {
//                     fillColor: {
//                         linearGradient: {
//                             x1: 0,
//                             y1: 0,
//                             x2: 0,
//                             y2: 1
//                         },
//                         stops: [
//                             [0, Highcharts.getOptions().colors[0]],
//                             [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
//                         ]
//                     },
//                     marker: {
//                         radius: 2
//                     },
//                     lineWidth: 1,
//                     states: {
//                         hover: {
//                             lineWidth: 1
//                         }
//                     },
//                     threshold: null
//                 }
//             },

//             series: [{
//                 type: 'area',
//                 name: 'USD to EUR',
//                 data: data
//             }]
//         });
//     });
// });




//=============javascript for cards at top of dashboard=========================

$.ajax({
    type: "GET",
    url: "/api/cached/data/filtered/dogs",
    async: true,
    datatype: 'json',
    success: function (data) {
        document.getElementById("most_active_card").innerHTML = mostActiveDog(data);
        document.getElementById("most_active_card_title").innerHTML = "Most Active Dog";

        document.getElementById("least_active_card").innerHTML = leastActiveDog(data);
        document.getElementById("least_active_card_title").innerHTML = "Least Active Dog";

        document.getElementById("most_rest_card").innerHTML = mostRestDog(data);
        document.getElementById("most_rest_card_title").innerHTML = "Dog With the Most Rest Time";

        document.getElementById("most_rest_card").innerHTML = mostAwakeDog(data);
        document.getElementById("most_rest_card_title").innerHTML = "Dog With the Most Awake Time";
    }
});

//most active dog card (problem, doesnt handle duplicate values)
function mostActiveDog(data) {

    var highest = new Array();
    var highest_name = new Array();
    var highest_val = new Array();

    var hashMostActiveDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostActiveDog.push({ name: data[i].name, val: data[i].active });
    }

    //sort from lowest to highest
    hashMostActiveDog.sort(function (a, b) {
        return a.val - b.val;
    });

    // console.log(hashMostActiveDog[data.length - 1]);
    highest = hashMostActiveDog[data.length - 1];
    highest_name = hashMostActiveDog[data.length - 1]["name"];
    highest_val = hashMostActiveDog[data.length - 1]["val"];

    // console.log(highest_name);
    // console.log(highest_val);

    return highest_name;

}

//least active dog card (problem, doesnt handle duplicate values)
function leastActiveDog(data) {
    var lowest = new Array();
    var lowest_name = new Array();
    var lowest_val = new Array();

    var hashLeastActiveDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashLeastActiveDog.push({ name: data[i].name, val: data[i].active });
    }

    //sort from lowest to highest
    hashLeastActiveDog.sort(function (a, b) {
        return a.val - b.val;
    });

    // console.log(hashLeastActiveDog[data.length - 1]);
    lowest = hashLeastActiveDog[0];
    lowest_name = hashLeastActiveDog[0]["name"];
    lowest_val = hashLeastActiveDog[0]["val"];

    //console.log(highest_name);
    // console.log(highest_val);

    return lowest_name;
}

//dog with the most rest time card (problem, doesnt handle duplicate values)
function mostRestDog(data) {
    var most_rest = new Array();
    var most_rest_name = new Array();
    var most_rest_val = new Array();

    var hashMostRestDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostRestDog.push({ name: data[i].name, val: data[i].rest });
    }

    //sort from lowest to highest
    hashMostRestDog.sort(function (a, b) {
        return a.val - b.val;
    });

    console.log(hashMostRestDog[data.length - 1]);
    most_rest = hashMostRestDog[data.length - 1];
    most_rest_name = hashMostRestDog[data.length - 1]["name"];
    most_rest_val = hashMostRestDog[data.length - 1]["val"];

    console.log(most_rest_name);
    console.log(most_rest_val);

    return most_rest_name;
}

//dog with most awake time card (problem, doesnt handle duplicate values)
function mostAwakeDog(data) {
    var most_awake = new Array();
    var most_awake_name = new Array();
    var most_awake_val = new Array();

    var hashMostAwakeDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostAwakeDog.push({ name: data[i].name, val: data[i].awake });
    }

    //sort from lowest to highest
    hashMostRestDog.sort(function (a, b) {
        return a.val - b.val;
    });

    console.log(hashMostAwakeDog[data.length - 1]);
    most_awake = hashMostAwakeDog[data.length - 1];
    most_awake_name = hashMostAwakeDog[data.length - 1]["name"];
    most_awake_val = hashMostAwakeDog[data.length - 1]["val"];

    console.log(most_awake_name);
    console.log(most_awake_val);

    return most_awake_name;
}

//============= /javascript for cards at top of dashboard=========================


