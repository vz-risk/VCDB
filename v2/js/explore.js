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

var commas = d3.format("0,000")

d3.select(window).on('resize', resize);

mapsetup(width, height)

// these asynchronously load our data sets, then call the vis code.

queue()
    .defer(d3.json, "js/world-topo-min.json")
    .defer(d3.csv, "data/victims.csv")
    .await(makegeo);

queue()
    .defer(d3.json, "data/vcdb19.json")
    .defer(d3.json, "data/vcdb19-breach.json")
    .await(makeheat);

queue()
    .defer(d3.json, "data/a4.json")
    .await(makesummary);

/**
 * Called when window is resized.
 * Main purpose is to ensure proper placment of tooltips.
 */

function resize() {

  offsetLeft = document.getElementById("vcdbmap").offsetLeft + 40 ;
  offsetTop = document.getElementById("vcdbmap").offsetTop + 30 ;

  hoffsetLeft = document.getElementById("pheat").offsetLeft + 40 ;
  hoffsetTop = document.getElementById("pheat").offsetTop + 30;

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

  var margin = { top: 100, right: 0, bottom: 0, left: 100 },
      width = 700 - margin.left - margin.right,
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

/**
 * Called to make the map vis
 * Used in the data queuing call
 * @tparam Object error (if any) from the data load.
 * @tparam Object pheat1 the heatmap object read by d3.json
 */

function makegeo(error, world, incidents, pheat1) {

  // summarize the incidents by country

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
               .domain([d3.min(ccData.values()), d3.max(ccData.values())])
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
 * Heatmap button callbacks
 * Used to switch data sets
 */

$(function(){ 

    $('#all').on('click', function() {
      heatupdate(all) ;
    });

    $('#discl').on('click', function() {      
      heatupdate(discl) ;
    });
    
});