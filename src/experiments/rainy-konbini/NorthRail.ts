import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {northAnnex,northY} from './NorthTerrain';
import {railTrench,stationTrackX,westRailRun,type RailPoint} from './WestRailLayout';
import {seat} from './Seats';

const trackCenters=[stationTrackX,-19.17];
const railFence=northAnnex.railEdge;
const bodyWhite='#d7ded9',stripe='#3766a3',glass='#38566c';

type Section=[z:number,width:number,bottom:number,shoulder:number,roof:number];

function carBody(kit:SceneKit,sections:Section[]){
 const positions:number[]=[],indices:number[]=[];
 for(const [z,w,bottom,shoulder,roof] of sections){
  for(const [x,y] of [[-.79*w,bottom],[.79*w,bottom],[w,bottom+.12],[w,shoulder],
   [.72*w,roof],[-.72*w,roof],[-w,shoulder],[-w,bottom+.12]])positions.push(x,y,z);
 }
 for(let ring=0;ring<sections.length-1;ring++)for(let i=0;i<8;i++){
  const a=ring*8+i,b=ring*8+(i+1)%8;
  indices.push(a,b,a+8,b,b+8,a+8);
 }
 const last=(sections.length-1)*8;
 for(let i=1;i<7;i++)indices.push(0,i+1,i,last,last+i,last+i+1);
 const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,kit.mat(bodyWhite));
 mesh.castShadow=true;mesh.receiveShadow=true;
 return mesh;
}

function carSide(kit:SceneKit,car:THREE.Group,from:number,to:number,count:number){
 const {box}=kit;
 for(const side of [-1,1]){
  const x=side*.842;
  box(car,[x,.63,(from+to)/2],[.031,.15,to-from],stripe);
  for(let i=0;i<count;i++){
   const z=from+(i+.5)*(to-from)/count;
   box(car,[x,.998,z],[.028,.235,.258],glass,false,.24);
  }
 }
}

export function buildRailway(kit:SceneKit){
 const {part,box,sign}=kit;
 const g=part(0);g.name='north-shinkansen-railway';
 const {north,south,west}=northAnnex,z=(north+south)/2,span=south-north;
 box(g,[(west+railFence)/2,northY+.018,z],[railFence-west,.032,span-.06],'#607477').userData.walkThrough=true;
 for(const [index,x] of trackCenters.entries()){
  const end=index===0?south-.04:-36.42;
  const span=end-north-.04,z=(end+north+.04)/2;
  box(g,[x,northY+.06,z],[2.31,.062,span],'#626c71');
  for(let sleeper=north+.23;sleeper<end-.11;sleeper+=.46){
   box(g,[x,northY+.102,sleeper],[1.94,.065,.154],'#7b817a');
  }
  for(const dx of [-.57,.57]){
   box(g,[x+dx,northY+.169,z],[.077,.137,span],'#667881');
   box(g,[x+dx,northY+.251,z],[.105,.031,span],'#b0bcb8');
  }
 }
 const branch=Array.from({length:31},(_,i)=>{
  const t=i/30;
  return {x:trackCenters[1]+(stationTrackX-trackCenters[1])*t*t*(3-2*t),y:northY-.006,z:-36.422+6.27*t};
 });
 const branchBed=branch.filter(point=>point.x>stationTrackX+1.65);
 ribbon(kit,g,branchBed,0,2.21,.02,.089,'#626c71');
 buildRailBands(kit,g,branch);
 box(g,[railFence,northY+.455,z],[.13,.91,span],'#668482',true);
 box(g,[railFence+.081,northY+.955,z],[.23,.065,span-.02],'#a5b6a8');
 box(g,[railFence+.49,northY+.021,z],[.33,.026,span-.24],'#ae9970').userData.walkThrough=true;
 for(let p=north+.32;p<south;p+=.87){
  box(g,[railFence+.49,northY+.042,p],[.3,.018,.056],'#dcc18b').userData.walkThrough=true;
 }
 box(g,[(west+railFence)/2,northY+.33,north+.25],[railFence-west,.66,.12],'#7d9290',true);
 for(const [a,b] of [[west,railTrench.west],[railTrench.east,railFence]]){
  box(g,[(a+b)/2,northY+.33,south-.17],[b-a,.66,.12],'#7d9290',true);
 }
 for(const p of [-33.53,-38.76]){
  for(const x of [-24.42,-17.66])box(g,[x,northY+1.24,p],[.091,2.48,.102],'#778b88');
  box(g,[-21.04,northY+2.49,p],[6.81,.102,.094],'#859793');
  for(const x of trackCenters)box(g,[x,northY+2.19,p],[.067,.55,.063],'#819087');
 }
 for(const x of trackCenters)box(g,[x,northY+1.916,z],[.027,.028,span-.4],'#657978');
 box(g,[-18.02,northY+.84,-31.26],[.07,1.68,.07],'#708381');
 box(g,[-18.02,northY+1.57,-31.19],[.224,.31,.16],'#4d666d',true);
 box(g,[-18.02,northY+1.62,-31.10],[.109,.105,.018],'#dc9b79',false,1.05);
 for(const z of [-32.89,-32.21])box(g,[railFence,northY+1.13,z],[.053,.43,.052],'#6a827f');
 sign(g,[railFence+.048,northY+1.34,-32.55],.94,.36,'新幹線','#4e6984','#e8e4cc','あおば展望',Math.PI/2);
}

function sideways(path:RailPoint[],index:number,offset:number){
 const before=path[Math.max(index-1,0)],after=path[Math.min(index+1,path.length-1)],point=path[index];
 const dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz);
 return {x:point.x+offset*dz/length,y:point.y,z:point.z-offset*dx/length};
}

function ribbon(kit:SceneKit,group:THREE.Group,path:RailPoint[],offset:number,width:number,low:number,high:number,color:string,foundation=false){
 const vertices:number[]=[],indices:number[]=[];
 for(let i=0;i<path.length;i++){
  const left=sideways(path,i,offset-width/2),right=sideways(path,i,offset+width/2);
  const bottom=foundation?.063:low+path[i].y;
  vertices.push(left.x,bottom,left.z,right.x,bottom,right.z,
   right.x,high+right.y,right.z,left.x,high+left.y,left.z);
  if(i===0)continue;
  const start=(i-1)*4;
  for(let side=0;side<4;side++){
   const a=start+side,b=start+(side+1)%4;
   indices.push(a,b,a+4,b,b+4,a+4);
  }
 }
 const last=vertices.length/3-4;
 indices.push(0,2,1,0,3,2,last,last+1,last+2,last,last+2,last+3);
 const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,kit.mat(color));
 mesh.castShadow=true;mesh.receiveShadow=true;
 group.add(mesh);
}

function buildRailBands(kit:SceneKit,group:THREE.Group,path:RailPoint[]){
 for(const side of [-.57,.57]){
  ribbon(kit,group,path,side,.078,.105,.235,'#667881');
  ribbon(kit,group,path,side,.104,.235,.267,'#b0bcb8');
 }
}

export function buildWestRailApproach(kit:SceneKit){
 const {part,box}=kit;
 const g=part(0);g.name='west-rail-approach';
 // Walking uses the sampled corridor instead of one bounding box for the curve.
 g.userData.walkThrough=true;
 ribbon(kit,g,westRailRun,0,2.38,0,.09,'#687b7e',true);
 buildRailBands(kit,g,westRailRun);
 let distance=0;
 for(let i=1;i<westRailRun.length-1;i++){
  const p=westRailRun[i],previous=westRailRun[i-1];
  distance+=Math.hypot(p.x-previous.x,p.z-previous.z);
  if(distance<.42)continue;
  distance=0;
  const sleeper=box(g,[p.x,p.y+.108,p.z],[1.94,.054,.14],'#82877c');
  const after=westRailRun[i+1];
  sleeper.rotation.y=Math.atan2(after.x-previous.x,after.z-previous.z);
 }
 const fence=westRailRun.map((p,i)=>p.z>railTrench.south+.07?sideways(westRailRun,i,1.37):undefined)
  .filter((p):p is RailPoint=>p!==undefined);
 ribbon(kit,g,fence,0,.125,.09,.72,'#718a88');
 ribbon(kit,g,fence,0,.18,.72,.758,'#a2b5a7');
}

export function buildRailHall(kit:SceneKit){
 const {part,box,sign,roofs,glass}=kit;
 const g=part(0);g.name='north-rail-hall';
 const west=-24.74,east=-14.88,z=-36.15,length=9.75;
 const ridge=(west+east)/2,pitch=.093,eave=northY+2.94;
 for(const x of [west+.23,east-.24])for(const p of [-40.69,-36.15,-31.61]){
  box(g,[x,northY+1.45,p],[.132,2.9,.14],'#658283',true);
  box(g,[x,northY+.14,p],[.23,.28,.24],'#8a9b90',true);
 }
 const roofSpan=(east-west)/2;
 for(const [side,edge] of [[-1,west],[1,east]]){
  const width=roofSpan-.39;
  const panel=box(g,[edge-side*width/2,eave+width*pitch/2,z],[width/Math.cos(pitch),.125,length],'#647f87',true);
  panel.rotation.z=-side*pitch;
  const gutter=box(g,[edge,eave-.069,z],[.142,.088,length+.14],'#8a9c98');
  gutter.castShadow=false;
  for(let p=z-length/2+.25;p<z+length/2-.1;p+=.48){
   const seam=box(g,[panel.position.x,panel.position.y+.075,p],[width-.045,.017,.027],'#a0b2ab');
   seam.rotation.z=-side*pitch;seam.castShadow=false;
  }
 }
 const skylight=new THREE.Mesh(new THREE.PlaneGeometry(.78,length-.16),glass);
 skylight.rotation.x=-Math.PI/2;skylight.position.set(ridge,eave+roofSpan*pitch+.044,z);g.add(skylight);
 for(const x of [ridge-.406,ridge+.406]){
  box(g,[x,skylight.position.y+.02,z],[.064,.058,length],'#94a9a5');
 }
 for(const p of [-40.62,-38.41,-36.16,-33.88,-31.68]){
  box(g,[ridge,eave-.11,p],[east-west-.28,.104,.105],'#758f90');
  box(g,[ridge,eave+roofSpan*pitch+.069,p],[.77,.044,.046],'#91a6a2');
 }
 for(const p of [-38.88,-34.05]){
  box(g,[-15.91,northY+2.65,p],[.13,.037,1.07],'#ffdfaa',false,1.17);
 }
 for(const p of [-38.89,-34.57]){
  box(g,[-15.19,northY+.426,p],[.39,.091,1.42],'#a18a72',true);
  box(g,[-15.36,northY+.646,p],[.067,.39,1.42],'#83998d');
  for(const dz of [-.44,.44])box(g,[-15.19,northY+.19,p+dz],[.33,.38,.067],'#607d7d');
  for(const dz of [-.32,.32])seat(g,[-15.18,northY+.472,p+dz],[-14.58,northY,p+dz]);
 }
 sign(g,[-14.91,northY+2.37,-32.74],1.66,.38,'青葉新幹線','#506d83','#f0e4c8','展望・待合',Math.PI/2);
 const light=new THREE.PointLight('#ffddb2',3.3,4.9);light.position.set(-15.9,northY+2.56,-36.23);g.add(light);
 roofs.push({x:ridge,z,w:east-west,d:length,h:skylight.position.y+.09});
}

export function buildShinkansen(kit:SceneKit){
 const {part,box,sign}=kit;
 const train=part(0);train.name='north-shinkansen-train';
 train.position.set(trackCenters[0],northY+.258,0);
 const middle=new THREE.Group();
 middle.position.z=-36.08;train.add(middle);
 middle.add(carBody(kit,[[-1.83,.83,.21,1.05,1.28],[1.83,.83,.21,1.05,1.28]]));
 carSide(kit,middle,-1.82,1.82,9);
 for(const z of [-1.91,1.91])box(middle,[0,.695,z],[1.28,.87,.17],'#647680');
 box(middle,[0,1.32,.54],[.64,.09,.77],'#8c9d9d');
 for(const z of [-1.31,1.29])box(middle,[0,.19,z],[1.21,.28,.58],'#536873');
 sign(middle,[.862,.77,-1.38],.43,.12,'N700S','#d1d9d6','#48698e','',Math.PI/2);

 const noseSections:Section[]=[
  [-3.42,.83,.21,1.05,1.28],[-2.86,.83,.21,1.04,1.265],
  [-2.29,.80,.198,.875,1.124],[-1.62,.69,.174,.63,.826],
  [-.82,.49,.142,.42,.552],[-.15,.24,.141,.331,.393],[0,.11,.153,.271,.316],
 ];
 for(const [z,rotation] of [[-30.79,0],[-41.42,Math.PI]]){
  const car=new THREE.Group();car.position.z=z;car.rotation.y=rotation;train.add(car);
  car.add(carBody(kit,noseSections));
  carSide(kit,car,-3.416,-2.9,2);
  box(car,[0,.18,-2.92],[1.21,.27,.59],'#536873');
  const windshield=new THREE.BufferGeometry()
   .setAttribute('position',new THREE.Float32BufferAttribute([
    -.415,1.27,-2.858,.415,1.27,-2.858,-.38,1.131,-2.29,.38,1.131,-2.29,
    -.31,.833,-1.62,.31,.833,-1.62,
   ],3))
   .setIndex([0,2,1,1,2,3,2,4,3,3,4,5]);
  windshield.computeVertexNormals();
  car.add(new THREE.Mesh(windshield,kit.mat('#435d73',.16)));
  for(const x of [-.28,.28])box(car,[x,.492,-.85],[.17,.059,.027],'#e2e2bb',false,.89);
 }
}
