import {northY} from './NorthTerrain';

export const villa={x:11.32,z:-36.53,w:8.8,d:6.42,rise:2.43};
export const guestHouse={x:18.13,z:-36.87,w:3.52,d:4.16};
export const villaStair={west:-4.07,east:-2.82,bottom:1.57,top:-1.6};
export const villaBalcony={half:1.72,depth:1.02};
export const villaUpper=northY+villa.rise;

export function villaFloorAt(x:number,z:number,feet:number){
 const u=x-villa.x,v=z-villa.z,front=villa.d/2;
 if(Math.abs(feet-villaUpper)<.28&&Math.abs(u)<=villaBalcony.half&&v>=front&&v<=front+villaBalcony.depth)return villaUpper;
 if(Math.abs(u)>villa.w/2||Math.abs(v)>front)return;
 const stair=villaStair;
 if(u>=stair.west&&u<=stair.east&&v>=stair.top&&v<=stair.bottom){
  const y=northY+villa.rise*(stair.bottom-v)/(stair.bottom-stair.top);
  if(Math.abs(feet-y)<.28)return y;
  return;
 }
 if(Math.abs(feet-villaUpper)<.28)return villaUpper;
}
