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
var filtered_dogs_max_total;
var filtered_blob;

// page setup, and data loading
$(document).ready(function () {
    loadDataAndInitialize();
});

function loadDataAndInitialize() {
    // set default plot options
    Highcharts.setOptions({
        plotOptions: {
             // animation interacts poorly with inserting graphs
            series: {
                animation: false
            },
        },
        chart:{
            resetZoomButton: {
                position: {
                    align: 'right', // by default
                    verticalAlign: 'top', // by default
                    x: -18,
                    y: 35
                },
                relativeTo: 'chart'
            }
        },
        title: {
            style: {
                fontSize: '18px',
            }
        },
        xAxis: {
            title: {
                style: {
                    fontSize: '16px',
                }
            }
        },
        yAxis: {
            title: {
                style: {
                    fontSize: '16px',
                }
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
            // precompute maximum total for scaling
            filtered_dogs_max_total = getMaxTotal(filtered_dogs);
            // normalize data
            normalizeDogData(filtered_dogs);
            string2 = data; // TODO: remove this
            // update the cards
            updateCards();
            // create all graphs that use this data.
            createChartOne();
            createChartTwo();
            createChartThree();
            createChartFour();
            createChartFive();
            createChartSix();
            createChartSeven();
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
            // normalize data
            normalizeDogData(filtered_blob.dogs);
        }
    });
}

// utility methods for interacting with the dog data

// normalizes and array of dog data
// replaces empty outcome data strings with "Unknown"
function normalizeDogData(dogs) {
    for (i = 0; i < dogs.length; i++) {
        var dog = dogs[i];
        if (dog.birth_date == "") {
            dog.birth_date = "Unknown";
        }
        if (dog.breed == "") {
            dog.breed = "Unknown";
        }
        if (dog.dog_status == "") {
            dog.dog_status = "Unknown";
        }
        if (dog.sex == "") {
            dog.sex = "Unknown";
        }
        if (dog.regional_center == "") {
            dog.regional_center = "Unknown";
        }
    }
}

// get max total minutes for scaling points
function getMaxTotal(dogs) {
    var max_total = 0;
    for (i = 0; i < dogs.length; i++) {
        var t = dogs[i].total;
        if (t > max_total) {
            max_total = t;
        }
    }
    return max_total;
}

// this copies all dog objects from a dog array (eg filtered_dogs)
// to a new array for use as series points
// for each point setPointKeysFunc(point) is called, which may be used to set
// x,y, etc.
function makeDogPoints(dogs, setPointKeysFunc) {
    var series = new Array();
    for (i = 0; i < dogs.length; i++) {
        var dog = dogs[i];
        var point = {
            name: dog.name,
            id: dog.id,
            tattoo_number: dog.tattoo_number,
            total: dog.total,
            awake: dog.awake,
            rest: dog.rest,
            active: dog.active,
            birth_date: dog.birth_date,
            breed: dog.breed,
            sex: dog.sex,
            dog_status: dog.dog_status,
            regional_center: dog.regional_center,
        }
        setPointKeysFunc(point);
        series.push(point);
    }
    return series;
}

//============= javascript for dashboard graphs ================================

// shared format for the beginning of formatting points with the dog's name
// and outcome data.
var dogPointFormat = '<b>{point.name}</b><br><br>'+
    '<table><tr><td>Status:&nbsp;&nbsp;</td><td>{point.dog_status}</td></tr>'+
    '<tr><td>Center:&nbsp;&nbsp;</td><td>{point.regional_center}</td></tr>'+
    '<tr><td>Sex:&nbsp;&nbsp;</td><td>{point.sex}</td></tr>'+
    '<tr><td>Birth Date:&nbsp;&nbsp;</td><td>{point.birth_date}</td></tr>'+
    '<tr><td>Breed:&nbsp;&nbsp;</td><td>{point.breed}</td></tr></table><br>';


// chart 1 - Awake Versus Rest of All Dogs by Name
function createChartOne() {
    // create series
    var series_data = makeDogPoints(filtered_dogs, function(point) {
        point.x = point.awake / point.total * 100,
        point.y = point.rest / point.total * 100,
        point.marker = {radius: Math.pow(point.total / filtered_dogs_max_total, .2) * 6};
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart1',
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
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        tooltip: {
            useHTML: true,
            headerFormat: '',
            pointFormat: dogPointFormat+
                '{point.x:.3f} % Awake, {point.y:.3f} % Rest<br>'+
                'Total Minutes: {point.total:.0f}',
        },
        plotOptions: {
            scatter: {
                marker: {
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
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

// chart 2 - Rest Versus Active of All Dogs by Name
function createChartTwo() {
    // create series
    var series_data = makeDogPoints(filtered_dogs, function(point) {
        point.x = point.rest / point.total * 100,
        point.y = point.active / point.total * 100,
        point.marker = {radius: Math.pow(point.total / filtered_dogs_max_total, .2) * 6};
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart2',
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
            showLastLabel: true,
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
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        tooltip: {
            useHTML: true,
            headerFormat: '',
            pointFormat: dogPointFormat+
                '{point.x:.3f} % Rest, {point.y:.3f} % Active<br>'+
                'Total Minutes: {point.total:.0f}',
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


// chart 3 - Awake Versus Active of All Dogs by Name
function createChartThree() {
    // create series
    var series_data = makeDogPoints(filtered_dogs, function(point) {
        point.x = point.awake / point.total * 100,
        point.y = point.active / point.total * 100,
        point.marker = {radius: Math.pow(point.total / filtered_dogs_max_total, .2) * 6};
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart3',
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'Percentage of Time Awake Versus Percentage of Time Active, Points Scaled by Total Minutes'
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
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        tooltip: {
            useHTML: true,
            headerFormat: '',
            pointFormat: dogPointFormat+
                '{point.x:.3f} % Awake, {point.y:.3f} % Active<br>'+
                'Total Minutes: {point.total:.0f}',
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





// chart 4 Activity Percentage of All Dogs
function createChartFour() {
    // create the series
    var series_data = makeDogPoints(filtered_dogs, function(point) {
        point.y = point.active / point.total * 100,
        point.marker = {radius: Math.pow(point.total / filtered_dogs_max_total, .2) * 4};
    });
     // sort
    series_data.sort(function (a, b) {
        return (a.active / a.total) - (b.active / b.total);
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart4',
            zoomType: 'x'
        },
        title: {
            text: 'Dogs By Active Time As a Percentage of Total Time, Points Scaled by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'Dog Name',
            title: {
                text: 'Dogs, Sorted From Least to Most Active Time'
            }
        },
        yAxis: {
            title: {
                text: 'Activity Percentage of Total Time'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        tooltip: {
            useHTML: true,
            headerFormat: '',
            pointFormat: dogPointFormat+
            '{point.y:.3f} % Active<br>Total Minutes: {point.total:.0f}',
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 3,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                }
            }
        },
        series: [{
            type: 'scatter',
            name: 'Dog Active Percentage',
            data: series_data,
        }]
    };
    // draw chart
    var chart = new Highcharts.Chart(options);
};

// chart 5 Awake Percentage of All Dogs
function createChartFive() {
    // create the series
    var series_data = makeDogPoints(filtered_dogs, function(point) {
        point.y = point.awake / point.total * 100,
        point.marker = {radius: Math.pow(point.total / filtered_dogs_max_total, .2) * 4};
    });
    // sort
    series_data.sort(function (a, b) {
        return (a.awake / a.total) - (b.awake / b.total);
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart5',
            zoomType: 'x'
        },
        title: {
            text: 'Dogs By Awake Time As a Percentage of Total Time, Points Scaled by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'Dog Name',
            title: {
                text: 'Dogs, Sorted From Least to Most Awake Time'
            }
        },
        yAxis: {
            title: {
                text: 'Awake Percentage of Total Time'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        tooltip: {
            useHTML: true,
            headerFormat: '',
            pointFormat: dogPointFormat + '{point.y:.3f} % Awake<br>Total Minutes: {point.total:.0f}',
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 3,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                }
            }
        },
        series: [{
            type: 'scatter',
            name: 'Dog Awake Percentage',
            data: series_data,
        }]
    };
    // draw chart
    var chart = new Highcharts.Chart(options);
};


// chart 6 Rest Percentage of All Dogs
function createChartSix() {
    // create the series
    var series_data = makeDogPoints(filtered_dogs, function(point) {
        point.y = point.rest / point.total * 100,
        point.marker = {radius: Math.pow(point.total / filtered_dogs_max_total, .2) * 4};
    });
     // sort
    series_data.sort(function (a, b) {
        return (a.rest / a.total) - (b.rest / b.total);
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart6',
            zoomType: 'x'
        },
        title: {
            text: 'Dogs By Rest Time As a Percentage of Total Time, Points Scaled by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'Dog Name',
            title: {
                text: 'Dogs, Sorted From Least to Most Rest Time'
            }
        },
        yAxis: {
            title: {
                text: 'Rest Percentage of Total Time'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        tooltip: {
            useHTML: true,
            headerFormat: '',
            pointFormat: dogPointFormat + '{point.y:.3f} % Rest<br>Total Minutes: {point.total:.0f}',
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 3,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                }
            }
        },
        series: [{
            type: 'scatter',
            name: 'Dog Rest Percentage',
            data: series_data,
        }]
    };
    // draw chart
    var chart = new Highcharts.Chart(options);
};


// chart 7 - Rest, Active, and Awake Times for Each Dog
function createChartSeven() {
    var processed_json_rest = new Array();
    var processed_json_active = new Array();
    var processed_json_awake = new Array();
    // sort dogs by name
    filtered_dogs.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart7',
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
                text: "Dogs by Name (Alphabetized)"
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
            '<td style="padding:0"><b>{point.y:.0f} mins</b></td></tr>',
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
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -5,
            y: 60,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
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
    var hashMostActiveDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostActiveDog.push({ name: data[i].name, val: data[i].active });
    }
    // sort from lowest to highest
    hashMostActiveDog.sort(function (a, b) {
        return a.val - b.val;
    });
    var highest = hashMostActiveDog[data.length - 1];
    var highest_name = hashMostActiveDog[data.length - 1]["name"];
    var highest_val = hashMostActiveDog[data.length - 1]["val"];
    return highest_name;
}

// least active dog card
// TODO: this does not handle duplicate values
function leastActiveDog(data) {
    var hashLeastActiveDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashLeastActiveDog.push({ name: data[i].name, val: data[i].active });
    }
    // sort from lowest to highest
    hashLeastActiveDog.sort(function (a, b) {
        return a.val - b.val;
    });
    var lowest = hashLeastActiveDog[0];
    var lowest_name = hashLeastActiveDog[0]["name"];
    var lowest_val = hashLeastActiveDog[0]["val"];
    return lowest_name;
}

// dog with the most rest time card
// TODO: this does not handle duplicate values
function mostRestDog(data) {
    var hashMostRestDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostRestDog.push({ name: data[i].name, val: data[i].rest });
    }
    //sort from lowest to highest
    hashMostRestDog.sort(function (a, b) {
        return a.val - b.val;
    });
    var most_rest = hashMostRestDog[data.length - 1];
    var most_rest_name = hashMostRestDog[data.length - 1]["name"];
    var most_rest_val = hashMostRestDog[data.length - 1]["val"];
    return most_rest_name;
}

// dog with most awake time card
// TODO: this does not handle duplicate values
function mostAwakeDog(data) {
    var hashMostAwakeDog = new Array();
    for (i = 0; i < data.length; i++) {
        hashMostAwakeDog.push({ name: data[i].name, val: data[i].awake });
    }
    // sort from lowest to highest
    hashMostAwakeDog.sort(function (a, b) {
        return a.val - b.val;
    });
    var most_awake = hashMostAwakeDog[data.length - 1];
    var most_awake_name = hashMostAwakeDog[data.length - 1]["name"];
    var most_awake_val = hashMostAwakeDog[data.length - 1]["val"];
    return most_awake_name;
}

//============= /javascript for cards at top of dashboard ======================




//============= javascript for custom graphs ===================================
// TODO: rewrite custom graphs entirely:
//    Users should be able to select multiple data ranges and then create
//    graphs that use these ranges.
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

// inserts a new custom graph dom object and renders the Highcharts options to it
function renderNewCustomGraph(options) {
    var id = insertNewGraphRow();
    options.chart.renderTo = id;
    var chart = new Highcharts.Chart(options);
}

// deletes e's parent from its parent
function deleteGraph(e) {
    e.parentNode.parentNode.removeChild(e.parentNode);
}

//inserts a new stats table alongside the new custom graph row
var stats_table_id = 0;
function insertNewStatsTable() {
    stats_table_id += 1;
    var id = "stats"+stats_table_id.toString();
    var graph = document.getElementById("custom-graph-"+custom_graph_id.toString());
    var newTable =
    '<table class="table table-hover" id="'+id+'" style="width:60%;">'
        +'<thead>'
            +'<tr style="background-color: #016197; color: white;">'
                +'<th>Statistic</th>'
                +'<th>Value</th>'
            +'</tr>'
        +'</thead>'
    +'</table>';
    graph.insertAdjacentHTML('afterend', newTable);
}
function insertNewStatsTable2() {
    stats_table_id += 1;
    var id = "stats"+stats_table_id.toString()+"Comp";
    var graph = document.getElementById("custom-graph-"+custom_graph_id.toString());
    var newTable =
    '<table class="table table-hover" id="'+id+'" style="width:60%;">'
        +'<thead>'
            +'<tr style="background-color: #016197; color: white;">'
                +'<th>Statistic</th>'
                +'<th>Value</th>'
                +'<th>Value2</th>'
            +'</tr>'
        +'</thead>'
    +'</table>';
    graph.insertAdjacentHTML('afterend', newTable);
}

//handles stats calculations and tests
//data is from the first dog
//type specifies if it's a comparison bar chart
//data2 is from the second dog (if a comparison)
function statsData(data, type, data2) {
    if(type == "compare") {
        var table = document.getElementById("stats"+stats_table_id.toString()+"Comp");

        //mean
        var tData = jStat.mean(data);
        var tData2 = jStat.mean(data2);
        editStatsTable2(1, "Mean", round(tData,2), round(tData2,2));
        //min and max
        tData = jStat.min(data);
        var tDataM = jStat.max(data);
        tData2 = jStat.min(data2);
        var tData2M = jStat.max(data2);
        editStatsTable2(2, "Min, Max", tData + ", " + tDataM, tData2 + ", " + tData2M);
        //variance
        tData = jStat.variance(data);
        tData1 = jStat.variance(data2);
        editStatsTable2(3, "Variance", round(tData,2), round(tData2,2));
        //standard deviation
        tData = jStat.stdev(data);
        tData2 = jStat.stdev(data2);
        editStatsTable2(4, "Standard Deviation", round(tData,2), round(tData2,2));
        //Quartiles
        tData = jStat.quartiles(data);
        tData2 = jStat.quartiles(data2);
        //tValue = tData[0] + ", " + tData[1] + ", " + tData[2];
        editStatsTable2(5, "Quartiles", tData[0] + ", " + tData[1] + ", " + tData[2], tData2[0] + ", " + tData2[1] + ", " + tData2[2]);
        //skewness
        tData = jStat.skewness(data);
        tData2 = jStat.skewness(data2);
        editStatsTable2(6, "Skewness", round(tData, 8), round(tData2, 8));
        //covariance
        tData = jStat.covariance(data, data2);
        editStatsTable2(7, "Covariance", round(tData, 2), "comp");
        //rho correlation
        tData = jStat.corrcoeff(data, data2);
        editStatsTable2(8, "Correlation Coefficient", round(tData, 4), "comp");
    } else {
        var table = document.getElementById("stats"+stats_table_id.toString());

        var tData = jStat.mean(data);
        editStatsTable(1, "Mean", round(tData,2));
        //min and max
        tData = jStat.min(data);
        var tData2 = jStat.max(data);
        editStatsTable(2, "Min, Max", tData + ", " + tData2);
        //variance
        tData = jStat.variance(data);
        editStatsTable(3, "Variance", round(tData,2));
        //standard deviation
        tData = jStat.stdev(data);
        editStatsTable(4, "Standard Deviation", round(tData,2));
        //Quartiles
        tData = jStat.quartiles(data);
        //tValue = tData[0] + ", " + tData[1] + ", " + tData[2];
        editStatsTable(5, "Quartiles", tData[0] + ", " + tData[1] + ", " + tData[2]);
        //skewness
        tData = jStat.skewness(data);
        editStatsTable(6, "Skewness", round(tData, 8));
    }
}

//handles inserting data into the stats table
//label is the name/type of statistic
//value is the calculated value of the statistic
function editStatsTable(rowNum, label, value) {
    var table = document.getElementById("stats"+stats_table_id.toString());
    var tRow = table.insertRow(rowNum);
    var tLabel = tRow.insertCell(0);
    var tValue = tRow.insertCell(1);
    tLabel.innerHTML = label;
    tValue.innerHTML = value;
}
//handles inserting data into comparison stats table
//label is the name/type of statistic
//value is the calculated value of the statistic
//value2 is for the second dog
function editStatsTable2(rowNum, label, value1, value2) {
    var table = document.getElementById("stats"+stats_table_id.toString()+"Comp");
    var tRow = table.insertRow(rowNum);
    var tLabel = tRow.insertCell(0);
    tLabel.innerHTML = label;
    if(value2 == "comp") {
        var tValue = tRow.insertCell(1);
        tValue.innerHTML = value1;
        tValue.colspan = 2;
        tValue.style.align = "center";
    } else {
        var tValue = tRow.insertCell(1);
        var tValue2 = tRow.insertCell(2);
        tValue.innerHTML = value1;
        tValue2.innerHTML = value2;
    }
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
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
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


function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}
//============= /javascript for custom graphs ==================================
