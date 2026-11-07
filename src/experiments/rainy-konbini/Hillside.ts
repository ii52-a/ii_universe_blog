import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {seat} from './Seats';
import {hillApronEdge, hillCenter, hillFoot, hillHeight, hillHouseOffsets, hillOpenHouse, hillOuterX, hillPlotHeight, hillRoadEdge, hillRows, hillStations, hillTop, hillWidth} from './HillTerrain';

type Section = (z:number)=>[number,number];

function ribbon(rows:number[], first:Section, second:Section, material:THREE.Material){
  const vertices:number[]=[], indices:number[]=[];
  for(const [i,z] of rows.entries()){
    vertices.push(...first(z),z,...second(z),z);
    if(i>0){const n=i*2;indices.push(n-2,n-1,n,n-1,n+1,n);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);
  mesh.receiveShadow=true;
  return mesh;
}

function buildHillGround(kit:SceneKit){
  const {part,box,cyl,mat}=kit;
  const ground=part(0);
  ground.name='asagiri-terrain';
  ground.userData.walkThrough=true;
  const roadMaterial=new THREE.MeshStandardMaterial({color:'#75868a',roughness:.65,metalness:.08});
  const slope=ribbon(hillRows,z=>[hillCenter(z)-hillWidth(z),hillHeight(z)],z=>[hillCenter(z)+hillWidth(z),hillHeight(z)],roadMaterial);
  slope.name='asagiri-road';
  ground.add(slope);
  const sideRows=hillRows.filter(z=>z<=-11);
  const stone=new THREE.MeshToonMaterial({color:'#80958c',side:THREE.DoubleSide});
  const base=-.14;
  const cap=(z:number,left:number,right:number,top:number)=>{
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(right-left,top-base),stone);
    mesh.position.set((left+right)/2,(base+top)/2,z);
    mesh.receiveShadow=true;
    ground.add(mesh);
  };
  for(const side of [-1,1]){
    const edge:Section=z=>[hillCenter(z)+side*hillRoadEdge,hillHeight(z)];
    const apron:Section=z=>[hillCenter(z)+side*hillApronEdge,hillPlotHeight(z)];
    const outer:Section=z=>[hillOuterX(z,side),hillPlotHeight(z)];
    const lower:Section=z=>[outer(z)[0],base];
    const strips=side===1?[[edge,apron],[apron,outer]]:[[apron,edge],[outer,apron]];
    for(const [i,[a,b]] of strips.entries()){
      ground.add(ribbon(sideRows,a,b,mat((side===1?['#a6ad9f','#929e8a']:['#929e8a','#a6ad9f'])[i])));
    }
    const wall=ribbon(sideRows,lower,outer,stone);
    wall.name=side<0?'asagiri-west-wall':'asagiri-east-wall';
    ground.add(wall);
    const joints:number[]=[];
    for(const z of sideRows.filter((_,i)=>i%2===0)){
      const [x,y]=outer(z);
      for(let row=1;row<=3;row++){
        const next=Math.max(hillTop,z-.32),[nx,ny]=outer(next),f=row/4;
        joints.push(x+side*.003,.065+(y-.065)*f,z,nx+side*.003,.065+(ny-.065)*f,next);
      }
    }
    const seams=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(joints,3));
    ground.add(new THREE.LineSegments(seams,new THREE.LineBasicMaterial({color:'#a2ada0',transparent:true,opacity:.27})));
    for(const z of sideRows.filter((_,i)=>i%3===1)){
      const [x,y]=edge(z);
      box(ground,[x-side*.11,y+.018,z],[.145,.035,.155],'#a9b4a7');
    }
    for(const z of hillStations){
      const x=hillCenter(z)+side*2.61;
      for(let i=0;i<5;i++){
        box(ground,[x,hillHeight(z)+.011,z-.44+i*.22],[.68,.02,.2],i%2?'#b6b6a3':'#aeb1a1');
      }
    }
  }
  const approachRows=hillRows.filter(z=>z>=-11);
  const approachLeft=(z:number)=>hillCenter(z)-hillWidth(z);
  const approachRight=14.48;
  const approachHeight=hillHeight(hillFoot);
  ground.add(ribbon(approachRows,z=>[hillCenter(z)+hillWidth(z),approachHeight],()=>[approachRight,approachHeight],mat('#8c9d96')));
  ground.add(ribbon(approachRows,z=>[approachLeft(z),base],z=>[approachLeft(z),approachHeight],stone));
  ground.add(ribbon(approachRows,()=>[approachRight,base],()=>[approachRight,approachHeight],stone));
  ground.add(ribbon(approachRows,()=>[approachRight,base],z=>[approachLeft(z),base],stone));
  const underside=ribbon(sideRows,z=>[hillOuterX(z,1),base],z=>[hillOuterX(z,-1),base],stone);
  underside.name='asagiri-solid-underside';
  ground.add(underside);
  cap(hillFoot,approachLeft(hillFoot),approachRight,approachHeight);
  cap(-11,hillOuterX(-11,-1),approachLeft(-11),approachHeight);
  cap(-11,approachRight,hillOuterX(-11,1),approachHeight);
  // The end cap overlaps the adjoining foundation slightly to close the seam.
  cap(hillTop+.008,hillOuterX(hillTop,-1),hillOuterX(hillTop,1),hillHeight(hillTop));
  const center=hillCenter(hillTop);
  const ringRows=Array.from({length:22},(_,i)=>-11.35-i*.56);
  const rings=new THREE.InstancedMesh(new THREE.RingGeometry(.074,.09,12),mat('#aeb8a9'),ringRows.length*4);
  const transform=new THREE.Object3D();
  let count=0;
  for(const z of ringRows){
    const pitch=Math.atan2(hillHeight(z-.01)-hillHeight(z+.01),.02);
    for(const dx of [-1.36,-.49,.49,1.36]){
      transform.rotation.set(-Math.PI/2+pitch,0,0);
      transform.position.set(hillCenter(z)+dx,hillHeight(z)+.011,z);
      transform.updateMatrix();
      rings.setMatrixAt(count++,transform.matrix);
    }
  }
  rings.computeBoundingSphere();
  ground.add(rings);
  for(const z of [-12.65,-15.75,-19.33,-22.32]){
    const y=hillHeight(z);
    for(const side of [-1,1]){
      const x=hillCenter(z)+side*1.85;
      const drain=box(ground,[x,y+.014,z],[.46,.019,.23],'#526d71');
      drain.rotation.x=Math.atan2(hillHeight(z+.01)-hillHeight(z-.01),.02)*-1;
      for(let i=0;i<6;i++){
        const bar=box(ground,[x-.17+i*.068,y+.028,z],[.024,.009,.19],'#98a9a2');
        bar.rotation.x=drain.rotation.x;
      }
    }
  }
  for(const dx of [-1.8,0,1.8])cyl(ground,[center+dx,3.63,hillTop+.13],.14,.08,'#b2af95');
}

const houses=[
  {name:'杉の家',style:'timber',w:2.84,d:2.75,h:2.8,wall:'#ac9b82',trim:'#715e4d',roof:'#5b7778',shape:'gable'},
  {name:'風見の家',style:'modern',w:2.66,d:2.91,h:2.56,wall:'#bdc1b1',trim:'#597980',roof:'#6c878c',shape:'shed'},
  {name:'坂上荘',style:'balcony',w:2.85,d:2.76,h:4.1,wall:'#8fa8a1',trim:'#557472',roof:'#586e75',shape:'flat'},
  {name:'風待ちの家',style:'open',w:hillOpenHouse.w,d:hillOpenHouse.d,h:2.9,wall:'#b4ad95',trim:'#5b776e',roof:'#647e88',shape:'gable'},
  {name:'石庭',style:'garden',w:2.75,d:2.59,h:2.52,wall:'#bbc0a5',trim:'#7a7660',roof:'#6e8275',shape:'gable'},
  {name:'夕凪の家',style:'shutters',w:2.84,d:2.68,h:3.77,wall:'#ae9e99',trim:'#786778',roof:'#696b81',shape:'shed'},
] as const;

function buildHillHouse(kit:SceneKit,index:number){
  const {part,box,cyl,line,sign,mat,roofs}=kit;
  const house=houses[index];
  const {name,style,w,d,h,wall,trim,roof,shape}=house;
  const station=Math.floor(index/2),side=index%2===0?-1:1,z=hillStations[station];
  const x=hillCenter(z)+side*hillHouseOffsets[station],y=hillPlotHeight(z);
  const group=part(0);
  group.name='hill-house-'+style;
  group.position.set(x,y,z);
  group.rotation.y=-side*Math.PI/2;
  const front=d/2,open=style==='open';
  // Carry the sill into the apron where the diagonal road cuts below a corner.
  const sill=box(group,[0,-.28,0],[w+.06,.55,d+.06],'#a3ae9a');
  sill.name='asagiri-house-foundation';
  sill.userData.walkThrough=true;
  box(group,[0,h/2,-front+.055],[w,h,.11],wall,true);
  for(const dx of [-w/2+.055,w/2-.055])box(group,[dx,h/2,0],[.11,h,d-.23],wall,true);
  if(open){
    for(const dx of [-1.06,1.06])box(group,[dx,h/2,front-.055],[.77,h,.11],wall,true);
    box(group,[0,h-.23,front-.055],[1.36,.46,.11],wall);
  }else{
    box(group,[0,h/2,front-.055],[w,h,.11],wall,true);
  }
  const window=(wx:number,wy:number,ww:number,wh:number,bars:number,lit:boolean,depth=.066)=>{
    box(group,[wx,wy,front+depth/2-.008],[ww+.09,wh+.1,depth],trim,true);
    box(group,[wx,wy,front+depth],[ww,wh,.02],lit?'#e9cea1':'#78929b',false,lit?.47:.04).castShadow=false;
    for(let k=1;k<=bars;k++)box(group,[wx-ww/2+k*ww/(bars+1),wy,front+depth+.02],[.022,wh,.024],trim).castShadow=false;
    box(group,[wx,wy-wh/2-.06,front+depth+.042],[ww+.13,.044,.125],'#a1a998').castShadow=false;
  };
  if(open){
    for(const wx of [-.99,.99])window(wx,1.66,.53,.94,2,true);
    sign(group,[0,2.63,front+.011],1.2,.22,name+' OPEN','#d8d5b9','#557364');
  }else{
    const door=style==='modern'?-.77:style==='garden'?.76:.18;
    box(group,[door,.77,front+.04],[.61,1.49,.1],trim,true);
    if(style==='shutters')box(group,[door,.01,front+.3],[.91,.02,.52],'#b1b2a8').userData.walkThrough=true;
    box(group,[door,.97,front+.095],[.34,.52,.023],'#b2b3a2');
    box(group,[door+.19,.69,front+.111],[.039,.12,.029],'#d6bb88');
    sign(group,[door,1.63,front+.009],.55,.16,name,'#d7d0b5',trim);
    box(group,[door,1.84,front+.18],[.88,.1,.41],roof,true);
  }
  if(style==='timber'){
    window(-.75,1.16,.7,.92,5,true);
    window(.78,1.19,.45,.65,3,false);
    for(let k=0;k<9;k++)box(group,[0,.2+k*.172,-front-.012],[w-.19,.035,.025],trim).castShadow=false;
    box(group,[0,2.12,front+.24],[w+.15,.14,.53],roof,true);
    cyl(group,[.93,.16,front+.23],.17,.32,'#9d8a72',.13);
  }
  if(style==='modern'){
    window(.53,1.26,1.14,1.1,1,true,.17);
    window(-.62,2.17,.36,.45,0,false);
    for(let i=0;i<7;i++)box(group,[.93-i*.095,.34,front+.084],[.048,.39,.11],trim);
    box(group,[.84,.35,-front-.19],[.66,.58,.33],'#adbcb6',true);
    for(let i=0;i<7;i++)box(group,[.58+i*.087,.36,-front-.365],[.023,.38,.02],trim);
  }
  if(style==='balcony'){
    window(-.79,1.13,.52,.81,1,false);
    window(0,3.08,2.08,1.02,3,true);
    box(group,[0,2.4,front+.25],[2.69,.145,.52],'#a3b4a9',true);
    for(let i=0;i<11;i++)box(group,[-1.21+i*.242,2.72,front+.49],[.03,.54,.045],trim).castShadow=false;
    box(group,[0,2.995,front+.49],[2.61,.048,.07],trim);
    box(group,[.65,2.91,front+.524],[.33,.36,.022],'#beaba1').castShadow=false;
    for(const wx of [.65,.96])box(group,[wx,.83,front+.123],[.24,.33,.21],'#819a92',true);
  }
  if(style==='garden'){
    window(-.58,1.21,1.04,.92,4,true);
    box(group,[-.53,.215,front+.19],[1.34,.074,.35],'#94816a',true);
    for(const wx of [-1.05,-.52,-.02]){
      cyl(group,[wx,.09,front+.42],.105,.18,'#a88c73',.079);
      const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,1),mat('#789982'));
      shrub.position.set(wx,.23,front+.42);group.add(shrub);
    }
  }
  if(style==='shutters'){
    window(-.77,1.15,.63,.83,2,true);
    window(.3,2.79,1.22,.79,2,false);
    for(const wx of [-.47,1.07]){
      box(group,[wx,2.79,front+.051],[.24,.88,.071],trim);
      for(let j=0;j<7;j++)box(group,[wx,2.46+j*.108,front+.095],[.19,.023,.022],'#ae939a').castShadow=false;
    }
    line(group,[-1.31,.25,-front-.05],[-1.31,h+.09,-front-.05],.03,'#9dadab');
  }
  for(const dx of [-w*.27,w*.27]){
    box(group,[dx,h*.65,-front-.023],[.5,.59,.062],trim);
    box(group,[dx,h*.65,-front-.063],[.39,.46,.022],'#a2a991',false,.16).castShadow=false;
  }
  const roofDepth=d+.44, roofWidth=w+.32;
  const rise=shape==='gable'?.66:shape==='shed'?.52:.16;
  if(shape==='flat'){
    box(group,[0,h+.064,0],[roofWidth,.15,roofDepth],roof,true);
    for(const wx of [-w/2,w/2])box(group,[wx,h+.22,0],[.08,.2,d+.26],trim);
    for(const wz of [-d/2,d/2])box(group,[0,h+.22,wz],[w-.08,.2,.08],trim);
    box(group,[-.71,h+.26,-.49],[.65,.38,.64],'#a6b4aa',true);
  }else{
    const edge=roofWidth/2;
    const eave=h+.08;
    const points=shape==='gable'?[[-edge,eave],[0,eave+rise],[edge,eave]]:[[-edge,eave],[edge,eave+rise]];
    const profile=new THREE.Shape();
    profile.moveTo(-edge,h-.04);profile.lineTo(edge,h-.04);
    for(const [px,py] of [...points].reverse())profile.lineTo(px,py);
    profile.closePath();
    const cap=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:roofDepth,bevelEnabled:false}),mat(roof));
    cap.position.z=-roofDepth/2;cap.castShadow=true;cap.receiveShadow=false;group.add(cap);
    for(let i=1;i<points.length;i++){
      const [ax,ay]=points[i-1],[bx,by]=points[i];
      const angle=Math.atan2(by-ay,bx-ax);
      for(let wz=-roofDepth/2+.13;wz<roofDepth/2-.08;wz+=.315){
        const rib=box(group,[(ax+bx)/2-Math.sin(angle)*.021,(ay+by)/2+Math.cos(angle)*.021,wz],[Math.hypot(bx-ax,by-ay)-.05,.026,.028],'#95a69c');
        rib.rotation.z=angle;rib.castShadow=false;
      }
    }
  }
  roofs.push({x,z,w:roofDepth,d:roofWidth,h:y+h+rise+.14});
  if(!open)return;

  // The tatami room keeps its entrance aisle open from the widened road.
  const furnishings=part(0),room=new THREE.Group();
  furnishings.userData.streamInterior=true;
  room.position.copy(group.position);room.rotation.copy(group.rotation);furnishings.add(room);
  box(room,[-.97,.34,-.25],[.65,.48,1.25],'#a3b39a',true);
  box(room,[-1.22,.7,-.25],[.14,.75,1.3],'#7f9e8b');
  seat(room,[-.77,.58,.15],[-.42,0,.28]);
  box(room,[-.42,.36,-.35],[.45,.07,.67],'#baa07d');
  cyl(room,[-.42,.46,-.35],.055,.13,'#e7d4b1');
  const tatami=box(room,[.8,.028,-.65],[1.05,.045,1.3],'#b8c09a');tatami.userData.walkThrough=true;
  box(room,[.85,.16,-.65],[.85,.2,1.1],'#d8d6bc');
  box(room,[.85,.29,-1.01],[.65,.11,.26],'#efe5c8');
  box(room,[.85,.274,-.49],[.76,.034,.69],'#ab9e95');
  for(const dx of [-.21,.06,.29])box(room,[.85+dx,.296,-.49],[.014,.009,.65],'#c6b5aa');
  seat(room,[.52,.298,-.52],[.2,0,-.4]);
  box(room,[-.75,.53,-1.18],[1.18,1.06,.38],'#a7b5a3',true);
  box(room,[-.75,1.1,-1.18],[1.25,.08,.45],'#ded5b9');
  box(room,[-.9,1.15,-1.18],[.43,.025,.28],'#738f8b');
  cyl(room,[-.4,1.23,-1.18],.1,.2,'#b99f7a');
  box(room,[1.02,.64,.75],[.5,1.28,.7],'#9aab93',true);
  for(let j=0;j<4;j++)box(room,[1.02,.25+j*.28,1.12],[.46,.03,.04],'#d1c4a1');
  for(let j=0;j<6;j++)box(room,[.84+j*.065,1.36,.75],[.045,.19,.2],j%2?'#b69a91':'#93b3a7');
  sign(room,[0,2.02,-1.373],.9,.56,'風待ち','#d9d4b8','#6d8a77','HOME IN THE RAIN');
  box(room,[0,h-.085,0],[.9,.045,.35],'#ffe4b3',false,1.4);
  const light=new THREE.PointLight('#ffe0aa',6,4);light.position.set(x,y+2.45,z);furnishings.add(light);
}

export function* buildHillside(kit:SceneKit){
  const {part,box,cyl,tube,sign}=kit;
  buildHillGround(kit);
  yield;
  for(let i=0;i<houses.length;i++){
    buildHillHouse(kit,i);
    yield;
  }
  const detail=part(0);
  for(const z of [-12,-16,-20,-22.8]){
    const x=hillCenter(z)-2.48,y=hillHeight(z);
    cyl(detail,[x,y+2.2,z],.045,4.4,'#708e87');
    box(detail,[x,y+4.4,z],[.42,.12,.3],'#adc0ac');
    box(detail,[x,y+4.31,z],[.32,.025,.22],'#ffe5ad',false,1.4);
  }
  for(const dz of [0,.25])tube(detail,[[-2.48+hillCenter(-12),hillHeight(-12)+4.55,-12+dz],[-2.48+hillCenter(-17),hillHeight(-17)+3.6,-17+dz],[-2.48+hillCenter(-22.8),hillHeight(-22.8)+4.55,-22.8+dz]],.013,'#354e5a');
  const entry=part(0);
  entry.name='asagiri-entry-sign';
  // South of the corner residence, on the sidewalk before the uphill turn.
  entry.position.set(8.43,.285,-6.56);
  entry.rotation.y=.28;
  box(entry,[0,1.14,-.065],[.085,2.28,.09],'#688982');
  box(entry,[0,2.28,0],[1.01,.67,.054],'#7c978a');
  sign(entry,[0,2.28,.032],.95,.61,'朝霧坂','#d5dec0','#365953','ASAGIRI SLOPE  ↗',0,.38);
  for(const side of [-1,1]){
    const railX=(z:number)=>hillOuterX(z,side)-side*.09;
    for(let z=-11.2;z>hillTop+.15;z-=.74){
      const x=railX(z),y=hillPlotHeight(z);
      cyl(detail,[x,y+.33,z],.035,.66,'#6b8179');
    }
    const rail=tube(detail,hillRows.filter((z,i)=>z<=-11&&(i%3===0||z===hillTop)).map(z=>[railX(z),hillPlotHeight(z)+.66,z]),.037,'#a4b2a1');
    rail.userData.walkThrough=true;
  }
}
