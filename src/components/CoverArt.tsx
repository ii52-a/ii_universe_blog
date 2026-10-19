import { useId } from 'react'
import type { CoverVariant } from '../data/posts'

interface CoverArtProps {
  variant: CoverVariant
  className?: string
  decorative?: boolean
  label?: string
}

const labels: Record<CoverVariant, string> = {
  store: '夜晚亮着灯的便利店插画',
  chair: '一把换过腿的旧木椅插画',
  walk: '雨中山脚小路插画',
  receipt: '一张超市小票插画',
  desk: '清空后的书桌插画',
  book: '一本旧书和铅笔插画',
  ice: '一支绿豆棒冰插画',
  bus: '公交车窗外的城市插画',
  map: '从馒头山到凤山门的散步路线图',
}

export function CoverArt({ variant, className = '', decorative = false, label }: CoverArtProps) {
  const rawId = useId()
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
  const grain = `grain-${uid}`
  const clip = `clip-${uid}`

  return (
    <svg
      className={`cover-art ${className}`}
      viewBox="0 0 640 480"
      preserveAspectRatio="xMidYMid slice"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label ?? labels[variant]}
    >
      <defs>
        <filter id={grain}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
        </filter>
        <clipPath id={clip}>
          <rect width="640" height="480" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clip})`}>
        {variant === 'store' && <StoreScene />}
        {variant === 'chair' && <ChairScene />}
        {variant === 'walk' && <WalkScene />}
        {variant === 'receipt' && <ReceiptScene />}
        {variant === 'desk' && <DeskScene />}
        {variant === 'book' && <BookScene />}
        {variant === 'ice' && <IceScene />}
        {variant === 'bus' && <BusScene />}
        {variant === 'map' && <MapScene />}
        <rect width="640" height="480" filter={`url(#${grain})`} opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
      </g>
    </svg>
  )
}

function StoreScene() {
  return (
    <>
      <rect width="640" height="480" fill="#1B2340" />
      <circle cx="532" cy="72" r="46" fill="#F1E6C6" opacity="0.92" />
      <circle cx="120" cy="90" r="2.5" fill="#F1E6C6" opacity="0.7" />
      <circle cx="178" cy="62" r="1.8" fill="#F1E6C6" opacity="0.55" />
      <circle cx="72" cy="148" r="1.5" fill="#F1E6C6" opacity="0.5" />
      <rect x="80" y="160" width="480" height="264" rx="4" fill="#F4EFE2" />
      <rect x="80" y="160" width="480" height="32" fill="#E6DECB" />
      <rect x="104" y="214" width="432" height="36" fill="#F4EFE2" />
      {Array.from({ length: 10 }).map((_, index) => (
        <g key={index}>
          <rect x={104 + index * 43.2} y="210" width="43.2" height="34" fill={index % 2 === 0 ? '#2F55F4' : '#F8F3E7'} />
          <circle cx={125.6 + index * 43.2} cy="244" r="21.6" fill={index % 2 === 0 ? '#2F55F4' : '#F8F3E7'} />
        </g>
      ))}
      <rect x="104" y="266" width="432" height="134" fill="#FFE6A7" />
      <rect x="104" y="266" width="432" height="14" fill="#EACF8C" />
      <rect x="136" y="300" width="142" height="100" fill="#FFF4C9" stroke="#1B2340" strokeWidth="2" />
      <rect x="362" y="292" width="142" height="108" fill="#FFF4C9" stroke="#1B2340" strokeWidth="2" />
      <line x1="207" y1="300" x2="207" y2="400" stroke="#1B2340" strokeWidth="2" />
      <line x1="136" y1="350" x2="278" y2="350" stroke="#1B2340" strokeWidth="2" />
      <line x1="433" y1="292" x2="433" y2="400" stroke="#1B2340" strokeWidth="2" />
      {[318, 334, 350].map((y) => (
        <rect key={y} x="146" y={y} width="112" height="4" rx="2" fill="#D7B96B" />
      ))}
      <rect x="386" y="312" width="54" height="9" rx="4" fill="#D7B96B" />
      <rect x="386" y="332" width="88" height="6" rx="3" fill="#D7B96B" />
      <rect x="386" y="348" width="66" height="6" rx="3" fill="#D7B96B" />
      <circle cx="316" cy="336" r="25" fill="#2F55F4" />
      <text x="316" y="344" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fill="#FFF8E7">
        24
      </text>
      <rect x="80" y="400" width="480" height="24" fill="#141B31" />
      <rect x="148" y="424" width="344" height="56" fill="#12182B" />
      <rect x="156" y="424" width="26" height="56" fill="#FFE6A7" opacity="0.35" />
      <rect x="238" y="424" width="12" height="56" fill="#FFE6A7" opacity="0.2" />
      <rect x="374" y="424" width="20" height="56" fill="#FFE6A7" opacity="0.3" />
      <rect x="470" y="424" width="10" height="56" fill="#FFE6A7" opacity="0.2" />
      <path d="M92 397c10-18 24-18 34 0" fill="none" stroke="#1B2340" strokeWidth="5" />
      <path d="M102 397c7-11 16-11 23 0" fill="none" stroke="#F4EFE2" strokeWidth="3" />
    </>
  )
}

function ChairScene() {
  return (
    <>
      <rect width="640" height="480" fill="#F2C14E" />
      <circle cx="454" cy="214" r="164" fill="#F8E2A0" />
      <path d="M0 400h640" stroke="#D7A138" strokeWidth="3" />
      <ellipse cx="330" cy="408" rx="180" ry="22" fill="#D7A138" opacity="0.48" />
      <g stroke="#241B12" strokeWidth="4" strokeLinejoin="round">
        <rect x="226" y="104" width="176" height="162" rx="18" fill="#B87A45" />
        <rect x="250" y="128" width="128" height="114" rx="8" fill="#D6A36C" />
        <rect x="216" y="262" width="206" height="46" rx="12" fill="#C98B50" />
        <path d="M238 306v94" />
        <path d="M400 306v94" />
        <path d="M298 306v88" stroke="#2449E8" />
        <path d="M311 306v88" stroke="#2449E8" />
        <path d="M236 348l162 22" />
        <path d="M256 162v70M290 162v70M324 162v70M358 162v70" stroke="#7C4E27" strokeWidth="3" />
      </g>
      <path d="M285 102c-10-34 24-52 42-32" fill="none" stroke="#F6E6C1" strokeWidth="8" strokeLinecap="round" />
      <path d="M374 94c24-20 50-6 48 18" fill="none" stroke="#F6E6C1" strokeWidth="6" strokeLinecap="round" />
      <path d="M132 358c18-16 38-15 50 2 10 14 4 30-12 32-20 2-32-16-38-34Z" fill="#F8E2A0" stroke="#241B12" strokeWidth="4" />
      <path d="M140 366c8-6 18-4 22 5" fill="none" stroke="#C98B50" strokeWidth="3" strokeLinecap="round" />
      <circle cx="95" cy="126" r="9" fill="#2449E8" />
      <path d="M96 126v-22M96 126l17 10" stroke="#241B12" strokeWidth="4" strokeLinecap="round" />
    </>
  )
}

function WalkScene() {
  return (
    <>
      <rect width="640" height="480" fill="#E3EBDE" />
      <circle cx="515" cy="81" r="40" fill="#F8F3E4" opacity="0.8" />
      <path d="M0 254c92-82 176-86 266-38 97 52 191 36 374-24v288H0Z" fill="#C7D7C4" />
      <path d="M0 294c82-46 170-36 245 8 105 62 225 26 395-36v214H0Z" fill="#AFC5B0" />
      <path d="M0 346c105-32 181-14 253 30 86 52 194 18 387-38v142H0Z" fill="#9DB59D" />
      <path d="M244 480c22-52 46-78 88-106 39-26 31-47 4-70-21-18-35-12-53 2" fill="none" stroke="#EADDC5" strokeWidth="86" strokeLinecap="round" />
      <path d="M244 480c22-52 46-78 88-106 39-26 31-47 4-70-21-18-35-12-53 2" fill="none" stroke="#C8B792" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 12" />
      <g stroke="#718B76" strokeWidth="2" opacity="0.55">
        <path d="M70 78l-12 32M128 54l-10 26M192 86l-11 28M560 134l-10 28M588 72l-12 32M48 184l-9 22M438 72l-10 24" />
      </g>
      <g fill="#6E8B73">
        <circle cx="92" cy="318" r="20" />
        <circle cx="112" cy="308" r="15" />
        <circle cx="74" cy="308" r="13" />
        <circle cx="544" cy="292" r="18" />
        <circle cx="568" cy="300" r="13" />
      </g>
      <g transform="translate(362 326)">
        <path d="M0 0v46" stroke="#304938" strokeWidth="4" strokeLinecap="round" />
        <path d="M-34-3c8-26 62-26 68 0Z" fill="#E85842" stroke="#241B12" strokeWidth="3" />
        <path d="M0-3v-16" stroke="#241B12" strokeWidth="3" />
        <circle cx="2" cy="62" r="6" fill="#304938" />
      </g>
      <g fill="#F5E9D0">
        <circle cx="470" cy="396" r="4" />
        <circle cx="488" cy="374" r="2.5" />
        <circle cx="130" cy="428" r="3" />
        <circle cx="158" cy="408" r="2" />
      </g>
      <path d="M0 454c120-18 208 10 310 2 112-8 206-26 330-8v32H0Z" fill="#8EA58E" />
    </>
  )
}

function ReceiptScene() {
  return (
    <>
      <rect width="640" height="480" fill="#F9DCD3" />
      <path d="M0 432h640" stroke="#D7AA9A" strokeWidth="3" />
      <ellipse cx="342" cy="438" rx="246" ry="24" fill="#D7AA9A" opacity="0.4" />
      <g transform="rotate(-6 320 240)">
        <rect x="208" y="42" width="238" height="388" fill="#B59886" opacity="0.18" />
        <path d="M194 38h244v352l-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10V38Z" fill="#FFFDF6" />
        <text x="218" y="78" fontFamily="Georgia, serif" fontSize="15" letterSpacing="4" fill="#6C625A">
          半日超市
        </text>
        <text x="218" y="100" fontFamily="monospace" fontSize="10" fill="#A09890">
          2026-10-12 01:47
        </text>
        <path d="M218 114h194" stroke="#D9D2C8" strokeWidth="2" strokeDasharray="4 5" />
        {Array.from({ length: 8 }).map((_, index) => (
          <g key={index}>
            <rect x="218" y={132 + index * 24} width={112 + ((index * 37) % 52)} height="7" rx="3.5" fill="#DED8CF" />
            <rect x={368 + (index % 2) * 8} y={132 + index * 24} width="34" height="7" rx="3.5" fill="#DED8CF" />
          </g>
        ))}
        <path d="M218 334h194" stroke="#D9D2C8" strokeWidth="2" strokeDasharray="4 5" />
        <rect x="218" y="346" width="88" height="7" rx="3.5" fill="#B8B0A6" />
        <rect x="360" y="346" width="44" height="7" rx="3.5" fill="#B8B0A6" />
        <g fill="#3A332E">
          {Array.from({ length: 27 }).map((_, index) => (
            <rect
              key={index}
              x={222 + index * 6.4}
              y="362"
              width={index % 5 === 0 ? 3.8 : 2}
              height={index % 4 === 0 ? 26 : 22}
            />
          ))}
        </g>
      </g>
      <g>
        <circle cx="500" cy="118" r="58" fill="#F06A51" />
        <path d="M500 82v72M464 118h72M474 92l52 52M526 92l-52 52" stroke="#FFF6EA" strokeWidth="9" strokeLinecap="round" />
      </g>
      <g transform="translate(96 356)">
        <circle cx="0" cy="0" r="30" fill="#9FBE8B" stroke="#241B12" strokeWidth="3" />
        <path d="M2-30c-2-16 10-24 24-20-1 14-10 22-24 20Z" fill="#6C915D" stroke="#241B12" strokeWidth="3" />
      </g>
    </>
  )
}

function DeskScene() {
  return (
    <>
      <rect width="640" height="480" fill="#E9E8E3" />
      <path d="M0 354h640v126H0Z" fill="#D9B283" />
      <path d="M0 354h640" stroke="#B78A5D" strokeWidth="3" />
      <rect x="0" y="366" width="640" height="6" fill="#C89C6D" opacity="0.55" />
      <ellipse cx="360" cy="356" rx="196" ry="16" fill="#B88655" opacity="0.38" />
      <g transform="translate(397 278)">
        <rect x="0" y="0" width="150" height="78" rx="4" fill="#33363A" />
        <rect x="7" y="7" width="136" height="64" rx="2" fill="#4B5057" />
        <rect x="-58" y="76" width="266" height="9" rx="4.5" fill="#23262A" />
        <path d="M22 76h108l-18 8H40Z" fill="#23262A" />
      </g>
      <g transform="translate(94 250)">
        <path d="M16 0h86l-14 54H30Z" fill="#2E52E9" stroke="#191A1C" strokeWidth="3" />
        <path d="M58 54v68M58 122h-28" fill="none" stroke="#191A1C" strokeWidth="5" strokeLinecap="round" />
        <rect x="18" y="122" width="82" height="10" rx="5" fill="#191A1C" />
        <path d="M22 58c26 20 62 20 92 0" fill="#F8E7A7" opacity="0.32" />
      </g>
      <g transform="translate(256 306)">
        <path d="M0 0h92v44H0Z" fill="#F8F3E6" stroke="#191A1C" strokeWidth="2" />
        <path d="M12 13h34M12 24h54M12 35h23" stroke="#C2B9A9" strokeWidth="3" strokeLinecap="round" />
        <path d="M76 9l8 15" stroke="#F06A51" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g transform="translate(522 282)">
        <path d="M0 0h48l-6 52H6Z" fill="#F06A51" stroke="#191A1C" strokeWidth="3" />
        <path d="M24-2c-2-28 22-38 34-18-2 16-16 24-34 18Z" fill="#7FA77B" stroke="#191A1C" strokeWidth="3" />
        <path d="M24 0v-24" stroke="#191A1C" strokeWidth="3" />
      </g>
      <g stroke="#7B7F84" strokeWidth="2.5" fill="none">
        <path d="M230 340c6-12 18-12 24 0" />
        <path d="M268 344c8-16 22-16 30 0" />
      </g>
      <g transform="translate(505 355) rotate(24)">
        <ellipse cx="0" cy="0" rx="17" ry="7" fill="none" stroke="#B9BDC1" strokeWidth="4" />
        <ellipse cx="0" cy="0" rx="10" ry="3" fill="none" stroke="#B9BDC1" strokeWidth="3" />
      </g>
    </>
  )
}

function BookScene() {
  return (
    <>
      <rect width="640" height="480" fill="#ED6A54" />
      <circle cx="98" cy="92" r="58" fill="#F7A48F" opacity="0.55" />
      <ellipse cx="330" cy="412" rx="214" ry="22" fill="#B74A38" opacity="0.38" />
      <g transform="rotate(-7 320 240)">
        <rect x="174" y="76" width="306" height="338" rx="5" fill="#D8C8AA" />
        <rect x="148" y="58" width="306" height="340" rx="5" fill="#F5EAD3" stroke="#2B211C" strokeWidth="3" />
        <rect x="148" y="58" width="38" height="340" fill="#E4D3B3" />
        <path d="M186 58v340" stroke="#C4AE84" strokeWidth="2" />
        <text x="246" y="192" fontFamily="Georgia, serif" fontSize="94" fill="#2B211C">
          慢
        </text>
        <path d="M248 222h134" stroke="#2B211C" strokeWidth="3" />
        <text x="248" y="258" fontFamily="Georgia, serif" fontSize="22" fill="#7C4A3A">
          一些没走完的路
        </text>
        <text x="248" y="288" fontFamily="Georgia, serif" fontSize="12" letterSpacing="2" fill="#9B8672">
          HALFDAY NOTES
        </text>
        <circle cx="248" cy="342" r="12" fill="none" stroke="#2B211C" strokeWidth="2" />
        <text x="248" y="347" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" fill="#2B211C">
          01
        </text>
      </g>
      <g transform="rotate(34 500 340)">
        <rect x="474" y="174" width="18" height="248" rx="5" fill="#F2C14E" stroke="#2B211C" strokeWidth="3" />
        <path d="M474 174h18l-9-32Z" fill="#F5EAD3" stroke="#2B211C" strokeWidth="3" />
        <path d="M474 410h18l-9 26Z" fill="#2B211C" />
      </g>
      <path d="M86 386c34-14 52-4 68 20" fill="none" stroke="#F5EAD3" strokeWidth="4" strokeLinecap="round" />
      <g fill="#F5EAD3">
        <circle cx="76" cy="250" r="3" />
        <circle cx="106" cy="278" r="2" />
        <circle cx="570" cy="112" r="4" />
      </g>
    </>
  )
}

function IceScene() {
  return (
    <>
      <rect width="640" height="480" fill="#CDE9DA" />
      <g fill="#A9D3BD" opacity="0.7">
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 10 }).map((__, col) => (
            <circle key={`${row}-${col}`} cx={34 + col * 64} cy={30 + row * 62} r="2" />
          )),
        )}
      </g>
      <ellipse cx="328" cy="424" rx="132" ry="22" fill="#86B59D" opacity="0.5" />
      <g transform="rotate(5 320 250)">
        <rect x="292" y="318" width="56" height="108" rx="10" fill="#D8B37B" stroke="#23352B" strokeWidth="3" />
        <path d="M248 128c0-42 28-58 72-58s72 16 72 58v162c0 30-22 46-72 46s-72-16-72-46Z" fill="#7DB07C" stroke="#23352B" strokeWidth="4" />
        <path d="M278 96c14-12 36-16 50-16" fill="none" stroke="#A9CFA1" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
        <g fill="#4E7A52">
          <circle cx="286" cy="182" r="8" />
          <circle cx="330" cy="154" r="6" />
          <circle cx="354" cy="210" r="9" />
          <circle cx="300" cy="250" r="6" />
          <circle cx="336" cy="278" r="7" />
        </g>
        <path d="M342 130c16-14 34-14 46 0" fill="none" stroke="#23352B" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g stroke="#E36E53" strokeWidth="3" strokeLinecap="round" opacity="0.7">
        <path d="M466 112c10 10 10 20 0 30M486 102c16 16 16 32 0 48M506 116c9 9 9 18 0 27" />
      </g>
      <g transform="translate(118 330) rotate(-8)">
        <path d="M0 0h62v38H0Z" fill="#FFF9EC" stroke="#23352B" strokeWidth="3" />
        <text x="10" y="25" fontFamily="Georgia, serif" fontSize="17" fill="#23352B">
          2 元
        </text>
        <path d="M44 7l9 9-9 9" fill="none" stroke="#E36E53" strokeWidth="2" />
      </g>
      <path d="M110 144c30 8 44 26 44 52" fill="none" stroke="#FDF8EA" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

function BusScene() {  return (
    <>
      <rect width="640" height="480" fill="#2448D8" />
      <rect x="74" y="82" width="492" height="316" rx="36" fill="#F7F2E5" />
      <rect x="98" y="106" width="444" height="268" rx="24" fill="#B8D7E6" />
      <rect x="98" y="106" width="444" height="268" rx="24" fill="url(#bus-sky)" />
      <defs>
        <linearGradient id="bus-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8DBB0" stopOpacity="0.7" />
          <stop offset="0.55" stopColor="#B8D7E6" stopOpacity="0.2" />
          <stop offset="1" stopColor="#8FB8C6" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <circle cx="448" cy="166" r="32" fill="#F7D57C" />
      <path d="M98 306c76-62 142-58 208-4 68 56 150 38 236-18v90H98Z" fill="#7BA68E" />
      <path d="M98 334c86-32 158-6 224 26 58 28 138 4 220-28v42H98Z" fill="#5A856F" />
      <g fill="#F5EDDA" opacity="0.9">
        <rect x="136" y="242" width="34" height="72" />
        <rect x="178" y="222" width="26" height="92" />
        <rect x="506" y="252" width="26" height="62" />
      </g>
      <g stroke="#2448D8" strokeWidth="14" opacity="0.85">
        <path d="M98 342h444" />
        <path d="M316 106v268" />
      </g>
      <path d="M126 128l120 78" stroke="#FFFDF4" strokeWidth="6" opacity="0.36" />
      <path d="M154 116l90 58" stroke="#FFFDF4" strokeWidth="3" opacity="0.3" />
      <rect x="74" y="360" width="492" height="38" rx="14" fill="#F7F2E5" />
      <rect x="126" y="398" width="74" height="22" rx="11" fill="#1B2340" />
      <rect x="438" y="398" width="74" height="22" rx="11" fill="#1B2340" />
      <g transform="translate(120 112)">
        <circle cx="0" cy="0" r="31" fill="#E85E45" />
        <text x="0" y="9" textAnchor="middle" fontFamily="Georgia, serif" fontSize="27" fill="#FFF8E7">
          42
        </text>
      </g>
      <path d="M0 438h640" stroke="#1734A5" strokeWidth="4" strokeDasharray="36 26" />
    </>
  )
}

function MapScene() {
  return (
    <>
      <rect width="640" height="480" fill="#F3EEDF" />
      <g opacity="0.55" stroke="#DDD5C2" strokeWidth="1">
        {Array.from({ length: 12 }).map((_, index) => (
          <path key={`v${index}`} d={`M${30 + index * 52} 0v480`} />
        ))}
        {Array.from({ length: 9 }).map((_, index) => (
          <path key={`h${index}`} d={`M0 ${34 + index * 54}h640`} />
        ))}
      </g>

      <path d="M0 318c82-58 146-44 222-8 86 40 165 50 248 12 62-28 118-28 170-14v172H0Z" fill="#DDE8D5" />
      <path d="M0 364c89-25 147-8 218 24 90 40 183 27 250-4 64-30 119-25 172-10v106H0Z" fill="#C8DAC4" />
      <path d="M500 0c-18 78 3 151 61 198 41 33 59 75 53 128" fill="none" stroke="#BEDDE5" strokeWidth="34" />
      <path d="M500 0c-18 78 3 151 61 198 41 33 59 75 53 128" fill="none" stroke="#F3EEDF" strokeWidth="2" strokeDasharray="8 10" opacity="0.8" />

      <g stroke="#D8D0BC" strokeWidth="11" strokeLinecap="round" fill="none">
        <path d="M58 84c86 28 170 30 250 7 84-24 154-11 265 36" />
        <path d="M120 450c22-84 66-136 139-178 71-41 125-91 179-177" />
        <path d="M0 228c78 4 147-7 215-37 81-36 144-38 230-18" />
      </g>
      <path d="M120 450c22-84 66-136 139-178 71-41 125-91 179-177" fill="none" stroke="#F8F3E4" strokeWidth="3" strokeDasharray="7 10" opacity="0.7" />

      <g fill="#E7DEC9" stroke="#C9BFA7" strokeWidth="1">
        <rect x="180" y="118" width="47" height="34" rx="3" />
        <rect x="240" y="100" width="35" height="27" rx="3" />
        <rect x="330" y="160" width="44" height="32" rx="3" />
        <rect x="400" y="105" width="29" height="44" rx="3" />
        <rect x="458" y="238" width="40" height="29" rx="3" />
        <rect x="315" y="338" width="35" height="25" rx="3" />
        <rect x="395" y="300" width="46" height="31" rx="3" />
        <rect x="170" y="292" width="32" height="26" rx="3" />
      </g>

      <g fill="#8CA789">
        <circle cx="201" cy="240" r="11" />
        <circle cx="218" cy="230" r="8" />
        <circle cx="383" cy="225" r="10" />
        <circle cx="368" cy="219" r="7" />
        <circle cx="265" cy="377" r="8" />
        <circle cx="283" cy="384" r="6" />
      </g>

      <g fill="#F8F3E4" stroke="#2A2A25" strokeWidth="2">
        <circle cx="120" cy="395" r="11" />
        <circle cx="548" cy="88" r="11" />
      </g>
      <circle cx="120" cy="395" r="5" fill="#F0664F" />
      <circle cx="548" cy="88" r="5" fill="#2449E8" />

      <path
        d="M120 395c14-41 54-52 76-82 21-29 24-56 56-62 33-6 45-40 72-70 28-31 65-53 100-59 44-8 78-19 124-34"
        fill="none"
        stroke="#FFFDF5"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M120 395c14-41 54-52 76-82 21-29 24-56 56-62 33-6 45-40 72-70 28-31 65-53 100-59 44-8 78-19 124-34"
        fill="none"
        stroke="#2449E8"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="1 13"
      />
      <path
        d="M120 395c14-41 54-52 76-82 21-29 24-56 56-62 33-6 45-40 72-70 28-31 65-53 100-59 44-8 78-19 124-34"
        fill="none"
        stroke="#2449E8"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.5"
      />

      <g transform="translate(68 58)">
        <circle cx="0" cy="0" r="23" fill="#FFFDF5" stroke="#2A2A25" strokeWidth="1.5" />
        <path d="M0-13l7 20-7-5-7 5Z" fill="#F0664F" />
        <text x="0" y="36" textAnchor="middle" fontFamily="Georgia, serif" fontSize="10" fill="#6C6658">
          N
        </text>
      </g>

      <g fontFamily="'Noto Serif SC', Georgia, serif" fill="#25251F">
        <g transform="translate(86 438)">
          <rect x="-20" y="-18" width="94" height="27" rx="13" fill="#FFFDF5" stroke="#D6CCB6" />
          <circle cx="-6" cy="-4.5" r="3.5" fill="#F0664F" />
          <text x="6" y="2" fontSize="13">
            馒头山
          </text>
        </g>
        <g transform="translate(482 49)">
          <rect x="-15" y="-18" width="97" height="27" rx="13" fill="#FFFDF5" stroke="#D6CCB6" />
          <circle cx="-1" cy="-4.5" r="3.5" fill="#2449E8" />
          <text x="11" y="2" fontSize="13">
            凤山门
          </text>
        </g>
        <text x="306" y="286" fontSize="12" fill="#6D7C66" transform="rotate(-8 306 286)">
          凤凰山脚
        </text>
      </g>

      <g transform="translate(555 414)">
        <path d="M0 0h56" stroke="#2A2A25" strokeWidth="2" />
        <path d="M0-4v8M28-3v6M56-4v8" stroke="#2A2A25" strokeWidth="2" />
        <text x="0" y="18" fontFamily="Georgia, serif" fontSize="9" fill="#6C6658">
          500 m
        </text>
      </g>
      <g transform="translate(60 170)" stroke="#C3B89F" strokeWidth="1">
        <path d="M0 0c14-13 29-12 43 1" fill="none" />
        <path d="M0 8c20-17 40-16 60 1" fill="none" opacity="0.65" />
      </g>
    </>
  )
}
