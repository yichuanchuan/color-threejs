import "./style.css";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import data from "./color/colors.csv";
import firstLevel from "./color/firstLevel.csv";
import secondLevel from "./color/secondLevel.csv";
import thirdLevel from "./color/thirdLevel.csv";
import color_convex from "./color/color-covex.csv";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from "three";
import { map, lab2rgb } from "./utils.js";
import { colord, extend } from "colord";
import labPlugin from "colord/plugins/lab";
import { qing, chi, huang, bai, hei } from "./meshpoints";
import { json } from "d3";

//a map function like p5js without contrain funcion
function number_map(value, start1, stop1, start2, stop2) {
  var newval =
    ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
  return newval;
}

//lab值映射到0-1
const color_convex_mapped = color_convex.map((d) => {
  return {
    l: number_map(d.l, 0, 100, 0, 1),
    a: number_map(d.a, -128, 127, 0, 1),
    b: number_map(d.b, -128, 127, 0, 1),
    color: d.color,
    form: d.form,
  };
});

// console.log(data.filter(d=>d.subparent==="棕"))
let colorsData = data;
extend([labPlugin]);

const meshSelect = document.querySelector("#meshSelect");
const meshMatselect = document.querySelector("#meshMatSelect");
meshMatselect.add(new Option("显示线框"));
meshMatselect.add(new Option("显示面"));

meshSelect.add(new Option("不显示边界"));
meshSelect.add(new Option("青"));
meshSelect.add(new Option("赤"));
meshSelect.add(new Option("黄"));
meshSelect.add(new Option("白"));
meshSelect.add(new Option("黑"));
meshSelect.add(new Option("显示全部边界"));

meshMatselect.addEventListener("change", onMeshMatChangeOption);
meshSelect.addEventListener("change", onMeshChangeOption);
// const colorsData = data
// console.log(data)
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const canvas = document.querySelector(".webgl");
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(1, 1, 1);
const geo = new THREE.EdgesGeometry(geometry);
const mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
const mesh = new THREE.LineSegments(geo, mat);
mesh.position.set(0.5, 0.5, 0.5);
scene.add(mesh);

//-----------------边界

const boundaryQing = new THREE.BufferGeometry();
boundaryQing.setAttribute("position", new THREE.BufferAttribute(qing, 3));

const boundaryChi = new THREE.BufferGeometry();
boundaryChi.setAttribute("position", new THREE.BufferAttribute(chi, 3));

const boundaryHuang = new THREE.BufferGeometry();
boundaryHuang.setAttribute("position", new THREE.BufferAttribute(huang, 3));

const boundaryBai = new THREE.BufferGeometry();
boundaryBai.setAttribute("position", new THREE.BufferAttribute(bai, 3));

const boundaryHei = new THREE.BufferGeometry();
boundaryHei.setAttribute("position", new THREE.BufferAttribute(hei, 3));

const mqing = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  wireframe: true,
  visible: false,
});
const mchi = new THREE.MeshBasicMaterial({
  color: 0xed1a3d,
  visible: false,
  wireframe: true,
});
const mhuang = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  visible: false,
  wireframe: true,
});
const mbai = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  visible: false,
  wireframe: true,
});
const mhei = new THREE.MeshBasicMaterial({
  color: 0x000000,
  visible: false,
  wireframe: true,
});

const MeshQing = new THREE.Mesh(boundaryQing, mqing);
const MeshChi = new THREE.Mesh(boundaryChi, mchi);
const MeshHuang = new THREE.Mesh(boundaryHuang, mhuang);
const MeshBai = new THREE.Mesh(boundaryBai, mbai);
const MeshHei = new THREE.Mesh(boundaryHei, mhei);
scene.add(MeshQing, MeshChi, MeshHuang, MeshBai, MeshHei);

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};
const camera = new THREE.PerspectiveCamera(45, size.width / size.height);
camera.position.z = 2;
camera.position.x = 2;
camera.position.y = 2;
scene.add(camera);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(size.width, size.height);
// 坐标轴
let axisHelper = new THREE.AxesHelper(1.5);
scene.add(axisHelper);
scene.background = new THREE.Color(0x555555);

// onMeshChangeOption()
animate();

function animate() {
  render();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", onWindowResize);
canvas.addEventListener("pointermove", onPointerMove);

function render() {
  renderer.render(scene, camera);
}

// 创建控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", render); // use if there is no animation loop
controls.minDistance = 1;
controls.maxDistance = 10;
controls.target.set(0, 0, -0.2);
controls.update();

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

let selectedObject = null;
function onPointerMove(event) {
  setInfo("", "", "", "", "", "");
  if (!app.group) return;
  if (selectedObject) {
    selectedObject.scale.set(0.01, 0.01, 0.01);
    selectedObject = null;
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObject(app.group, true);

  if (intersects.length > 0) {
    const res = intersects.filter(function (res) {
      return res && res.object;
    })[0];
    if (res && res.point && res.object) {
      let l = map(res.point.x, 0, 1, 0, 100, true);
      let a = map(res.point.y, 0, 1, -128, 127, true);
      let b = map(res.point.z, 0, 1, -128, 127, true);
      setInfo(
        colord({ l: l, a: a, b: b }).toHex(),
        l,
        a,
        b,
        res.object.name,
        res.object.from ? res.object.from : ""
      );
    }
  }
}
function setInfo(name, l, a, b, colorName, from) {
  document.querySelector("#name").innerHTML = name;
  document.querySelector("#name").style.color = name;
  document.querySelector("#l").innerHTML = l;
  document.querySelector("#a").innerHTML = a;
  document.querySelector("#b").innerHTML = b;
  document.querySelector("#colorName").innerHTML = colorName;
  document.querySelector("#from").innerHTML = from;
}

function onMeshChangeOption(d) {
  const index = d.srcElement.selectedIndex;
  const val = d.srcElement.options[index].text;
  if (val === "青") {
    mqing.visible = true;
    mchi.visible = false;
    mhuang.visible = false;
    mbai.visible = false;
    mhei.visible = false;
  } else if (val === "赤") {
    mqing.visible = false;
    mchi.visible = true;
    mhuang.visible = false;
    mbai.visible = false;
    mhei.visible = false;
  } else if (val === "黄") {
    mqing.visible = false;
    mchi.visible = false;
    mhuang.visible = true;
    mbai.visible = false;
    mhei.visible = false;
  } else if (val === "白") {
    mqing.visible = false;
    mchi.visible = false;
    mhuang.visible = false;
    mbai.visible = true;
    mhei.visible = false;
  } else if (val === "黑") {
    mqing.visible = false;
    mchi.visible = false;
    mhuang.visible = false;
    mbai.visible = false;
    mhei.visible = true;
  } else if (val === "不显示边界") {
    mqing.visible = false;
    mchi.visible = false;
    mhuang.visible = false;
    mbai.visible = false;
    mhei.visible = false;
  } else if (val === "显示全部边界") {
    mqing.visible = true;
    mchi.visible = true;
    mhuang.visible = true;
    mbai.visible = true;
    mhei.visible = true;
  }
}

function onMeshMatChangeOption(d) {
  const index = d.srcElement.selectedIndex;
  const val = d.srcElement.options[index].text;
  if (val === "显示线框") {
    mqing.wireframe = true;
    mchi.wireframe = true;
    mhuang.wireframe = true;
    mbai.wireframe = true;
    mhei.wireframe = true;
  } else if ("显示面") {
    mqing.wireframe = false;
    mchi.wireframe = false;
    mhuang.wireframe = false;
    mbai.wireframe = false;
    mhei.wireframe = false;
  }
}

// 使用vue处理
let app = new Vue({
  el: "#info",
  data() {
    return {
      firstLevelList: [], // 第一层级列表
      secondLevelList: [], // 第二层级列表
      thirdLevelList: [], // 第三层级列表
      firstColorValue: [], // 第一层级选中的值
      secondColorValue: [], // 第二层级选中的值
      thirdColorValue: [], // 第三层级选中的值
      group: null, // 用于管理mesh对象
      status: false,
    };
  },
  methods: {
    // 一层级切换
    firstLevelChange(val, flag = false) {
      if (!flag) {
        if (this.group.children.length > 0) this.group.clear();
        this.secondLevelChange(this.secondColorValue, true);
        this.thirdLevelChange(this.thirdColorValue, true);
      }
      val.forEach((item) => {
        let colorsData = firstLevel.filter((d) => d.parent === item);
        let points = [];
        colorsData.forEach((d, i) => {
          const c = colord({ l: d.l, a: d.a, b: d.b }).toHex();
          const x = map(d.l, 0, 100, 0, 1, true);
          const y = map(d.a, -128, 127, 0, 1, true);
          const z = map(d.b, -128, 127, 0, 1, true);
          let position = new THREE.Vector3(x, y, z);
          // 存入每个点坐标位置
          points.push(position);
          // 创建球体材质
          let convexSphere = this.creatSphere(position, c);
          convexSphere.name = d.color;
          this.group.add(convexSphere);
        });
      });
      scene.add(this.group);
    },
    // 二层级切换
    secondLevelChange(val, flag = false) {
      if (!flag) {
        if (this.group.children.length > 0) this.group.clear();
        this.thirdLevelChange(this.thirdColorValue, true);
        this.firstLevelChange(this.firstColorValue, true);
      }
      val.forEach((item) => {
        let colorsData = secondLevel.filter((d) => d.parent === item);
        let points = [];
        colorsData.forEach((d, i) => {
          const c = colord({ l: d.l, a: d.a, b: d.b }).toHex();
          const x = map(d.l, 0, 100, 0, 1, true);
          const y = map(d.a, -128, 127, 0, 1, true);
          const z = map(d.b, -128, 127, 0, 1, true);
          let position = new THREE.Vector3(x, y, z);
          // 存入每个点坐标位置
          points.push(position);
          // 创建球体材质
          let convexSphere = this.creatSphere(position, c);
          convexSphere.name = d.color;
          this.group.add(convexSphere);
        });
        let convexGeoMesh = this.creatGeometry(points);
        this.group.add(convexGeoMesh);
      });
      scene.add(this.group);
    },
    // 三层级切换
    thirdLevelChange(val, flag = false) {
      if (!flag) {
        if (this.group.children.length > 0) this.group.clear();
        this.secondLevelChange(this.secondColorValue, true);
        this.firstLevelChange(this.firstColorValue, true);
      }
      val.forEach((item) => {
        let colorsData = thirdLevel.filter((d) => d.parent === item);
        let points = [];
        colorsData.forEach((d, i) => {
          const c = colord({ l: d.l, a: d.a, b: d.b }).toHex();
          const x = map(d.l, 0, 100, 0, 1, true);
          const y = map(d.a, -128, 127, 0, 1, true);
          const z = map(d.b, -128, 127, 0, 1, true);
          let position = new THREE.Vector3(x, y, z);
          // 存入每个点坐标位置
          points.push(position);
          // 创建球体材质
          let convexSphere = this.creatSphere(position, c);
          convexSphere.name = d.color;
          convexSphere.from = d.from;
          this.group.add(convexSphere);
        });
        let convexGeoMesh = this.creatGeometry(points);
        this.group.add(convexGeoMesh);
      });
      scene.add(this.group);
    },
    // 创建球体
    creatSphere(position, color) {
      const convexSphereGeo = new THREE.SphereGeometry(0.01);
      const convexSphereMat = new THREE.MeshBasicMaterial({
        color: color,
      });
      const convexSphere = new THREE.Mesh(convexSphereGeo, convexSphereMat);
      convexSphere.position.copy(position);
      return convexSphere;
    },
    // 创建几何体
    creatGeometry(points) {
      // 创建凹凸几何体
      var convexGeo = new ConvexGeometry(points);
      let p = [];
      // 存入顶点位置
      convexGeo.attributes.position.array.forEach((i) => {
        p.push(i);
      });
      const size = 3; // 每个子数组的长度
      const result = [];
      // 每3个拆成二维数组，取出每个顶点的x,y,z坐标
      for (let i = 0; i < p.length; i += size) {
        result.push(p.slice(i, i + size));
      }
      let colors = [];
      // 每个lab值转换成着色器需要的格式
      result.forEach((i) => {
        let l = map(i[0], 0, 1, 0, 100, true);
        let a = map(i[1], 0, 1, -128, 127, true);
        let b = map(i[2], 0, 1, -128, 127, true);
        let c = colord({ l: l, a: a, b: b }).toHex();
        colors = colors.concat(this.colorToRgb(c));
      });

      // 给凹凸几何体增加color属性
      convexGeo.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );
      if (!this.status) {
        // 着色器
        var material = new THREE.ShaderMaterial({
          vertexShader: `
          varying vec2 vUv;
          varying vec3 vColor;
          attribute vec3 color;
          void main() {
              vColor = color;
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
      `,
          fragmentShader: `
          varying vec2 vUv;
          varying vec3 vColor;
          void main() {
            gl_FragColor=vec4(vColor, 1.0); //最后设置顶点颜色，点与点之间会自动插值
          }
      `,
        });
        // 创建一个网格，将凹凸体和GLSL着色器结合起来
        return new THREE.Mesh(convexGeo, material);
      } else {
        // 给凹凸几何体增加color属性
        convexGeo.setAttribute(
          "color",
          new THREE.Float32BufferAttribute(colors, 3)
        );
        const testM = new THREE.MeshBasicMaterial({
          wireframe: true,
        });
        return new THREE.Mesh(convexGeo, testM);
      }
    },
    // 处理数据给下拉框
    formatData(data) {
      let op = [];
      data.forEach((d) => {
        let name = d.parent.replace(/\r\n/, "");
        if (name) op.push(name);
      });
      op = Array.from(new Set(op));
      return op;
    },
    colorToRgb(sColor) {
      sColor = sColor.toLowerCase();
      //十六进制颜色值的正则表达式
      var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
      // 如果是16进制颜色
      if (sColor && reg.test(sColor)) {
        if (sColor.length === 4) {
          var sColorNew = "#";
          for (var i = 1; i < 4; i += 1) {
            sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
          }
          sColor = sColorNew;
        }
        //处理六位的颜色值
        var sColorChange = [];
        for (var i = 1; i < 7; i += 2) {
          sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)) / 255);
        }
        return sColorChange;
      }
      return sColor;
    },
    statusChange() {
      if (this.group.children.length > 0) this.group.clear();
      this.firstLevelChange(this.firstColorValue, true);
      this.secondLevelChange(this.secondColorValue, true);
      this.thirdLevelChange(this.thirdColorValue, true);
    },
  },
  created() {
    this.group = new THREE.Group(); // 创建group管理所有几何体和点
    this.firstLevelList = this.formatData(firstLevel);
    this.secondLevelList = this.formatData(secondLevel);
    this.thirdLevelList = this.formatData(thirdLevel);
  },
});
