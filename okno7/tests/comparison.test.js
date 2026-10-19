'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const node={addEventListener(){}};const context={$:()=>node,document:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/inspect.js'),'utf8')+'\nthis.parts=differingParts;this.label=fieldLabel;',context);
test('сверка выделяет Е и Ё и сохраняет остальное ФИО',()=>{
  assert.deepEqual(Array.from(context.parts('Федорова Анна','Фёдорова Анна')),['Ф','е','дорова Анна']);
});
test('лишняя буква и отсутствующая буква образуют симметричные фрагменты',()=>{
  assert.deepEqual(Array.from(context.parts('Иванова','Иванов')),['Иванов','а','']);
  assert.deepEqual(Array.from(context.parts('Иванов','Иванова')),['Иванов','','']);
});
test('название поля берётся по содержанию, а не общему признаку чернил',()=>{
  assert.equal(context.label(['ink','service']),'Услуга');assert.equal(context.label(['fio','ink','caps']),'ФИО');
});
