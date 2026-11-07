import * as THREE from 'three';
import type {SceneKit} from './SceneKit';

type Front = 'lattice' | 'balcony' | 'bay' | 'corner' | 'veranda' | 'walkup' | 'shutters';
type Residence = {
  x:number; z:number; w:number; d:number; floors:number; wall:string; roof:string; trim:string;
  shape:'gable'|'flat'|'shed'; front:Front; name:string; entry:number; delay:number;
};

export const northResidences:Residence[] = [
  {x:-8.55,z:-8.95,w:3.25,d:3.8,floors:2,wall:'#b8ab97',roof:'#506b76',trim:'#726451',shape:'gable',front:'lattice',name:'青葉 14',entry:.98,delay:1.5},
  {x:-3.7,z:-8.95,w:4.3,d:3.8,floors:3,wall:'#8fa3a2',roof:'#536f77',trim:'#567675',shape:'flat',front:'balcony',name:'あおば荘',entry:-1.39,delay:1.9},
  {x:1.15,z:-8.95,w:3.8,d:3.8,floors:2,wall:'#c6bca6',roof:'#647e8a',trim:'#5a7c83',shape:'shed',front:'bay',name:'青葉 18',entry:-1.14,delay:2.3},
  {x:7.1,z:-8.95,w:2.8,d:3.8,floors:3,wall:'#aa9da6',roof:'#586677',trim:'#746779',shape:'flat',front:'corner',name:'月見ハイツ',entry:.73,delay:2.7},
  {x:-8.2,z:-14.1,w:3.5,d:2.7,floors:1,wall:'#b2b49d',roof:'#647c71',trim:'#766a54',shape:'gable',front:'veranda',name:'青葉 22',entry:-1.05,delay:3.1},
  {x:-2.7,z:-14.1,w:4.5,d:2.7,floors:3,wall:'#9fafa6',roof:'#596c7b',trim:'#788984',shape:'flat',front:'walkup',name:'雨音マンション',entry:.2,delay:3.4},
  {x:2.65,z:-14.1,w:3.5,d:2.7,floors:2,wall:'#b6a196',roof:'#776574',trim:'#6f5d59',shape:'gable',front:'shutters',name:'青葉 26',entry:.9,delay:3.7},
];

export const westResidence:Residence = {x:-8.75,z:-1.75,w:2.8,d:3.45,floors:2,wall:'#a6aaa2',roof:'#526f80',trim:'#587376',shape:'gable',front:'shutters',name:'青葉 12',entry:.76,delay:1.1};

export function buildResidence(kit:SceneKit, home:Residence){
  const {part,box,cyl,mat,sign,roofs}=kit;
  const {x,z,w,d,floors,wall,roof,trim,shape,front,name,entry,delay}=home;
  const group=part(delay);group.name=`residence-${front}`;group.position.set(x,.285,z);
  const facade=d/2, h=.17+floors*1.66;
  const eave=front==='veranda'?.33:.22;
  const detail=(pos:[number,number,number],size:[number,number,number],color:string,glow=0)=>{
    const mesh=box(group,pos,size,color,false,glow);mesh.castShadow=false;return mesh;
  };
  box(group,[0,.085,0],[w+.24,.17,d+.24],'#a5ada3',true);
  box(group,[0,(h+.17)/2,0],[w,h-.17,d],wall,true);

  const roofW=w+2*eave, roofD=d+2*eave;
  let ridge=h+.53;
  if(shape==='flat'){
    box(group,[0,h+.055,0],[roofW,.13,roofD],roof,true);
    // Front balcony blocks have a solid parapet, the corner block an exposed rail.
    if(front==='corner'){
      for(const sx of [-1,1]){
        const wx=sx*(w/2-.09);
        for(const wz of [-facade+.17,0,facade-.17])box(group,[wx,h+.29,wz],[.035,.36,.045],trim);
        box(group,[wx,h+.47,0],[.045,.04,d-.28],trim);
      }
      for(const wz of [-facade+.15,facade-.15])box(group,[0,h+.47,wz],[w-.22,.04,.045],trim);
    }else{
      for(const wx of [-w/2+.035,w/2-.035])box(group,[wx,h+.24,0],[.09,.25,d+.11],trim);
      for(const wz of [-facade-.02,facade+.02])box(group,[0,h+.24,wz],[w-.18,.25,.085],trim);
    }
    box(group,[front==='walkup'?-1.22:.47,h+.32,-.49],[.72,.42,.63],'#a9b6ae',true);
  }else{
    // One closed roof profile covers the entire shell. The raised seams never cross its surface.
    const half=roofW/2;
    const profile=shape==='shed'?[[-half,h+.19],[half,h+.86]]:[[-half,h+.05],[0,h+(front==='veranda'?.72:.94)],[half,h+.05]];
    const section=new THREE.Shape();section.moveTo(-half,h-.05);section.lineTo(half,h-.05);
    for(const [px,py] of [...profile].reverse())section.lineTo(px,py);
    section.closePath();
    const cap=new THREE.Mesh(new THREE.ExtrudeGeometry(section,{depth:roofD,bevelEnabled:false}),mat(roof));
    cap.position.z=-roofD/2;cap.castShadow=true;cap.receiveShadow=true;group.add(cap);
    ridge=Math.max(...profile.map(([,y])=>y))+.05;
    for(let i=1;i<profile.length;i++){
      const [ax,ay]=profile[i-1],[bx,by]=profile[i],pitch=Math.atan2(by-ay,bx-ax),length=Math.hypot(bx-ax,by-ay);
      for(let wz=-roofD/2+.16;wz<roofD/2-.08;wz+=shape==='shed'?.52:.35){
        const seam=detail([(ax+bx)/2-Math.sin(pitch)*.025,(ay+by)/2+Math.cos(pitch)*.025,wz],[length-.055,.029,.031],trim);
        seam.rotation.z=pitch;
      }
    }
  }
  roofs.push({x,z,w:roofW,d:roofD,h:group.position.y+ridge});

  const window=(wx:number,wy:number,ww:number,wh:number,lit:boolean,bars=1,depth=.052)=>{
    box(group,[wx,wy,facade+depth/2-.009],[ww+.12,wh+.12,depth],trim,true);
    const plane=facade+depth;
    detail([wx,wy,plane],[ww,wh,.022],lit?'#e5c498':'#6c8795',lit?.5:.035);
    for(let j=1;j<=bars;j++)detail([wx-ww/2+j*ww/(bars+1),wy,plane+.019],[.026,wh,.02],trim);
    if(bars>2)detail([wx,wy-.11,plane+.021],[ww,.028,.022],trim);
    detail([wx,wy-wh/2-.085,plane+.033],[ww+.2,.05,.12],'#aab5ac');
  };
  const planter=(px:number,py:number,pz:number,wide:number,color:string)=>{
    box(group,[px,py+.1,pz],[wide,.2,.23],color,true);
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),mat('#779381'));
    leaves.position.set(px,py+.24,pz);leaves.scale.set(wide*.45,.116,.113);leaves.castShadow=true;group.add(leaves);
  };
  const balcony=(wx:number,wy:number,ww:number,screened:boolean)=>{
    box(group,[wx,wy,facade+.22],[ww,.105,.44],'#b0b8ad',true);
    const edge=facade+.438;
    if(screened){
      for(const side of [-1,1])detail([wx+side*ww*.22,wy+.27,edge],[ww*.42,.4,.055],'#8aa5a2');
    }else{
      for(let j=1;j<7;j++)detail([wx-ww*.45+j*ww*.9/7,wy+.28,edge],[.023,.43,.027],trim);
    }
    for(const side of [-1,1]){
      detail([wx+side*(ww/2-.023),wy+.27,edge],[.043,.48,.06],trim);
      detail([wx+side*(ww/2-.023),wy+.506,facade+.25],[.04,.04,.35],trim);
    }
    detail([wx,wy+.506,edge],[ww,.045,.055],trim);
  };

  // The ground floor openings move with the entrance, rather than sitting behind it.
  if(front==='lattice'){
    window(-.52,1.08,1.53,.87,true,6);
    window(0,2.72,2.1,.55,true,7);
    for(let j=0;j<8;j++)detail([-.99+j*.15,.46,facade+.035],[.095,.37,.035],trim);
    box(group,[0,1.93,facade+.26],[w+.04,.115,.57],roof,true);
    for(let j=0;j<16;j++)detail([-w*.46+j*w*.92/15,1.992,facade+.29],[.024,.032,.45],'#85999a');
    planter(-1.16,0,facade+.44,.45,'#9e8070');
  }else if(front==='balcony'){
    window(.42,1.05,1.79,.81,true,3);
    for(let f=1;f<3;f++){
      const wy=1.02+f*1.66;
      window(-.91,wy,1.25,.88,f===1,1);window(.83,wy,1.42,.88,f===2,2);
      balcony(0,wy-.62,3.87,false);
      planter(f===1?1.23:-1.35,wy-.56,facade+.25,.5,'#8b8170');
      if(f===2){
        for(const px of [.26,1.65])detail([px,wy-.11,facade+.26],[.04,.94,.04],trim);
        detail([.955,wy+.35,facade+.26],[1.44,.038,.04],trim);
        detail([.65,wy+.07,facade+.269],[.43,.5,.028],'#b7c9c0');
        detail([1.14,wy+.15,facade+.269],[.35,.34,.027],'#c4a3a2');
      }
    }
    for(let j=0;j<3;j++){
      const px=.65+j*.31;
      box(group,[px,.66,facade+.17],[.26,.31,.16],'#a0b1ab');
      detail([px,.72,facade+.261],[.17,.028,.012],trim);
    }
  }else if(front==='bay'){
    window(.68,1.13,1.62,.68,false,1,.16);
    window(.7,2.62,1.75,1.03,true,2,.19);
    window(-1.22,2.69,.36,1.2,false,0);
    for(let j=0;j<7;j++)detail([1.79,.61+j*.37,facade+.036],[.13,.055,.036],trim);
    planter(.91,0,facade+.38,.87,'#9d9a85');
  }else if(front==='corner'){
    window(-.69,1.14,.67,1.13,true,1);
    for(let f=1;f<3;f++){
      const wx=f===1?-.42:.42,wy=1.11+f*1.66;
      window(wx,wy,1.18,.94,f===2,2);
      balcony(wx,wy-.62,1.66,true);
    }
    for(let i=0;i<5;i++)detail([-1.22,.42+i*.26,facade+.037],[.15,.049,.045],'#c8b4a9');
  }else if(front==='veranda'){
    window(.43,1.12,1.67,.95,true,5);
    box(group,[.51,.21,facade+.25],[1.96,.08,.45],'#947f67',true);
    for(let j=0;j<6;j++)detail([-.29+j*.32,.255,facade+.27],[.018,.012,.41],trim);
    planter(1.15,0,facade+.46,.45,'#8d8173');
    const lantern=cyl(group,[1.25,1.52,facade+.32],.098,.24,'#e0c39c');lantern.material=mat('#e0c39c',.65);lantern.castShadow=false;
    for(const y of [1.385,1.655])cyl(group,[1.25,y,facade+.32],.105,.033,trim);
    box(group,[1.25,1.682,facade+.14],[.044,.044,.38],trim);
  }else if(front==='walkup'){
    window(-1.24,1.05,1.28,.65,false,2);
    for(let f=1;f<3;f++){
      const wy=1.03+f*1.66;
      window(-1.15,wy,1.35,.79,f===2,3);window(1.25,wy,.99,.9,f===1,1);
      balcony(1.23,wy-.61,1.57,false);
    }
    box(group,[.19,h*.51,facade+.028],[.62,h-.54,.08],'#879b93');
    for(const wy of [2.77,4.42])window(.19,wy,.34,.74,true,0,.125);
    planter(-1.6,0,facade+.38,.61,'#92927e');
  }else{
    window(-.58,1.1,Math.min(1.32,w*.4),.8,true,2);
    window(-.18,2.71,w*.46,.77,true,2);
    for(const side of [-1,1]){
      const wx=-.18+side*w*.31;
      box(group,[wx,2.71,facade+.051],[.29,.87,.056],trim);
      for(let j=0;j<7;j++)detail([wx,2.37+j*.113,facade+.089],[.24,.025,.017],'#a89586');
    }
    for(const px of [-w*.39,-w*.21]){
      cyl(group,[px,.1,facade+.41],.11,.2,'#a98b77',.085);
      const top=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,1),mat('#809989'));
      top.position.set(px,.235,facade+.41);group.add(top);
    }
  }

  const doorColor=front==='lattice'||front==='veranda'?'#806a52':trim;
  const clearPorch=name==='青葉 26';
  box(group,[entry,.82,facade+.061],[.58,1.29,.12],doorColor,true);
  detail([entry,.99,facade+.128],[front==='lattice'?.31:.37,.51,.019],'#b7baaa');
  detail([entry+.19,.78,facade+.15],[.05,.115,.025],'#d1b282');
  box(group,[entry,.06,facade+.31],[.76,.12,.54],'#b1b7a9',true);
  if(clearPorch)box(group,[entry,.014,facade+.76],[.94,.028,.71],'#a1aea8').userData.walkThrough=true;
  if(front!=='lattice')box(group,[entry,clearPorch?1.76:1.57,facade+.22],[.82,.09,.45],roof,true);
  box(group,[entry+.24,clearPorch?1.66:1.47,facade+.17],[.11,.065,.085],'#f0d5a5',false,1.05).castShadow=false;
  const nameplateX=front==='walkup'?entry:entry+(entry>0?-.46:.46);
  sign(group,[nameplateX,front==='walkup'?1.77:1.45,facade+.092],front==='walkup'?.77:.38,.14,name,'#c5c3ae','#476367');

  // Offsets and different glazing on the side and back keep the view varied when orbiting.
  const side=front==='corner'||front==='balcony'?1:-1;
  for(let f=0;f<floors;f++){
    const wy=1.05+1.66*f;
    const dz=(f%2===0?.24:-.19)*d;
    box(group,[side*(w/2+.026),wy,dz],[.066,.72,front==='corner'?.99:.65],trim,true);
    box(group,[side*(w/2+.071),wy,dz],[.019,.61,front==='corner'?.88:.54],f===0?'#688492':'#d7be94',false,f===0?.03:.26).castShadow=false;
    const rearW=front==='balcony'?1.32:front==='veranda'?1.56:front==='bay'?.43:.77;
    const rearH=front==='bay'?1.02:.73;
    const rearX=front==='walkup'?[-1.23,1.12]:[front==='veranda'?.28:f%2===0?-.23*w:.17*w];
    for(const dx of rearX){
      detail([dx,wy,-facade-.031],[rearW,rearH,.075],trim);
      const lit=(f+Number(front==='shutters'))%3===1;
      detail([dx,wy,-facade-.081],[rearW-.13,rearH-.12,.025],lit?'#dbbf9b':'#82999b',lit?.32:0);
      if(rearW>1.2)detail([dx,wy,-facade-.102],[.035,rearH-.12,.02],trim);
    }
  }
  if(front==='lattice'||front==='shutters'||front==='veranda'){
    const gutterX=-w*.4, gutterZ=-facade-.145;
    cyl(group,[gutterX,(h+.15)/2,gutterZ],.035,h-.15,'#83938e');
    for(const y of [.39,h*.53,h-.11])detail([gutterX,y,gutterZ+.045],[.09,.075,.14],trim);
  }
  if(front==='balcony'||front==='bay'||front==='walkup'){
    const sideX=w/2+.18, sideZ=-facade+.54;
    box(group,[sideX,.62,sideZ],[.32,.53,.67],'#aab7ad',true);
    for(let j=0;j<5;j++)detail([sideX+.175,.63,sideZ-.23+j*.115],[.02,.34,.021],trim);
  }
}
