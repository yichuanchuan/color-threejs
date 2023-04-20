import "./style.css";
import * as d3 from "d3";

import data from "./colors.csv";

function lab2rgb(lab) {
  var y = (lab[0] + 16) / 116,
    x = lab[1] / 500 + y,
    z = y - lab[2] / 200,
    r,
    g,
    b;


  x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787);
  y = 1.0 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787);
  z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787);

  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.204 + z * 1.057;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return rgbToHex(
    Math.round(Math.max(0, Math.min(1, r)) * 255),
    Math.round(Math.max(0, Math.min(1, g)) * 255),
    Math.round(Math.max(0, Math.min(1, b)) * 255)
  );
}
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
const root = d3.hierarchy(d3.group(data, d => d.parent));

const links = root.links();
const nodes = root.descendants();

const pack = d3.pack().size([window.innerWidth, window.innerHeight]).padding(1)(
  d3.hierarchy(data).sum(d => d.subparent)
);



console.log(pack);
// const simulation = d3
//   .forceSimulation(nodes)
//   .force(
//     "link",
//     d3
//       .forceLink(links)
//       .id(d => d.id)
//       .distance(10)
//       .strength(1)
//   )
//   .force("charge", d3.forceManyBody().strength(-10))
//   .force("x", d3.forceX())
//   .force("y", d3.forceY())
//   .force(
//     "center",
//     d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2)
//   )
//   .force("cluster", forceCluster())
//   .force("collide", forceCollide());
const simulation = d3
  .forceSimulation(nodes)
  .force("x", d3.forceX(window.innerWidth / 2).strength(0.01))
  .force("y", d3.forceY(window.innerHeight / 2).strength(0.01))
  .force("cluster", forceCluster())
  .force("collide", forceCollide());
const svg = d3
  .select("#app")
  .append("svg")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight);
const node = svg
  .append("g")
  .attr("fill", "#fff")
  .attr("stroke", "#000")
  .attr("stroke-width", 1.5)
  .selectAll("circle")
  .data(nodes)
  .join("circle")
  .attr("fill", d =>
    d.children ? null : `${lab2rgb([d.data.l, d.data.a, d.data.b])}`
  )
  // .attr("stroke", d => (d.children ? null : "#fff"))
  .attr("r", 3.5)
  .attr("width", 4)
  .attr("height", 4);
// .attr("strokeWeight",0.)

simulation.on("tick", () => {
  // const xoffset = window.innerWidth/2;
  // const yoffset = window.innerHeight/2;
  const xoffset = 0;
  const yoffset = 0;
  // node.attr("cx", d => d.x + xoffset).attr("cy", d => d.y + yoffset);
});

console.log(nodes);

function forceCollide() {
  const alpha = 0.4; // fixed for greater rigidity!
  const padding1 = 2; // separation between same-color nodes
  const padding2 = 6; // separation between different-color nodes
  let nodes;
  let maxRadius;

  function force() {
    const quadtree = d3.quadtree(
      nodes,
      d => d.x,
      d => d.y
    );
    for (const d of nodes) {
      const r = d.r + maxRadius;
      const nx1 = d.x - r,
        ny1 = d.y - r;
      const nx2 = d.x + r,
        ny2 = d.y + r;
      quadtree.visit((q, x1, y1, x2, y2) => {
        if (!q.length)
          do {
            if (q.data !== d) {
              const r =
                d.r +
                q.data.r +
                (d.data.group === q.data.data.group ? padding1 : padding2);
              let x = d.x - q.data.x,
                y = d.y - q.data.y,
                l = Math.hypot(x, y);
              if (l < r) {
                l = ((l - r) / l) * alpha;
                (d.x -= x *= l), (d.y -= y *= l);
                (q.data.x += x), (q.data.y += y);
              }
            }
          } while ((q = q.next));
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    }
  }

  force.initialize = _ =>
    (maxRadius = d3.max((nodes = _), d => d.r) + Math.max(padding1, padding2));

  return force;
}

function forceCluster() {
  const strength = 0.2;
  let nodes;

  function force(alpha) {
    const centroids = d3.rollup(nodes, centroid, d => d.data.group);
    const l = alpha * strength;
    for (const d of nodes) {
      const { x: cx, y: cy } = centroids.get(d.data.group);
      d.vx -= (d.x - cx) * l;
      d.vy -= (d.y - cy) * l;
    }
  }

  force.initialize = _ => (nodes = _);

  return force;
}

function centroid(nodes) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const d of nodes) {
    let k = d.r ** 2;
    x += d.x * k;
    y += d.y * k;
    z += k;
  }
  return { x: x / z, y: y / z };
}
