import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {northY,northTea,northHouse as house, houseFlights, floorY} from './NorthTerrain';
import {seat} from './Seats';

const mid=(a:number,b:number)=>(a+b)/2;
function housePart(kit:SceneKit,name:string,level=0){
 const group=kit.part(0);group.name=name;
 group.position.set(house.x,floorY(level),house.z);
 return group;
}

function shell(kit:SceneKit){
 const {box,sign,glass,roofs,mat}=kit,group=housePart(kit,'north-three-storey-house');
 const {west,east,back,front,rise}=house,w=east-west,d=front-back;
 const h=3*rise;
 for(const x of [west+.06,east-.06])box(group,[x,h/2,0],[.12,h,d-.24],'#b6b3a1',true).receiveShadow=false;
 box(group,[0,h/2,back+.06],[w,h,.12],'#a5ac9d',true).receiveShadow=false;
 for(let level=0;level<3;level++){
  const y=level*rise,open=level===0||level===2;
  for(const [a,b] of [[west,open?-.66:0],[open?.66:0,east]]){
   box(group,[mid(a,b),y+.27,front-.061],[b-a,.54,.122],'#947d69',true);
   const width=b-a-.15;
   const pane=new THREE.Mesh(new THREE.PlaneGeometry(width,1.18),glass);
   pane.position.set(mid(a,b),y+1.15,front+.02);group.add(pane);
   for(const x of [a+.075,mid(a,b),b-.075])box(group,[x,y+1.15,front+.037],[.037,1.18,.061],'#657f76');
   for(const yy of [.548,1.749])box(group,[mid(a,b),y+yy,front+.041],[width+.035,.046,.069],'#657f76');
  }
  box(group,[0,y+1.972,front-.059],[w,.403,.118],level===1?'#879c95':'#8f9b8c',true);
  if(open)for(const x of [-.69,.69])box(group,[x,y+.93,front+.012],[.049,1.86,.104],'#6b8279');
  for(const x of [-1.54,1.54]){
   box(group,[x,y+1.2,back-.015],[1.31,.83,.036],'#647f78',true);
   box(group,[x,y+1.2,back-.039],[1.15,.69,.011],'#c2ad89',false,.19);
  }
 }
 const eave=w/2+.23,roofDepth=d+.49;
 const section=new THREE.Shape();
 section.moveTo(-eave,h-.035);section.lineTo(eave,h-.035);
 section.lineTo(eave,h+.10);section.lineTo(0,h+.59);section.lineTo(-eave,h+.10);section.closePath();
 const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{depth:roofDepth,bevelEnabled:false}),mat('#566873'));
 roof.position.z=-roofDepth/2;roof.castShadow=true;roof.receiveShadow=true;group.add(roof);
 const slope=Math.atan2(.49,eave),span=Math.hypot(.49,eave);
 for(let z=-roofDepth/2+.22;z<roofDepth/2-.1;z+=.37){
  for(const side of [-1,1]){
   const seam=box(group,[side*eave/2,h+.368,z],[span-.057,.026,.025],'#7f9193');
   seam.rotation.z=-side*slope;seam.castShadow=false;
  }
 }
 for(let level=0;level<3;level++){
  const y=level*rise;
  box(group,[west-.032,y+1.24,-.79],[.068,.83,1.33],'#637e77');
  box(group,[west-.074,y+1.24,-.79],[.015,.67,1.17],'#bfa986',false,.25);
  for(const z of [-1.15,-.79,-.43])box(group,[west-.09,y+1.24,z],[.031,.69,.028],'#657b73');
  for(let i=0;i<5;i++)box(group,[west-.025,y+.95,.31+i*.147],[.06,1.74,.054],'#a29279');
 }
 box(group,[0,.012,front+.24],[.98,.02,.34],'#8b8374').userData.walkThrough=true;
 for(const [y,title] of [[1.96,'青葉の家'],[2*rise+1.97,'展望デッキ']] as const){
  sign(group,[0,y,front+.021],1.19,.185,title,'#b5ab91','#4f6962');
 }
 roofs.push({x:house.x,z:house.z,w:eave*2,d:roofDepth,h:northY+h+.62});
}

function stairwell(kit:SceneKit){
 const {box}=kit,group=housePart(kit,'north-stairwells');
 const {west,east,back,front,rise}=house;
 const slab=(a:number,b:number,c:number,d:number,y:number)=>{
  box(group,[mid(a,b),y-.063,mid(c,d)],[b-a,.126,d-c],'#b4a68e').userData.solidFloor=true;
 };
 for(const [i,flight] of houseFlights.entries()){
  const {left,right,lowZ,highZ}=flight;
  const top=rise*(i+1);
  slab(west+.12,left,back+.12,front-.12,top);
  slab(right,east-.12,back+.12,front-.12,top);
  slab(left,right,back+.12,highZ,top);
  slab(left,right,lowZ,front-.12,top);
  const count=15,depth=(lowZ-highZ)/count,base=rise*i;
  for(let step=0;step<count;step++){
   const h=rise*(step+1)/count,z=lowZ-(step+.5)*depth;
   const tread=box(group,[mid(left,right),base+h/2,z],[right-left,h,depth],'#9f8d76');
   if(i===1){
    tread.name='north-upper-stair-tread';
    tread.userData.solidFloor=true;
   }else tread.userData.walkThrough=true;
   box(group,[mid(left,right),base+h+.006,z+depth*.38],[right-left-.04,.013,.025],'#697d72').userData.walkThrough=true;
   if(step>0)for(const x of [left-.014,right+.014])box(group,[x,base+h/2,z],[.028,h,depth],'#93816c');
  }
  const railX=i===0?right+.036:left-.036;
  for(let j=0;j<6;j++)box(group,[railX,top+.365,highZ+.32+j*.49],[.043,.73,.047],'#6b867e');
  box(group,[railX,top+.74,mid(highZ+.32,lowZ)],[.06,.05,lowZ-highZ-.32],'#9baea0');
 }
 slab(-1.5,1.5,front-.12,front+.89,2*rise);
 for(const x of [-1.45,1.45])box(group,[x,2*rise+.38,front+.425],[.073,.76,.88],'#7f998f',true);
 for(let i=0;i<9;i++)box(group,[-1.37+i*.34,2*rise+.37,front+.826],[.04,.74,.046],'#6b8780');
 box(group,[0,2*rise+.76,front+.826],[2.99,.048,.083],'#9eafa3');
}

function furnish(kit:SceneKit,level:number){
 const {box,cyl,sign,mat}=kit,room=housePart(kit,'north-house-room-'+level,level);
 room.userData.streamInterior=true;
 if(level===0){
  box(room,[1.91,.46,-.49],[.82,.92,2.27],'#a0a891',true);
  box(room,[1.91,.956,-.49],[.86,.067,2.32],'#cbbb9a');
  box(room,[1.95,.999,-.96],[.54,.025,.55],'#6d8d90');
  for(const z of [-.16,.25]){
   cyl(room,[1.86,1.008,z],.114,.028,'#65756b');
   cyl(room,[1.86,1.077,z],.08,.11,'#a6987a');
  }
  for(const z of [-1.43,-.81,-.19,.43])box(room,[2.27,1.58,z],[.35,.37,.54],'#9da893',true);
  box(room,[.25,.623,-.49],[.85,.064,1.2],'#a98c6e',true);
  for(const x of [-.05,.55])for(const z of [-.9,-.07])box(room,[x,.295,z],[.047,.6,.052],'#766957');
  for(const z of [-.84,-.45,-.1])cyl(room,[.25,.687,z],.072,.065,'#d8cba7');
  for(const z of [-.86,-.16]){
   const x=-.52;
   cyl(room,[x,.404,z],.19,.075,'#a2866e');
   cyl(room,[x,.182,z],.056,.366,'#756b58');
   seat(room,[x,.444,z],[x-.38,0,z+.06]);
  }
  box(room,[1.9,.45,1.65],[.7,.9,.52],'#958069',true);
  for(let i=0;i<3;i++)box(room,[1.87,.27+i*.22,1.373],[.49,.03,.025],'#b8a587');
  sign(room,[.26,1.45,backWall()],1.25,.35,'台所','#c9bb9d','#567365');
 }else if(level===1){
  box(room,[.04,.025,-.04],[1.58,.04,2.29],'#a3af90').userData.walkThrough=true;
  box(room,[.04,.28,-.89],[1.63,.4,.57],'#8ea48f',true);
  box(room,[.04,.59,-1.135],[1.7,.58,.126],'#78958a',true);
  for(const x of [-.48,.04,.56]){
   box(room,[x,.506,-.88],[.49,.056,.43],'#a8b7a0');
   seat(room,[x,.536,-.86],[x,0,-.25]);
  }
  box(room,[.15,.304,.36],[.94,.056,.61],'#ac9379',true);
  for(const x of [-.17,.47])box(room,[x,.14,.36],[.073,.28,.49],'#6c7f73');
  box(room,[.13,.351,.37],[.26,.032,.2],'#879b9a');
  for(const x of [-.63,-.07,.49])box(room,[x,.65,2.02],[.51,1.26,.31],'#7b8171',true);
  for(let i=0;i<12;i++)box(room,[-.84+i*.133,1.07,1.84],[.091,.204,.075],['#c1ae89','#83978b','#b69287'][i%3]);
  sign(room,[.02,1.65,backWall()],1.04,.48,'雨の午後','#c6bba0','#5d776b');
 }else{
  for(let i=0;i<6;i++)box(room,[-1.96+i*.55,.016,-.05],[.52,.032,3.08],'#adb596').userData.walkThrough=true;
  box(room,[-1.57,.17,-.34],[1.12,.34,1.81],'#937d66',true);
  box(room,[-1.57,.386,-.34],[1.05,.142,1.74],'#ddd2b5',true);
  box(room,[-1.57,.475,-.14],[1.01,.044,1.09],'#a08e9d');
  for(let i=0;i<5;i++)box(room,[-1.96+i*.19,.505,-.16],[.023,.011,1.055],'#bda8b0');
  box(room,[-1.57,.469,-1.035],[.59,.088,.32],'#e2d6b8');
  seat(room,[-1.29,.503,-.31],[-.79,0,-.27]);
  box(room,[-.07,.707,-1.88],[1.44,.068,.52],'#a99072',true);
  for(const x of [-.63,.49])box(room,[x,.33,-1.88],[.062,.66,.49],'#786a5b');
  box(room,[-.24,.759,-1.81],[.28,.035,.207],'#84998d');
  cyl(room,[.47,.89,-1.93],.03,.31,'#6e8a81');
  cyl(room,[.47,1.06,-1.93],.104,.15,'#e6cb9c').material=mat('#e6cb9c',.53);
  cyl(room,[-.26,.405,-1.22],.19,.06,'#a28970');
  cyl(room,[-.26,.188,-1.22],.06,.38,'#768373');
  seat(room,[-.26,.437,-1.22],[-.22,0,-.82]);
  for(const x of [-1.1,1.1]){
   box(room,[x,.136,2.85],[.31,.27,.25],'#9c826b',true);
   box(room,[x,.329,2.85],[.25,.146,.21],'#769780');
  }
 }
 box(room,[0,house.rise-.137,.38],[1.31,.032,.122],'#f5dcb2',false,.66).castShadow=false;
 const light=new THREE.PointLight('#ffe2b2',level===0?2.5:1.8,3.8);
 light.position.set(0,1.9,.12);room.add(light);
}
const backWall=()=>house.back+.127;

function tearoom(kit:SceneKit){
 const {part,box,cyl,sign,roofs,glass}=kit;
 const g=part(0);g.name='north-tearoom';g.position.set(northTea.x,northY,northTea.z);
 const {w,d}=northTea,h=2.36,z=d/2;
 box(g,[0,h/2,-z+.051],[w,h,.102],'#9cae9a',true);
 for(const x of [-w/2+.052,w/2-.052])box(g,[x,h/2,0],[.104,h,d-.2],'#a7af98',true);
 for(const x of [-1.16,1.16]){
  box(g,[x,.37,z-.035],[1.05,.74,.097],'#827969',true);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(.99,1.09),glass);pane.position.set(x,1.31,z+.018);g.add(pane);
  for(let i=0;i<4;i++)box(g,[x-.41+i*.267,1.31,z+.034],[.03,1.11,.053],'#687e73');
 }
 box(g,[0,2.065,z],[w,.48,.111],'#75887c',true);
 box(g,[0,h+.056,0],[w+.34,.13,d+.34],'#5e7878',true);
 box(g,[0,1.86,z+.152],[w+.05,.065,.39],'#798f88',true);
 sign(g,[0,2.06,z+.069],1.56,.25,'青葉茶屋','#c8b793','#536d62','お茶  •  休憩');
 box(g,[0,.017,0],[w-.18,.029,d-.17],'#b4b694').userData.walkThrough=true;
 box(g,[.89,.56,-.79],[.93,1.1,.62],'#998871',true);
 for(let i=0;i<4;i++)cyl(g,[.53+i*.22,1.169,-.76],.064,.12,'#dfd3af');
 for(const y of [.96,1.36,1.76]){
  box(g,[-.92,y,-z+.24],[1.04,.045,.25],'#8c806c');
  for(let i=0;i<4;i++)cyl(g,[-1.27+i*.23,y+.096,-z+.23],.058,.15,['#c2a282','#9dab95','#c4b791','#889c93'][i]);
 }
 sign(g,[.63,1.81,-z+.062],1.21,.41,'今日のお茶','#c7ba96','#536e63','ほうじ茶  /  煎茶');
 box(g,[-.96,.347,-.22],[.75,.076,.92],'#ad9676',true);
 box(g,[-.96,.169,-.22],[.14,.34,.16],'#776e5d');
 for(const x of [-1.2,-.78])cyl(g,[x,.427,-.22],.073,.083,'#d8c9a9');
 box(g,[-1.08,.35,.75],[.79,.084,.32],'#a18a6c',true);
 for(const x of [-1.33,-.83])box(g,[x,.16,.75],[.064,.32,.25],'#6d776a');
 seat(g,[-1.05,.393,.75],[-.49,0,.79]);
 box(g,[0,2.25,-.18],[1.8,.037,.11],'#f5ddb1',false,.79);
 roofs.push({x:northTea.x,z:northTea.z,w:w+.34,d:d+.34,h:northY+h+.15});
}

export function* buildNorthInteriors(kit:SceneKit){
 tearoom(kit);
 yield;
 shell(kit);
 yield;
 stairwell(kit);
 yield;
 for(let level=0;level<3;level++){furnish(kit,level);yield;}
}
