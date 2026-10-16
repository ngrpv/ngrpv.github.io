'use strict';
/* ---------- правила ----------
   Каждое правило проверяется «Сверкой»: поле+поле, поле+пункт, поле+сегодня или одно нажатие (req).
   need — правило-документ, без которого это правило не имеет смысла; odd — только в нечётный день. */
const OTHER=['application','receipt','snils','zhiv'];
const otherDocs=v=>OTHER.map(k=>v.docs[k]).filter(Boolean);
const fioS=f=>`${f.s} ${f.n} ${f.p}`;
let G={};
const VMAP={'а':'о','о':'а','е':'и','и':'е','у':'ю','я':'а','ы':'и'};
function mutFio(fio){const g={...fio};const ks=['s','n','p'].filter(k=>g[k].includes('ё'));if(ks.length){const k=pick(ks);g[k]=g[k].replace('ё','е');return g}const k=pick(['s','s','n','p']);const w=g[k];const idx=[...w].map((c,i)=>i>0&&VMAP[c]?i:-1).filter(i=>i>0);if(idx.length){const i=pick(idx);g[k]=w.slice(0,i)+VMAP[w[i]]+w.slice(i+1)}else g[k]=w+'а';return g}
const P=()=>S.run.params;
const payHour=r=>+r.time.slice(0,2);
const RULES={
  R_FIO:{core:1,text:'Ф. И. О. во всех документах совпадают с паспортом. Е и Ё — разные буквы.',reason:'ФИО не совпадает с паспортом',kinds:['fio'],
    check:v=>otherDocs(v).some(d=>d.fio&&fioS(d.fio)!==fioS(v.docs.passport.fio)),
    inject:v=>{const ds=otherDocs(v).filter(d=>d.fio);if(!ds.length)return false;const d=pick(ds);if(d===v.docs.receipt&&chance(.35)){d.fio={...d.fio,n:pick(v.sex==='f'?NAMES_F:NAMES_M)};if(fioS(d.fio)===fioS(v.docs.passport.fio))d.fio=mutFio(d.fio)}else d.fio=mutFio(d.fio);return true}},
  R_EXP:{core:1,today:1,text:'Паспорт действителен на дату обращения (графа «Действителен до»).',reason:'Паспорт просрочен',kinds:['expiry'],
    check:v=>dayDiff(v.docs.passport.until,G.today)<0,
    inject:v=>{const p=v.docs.passport;p.issued=addDays(addYears(G.today,-10),-ri(1,420));p.until=addYears(p.issued,10);return true}},
  R_SIGN:{core:1,text:'Заявление подписано заявителем.',reason:'Заявление не подписано',kinds:['sig'],
    check:v=>!v.docs.application.sig,inject:v=>{v.docs.application.sig=null;return true},
    fix:v=>{v.docs.application.sig=v.docs.passport.sig;return 'Ой. Сейчас распишусь. Вот.'}},
  R_RECEIPT:{req:'receipt',text:'Обязательна квитанция об оплате госпошлины.',reason:'Нет квитанции',kinds:[],dir:['Об оплате государственной пошлины','В целях повышения доступности государственных услуг вводится государственная пошлина.'],
    check:v=>!v.docs.receipt,inject:v=>{delete v.docs.receipt;return true},
    fix:v=>{makeReceipt(v);return 'Подождите... Вот она! В паспортной обложке была.'}},
  R_SUM:{need:'R_RECEIPT',text:()=>`Госпошлина — ${rub(G.tariff)}. Иная сумма не принимается.`,reason:'Неверная сумма пошлины',kinds:['sum'],dir:['О размере пошлины','Размер пошлины установлен с точностью до копейки. Округлять в пользу гражданина запрещается.'],
    check:v=>v.docs.receipt&&v.docs.receipt.sum!==G.tariff,inject:v=>{const r=v.docs.receipt;if(!r)return false;r.sum=pick([300,3500,35,350,412.5,500].filter(x=>x!==G.tariff));return true}},
  R_PHOTO:{text:'Фотография в паспорте соответствует лицу заявителя.',reason:'Фото не соответствует лицу',kinds:['photo','face'],dir:['О борьбе с подменой лиц','Участились случаи обращения граждан с чужими лицами. Сверяйте фотографию с оригиналом.'],
    check:v=>v.photoDiff,inject:v=>{v.photoFace=mutateFace(v.face);v.photoDiff=true;return true}},
  R_BIRTH:{text:'Дата рождения во всех документах совпадает с паспортом.',reason:'Не совпадает дата рождения',kinds:['birth'],dir:['О датах рождения','Граждане продолжают рождаться в разные дни в разных документах. Это недопустимо.'],
    check:v=>otherDocs(v).some(d=>d.birth&&dd(d.birth)!==dd(v.docs.passport.birth)),
    inject:v=>{const ds=['application','snils','zhiv'].map(k=>v.docs[k]).filter(Boolean);const d=pick(ds);d.birth=addDays(d.birth,pick([1,-1,10,365,-365,-3650]));return true}},
  R_INK:{text:'Заявление заполняется только синими чернилами.',reason:'Заявление заполнено не синими чернилами',kinds:['ink'],dir:['Об экономии чёрных чернил','В связи с перебоями поставок импортных чернил чёрный цвет сохраняется для служебного пользования.'],
    check:v=>v.docs.application.ink!=='blue',inject:v=>{v.docs.application.ink=pick(['black','black','green']);return true}},
  R_SNILS:{req:'snils',text:'Обязателен СНИЛС заявителя.',reason:'Нет СНИЛС',kinds:[],dir:['О межведомственном взаимодействии','Поскольку базы данных ведомств между собой не связаны, межведомственное взаимодействие осуществляет сам гражданин.'],
    check:v=>!v.docs.snils,inject:v=>{delete v.docs.snils;return true},
    fix:v=>{makeSnils(v);return 'Зелёненькая? Так вот же она, в кошельке, за пропуском.'}},
  R_ZHIV:{req:'zhiv',text:'Обязательна справка о том, что заявитель жив (форма 0-ЖИВ/у).',reason:'Нет справки 0-ЖИВ',kinds:[],dir:['О подтверждении факта жизни','Выявлены обращения от имени умерших граждан (в том числе на избирательных участках — абзац удалить перед рассылкой).'],
    check:v=>!v.docs.zhiv,inject:v=>{delete v.docs.zhiv;return true}},
  R_ZHIV_OLD:{need:'R_ZHIV',today:1,text:'Справка 0-ЖИВ действительна 3 дня с даты выдачи. Человек мог измениться.',reason:'Справка 0-ЖИВ просрочена',kinds:['issued'],dir:['О сроке годности граждан','Справка о том, что гражданин жив, устаревает. Гражданин — тоже.'],
    check:v=>v.docs.zhiv&&dayDiff(G.today,v.docs.zhiv.issued)>3,inject:v=>{const z=v.docs.zhiv;if(!z)return false;z.issued=addDays(G.today,-ri(4,30));return true}},
  R_TRI:{need:'R_ZHIV',text:'Справки с треугольной печатью не принимаются. Только круглая гербовая.',reason:'Треугольная печать на справке',kinds:['stamp'],dir:['О печатях','Треугольные печати признаны несерьёзными.'],
    check:v=>v.docs.zhiv&&v.docs.zhiv.stamp==='tri',inject:v=>{const z=v.docs.zhiv;if(!z)return false;z.stamp='tri';return true}},
  R_MIR:{need:'R_RECEIPT',text:'Пошлина оплачивается только картой «Мир» или через СБП.',reason:'Оплата иностранной картой',kinds:['method'],dir:['Об импортозамещении в платёжной сфере','Иностранные платёжные системы покинули рынок, но некоторые граждане об этом ещё не знают. Сообщите им.'],
    check:v=>v.docs.receipt&&!['МИР','СБП'].includes(v.docs.receipt.method),inject:v=>{const r=v.docs.receipt;if(!r)return false;r.method=pick(['VISA','Mastercard']);return true}},
  R_GOSU:{text:'Требуется подтверждённая учётная запись Госуслуг.',reason:'Учётная запись Госуслуг не подтверждена',kinds:['gosu'],dir:['О цифровой трансформации','Все услуги переведены в электронный вид. Для получения электронной услуги гражданин предъявляет бумажное заявление.'],
    check:v=>v.docs.application.gosu!=='подтверждённая',inject:v=>{v.docs.application.gosu=pick(['упрощённая','стандартная']);return true}},
  R_SIGMATCH:{text:'Подпись в заявлении совпадает с подписью в паспорте.',reason:'Подпись не совпадает с паспортом',kinds:['sig'],dir:['О подлинности подписей','Усилена борьба с поддельными подписями. Подпись гражданина должна быть похожа на подпись гражданина.'],
    check:v=>v.docs.application.sig!=null&&v.docs.application.sig!==v.docs.passport.sig,inject:v=>{v.docs.application.sig=v.docs.passport.sig+ri(1,99999);return true}},
  R_SCH:{odd:1,today:1,text:'Граждане с фамилией на букву «Щ» обслуживаются только по чётным числам.',reason:'Фамилия на «Щ», сегодня нечётное число',kinds:['fio'],dir:['Об оптимизации очереди','Для равномерного распределения нагрузки граждане распределяются по алфавиту. Начали с буквы «Щ».'],
    check:v=>v.docs.passport.fio.s[0]==='Щ'&&G.today.getDate()%2===1,
    inject:v=>{if(v.named)return false;const s=pick(SURN_SCH)+(v.sex==='f'?'а':'');[v.docs.passport,...otherDocs(v)].forEach(d=>{if(d.fio)d.fio={...d.fio,s}});return true}},
  /* --- новые --- */
  R_PASSNUM:{text:'Номер паспорта в заявлении совпадает с номером в паспорте.',reason:'Номер паспорта не совпадает',kinds:['passnum'],dir:['О паспортных данных','Граждане путают номер собственного паспорта. Государство — не путает.'],
    check:v=>v.docs.application.pass!==v.docs.passport.pass,
    inject:v=>{const a=v.docs.application,s=a.pass;const i=pick([...s].map((c,j)=>/\d/.test(c)?j:-1).filter(j=>j>=0));a.pass=s.slice(0,i)+((+s[i]+ri(1,8))%10)+s.slice(i+1);return true},
    fix:v=>{v.docs.application.pass=v.docs.passport.pass;return 'Цифры перепутал{|а}. Давайте исправлю. Вот, с росписью.'}},
  R_PAYDATE:{need:'R_RECEIPT',today:1,text:'Квитанция действительна 5 дней с даты оплаты.',reason:'Квитанция старше 5 дней',kinds:['paydate'],dir:['О сроке действия платежей','В связи с волатильностью курса рубль, уплаченный неделю назад, не равен сегодняшнему рублю.'],
    check:v=>v.docs.receipt&&dayDiff(G.today,v.docs.receipt.date)>5,inject:v=>{const r=v.docs.receipt;if(!r)return false;r.date=addDays(G.today,-ri(6,25));return true}},
  R_PAYTIME:{need:'R_RECEIPT',text:'Оплата с 20:00 до 08:00 не засчитывается: банк спит.',reason:'Оплата в ночное время',kinds:['paytime'],dir:['О режиме работы банков','Платежи, совершённые ночью, вызывают подозрение. Честные граждане ночью спят.'],
    check:v=>v.docs.receipt&&(payHour(v.docs.receipt)>=20||payHour(v.docs.receipt)<8),inject:v=>{const r=v.docs.receipt;if(!r)return false;r.time=`${pad(pick([20,21,22,23,0,1,2,3,5,6,7]))}:${pad(ri(0,59))}`;return true}},
  R_SERVICE:{text:()=>`Услуга «${P().banned}» временно не оказывается.`,reason:'Услуга приостановлена',kinds:['service'],dir:()=>['О временном приостановлении услуги',`Бланки для услуги «${P().banned}» печатались на импортной бумаге. До завершения импортозамещения бумаги услуга не оказывается.`],
    check:v=>v.docs.application.service===P().banned,inject:v=>{if(v.named)return false;v.docs.application.service=v.service=P().banned;return true}},
  R_VPN:{need:'R_RECEIPT',text:'Оплата через VPN не засчитывается: IP-адрес в чеке — только российский (RU).',reason:'Оплата через VPN',kinds:['ip'],dir:['О цифровом суверенитете','Платежи через VPN признаны платежами из-за границы. Из-за границы госпошлину не принимаем.'],
    check:v=>v.docs.receipt&&v.docs.receipt.cc!=='RU',inject:v=>{const r=v.docs.receipt;if(!r)return false;const f=pick(FOREIGN_IP);r.ip=`${f[0]}.${ri(1,254)}.${ri(1,254)}`;r.cc=f[1];return true}},
  R_PHONE:{text:'Телефон в заявлении — только российский, с кодом +7.',reason:'Иностранный номер телефона',kinds:['phone'],dir:['О номерах телефонов','Для связи с гражданином используется только российский номер. Граждане с иностранными номерами пусть звонят из-за границы.'],
    check:v=>!v.docs.application.tel.startsWith('+7 '),inject:v=>{v.docs.application.tel=foreignTel();return true},
    fix:v=>{v.docs.application.tel=ruTel();return 'Это старый. Вот новый, российский, вчера на вокзале купил{|а}.'}},
  R_EMAIL:{text:'Электронная почта — только в отечественных доменах (.ru, .рф).',reason:'Иностранная электронная почта',kinds:['email'],dir:['Об отечественной почте','Иностранная электронная почта может читаться иностранными спецслужбами. Отечественная — только отечественными.'],
    check:v=>!/\.(ru|рф)$/.test(v.docs.application.mail),inject:v=>{const a=v.docs.application;a.mail=a.mail.replace(/@.*/,'@'+pick(FOREIGN_MAIL));return true}},
  R_NOTIFY:{text:'Уведомления — только через национальный мессенджер «Макс».',reason:'Не выбран «Макс» для уведомлений',kinds:['notify'],dir:['О национальном мессенджере','Уведомления о готовности справок направляются только через национальный мессенджер. Голуби отправлены на переподготовку.'],
    check:v=>v.docs.application.notify!=='«Макс»',inject:v=>{v.docs.application.notify=pick(NOTIFY.filter(n=>n!=='«Макс»'));return true},
    fix:v=>{v.docs.application.notify='«Макс»';return 'Ну «Макс» так «Макс». Галочку переставлю. Мне всё равно никто не пишет.'}},
  R_REG:{text:'Обслуживаются только граждане с регистрацией в Верхнеберёзовской обл.: Верхнеберёзовск, Нижние Пупки, Большие Справки, Заречный.',reason:'Нет местной регистрации',kinds:['reg'],dir:['О территориальном принципе','Граждане без местной регистрации обслуживаются по месту регистрации. Где бы она ни была.'],
    check:v=>!REGION.includes(v.docs.passport.reg),inject:v=>{if(v.named)return false;v.docs.passport.reg=pick(REG_OUT);return true}},
  R_APPDATE:{today:1,text:'Заявление датируется днём обращения.',reason:'Заявление не сегодняшнее',kinds:['appdate'],dir:['О свежести заявлений','Заявление, написанное вчера, отражает вчерашнюю волю гражданина. Нам нужна сегодняшняя.'],
    check:v=>dd(v.docs.application.date)!==dd(G.today),inject:v=>{v.docs.application.date=addDays(G.today,-ri(1,9));return true},
    fix:v=>{v.docs.application.date=G.today;return 'Дату исправить? Пожалуйста. Зачеркну и напишу сегодняшнюю.'}},
  R_SNILSNUM:{need:'R_SNILS',text:'Номер СНИЛС в заявлении совпадает с номером на карточке.',reason:'Номер СНИЛС не совпадает',kinds:['snilsnum'],dir:['О сквозных номерах','Номер СНИЛС теперь указывается в заявлении. Чтобы его можно было сверить со СНИЛС.'],
    check:v=>v.docs.snils&&v.docs.application.snils!==v.docs.snils.num,inject:v=>{if(!v.docs.snils)return false;v.docs.application.snils=snilsNum();return true},
    fix:v=>{if(!v.docs.snils)return null;v.docs.application.snils=v.docs.snils.num;return 'Это я номер соседки вписал{|а}, мы вместе заполняли. Сейчас исправлю.'}},
  R_CAPS:{text:'Ф. И. О. в заявлении — ЗАГЛАВНЫМИ ПЕЧАТНЫМИ буквами.',reason:'ФИО не печатными буквами',kinds:['caps'],dir:['О разборчивости','Почерк граждан признан неразборчивым. Ф. И. О. пишется заглавными печатными буквами, как в анкете на визу, которую никто не получит.'],
    check:v=>!v.docs.application.caps,inject:v=>{v.docs.application.caps=false;return true}},
  R_DOCTOR:{need:'R_ZHIV',text:()=>`Справку 0-ЖИВ подписывает только врач ${P().doctor}.`,reason:'Справку подписал не тот врач',kinds:['doctor'],dir:()=>['О кадровой ситуации в здравоохранении',`Все врачи поликлиники №3, кроме ${P().doctor}, находятся в отпуске, на больничном или в Москве.`],
    check:v=>v.docs.zhiv&&v.docs.zhiv.doc!==P().doctor,inject:v=>{const z=v.docs.zhiv;if(!z)return false;z.doc=pick(DOCTORS.filter(d=>d!==P().doctor));return true}}
};
/* подделки: визуальные признаки, сверяются с вкладкой «Образцы» (поле + образец или поле + пункт) */
const STAMP_COL={violet:'#3d3aa0',red:'#b4222f',black:'#26252b',green:'#1f7a43'};
Object.assign(RULES,{
  F_STAMPCOL:{forg:1,need:'R_ZHIV',sample:'stamp',kinds:['stamp'],text:'Гербовая печать поликлиники — только фиолетовая (см. «Образцы»).',reason:'Печать поликлиники не того цвета',dir:['О поддельных печатях','В городе изготовлены поддельные печати поликлиники №3. Отличить их просто: настоящие — фиолетовые, поддельные — какие получились.'],
    check:v=>v.docs.zhiv&&v.docs.zhiv.stamp==='round'&&v.docs.zhiv.scol!=='violet',inject:v=>{const z=v.docs.zhiv;if(!z)return false;z.stamp='round';z.scol=pick(['red','black','green']);return true}},
  F_STAR:{forg:1,need:'R_ZHIV',sample:'stamp',kinds:['stamp'],text:'В центре гербовой печати — звезда (см. «Образцы»).',reason:'На печати нет звезды',dir:['О звёздах на печатях','Подпольные мастерские экономят на звёздах. Государство на звёздах не экономит.'],
    check:v=>v.docs.zhiv&&v.docs.zhiv.stamp==='round'&&!!v.docs.zhiv.nostar,inject:v=>{const z=v.docs.zhiv;if(!z)return false;z.stamp='round';z.nostar=true;return true}},
  F_TAPE:{forg:1,sample:'photo',kinds:['photo'],text:'Фотография в паспорте вклеена, а не приклеена скотчем (см. «Образцы»).',reason:'Фото переклеено скотчем',dir:['О переклеенных фотографиях','Выявлены паспорта с фотографиями, приклеенными канцелярским скотчем. Скотч — импортный, это отягчающее обстоятельство.'],
    check:v=>!!v.docs.passport.tape,inject:v=>{v.docs.passport.tape=true;return true}},
  F_HOLO:{forg:1,sample:'holo',kinds:['holo'],text:'На развороте паспорта есть радужная голограмма (см. «Образцы»).',reason:'Нет голограммы на паспорте',dir:['О голограммах','Поддельные паспорта научились печатать на хорошей бумаге. Голограмму пока не научились. Пока.'],
    check:v=>!!v.docs.passport.noholo,inject:v=>{v.docs.passport.noholo=true;return true}},
  F_FONT:{forg:1,need:'R_RECEIPT',sample:'font',kinds:['font'],text:'Чек ГОСБАНКа печатается только кассовым шрифтом (см. «Образцы»).',reason:'Чек напечатан чужим шрифтом',dir:['О поддельных чеках','Гражданам предлагают «чеки об оплате» на сайтах с бесплатными шаблонами. Кассовый аппарат так красиво не печатает.'],
    check:v=>v.docs.receipt&&v.docs.receipt.font==='fake',inject:v=>{const r=v.docs.receipt;if(!r)return false;r.font='fake';return true}},
  F_QR:{forg:1,need:'R_RECEIPT',sample:'qr',kinds:['qr'],text:'QR-код на чеке — без надписи «ОБРАЗЕЦ» (см. «Образцы»).',reason:'QR-код с надписью «ОБРАЗЕЦ»',dir:['О QR-кодах','Некоторые граждане распечатывают чек прямо из инструкции банка. Вместе со словом «ОБРАЗЕЦ».'],
    check:v=>v.docs.receipt&&!!v.docs.receipt.qrSample,inject:v=>{const r=v.docs.receipt;if(!r)return false;r.qrSample=true;return true}},
  /* осмотр: признаки видны только под УФ-лампой или лупой (кнопка «Осмотр»), в «Сверке» не участвуют */
  F_UV:{forg:1,tool:'uv',sample:'uv',kinds:[],text:'Под УФ-лампой на развороте паспорта виден водяной знак — герб (см. «Образцы»).',reason:'Нет водяного знака под УФ',dir:['Об ультрафиолете','Центру выдана УФ-лампа. Настоящий паспорт под ней светится гербом, подделка — как получилось. Лампа одна на весь центр, береги её.'],
    check:v=>!!v.docs.passport.nouv,inject:v=>{v.docs.passport.nouv=true;return true}},
  F_MICRO:{forg:1,tool:'loupe',need:'R_ZHIV',sample:'micro',kinds:[],text:'По кромке печати поликлиники — микротекст «ГБУЗ ГП №3», читается только под лупой (см. «Образцы»).',reason:'Микротекст на печати искажён',dir:['О лупах','Центру выдана лупа. Настоящая печать по кромке читается «ГБУЗ ГП №3». У подделок там буквы «как получились». Лупу не ронять: счёт за неё придёт вам.'],
    check:v=>!!(v.docs.zhiv&&v.docs.zhiv.stamp==='round'&&v.docs.zhiv.badmicro),inject:v=>{const z=v.docs.zhiv;if(!z)return false;z.stamp='round';z.badmicro=pick(MICRO_BAD);return true}}
});
const MICRO_OK='ГБУЗ ГП №3',MICRO_BAD=['ГБУЗ ГП №8','ГВУЗ ГП №3','ГБУЗ ПГ №3','ГБУЗ ГП N°3','ГБУ3 ГП №3'];
const SAMPLES={stamp:'Печать поликлиники №3: фиолетовая, в центре звезда',photo:'Фото вклеено ровно, без скотча',holo:'Голограмма — радужный круг справа от фото',font:'Кассовый шрифт: ровные моноширинные буквы',qr:'Чистый QR-код, без надписей',uv:'Под УФ-лампой на паспорте светится герб',micro:'Под лупой по кромке печати: «'+MICRO_OK+'»'};
const CORE=['R_FIO','R_EXP','R_SIGN'];
const POOL_ORDER=Object.keys(RULES);
const inPool=id=>!!(S&&S.run&&S.run.rules[id]);
const isActive=id=>inPool(id)&&S.run.rules[id]<=S.day&&!(G.suspend||[]).includes(id);
const activeIds=()=>POOL_ORDER.filter(isActive).sort((a,b)=>S.run.rules[a]-S.run.rules[b]);
const ruleText=id=>{const t=RULES[id].text;return typeof t==='function'?t():t};
const ruleDir=id=>{const d=RULES[id].dir;return typeof d==='function'?d():d};
const PLEAD={R_FIO:['Это паспортистка ошиблась, честное слово!','Ну Ё, Е — какая разница?','Это опечатка. Я так всегда пишу.'],R_EXP:['Как просрочен? Он же как новый!','Я его почти не доставал{|а}.'],R_SIGN:['Ой, а где расписаться? Тут?','Мне сказали, подпись потом.'],R_RECEIPT:['А пошлину что, платить надо?','Квитанция в другом пальто.'],R_SUM:['На сайте была другая сумма!','Я по старому тарифу, по старому!'],R_PHOTO:['Фото старое, но это точно я!','Это свет такой.','Я просто постриг{ся|лась}.'],R_BIRTH:['В роддоме ошиблись, наверное.','Год туда, год сюда.'],R_INK:['Какая разница, какой ручкой?!','Других ручек не было. Вон, на верёвочке, она чёрная.'],R_SNILS:['СНИЛС? Это зелёная карточка? Дома.','Он же у вас в компьютере есть!'],R_ZHIV:['Справку, что я жив{|а}? Я же стою перед вами!','Где её берут-то?'],R_ZHIV_OLD:['Так ничего ж с тех пор не случилось!','Я с тех пор не умирал{|а}, честно.'],R_TRI:['Мне такую в поликлинике поставили!','Печать есть печать!'],R_MIR:['Это карта внука, она работает!','Её из-за границы привезли, она ещё действует.'],R_GOSU:['Как подтвердить? Через вас же и подтвердить!','Там капча, сто раз пробовали.'],R_SIGMATCH:['Рука с утра дрожит.','Подпись у меня меняется с настроением.'],R_SCH:['При чём тут буква Щ?!','Мне что, фамилию сменить?'],
  R_PASSNUM:['Цифры как цифры. Похожие же!','Я по памяти писал{|а}.'],R_PAYDATE:['Так я заранее заплатил{|а}, как ответственный человек!','Пять дней? А на сайте об этом ни слова.'],R_PAYTIME:['Я ночью не сплю, у меня давление!','Так приложение ночью быстрее работает.'],R_SERVICE:['Как это — не оказывается? Я с шести утра стою!','А когда будет? Когда бумагу импортозаместят?'],R_VPN:['Без VPN у меня банк не открывается!','Это не я, это телефон сам.'],R_PHONE:['Это старый номер, я ещё не переделал{|а}.','Так звоните на него, он работает!'],R_EMAIL:['На «Мейл» мне спам приходит!','Это рабочая почта, мне так удобнее.'],R_NOTIFY:['Голубь у меня надёжный, честно.','Какой ещё «Макс»? Это внук, что ли?'],R_REG:['Я тут живу, просто прописан{|а} у мамы!','Прописка — это пережиток!'],R_APPDATE:['Я вчера писал{|а}, а вчера вы закрылись!','Ну какая разница, вчера или сегодня?'],R_SNILSNUM:['Номер длинный, я ошибся, бывает.','Это же всё равно СНИЛС!'],R_CAPS:['Я и так разборчиво пишу!','Печатными? Как в школе, что ли?'],R_DOCTOR:['Так другой врач на больничном!','Мне кто был, тот и подписал.']};
['F_STAMPCOL','F_STAR','F_TAPE','F_HOLO','F_FONT','F_QR'].forEach(id=>{PLEAD[id]=PLEAD[id]||['Мне так и выдали, я не разглядывал{|а}!','Да кто ж на это смотрит?','Это же мелочь, господи.']});
PLEAD.F_STAMPCOL=['Какая печать была, такую и поставили!','У них фиолетовые чернила кончились.'];PLEAD.F_TAPE=['Оно отклеилось, я подклеил{|а}!','Скотч хороший, держит!'];PLEAD.F_QR=['А что, «образец» — это плохо?','Мне в банке так распечатали.'];PLEAD.F_HOLO=['Она стёрлась! Я паспорт в стиралке постирал{|а}.','Голограмма? Это блестяшка такая?'];
PLEAD.F_UV=['Он должен светиться? Он же не ёлка!','Паспорт в стиральной машине побывал, всё вымылось.','Какой ещё герб под лампой? Я его при свете получал.'];
PLEAD.F_MICRO=['Какие буквы? Там просто печать!','Врач ставит мелко, чтобы краску экономить.','У печати такой шрифт, это не я.'];
