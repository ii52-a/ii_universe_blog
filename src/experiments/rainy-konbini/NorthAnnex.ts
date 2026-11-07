import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {northAnnex,northY} from './NorthTerrain';
import {buildRailway,buildShinkansen,buildRailHall,buildWestRailApproach} from './NorthRail';
import {buildNorthFood} from './NorthFood';
import {seat} from './Seats';

const plaza={x:-10.25,z:-36.32};
const pavilion={x:-1.6,z:-36.27,w:4.82,d:4.32};
const middle=(a:number,b:number)=>(a+b)/2;

function foundation(kit:SceneKit){
 const {west,east,north,south,railEdge}=northAnnex;
 const {part,box,mat}=kit;
 const g=part(0);g.name='north-annex-deck';
 const x=middle(west,east),z=middle(north,south);
 box(g,[x,-.34,z],[east-west,.65,south-north],'#253544',true);
 box(g,[x,middle(-.015,northY),z],[east-west,northY+.015,south-north],'#778986',true).userData.walkThrough=true;
 const paving=new THREE.Mesh(new THREE.PlaneGeometry(east-railEdge-.06,south-north-.08),mat('#84958d'));
 paving.rotation.x=-Math.PI/2;paving.position.set(middle(railEdge,east),northY+.003,z);
 paving.receiveShadow=true;g.add(paving);
 for(const height of [.36,1.63,2.88]){
  box(g,[x,height,north-.008],[east-west,.035,.012],'#869892').castShadow=false;
  box(g,[east+.008,height,z],[.012,.035,south-north],'#869892').castShadow=false;
 }
 const side=west+.12;
 box(g,[side,northY+.29,z],[.14,.58,south-north],'#7c9491',true);
 box(g,[side,northY+.599,z],[.188,.045,south-north],'#a2b2a6');
 box(g,[x,northY+.29,north+.12],[east-west-.43,.58,.14],'#7c9491',true);
 box(g,[x,northY+.599,north+.12],[east-west-.43,.045,.185],'#a2b2a6');
}

function waterSpray(reduced:MediaQueryList){
 const count=78;
 const points=new Float32Array(count*3);
 const attribute=new THREE.BufferAttribute(points,3).setUsage(THREE.DynamicDrawUsage);
 const geometry=new THREE.BufferGeometry().setAttribute('position',attribute);
 geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.52,0),1.4);
 const spray=new THREE.Points(geometry,new THREE.PointsMaterial({
  color:'#a3e4e6',size:.067,transparent:true,opacity:.83,depthWrite:false,
 }));
 spray.name='plaza-fountain-spray';
 const update=(t:number)=>{
  for(let i=0;i<count;i++){
   const outer=i>=18,jet=(i-18)%6;
   const phase=(t*(outer?.81:1.03)+i*.167)%1;
   const angle=outer?jet*Math.PI/3:i*2.4;
   const radius=outer?.4+phase*.84:phase*.3;
   points[3*i]=Math.cos(angle)*radius;
   points[3*i+1]=.02+4*phase*(1-phase)*(outer?.54:1.08);
   points[3*i+2]=Math.sin(angle)*radius;
  }
  attribute.needsUpdate=true;
 };
 update(0);
 spray.onBeforeRender=()=>{if(!reduced.matches)update(performance.now()*.001);};
 return spray;
}

function buildPlaza(kit:SceneKit,reduced:MediaQueryList){
 const {part,box,cyl,sign,mat}=kit;
 const g=part(0);g.name='north-fountain-plaza';
 const {x,z}=plaza;
 const paving=box(g,[x,northY+.014,z],[10.8,.02,8.7],'#9ba298');
 paving.userData.walkThrough=true;
 for(const dz of [-3.55,3.55])box(g,[x,northY+.028,z+dz],[9.98,.008,.055],'#738983').userData.walkThrough=true;
 for(const dx of [-4.63,4.63])box(g,[x+dx,northY+.03,z],[.055,.008,7.1],'#738983').userData.walkThrough=true;
 for(const dx of [-3.95,-2.62,2.62,3.95]){
  for(const dz of [-2.91,2.91]){
   const inlay=box(g,[x+dx,northY+.032,z+dz],[.23,.009,.23],'#bec5b0');
   inlay.rotation.y=Math.PI/4;inlay.userData.walkThrough=true;
  }
 }
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(1.72,1.82,.34,40),mat('#77928f'));
 basin.name='north-fountain-basin';
 basin.position.set(x,northY+.17,z);basin.castShadow=true;basin.receiveShadow=true;g.add(basin);
 const water=new THREE.Mesh(new THREE.CircleGeometry(1.63,48),mat('#5a909d',.25));
 water.rotation.x=-Math.PI/2;water.position.set(x,northY+.349,z);g.add(water);
 const lip=new THREE.Mesh(new THREE.TorusGeometry(1.667,.072,8,48),mat('#aebeb0'));
 lip.rotation.x=Math.PI/2;lip.position.set(x,northY+.387,z);g.add(lip);
 for(const radius of [.45,.91,1.34]){
  const ripple=new THREE.Mesh(new THREE.RingGeometry(radius,radius+.021,48),
   new THREE.MeshBasicMaterial({color:'#c4ebe4',transparent:true,opacity:.32,depthWrite:false}));
  ripple.rotation.x=-Math.PI/2;ripple.position.set(x,northY+.352,z);g.add(ripple);
 }
 cyl(g,[x,northY+.442,z],.22,.182,'#688c8b');
 cyl(g,[x,northY+.539,z],.128,.042,'#9fb6ab');
 const spray=waterSpray(reduced);spray.position.set(x,northY+.376,z);g.add(spray);
 for(const [dx,dz] of [[-4.64,-2.34],[4.64,-2.34],[-2.92,2.75],[2.92,2.75]]){
  cyl(g,[x+dx,northY+.263,z+dz],.073,.526,'#607f7c');
  box(g,[x+dx,northY+.547,z+dz],[.151,.13,.15],'#e9d5a7',false,.88);
  box(g,[x+dx,northY+.632,z+dz],[.191,.044,.185],'#6d8782');
 }
 for(const dx of [-3.49,3.49]){
  box(g,[x+dx,northY+.439,z],[.37,.092,1.55],'#a58d74',true);
  for(const dz of [-.55,.55])box(g,[x+dx,northY+.21,z+dz],[.31,.42,.075],'#677f7b');
  for(const dz of [-.37,.37])seat(g,[x+dx,northY+.485,z+dz],[x+dx*.81,northY,z+dz]);
 }
 const markerZ=-32.7,markerX=-14.87;
 box(g,[markerX,northY+.63,markerZ],[.055,1.26,.056],'#67827a');
 sign(g,[markerX,northY+1.05,markerZ+.043],.86,.43,'水音広場','#627d74','#eedfba','A O B A');
}

function buildPavilion(kit:SceneKit){
 const {part,box,cyl,sign,mat,roofs}=kit;
 const {x,z,w,d}=pavilion;
 const g=part(0);g.name='north-rain-pavilion';g.position.set(x,northY,z);
 box(g,[0,.027,0],[w+.19,.054,d+.18],'#a7a998').userData.walkThrough=true;
 for(let i=0;i<12;i++){
  box(g,[-w/2+.21+i*.4,.057,0],[.013,.008,d-.11],'#858e80').userData.walkThrough=true;
 }
 for(const px of [-w/2+.19,w/2-.19])for(const pz of [-d/2+.16,d/2-.16]){
  box(g,[px,1.24,pz],[.16,2.41,.16],'#7d7b67',true);
  box(g,[px,.111,pz],[.26,.16,.26],'#828e80',true);
 }
 for(const px of [-w/2+.19,w/2-.19])box(g,[px,2.31,0],[.17,.17,d-.18],'#897e67');
 for(const pz of [-d/2+.16,d/2-.16])box(g,[0,2.31,pz],[w-.18,.17,.17],'#897e67');
 for(const px of [-w/2+.21,w/2-.21]){
  box(g,[px,.78,0],[.065,.062,d-.62],'#899b8c');
  for(let i=0;i<8;i++)box(g,[px,.42,-1.67+i*.475],[.05,.73,.045],'#7a897a');
 }
 const eave=w/2+.3,depth=d+.53;
 const profile=new THREE.Shape();
 profile.moveTo(-eave,2.42);profile.lineTo(0,3.03);profile.lineTo(eave,2.42);
 profile.lineTo(eave,2.56);profile.lineTo(0,3.22);profile.lineTo(-eave,2.56);profile.closePath();
 const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth,bevelEnabled:false}),mat('#5d787c'));
 roof.position.z=-depth/2;roof.castShadow=true;roof.receiveShadow=true;g.add(roof);
 const pitch=Math.atan2(.66,eave),span=Math.hypot(eave,.66);
 for(let pz=-depth/2+.16;pz<depth/2;pz+=.33)for(const side of [-1,1]){
  const seam=box(g,[side*eave/2,2.913,pz],[span-.06,.026,.037],'#819995');
  seam.rotation.z=-side*pitch;seam.castShadow=false;
 }
 box(g,[0,3.214,0],[.16,.093,depth+.15],'#829a92',true);
 for(const px of [-1.17,1.17]){
  cyl(g,[px,2.282,0],.028,.235,'#7b806d');
  box(g,[px,2.056,0],[.243,.25,.238],'#e7c78f',false,1.21);
  for(const py of [1.915,2.189])box(g,[px,py,0],[.283,.036,.276],'#647d75');
 }
 const light=new THREE.PointLight('#ffd9a8',3.6,4.6);
 light.position.set(0,2.03,.12);g.add(light);
 sign(g,[0,2.324,d/2-.054],1.05,.24,'雨やどり','#887f68','#f1ddaf');
 const benchZ=-1.69;
 box(g,[0,.49,benchZ],[2.78,.083,.405],'#b09676',true);
 box(g,[0,.767,benchZ-.19],[2.78,.38,.069],'#95856d',true);
 for(const px of [-1.08,1.08])box(g,[px,.257,benchZ],[.083,.44,.31],'#707e71');
 for(const px of [-.94,0,.94])seat(g,[px,.532,benchZ],[px,0,benchZ+.55]);
 roofs.push({x,z,w:2*eave,d:depth,h:northY+3.28});
}

function buildPlanting(kit:SceneKit){
 const {part,box,cyl,mat}=kit;
 const g=part(0);g.name='north-annex-planting';
 for(const [x,z] of [[-4.95,-33.33],[1.56,-32.47],[.8,-40.55]]){
  box(g,[x,northY+.17,z],[1.38,.34,1.02],'#8b9886',true);
  box(g,[x,northY+.351,z],[1.24,.033,.88],'#6f8774');
  cyl(g,[x,northY+.64,z],.063,.61,'#746e63');
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),mat('#769888'));
  crown.position.set(x,northY+1.11,z);crown.scale.set(1.08,1.12,.84);crown.castShadow=true;g.add(crown);
  for(const dx of [-.43,.42]){
   const flowers=new THREE.Mesh(new THREE.IcosahedronGeometry(.19,1),mat(dx<0?'#9d95b0':'#829fb2'));
   flowers.position.set(x+dx,northY+.444,z+.2);g.add(flowers);
  }
 }
}

export function* buildNorthAnnex(kit:SceneKit,reduced:MediaQueryList,registerVendor:(animate:(seconds:number)=>void)=>void){
 foundation(kit);yield;
 buildRailway(kit);yield;
 buildWestRailApproach(kit);yield;
 buildRailHall(kit);yield;
 buildShinkansen(kit);yield;
 buildPlaza(kit,reduced);yield;
 buildPavilion(kit);yield;
 buildPlanting(kit);yield;
 yield* buildNorthFood(kit,registerVendor);
}
