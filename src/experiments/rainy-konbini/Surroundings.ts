import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {seat} from './Seats';
import {groundHeight} from './Terrain';
import {buildResidence, northResidences, westResidence} from './NorthResidences';
export function* buildSurroundings(kit:SceneKit){
 const {part,box,cyl,tube,sign,mat,glass,roofs}=kit;
  // The expanded neighborhood shares a single square plinth and connected roads.
  const neighborhoodGround=part(.45);
  box(neighborhoodGround,[-1,.16,-9.05],[19.6,.25,5.5],'#7d8b94',true);
  box(neighborhoodGround,[-8.8,.16,-.6],[3.9,.25,8.1],'#7d8b94',true);
  box(neighborhoodGround,[-1,.16,6.95],[19.6,.25,1.5],'#7d8b94',true);
  for(let x=-10.5;x<8.7;x+=.65){
   box(neighborhoodGround,[x,.29,-6.25],[.61,.16,.2],'#a6b0ae',true);
   box(neighborhoodGround,[x,.29,6.18],[.61,.16,.2],'#a6b0ae',true);
   box(neighborhoodGround,[x,.083,-5.13],[.28,.008,.035],'#b6bcae');
  }
  for(let z=-4.4;z<3.3;z+=.65)box(neighborhoodGround,[-6.85,.29,z],[.2,.16,.61],'#a6b0ae',true);
  for(let z=-11;z<2;z+=1.6)if(z<-5.7)box(neighborhoodGround,[4.65,.075,z],[.06,.01,.75],'#b9b9a6');
  for(let x=-10.2;x<8.5;x+=1.65)if(x<-4.5||x>2)box(neighborhoodGround,[x,.075,4.7],[.75,.01,.055],'#b9b9a6');
  // Extra crossings connect the residential lane to the main corner.
  for(let i=0;i<5;i++)box(neighborhoodGround,[3.7+i*.53,.078,-5.1],[.28,.01,1.7],'#a9b7bb');
  for(let i=0;i<4;i++)box(neighborhoodGround,[-6.38,.078,3.55+i*.55],[1.55,.01,.3],'#a9b7bb');

  yield;
  buildResidence(kit,westResidence);
  yield;
  for(const home of northResidences.slice(0,4)){buildResidence(kit,home);yield;}
  const extraStreet=part(4.7);
  // Low garden walls and shrubs between homes, plus a bench on the near sidewalk.
  for(const x of [-6.4,-.6,3.3]){
   box(extraStreet,[x,.65,-8.7],[.14,.75,4.4],'#7e9294',true);
   const planterX=x-.65;
   box(extraStreet,[planterX,.49,-6.65],[.8,.33,.5],'#8b7c6d',true);
   // One continuous crown avoids coincident facets from intersecting identical shrubs.
   const hedge=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),mat('#789990'));hedge.name='residential-hedge';
   hedge.scale.set(.37,.2,.21);hedge.position.set(planterX,.8,-6.65);hedge.castShadow=true;extraStreet.add(hedge);
  }
  for(const x of [-7.7,.8]){
   for(const dx of [-.5,.5])box(extraStreet,[x+dx,.5,6.9],[.07,.45,.5],'#516a74');
   for(let j=0;j<3;j++)box(extraStreet,[x,.76,6.72+j*.16],[1.4,.06,.12],'#a08d74');
   box(extraStreet,[x,1.06,7.15],[1.4,.42,.08],'#9c8a74',true);
   for(const offset of [-.35,.35])seat(extraStreet,[x+offset,.79,6.89],[x+offset,.285,6.43]);
  }
  for(const [x,z] of [[-9.7,2.4],[7.45,6.9],[-10.1,-6.7]]){
   cyl(extraStreet,[x,.53,z],.35,.46,'#8f897b',.27);cyl(extraStreet,[x,1.37,z],.07,1.4,'#7d776b');
   const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.68,1),mat('#6c948b'));crown.position.set(x,2.16,z);crown.scale.set(.8,1.15,.8);crown.castShadow=true;extraStreet.add(crown);
  }
  for(const [x,z] of [[-6.5,-5.9],[5.9,-6.1],[-9.3,6.5]]){
   cyl(extraStreet,[x,2.35,z],.055,4.1,'#657e87');
   box(extraStreet,[x,4.45,z],[.55,.15,.4],'#a9b9b3',true);box(extraStreet,[x,4.36,z],[.43,.025,.3],'#ffdb9d',false,1.8);
   const l=new THREE.PointLight('#ffd7a1',4,4.5);l.position.set(x,4.15,z);extraStreet.add(l);
  }
  sign(extraStreet,[-6.5,2.7,-5.82],1.1,.32,'青葉町 二丁目','#567783','#e5e6d5');
  // Overhead services extend along the residential street, clear of the roofs.
  cyl(extraStreet,[-10.5,3.2,-5.75],.08,6.2,'#839999');
  for(const z of [-5.68,-5.95])tube(extraStreet,[[-10.5,6.3,z],[-5.5,5.67,z],[0,5.6,z],[5.1,5.7,z]],.012,'#304957');
  for(const x of [-8.5,-3.5,.8,7.2]){
   box(extraStreet,[x,.08,-5.95],[.7,.025,.24],'#263d49');for(let k=0;k<8;k++)box(extraStreet,[x-.3+k*.085,.097,-5.95],[.025,.01,.21],'#758b91');
  }
  // Expanded eastern commercial lane and southern pedestrian promenade.
  yield;
  const extension=part(.65);
  box(extension,[12.1,.16,-2.7],[5.6,.25,14.2],'#839397',true);
  box(extension,[12.1,.16,8.5],[5.6,.25,6.5],'#839397',true);
  box(extension,[-1.75,.16,10.45],[22.1,.25,2.6],'#879797',true);
  box(extension,[-2.2,.16,-14],[20.8,.25,3.6],'#7e9096',true);
  for(let z=-9.4;z<11.7;z+=.7)if(z<4.3||z>5.2)box(extension,[9.3,.3,z],[.18,.16,.66],'#b0bbb3',true);
  for(let x=-12.5;x<14.6;x+=.7)box(extension,[x,.3,9.2],[.66,.16,.18],'#b0bbb3',true);
  for(let x=-12;x<14;x+=1.5)box(extension,[x,.077,8.15],[.65,.012,.06],'#bec1af');
  for(let z=-14.8;z<7;z+=1.5)box(extension,[8.95,.077,z],[.06,.012,.65],'#bec1af');
  for(let i=0;i<5;i++){box(extension,[6.1+i*.57,.078,7.9],[.31,.01,1.8],'#a4b9bc');box(extension,[8.8,.078,-3.3+i*.48],[1.45,.01,.25],'#a4b9bc');}
  yield;
  for(const home of northResidences.slice(4)){buildResidence(kit,home);yield;}
  function openShop(x:number,z:number,title:string,color:string,delay:number){
   const p=part(delay),cap=part(delay+.8),w=4.5,d=4.6;
   roofs.push({x,z,w:w+.4,d:d+.4,h:3.75});
   box(p,[x,.34,z],[w,.1,d],'#d2c6aa');
   box(p,[x,1.83,z-d/2],[w,3,.13],color,true);
   for(const dx of [-w/2,w/2])box(p,[x+dx,1.83,z],[.13,3,d],color,true);
   // The open front has a wide, unobstructed central doorway.
   for(const dx of [-1.65,1.65]){
    box(p,[x+dx,1.7,z+d/2],[1.1,2.7,.07],'#54777a',true);
    box(p,[x+dx,1.75,z+d/2+.045],[.96,2.4,.025],'#b5cfc2',false,.1);
   }
   box(cap,[x,3.4,z],[w+.35,.18,d+.35],'#6e8d8b',true);
   for(let i=0;i<9;i++)box(cap,[x-2+i*.5,3.51,z],[.025,.025,d+.35],'#93aaa5');
   box(cap,[x+.95,3.77,z-1],[1.1,.52,.8],'#b3c2b8',true);
   for(let i=0;i<7;i++)box(cap,[x+.5+i*.15,3.78,z-.59],[.025,.35,.025],'#657f83');
   for(const side of [-1,1])for(const wz of [z-.6,z+.9]){
    box(p,[x+side*(w/2+.08),2.1,wz],[.03,1.1,1.05],'#526f7a',true);
    box(p,[x+side*(w/2+.1),2.1,wz],[.02,.98,.93],'#a8c6bd',false,.14);
    box(p,[x+side*(w/2+.12),2.1,wz],[.025,1.02,.035],'#6d8b87');
   }
   tube(p,[[x+w/2+.1,3.35,z-d/2+.1],[x+w/2+.1,.4,z-d/2+.1]],.035,'#a6b8af');
   box(cap,[x,3.35,z+d/2+.18],[w+.3,.6,.3],color,true);
   sign(cap,[x,3.35,z+d/2+.34],w,.4,title,'#e6dcc0','#477d79','',0,.5);
   box(cap,[x,3.1,z+d/2+.3],[w,.035,.12],'#ffe8b1',false,1.8);
   const light=new THREE.PointLight('#ffdb9f',9,6);light.position.set(x,2.7,z+.1);cap.add(light);
   for(const dx of [-1.4,1.4])box(cap,[x+dx,3.28,z],[.12,.04,2.3],'#fff0bf',false,1.5);
   return p;
  }
  yield;
  const cafe=openShop(11.9,-6.6,'喫茶 雨音  /  AME COFFEE','#ad9b88',3.8);
  box(cafe,[11.9,1.02,-8.13],[3.7,1.3,.62],'#8d7966',true);box(cafe,[11.9,1.72,-8.13],[3.85,.1,.76],'#d5bd96',true);
  box(cafe,[12.9,1.97,-8.13],[.65,.45,.45],'#829995',true);for(let i=0;i<3;i++)cyl(cafe,[11.4+i*.25,1.86,-8.12],.075,.2,'#eee1ba');
  sign(cafe,[11.9,2.58,-8.82],2.6,.7,'COFFEE  ¥380','#3b5859','#e1d0aa','DRIP  /  LATTE  /  CAKE');
  for(const x of [10.65,13.15]){
   cyl(cafe,[x,1.1,-6.3],.42,.08,'#c7a780');cyl(cafe,[x,.7,-6.3],.035,.8,'#607478');
   for(const [z,side] of [[-7.05,-1],[-5.55,1]]){
    box(cafe,[x,.75,z],[.45,.08,.4],'#ad9075');
    box(cafe,[x,1.07,z+side*.17],[.45,.55,.06],'#849990',true);
    for(const dx of [-.16,.16])box(cafe,[x+dx,.5,z],[.04,.5,.3],'#536c72');
    seat(cafe,[x,.79,z],[x+(x<12?.48:-.48),.39,z]);
   }
   cyl(cafe,[x,1.2,-6.3],.07,.12,'#e6d8ba');
  }
  yield;
  const laundry=openShop(11.9,1,'コインランドリー  /  24H','#8aabb2',4.1);
  for(const x of [10.5,11.9,13.3]){
   box(laundry,[x,1.32,-.62],[1.05,1.9,.9],'#c2d4ce',true);
   for(const y of [.88,1.72]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.29,.055,8,24),mat('#7d969b'));ring.position.set(x,y,-.14);laundry.add(ring);
    const drum=new THREE.Mesh(new THREE.CircleGeometry(.25,24),mat('#537d8b'));drum.position.set(x,y,-.135);laundry.add(drum);
   }
   box(laundry,[x,2.12,-.145],[.4,.1,.03],'#a4e4cd',false,.8);
  }
  box(laundry,[13.5,1.05,1.5],[.6,1.35,1.2],'#92b1ac',true);box(laundry,[13.5,1.76,1.5],[.72,.08,1.3],'#e4d4ad');
  for(let j=0;j<3;j++)box(laundry,[13.5,1.84+j*.07,1.5],[.4,.06,.55],j%2?'#b8d4cf':'#d6c5b1');
  sign(laundry,[11.9,2.65,-1.22],2.7,.35,'WASH  •  DRY  •  RELAX','#d2e3d9','#5a8787');
  // A pocket park: winding stepping stones, low planters and a small pavilion.
  yield;
  const park=part(4.5);
  for(const [x,z] of [[10.4,6.4],[13.7,6.4],[10.4,10.6],[13.7,10.6]]){
   box(park,[x,.46,z],[1.1,.3,1.1],'#9b9987',true);box(park,[x,.63,z],[.96,.06,.96],'#6f8e79');
   cyl(park,[x,1.4,z],.09,1.6,'#827967');const tree=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),mat('#7b9e8c'));tree.position.set(x,2.45,z);tree.scale.y=1.25;tree.castShadow=true;park.add(tree);
  }
  for(let j=0;j<8;j++)box(park,[11.95+Math.sin(j*.9)*.3,.31,5.5+j*.74],[.8,.045,.52],'#c0c2af',true);
  for(const x of [10.25,13.7]){
   const side=x<12?1:-1;
   box(park,[x,.8,8.5],[.55,.1,1.8],'#ad9879');box(park,[x-side*.23,1.15,8.5],[.08,.6,1.8],'#8b9e90');
   for(const z of [7.85,9.15])box(park,[x,.54,z],[.5,.5,.06],'#586f72');
   for(const z of [8.07,8.93])seat(park,[x,.85,z],[x+side*.56,.29,z]);
  }
  // Bus shelter and illuminated neighborhood map on the south promenade.
  yield;
  const shelter=part(4.8);
  shelter.name='aoba-bus-shelter';
  const canopy=box(shelter,[-3.5,3.174,10.45],[4,.144,2.1],'#76918f',true);canopy.name='bus-shelter-canopy';canopy.receiveShadow=false;
  for(const x of [-5.3,-1.7])for(const z of [9.65,11.3]){
   // The posts end inside their sockets, below the roof. The small metal joints
   // keep their toon shading but do not sample the roof's low-resolution shadow edge.
   const post=box(shelter,[x,1.652,z],[.086,2.734,.086],'#799497');post.name='bus-shelter-post';post.receiveShadow=false;
   const socket=box(shelter,[x,3.06,z],[.118,.078,.118],'#5d7d81');socket.name='bus-shelter-socket';socket.receiveShadow=false;
  }
  const lamp=box(shelter,[-3.5,3.065,10.5],[3.32,.035,.1],'#ffe6b0',false,1.5);lamp.castShadow=false;lamp.receiveShadow=false;
  for(const y of [.49,2.88]){
   const rail=box(shelter,[-3.5,y,11.3],[3.508,.057,.056],'#718d91');rail.receiveShadow=false;
  }
  const shelterGlass=new THREE.Mesh(new THREE.PlaneGeometry(3.486,2.326),glass);
  shelterGlass.name='bus-shelter-glass';shelterGlass.position.set(-3.5,1.685,11.3);shelter.add(shelterGlass);
  roofs.push({x:-3.5,z:10.45,w:4,d:2.1,h:3.246});
  box(shelter,[-3.5,.8,10.8],[2.7,.12,.45],'#b4a286');for(const x of [-4.5,-2.5])box(shelter,[x,.5,10.8],[.08,.55,.42],'#647c80');
  for(const x of [-4.35,-3.5,-2.65])seat(shelter,[x,.86,10.8],[x,.29,10.23]);
  box(shelter,[-5.32,2.25,10.1],[.05,.93,.63],'#57797c');
  for(const y of [2.02,2.48])box(shelter,[-5.32,y,9.73],[.065,.06,.24],'#57797c');
  sign(shelter,[-5.28,2.25,10.1],.6,.9,'青葉町','#e1dfc5','#557e7d','BUS  07 / 21',Math.PI/2);
  box(shelter,[.3,1.4,10.8],[1.6,2.1,.18],'#6b8985',true);sign(shelter,[.3,1.45,10.91],1.4,1.8,'青葉町 案内','#d9d5b9','#5f7e78','COFFEE  →   PARK  →');
  // The reading room now occupies the old lamp position; keep poles outside
  // buildings and the hillside carriageway, with bases following their terrain.
  for(const [x,z] of [[7.9,5],[7.45,-11.35],[-14.65,10.9],[5.8,10.6]]){
   const lamp=new THREE.Group();lamp.name=`street-lamp-${x}-${z}`;lamp.position.set(x,groundHeight(x,z),z);shelter.add(lamp);
   cyl(lamp,[0,2.4,0],.055,4.8,'#718b90');box(lamp,[0,4.8,0],[.55,.12,.35],'#c0c7b7');box(lamp,[0,4.7,0],[.46,.03,.28],'#ffe2a4',false,2);
  }
}


