import * as THREE from 'three';
import {canal, riverCourtyard, riverHome} from './CanalTerrain';
import {district} from './DistrictBounds';
import type {SceneKit} from './SceneKit';
import {seat} from './Seats';

const pathEdge=-19.98;
const level=.29;

function layBank(kit:SceneKit, from:number, to:number){
  const {part,box}=kit;
  const bank=part(0);
  bank.userData.walkThrough=true;
  const z=(from+to)/2;
  for(const [west,east,color] of [[district.west,pathEdge,'#86968a'],[pathEdge,canal.west,'#a2afa6']] as const){
    box(bank,[(west+east)/2,.177,z],[east-west,.226,to-from],color);
  }
  for(let row=from+.19;row<to-.12;row+=.43){
    box(bank,[-19.27,.295,row],[1.36,.008,.018],'#899b91').castShadow=false;
    box(bank,[-19.38,.299,row+.19],[.019,.009,.36],'#8d9f95').castShadow=false;
  }
  for(let row=Math.max(from,canal.north)+.28;row<Math.min(to,canal.south)-.16;row+=.54){
    box(bank,[canal.west+.01,.159,row],[.043,.052,.478],'#81968d').castShadow=false;
  }
  for(const z of [canal.bridgeZ,canal.footbridgeZ]){
    if(z<=from||z>=to)continue;
    for(let i=0;i<5;i++)box(bank,[pathEdge+.23+i*.28,.3,z],[.24,.015,.82],'#bdc0aa').castShadow=false;
  }
}

function buildRailing(kit:SceneKit){
  const {part,box,sign}=kit;
  const railing=part(0),x=canal.west-.104;
  const spans=[[canal.north+.15,canal.footbridgeZ-.84],[canal.footbridgeZ+.84,canal.bridgeZ-.84],[canal.bridgeZ+.84,canal.south-.1]];
  for(const [from,to] of spans){
    for(const y of [.554,.9])box(railing,[x,y,(from+to)/2],[.056,.048,to-from],'#78978e');
    const sections=Math.ceil((to-from)/.88);
    for(let i=0;i<=sections;i++){
      const z=THREE.MathUtils.lerp(from+.037,to-.037,i/sections);
      box(railing,[x,.61,z],[.076,.64,.074],'#5f7c79');
    }
  }
  for(const z of [-19.45,-13.45,-6.2,1.65,4.91]){
    box(railing,[-20.02,.83,z],[.067,1.08,.067],'#667f79');
    box(railing,[-20.02,1.39,z],[.193,.17,.193],'#efce9c',false,1.15).castShadow=false;
    box(railing,[-20.02,1.494,z],[.24,.05,.24],'#607a75');
  }
  box(railing,[-20.25,1.04,1.65],[.1,1.5,.11],'#6a847d');
  box(railing,[-20.25,1.7,1.65],[.09,.39,1.13],'#566f68',true);
  sign(railing,[-20.193,1.7,1.65],1.06,.33,'柳橋西町','#647f76','#f0dcaf','YANAGIBASHI WEST',Math.PI/2,.45);
}

function buildRiverHome(kit:SceneKit){
  const {part,box,cyl,mat,glass,sign,roofs}=kit;
  const house=part(0);
  house.name='river-house-shell';
  house.position.set(riverHome.x,level,riverHome.z);
  house.rotation.y=Math.PI/2;
  const {w,d}=riverHome,front=d/2,h=2.79;
  const wood='#897460',frame='#625e53',plaster='#b7afa0';
  box(house,[0,-.073,0],[w+.12,.14,d+.1],'#aab0a0',true).userData.walkThrough=true;
  box(house,[0,h/2,-front+.06],[w,h,.12],plaster,true).receiveShadow=false;
  for(const x of [-w/2+.065,w/2-.065]){
    box(house,[x,h/2,0],[.13,h,d-.24],plaster,true).receiveShadow=false;
    box(house,[x*1.044,.37,0],[.044,.74,d-.25],wood);
  }
  for(const x of [-1.264,1.264]){
    box(house,[x,.35,front-.058],[1.26,.7,.116],wood,true);
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.16,1.34),glass);
    pane.position.set(x,1.40,front-.015);house.add(pane);
    for(let i=0;i<7;i++)box(house,[x-.582+i*.194,1.40,front+.015],[.029,1.393,.059],frame);
    for(const y of [.706,2.1])box(house,[x,y,front+.022],[1.24,.051,.063],frame);
    box(house,[x,.653,front+.054],[1.29,.052,.13],'#a48f75');
  }
  box(house,[0,2.443,front-.048],[w,.692,.123],wood,true);
  box(house,[0,2.17,front+.18],[w+.31,.1,.49],'#708982',true);
  sign(house,[0,2.46,front+.027],1.25,.27,'柳の家','#e5d5b5','#53685d','OPEN',0,.42);
  for(const x of [-.61,.61]){
    const lantern=cyl(house,[x,1.995,front+.28],.078,.18,'#e4c797');
    lantern.material=mat('#e4c797',.95);lantern.castShadow=false;
    cyl(house,[x,2.101,front+.28],.086,.036,frame);
  }
  box(house,[0,.028,front+.17],[1.32,.052,.39],'#a6aa96').userData.walkThrough=true;

  const roof=new THREE.Shape();
  roof.moveTo(-2.07,h-.035);roof.lineTo(2.07,h-.035);
  roof.lineTo(2.07,h+.066);roof.lineTo(0,h+.82);roof.lineTo(-2.07,h+.066);roof.closePath();
  const cap=new THREE.Mesh(new THREE.ExtrudeGeometry(roof,{depth:d+.56,bevelEnabled:false}),mat('#526d79'));
  cap.position.z=-(d+.56)/2;cap.castShadow=true;house.add(cap);
  const angle=Math.atan2(.754,2.07);
  for(const side of [-1,1])for(let z=-1.98;z<2;z+=.293){
    const tile=box(house,[side*1.036,h+.469,z],[2.15,.034,.028],'#8e9e9b');
    tile.rotation.z=-side*angle;tile.castShadow=false;
  }
  roofs.push({x:riverHome.x,z:riverHome.z,w:d+.56,d:4.14,h:level+h+.86});
  return house;
}

function furnishRiverHome(kit:SceneKit, shell:THREE.Group){
  const {part,box,cyl,line,sign}=kit;
  const room=part(0);
  room.name='river-house-interior';
  room.userData.streamInterior=true;
  room.position.copy(shell.position);
  room.rotation.copy(shell.rotation);
  const floor=part(0);
  floor.position.copy(room.position);floor.rotation.copy(room.rotation);
  floor.userData.walkThrough=true;
  box(floor,[0,.008,.13],[3.67,.016,3.37],'#b6a287');
  box(floor,[0,.022,1.28],[1.32,.02,.76],'#a5a898');
  for(const x of [-1.32,-.53,.26,1.05]){
    box(floor,[x,.029,-.25],[.76,.031,1.98],'#b9bc96');
    box(floor,[x+.357,.05,-.25],[.045,.008,1.96],'#879583');
  }
  box(room,[-1.34,.36,1.07],[.56,.69,.86],'#907b62',true);
  for(const y of [.19,.36,.53])box(room,[-1.051,y,1.07],[.035,.04,.61],'#baaa88');
  for(const x of [-.91,-.72])box(room,[x,.057,1.24],[.105,.06,.245],'#665f51').userData.walkThrough=true;
  const table=box(room,[-.81,.39,-.27],[.86,.083,1.11],'#aa8867',true);
  table.receiveShadow=false;
  for(const x of [-1.12,-.53])for(const z of [-.66,.11])box(room,[x,.21,z],[.055,.38,.07],'#7d6b56');
  for(const z of [-.95,.44])box(room,[-.83,.087,z],[.47,.105,.37],'#a48179').userData.walkThrough=true;
  cyl(room,[-.86,.506,-.31],.096,.16,'#6c8e85');
  for(const z of [-.12,-.49])cyl(room,[-.65,.467,z],.061,.084,'#e5d7b9');
  box(room,[1.36,.51,-.67],[.65,1.02,1.21],'#9a9c82',true);
  box(room,[1.36,1.055,-.67],[.73,.08,1.27],'#ded0ae');
  box(room,[1.34,1.104,-.37],[.45,.028,.38],'#6d8b8a');
  line(room,[1.56,1.1,-.45],[1.56,1.29,-.45],.02,'#889d9a');
  line(room,[1.56,1.29,-.45],[1.45,1.29,-.45],.02,'#889d9a');
  for(let i=0;i<4;i++)box(room,[1.31,1.135,-1.02+i*.036],[.24,.025,.14],i%2?'#b79b8d':'#8ba69a');
  box(room,[0,.59,-1.55],[1.84,1.16,.29],'#81705c',true);
  for(let j=0;j<8;j++)box(room,[-.77+j*.22,.62,-1.394],[.043,.9,.025],'#b29b7e');
  box(room,[0,1.79,-1.707],[1.36,.76,.046],'#876e56',true);
  sign(room,[0,1.79,-1.677],1.19,.59,'柳に雨','#d6ceb0','#567970');
  cyl(room,[.61,1.286,-1.53],.091,.227,'#74948c',.058);
  for(const x of [.58,.62,.655])line(room,[.62,1.39,-1.53],[x,1.52,-1.54],.01,'#789278');
  for(let i=0;i<5;i++)box(room,[-.66+i*.11,1.231,-1.54],[.067,.11+i%2*.038,.17],['#8a9d8b','#b6a085','#8e8378'][i%3]);
  box(room,[0,2.56,-.22],[1.21,.048,.27],'#fff1c3',false,1.65).castShadow=false;
  const light=new THREE.PointLight('#ffe4ba',9,5.5);
  light.position.set(.07,2.31,-.05);
  room.add(light);
}

function closedHouse(kit:SceneKit,z:number,modern:boolean){
  const {part,box,cyl,mat,roofs,sign}=kit;
  const house=part(0);
  house.position.set(modern?-22.61:-22.48,level,z);
  house.rotation.y=Math.PI/2;
  const width=modern?3.3:3.62,depth=modern?3.55:3.69,h=modern?2.75:4.18;
  const wall=modern?'#bec6b7':'#a89d92',trim=modern?'#5f817e':'#7b6a61';
  const front=depth/2;
  box(house,[0,h/2,0],[width,h,depth],wall,true);
  box(house,[0,-.064,0],[width+.13,.126,depth+.12],'#a3ad9f').userData.walkThrough=true;
  const wx=modern?-.8:.97;
  box(house,[wx,.89,front+.05],[.64,1.7,.11],trim,true);
  box(house,[wx+.18,.78,front+.121],[.051,.15,.024],'#c8b787');
  box(house,[wx,1.85,front+.22],[.89,.095,.49],trim,true);
  sign(house,[wx,1.61,front+.12],.38,.135,modern?'柳 16':'柳 20','#c7c6af','#536e65');
  if(modern){
    box(house,[.62,1.33,front+.077],[1.32,1.12,.164],'#688c89',true);
    box(house,[.62,1.33,front+.172],[1.18,.98,.026],'#e5cc9d',false,.35);
    for(let i=0;i<5;i++)box(house,[.13+i*.245,1.33,front+.197],[.033,.985,.032],'#627b75');
    const half=(width+.42)/2;
    const profile=new THREE.Shape();
    profile.moveTo(-half,h-.035);profile.lineTo(half,h-.035);
    profile.lineTo(half,h+.16);profile.lineTo(-half,h+.53);profile.closePath();
    const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:depth+.43,bevelEnabled:false}),mat('#637e83'));
    roof.position.z=-(depth+.43)/2;roof.castShadow=true;house.add(roof);
    for(let i=0;i<10;i++){
      const rib=box(house,[.002,h+.367,-1.72+i*.379],[width+.375,.024,.025],'#91a5a1');
      rib.rotation.z=Math.atan2(-.37,2*half);rib.castShadow=false;
    }
    for(let i=0;i<6;i++)box(house,[-1.39+i*.47,.017,front+.32],[.34,.026,.45],'#b1b7a9').userData.walkThrough=true;
  }else{
    for(const y of [1.19,3.14]){
      const center=y>2?-.13:-.59;
      box(house,[center,y,front+.047],[1.46,.97,.093],trim,true);
      box(house,[center,y,front+.104],[1.32,.81,.025],y>2?'#d9bc97':'#728b91',false,y>2?.31:.02);
      for(let i=0;i<6;i++)box(house,[center-.55+i*.22,y,front+.127],[.029,.83,.027],trim);
    }
    box(house,[0,2.355,front+.25],[width+.1,.13,.55],'#73878b',true);
    for(let i=0;i<10;i++)box(house,[-1.63+i*.36,2.429,front+.27],[.024,.027,.46],'#a0aaa2');
    for(const side of [-1,1]){
      const panel=box(house,[side*.99,h+.45,0],[2.13,.16,depth+.48],'#5b707d',true);
      panel.rotation.z=-side*.285;
      for(let i=0;i<12;i++){
        const seam=box(house,[side*1.02,h+.55,-1.92+i*.345],[2.06,.027,.031],'#8b9da0');
        seam.rotation.z=panel.rotation.z;seam.castShadow=false;
      }
    }
    cyl(house,[0,h+.79,0],.059,depth+.48,'#99a9a6').rotation.x=Math.PI/2;
    box(house,[1.19,.39,-front-.18],[.77,.58,.38],'#acb9ab',true);
  }
  for(const x of [-width*.3,width*.3]){
    box(house,[x,1.63,-front-.042],[.71,.85,.085],trim,true);
    box(house,[x,1.63,-front-.099],[.57,.72,.02],'#8da1a2');
  }
  for(const x of [-1.29,1.28]){
    cyl(house,[x,.136,front+.3],.15,.27,'#a38470',.112);
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(.177,1),mat('#7c9a7c'));
    leaves.position.set(x,.334,front+.3);house.add(leaves);
  }
  roofs.push({x:house.position.x,z,w:depth+.48,d:width+.48,h:level+h+(modern?.55:.86)});
}

function buildCourtyard(kit:SceneKit){
  const {part,box,cyl,mat,sign}=kit;
  const court=part(0);
  court.name='river-courtyard';
  const {x,z,w,d}=riverCourtyard;
  const west=x-w/2,east=x+w/2,north=z-d/2,south=z+d/2;
  box(court,[x,.304,z],[w,.026,d],'#a9ad96').userData.walkThrough=true;
  for(const row of [north,south])box(court,[x,.66,row],[w,.74,.14],'#7f948a',true).receiveShadow=false;
  box(court,[west,.66,z],[.14,.74,d-.16],'#7f948a',true).receiveShadow=false;
  for(const side of [-1,1]){
    box(court,[east,.53,z+side*1.17],[.15,.48,.9],'#9da99c',true);
    box(court,[east,1.174,z+side*.69],[.15,1.77,.13],'#796e5c',true);
    for(let j=0;j<5;j++)box(court,[east,.97,z+side*(.84+j*.14)],[.054,.54,.058],'#8a7d68');
    box(court,[east,1.244,z+side*1.17],[.083,.055,.9],'#a49075');
  }
  box(court,[east,2.105,z],[.21,.11,1.72],'#92816a',true);
  sign(court,[east+.12,2.105,z],.72,.14,'雨音の庭','#b0a187','#514e45','',Math.PI/2);
  for(let i=0;i<6;i++){
    const stone=box(court,[east-.18-i*.47,.324,z+.13*Math.sin(i*.68)],[.38,.027,.54],'#c2c1a9',true);
    stone.userData.walkThrough=true;
  }
  const treeX=west+.71,treeZ=north+.66;
  cyl(court,[treeX,.956,treeZ],.069,1.31,'#7d7765');
  for(const [dx,dz,y,scale] of [[0,0,1.89,.55],[.44,.18,1.69,.37],[-.26,.27,1.53,.37]]){
    const foliage=new THREE.Mesh(new THREE.IcosahedronGeometry(scale,1),mat('#7d9d82'));
    foliage.position.set(treeX+dx,y,treeZ+dz);foliage.scale.y=.78;foliage.castShadow=true;court.add(foliage);
  }
  cyl(court,[west+.82,.397,south-.59],.31,.166,'#778e86',.28);
  cyl(court,[west+.82,.489,south-.59],.269,.014,'#7fada9');
  box(court,[x-.27,.69,north+.29],[1.17,.081,.34],'#a88d71',true);
  for(const offset of [-.32,.12])seat(court,[x+offset,.731,north+.29],[x+offset,level,north+.72]);
  for(const dx of [-.43,.43])box(court,[x-.27+dx,.483,north+.29],[.075,.32,.29],'#708681');
  for(const [px,pz] of [[x+.84,north+.49],[x+.8,south-.48],[x-.12,south-.51]]){
    box(court,[px,.44,pz],[.54,.25,.37],'#a3927c',true);
    const hedge=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),mat('#87a284'));
    hedge.position.set(px,.64,pz);hedge.scale.set(.25,.14,.16);court.add(hedge);
  }
  const blossom=new THREE.IcosahedronGeometry(.041,1);
  for(let i=0;i<7;i++){
    const bloom=new THREE.Mesh(blossom,mat(i%2?'#d2a6ab':'#e1c69f'));
    bloom.position.set(x+.84+(i-3)*.055,.733+.042*Math.sin(i),north+.49+.063*Math.cos(i*1.8));
    court.add(bloom);
  }
}

function buildPocketPark(kit:SceneKit){
  const {part,box,cyl,mat}=kit;
  const park=part(0);
  for(const [x,z] of [[-22.04,-18.72],[-20.13,-22.21],[-23.75,11.6],[-23.8,14.19]]){
    box(park,[x,.47,z],[1.16,.36,.95],'#9b9b86',true);
    box(park,[x,.655,z],[1.02,.035,.81],'#758f7d');
    cyl(park,[x,1.21,z],.072,1.12,'#797465');
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),mat('#719786'));
    crown.name='west-pocket-tree';crown.position.set(x,2.02,z);crown.castShadow=true;park.add(crown);
  }
  for(const z of [-20.73,10.28,13.62]){
    box(park,[-21.01,.69,z],[.41,.074,1.32],'#a99579',true);
    box(park,[-21.22,.97,z],[.06,.31,1.32],'#a99579');
    for(const dz of [-.5,.5])box(park,[-21.01,.476,z+dz],[.32,.35,.067],'#66817a');
    for(const dz of [-.28,.28])seat(park,[-21.01,.727,z+dz],[-20.53,level,z+dz]);
  }
  for(let i=0;i<16;i++)box(park,[-21.19+.34*Math.sin(i*.28),.302,9.3+i*.39],[.69,.02,.3],'#9fab9a').userData.walkThrough=true;
}

function infill(kit:SceneKit,z:number,style:'machiya'|'townhouse'|'workshop'){
  const {part,box,cyl,mat,roofs,sign}=kit;
  const home=part(0);
  home.name='west-'+style;
  home.position.set(-22.46,level,z);
  home.rotation.y=Math.PI/2;
  const shop=style==='workshop', traditional=style==='machiya';
  const w=shop?2.74:1.93,d=shop?3.68:3.44,h=traditional?3.58:shop?2.44:2.86;
  const wall=traditional?'#a99c84':shop?'#a99d91':'#b0b7a8';
  const trim=traditional?'#766453':shop?'#796d62':'#627f80';
  const facade=d/2;
  box(home,[0,h/2,0],[w,h,d],wall,true);
  box(home,[0,-.051,0],[w+.12,.126,d+.12],'#9ca89d');
  const door=shop?.78:-.43;
  box(home,[door,.73,facade+.039],[.6,1.45,.09],trim,true);
  box(home,[door+.18,.69,facade+.094],[.047,.108,.029],'#c7b283');
  const x=shop?-.49:.4, width=shop?1.31:.65;
  box(home,[x,1.24,facade+.044],[width+.11,.935,.1],trim,true);
  box(home,[x,1.24,facade+.107],[width,.805,.023],'#c9b58b',false,.24);
  for(let i=0;i<5;i++)box(home,[x+width*(i/5-.4),1.24,facade+.13],[.025,.81,.025],trim).castShadow=false;
  box(home,[x,.789,facade+.146],[width+.18,.043,.17],'#9da798');
  if(traditional){
    box(home,[0,2.64,facade+.04],[1.37,.64,.09],trim,true);
    box(home,[0,2.64,facade+.101],[1.27,.54,.022],'#c9b28c',false,.17);
    for(let i=0;i<8;i++)box(home,[-.57+i*.164,2.64,facade+.125],[.025,.54,.025],trim).castShadow=false;
  }
  const canopy=box(home,[0,1.92,facade+.18],[w+.09,.11,.51],trim,true);
  canopy.rotation.x=.08;
  if(shop){
    sign(home,[0,2.14,facade+.077],2.19,.25,'西町 修理工房','#7e756b','#ddcaa3','自転車  •  傘');
    for(const sx of [-1,1])box(home,[sx*.95,1.71,facade+.35],[.52,.19,.024],'#88766e');
  }else{
    sign(home,[door,1.59,facade+.018],.37,.136,traditional?'柳 18':'柳 14','#b7b5a0','#557367');
  }
  const rise=traditional?.61:shop?.27:.44;
  const half=w/2+.18, profile=new THREE.Shape();
  profile.moveTo(-half,h-.025);profile.lineTo(half,h-.025);profile.lineTo(half,h+.05);
  if(traditional)profile.lineTo(0,h+rise);
  profile.lineTo(-half,h+rise*(traditional?.13:1));profile.closePath();
  const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:d+.36,bevelEnabled:false}),mat(traditional?'#5d707b':'#6d8383'));
  roof.position.z=-(d+.36)/2;roof.castShadow=true;home.add(roof);
  const span=traditional?half:2*half;
  for(const side of traditional?[-1,1]:[1]){
    const slope=traditional?-side*Math.atan2(rise-.05,half):Math.atan2(.05-rise,2*half);
    for(let i=0;i<11;i++){
      const rib=box(home,[traditional?side*half/2:0,h+(rise+.05)/2+.02,-1.67+i*.33],[Math.hypot(span,rise-.05)-.038,.021,.021],'#91a19a');
      rib.rotation.z=slope;rib.castShadow=false;
    }
  }
  box(home,[0,1.24,-facade-.026],[w*.66,.66,.065],trim);
  box(home,[0,1.24,-facade-.065],[w*.56,.54,.019],'#7b9496');
  for(const px of [-.48,.51]){
    cyl(home,[px,.13,facade+.27],.105,.26,'#96816e',.073);
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(.125,1),mat('#779486'));
    leaves.position.set(px,.304,facade+.27);home.add(leaves);
  }
  roofs.push({x:-22.46,z,w:d+.36,d:w+.36,h:level+h+rise+.06});
}

function buildWestPower({part,box,cyl,tube}:SceneKit){
  const network=part(0);
  network.name='west-power-network';
  network.userData.walkThrough=true;
  const westX=-19.98,poleTop=4.96;
  const poleZ=[-17.95,-7.98,.7,9.74];
  const cable=(points:[number,number,number][],radius=.012)=>{
    const wire=tube(network,points,radius,'#364e58');wire.castShadow=false;
    return wire;
  };
  for(const [x,z,height,ground] of [[-16.02,-7.98,5.31,.29],...poleZ.map(z=>[westX,z,poleTop,.29])]){
    cyl(network,[x,(height+ground)/2,z],.066,height-ground,'#849491',.087);
    box(network,[x,height-.17,z],[.41,.081,.093],'#687e80');
    for(const dx of [-.15,.15])cyl(network,[x+dx,height-.071,z],.041,.15,'#a8b8ab');
  }
  cable([[-10.5,6.29,-5.75],[-13.15,5.49,-6.74],[-16.17,5.31,-7.98],[-18.05,4.69,-7.98],[westX+.15,poleTop,-7.98]]);
  for(let i=1;i<poleZ.length;i++)for(const dx of [-.15,.15]){
    const a=poleZ[i-1],b=poleZ[i];
    cable([[westX+dx,poleTop,a],[westX+dx,poleTop-.58,(a+b)/2],[westX+dx,poleTop,b]]);
  }
  for(const [pole,facade,z,y] of [[0,-20.635,-15.72,3.4],[0,-20.74,-12.47,3.01],[1,-20.835,-9.53,2.65],
    [1,-20.74,-6.27,2.57],[2,-20.63,-3.2,2.59],[3,-20.62,7.21,2.35]]){
    const anchor=box(network,[facade+.031,y,z],[.061,.153,.121],'#8d9b92');anchor.name='west-service-anchor';
    const wire=cable([[westX-.15,poleTop,poleZ[pole]],[westX-.15,y+.58,z-.20],[facade+.29,y+.045,z],[facade+.062,y,z]],.01);
    wire.name='west-service-drop';
  }
}

export function* buildRiverbank(kit:SceneKit){
  layBank(kit,-24,-8);
  yield;
  layBank(kit,-8,district.south);
  yield;
  buildRailing(kit);
  yield;
  closedHouse(kit,-15.17,false);
  yield;
  infill(kit,-12.05,'machiya');
  yield;
  closedHouse(kit,-9.1,true);
  yield;
  infill(kit,-5.87,'townhouse');
  yield;
  const shell=buildRiverHome(kit);
  yield;
  furnishRiverHome(kit,shell);
  yield;
  buildCourtyard(kit);
  yield;
  infill(kit,7.93,'workshop');
  yield;
  buildWestPower(kit);
  yield;
  buildPocketPark(kit);
}
