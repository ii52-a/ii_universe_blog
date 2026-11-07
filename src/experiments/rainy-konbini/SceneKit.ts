import type * as THREE from 'three';
type V3=[number,number,number];
export type SceneKit={
 part:(delay:number)=>THREE.Group;
 box:(p:THREE.Object3D,pos:V3,size:V3,color:string,outline?:boolean,glow?:number)=>THREE.Mesh;
 cyl:(p:THREE.Object3D,pos:V3,r:number,h:number,color:string,r2?:number)=>THREE.Mesh;
 tube:(p:THREE.Object3D,points:V3[],r:number,color:string)=>THREE.Mesh;
 line:(p:THREE.Object3D,a:V3,b:V3,r:number,color:string)=>THREE.Mesh;
 sign:(p:THREE.Object3D,pos:V3,w:number,h:number,title:string,bg:string,fg:string,sub?:string,rotation?:number,emissive?:number)=>THREE.Mesh;
 mat:(color:string,glow?:number)=>THREE.Material;
 glass:THREE.Material;
 roofs:{x:number,z:number,w:number,d:number,h:number}[];
};
