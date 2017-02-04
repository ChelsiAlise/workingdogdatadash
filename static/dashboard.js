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

        document.getElementById("most_awake_card").innerHTML = mostAwakeDog(data);
        document.getElementById("most_awake_card_title").innerHTML = "Dog With the Most Awake Time";
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
    hashMostAwakeDog.sort(function (a, b) {
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


