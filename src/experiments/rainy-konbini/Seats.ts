import * as THREE from 'three';

export type SeatAnchor = {
  surface: THREE.Vector3;
  stand: THREE.Vector3;
};

export function seat(parent:THREE.Object3D,surface:[number,number,number],stand:[number,number,number]){
  const anchor=new THREE.Object3D();
  anchor.position.set(...surface);
  anchor.userData.seatStand=new THREE.Vector3(...stand);
  parent.add(anchor);
}

export function seatIcon(){
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#22353de8';ctx.strokeStyle='#e4d5af';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(32,32,25,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff2cd';ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(22,21);ctx.lineTo(25,36);ctx.lineTo(43,36);
  ctx.moveTo(27,36);ctx.lineTo(24,45);ctx.moveTo(40,36);ctx.lineTo(43,45);ctx.stroke();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const icon=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false,sizeAttenuation:false}));
  icon.scale.set(.067,.067,1);icon.visible=false;
  return icon;
}
