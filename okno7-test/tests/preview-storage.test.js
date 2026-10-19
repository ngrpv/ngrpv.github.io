'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const previewUtil=path.join(__dirname,'../../okno7-test/js/util.js');
test('тестовая версия не читает, не меняет и не удаляет сохранения основной игры',{skip:!fs.existsSync(previewUtil)},()=>{
  const primary={save:{day:7,savedAt:100},archive:{test:{n:2}},muted:true,tutDone:true,ach:{test:true},diff:'hard',daily:{day:4}};
  const data=new Map(Object.entries(primary).map(([k,v])=>['okno7.'+k,JSON.stringify(v)]));data.set('okno7.save.v1','legacy');
  const original=[...data];
  const localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const context=vm.createContext({localStorage,setTimeout});
  const {store,STORE_KEYS}=vm.runInContext(fs.readFileSync(previewUtil,'utf8')+'\n;({store,STORE_KEYS})',context);
  store.load();for(const key of STORE_KEYS)assert.equal(store.get(key),null);
  for(const key of STORE_KEYS)store.set(key,{test:key});
  assert.equal(data.get('okno7-test.save'),JSON.stringify({test:'save'}));
  store.mem={};store.load();assert.equal(store.get('save').test,'save');
  for(const key of STORE_KEYS)store.del(key);
  assert.deepEqual([...data],original);
});
