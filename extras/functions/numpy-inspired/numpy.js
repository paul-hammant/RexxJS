'use strict';

/*
 Consolidated NumPy-inspired utilities (creation, manipulation, stats, random, linalg)
 Implemented with focus on 1D/2D and common numpy-like behaviors. No external deps.
*/

// --- Creation & basic utilities ---
function normalizeShape(shape) {
  if (shape === undefined || shape === null) return [];
  if (typeof shape === 'number') return [shape];
  if (!Array.isArray(shape)) throw new Error('shape must be a number or an array of numbers');
  return shape.slice();
}

function buildArray(shape, fillValue) {
  if (!shape || shape.length === 0) return fillValue;
  const [first, ...rest] = shape;
  const arr = new Array(first);
  for (let i = 0; i < first; i++) arr[i] = buildArray(rest, fillValue);
  return arr;
}

function zeros(shape) { return buildArray(normalizeShape(shape), 0); }
function ones(shape) { return buildArray(normalizeShape(shape), 1); }
function full(shape, fillValue) { return buildArray(normalizeShape(shape), fillValue); }

function eye(n) {
  const m = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    row[i] = 1;
    m.push(row);
  }
  return m;
}
function identity(n) { return eye(n); }

function isPlainArray(a) { return Array.isArray(a); }

function deepClone(a) {
  if (!isPlainArray(a)) return a;
  return a.map((x) => deepClone(x));
}

function array(input) {
  return deepClone(input);
}
function asarray(input) { return array(input); }

function arange(start, stop, step) {
  let s, e;
  if (stop === undefined) { s = 0; e = start; }
  else { s = start; e = stop; }
  if (step === undefined) step = 1;
  if (step === 0) throw new Error('arange() step must not be zero');
  const result = [];
  if (step > 0) {
    for (let v = s; v < e; v = Number((v + step).toPrecision(12))) result.push(Number(v.toPrecision ? v.toPrecision(12) : v));
  } else {
    for (let v = s; v > e; v = Number((v + step).toPrecision(12))) result.push(Number(v.toPrecision ? v.toPrecision(12) : v));
  }
  return result;
}

function linspace(start, stop, num = 50, endpoint = true) {
  if (num <= 0) return [];
  if (num === 1) return [start];
  const result = new Array(num);
  const div = endpoint ? (num - 1) : num;
  const step = (stop - start) / div;
  for (let i = 0; i < num; i++) result[i] = Number((start + step * i).toPrecision(12));
  if (endpoint) result[num - 1] = stop;
  return result;
}

function logspace(start, stop, num = 50, endpoint = true, base = 10) {
  const linValues = linspace(start, stop, num, endpoint);
  return linValues.map(v => Math.pow(base, v));
}

function empty(shape) {
  // Create uninitialized array (filled with undefined)
  return buildArray(normalizeShape(shape), undefined);
}

function shape(arr) {
  const s = [];
  let cur = arr;
  while (Array.isArray(cur)) { s.push(cur.length); cur = cur[0]; }
  return s;
}

function ravel(arr) {
  const out = [];
  (function recurse(a) {
    if (!Array.isArray(a)) out.push(a);
    else for (let i = 0; i < a.length; i++) recurse(a[i]);
  })(arr);
  return out;
}
const flatten = ravel;

function reshape(arr, newShape) {
  const ns = normalizeShape(newShape);
  const flat = ravel(arr);
  const expectedSize = ns.reduce((a,b)=>a*b, 1);
  if (flat.length !== expectedSize) throw new Error(`Cannot reshape array of size ${flat.length} into shape ${ns}`);
  let idx = 0;
  function build(s) {
    if (!s || s.length === 0) return flat[idx++];
    const [first, ...rest] = s;
    const out = new Array(first);
    for (let i = 0; i < first; i++) out[i] = build(rest);
    return out;
  }
  return build(ns);
}

function transpose(arr, axes) {
  if (!Array.isArray(arr)) return arr;
  const arrShape = shape(arr);
  if (!axes) axes = Array.from({length: arrShape.length}, (_,i)=>i).reverse();
  if (axes.length !== arrShape.length) throw new Error('axes length must match dimensionality');
  function getValueAt(a, idx) { let cur = a; for (let k=0;k<idx.length;k++) cur = cur[idx[k]]; return cur; }
  const newShape = axes.map(ax => arrShape[ax]);
  function build(idxPrefix) {
    const dim = idxPrefix.length;
    if (dim === newShape.length) {
      const srcIdx = new Array(newShape.length);
      for (let i = 0; i < newShape.length; i++) srcIdx[axes[i]] = idxPrefix[i];
      return getValueAt(arr, srcIdx);
    }
    const out = new Array(newShape[dim]);
    for (let i = 0; i < newShape[dim]; i++) out[i] = build(idxPrefix.concat(i));
    return out;
  }
  return build([]);
}

function concatenate(arrays, axis = 0) {
  if (!Array.isArray(arrays) || arrays.length === 0) return [];
  const baseShape = shape(arrays[0]);
  const rank = baseShape.length;
  if (axis < 0 || axis >= Math.max(1, rank)) throw new Error('axis out of bounds');
  if (axis === 0) return arrays.reduce((acc,a)=>acc.concat(a), []);
  function recurseConcat(list, ax) {
    if (ax === 0) return list.reduce((acc,a)=>acc.concat(a), []);
    const length = list[0].length;
    const out = new Array(length);
    for (let i = 0; i < length; i++) {
      const sublist = list.map(arr => arr[i]);
      out[i] = recurseConcat(sublist, ax - 1);
    }
    return out;
  }
  return recurseConcat(arrays, axis);
}

// --- Manipulation ---
function stack(arrays, axis = 0) {
  if (!Array.isArray(arrays) || arrays.length === 0) return [];
  const sh = shape(arrays[0]);
  const rank = sh.length + 1;
  if (axis < 0) axis = rank + axis;
  if (sh.length === 1 && axis === 0) return arrays.reduce((acc,a)=>acc.concat([a]), []);
  if (sh.length === 1 && axis === 1) {
    const len = arrays[0].length; const out = new Array(len);
    for (let i=0;i<len;i++) out[i] = arrays.map(a=>a[i]);
    return out;
  }
  if (sh.length === 2 && axis === 0) return arrays.reduce((acc,a)=>acc.concat(a), []);
  // Fallback: simple weave
  const newShape = sh.slice(); newShape.splice(axis, 0, arrays.length);
  const flat = arrays.map(a=>ravel(a));
  const elemCount = flat[0].length;
  const outFlat = [];
  for (let i=0;i<elemCount;i++) for (let s=0;s<flat.length;s++) outFlat.push(flat[s][i]);
  return reshape(outFlat, newShape);
}
function vstack(arrays) { return stack(arrays, 0); }
function hstack(arrays) { const sh = shape(arrays[0]); if (sh.length<=1) return concatenate(arrays,0); return concatenate(arrays,1); }

function tile(A, reps) {
  if (typeof reps === 'number') reps = [reps];
  if (!Array.isArray(reps)) throw new Error('reps must be number or array');
  const s = shape(A);
  if (s.length === 0) { const out = []; const n = reps[0]||1; for (let i=0;i<n;i++) out.push(A); return out; }
  if (s.length === 1) { const times = reps[0]||1; let res=[]; for (let i=0;i<times;i++) res = res.concat(A); return res; }
  if (s.length === 2) { const [r,c]=s; const repR = reps[0]||1; const repC = reps[1]||1; const out=[]; for (let rr=0;rr<repR;rr++){ for (let i=0;i<r;i++){ const row=[]; for (let rc=0;rc<repC;rc++) row.push(...A[i]); out.push(row); } } return out; }
  throw new Error('tile supports up to 2D arrays');
}

function repeat(A, repeats, axis) {
  if (axis === undefined) { const flat = ravel(A); const out = []; for (let i=0;i<flat.length;i++) for (let r=0;r<repeats;r++) out.push(flat[i]); return out; }
  const s = shape(A);
  if (s.length === 2 && axis === 0) { const out=[]; for (let i=0;i<A.length;i++) for (let r=0;r<repeats;r++) out.push(A[i].slice()); return out; }
  if (s.length === 2 && axis === 1) return A.map(row=>{ const nr=[]; for (let j=0;j<row.length;j++) for (let r=0;r<repeats;r++) nr.push(row[j]); return nr; });
  throw new Error('repeat unsupported shape/axis');
}

function append(arr, values, axis = 0) {
  if (!Array.isArray(arr)) return [].concat(arr).concat(values);
  const s = shape(arr);
  if (s.length === 1 || axis === 0) return arr.concat(values);
  if (s.length === 2 && axis === 1) {
    if (!Array.isArray(values)) throw new Error('values must be array for axis=1');
    return arr.map((row, idx)=> row.concat(values[idx] !== undefined ? values[idx] : values));
  }
  throw new Error('append unsupported axis/shape');
}

function insert(arr, index, values, axis = 0) {
  if (!Array.isArray(arr)) { const a=[].concat(arr); const left=a.slice(0,index); const right = a.slice(index); return left.concat(values).concat(right); }
  if (axis === 0) { const left = arr.slice(0,index); const right = arr.slice(index); return left.concat([].concat(values)).concat(right); }
  throw new Error('insert supports axis 0 only');
}

function delete_(arr, idx) {
  if (!Array.isArray(arr)) return arr;
  if (Array.isArray(idx)) return arr.filter((_,i)=>idx.indexOf(i)===-1);
  return arr.slice(0, idx).concat(arr.slice(idx+1));
}

function flip(arr, axis) {
  const s = shape(arr);
  if (s.length === 0) return arr;
  if (axis === undefined) return arr.slice().reverse();
  if (axis < 0) axis = s.length + axis;
  if (s.length === 1 && axis === 0) return arr.slice().reverse();
  if (s.length === 2) { if (axis === 0) return arr.slice().reverse(); if (axis === 1) return arr.map(row=>row.slice().reverse()); }
  function rev(a, depth, current) { if (depth===current) return a.slice().reverse(); return a.map(sub=>rev(sub, depth, current+1)); }
  return rev(arr, axis, 0);
}
function fliplr(arr) { const s = shape(arr); if (s.length!==2) throw new Error('fliplr requires 2D'); return arr.map(row=>row.slice().reverse()); }
function flipud(arr) { const s = shape(arr); if (s.length!==2) throw new Error('flipud requires 2D'); return arr.slice().reverse(); }

function roll(arr, shift, axis=0) {
  const s = shape(arr);
  if (s.length===0) return arr;
  if (axis<0) axis = s.length + axis;
  if (s.length===1 && axis===0) { const n=arr.length; const k=((shift%n)+n)%n; return arr.slice(-k).concat(arr.slice(0,n-k)); }
  if (s.length===2 && axis===0) return arr.slice(-shift).concat(arr.slice(0, arr.length-shift));
  if (s.length===2 && axis===1) return arr.map(row=>{ const n=row.length; const k=((shift%n)+n)%n; return row.slice(-k).concat(row.slice(0,n-k)); });
  throw new Error('roll unsupported');
}

function meshgrid(...vectors) {
  if (vectors.length===0) return [];
  if (vectors.length===1) return [vectors[0].slice()];
  if (vectors.length===2) {
    const [xv,yv]=vectors; const nx=xv.length, ny=yv.length; const X=new Array(ny), Y=new Array(ny);
    for (let i=0;i<ny;i++){ X[i]=new Array(nx); Y[i]=new Array(nx); for (let j=0;j<nx;j++){ X[i][j]=xv[j]; Y[i][j]=yv[i]; } }
    return [X,Y];
  }
  // ND naive
  const dims = vectors.map(v=>v.length);
  const idxGrids=[];
  function buildGrid(prefix, depth){ if (depth===dims.length){ idxGrids.push(prefix.slice()); return; } for (let i=0;i<dims[depth];i++){ prefix.push(i); buildGrid(prefix, depth+1); prefix.pop(); } }
  buildGrid([],0);
  function unflattenToShape(arr, s){ if (s.length===0) return arr[0]; let idx=0; function build(d){ const n=s[d]; const out=new Array(n); for (let i=0;i<n;i++){ if (d===s.length-1) out[i]=arr[idx++]; else out[i]=build(d+1); } return out; } return build(0); }
  const grids = vectors.map((vec, axis)=>{ const vals = idxGrids.map(idx => vec[idx[axis]]); return unflattenToShape(vals, dims); });
  return grids;
}

function split(arr, indices_or_sections, axis = 0) {
  const s = shape(arr);
  if (s.length === 1 && axis === 0) {
    if (typeof indices_or_sections === 'number') {
      const sections = indices_or_sections;
      const sectionSize = Math.ceil(arr.length / sections);
      const result = [];
      for (let i = 0; i < sections; i++) {
        const start = i * sectionSize;
        const end = Math.min(start + sectionSize, arr.length);
        result.push(arr.slice(start, end));
      }
      return result;
    } else {
      const indices = Array.isArray(indices_or_sections) ? indices_or_sections : [indices_or_sections];
      const result = [];
      let start = 0;
      for (const idx of indices) {
        result.push(arr.slice(start, idx));
        start = idx;
      }
      result.push(arr.slice(start));
      return result;
    }
  }
  throw new Error('split: only 1D arrays supported');
}

function hsplit(arr, indices_or_sections) {
  const s = shape(arr);
  if (s.length === 2) return split(arr, indices_or_sections, 1);
  throw new Error('hsplit requires 2D array');
}

function vsplit(arr, indices_or_sections) {
  const s = shape(arr);
  if (s.length === 2) return split(arr, indices_or_sections, 0);
  throw new Error('vsplit requires 2D array');
}

function resize(arr, newShape) {
  const ns = normalizeShape(newShape);
  const flat = ravel(arr);
  const expectedSize = ns.reduce((a,b)=>a*b, 1);
  
  // Repeat or truncate the flattened array to match expected size
  const newFlat = new Array(expectedSize);
  for (let i = 0; i < expectedSize; i++) {
    newFlat[i] = flat[i % flat.length];
  }
  
  return reshape(newFlat, ns);
}

// --- Stats ---
function _sortedFlat(a){ const flat = ravel(a).slice(); flat.sort((x,y)=>x-y); return flat; }
function amin(a){ const f=ravel(a); if (f.length===0) return undefined; return f.reduce((m,v)=>(v<m?v:m), f[0]); }
function amax(a){ const f=ravel(a); if (f.length===0) return undefined; return f.reduce((m,v)=>(v>m?v:m), f[0]); }
function ptp(a){ return amax(a)-amin(a); }
function mean(a){ const f=ravel(a); if (f.length===0) return NaN; return f.reduce((s,v)=>s+v,0)/f.length; }
function var_(a, ddof=0){ const f=ravel(a); const m=mean(f); const n=f.length; if (n-ddof<=0) return NaN; return f.reduce((s,x)=>s+(x-m)*(x-m),0)/(n-ddof); }
function std(a, ddof=0){ return Math.sqrt(var_(a, ddof)); }
function median(a){ const s=_sortedFlat(a); const n=s.length; if (n===0) return undefined; const mid=Math.floor(n/2); if (n%2===1) return s[mid]; return (s[mid-1]+s[mid])/2; }
function percentile(a, q){ const s=_sortedFlat(a); if (s.length===0) return undefined; const rank=(q/100)*(s.length-1); const lo=Math.floor(rank); const hi=Math.ceil(rank); if (lo===hi) return s[lo]; const frac=rank-lo; return s[lo]*(1-frac)+s[hi]*frac; }
function quantile(a, q){ if (q<=1) return percentile(a, q*100); return percentile(a, q); }
function histogram(a, bins=10, range) {
  const flat = ravel(a); if (flat.length===0) return {bins:[], counts:[]};
  let min = Math.min(...flat); let max = Math.max(...flat);
  if (range) { min = range[0]; max = range[1]; }
  if (min===max) { const counts=new Array(bins).fill(0); counts[0]=flat.length; const edges=[min,max]; return {bins:edges, counts}; }
  const binCounts=new Array(bins).fill(0); const binWidth=(max-min)/bins;
  for (let v of flat){ if (v<min || v>max) continue; let idx=Math.floor((v-min)/binWidth); if (idx===bins) idx=bins-1; binCounts[idx]++; }
  const edges=new Array(bins+1); for (let i=0;i<=bins;i++) edges[i]=min+i*binWidth; return {bins:edges, counts:binCounts};
}

function histogram2d(x, y, bins=[10, 10], range=null) {
  if (x.length !== y.length) throw new Error('x and y must have same length');
  
  const xBins = typeof bins === 'number' ? bins : bins[0];
  const yBins = typeof bins === 'number' ? bins : bins[1];
  
  let xMin = Math.min(...x), xMax = Math.max(...x);
  let yMin = Math.min(...y), yMax = Math.max(...y);
  
  if (range) {
    if (range[0]) { xMin = range[0][0]; xMax = range[0][1]; }
    if (range[1]) { yMin = range[1][0]; yMax = range[1][1]; }
  }
  
  const hist = new Array(yBins);
  for (let i = 0; i < yBins; i++) {
    hist[i] = new Array(xBins).fill(0);
  }
  
  const xWidth = (xMax - xMin) / xBins;
  const yWidth = (yMax - yMin) / yBins;
  
  for (let i = 0; i < x.length; i++) {
    if (x[i] < xMin || x[i] > xMax || y[i] < yMin || y[i] > yMax) continue;
    let xIdx = Math.floor((x[i] - xMin) / xWidth);
    let yIdx = Math.floor((y[i] - yMin) / yWidth);
    if (xIdx === xBins) xIdx = xBins - 1;
    if (yIdx === yBins) yIdx = yBins - 1;
    hist[yIdx][xIdx]++;
  }
  
  const xEdges = new Array(xBins + 1);
  const yEdges = new Array(yBins + 1);
  for (let i = 0; i <= xBins; i++) xEdges[i] = xMin + i * xWidth;
  for (let i = 0; i <= yBins; i++) yEdges[i] = yMin + i * yWidth;
  
  return { hist, xEdges, yEdges };
}

// --- Random ---
let _seed = 0x9e3779b1;
function mulberry32(a){ let t=a>>>0; return function(){ t += 0x6D2B79F5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
let _rand = mulberry32(_seed);
function seed(s){ _seed = s>>>0; _rand = mulberry32(_seed); }
function rand(...shapeArgs){ if (shapeArgs.length===0) return _rand(); if (shapeArgs.length===1){ const n=shapeArgs[0]; const out=new Array(n); for (let i=0;i<n;i++) out[i]=_rand(); return out; } const [first,...rest]=shapeArgs; const out=new Array(first); for (let i=0;i<first;i++) out[i]=rand(...rest); return out; }
function randint(low, high, size){ if (high===undefined){ high=low; low=0; } if (size===undefined) return Math.floor(_rand()*(high-low))+low; if (typeof size==='number'){ const arr=new Array(size); for (let i=0;i<size;i++) arr[i]=randint(low,high); return arr; } if (Array.isArray(size)){ const [first,...rest]=size; const out=new Array(first); for (let i=0;i<first;i++) out[i]=randint(low,high, rest.length?rest:undefined); return out; } return Math.floor(_rand()*(high-low))+low; }
function choice(array, size=1, replace=true){ if (!Array.isArray(array)) throw new Error('choice requires array'); if (size===1) return array[Math.floor(_rand()*array.length)]; const out=new Array(size); if (replace){ for (let i=0;i<size;i++) out[i]=array[Math.floor(_rand()*array.length)]; return out; } const copy=array.slice(); for (let i=copy.length-1;i>0;i--){ const j=Math.floor(_rand()*(i+1)); const tmp=copy[i]; copy[i]=copy[j]; copy[j]=tmp; } return copy.slice(0,size); }
function shuffle(array){ for (let i=array.length-1;i>0;i--){ const j=Math.floor(_rand()*(i+1)); const tmp=array[i]; array[i]=array[j]; array[j]=tmp; } return array; }
function permutation(arg){ let arr; if (typeof arg==='number'){ arr=new Array(arg); for (let i=0;i<arg;i++) arr[i]=i; } else arr=Array.from(arg); return shuffle(arr.slice()); }
function normal(meanVal=0, sd=1, size) { function one(){ const u1=_rand()||1e-16; const u2=_rand(); const z0=Math.sqrt(-2.0*Math.log(u1))*Math.cos(2.0*Math.PI*u2); return z0*sd+meanVal; } if (size===undefined) return one(); if (typeof size==='number'){ const out=new Array(size); for (let i=0;i<size;i++) out[i]=one(); return out; } throw new Error('normal: only scalar or 1D size supported'); }

function randn(...shapeArgs) { 
  if (shapeArgs.length===0) { const u1=_rand()||1e-16; const u2=_rand(); return Math.sqrt(-2.0*Math.log(u1))*Math.cos(2.0*Math.PI*u2); }
  if (shapeArgs.length===1){ const n=shapeArgs[0]; const out=new Array(n); for (let i=0;i<n;i++) out[i]=randn(); return out; } 
  const [first,...rest]=shapeArgs; const out=new Array(first); for (let i=0;i<first;i++) out[i]=randn(...rest); return out; 
}

function uniform(low=0, high=1, size) {
  function one() { return low + _rand() * (high - low); }
  if (size===undefined) return one();
  if (typeof size==='number'){ const out=new Array(size); for (let i=0;i<size;i++) out[i]=one(); return out; }
  if (Array.isArray(size)){ const [first,...rest]=size; const out=new Array(first); for (let i=0;i<first;i++) out[i]=uniform(low,high, rest.length?rest:undefined); return out; }
  return one();
}

// --- Mathematical functions ---
function sin(x) { if (Array.isArray(x)) return x.map(sin); return Math.sin(x); }
function cos(x) { if (Array.isArray(x)) return x.map(cos); return Math.cos(x); }
function tan(x) { if (Array.isArray(x)) return x.map(tan); return Math.tan(x); }
function arcsin(x) { if (Array.isArray(x)) return x.map(arcsin); return Math.asin(x); }
function arccos(x) { if (Array.isArray(x)) return x.map(arccos); return Math.acos(x); }
function arctan(x) { if (Array.isArray(x)) return x.map(arctan); return Math.atan(x); }

function sinh(x) { if (Array.isArray(x)) return x.map(sinh); return Math.sinh(x); }
function cosh(x) { if (Array.isArray(x)) return x.map(cosh); return Math.cosh(x); }
function tanh(x) { if (Array.isArray(x)) return x.map(tanh); return Math.tanh(x); }

function arcsinh(x) { if (Array.isArray(x)) return x.map(arcsinh); return Math.asinh(x); }
function arccosh(x) { if (Array.isArray(x)) return x.map(arccosh); return Math.acosh(x); }
function arctanh(x) { if (Array.isArray(x)) return x.map(arctanh); return Math.atanh(x); }

function exp(x) { if (Array.isArray(x)) return x.map(exp); return Math.exp(x); }
function log(x) { if (Array.isArray(x)) return x.map(log); return Math.log(x); }
function log10(x) { if (Array.isArray(x)) return x.map(log10); return Math.log10(x); }
function log2(x) { if (Array.isArray(x)) return x.map(log2); return Math.log2(x); }
function sqrt(x) { if (Array.isArray(x)) return x.map(sqrt); return Math.sqrt(x); }
function square(x) { if (Array.isArray(x)) return x.map(square); return x * x; }
function cbrt(x) { if (Array.isArray(x)) return x.map(cbrt); return Math.cbrt(x); }

function expm1(x) { if (Array.isArray(x)) return x.map(expm1); return Math.expm1(x); }
function log1p(x) { if (Array.isArray(x)) return x.map(log1p); return Math.log1p(x); }

function floor(x) { if (Array.isArray(x)) return x.map(floor); return Math.floor(x); }
function ceil(x) { if (Array.isArray(x)) return x.map(ceil); return Math.ceil(x); }
function round_(x, decimals = 0) { 
  if (Array.isArray(x)) return x.map(v => round_(v, decimals)); 
  const mult = Math.pow(10, decimals);
  return Math.round(x * mult) / mult;
}
function trunc(x) { if (Array.isArray(x)) return x.map(trunc); return Math.trunc(x); }

function rint(x) { if (Array.isArray(x)) return x.map(rint); return Math.round(x); }
function fix(x) { if (Array.isArray(x)) return x.map(fix); return Math.trunc(x); }

function abs(x) { if (Array.isArray(x)) return x.map(abs); return Math.abs(x); }
function sign(x) { if (Array.isArray(x)) return x.map(sign); return Math.sign(x); }
function reciprocal(x) { if (Array.isArray(x)) return x.map(reciprocal); return 1 / x; }

function sum(a, axis = null) {
  if (axis === null) return ravel(a).reduce((s, v) => s + v, 0);
  const s = shape(a);
  if (s.length === 1) return ravel(a).reduce((s, v) => s + v, 0); // 1D array
  if (s.length === 2 && axis === 0) return a[0].map((_, j) => a.map(row => row[j]).reduce((s, v) => s + v, 0));
  if (s.length === 2 && axis === 1) return a.map(row => row.reduce((s, v) => s + v, 0));
  return ravel(a).reduce((s, v) => s + v, 0); // Fallback for other dimensions
}

function prod(a, axis = null) {
  if (axis === null) return ravel(a).reduce((p, v) => p * v, 1);
  const s = shape(a);
  if (s.length === 1) return ravel(a).reduce((p, v) => p * v, 1); // 1D array
  if (s.length === 2 && axis === 0) return a[0].map((_, j) => a.map(row => row[j]).reduce((p, v) => p * v, 1));
  if (s.length === 2 && axis === 1) return a.map(row => row.reduce((p, v) => p * v, 1));
  return ravel(a).reduce((p, v) => p * v, 1); // Fallback for other dimensions
}

function cumsum(a) {
  const flat = ravel(a);
  let cumulative = 0;
  return flat.map(v => cumulative += v);
}

function cumprod(a) {
  const flat = ravel(a);
  let cumulative = 1;
  return flat.map(v => cumulative *= v);
}

function diff(a, n = 1) {
  if (n <= 0) return a.slice();
  let result = a.slice();
  for (let i = 0; i < n; i++) {
    const newResult = [];
    for (let j = 1; j < result.length; j++) {
      newResult.push(result[j] - result[j - 1]);
    }
    result = newResult;
  }
  return result;
}

// Average with weights support
function average(a, weights = null) {
  const flat = ravel(a);
  if (!weights) return flat.reduce((s, v) => s + v, 0) / flat.length;
  const weightFlat = Array.isArray(weights) ? ravel(weights) : new Array(flat.length).fill(weights);
  if (flat.length !== weightFlat.length) throw new Error('average: arrays must be same length');
  const weightedSum = flat.reduce((s, v, i) => s + v * weightFlat[i], 0);
  const totalWeight = weightFlat.reduce((s, w) => s + w, 0);
  return weightedSum / totalWeight;
}

// Correlation coefficient matrix
function corrcoef(x, y = null) {
  if (y === null) {
    // x is 2D matrix - compute correlation matrix
    const s = shape(x);
    if (s.length !== 2) throw new Error('corrcoef: x must be 2D when y is null');
    const n = s[1];
    const corrMatrix = new Array(n);
    for (let i = 0; i < n; i++) {
      corrMatrix[i] = new Array(n);
      for (let j = 0; j < n; j++) {
        if (i === j) {
          corrMatrix[i][j] = 1;
        } else {
          const col1 = x.map(row => row[i]);
          const col2 = x.map(row => row[j]);
          corrMatrix[i][j] = _correlation(col1, col2);
        }
      }
    }
    return corrMatrix;
  } else {
    // x and y are 1D vectors
    return _correlation(x, y);
  }
}

function _correlation(x, y) {
  if (x.length !== y.length) throw new Error('correlation: arrays must be same length');
  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  
  let numerator = 0;
  let sumXSquares = 0;
  let sumYSquares = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    sumXSquares += dx * dx;
    sumYSquares += dy * dy;
  }
  
  const denominator = Math.sqrt(sumXSquares * sumYSquares);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Covariance matrix
function cov(x, y = null, ddof = 1) {
  if (y === null) {
    // x is 2D matrix - compute covariance matrix
    const s = shape(x);
    if (s.length !== 2) throw new Error('cov: x must be 2D when y is null');
    const n = s[1];
    const covMatrix = new Array(n);
    for (let i = 0; i < n; i++) {
      covMatrix[i] = new Array(n);
      for (let j = 0; j < n; j++) {
        const col1 = x.map(row => row[i]);
        const col2 = x.map(row => row[j]);
        covMatrix[i][j] = _covariance(col1, col2, ddof);
      }
    }
    return covMatrix;
  } else {
    // x and y are 1D vectors
    return _covariance(x, y, ddof);
  }
}

function _covariance(x, y, ddof = 1) {
  if (x.length !== y.length) throw new Error('covariance: arrays must be same length');
  const n = x.length;
  if (n - ddof <= 0) return NaN;
  
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  
  let covariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (x[i] - meanX) * (y[i] - meanY);
  }
  
  return covariance / (n - ddof);
}

// --- Linear algebra ---
function dot(a,b){ if (!Array.isArray(a) || !Array.isArray(b)) throw new Error('dot expects arrays'); if (!Array.isArray(a[0]) && !Array.isArray(b[0])){ if (a.length!==b.length) throw new Error('dot: vectors must be same length'); let s=0; for (let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; } if (Array.isArray(a[0]) && !Array.isArray(b[0])){ const rows=a.length; const out=new Array(rows); for (let i=0;i<rows;i++) out[i]=dot(a[i], b); return out; } if (!Array.isArray(a[0]) && Array.isArray(b[0])){ const cols=b[0].length; const out=new Array(cols).fill(0); for (let j=0;j<cols;j++){ for (let i=0;i<a.length;i++) out[j]+=a[i]*b[i][j]; } return out; } return matmul(a,b); }
const vdot = dot; const inner = dot;
function outer(u,v){ const out=new Array(u.length); for (let i=0;i<u.length;i++){ out[i]=new Array(v.length); for (let j=0;j<v.length;j++) out[i][j]=u[i]*v[j]; } return out; }
function matmul(A,B){ const m=A.length; const p=A[0].length; const p2=B.length; if (p!==p2) throw new Error('matmul: inner dimensions must agree'); const n=B[0].length; const C=new Array(m); for (let i=0;i<m;i++){ C[i]=new Array(n).fill(0); for (let k=0;k<p;k++){ const aik=A[i][k]; for (let j=0;j<n;j++) C[i][j]+=aik*B[k][j]; } } return C; }

function tensordot(a, b, axes = 2) {
  // Simplified version for common case
  if (typeof axes === 'number') {
    if (axes === 0) {
      // Outer product
      return outer(ravel(a), ravel(b));
    } else if (axes === 1) {
      // Standard dot product
      return dot(a, b);
    } else if (axes === 2) {
      // Double contraction (matrix multiplication)
      return matmul(a, b);
    }
  }
  throw new Error('tensordot: complex axes not supported');
}

function det(matrix) {
  // Determinant calculation for small matrices
  const n = matrix.length;
  if (n !== matrix[0].length) throw new Error('det: matrix must be square');
  
  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  
  if (n === 3) {
    const a = matrix[0][0], b = matrix[0][1], c = matrix[0][2];
    const d = matrix[1][0], e = matrix[1][1], f = matrix[1][2];
    const g = matrix[2][0], h = matrix[2][1], i = matrix[2][2];
    return a*(e*i - f*h) - b*(d*i - f*g) + c*(d*h - e*g);
  }
  
  // For larger matrices, use LU decomposition (simplified)
  let result = 1;
  const copy = matrix.map(row => row.slice());
  
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(copy[k][i]) > Math.abs(copy[maxRow][i])) {
        maxRow = k;
      }
    }
    
    if (maxRow !== i) {
      [copy[i], copy[maxRow]] = [copy[maxRow], copy[i]];
      result *= -1;
    }
    
    if (Math.abs(copy[i][i]) < 1e-10) return 0;
    
    result *= copy[i][i];
    
    for (let k = i + 1; k < n; k++) {
      const factor = copy[k][i] / copy[i][i];
      for (let j = i; j < n; j++) {
        copy[k][j] -= factor * copy[i][j];
      }
    }
  }
  
  return result;
}

function inv(matrix) {
  // Matrix inverse using Gauss-Jordan elimination
  const n = matrix.length;
  if (n !== matrix[0].length) throw new Error('inv: matrix must be square');
  
  // Create augmented matrix [A|I]
  const augmented = new Array(n);
  for (let i = 0; i < n; i++) {
    augmented[i] = new Array(2 * n);
    for (let j = 0; j < n; j++) {
      augmented[i][j] = matrix[i][j];
      augmented[i][j + n] = i === j ? 1 : 0;
    }
  }
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    if (maxRow !== i) {
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    }
    
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Matrix is singular and cannot be inverted');
    }
    
    // Scale pivot row
    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse matrix
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    result[i] = new Array(n);
    for (let j = 0; j < n; j++) {
      result[i][j] = augmented[i][j + n];
    }
  }
  
  return result;
}

function solve(A, b) {
  // Solve Ax = b using Gaussian elimination
  const n = A.length;
  if (n !== A[0].length) throw new Error('solve: A must be square');
  if (n !== b.length) throw new Error('solve: dimensions must match');
  
  // Create augmented matrix [A|b]
  const augmented = new Array(n);
  for (let i = 0; i < n; i++) {
    augmented[i] = new Array(n + 1);
    for (let j = 0; j < n; j++) {
      augmented[i][j] = A[i][j];
    }
    augmented[i][n] = b[i];
  }
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    if (maxRow !== i) {
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    }
    
    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error('Matrix is singular');
    }
    
    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }
  
  // Back substitution
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }
  
  return x;
}

function slogdet(matrix) {
  // Sign and log determinant
  const n = matrix.length;
  if (n !== matrix[0].length) throw new Error('slogdet: matrix must be square');
  
  let sign = 1;
  let logdet = 0;
  const copy = matrix.map(row => row.slice());
  
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(copy[k][i]) > Math.abs(copy[maxRow][i])) {
        maxRow = k;
      }
    }
    
    if (maxRow !== i) {
      [copy[i], copy[maxRow]] = [copy[maxRow], copy[i]];
      sign *= -1;
    }
    
    if (Math.abs(copy[i][i]) < 1e-15) {
      return { sign: 0, logdet: -Infinity };
    }
    
    if (copy[i][i] < 0) {
      sign *= -1;
    }
    
    logdet += Math.log(Math.abs(copy[i][i]));
    
    for (let k = i + 1; k < n; k++) {
      const factor = copy[k][i] / copy[i][i];
      for (let j = i; j < n; j++) {
        copy[k][j] -= factor * copy[i][j];
      }
    }
  }
  
  return { sign, logdet };
}

function eig(matrix) {
  // ⚠️ ALGORITHM LIMITATION WARNING ⚠️
  // This function uses power iteration with deflation, NOT QR decomposition like NumPy.
  // Expected differences from NumPy:
  // - Finds dominant REAL eigenvalues only (may miss complex eigenvalues)
  // - May return fewer eigenvalues than NumPy for complex cases
  // - Accuracy decreases for ill-conditioned matrices
  // - Perfect for small/simple matrices, limited for scientific computing
  // See EIGENVALUE_CAVEATS.md for full compatibility analysis.
  // For full NumPy compatibility, consider using PyOdide + real NumPy.
  
  // Eigenvalues and eigenvectors using power iteration and deflation
  
  // Handle REXX parameter passing - matrix might be a string that needs parsing
  if (typeof matrix === 'string') {
    try {
      matrix = JSON.parse(matrix);
    } catch (e) {
      throw new Error('eig: invalid matrix format - ' + e.message);
    }
  }
  
  if (!Array.isArray(matrix)) {
    throw new Error('eig: matrix must be an array or valid JSON array string');
  }
  
  const n = matrix.length;
  if (n !== matrix[0].length) throw new Error('eig: matrix must be square');
  
  const eigenvalues = [];
  const eigenvectors = [];
  const A = matrix.map(row => row.slice());
  
  // Simple implementation for small matrices only
  if (n > 4) throw new Error('eig: only supports matrices up to 4x4');
  
  for (let iter = 0; iter < n; iter++) {
    const { eigenvalue, eigenvector } = _powerIteration(A, 100, 1e-10);
    
    if (Math.abs(eigenvalue) < 1e-10) break;
    
    eigenvalues.push(eigenvalue);
    eigenvectors.push(eigenvector);
    
    // Deflate matrix (subtract rank-1 matrix)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        A[i][j] -= eigenvalue * eigenvector[i] * eigenvector[j];
      }
    }
  }
  
  return { eigenvalues, eigenvectors };
}

function _powerIteration(matrix, maxIter = 100, tol = 1e-10) {
  const n = matrix.length;
  let v = new Array(n).fill(1);
  let eigenvalue = 0;
  
  for (let iter = 0; iter < maxIter; iter++) {
    // v_new = A * v
    const v_new = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        v_new[i] += matrix[i][j] * v[j];
      }
    }
    
    // Calculate eigenvalue (Rayleigh quotient)
    const numerator = v.reduce((s, vi, i) => s + vi * v_new[i], 0);
    const denominator = v.reduce((s, vi) => s + vi * vi, 0);
    const newEigenvalue = numerator / denominator;
    
    // Normalize eigenvector
    const norm = Math.sqrt(v_new.reduce((s, vi) => s + vi * vi, 0));
    if (norm > 0) {
      for (let i = 0; i < n; i++) v_new[i] /= norm;
    }
    
    // Check convergence
    if (Math.abs(newEigenvalue - eigenvalue) < tol) {
      return { eigenvalue: newEigenvalue, eigenvector: v_new };
    }
    
    eigenvalue = newEigenvalue;
    v = v_new;
  }
  
  return { eigenvalue, eigenvector: v };
}

function eigh(matrix) {
  // ⚠️ ALGORITHM LIMITATION WARNING ⚠️ 
  // Uses power iteration, not LAPACK like NumPy. See EIGENVALUE_CAVEATS.md
  // For full NumPy compatibility, consider PyOdide + real NumPy.
  
  // For Hermitian (symmetric real) matrices, eigenvalues are real
  // and eigenvectors are orthogonal
  
  // Handle REXX parameter passing
  if (typeof matrix === 'string') {
    try {
      matrix = JSON.parse(matrix);
    } catch (e) {
      throw new Error('eigh: invalid matrix format - ' + e.message);
    }
  }
  
  if (!Array.isArray(matrix)) {
    throw new Error('eigh: matrix must be an array or valid JSON array string');
  }
  
  const n = matrix.length;
  if (n !== matrix[0].length) throw new Error('eigh: matrix must be square');
  
  // Check if matrix is symmetric
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-10) {
        throw new Error('eigh: matrix must be symmetric');
      }
    }
  }
  
  // Use the same algorithm as eig but ensure real eigenvalues
  const result = eig(matrix);
  
  // Ensure eigenvalues are real for symmetric matrix
  const eigenvalues = result.eigenvalues.map(val => 
    typeof val === 'number' ? val : val.real || 0
  );
  
  return { eigenvalues, eigenvectors: result.eigenvectors };
}

function eigvals(matrix) {
  // ⚠️ ALGORITHM LIMITATION WARNING ⚠️ 
  // Uses power iteration, not QR decomposition like NumPy. See EIGENVALUE_CAVEATS.md
  // For full NumPy compatibility, consider PyOdide + real NumPy.
  
  // Get only eigenvalues (not eigenvectors)
  // Note: eig() already handles string parsing, so we can call it directly
  const result = eig(matrix);
  return result.eigenvalues;
}

function pinv(matrix, rcond = 1e-15) {
  // Moore-Penrose pseudo-inverse using SVD approximation
  const m = matrix.length;
  const n = matrix[0].length;
  
  // For simple cases, use direct calculation
  if (m === n) {
    try {
      return inv(matrix);
    } catch (e) {
      // Matrix is singular, continue with pseudo-inverse
    }
  }
  
  // Simplified pseudo-inverse for rectangular matrices
  // pinv(A) = (A^T * A)^-1 * A^T  for overdetermined (m > n)
  // pinv(A) = A^T * (A * A^T)^-1  for underdetermined (m < n)
  
  const AT = transpose(matrix);
  
  if (m >= n) {
    // Overdetermined: pinv(A) = (A^T * A)^-1 * A^T
    const ATA = matmul(AT, matrix);
    try {
      const ATA_inv = inv(ATA);
      return matmul(ATA_inv, AT);
    } catch (e) {
      throw new Error('pinv: matrix is rank deficient');
    }
  } else {
    // Underdetermined: pinv(A) = A^T * (A * A^T)^-1
    const AAT = matmul(matrix, AT);
    try {
      const AAT_inv = inv(AAT);
      return matmul(AT, AAT_inv);
    } catch (e) {
      throw new Error('pinv: matrix is rank deficient');
    }
  }
}

function lstsq(A, b, rcond = null) {
  // Least squares solution using normal equations
  const m = A.length;
  const n = A[0].length;
  
  if (m !== b.length) throw new Error('lstsq: dimensions must match');
  
  // For overdetermined systems (m >= n): x = (A^T * A)^-1 * A^T * b
  if (m >= n) {
    const AT = transpose(A);
    const ATA = matmul(AT, A);
    const ATb = dot(AT, b);
    
    try {
      const x = solve(ATA, ATb);
      
      // Calculate residual
      const residual = dot(A, x).map((val, i) => val - b[i]);
      const residualSum = residual.reduce((s, r) => s + r * r, 0);
      
      return {
        x,
        residuals: [residualSum],
        rank: n, // Simplified rank estimation
        s: [] // Singular values not computed in this simplified version
      };
    } catch (e) {
      throw new Error('lstsq: matrix is rank deficient');
    }
  } else {
    // Underdetermined system: use minimum norm solution
    const pinvA = pinv(A);
    const x = dot(pinvA, b);
    
    return {
      x,
      residuals: [],
      rank: m,
      s: []
    };
  }
}

const numpyFunctions = {
  // Detection function for REQUIRE system
  'NUMPY_MAIN': () => ({
    type: 'library_info',
    name: 'NumPy-inspired Functions',
    version: '1.0.0',
    loaded: true
  }),
  
  // creation functions (both lowercase and uppercase for compatibility)
  zeros, ones, full, eye, identity, array, asarray, arange, linspace, logspace, empty, shape, ravel, flatten, reshape, transpose, concatenate,
  'ZEROS': zeros, 'ONES': ones, 'FULL': full, 'EYE': eye, 'IDENTITY': identity, 
  'ARRAY': array, 'ASARRAY': asarray, 'ARANGE': arange, 'LINSPACE': linspace, 'LOGSPACE': logspace, 'EMPTY': empty,
  'SHAPE': shape, 'RAVEL': ravel, 'FLATTEN': flatten, 'RESHAPE': reshape, 
  'TRANSPOSE': transpose, 'CONCATENATE': concatenate,
  
  // manipulation
  stack, vstack, hstack, tile, repeat, append, insert, delete: delete_, flip, fliplr, flipud, roll, meshgrid,
  split, hsplit, vsplit, resize,
  'STACK': stack, 'VSTACK': vstack, 'HSTACK': hstack, 'TILE': tile, 'REPEAT': repeat, 
  'APPEND': append, 'INSERT': insert, 'DELETE': delete_, 'FLIP': flip, 
  'FLIPLR': fliplr, 'FLIPUD': flipud, 'ROLL': roll, 'MESHGRID': meshgrid,
  'SPLIT': split, 'HSPLIT': hsplit, 'VSPLIT': vsplit, 'RESIZE': resize,
  
  // math functions
  sin, cos, tan, arcsin, arccos, arctan, sinh, cosh, tanh, arcsinh, arccosh, arctanh,
  exp, log, log10, log2, sqrt, square, cbrt, expm1, log1p,
  floor, ceil, around: round_, trunc, abs, sign, reciprocal, rint, fix,
  sum, prod, cumsum, cumprod, diff, average, corrcoef, cov,
  'SIN': sin, 'COS': cos, 'TAN': tan, 'ARCSIN': arcsin, 'ARCCOS': arccos, 'ARCTAN': arctan,
  'SINH': sinh, 'COSH': cosh, 'TANH': tanh, 'ARCSINH': arcsinh, 'ARCCOSH': arccosh, 'ARCTANH': arctanh,
  'EXP': exp, 'LOG': log, 'LOG10': log10, 'LOG2': log2, 'SQRT': sqrt, 'SQUARE': square, 'CBRT': cbrt,
  'EXPM1': expm1, 'LOG1P': log1p,
  'FLOOR': floor, 'CEIL': ceil, 'AROUND': round_, 'TRUNC': trunc, 'ABS': abs, 'SIGN': sign, 'RECIPROCAL': reciprocal,
  'RINT': rint, 'FIX': fix,
  'SUM': sum, 'PROD': prod, 'CUMSUM': cumsum, 'CUMPROD': cumprod, 'DIFF': diff, 'AVERAGE': average, 
  'CORRCOEF': corrcoef, 'COV': cov,
  
  // stats
  amin, amax, ptp, percentile, quantile, median, mean, var: var_, std, histogram, histogram2d,
  'AMIN': amin, 'AMAX': amax, 'PTP': ptp, 'PERCENTILE': percentile, 
  'QUANTILE': quantile, 'MEDIAN': median, 'MEAN': mean, 'VAR': var_, 
  'STD': std, 'HISTOGRAM': histogram, 'HISTOGRAM2D': histogram2d,
  
  // random
  seed, rand, randint, choice, shuffle, permutation, normal, randn, uniform,
  'SEED': seed, 'RAND': rand, 'RANDINT': randint, 'CHOICE': choice, 
  'SHUFFLE': shuffle, 'PERMUTATION': permutation, 'NORMAL': normal, 'RANDN': randn, 'UNIFORM': uniform,
  
  // linalg
  dot, vdot, inner, outer, matmul, tensordot, det, inv, solve, slogdet, eig, eigh, eigvals, pinv, lstsq,
  'DOT': dot, 'VDOT': vdot, 'INNER': inner, 'OUTER': outer, 'MATMUL': matmul,
  'TENSORDOT': tensordot, 'DET': det, 'INV': inv, 'SOLVE': solve,
  'SLOGDET': slogdet, 'EIG': eig, 'EIGH': eigh, 'EIGVALS': eigvals, 'PINV': pinv, 'LSTSQ': lstsq,
};

// Export for both Node.js and browser (following project pattern)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = numpyFunctions;
} else if (typeof window !== 'undefined') {
  // Put functions directly in window scope for browser access
  Object.assign(window, numpyFunctions);
  window.numpy = numpyFunctions; // Also available as window.numpy
}