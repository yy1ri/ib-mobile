/* IB 桌面 APP · 观影室 v1.12.0 —— 选一段手机里的视频、配一份 .srt / .vtt 字幕，和 TA 一起看。
   v1.12.0：「选一部片」一律新开一条记录与频道（key＝hash(文件名)_大小_时间），只有从观影历史点记录再看才接着原频道与聊天；旧记录（无时间后缀）照样能接。
   v1.11.0（降级，根治「看过一次就再也放不了」）：整个「读进内存」路径删除。根因：这台机器的文件选择器给的文件不支持随机读，1.4.0 起每次开播都把整段视频顺序读进一个 Blob 再喂播放器——低配机上第一次能过，上一次的 Blob 还没释放时第二次读就撞上浏览器 Blob 存储上限，源文件读取直接报「network error」，「读进内存再试」同样撞墙，只有杀掉进程（重启几次）才恢复；删观影记录其实无关。现在视频一律按原样直接交给播放器顺序播放（1.3.0 起就实证「新片能放」走的就是这条路），内存里不再有第二份视频；开播后才探一次能否随机读，探不过就只禁拖进度与 «10 10»（提示一句），不影响播放；直挂失败只给「重选文件」与原因。
   v1.10.0：①弹幕修复——1.8.0 说「弹幕在普通舞台上飞」，但 danmaku() 里还留着全屏判断（fs 恒为 false），弹幕键其实一直是死的；现在开着弹幕就飞。②网页形态的全屏：只在浏览器 / PWA 里出全屏键（原生封装环境里不画，一行代码都不跑）——按下走 Fullscreen API 把舞台整块交给浏览器（系统栏由浏览器接管），再按「全屏方向」设置锁方向（跟随画面：横版横屏、竖版竖屏；或定死横 / 竖），全屏里转屏键切换；顶栏 ← 或再按全屏键退出，浏览器侧退出（返回键 / ESC）也同步；底栏第二行是留影 / 输入 / 寄出，全屏里照样能聊；浏览器不放行 Fullscreen API 时退回铺满页面的固定层，方向由系统决定。③设置里「全屏弹幕」改名「弹幕」。
   v1.9.0：全屏遗留代码清理——五个全屏函数、方向选择层与全屏输入行的样式、方向设置项、全屏图标全部删除；弹幕保留。
   v1.8.0：全屏 / 横竖屏功能整体退役（老机器上系统栏与布局对不齐，先做稳）：撤全屏键、转屏键、方向设置与全屏输入行；弹幕开关保留，弹幕在普通舞台上飞。
   v1.7.0：①片子还没读出元数据时不出中央播放钮（video 加透明 poster，避免个别 WebView 画出巨大的默认播放图）；②浮层标题只留片名，「与 X 一起看」挪到衔接条；③衔接条改成共读间同款玻璃条（上虚线、下圆角、贴着舞台），不再是黑色渐隐；④「正在想」不再自带读秒（读秒统一在 Thought process 后面）。
   v1.6.0：①放映页顶栏（← 片库 · 片名 · ⋯）融进画面浮层——点画面才出现，舞台上方不再多一条；← 在全屏里是退出全屏、平时是回片库。②舞台与聊天区之间加一条衔接状态条：TA 头像 · 与 TA 一起看 · 当前 / 全长 · N 条，黑底向下渐隐进聊天区，不再是黑边直接顶着聊天。③全屏时同时隐藏系统栏，退出恢复（这套后来退役）。
   v1.5.0（降级）：删掉「看到哪 / 续播」——只保留核心：和识图的 TA 一起看视频、看字幕、聊天。观影记录只记片名 / 文件名 / 大小 / 时长 / 字幕文件名 / 频道 / 是否看完，每次打开都从头放；读取路径 1.11.0 起只剩直挂（读进内存路径已删）。
   聊天不进主对话：底座 ctx.chat.openThread 给这位 TA 开一条「观影室 · 片名」话题频道（quiet＝安静频道：不注入工具与协议块，只留记忆注入与记忆库写入，对话摘要照常）；一部片一条频道。
   v1.4.0：
   ①视频读取重做：开播前先探一次「能不能从文件中间读」（读文件末尾 4 KB）。这台机器的系统选择器给出的 content:// 文件若不支持随机读，直挂时顺序播放没事，但续播 / 拖进度条 / «10 10» 一 seek 就报错，1.3.0 的分块 slice 回落同样报 NotReadableError——所以「新片能放、看过的不能放、删掉记录就能放」。探得不行且文件不超过上限，就按顺序整个读进内存（Blob.stream，不做任何 slice / seek）再喂播放器；探得可以就直挂。直挂后仍报错也自动读一次；失败卡带「读进内存再试」「重选文件」。
   ②全屏白屏根修：全屏层此前 position:fixed;inset:0 但计算高度为 0——基础规则的 align-self:center 对绝对定位元素生效，height:auto 变成 fit-content，舞台里只有绝对定位的 video 于是塌成零高，看到的只剩壁纸层。现全屏层显式 100vw / 100vh 并复位 align-self。
   ③全屏按播放器的样子重做：顶栏（退出 · 片名 · 整片聊聊）、底栏（进度条 / 播放 / «10 10» / 弹幕开关 / 倍速 / 转屏 / 字幕 / 留影 / 输入 / 寄出），横屏时输入条与控制键同一行，竖屏时分两行；3.5 秒不动自动隐藏、点画面再显示。方向只手动选（横屏 / 竖屏），全屏里可再按转屏键切换；不再「跟随画面」，也不跟着手机摇晃转。
   ④竖屏播放页改成手机播放器的样子：舞台通栏黑底、无圆角无边框，横版视频按宽占满，竖版视频受高度上限约束、两侧留黑；聊天区在舞台下方。
   ⑤观影历史：点记录先出「待开始」卡（上次看到哪、上次字幕、和谁一起），卡上一枚「选这个视频文件」按钮才弹文件选择器——此前点记录直接弹选择器，容易被当成打不开；卡上写明文件不入库、重选同一个即续播。
   ⑥设置层改不透明底（此前 var(--sheet) 半透明，书页 / 画面透上来），减少动效、省性能。
   看画面（照视频通话的口径）：设置「给 TA 看画面」关 / 每条消息附当前帧 / 只在留影时，画质三档；帧只发给识图的 TA，默认走临时帧（只随当次请求走、不落库），「留影存进聊天」打开才作为图片留在聊天记录里。
   防幻觉边界：没字幕且 TA 看不到画面时，明说只知道进度与对方的话，不描述画面、不编台词；有画面时只说画面里确实有的。系统随附的观影状态与对方真正说的话之间有明确分隔。
   存什么：视频与字幕文件一律不入库、不随备份（字幕这次打开 IB 期间在内存里记着）；存的只有 film_<key>（片名 / 文件名 / 大小 / 时长 / 看到哪 / 字幕文件名 / 频道）、sum_<key>（前情梗概 ≤600 字）、cfg。
   只经 ctx 与主程序说话（sdk 2）；不碰 IndexedDB、不碰发送函数、不改 index.html；无原生依赖（全屏＝Fullscreen API ＋ screen.orientation.lock，只在网页形态出现）。在线平台视频与 DRM 内容不支持。 */
(function(){
  if(!window.IBApps)return;
  var host=null,ctx=null;
  var SUBS={};/* 会话内字幕缓存：key → {name,cues}；只进内存，不入库 */
  var S={see:'turn',vq:'m',keep:0,cc:1,dm:1,subN:12,sumEvery:15,nudge:0,rate:1,stage:'m',fsOri:'auto',lastAi:''};/* 1.10.0：fsOri 只在网页形态有意义（auto 跟随画面 / landscape / portrait） */
  var FS_OK=(function(){try{if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())return false}catch(e){}return true})();/* 1.10.0：全屏只在网页形态（浏览器 / PWA）；原生封装环境里不出全屏键、不跑这条路。浏览器没有 Fullscreen API 时（iOS Safari 对非 video 元素）退回固定层铺满页面 */
  var OPT={
    see:[['off','关'],['turn','每条消息附当前帧（默认）'],['snap','只在留影时']],
    vq:[['l','省流（384px）'],['m','均衡（512px · 默认）'],['h','清晰（768px）']],
    subN:[[6,'6 条'],[12,'12 条（默认）'],[20,'20 条']],
    sumEvery:[[0,'关'],[10,'每 10 分钟'],[15,'每 15 分钟（默认）'],[30,'每 30 分钟']],
    nudge:[[0,'关（默认）'],[1,'停 1 分钟'],[2,'停 2 分钟'],[3,'停 3 分钟'],[5,'停 5 分钟'],[10,'停 10 分钟']],
    rate:[[0.75,'0.75×'],[1,'1×'],[1.25,'1.25×'],[1.5,'1.5×']],
    stage:[['s','中（约四成屏高）'],['m','大（约六成屏高 · 默认）'],['l','更大（约七成屏高）']],
    fsOri:[['auto','跟随画面（默认）'],['landscape','横屏'],['portrait','竖屏']],
    keep:[[0,''],[1,'']],cc:[[0,''],[1,'']],dm:[[0,''],[1,'']]
  };
  var CARDS=[
    ['画面',[['sel','stage','画面大小','舞台的高度上限：横版视频按宽占满，竖版视频受此限、两侧留黑'],,['sel','see','给 TA 看画面','只发给识图的 TA。每条消息＝每句话带上此刻一帧；留影时＝只在按过相机键才带'],['sel','vq','画面画质','发给 TA 的那一帧多大'],['sw','keep','留影存进聊天','开＝留影作为图片留在聊天记录里；关＝只发给 TA，不落库'],['sw','cc','舞台字幕','画面上叠显字幕'],['sw','dm','弹幕','你和 TA 的话飞过画面']]],
    ['陪看',[['sel','subN','附给 TA 的字幕','每句话带上播放点之前的几条台词；越多越准，也越费 token'],['sel','sumEvery','前情梗概','看过这么久就把之前的台词压一次梗概，随每句话带上'],['sel','nudge','TA 主动开口','放映中一直没人说话满这么久，TA 先开口']]],
    ['播放',[['sel','rate','倍速',''],['sel','fsOri','全屏方向','跟随画面＝横版视频横屏、竖版竖屏；全屏里也可按转屏键切换']]]
  ];
  var VQ={l:{e:384,q:0.6},m:{e:512,q:0.72},h:{e:768,q:0.8}};
  var STAGE={s:'40vh',m:'58vh',l:'72vh'};
    var F=null,V=null,subs=[],subName='',sess=null,sum={text:'',upTo:0},sumBusy=false,aiList=[],aiId='',films=[],pend=null,held='',pending=false,pendAt=0,pendT=null,wdT=null,uiT=null,fsMode='',onFsc=null;
  var tickT=null,saveT=null,onMsg=null,onTurn=null,onDelta=null,onVis=null,lastSaved=-1,wrapBusy=false,dragging=false,sumChk=0,lane=0,fs=false,chatIds='',typ=null;
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function q(sel){return host?host.querySelector(sel):null}
  function toast(t){try{ctx.ui.toast(t)}catch(e){}}
  function fmt(sec){sec=Math.max(0,Math.floor(sec||0));var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?(h+':'):'')+(h?String(m).padStart(2,'0'):m)+':'+String(s).padStart(2,'0')}
  function hash(str){var h=5381;str=String(str||'');for(var i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return (h>>>0).toString(36)}
  function keyOf(file){return hash(file.name)+'_'+file.size}
  function titleOf(name){return String(name||'').replace(/\.[a-z0-9]{2,5}$/i,'').replace(/[._]+/g,' ').trim()||'未命名'}
  function short(t,n){t=String(t||'');return t.length>n?t.slice(0,n)+'…':t}
  function vib(){try{if(navigator.vibrate)navigator.vibrate(10)}catch(e){}}
  var IC={cam:'<svg viewBox="0 0 24 24"><path d="M4 8.5h3l1.5-2.5h7L17 8.5h3v10H4z"/><circle cx="12" cy="13.5" r="3"/></svg>',play:'<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>',pause:'<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',send:'<svg viewBox="0 0 24 24"><path d="M4 12h13M13 6l6 6-6 6"/></svg>',cc:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M7 12.5h4M13 12.5h4M7 15.5h10"/></svg>',fs:'<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',fx:'<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',rot:'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="11" height="17" rx="2"/><path d="M19 9.5v6a2 2 0 0 1-2 2h-1.5M18 20l-2.5-2.5L18 15"/></svg>'};
  function css(){
    var old=document.getElementById('ci-css');if(old)old.remove();
    var st=document.createElement('style');st.id='ci-css';
    st.textContent=''
    +'.ci{position:relative;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--tx);font-family:inherit;--ci-mh:58vh;--ci-ar:1.7778}'
    /* 片库 */
    +'.ci-lib{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(6px + var(--sat,0px)) 14px calc(24px + var(--sab,0px))}'
    +'.ci-lib .ci-top{margin:0 0 10px}'
    +'.ci-lab{font-family:var(--disp);font-weight:300;font-size:0.58rem;letter-spacing:0.26em;color:var(--tx3);text-transform:uppercase;margin:14px 2px 8px}'
    +'.ci-who .f-group{margin-bottom:0}.ci-who{display:flex;gap:10px;align-items:flex-end}.ci-who .f-group{flex:1;min-width:0}'
    +'.ci-pick{flex:none;display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 16px;border-radius:12px;border:1px solid rgba(114,168,216,0.55);background:rgba(150,190,235,0.12);color:var(--acc);font-size:0.8rem;font-family:inherit;letter-spacing:0.04em;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap}'
    +'.ci-card{position:relative;display:flex;gap:14px;align-items:flex-start;background:var(--panel);border:1px solid var(--panel-line);border-radius:19px;padding:15px 16px 13px;margin-bottom:12px;overflow:hidden;box-shadow:0 8px 26px rgba(90,120,170,0.11);-webkit-tap-highlight-color:transparent}'
    +'.ci-card::before{content:"";position:absolute;inset:0 0 auto 0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent);pointer-events:none}'
    +'.ci-card.go{cursor:pointer}.ci-card.go:active{transform:translateY(1px) scale(0.995)}'
    +'body.theme-infernal .ci-card{box-shadow:0 8px 26px rgba(0,0,0,0.24)}body.theme-infernal .ci-card::before{background:linear-gradient(90deg,transparent,rgba(160,190,225,0.22),transparent)}'
    +'.ci-tile{flex:none;width:47px;border-radius:13px;padding:7px 0 6px;text-align:center;background:linear-gradient(165deg,rgba(255,255,255,0.6),rgba(214,231,248,0.28));border:1px solid rgba(255,255,255,0.6);box-shadow:inset 0 1px 0 rgba(255,255,255,0.8)}'
    +'body.theme-infernal .ci-tile{background:linear-gradient(165deg,rgba(96,128,172,0.22),rgba(24,34,58,0.4));border-color:rgba(165,190,228,0.2);box-shadow:inset 0 1px 0 rgba(210,228,250,0.1)}'
    +'.ci-tile b{display:block;font-family:var(--serif);font-weight:600;font-size:1.06rem;line-height:1;color:var(--acc);letter-spacing:0.02em}.ci-tile small{display:block;font-family:var(--disp);font-weight:300;font-size:0.47rem;letter-spacing:0.2em;color:var(--tx3);margin-top:4px;text-transform:uppercase}'
    +'.ci-cm{flex:1;min-width:0}.ci-ct{font-family:var(--serif);font-weight:600;font-size:1.06rem;color:var(--tx);letter-spacing:0.02em;line-height:1.3;word-break:break-all}'
    +'.ci-cs{font-size:0.75rem;color:var(--tx2);margin-top:3px;line-height:1.6}.ci-cs i{font-style:normal;color:var(--acc)}.ci-cs.dim{color:var(--tx3);font-size:0.68rem}'
    +'.ci-meta{display:flex;flex-wrap:wrap;align-items:center;gap:7px;font-size:0.6rem;color:var(--tx3);margin-top:9px;letter-spacing:0.05em}'
    +'.ci-pill{display:inline-flex;align-items:center;padding:2.5px 9px;border-radius:999px;border:1px solid rgba(114,168,216,0.34);color:var(--acc);background:rgba(150,190,235,0.1);letter-spacing:0.06em}'
    +'.ci-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'
    +'.ci-mini{flex:none;border:1px solid var(--line);border-radius:999px;padding:6px 12px;background:none;color:var(--tx2);font-size:0.72rem;font-family:inherit;letter-spacing:0.04em;cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}'
    +'.ci-mini svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    +'.ci-mini.acc{color:var(--acc);border-color:rgba(114,168,216,0.55);background:rgba(150,190,235,0.1)}.ci-mini.on{color:var(--acc);border-color:var(--acc)}.ci-mini:disabled{opacity:0.45}'
    +'.ci-ti{width:100%;box-sizing:border-box;margin-top:6px;border:none;border-bottom:1px dashed var(--line);background:none;color:var(--tx);font-family:var(--serif);font-weight:600;font-size:1.06rem;padding:2px 0;outline:none}.ci-ti:focus{border-bottom-color:var(--acc);border-bottom-style:solid}'
    +'.ci-x{flex:none;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:var(--tx3);font-size:0.8rem}'
    +'.ci-empty{padding:18px 12px;font-size:0.8rem;color:var(--tx2);text-align:center;line-height:1.7}'
    /* 放映页顶栏：Blog 阅读页同款玻璃条，贴着舞台 */
    +'.ci-top{flex:none;display:flex;align-items:center;gap:8px;margin:calc(6px + var(--sat,0px)) 10px 0;padding:8px 10px;border-radius:16px;background:var(--sheet);border:1px solid var(--glass-line);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}'
    +'body.ib-reduce .ci-top{backdrop-filter:none;-webkit-backdrop-filter:none}'
    +'.ci-tt{flex:1;min-width:0;font-family:var(--serif);font-weight:600;font-size:0.96rem;color:var(--tx);letter-spacing:0.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.ci-tt small{display:block;font-family:var(--disp);font-weight:300;font-size:0.56rem;letter-spacing:0.22em;color:var(--tx3);text-transform:uppercase;margin-top:1px}'
    /* 舞台：通栏黑底，横版按宽占满，竖版受高度上限约束、两侧留黑；全屏＝固定层（显式 100vw / 100vh，align-self 复位——旧写法 inset:0 时高度塌成 0） */
    +'.ci-stage{flex:none;position:relative;align-self:stretch;width:100%;aspect-ratio:var(--ci-ar);max-height:var(--ci-mh);margin:var(--sat,0px) 0 0;overflow:hidden;background:#000}'
    +'.ci-stage video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}'
    +'.ci.fs .ci-stage{position:fixed;left:0;top:0;width:100vw;height:100vh;max-height:none;aspect-ratio:auto;margin:0;border:none;border-radius:0;box-shadow:none;align-self:auto;justify-self:auto;z-index:40}'
    +'.ci.fs>.ci-top,.ci.fs>.ci-chat,.ci.fs>.ci-in{visibility:hidden}'
    +'.ci-cc{position:absolute;left:6%;right:6%;bottom:8%;text-align:center;font-size:0.86rem;line-height:1.5;color:#fff;text-shadow:0 0 4px rgba(0,0,0,0.9),0 1px 2px rgba(0,0,0,0.9);white-space:pre-wrap;pointer-events:none;transition:bottom 0.2s}'
    +'.ci.fs .ci-cc{font-size:1.15rem}.ci-stage.ui .ci-cc{bottom:calc(96px + 8%)}.ci.fs .ci-stage.ui .ci-cc{bottom:calc(168px + var(--sab,0px))}.ci-cc[hidden]{display:none}'
    +'.ci-vfail{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:84%;text-align:center;color:#fff;font-size:0.78rem;line-height:1.65;display:none;z-index:6}.ci-vfail.on{display:block}.ci-vfail small{display:block;font-size:0.62rem;opacity:0.7;margin-top:4px;word-break:break-all}.ci-vfail .ci-btns{justify-content:center;margin-top:10px}.ci-vfail .ci-mini{color:#fff;border-color:rgba(255,255,255,0.5)}'
    +'.ci-vbusy{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:6px 12px;border-radius:999px;background:rgba(10,20,40,0.6);color:#fff;font-size:0.7rem;letter-spacing:0.04em;display:none;z-index:6;white-space:nowrap}.ci-vbusy.on{display:block}'
    /* 浮层 UI：点画面显示，播放中 3.5 秒自动隐藏；暂停常显 */
    +'.ci-ui{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;justify-content:space-between;opacity:0;pointer-events:none;transition:opacity 0.22s}'
    +'.ci-stage.ui .ci-ui{opacity:1;pointer-events:auto}'
    +'.ci-utop{display:flex;align-items:center;gap:8px;padding:calc(8px + var(--ci-sat,0px)) 12px 18px;background:linear-gradient(rgba(0,0,0,0.55),transparent);color:#fff}'
    +'.ci.fs .ci-utop{--ci-sat:var(--sat,0px)}'
    +'.ci-ut{flex:1;min-width:0;font-family:var(--serif);font-weight:600;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    +'.ci-strip{flex:none;position:relative;display:flex;align-items:center;gap:8px;padding:9px 14px;margin:0 8px;background:var(--sheet);border:1px solid var(--glass-line);border-top:1px dashed var(--glass-line);border-radius:0 0 18px 18px;box-shadow:0 8px 20px rgba(40,60,100,0.08);color:var(--tx2);font-size:0.76rem;letter-spacing:0.02em}'
    +'.ci-umid{display:none}.ci-stage.ready .ci-umid{display:flex}'
    +'.ci.fs .ci-strip{visibility:hidden}.ci-strip .ci-sav{flex:none;width:22px;height:22px;border-radius:50%;overflow:hidden;background:rgba(114,168,216,0.18);color:var(--acc);display:inline-flex;align-items:center;justify-content:center;font-size:0.6rem}.ci-strip .ci-sav img{width:100%;height:100%;object-fit:cover;display:block}'
    +'.ci-strip .ci-stx{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tx)}.ci-strip .ci-stm{flex:none;font-family:var(--disp);font-size:0.62rem;letter-spacing:0.06em;color:var(--tx3);font-variant-numeric:tabular-nums}.ci-strip .ci-sn{flex:none;font-family:var(--disp);font-size:0.62rem;letter-spacing:0.06em;color:var(--tx3)}'
    +'.ci-ut small{display:block;font-family:var(--disp);font-weight:300;font-size:0.54rem;letter-spacing:0.22em;opacity:0.75;text-transform:uppercase}'
    +'.ci-umid{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;border:1px solid rgba(255,255,255,0.5);background:rgba(10,20,40,0.45);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    +'.ci-umid svg{width:24px;height:24px;fill:#fff}'
    +'.ci-ubot{display:flex;flex-direction:column;gap:6px;padding:16px 12px calc(10px + var(--ci-sab,0px));background:linear-gradient(transparent,rgba(0,0,0,0.66))}'
    +'.ci.fs .ci-ubot{--ci-sab:var(--sab,0px);padding-left:calc(12px + var(--sal,0px));padding-right:calc(12px + var(--sar,0px))}'
    +'.ci-frow{display:flex;align-items:center;gap:6px;width:100%}.ci-frow .sp{flex:1}'
    +'.ci-fctl{flex-wrap:wrap;row-gap:8px}.ci-fctl .sp{order:5}.ci-fctl .rg{order:6}.ci-fctl .ci-fin{order:20}'
    +'.ci-fb{flex:none;height:32px;min-width:32px;padding:0 10px;border-radius:16px;border:1px solid rgba(255,255,255,0.38);background:rgba(10,20,40,0.42);color:#fff;font-size:0.72rem;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px;-webkit-tap-highlight-color:transparent;white-space:nowrap}'
    +'.ci-fb svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.ci-fb.ic{padding:0}.ci-fb.on{border-color:#9fd0ff;color:#9fd0ff}.ci-fb:disabled{opacity:0.4}.ci-fb.pp svg{fill:#fff;stroke:none}'
    +'.ci-fb.fso{display:none}.ci.fs .ci-fb.fso{display:inline-flex}.ci-frow.fso{display:none}.ci.fs .ci-frow.fso{display:flex}.ci-fin.fso{display:none}.ci.fs .ci-fin.fso{display:flex}'
    +'.ci-fin input{flex:1;min-width:0;height:34px;border-radius:17px;border:1px solid rgba(255,255,255,0.35);background:rgba(10,20,40,0.55);color:#fff;padding:0 14px;font-size:0.9rem;font-family:inherit;outline:none;-webkit-appearance:none}.ci-fin input::placeholder{color:rgba(255,255,255,0.55)}'
    +'.ci-fchip{flex:none;display:none;width:34px;height:34px;border-radius:9px;overflow:hidden;border:1px solid rgba(255,255,255,0.5)}.ci-fchip img{width:100%;height:100%;object-fit:cover;display:block}.ci-fchip.on{display:block}'
    +'.ci.fs .ci-stage.ready .ci-umid{display:flex}.ci.fs .ci-dm{bottom:38%}'
    +'.ci-ftime{flex:none;font-family:var(--disp);font-size:0.64rem;letter-spacing:0.06em;color:rgba(255,255,255,0.85);font-variant-numeric:tabular-nums}'
    +'.ci-bar{flex:1;height:22px;display:flex;align-items:center;cursor:pointer;touch-action:none}.ci-bar i{display:block;width:100%;height:3px;border-radius:2px;background:rgba(255,255,255,0.28);position:relative;overflow:visible}'
    +'.ci-bar i b{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;background:#9fd0ff}.ci-bar i s{position:absolute;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,0.22)}'
    /* 弹幕：只在全屏 */
    +'.ci-dm{position:absolute;left:0;right:0;top:6%;bottom:34%;overflow:hidden;pointer-events:none;display:block;z-index:4}'
    +'.ci-dmi{position:absolute;left:100%;top:0;white-space:nowrap;font-size:1.02rem;line-height:1.4;color:#fff;text-shadow:0 0 4px rgba(0,0,0,0.9),0 1px 2px rgba(0,0,0,0.9);animation:ci-fly 9s linear forwards;will-change:transform}.ci-dmi.u{color:#9fd0ff}'
    +'@keyframes ci-fly{to{transform:translateX(calc(-100vw - 100%))}}'
    /* 聊天区＝Chat 本体（消息行由底座画），透明铺在壁纸上 */
    +'.ci-chat{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 12px 6px;display:flex;flex-direction:column;gap:8px}'
    +'.ci-chat .m{font-size:0.86rem;padding:9px 13px;max-width:88%}.ci-chat .mh-ava{width:26px;height:26px;font-size:0.68rem}.ci-chat .m-time{font-size:0.56rem}.ci-chat .mrow{margin-bottom:2px}'
    +'.ci-chat .ci-hello{align-self:center;margin:auto 0;padding:10px 14px;font-size:0.74rem;line-height:1.7;color:var(--tx3);text-align:center;max-width:82%}'
    +'.ci-secs{align-self:flex-start;font-family:var(--disp);font-size:0.58rem;letter-spacing:0.08em;color:var(--tx3);margin:-4px 0 2px 40px}'
    +'.ci-in{flex:none;margin:6px 10px calc(10px + var(--sab,0px))}'
    +'.ci-ta{flex:1;resize:none;border:1px solid var(--glass-line);border-radius:16px;background:rgba(255,255,255,0.55);color:var(--tx);font-size:1rem;line-height:1.5;padding:10px 14px;font-family:inherit;max-height:110px;min-height:42px;-webkit-appearance:none;outline:none}'
    +'body.theme-infernal .ci-ta{background:rgba(14,22,42,0.5)}.ci-ta:focus{border-color:var(--acc)}'
    +'.ci-in .cv-mini.on{color:var(--acc);border-color:var(--acc);box-shadow:0 0 0 3px rgba(114,168,216,0.2)}.ci-in .cv-mini:disabled{opacity:0.4}'
    +'.ci-chip{flex:none;position:relative;display:none;width:46px;height:42px;border-radius:12px;overflow:hidden;border:1px solid var(--acc)}.ci-chip img{width:100%;height:100%;object-fit:cover;display:block}.ci-chip.on{display:block}'
    +'.ci-chip span{position:absolute;right:0;top:0;width:16px;height:16px;border-radius:0 0 0 8px;background:rgba(10,20,40,0.7);color:#fff;font-size:0.66rem;line-height:16px;text-align:center;cursor:pointer}'
    /* 设置层：不透明实色底（ov2 面板同一套渐变），不透底、不模糊 */
    +'.ci-lay{position:absolute;inset:0;z-index:12;display:flex;flex-direction:column;background:linear-gradient(180deg,#f3f7fd 0%,#e9effa 62%,#e4ebf7 100%);color:var(--tx)}'
    +'body.theme-infernal .ci-lay{background:linear-gradient(180deg,#111b30 0%,#0d1526 60%,#0a111f 100%)}'
    +'.ci-lh{flex:none;display:flex;align-items:center;gap:8px;padding:calc(12px + var(--sat,0px)) 14px 10px;border-bottom:1px solid var(--line)}.ci-lh b{flex:1;font-family:var(--serif);font-weight:600;font-size:1.2rem;color:var(--tx)}'
    +'.ci-lb{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 16px calc(16px + var(--sab,0px))}.ci-lb .set-card{margin-top:12px}.ci-lb .tog:last-child{border-bottom:none}';
    document.head.appendChild(st);
  }
  /* ── 设置 / 存档 ── */
  async function loadS(){try{var s=await ctx.storage.get('cfg');if(s&&typeof s==='object'){Object.keys(OPT).forEach(function(k){if(s[k]===undefined)return;if(OPT[k].some(function(o){return String(o[0])===String(s[k])}))S[k]=(typeof OPT[k][0][0]==='number')?Number(s[k]):String(s[k])});if(typeof s.lastAi==='string')S.lastAi=s.lastAi}}catch(e){}}
  function saveS(){try{ctx.storage.set('cfg',S)}catch(e){}}
  function filmRec(){return {key:F.key,title:F.title,name:F.name,size:F.size,dur:F.dur||0,sec:0,done:!!F.done,cfgId:sess?sess.cfgId:(F.cfgId||''),threadId:sess?sess.threadId:(F.threadId||''),subName:subName||'',subN:subs.length,updated:Date.now()}}
  function saveFilm(){if(!F)return;clearTimeout(saveT);saveT=setTimeout(function(){try{if(F)ctx.storage.set('film_'+F.key,filmRec())}catch(e){}},600)}
  /* ── 字幕：只进内存 ── */
  function decode(buf){try{return new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(e){}try{return new TextDecoder('gb18030').decode(buf)}catch(e){}return new TextDecoder('utf-8').decode(buf)}
  function tsec(t){var m=String(t).trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);if(!m)return NaN;return (parseInt(m[1]||'0',10)*3600)+(parseInt(m[2],10)*60)+parseInt(m[3],10)+parseInt(String(m[4]).padEnd(3,'0'),10)/1000}
  function parseSubs(text){
    var out=[],lines=String(text).replace(/\r\n?/g,'\n').replace(/^\uFEFF/,'').split('\n'),i=0;
    while(i<lines.length){var l=lines[i].trim();var m=l.match(/(\S+)\s+-->\s+(\S+)/);
      if(m){var s=tsec(m[1]),e=tsec(m[2]);var buf=[];i++;while(i<lines.length&&lines[i].trim()!==''){buf.push(lines[i]);i++}
        var t=buf.join('\n').replace(/<[^>]+>/g,'').replace(/\{\\[^}]*\}/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
        if(!isNaN(s)&&!isNaN(e)&&t)out.push([Math.round(s*10)/10,Math.round(e*10)/10,t.slice(0,400)]);}
      i++;}
    out.sort(function(a,b){return a[0]-b[0]});return out;
  }
  function cueAt(sec){for(var i=0;i<subs.length;i++){if(subs[i][0]<=sec&&sec<subs[i][1])return subs[i];if(subs[i][0]>sec)break}return null}
  function recentSubs(sec,n){var out=[];for(var i=subs.length-1;i>=0&&out.length<n;i--){if(subs[i][0]<=sec)out.unshift(subs[i])}return out}
  function subText(from,to){return subs.filter(function(c){return c[0]>=from&&c[0]<to}).map(function(c){return '['+fmt(c[0])+'] '+c[2].replace(/\n/g,' ')}).join('\n')}
  /* ── 发给 TA 的隐藏上下文与常量块：系统附注与对方的话明确分隔，含防幻觉边界 ── */
  function canSee(){try{return !!(sess&&ctx.chat.canSee(sess.cfgId))}catch(e){return false}}
  function evidence(frame){return (subs.length?('外挂字幕 '+subs.length+' 条'):'没有字幕')+(frame?' ＋ 此刻一帧画面':(canSee()?'':' · TA 看不到画面'))}
  function bound(frame){
    if(frame)return '[边界] 画面只说里面确实有的，画面里没有的不要补；看不清就说看不清。';
    if(!subs.length)return '[边界] 你看不到画面、也没有台词文本，只知道片名、进度和对方说的话：不要描述画面、不要编台词或剧情，只就对方说的接话，不确定就问。';
    return '[边界] 你看不到画面，只有台词文本：不要描述画面，画面里发生了什么只能从台词和对方的话里知道。';
  }
  function tail(frame){
    var sec=V?V.currentTime:(F.sec||0);var rs=recentSubs(sec,S.subN);
    var s='\n———— 以下是系统随消息附上的观影状态，不是对方说的话；对方真正说的话在最上面 ————\n【观影室】《'+F.title+'》· 进度 '+fmt(sec)+(F.dur?(' / '+fmt(F.dur)):'')+' · 证据：'+evidence(frame);
    if(rs.length)s+='\n[播放点之前最近的字幕]\n'+rs.map(function(c){return '['+fmt(c[0])+'] '+c[2].replace(/\n/g,' ')}).join('\n');
    else if(subs.length)s+='\n[播放点之前最近的字幕]\n（还没有台词）';
    if(sum.text)s+='\n[前情梗概（到 '+fmt(sum.upTo)+'）]\n'+sum.text;
    if(frame)s+='\n[画面] 随本条消息附了此刻的一帧画面（'+fmt(sec)+'）；画面里若有字幕先读字幕。';
    s+='\n'+bound(frame)+'\n[说明] 以上是这一轮你知道的全部：'+(subs.length?'字幕只到播放点为止，':'')+'后面的剧情你不知道，不预告、不猜。像坐在旁边一起看片的人那样接对方最上面那句话，一两句即可。';
    return s;
  }
  function sysBlock(){
    if(F.done)return '【观影室】你们已经一起看完《'+F.title+'》。「看完了」那条消息里附着整片梗概，那是你们一起看过的全部内容，可以聊全片了；梗概里没有的细节不要编。';
    return '【观影室】你们正在一起看《'+F.title+'》：对方在放，你陪着看。对方每条消息的末尾会有一段「系统随消息附上的观影状态」——播放点之前的字幕（如有）、进度、前情梗概，以及消息里若附了画面才有的那一帧；那不是对方说的话，对方说的话在消息最上面。播放点之后的剧情你不知道，不预告、不猜结局、不引用没给你的台词，没给你的画面不描述。回复像坐在旁边看片的人随口说的话，一两句即可，不总结不分析。';
  }
  async function updSum(){
    if(!F||!V||sumBusy||!sess||!S.sumEvery||!subs.length)return;var sec=V.currentTime||0;if(sec-sum.upTo<S.sumEvery*60)return;
    var now=Date.now();if(now-sumChk<60000)return;sumChk=now;
    var chunk=subText(sum.upTo,sec);if(chunk.length<200)return;
    sumBusy=true;var key=F.key;
    try{var t=await ctx.ai.call('把下面这段影片字幕压缩成前情梗概：只写发生了什么、人物和关系走到哪一步，300 字以内，不评论不解读，直接输出梗概。'+(sum.text?('\n\n【此前的梗概】\n'+sum.text):'')+'\n\n【新看到的字幕】\n'+chunk.slice(-12000),{cfgId:sess.cfgId,maxTokens:700});
      if(t&&F&&F.key===key){sum={text:String(t).trim().slice(0,600),upTo:Math.floor(sec)};await ctx.storage.set('sum_'+key,sum)}
    }catch(e){}finally{sumBusy=false}
  }
  /* ── 会话 ── */
  function threadOpts(){return {kind:'cinema',name:'观影室 · '+short(F.title,24),film:{title:F.title,hash:F.key,duration:F.dur||0},quiet:true,memory:true}}
  async function startSession(){
    var ai=aiList.filter(function(a){return a.id===aiId})[0];if(!ai){toast('先选一位 TA');return false}
    var tid='';try{tid=await ctx.chat.openThread(ai.id,threadOpts())}catch(e){toast('打不开观影室频道：'+String((e&&e.message)||e));return false}
    if(!host||!F)return false;
    sess={cfgId:ai.id,cfgName:ai.name,threadId:tid,count:0,startedAt:Date.now(),lastAct:Date.now(),lastNudge:0,nudgeN:0};
    F.cfgId=ai.id;F.threadId=tid;S.lastAi=ai.id;saveS();
    try{ctx.sys.set(sysBlock(),{cfgId:ai.id,data:{film:F.key,title:F.title}})}catch(e){}
    saveFilm();return true;
  }
  async function ensureThread(){if(!sess)return startSession();var cur=ctx.chat.current();if(!cur||cur.id!==sess.cfgId||cur.threadId!==sess.threadId){try{sess.threadId=await ctx.chat.openThread(sess.cfgId,threadOpts())}catch(e){toast('打不开观影室频道');return false}}return true}
  async function endSession(){if(!sess)return;sess=null;try{ctx.sys.clear()}catch(e){}}
  function mine(ev){return !!(sess&&ev&&ev.cfgId===sess.cfgId&&String(ev.threadId||'')===String(sess.threadId||''))}
  /* ── 聊天区：Chat 同一套消息行（底座 msgEl），id 序列变了才重画；TA 回话时 Chat 同款打字行＋流式 ── */
  function stripAi(t){return String(t||'').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi,' ').replace(/<(ws|mem|cal|ib|bt|am)_[a-z0-9_]*\b[^>]*>[\s\S]*?<\/(?:ws|mem|cal|ib|bt|am)_[a-z0-9_]*\s*>/gi,' ').replace(/<(ws|mem|cal|ib|bt|am)_[a-z0-9_]*\b[^>]*\/?>/gi,' ').replace(/\s+\n/g,'\n').trim()}
  function chatBox(){return q('.ci-chat')}
  function scrollBottom(){var c=chatBox();if(c)c.scrollTop=c.scrollHeight}
  function paintChat(force){
    var box=chatBox();if(!box||!sess)return;var cur=ctx.chat.current();if(!cur||cur.id!==sess.cfgId||cur.threadId!==sess.threadId)return;
    var rs=[];try{rs=ctx.chat.recent(50)||[]}catch(e){}
    var ids=rs.map(function(m){return m.id}).join(',');if(!force&&ids===chatIds)return;chatIds=ids;var sn=q('#ci-sn');if(sn)sn.textContent=rs.length+' 条';
    var keepTyp=typ&&typ.row&&typ.row.parentNode===box;if(keepTyp)box.removeChild(typ.row);
    box.innerHTML='';
    if(!rs.length){var h=document.createElement('div');h.className='ci-hello';h.textContent='播到想说的地方，在下面写给 TA；按相机键夹一帧画面一起发。'+(canSee()?'':' 这位 TA 的 API 不识图，只按字幕和进度陪看。');box.appendChild(h)}
    var prev='';rs.forEach(function(m){var el=null;try{el=ctx.ui.msgEl(m.id,prev)}catch(e){el=null}if(el)box.appendChild(el);prev=m.id});
    if(keepTyp)box.appendChild(typ.row);
    scrollBottom();
  }
  function pendOn(){
    if(pending)return;pending=true;pendAt=Date.now();var box=chatBox();if(!box)return;
    try{typ=ctx.ui.typingEl(sess?sess.cfgId:'')}catch(e){typ=null}
    if(typ&&typ.row){var sc=document.createElement('div');sc.className='ci-secs';sc.textContent='正在想…';typ.row.appendChild(sc);typ.secs=sc;box.appendChild(typ.row);scrollBottom()}
    clearInterval(pendT);pendT=setInterval(function(){if(typ&&typ.secs)typ.secs.textContent=(typ.got?'正在写…':'正在想…')},1000);
  }
  function pendOff(){clearInterval(pendT);pendT=null;pending=false;pendAt=0;if(typ&&typ.row){try{typ.row.remove()}catch(e){}}typ=null;paintChat(true)}
  function onDeltaEv(ev){
    if(!mine(ev)||!typ)return;var t=String(ev.text||''),k=String(ev.think||'');
    if(k&&typ.thWrap){typ.thWrap.style.display='';if(typ.thEl)typ.thEl.textContent=k}
    if(t&&typ.txtEl){typ.got=true;try{typ.bubble.classList.remove('typing')}catch(e){}typ.txtEl.textContent=t}
    var box=chatBox();if(box&&box.scrollHeight-box.scrollTop-box.clientHeight<160)scrollBottom();
  }
  function danmaku(text,isMine){
    var dm=q('.ci-dm');if(!dm||!S.dm)return;/* 1.10.0：普通舞台上也飞（此前 fs 恒为 false，弹幕键是死的） */var el=document.createElement('div');el.className='ci-dmi'+(isMine?' u':'');
    el.textContent=(isMine?'我：':'')+short(String(text||'').replace(/\s+/g,' '),60);
    lane=(lane+1)%6;el.style.top=(lane*15+2)+'%';el.style.animationDuration=(7+Math.min(4,el.textContent.length/12))+'s';
    dm.appendChild(el);el.addEventListener('animationend',function(){try{el.remove()}catch(e){}});
  }
  /* ── 画面：抓帧 / 留影 ── */
  function grabFrame(){try{if(!V||!V.videoWidth)return '';var vq=VQ[S.vq]||VQ.m;var w=Math.min(vq.e,V.videoWidth),h=Math.round(V.videoHeight*w/V.videoWidth);var c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(V,0,0,w,h);return c.toDataURL('image/jpeg',vq.q)}catch(e){return ''}}
  function paintChip(){var on=!!held;['.ci-chip','.ci-fchip'].forEach(function(s){var el=q(s);if(!el)return;el.classList.toggle('on',on);var im=el.querySelector('img');if(im)im.src=on?held:''});['#ci-cam','#ci-fcam'].forEach(function(s){var b=q(s);if(b)b.classList.toggle('on',on)})}
  function snap(){if(!sess||!canSee()){toast('这位 TA 的 API 不识图，留影发不了画面');return}var f=grabFrame();if(!f){toast('画面还没准备好');return}held=f;vib();paintChip();toast(S.keep?'已夹住这一帧，随下一句发出并留在聊天里':'已夹住这一帧，随下一句发给 TA（不落库）')}
  function unsnap(){held='';paintChip()}
  function curInput(){var fi=q('#ci-fin');if(fs&&fi)return fi;return q('.ci-ta')}
  async function sendNote(){
    var inp=curInput();if(!inp)return;var v=String(inp.value||'').trim();
    if(!v&&!held){toast('写点什么给 TA');return}
    if(!await ensureThread())return;
    var frame='';var seeOk=canSee();
    if(held&&seeOk)frame=held;else if(S.see==='turn'&&seeOk)frame=grabFrame();
    var text=v||'这一幕，你看到什么了？';var ex={tail:tail(!!frame)};
    if(frame){if(held&&S.keep)ex.images=[frame];else ex.ephImages=[frame]}
    inp.value='';if(inp.tagName==='TEXTAREA')inp.style.height='';unsnap();danmaku(text,true);
    try{var ok=await ctx.chat.send(text,ex);if(ok===false){toast('没有发出去');return}}catch(e){toast(String((e&&e.message)||e));return}
    paintChat();if(!sess)return;sess.count++;sess.lastAct=Date.now();sess.nudgeN=0;
  }
  function typing(){var inp=curInput();return !!(inp&&(String(inp.value||'').trim()||document.activeElement===inp))}
  async function tick(){
    if(!sess||!S.nudge||!host||!F||!V)return;var now=Date.now(),gap=S.nudge*60000;
    if(document.hidden||typing()||V.paused||V.ended||pending){sess.lastAct=now;return}
    if(now-sess.lastAct<gap||sess.nudgeN>=2||now-sess.lastNudge<Math.max(gap,600000))return;
    sess.lastNudge=now;sess.lastAct=now;sess.nudgeN++;
    var sec=fmt(V.currentTime||0);var ok=false;
    try{ok=await ctx.chat.nudge({kind:'cinema',phase:'idle',label:'看到 '+sec+' · 一直没说话',content:'[观影室] 看到 '+sec+' 了，我一直没说话。',tail:tail(false)+'\n[主动开口] 对方看了一会儿没说话，你先开口：就刚才这段说点什么，一两句，自然一点。'})}catch(e){}
    if(!ok&&sess){sess.nudgeN--;sess.lastNudge=now-Math.max(gap,600000)+30000}
  }
  /* ── 整片聊聊 ── */
  async function wrapUp(){
    if(!F||wrapBusy)return;if(F.done&&!await ctx.ui.confirm('这部片已经标过「看完了」。再发一次整片梗概？','再发一次'))return;
    if(!await ensureThread())return;
    var btn=q('#ci-wrap');wrapBusy=true;if(btn)btn.disabled=true;
    try{var text='';if(subs.length){var all=subText(0,1e9);var parts=[];for(var i=0;i<all.length;i+=9000)parts.push(all.slice(i,i+9000));var acc='';
        for(var k=0;k<parts.length;k++){if(btn)btn.textContent='梗概中 '+(k+1)+'/'+parts.length;
          acc=await ctx.ai.call('把下面这段影片字幕压缩成剧情梗概：只写发生了什么、人物和关系走到哪一步，'+(k===parts.length-1?'800':'500')+' 字以内，不评论不解读，直接输出梗概。'+(acc?('\n\n【此前的梗概】\n'+acc):'')+'\n\n【字幕】\n'+parts[k],{cfgId:sess.cfgId,maxTokens:1200});
          if(!host||!F)return}
        text=String(acc||'').trim().slice(0,1200)}
      if(V&&!V.paused)V.pause();
      F.done=true;saveFilm();try{ctx.sys.set(sysBlock(),{cfgId:sess.cfgId,data:{film:F.key,title:F.title}})}catch(e){}
      var body='看完了。'+(text?('\n\n【整片梗概】\n'+text):'');
      var t9='\n———— 以下是系统随消息附上的观影状态，不是对方说的话 ————\n【观影室】《'+F.title+'》看完了'+(F.dur?('（全长 '+fmt(F.dur)+'）'):'')+'。'+(text?'\n[说明] 上面消息正文里的整片梗概就是你们一起看过的全部内容，可以聊全片了；梗概里没有的细节不要编。':'\n[说明] 这部片没有字幕文件，梗概无从生成；你们一起看过的只有一路上的纸条，就着纸条聊，不要编剧情。');
      var ok=await ctx.chat.send(body,{tail:t9});if(ok!==false){sess.count++;sess.lastAct=Date.now();paintChat()}
      var bt=q('#ci-wrap');if(bt){bt.textContent='已看完';bt.classList.add('on')}
    }catch(e){toast('梗概失败：'+String((e&&e.message)||e))}finally{wrapBusy=false;var b2=q('#ci-wrap');if(b2){b2.disabled=false;if(!(F&&F.done))b2.textContent='整片聊聊'}}
  }
  /* ── 片库 ── */
  function aiName(id){var a=aiList.filter(function(x){return x.id===id})[0];return a?a.name:''}
  function pickAi(){var cur=ctx.chat.current();var has=function(id){return !!id&&aiList.some(function(a){return a.id===id})};
    if(has(aiId))return;if(cur&&!cur.isGroup&&has(cur.id)){aiId=cur.id;return}
    var rec=films.filter(function(f){return has(f.cfgId)})[0];if(rec){aiId=rec.cfgId;return}
    if(has(S.lastAi)){aiId=S.lastAi;return}aiId=aiList[0]?aiList[0].id:''}
  function filmCard(f){
    return '<div class="ci-card go" data-key="'+esc(f.key)+'"><div class="ci-tile"><b>'+(f.done?'END':'▶')+'</b><small>'+(f.done?'seen':'watched')+'</small></div>'
      +'<div class="ci-cm"><div class="ci-ct">'+esc(f.title)+'</div><div class="ci-cs">'+(f.done?'已看完':'看过')+(f.dur?(' · 全长 '+fmt(f.dur)):'')+(f.cfgId?(' · 和 '+esc(aiName(f.cfgId)||'TA')+' 一起'):'')+'</div>'
      +'<div class="ci-meta">'+(f.subName?('<span class="ci-pill">字幕 '+esc(short(f.subName,18))+'</span>'):'<span class="ci-pill">无字幕</span>')+'<span>'+esc(short(f.name||'',30))+'</span></div>'
      +'<div class="ci-cs dim">视频不入库、不记进度：点开后重选这个文件即从头再看</div></div><span class="ci-x" data-del="'+esc(f.key)+'" title="删除记录">×</span></div>';
  }
  async function paintLib(){
    if(!host)return;host.innerHTML='<div class="ci"><div class="ci-lib"><div class="ci-empty">读取片库…</div></div></div>';
    films=[];try{var ks=await ctx.storage.list();for(var i=0;i<ks.length;i++){if(String(ks[i]).indexOf('film_')===0){var v=await ctx.storage.get(ks[i]);if(v&&v.key)films.push(v)}}}catch(e){}
    films.sort(function(a,b){return (b.updated||0)-(a.updated||0)});
    try{aiList=(await ctx.chat.list()).filter(function(a){return !a.isGroup})}catch(e){aiList=[]}
    if(!host)return;
    pickAi();
    host.innerHTML='<div class="ci"><div class="ci-lib">'
      +'<div class="ci-top"><button class="ci-mini" id="ci-close">← 关闭</button><div class="ci-tt">观影室<small>Cinema</small></div></div>'
      +'<div class="ci-who"><div class="f-group"><label>和谁一起看</label><div class="sel"><select id="ci-ai">'+(aiList.length?aiList.map(function(a){return '<option value="'+esc(a.id)+'"'+(a.id===aiId?' selected':'')+'>'+esc(a.name)+'</option>'}).join(''):'<option value="">还没有 1对1 对话</option>')+'</select></div></div>'
      +'<button class="ci-pick" id="ci-pick"><svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M10 9.5v5l4.2-2.5z"/></svg>选一部片</button>'
      +'<input type="file" id="ci-file" accept="video/*" style="display:none"><input type="file" id="ci-sub" accept=".srt,.vtt,text/vtt,text/plain" style="display:none"></div>'
      +'<div id="ci-pend"></div>'
      +'<div class="ci-lab">观影历史</div><div id="ci-films">'+(films.length?films.map(filmCard).join(''):'<div class="ci-empty">还没有一起看过的片。选一段手机里的视频开始。</div>')+'</div>'
      +'<div class="ci-empty" style="padding:8px 4px 0;font-size:0.68rem;color:var(--tx3)">视频与字幕都不入库，也不记进度，只记片名与文件名；历史里的片点开后重选同一个文件即从头再看 · 聊天落在 TA 的「观影室 · 片名」频道里 · 在线平台与 DRM 内容不支持</div>'
      +'</div></div>';
    q('#ci-close').addEventListener('click',function(){ctx.ui.close()});
    var sel=q('#ci-ai');if(sel)sel.addEventListener('change',function(){aiId=sel.value;if(pend)paintPending()});
    var fi=q('#ci-file');q('#ci-pick').addEventListener('click',function(){pend=null;var b=q('#ci-pend');if(b)b.innerHTML='';fi.click()});
    fi.addEventListener('change',function(){var f=fi.files&&fi.files[0];fi.value='';if(f)pickFilm(f)});
    q('#ci-sub').addEventListener('change',function(){var inp=q('#ci-sub');var f=inp&&inp.files&&inp.files[0];if(inp)inp.value='';if(f)loadSubFile(f)});
    Array.prototype.forEach.call(host.querySelectorAll('.ci-card.go'),function(r){r.addEventListener('click',function(ev){var x=ev.target.closest('.ci-x');if(x){delFilm(x.getAttribute('data-del'));return}var key=r.getAttribute('data-key');var rec=films.filter(function(f){return f.key===key})[0];if(!rec)return;
      if(rec.cfgId&&aiList.some(function(a){return a.id===rec.cfgId})){aiId=rec.cfgId;var s2=q('#ci-ai');if(s2)s2.value=aiId}
      /* 1.4.0：先出待开始卡，卡上的按钮才弹文件选择器——此前点记录直接弹选择器，像是打不开 */
      pend={file:null,key:rec.key,title:rec.title,size:rec.size,rec:rec,sub:SUBS[rec.key]||null};paintPending();
      var pb=q('#ci-pend');if(pb){try{pb.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}})});
    if(pend)paintPending();
  }
  async function delFilm(key){var rec=films.filter(function(f){return f.key===key})[0];
    if(!await ctx.ui.confirm('删除这部片的观影记录？'+((rec&&rec.threadId)?('它的「观影室 · '+short(rec.title||'',16)+'」频道和里面的聊天会一起删除。'):'')+'此操作不可恢复。','删除'))return;
    if(rec&&rec.threadId){try{await ctx.chat.deleteThread(rec.threadId)}catch(e){}}
    for(var i=0,ks=['film_','sum_','sub_','notes_'];i<ks.length;i++){try{await ctx.storage.remove(ks[i]+key)}catch(e){}}delete SUBS[key];if(pend&&pend.key===key)pend=null;paintLib()}
  async function pickFilm(file){var base=keyOf(file),key,rec=null;/* 1.12.0：「选一部片」一律新开一条记录与频道（key 带时间后缀，同一部片可以有多条记录，各自一条频道）；只有从观影历史点那条记录再看，才接着原来的记录与频道 */
    if(pend&&pend.rec&&!pend.file){var rk=String(pend.rec.key||'');
      if(rk===base||rk.indexOf(base+'_')===0){key=rk;rec=pend.rec}
      else{toast('这不是上次那个文件（上次是 '+short(pend.rec.name||'',20)+'），按新片开始');key=base+'_'+Date.now().toString(36)}
    }else key=base+'_'+Date.now().toString(36);
    pend={file:file,key:key,title:rec?rec.title:titleOf(file.name),size:file.size,rec:rec,sub:SUBS[key]||null};if(!host)return;paintPending()}
  function paintPending(){
    var box=q('#ci-pend');if(!box||!pend)return;var rec=pend.rec,f=pend.file;
    var szMb=(pend.size/1048576).toFixed(1);
    if(!f){/* 只有记录、还没重选文件：先把上次的情况摆出来，按钮才弹选择器 */
      box.innerHTML='<div class="ci-lab">待开始</div><div class="ci-card"><div class="ci-tile"><b>'+(rec&&rec.done?'END':'▶')+'</b><small>'+(rec&&rec.done?'seen':'again')+'</small></div>'
        +'<div class="ci-cm"><div class="ci-ct">'+esc(pend.title)+'</div><div class="ci-cs">'+esc(short(rec.name||'',40))+' · '+szMb+' MB · 和 <i>'+esc(aiName(aiId)||'TA')+'</i> 一起看<br>'+(rec.done?'上次已看完，':'')+'重选文件后从头再看（不记进度）</div>'
        +'<div class="ci-cs" style="margin-top:6px">'+(pend.sub?('字幕：'+esc(short(pend.sub.name,30))+' · '+pend.sub.cues.length+' 条'):((rec&&rec.subName)?('上次用的字幕：'+esc(short(rec.subName,30))+'（字幕不入库，选好视频后再选一次）'):'上次没有字幕'))+'</div>'
        +'<div class="ci-btns"><button class="ci-mini acc" id="ci-repick2">选这个视频文件</button><button class="ci-mini" id="ci-cancel">取消</button></div>'
        +'<div class="ci-cs dim" style="margin-top:8px">视频文件不入库、不记进度，每次都要从手机里重选同一个（文件名 '+esc(short(rec.name||'',24))+'）。</div></div></div>';
      q('#ci-repick2').addEventListener('click',function(){var fi=q('#ci-file');if(fi)fi.click()});
      q('#ci-cancel').addEventListener('click',function(){pend=null;box.innerHTML=''});
      return;
    }
    box.innerHTML='<div class="ci-lab">待开始</div><div class="ci-card"><div class="ci-tile"><b>NEW</b><small>film</small></div>'
      +'<div class="ci-cm"><input class="ci-ti" id="ci-title" maxlength="60" value="'+esc(pend.title)+'" placeholder="片名"><div class="ci-cs">'+esc(short(f.name,40))+' · '+szMb+' MB · 和 <i>'+esc(aiName(aiId)||'TA')+'</i> 一起看</div>'
      +'<div class="ci-cs" style="margin-top:6px">'+(pend.sub?('字幕：'+esc(short(pend.sub.name,30))+' · '+pend.sub.cues.length+' 条'):((rec&&rec.subName)?('上次用的字幕：'+esc(short(rec.subName,30))+'（字幕不入库，再选一次）'):'还没有字幕文件（.srt / .vtt）'))+'</div>'
      +'<div class="ci-btns"><button class="ci-mini" id="ci-pick-sub">'+(pend.sub?'换字幕文件':'选字幕文件')+'</button><button class="ci-mini acc" id="ci-start">'+(pend.sub?'开始':'没有字幕，直接开始')+'</button><button class="ci-mini" id="ci-cancel">取消</button></div></div></div>';
    q('#ci-title').addEventListener('input',function(ev){pend.title=String(ev.target.value||'').trim().slice(0,60)||titleOf(pend.file.name)});
    q('#ci-pick-sub').addEventListener('click',function(){q('#ci-sub').click()});
    q('#ci-start').addEventListener('click',function(){startFilm()});
    q('#ci-cancel').addEventListener('click',function(){pend=null;box.innerHTML=''});
  }
  async function loadSubFile(file){
    if(!pend||!pend.file){toast('先选好视频文件，再选字幕');return}try{var buf=await file.arrayBuffer();var cues=parseSubs(decode(buf));if(!cues.length){toast('没读到字幕（认 .srt / .vtt 的时间轴格式）');return}pend.sub={name:file.name,cues:cues};SUBS[pend.key]=pend.sub;toast('字幕 '+cues.length+' 条（只进内存，不入库）');paintPending()}catch(e){toast('字幕读取失败')}
  }
  /* ── 视频读取：先探「能不能从文件中间读」，不行就顺序整个读进内存（不 slice、不 seek）再喂播放器；行就直挂 ──
     安卓浏览器 / WebView 从系统选择器拿到的 content:// 文件，在有些机器上不支持随机读：顺序播放没事，续播 / 拖进度条 / «10 10» 一 seek 播放器就报错，分块 slice 读也报 NotReadableError（「新片能放、看过的不能放、删掉记录就能放」就是这个）。 */
  function setBusy(t){var bz=q('.ci-vbusy');if(!bz)return;bz.textContent=t||'';bz.classList.toggle('on',!!t)}
  function setFail(msg,detail){var vf=q('.ci-vfail'),vm=q('#ci-vmsg'),vd=q('#ci-vdet');if(vm)vm.textContent=msg;if(vd)vd.textContent=detail||'';if(vf)vf.classList.add('on');setBusy('')}
  function clearFail(){var vf=q('.ci-vfail');if(vf)vf.classList.remove('on')}
  function armWatchdog(){clearTimeout(wdT);wdT=setTimeout(function(){if(V&&V.readyState<1)loadFail('timeout')},20000)}
  function attach(url){if(!V)return;clearFail();try{V.src=url;V.load()}catch(e){}try{V.playbackRate=S.rate||1}catch(e){}armWatchdog()}
  function errInfo(){var code=(V&&V.error&&V.error.code)||0,msg=String((V&&V.error&&V.error.message)||'').trim();var why={1:'读取被中断',2:'读文件失败（文件现在读不到，可能换过位置或被删了）',3:'解码失败（这台机器解不了这个编码；mp4 / H.264 最稳）',4:'播放器打不开这个文件（读不到数据，或容器 / 编码不支持）'}[code]||'读不出来';return {code:code,why:why,msg:msg}}
  async function probeSeek(file){if(!file||file.size<65536)return true;try{var b=await file.slice(file.size-4096,file.size).arrayBuffer();return !!(b&&b.byteLength)}catch(e){return false}}
  async function probeLazy(){/* 1.11.0：开播后才探一次「能不能从文件中间读」；只决定要不要禁拖进度，不碰播放 */
    if(!F||!F.file||F.seekOk!==undefined)return;var key=F.key;var ok=await probeSeek(F.file);if(!F||F.key!==key)return;F.seekOk=ok;
    if(!ok)toast('这台机器读不了文件中间：只能顺着放，拖不了进度条');
  }
  function attachStart(){/* 开播入口：一律直挂，不读进内存 */if(!F||!V||!F.file)return;attach(F.url)}
  function loadFail(kind){
    if(!F||!V)return;clearTimeout(wdT);
    var ei=kind==='timeout'?{code:0,why:'二十秒了还没读出元数据',msg:''}:errInfo();
    setFail('视频打不开：'+ei.why+'。这个文件是按原样直接交给播放器的（不读进内存）；如果这台机器的文件选择器给的文件不支持从中间读、而视频的索引又在文件尾，就会这样——换一段视频，或从系统「文件」App 的路径重选试试；mp4 / H.264 最稳。',ei.msg?('播放器原话：'+ei.msg):'');
  }
  /* ── 放映 ── */
  function releaseVideo(){try{exitFs()}catch(e){}try{if(V){V.pause();V.removeAttribute('src');V.load()}}catch(e){}try{if(F&&F.url)URL.revokeObjectURL(F.url)}catch(e){}V=null}
  async function startFilm(){
    if(!pend||!pend.file||!aiId){toast(!aiId?'先选一位 TA':'先选一部片');return}
    var p=pend;pend=null;
    F={key:p.key,title:p.title,name:p.file.name,size:p.size,dur:(p.rec&&p.rec.dur)||0,sec:0,done:!!(p.rec&&p.rec.done),file:p.file,url:URL.createObjectURL(p.file),seekOk:undefined};/* 1.5.0：不续播，每次从头；1.11.0：seekOk 开播后才探 */
    subs=p.sub?p.sub.cues:[];subName=p.sub?p.sub.name:'';held='';chatIds='';
    sum={text:'',upTo:0};try{var sv=await ctx.storage.get('sum_'+F.key);if(sv&&typeof sv==='object')sum={text:String(sv.text||''),upTo:Number(sv.upTo)||0}}catch(e){}
    if(!host||!F)return;
    paintPlayer();
    if(!await startSession()){leaveFilm();if(host)paintLib();return}
    var cb=q('#ci-cam');if(!canSee()){if(cb)cb.disabled=true;toast('这位 TA 的 API 不识图：看不到画面，只按字幕和进度陪看')}
    paintChat(true);try{if(ctx.chat.busy(sess.cfgId))pendOn()}catch(e){}
  }
  /* ── 全屏（只在网页形态）：舞台整块交给 Fullscreen API，方向经 screen.orientation.lock；浏览器不放行时退回固定层 ── */
  function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement||null}
  function lockOri(mode){fsMode=mode;try{if(screen.orientation&&screen.orientation.lock){var p=screen.orientation.lock(mode);if(p&&p.catch)p.catch(function(){})}}catch(e){}}
  function enterFs(){if(fs||!FS_OK)return;var ci=q('.ci'),st=q('.ci-stage');if(!ci||!st)return;fs=true;ci.classList.add('fs');
    var mode=(S.fsOri==='landscape'||S.fsOri==='portrait')?S.fsOri:((V&&V.videoWidth&&V.videoHeight>V.videoWidth)?'portrait':'landscape');
    var p=null;try{if(st.requestFullscreen)p=st.requestFullscreen({navigationUI:'hide'});else if(st.webkitRequestFullscreen){st.webkitRequestFullscreen();p=Promise.resolve()}}catch(e){p=null}
    if(p&&p.then)p.then(function(){lockOri(mode)},function(){lockOri(mode)});else lockOri(mode);
    var fb=q('#ci-full');if(fb){fb.innerHTML=IC.fx;fb.classList.add('on')}paintChip();showUi()}
  function exitFs(){if(!fs)return;fs=false;var ci=q('.ci');if(ci)ci.classList.remove('fs');fsMode='';
    try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock()}catch(e){}
    try{if(fsEl()){if(document.exitFullscreen){var p=document.exitFullscreen();if(p&&p.catch)p.catch(function(){})}else if(document.webkitExitFullscreen)document.webkitExitFullscreen()}}catch(e){}
    var fb=q('#ci-full');if(fb){fb.innerHTML=IC.fs;fb.classList.remove('on')}paintChip();var st=q('.ci-stage');if(st&&V&&!V.paused)st.classList.remove('ui')}
  function rotFs(){if(!fs)return;lockOri(fsMode==='portrait'?'landscape':'portrait');showUi()}
  function onFsChange(){if(fs&&!fsEl())exitFs()}/* 浏览器侧退出（返回键 / ESC）也同步 */
  function showUi(){var st=q('.ci-stage');if(!st)return;st.classList.add('ui');clearTimeout(uiT);uiT=setTimeout(function(){var s2=q('.ci-stage');var ae=document.activeElement;if(s2&&V&&!V.paused&&!(ae&&ae.id==='ci-fin'))s2.classList.remove('ui')},3500)}
  function hideUi(){var st=q('.ci-stage');if(st)st.classList.remove('ui');clearTimeout(uiT)}
  function rateLabel(){var r=Number(S.rate)||1;return (r===1?'倍速':(r+'×'))}
  function cycleRate(){var rs=OPT.rate.map(function(o){return o[0]});var i=rs.indexOf(Number(S.rate)||1);S.rate=rs[(i+1)%rs.length];saveS();try{if(V)V.playbackRate=S.rate}catch(e){}var b=q('#ci-rate');if(b){b.textContent=rateLabel();b.classList.toggle('on',S.rate!==1)}}
  function paintPlayer(){
    var ai=aiList.filter(function(a){return a.id===aiId})[0];var an=ai?ai.name:'';
    var av='';try{var _a9=ctx.chat.avatars?ctx.chat.avatars(aiId):'';av=(typeof _a9==='string')?_a9:((_a9&&(_a9.ai||_a9.friend||_a9.url||_a9.src))||'');if(!/^(data:|blob:|https?:)/.test(String(av)))av=''}catch(e){}
    host.innerHTML='<div class="ci">'
      +'<div class="ci-stage"><video playsinline webkit-playsinline preload="metadata" poster="data:image/gif;base64,R0lGODlhAQABAAAAACw="></video><div class="ci-cc"'+(S.cc?'':' hidden')+'></div><div class="ci-dm"></div>'
      +'<div class="ci-vfail"><span id="ci-vmsg"></span><small id="ci-vdet"></small><div class="ci-btns"><button class="ci-mini" id="ci-repick">重选文件</button></div></div><div class="ci-vbusy"></div>'
      +'<div class="ci-ui"><div class="ci-utop"><button class="ci-fb ic" id="ci-back" aria-label="返回"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><div class="ci-ut">'+esc(F.title)+'</div><button class="ci-fb'+(F.done?' on':'')+'" id="ci-wrap">'+(F.done?'已看完':'整片聊聊')+'</button><button class="ci-fb ic" id="ci-gear" aria-label="设置">⋯</button></div>'
      +'<div class="ci-umid" id="ci-pp">'+IC.play+'</div>'
      +'<div class="ci-ubot"><div class="ci-frow"><span class="ci-ftime" id="ci-cur">'+fmt(F.sec||0)+'</span><div class="ci-bar" id="ci-prog"><i><b></b><s></s></i></div><span class="ci-ftime" id="ci-dur">'+(F.dur?fmt(F.dur):'--:--')+'</span></div>'
      +'<div class="ci-frow ci-fctl"><button class="ci-fb ic pp fso" id="ci-pp2" aria-label="播放 / 暂停">'+IC.play+'</button><button class="ci-fb" id="ci-b10">«10</button><button class="ci-fb" id="ci-f10">10»</button><button class="ci-fb'+(S.dm?' on':'')+'" id="ci-dmb">弹幕</button>'
      +''
      +'<span class="sp"></span><button class="ci-fb rg'+(S.rate!==1?' on':'')+'" id="ci-rate">'+rateLabel()+'</button><button class="ci-fb ic rg'+(S.cc?' on':'')+'" id="ci-ccb" title="舞台字幕">'+IC.cc+'</button>'+(FS_OK?('<button class="ci-fb ic rg fso" id="ci-rot" title="转屏">'+IC.rot+'</button><button class="ci-fb ic rg" id="ci-full" title="全屏">'+IC.fs+'</button>'):'')+'</div>'
      +(FS_OK?'<div class="ci-frow fso ci-fin"><span class="ci-fchip"><img alt=""></span><button class="ci-fb ic" id="ci-fcam" title="留影">'+IC.cam+'</button><input id="ci-fin" placeholder="边看边说给 TA…" autocomplete="off"><button class="ci-fb" id="ci-fsend">寄出</button></div>':'')+'</div></div></div>'
      +'<div class="ci-strip"><span class="ci-sav">'+(av?('<img src="'+esc(av)+'" alt="">'):esc((an||'?').charAt(0)))+'</span><span class="ci-stx">与 '+esc(an||'TA')+' 一起看</span><span class="ci-stm" id="ci-stm">0:00 / '+(F.dur?fmt(F.dur):'--:--')+'</span><span class="ci-sn" id="ci-sn">0 条</span></div>'
      +'<div class="ci-chat"></div>'
      +'<div class="cv-input glass ci-in"><span class="ci-chip"><img alt=""><span id="ci-chip-x">×</span></span><button class="cv-mini" id="ci-cam" title="留影：夹住这一帧随下一句发出">'+IC.cam+'</button><textarea class="ci-ta" rows="1" placeholder="边看边说给 TA…"></textarea><button class="send-btn" id="ci-send" aria-label="寄出">'+IC.send+'</button></div>'
      +'</div>';
    var ci=q('.ci');ci.style.setProperty('--ci-mh',STAGE[S.stage]||STAGE.m);
    V=q('video');attachStart();
    var stage=q('.ci-stage'),cc=q('.ci-cc'),bar=q('#ci-prog'),curEl=q('#ci-cur'),durEl=q('#ci-dur');
    function paintTime(){if(!V)return;var d=V.duration||F.dur||0,c=V.currentTime||0;var p=d?Math.min(100,c/d*100):0;if(bar){bar.querySelector('b').style.width=p+'%';bar.querySelector('s').style.left=p+'%'}if(curEl)curEl.textContent=fmt(c);if(d&&durEl)durEl.textContent=fmt(d);var stm=q('#ci-stm');if(stm)stm.textContent=fmt(c)+' / '+(d?fmt(d):'--:--');var cue=cueAt(c);if(cc)cc.textContent=cue?cue[2]:'';var ic=V.paused?IC.play:IC.pause;var pp=q('#ci-pp');if(pp)pp.innerHTML=ic;var pp2=q('#ci-pp2');if(pp2)pp2.innerHTML=ic}
    V.addEventListener('loadedmetadata',function(){if(!V||!F)return;clearTimeout(wdT);setBusy('');clearFail();var st9=q('.ci-stage');if(st9)st9.classList.add('ready');if(V.videoWidth&&V.videoHeight){var ar=Math.max(0.3,Math.min(3.2,V.videoWidth/V.videoHeight));var c2=q('.ci');if(c2)c2.style.setProperty('--ci-ar',String(Math.round(ar*10000)/10000))}if(isFinite(V.duration)&&V.duration){F.dur=Math.floor(V.duration)}paintTime();showUi();saveFilm();probeLazy()});/* 1.5.0：不续播；1.11.0：元数据读出后才探能否随机读 */
    V.addEventListener('timeupdate',function(){if(!V||!F)return;paintTime();updSum()});/* 1.5.0：不记进度 */
    V.addEventListener('play',function(){paintTime();showUi();if(sess)sess.lastAct=Date.now()});
    V.addEventListener('pause',function(){paintTime();showUi()});
    V.addEventListener('ended',function(){paintTime();showUi();if(F&&!F.done)toast('播完了，可以按「整片聊聊」')});
    V.addEventListener('error',function(){loadFail('error')});
    q('#ci-repick').addEventListener('click',async function(ev){ev.stopPropagation();var rec=filmRec();await leaveFilm();if(!host)return;await paintLib();var r2=films.filter(function(f){return f.key===rec.key})[0];pend={file:null,key:rec.key,title:rec.title,size:rec.size,rec:r2||rec,sub:SUBS[rec.key]||null};paintPending();var fi=q('#ci-file');if(fi)fi.click()});
    function togglePlay(){if(!V)return;if(V.paused)V.play().catch(function(){toast('播放失败')});else V.pause()}
    stage.addEventListener('click',function(ev){if(ev.target.closest('.ci-ubot,.ci-utop,.ci-vfail,.ci-umid'))return;if(stage.classList.contains('ui')&&V&&!V.paused)hideUi();else showUi()});
    q('#ci-pp').addEventListener('click',function(ev){ev.stopPropagation();togglePlay();showUi()});
    q('#ci-pp2').addEventListener('click',function(ev){ev.stopPropagation();togglePlay();showUi()});
    function canSeek(){if(F&&F.seekOk===false){toast('这台机器读不了文件中间，拖不了进度，只能顺着放');return false}if(F&&F.seekOk===undefined){probeLazy();toast('正在看这段视频能不能拖…');return false}return true}/* 1.11.0：探完之前不放行 seek——探不通过的文件一 seek 播放器就会报错 */
    function seekAt(x){if(!canSeek())return;var r=bar.getBoundingClientRect();var p=Math.max(0,Math.min(1,(x-r.left)/Math.max(1,r.width)));var d=V.duration||F.dur||0;if(d){try{V.currentTime=p*d}catch(e){}paintTime()}}
    bar.addEventListener('pointerdown',function(ev){ev.stopPropagation();dragging=true;try{bar.setPointerCapture(ev.pointerId)}catch(e){}seekAt(ev.clientX);showUi()});
    bar.addEventListener('pointermove',function(ev){if(dragging){seekAt(ev.clientX);showUi()}});
    bar.addEventListener('pointerup',function(){dragging=false});bar.addEventListener('pointercancel',function(){dragging=false});bar.addEventListener('click',function(ev){ev.stopPropagation()});
    q('#ci-back').addEventListener('click',async function(ev){ev.stopPropagation();if(fs){exitFs();showUi();return}await leaveFilm();if(host)paintLib()});
    q('#ci-gear').addEventListener('click',function(ev){ev.stopPropagation();openSettings()});
    q('#ci-wrap').addEventListener('click',function(ev){ev.stopPropagation();wrapUp();showUi()});
    q('#ci-b10').addEventListener('click',function(ev){ev.stopPropagation();if(!canSeek())return;try{V.currentTime=Math.max(0,(V.currentTime||0)-10)}catch(e){}paintTime();showUi()});
    q('#ci-f10').addEventListener('click',function(ev){ev.stopPropagation();if(!canSeek())return;try{V.currentTime=Math.min((V.duration||F.dur||1e9),(V.currentTime||0)+10)}catch(e){}paintTime();showUi()});
    q('#ci-ccb').addEventListener('click',function(ev){ev.stopPropagation();S.cc=S.cc?0:1;saveS();var c3=q('.ci-cc');if(c3)c3.hidden=!S.cc;ev.currentTarget.classList.toggle('on',!!S.cc);showUi()});
    q('#ci-dmb').addEventListener('click',function(ev){ev.stopPropagation();S.dm=S.dm?0:1;saveS();ev.currentTarget.classList.toggle('on',!!S.dm);showUi()});
    q('#ci-rate').addEventListener('click',function(ev){ev.stopPropagation();cycleRate();showUi()});
    q('#ci-send').addEventListener('click',sendNote);
    if(FS_OK){var fb9=q('#ci-full');if(fb9)fb9.addEventListener('click',function(ev){ev.stopPropagation();if(fs)exitFs();else enterFs()});
      var rb9=q('#ci-rot');if(rb9)rb9.addEventListener('click',function(ev){ev.stopPropagation();rotFs()});
      var fs9=q('#ci-fsend');if(fs9)fs9.addEventListener('click',function(ev){ev.stopPropagation();sendNote();showUi()});
      var fc9=q('#ci-fcam');if(fc9)fc9.addEventListener('click',function(ev){ev.stopPropagation();if(held)unsnap();else snap();showUi()});
      var fi9=q('#ci-fin');if(fi9){fi9.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();sendNote()}});fi9.addEventListener('input',function(){if(sess)sess.lastAct=Date.now();showUi()});fi9.addEventListener('focus',showUi);fi9.addEventListener('click',function(ev){ev.stopPropagation()})}
      var fr9=q('.ci-fin');if(fr9)fr9.addEventListener('click',function(ev){ev.stopPropagation()})}
    q('#ci-cam').addEventListener('click',function(){if(held)unsnap();else snap()});
    q('#ci-chip-x').addEventListener('click',function(ev){ev.stopPropagation();unsnap()});
    var ta=q('.ci-ta');ta.addEventListener('input',function(){ta.style.height='';ta.style.height=Math.min(110,ta.scrollHeight)+'px';if(sess)sess.lastAct=Date.now()});
    paintChip();showUi();
  }
  function closeLay(){var l=q('.ci-lay');if(l)l.remove()}
  function openSettings(){
    closeLay();var ci=q('.ci');if(!ci)return;var lay=document.createElement('div');lay.className='ci-lay';
    var h='<div class="ci-lh"><b>观影室设置</b><button class="ci-mini" id="ci-lay-x">完成</button></div><div class="ci-lb">';
    CARDS.forEach(function(card){
      h+='<div class="ci-lab">'+esc(card[0])+'</div><div class="set-card">';
      card[1].forEach(function(r){var k=r[1];if(k==='fsOri'&&!FS_OK)return;
        if(r[0]==='sel')h+='<div class="f-group"><label>'+esc(r[2])+(r[3]?('<span class="lb-note"> · '+esc(r[3])+'</span>'):'')+'</label><div class="sel"><select data-k="'+k+'">'+OPT[k].map(function(o){return '<option value="'+esc(o[0])+'"'+(String(S[k])===String(o[0])?' selected':'')+'>'+esc(o[1])+'</option>'}).join('')+'</select></div></div>';
        else h+='<div class="tog"><div class="tog-m"><div class="tog-t">'+esc(r[2])+'</div>'+(r[3]?('<div class="tog-s">'+esc(r[3])+'</div>'):'')+'</div><div class="sw2'+(S[k]?' on':'')+'" data-k="'+k+'" role="switch"></div></div>';
      });
      h+='</div>';
    });
    h+='<div class="ci-empty" style="padding:12px 4px;font-size:0.68rem">'+(F?('本片证据：'+evidence(false)+(subName?(' · '+esc(short(subName,30))):'')+(F.seekOk===false?' · 这台机器读不了文件中间，只能顺着放':'')+'<br>'):'')+'视频与字幕不入库；设置随备份走。</div></div>';
    lay.innerHTML=h;ci.appendChild(lay);
    lay.querySelector('#ci-lay-x').addEventListener('click',closeLay);
    Array.prototype.forEach.call(lay.querySelectorAll('select[data-k]'),function(sel){sel.addEventListener('change',function(){apply(sel.getAttribute('data-k'),sel.value)})});
    Array.prototype.forEach.call(lay.querySelectorAll('.sw2[data-k]'),function(sw){sw.addEventListener('click',function(){var k=sw.getAttribute('data-k');apply(k,S[k]?0:1);sw.classList.toggle('on',!!S[k])})});
    function apply(k,raw){if(!OPT[k])return;S[k]=(typeof OPT[k][0][0]==='number')?Number(raw):String(raw);saveS();
      if(k==='cc'){var c3=q('.ci-cc');if(c3)c3.hidden=!S.cc;var b3=q('#ci-ccb');if(b3)b3.classList.toggle('on',!!S.cc)}
      else if(k==='dm'){var b4=q('#ci-dmb');if(b4)b4.classList.toggle('on',!!S.dm)}
      else if(k==='rate'){try{if(V)V.playbackRate=S.rate||1}catch(e){}}
      else if(k==='stage'){var c4=q('.ci');if(c4)c4.style.setProperty('--ci-mh',STAGE[S.stage]||STAGE.m)}
      else if(k==='nudge'&&sess)sess.lastAct=Date.now()}
  }
  async function leaveFilm(){clearTimeout(saveT);clearTimeout(wdT);clearTimeout(uiT);clearInterval(pendT);pending=false;typ=null;if(F){try{await ctx.storage.set('film_'+F.key,filmRec())}catch(e){}}if(sess)await endSession();releaseVideo();F=null;subs=[];subName='';sum={text:'',upTo:0};lastSaved=-1;wrapBusy=false;held='';chatIds=''}
  IBApps.register({
    id:'cinema',name:'观影室',version:'1.12.0',sdk:2,wall:true,headless:true,
    icon:'<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 9.5h17M7.5 6v12M16.5 6v12"/><path d="M10.8 11v4l3.4-2z"/>',
    mount:async function(h,c){
      host=h;ctx=c;css();host.style.padding='0';host.style.overflow='hidden';host.style.display='flex';host.style.flexDirection='column';
      await loadS();if(!host)return;
      onMsg=function(am){if(!sess||!am||am.role!=='assistant'||am.threadId!==sess.threadId)return;if(am.friendId&&am.friendId!==sess.cfgId)return;sess.count++;sess.lastAct=Date.now();if(typ&&typ.row){try{typ.row.remove()}catch(e){}typ=null}paintChat(true);danmaku(stripAi(am.content),false)};
      onTurn=function(ev){if(!mine(ev))return;if(ev.state==='start')pendOn();else if(ev.state==='end')pendOff()};
      onDelta=function(ev){onDeltaEv(ev)};
      ctx.on('message',onMsg);ctx.on('turn',onTurn);ctx.on('delta',onDelta);
      onVis=function(){if(!document.hidden&&sess)sess.lastAct=Date.now()};document.addEventListener('visibilitychange',onVis);
      if(FS_OK){onFsc=function(){onFsChange()};document.addEventListener('fullscreenchange',onFsc);document.addEventListener('webkitfullscreenchange',onFsc)}
      tickT=setInterval(function(){tick()},15000);
      await paintLib();
    },
    back:function(){var l=q('.ci-lay');if(l){l.remove();return true}if(fs){exitFs();return true}return false},
    unmount:function(){
      try{if(onMsg)ctx.off('message',onMsg);if(onTurn)ctx.off('turn',onTurn);if(onDelta)ctx.off('delta',onDelta)}catch(e){}try{document.removeEventListener('visibilitychange',onVis)}catch(e){}try{if(onFsc){document.removeEventListener('fullscreenchange',onFsc);document.removeEventListener('webkitfullscreenchange',onFsc)}}catch(e){}
      clearInterval(tickT);clearTimeout(saveT);clearTimeout(uiT);clearTimeout(wdT);clearInterval(pendT);
      if(F){try{ctx.storage.set('film_'+F.key,filmRec())}catch(e){}}
      if(sess){endSession()}
      releaseVideo();F=null;subs=[];subName='';sum={text:'',upTo:0};pend=null;held='';typ=null;pending=false;chatIds='';host=null;
    }
  });
})();
