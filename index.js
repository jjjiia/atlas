$(function() {
	queue()
		.defer(d3.json, zipcodes)
		.defer(d3.csv,data)
		.await(dataDidLoad);
})

$("#topDifferences .hideTop").hide()

var table = {
	group: function(rows, fields) {
		var view = {}
		var pointer = null

		for(var i in rows) {
			var row = rows[i]

			pointer = view
			for(var j = 0; j < fields.length; j++) {
				var field = fields[j]

				if(!pointer[row[field]]) {
					if(j == fields.length - 1) {
						pointer[row[field]] = []
					} else {
						pointer[row[field]] = {}
					}
				}

				pointer = pointer[row[field]]
			}

			pointer.push(row)
		}

		return view
	},

	maxCount: function(view) {
		var largestName = null
		var largestCount = null

		for(var i in view) {
			var list = view[i]

			if(!largestName) {
				largestName = i
				largestCount = list.length
			} else {
				if(list.length > largestCount) {
					largestName = i
					largestCount = list.length
				}
			}
		}

		return {
			name: largestName,
			count: largestCount
		}
	},

	filter: function(view, callback) {
		var data = []

		for(var i in view) {
			var list = view[i]
			if(callback(list, i)) {
				data = data.concat(list)
			}
		}
		return data
	}
}


function dataDidLoad(error,zipcodes,data) {
//make 1 svg for everything
    var mapSvg = d3.select("#map").append("svg").attr("width",1200).attr("height",1200)
	var byZip = table.group(data, ["zip_code"])
    drawBuildings(zipcodes,mapSvg,byZip)
    var categories = data[0]
    console.log(categories)
//    categories = ["FIPS","TOT_POP","POP_DEN","ARE_LAND"]
    for(var c in categories){
        if(c != "geoid" && c !="zip_code" && c != "zip_area"){
            console.log(c)
            drawHistogram(byZip,c)
        }
    }
}
function drawBuildings(geoData,svg,dataByZipcode){
    var projection = d3.geo.mercator().scale(100000).center([-87.668330,41.94])
    var path = d3.geo.path().projection(projection);
    
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-5, 0])
    .html(function(d) {
      return "<strong>Frequency:</strong> <span style='color:red'>" + d.frequency + "</span>";
    })
    svg.call(tip);
    
    svg.selectAll(".buildings")
		.data(geoData.features)
        .enter()
        .append("path")
		.attr("class","buildings")
		.attr("d",path)
		.style("fill","#fff")
        .style("stroke","black")
	    .style("opacity",1)
        .on("click",function(d){
            //drawChart(dataByZipcode,d.properties.zip)
        })
        .on("mouseover",function(d){
            d3.select(this).style("fill","red")
            d3.selectAll("#overview ._"+d.properties.zip).style("fill","red")
            tip.html(d.properties.zip)
            tip.show()
        })
        .on("mouseout",function(){
            d3.selectAll("path").style("fill","#fff")
            
            d3.selectAll("#overview rect").style("fill","black")
            tip.hide
            
        })
}
    
function drawHistogram(data,category){
    var byZip = []
    for(var i in data){
        //console.log(data[i][0][category])
        var value = data[i][0][category].split("_")[0]
        byZip.push({"key":i,"value":parseInt(value)})
    }
    byZip.sort(function(a, b) {return b.value - a.value})
    var max = byZip[0].value
    var min = byZip[byZip.length-1].value
    var hScale = d3.scale.linear().domain([min,max]).range([0,100])
    var chart = d3.selectAll("#overview").append("div").attr("id",category).append("svg")
    .attr("width",500)
    .attr("height",170)
    chart.append("text").text(category).attr("x",10).attr("y",20)
    
    chart.selectAll("rect")
    .data(byZip)
    .enter()
    .append("rect")
    .attr("x",function(d,i){return i*1.5})
    .attr("y",function(d,i){return 150-hScale(d.value)})
    .attr("height",function(d,i){return hScale(d.value)})
    .attr("width",function(d,i){return 1.5})
    .attr("class",function(d){return "_"+d.key})
    
}
function drawChart(data,zipcode){
    if(data[String(zipcode)] == undefined){
        d3.select("#overview").html(zipcode+": zipcode not found in data")
    }else{
        var text = ""
        for(var i in data[String(zipcode)][0]){
            text += i
            text += ": "
            text += data[String(zipcode)][0][i]
            text += "<br/>"
        }
        d3.select("#overview").html(text)
    }
}