import * as THREE from 'three';
/** Batch repeated opaque primitives within an assembly. Colliders stay independent. */
export function optimizePart(root:THREE.Group){
 root.updateWorldMatrix(true,true);
 const inverse=root.matrixWorld.clone().invert();
 const groups=new Map<string,THREE.Mesh[]>();
 root.traverse(o=>{
  if(!(o instanceof THREE.Mesh)||o instanceof THREE.InstancedMesh||Array.isArray(o.material)||o.material.transparent)return;
  if(o.geometry.type!=='BoxGeometry'&&o.geometry.type!=='CylinderGeometry')return;
  let p:THREE.Object3D|null=o;while(p&&p!==root){if(p.userData.dynamicCollider||p.userData.animated)return;p=p.parent;}
  const key=o.geometry.uuid+o.material.uuid+o.castShadow+o.receiveShadow;const bucket=groups.get(key)||[];bucket.push(o);groups.set(key,bucket);
 });
 let saved=0;
 for(const meshes of groups.values()){
  if(meshes.length<4)continue;
  const first=meshes[0],batch=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.userData.walkThrough=true;
  meshes.forEach((m,i)=>{
   const matrix=inverse.clone().multiply(m.matrixWorld);batch.setMatrixAt(i,matrix);
   for(const child of [...m.children]){child.updateWorldMatrix(true,false);const local=inverse.clone().multiply(child.matrixWorld);root.add(child);child.matrix.copy(local);child.matrixAutoUpdate=false;}
   m.removeFromParent();
  });
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();root.add(batch);saved+=meshes.length-1;
 }
 // Edges share one material but were still submitted once per outlined box.
 // Merge them in assembly-local coordinates so the outline moves with the building.
 const outlines=new Map<THREE.Material,THREE.LineSegments[]>();
 root.updateWorldMatrix(true,true);
 root.traverse(o=>{
  if(!(o instanceof THREE.LineSegments)||o.geometry.type!=='EdgesGeometry'||Array.isArray(o.material))return;
  for(let parent:THREE.Object3D|null=o;parent&&parent!==root;parent=parent.parent){
   if(parent.userData.dynamicCollider||parent.userData.animated)return;
  }
  const lines=outlines.get(o.material)??[];
  lines.push(o);outlines.set(o.material,lines);
 });
 const vertex=new THREE.Vector3(),transform=new THREE.Matrix4();
 for(const [material,lines] of outlines){
  if(lines.length<4)continue;
  const vertices:number[]=[];
  for(const line of lines){
   transform.multiplyMatrices(inverse,line.matrixWorld);
   const positions=line.geometry.getAttribute('position');
   for(let i=0;i<positions.count;i++){
    vertex.fromBufferAttribute(positions,i).applyMatrix4(transform);
    vertices.push(vertex.x,vertex.y,vertex.z);
   }
   line.removeFromParent();
  }
  const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  root.add(new THREE.LineSegments(geometry,material));
  saved+=lines.length-1;
 }
 root.traverse(o=>{if(o.userData.animated)return;let p:THREE.Object3D|null=o;while(p){if(p.userData.dynamicCollider)return;p=p.parent;}if(o.matrixAutoUpdate){o.updateMatrix();o.matrixAutoUpdate=false;}});
 return saved;
}
