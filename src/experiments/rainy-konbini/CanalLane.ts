import * as THREE from 'three';
import {bridgeHalfWidth, canal, canalShops, eastBankJoin} from './CanalTerrain';
import type {SceneKit} from './SceneKit';
import {seat} from './Seats';

export function* buildCanalLane(kit: SceneKit) {
  const {part, box, cyl, line, sign, mat, roofs} = kit;
  const bank = part(0);
  const length = canal.south - canal.north;
  const mid = (canal.north + canal.south) / 2;
  for(const [from,to,east] of [[canal.north,eastBankJoin,-14.5],[eastBankJoin,canal.south,-10.8]]){
    box(bank,[(east+canal.east)/2,.176,(from+to)/2],[east-canal.east,.228,to-from],'#758688');
  }
  const guardSpans = [[canal.north + .12, canal.footbridgeZ - .8], [canal.footbridgeZ + .8, canal.bridgeZ - .8], [canal.bridgeZ + .8, canal.south - .12]];
  for (const [from, to] of guardSpans) {
    box(bank, [canal.east + .12, .305, (from + to) / 2], [.24, .045, to - from], '#a5b4aa');
  }
  for (let z=canal.north+.32;z<canal.south-.15;z+=.58) {
    if(guardSpans.some(([from,to])=>z>=from&&z<=to))box(bank,[canal.east+.13,.329,z],[.18,.008,.016],'#60757a');
    if(z>eastBankJoin)box(bank,[-11.37,.295,z],[.22,.008,.21],'#a7aa91');
  }
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(canal.east - canal.west, length),
    new THREE.MeshStandardMaterial({color: '#264c60', emissive: '#102d3a', roughness: .29, metalness: .22})
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set((canal.east + canal.west) / 2, .088, mid);
  water.userData.walkThrough = true;
  water.receiveShadow = true;
  bank.add(water);
  for (const z of [canal.north - .075, canal.south + .075]) {
    box(bank, [(canal.west + canal.east) / 2, .13, z], [canal.east - canal.west, .14, .15], '#677f82', true);
  }
  const strokes: number[] = [];
  let seed = 21;
  const sample = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 145; i++) {
    const x = canal.west + .12 + sample() * 1.49;
    const z = canal.north + .2 + sample() * (length - .4);
    strokes.push(x, .093, z, x + .09 + sample() * .31, .093, z + .025);
  }
  const lines = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(strokes, 3));
  bank.add(new THREE.LineSegments(lines, new THREE.LineBasicMaterial({color: '#87bcc1', transparent: true, opacity: .28, depthWrite: false})));
  yield;

  const bridge = part(0);
  box(bridge, [-17, .261, canal.bridgeZ], [3.3, .11, 1.44], '#987f65', true);
  for (let i = 0; i < 18; i++) box(bridge, [-18.54 + i * .18, .321, canal.bridgeZ], [.018, .008, 1.4], '#675f54');
  for (const side of [-1, 1]) {
    const z = canal.bridgeZ + side * .72;
    box(bridge, [-17, .89, z], [3.3, .075, .09], '#926a62', true);
    box(bridge, [-17, .53, z], [3.3, .045, .06], '#aa8274');
    for (const x of [-18.59, -17.8, -17, -16.2, -15.42]) box(bridge, [x, .63, z], [.085, .68, .09], '#7d6661');
  }
  sign(bridge, [-15.4, .71, 2.422], .7, .24, '柳橋', '#ddceb0', '#655e53');
  for (const [from, to] of guardSpans) {
    box(bridge, [canal.east + .13, .87, (from + to) / 2], [.06, .055, to - from], '#6a8886');
    for (let z = from; z <= to; z += .85) box(bridge, [canal.east + .13, .59, z], [.045, .62, .045], '#657f7e');
  }
  for (const z of [-13.8, -7.8, -.7, 3.75]) {
    cyl(bridge, [-16.08, .99, z], .047, 1.4, '#667f78');
    box(bridge, [-16.08, 1.76, z], [.19, .21, .19], '#edcf9c', true, 1.05);
    box(bridge, [-16.08, 1.89, z], [.25, .055, .25], '#566f70');
    const light = new THREE.PointLight('#ffd39d', 2.1, 2.7);
    light.position.set(-16.06, 1.68, z);
    bridge.add(light);
    for (let i = 0; i < 6; i++) {
      const glint = new THREE.Mesh(new THREE.PlaneGeometry(.17 + i % 3 * .06, .019), new THREE.MeshBasicMaterial({color: '#d8b685', transparent: true, opacity: .23 - .025 * i, depthWrite: false}));
      glint.rotation.x = -Math.PI / 2;
      glint.position.set(-16.74 - (i % 3) * .19, .096, z - .51 + i * .17);
      bridge.add(glint);
    }
  }
  yield;

  const footbridge=part(0);
  const span=2.62, center=-17.36, crossing=canal.footbridgeZ;
  box(footbridge,[center,.261,crossing],[span,.11,bridgeHalfWidth*2],'#9fa8a0',true);
  for(let i=0;i<8;i++)box(footbridge,[center-span/2+.17+i*.325,.321,crossing],[.018,.007,1.37],'#748886');
  for(const side of [-1,1]){
    const z=crossing+side*bridgeHalfWidth;
    box(footbridge,[center,.93,z],[span,.081,.106],'#829a96',true);
    box(footbridge,[center,.61,z],[span-.18,.052,.083],'#a2b4a9');
    for(const dx of [-1.24,-.44,.44,1.24])box(footbridge,[center+dx,.62,z],[.094,.62,.13],'#708b89');
  }
  sign(footbridge,[center,.75,crossing+.79],.62,.21,'水見橋','#bbc4ac','#52716d');
  yield;

  // Local coordinates face the lane. The same shell leaves both doorways free.
  const shell = (z: number, title: string, subtitle: string, accent: string) => {
    const building = part(0);
    const shop = new THREE.Group();
    shop.position.set(-13.8, .39, z);
    shop.rotation.y = Math.PI / 2;
    building.add(shop);
    box(shop, [0, -.054, 0], [4.36, .108, 3.68], '#bca98e');
    // The shallow indoor walls use the local lighting without shadow-map stripes.
    box(shop, [0, 1.39, -1.78], [4.36, 2.78, .13], '#ad9e87', true).receiveShadow = false;
    for (const x of [-2.115, 2.115]) {
      box(shop, [x, 1.39, 0], [.13, 2.78, 3.46], '#a89f8b', true).receiveShadow = false;
      box(shop, [x * 1.035, .36, 0], [.055, .72, 3.46], accent);
    }
    box(shop, [0, .36, -1.867], [4.34, .72, .043], accent);
    for (const x of [-1.25, 1.25]) {
      box(shop, [x, 1.68, -1.867], [1.12, .84, .065], '#5c6c62', true);
      box(shop, [x, 1.68, -1.918], [.98, .69, .028], '#c8ad80', false, .31);
      for (const dx of [-.24, 0, .24]) box(shop, [x + dx, 1.68, -1.943], [.027, .69, .023], '#796e5b');
      box(shop, [x, 1.68, -1.943], [.98, .025, .023], '#796e5b');
      box(shop, [x, 1.235, -1.93], [1.15, .059, .16], '#7e8f80', true);
    }
    for (const x of [-1.46, 1.46]) {
      box(shop, [x, .33, 1.77], [1.31, .66, .14], accent, true);
      const window = new THREE.Mesh(new THREE.PlaneGeometry(1.27, 1.46), kit.glass);
      window.position.set(x, 1.39, 1.78);
      shop.add(window);
      for (const dx of [-.66, 0, .66]) box(shop, [x + dx, 1.39, 1.8], [.055, 1.51, .085], '#65594f');
      for (const y of [.67, 2.13]) box(shop, [x, y, 1.8], [1.32, .055, .085], '#65594f');
    }
    box(shop, [0, 2.47, 1.79], [4.36, .6, .19], accent, true);
    sign(shop, [0, 2.48, 1.905], 3.3, .43, title, accent, '#f2dfb4', subtitle, 0, .5);
    const roof = box(shop, [0, 2.89, .025], [4.62, .2, 4.04], '#506b71', true);
    for (let i = 0; i < 12; i++) box(shop, [-2.13 + i * .387, 3.012, .02], [.025, .04, 3.98], '#82988f');
    roof.receiveShadow = true;
    box(shop, [0, 2.23, 1.87], [3.9, .045, .12], '#f2d19a', false, 1.7);
    box(shop, [0, 2.72, -.38], [2.65, .032, .12], '#f3dfad', false, 1.5);
    const warm = new THREE.PointLight('#ffdbac', 10, 5.8);
    warm.position.set(.15, 2.3, .15);
    shop.add(warm);
    roofs.push({x: -13.8, z, w: 4.04, d: 4.62, h: 3.44});
    for (const x of [-1.83, 1.83]) {
      line(shop, [x, 2.24, 1.98], [x, 2, 1.98], .017, '#59625d');
      cyl(shop, [x, 1.88, 1.98], .115, .25, '#b68a64');
      box(shop, [x, 1.89, 2.09], [.13, .16, .022], '#e5bf84', false, .85);
    }
    return shop;
  };
  const ramen = shell(canalShops.ramen, '柳橋らーめん', 'YANAGIBASHI  •  中華そば', '#875f55');
  box(ramen, [-.21, .61, -.69], [3.22, 1.22, .64], '#8d6c58', true);
  box(ramen, [-.21, 1.255, -.69], [3.37, .08, .79], '#c5a782');
  for (const x of [-1.32, -.48, .36, 1.2]) {
    cyl(ramen, [x, .5, .19], .19, .075, '#9f6960');
    cyl(ramen, [x, .24, .19], .041, .45, '#6c7b76');
    seat(ramen,[x,.539,.19],[x,0,.67]);
    cyl(ramen, [x, 1.35, -.46], .105, .09, '#eddfbf', .07);
    cyl(ramen, [x, 1.397, -.46], .082, .012, '#ad7b4a');
    box(ramen, [x + .045, 1.412, -.485], [.038, .016, .027], '#6c8569');
    cyl(ramen, [x - .032, 1.411, -.464], .026, .013, '#e9c27e');
    for (const dx of [-.021, .022]) line(ramen, [x + dx, 1.411, -.39], [x + dx + .07, 1.411, -.59], .007, '#d3af7d');
    cyl(ramen,[x+.17,1.349,-.62],.046,.108,'#cbd1b5');
    cyl(ramen,[x+.17,1.405,-.62],.038,.009,'#a08d6c');
  }
  box(ramen, [-.5, .63, -1.42], [2.57, 1.24, .45], '#85938a', true);
  box(ramen, [-.92, 1.31, -1.42], [1.19, .12, .42], '#adbaae');
  cyl(ramen, [-.85, 1.53, -1.42], .18, .32, '#7c9394');
  cyl(ramen, [-.85, 1.71, -1.42], .19, .035, '#b5bdb0');
  sign(ramen, [.45, 2.15, -1.704], 2.47, .56, '醤油  •  味噌  •  塩', '#5d5447', '#f0d8aa', 'RAMEN   ¥780     GYOZA   ¥350', 0, .25);
  for (const x of [-.5, 0, .5]) {
    const curtain = box(ramen, [x, 2.14, 1.92], [.46, .35, .022], '#bb896b');
    curtain.userData.walkThrough = true;
  }
  yield;

  const books = shell(canalShops.books, '水辺の古書店', 'MIZUBE  •  SECONDHAND BOOKS', '#536e67');
  const colors = ['#a47165', '#ceb28a', '#718d90', '#a6b297', '#ab8999', '#c9c2a4'];
  box(books, [0, 1.11, -1.58], [3.65, 2.16, .24], '#786657', true);
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = .31 + shelf * .46;
    box(books, [0, y, -1.43], [3.65, .045, .48], '#ad9274');
    for (let i = 0; i < 25; i++) {
      if (i % 7 === 6) continue;
      const height = .21 + ((i * 3 + shelf) % 5) * .031;
      const x = -1.7 + i * .139;
      box(books, [x, y + .026 + height / 2, -1.34], [.104, height, .24], colors[(i + shelf) % colors.length]);
      if (i % 3 !== 1) box(books, [x, y + .1, -1.215], [.068, .027, .008], '#e0cba4');
      if(i%4===0)box(books,[x,y+.174,-1.215],[.065,.017,.009],'#9eaaa0').castShadow=false;
    }
  }
  box(books, [1.49, .56, -.35], [.85, 1.12, 1.05], '#8a725b', true);
  box(books, [1.49, 1.153, -.35], [.93, .065, 1.12], '#cab28c');
  for (let i = 0; i < 4; i++) box(books, [1.41 + i * .024, 1.2 + i * .035, -.42], [.36, .034, .27], colors[i]);
  cyl(books, [1.7, 1.41, -.69], .023, .44, '#718682');
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.16, .18, 12), mat('#e9cfa2', .65));
  shade.position.set(1.7, 1.66, -.69);
  books.add(shade);
  box(books, [-1.39, .71, .78], [.83, .085, 1.02], '#ba9b75', true);
  for (const x of [-1.7, -1.08]) box(books, [x, .35, .78], [.07, .69, .84], '#7b6b58');
  for (let i = 0; i < 5; i++) box(books, [-1.47, .768 + i * .035, .82], [.39, .034, .27], colors[5 - i]);
  sign(books, [-1.18, 2.4, -1.704], 1.38, .25, '文庫  ・  旅  ・  写真', '#756957', '#e4d3a7');
  yield;

  const alley = part(0);
  for (const [x, z] of [[-15.72, 3.68], [-14.15, -8.1], [-12.7, -14.2], [-12.8, -.68]]) {
    box(alley, [x, .43, z], [.66, .28, .57], '#9c8873', true);
    const shrub = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat('#819b7e'));
    shrub.scale.set(.28, .29, .24);
    shrub.position.set(x, .69, z);
    shrub.castShadow = true;
    alley.add(shrub);
  }
  box(alley, [-13.72, .69, 2.92], [1.7, .09, .41], '#9b856d', true);
  for(const x of [-14.12,-13.32])seat(alley,[x,.735,2.92],[x,.29,2.44]);
  box(alley, [-13.72, .98, 3.14], [1.7, .34, .065], '#9b856d');
  for (const x of [-14.37, -13.07]) box(alley, [x, .49, 2.92], [.075, .4, .36], '#617976');
  for (let i = 0; i < 6; i++) box(alley, [-15 + i * .57, .296, canal.bridgeZ], [.39, .012, .53], '#b3b9a4');
  box(alley, [-11.25, 1.05, 3.88], [.09, 1.52, .09], '#687f7c');
  box(alley, [-11.25, 1.75, 3.88], [1.18, .49, .11], '#67827b', true);
  sign(alley, [-11.25, 1.75, 3.948], 1.08, .38, '柳橋横丁', '#67827b', '#f2dfb4', 'CANAL LANE');
}
