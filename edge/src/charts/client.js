// I create a WebSocket . Put the IP of your Raspberry Pi!
var socket = io.connect('http://0.0.0.0:8000/');
//        var socket = io.connect('http://10.0.10.239:8000/'); //not working
// I create a new object 'Chart1'
var chart1 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    chart: {
        renderTo: 'chart1',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('temperatureUpdate', function (time, data) {
                    var series = chart1.series[0];
                    series.addPoint([time, data]);
                });
            }
        }
    },
    plotOptions: {
        spline: {
            pointStart: Date.UTC(2017, 5, 14)
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'CPU Temperature'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'Temperature ºC',
            margin: 40
        }
    },
    series: [{
        name: 'Temperature',
        data: []
    }]
});
var chart2 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    chart: {
        renderTo: 'chart2',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('cpu', function (time, cpuUtil) {
                    var series = chart2.series[0];
                    series.addPoint([time, cpuUtil]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'CPU Utilization'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'CPU %',
            margin: 80
        }
    },
    series: [{
        name: 'CPU util',
        data: []
    }]
});
var chart3 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    chart: {
        renderTo: 'chart3',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('freemem', function (time, freeMem) {
                    var series = chart3.series[0];
                    series.addPoint([time, freeMem]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'Free Memory'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'freemem',
            margin: 80
        }
    },
    series: [{
        name: 'freemem',
        data: []
    }]
});
var chart4 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    chart: {
        renderTo: 'chart4',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('messages', function (time, result) {
                    var series = chart4.series[0];
                    //chart4.series[0].addPoint([time, result['messages']]);
                    //chart4.series[1].addPoint([time, result['messages_ready']]);
                    chart4.series[0].addPoint([time, result]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'Message Broker - Queued Msgs'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'Queued msg Count',
            margin: 80
        }
    },
    series: [{
        name: 'c_task1_req',
        data: []
    }, {
        name: 'd_task1_req',
        data: []
    }]
});
var chart5 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    chart: {
        renderTo: 'chart5',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('cld_latency', function (time, result) {
                    var series = chart5.series[0];
                    chart5.series[0].addPoint([time, result]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'Cloud Latency (MM=10sec)'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'Latency in ms',
            margin: 80
        }
    },
    series: [{
        name: 'cld_latency_ms',
        data: []
    }]
});
var chart6 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    chart: {
        renderTo: 'chart6',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('processed_msgs', function (time, result) {
                    if (result[0] != 0) {
                        chart6.series[0].addPoint([time, (result[1] * 1.0 / result[0]) || 0]);
                        chart6.series[1].addPoint([time, (result[2] * 1.0 / result[0]) || 0]);
                    }
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'Msgs Offload Ratio'
    },
    xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        maxZoom: 20 * 1000
    },
    yAxis: {
        minPadding: 0.2,
        maxPadding: 0.2,
        title: {
            text: 'Ratio',
            margin: 80
        }
    },
    series: [{
        name: 'neigh/local',
        data: []
    }, {
        name: 'cld/local',
        data: []
    }]
});