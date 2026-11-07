export const hillStations = [-13.4, -17, -20.6];
// Leave the uphill corners on the flat plots where the road bends between terraces.
export const hillHouseOffsets = [4.71,4.71,4.47];
export const hillRoadEdge = 2.22;
export const hillApronEdge = 2.49;
export const hillTop = -24;
export const hillFoot = -9.8;
export const hillCenter = (z:number) => 10 + Math.max(0, -11 - Math.max(z, -21.3)) * 5 / 11;
export const hillOpenHouse = {x:hillCenter(hillStations[1])+hillHouseOffsets[1],z:hillStations[1],w:2.95,d:2.98};
export const inHillOpenHouse = (x:number,z:number) =>
  Math.abs(x-hillOpenHouse.x)<hillOpenHouse.d/2&&Math.abs(z-hillOpenHouse.z)<hillOpenHouse.w/2;

const roadLevels = [[hillFoot,.29],[-11,.29],[-12.8,1.01],[-14,1.01],[-16.4,2.09],[-17.6,2.09],[-20,3.17],[-21.2,3.17],[-22.5,3.59],[hillTop,3.59]];
const plotLevels = [[-11,.29],[-11.85,1.01],[-14.95,1.01],[-15.43,2.09],[-18.57,2.09],[-19.03,3.17],[-22.17,3.17],[-23.15,3.59],[hillTop,3.59]];

function profile(z:number, levels:number[][]){
  if(z>=levels[0][0])return levels[0][1];
  for(let i=1;i<levels.length;i++){
    const [end,y]=levels[i],[start,previous]=levels[i-1];
    if(z>=end)return previous+(y-previous)*(start-z)/(start-end);
  }
  return levels[levels.length-1][1];
}

export const hillHeight = (z:number) => profile(z, roadLevels);
export const hillPlotHeight = (z:number) => profile(z, plotLevels);
export const hillWidth = (z:number) => z<=-11?hillRoadEdge:1.29+(hillRoadEdge-1.29)*(-9.8-z)/1.2;
const shoulderWidths = [[-11,5.85],[-11.8,7.06],[-22.3,7.06],[hillTop,5.85]];
// Recess the west retaining wall beside the lower street's porch.
const porchClearance = [[-11,0],[-11.7,4.67],[-15.65,4.67],[-16.3,0]];
export const hillOuterX = (z:number, side:number) => {
  const edge = hillCenter(z)+side*profile(z,shoulderWidths);
  return side>0?Math.min(edge,20.54):Math.max(edge,profile(z,porchClearance));
};
export const hillRows = [...new Set([
  ...roadLevels.map(([z])=>z), ...plotLevels.map(([z])=>z), -21.3,
  ...shoulderWidths.map(([z])=>z), ...porchClearance.map(([z])=>z),
  ...Array.from({length:57},(_,i)=>-9.8-i*.25),
])].sort((a,b)=>b-a);

export function hillsideGround(x:number,z:number):number|undefined{
  if(z<hillTop||z>hillFoot)return;
  const offset=Math.abs(x-hillCenter(z));
  if(offset<=hillWidth(z))return hillHeight(z);
  if(z>-11||x<hillOuterX(z,-1)||x>hillOuterX(z,1))return;
  const blend=Math.min(1,(offset-hillRoadEdge)/(hillApronEdge-hillRoadEdge));
  return hillHeight(z)+(hillPlotHeight(z)-hillHeight(z))*blend;
}
