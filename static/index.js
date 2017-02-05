/*
This script is our application, the organization is as follows:
- The first section contains shared variables and the document.ready method,
 and helper methods.
- Next is the code for the dashboard graphs
- Followed by the code for the dashboard cards
- And finally the code for the custom graphs
*/

// we will store the data pulled from the server in these
var filtered_dogs;
var filtered_blob;

// page setup, and data loading
$(document).ready(function () {
    // animation interacts poorly with inserting graphs
    Highcharts.setOptions({
        plotOptions: {
            series: {
                animation: false
            }
        }
    });
    // load the smaller dog dataset first
    $.ajax({
        type: "GET",
        url: "/api/cached/data/filtered/dogs",
        async: true,
        datatype: 'json',
        success: function(data) {
            // store the data
            filtered_dogs = data;
            string2 = data; // TODO: remove this
            // update the cards
            updateCards();
            // create all graphs that use this data.
            createChartOne();
            createChartTwo();
            createChartThree();
            createChartFour();
            createChartFive();
        }
    });
    // load the full data set next
    $.ajax({
        type: "GET",
        url: "/api/cached/data/filtered/blob",
        async: true,
        datatype: 'json',
        success: function(data) {
            // store the data
            filtered_blob = data;
            string3 = data; // TOOD: remove this
        }
    });
});



//============= javascript for dashboard graphs ================================

// chart 1 - Rest, Active, and Awake Times for Each Dog
function createChartOne() {
    var processed_json_rest = new Array();
    var processed_json_active = new Array();
    var processed_json_awake = new Array();
    // chart options
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
                text: 'Total Minutes'
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
    // convert the filtered_data to the appropriate arrays
    for (i = 0; i < filtered_dogs.length; i++) {
        processed_json_rest.push([filtered_dogs[i].name, filtered_dogs[i].rest]);
        processed_json_active.push([filtered_dogs[i].name, filtered_dogs[i].active]);
        processed_json_awake.push([filtered_dogs[i].name, filtered_dogs[i].awake]);
    }
    // create the chart
    options.series[0].data = processed_json_rest;
    options.series[1].data = processed_json_active;
    options.series[2].data = processed_json_awake;
    var chart = new Highcharts.Chart(options);
};


// chart 2 - Awake Versus Rest of All Dogs by Name
function createChartTwo() {
    var series_data = new Array();
    // get max total minutes for scaling points
    var max_total = 0;
    for (i = 0; i < filtered_dogs.length; i++) {
        var t = filtered_dogs[i].total;
        if (t > max_total) {
            max_total = t;
        }
    }
    // convert the data to series points
    for (i = 0; i < filtered_dogs.length; i++) {
        // scale points non-linearly with total minutes
        // (total/max_total)^.2 * 6 is a pretty good scale.
        // this is sub-linear scaling to prevent points from being tiny,
        // with 6 as the maximum size
        var total = filtered_dogs[i].total;
        var scale = Math.pow(total / max_total, .2) * 6;
        series_data.push({
            name: filtered_dogs[i].name,
            x: filtered_dogs[i].awake / total,
            y: filtered_dogs[i].rest / total,
            marker: {radius: scale},
            total: total,
        })
    }
    // chart options
    var options = {
        chart: {
            renderTo: 'chart2',
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'Percentage of Time Awake Versus Percentage of Time Resting, Scaled by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            title: {
                enabled: true,
                text: 'Awake Time / Total Time (per dog)'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: 'Rest Time / Total Time (per dog)'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
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
                    headerFormat: '',
                    pointFormat: '<b>{point.name}</b> (Total Minutes: {point.total})<br>{point.x} % active, {point.y} % rest'
                }
            }
        },
        series:[{
            name: 'Dogs',
            data: series_data
        }]
    };
    // draw the chart
    var chart = new Highcharts.Chart(options);
};


// chart 3 - Rest Versus Active of All Dogs by Name
function createChartThree() {
    var series_data = new Array();
    // get max total minutes for scaling points
    var max_total = 0;
    for (i = 0; i < filtered_dogs.length; i++) {
        var t = filtered_dogs[i].total;
        if (t > max_total) {
            max_total = t;
        }
    }
    // convert the data to series points
    for (i = 0; i < filtered_dogs.length; i++) {
        // scale points non-linearly with total minutes
        // (total/max_total)^.2 * 6 is a pretty good scale.
        // this is sub-linear scaling to prevent points from being tiny,
        // with 6 as the maximum size
        var total = filtered_dogs[i].total;
        var scale = Math.pow(total / max_total, .2) * 6;
        series_data.push({
            name: filtered_dogs[i].name,
            x: filtered_dogs[i].rest / total,
            y: filtered_dogs[i].active / total,
            marker: {radius: scale},
            total: total,
        })
    }
    // chart options
    var options = {
        chart: {
            renderTo: 'chart3',
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'Percentage of Time Resting Versus Percentage of Time Active, Scaled by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            title: {
                enabled: true,
                text: 'Rest Time / Total Time (per dog)'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: 'Active Time / Total Time (per dog)'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
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
                    headerFormat: '',
                    pointFormat: '<b>{point.name}</b> (Total Minutes: {point.total})<br>{point.x} % rest, {point.y} % active'
                }
            }
        },
        series:[{
            name: 'Dogs',
            data: series_data
        }]
    };
    // draw the chart
    var chart = new Highcharts.Chart(options);
};


// chart 4 - Rest Versus Active of All Dogs by Name
function createChartFour() {
    var series_data = new Array();
    // get max total minutes for scaling points
    var max_total = 0;
    for (i = 0; i < filtered_dogs.length; i++) {
        var t = filtered_dogs[i].total;
        if (t > max_total) {
            max_total = t;
        }
    }
    // convert the data to series points
    for (i = 0; i < filtered_dogs.length; i++) {
        // scale points non-linearly with total minutes
        // (total/max_total)^.2 * 6 is a pretty good scale.
        // this is sub-linear scaling to prevent points from being tiny,
        // with 6 as the maximum size
        var total = filtered_dogs[i].total;
        var scale = Math.pow(total / max_total, .2) * 6;
        series_data.push({
            name: filtered_dogs[i].name,
            x: filtered_dogs[i].awake / total,
            y: filtered_dogs[i].active / total,
            marker: {radius: scale},
            total: total,
        })
    }
    // chart options
    var options = {
        chart: {
            renderTo: 'chart4',
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'Percentage of Time Awake Versus Percentage of Time Active, Scaled by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            title: {
                enabled: true,
                text: 'Awake Time / Total Time (per dog)'
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: 'Active Time / Total Time (per dog)'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
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
                    headerFormat: '',
                    pointFormat: '<b>{point.name}</b> (Total Minutes: {point.total})<br>{point.x} % awake, {point.y} % active'
                }
            }
        },
        series:[{
            name: 'Dogs',
            data: series_data
        }]
    };
    // draw the chart
    var chart = new Highcharts.Chart(options);
};



// chart 5 Activity Percentage of All Dogs
function createChartFive() {
    var processed_json = new Array();
    var processed_json_name = new Array();
    // chart options
    var options = {
        chart: {
            renderTo: 'chart5',
            zoomType: 'x'
        },
        title: {
            text: 'Dogs By Activity As a Percentage of Total Time'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'Dog Name',
            title: {
                text: 'Dogs, Sorted From Least to Most Activity'
            }
        },
        yAxis: {
            title: {
                text: 'Activity Percentage of Total Time'
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
    // sort and convert data
    filtered_dogs.sort(function (a, b) {
        return (a.active / a.total) - (b.active / b.total);
    });
    for (i = 0; i < filtered_dogs.length; i++) {
        var ratio = filtered_dogs[i].active / filtered_dogs[i].total;
        var per = ratio * 100;
        processed_json.push([filtered_dogs[i].name, per]);
    };
    // create chart
    options.series[0].data = processed_json;
    var chart = new Highcharts.Chart(options);
};
//============= /javascript for dashboard graphs ===============================




//============= javascript for cards at top of dashboard =======================

function updateCards() {
    document.getElementById("most_active_card").innerHTML = mostActiveDog(filtered_dogs);
    document.getElementById("most_active_card_title").innerHTML = "Most Active Dog";

    document.getElementById("least_active_card").innerHTML = leastActiveDog(filtered_dogs);
    document.getElementById("least_active_card_title").innerHTML = "Least Active Dog";

    document.getElementById("most_rest_card").innerHTML = mostRestDog(filtered_dogs);
    document.getElementById("most_rest_card_title").innerHTML = "Most Rested Dog";

    document.getElementById("most_awake_card").innerHTML = mostAwakeDog(filtered_dogs);
    document.getElementById("most_awake_card_title").innerHTML = "Most Awake Dog";
};

// most active dog card
// TODO: this does not handle duplicate values
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

    highest = hashMostActiveDog[data.length - 1];
    highest_name = hashMostActiveDog[data.length - 1]["name"];
    highest_val = hashMostActiveDog[data.length - 1]["val"];

    return highest_name;
}

// least active dog card
// TODO: this does not handle duplicate values
function leastActiveDog(data) {
    var lowest = new Array();
    var lowest_name = new Array();
    var lowest_val = new Array();

    var hashLeastActiveDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashLeastActiveDog.push({ name: data[i].name, val: data[i].active });
    }

    // sort from lowest to highest
    hashLeastActiveDog.sort(function (a, b) {
        return a.val - b.val;
    });

    lowest = hashLeastActiveDog[0];
    lowest_name = hashLeastActiveDog[0]["name"];
    lowest_val = hashLeastActiveDog[0]["val"];

    return lowest_name;
}

// dog with the most rest time card
// TODO: this does not handle duplicate values
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

    most_rest = hashMostRestDog[data.length - 1];
    most_rest_name = hashMostRestDog[data.length - 1]["name"];
    most_rest_val = hashMostRestDog[data.length - 1]["val"];

    return most_rest_name;
}

// dog with most awake time card
// TODO: this does not handle duplicate values
function mostAwakeDog(data) {
    var most_awake = new Array();
    var most_awake_name = new Array();
    var most_awake_val = new Array();

    var hashMostAwakeDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostAwakeDog.push({ name: data[i].name, val: data[i].awake });
    }

    // sort from lowest to highest
    hashMostAwakeDog.sort(function (a, b) {
        return a.val - b.val;
    });

    most_awake = hashMostAwakeDog[data.length - 1];
    most_awake_name = hashMostAwakeDog[data.length - 1]["name"];
    most_awake_val = hashMostAwakeDog[data.length - 1]["val"];

    return most_awake_name;
}

//============= /javascript for cards at top of dashboard ======================





//============= javascript for custom graphs ===================================
// TODO: rename / remove these. EG: What is string{1,2,3} supposed to be?
var string1 = '';
var string2 = '';
var string3 = '';
var chartOptionsAreValid = false;
var id;
var barchoices3 = [];
var barchoices1 = [{"value": "Raw Data", "text": "Raw Data"}, {"value": "Comparisons", "text": "Comparisons"}];
var barchoices2 = [{"value": "Active", "text": "Active"}, {"value": "Awake", "text": "Awake"}, {"value": "Rest", "text": "Rest"}, {"value": "Total", "text": "Total"}];
var barchoices4 = [{"value": "Raw Data", "text": "Raw Data"}];

function fieldcheck() {
    var temp = $("#mySelect option:selected").text();
    chartOptionsAreValid = false;
    if (temp != "Select One") {
        $('#mySelect2').show();
        if(temp == "Bar"){
            barOptions('#mySelect2', barchoices1);
        } else if (temp == "Pie"){
            barOptions('#mySelect2', barchoices4);
        }
        else if (temp == "Line"){
            var j = 0;
            string1 = string3;
            for (var i = 0; i < Object.keys(string3.dogs).length; i++) {
                helper = {"value": string1.dogs[i].name, "text": string1.dogs[i].name}
                barchoices3[j] = helper;
                j++;
            }
            barOptions('#mySelect2', barchoices3);
        }
    } else {
        chartOptionsAreValid = false;
        $('#mySelect2').hide();
        $('#mySelect3').hide();
        $('#mySelect4').hide();
    }
}

function fieldcheck2() {
    var temp = $("#mySelect2 option:selected").text();
    var temp2 = $("#mySelect option:selected").text();
    if (temp != "Select One") {
        $('#mySelect3').show();
        if(temp == "Raw Data"){
            if (temp2 == "Bar") {
                chartOptionsAreValid = false;
                    barOptions('#mySelect3', barchoices2);
                    $('#mySelect4').hide();
                    //chartOptionsAreValid = true;
            } else if (temp2 == "Pie") {
                var j = 0;
                string1 = string3;
                for (var i = 0; i < Object.keys(string3.dogs).length; i++) {
                    helper = {"value": string1.dogs[i].name, "text": string1.dogs[i].name}
                    barchoices3[j] = helper;
                    j++;
                }
                chartOptionsAreValid = false;
                    barOptions('#mySelect3', barchoices3);
                    $('#mySelect4').hide();
            }

            } else if(temp == "Comparisons"){
                if (temp2 == "Bar") {
                    chartOptionsAreValid = false;
                    $('#mySelect4').show();
                    barOptions('#mySelect3', barchoices2);
                    barOptions('#mySelect4', barchoices2);
                } else if (temp2 == "Pie") {
                    var j = 0;
                    string1 = string2;
                    for (var i = 0; i < string2.length; i++) {
                        helper = {"value": string1[i].name, "text": string1[i].name}
                        barchoices3[j] = helper;
                        j++;
                    }
                    chartOptionsAreValid = false;
                    $('#mySelect4').show();
                    barOptions('#mySelect3', barchoices3);
                    barOptions('#mySelect4', barchoices3);
                }
        } else if (temp2 == "Line") {
            chartOptionsAreValid = true;
            barOptions('#mySelect3', barchoices2);
            $('#mySelect4').hide();
        } else {
            $('#mySelect3').hide();
            $('#mySelect4').hide();
            chartOptionsAreValid = false;
        }
    }
}

function fieldcheck3() {
    var select1 = $("#mySelect2 option:selected").text();
    var temp = $("#mySelect3 option:selected").text();
    if (temp != "Select One") {
        if(select1 == "Raw Data"){
            chartOptionsAreValid = true;
        } else {
            idValiBar = false;
        }
    }  else {
        chartOptionsAreValid = false;
    }
}

function fieldcheck4() {
    var select1 = $("#mySelect2 option:selected").text();
    var temp = $("#mySelect4 option:selected").text();
    var temp1 = $("#mySelect3 option:selected").text();
    if (temp != "Select One" && temp != temp1 && temp1 != "Select One") {
        if (select1 == "Comparisons") {
            chartOptionsAreValid = true;
        } else {
            idValiBar = false;
        }
    }  else {
        chartOptionsAreValid = false;
    }
}

function barOptions(item, options) {
    $(item).empty();
    $(item).append($('<option>', {
            value: "Select" ,
            text: "Select One"
            }));
    for(var i = 0; i < options.length ; i ++){
        $(item).append($('<option>', {
            value: options[i].value ,
            text: options[i].text
            }));
    }
}

function generateGraph() {
    if (chartOptionsAreValid) {
            name1 = $("#mySelect1 option:selected").text();
            var temp1 = $("#mySelect option:selected").text();
        if (temp1 == "Bar") {
            var select1 = $("#mySelect2 option:selected").text();
            if (select1 == "Raw Data"){
                var type = $("#mySelect3 option:selected").text();
                makeBar(string2, type);
            }
            if (select1 == "Comparisons"){
                var typeA = $("#mySelect3 option:selected").text();
                var typeB = $("#mySelect4 option:selected").text();
                makeBar2(string2, typeA, typeB);
            }
        } else if (temp1 == "Pie") {
            var select1 = $("#mySelect2 option:selected").text();
            if (select1 == "Raw Data"){
                var type = $("#mySelect3 option:selected").text();
                makePie(string2, type);
            }
        } else if (temp1 == "Line") {
            var select1 = $("#mySelect2 option:selected").text();
            var type = $("#mySelect3 option:selected").text();
            makeLine(string3, select1, type);
        }
    } else {
        alert("You must make a selection for each option first.");
    }
}


// this inserts a new row with a graph container and returns the element
// custom graphs should be placed in these
var custom_graph_id = 0;
function insertNewGraphRow() {
    custom_graph_id += 1;
    var id = "custom-graph-"+custom_graph_id.toString();
    var graphs = document.getElementById("custom-graphs");
    var newElement = '<div class="row"><button class="delete-button" onclick="deleteGraph(this)" align="right">x</button><div id="'+id+'" style="width: 100%; height: 40em; margin: 0 auto; padding: 1em;"></div></div>';
    graphs.insertAdjacentHTML('afterbegin', newElement);
    return id;
}

function renderNewCustomGraph(options) { 
    var id = insertNewGraphRow();
    options.chart.renderTo = id;
    var chart = new Highcharts.Chart(options);
}

function deleteGraph(e) {
    e.parentNode.parentNode.removeChild(e.parentNode);
}

function reset() {
    //document.getElementById('popup1').style.display='none';
    //document.getElementById('graphButton').style.display='block';
    $('#mySelect2').hide();
    $('#mySelect').val('Select');
    $('#mySelect2').val('Select');
    $('#mySelect3').val('Select');
    $('#mySelect4').val('Select');
    $('#mySelect3').hide();
    $('#mySelect4').hide();
    isValdBar = false;
    fieldcheck();
}

function makeBar(data, type) {
    var arr = new Array();
    var arr1 = new Array();
    string1 = data;
    var j = 0;
    for (var i =0; i < string1.length; i++) {
        arr[j] = string1[i].name;
        var ratio = getBarInfo(string1[i], type);
        arr1[j] = ratio;
        j++;
    };
    var options = {
        chart: {
            type: 'column'
        },
        title: {
            text: 'Distribution of minutes spent ' + type
        },
        subtitle: {
            text: 'Dog activity tracked in minutes'
        },
        xAxis: {
            categories: arr,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Minutes'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} minutes</b></td></tr>',
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
            name: type,
            data: arr1

        }]
    };
    renderNewCustomGraph(options);
}

function makeBar2(data, typeA, typeB) {
    var arr = new Array();
    var arr1 = new Array();
    var arr2 = new Array();
    string1 = data;
    var j = 0;
    for (var i =0; i < string1.length; i++) {
        arr[j] = string1[i].name;
        var ratio = getBarInfo(string1[i], typeA);
        var ratio2 = getBarInfo(string1[i], typeB);
        arr1[j] = ratio;
        arr2[j] = ratio2;
        j++;
    }
    var options = {
            chart: {
                type: 'column'
            },
            title: {
                text: 'Distribution of minutes spent ' + typeA + " and " + typeB
            },
            subtitle: {
                text: 'Dog activity tracked in minutes'
            },
            xAxis: {
                categories: arr,
                crosshair: true
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Minutes'
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f} minutes</b></td></tr>',
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
            name: typeA,
            data: arr1
        }, {
            name: typeB,
            data: arr2

        }]
    };
    renderNewCustomGraph(options);
}

function makePie(data, dog) {
    var arr = new Array();
    var arr1 = new Array();
    string1 = data;
    var j = 0;
    for (var i =0; i < string1.length; i++) {
        if (string1[i].name == dog) {
            var data1 = getBarInfo(string1[i], "Rest");
            var data2 = getBarInfo(string1[i], "Active");
            var data3 = getBarInfo(string1[i], "Awake");
            var dataT = data1 + data2 + data3;
            var ratioA = data1/dataT;
            var ratioB = data2/dataT;
            var ratioC = data3/dataT;
        }
    };
    var options = {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Time Spent As a Percentage of Total Time For ' + dog
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
        series: [{
            name: 'Brands',
            colorByPoint: true,
            data: [{
                name: 'Time spent at rest',
                y: ratioA
            }, {
                name: 'Time spent active',
                y: ratioB,
            }, {
                name: 'Time spent awake',
                y: ratioC
            }]
        }]
    };
    renderNewCustomGraph(options);
}

function makeLine(data, dog, type) {
    console.log(type);
    var arr = new Array();
    var arr1 = new Array();
    var dates = [];
    var index;
    string1 = data;
    for (var k =0; k < Object.keys(string3.dogs).length; k++) {
        if (string3.dogs[k].name == dog) {
            id = string3.dogs[k].id;
        }
    }
    var j = 0;
    for (var i =0; i < Object.keys(string3.days).length; i++) {
        var dateSplit = string3.days[i].date.split("-");
        for (var m =0; m < Object.keys(string3.days[i].dogs).length; m++) {
            if (string3.days[i].dogs[m].id == id) {
                console.log(string3.days[i].date);
                if (type == "Total") {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), string3.days[i].dogs[m].total];
                } else if (type == "Rest") {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), string3.days[i].dogs[m].rest];
                } else if (type == "Active") {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), string3.days[i].dogs[m].active];
                } else {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), string3.days[i].dogs[m].awake];
                }
                j++;
            }
        }
    }
    var options = {
        chart: {
            zoomType: 'x'
        },
        title: {
            text: dog+' '+type+' Minutes Over Time'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                    'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: 'Minutes ' + type
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
            name: 'Minutes spent ' + type,
            data: dates
        }]
    };
    renderNewCustomGraph(options);
}

function makePie2(data, dog1, dog2){
    var arr = new Array();
    var arr1 = new Array();
    string1 = data;
    var j = 0;
    for (var i =0; i < string1.length; i++) {
        if (string1[i].name == dog1) {
            console.log(string1[i].name);
            var data1 = getBarInfo(string1[i], "Rest");
            var data2 = getBarInfo(string1[i], "Active");
            var data3 = getBarInfo(string1[i], "Awake");
        }
        if (string1[i].name == dog2) {
            console.log(string1[i].name);
            var data4 = getBarInfo(string1[i], "Rest");
            var data5 = getBarInfo(string1[i], "Active");
            var data6 = getBarInfo(string1[i], "Awake");
        }
    }
    var options = {
        type: 'pie',
        data: {
            labels: ["Rest", "Active", "Awake"],
            datasets: [{
            backgroundColor: [
                "#2ecc71",
                "#3498db",
                "#95a5a6"
            ],
            data: [data4, data5, data6]
            }]
        }
    };
    renderNewCustomGraph(options);
}

function getBarInfo(dog, type){
    if (type == 'Rest') {
        return dog.rest;
    } else if (type == 'Active') {
        return dog.active;
    } else if (type == 'Awake') {
        return dog.awake;
    } else if (type == 'Total') {
        return dog.total;
    }
}
//============= /javascript for custom graphs ==================================
