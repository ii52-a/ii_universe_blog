import {optimizePart} from './RenderOptimizer';
import {canal,canalLocation} from './CanalTerrain';
import {district} from './DistrictBounds';
import {inHillOpenHouse} from './HillTerrain';
import {groundHeight} from './Terrain';
import {createPerformanceProbe} from './PerformanceProbe';
import {OverviewBatch} from './OverviewBatch';
import {InteriorResidency} from './InteriorResidency';
import {blockPageRightGestures} from './PageRightGestures';
import {createBackgroundMusic} from './BackgroundMusic';
import {northAnnex,northVillas,northHouse,northTea,floorY,northY} from './NorthTerrain';
import {summit,summitHouse,summitBalcony} from './SummitTerrain';
import {WalkingController} from './WalkingController';
import {ZombieMode,emptySurvivalHUD} from './ZombieMode';
import {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

type V3 = [number,number,number];
/** A self-contained, procedural scene. No remote models, fonts or image assets. */
export default function Konbini(){
 const host=useRef<HTMLElement>(null);
 const walkingRef=useRef<WalkingController>();
 const combatRef=useRef<ZombieMode>();
 const musicRef=useRef<ReturnType<typeof createBackgroundMusic>>();
 const [survival,setSurvival]=useState(emptySurvivalHUD);
 const [muted,setMuted]=useState(false);
 const [testMode,setTestMode]=useState(false);
 const [walkingActive,setWalkingActive]=useState(false);
 const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>{
  const container=host.current!;
  const options=new URLSearchParams(location.search);
  const lowQuality=options.get('quality')==='low';
  const scene=new THREE.Scene();scene.background=new THREE.Color('#172333');
  let renderer:THREE.WebGLRenderer;
  try{
   renderer=new THREE.WebGLRenderer({antialias:!lowQuality,alpha:true,powerPreference:lowQuality?'low-power':'high-performance'});
  }catch{
   setUnavailable(true);
   return;
  }
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
  container.appendChild(renderer.domElement);
  renderer.domElement.tabIndex=0;
  const camera=new THREE.PerspectiveCamera(34,1,.12,150);camera.position.set(44,37,53);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-1,1.15,-6);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=9;controls.maxDistance=100;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.18;controls.enablePan=true;
  controls.mouseButtons.RIGHT=null;
  const releaseRightGestures=blockPageRightGestures(renderer.domElement);
  const music=createBackgroundMusic(renderer.domElement);
  musicRef.current=music;
  music.setCombat(testMode);
  const pilotEnabled=options.get('pilot')!=='0';
  const stress=options.has('perf')&&options.get('stress')==='1';
  if(stress){camera.far=230;controls.maxDistance=155;}
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.18,.42,1.2);bloom.enabled=!lowQuality;composer.addPass(bloom);composer.addPass(new OutputPass());
  scene.add(new THREE.HemisphereLight('#afc9e9','#37435c',.69));
  const moon=new THREE.DirectionalLight('#bfd7ff',.94);moon.position.set(-5,14,8);moon.castShadow=true;moon.shadow.mapSize.setScalar(lowQuality?1024:2048);moon.shadow.camera.left=-31;moon.shadow.camera.right=26;moon.shadow.camera.top=32;moon.shadow.camera.bottom=-26;moon.shadow.normalBias=.025;scene.add(moon);
  const rim=new THREE.DirectionalLight('#95c4dc',.49);rim.position.set(8,7,-7);scene.add(rim);
  const world=new THREE.Group();scene.add(world);
  let seed=143;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const mats=new Map<string,THREE.Material>();
  const mat=(color:string,glow=0)=>{
   const key=color+glow;
   let material=mats.get(key);
   if(!material){
    material=new THREE.MeshToonMaterial({color,emissive:color,emissiveIntensity:glow});
    material.userData.overviewVertexPalette=glow===0;
    mats.set(key,material);
   }
   return material;
  };
  const unitBox=new THREE.BoxGeometry(1,1,1);
  unitBox.userData.sharedScenePrimitive=true;
  const unitEdges=new THREE.EdgesGeometry(unitBox);
  const cylinders=new Map<number,THREE.CylinderGeometry>();
  const ink=new THREE.LineBasicMaterial({color:'#162331',transparent:true,opacity:.35});
  function box(p:THREE.Object3D,pos:V3,size:V3,color:string,outline=false,glow=0){const g=unitBox;const m=new THREE.Mesh(g,mat(color,glow));m.position.set(...pos);m.scale.set(...size);m.castShadow=true;m.receiveShadow=true;p.add(m);if(outline){const e=new THREE.LineSegments(unitEdges,ink);m.add(e);}return m;}
  function cyl(p:THREE.Object3D,pos:V3,r:number,h:number,color:string,r2=r){
   const bottom=r2/r;
   let geometry=cylinders.get(bottom);
   if(!geometry){geometry=new THREE.CylinderGeometry(1,bottom,1,12);geometry.userData.sharedScenePrimitive=true;cylinders.set(bottom,geometry);}
   const mesh=new THREE.Mesh(geometry,mat(color));
   mesh.position.set(...pos);mesh.scale.set(r,h,r);mesh.castShadow=true;mesh.receiveShadow=true;p.add(mesh);
   return mesh;
  }
  function tube(p:THREE.Object3D,points:V3[],r:number,color:string){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,6,false),mat(color));p.add(m);m.castShadow=true;return m;}
  function line(p:THREE.Object3D,a:V3,b:V3,r:number,color:string){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=cyl(p,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],r,av.distanceTo(bv),color);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m;}
  const textures:THREE.Texture[]=[];
  function sign(p:THREE.Object3D,pos:V3,w:number,h:number,title:string,bg:string,fg:string,sub='',rotation=0,emissive=.2){
   const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.round(1024*h/w));const ctx=c.getContext('2d')!;ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);
   ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.font=`bold ${Math.floor(c.height*(sub?.43:.58))}px "Yu Gothic","Microsoft YaHei",sans-serif`;ctx.fillText(title,512,c.height*(sub?.39:.5),960);
   if(sub){ctx.font=`500 ${Math.floor(c.height*.17)}px sans-serif`;ctx.fillText(sub,512,c.height*.78,950);}
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.sceneSign=true;textures.push(t);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:'#ffffff',emissiveIntensity:emissive,roughness:.65}));m.position.set(...pos);m.rotation.y=rotation;p.add(m);return m;
  }
  type Assembly={g:THREE.Group;delay:number;streamed?:boolean;settled?:boolean};
  const parts:Assembly[]=[];
  let staging:THREE.Group|undefined;
  function part(delay:number){
   const g=new THREE.Group();
   if(staging)staging.add(g);
   else{world.add(g);parts.push({g,delay});}
   return g;
  }
  const roofs:{x:number,z:number,w:number,d:number,h:number}[]=[];
  const base=part(0);
  const baseX=(district.west+district.east)/2,baseZ=(district.north+district.south)/2;
  box(base,[baseX,-.34,baseZ],[district.size,.65,district.size],'#253544',true);
  box(base,[baseX,-.035,baseZ],[district.size-.06,.1,district.size-.06],'#526273',true);
  const asphalt=new THREE.MeshStandardMaterial({color:'#415566',roughness:.43,metalness:.12});
  const road=new THREE.Mesh(new THREE.BoxGeometry(district.size-.1,.055,district.size-.1),asphalt);road.position.set(baseX,.035,baseZ);road.receiveShadow=true;base.add(road);
  // Pavement defines a tight L-shaped street, leaving the alley behind the shop.
  box(base,[-1.6,.13,-.55],[8.65,.21,7.1],'#89949b',true);
  box(base,[-1.6,.255,-.55],[8.62,.055,7.1],'#76858e');
  for(let x=-5.7;x<2.7;x+=.55)box(base,[x,.29,3],[.52,.13,.24],'#a0abb0',true);
  for(let z=-3.9;z<2.9;z+=.55)box(base,[2.8,.29,z],[.24,.13,.52],'#a0abb0',true);
  for(let x=-5.6;x<2.7;x+=.7)for(let z=-3.9;z<2.8;z+=.7){box(base,[x,.286,z],[.008,.004,.67],'#657681');box(base,[x,.287,z],[.67,.004,.008],'#657681');}
  for(let i=0;i<6;i++)box(base,[-3.55+i*.78,.072,4.42],[.43,.012,2.25],'#a9b7bb');
  for(let i=0;i<4;i++)box(base,[4.5,.072,-3.5+i*.75],[2.15,.012,.38],'#9eafb3');
  for(let z=-5;z<2;z+=1.6)box(base,[4.65,.07,z],[.055,.01,.7],'#b9b9a6');
  // Drain grates and a cast iron manhole.
  for(const x of [-4.6,-.3,2.35]){box(base,[x,.075,3.35],[.75,.035,.26],'#172a36',true);for(let i=0;i<10;i++)box(base,[x-.33+i*.073,.098,3.35],[.018,.015,.23],'#627882');}
  cyl(base,[4.45,.08,3.9],.42,.018,'#233947');for(let i=-3;i<=3;i++)box(base,[4.45,.094,3.9+i*.09],[.6,.008,.014],'#66808c');
  // Tiny wet aggregate gives the streets a softly illustrated surface.
  const aggregate=new THREE.BufferGeometry();const specks:number[]=[];for(let i=0;i<1600;i++){const x=rand()*11.8-5.9,z=rand()*11.8-5.9;if(z>3.15||x>3)specks.push(x,.079,z);}aggregate.setAttribute('position',new THREE.Float32BufferAttribute(specks,3));base.add(new THREE.Points(aggregate,new THREE.PointsMaterial({color:'#a7c1cb',size:.018,transparent:true,opacity:.27})));
  const pavement=part(.35);
  box(pavement,[-1.35,.4,-.85],[6.85,.25,4.9],'#b1b5ad',true);
  box(pavement,[-1.35,.54,-.85],[6.55,.045,4.65],'#d5c7a6');
  for(let x=-4.5;x<1.9;x+=.45)for(let z=-3;z<1.5;z+=.45){box(pavement,[x,.566,z],[.006,.004,.43],'#b5ae98');box(pavement,[x,.567,z],[.43,.004,.006],'#b5ae98');}
  const walls=part(.9);
  box(walls,[-1.35,1.98,-3.2],[6.6,2.85,.17],'#bac3bd',true);
  box(walls,[-4.64,1.98,-.85],[.15,2.85,4.85],'#b5bfb9',true);
  box(walls,[1.94,1.98,-2.55],[.15,2.85,1.45],'#c5c6b7',true);
  for(let z=-3;z<1.4;z+=.43)box(walls,[-4.73,1.35,z],[.018,.022,.4],'#829698');
  const interior=part(1.35);
  // Fully stocked refrigerated wall, with luminous frames and individual bottles.
  const productColors=['#e4ae6a','#b7c68c','#dd7d78','#d4ded4','#e4cb83','#82bcc3','#bd99ae'];
  function products(p:THREE.Object3D,x:number,y:number,z:number,count:number,step=.16){
   for(let i=0;i<count;i++){
    const col=productColors[Math.floor(rand()*productColors.length)],height=.13+rand()*.1;
    const px=x+i*step,bottle=(i+Math.round(y*3))%3===0;
    if(bottle){
     cyl(p,[px,y+height*.42,z],.049,height*.84,col);
     cyl(p,[px,y+height*.887,z],.031,height*.095,'#9eae9d');
     cyl(p,[px,y+height*.971,z],.032,height*.065,'#d9d2b9');
    }else{
     box(p,[px,y+height/2,z],[.105,height,.13],col);
     box(p,[px,y+height-.012,z],[.104,.015,.132],'#dbd4b7');
    }
    const labelZ=z+(bottle?.049:.068);
    box(p,[px,y+height*.57,labelZ],[.076,.048,.006],'#eee4c8');
    box(p,[px,y+height*.59,labelZ+.005],[.054,.01,.004],col).castShadow=false;
   }
  }
  for(let n=0;n<5;n++){
   const x=-3.95+n*1.03;box(interior,[x,1.68,-2.95],[.96,2.15,.42],'#4c6969',true);box(interior,[x,1.7,-2.71],[.85,1.96,.025],'#c6e5d2',false,.55);
   for(let j=0;j<5;j++){box(interior,[x,.76+j*.37,-2.53],[.88,.035,.38],'#edf0d7');products(interior,x-.34,.79+j*.37,-2.5,5,.16);}
   box(interior,[x+.37,1.65,-2.31],[.024,1.92,.025],'#eef3d8',false,.6);box(interior,[x+.27,1.65,-2.28],[.025,.3,.04],'#41585a');
  }
  sign(interior,[-1.9,2.94,-3.1],4.7,.24,'DAILY FRESH  •  おいしい毎日','#e3dcc1','#587a75');
  // Two low central aisles keep the view through the windows open.
  for(const x of [-3.25,-1.85]){box(interior,[x,1.08,-.55],[.65,1.02,1.15],'#b4ad91',true);for(let j=0;j<3;j++){const y=.68+j*.34;box(interior,[x,y,-.55],[.72,.055,1.25],'#f0dbab');for(const z of [-1,-.6,-.12])products(interior,x-.24,y+.035,z,4,.16);}sign(interior,[x,1.63,.09],.7,.14,'おすすめ','#d29d68','#fff0cd');}
  // Checkout, register, hot-food warmer, coffee and magazine display.
  box(interior,[.95,1.02,.42],[1.35,.9,.62],'#89a69a',true);box(interior,[.95,1.5,.42],[1.48,.09,.76],'#eee0bc',true);
  box(interior,[.95,1.69,.43],[.35,.3,.08],'#263d44',true);box(interior,[.95,1.69,.48],[.29,.21,.01],'#a8d7cb',false,.5);box(interior,[.95,1.54,.68],[.38,.04,.17],'#34464d');
  for(let row=0;row<3;row++)for(let col=0;col<5;col++)box(interior,[.804+col*.071,1.565,.624+row*.049],[.042,.009,.027],'#667d78').castShadow=false;
  box(interior,[.57,1.573,.53],[.17,.07,.22],'#83978e',true);
  box(interior,[.57,1.615,.51],[.105,.01,.11],'#bdc9ac');
  box(interior,[1.48,1.74,.42],[.4,.42,.42],'#ece0ba',true);box(interior,[1.48,1.75,.64],[.34,.3,.01],'#e8af63',false,.6);for(let i=0;i<3;i++)box(interior,[1.37+i*.1,1.7,.66],[.07,.07,.04],'#b57a42');
  box(interior,[-4.12,1.05,.7],[.53,.92,.65],'#6d807b',true);for(let j=0;j<3;j++)for(let i=0;i<3;i++){const m=box(interior,[-4.3+i*.17,.83+j*.28,1.06],[.14,.22,.025],productColors[i+j]);m.rotation.x=-.22;}
  box(interior,[-3.8,1.4,-1.75],[.5,1.5,.45],'#dadbc5',true);sign(interior,[-3.8,1.6,-1.51],.4,.45,'珈琲','#564e44','#edcc9e');
  const front=part(2.05);
  for(const x of [-4.56,-2.8,-1.03,.55,1.94])box(front,[x,1.94,1.53],[.09,2.77,.11],'#596c6c',true);
  box(front,[-1.3,3.25,1.53],[6.55,.075,.1],'#647b79',true);
  for(const y of [.62,2.02]){box(front,[-2.8,y,1.53],[3.5,.075,.1],'#647b79',true);box(front,[1.25,y,1.53],[1.35,.075,.1],'#647b79',true);}
  const glass=new THREE.MeshPhysicalMaterial({color:'#9acfd0',transparent:true,opacity:.09,roughness:.12,metalness:.1,depthWrite:false,side:THREE.DoubleSide});
  function pane(pos:V3,size:V3,parent:THREE.Object3D=front){const geometry=new THREE.PlaneGeometry(size[0]<size[2]?size[2]:size[0],size[1]);const m=new THREE.Mesh(geometry,glass);m.position.set(...pos);if(size[0]<size[2])m.rotation.y=Math.PI/2;parent.add(m);}
  pane([-3.68,1.95,1.52],[1.65,2.5,.018]);pane([-1.92,1.95,1.52],[1.66,2.5,.018]);pane([1.24,1.95,1.52],[1.25,2.5,.018]);
  // Automatic sliding doors are part of the architectural model.
  const slidingDoors:THREE.Group[]=[];
  for(const x of [-.64,.13]){const leaf=new THREE.Group();leaf.userData.dynamicCollider=true;front.add(leaf);slidingDoors.push(leaf);pane([x,1.86,1.54],[.71,2.36,.022],leaf);for(const dx of [-.36,.36])box(leaf,[x+dx,1.86,1.57],[.035,2.4,.04],'#d1d6ca');box(leaf,[x,1.4,1.58],[.7,.16,.015],'#6dbead');box(leaf,[x,1.39,1.6],[.12,.05,.01],'#e9e8cf');}
  box(front,[-.25,3.16,1.6],[.26,.09,.09],'#293d43');sign(front,[-.25,2.59,1.59],.65,.2,'自動ドア','#d4e5d3','#486c65');
  // Side glazing opens a second view into the shop.
  for(const z of [-1.75,-.15,1.48])box(front,[1.96,1.96,z],[.1,2.7,.07],'#617c79');
  pane([1.96,1.94,-.15],[.018,2.5,3.1]);for(const y of [.65,2.03,3.25])box(front,[1.98,y,-.13],[.075,.07,3.3],'#617c79');
  sign(front,[-3.76,1.23,1.59],.55,.63,'お弁当','#ead9b7','#b86b58','毎日、できたて');sign(front,[-3.06,1.25,1.59],.51,.63,'夏の味','#709a91','#fff0d0','冷たいお茶');
  // The raised entrance mat needs a real landing and an approach step.
  box(front,[-.25,.429,1.93],[1.6,.278,.64],'#a5afa3',true);
  box(front,[-.25,.35,2.44],[1.6,.12,.4],'#95a49c',true);
  box(front,[-.28,.57,1.92],[1.5,.035,.62],'#425453',true).userData.walkThrough=true;
  for(let i=0;i<15;i++)box(front,[-.94+i*.095,.591,1.92],[.025,.006,.52],'#647470').userData.walkThrough=true;
  const roof=part(2.7);
  box(roof,[-1.35,3.39,-.8],[7.02,.22,5.15],'#e1d9bc',true);
  box(roof,[-1.35,3.65,1.8],[7.08,.62,.28],'#e2ead4',true);
  box(roof,[-1.35,3.91,1.96],[7.05,.08,.02],'#62bba7',false,.5);box(roof,[-1.35,3.39,1.96],[7.05,.07,.02],'#72bea8',false,.5);
  sign(roof,[-1.45,3.66,1.953],6.15,.43,'☾  月あかり  MART','#e4ecd5','#3c8a7a','',0,.65);
  box(roof,[2.13,3.65,-.82],[.28,.62,5.2],'#dce7d1',true);sign(roof,[2.277,3.67,-.85],3.9,.4,'月あかり  MART','#e4ecd5','#3c8a7a','',Math.PI/2,.45);
  box(roof,[-1.35,3.98,-.85],[7.1,.16,5.4],'#6a8585',true);
  box(roof,[-1.35,4.08,-.85],[6.77,.08,5.05],'#536c72');
  for(let i=0;i<14;i++)box(roof,[-4.55+i*.49,4.13,-.85],[.025,.025,5.05],'#7e9695');
  for(const x of [-4.78,2.08])box(roof,[x,4.18,-.85],[.13,.23,5.15],'#9aaba4',true);
  box(roof,[-1.35,4.18,-3.39],[6.95,.23,.13],'#9aaba4',true);
  box(roof,[-1.35,3.28,1.65],[6.6,.045,.12],'#fff0b5',false,3);
  // Ceiling strips sit towards the back so the interior remains legible.
  for(const x of [-3.1,-.9,1])box(roof,[x,3.27,-1.2],[.1,.035,2.6],'#fff0ba',false,2);
  for(const x of [-3,.3]){const light=new THREE.PointLight('#ffdb98',7,6,2);light.position.set(x,2.65,.7);roof.add(light);}
  const ac=part(3.05);
  for(const x of [-2.8,-1.2]){box(ac,[x,4.48,-1.8],[1.24,.65,.9],'#b3c1b9',true);box(ac,[x,4.5,-1.335],[1.05,.43,.025],'#516a71');for(let i=0;i<9;i++)box(ac,[x-.47+i*.115,4.5,-1.31],[.027,.39,.025],'#9aafa9');box(ac,[x,4.83,-1.8],[1.3,.06,.97],'#c3cbc0',true);}
  tube(ac,[[-2.8,4.2,-2.05],[-3.6,4.2,-2.05],[-3.7,3.8,-3.4],[-3.7,.5,-3.5]],.045,'#9eafa8');
  tube(ac,[[2.1,3.95,-3.25],[2.35,3.6,-3.25],[2.35,.4,-3.25]],.065,'#637f80');
  const street=part(3.5);
  // Vending machine with its own illustrated product windows.
  const vending=new THREE.Group();vending.position.set(-4.92,.29,1.52);vending.rotation.y=.06;street.add(vending);
  box(vending,[0,1.12,0],[.95,2.22,.76],'#b56878',true);box(vending,[0,2.25,0],[1,.06,.81],'#e0a4a6',true);box(vending,[-.07,1.4,.39],[.69,1.12,.025],'#c4e5e1',false,1.1);
  for(let j=0;j<3;j++){box(vending,[-.07,1.03+j*.33,.48],[.65,.035,.13],'#f3e2ca');for(let i=0;i<4;i++){cyl(vending,[-.31+i*.16,1.14+j*.33,.46],.045,.18,productColors[(i+j)%7]);box(vending,[-.31+i*.16,1.02+j*.33,.5],[.06,.015,.014],'#7affdd',false,2);}}
  sign(vending,[0,2.04,.39],.79,.22,'SUNTORY','#ecd8ce','#a35f70');box(vending,[.37,1.3,.41],[.08,.18,.03],'#233e48');box(vending,[-.05,.46,.4],[.64,.23,.04],'#324552',true);box(vending,[-.05,.64,.42],[.65,.06,.03],'#e3b0b0');
  const vendlight=new THREE.PointLight('#ffadce',3,3);vendlight.position.set(-4.9,1.5,2.3);street.add(vendlight);
  // Recycling bins, umbrella stand and a couple of folded umbrellas.
  for(let i=0;i<2;i++){box(street,[1.05+i*.48,.78,2.22],[.4,.96,.46],'#9eaea5',true);box(street,[1.05+i*.48,1.28,2.22],[.44,.1,.5],'#b9c6b8',true);box(street,[1.05+i*.48,1.17,2.458],[.24,.09,.015],'#314f59');sign(street,[1.05+i*.48,.88,2.459],.22,.22,i?'PET':'CAN','#d9ded0','#607d75');}
  box(street,[-1.48,.64,2.12],[.5,.65,.42],'#445d65',true);for(let i=0;i<4;i++){const x=-1.65+i*.11;line(street,[x,.63,2.12],[x+.06,1.52,2.12],.018,'#bccbc5');tube(street,[[x+.06,1.48,2.12],[x+.06,1.61,2.12],[x+.16,1.63,2.12],[x+.18,1.53,2.12]],.018,'#d5c9b0');const u=cyl(street,[x,.99,2.12],.045,.49,['#b7d1ca','#7894a4','#bc999e','#aabfba'][i],.015);u.rotation.z=-.07;}
  // Small crates and plants bring a lived-in quality without characters.
  for(let i=0;i<2;i++)box(street,[-4.9,.49+i*.3,-2.4],[.7,.29,.6],'#718d84',true);
  function plant(x:number,z:number){cyl(street,[x,.49,z],.2,.35,'#a78470',.15);for(let i=0;i<9;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.13,6,4),mat(i%2?'#5e9189':'#85a497'));leaf.scale.set(.5,2.3,.6);leaf.position.set(x+(rand()-.5)*.3,.87+rand()*.25,z+(rand()-.5)*.3);leaf.rotation.z=(rand()-.5)*1.4;street.add(leaf);}}
  plant(-4,2.25);plant(2.4,-2.2);
  // Bicycle, spokes, frame, saddle, handlebars and front basket.
  const bike=new THREE.Group();street.add(bike);bike.position.set(-3, .32,2.25);bike.rotation.y=-.12;
  for(const x of [-.57,.57]){const tire=new THREE.Mesh(new THREE.TorusGeometry(.36,.035,8,32),mat('#25333e'));tire.position.set(x,.39,0);bike.add(tire);const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.012,6,32),mat('#b9c7bf'));ring.position.copy(tire.position);bike.add(ring);for(let i=0;i<10;i++){const a=i*Math.PI/5;line(bike,[x,.39,0],[x+Math.cos(a)*.32,.39+Math.sin(a)*.32,0],.004,'#b7c4be');}}
  for(const [a,b] of [[[-.57,.39,0],[-.2,.9,0]],[[-.2,.9,0],[.05,.39,0]],[[.05,.39,0],[-.57,.39,0]],[[-.2,.9,0],[.4,.88,0]],[[.4,.88,0],[.05,.39,0]],[[.4,.88,0],[.57,.39,0]]] as [V3,V3][])line(bike,a,b,.025,'#c3aa79');
  line(bike,[-.2,.8,0],[-.25,1.06,0],.025,'#b7c8c2');box(bike,[-.27,1.08,0],[.3,.06,.17],'#2e424b');line(bike,[.4,.87,0],[.36,1.17,0],.025,'#c2cfc6');line(bike,[.36,1.17,-.19],[.36,1.17,.19],.025,'#c2cfc6');box(bike,[.61,1.03,0],[.34,.27,.3],'#637a7a',true);for(let i=0;i<5;i++)box(bike,[.47+i*.07,1.04,.158],[.012,.23,.012],'#b1bfaf');line(bike,[.02,.4,0],[.12,.4,.2],.016,'#d0d4c1');box(bike,[.12,.4,.22],[.16,.04,.09],'#344953');
  // Parking bay down the side alley.
  for(const z of [-1.5,.2,1.9])box(street,[7.25,.084,z],[2.65,.012,.045],'#c1c5b6');box(street,[8.55,.085,.2],[.045,.01,3.4],'#c1c5b6');for(const z of [-.65,1.05])box(street,[8.2,.15,z],[.15,.13,.7],'#adb8ac',true);
  // Noticeboard on the back of the building.
  box(street,[-4.76,1.87,-1.2],[.1,1.2,1.45],'#65827e',true);sign(street,[-4.82,1.87,-1.2],1.25,1.05,'町のお知らせ','#e5d7b5','#607b77','夏祭り  8.24',-Math.PI/2);
  const details=part(4.05);
  // Corner guard rails, painted ivory with weathered feet.
  for(const [x,z,length,rot] of [[1.4,3.05,1.5,0],[2.92,-.55,2.7,Math.PI/2],[-4.5,3.05,1.5,0]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;details.add(g);tube(g,[[-length/2,.3,0],[-length/2,.88,0],[-length/2+.14,1.02,0],[length/2-.14,1.02,0],[length/2,.88,0],[length/2,.3,0]],.036,'#d4d1b4');for(const xx of [-length/2,length/2])cyl(g,[xx,.32,0],.075,.1,'#536972');line(g,[-length/2,.62,0],[length/2,.62,0],.023,'#c3c9b5');}
  // Streetlight and road signage.
  cyl(details,[3.05,2.8,2.8],.075,5.2,'#57717b');cyl(details,[3.05,.43,2.8],.15,.6,'#405966');tube(details,[[3.05,5.35,2.8],[3.05,5.6,2.8],[2.9,5.74,2.8],[2.3,5.74,2.8]],.06,'#7c9398');box(details,[2.24,5.68,2.8],[.68,.12,.31],'#adb7a8',true);box(details,[2.24,5.6,2.8],[.59,.025,.25],'#ffe3a3',false,3);
  const lamp=new THREE.PointLight('#ffd79b',10,7);lamp.position.set(2.24,5.4,2.8);details.add(lamp);
  sign(details,[3.05,3.15,2.89],.68,.75,'止まれ','#94717d','#efe4d3','STOP');
  cyl(details,[4.25,1.5,-4.85],.035,2.8,'#a8b9b3');sign(details,[4.25,2.7,-4.8],.66,.53,'P','#537e9a','#e9e5d3','24 h');
  // Power pole, transformer, insulators and gently sagging overhead cables.
  const power=part(4.55);
  cyl(power,[-5.35,3.15,-3.9],.13,5.9,'#8b9897');for(let i=0;i<7;i++)box(power,[-5.35,1.15+i*.12,-3.765],[.17,.055,.012],i%2?'#d5b96e':'#465966');
  box(power,[-5.35,5.65,-3.9],[1.6,.11,.15],'#526b74',true);cyl(power,[-5.1,4.95,-3.8],.23,.8,'#b0bdb5');for(const x of [-5.95,-5.35,-4.75]){cyl(power,[x,5.85,-3.9],.055,.3,'#d2d5c7');for(let i=0;i<3;i++)cyl(power,[x,5.76+i*.08,-3.9],.1,.025,'#a8bcb6');}
  cyl(power,[5.1,2.95,-4.8],.09,5.7,'#70868b');box(power,[5.1,5.5,-4.8],[.15,.1,1.1],'#526b74');
  for(let i=0;i<3;i++)tube(power,[[-5.95+i*.6,6.02,-3.9],[-2.6,5.25,-4.25],[1.2,5.14,-4.6],[5.1,5.65,-5.2+i*.4]],.014,'#263b4c');
  tube(power,[[-5.35,5.4,-3.9],[-4.6,4.7,-2.9],[-4.6,3.7,-2.2]],.025,'#304956');
  // Luminous shop totem, its lettering belongs to the model, not the interface.
  const totem=part(4.25);box(totem,[-5.23,2.43,2.7],[.1,4.3,.1],'#819b99',true);box(totem,[-5.23,4.3,2.7],[.98,1.25,.25],'#d6e7cb',true);sign(totem,[-5.23,4.36,2.835],.85,.97,'月あかり','#dcebd3','#3e8b7b','24 OPEN',0,.8);box(totem,[-5.23,3.66,2.7],[.99,.13,.26],'#72c5b5',false,.9);
  // Small interior details reward walking through the newly opened store.
  sign(interior,[-1.85,2.65,-1.25],.9,.24,'お菓子 ・ 日用品','#d4b887','#fff6d7');
  sign(interior,[-3.25,2.65,-1.25],.9,.24,'パン ・ お弁当','#799f92','#fff6d7');
  box(interior,[1.52,1.2,-1.45],[.55,.95,.75],'#90ada2',true);
  box(interior,[1.52,1.72,-1.45],[.62,.08,.82],'#e9d3a2');
  for(let i=0;i<3;i++){box(interior,[1.52,1.82,-1.7+i*.23],[.4,.1,.18],'#eadfc4',true);box(interior,[1.52,1.88,-1.7+i*.23],[.3,.03,.12],'#ce9f73');}
  sign(interior,[1.51,2.13,-1.88],.6,.2,'おにぎり  ¥150','#f0d5a7','#6b837b');
  box(interior,[-4.25,.86,-1.1],[.34,.5,.55],'#688f83',true);
  for(let j=0;j<4;j++)box(interior,[-4.25,1.03+j*.055,-1.1],[.37,.035,.59],'#98b4a3',true);
  // Stylized, irregular puddles and broken reflections on wet asphalt.
  function puddle(x:number,z:number,sx:number,sz:number,color:string,opacity:number){const shape=new THREE.Shape();for(let i=0;i<=28;i++){const a=i/28*Math.PI*2;const r=1+.1*Math.sin(a*5)+.07*Math.cos(a*3);const px=Math.cos(a)*sx*r,pz=Math.sin(a)*sz*r;if(!i)shape.moveTo(px,pz);else shape.lineTo(px,pz);}const m=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.set(x,.083,z);base.add(m);}
  puddle(-1.2,3.75,2.35,.35,'#77a9a3',.17);puddle(3.7,1.1,.44,1.9,'#8ab6af',.15);puddle(-4.7,4.5,.68,.5,'#9e7894',.13);puddle(1.4,5,1.6,.35,'#678eaa',.19);
  puddle(-3.6,-5.5,2,.3,'#b8a58a',.13);puddle(5,-8.5,.45,1.5,'#8bb4c2',.16);puddle(-8.4,4.4,1.4,.4,'#759ca9',.2);puddle(7.4,3.7,1.1,.3,'#819ba7',.18);
  for(let i=0;i<58;i++){const z=3.4+rand()*2.2;const x=-4.4+rand()*6.6;const m=box(base,[x,.087,z],[.08+rand()*.56,.003,.012+rand()*.05],i%3===0?'#bdada0':'#84b8ae');(m.material as THREE.Material)=new THREE.MeshBasicMaterial({color:i%3===0?'#e0c296':'#8bc6b5',transparent:true,opacity:.05+rand()*.16,depthWrite:false});}
  // Keep rain on the scene footprint and reveal the rear portion with its deck.
  const weatherScale=.75,mainRainCount=Math.round(1700*weatherScale);
  const rainSeedsFor=(bounds:Pick<typeof district,'west'|'east'|'north'|'south'>,count:number)=>Array.from({length:count},()=>{
   const x=bounds.west+.2+rand()*(bounds.east-bounds.west-.4);
   const z=bounds.north+.2+rand()*(bounds.south-bounds.north-.4);
   return {x,z,y:rand()*10,speed:3+rand()*2,ground:groundHeight(x,z)};
  });
  const annexArea=(northAnnex.east-northAnnex.west)*(northAnnex.south-northAnnex.north);
  const annexRainCount=Math.round(mainRainCount*annexArea/district.size**2);
  const villaArea=(northVillas.east-northVillas.west)*(district.north-northVillas.north);
  const villaRainCount=Math.round(mainRainCount*villaArea/district.size**2);
  const villaRain={...northVillas,south:district.north};
  const rainSeeds=[...rainSeedsFor(district,mainRainCount),...rainSeedsFor(northAnnex,annexRainCount),...rainSeedsFor(villaRain,villaRainCount)];
  const rainCount=rainSeeds.length,rainData=new Float32Array(rainCount*6);
  let activeRainCount=mainRainCount;
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainData,3));
  rainGeo.setDrawRange(0,activeRainCount*2);
  const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:'#b0ced9',transparent:true,opacity:.23,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
  rain.name='rainfall';
  const ripples:THREE.Mesh[]=[];for(let i=0;i<34;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(.08,.09,24),new THREE.MeshBasicMaterial({color:'#b5d6d5',transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;let x=rand()*11-5.5,z=rand()*11-5.5;if(x<3&&z<3.2)z=3.4+rand()*2;ring.position.set(x,.098,z);scene.add(ring);ripples.push(ring);}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');const start=performance.now();let frame=0,lastTime=start,assembled=false;
  const walking=new WalkingController(camera,controls,renderer.domElement,world,()=>{if(walking.active)assembled=true;setWalkingActive(walking.active);resize();});
  walkingRef.current=walking;
  const probe=createPerformanceProbe(camera,controls,walking,renderer);
  let disposed=false,lazyTimer=0,idleHandle=0;
  let overview:OverviewBatch|undefined,rooms:InteriorResidency|undefined,stressArea:THREE.Group|undefined;
  let savedDraws=0,renderFrames=0;
  const pendingLights=new Map<THREE.Group,Array<{slot:THREE.PointLight;intensity:number}>>();
  // A fixed light count lets existing materials keep their compiled programs
  // when a shop or street lamp appears. Dormant slots contribute no light.
  const lightSlots=Array.from({length:28},()=>new THREE.PointLight('#ffffff',0,1));
  scene.add(...lightSlots);
  let lightIndex=0;
  const reserveLights=(group:THREE.Group)=>{
   group.updateWorldMatrix(true,true);
   const sources:THREE.PointLight[]=[];
   group.traverse(object=>{if(object instanceof THREE.PointLight)sources.push(object);});
   const lights:Array<{slot:THREE.PointLight;intensity:number}>=[];
   for(const source of sources){
    const slot=lightSlots[lightIndex++];
    if(!slot)continue;
    slot.color.copy(source.color);
    slot.distance=source.distance;
    slot.decay=source.decay;
    source.getWorldPosition(slot.position);
    lights.push({slot,intensity:source.intensity});
    source.removeFromParent();
   }
   if(lights.length)pendingLights.set(group,lights);
  };
  const prepareAssembly=(group:THREE.Group)=>{
   reserveLights(group);
   savedDraws+=optimizePart(group);
   // Children stay static in building-local space, while the root can animate.
   group.matrixAutoUpdate=true;
   renderer.domElement.dataset.savedDraws=String(savedDraws);
  };
  for(const {g} of parts)prepareAssembly(g);
  const roofClearance=new Float32Array(rainCount);
  const cacheRainClearance=()=>{
   rainSeeds.forEach(({x,z,ground},i)=>{
    let height=x>-4.9&&x<2.3&&z>-3.55&&z<2.05?4.25:ground;
    for(const roof of roofs){
     if(Math.abs(x-roof.x)<roof.w/2&&Math.abs(z-roof.z)<roof.d/2)height=Math.max(height,roof.h);
    }
    roofClearance[i]=height;
   });
  };
  cacheRainClearance();
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.info.autoReset=false;
  renderer.domElement.dataset.loading='center';
  walking.regionReady=(x,z)=>{
   const stage=renderer.domElement.dataset.loading;
   return stage==='ready'||(stage==='north-annex'&&z>=district.north)||(stage==='riverbank'&&z>=district.north&&x>canal.west+.18)||(x>-5.9&&x<2.9&&z>-4&&z<5.9);
  };
  const kit={part,box,cyl,tube,line,sign,mat,glass,roofs};
  const combat=new ZombieMode(kit,world,scene,camera,walking,moon,()=>renderer.domElement.dataset.loading==='ready',setSurvival);
  combatRef.current=combat;combat.setEnabled(testMode);
  const vendorAnimations:((seconds:number)=>void)[]=[];
  const scheduleBatch=(callback:()=>void,delay=80)=>{
   lazyTimer=window.setTimeout(()=>{
    if(disposed)return;
    if('requestIdleCallback' in window)idleHandle=window.requestIdleCallback(callback,{timeout:350});
    else callback();
   },delay);
  };
  const buildBatches=(iterator:Generator<void,void,unknown>,complete:()=>void)=>{
   const step=()=>{
    if(disposed)return;
    const tick=performance.now();
    const chunk=new THREE.Group();
    staging=chunk;
    let done:boolean;
    try{done=iterator.next().done===true;}
    finally{staging=undefined;}
    if(!chunk.children.length){
     if(done)complete();else scheduleBatch(step);
     return;
    }
    walking.registerWorld(chunk);
    prepareAssembly(chunk);
    cacheRainClearance();
    chunk.visible=false;
    world.add(chunk);
    parts.push({g:chunk,delay:(performance.now()-start)/1000,streamed:true});
    renderer.domElement.dataset.maxBuildMs=String(Math.max(Number(renderer.domElement.dataset.maxBuildMs||0),performance.now()-tick).toFixed(1));
    renderer.domElement.dataset.batches=String(Number(renderer.domElement.dataset.batches||0)+1);
    // Render and allow input between buildings before taking another idle slot.
    scheduleBatch(done?complete:step, reduced.matches||assembled?100:340);
   };scheduleBatch(step);
  };
  const finishNeighborhood=()=>{
   activeRainCount=rainCount;rainGeo.setDrawRange(0,activeRainCount*2);
   renderer.domElement.dataset.loading='ready';
   if(!pilotEnabled)return;
   renderer.domElement.dataset.pilot='preparing';
   scheduleBatch(()=>{
    const batch=new OverviewBatch(world);
    const residency=new InteriorResidency(world);
    const work=()=>{
     if(disposed)return;
     if(!batch.step()){scheduleBatch(work,16);return;}
     world.add(batch.root);
     if(stress){
      stressArea=batch.root.clone();stressArea.name='benchmark-district';stressArea.position.x=-47;
      stressArea.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.LineSegments)object.geometry=object.geometry.clone();});
      world.add(stressArea);
     }
     overview=batch;rooms=residency;
     renderer.domElement.dataset.overviewBatches=String(batch.batches);
     renderer.domElement.dataset.pilot='ready';
    };
    work();
   },40);
  };
  const loadVillas=()=>{
   if(disposed)return;
   import('./NorthVillas').then(({buildNorthVillas})=>{
    if(!disposed)buildBatches(buildNorthVillas(kit),finishNeighborhood);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadNorthAnnex=()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='north-annex';
   import('./NorthAnnex').then(({buildNorthAnnex})=>{
    if(!disposed)buildBatches(buildNorthAnnex(kit,reduced,animate=>vendorAnimations.push(animate)),loadVillas);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadRiverbank=()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='riverbank';
   import('./Riverbank').then(({buildRiverbank})=>{
    if(!disposed)buildBatches(buildRiverbank(kit),loadNorthAnnex);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadCanal=()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='canal';
   import('./CanalLane').then(({buildCanalLane})=>{
    if(!disposed)buildBatches(buildCanalLane(kit),loadRiverbank);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadSummit=()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='summit';
   import('./Summit').then(({buildSummit})=>{
    if(!disposed)buildBatches(buildSummit(kit),loadNorthDeck);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadNorthInteriors=()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='north-interiors';
   import('./NorthInteriors').then(({buildNorthInteriors})=>{
    if(!disposed)buildBatches(buildNorthInteriors(kit),loadCanal);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadHillside=()=>{if(disposed)return;renderer.domElement.dataset.loading='hillside';import('./Hillside').then(({buildHillside})=>{if(!disposed)buildBatches(buildHillside(kit),loadSummit);}).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});};
  const loadGarden=()=>{if(disposed)return;renderer.domElement.dataset.loading='garden';
   import('./GardenRoom').then(({buildGardenRoom})=>{if(!disposed)buildBatches(buildGardenRoom(kit),loadHillside);}).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadSurroundings=()=>{
   if(disposed)return;renderer.domElement.dataset.loading='surroundings';
   import('./Surroundings').then(({buildSurroundings})=>{if(!disposed)buildBatches(buildSurroundings(kit),loadGarden);}).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  const loadNorthDeck=()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='north-platform';
   import('./NorthDeck').then(({buildNorthDeck})=>{
    if(!disposed)buildBatches(buildNorthDeck(kit),loadNorthInteriors);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  };
  lazyTimer=window.setTimeout(()=>{
   if(disposed)return;
   renderer.domElement.dataset.loading='streets';
   import('./StreetEdges').then(({buildStreetEdges})=>{
    if(!disposed)buildBatches(buildStreetEdges(kit),loadSurroundings);
   }).catch(()=>{if(!disposed)renderer.domElement.dataset.loading='failed';});
  },1800);
  function resize(){
   const w=container.clientWidth,h=container.clientHeight;
   if(!w||!h)return;
   const ratio=Math.min(devicePixelRatio,lowQuality?.85:1.5,Math.sqrt((lowQuality?850_000:1_600_000)/(w*h)));
   camera.aspect=w/h;
   camera.near=walking.active?.035:.12;
   camera.fov=walking.active?68:THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(34)/2)*Math.max(1,1.4/(w/h))));
   camera.updateProjectionMatrix();
   if(renderer.getPixelRatio()!==ratio){renderer.setPixelRatio(ratio);composer.setPixelRatio(ratio);}
   renderer.setSize(w,h);composer.setSize(w,h);
   bloom.setSize(w*ratio*.7,h*ratio*.7);
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  const key=(e:KeyboardEvent)=>{if(walking.active)return;const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')spherical.theta-=.1;else if(e.key==='ArrowRight')spherical.theta+=.1;else if(e.key==='ArrowUp')spherical.phi=Math.max(.18,spherical.phi-.08);else if(e.key==='ArrowDown')spherical.phi=Math.min(Math.PI*.485,spherical.phi+.08);else if(e.key==='+'||e.key==='=')spherical.radius=Math.max(9,spherical.radius*.9);else if(e.key==='-')spherical.radius=Math.min(controls.maxDistance,spherical.radius*1.1);else return;e.preventDefault();camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));};renderer.domElement.addEventListener('keydown',key);
  function animate(){frame=requestAnimationFrame(animate);const now=performance.now();const t=(now-start)/1000;const delta=(now-lastTime)/1000;lastTime=now;
   const measuredStart=probe?.beforeFrame(now);
   const doorNear=(walking.active&&walking.isAtAutoDoor(camera.position))||
    combat.doorNear;
   slidingDoors.forEach((leaf,i)=>{leaf.position.x=THREE.MathUtils.damp(leaf.position.x,doorNear?(i===0?-.8:.8):0,8,Math.min(delta,.05));});walking.update(delta);
   renderer.domElement.dataset.location=!walking.active?'model':inHillOpenHouse(camera.position.x,camera.position.z)?'residence':camera.position.x>-14&&camera.position.x<-9.8&&camera.position.z>5.3&&camera.position.z<9.3?'reading-room':camera.position.x>-4.55&&camera.position.x<1.9&&camera.position.z>-3.12&&camera.position.z<1.5?'store':camera.position.x>9.6&&camera.position.x<14.2&&camera.position.z>-8.9&&camera.position.z<-4.3?'cafe':camera.position.x>9.6&&camera.position.x<14.2&&camera.position.z>-1.3&&camera.position.z<3.3?'laundry':'street';
   if(walking.active){
    const {x,y,z}=camera.position;
    const onSummit=x>summit.west&&x<summit.east&&z>summit.north&&z<summit.south;
    const inHouse=x>summitHouse.west&&x<summitHouse.east&&z>summitHouse.north&&z<summitHouse.south;
    const onBalcony=x>summitBalcony.west&&x<summitBalcony.east&&z>summitBalcony.north&&z<summitBalcony.south&&y>summitHouse.upper+.5;
    const northInterior=x>northHouse.x+northHouse.west&&x<northHouse.x+northHouse.east&&z>northHouse.z+northHouse.back&&z<northHouse.z+northHouse.front;
    const roofTerrace=Math.abs(x-northHouse.x)<1.5&&z>=northHouse.z+northHouse.front&&z<northHouse.z+northHouse.front+.89&&y>floorY(2)+.5;
    const tea=Math.abs(x-northTea.x)<northTea.w/2&&Math.abs(z-northTea.z)<northTea.d/2&&y>northY+.5;
    const location=roofTerrace?'north-house-balcony':northInterior?(y>floorY(2)+1.04?'north-house-3':y>floorY(1)+1.04?'north-house-2':'north-house-1'):tea?'north-tearoom':onBalcony?'summit-balcony':inHouse?(y>summitHouse.upper+1.15?'summit-upper':'summit-house'):onSummit?'summit':canalLocation(x,z);
    if(location)renderer.domElement.dataset.location=location;
   }
   renderer.domElement.dataset.door=doorNear?'open':'closed';renderer.domElement.dataset.elevation=camera.position.y.toFixed(3);
   let shadowDirty=false;
   for(const state of parts){
    if(state.settled)continue;
    const {g,delay,streamed}=state;
    const q=(reduced.matches||assembled)?1:THREE.MathUtils.clamp((t-delay)/(streamed?.28:1.65),0,1);
    const ease=1-Math.pow(1-q,3);
    g.visible=q>0;
    g.position.y=(1-ease)*(streamed?.68:delay===0?-1.3:3.8);
    if(!streamed)g.scale.setScalar(.92+.08*ease);
    if(q===1){
     state.settled=true;
     for(const {slot,intensity} of pendingLights.get(g)??[])slot.intensity=intensity;
     pendingLights.delete(g);
     shadowDirty=true;
    }
   }
   if(shadowDirty||slidingDoors.some((leaf,i)=>Math.abs(leaf.position.x-(doorNear?(i===0?-.8:.8):0))>.001))renderer.shadowMap.needsUpdate=true;
   rain.visible=!reduced.matches&&t>6;
   if(rain.visible){
    for(let i=0;i<activeRainCount;i++){
     const r=rainSeeds[i],y=13*(1-((t*r.speed+r.y)%10)/10),covered=y<roofClearance[i],n=i*6;
     rainData[n]=r.x;rainData[n+1]=y;rainData[n+2]=r.z;
     rainData[n+3]=r.x-(covered?0:.025);rainData[n+4]=y+(covered?0:.14);rainData[n+5]=r.z-(covered?0:.012);
    }
    rainGeo.attributes.position.needsUpdate=true;
   }
   ripples.forEach((m,i)=>{
    m.visible=t>5&&!reduced.matches;
    if(!m.visible)return;
    const phase=(t*.65*weatherScale+i*.137)%1;
    m.scale.setScalar(.3+phase*3);(m.material as THREE.MeshBasicMaterial).opacity=(1-phase)*.23;
   });
   if(!walking.active)controls.update();
   for(const animateVendor of vendorAnimations)animateVendor(reduced.matches?0:t);
   combat.update(delta,reduced.matches);
   if(overview&&rooms){
    const far=!walking.active&&camera.position.distanceToSquared(controls.target)>(overview.active?28**2:34**2);
    const overviewChanged=overview.setActive(far);
    const residency=rooms.update(walking.active?camera.position:controls.target,far);
    if(stressArea)stressArea.visible=far;
    if(overviewChanged||residency.changed)renderer.shadowMap.needsUpdate=true;
    const count=String(residency.visible);
    if(renderer.domElement.dataset.detailRooms!==count)renderer.domElement.dataset.detailRooms=count;
   }
   renderer.info.reset();
   const submitStart=measuredStart===undefined?undefined:performance.now();
   composer.render();
   if(++renderFrames%30===0)renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls);
   probe?.afterFrame(now,measuredStart,submitStart);
  }animate();
  return()=>{disposed=true;walkingRef.current=undefined;combatRef.current=undefined;combat.dispose();clearTimeout(lazyTimer);if(idleHandle)window.cancelIdleCallback(idleHandle);cancelAnimationFrame(frame);probe?.dispose();rooms?.restore();walking.dispose();observer.disconnect();releaseRightGestures();musicRef.current=undefined;music.dispose();renderer.domElement.removeEventListener('keydown',key);controls.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>materials.add(x));if(m instanceof THREE.InstancedMesh)m.dispose();});geometries.forEach(g=>g.dispose());mats.forEach(m=>materials.add(m));materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());unitBox.dispose();unitEdges.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <main ref={host} className="fantasy-boundary__scene" aria-label="雨夜便利店微缩景观">
  {unavailable && <p role="status">当前浏览器无法启动 3D 场景。启用 WebGL 后可刷新重试。</p>}
  {testMode && <>
   <div className={`fantasy-boundary__damage${survival.hurt?' is-hurt':''}`} aria-hidden="true" />
   {walkingActive&&!survival.dead&&<div className={`fantasy-boundary__crosshair${survival.hit?' is-hit':''}`} aria-hidden="true">+</div>}
   <section className="fantasy-boundary__vitals" aria-label="生存状态">
    <label>生命 <span>{survival.health} / 100</span><progress aria-label="生命" max={100} value={survival.health} /></label>
    <label>耐力 <span>{survival.stamina} / 100</span><progress aria-label="耐力" max={100} value={survival.stamina} /></label>
    <small>{survival.status}</small>
    <small>附近实体 {survival.count} · 击倒 {survival.kills}</small>
   </section>
  </>}
  {!unavailable && <aside className="fantasy-boundary__test" aria-label="场景选项">
   <button type="button" aria-pressed={testMode} onClick={()=>{
    const enabled=!testMode;setTestMode(enabled);combatRef.current?.setEnabled(enabled);musicRef.current?.setCombat(enabled);
    if(enabled)host.current?.querySelector('canvas')?.focus({preventScroll:true});
   }}>test 丧尸模式 · {testMode?'已开启':'关闭'}</button>
   {!walkingActive&&!testMode&&<button type="button" onClick={()=>{
    walkingRef.current?.enter();host.current?.querySelector('canvas')?.focus({preventScroll:true});
   }}>进入步行</button>}
   {testMode && <>
    <p>{survival.dead?'红月仍在，重新开始下一次尝试。':walkingActive?'WASD 移动 · Shift 奔跑 · 空格跳跃':'战斗已暂停，继续后从原处恢复。'}</p>
    {walkingActive&&!survival.dead&&<>
     <small>左键单发 · E 坐下/起身 · M 释放鼠标 · B 配乐 · Esc 暂停</small>
     <div className="fantasy-boundary__actions">
      <button type="button" onClick={()=>{combatRef.current?.shoot();}}>射击</button>
      <button type="button" onClick={()=>walkingRef.current?.jump()}>跳跃 ↑</button>
      <button type="button" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);if(walkingRef.current)walkingRef.current.touchSprint=true;}} onPointerUp={()=>{if(walkingRef.current)walkingRef.current.touchSprint=false;}} onPointerCancel={()=>{if(walkingRef.current)walkingRef.current.touchSprint=false;}} onLostPointerCapture={()=>{if(walkingRef.current)walkingRef.current.touchSprint=false;}}>按住奔跑</button>
      <button type="button" onClick={()=>walkingRef.current?.interact()}>坐下 / 起身</button>
     </div>
    </>}
    {!walkingActive&&!survival.dead&&<button type="button" onClick={()=>{walkingRef.current?.enter();host.current?.querySelector('canvas')?.focus({preventScroll:true});}}>继续测试</button>}
    <button type="button" onClick={()=>{combatRef.current?.restart();host.current?.querySelector('canvas')?.focus({preventScroll:true});}}>重新开始</button>
    <label className="fantasy-boundary__sound"><input type="checkbox" checked={muted} onChange={e=>{setMuted(e.target.checked);if(combatRef.current)combatRef.current.audio.muted=e.target.checked;}} />关闭枪声音效</label>
   </>}
  </aside>}
 </main>;
}







