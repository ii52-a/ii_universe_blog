export type CoverVariant =
  | 'store'
  | 'chair'
  | 'walk'
  | 'receipt'
  | 'desk'
  | 'book'
  | 'ice'
  | 'bus'
  | 'map'

export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'list'; items: string[] }
  | { type: 'figure'; variant: CoverVariant; caption: string }

export interface Post {
  id?: string
  slug: string
  title: string
  excerpt: string
  body?: string
  category: string
  tags: string[]
  publishedAt: string
  readMinutes: number
  cover: CoverVariant
  featured?: boolean
  status?: 'draft' | 'published'
  authorId?: string
  authorName?: string
  authorHandle?: string
  authorColor?: string
  authorAvatar?: string
  authorLocation?: string
  userGenerated?: boolean
  content: ContentBlock[]
}

export const siteAuthor = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'DeepS先生',
  handle: 'deepseek',
  color: '#BFD2FF',
  location: '杭州',
  bio: 'DeepS先生，在杭州写一些不着急的事。',
}

export function postAuthor(post: Post) {
  return {
    id: post.authorId ?? siteAuthor.id,
    name: post.authorName ?? siteAuthor.name,
    handle: post.authorHandle ?? siteAuthor.handle,
    color: post.authorColor ?? siteAuthor.color,
    avatar: post.authorAvatar,
    location: post.authorLocation ?? siteAuthor.location,
    bio: post.authorId && post.authorId !== siteAuthor.id ? '' : siteAuthor.bio,
  }
}

export const categories = ['城市', '旧物', '散步', '收集', '日常', '阅读', '饮食'] as const

export const posts: Post[] = [
  {
    slug: 'ten-minutes-at-the-convenience-store',
    title: '在便利店门口站了十分钟',
    excerpt:
      '凌晨一点半，关东煮的汤还在冒泡。我站在玻璃门外，看店员把最后一排饭团摆正。',
    category: '城市',
    tags: ['夜晚', '街道', '观察'],
    publishedAt: '2026-10-12T01:32:00+08:00',
    readMinutes: 8,
    cover: 'store',
    featured: true,
    content: [
      {
        type: 'p',
        text: '从朋友家出来已经一点半。雨停了，地面还是湿的，路灯把梧桐叶的影子按在柏油路上。我本来只想买一瓶水，结果在便利店门口站了十分钟。',
      },
      {
        type: 'p',
        text: '玻璃门里很亮。那种亮没有温度，却让人安心。关东煮的格子冒着细小的泡，收银台旁边的烤肠机慢慢转，店员把最后一排饭团一只一只摆正，像在给它们排队。',
      },
      { type: 'h2', text: '凌晨的货架' },
      {
        type: 'p',
        text: '白天的便利店是通道，大家拿了东西就走。凌晨的便利店更像一个临时客厅：代驾司机坐在窗边吃面，外卖员把头盔放在脚边充电，一个穿校服的女孩在挑酸奶，最后只拿了一包纸巾。',
      },
      {
        type: 'quote',
        text: '城市真正安静下来的时候，不是所有人都睡着了，而是剩下的人终于不赶时间。',
      },
      {
        type: 'p',
        text: '我想起小时候家楼下的小卖部。老板总把冰柜盖一半，说这样省电。夏天的晚上，我们坐在塑料凳上吃雪糕，谁也不觉得那样的时间有什么珍贵。',
      },
      { type: 'h2', text: '买一瓶水，顺便买点别的' },
      {
        type: 'p',
        text: '最后我拿了一瓶水、一包海苔，还有一个临期的布丁。店员把东西装进袋子，问我要不要加热。我说不用。他点点头，把找零和收据一起递过来。',
      },
      {
        type: 'figure',
        variant: 'receipt',
        caption: '小票上的时间是 01:47，比我的手表快两分钟。',
      },
      {
        type: 'p',
        text: '走出十几米，我回头看了一眼。那个店员正在擦柜台，动作不快。玻璃门上的灯牌映在地上，红蓝色被雨水揉开。明天这条街还是会很忙，但至少现在，它只属于几个人。',
      },
    ],
  },
  {
    slug: 'a-new-leg-for-an-old-chair',
    title: '给一把旧椅子换了条腿',
    excerpt:
      '这把椅子跟了我六年，搬过三次家。断掉的那条腿，是母亲第一次来杭州时帮我拧紧的。',
    category: '旧物',
    tags: ['修理', '木头', '家'],
    publishedAt: '2026-09-28T16:10:00+08:00',
    readMinutes: 6,
    cover: 'chair',
    content: [
      {
        type: 'p',
        text: '椅子是在旧货市场买的，八十块。榉木，靠背有一点歪，坐上去会轻轻响。老板说这种椅子结实，再用十年没问题。我当时只是觉得它的颜色像放久了的蜂蜜。',
      },
      {
        type: 'p',
        text: '上周三，右后腿终于断了。断口很干净，像一根被掰开的饼干。我坐在地上看了它一会儿，第一反应不是扔掉，而是去楼下五金店问问有没有合适的木榫。',
      },
      { type: 'h2', text: '先不要急着换新的' },
      {
        type: 'p',
        text: '五金店老板从抽屉里翻出一截榉木圆棒，粗细差不多。他教我先钻一个孔，再用木工胶和木榫接起来，最后用砂纸把接口磨平。整个过程不到半小时，我却拖了三天才动手。',
      },
      {
        type: 'p',
        text: '不是因为难，是因为怕修不好。人对旧东西的感情常常这样：舍不得扔，又不敢碰。好像只要不开始，它就还是原来那把椅子。',
      },
      {
        type: 'quote',
        text: '修东西的乐趣，大概是你终于在一件小事上，得到了一个明确的结果。',
      },
      { type: 'h2', text: '接口处的一道浅色' },
      {
        type: 'p',
        text: '接好的地方有一圈浅色的木纹，像一道愈合后的疤。我给它上了两遍油，颜色还是不太一样。但坐上去不响了，四只脚稳稳地落在地上。',
      },
      {
        type: 'figure',
        variant: 'chair',
        caption: '新换的腿比原来短三毫米，坐下时会往左偏一点。',
      },
      {
        type: 'p',
        text: '晚上我把椅子搬回窗边，上面放了一本翻开的书。母亲打来电话，问我吃饭没有。我说吃了，又顺口说椅子修好了。她哦了一声，说那就好。',
      },
    ],
  },
  {
    slug: 'a-rainy-walk-from-mantoushan',
    title: '雨天散步：从馒头山到凤山门',
    excerpt:
      '雨不大，伞可以收起来。沿着凤凰山脚走，经过菜地、铁路宿舍和一家只在上午开门的裁缝铺。',
    category: '散步',
    tags: ['杭州', '路线', '雨天'],
    publishedAt: '2026-09-17T09:20:00+08:00',
    readMinutes: 12,
    cover: 'walk',
    featured: true,
    content: [
      {
        type: 'p',
        text: '台风过境后的第二天，雨还在下，但已经很细。我从馒头山社区进去，沿着凤凰山脚往南走。这条路没有特别的景点，适合没有目的的时候走。',
      },
      {
        type: 'p',
        text: '路边的菜地被雨洗得很绿，丝瓜挂在架子上，叶子上全是水。一个大爷蹲在田埂边抽烟，看见我举着相机，说：“拍这个做什么，又不好看。”我说好看。他笑了一下，继续抽烟。',
      },
      { type: 'h2', text: '铁路宿舍' },
      {
        type: 'p',
        text: '再往前是几排旧宿舍，红砖墙，绿色窗框。楼道口停着自行车，雨棚上积了水，一滴一滴往下落。有人把晚餐要吃的青菜放在窗台上，用一只搪瓷盆扣着。',
      },
      {
        type: 'quote',
        text: '有些地方的好，不在于它保留了什么，而在于它还没有被急着改成别的样子。',
      },
      {
        type: 'p',
        text: '凤山门附近有一家裁缝铺，木头招牌上的字已经褪色。老板娘坐在缝纫机后面，脚踩得很慢。门口的小黑板上写着：改裤脚十元，换拉链十五元，今天下午休息。',
      },
      { type: 'h2', text: '走到哪里算哪里' },
      {
        type: 'p',
        text: '全程大概四十分钟。如果走快一点，二十分钟也能走完。但我建议慢一点，在铁路宿舍前面的石阶上坐一会儿，听雨落在不同材质上的声音。',
      },
      {
        type: 'list',
        items: [
          '从馒头山社区北门进，沿凤凰山脚路向南。',
          '路过菜地时不要踩到边缘，土是松的。',
          '铁路宿舍可以看，但不要进楼道拍照。',
          '走到凤山门，右转有一家卖葱包桧的小店，下午两点前关门。',
        ],
      },
      {
        type: 'figure',
        variant: 'map',
        caption: '从馒头山到凤山门，慢慢走，四十分钟。',
      },
      {
        type: 'p',
        text: '回程坐了三站公交。车窗上全是水汽，我用手指画了一条线，又很快擦掉。',
      },
    ],
  },
  {
    slug: 'twenty-seven-grocery-receipts',
    title: '我留着 27 张超市小票',
    excerpt:
      '不是因为念旧，只是每次想扔的时候，都觉得上面的字还没有完全褪掉。',
    category: '收集',
    tags: ['小票', '生活痕迹', '收纳'],
    publishedAt: '2026-08-30T20:45:00+08:00',
    readMinutes: 5,
    cover: 'receipt',
    content: [
      {
        type: 'p',
        text: '整理抽屉时翻出一叠超市小票，最早的一张是去年三月。纸已经发软，字迹淡得像被水洗过。我一张张摊在桌上，按时间排好，居然有 27 张。',
      },
      {
        type: 'p',
        text: '小票是一种很奇怪的记录。它不写心情，只写你买了什么：牛奶、鸡蛋、洗衣液、一把小葱、两罐啤酒。可是把时间连起来看，生活就露出了一点轮廓。',
      },
      { type: 'h2', text: '去年三月的那张' },
      {
        type: 'p',
        text: '第一张上面有速冻水饺、创可贴和一盒草莓。那天我刚搬完家，厨房还没收拾好，晚饭是在纸箱上吃的。草莓很酸，我吃了两颗就放进了冰箱，后来忘了。',
      },
      {
        type: 'quote',
        text: '我们以为自己在记大事，最后记住的却总是购物清单。',
      },
      {
        type: 'p',
        text: '有几张上面有重复的东西：同一个牌子的酸奶，同一种挂面，同一个时间段的关东煮。原来我以为自己吃得挺杂，其实来来回回就是那几样。',
      },
      {
        type: 'figure',
        variant: 'receipt',
        caption: '最贵的一张 184.6 元，买了一只锅；最便宜的一张 1.5 元，只买了一节电池。',
      },
      { type: 'h2', text: '留下七张' },
      {
        type: 'p',
        text: '最后我没有全留。挑了七张，夹进一本不常翻的书里。剩下的用碎纸机处理掉。碎纸机响的时候，我有一点舍不得，但更多的是轻松。',
      },
      {
        type: 'p',
        text: '东西少了，记忆并不会跟着少。真正想记得的事，早就在别的地方了。',
      },
    ],
  },
  {
    slug: 'after-clearing-the-desk',
    title: '把桌面清空以后',
    excerpt:
      '只留下一盏灯、一台电脑和一只装回形针的铁盒。第一晚我坐了很久，什么也没做。',
    category: '日常',
    tags: ['桌面', '整理', '注意力'],
    publishedAt: '2026-08-21T22:05:00+08:00',
    readMinutes: 4,
    cover: 'desk',
    content: [
      {
        type: 'p',
        text: '桌上原来有很多东西：两支快没水的笔、三本摊开的书、一叠便签、一盒忘记吃的薄荷糖、一个不知道从哪来的瓶盖。它们没有碍事，但让我总觉得有事没做完。',
      },
      {
        type: 'p',
        text: '周日晚上，我把桌面全部清空。书放回书架，笔收进笔筒，便签只留最上面一张。最后桌上只剩一盏灯、一台电脑和一只装回形针的铁盒。',
      },
      { type: 'h2', text: '空出来的不是地方' },
      {
        type: 'p',
        text: '第一晚我坐了很久，什么也没做。没有东西可整理，也没有理由再拖延。那种感觉并不舒服，像走进一个刚拖完地的房间，不知道脚该往哪里放。',
      },
      {
        type: 'quote',
        text: '清空桌面很容易，难的是承认自己一直在用杂乱来推迟开始。',
      },
      {
        type: 'p',
        text: '后来我给自己定了一个很简单的规矩：离开桌子前，把东西放回原位。不超过一分钟。坚持了两周，桌面没有再乱过。',
      },
      {
        type: 'figure',
        variant: 'desk',
        caption: '铁盒里的回形针还是那么多，我很少用，但不想扔。',
      },
      {
        type: 'p',
        text: '这件事没有让我变得更高效。只是现在坐下来的时候，心里少了一层薄薄的噪音。',
      },
    ],
  },
  {
    slug: 'a-book-with-a-typo',
    title: '一本印错字的书',
    excerpt:
      '在第 134 页，编辑把“慢慢”印成了“漫漫”。我用铅笔在页边画了一条线，没有改。',
    category: '阅读',
    tags: ['书', '版本', '校对'],
    publishedAt: '2026-08-09T15:30:00+08:00',
    readMinutes: 7,
    cover: 'book',
    content: [
      {
        type: 'p',
        text: '书是在二手书店买的，1998 年第一版，封面已经磨白。读到第 134 页，我停下来看了很久。那句话本来应该是“慢慢走”，印出来却是“漫漫走”。',
      },
      {
        type: 'p',
        text: '一个字错了，意思并没有完全歪掉。慢慢是速度，漫漫长路是距离。把它们放在一起，反而像一个人一边走一边安慰自己。',
      },
      { type: 'h2', text: '页边的铅笔线' },
      {
        type: 'p',
        text: '我拿铅笔在页边画了一条很轻的线，本来想改，后来没有。书里还有几处铅笔批注，前一个读者写字很小，喜欢在句末画一个圈。我们隔着二十多年，在同一页上停了停。',
      },
      {
        type: 'quote',
        text: '一本书真正变成你的，不是从读完开始，是从你舍不得合上开始。',
      },
      {
        type: 'p',
        text: '那天晚上我把这本书翻完，又回头读了第 134 页。窗外有人在练习萨克斯，吹得不太熟，一句旋律重复了很多遍。我忽然觉得，印错的那个字也挺好。',
      },
      {
        type: 'figure',
        variant: 'book',
        caption: '书脊内侧有一行铅笔字：1999.4，杭州。',
      },
      {
        type: 'p',
        text: '下次再读到“漫漫”，我大概会想起这个晚上。错误有时候比正确更容易被记住。',
      },
    ],
  },
  {
    slug: 'the-last-green-bean-ice-pop',
    title: '夏末的最后一支绿豆棒冰',
    excerpt:
      '小区门口的小卖部要关门了。冰柜里只剩三支绿豆棒冰，我买了两支，站在树荫下吃完。',
    category: '饮食',
    tags: ['夏天', '棒冰', '小卖部'],
    publishedAt: '2026-07-30T18:40:00+08:00',
    readMinutes: 5,
    cover: 'ice',
    content: [
      {
        type: 'p',
        text: '小卖部的卷帘门拉下来一半，门口堆着纸箱。老板娘坐在风扇旁边，说下个月不做了，房租涨得太快。我哦了一声，问冰柜里还有没有绿豆棒冰。',
      },
      {
        type: 'p',
        text: '还剩三支。我买了两支，一支给她，一支自己拿着。她说不要，我说天热。她接过去，放在收银台上，过了一会儿才拆开。',
      },
      { type: 'h2', text: '绿豆的味道' },
      {
        type: 'p',
        text: '现在的棒冰做得太甜，绿豆味很薄。小时候吃的那种，冰里真的有豆子，咬到会觉得牙疼。吃完舌头是绿的，回家被大人笑。',
      },
      {
        type: 'quote',
        text: '夏天结束的信号，不是天气变凉，是某家店突然不开了。',
      },
      {
        type: 'p',
        text: '我们站在门口的树荫下吃完。她说这条街以前有三家小卖部，现在只剩对面那家连锁便利店。我说便利店也挺方便。她笑了笑，没接话。',
      },
      {
        type: 'figure',
        variant: 'ice',
        caption: '冰柜上贴着一张褪色的纸：绿豆棒冰 2 元。',
      },
      {
        type: 'p',
        text: '走的时候，她叫住我，把柜台上剩下的一支也塞给我。我说给钱，她摆手。那支棒冰化得很快，走到小区门口就软了。我站在垃圾桶旁边吃完，木棍上印着“再来一支”。',
      },
    ],
  },
  {
    slug: 'back-seat-of-the-bus',
    title: '公交车最后一排靠窗',
    excerpt:
      '从始发站坐到终点站，四十分钟。车里只有五个人，窗外的城市像一卷放慢的胶片。',
    category: '城市',
    tags: ['公交', '路线', '窗'],
    publishedAt: '2026-07-18T13:15:00+08:00',
    readMinutes: 6,
    cover: 'bus',
    content: [
      {
        type: 'p',
        text: '那天下午没有安排，我从始发站上了一辆 42 路。车上只有五个人，我坐在最后一排靠窗。司机把广播开得很轻，报站声听起来像从很远的地方传来。',
      },
      {
        type: 'p',
        text: '公交车的好处是它不抄近路。它会绕进小区，经过菜市场、学校、医院，在每一个有人等的站台停一下。你被迫看见那些平时不会走进去的地方。',
      },
      { type: 'h2', text: '四十分钟的城市' },
      {
        type: 'p',
        text: '第三站上来一个抱花的女人，花用旧报纸包着。第五站下去两个小学生，书包比人还大。第七站没有人，司机还是停了五秒，开门，关门，继续走。',
      },
      {
        type: 'quote',
        text: '在一座城市里，最接近散步的交通方式，可能是公交车。',
      },
      {
        type: 'p',
        text: '窗户上有一层薄灰，阳光照进来，灰尘在光里浮着。我把额头靠在玻璃上，能感觉到发动机细小的震动。手机没电了，我反而松了一口气。',
      },
      {
        type: 'figure',
        variant: 'bus',
        caption: '终点站旁边是一片没有名字的空地，长满了狗尾巴草。',
      },
      {
        type: 'p',
        text: '下车以后，我沿着原路往回走了两站，才发现刚才路过一家很好看的旧书店。它在车窗外只出现了三秒，我差点错过。',
      },
    ],
  },
]

export const getPost = (slug?: string) => posts.find((post) => post.slug === slug)

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(new Date(value))

export const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  })
    .format(new Date(value))
    .replace('/', '.')
