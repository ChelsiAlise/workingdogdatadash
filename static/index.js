/*
This script is our application, the organization is as follows:
- The first section contains shared variables and the document.ready method,
 and helper methods.
- Next is the code for the custom graphs
- Followed by the code for the dashboard graphs
- And finally the code for the dashboard cards
*/

// we will store the data pulled from the server in these
// 70% of a day filtered
var filtered_dogs;
var filtered_dogs_max_total;
var filtered_blob;
// unfiltered
var unfiltered_dogs;
var unfiltered_dogs_max_total;
var unfiltered_blob;

// page setup, and data loading
$(document).ready(function () {
    loadDataAndInitialize();
});

// get jstat library
$.getScript("/static/dist/js/jstat.min.js");

function loadDataAndInitialize() {
    // set default plot options
    Highcharts.setOptions({
        // NOTE: animation interacts poorly with inserting graphs
        plotOptions: { series: { animation: false } },
        chart: {
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
            spacingRight: 0,
            fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
        },
        title: { style: { fontSize: '18px' } },
        xAxis: { 
            title: { style: { fontSize: '16px' } },
            labels: { style: { fontSize: '14px' } },
        },
        yAxis: { 
            title: { style: { fontSize: '16px' } },
            labels: { style: { fontSize: '14px' } },
        },
        exporting: {
            sourceWidth: 1920,
            sourceHeight: 1080,
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
            createChartEight();
            createChartNine();
            // update the custom graph options
            updateCustomGraphOptions();
        }
    });
    // load the full data set next
    $.ajax({
        type: "GET",
        url: "/api/cached/data/filtered/blob",
        async: true,
        datatype: 'json',
        success: function(data) {
            // store and normalize the data
            filtered_blob = data;
            normalizeDogData(filtered_blob.dogs);
        }
    });
    // load the unfiltered data
    $.ajax({
        type: "GET",
        url: "/api/cached/data/dogs",
        async: true,
        datatype: 'json',
        success: function(data) {
            // store and normalize the data
            unfiltered_dogs = data;
            normalizeDogData(unfiltered_dogs);
            // precompute maximum total for scaling
            unfiltered_dogs_max_total = getMaxTotal(unfiltered_dogs);
        }
    });
    $.ajax({
        type: "GET",
        url: "/api/cached/data/blob",
        async: true,
        datatype: 'json',
        success: function(data) {
            // store the data
            unfiltered_blob = data;
            // normalize data
            normalizeDogData(unfiltered_blob.dogs);
        }
    });
}

/* utility methods for interacting with the dog data */

/*
 normalizes and array of dog data
 replaces empty outcome data strings with "Unknown"
*/
function normalizeDogData(dogs) {
    var normalize_fields = [
        "birth_date", "breed", "dog_status", "sex", "regional_center"
    ];
    for (var i = 0; i < dogs.length; i++) {
        for (var j = 0; j < normalize_fields.length; j++) {
            var field = normalize_fields[j];
            if (dogs[i][field] == "") {
                dogs[i][field] = "Unknown";
            }
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

/*
    returns the dog object with matching dog.name from data
    data should be one of:
        [filtered_dogs, unfiltered_dogs, filtered_blob, unfitered_blob]
*/
function getDogByName(data, name) {
    data = "dogs" in data ? data.dogs : data;
    for (var i = 0; i < data.length; i++) {
        if (data[i].name == name) {
            return data[i];
        }
    }
}

/*
    this pushes value to object[key] or creates an array then pushes
*/
function default_push(object, key, value) {
    (object[key] = object[key] || []).push(value);
}


// shared format for the beginning of formatting points with the dog's name
// and outcome data.
var dogPointFormat = '<b>{point.name}</b><hr style="margin-top: .5em">'+
    '<table><tr><td>Status:&nbsp;&nbsp;</td><td>{point.dog_status}</td></tr>'+
    '<tr><td>Center:&nbsp;&nbsp;</td><td>{point.regional_center}</td></tr>'+
    '<tr><td>Sex:&nbsp;&nbsp;</td><td>{point.sex}</td></tr>'+
    '<tr><td>Birth Date:&nbsp;&nbsp;</td><td>{point.birth_date}</td></tr>'+
    '<tr><td>Breed:&nbsp;&nbsp;</td><td>{point.breed}</td></tr></table><hr>';


//============= javascript for custom graphs ===================================
/*
    use query to get selectSelector item and clear it,
    adding <option value=v>v</option> for each v in newOptions
    temporarily make select box more noticable
    preserve selected val if present in newOptions, otherwise select
    defaultIndex
*/
function setSelectOptions(selectSelector, newOptions, defaultIndex) {
    var el = $(selectSelector);
    // get the old value
    var val = el.val();
    // get the default index paramater
    defaultIndex = typeof defaultIndex !== 'undefined' ? defaultIndex : 0;
    // clear the select
    el.empty();
    // add the new options, search for the old value and the default index value
    var i = 0;
    var defaultIndexValue;
    var inNewArray = false;
    $.each(newOptions, function(key, value) {
        el.append($("<option></option>").attr("value", value).text(value));
        if (i == defaultIndex) {
            defaultIndexValue = value;
        }
        if (value == val) {
            inNewArray = true;
        }
        i++;
    });
    // set the old value if present, or the default index
    if (inNewArray) {
        el.val(val);
    } else {
        el.val(defaultIndexValue);
    }
    // flash the select box to alert the user
    el.addClass("select-alert");
    setTimeout(function(){
        el.removeClass("select-alert");
    }, 750);
}

/*
    Dog type selection options to array of dog names.
    This is computed in updateCustomGraphOptions.
    It is used for the dog selection UI (see dogTypeOnChange).
*/
var dog_type_to_dogs = {};
/*
    This should be called once the "dogs" dataset is loaded.
    It updates the custom graph selection options.
*/
function updateCustomGraphOptions() {
    for (var i = 0; i < filtered_dogs.length; i++) {
        var dog = filtered_dogs[i];
        var name = dog.name;
        default_push(dog_type_to_dogs, "All Dogs", name);
        default_push(dog_type_to_dogs, "Status: "+dog.dog_status, name);
        default_push(dog_type_to_dogs, "Breed: "+dog.breed, name);
        default_push(dog_type_to_dogs, "Sex: "+dog.sex, name);
        default_push(dog_type_to_dogs, "Region: "+dog.regional_center, name);
    }
    for (k in dog_type_to_dogs) {
        dog_type_to_dogs[k].sort();
    }
    setSelectOptions("#select-dog-type", Object.keys(dog_type_to_dogs).sort());
    datasetOnChange();
    dogTypeOnChange();
}


/*
    The `onchange=` callback for #select-dog-type in the Custom Graphs UI
*/
function dogTypeOnChange() {
    // get dog selection type and then set the possible dogs
    var dogType = $("#select-dog-type").val();
    setSelectOptions("#select-dog", dog_type_to_dogs[dogType], 0);
}

/*
    This inserts a new row with a graph container and returns the element.
    Custom graphs should be placed in these.
*/
var custom_graph_id = 0; // used to create a unique id for custom graphs
function insertNewGraphRow() {
    custom_graph_id += 1;
    var id = "custom-graph-"+custom_graph_id.toString();
    var graphs = document.getElementById("custom-graphs");
    var newElement = '<div class="row"><button class="delete-button" onclick="deleteGraph(this)" align="right">Remove</button><div id="'+id+'" class="custom-graph"></div></div>';
    graphs.insertAdjacentHTML('afterbegin', newElement);
    return id;
}

/*
    This inserts a new custom graph dom object
     and renders the Highcharts options to it.
*/
function renderNewCustomGraph(options) {
    var id = insertNewGraphRow();
    options.chart.renderTo = id;
    var chart = new Highcharts.Chart(options);
}


/*
    This creates the actual HTML table and adds the data to it
*/
function createRawDataTable(series) {
    var id = insertNewGraphRow();
    var t_id = id + '-table';
    var newElement =
        '<div>'
            +'<h2>Raw Dailies for '+series[0].dog+'</h2>'
            +'<div class="raw-data-table-container table">'
                +'<table class="stats" style="margin-top:0" id="'+t_id+'">'
                    +'<thead>'
                        +'<th>Date</th>'
                        +'<th>Minutes Awake</th>'
                        +'<th>Minutes Active</th>'
                        +'<th>Minutes Resting</th>'
                    +'</thead>'
                    +'<tbody>'
                    +'</tbody>'
                +'</table>'
            +'</div>'
        +'</div>';
    $('#'+id).append(newElement);
    for (var i in series[0]["data"]) {
        $('#'+t_id+' tbody').append(
            "<tr>"
                +"<td>"+series[0]["data"][i].date+"</td>"
                +"<td>"+series[0]["data"][i].awake+"</td>"
                +"<td>"+series[0]["data"][i].active+"</td>"
                +"<td>"+series[0]["data"][i].rest+"</td>"
            +"</tr>"
        );
    }
    $('#'+t_id).DataTable();
}

/*
    This deletes e's parent from its parent
*/
function deleteGraph(e) {
    e.parentNode.parentNode.removeChild(e.parentNode);
}

/*
    The `onchange=` callback for #select-graph-dataset in the Custom Graphs UI
*/
function datasetOnChange() {
    var dataset = $("#select-graph-dataset").val();
    // chart types most graphs have
    var graphTypes = ["Line Graph", "Spline Graph", "Column Graph"];
    // chart types by black list
    if (dataset != "Raw Dailies") {
        graphTypes.push("Box Plot");
    }
    // chart types types by white list
    if (dataset == "Active %, Awake %, Rest %") {
        graphTypes.push("Pie Chart");
    } else if (dataset == "Raw Dailies") {
        graphTypes = ["Table"];
    }
    // set types
    setSelectOptions("#select-graph-type", graphTypes);
}

/*
    Handler for the "Create" button in the Custom Graphs UI
*/
function generateGraph() {
    // TODO: All(...)
    // TODO: other graph types
    var graphType = $("#select-graph-type").val();
    var dataSet = $("#select-graph-dataset").val();
    var filterType = $("#select-filter-type").val();
    var selectedDog = $("#select-dog").val();

    // make sure updateCustomGraphOptions has been called first
    if (selectedDog == "Loading") {
        alert("Data has not loaded yet! Please wait a moment.");
        return;
    }

    // compute common graph settings
    var data = filterType == "Unfiltered" ? unfiltered_blob : filtered_blob;
    var dog = getDogByName(data, selectedDog);
    // get all the datasets selected
    var chosenDatasets = dataSet.split(", ");

    // setup graph options by graph type
    // default to false for EG raw data table
    // options will contain an object for a highcharts graph otherwise
    var options = false; 
    // line graph and spline graph are the same minus the spline graph
    // having interpolation, this is one setting
    if (graphType == "Line Graph" || graphType == "Spline Graph") {
        // set common options for spline and line graphs
        options = {
            title: {
                text: selectedDog+' '+dataSet+' Recorded Minutes Over Time (' + filterType + ')'
            },
            subtitle: {
                text: document.ontouchstart === undefined ?
                    'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
            },
            xAxis: { 
                type: 'datetime',
                title: { text: 'Date' },
             },
            yAxis: { 
                title: { text: dataSet },
                min: 0
            },
            legend: { enabled: true, },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: { radius: 2 },
                    lineWidth: 1,
                    states: { hover: { lineWidth: 1 } },
                    threshold: null
                }
            }
        };
        // create and set series
        var series = [];
        for (var i = 0; i < chosenDatasets.length; i++) {
            series.push({
                name: chosenDatasets[i],
                data: [],
            });
            if (graphType == "Line Graph") {
                series[i]["type"] = "area";
            }
        }
        var id = dog.id;
        for (var i = 0; i < Object.keys(data.days).length; i++) {
            var day = data.days[i];
            for (var m = 0; m < Object.keys(day.dogs).length; m++) {
                var day_dog = day.dogs[m];
                // skip dogs that don't match
                if (day_dog.id != id) {
                    continue;
                }
                // otherwise add the data point to the series
                var dateSplit = day.date.split("-");
                var date = Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]);
                for (var k = 0; k < chosenDatasets.length; k++) {
                    var dataset = chosenDatasets[k];
                    if (dataset == "Total") {
                        series[k]["data"].push([date, day_dog.total]);
                    } else if (dataset == "Rest %") {
                        series[k]["data"].push([date, day_dog.rest / day_dog.total * 100]);
                    } else if (dataset == "Active %") {
                        series[k]["data"].push([date, day_dog.active / day_dog.total * 100]);
                    } else if (dataset == "Awake %") {
                        series[k]["data"].push([date, day_dog.awake / day_dog.total * 100]);
                    }
                }
            }
        }
        options["series"] = series;
        // set chart options
        if (graphType == "Spline Graph") {
            options["chart"] = { type: 'spline' };
        } else {
            options["chart"] = { zoomType: 'x'};
        }

    // pie chart
    } else if (graphType == "Pie Chart") {
        options = {
            chart: { type: "pie"},
            title: {
                text: 'Time Spent As a Percentage of Total Time For ' + selectedDog
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
                name: 'Percentage',
                colorByPoint: true,
                data: [{
                    name: 'Time Spent at Rest',
                    y: dog.rest / dog.total,
                },{
                    name: 'Time Spent Active',
                    y: dog.active / dog.total,
                }, {
                    name: 'Time Spent Awake',
                    y: dog.awake / dog.total,
                }]
            }]
        };
    
    // box plot
    } else if (graphType == "Box Plot"){
        var id = dog.id;
        var series = [];
        var boxData = [];
        for (var i = 0; i < chosenDatasets.length; i++) {
            boxData.push({
                name: chosenDatasets[i],
                data: [],
            });
        }
        // get the data
        for (var i = 0; i < Object.keys(data.days).length; i++) {
            var day = data.days[i];
            for (var m = 0; m < Object.keys(day.dogs).length; m++) {
                var day_dog = day.dogs[m];
                // skip dogs that don't match
                if (day_dog.id != id) {
                    continue;
                }
                var percent_ratio = 100.0 / day_dog.total;
                // otherwise add the data point to the series
                for (var k = 0; k < chosenDatasets.length; k++) {
                    var val;
                    var dataset = chosenDatasets[k];
                    if (dataset == "Total") {
                        val = day_dog.total;
                    } else if (dataset == "Rest %") {
                        val = day_dog.rest * percent_ratio;
                    } else if (dataset == "Active %") {
                        val = day_dog.active * percent_ratio;
                    } else if (dataset == "Awake %") {
                        val = day_dog.awake * percent_ratio;
                    }
                    boxData[k]["data"].push(val);
                }
            }
        }
        function sortNumber(a,b) {
            return a - b;
        }
        for (var m = 0; m < chosenDatasets.length; m++) {
            var plotPoints = [];
            boxData[m]["data"] = boxData[m]["data"].sort(sortNumber);
            plotPoints.push(boxData[m]["data"][0]);
            plotPoints.push(boxData[m]["data"][Math.floor(boxData[m]["data"].length/4)]);
            plotPoints.push(boxData[m]["data"][Math.floor(boxData[m]["data"].length/2)]);
            plotPoints.push(boxData[m]["data"][Math.floor(boxData[m]["data"].length - boxData[m]["data"].length/4)]);
            plotPoints.push(boxData[m]["data"][Math.floor(boxData[m]["data"].length -1)]);
            series.push(plotPoints);
        }
        // setup options
        options = {
                chart: { type: 'boxplot' },
                title: {
                    text: selectedDog+' '+dataSet+' (' + filterType + ')'
                },
                legend: { enabled: false },
                xAxis: {
                    endOnTick: true,
                    max: chosenDatasets.length - 1,
                    categories: chosenDatasets,
                    title: {
                        text: "Type of activity"
                    }
                },
                yAxis: { title: { text: dataSet } },
                series: [{
                    name: dataSet,
                    data: series,
                    tooltip: {
                        headerFormat: '<span style="color:{point.color}">•</span>  <b>{point.key}</b><br/>',
                        pointFormat: 'Maximum: {point.high:.3f}<br>'
                            +'Upper quartile: {point.q3:.3f}<br>'
                            +'Median: {point.median:.3f}<br>'
                            +'Lower quartile {point.q1:.3f}<br>'
                            +'Minimum: {point.low:.3f}',
                    }
                }]
        }
    
    } else if (graphType == "Column Graph") {
        var series = [];
        var label = [];
        for(var n = 0; n < chosenDatasets.length; n++) {
            label.push(chosenDatasets[n].split(" ")[0])
        }
        for (var k = 0; k < chosenDatasets.length; k++) {
            var dataset = chosenDatasets[k];
            if (dataset == "Total") {
                series.push(dog.total);
            } else if (dataset == "Rest %") {
                series.push(dog.rest);
            } else if (dataset == "Active %") {
                series.push(dog.active);
            } else if (dataset == "Awake %") {
                series.push(dog.awake);
            }
        }
        options = {
            chart: { type: 'column' },
            title: {
                text: selectedDog+' '+label+' (' + filterType + ')'
            },
            subtitle: { text: 'Dog activity tracked in minutes' },
            xAxis: {
                categories: label,
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
                name: selectedDog,
                data: series
            }]
        };
    
    // NOTE: table behaves specially and inserts the graph itself,
    // not in the shared call to renderNewCustomGraph at the end
    } else if (graphType == "Table") {
        var series = [];
        for (var i = 0; i < chosenDatasets.length; i++) {
            series.push({
                dog: selectedDog,
                name: chosenDatasets[i],
                data: [],
            });
        }
        var id = dog.id;
        for (var i = 0; i < Object.keys(data.days).length; i++) {
            var day = data.days[i];
            for (var m = 0; m < Object.keys(day.dogs).length; m++) {
                var day_dog = day.dogs[m];
                // skip dogs that don't match
                if (day_dog.id != id) {
                    continue;
                }
                // otherwise add the data point to the series
                var dateSplit = day.date.split("-");
                var date = Date.UTC(dateSplit[0], dateSplit[1], dateSplit[2]);
                for (var k = 0; k < chosenDatasets.length; k++) {
                    series[k]["data"].push({
                        date: day.date,
                        awake: day_dog.awake,
                        rest: day_dog.rest,
                        active: day_dog.active
                    });
                }
            }
        }
        // create the table
        createRawDataTable(series);
    }

    // render highcharts graphs
    if (options) {
        renderNewCustomGraph(options);
    }
}
//============= /javascript for custom graphs ==================================


//============= javascript for dashboard graphs ================================
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
        yAxis: { title: { text: 'Rest Time / Total Time (per dog)' } },
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
            regression: true ,
            regressionSettings: {
                type: 'linear',
                color:  'rgba(40, 100, 255, .9)'
            },
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
        yAxis: { title: { text: 'Active Time / Total Time (per dog)' } },
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
            regression: true ,
            regressionSettings: {
                type: 'linear',
                color:  'rgba(40, 100, 255, .9)'
            },
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
        yAxis: { title: { text: 'Active Time / Total Time (per dog)' } },
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
            regression: true ,
            regressionSettings: {
                type: 'linear',
                color:  'rgba(40, 100, 255, .9)'
            },
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
        yAxis: { title: { text: 'Rest Percentage of Total Time' } },
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

// chart for average rest, awake, and active percentages per region
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
        series: [{ name: 'Rest Average' },
                 { name: 'Active Average' },
                 { name: 'Awake Average' }],
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

function createChartNine() {
    var processed_json_rest = new Array();
    var processed_json_active = new Array();
    var processed_json_awake = new Array();
    // sort dogs by name
    var status_data = dogsByField(filtered_dogs, "dog_status");
    var statuses = Object.keys(status_data);
    var pie_data = [];
    statuses.sort(function (a, b) {
        return a.localeCompare(b);
    });
    filtered_dogs.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    // chart options
    var options = {
        chart: {
            renderTo: 'chart9',
            type: 'column',
            zoomType: 'x'
        },
        title: {
            text: 'Rest, Active, and Awake Percentages Averages per Dog Status'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'category',
            title: {
                text: "Status"
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
            '<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
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
        series: [{ name: 'Rest Average Percent' },
                 { name: 'Active Average Percent' },
                 { name: 'Awake Average Percent' }],
    };
    // convert the filtered_data to the appropriate arrays
    for (i = 0; i < statuses.length; i++) {
        var selected = status_data[statuses[i]];
        var rest_average = getAverage(selected,"rest");
        var active_average = getAverage(selected,"active");
        var awake_average = getAverage(selected,"awake");
        var total_average = getAverage(selected,"total");
        processed_json_rest.push([statuses[i], 100 * rest_average/total_average]);
        processed_json_active.push([statuses[i], 100 * active_average/total_average]);
        processed_json_awake.push([statuses[i], 100 * awake_average/total_average]);
        var json1 = {
            "name": statuses[i],
            "y": selected.length
        }
        pie_data.push(json1);
    }
    // create the chart
    options.series[0].data = processed_json_rest;
    options.series[1].data = processed_json_active;
    options.series[2].data = processed_json_awake;
    var chart = new Highcharts.Chart(options);
    // create the pie chart
    createChartTen(pie_data);
};

// called from createChartNine with shared data computation for efficiency
function createChartTen(data){
    var options = {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            renderTo: 'chart10'
        },
        title: {
            text: 'Number of Dogs Tracked in Above Graph For Each Dog Status'
        },
        series: [{
           type: 'pie',
            name: '# of Total Dogs Tracked',
            showInLegend: false,
            dataLabels: {
                enabled: true
            }
        }]
    };
    options.series[0].data = data;
    var chart = new Highcharts.Chart(options);
}

// creates arrays for each individual field of the json data
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

// iterates through an array and returns the average for the specified field
function getAverage(array, field){
    var sum = 0;
    for (var i = 0; i < array.length; i++){
        sum = sum + array[i][field];
    }
    var average = sum/array.length;
    return average;
}
//============= /javascript for dashboard graphs ===============================

//============= javascript for cards at top of dashboard =======================
// showcases the dogs that have the most accumulated minutes in each of the sections
function updateCards() {
    // names and values for the card minima/maxima
    var most_active_name = "";
    var most_active_value = Number.MIN_VALUE;
    var least_active_name = "";
    var least_active_value = Number.MAX_VALUE;
    var most_rest_name = "";
    var most_rest_value = Number.MIN_VALUE;
    var most_awake_name = "";
    var most_awake_value = Number.MIN_VALUE;
    // loop and compute all the minima/maxima for the cards
    for (var i = 0; i < filtered_dogs.length; i++) {
        var dog = filtered_dogs[i];
        if (dog.active > most_active_value) {
            most_active_value = dog.active;
            most_active_name = dog.name;
        }
        if (dog.active < least_active_value) {
            least_active_value = dog.active;
            least_active_name = dog.name;
        }
        if (dog.rest > most_rest_value) {
            most_rest_value = dog.rest;
            most_rest_name = dog.name;
        }
        if (dog.awake > most_awake_value) {
            most_awake_value = dog.rest;
            most_awake_name = dog.name;
        }
    }
    $("#most_active_card").html(most_active_name);
    $("#most_active_card_title").html("Most Active Dog");
    $("#least_active_card").html(least_active_name);
    $("#least_active_card_title").html("Least Active Dog");
    $("#most_rest_card").html(most_rest_name);
    $("#most_rest_card_title").html("Most Rested Dog");
    $("#most_awake_card").html(most_awake_name);
    $("#most_awake_card_title").html("Most Awake Dog");
};
//============= /javascript for cards at top of dashboard ======================
