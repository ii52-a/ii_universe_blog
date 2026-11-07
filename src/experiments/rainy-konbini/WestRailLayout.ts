import {northDeck,northY} from './NorthTerrain';
import {district} from './DistrictBounds';

export type RailPoint={x:number;y:number;z:number};
export const stationTrackX=-22.38;
export const railTrench={west:-23.74,east:-21.01,north:northDeck.north,south:northDeck.south};
export const lowerTrackY=.29;

const bendStart=-23.65,bendEnd=-20.18;
const exitX=-24.29;
const curve=(a:number,b:number,c:number,d:number,t:number)=>{
 const u=1-t;
 return u**3*a+3*u*u*t*b+3*u*t*t*c+t**3*d;
};
const linePoints=Array.from({length:19},(_,i)=>({
 x:stationTrackX,z:railTrench.north+(bendStart-railTrench.north)*i/18,
}));
const turnPoints=Array.from({length:24},(_,i)=>{
 const t=(i+1)/24;
 return {x:curve(stationTrackX,stationTrackX,-23.32,exitX,t),z:curve(bendStart,-21.56,bendEnd,bendEnd,t)};
});
const slopePoints=[...linePoints,...turnPoints];
const distances=[0];
for(let i=1;i<slopePoints.length;i++){
 const a=slopePoints[i-1],b=slopePoints[i];
 distances.push(distances[i-1]+Math.hypot(b.x-a.x,b.z-a.z));
}
const length=distances[distances.length-1],ease=.92;
function rampHeight(distance:number){
 let rise=distance-ease/2;
 if(distance<ease)rise=distance**2/(2*ease);
 else if(distance>length-ease)rise=length-ease-(length-distance)**2/(2*ease);
 return northY+(lowerTrackY-northY)*rise/(length-ease);
}

export const westRailRun:RailPoint[]=[
 {x:stationTrackX,y:northY,z:railTrench.north-.045},
 ...slopePoints.map(({x,z},i)=>({x,y:rampHeight(distances[i]),z})),
 {x:district.west,y:lowerTrackY,z:bendEnd},
];

export function railTrenchHeight(x:number,z:number){
 if(x<railTrench.west||x>railTrench.east||z<railTrench.north||z>railTrench.south)return;
 for(let i=1;i<westRailRun.length;i++){
  const a=westRailRun[i-1],b=westRailRun[i];
  if(z<=b.z)return a.y+(b.y-a.y)*(z-a.z)/(b.z-a.z);
 }
}

export function inWestRailApproach(x:number,z:number){
 if(x>-20.72||z<railTrench.north||z>bendEnd+1.52)return false;
 if(z<=railTrench.south&&x>=railTrench.west&&x<=railTrench.east)return true;
 for(let i=1;i<westRailRun.length;i++){
  const a=westRailRun[i-1],b=westRailRun[i],dx=b.x-a.x,dz=b.z-a.z;
  const along=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
  if((x-a.x-along*dx)**2+(z-a.z-along*dz)**2<1.6**2)return true;
 }
 return false;
}
