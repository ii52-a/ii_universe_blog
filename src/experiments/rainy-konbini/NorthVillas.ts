import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {northVillas,northY} from './NorthTerrain';
import {villa,guestHouse,villaStair,villaBalcony,villaUpper} from './VillaLayout';
import {seat} from './Seats';

const mid=(a:number,b:number)=>(a+b)/2;

function terrace(kit:SceneKit){
 const {part,box,cyl,sign,mat}=kit;
 const {west,east,north,south}=northVillas;
 const g=part(0);g.name='north-villa-foundation';
 const x=mid(west,east),z=mid(north,south);
 box(g,[x,-.34,mid(north,-30)],[east-west,.65,-30-north],'#253544',true);
 const floor=box(g,[x,mid(.063,northY),z],[east-west,northY-.063,south-north],'#84948a',true);
 floor.userData.walkThrough=true;
 for(const [px,pz,w,d] of [[x,north+.13,east-west,.16],[east-.13,z,.16,south-north]]){
  box(g,[px,northY+.298,pz],[w,.596,d],'#829994',true);
  box(g,[px,northY+.625,pz],[w+.043,.055,d+.043],'#a6b5a7');
 }
 const walk=(px:number,pz:number,w:number,d:number)=>{
  box(g,[px,northY+.011,pz],[w,.016,d],'#a0a99c').userData.walkThrough=true;
 };
 walk(mid(west,19.91),-31.88,19.91-west,1.31);
 walk(villa.x,-33.06,2.18,1.04);
 walk(guestHouse.x,-33.62,1.1,2.15);
 for(const [px,pz] of [[5.48,-34.7],[5.48,-38.18],[8.16,-40.98],[17.58,-40.68]]){
  box(g,[px,northY+.159,pz],[1.24,.318,1.05],'#92a08c',true);
  box(g,[px,northY+.326,pz],[1.12,.028,.94],'#6c8b76');
  cyl(g,[px,northY+.59,pz],.054,.57,'#786f60');
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.56,1),mat('#779784'));
  crown.position.set(px,northY+1.19,pz);crown.scale.set(1,1.16,.91);crown.castShadow=true;g.add(crown);
 }
 for(const px of [4.2,7.38,15.78,19.48]){
  box(g,[px,northY+.286,-32.69],[.117,.57,.13],'#68837f');
  box(g,[px,northY+.59,-32.69],[.145,.12,.14],'#ecd5ac',false,.8);
 }
 sign(g,[4.76,northY+1.37,-30.85],1.29,.28,'青葉テラス','#64847a','#f0ddbb','RESIDENCES');
 for(const px of [4.27,5.25])box(g,[px,northY+.65,-30.9],[.043,1.3,.05],'#6c847e');
}

function glazing(kit:SceneKit,g:THREE.Group,a:number,b:number,base:number,z:number,h:number){
 const {box,glass}=kit,width=b-a,x=mid(a,b);
 box(g,[x,base+.258,z-.057],[width,.516,.111],'#8b9589',true);
 const pane=new THREE.Mesh(new THREE.PlaneGeometry(width-.095,h),glass);
 pane.position.set(x,base+.516+h/2,z+.009);g.add(pane);
 for(const px of [a+.047,x,b-.047])box(g,[px,pane.position.y,z+.025],[.045,h,.075],'#5f7774');
 box(g,[x,base+.524,z+.027],[width,.039,.074],'#78908a');
}

function villaShell(kit:SceneKit){
 const {part,box,sign,roofs}=kit;
 const {x,z,w,d,rise}=villa,front=d/2,side=w/2,top=rise+2.43;
 const g=part(0);g.name='north-modern-villa';g.position.set(x,northY,z);
 for(const px of [-side+.065,side-.065])box(g,[px,top/2,0],[.13,top,d-.21],'#b8b6a7',true);
 box(g,[0,top/2,-front+.062],[w,top,.124],'#adb1a0',true);
 for(const y of [0,rise]){
  for(const [a,b] of [[-side,-.86],[.86,side]])glazing(kit,g,a,b,y,front,1.48);
  for(const px of [-.884,.884])box(g,[px,y+.995,front+.026],[.059,1.99,.098],'#647f78');
  box(g,[0,y+2.128,front-.053],[w,.266,.117],'#a0a79a',true);
 }
 box(g,[0,rise-.017,front+.148],[w+.25,.225,.384],'#6e8885',true);
 box(g,[0,top+.055,0],[w+.46,.153,d+.44],'#5f777e',true);
 box(g,[.97,top+.147,-.52],[5.14,.064,3.58],'#778f8e',true);
 for(let i=0;i<11;i++)box(g,[3.09+i*.092,1.2,front+.073],[.035,1.96,.045],'#ab977b');
 for(const py of [1.27,rise+1.24]){
  box(g,[side+.021,py,-.42],[.053,.89,2.5],'#64807b',true);
  box(g,[side+.057,py,-.42],[.02,.735,2.31],'#c2b494',false,.29);
  for(const pz of [-1.23,-.42,.39])box(g,[side+.075,py,pz],[.023,.735,.036],'#68837f');
 }
 for(const px of [-.97,.97])box(g,[px,1.7,front+.122],[.106,.15,.1],'#e9d4a7',false,.88);
 sign(g,[0,2.123,front+.026],1.03,.17,'青葉の邸','#75908b','#f0e5c8');
 roofs.push({x,z,w:w+.46,d:d+.44,h:northY+top+.19});
}

function villaLevels(kit:SceneKit){
 const {part,box}=kit;
 const g=part(0);g.name='north-villa-stairs';g.position.set(villa.x,northY,villa.z);
 const side=villa.w/2-.13,front=villa.d/2-.115,top=villa.rise;
 const {west,east,top:rear,bottom}=villaStair;
 const slab=(x0:number,x1:number,z0:number,z1:number)=>{
  box(g,[mid(x0,x1),top-.064,mid(z0,z1)],[x1-x0,.128,z1-z0],'#c0ab90').userData.solidFloor=true;
 };
 slab(-side,west,-front,front);
 slab(east,side,-front,front);
 slab(west,east,-front,rear);
 slab(west,east,bottom,front);
 const steps=17,depth=(bottom-rear)/steps;
 for(let i=0;i<steps;i++){
  const height=top*(i+1)/steps,z=bottom-(i+.5)*depth;
  box(g,[mid(west,east),height/2,z],[east-west,height,depth],'#a69278').userData.walkThrough=true;
  box(g,[mid(west,east),height+.005,z+depth*.34],[east-west-.055,.012,.032],'#677f79').userData.walkThrough=true;
  if(i>0)for(const x of [west-.018,east+.018])box(g,[x,height/2,z],[.036,height,depth],'#8a8371');
 }
 for(let i=0;i<6;i++)box(g,[east+.05,top+.365,rear+.31+i*.51],[.045,.73,.046],'#688783');
 box(g,[east+.05,top+.739,mid(rear+.27,bottom)],[.066,.048,bottom-rear-.27],'#92a9a0');
 const houseFront=villa.d/2;
 slab(-villaBalcony.half,villaBalcony.half,front,houseFront+villaBalcony.depth);
 for(const x of [-1.69,1.69])box(g,[x,top+.367,houseFront+.495],[.064,.734,.99],'#7f9890',true);
 for(let i=0;i<8;i++)box(g,[-1.57+i*.45,top+.358,houseFront+.963],[.043,.715,.047],'#688580');
 box(g,[0,top+.745,houseFront+.963],[3.41,.061,.082],'#a1b3a7');
}

function room(kit:SceneKit,name:string,y:number,x=villa.x,z=villa.z){
 const g=kit.part(0);g.name=name;g.position.set(x,y,z);g.userData.streamInterior=true;
 return g;
}

function livingFloor(kit:SceneKit){
 const {box,cyl,sign}=kit,g=room(kit,'north-villa-living',northY);
 const rug=box(g,[-1.59,.014,-.15],[2.18,.024,2.26],'#9ba98e');rug.userData.walkThrough=true;
 box(g,[-1.63,.29,-.92],[1.99,.44,.63],'#95a99c',true);
 box(g,[-1.63,.626,-1.204],[2.06,.605,.12],'#819c91',true);
 for(const x of [-2.13,-1.63,-1.13]){
  box(g,[x,.517,-.88],[.47,.062,.47],'#aab5a0');
  seat(g,[x,.551,-.87],[x,0,-.249]);
 }
 box(g,[-1.58,.31,.7],[1.33,.055,.54],'#a88d70',true);
 for(const x of [-2.06,-1.1])box(g,[x,.142,.7],[.062,.28,.42],'#687a73');
 box(g,[-1.54,.352,.65],[.37,.021,.216],'#839da0');
 box(g,[-1.31,.39,-2.47],[1.62,.78,.38],'#848979',true);
 box(g,[-1.31,1.09,-2.52],[1.28,.54,.088],'#4d666d');
 for(const x of [1.18,1.83]){
  box(g,[x,.485,-2.96],[.56,.97,.39],'#c2c9bd',true);
  cyl(g,[x,.51,-2.748],.166,.032,'#6c898d').rotation.x=Math.PI/2;
 }
 for(const z of [-1.17,-.53,.11,.75]){
  box(g,[4.01,.47,z],[.58,.94,.6],'#a7ac98',true);
  box(g,[4.01,.973,z],[.62,.068,.6],'#c0af92');
  box(g,[4.21,1.7,z],[.29,.42,.56],'#a4b1a5');
 }
 cyl(g,[3.98,1.035,-.89],.16,.033,'#5f7677');
 box(g,[4.0,1.018,.49],[.37,.024,.33],'#879f9e');
 box(g,[3.976,.943,1.42],[.695,1.886,.64],'#9eaeab',true);
 box(g,[3.612,1.111,1.42],[.037,.042,.59],'#6a8380');
 for(const y of [.97,1.31])box(g,[3.594,y,1.58],[.039,.239,.035],'#c6cbc0');
 box(g,[3.704,.57,-1.17],[.025,.39,.419],'#567078');
 box(g,[3.682,.733,-1.17],[.019,.036,.34],'#abbbb0');
 box(g,[2.34,.459,-.42],[.72,.918,1.33],'#9a9e8a',true);
 box(g,[2.34,.96,-.42],[.8,.084,1.42],'#cab895',true);
 for(const z of [-.84,-.45,-.05])cyl(g,[2.34,1.06,z],.076,.11,'#a6b2a3');
 box(g,[2.55,.72,1.77],[1.65,.062,.68],'#a98f74',true);
 for(const x of [1.9,3.2])box(g,[x,.351,1.77],[.059,.7,.51],'#657d75');
 for(const x of [2.14,2.94]){
  box(g,[x,.414,2.42],[.376,.068,.36],'#a4afa0',true);
  box(g,[x,.765,2.57],[.38,.62,.053],'#849d92');
  box(g,[x,.19,2.42],[.058,.38,.271],'#6c8179');
  seat(g,[x,.451,2.4],[x+(x<2.5?-.46:.46),0,2.54]);
 }
 box(g,[2.51,.99,-2.54],[.102,1.98,1.16],'#b3b5a4',true);
 box(g,[3.95,.447,-2.91],[.65,.894,.51],'#aab6ac',true);
 box(g,[3.95,.922,-2.91],[.69,.053,.55],'#d3cfb8');
 box(g,[3.95,1.43,-3.07],[.52,.6,.041],'#8faaa9');
 cyl(g,[3.36,.25,-2.96],.19,.5,'#c5cbbd');
 box(g,[.4,2.318,-.06],[3.13,.038,.145],'#f4ddae',false,1.08);
 sign(g,[.12,1.71,-3.079],1.32,.41,'青葉の邸','#c3b69b','#5b776c','LIVING  /  DINING');
 const light=new THREE.PointLight('#ffddac',4.15,5.1);light.position.set(.31,2.18,.26);g.add(light);
}

function sleepingFloor(kit:SceneKit){
 const {box,cyl,sign}=kit,g=room(kit,'north-villa-bedroom',villaUpper);
 const rug=box(g,[1.25,.013,-.21],[2.49,.023,2.87],'#9bad95');rug.userData.walkThrough=true;
 box(g,[1.33,.184,-.45],[1.54,.36,2.17],'#93806a',true);
 box(g,[1.33,.408,-.45],[1.49,.137,2.09],'#d4d0b5',true);
 box(g,[1.33,.497,-.09],[1.43,.041,1.35],'#819b9a');
 for(const x of [.99,1.67])box(g,[x,.478,-1.246],[.51,.091,.31],'#e3d5b8');
 seat(g,[.68,.506,-.42],[.26,0,-.42]);
 for(const x of [-1.46,-.65,.15]){
  box(g,[x,.942,-2.83],[.744,1.884,.43],'#a7ab98',true);
  box(g,[x+.201,1.0,-2.598],[.033,.23,.026],'#6a827b');
 }
 box(g,[-1.57,.714,1.96],[1.53,.066,.51],'#ae9579',true);
 for(const x of [-2.17,-.97])box(g,[x,.341,1.96],[.067,.68,.42],'#6d7f74');
 box(g,[-1.59,.769,1.93],[.44,.041,.248],'#849e9b');
 cyl(g,[-2.02,.895,1.91],.025,.24,'#627c77');
 box(g,[-2.02,1.018,1.91],[.217,.097,.17],'#ead0a4',false,.65);
 box(g,[3.08,1.0,.995],[.104,2.0,1.43],'#b0b6a6',true);
 box(g,[3.08,1.0,2.889],[.104,2.0,.57],'#b0b6a6',true);
 box(g,[3.76,.3,1.21],[.94,.6,1.06],'#b7c2b6',true);
 box(g,[3.76,.616,1.21],[.834,.041,.92],'#7c9fa2');
 cyl(g,[3.93,.236,2.91],.194,.45,'#c3cbba');
 box(g,[3.89,.64,-2.2],[.63,1.28,1.22],'#a5ad9d',true);
 for(const z of [-2.61,-2.24,-1.87])box(g,[3.56,.84,z],[.033,.33,.034],'#71867c');
 box(g,[.4,2.278,-.35],[2.51,.04,.13],'#f1d9af',false,.99);
 sign(g,[-1.54,1.46,2.999],.82,.27,'書斎','#9fae9f','#526f66','STUDY',Math.PI);
 const light=new THREE.PointLight('#ffe2ba',3.25,4.72);light.position.set(.12,2.13,.16);g.add(light);
}

function guest(kit:SceneKit){
 const {part,box,sign,roofs}=kit;
 const {x,z,w,d}=guestHouse,front=d/2,g=part(0);g.name='north-villa-guest';g.position.set(x,northY,z);
 for(const px of [-w/2+.061,w/2-.061])box(g,[px,1.18,0],[.122,2.36,d-.22],'#b2b6a3',true);
 box(g,[0,1.18,-front+.06],[w,2.36,.12],'#a4ae9f',true);
 for(const [a,b] of [[-w/2,-.59],[.59,w/2]])glazing(kit,g,a,b,0,front,1.27);
 box(g,[0,2.1,front-.049],[w,.374,.11],'#859991',true);
 box(g,[0,2.386,0],[w+.31,.134,d+.35],'#607b7e',true);
 sign(g,[0,2.096,front+.024],.97,.19,'離れ','#7c958c','#f4e3bc','GUEST');
 roofs.push({x,z,w:w+.31,d:d+.35,h:northY+2.47});
}

function guestRoom(kit:SceneKit){
 const {box,cyl}=kit;
 const {x,z}=guestHouse,g=room(kit,'north-villa-guest-interior',northY,x,z);
 box(g,[-.79,.262,-.74],[1.31,.52,1.81],'#9b866d',true);
 box(g,[-.79,.574,-.74],[1.24,.111,1.74],'#c7c9af',true);
 box(g,[-.79,.645,-.26],[1.22,.036,.72],'#96a7a4');
 box(g,[-.79,.654,-1.345],[.59,.076,.32],'#e1d3b3');
 seat(g,[-.29,.651,-.53],[.19,0,-.53]);
 box(g,[1.08,.71,-1.14],[.89,.06,.86],'#ab9479',true);
 for(const z of [-1.47,-.8])box(g,[1.32,.343,z],[.07,.68,.065],'#687e73');
 cyl(g,[1.29,.792,-1.35],.082,.104,'#aab8a6');
 box(g,[1.14,.715,1.3],[.63,1.43,.59],'#91a698',true);
 box(g,[0,2.278,-.12],[1.38,.037,.107],'#efdbaf',false,.99);
 const light=new THREE.PointLight('#f8dfb6',2.75,3.5);light.position.set(.19,2.09,.12);g.add(light);
}

export function* buildNorthVillas(kit:SceneKit){
 terrace(kit);yield;
 villaShell(kit);yield;
 villaLevels(kit);yield;
 guest(kit);yield;
 livingFloor(kit);yield;
 sleepingFloor(kit);yield;
 guestRoom(kit);
}
