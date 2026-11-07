import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {northY} from './NorthTerrain';

const stalls=[
 {id:'takoyaki',x:-14.24,title:'たこ焼き',sub:'TAKOYAKI',color:'#a44e42',trim:'#f2d4a1',roof:'#575e64',shirt:'#eee1c9',skin:'#d9a385',hair:'#34333b'},
 {id:'oden',x:-11.89,title:'おでん',sub:'ODEN',color:'#547c6b',trim:'#d1d9a7',roof:'#596e66',shirt:'#9db7a5',skin:'#af7863',hair:'#383035'},
 {id:'yakitori',x:-9.54,title:'焼き鳥',sub:'YAKITORI',color:'#5b586f',trim:'#dda471',roof:'#404653',shirt:'#82778d',skin:'#e0a88b',hair:'#534439'},
 {id:'sweets',x:-7.19,title:'甘味処',sub:'SWEETS',color:'#ad717f',trim:'#f0dcc6',roof:'#78869b',shirt:'#cf9fa7',skin:'#edc4a7',hair:'#4a3943'},
] as const;
type Stall=(typeof stalls)[number];

function drawFood(kit:SceneKit,group:THREE.Group,style:Stall['id'],sphere:THREE.SphereGeometry){
 const {box,cyl,mat,glass}=kit;
 const counter=new THREE.Group();counter.name=`${style}-display`;group.add(counter);
 const ball=(x:number,y:number,z:number,r:number,color:string)=>{
  const mesh=new THREE.Mesh(sphere,mat(color));mesh.scale.setScalar(r);mesh.position.set(x,y,z);counter.add(mesh);
 };
 switch(style){
  case 'takoyaki':
   box(counter,[-.2,1.022,.69],[1.28,.1,.31],'#3e4850',true);
   for(let i=0;i<6;i++)for(const z of [.614,.769]){
    const x=-.71+i*.204;
    cyl(counter,[x,1.076,z],.077,.018,'#252f36');
    ball(x,1.095,z,.067,'#c69058');
    ball(x+.011,1.155,z,.021,'#805445');
    ball(x+.024,1.154,z+.021,.009,'#9bb673');
   }
   break;
  case 'oden':
   box(counter,[-.2,1.035,.694],[1.28,.127,.32],'#9baca8',true);
   box(counter,[-.2,1.104,.694],[1.18,.016,.244],'#9b754f');
   for(const x of [-.39,.006])box(counter,[x,1.126,.694],[.02,.037,.245],'#cfccc0');
   for(const z of [.639,.75]){
    cyl(counter,[-.62,1.133,z],.069,.064,'#e5d9a2');
    ball(-.207,1.141,z,.064,'#eee4c8');
    box(counter,[.203,1.134,z],[.111,.064,.08],'#bf9276').rotation.y=.31;
   }
   break;
  case 'yakitori':
   box(counter,[-.2,1.023,.666],[1.28,.101,.302],'#45444b',true);
   box(counter,[-.2,1.079,.666],[1.11,.027,.237],'#9e4f3e',false,.32);
   for(let i=0;i<7;i++){
    const x=-.71+i*.168;
    box(counter,[x,1.112,.666],[.016,.014,.293],'#6e7675');
    box(counter,[x+.057,1.129,.689],[.015,.017,.348],'#d5b484');
    for(const z of [.595,.674,.754])box(counter,[x+.057,1.154,z],[.101,.051,.061],i%2?'#a2694d':'#be8c58').rotation.y=i%2?.15:-.12;
   }
   break;
  case 'sweets': {
   box(counter,[-.2,1.013,.69],[1.3,.078,.303],'#a68f9b',true);
   const cover=new THREE.Mesh(new THREE.BoxGeometry(1.28,.235,.3),glass);
   cover.position.set(-.2,1.169,.69);counter.add(cover);
   for(let i=0;i<6;i++){
    const x=-.7+i*.2;
    box(counter,[x,1.066,.69],[.014,.012,.224],'#ae8869');
    for(const [j,color] of ['#d69fa8','#eee4c7','#aab882'].entries())ball(x,1.11,.618+j*.061,.039,color);
   }
   break;
  }
 }
}

function vendor(kit:SceneKit,stall:Stall,group:THREE.Group,sphere:THREE.SphereGeometry){
 const {box,cyl,mat}=kit;
 const person=new THREE.Group();person.name=`${stall.id}-vendor`;
 person.position.set(stall.id==='oden'?.16:-.09,0,.31);
 person.rotation.y=stall.id==='yakitori'?.19:-.12;
 person.userData.walkThrough=true;
 group.add(person);
 const round=(parent:THREE.Group,position:[number,number,number],size:[number,number,number],color:string)=>{
  const mesh=new THREE.Mesh(sphere,mat(color));mesh.position.set(...position);mesh.scale.set(...size);parent.add(mesh);
 };
 const joint=(parent:THREE.Group,name:string,position:[number,number,number])=>{
  const pivot=new THREE.Group();pivot.name=`${stall.id}-vendor-${name}`;pivot.position.set(...position);
  pivot.userData.animated=true;parent.add(pivot);return pivot;
 };
 for(const x of [-.095,.095]){
  box(person,[x,.31,0],[.128,.51,.135],'#485158');
  round(person,[x,.057,.052],[.084,.053,.118],'#3e464a');
 }
 round(person,[0,1.045,0],[.225,.293,.132],stall.shirt);
 box(person,[0,1.002,.123],[.26,.319,.041],stall.color);
 for(const x of [-.081,.081])box(person,[x,1.205,.121],[.036,.162,.029],stall.trim);
 const [left,right]=[-1,1].map(side=>{
  const arm=joint(person,side<0?'left-arm':'right-arm',[side*.204,1.215,.025]);
  round(arm,[0,-.082,.004],[.078,.143,.083],stall.shirt);
  round(arm,[side*.017,-.166,.093],[.068,.067,.111],stall.shirt);
  round(arm,[0,-.173,.18],[.048,.043,.059],stall.skin);
  return arm;
 });
 const head=joint(person,'head',[0,1.42,0]);
 for(const x of [-.176,.176])round(head,[x,.068,.018],[.047,.064,.04],stall.skin);
 round(head,[0,.096,-.024],[.202,.212,.159],stall.hair);
 round(head,[0,.07,.039],[.174,.177,.151],stall.skin);
 const eyes=joint(head,'eyes',[0,.094,.181]);
 for(const x of [-.061,.061])round(eyes,[x,0,0],[.015,.023,.014],'#323441');
 round(head,[0,.031,.19],[.031,.01,.008],'#985c55');
 if(stall.id==='oden'){
  round(head,[0,.241,-.006],[.205,.069,.167],stall.color);
  box(head,[0,.213,.124],[.31,.04,.128],stall.trim);
  box(right,[0,-.178,.27],[.018,.018,.22],'#b8b9ad');
  cyl(right,[0,-.184,.391],.052,.025,'#a2aba8');
 }else if(stall.id==='sweets'){
  round(head,[-.166,.172,-.068],[.084,.09,.077],stall.hair);
  round(head,[.126,.211,.116],[.048,.035,.029],stall.trim);
 }else{
  const band=cyl(head,[0,.198,.003],.177,.043,stall.trim);
  band.scale.z*=.83;
  if(stall.id==='takoyaki')box(right,[0,-.18,.263],[.014,.014,.205],'#dfbc8d');
  else for(const x of [-.014,.014])box(right,[x,-.179,.272],[.015,.019,.225],'#b5b8ac').rotation.y=x*2;
 }
 for(const limb of [head,left,right])limb.traverse(object=>{object.castShadow=false;});

 const phase={takoyaki:.4,oden:1.7,yakitori:2.8,sweets:4.1}[stall.id];
 let previous=-1;
 return (t:number)=>{
  if(t===previous)return;
  previous=t;
  if(t===0){
   head.rotation.set(0,0,0);left.rotation.set(0,0,0);right.rotation.set(0,0,0);eyes.scale.y=1;
   return;
  }
  const clock=t+phase, blink=clock%4.1;
  eyes.scale.y=blink<.16?1-.91*Math.sin(Math.PI*blink/.16):1;
  left.rotation.x=-.08+.07*Math.sin(clock*1.6);
  switch(stall.id){
   case 'takoyaki': {
    const beat=clock*2.5;
    right.rotation.set(-.33-.27*Math.sin(beat),.32*Math.sin(beat*.5),.11+.18*Math.cos(beat));
    head.rotation.set(.16+.07*Math.cos(beat),.12*Math.sin(beat*.5),0);
    break;
   }
   case 'oden': {
    const stir=clock*1.72;
    right.rotation.set(-.27+.17*Math.cos(stir),.43*Math.sin(stir),-.04);
    head.rotation.set(.17,.21*Math.sin(stir),.06);
    break;
   }
   case 'yakitori': {
    const flip=Math.pow(.5+.5*Math.sin(clock*2.08),3);
    right.rotation.set(-.29-.53*flip,-.22+.37*flip,.07+.34*flip);
    head.rotation.set(.22-.12*flip,-.18+.24*flip,-.07);
    break;
   }
   case 'sweets': {
    const progress=clock%6.4;
    const wave=THREE.MathUtils.smoothstep(progress,.35,.8)*(1-THREE.MathUtils.smoothstep(progress,2,2.55));
    right.rotation.set(-1.05*wave,-.16*wave,(1.25+.26*Math.sin(clock*11))*wave);
    head.rotation.set(-.08*wave,.16*Math.sin(clock*1.3),-.09*wave);
    break;
   }
  }
 };
}

function stall(kit:SceneKit,index:number,sphere:THREE.SphereGeometry){
 const {part,box,cyl,sign,roofs}=kit;
 const spec=stalls[index],{id,x,title,sub,color,trim,roof}=spec,z=-40.61;
 const g=part(0);g.name='north-food-stall-'+index;g.position.set(x,northY,z);
 box(g,[0,1.02,-.84],[2.16,2.04,.12],'#a3a595',true);
 for(const dx of [-1.035,1.035]){
  box(g,[dx,1.025,0],[.09,2.05,1.59],'#9da394',true);
  box(g,[dx,1.028,.842],[.096,2.055,.104],'#677e74',true);
 }
 box(g,[0,.46,.726],[2.07,.92,.248],color,true);
 box(g,[0,.938,.724],[2.135,.067,.36],'#c8b18e',true);
 if(id==='takoyaki'||id==='yakitori'){
  const vertical=id==='takoyaki';
  for(let i=0;i<(vertical?9:4);i++)box(g,vertical?[-.918+i*.23,.454,.865]:[0,.21+i*.16,.865],vertical?[.032,.709,.028]:[1.89,.026,.028],trim);
 }else{
  sign(g,[0,.45,.866],1.11,.355,id==='oden'?'出汁仕立て':'三色だんご',trim,color,id==='oden'?'DASHI':'DANGO');
 }
 box(g,[0,2.078,-.031],[2.31,.128,1.97],roof,true);
 box(g,[0,1.964,.9],[2.22,.21,.11],color,true);
 sign(g,[0,1.986,.963],1.81,.258,title,color,'#fff0cd',sub,0,.5);
 const canopy=new THREE.Group();canopy.position.set(0,1.846,1.008);canopy.rotation.x=id==='yakitori'?.05:.16;g.add(canopy);
 box(canopy,[0,0,0],[2.22,.049,.396],color);
 for(let i=0;i<8;i++){
  const x=-.969+i*.276;
  if(id==='takoyaki')box(canopy,[x,.031,0],[.116,.012,.394],trim).castShadow=false;
  if(id==='sweets'){
   const scallop=cyl(canopy,[x,-.028,.193],.134,.033,i%2?color:trim);
   scallop.rotation.x=Math.PI/2;scallop.scale.z*=.42;
  }
 }
 if(id==='yakitori')for(const x of [-.76,0,.76])box(g,[x,1.771,1.221],[.72,.12,.025],color);
 if(id==='oden')for(const x of [-.86,.86]){
  box(g,[x,1.808,1.09],[.024,.057,.024],roof);
  cyl(g,[x,1.658,1.09],.092,.225,'#eac992').material=kit.mat('#eac992',.58);
  for(const y of [1.538,1.778])cyl(g,[x,y,1.09],.092,.027,roof);
 }
 box(g,[0,1.772,.51],[1.69,.036,.09],'#fae3b9',false,1.15);
 box(g,[0,.494,-.482],[1.95,.988,.38],'#8c9586',true);
 box(g,[0,1.055,-.47],[1.98,.086,.434],'#a4aaa0');
 for(const y of [1.224,1.498]){
  box(g,[0,y,-.69],[1.76,.043,.237],'#837e69');
  for(let i=0;i<5;i++)cyl(g,[-.67+i*.32,y+.083,-.67],.066,.128,['#d4c5a6','#a2aa91','#b59b7a'][i%3]);
 }
 drawFood(kit,g,id,sphere);
 const animate=vendor(kit,spec,g,sphere);
 box(g,[.735,1.038,.68],[.29,.153,.208],'#78918b',true);
 box(g,[.735,1.12,.724],[.222,.026,.118],'#b6c7b3');
 roofs.push({x,z,w:2.32,d:2.08,h:northY+2.15});
 return animate;
}

function vendingMachine(kit:SceneKit){
 const {part,box,sign}=kit;
 const g=part(0);g.name='north-food-vending';g.position.set(-5.11,northY,-40.54);
 box(g,[0,.863,0],[.94,1.73,.61],'#9faeab',true);
 box(g,[0,1.65,.316],[.84,.145,.031],'#89a7a0',false,.66);
 box(g,[-.075,1.148,.31],[.66,.788,.034],'#678788',true);
 for(let row=0;row<3;row++){
  const y=.914+row*.224;
  box(g,[-.075,y-.085,.335],[.622,.025,.03],'#bfcaba',false,.25);
  for(let col=0;col<5;col++){
   const color=['#d4a58b','#b0c8ab','#ced0a4','#86a6ae','#b9a5ad'][(row+col)%5];
   box(g,[-.316+col*.121,y,.343],[.079,.127,.046],color,false,.44);
  }
 }
 box(g,[.33,.921,.325],[.117,.347,.039],'#658187');
 box(g,[.33,.994,.352],[.067,.076,.019],'#afd0b5',false,.59);
 box(g,[-.03,.314,.319],[.56,.196,.053],'#5e777b',true);
 sign(g,[0,1.66,.342],.69,.128,'飲みもの','#759e97','#f5e5c1','',0,.46);
}

export function* buildNorthFood(kit:SceneKit,registerVendor:(animate:(seconds:number)=>void)=>void){
 const sphere=new THREE.SphereGeometry(1,12,8);
 for(let i=0;i<stalls.length;i++){registerVendor(stall(kit,i,sphere));yield;}
 vendingMachine(kit);
}
