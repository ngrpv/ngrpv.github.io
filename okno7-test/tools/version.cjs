// Обновляет номер версии и адреса ресурсов перед публикацией.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const ROOT=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(ROOT,file),'utf8').replace(/\r\n/g,'\n');
const resources=html=>[...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m=>m[1]);
const versionTag=/(<span\b[^>]*id="game-version") data-build="([a-f0-9]{10})">Версия (\d+\.\d+\.\d+)<\/span>/;
function buildId(html){
  const normalized=html.replace(/((?:src|href)="(?:js|css)\/[^"?]+)(?:\?[^"]*)?"/g,'$1"').replace(versionTag,'$1 data-build="__BUILD__">Версия __VERSION__</span>');
  const digest=createHash('sha256').update(normalized);
  const files=[...new Set(resources(html).map(url=>url.split('?')[0]))].sort();
  for(const file of files)digest.update('\0'+file+'\0'+read(file));
  return digest.digest('hex').slice(0,10);
}
function verify(html=read('index.html')){
  const id=buildId(html),label=html.match(versionTag);
  if(!label||label[2]!==id||!resources(html).length||resources(html).some(url=>!url.endsWith('?v='+id)))
    throw Error('Версия устарела. Выполните node tools/version.cjs');
  return {version:label[3],build:id};
}
function refresh(requested){
  if(requested&&!/^\d+\.\d+\.\d+$/.test(requested))throw Error('Нужен номер вида 1.0.1');
  const html=read('index.html'),label=html.match(versionTag);
  if(!label)throw Error('Не найден номер версии в index.html');
  const id=buildId(html),parts=label[3].split('.').map(Number);
  if(label[2]!==id)parts[2]++;
  const version=requested||parts.join('.');
  const updated=html.replace(/((?:src|href)="(?:js|css)\/[^"?]+)(?:\?[^"]*)?"/g,'$1?v='+id+'"').replace(versionTag,()=>label[1]+' data-build="'+id+'">Версия '+version+'</span>');
  const result=verify(updated);
  if(html!==updated)fs.writeFileSync(path.join(ROOT,'index.html'),updated,'utf8');
  return result;
}
if(require.main===module){
  const result=process.argv.includes('--check')?verify():refresh(process.argv[2]);
  console.log('Версия '+result.version+' · сборка '+result.build);
}
module.exports={buildId,verify,refresh};
