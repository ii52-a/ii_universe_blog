import * as THREE from 'three';
import type {SceneKit} from './SceneKit';
import {canal} from './CanalTerrain';
import {district} from './DistrictBounds';
import {hillParking,summit} from './SummitTerrain';
import {seat} from './Seats';
import {groundHeight} from './Terrain';

// All fills sit inside the existing plinth and outside the developed blocks.
export function* buildStreetEdges({part, box, cyl, mat}: SceneKit) {
  const east = part(0);
  const asphalt = new THREE.MeshStandardMaterial({color: '#354653', roughness: .55, metalness: .12});
  const paving = new THREE.MeshStandardMaterial({color: '#52686e', roughness: .72});
  const tile = (group: THREE.Group, x: number, z: number, width: number, depth: number, material: THREE.Material) => {
    const surface = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
    surface.rotation.x = -Math.PI / 2;
    surface.position.set(x, .081, z);
    surface.receiveShadow = true;
    group.add(surface);
  };
  const tree = (group: THREE.Group, x: number, z: number, h: number) => {
    box(group, [x, .225, z], [.98, .28, .9], '#526963', true);
    box(group, [x, .375, z], [.85, .028, .76], '#637c6f');
    cyl(group, [x, .49 + h * .27, z], .065, h * .65, '#686b60');
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat('#577d73'));
    crown.scale.set(h * .35, h * .43, h * .33);
    crown.position.set(x, .48 + h * .68, z);
    crown.castShadow = true;
    group.add(crown);
  };
  // Eastern service street, with a separate walking strip and planting bays.
  tile(east, 16.48, 1.5, 2.96, 25, asphalt);
  tile(east, 19.27, 1.5, 2.57, 25, paving);
  for (let z = -10.2; z < 13.7; z += 1.18) {
    box(east, [18.03, .107, z], [.13, .05, 1.12], '#869891');
    box(east, [16.52, .088, z], [.054, .009, .52], '#929689');
  }
  for (const z of [-8.4, -3.6, 2.1, 7.3, 12.3]) tree(east, 19.95, z, 1.5);
  for (const z of [-5.9, 4.7, 10.3]) {
    cyl(east, [18.55, .43, z], .046, .7, '#5f777a');
    box(east, [18.55, .79, z], [.135, .13, .135], '#c8ba96', false, .8);
  }
  yield;

  const south = part(0);
  tile(south, .21, 12.91, 29.37, 2.29, asphalt);
  tile(south, 1, 14.84, 39.1, 1.53, paving);
  for(let x=-11.5;x<14.5;x+=1.25){
    if(Math.abs(x-1.85)>.92)box(south,[x,.088,12.94],[.53,.009,.048],'#8a9289');
  }
  for(let i=0;i<5;i++)box(south,[1.06+i*.4,.091,12.91],[.19,.009,1.8],'#a4afa8');
  for (let x = -18.15; x < 20.15; x += .68) {
    box(south, [x, .107, 15.53], [.64, .048, .14], '#758986');
    box(south, [x, .09, 14.27], [.45, .008, .038], '#83968c');
  }
  tile(south, -16.55, 9.57, 4.05, 8.9, paving);
  for (const z of [6.7, 9.6, 12.25]) tree(south, -17.9, z, 1.34);
  box(south, [-16.05, .48, 10.9], [1.25, .085, .36], '#8d7864', true);
  for (const x of [-16.5, -15.6]) box(south, [x, .26, 10.9], [.066, .36, .3], '#687f78');
  for(const x of [-16.35,-15.75])seat(south,[x,.523,10.9],[x,.081,10.47]);
  yield;

  const north = part(0);
  // Stepped rear lane follows the housing blocks without touching the hillside.
  const northEast=4.725, northWidth=northEast-canal.east, northCenter=(northEast+canal.east)/2;
  tile(north, northCenter, -18.44, northWidth, 4.85, asphalt);
  tile(north, northCenter, -22.16, northWidth, 2.52, paving);
  for (let x = -14.2; x < 4.55; x += 1.1) {
    if(x+.52<hillParking.west){
      box(north, [x, .11, -20.84], [1.04, .052, .15], '#83958d');
      box(north, [x, .088, -18.52], [.51, .009, .055], '#929689');
    }
  }
  for (const x of [-12.2, -7.5, -2.75, 2.1]) tree(north, x, -22.7, 1.48);
  for (const x of [-14.7, -4.8, .6]) {
    box(north, [x, .48, -21.9], [1.17, .085, .35], '#8d7864', true);
    for (const dx of [-.41, .41]) box(north, [x + dx, .26, -21.9], [.065, .36, .29], '#687f78');
    for(const dx of [-.25,.25]){
      // Keep the whole body on the bank, away from the 21 cm pavement edge.
      const exitX=x<-14.5?Math.min(x+dx,-14.7):x+dx;
      seat(north,[x+dx,.523,-21.9],[exitX,groundHeight(exitX,-21.44),-21.44]);
    }
  }
  yield;

  {
    const west=summit.east,east=district.east;
    const rear=part(0),center=(west+east)/2;
    tile(rear,center,-25.26,east-west,2.52,asphalt);
    tile(rear,center,-28.24,east-west,3.44,paving);
    for(let x=west+.62;x<east-.5;x+=1.2)box(rear,[x,.105,-26.57],[1.1,.044,.13],'#82948c');
    for(let x=west+1.6;x<east-1;x+=3.55){
      tree(rear,x,-28.36,1.7+(Math.abs(x)%2)*.35);
      box(rear,[x+.73,.088,-27.46],[.48,.011,.42],'#899a8c');
    }
    yield;
  }
}
