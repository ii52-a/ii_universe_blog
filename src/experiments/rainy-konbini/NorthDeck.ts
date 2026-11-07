import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {northAnnex,northDeck,northHouse,northY} from './NorthTerrain';
import {seat} from './Seats';
import {railTrench} from './WestRailLayout';

const mid=(a:number,b:number)=>(a+b)/2;

export function* buildNorthDeck(kit:SceneKit){
 const {part,box,cyl,sign,mat}=kit;
 const {west,east,north,south}=northDeck;
 const wall=part(0);wall.name='north-platform';
 const bottom=.063;
 for(const [a,b] of [[west,railTrench.west],[railTrench.east,east]]){
  const slab=box(wall,[mid(a,b),mid(bottom,northY),mid(north,south)],
   [b-a,northY-bottom,south-north],'#778986',true);
  slab.userData.walkThrough=true;
  box(wall,[mid(a,b),northY+.275,south-.14],[b-a,.55,.14],'#94a499',true);
  box(wall,[mid(a,b),northY+.576,south-.14],[b-a,.052,.18],'#a6b2a4');
  for(const y of [.82,1.74,2.67,3.43]){
   box(wall,[mid(a,b),y,south+.008],[b-a,.022,.015],'#899a92').castShadow=false;
  }
 }
 for(const [a,b] of [[west,railTrench.west],[railTrench.east,northAnnex.railEdge]]){
  box(wall,[mid(a,b),northY+.29,north+.12],[b-a,.58,.15],'#7b9290',true);
 }
 for(const x of [railTrench.west-.072,railTrench.east+.072]){
  box(wall,[x,northY+.33,mid(north,south)],[.14,.66,south-north-.17],'#76918d',true);
  box(wall,[x,northY+.68,mid(north,south)],[.18,.04,south-north-.16],'#9aafa4');
 }
 box(wall,[west+.125,northY+.29,mid(north+.22,south-.25)],[.15,.58,south-north-.47],'#7b9290',true);
 for(let x=railTrench.east+.68;x<east-.45;x+=1.82){
  box(wall,[x,1.744,south+.011],[.018,1.79,.015],'#86958c').castShadow=false;
 }
 sign(wall,[-2.8,1.77,south+.029],1.52,.88,'青葉坂上','#526b70','#e6d7b3','旧道・住宅街');
 sign(wall,[-5.1,1.55,south+.028],.82,.86,'夏祭り','#96827d','#e6c9a6','八月  24 日');
 sign(wall,[-17.45,1.89,south+.027],1.37,.42,'☾  雨の路地','#768983','#e0c6ab','静かな夜');
 yield;

 const lane=part(0);lane.name='north-upper-lane';
 const road=new THREE.Mesh(new THREE.PlaneGeometry(east-railTrench.east,1.34),mat('#667d82'));
 road.rotation.x=-Math.PI/2;road.position.set(mid(railTrench.east,east),northY+.003,south-.91);
 road.receiveShadow=true;lane.add(road);
 for(let x=railTrench.east+.52;x<east-.3;x+=.77){
  box(lane,[x,northY+.013,south-.42],[.45,.008,.041],'#b0b8a7').castShadow=false;
 }
 for(const x of [-16.2,-6.65,1.9]){
  cyl(lane,[x,northY+.8,-25.79],.041,1.6,'#65807b');
  box(lane,[x,northY+1.632,-25.79],[.23,.15,.22],'#e6c996',false,.92);
  box(lane,[x,northY+1.728,-25.79],[.28,.045,.27],'#657d7e');
 }
 sign(lane,[1.9,northY+1.24,-25.74],.76,.22,'青葉横丁','#627e79','#e7d8b6');
 yield;

 const garden=part(0);garden.name='north-pocket-garden';
 const porchZ=northHouse.z+northHouse.front+.95;
 const forecourt=box(garden,[northHouse.x,northY+.016,porchZ],[3.18,.024,1.43],'#a1a79b');
 forecourt.userData.walkThrough=true;
 for(const offset of [-1.72,1.72]){
  const x=northHouse.x+offset;
  box(garden,[x,northY+.14,porchZ+.05],[.32,.28,.62],'#8b9987',true);
  box(garden,[x,northY+.315,porchZ+.05],[.24,.072,.49],'#74917e');
 }
 const path=(x:number,z:number,w:number,d:number)=>{
  box(garden,[x,northY+.018,z],[w,.03,d],'#9ca69a').userData.walkThrough=true;
 };
 for(let i=0;i<5;i++)path(-1.65+Math.sin(i*.48)*.22,-26.13-i*.59,.67,.47);
 for(const [x,z] of [[-3.56,-28.47],[.42,-28.47],[-15.35,-28.6]]){
  box(garden,[x,northY+.178,z],[1.42,.356,1.26],'#8e9182',true);
  box(garden,[x,northY+.365,z],[1.28,.035,1.12],'#718e7a');
  cyl(garden,[x,northY+.73,z],.064,.76,'#776d60');
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.63,1),mat('#6f947f'));
  crown.position.set(x,northY+1.37,z);crown.scale.set(1,1.2,.88);crown.castShadow=true;garden.add(crown);
 }
 for(const [x,z] of [[-3.46,-27.26],[.31,-27.26],[-15.12,-27.15]]){
  box(garden,[x,northY+.406,z],[1.2,.084,.35],'#a89177',true);
  for(const dx of [-.42,.42])box(garden,[x+dx,northY+.178,z],[.08,.356,.29],'#68817b');
  for(const dx of [-.27,.27])seat(garden,[x+dx,northY+.448,z],[x+dx,northY,z+.51]);
 }
 for(const x of [-2.54,-.72]){
  box(garden,[x,northY+.18,-29.1],[.35,.36,.35],'#82978b',true);
  box(garden,[x,northY+.381,-29.1],[.219,.14,.22],'#e7d1a0',false,.61);
  box(garden,[x,northY+.485,-29.1],[.32,.07,.32],'#6f8983');
 }
}
