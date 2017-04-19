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
            spacingRight: 0
        },
        title: { style: { fontSize: '18px' } },
        xAxis: { title: { style: { fontSize: '16px' } } },
        yAxis: { title: { style: { fontSize: '16px' } } }
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
            // store the data
            filtered_blob = data;
            // normalize data
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
            // store the data
            unfiltered_dogs = data;
            // precompute maximum total for scaling
            unfiltered_dogs_max_total = getMaxTotal(unfiltered_dogs);
            // normalize data
            normalizeDogData(unfiltered_dogs);
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
*/
function setSelectOptions(selectSelector, newOptions) {
    var el = $(selectSelector);
    el.empty();
    $.each(newOptions, function(key, value) {
        el.append($("<option></option>").attr("value", value).text(value));
    });
}

/*
    this pushes value to object[key] or creates an array then pushes
*/
function default_push(object, key, value) {
    (object[key] = object[key] || []).push(value);
}

/*
    Dog type selection options to array of dog names.
    This is computed in updateCustomGraphOptions.
    It is used for the dog selection UI.
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
    graphTypeOnChange();
    dogTypeOnChange();
}

/*
    Utility Method to creat combination strings of strings in array
*/
// http://stackoverflow.com/a/5752056
function combine_and_join(a) {
    var fn = function(n, src, got, all) {
        if (n == 0) {
            if (got.length > 0) {
                all[all.length] = got;
            }
            return;
        }
        for (var j = 0; j < src.length; j++) {
            fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        }
        return;
    }
    var all = [];
    for (var i = 1; i < a.length; i++) {
        fn(i, a, [], all);
    }
    all.push(a);
    for (var i = 0; i < all.length; i++) {
        if (typeof a[i] != "string") {
            all[i] = all[i].join(", ");
        }
    }
    return all;
}

/*
    The `onchange=` callback for #select-graph-type in the Custom Graphs UI
*/
// lazy-loaded-precomputed set of common data set options
var active_awake_rest_total_data_sets = false;
function graphTypeOnChange() {
    if (!active_awake_rest_total_data_sets) {
        active_awake_rest_total_data_sets = ["Awake %", "Rest %", "Active %"];
        active_awake_rest_total_data_sets = combine_and_join(active_awake_rest_total_data_sets);
        active_awake_rest_total_data_sets.push("Total");
    }
    // get graph type and set the possible data sets
    var graphType = $("#select-graph-type").val();
    var datasets = active_awake_rest_total_data_sets;
    if (graphType == "Box Plot") {
        // we want to add another option without modifying the original
        datasets = ([]).concat(datasets)
        datasets.push("Intensity (Minutes)");
    } if (graphType == "Pie Chart") {
        datasets = ["Awake, Active, Rest"];
    }

    setSelectOptions("#select-graph-dataset", datasets);
}

/*
    The `onchange=` callback for #select-dog-type in the Custom Graphs UI
*/
function dogTypeOnChange() {
    // get dog selection type and then set the possible dogs
    var dogType = $("#select-dog-type").val();
    setSelectOptions("#select-dog", dog_type_to_dogs[dogType]);
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
    var newElement = '<div class="row"><button class="delete-button" onclick="deleteGraph(this)" align="right">Remove Graph</button><div id="'+id+'" style="width: 100%; height: 40em; margin: 0 auto;"></div></div>';
    graphs.insertAdjacentHTML('afterbegin', newElement);
    return id;
}

/*
    This inserts a new custom graph dom object and renders
     the Highcharts options to it.
*/
function renderNewCustomGraph(options, compare) {
    var id = insertNewGraphRow();
    options.chart.renderTo = id;
    var chart = new Highcharts.Chart(options);
    if (compare == "compare") {
        insertNewStatsTable2();
    } else if (compare == "normal"){
        insertNewStatsTable();
    }
}

/*
    This deletes e's parent from its parent
*/
function deleteGraph(e) {
    e.parentNode.parentNode.removeChild(e.parentNode);
}

/*
    Handler for the "Create" button in the Custom Graphs UI
*/
function generateGraph() {
    var graphType = $("#select-graph-type").val();
    var dataSet = $("#select-graph-dataset").val();
    var filterType = $("#select-filter-type").val();
    var selectedDog = $("#select-dog").val();

    // make sure updateCustomGraphOptions has been called first
    if (selectedDog == "Loading") {
        alert("Data has not loaded yet! Please wait a moment.");
        return;
    }

    // compute graph settings
    var data = filterType == "Unfiltered" ? unfiltered_blob : filtered_blob;
    var dog = getDogByName(data, selectedDog);
    // get all the datasets selected
    var chosenDatasets = dataSet.split(", ");

    // setup graph options
    var options = {};
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
            xAxis: { type: 'datetime'},
            yAxis: { title: { text: dataSet } },
            legend: { enabled: false },
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
    }

    // render
    renderNewCustomGraph(options);
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
                if(filterSelected == "By Region" && JSONstring1[i].regional_center == arr2[m]) {
                    var ratio = getBarInfo(JSONstring1[i], type);
                    arrTemp[j] = ratio;
                    j++;
                } else if(filterSelected == "By Status" && JSONstring1[i].dog_status == arr2[m]) {
                    var ratio = getBarInfo(JSONstring1[i], type);
                    arrTemp[j] = ratio;
                    j++;
                } else if(filterSelected == "By Sex" && JSONstring1[i].sex == arr2[m]) {
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
    // console.log(arrData);
    // console.log(arr1);
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

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
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
