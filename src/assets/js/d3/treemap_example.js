"use strict";

const domain = 'https://raw.githubusercontent.com';
const resource = 'patrickbucher/davi/master/project/src/treemap.json';
const dataSource = `${domain}/${resource}`;

const margin = {top: 10, right: 10, bottom: 10, left: 10};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3.select('#treemap')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('transform', `translate(${margin.left}, ${margin.top})`);

d3.json(dataSource).then(data => {
    console.log(data);
});
