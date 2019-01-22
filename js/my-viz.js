/* global d3, crossfilter */
// Shorthand for $( document ).ready()

// let's get started
// adding the line viz from codepen work here

var parseTime = d3.timeParse('%Y%m%d');

    var headers = ['X', 'Y', 'Z', 'time_', 'motion'].join(',');
d3.text('data/motiondata.csv', function(error, data) {
data = d3.csvParse(headers + '\n' + data);
if (error) throw error;

// getting 100ths of seconds into a continuous stream to avoid zero restart
for (var i = 0, len = data.length - 1; i < len; i++) {
if (data[i].time_ - data[i + 1].time_ > 0) {
data[i + 1].time_ = (parseFloat(data[i + 1].time_) + 0).toString();
}
}

var category = 'jumping';

d3.select('#filter_jumping')
.on('click', function() {
d3.select('g').remove();
category = 'jumping';
update(data.filter(function(d) {return d.motion == category;}));
});

d3.select('#filter_jogging')
.on('click', function() {
d3.select('g').remove();
category = 'jogging';
update(data.filter(function(d) {return d.motion == category;}));
});

d3.select('#filter_dancing')
.on('click', function() {
d3.select('g').remove();
category = 'dancing';
update(data.filter(function(d) {return d.motion == category;}));
});

update(data.filter(function(d) {return d.motion == 'jumping';}));


// put this above outside data feed

function update(data){


var svg = d3.select('svg'),

margin = {top: 20, right: 120, bottom: 30, left: 50},
width = svg.attr('width') - margin.left - margin.right,
height = svg.attr('height') - margin.top - margin.bottom,
g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'),
gData = g.append('g').attr('class', 'data'); // John: Let's create a group just for the data to organize stuff

var x = d3.scaleLinear().range([0, width]),
y = d3.scaleLinear().range([height, 0]),
color = d3.scaleOrdinal(d3.schemeCategory10);



var coords = ['Y', 'X', 'Z'];
x.domain(d3.extent(data, function(d) { return d.time_; }));

y.domain([-1, 1]);
color.domain();

g.append('g')
.attr('class', 'axis axis--x')
.attr('transform', 'translate(1,' + height + ')')
.call(d3.axisBottom(x))
.append('text')
.attr('x', 500)
.attr('dx', '0.71em')
.attr('fill', '#000')
.text('Rolling Time in Seconds');

g.append('g')
.attr('class', 'axis axis--y')
.call(d3.axisLeft(y))
.append('text')
.attr('transform', 'rotate(-90)')
.attr('y', 6)
.attr('dy', '0.71em')
.attr('fill', '#000')
.text('Relative Scale');

function makeLine(newcoord) {
gData.append('g')
.attr('class', 'coord')
.append('path')
.attr('class', 'line')
.style('stroke', color(newcoord))
.attr('d', d3.line()
// .curve(d3.curveBasis)
  .x(function(d) { return x(d.time_); })
  .y(function(d) { return y(d[newcoord]); })(data)
); // attr d

g.append('text')
.text(newcoord)
.attr('class', 'text')
.style('stroke', color(newcoord))
.attr('y', y(data[data.length - 1][newcoord]) - 12)
.attr('x', x.range()[1]); // the end of the chart

}

function makePoints(newcoord) {
gData.selectAll('.points')
.data(data)
.enter()
.append('circle')
.attr('class', 'circle')
.attr('r', 4)
.style('fill', color(newcoord))
.attr('cx', function(d) { return x(d.time_); })
.attr('cy', function(d) { return y(d[newcoord]); });  // Get attributes from circleAttrs var
} // John: you weren't closing this on the right place

var mouseG = g.append('g')
.attr('class', 'mouse-over-effects');

mouseG.append('path') // this is the black vertical line to follow mouse
.attr('class', 'mouse-line')
.style('stroke', 'black')
.style('stroke-width', '1px')
.style('opacity', '0');



// John: You are mixing up things here, why wouldn't you use d3 for this?
// var lines = document.getElementsByClassName('line');

//John Extracted everything here on a separate function so it won't be as messy
function onMouseMove() { // mouse moving over canvas
var mouse = d3.mouse(this);

console.log(mouse);

// John: You first draw the vertical line, that's fine
d3.select('.mouse-line')
.attr('d', function() {
var d = 'M' + mouse[0] + ',' + height;
d += ' ' + mouse[0] + ',' + 0;
return d;
});

mouseG.selectAll('.mouse-per-line') // John: You needed to select inside mouseG
.attr('transform', function(d, i) {
var xDate = x.invert(mouse[0]),
      bisect = d3.bisector(function(d) { return d.time_; }).right, // John replaced ; with ,
      idx = bisect(data, xDate); // You should be bisecting (searching) on the original data

var translateX = mouse[0],
translateY = y(data[idx][d]); // John: d contains the coordinate (X, Y or Z), idx has the index on the data


// John: All this code is unnecesary, once you have the id of the selected point (idx) you can get easily x, and y
// var beginning = 0,
//     end = lines[i].getTotalLength(),
//     target = null;


// while (true){
//   target = Math.floor((beginning + end) / 2);
//   pos = lines[i].getPointAtLength(target);
//   if ((target === end || target === beginning) && pos.x !== mouse[0]) {
//       break;
//   }
//   if (pos.x > mouse[0])      end = target;
//   else if (pos.x < mouse[0]) beginning = target;
//   else break; //position found
// }

// d3.select(this).select('text')
//   .text(y.invert(pos.y).toFixed(2));

return 'translate(' + translateX + ',' + translateY + ')';
}); // Transform

}
var mousePerLine = mouseG.selectAll('.mouse-per-line')
.data(coords) // John: If I understood correctly, you should only create one per coordinate, not one per data point
.enter()
.append('g')
.attr('class', 'mouse-per-line');

mousePerLine.append('circle')
.attr('r', 7)
.style('stroke', function(d) {
return color(d); // John: Since your data is coords now, d will contain the name (X, Y, Z)
})
.style('fill', 'none')
.style('stroke-width', '2px')
.style('opacity', '0');

mousePerLine.append('text')
.attr('transform', 'translate(10,-20)');

mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
 .attr('width', width) // can't catch mouse events on a g element
 .attr('height', height)
 .attr('fill', 'none')
 .attr('pointer-events', 'all')
 .on('mouseout', function() { // on mouse out hide line, circles and text
  // d3.select(".mouse-line")
  //   .style("opacity", "0");
  // d3.selectAll(".mouse-per-line circle")
  //   .style("opacity", "0");
  // d3.selectAll(".mouse-per-line text")
  //   .style("opacity", "0");
})
 .on('mouseover', function() { // on mouse in show line, circles and text
  d3.select('.mouse-line')
  .style('opacity', '1');
  d3.selectAll('.mouse-per-line circle')
  .style('opacity', '1');
  d3.selectAll('.mouse-per-line text')
  .style('opacity', '1');
})
 .on('mousemove', onMouseMove);

coords.forEach(makeLine);
coords.forEach(makePoints);
}
});

    /*
    function type(d, _, columns) {
      d.date = parseTime(d.date);
      for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
      return d;
    }
    */
    // copied these bits from the original index doc

        /*

        var cfData = crossfilter(data);

        var dimMotion = cfData.dimension(function(d) { return d['motion-name']; });

        d3.select('#filter')
        .on('click', function() {
          dimMotion.filter('jogging');
          console.log(dimMotion.group().all());
          //          update();
        });
        console.log('ehre');
        console.log(dimMotion.group().all());
        */
