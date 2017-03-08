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

$.getScript("/static/dist/js/jstat.min.js");

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
                },
              spacingLeft: 0,
              spacingRight: 0
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
            filtered_dogs = data; // TODO: remove this
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
            // 
            example2();
            // 
            createChartEight();
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
            // normalize data
            normalizeDogData(filtered_blob.dogs);
            // create all graphs that use this data.
            example1();
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
var dogPointFormat = '<b>{point.name}</b><hr style="margin-top: .5em">'+
    '<table><tr><td>Status:&nbsp;&nbsp;</td><td>{point.dog_status}</td></tr>'+
    '<tr><td>Center:&nbsp;&nbsp;</td><td>{point.regional_center}</td></tr>'+
    '<tr><td>Sex:&nbsp;&nbsp;</td><td>{point.sex}</td></tr>'+
    '<tr><td>Birth Date:&nbsp;&nbsp;</td><td>{point.birth_date}</td></tr>'+
    '<tr><td>Breed:&nbsp;&nbsp;</td><td>{point.breed}</td></tr></table><hr>';

//***************************************************************************** */

// example 2 - High Activty Dogs vs. Low Activity Dogs
function example2() {
    var low_activity_val = new Array();
    var high_activity_val = new Array();
    var low_activity_name = new Array();
    var high_activity_name = new Array();
    var activity = new Array();
    //names for categories on x-axis. sorted from high activity to low activity
    var names = new Array();

    // push filtered_data name and activity key value pair to the activity array 
    for (i = 0; i < filtered_dogs.length; i++) {
        activity.push({ name: filtered_dogs[i].name, val: filtered_dogs[i].active, total: filtered_dogs[i].total});
    }
    // sort activity data from lowest to highest
    activity.sort(function (a, b) {
        return a.val - b.val;
    });

    //calculate top and lowest 10% number range 
    var ten_percent = Math.round(activity.length * 0.10);
    console.log(ten_percent);

    //highest values
    var high_counter = 1;
    for (i = 0; i < ten_percent; i++) {
        //var highest = activity[filtered_dogs.length - high_counter];
        
        //perc is used if you would like it done by percentage instead of total minutes
        //var perc = ((activity[filtered_dogs.length - high_counter]["val"]) / (activity[filtered_dogs.length - high_counter]["total"]))*100;
        //high_activity_name.push(activity[filtered_dogs.length - high_counter]["name"]);
        //high_activity_val.push(perc);

        //gives top 10% highest activity dogs by total minutes recorded 
        high_activity_name.push(activity[filtered_dogs.length - high_counter]["name"]);
        high_activity_val.push(activity[filtered_dogs.length - high_counter]["val"]);
        high_counter++;
    }

    //lowest values
    var low_counter = 0;
    for (i = 0; i < ten_percent; i++) {
        //var lowest = activity[low_counter];
       
        //perc is used if you would like it done by percentage instead of total minutes
        //var perc = ((activity[low_counter]["val"]) / (activity[low_counter]["total"]))*100;
        //low_activity_name.push(activity[low_counter]["name"]);
        //low_activity_val.push(perc);

        //gives top 10% lowest activity dogs by total minutes recorded 
        low_activity_name.push(activity[low_counter]["name"]);
        low_activity_val.push(activity[low_counter]["val"]);
        low_counter++;
    }

    //create names array for "categories" on x-axis
    //high_activity_name + low_activity_name
    names = high_activity_name.concat(low_activity_name);
    console.log(names);

    length
    //add padding of 0's for where high activity vs. low activity data should be displayed
    for (i = 0; i < ten_percent; i++) {
        high_activity_val.push(0);
    }
    console.log(high_activity_val);

    //add padding of 0's for where high activity vs. low activity data should be displayed
    for (i = 0; i < ten_percent; i++) {
        low_activity_val.unshift(0);
    }
    console.log(low_activity_val);

    // chart options
    var options = {
        chart: {
            renderTo: 'example2',
            type: 'column',
            zoomType: 'x'
        },
        title: {
            text: 'Top 10% High Activity Dogs by Total Minutes vs. Top 10% Low Activity Dogs by Total Minutes'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            title: {
                text: "Dog's Names"
            },
            categories: names,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Total Minutes'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-weight:bold;">{point.key}</span><hr style="margin-top:.5em;"><table>',
            pointFormat: '<tr><td style="padding:0">{series.name}:&nbsp;</td>' +
            '<td style="padding:0">{point.y:.0f} mins</td></tr>',
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
            name: 'High Activity',
            data: high_activity_val,
        }, {
            name: 'Low Activity',
            data: low_activity_val,
        }]
    };

    // create the chart
    var chart = new Highcharts.Chart(options);

};

//***************************************************************************** */

/******************** NEW COMPARISON MULTI LINE GRAPH FOR DASHBOARD ********************/ 
function example1() {

    var dates_rest = [];
    var dates_active = [];
    var dates_awake = [];
    var dates_total = [];
    var id = "";

    //line up date information with specific dog id
    //in this case it is hardcoded to be for Juma
    for (var k = 0; k < Object.keys(filtered_blob.dogs).length; k++) {
        if (filtered_blob.dogs[k].name == "Juma") {
            id = filtered_blob.dogs[k].id;
        }
    }

    //convert the filtered_bolb to the appropriate arrays
    // Define the data points. All series have a dummy year
    // of 1970/71 in order to be compared on the same x axis. Note
    // that in JavaScript, months start at 0 for January, 1 for February etc.
    var j = 0;
    for (var i = 0; i < Object.keys(filtered_blob.days).length; i++) {
        var dateSplit = filtered_blob.days[i].date.split("-");
        for (var m = 0; m < Object.keys(filtered_blob.days[i].dogs).length; m++) {
            if (filtered_blob.days[i].dogs[m].id == id) {
                //done by percentage of time
                dates_rest[j] = [Date.UTC(dateSplit[0], dateSplit[1] - 1, dateSplit[2]), ((filtered_blob.days[i].dogs[m].rest/filtered_blob.days[i].dogs[m].total)*100)];
                dates_active[j] = [Date.UTC(dateSplit[0], dateSplit[1] - 1, dateSplit[2]), ((filtered_blob.days[i].dogs[m].active/filtered_blob.days[i].dogs[m].total)*100)];
                dates_awake[j] = [Date.UTC(dateSplit[0], dateSplit[1] - 1, dateSplit[2]), ((filtered_blob.days[i].dogs[m].awake/filtered_blob.days[i].dogs[m].total)*100)];
                
                ////done without percentage by total minutes 
                //dates_rest[j] = [Date.UTC(dateSplit[0], dateSplit[1] - 1, dateSplit[2]), filtered_blob.days[i].dogs[m].rest];
                //dates_active[j] = [Date.UTC(dateSplit[0], dateSplit[1] - 1, dateSplit[2]), filtered_blob.days[i].dogs[m].active];
                //dates_awake[j] = [Date.UTC(dateSplit[0], dateSplit[1] - 1, dateSplit[2]), filtered_blob.days[i].dogs[m].awake];

                j++;
            }
        }
    }

    // chart options
    var options = {
        chart: {
            type: 'spline',
            renderTo: 'example1',
            zoomType: 'x'
        },
        title: {
            text: 'Percentage of Time Active, Rest and Awake Comparison for Juma by Date'
        },
        subtitle: {
            text: 'Over irregular dates'
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: { 
                // month: '%e. %b',
	            // year: '%Y'
                // month: '%Y-%m',
                second: '%Y-%b-%d<br/>%H:%M:%S',
                minute: '%Y-%b-%d<br/>%H:%M',
                hour: '%Y-%b-%d<br/>%H:%M',
                day: '%Y-%b-%d',
                week: '%Y-%b-%d',
                month: '%Y-%b',
                year: '%Y'
            },
            title: {
                text: 'Date'
            }
        },
        yAxis: {
            title: {
                text: 'Percentage of Time (% of Total Time)'
            },
            min: 0
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
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.1f} %</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },

        plotOptions: {
            spline: {
                marker: {
                    enabled: true
                }
            }
        },

        series: [{
            name: 'Rest',
            data: dates_rest
        }, {
            name: 'Active',
            data: dates_active
        }, {
            name: 'Awake',
            data: dates_awake
        }]
    };

    var chart = new Highcharts.Chart(options);
};
//************************ / NEW COMPARISON MULTI LINE GRAPH FOR DASHBOARD ************************ */



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
            headerFormat: '<span style="font-weight:bold;">{point.key}</span><hr style="margin-top:.5em;"><table>',
            pointFormat: '<tr><td style="padding:0">{series.name}:&nbsp;</td>' +
            '<td style="padding:0">{point.y:.0f} mins</td></tr>',
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

function createChartEight() {
    var processed_json_rest = new Array();
    var processed_json_active = new Array();
    var processed_json_awake = new Array();
    // sort dogs by name
    var region_data = dogsByField(filtered_dogs, "regional_center");
    var regions = Object.keys(region_data);
    regions.sort(function (a, b) {
        return a.localeCompare(b);
    });
    filtered_dogs.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart8',
            type: 'column',
            zoomType: 'x'
        },
        title: {
            text: 'Rest, Active, and Awake Percentages Averages per Region'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'category',
            title: {
                text: "Region"
            },
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Percentages of Total Time'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
            '<td style="padding:0"><b>{point.y:.0f} percent</b></td></tr>',
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
            name: 'Rest Average',
        }, {
            name: 'Active Average',
        }, {
            name: 'Awake Average',
        }]
    };
    // convert the filtered_data to the appropriate arrays
    for (i = 0; i < regions.length; i++) {
        var selected_region = region_data[regions[i]];
        var rest_average = getAverage(selected_region,"rest");
        var active_average = getAverage(selected_region,"active");
        var awake_average = getAverage(selected_region,"awake");
        var total_average = getAverage(selected_region,"total");

        processed_json_rest.push([regions[i], 100 * rest_average/total_average]);
        processed_json_active.push([regions[i], 100 * active_average/total_average]);
        processed_json_awake.push([regions[i], 100 * awake_average/total_average]);
    }
    // create the chart
    options.series[0].data = processed_json_rest;
    options.series[1].data = processed_json_active;
    options.series[2].data = processed_json_awake;
    var chart = new Highcharts.Chart(options);
};

function dogsByField(dogs, field) {
    by_field = {};
    for (var i = 0; i < dogs.length; i++) {
        var value = dogs[i][field];
        if (!(value in by_field)) {
            by_field[value] = [dogs[i]];
        } else {
            by_field[value].push(dogs[i]);
        }
    }
    return by_field;
}

function getAverage(array,field){
    var sum = 0;
    for (var i = 0; i < array.length; i++){
        sum = sum + array[i][field];
    }
    var average = sum/array.length;
    return average;
}
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
var JSONstring1 = '';
var chartOptionsAreValid = false;
var id;
var barchoices3 = [];
var barchoices5 = [];
barchoicesRegion = [];
barchoicesSex = [];
barchoicesStatus = [];
var barchoicesRegion2 = [];
var barchoicesSex2 = [];
var barchoicesStatus2 = [];
var alldogs = [];
var barchoices1 = [{"value": "Raw Data", "text": "Raw Data"}, {"value": "Comparisons", "text": "Comparisons"}];
var barchoices2 = [{"value": "Active", "text": "Active"}, {"value": "Awake", "text": "Awake"}, {"value": "Rest", "text": "Rest"}, {"value": "Total", "text": "Total"}];
var barchoices4 = [{"value": "Raw Data", "text": "Raw Data"}];

// Checks the logic behind first field for generate graph. If sucessful goes to fieldcheck2.
function fieldcheck() {
    var temp = $("#mySelect option:selected").text();
    var filterValue = $("#myFilter option:selected").text();
    chartOptionsAreValid = false;
    var status = false;
    var region = false;
    var sex = false;
    if (filterValue != "All Dogs") {
        $('#myFilter2').show();
        if (temp == "Pie" || temp == "Line") {
            $('#mySelect2').hide();

        }
        // var j = 0;
        // JSONstring1 = filtered_blob;
        // for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
        //     helper = {"value": JSONstring1.dogs[i].name, "text": JSONstring1.dogs[i].name}
        //     alldogs[j] = helper;
        //     j++;
        // }
        // barOptions('#myFilter2', alldogs);

        if(filterValue == "Region"){
            region = true;
            var j = 0;
            //console.log(filtered_blob);
            JSONstring1 = filtered_blob;
            var uniques = [];
            barchoicesRegion = [];
            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                if (uniques.indexOf(JSONstring1.dogs[i].regional_center) > -1) {
                    //console.log(JSONstring1.dogs[i].regional_center);
                    //test;
                    continue;
                }
                helper = {"value": JSONstring1.dogs[i].regional_center, "text": JSONstring1.dogs[i].regional_center}
                uniques.push(JSONstring1.dogs[i].regional_center);
                //console.log(uniques);

                barchoicesRegion[j] = helper;
                j++;
            }
            barOptions('#myFilter2', barchoicesRegion);

        } else if(filterValue == "Dog Status"){
            status = true;
            var j = 0;
            console.log(filtered_blob);
            JSONstring1 = filtered_blob;
            var uniques = [];
            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                if (uniques.indexOf(JSONstring1.dogs[i].dog_status) > -1) {
                    //console.log(JSONstring1.dogs[i].regional_center);
                    //test;
                    continue;
                }
                helper = {"value": JSONstring1.dogs[i].dog_status, "text": JSONstring1.dogs[i].dog_status}
                uniques.push(JSONstring1.dogs[i].dog_status);
                //console.log(uniques);

                barchoicesStatus[j] = helper;
                j++;
            }
            barOptions('#myFilter2', barchoicesStatus);

        } else if(filterValue == "Sex"){
            status = true;
            var j = 0;
            //console.log(filtered_blob);
            JSONstring1 = filtered_blob;
            var uniques = [];
            barchoicesSex = [];

            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                if (uniques.indexOf(JSONstring1.dogs[i].sex) > -1) {
                    //console.log(JSONstring1.dogs[i].regional_center);
                    //test;
                    continue;
                }
                helper = {"value": JSONstring1.dogs[i].sex, "text": JSONstring1.dogs[i].sex}
                uniques.push(JSONstring1.dogs[i].sex);
                //console.log(uniques);

                barchoicesSex[j] = helper;
                j++;
            }
            barOptions('#myFilter2', barchoicesSex);

        }

    } else {
        chartOptionsAreValid = false;
        $('#myFilter2').hide();
        $('#myFilter3').hide();
        $('#myFilter4').hide();
    }
    if (temp != "Select One") {
        $('#mySelect2').show();
        if(temp == "Bar"){
            barOptions('#mySelect2', barchoices1);
            $('#myFilter3').hide();

        } else if (temp == "Pie"){
            barOptions('#mySelect2', barchoices4);
        } else if (temp == "Box"){
            barOptions('#mySelect2', barchoices4);
            $('#myFilter2').hide();
            $('#myFilter3').hide();


        }
        else if (temp == "Line"){
            var j = 0;
            JSONstring1 = filtered_blob;
            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                helper = {"value": JSONstring1.dogs[i].name, "text": JSONstring1.dogs[i].name}
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

// Check the second fieldcheck field, different options cause i different filters/inputs
function fieldcheck2() {
    var boxCheck = true;
    var temp = $("#mySelect2 option:selected").text();
    var temp2 = $("#mySelect option:selected").text();
    var tempfilter = $("#myFilter2 option:selected").text();
    //console.log("hello");
    var tempfilter2 = $("#myFilter option:selected").text();
    //console.log(tempfilter2);
    if (tempfilter != "Select One") {
        if (temp2 != "Bar" && temp2 != "Box") {
            $('#myFilter3').show();

        }
        if(tempfilter2 == "Region") {
            var j = 0;
            JSONstring1 = filtered_blob;
            barchoicesRegion2 = [];

            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                console.log(JSONstring1.dogs[i].region);
                console.log(tempfilter);
                console.log("-------");
                if (tempfilter == JSONstring1.dogs[i].regional_center) {
                    helper = {"value": JSONstring1.dogs[i].name, "text": JSONstring1.dogs[i].name}
                    barchoicesRegion2[j] = helper;
                    j++;

                }
            }
            barOptions('#myFilter3', barchoicesRegion2);
            $('#myFilter4').hide();
            if (temp2 == "Line" || temp2 == "Pie") {
                $('#mySelect2').hide();
                if (temp2 == "Line") {
                    barOptions('#mySelect3', barchoices2);
                    $('#mySelect3').show();
                    console.log("aa");

                } else {
                    $('#mySelect3').hide();
                    boxCheck = false;

                }
                $('#mySelect4').hide();

                chartOptionsAreValid = true;


            }
        } else if(tempfilter2 == "Dog Status") {
            var j = 0;
            JSONstring1 = filtered_blob;
            barchoicesStatus2 = [];

            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                // console.log(JSONstring1.dogs[i].region);
                // console.log(tempfilter);
                // console.log("-------");
                if (tempfilter == JSONstring1.dogs[i].dog_status) {
                    helper = {"value": JSONstring1.dogs[i].name, "text": JSONstring1.dogs[i].name}
                    barchoicesStatus2[j] = helper;
                    j++;

                }
            }
            barOptions('#myFilter3', barchoicesStatus2);
            $('#myFilter4').hide();
            if (temp2 == "Line" || temp2 == "Pie") {
                $('#mySelect2').hide();
                if (temp2 == "Line") {
                    barOptions('#mySelect3', barchoices2);
                    $('#mySelect3').show();

                } else {
                    $('#mySelect3').hide();
                    boxCheck = false;


                }
                $('#mySelect4').hide();

                chartOptionsAreValid = true;


            }
        } else if(tempfilter2 == "Sex") {
            var j = 0;
            JSONstring1 = filtered_blob;
            barchoicesSex2 = [];
            for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                console.log(JSONstring1.dogs[i].sex);
                console.log(tempfilter);
                console.log("-------");
                if (tempfilter == JSONstring1.dogs[i].sex) {
                    helper = {"value": JSONstring1.dogs[i].name, "text": JSONstring1.dogs[i].name}
                    barchoicesSex2[j] = helper;
                    j++;

                }
            }
            barOptions('#myFilter3', barchoicesSex2);
            $('#myFilter4').hide();
            if (temp2 == "Line" || temp2 == "Pie") {
                $('#mySelect2').hide();
                if (temp2 == "Line") {
                    barOptions('#mySelect3', barchoices2);
                    $('#mySelect3').show();

                } else {
                    $('#mySelect3').hide();
                    boxCheck = false;

                }
                $('#mySelect4').hide();
                chartOptionsAreValid = true;


            }
        } else {
            $('#myFilter3').hide();
            $('#myFilter4').hide();
            chartOptionsAreValid = false;
        }
    } else {
        console.log("eror");
        chartOptionsAreValid = false;
    }
    if (temp != "Select One") {
        if (boxCheck) {
            $('#mySelect3').show();

        }
        if(temp == "Raw Data"){
            if (temp2 == "Bar") {
                chartOptionsAreValid = false;
                    barOptions('#mySelect3', barchoices2);
                    $('#mySelect4').hide();

                    //chartOptionsAreValid = true;
            } else if (temp2 == "Box") {
                chartOptionsAreValid = false;
                    barOptions('#mySelect3', barchoices2);
                    $('#mySelect4').hide();
                    //chartOptionsAreValid = true;
            } else if (temp2 == "Pie") {
                var j = 0;
                JSONstring1 = filtered_blob;
                // console.log("hi");
                //
                // console.log($("#myFilter").selected);
                // console.log("ho");
                for (var i = 0; i < Object.keys(filtered_blob.dogs).length; i++) {
                    helper = {"value": JSONstring1.dogs[i].name, "text": JSONstring1.dogs[i].name}
                    barchoices3[j] = helper;
                    j++;
                }
                //chartOptionsAreValid = false;
                    //if ($("#myFilter2 option:selected").text();)
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
                    JSONstring1 = filtered_dogs;


                    for (var i = 0; i < filtered_dogs.length; i++) {
                        helper = {"value": JSONstring1[i].name, "text": JSONstring1[i].name}
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
            //chartOptionsAreValid = false;
        }
    } else {
        $('#mySelect3').hide();
        $('#mySelect4').hide();
    }
}

//Checks the logic for the 3rd field
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
        //chartOptionsAreValid = false;
    }
}

//chckes the logic for last field, should only be used in comparisons
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

//Generates the graph after clicking the button
function generateGraph() {
    console.log("!!!A");
    console.log($("#mySelect2 option:selected").text());
    console.log($("#mySelect3 option:selected").text());
    console.log($("#myFilter3 option"));
    console.log( $("#myFilter3").css('display'));

    if (chartOptionsAreValid) {
            name1 = $("#mySelect1 option:selected").text();
            var temp1 = $("#mySelect option:selected").text();
        if (temp1 == "Bar") {
            var select1 = $("#mySelect2 option:selected").text();
            if (select1 == "Raw Data"){
                var type = $("#mySelect3 option:selected").text();
                makeBar(filtered_dogs, type);
            }
            if (select1 == "Comparisons"){
                var typeA = $("#mySelect3 option:selected").text();
                var typeB = $("#mySelect4 option:selected").text();
                makeBar2(filtered_dogs, typeA, typeB);
            }
        } else if (temp1 == "Pie") {
            var select1 = $("#mySelect3 option:selected").text();

            if (select1 != "Select One"){
                var type = $("#mySelect3 option:selected").text();
                makePie(filtered_dogs, type);

            }
            else {

                var type = $("#myFilter3 option:selected").text();
                if (type == "Select One") {
                    alert("You must make a selection for each option first.");
                } else {
                    makePie(filtered_dogs, type);

                }
            }
        } else if (temp1 == "Line") {
            var select1 = $("#mySelect2 option:selected").text();
            var type = $("#mySelect3 option:selected").text();
            // console.log("!");
            // console.log($("#mySelect2 option:selected").text());
            var filterVar = $("#myFilter3").css('display')
            if ($("#myFilter3").css('display') != "none") {
                //console.log("!!");

                select1 = $("#myFilter3 option:selected").text();
            }
            makeLine(filtered_blob, select1, type);
        } else if (temp1 == "Box") {
            var select1 = $("#mySelect2 option:selected").text();
            if (select1 == "Raw Data"){
                var type = $("#mySelect3 option:selected").text();
                makeBox(filtered_dogs, type);
            }
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
    var newElement = '<div class="row"><button class="delete-button" onclick="deleteGraph(this)" align="right">x</button><div id="'+id+'" style="width: 100%; height: 40em; margin: 0 auto;"></div></div>';

    graphs.insertAdjacentHTML('afterbegin', newElement);
    return id;
}

// inserts a new custom graph dom object and renders the Highcharts options to it
function renderNewCustomGraph(options, compare) {
    var id = insertNewGraphRow();
    options.chart.renderTo = id;
    var chart = new Highcharts.Chart(options);

    if(compare == "compare") {
        insertNewStatsTable2();
    } else if(compare == "normal"){
        insertNewStatsTable();
    }
}

// deletes e's parent from its parent
function deleteGraph(e) {
    e.parentNode.parentNode.removeChild(e.parentNode);
}

// Used to check filter conditions of generate graph. Uses first filter input to generalize the next ones.
function filterCheck() {
    var filterTxt = $("#myFilter option:selected").text();
    var filterTxt2 = $("#myFilter2 option:selected").text();
    var filterTxt3 = $("#myFilter3 option:selected").text();
    if (filterTxt == 'All Dogs') {
        return null;
    } else if (filterTxt == 'Region') {
        return barchoicesRegion2;
    } else if (filterTxt == 'Sex') {
        return barchoicesSex2;
    } else if (filterTxt == 'Dog Status') {
        // console.log("zzz");
        // console.log(barchoicesStatus2);
        return barchoicesStatus2;
    }
}

//Filtercheck2 returns the initial types for the filter rather then specific dogs
function filterCheck2() {
    var filterTxt = $("#myFilter option:selected").text();
    var filterTxt2 = $("#myFilter2 option:selected").text();
    var filterTxt3 = $("#myFilter3 option:selected").text();
    if (filterTxt == 'All Dogs') {
        return null;
    } else if (filterTxt == 'Region') {
        return barchoicesRegion;
    } else if (filterTxt == 'Sex') {
        return barchoicesSex;
    } else if (filterTxt == 'Dog Status') {
        // console.log("zzz");
        // console.log(barchoicesStatus2);
        return barchoicesStatus;
    }
}



//inserts a new stats table alongside the new custom graph row
var stats_table_id = 0;
function insertNewStatsTable() {
    stats_table_id += 1;
    var id = "stats"+stats_table_id.toString();
    var graph = document.getElementById("custom-graph-"+custom_graph_id.toString());
    var newTable =
    '<table class="table table-hover stats" id="'+id+'">'
        +'<thead>'
            +'<tr style="background-color: #016197; color: white;">'
                +'<th>Statistic</th>'
                +'<th>Series One Value</th>'
            +'</tr>'
            +'</thead><tbody></tbody>'
    +'</table>';
    graph.insertAdjacentHTML('afterend', newTable);
}
function insertNewStatsTable2() {
    stats_table_id += 1;
    var id = "stats"+stats_table_id.toString()+"Comp";
    var graph = document.getElementById("custom-graph-"+custom_graph_id.toString());
    var newTable =
        '<table class="table table-hover stats" id="'+id+'">'
        +'<thead>'
            +'<tr style="background-color: #016197; color: white;">'
                +'<th>Statistic</th>'
                +'<th>Series One Value</th>'
-                +'<th>Series Two Value</th>'
            +'</tr>'
            +'</thead><tbody></tbody>'
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
        editStatsTable2(0, "Mean", round(tData,2), round(tData2,2));
        //min and max
        tData = jStat.min(data);
        var tDataM = jStat.max(data);
        tData2 = jStat.min(data2);
        var tData2M = jStat.max(data2);
        editStatsTable2(1, "Min, Max", tData + ", " + tDataM, tData2 + ", " + tData2M);
        //variance
        tData = jStat.variance(data);
        tData1 = jStat.variance(data2);
        editStatsTable2(2, "Variance", round(tData,2), round(tData2,2));
        //standard deviation
        tData = jStat.stdev(data);
        tData2 = jStat.stdev(data2);
        editStatsTable2(3, "Standard Deviation", round(tData,2), round(tData2,2));
        //Quartiles
        tData = jStat.quartiles(data);
        tData2 = jStat.quartiles(data2);
        //tValue = tData[0] + ", " + tData[1] + ", " + tData[2];
        editStatsTable2(4, "Quartiles", tData[0] + ", " + tData[1] + ", " + tData[2], tData2[0] + ", " + tData2[1] + ", " + tData2[2]);
        //skewness
        tData = jStat.skewness(data);
        tData2 = jStat.skewness(data2);
        editStatsTable2(5, "Skewness", round(tData, 8), round(tData2, 8));
        //covariance
        tData = jStat.covariance(data, data2);
        editStatsTable2(6, "Covariance", round(tData, 2), "comp");
        //rho correlation
        tData = jStat.corrcoeff(data, data2);
        editStatsTable2(7, "Correlation Coefficient", round(tData, 4), "comp");
    } else {
        var table = document.getElementById("stats"+stats_table_id.toString());

        var tData = jStat.mean(data);
        editStatsTable(0, "Mean", round(tData,2));
        //min and max
        tData = jStat.min(data);
        var tData2 = jStat.max(data);
        editStatsTable(1, "Min, Max", tData + ", " + tData2);
        //variance
        tData = jStat.variance(data);
        editStatsTable(2, "Variance", round(tData,2));
        //standard deviation
        tData = jStat.stdev(data);
        editStatsTable(3, "Standard Deviation", round(tData,2));
        //Quartiles
        tData = jStat.quartiles(data);
        //tValue = tData[0] + ", " + tData[1] + ", " + tData[2];
        editStatsTable(4, "Quartiles", tData[0] + ", " + tData[1] + ", " + tData[2]);
        //skewness
        tData = jStat.skewness(data);
        editStatsTable(5, "Skewness", round(tData, 8));
    }
}

//handles inserting data into the stats table
//label is the name/type of statistic
//value is the calculated value of the statistic
function editStatsTable(rowNum, label, value) {
    var table = document.getElementById("stats"+stats_table_id.toString());
    table = table.getElementsByTagName("tbody")[0];
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
    table = table.getElementsByTagName("tbody")[0];
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
    JSONstring1 = data;
    var j = 0;
    var tempArr = filterCheck();
    var arr2 = [];
    if (tempArr != null) {
        arr2 = tempArr.map(function(item) {
            return item['text'];
        });
    }
    // console.log("test");
    // console.log(arr2);
    for (var i =0; i < JSONstring1.length; i++) {
        if (tempArr == null) {
            arr[j] = JSONstring1[i].name;
            var ratio = getBarInfo(JSONstring1[i], type);
            arr1[j] = ratio;
            j++;
        } else {
            //console.log(JSONstring1[i].name);
            if(arr2.includes(JSONstring1[i].name)) {
                arr[j] = JSONstring1[i].name;
                var ratio = getBarInfo(JSONstring1[i], type);
                arr1[j] = ratio;
                j++;
            }
        }

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
    renderNewCustomGraph(options, "normal");
    statsData(arr1)
}

//Used to generate the comparison bar graph
function makeBar2(data, typeA, typeB) {
    var arr = new Array();
    var arr1 = new Array();
    var arr2 = new Array();
    JSONstring1 = data;
    var j = 0;
    var tempArr = filterCheck();
    var arr2 = [];
    if (tempArr != null) {
        arr2 = tempArr.map(function(item) {
            return item['text'];
        });
    }
    for (var i =0; i < JSONstring1.length; i++) {
        if (tempArr == null) {

            arr[j] = JSONstring1[i].name;
            var ratio = getBarInfo(JSONstring1[i], typeA);
            var ratio2 = getBarInfo(JSONstring1[i], typeB);
            arr1[j] = ratio;
            arr2[j] = ratio2;
            j++;
        } else {
            if(arr2.includes(JSONstring1[i].name)) {
                arr[j] = JSONstring1[i].name;
                var ratio = getBarInfo(JSONstring1[i], typeA);
                var ratio2 = getBarInfo(JSONstring1[i], typeB);
                arr1[j] = ratio;
                arr2[j] = ratio2;
                j++;
            }

        }
    }
    console.log("aa");
    console.log(arr);
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
                endOnTick: true,
                max: arr.length-1,
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
    renderNewCustomGraph(options, "compare");
    statsData(arr1, "compare", arr2);
}

//Creates the box graph, can use filters to change aspects of the box
function makeBox(data, type) {
    // var arr = new Array();
    var arr1 = new Array();
    JSONstring1 = data;
    var arr = filterCheck2();
    var arr2 = ['All Dogs'];
    // var tempArr = filterCheck();
    // var arr2 = [];
    if (arr != null) {
        arr2 = arr.map(function(item) {
            return item['text'];
        });
    }
    // console.log("test");
    // console.log(arr2);
    var arrData = [];
    var filterSelected = $("#myFilter option:selected").text();
    for (var m=0; m < arr2.length; m++) {
        var arrTemp = [];
        var j = 0;
        for (var i =0; i < JSONstring1.length; i++) {
                if(filterSelected == "Region" && JSONstring1[i].regional_center == arr2[m]) {
                    var ratio = getBarInfo(JSONstring1[i], type);
                    arrTemp[j] = ratio;
                    j++;
                } else if(filterSelected == "Dog Status" && JSONstring1[i].dog_status == arr2[m]) {
                    var ratio = getBarInfo(JSONstring1[i], type);
                    arrTemp[j] = ratio;
                    j++;
                } else if(filterSelected == "Sex" && JSONstring1[i].sex == arr2[m]) {
                    var ratio = getBarInfo(JSONstring1[i], type);
                    arrTemp[j] = ratio;
                    j++;
                } else if(filterSelected == "All Dogs") {
                    var ratio = getBarInfo(JSONstring1[i], type);
                    arrTemp[j] = ratio;
                    j++;
                }
                // } else {
                //     var ratio = getBarInfo(JSONstring1[i], type);
                //     arr1[j] = ratio;
                //     j++;
                // }

        };
        arrData[m] = arrTemp;
    }
    console.log(arrData);
    console.log(arr1);
    //arrNum = arr1;
    function sortNumber(a,b) {
        return a - b;
    }
    var finalData = [];
    for (var k=0; k < arrData.length; k++) {
        var boxData = [];
        arrData[k] = arrData[k].sort(sortNumber);
        var arrNum = [];
        arrNum = arrData[k];
        boxData[0] = arrNum[0];
        console.log("testing");
        //console.log(arrNum[Math.floor(arrNum.length/2)]);
        boxData[1] = arrNum[Math.floor(arrNum.length/4)];
        boxData[2] = arrNum[Math.floor(arrNum.length/2)];
        boxData[3] = arrNum[Math.floor(arrNum.length - arrNum.length/4)];
        boxData[4] = arrNum[Math.floor(arrNum.length -1)];
        finalData[k] = boxData;
    }
    console.log(finalData);



    console.log(arr1);
    var options = {

    chart: {
        type: 'boxplot'
    },

    title: {
        text: 'Box plot series for ' + filterSelected
    },

    legend: {
        enabled: false
    },

    xAxis: {
        endOnTick: true,
        max: arr2.length-1,
        categories: arr2,
        title: {
            text: filterSelected
        }
    },

    yAxis: {
        title: {
            text: 'Minutes ' + type
        },
        // plotLines: [{
        //     value: 932,
        //     color: 'red',
        //     width: 1,
        //     label: {
        //         text: 'Theoretical mean: 932',
        //         align: 'center',
        //         style: {
        //             color: 'gray'
        //         }
        //     }
        // }]
    },

    series: [{
        name: 'Observations',
        data: finalData,
        tooltip: {
            headerFormat: '<em>Experiment No {point.key}</em><br/>'
        }
    }]

};
    renderNewCustomGraph(options);
    //statsData(arr1)
}

//Makes a pie chart using options selected in the generate graph attributes
function makePie(data, dog) {
    var arr = new Array();
    var arr1 = new Array();
    JSONstring1 = data;
    var j = 0;
    // console.log("----");
    // console.log($("#myFilter3 option:selected").text());
    // console.log("----");

    for (var i =0; i < JSONstring1.length; i++) {
        if (JSONstring1[i].name == dog) {
            var data1 = getBarInfo(JSONstring1[i], "Rest");
            var data2 = getBarInfo(JSONstring1[i], "Active");
            var data3 = getBarInfo(JSONstring1[i], "Awake");
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

//Makes line graph that are created for specific dogs
function makeLine(data, dog, type) {
    //console.log(type);
    var arr = new Array();
    var arr1 = new Array();
    var dates = [];
    var index;
    JSONstring1 = data;
    for (var k =0; k < Object.keys(filtered_blob.dogs).length; k++) {
        if (filtered_blob.dogs[k].name == dog) {
            id = filtered_blob.dogs[k].id;
        }
    }
    var j = 0;
    for (var i =0; i < Object.keys(filtered_blob.days).length; i++) {
        var dateSplit = filtered_blob.days[i].date.split("-");
        for (var m =0; m < Object.keys(filtered_blob.days[i].dogs).length; m++) {
            if (filtered_blob.days[i].dogs[m].id == id) {
                //console.log(filtered_blob.days[i].date);
                if (type == "Total") {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), filtered_blob.days[i].dogs[m].total];
                } else if (type == "Rest") {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), filtered_blob.days[i].dogs[m].rest];
                } else if (type == "Active") {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), filtered_blob.days[i].dogs[m].active];
                } else {
                    dates[j] = [Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]), filtered_blob.days[i].dogs[m].awake];
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
    JSONstring1 = data;
    var j = 0;
    for (var i =0; i < JSONstring1.length; i++) {
        if (JSONstring1[i].name == dog1) {
            //console.log(JSONstring1[i].name);
            var data1 = getBarInfo(JSONstring1[i], "Rest");
            var data2 = getBarInfo(JSONstring1[i], "Active");
            var data3 = getBarInfo(JSONstring1[i], "Awake");
        }
        if (JSONstring1[i].name == dog2) {
            //console.log(JSONstring1[i].name);
            var data4 = getBarInfo(JSONstring1[i], "Rest");
            var data5 = getBarInfo(JSONstring1[i], "Active");
            var data6 = getBarInfo(JSONstring1[i], "Awake");
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
