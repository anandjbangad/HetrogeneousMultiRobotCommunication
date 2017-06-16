// I create a WebSocket . Put the IP of your Raspberry Pi!
var socket = io.connect('http://0.0.0.0:8000/');
//        var socket = io.connect('http://10.0.10.239:8000/'); //not working

document.getElementById("downloadAll").addEventListener("click", function () {
    chart1.exportChartLocal();
    chart2.exportChartLocal();
    chart3.exportChartLocal();
    chart4.exportChartLocal();
    chart5.exportChartLocal();
    chart6.exportChartLocal();
}, false);


// I create a new object 'Chart1'
var chart1 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    exporting: {
        filename: "chart_edge_cpu_temperature",
        sourceHeight: 500,
        scale: 1,//(default = 2)
        sourceWidth: 1000,
        type: "image/png"
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
    exporting: {
        filename: "chart_edge_cpu_mem_utilization",
        sourceHeight: 500,
        scale: 1,//(default = 2)
        sourceWidth: 1000,
        type: "image/png"
    },
    chart: {
        renderTo: 'chart2',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('cpuMem', function (time, data) {
                    chart2.series[0].addPoint([time, data.cpu]);
                    chart2.series[1].addPoint([time, data.freeMem]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'CPU & Memory Utilization'
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
            text: 'Utilization Ratio',
            margin: 40
        }
    },
    series: [{
        name: 'CPU Utilization',
        data: []
    },
    {
        name: 'Free Memory',
        data: []
    }]
});
var chart3 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    exporting: {
        filename: "chart_edge_free_memory",
        sourceHeight: 500,
        scale: 1,//(default = 2)
        sourceWidth: 1000,
        type: "image/png"
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
            margin: 40
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
    exporting: {
        filename: "chart_edge_active_ctx_count",
        sourceHeight: 500,
        scale: 1,//(default = 2)
        sourceWidth: 1000,
        type: "image/png"
    },
    chart: {
        renderTo: 'chart4',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('activeCtx', function (time, result) {
                    //chart4.series[0].addPoint([time, result['messages']]);
                    //chart4.series[1].addPoint([time, result['messages_ready']]);
                    chart4.series[0].addPoint([time, result.edge]);
                    chart4.series[1].addPoint([time, result.cloud]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'Number of Active Context'
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
            text: 'Active Context Count',
            margin: 40
        }
    },
    series: [{
        name: 'Edge Node',
        data: []
    }, {
        name: 'Cloud Node',
        data: []
    }]
});
var chart5 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    exporting: {
        filename: "chart_edge_cloud_latency",
        sourceHeight: 500,
        scale: 1,//(default = 2)
        sourceWidth: 1000,
        type: "image/png"
    },
    chart: {
        renderTo: 'chart5',
        defaultSeriesType: 'spline',
        events: {
            load: function () {
                // Each time you receive a value from the socket, I put it on the graph
                socket.on('cld_latency', function (time, result) {
                    chart5.series[0].addPoint([time, result.avg10sec]);
                    chart5.series[1].addPoint([time, result.avg]);
                });
            }
        }
    },
    rangeSelector: {
        selected: 100
    },
    title: {
        text: 'Cloud Node Task Response Latency'
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
            margin: 40
        }
    },
    series: [{
        name: 'Latency MM=10sec',
        data: []
    },
    {
        name: 'Latency Average',
        data: []
    }]
});
var chart6 = new Highcharts.Chart({
    credits: {
        enabled: false
    },
    exporting: {
        filename: "chart_edge_offload_jobs_ratio",
        sourceHeight: 500,
        scale: 1,//(default = 2)
        sourceWidth: 1000,
        type: "image/png"
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
        text: 'Jobs Offload Ratio'
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
            text: 'Offload Ratio',
            margin: 40
        }
    },
    series: [{
        name: 'Neighbors/Local',
        data: []
    }, {
        name: 'Cloud/Local',
        data: []
    }]
});