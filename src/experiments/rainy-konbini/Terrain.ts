import {hillsideGround} from './HillTerrain';
import {canalGround} from './CanalTerrain';
import {summitGround,summitInteriorHeight,summit,summitHouse,summitStairs} from './SummitTerrain';
import {onNorthDeck,northHouseGround,northY,northHouse,houseFlights,floorY} from './NorthTerrain';
import {villaFloorAt,villa,villaStair,villaUpper} from './VillaLayout';
import {railTrenchHeight} from './WestRailLayout';
export function groundHeight(x:number,z:number){
 if(onNorthDeck(x,z))return railTrenchHeight(x,z)??northY;
 const summit=summitGround(x,z);if(summit!==undefined)return summit;
 const bank=canalGround(x,z);if(bank!==undefined)return bank;
 const hill=hillsideGround(x,z);if(hill!==undefined)return hill;
 if(z<-24)return .081;
 // Accessible upper terrace and a continuous 1:2.8 garden approach.
 if(x>-12.85&&x<-11.15&&z>=10.5&&z<=13.3)return .29+(13.3-z)/2.8;
 if((x>-14&&x<-9.8&&z>5.3&&z<=10.5)||(x>=-9.8&&x<-6.8&&z>7.3&&z<=10.5))return 1.29;
 if(x>-13.05&&x<-10.95&&z>13.2&&z<13.7)return .29;
 if((x>=15&&z>=-11&&z<=14)||(z>14.075&&z<15.605)||
    (x<-14.525&&z>5.12&&z<14.02)||(x>=-14.475&&x<=14.895&&z>11.765&&z<14.055)||
    (x<4.725&&z<-16.015))return .081;
 if(x>-1.05&&x<.55&&z>=2.25&&z<2.64)return .41;
 // Only the central landing projects beyond the shop's front foundation.
 if(x>-4.55&&x<1.9&&z>-3.12&&(z<1.6||(x>-1.05&&x<.55&&z<2.25)))return .568;
 if(x>9.65&&x<14.15&&((z>-8.9&&z<-4.3)||(z>-1.3&&z<3.3)))return .39;
 if(x>9.1&&x<14.7&&z>-9.7&&z<4.1)return .29;
 if(x>9.1&&z>5.1)return .29;
 if(z<-12.05||z>9.2)return .29;
 if((x>-5.93&&x<2.83&&z>-4.1&&z<3.1)||(z<-6.25)||(x<-6.85&&z>-4.65&&z<3.45)||z>6.18)return .29;
 return .08;
}

export function walkHeight(x:number,z:number,feet:number){
 return villaFloorAt(x,z,feet)??northHouseGround(x,z,feet)??summitInteriorHeight(x,z,feet)??groundHeight(x,z);
}

// Query every floor independently of the current foot height, so jumping cannot
// accidentally switch a second-floor walker to the terrain beneath the house.
export function terrainSupport(x:number,z:number,ceiling:number){
 const candidates=[groundHeight(x,z)];
 const add=(height:number|undefined)=>{if(height!==undefined)candidates.push(height);};
 for(const level of [1,2])add(northHouseGround(x,z,floorY(level)));
 for(const [i,flight] of houseFlights.entries()){
  const y=floorY(i)+northHouse.rise*(flight.lowZ-(z-northHouse.z))/(flight.lowZ-flight.highZ);
  add(northHouseGround(x,z,y));
 }
 add(summitInteriorHeight(x,z,summitHouse.upper));
 add(summitInteriorHeight(x,z,summit.y+(summitHouse.upper-summit.y)*(summitStairs.bottom-z)/(summitStairs.bottom-summitStairs.top)));
 add(villaFloorAt(x,z,villaUpper));
 add(villaFloorAt(x,z,northY+villa.rise*(villaStair.bottom-(z-villa.z))/(villaStair.bottom-villaStair.top)));
 return Math.max(-Infinity,...candidates.filter(y=>y<=ceiling+.002));
}
