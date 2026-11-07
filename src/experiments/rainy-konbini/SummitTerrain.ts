import {hillHeight,hillOuterX,hillTop} from './HillTerrain';

export const summit = {west:3,east:20.55,north:-29.7,south:hillTop,y:hillHeight(hillTop)};
export const summitHouse = {west:8.6,east:13.8,north:-29.34,south:-25.55,upper:5.83};
// Leave a turn at the foot of the stairs between the treads and the front wall.
export const summitStairs = {west:12.42,east:13.64,bottom:-26.43,top:-28.29};
export const summitBalcony = {west:8.77,east:11.86,north:summitHouse.south,south:-24.43};
export const hillParking = {west:3,east:7.22,north:summit.south,south:-18.35,y:.136};
export const parkingShoulderEdge=(z:number)=>hillOuterX(z,-1);

export function summitGround(x:number,z:number){
  if(x>=summit.west&&x<=summit.east&&z>=summit.north&&z<=summit.south)return summit.y;
  if(x>=hillParking.west&&x<parkingShoulderEdge(z)&&z>=hillParking.north&&z<=hillParking.south)return x<=hillParking.east?hillParking.y:.125;
}

export function summitInteriorHeight(x:number,z:number,feet:number){
  const house=summitHouse, stairs=summitStairs, balcony=summitBalcony;
  if(x>=stairs.west&&x<=stairs.east&&z>=stairs.top&&z<=stairs.bottom){
    const height=summit.y+(house.upper-summit.y)*(stairs.bottom-z)/(stairs.bottom-stairs.top);
    if(Math.abs(feet-height)<.28)return height;
  }
  if(Math.abs(feet-house.upper)>=.28)return;
  if(x>=house.west&&x<=house.east&&z>=house.north&&z<=house.south&&(x<=stairs.west||z<=stairs.top))return house.upper;
  if(x>=balcony.west&&x<=balcony.east&&z>=balcony.north&&z<=balcony.south)return house.upper;
}
