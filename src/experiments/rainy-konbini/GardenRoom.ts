import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {seat} from './Seats';
export function* buildGardenRoom(kit:SceneKit){
 const {part,box,cyl,line,sign,mat,roofs}=kit;
 const ground=part(0);ground.userData.walkThrough=true;
 box(ground,[-11.9,.64,7.9],[4.2,1.14,5.2],'#7e918d',true);
 box(ground,[-11.9,1.25,7.9],[4.2,.08,5.2],'#c4bd9e');
 box(ground,[-8.3,.64,8.9],[3,1.14,3.2],'#7e918d',true);box(ground,[-8.3,1.25,8.9],[3,.08,3.2],'#b6bc9d');
 // A closed wedge prevents the approach from disappearing when seen from below.
 const section=new THREE.Shape();
 section.moveTo(10.5,.17);section.lineTo(13.3,.17);section.lineTo(13.3,.29);section.lineTo(10.5,1.29);section.closePath();
 const ramp=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{depth:1.7,bevelEnabled:false}),mat('#babda4'));
 ramp.name='reading-garden-solid-ramp';ramp.rotation.y=-Math.PI/2;ramp.position.x=-11.15;ramp.receiveShadow=true;ground.add(ramp);
 box(ground,[-12,.19,13.45],[2.1,.2,.5],'#929f93');
 for(let j=0;j<12;j++){const z=10.6+j*.22,y=.29+(13.3-z)/2.8;const stripe=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.025),mat('#929d91'));stripe.rotation.x=-Math.PI/2+Math.atan2(1,2.8);stripe.position.set(-12,y+.008,z);ground.add(stripe);}
 yield;
 const shell=part(0);
 const h=1.29;
 box(shell,[-11.9,h+1.35,5.37],[4.2,2.7,.14],'#b6b19d',true);
 box(shell,[-13.93,h+1.35,7.3],[.14,2.7,4],'#b6b19d',true);
 // Front posts and fixed windows leave a generous central entrance.
 for(const x of [-13.9,-12.65,-11.35,-9.9])box(shell,[x,h+1.35,9.3],[.09,2.7,.09],'#68857b',true);
 for(const x of [-13.28,-10.62]){
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(1.12,2.2),new THREE.MeshPhysicalMaterial({color:'#a5d0c4',transparent:true,opacity:.16,roughness:.18,depthWrite:false,side:THREE.DoubleSide}));glass.position.set(x,h+1.3,9.3);shell.add(glass);
  box(shell,[x,h+2.46,9.3],[1.23,.07,.09],'#68857b');
 }
 // East wall has a broad picture window facing the pocket garden.
 box(shell,[-9.87,h+.42,7.3],[.14,.84,4],'#b6b19d',true);box(shell,[-9.87,h+2.46,7.3],[.14,.48,4],'#b6b19d');
 for(const z of [5.4,6.55,8.05,9.25])box(shell,[-9.87,h+1.6,z],[.14,1.55,.09],'#68857b');
 const picture=new THREE.Mesh(new THREE.PlaneGeometry(3.7,1.4),new THREE.MeshPhysicalMaterial({color:'#abcfc0',transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));picture.rotation.y=Math.PI/2;picture.position.set(-9.87,h+1.55,7.3);shell.add(picture);
 // Guard rails stop the player at the terrace edge; the ramp stays open.
 for(const x of [-12.9,-11.1]){
  for(const z of [10.5,11.9,13.3]){const y=.29+(13.3-z)/2.8;line(shell,[x,y,z],[x,y+.75,z],.026,'#64867d');}
  line(shell,[x,2.04,10.5],[x,1.04,13.3],.035,'#a8b9a3');
 }
 for(const [a,b] of [[[-14,1.29,9.4],[-14,1.29,10.5]],[[-14,1.29,10.5],[-12.9,1.29,10.5]],[[-11.1,1.29,10.5],[-6.8,1.29,10.5]],[[-6.8,1.29,10.5],[-6.8,1.29,7.3]]] as [[number,number,number],[number,number,number]][]){
  line(shell,[a[0],a[1]+.75,a[2]],[b[0],b[1]+.75,b[2]],.03,'#829c8c');
  const steps=Math.ceil(Math.hypot(a[0]-b[0],a[2]-b[2])/.45);for(let i=0;i<=steps;i++){const x=THREE.MathUtils.lerp(a[0],b[0],i/steps),z=THREE.MathUtils.lerp(a[2],b[2],i/steps);line(shell,[x,1.29,z],[x,2.04,z],.018,'#829c8c');}
 }
 const furnishing=part(0);
 furnishing.userData.streamInterior=true;
 // Tatami-style reading room: sofa, low table, books, desk and lamp.
 const rug=box(furnishing,[-11.95,h+.025,7.4],[2.65,.035,2.7],'#9cab8d');rug.userData.walkThrough=true;
 box(furnishing,[-13.25,h+.4,7],[.85,.55,1.8],'#9aafa1',true);box(furnishing,[-13.6,h+.78,7],[.18,.8,1.95],'#7b978b',true);
 for(const z of [6.72,7.27])box(furnishing,[-13.19,h+.713,z],[.64,.079,.52],'#a5b6a4',true);
 seat(furnishing,[-13.05,h+.754,7.22],[-12.57,h,7.71]);
 for(const z of [6.2,7.8])box(furnishing,[-13.22,h+.7,z],[.87,.4,.13],'#829b8e');
 box(furnishing,[-12.05,h+.48,7],[.7,.075,1.15],'#bc9e78',true);for(const z of [6.55,7.45])box(furnishing,[-12.05,h+.23,z],[.55,.45,.04],'#73887b');
 cyl(furnishing,[-12.05,h+.59,7.2],.08,.13,'#e9d5ae');box(furnishing,[-12.05,h+.54,6.8],[.32,.045,.25],'#708e9b');
 cyl(furnishing,[-12.05,h+.657,7.2],.062,.012,'#86654d');
 for(let i=0;i<3;i++)box(furnishing,[-12.06,h+.566,6.74+i*.055],[.23,.006,.012],'#c5c5a5');
 box(furnishing,[-10.7,h+.8,5.85],[1.4,.09,.6],'#b69c7d',true);for(const x of [-11.25,-10.15])box(furnishing,[x,h+.4,5.85],[.05,.8,.5],'#6c857d');
 box(furnishing,[-11.05,h+1.08,5.75],[.48,.35,.06],'#5c7476');box(furnishing,[-11.05,h+1.08,5.79],[.4,.28,.01],'#c9ddc9',false,.35);
 cyl(furnishing,[-10.25,h+1.05,5.85],.025,.5,'#8da093');const shade=new THREE.Mesh(new THREE.ConeGeometry(.18,.22,12),mat('#e5c99b',.6));shade.position.set(-10.25,h+1.36,5.85);furnishing.add(shade);
 box(furnishing,[-13.15,h+.85,5.73],[1.1,1.65,.4],'#8d9d86',true);
 for(let row=0;row<4;row++){box(furnishing,[-13.15,h+.25+row*.36,5.96],[1.08,.035,.44],'#c6b997');for(let i=0;i<7;i++)box(furnishing,[-13.56+i*.135,h+.4+row*.36,5.96],[.095,.24,.2],['#b7c6a0','#d1b18b','#96b6b4','#bc9491'][i%4]);}
 sign(furnishing,[-11.85,h+2,5.46],1,.7,'雨の日の読書','#d7cfaf','#6c8b78','A QUIET AFTERNOON');
 // Wall-mounted details leave the entrance and the seat's standing area clear.
 box(furnishing,[-10.51,h+1.65,5.47],[.67,.53,.06],'#947a60',true);
 sign(furnishing,[-10.51,h+1.65,5.505],.57,.43,'今週の一冊','#e5d5ad','#596e65','READ · REST · REPEAT');
 for(let i=0;i<3;i++){
  const book=box(furnishing,[-10.65,h+.88+i*.048,5.9],[.32,.044,.23],['#a4b8a0','#bb9690','#cbb88c'][i]);
  book.rotation.y=i%2?.09:-.06;
 }
 box(furnishing,[-10.58,h+1.005,6.025],[.028,.008,.065],'#b67478');
 const garden=part(0);
 for(const [x,z] of [[-8.9,7.65],[-7.4,7.65],[-7.3,9.7]]){
  box(garden,[x,1.48,z],[.65,.38,.65],'#aa917b',true);box(garden,[x,1.68,z],[.6,.035,.6],'#708467');
  for(let j=0;j<7;j++){const px=x+Math.sin(j*2.4)*.2,pz=z+Math.cos(j*2.4)*.2;line(garden,[px,1.7,pz],[px,1.98+(j%3)*.07,pz],.012,'#719b7b');const bloom=new THREE.Mesh(new THREE.IcosahedronGeometry(.075,0),mat(j%2?'#d7adb8':'#e7d1a0'));bloom.position.set(px,1.98+(j%3)*.07,pz);garden.add(bloom);}
 }
 box(garden,[-8.5,1.75,8.15],[1.25,.08,.4],'#b7a080');for(const x of [-9,-8])box(garden,[x,1.5,8.15],[.05,.45,.35],'#6b8b7e');
 for(const x of [-8.8,-8.2])seat(garden,[x,1.79,8.15],[x,1.29,8.64]);
 for(let i=0;i<5;i++){const stone=box(garden,[-9.4+i*.42,1.32,9.4],[.33,.04,.46],'#c9ccb6');stone.userData.walkThrough=true;}
 cyl(garden,[-7.25,2.05,8.6],.035,1.5,'#7e9686');box(garden,[-7.25,2.85,8.6],[.3,.3,.3],'#e8d3a1',true,1);
 const porch=part(0);porch.name='reading-porch-details';
 box(porch,[-13.5,h+.19,9.85],[.47,.38,.36],'#788f89',true);
 for(let i=0;i<3;i++){
  const x=-13.64+i*.13;
  cyl(porch,[x,h+.49,9.85],.035,.42,['#b59aa9','#9ab4ac','#c4b394'][i]);
  line(porch,[x,h+.49,9.85],[x,h+.85,9.85],.012,'#c6cdb9');
  kit.tube(porch,[[x,h+.85,9.85],[x,h+.92,9.85],[x+.07,h+.92,9.85],[x+.07,h+.86,9.85]],.012,'#c6cdb9');
 }
 for(const x of [-13.85,-9.95]){
  box(shell,[x,h+2.16,9.4],[.19,.28,.15],'#e7d4ad',true,.55);
  box(shell,[x,h+2.32,9.4],[.24,.045,.19],'#647b75');
 }
 const cap=part(0);
 const roofPanel=box(cap,[-11.9,4.08,7.3],[4.6,.16,4.5],'#6d8b80',true);roofPanel.name='reading-roof';for(let i=0;i<10;i++)box(cap,[-14+i*.47,4.205,7.3],[.025,.03,4.5],'#a2b4a0');
 // Fascia and lettering sit in front of the roof edge, rather than sharing its plane.
 box(cap,[-11.9,3.9,9.58],[4.45,.32,.16],'#d2d5b7',true);const roofText=sign(cap,[-11.9,3.9,9.675],3.9,.25,'雨庭  /  READING ROOM','#d2d5b7','#557c69');roofText.name='reading-fascia-text';
 box(cap,[-11.9,3.96,7.3],[1.3,.035,.3],'#ffdfaa',false,1.6);
 const light=new THREE.PointLight('#ffe0ae',8,5);light.position.set(-11.9,3.5,7.3);cap.add(light);
 roofs.push({x:-11.9,z:7.3,w:4.6,d:4.5,h:4.2});
}


