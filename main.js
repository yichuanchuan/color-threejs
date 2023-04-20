import "./style.css";
import * as d3 from "d3";

import data from "./colors.csv";

function lab2rgb(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return rgbToHex(Math.round(Math.max(0, Math.min(1, r)) * 255), 
  Math.round(Math.max(0, Math.min(1, g)) * 255), 
  Math.round(Math.max(0, Math.min(1, b)) * 255))
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
const root = d3.hierarchy(
  d3.group(
    data,
    d => d.color,
    d => d.subparent
  )
);
console.log(root)

const links = root.links();
const nodes = root.descendants();

const simulation = d3
  .forceSimulation(nodes)
  .force(
    "link",
    d3
      .forceLink(links)
      .id(d => d.id)
      .distance(10)
      .strength(1)
  )
  .force("charge", d3.forceManyBody().strength(-10))
  .force("x", d3.forceX())
  .force("y", d3.forceY());

const svg = d3
  .select("#app")
  .append("svg")
  .attr("width", 1500)
  .attr("height", 1500);
const link = svg
  .append("g")
  .attr("stroke", "#FFF")
  .attr("stroke-opacity", 0.6)
  .selectAll("line")
  .data(links)
  .join("line");

const node = svg
  .append("g")
  .attr("fill", "#fff")
  .attr("stroke", "#000")
  .attr("stroke-width", 1.5)
  .selectAll("circle")
  .data(nodes)
  .join("circle")
  .attr("fill", d => (d.children ? null : `${lab2rgb([d.data.l,d.data.a,d.data.b])}`))
  // .attr("stroke", d => (d.children ? null : "#fff"))
  .attr("r", 3.5)
  .attr("width", 4)
  .attr("height", 4)
  // .attr("strokeWeight",0.)



simulation.on("tick", () => {
  // link
  //   .attr("x1", d => d.source.x)
  //   .attr("y1", d => d.source.y)
  //   .attr("x2", d => d.target.x)
  //   .attr("y2", d => d.target.y);

  // node.attr("cx", d => d.x).attr("cy", d => d.y);

  const offset = 700;
  link
    .attr("x1", d => (d.source.x + offset))
    .attr("y1", d => d.source.y + offset)
    .attr("x2", d => d.target.x + offset)
    .attr("y2", d => d.target.y + offset);
  // .call(setParent(simulation))

  node
    .attr("cx", d => (d.x + offset))
    .attr("cy", d => d.y + offset);
});

// console.log(nodes[121].data.l)