import {district} from './DistrictBounds';

export const canal = {west:-18.55,east:-16.45,north:-22.8,south:5.12,bridgeZ:1.65,footbridgeZ:-17.65};
export const eastBankJoin = -15.35;
export const bridgeHalfWidth = .72;
export const canalShops = { ramen: -5.05, books: -11.1 };
export const riverHome = {x:-22.48,z:-2.55,w:3.8,d:3.7};
export const riverCourtyard = {x:-22.54,z:4,w:4.15,d:3.35};

export const onBridge = (z:number,inset=0) => [canal.bridgeZ,canal.footbridgeZ].some(crossing=>Math.abs(z-crossing)<=bridgeHalfWidth-inset);

export function canalLocation(x: number, z: number) {
  if (x > -15.65 && x < -11.95) {
    if (Math.abs(z - canalShops.ramen) < 2.18) return 'ramen';
    if (Math.abs(z - canalShops.books) < 2.18) return 'bookshop';
  }
  if(x>=canal.west-.1&&x<=-15.35&&onBridge(z,.06))return 'canal-bridge';
  if(Math.abs(x-riverHome.x)<riverHome.d/2-.06&&Math.abs(z-riverHome.z)<riverHome.w/2-.1)return 'river-house';
  if(Math.abs(x-riverCourtyard.x)<riverCourtyard.w/2-.12&&Math.abs(z-riverCourtyard.z)<riverCourtyard.d/2-.12)return 'river-courtyard';
}

export function canalGround(x: number, z: number) {
  const location = canalLocation(x, z);
  if (location === 'ramen' || location === 'bookshop') return .39;
  if(onBridge(z)&&x>=canal.west-.12&&x<=(z>0?-15.35:-16.05))return .316;
  if(x>=canal.east&&x<=(z<eastBankJoin?-14.5:-10.8)&&z>=canal.north&&z<=canal.south)return .29;
  if(x>=district.west&&x<=canal.west&&z>=-24)return .29;
}

export function clearOfCanalWater(x: number, z: number, radius: number) {
  if (x >= canal.east + radius || x <= canal.west - radius ||
      z >= canal.south + radius || z <= canal.north - radius) return true;
  return onBridge(z,radius);
}
