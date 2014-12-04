/**
 * @file explore.js
 * vis code in support of explore.html
 * @version 1.0 (hrbrmstr) 2014-06-05
 */

var topo, projection, path, svg, g, country, countries, quantize ;

var ccData = d3.map() ;

var width = 500, height = 360;

var offsetLeft = document.getElementById("vcdbmap").offsetLeft + 40 ;
var offsetTop = document.getElementById("vcdbmap").offsetTop + 30 ;

var ccNest, indNest, indChart, inCol, country_data, countryOpts;
var countrySel = d3.select("#countrySel").append("select").attr("class", "form-control").attr("name", "countrySel")

var heatdat ;
var tooltip = d3.select("#vcdbmap").append("div").attr("class", "tooltip hidden");
var heattip ;
var hoffsetLeft = document.getElementById("pheat").offsetLeft + 40 ;
var hoffsetTop = document.getElementById("pheat").offsetTop + 30 ;
var uri_pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;


var commas = d3.format(",")

d3.select(window).on('resize', resize);

mapsetup(width, height)

// these asynchronously load our data sets, then call the vis code.

queue()
    .defer(d3.json, "js/world-topo-min.json")
    .defer(d3.csv, "data/victims.csv?1")
    .await(makegeo);

queue()
    .defer(d3.json, "data/vcdb19.json?1")
    .defer(d3.json, "data/vcdb19-breach.json?1")
    .await(makeheat);

queue()
    .defer(d3.json, "data/a4.json?1")
    .await(makesummary);

queue()
    .defer(d3.csv, "data/indtime.csv?1")
    .await(maketimeline);

/**
 * Called when window is resized.
 * Main purpose is to ensure proper placment of tooltips.
 */

function resize() {

  offsetLeft = document.getElementById("vcdbmap").offsetLeft + 40 ;
  offsetTop = document.getElementById("vcdbmap").offsetTop + 30 ;

  hoffsetLeft = document.getElementById("pheat").offsetLeft + 20 ;
  hoffsetTop = document.getElementById("pheat").offsetTop + 15;

}

/**
 * Called to setup the base map area & projection
 * @tparam integer width The width of the area for the map.
 * @tparam integer height The height of the area for the map.
 */

function mapsetup(width, height) {

  projection = d3.geo.winkel3()
            	    .scale(110) // need to find a better way than manual set
            	    .translate([(width / 2)-30, height / 2]) // intercourse antarctica
            	    .precision(.1);

  path = d3.geo.path().projection(projection)

  svg = d3.select("#vcdbmap").append("svg")
          .attr("width", width)
          .attr("height", height-70)
          .append("g")

  g = svg.append("g")

}

/**
 * Called as part of an array filter to filter by a specific country
 * Used in the geo visualization
 * @tparam String country country to filter on.
 */

function hasCountry(country) {
  return function(node) {
    return(node.CountryName == country.toUpperCase())
  }
}

/**
 * Called as part of an array "find" to find by a specific country
 * Used in the geo visualization
 * @tparam String country country to find.
 */

function findCountry(country) {
  return function(node) {
    return(node.properties.name.toUpperCase() == country)
  }
}

/**
 * Called as part of an array filter to filter by a specific industry
 * Used in the heatmap visualization
 * @tparam String country country to filter on.
 */

function byIndustry(industry) {
  return(function(node) {
    return(node.ind == industry)
  })
}

/**
 * Safari needs this
 */

if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(predicate) {
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        if (i in list) {
          value = list[i];
          if (predicate.call(thisArg, value, i, list)) {
            return value;
          }
        }
      }
      return undefined;
    }
  });
}

/**
 * Determines whether to use white or black color
 * Based on the input color return black/white depending on how "dark" it is
 * @tparam String hexColor hex (w/ or w/o "#") of the background color
 * REF: https://www.eembc.org/techlit/datasheets/yiq_consumer.pdf
 */

function blackOrWhite(hexColor) {
  
  hexColor = hexColor.replace("#","");

	var R = parseInt(hexColor.substr(0,2),16);
	var G = parseInt(hexColor.substr(2,2),16);
	var B = parseInt(hexColor.substr(4,2),16);

	var YIQ = ((R*299) + (G*587) + (B*114)) / 1000;

	return (YIQ >= 128) ? 'black' : 'white' ;
  
}

/**
 * globals to help out the button callbacks
 */

var gridSize, colorScale, hsvg;
var all, discl;
var heatLabels, heatRects;

/**
 * Called to make the heatmap vis
 * Used in the data queuing call
 * @tparam Object error (if any) from the data load.
 * @tparam Object pheat1 the heatmap object read by d3.json
 */

function makeheat(error, pheat1, breaches) {

  // might need this for filtering in the next rev
  
  all = pheat1 ;
  discl = breaches ;
  
  heatdat = all ;
  
  heattip = d3.select("body").append("div").attr("class", "heattip hidden");

  // setup vis height/width/etc

  var margin = { top: 100, right: 0, bottom: 0, left: 150 },
      width = 900 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
  
  gridSize = Math.floor(width / pheat1.cols.length);

  // basic heatmap stuff. setup svg, setup scale, make rectangles, handle popups

  hsvg = d3.select("#pheat").append("svg")
               .attr("width", width + margin.left + margin.right)
               .attr("height", height + margin.top + margin.bottom)
               .append("g")
               .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // went with the colorbrewer YlOrBr scale

  colorScale = d3.scale.quantile()
                     .domain(pheat1.zrange)
                     .range(colorbrewer.YlOrBr[9]);

   heatRects = hsvg.selectAll(".heatcell")
                   .data(pheat1.data)
                   .enter().append("rect")
                   .attr("x", function(d) { return (d.x - 1) * gridSize; })
                   .attr("y", function(d) { return (d.y - 1) * gridSize; })
                   .attr("class", "heatcell")
                   .attr("width", gridSize)
                   .attr("height", gridSize)
                   .style("stroke", "#7f7f7f")
                   .style("stroke-width", "0.25")
                   .style("fill", function(d) {
                                    if (+d.cnt == 0 ) { return("white"); }
                                    else { return(colorScale(+d.z)) ; }
                                  });


    heatRects.on("mouseover", function(d, i) {

      idat = heatdat.data.filter(byIndustry(d.ind));

      var mouse = d3.mouse(svg.node()).map(function(d) { return parseInt(d) });

      d3.select(this).transition().duration(150)
                      .style({'stroke':'black','stroke-width':'1.0'});

      heattip.classed("hidden", false)
             .attr("style", "left:"+(mouse[0]+hoffsetLeft)+"px;top:"+(mouse[1]+hoffsetTop)+"px")
             .html("<center><b>"+d.ind+"</b><br/><table><tr><td>Total incidents:</td><td>"+
                   d.tot+"</td></tr><tr><td align='right'>"+d.pat+
                   " incidents:</td><td align='right'>"+d.cnt+"</td></tr></table>");
    })

    heatRects.on("mouseout", function() {

      heattip.classed("hidden", true);

      d3.select(this).transition().duration(150)
                      .style({'stroke':'#7f7f7f','stroke-width':'0.25'});

    })

    heatLabels = hsvg.selectAll(".heatlabels")
                        .data(pheat1.data)
                        .enter().append("text")
                        .attr("class", "heatlabels")
                        .style("text-anchor", "middle")
                        .attr("pointer-events", "none")
                        .text(function(d) { if (+d.cnt == 0 ) { return(""); } else { return(d.lab) ; } })
                        .attr("x", function(d) { return ((d.x - 1) * gridSize) + gridSize/2; })
                        .attr("y", function(d) { return ((d.y - 1) * gridSize) + gridSize/2 + 3; })
                        .text(function(d) { if (+d.cnt == 0 ) { return(""); } else { return(d.lab) ; } })
                        .attr("fill", function(d) {
                                         if (+d.cnt == 0 ) { return("black"); }
                                         else { return(blackOrWhite(colorScale(+d.z))); }
                                       });


    var patLabels = hsvg.selectAll(".patLabel")
                       .data(pheat1.rows)
                       .enter().append("g").append("text")
                       .text(function (d) { return d; })
                       .attr("x", 0)
                       .attr("y", function (d, i) { return i * gridSize; })
                       .style("text-anchor", "end")
                       .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
                       .attr("class", "patLabel");

    // worth mentioning: put the top X labels in a <g>, move & rotate the <g> THEN put text in.
    // this saves a whole world of hurt trying to rotate the text properly

    var indLabels = hsvg.selectAll(".indLabel")
                       .data(pheat1.cols)
                       .enter().append("g")
                       .attr("x", function (d, i) { return i * gridSize; })
                       .attr("y", 0)
                       .attr("transform", function(d, i) {
                                            var offset = (i*gridSize) + (gridSize / 2);
                                              return("translate(" + offset + ",-6)rotate(45)");
                                          })
                       .append("text")
                       .text(function (d, i) { return d; })
                       .style("text-anchor", "end")
                       .attr("class", "indLabel");

}

var dbg_incidents;
var dt ;
/**
 * Called to make the map vis
 * Used in the data queuing call
 * @tparam Object error (if any) from the data load.
 * @tparam Object world world map topojson
 * @tparam Object incident data from CSV
 */

function makegeo(error, world, incidents) {

  // summarize the incidents by country

  dbg_incidents = incidents ;

  ccNest = d3.nest().key(function(d) { return(d.CountryName); })
             .rollup(function(d) {
                       return(d3.sum(d, function(g) {
                                          return(+g.IncidentCount);
                                        }))
                     })
             .entries(incidents)

  // make a further summarized view

  ccNest.forEach(function(x) { ccData.set(x.key, +x.values); })

  // do the same nest summary for incidents by industry

  indNest = d3.nest().key(function(d) { return(d.IndustryName); })
              .rollup(function(d) {
                        return(d3.sum(d, function(g) {
                                           return(+g.IncidentCount);
                                         }))
                      })
              .sortValues(d3.descending)
              .entries(incidents);

  for (var i=0; i<indNest.length; i++) { indNest[i].series = 0 ; } 

  dt = indNest ;

  // it's as cood a color as any

  inCol = "#993404";

  // this is the format nvd3 charts need

  indNest = [ { "key" : "All Countries",
                "color": "#993404",
                "values" : indNest.sort(function(a,b) {
                                          return(a.values - b.values)
                                        }) } ]

  // setup our color scale

  quantize = d3.scale.log()
               .domain([1, d3.max(ccData.values())])
               .range(["#fed98e", "#d95f0e", "#993404"]);

  // helps troublshooting vis issues
  countries = topojson.feature(world, world.objects.countries).features;

  topo = countries ;

  country_data = d3.nest()
                        .key(function(d) {
                            e = topo.find(findCountry(d.key));
                          if (e !== undefined) { return(e.properties.name); }
                        })
                        .sortKeys(d3.ascending)
                        .rollup(function(d) { return d[0].values; })
                        .entries(ccNest);

  country_data.unshift({ key:"Global", values: d3.sum(ccData.values()) })

  countryOpts = countrySel.selectAll("option")
                          .data(country_data)
                          .enter()
                          .append("option")
                          .attr("value", function(d) { return d.key; })
                          .text(function(d) { return d.key + " [" + commas(d.values) + "]"; });

  // country popup menu selector code

  countrySel.on("change", function() {

    var selectedIndex = countrySel.property('selectedIndex');

    // handle the "Global" special case

    if (country_data[selectedIndex].key == "Global") {

        indNest = d3.nest().key(function(d) { return(d.IndustryName); })
                    .rollup(function(d) { return(d3.sum(d, function(g) {
                                return(+g.IncidentCount); })) })
                    .sortValues(d3.descending)
                    .entries(incidents);

    } else {

      indNest = d3.nest().key(function(d) { return(d.IndustryName); })
                .rollup(function(d) { return(d3.sum(d, function(g) {
                              return(+g.IncidentCount); })) })
                .sortValues(d3.descending)
                .entries(incidents.filter(hasCountry(country_data[selectedIndex].key)));

    }

    // nvd3 bar color changes to the color of the country on the choropleth

    inCol = quantize(d3.sum(indNest, function(g) { return g.values })) ;

    // set the name of the country in the title above the bar chart

    $("#countrySpan").html(country_data[selectedIndex].key + " ")

    // re-slice the data

    indNest = [ { "key" : country_data[selectedIndex].key,
                  "color": inCol,
                  "values" : indNest.sort(function(a,b) {
                                            return(a.values - b.values) }) } ];

    // since we chance the country outline in multiple places, make sure it's set to default

  	d3.selectAll(".country").style({'stroke':'#333','stroke-width':'0.25'});

    // extract the country name and highlight the outline

    if (country_data[selectedIndex].key != "Global") {
    		d3.select("."+country_data[selectedIndex].key.replace(/[\ \-\,'']/g, '')).transition().duration(150)
    		        .style({'stroke':'#111','stroke-width':'1.0'});
    }

    redraw() // update the nvd3 vis

  });

  country = g.selectAll(".country").data(topo);

  country.enter().insert("path")
          .attr("class", function(d, i) { return("country " + d.properties.name.replace(/[\ \-\,'']/g, '')); })
          .attr("d", path)
          .attr("id", function(d, i) { return(d.id); })
          .attr("title", function(d, i) { return(d.properties.name); })
          .style("fill", function(d, i) {
            if (ccData.get(d.properties.name.toUpperCase()) > 0) {
              return(quantize(ccData.get(d.properties.name.toUpperCase())));
            } else {
              return("white")
            }
          })

  country.on("mouseover", function(d, i) {

			d3.selectAll(".country").style({'stroke':'#333','stroke-width':'0.25'});

      // which country is it again?

			d3.select(this.parentNode.appendChild(this)).transition().duration(150)
			        .style({'stroke':'#111','stroke-width':'1.0'});

      // where's the mouse

      var mouse = d3.mouse(svg.node()).map(function(d) { return parseInt(d) });

      // get the current country

      var val = ccData.get(d.properties.name.toUpperCase())
      if (typeof(val) === 'undefined') { val = 0 };

      // show the tooltip

      tooltip.classed("hidden", false)
             .attr("style", "left:"+(mouse[0]+offsetLeft)+"px;top:"+(mouse[1]+offsetTop)+"px")
             .html(d.properties.name + " [" + commas(val) + "]");
  	});

    // hide the tooltip

		country.on("mouseout", function(d, i) {
			d3.select(this.parentNode.appendChild(this)).transition().duration(150)
			        .style({'stroke':'#333','stroke-width':'0.25'});
      tooltip.classed("hidden", true);
  	});

    // update the nvd3 graph on click

		country.on("click", function(d, i) {

      indNest = d3.nest().key(function(d) { return(d.IndustryName); })
                  .rollup(function(d) {
                            return(d3.sum(d, function(g) {
                                               return(+g.IncidentCount);
                                             }))
                          })
                  .sortValues(d3.descending)
                  .entries(incidents.filter(hasCountry(d.properties.name)));

      inCol = quantize(d3.sum(indNest, function(g) { return g.values })) ;

      indNest = [ { "key" : d.properties.name,
                    "color": inCol,
                    "values" : indNest.sort(function(a,b) {
                                              return(a.values - b.values)
                                            }) } ]

      countrySel.property("value", d.properties.name)
      $("#countrySpan").html(d.properties.name + " ")

      redraw()

  	});

    // make the bar chart

    nv.addGraph(function() {

      indChart = nv.models.multiBarHorizontalChart()
                  .x(function(d) { return d.key })
                  .y(function(d) { return d.values })
                  .margin({top: 30, right: 50, bottom: 20, left: 200})
                  .showValues(true)
                  .showLegend(false)
                  .tooltips(false)
                  .showControls(false)
                  .barColor(function(d) { return(inCol) })
                  .valueFormat(d3.format('0,000'));

      indChart.yAxis.tickFormat(d3.format('0,000'));

      d3.select('#byindustry svg')
        .datum(indNest)
        .transition().duration(500)
        .call(indChart);

      nv.utils.windowResize(indChart.update);

      return(indChart);

    });

    // redraw the bar chart

    function redraw() {
        d3.select('#byindustry svg')
            .datum(indNest)
            .transition().duration(500)
            .call(indChart);
    }

};

/**
 * Called to make the summary vis
 * Used in the data queuing call
 * @tparam Object error (if any) from the data load.
 * @tparam Object a4 the barcharts data object read by d3.json
 */

function makesummary(error, a4) {

  nv.addGraph(function() {

    actorChart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d.key })
                .y(function(d) { return d.value })
                .margin({top: 0, right: 0, bottom: 0, left: 75})
                .showValues(true)
                .showLegend(false)
                .tooltips(false)
                .showControls(false)
                // .barColor(function(d) { return(inCol) })
                .valueFormat(d3.format('0,000'));

    actorChart.yAxis.tickFormat(d3.format('0,000'));

    d3.select('#actor svg')
      .datum([a4.actor])
      .transition().duration(500)
      .call(actorChart);

    nv.utils.windowResize(actorChart.update);

    return(actorChart);

  });

  nv.addGraph(function() {

    actionChart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d.key })
                .y(function(d) { return d.value })
                .margin({top: 0, right: 0, bottom: 0, left: 85})
                .showValues(true)
                .showLegend(false)
                .tooltips(false)
                .showControls(false)
                // .barColor(function(d) { return(inCol) })
                .valueFormat(d3.format('0,000'));

    actorChart.yAxis.tickFormat(d3.format('0,000'));

    d3.select('#action svg')
      .datum([a4.action])
      .transition().duration(500)
      .call(actionChart);

    nv.utils.windowResize(actionChart.update);

    return(actionChart);

  });

  nv.addGraph(function() {

    assetChart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d.key })
                .y(function(d) { return d.value })
                .margin({top: 0, right: 0, bottom: 0, left: 75})
                .showValues(true)
                .showLegend(false)
                .tooltips(false)
                .showControls(false)
                // .barColor(function(d) { return(inCol) })
                .valueFormat(d3.format('0,000'));

    assetChart.yAxis.tickFormat(d3.format('0,000'));

    d3.select('#asset svg')
      .datum([a4.asset])
      .transition().duration(500)
      .call(assetChart);

    nv.utils.windowResize(assetChart.update);

    return(assetChart);

  });

  nv.addGraph(function() {

    attributeChart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d.key })
                .y(function(d) { return d.value })
                .margin({top: 0, right: 0, bottom: 0, left: 90})
                .showValues(true)
                .showLegend(false)
                .tooltips(false)
                .showControls(false)
                // .barColor(function(d) { return(inCol) })
                .valueFormat(d3.format('0,000'));

    assetChart.yAxis.tickFormat(d3.format('0,000'));

    d3.select('#attribute svg')
      .datum([a4.attribute])
      .transition().duration(500)
      .call(attributeChart);

    nv.utils.windowResize(attributeChart.update);

    return(attributeChart);

  });


  nv.addGraph(function() {

    yearChart = nv.models.discreteBarChart()
                .x(function(d) { return d.x })
                .y(function(d) { return d.y })
                .margin({top: 10, right: 30, bottom: 30, left: 90})
                .showValues(true)
                .tooltips(false)
                .color(["#993404"])
                .valueFormat(d3.format('0,000'));
                
    yearChart.yAxis.tickFormat(d3.format('0,000'));

    assetChart.yAxis.tickFormat(d3.format('0,000'));

    d3.select('#byyear svg')
      .datum([a4.byYear])
      .transition().duration(500)
      .call(yearChart);

    nv.utils.windowResize(yearChart.update);

    return(yearChart);

  });


}

/**
 * Called by the button callbacks
 * Used to update the heatmap
 * @tparam Object newdata which data file to use.
 */

function heatupdate(newdata) {
  
  heatdat = newdata ;
  
  colorScale = d3.scale.quantile()
                     .domain(newdata.zrange)
                     .range(colorbrewer.YlOrBr[9]);
        

   hsvg.selectAll(".heatlabels").data(newdata.data).transition()
       .text(" ")
       .attr("fill", function(d) {
                       if (+d.cnt == 0 ) { return("black"); }
                         else { return(blackOrWhite(colorScale(+d.z))); }
                       });
                     
  hsvg.selectAll(".heatcell").data(newdata.data).transition().duration(1000)
      .style("fill", function(d) {
                       if (+d.cnt == 0 ) { return("white"); }
                         else { return(colorScale(+d.z)) ; }
                       });

  hsvg.selectAll(".heatlabels").data(newdata.data).transition().delay(1000).duration(1000)
      .text(function(d) { if (+d.cnt == 0 ) { return(""); } else { return(d.lab) ; } })
      .attr("fill", function(d) {
                      if (+d.cnt == 0 ) { return("black"); }
                        else { return(blackOrWhite(colorScale(+d.z))); }
                      });


}

/**
 * button callbacks
 * Used to switch data sets for various vis
 */

$(document).ready(function(){ 

    $('.multiselect').multiselect({
      buttonClass: 'btn btn-default btn-sm',
      includeSelectAllOption: true,
      includeSelectAllDivider: true,
      buttonWidth: '200px'
    });

    $('#all').on('click', function() {
      heatupdate(all) ;
    });

    $('#discl').on('click', function() {      
      heatupdate(discl) ;
    });

    $('#tindustry').on('click', function() {
      timelineupdate("industry")
    })

    $('#tpattern').on('click', function() {
      timelineupdate("pattern")
    })

    $('#tvariety').on('click', function() {
      timelineupdate("data_variety")
    })

    $('#tabout').on('click', function() {
      $('#thelpmodal').modal('toggle');
    })

    $('#patinfo').on('click', function() {
      $('#tpatmodal').modal('toggle');
    })

    $('#tbutdat').on('click', function() {
      $('#datamodal').modal('toggle');
    })

    $('#tindsel').change(function() { changetimeopts(); })
    $('#tpatsel').change(function() { changetimeopts(); })
    $('#tvarsel').change(function() { changetimeopts(); })
    
});


/**
 * Called to handle changes to the filters for the timeline vis
 */

function changetimeopts() {

  var varopts = $("#tvarsel option:selected").map(function(){ return this.value }).get();
  var indopts = $("#tindsel option:selected").map(function(){ return this.value }).get();
  var patopts = $("#tpatsel option:selected").map(function(){ return this.value }).get();

  $.each(rectime, function(i) {
    this.visible = ((varopts.indexOf(this.data_variety) > -1) &&
                    (indopts.indexOf(this.industry) > -1) &&
                    (patopts.indexOf(this.pattern) > -1)) ? "TRUE" : "FALSE" ; 
  })

  timechange(rectime);

}

var timetooltip = d3.select("body").append("div")
    .attr("class", "timetip")
    .style("opacity", 0);


/**
 * Called to update the timeline
 * @tparam Object data the data for the timeline (cld just use the global tho)
 */

function timechange(data) {

  var recct=0, incct=0 ;

  $.each(rectime, function(i) {
    if (this.visible == "TRUE") {
      recct = recct + (+this.data_total) ;
      incct = incct + 1 ;
    }; 
  })

  $("#incct").html(commas(incct));
  $("#recct").html(commas(recct));

  var upd = tsvg.selectAll(".tdot")
      .data(data);

  upd.attr("class", "tdot")
      .attr("class", "tdot")
      .attr("r", 3.5)      
      .style("fill", function(d) { return(tcolor[t.colorby](d[t.colorby])) })
      .attr("stroke", "black")
      .attr("stroke-width", function(d) { 
        if (d.visible == "TRUE") {
          return("0.5");
        } else {
          return("0")
        }
      })
      .attr("cy", function(d) { return ty(+d["data_total"]) })
      .transition().duration(1000).ease('quad')
      .attr("cx", function(d) { 
        if (d.visible == "TRUE") {
          return tx(new Date(d["incident.month"] + "/1/" +d["incident.year"]));
        } else {
          return(-2)
        }
      })
      .attr("fill-opacity", function(d) { return(d.visible == "TRUE" ? 0.9 : 0.0) })
      ;

  upd.enter().append("circle")
      .attr("class", "tdot")
      .attr("r", 3.5)      
      .attr("stroke", "black")
      .attr("stroke-width", function(d) { 
        if (d.visible == "TRUE") {
          return("0.5");
        } else {
          return("0")
        }
      })
      .style("fill", function(d) { return(tcolor[t.colorby](d[t.colorby])) })
      .attr("cy", function(d) { return ty(+d["data_total"]) })
      .transition().duration(1000).ease('quad')
      .attr("cx", function(d) { 
        if (d.visible == "TRUE") {
          return tx(new Date(d["incident.month"] + "/1/" +d["incident.year"]));
        } else {
          return(-2)
        }
      })
      .attr("fill-opacity", function(d) { return(d.visible == "TRUE" ? 0.9 : 0.0) })
      ;

  upd.on("mouseover", function(d, i) {
   
    timetooltip.transition()
               .duration(200)
               .style("opacity", 1.0);

    var shortsum = d.summary ;
    if (shortsum.length > 100) {
      shortsum = shortsum.substr(0,96) + "..."
    }

    var addw = (d3.event.pageX < $(window).width()*2/3 ? d3.event.pageX : d3.event.pageX - 200 - 40);
    
    // <span class="label label-success"
    var v = d["data_variety"].split(",").map(function(x) { return('<span class="label label-success" style="display:inline-block;background-color:'+tcolor["data_variety"](d["data_variety"])+'">' + x + '</span> ') }).join(" ")

    timetooltip.html("<span style='font-weight:bold;font-size:110%;color:"+tcolor[t.colorby](d[t.colorby])+"'>"+d["victim.name"]+"</span> ("+commas(+d["data_total"])+"&nbsp;records)" + 
                     "<br/>" + 
                      '<b>Industry:</b> <span class="label label-success" style="display:inline-block;background-color:'+tcolor["industry"](d["industry"])+'">' + d.industry + '</span>'+"<br/>" + 
                      "<table><tr valign='top'><td nowrap><b>Data Variety:&nbsp;</b></td><td>"+ v +"</td></tr></table>" + 
                      '<b>Pattern:</b> <span class="label label-success" style="display:inline-block;background-color:'+tcolor["pattern"](d["pattern"])+'">' + d.pattern + '</span>'+"<br/>" + 
                      "<b>Year:</b> "+d["incident.year"]+"<br/><div style='width:100%;text-align:center;font-size:75%'>Click for more</div>")
               .style("left", (addw + 20) + "px")
               .style("top", (d3.event.pageY - 28) + "px");

    });


  upd.on("mouseout", function(d, i) { timetooltip.transition().duration(500).style("opacity", 0); });

  upd.on("click", function(d, i) {

    timetooltip.transition().duration(500).style("opacity", 0);

    $('#victimdialog').css({ width:'90%x', height:'650px', 'padding':'0' });

    $('#victimcontent').css({ height:'650px', 'padding':'0' });

    var ref = d.reference;

    var prog = '<div id="tprog" style="width:100%"><center><h2>Loading</h2><img src="img/spiffygif_88x88.gif"/></center></div>';

    var flag = '<img src="img/1x1.png" class="flag flag-' + d["victim.country"].toLowerCase() + '"/>';
    
    var v = d["data_variety"].split(",").map(function(x) { return('<span class="label label-success" style="display:inline-block;background-color:'+tcolor["data_variety"](d["data_variety"])+'">' + x + '</span> ') }).join(" ");

    $('#victimcontent').html("<div id='tmb' class='modal-body'>"+
                      "<span style='float:left;font-weight:bold;color:"+tcolor[t.colorby](d[t.colorby])+"'>"+d["victim.name"]+"&nbsp; "+flag+"</span>&nbsp; ("+commas(+d["data_total"])+" records)"+ 
                      "<span style='float:right'><span class='glyphicon glyphicon-new-window'></span> <a style='color:"+tcolor[t.colorby](d[t.colorby])+";font-style:bold' target=_blank href='https://github.com/vz-risk/VCDB/blob/master/data/json/"+d.incident_id+".json'>JSON entry for this incident</a></span>"+
                      "<table style='padding-top:0px;margin-top:0px' width='100%'><tr valign='bottom'><td nowrap width='20%' style='padding-right:10px'>"+
                      '<div class="well well-sm" style="height:100%;">'+
                      '<b>Industry:</b> <span class="label label-success" style="display:inline-block;background-color:'+tcolor["industry"](d["industry"])+'">' + d.industry + '</span>'+"<br/>" + 
                      "<b>Data Variety:</b> "+v+"<br/>" + 
                      '<b>Pattern:</b> <span class="label label-success" style="display:inline-block;background-color:'+tcolor["pattern"](d["pattern"])+'">' + d.pattern + '</span>'+"<br/>" + 
                      "<b>Year:</b> "+d["incident.year"]+"</div></td><td>" + 
                      "<textarea class='form-control' style='resize:none;padding:9px;height:100%;' rows='4'>"+d.summary+"</textarea><br/></td></tr><br/><br/></div>");

    if (d.canLoad == "NULL") {

      $('#tmb').append(prog)
   
      var iframe = document.createElement("iframe");
      iframe.sandbox = "allow-same-origin allow-scripts allow-popups allow-forms" ; // try to stop iframe busting
      iframe.src = ref;
      $('#tprog').remove();
      $('#tmb').append(iframe);
      $('#tmb').find('iframe').css({"height":"440px", "margin":"auto", "width":"99.6%", "border":"1px solid black"});

    } else if (d.canLoad == "NA") {

      $('#tmb').append("No news reference URL specified");

    } else {

      $('#tmb').append("<i>Cannot display news frame due to site origin restrictions.</i><br/>Please visit <a target=_blank href='"+ref+"'>their site directly</a>.");

    }

    $('#victimmodal').modal('toggle');

  })

}

/**
 * Called as part of an array filter to filter by industries
 * Used in the timeline visualization
 * @tparam array industry array of industries to filter on.
 */

function indfilt(indf) {
  if (indf.length == 0) { return(function(node) { return(false) }); }
  return function(node) {
    return(indf.indexOf(node.industry) > -1)
  }
}

function varfilt(varf) {
  if (varf.length == 0) { return(function(node) { return(false) }); }
  return function(node) {
    return(varf.indexOf(node["data_variety"]) > -1)
  }
}

var tmp, rectime ;
var t = {} ;
t.colorby = "industry" ; // data_variety, pattern
var tdots ;
var tsvg ;
var tcolor = {}
var tcolorind, tcolorpat, tcolorvar ;

function timelineupdate(dotcolor) {

  t.colorby = dotcolor ;

  tsvg.selectAll(".tdot").transition().duration(350).style("fill", function(d) { return tcolor[dotcolor](d[dotcolor]); }) 
  
}

var tx, ty, twidth, theight ;
var tabdata = [];

/**
 * Called to make the summary vis
 * Used in the data queuing call
 * @tparam Object error (if any) from the data load.
 * @tparam Object a4 the barcharts data object read by d3.json
 */

function maketimeline(error, indtime) {

  rectime = indtime ;

  $.each(rectime, function(i, d) {

    tabdata.push([ +d["incident.year"], 
                    d["victim.name"], 
                    d["victim.country"],
                    d["industry"], 
                    d["pattern"], 
                    commas(+d["data_total"]) ]) ;

  });

  $('#tdatatab').dataTable( {
        "data": tabdata,
        "columns": [
            { "title": "Year" },
            { "title": "Victim" },
            { "title": "Country" },
            { "title": "Industry" },
            { "title": "Pattern" },
            { "title": "# Records" }
        ],
    } );   

  t.industries = d3.set($.map(indtime, function(d) { return d.industry })).values().sort() ;
  t.patterns = d3.set($.map(indtime, function(d) { return d.pattern })).values().sort() ;
  t.varieties = d3.set($.map(indtime, function(d) { return d.data_variety })).values().sort() ;

  $("#tindsel").multiselect('dataprovider', $.map(t.industries, function(d) { return { label:d, value:d } }))
  $("#tpatsel").multiselect('dataprovider', $.map(t.patterns, function(d) { return { label:d, value:d } }))
  $("#tvarsel").multiselect('dataprovider', $.map(t.varieties, function(d) { return { label:d, value:d } }))

  $("#tindsel option").each(function(el) { $("#tindsel").multiselect('select', $(this).val()) })
  $("#tpatsel option").each(function(el) { $("#tpatsel").multiselect('select', $(this).val()) })
  $("#tvarsel option").each(function(el) { $("#tvarsel").multiselect('select', $(this).val()) })

  $("#tindsel").multiselect('rebuild')
  $("#tpatsel").multiselect('rebuild')
  $("#tvarsel").multiselect('rebuild')

  var margin = {top: 20, right: 20, bottom: 30, left: 100 };
  twidth = 800 - margin.left - margin.right,
  theight = 500 - margin.top - margin.bottom;

  tx = d3.time.scale().range([0, twidth]);

  ty = d3.scale.log().range([theight, 0]);

  var varcols = d3.scale.category20c().range();
  var indcols = d3.scale.category20c().range();
  var patcols = d3.scale.category10().range();

  tcolor["data_variety"] = d3.scale.ordinal().domain(t.varieties).range(varcols.slice(0,t.varieties.length));
  tcolor["industry"] = d3.scale.ordinal().domain(t.industries).range(indcols.slice(0,t.industries.length));
  tcolor["pattern"] = d3.scale.ordinal().domain(t.patterns).range(patcols.slice(0,t.patterns.length));

  var xAxis = d3.svg.axis().scale(tx).orient("bottom");
  var yAxis = d3.svg.axis().scale(ty).orient("left").ticks(10, d3.format(",0f"));

  var svg = d3.select("#timeplot").append("svg")
      .attr("width", twidth + margin.left + margin.right)
      .attr("height", theight + margin.top + margin.bottom)
      .style("max-width", "100%")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  tx.domain(d3.extent(indtime, function(d) { return new Date(d["incident.month"] + "/1/" +d["incident.year"]); })).nice();
  ty.domain(d3.extent(indtime, function(d) { return +d["data_total"] })).nice();

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + theight + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("# Records (log scale)")

  tsvg = svg ;

  timechange(indtime);

}



























