/**
 * Interactive, zoomable treemap, using D3 v4
 **/

"use strict";

const domain = 'https://raw.githubusercontent.com';
const resource = 'patrickbucher/source-folder-analysis/master/src/data/sourcetree.json';
const dataSource = `${domain}/${resource}`;


var el_id = 'chart';
var obj = document.getElementById(el_id);
var divWidth = obj.offsetWidth;
var margin = { top: 30, right: 0, bottom: 20, left: 0 },
    width = divWidth - 20,
    height = 600 - margin.top - margin.bottom,
    formatNumber = d3.format(","),
    transitioning;

// sets x and y scale to determine size of visible boxes
var x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);
var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, height]);
var treemap = d3.treemap()
    .size([width, height])
    .paddingInner(0)
    .round(false);
var svg = d3.select('#' + el_id).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
    .style("margin-left", -margin.left + "px")
    .style("margin.right", -margin.right + "px")
    .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("shape-rendering", "crispEdges");

var grandparent = svg.append("g")
    .attr("class", "grandparent");
grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top)
grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

var stacked = svg.append("g")
    .attr("class", "stacked")

d3.json(dataSource).then(function (data) {
    var root = d3.hierarchy(data);

    var languageColor = new Map();

    // Init treemap with root item.
    treemap(root
        .sum(function (d) {
            // Init random color per language.
            var randomColor = "#000000".replace(/0/g,function(){
                return (~~(Math.random()*16)).toString(16);
            });
            languageColor.set(d.language, randomColor)

            // Get only values from the files.
            if (d.children == undefined) {
                return d.code;
            }
        })
        .sort(function (a, b) {
            return b.height - a.height || b.code - a.code
        })
    );
    display(root);

    function display(d) {
        // write text into grandparent
        // and activate click's handler
        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));

        // grandparent color
        grandparent
            .select("rect")
            .attr("fill", '#f1f0f0');

        // stacked bar-chart
        var dSum = d.data.blank + d.data.comment + d.data.code;
        var stackedData = [d.data.blank, d.data.comment, d.data.code];
        var stackedColors = ["#e5e4e2", "#005f59", "#000000"];

        var yVal = 0;
        var yStart = -margin.top
        stacked
            .append("g")
            .selectAll("rect")
            .enter()
            .data(stackedData)
                .enter().append("rect")
                .attr("x", 6 + width -25)
                .attr("y", function(d, i) {
                    yVal = yVal + ((height-yStart) / dSum * stackedData[i-1] || 0);
                    return yStart + yVal;
                })
                .attr("width", 25)
                .attr("height", function(d) { return ((height+margin.top) / dSum * d);})
                .attr("fill", function(d, i) { return stackedColors[i]; })

        var g1 = svg.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");
        var g = g1.selectAll("g")
            .data(d.children)
            .enter().
            append("g");

        // add class and click handler to all g's with children
        g.filter(function (d) {
            return d.children;
        })
            .classed("children", true)
            .on("click", transition);

        g.selectAll(".child")
            .data(function (d) {
                return d.children || [d];
            })
            .enter().append("rect")
            .attr("class", "child")
            .call(rect);
        // add title to parents
        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d) {
                return d.data.name;
            });
        const generateId = (d) => {
            // FIXME: use full path (iterate recursively over parents) instead
            return `${d.data.name}_${d.data.code}_${d.data.code}_${d.data.blank}_${d.data.comment}`.replace(/\./g, '-');
        };
        // Adding a foreign object instead of a text object, allows for text wrapping.
        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
            .append("xhtml:div")
            .attr("dy", ".75em")
            .html(function (d) {
                const id = generateId(d);
                return '<p class="title">' + d.data.name + '</p>' +
                    `<div id="${id}" style="visibility: hidden;">` +
                    '<p>value: ' + formatNumber(d.value) + ' (recursiv)</p>' +
                    '<p>code: ' + formatNumber(d.data.code) + '</p>' +
                    '<p>blank: ' + formatNumber(d.data.blank) + ' </p>' +
                    '<p>comment: ' + formatNumber(d.data.comment) + '</p>' +
                    `<p>language: ${d.data.language}</p>` +
                    '</div>';
            })
            //textdiv class allows us to style the text easily with CSS.
            .attr("class", "textdiv")
            .on("mouseenter", function (d) {
                const selector = '#' + generateId(d);
                d3.select(selector).style('visibility', 'visible');
            })
            .on("mouseleave", function (d) {
                const selector = '#' + generateId(d);
                d3.select(selector).style('visibility', 'hidden');
            });

        // On Click to a rect.
        function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;
            var g2 = display(d),
                t1 = g1.transition().duration(650),
                t2 = g2.transition().duration(650);
            // Update the domain only after entering new elements.
            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);
            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);
            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function (a, b) {
                return a.depth - b.depth;
            });
            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);
            g2.selectAll("foreignObject div").style("display", "none");
            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);
            /* Foreign object */
            t1.selectAll(".textdiv").style("display", "none");
            /* added */
            t1.selectAll(".foreignobj").call(foreign);
            /* added */
            t2.selectAll(".textdiv").style("display", "block");
            /* added */
            t2.selectAll(".foreignobj").call(foreign);
            /* added */
            // Remove the old node when the transition is finished.
            t1.on("end.remove", function () {
                this.remove();
                transitioning = false;
            });
        }
        return g;
    }

    /**
     * Returns text position attributes.
     * @param text object of json item.
     */
    function text(text) {
        text.attr("x", function (d) {
            return x(d.x) + 6;
        })
            .attr("y", function (d) {
                return y(d.y) + 6;
            });
    }

    /**
     * Returns rect position attributes.
     * @param text object of json item.
     */
    function rect(rect) {
        rect
            .attr("x", function (d) {
                return x(d.x0);
            })
            .attr("y", function (d) {
                return y(d.y0);
            })
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0);
            })
            .attr("height", function (d) {
                return y(d.y1) - y(d.y0);
            })
            .attr("fill", function (d) {
                return languageColor.get(d.data.language);
            });
    }

    /**
     * Returns foreign object attributes instead of a text object, allows for text wrapping.
     * @param foreign 
     */
    function foreign(foreign) {
        foreign
            .attr("x", function (d) {
                return x(d.x0);
            })
            .attr("y", function (d) {
                return y(d.y0);
            })
            .attr("width", function (d) {
                return x(d.x1) - x(d.x0);
            })
            .attr("height", function (d) {
                return y(d.y1) - y(d.y0);
            });
    }

    /**
     * Returns pathname for chart header.
     * @param d current json item. 
     */
    function name(d) {
        return breadcrumbs(d) +
            (d.parent
                ? "  -  Click to zoom out"
                : "  Click inside square to zoom in");
    }

    /**
     * Returns pathname of json item.
     * @param d current json item. 
     */
    function breadcrumbs(d) {
        var res = "";
        var sep = "/";
        d.ancestors().reverse().forEach(function (i) {
            res += i.data.name + sep;
        });
        return sep + res
            .split(sep)
            .filter(function (i) {
                return i !== "";
            })
            .join(sep);
    }
});
