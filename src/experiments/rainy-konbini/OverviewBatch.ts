import * as THREE from 'three';

type Mesh = THREE.Mesh<THREE.BufferGeometry,THREE.Material>;
type Lines = THREE.LineSegments<THREE.BufferGeometry,THREE.Material>;
type Source = Mesh|Lines;
type Batch = {sources:Source[];vertices:number};
const VERTEX_LIMIT=11_000;
const CELL_SIZE=11;

function isStatic(object:THREE.Object3D,world:THREE.Object3D){
 for(let node:THREE.Object3D|null=object;node&&node!==world;node=node.parent){
  if(!node.visible||node.userData.dynamicCollider||node.userData.animated)return false;
 }
 return true;
}

function isTextured(material:THREE.Material){
 return Object.entries(material).some(([key,value])=>/map$/i.test(key)&&value instanceof THREE.Texture);
}

function merge(sources:Source[],lines:boolean,palette:THREE.MeshToonMaterial){
 const meshMatrix=new THREE.Matrix4(),instanceMatrix=new THREE.Matrix4();
 const normalsMatrix=new THREE.Matrix3(),vertex=new THREE.Vector3();
 let vertices=0,indices=0;
 for(const source of sources){
  const position=source.geometry.getAttribute('position');
  const count=source instanceof THREE.InstancedMesh?source.count:1;
  vertices+=position.count*count;
  if(!lines)indices+=(source.geometry.index?.count??position.count)*count;
 }
 const positions=new Float32Array(vertices*3);
 const normals=lines?undefined:new Float32Array(vertices*3);
 const index=lines?undefined:new Uint16Array(indices);
 const usePalette=sources[0].material.userData.overviewVertexPalette===true;
 const colors=usePalette?new Float32Array(vertices*3):undefined;
 let offset=0,indexOffset=0;
 for(const source of sources){
  const geometry=source.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
  const color=(source.material as THREE.MeshToonMaterial).color;
  const count=source instanceof THREE.InstancedMesh?source.count:1;
  for(let i=0;i<count;i++){
   meshMatrix.copy(source.matrixWorld);
   if(source instanceof THREE.InstancedMesh){source.getMatrixAt(i,instanceMatrix);meshMatrix.multiply(instanceMatrix);}
   if(normals)normalsMatrix.getNormalMatrix(meshMatrix);
   for(let j=0;j<position.count;j++){
    vertex.fromBufferAttribute(position,j).applyMatrix4(meshMatrix).toArray(positions,(offset+j)*3);
    if(normals)vertex.fromBufferAttribute(normal,j).applyNormalMatrix(normalsMatrix).toArray(normals,(offset+j)*3);
    if(colors)color.toArray(colors,(offset+j)*3);
   }
   if(index){
    const original=geometry.index;
    for(let j=0;j<(original?.count??position.count);j++)index[indexOffset++]=offset+(original?original.getX(j):j);
   }
   offset+=position.count;
  }
 }
 const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(positions,3));
 if(colors)geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
 if(normals&&index){
  geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  geometry.setIndex(new THREE.BufferAttribute(index,1));
 }
 geometry.computeBoundingSphere();
 const first=sources[0];
 const merged=lines?new THREE.LineSegments(geometry,first.material):new THREE.Mesh(geometry,usePalette?palette:first.material);
 merged.castShadow=first.castShadow;merged.receiveShadow=first.receiveShadow;
 return merged;
}

export class OverviewBatch{
 readonly root=new THREE.Group();
 private replaced=new Set<Source>();
 private jobs:Batch[]=[];
 private job=0;
 private palette=new THREE.MeshToonMaterial({color:0xffffff,vertexColors:true});
 active=false;
 constructor(world:THREE.Group){
  this.root.name='district-overview';this.root.visible=false;
  world.updateMatrixWorld(true);
  const groups=new Map<string,Batch>();
  const textureCheck=new Map<THREE.Material,boolean>();
  const center=new THREE.Vector3();
  world.traverse(object=>{
   if(!(object instanceof THREE.Mesh||object instanceof THREE.LineSegments)||Array.isArray(object.material)||!isStatic(object,world))return;
   const lines=object instanceof THREE.LineSegments;
   if(!lines){
    if(object.material.transparent||!object.geometry.hasAttribute('normal'))return;
    if(object.children.some(child=>!(child instanceof THREE.LineSegments)))return;
    if(object instanceof THREE.InstancedMesh&&object.instanceColor)return;
    let textured=textureCheck.get(object.material);
    if(textured===undefined){textured=isTextured(object.material);textureCheck.set(object.material,textured);}
    if(textured)return;
   }
   if(!object.geometry.hasAttribute('position'))return;
   const position=object.geometry.getAttribute('position');
   const count=position.count*(object instanceof THREE.InstancedMesh?object.count:1);
   if(!count||count>VERTEX_LIMIT)return;
   const bounds=object instanceof THREE.InstancedMesh?object.boundingSphere:object.geometry.boundingSphere;
   if(bounds)center.copy(bounds.center).applyMatrix4(object.matrixWorld);
   else center.setFromMatrixPosition(object.matrixWorld);
   const material=object.material.userData.overviewVertexPalette===true?'vertex-palette':object.material.uuid;
   const key=[Math.floor(center.x/CELL_SIZE),Math.floor(center.z/CELL_SIZE),material,lines,object.castShadow,object.receiveShadow].join('|');
   let group=groups.get(key);
   if(!group||group.vertices+count>VERTEX_LIMIT){
    if(group&&group.sources.length>=2)this.jobs.push(group);
    group={sources:[],vertices:0};groups.set(key,group);
   }
   group.sources.push(object as Source);group.vertices+=count;
  });
  for(const group of groups.values())if(group.sources.length>=2)this.jobs.push(group);
 }
 step(budget=4){
  const start=performance.now();
  while(this.job<this.jobs.length){
   const {sources}=this.jobs[this.job++];
   const merged=merge(sources,sources[0] instanceof THREE.LineSegments,this.palette);
   this.root.add(merged);
   for(const source of sources)this.replaced.add(source);
   if(performance.now()-start>=budget)break;
  }
  const done=this.job===this.jobs.length;
  if(done)this.jobs=[];
  return done;
 }
 get batches(){return this.root.children.length;}
 setActive(active:boolean){
  if(this.active===active)return false;
  this.active=active;
  this.root.visible=active;
  for(const source of this.replaced)source.visible=!active;
  return true;
 }
}
