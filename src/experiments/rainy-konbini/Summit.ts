import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {hillParking as parking,parkingShoulderEdge,summit,summitBalcony as balcony,summitHouse as house,summitStairs as stairs} from './SummitTerrain';
import {hillRows,hillTop} from './HillTerrain';
import {seat} from './Seats';

const floor=summit.y;
const midpoint=(a:number,b:number)=>(a+b)/2;

function foundation(kit:SceneKit){
  const {part,box,sign}=kit;
  const terrace=part(0);
  terrace.name='summit-foundation';
  const bottom=.063;
  box(terrace,[midpoint(summit.west,summit.east),midpoint(bottom,floor),midpoint(summit.north,summit.south)],
    [summit.east-summit.west,floor-bottom,summit.south-summit.north],'#73827e');
  const wallEnd=parkingShoulderEdge(hillTop);
  for(let x=summit.west+.4;x<wallEnd-.25;x+=.84){
    for(const y of [.62,1.3,1.98,2.66,3.3]){
      box(terrace,[x,y,-23.993],[.805,.022,.014],'#929b8e').castShadow=false;
      box(terrace,[x+.4,y-.3,-23.991],[.018,.56,.017],'#88968b').castShadow=false;
    }
  }
  for(const x of [3.73,5.43,7.15]){
    box(terrace,[x,2.71,-23.949],[.92,.1,.133],'#647977');
    box(terrace,[x,2.641,-23.931],[.68,.031,.077],'#edcca0',false,.55).castShadow=false;
  }
  sign(terrace,[4.46,1.67,-23.978],1.54,.85,'月極駐車場','#536e72','#ded4ae','青葉町  •  P  01–02');
  sign(terrace,[6.14,1.55,-23.976],.74,.91,'夏祭り','#958377','#ead8af','八月  24 日');
  sign(terrace,[7.24,.99,-23.977],.9,.33,'☾  あさぎり','#73827e','#b19caa','雨の日も');
  const walls=[[summit.west,wallEnd,summit.south-.14],[summit.west,4.65,summit.north+.13],
    [7.45,15.17,summit.north+.13],[17.54,summit.east,summit.north+.13]];
  for(const [a,b,z] of walls){
    box(terrace,[midpoint(a,b),floor+.27,z],[b-a,.54,.14],'#9ba59a',true);
    box(terrace,[midpoint(a,b),floor+.565,z],[b-a,.05,.18],'#829a92');
  }
  box(terrace,[summit.east-.1,floor+.27,midpoint(summit.north,summit.south)],
    [.14,.54,summit.south-summit.north-.34],'#9ba59a',true);
  for(let x=4;x<20.1;x+=.52){
    box(terrace,[x,floor+.006,-24.22],[.42,.009,.016],'#a1aa9d').castShadow=false;
  }
  for(const x of [5.24,7.05,16.76,18.93]){
    box(terrace,[x,floor+.157,-28.85],[.8,.31,.61],'#9d9585',true);
    box(terrace,[x,floor+.325,-28.85],[.69,.035,.5],'#859986');
    for(let i=0;i<3;i++){
      const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),kit.mat('#7b9e8b'));
      shrub.position.set(x-.22+i*.22,floor+.42+i%2*.04,-28.85);terrace.add(shrub);
    }
  }
  box(terrace,[6.12,floor+.405,-27.28],[1.38,.077,.31],'#a69376',true);
  for(const x of [5.62,6.62])box(terrace,[x,floor+.184,-27.28],[.08,.36,.25],'#687f79');
  seat(terrace,[6.12,floor+.445,-27.28],[6.12,floor,-26.82]);
}

function parkingSurface(kit:SceneKit){
  const {part,box,sign}=kit;
  const lot=part(0);
  lot.name='asagiri-parking';
  const d=parking.south-parking.north,w=parking.east-parking.west;
  box(lot,[midpoint(parking.west,parking.east),.1,midpoint(parking.north,parking.south)],[w,.072,d],'#526777');
  const zRows=[parking.south,...hillRows.filter(z=>z<parking.south&&z>parking.north),parking.north],vertices:number[]=[];
  for(let i=1;i<zRows.length;i++){
    const a=zRows[i-1],b=zRows[i];
    const edgeA=Math.max(parking.east,parkingShoulderEdge(a)),edgeB=Math.max(parking.east,parkingShoulderEdge(b));
    vertices.push(parking.east,.125,a,edgeA,.125,a,parking.east,.125,b,edgeA,.125,a,edgeB,.125,b,parking.east,.125,b);
  }
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.computeVertexNormals();
  const shoulder=new THREE.Mesh(geometry,kit.mat('#758784'));
  shoulder.receiveShadow=true;lot.add(shoulder);
  for(let z=-23.68;z<parking.south-.1;z+=.38){
    box(lot,[parkingShoulderEdge(z)-.075,.13,z],[.12,.01,.34],'#9ca89c').castShadow=false;
  }
  for(const x of [3.19,4.95,6.7])box(lot,[x,parking.y+.007,-21.79],[.043,.009,3.85],'#aab0a4');
  for(const x of [4.05,5.81]){
    box(lot,[x,parking.y+.051,-23.59],[.87,.10,.127],'#97a59d',true);
    box(lot,[x,parking.y+.009,-19.85],[1.56,.011,.045],'#b2baaa');
  }
  for(const z of [-22.73,-21.45,-20.17]){
    for(let j=0;j<3;j++)box(lot,[6.78+j*.101,parking.y+.011,z],[.062,.012,.55],'#929e95');
  }
  for(let z=-23.66;z<-18.53;z+=.24){
    box(lot,[7.05,parking.y+.005,z],[.16,.008,.218],'#6b807f');
    box(lot,[7.05,parking.y+.011,z],[.134,.007,.022],'#9ba9a0');
  }
  const pillar=box(lot,[3.17,.75,-18.67],[.055,1.27,.06],'#708b87');
  pillar.castShadow=false;
  sign(lot,[3.17,1.23,-18.632],.29,.38,'P','#6c848e','#eee6c9','月極');
}

function vehicle(kit:SceneKit,x:number,z:number,van:boolean){
  const {part,box,cyl,mat}=kit;
  const car=part(0);
  car.name=van?'asagiri-kei-van':'asagiri-city-car';
  car.position.set(x,parking.y,z);
  car.scale.set(1.65,2.05,1.82);
  const w=van?.89:.85,d=van?1.87:1.77,body=van?'#a1a99c':'#7f969d';
  box(car,[0,.28,0],[w,.31,d],body,true);
  box(car,[0,.411,van?-.018:.05],[w-.035,.14,d-.11],body);
  box(car,[0,.552,van?-.08:-.153],[w-.085,van?.345:.27,van?1.43:.94],body,true);
  const glassColor='#3a525d';
  const windscreen=box(car,[0,van?.57:.554,van?.639:.324],[w-.19,van?.25:.213,.037],glassColor);
  windscreen.rotation.x=van?-.1:-.26;
  box(car,[0,.548,van?-.807:-.631],[w-.21,.209,.028],glassColor);
  for(const side of [-1,1]){
    const sx=side*(w/2-.038);
    for(const wz of [van?-.48:-.4,van?.23:.095]){
      box(car,[sx,.556,wz],[.018,.19,van?.54:.38],glassColor);
      box(car,[sx+side*.012,.436,wz],[.013,.025,.065],'#bcc8bd');
    }
    box(car,[side*(w/2+.034),.476,.3],[.091,.063,.11],body,true);
    for(const wz of [-d*.31,d*.31]){
      const wheel=cyl(car,[side*(w/2-.02),.156,wz],.145,.102,'#293c47');wheel.rotation.z=Math.PI/2;
      const hub=cyl(car,[side*(w/2+.033),.156,wz],.077,.012,'#9faea9');hub.rotation.z=Math.PI/2;
    }
    box(car,[side*w*.34,.322,d/2+.009],[.148,.09,.026],'#d9d5af');
    box(car,[side*w*.34,.338,-d/2-.009],[.147,.094,.027],'#ac7276');
  }
  for(const side of [-1,1])box(car,[0,.197,side*(d/2+.018)],[w+.027,.082,.085],'#667a7e');
  box(car,[0,.288,d/2+.023],[.18,.073,.018],'#c2ba83');
  box(car,[0,.28,-d/2-.023],[.17,.065,.018],'#c2ba83');
  const seam=box(car,[0,.482,van?.705:.579],[w-.11,.017,.028],'#a9bbb3');seam.material=mat(body);
}

function shell(kit:SceneKit){
  const {part,box,glass,sign,roofs}=kit;
  const group=part(0);
  group.name='summit-house';
  const {west,east,north,south,upper}=house;
  const cx=midpoint(west,east),cz=midpoint(north,south),width=east-west,depth=south-north;
  const top=upper+2.22,h=top-floor;
  box(group,[west+.055,midpoint(floor,top),cz],[.11,h,depth-.24],'#b1b4a4',true).receiveShadow=false;
  box(group,[east-.055,midpoint(floor,top),cz],[.11,h,depth-.24],'#a8ab9c',true).receiveShadow=false;
  box(group,[cx,midpoint(floor,top),north+.06],[width,h,.12],'#abb0a0',true).receiveShadow=false;
  const window=(a:number,b:number,z:number,base:number,height:number)=>{
    const x=midpoint(a,b),w=b-a;
    const glassPane=new THREE.Mesh(new THREE.PlaneGeometry(w,height),glass);
    glassPane.position.set(x,base+height/2,z);group.add(glassPane);
    for(const px of [a,x,b])box(group,[px,base+height/2,z+.025],[.039,height,.057],'#687c75');
    for(const y of [base,base+height])box(group,[x,y,z+.025],[w+.034,.046,.069],'#687c75');
  };
  const front=(base:number,doorA:number,doorB:number)=>{
    const wy=base+.57;
    const spans=[[west,doorA],[doorB,east]];
    for(const [a,b] of spans){
      box(group,[midpoint(a,b),base+.282,south-.059],[b-a,.564,.118],'#9b8974',true);
      window(a+.06,b-.06,south,wy,1.29);
    }
    box(group,[cx,base+2.017,south-.061],[width,.336,.122],'#9f9c89',true);
    for(const x of [doorA-.027,doorB+.027])box(group,[x,base+.94,south+.015],[.05,1.88,.10],'#667b72');
  };
  front(floor,10.27,11.55);
  front(upper,9.63,10.74);
  sign(group,[10.88,floor+1.96,south+.014],1.04,.168,'坂上の家','#a99d88','#4e655e');
  box(group,[cx,upper-.075,south+.055],[width+.15,.12,.255],'#718a82',true);
  box(group,[cx,top+.045,cz],[width+.34,.15,depth+.45],'#576f79',true);
  for(let i=0;i<13;i++)box(group,[west+.06+i*.42,top+.134,cz],[.023,.026,depth+.4],'#8d9e98').castShadow=false;
  roofs.push({x:cx,z:cz,w:width+.34,d:depth+.45,h:top+.16});
}

function stairsAndBalcony(kit:SceneKit){
  const {part,box}=kit;
  const group=part(0),upper=house.upper;
  const slab=(left:number,right:number,near:number,far:number)=>{
    box(group,[midpoint(left,right),upper-.066,midpoint(near,far)],[right-left,.132,far-near],'#b4a694',true).userData.solidFloor=true;
  };
  slab(house.west+.12,stairs.west,house.north+.12,house.south-.12);
  slab(stairs.west,house.east-.12,house.north+.12,stairs.top);
  // A shallow threshold joins the upper room and the balcony across the front wall.
  slab(balcony.west,balcony.east,house.south-.12,balcony.south);
  const steps=15;
  const stepDepth=(stairs.bottom-stairs.top)/steps;
  for(let i=0;i<steps;i++){
    const height=(upper-floor)*(i+1)/steps;
    const z=stairs.bottom-(i+.5)*stepDepth;
    box(group,[midpoint(stairs.west,stairs.east),floor+height/2,z],[stairs.east-stairs.west,height,stepDepth],'#a5947d').userData.walkThrough=true;
    box(group,[midpoint(stairs.west,stairs.east),floor+height+.009,z+stepDepth*.4],[stairs.east-stairs.west+.024,.017,.034],'#6f7a6e').userData.walkThrough=true;
    // The lowest tread is a step-up from the room; close the solid sides above it.
    if(i>0)for(const x of [stairs.west-.016,stairs.east+.016]){
      box(group,[x,floor+height/2,z],[.032,height,stepDepth],'#94816d');
    }
  }
  for(const x of [balcony.west+.085,balcony.east-.085]){
    box(group,[x,upper+.41,midpoint(balcony.north,balcony.south)],[.073,.82,balcony.south-balcony.north],'#76918b',true);
  }
  for(let i=0;i<10;i++)box(group,[balcony.west+.10+i*.322,upper+.41,balcony.south-.068],[.045,.82,.047],'#668782');
  box(group,[midpoint(balcony.west,balcony.east),upper+.83,balcony.south-.068],[balcony.east-balcony.west,.063,.078],'#a2b2a5');
  const railStart=stairs.top+.14,railEnd=house.south-.14;
  for(let i=0;i<=6;i++){
    const z=railStart+(railEnd-railStart)*i/6;
    box(group,[stairs.west-.035,upper+.418,z],[.052,.83,.059],'#81968c');
  }
  for(const y of [upper+.13,upper+.835])box(group,[stairs.west-.035,y,midpoint(railStart,railEnd)],[.059,.059,railEnd-railStart+.06],'#81968c');
  for(const x of [8.98,11.58]){
    box(group,[x,upper+.093,-24.78],[.27,.18,.31],'#997c66');
    box(group,[x,upper+.248,-24.78],[.22,.143,.22],'#809b81');
  }
  box(group,[11.37,upper+.465,-24.69],[.28,.33,.052],'#b0a191');
}

function downstairs(kit:SceneKit){
  const {part,box,cyl,sign}=kit;
  const room=part(0);
  room.position.y=floor;
  room.userData.streamInterior=true;
  const pass=(x:number,y:number,z:number,w:number,d:number,color:string)=>{
    box(room,[x,y,z],[w,.022,d],color).userData.walkThrough=true;
  };
  pass(10.55,.018,-27.56,3.67,3.47,'#b5a68d');
  pass(10.91,.033,-25.92,1.23,.64,'#87928a');
  for(let i=0;i<11;i++)pass(10.49,.032,-26.31-i*.233,3.49,.011,'#a89a82');
  box(room,[9.17,.38,-25.99],[.76,.72,.54],'#897762',true);
  for(const y of [.28,.52])box(room,[9.19,y,-26.268],[.54,.028,.027],'#c6b191');
  for(const x of [9.66,9.83])box(room,[x,.062,-25.95],[.118,.063,.23],'#6b7d74').userData.walkThrough=true;
  box(room,[10.47,.46,-28.91],[3.05,.92,.57],'#9aa18a',true);
  box(room,[10.47,.953,-28.91],[3.15,.066,.67],'#d1c3a3');
  box(room,[9.38,1.005,-28.9],[.53,.023,.38],'#738e91');
  box(room,[9.38,1.019,-28.9],[.39,.016,.26],'#567478');
  cyl(room,[9.54,1.1,-29.07],.026,.17,'#99aaa5');
  box(room,[9.46,1.181,-29.055],[.17,.032,.038],'#9aaea8');
  for(const x of [10.52,10.79]){
    cyl(room,[x,.998,-28.87],.105,.03,'#67736a');
    cyl(room,[x,1.066,-28.87],.074,.11,'#849c8b');
  }
  for(let i=0;i<4;i++)box(room,[11.19+i*.115,1.075,-28.98],[.083,.165,.114],i%2?'#b29580':'#849985');
  for(const x of [9.44,10.14,10.84,11.54])box(room,[x,1.77,-29.0],[.66,.45,.44],'#a7ac98',true);
  sign(room,[10.13,1.36,-29.207],.76,.28,'台所','#bbb39a','#596e61');
  box(room,[9.66,.737,-27.1],[1.05,.073,.83],'#aa8b6e',true);
  for(const x of [9.25,10.07])for(const z of [-27.4,-26.8])box(room,[x,.36,z],[.05,.72,.052],'#716653');
  for(const z of [-27.23,-26.97]){
    cyl(room,[9.65,.797,z],.085,.035,'#dfd6b8');
    cyl(room,[9.83,.837,z],.049,.115,'#77978c');
  }
  box(room,[9.69,.409,-27.78],[.41,.059,.4],'#977e65',true);
  box(room,[9.69,.665,-27.966],[.4,.53,.063],'#80715e');
  for(const x of [9.54,9.84])box(room,[x,.202,-27.78],[.052,.403,.31],'#756857');
  seat(room,[9.69,.442,-27.78],[10.32,0,-27.79]);
  box(room,[10.39,2.036,-27.31],[1.65,.038,.092],'#ffe8b6',false,.85);
  const light=new THREE.PointLight('#ffdfae',4,4.8);
  light.position.set(10.4,1.96,-27.2);room.add(light);
}

function upstairs(kit:SceneKit){
  const {part,box,cyl,sign}=kit;
  const room=part(0);
  room.position.y=house.upper;
  room.userData.streamInterior=true;
  for(let i=0;i<5;i++){
    const x=9.09+i*.65;
    box(room,[x,.019,-27.35],[.608,.032,3.2],'#aeb395').userData.walkThrough=true;
    box(room,[x+.305,.039,-27.35],[.036,.007,3.18],'#7b8e7f').userData.walkThrough=true;
  }
  box(room,[9.39,.175,-28.43],[1.02,.34,1.33],'#8d7861',true);
  box(room,[9.39,.362,-28.43],[.95,.142,1.24],'#e0d4b7',true);
  box(room,[9.39,.447,-28.16],[.92,.058,.69],'#a7949a');
  for(let i=0;i<5;i++)box(room,[9.01+i*.18,.482,-28.18],[.02,.015,.655],'#c1a9ac');
  box(room,[9.39,.464,-28.884],[.55,.089,.26],'#e6dbc0',true);
  seat(room,[9.65,.477,-28.26],[10.22,0,-28.23]);
  box(room,[11.04,.685,-28.98],[1.18,.075,.58],'#ae9778',true);
  for(const x of [10.55,11.53])box(room,[x,.32,-28.98],[.066,.64,.54],'#796e5f');
  box(room,[10.69,.751,-28.9],[.29,.044,.222],'#7d9490');
  cyl(room,[11.36,.91,-29.06],.036,.38,'#718d86');
  cyl(room,[11.36,1.103,-29.06],.12,.13,'#e6c897',.16).material=kit.mat('#e6c897',.45);
  const stool=cyl(room,[10.99,.393,-28.34],.19,.075,'#a3846d');stool.receiveShadow=false;
  for(const x of [10.89,11.09])box(room,[x,.196,-28.34],[.046,.39,.29],'#736c59');
  seat(room,[10.99,.432,-28.34],[10.98,0,-27.86]);
  box(room,[8.91,.83,-26.74],[.39,1.66,.91],'#8f836f',true);
  for(const z of [-26.96,-26.52])box(room,[9.112,.862,z],[.025,.13,.052],'#c7b294');
  sign(room,[10.28,1.42,-29.209],.77,.47,'朝の雨','#ccc0a3','#62807a');
  box(room,[10.49,2.037,-27.1],[1.52,.037,.095],'#f3dbaf',false,.68);
  const light=new THREE.PointLight('#ffe1bc',2.3,3.9);
  light.position.set(10.5,1.93,-27.0);room.add(light);
}

export function* buildSummit(kit:SceneKit){
  foundation(kit);
  yield;
  parkingSurface(kit);
  yield;
  vehicle(kit,4.05,-21.71,false);
  yield;
  vehicle(kit,5.81,-21.75,true);
  yield;
  shell(kit);
  yield;
  stairsAndBalcony(kit);
  yield;
  downstairs(kit);
  yield;
  upstairs(kit);
}
