import * as THREE from 'three';

type Room = {
 group:THREE.Group; parent:THREE.Object3D; bounds:THREE.Box3;
 instances:THREE.InstancedMesh[]; geometry:THREE.BufferGeometry[];
 signs:THREE.Texture[]; attached:boolean;
};

export class InteriorResidency{
 private rooms:Room[]=[];
 private point=new THREE.Vector3();
 constructor(world:THREE.Group){
  const usage=new Map<THREE.BufferGeometry,number>();
  world.traverse(object=>{
   if(object instanceof THREE.Mesh)usage.set(object.geometry,(usage.get(object.geometry)??0)+1);
  });
  world.traverse(object=>{
   if(!(object instanceof THREE.Group)||!object.userData.streamInterior||!object.parent)return;
   const room:Room={group:object,parent:object.parent,bounds:new THREE.Box3().setFromObject(object),instances:[],geometry:[],signs:[],attached:true};
   const ownedSigns=new Set<THREE.Texture>();
   object.traverse(mesh=>{
    if(!(mesh instanceof THREE.Mesh))return;
    if(mesh instanceof THREE.InstancedMesh)room.instances.push(mesh);
    if(usage.get(mesh.geometry)===1&&!mesh.geometry.userData.sharedScenePrimitive)room.geometry.push(mesh.geometry);
    const materials:THREE.Material[]=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    for(const material of materials){
     const map=(material as THREE.MeshStandardMaterial).map;
     if(map?.userData.sceneSign)ownedSigns.add(map);
    }
   });
   room.signs=[...ownedSigns];
   if(!room.bounds.isEmpty())this.rooms.push(room);
  });
 }
 private setAttached(room:Room,attach:boolean){
  if(room.attached===attach)return false;
  room.attached=attach;
  if(attach){room.parent.add(room.group);room.group.updateMatrixWorld(true);}
  else{
   room.group.removeFromParent();
   room.instances.forEach(mesh=>mesh.dispose());
   room.geometry.forEach(geometry=>geometry.dispose());
   room.signs.forEach(texture=>texture.dispose());
  }
  return true;
 }
 update(focus:THREE.Vector3,overview:boolean){
  let changed=false,visible=0;
  for(const room of this.rooms){
   const {min,max}=room.bounds;
   this.point.set(THREE.MathUtils.clamp(focus.x,min.x,max.x),focus.y,THREE.MathUtils.clamp(focus.z,min.z,max.z));
   const distance=this.point.distanceTo(focus);
   const attach=!overview&&distance<(room.attached?18:13);
   if(this.setAttached(room,attach))changed=true;
   if(room.attached)visible++;
  }
  return {changed,visible,total:this.rooms.length};
 }
 restore(){for(const room of this.rooms)this.setAttached(room,true);}
}
