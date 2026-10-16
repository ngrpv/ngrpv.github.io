'use strict';
/* =========================================================
   СТАРТ
   ========================================================= */
stampDrag($('#b-ok'),true);stampDrag($('#b-no'),false);
if(typeof window!=='undefined'&&window.__OKNO_SIM__){Object.defineProperties(window.__OKNO_SIM__,Object.getOwnPropertyDescriptors({freshState,setupRun,readRunOptions,renderDocs,faceSVG,makeQueuedVisitor,finishSpeech,say,setDayCtx,genVisitor,planSpecials,judge,calcEvening,settleEvening,checkEnd,finalEnding,interrogate,bribeState,closeMisses,pickDilemma,DILEMMAS,FLY_PRICE,get E(){return E},RULES,ARCS,ROLES,ENDINGS,END_ORDER,activeIds,isActive,get S(){return S},set S(x){S=x},hash,DIFFS,DIFF_ORDER,ACH,checkAch,diff,newStats,visitorSeed,dailySeed,dailyKey,dailyLabel,withSeed,mulberry32,reviewHtml,uiMode,setInterfaceMode,get G(){return G},get W(){return W},set W(x){W=x},setRnd:f=>{rnd=f}}))}else{
store.load();initTitle();
store.connect().then(ch=>{if(ch&&!$('#s-title').hidden)initTitle()});
}
