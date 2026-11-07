import {district} from './DistrictBounds';
import {hillParking,summit} from './SummitTerrain';

export const northY=summit.y;
export const northDeck={west:district.west,east:summit.west,north:district.north,south:hillParking.north};

export const northAnnex={west:northDeck.west,east:northDeck.east,north:-42,south:northDeck.north,railEdge:-17};

export const northVillas={west:summit.west,east:summit.east,north:northAnnex.north,south:summit.north};

export function onNorthDeck(x:number,z:number){
 const deck=x>=northDeck.west&&x<northDeck.east&&z>=northAnnex.north&&z<=northDeck.south;
 return deck||(x>=northVillas.west&&x<=northVillas.east&&z>=northVillas.north&&z<=northVillas.south);
}

export const northTea={x:-19.5,z:-27.69,w:3.4,d:2.67};
export const northHouse={x:-10.2,z:-29.05,west:-2.67,east:2.67,back:-2.27,front:2.27,rise:2.18};
export const houseFlights=[
 {left:-2.48,right:-1.38,lowZ:1.55,highZ:-1.5},
 {left:1.39,right:2.48,lowZ:1.55,highZ:-1.5},
];
export const floorY=(level:number)=>northY+level*northHouse.rise;

export function northHouseGround(x:number,z:number,feet:number){
 const house=northHouse;
 const u=x-house.x,v=z-house.z;
 if(Math.abs(feet-floorY(2))<.28&&Math.abs(u)<=1.5&&v>=house.front&&v<=house.front+.89)return floorY(2);
 if(u<house.west||u>house.east||v<house.back||v>house.front)return;
 for(let i=1;i<=2;i++){
  const level=floorY(i),flight=houseFlights[i-1];
  if(Math.abs(feet-level)<.28&&!(u>flight.left&&u<flight.right&&v>flight.highZ&&v<flight.lowZ))return level;
 }
}
