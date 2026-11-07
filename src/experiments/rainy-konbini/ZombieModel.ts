import * as THREE from 'three';
import type {SceneKit} from './SceneKit';

export const ZOMBIE_SCALE=[1.12,1.39,1.12] as const;
export const ZOMBIE_HEIGHT=1.84;
export const ZOMBIE_HALF_WIDTH=.29;

export function zombieModel(kit:SceneKit,sphere:THREE.SphereGeometry){
 const root=new THREE.Group();root.name='zombie';root.userData.animated=true;root.userData.walkThrough=true;
 const body=new THREE.Group();body.name='zombie-body';root.add(body);
 const round=(parent:THREE.Object3D,pos:[number,number,number],size:[number,number,number],color:string)=>{
  const mesh=new THREE.Mesh(sphere,kit.mat(color));mesh.position.set(...pos);mesh.scale.set(...size);parent.add(mesh);return mesh;
 };
 const joint=(name:string,x:number,y:number,z:number)=>{
  const group=new THREE.Group();group.name=`zombie-${name}`;group.position.set(x,y,z);body.add(group);return group;
 };
 const legs=[-1,1].map(side=>{
  const leg=joint(side<0?'left-leg':'right-leg',side*.082,.39,0);
  round(leg,[0,-.13,0],[.065,.17,.065],'#526c72');
  round(leg,[0,-.322,.045],[.077,.067,.119],'#4b7779');
  round(leg,[0,-.262,.013],[.069,.08,.077],'#6b9691');
  return leg;
 });
 round(body,[0,.64,0],[.186,.304,.134],'#51464a');
 round(body,[0,.455,0],[.191,.09,.151],'#575c57');
 for(const [i,y] of [.53,.65,.77].entries()){
  const tornSeam=kit.box(body,[-.03+i*.025,y,.132],[.09,.018,.018],'#34262b');
  tornSeam.rotation.z=-.48;
 }
 const arms=[-1,1].map(side=>{
  const arm=joint(side<0?'left-arm':'right-arm',side*.168,.82,0);
  round(arm,[side*.016,-.095,0],[.055,.139,.059],'#6b7267');
  round(arm,[side*.019,-.233,.015],[.047,.062,.045],'#839473');
  for(const offset of [-.024,0,.024]){
   round(arm,[side*.019+offset,-.289,.023],[.013,.038,.016],'#778561');
  }
  return arm;
 });
 const head=joint('head',0,1.056,0);
 round(head,[0,.01,-.022],[.209,.242,.197],'#667859');
 round(head,[0,-.024,.129],[.173,.171,.089],'#9aaa81');
 round(head,[-.072,.189,.016],[.129,.052,.141],'#323731');
 // Broken, swept-back tufts share a single geometry across all instances.
 const hair=new THREE.Group();hair.name='zombie-ragged-hair';head.add(hair);
 const tufts=new THREE.InstancedMesh(hairGeometry,kit.mat('#ffffff'),13);
 const tuft=new THREE.Object3D();hair.add(tuft);
 const setTuft=(index:number,color:string)=>{
  tuft.updateMatrix();tufts.setMatrixAt(index,tuft.matrix);tufts.setColorAt(index,new THREE.Color(color));
 };
 for(let i=0;i<11;i++){
  const angle=i*2.399,radius=.08+(i%3)*.032;
  tuft.position.set(Math.cos(angle)*radius,.19+(i%2)*.025,Math.sin(angle)*radius-.04);
  tuft.scale.set(.035+(i%2)*.012,.14+(i%4)*.037,.042);
  tuft.rotation.set(-.45-(i%3)*.2,angle,Math.cos(angle)*.65);
  setTuft(i,i%3?'#202a28':'#3a4438');
 }
 for(const side of [-1,1]){
  tuft.position.set(side*.185,.075,-.06);tuft.scale.set(.04,.19,.055);
  tuft.rotation.set(-.45,0,side*2.3);setTuft(side<0?11:12,'#28342d');
 }
 hair.remove(tuft);hair.add(tufts);tufts.computeBoundingSphere();
 round(head,[.098,-.081,.174],[.065,.087,.046],'#6e775e');
 head.rotation.z=.13;
 const eyes=new THREE.Group();eyes.position.set(0,.029,.197);head.add(eyes);
 for(const side of [-1,1]){
  round(eyes,[side*.071,0,0],[.055,.041,.027],'#29272c').rotation.z=side*.22;
  const pupil=round(eyes,[side*.067,-.002,.026],[.017,.014,.013],'#ff4248');
  pupil.material=kit.mat('#ff4248',.65);
  round(head,[side*.074,.064,.209],[.063,.019,.02],'#3c4738').rotation.z=side*.36;
 }
 round(head,[.015,-.105,.207],[.099,.053,.023],'#2b1a25').rotation.z=-.13;
 for(const [i,x] of [-.049,-.016,.02,.058].entries()){
  kit.box(head,[x,-.084-i*.004,.228],[.021,.029+(i%2)*.009,.018],'#d7d1af').rotation.z=(i-1.5)*.1;
 }
 const flashMaterial=kit.mat('#ff685b',.9);
 const surfaces:{mesh:THREE.Mesh;material:THREE.Material|THREE.Material[]}[]=[];
 body.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  object.castShadow=false;
  surfaces.push({mesh:object,material:object.material});
 });
 let flashed=false;
 const flash=(active:boolean)=>{
  if(active===flashed)return;
  flashed=active;
  for(const {mesh,material} of surfaces)mesh.material=active?flashMaterial:material;
 };
 arms[0].rotation.x=-.95;arms[1].rotation.x=-.8;
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.25,24),new THREE.MeshBasicMaterial({color:'#192e3a',transparent:true,opacity:.2,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.scale.y=.75;root.add(shadow);
 return {root,body,head,legs,arms,flash};
}

const hairGeometry=new THREE.ConeGeometry(1,1,4);
