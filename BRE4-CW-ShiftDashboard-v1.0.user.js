// ==UserScript==
// @name         ShiftPulse - Weekly Performance Dashboard
// @namespace    http://tampermonkey.net/
// @version      16.3
// @description  Weekly shift-wise PPR dashboard
// @author       BRE4
// @updateURL    https://raw.githubusercontent.com/amritpdh/shiftpulse/main/BRE4-CW-ShiftDashboard-v1.0.user.js
// @downloadURL  https://raw.githubusercontent.com/amritpdh/shiftpulse/main/BRE4-CW-ShiftDashboard-v1.0.user.js
// @match        https://fclm-portal.amazon.com/reports/processPathRollup*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      fclm-portal.amazon.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js
// ==/UserScript==

(function () {
    'use strict';

    var CONFIG = { warehouseId: 'BRE4', maxConcurrent: 6 };
    var SK = 'cw_dashboard_settings_v3';
    function loadS() { try { var r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
    function saveS(s) { try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {} }
    function defS() {
        return { fc: 'BRE4', shiftMatrix: {
            ES: { Sun:null, Mon:{sos:'05:30',eos:'14:45'}, Tue:{sos:'06:15',eos:'15:00'}, Wed:{sos:'06:15',eos:'15:00'}, Thu:{sos:'06:15',eos:'15:00'}, Fri:{sos:'06:15',eos:'15:00'}, Sat:null },
            LS: { Sun:null, Mon:{sos:'14:45',eos:'23:45'}, Tue:{sos:'15:00',eos:'23:45'}, Wed:{sos:'15:00',eos:'23:45'}, Thu:{sos:'15:00',eos:'23:45'}, Fri:{sos:'15:00',eos:'23:30'}, Sat:null },
            NS: { Sun:{sos:'18:30',eos:'04:45'}, Mon:{sos:'23:45',eos:'06:15'}, Tue:{sos:'23:45',eos:'06:15'}, Wed:{sos:'23:45',eos:'06:15'}, Thu:{sos:'23:45',eos:'06:15'}, Fri:{sos:'23:30',eos:'08:15'}, Sat:null },
            CS: { Sun:null, Mon:null, Tue:null, Wed:null, Thu:null, Fri:null, Sat:{sos:'10:15',eos:'18:00'} }
        }};
    }
    var _s = loadS() || defS();
    if (!_s.shiftMatrix) _s.shiftMatrix = defS().shiftMatrix;
    CONFIG.warehouseId = _s.fc || 'BRE4';

    var OPS = [
        { label:'IB', color:'#2196F3', tid:'ppr.fcSummary.totalInbound', items:[
            {name:'Each Receive - Small',id:'ppr.detail.inbound.receive.eachReceive.small'},
            {name:'Each Receive - Medium',id:'ppr.detail.inbound.receive.eachReceive.medium'},
            {name:'Each Receive - Large',id:'ppr.detail.inbound.receive.eachReceive.large'},
            {name:'Each Receive - Heavy/Bulky',id:'ppr.detail.inbound.receive.eachReceive.heavyBulky'},
            {name:'Each Receive - Total',id:'ppr.detail.inbound.receive.eachReceive.total',b:1},
            {name:'Case Receive',id:'ppr.detail.inbound.receive.caseReceive'},
            {name:'Pallet Receive',id:'ppr.detail.inbound.receive.palletReceive'},
            {name:'LP Receive',id:'ppr.detail.inbound.receive.lpReceive'},
            {name:'Receive Dock',id:'ppr.detail.inbound.receive.receiveDock'},
            {name:'Receive Support',id:'ppr.detail.inbound.receive.receiveSupport'},
            {name:'Receive Total',id:'ppr.detail.inbound.receive.receiveTotal',b:1},
            {name:'Each Transfer In - Small',id:'ppr.detail.inbound.transferInAndStow.eachTransferIn.small'},
            {name:'Each Transfer In - Medium',id:'ppr.detail.inbound.transferInAndStow.eachTransferIn.medium'},
            {name:'Each Transfer In - Large',id:'ppr.detail.inbound.transferInAndStow.eachTransferIn.large'},
            {name:'Each Transfer In - Heavy/Bulky',id:'ppr.detail.inbound.transferInAndStow.eachTransferIn.heavyBulky'},
            {name:'Each Transfer In - Total',id:'ppr.detail.inbound.transferInAndStow.eachTransferIn.total',b:1},
            {name:'Case Transfer In',id:'ppr.detail.inbound.transferInAndStow.caseTransferIn'},
            {name:'Pallet Transfer In',id:'ppr.detail.inbound.transferInAndStow.palletTransferIn'},
            {name:'Tote Transfer In',id:'ppr.detail.inbound.transferInAndStow.toteTransferIn'},
            {name:'Transfer In Decant',id:'ppr.detail.inbound.transferInAndStow.transferInDecant'},
            {name:'Transfer In Support',id:'ppr.detail.inbound.transferInAndStow.transferInSupport'},
            {name:'Transfer In Total',id:'ppr.detail.inbound.transferInAndStow.transferInTotal',b:1},
            {name:'Prep Recorder - Small',id:'ppr.detail.inbound.ibPrep.prepRecorder.small'},
            {name:'Prep Recorder - Medium',id:'ppr.detail.inbound.ibPrep.prepRecorder.medium'},
            {name:'Prep Recorder - Large',id:'ppr.detail.inbound.ibPrep.prepRecorder.large'},
            {name:'Prep Recorder - Heavy/Bulky',id:'ppr.detail.inbound.ibPrep.prepRecorder.heavyBulky'},
            {name:'Prep Recorder - Total',id:'ppr.detail.inbound.ibPrep.prepRecorder.total',b:1},
            {name:'Cubiscan',id:'ppr.detail.inbound.ibPrep.cubiscan'},
            {name:'Sample Center',id:'ppr.detail.inbound.ibPrep.sampleCenter'},
            {name:'Prep Support',id:'ppr.detail.inbound.ibPrep.prepSupport'},
            {name:'Prep Total',id:'ppr.detail.inbound.ibPrep.ibPrep.total',b:1},
            {name:'Each Stow to Prime - Small',id:'ppr.detail.inbound.stowToPrime.eachStowToPrime.small'},
            {name:'Each Stow to Prime - Medium',id:'ppr.detail.inbound.stowToPrime.eachStowToPrime.medium'},
            {name:'Each Stow to Prime - Large',id:'ppr.detail.inbound.stowToPrime.eachStowToPrime.large'},
            {name:'Each Stow to Prime - Heavy/Bulky',id:'ppr.detail.inbound.stowToPrime.eachStowToPrime.heavyBulky'},
            {name:'Each Stow to Prime - Total',id:'ppr.detail.inbound.stowToPrime.eachStowToPrime.total',b:1},
            {name:'Case Stow to Prime',id:'ppr.detail.inbound.stowToPrime.caseStowToPrime'},
            {name:'Pallet Stow to Prime',id:'ppr.detail.inbound.stowToPrime.palletStowToPrime'},
            {name:'Tote Stow to Prime',id:'ppr.detail.inbound.stowToPrime.toteStowToPrime'},
            {name:'Stow to Prime Support',id:'ppr.detail.inbound.stowToPrime.stowToPrimeSupport'},
            {name:'Stow to Prime Total',id:'ppr.detail.inbound.stowToPrime.stowToPrimeTotal',b:1},
            {name:'Case Replenishment',id:'ppr.detail.inbound.rsr.caseReplenishment'},
            {name:'Case Stow to Reserve',id:'ppr.detail.inbound.rsr.caseStowToReserve'},
            {name:'Pallet Replenishment',id:'ppr.detail.inbound.rsr.palletReplenishment'},
            {name:'Pallet Stow to Reserve',id:'ppr.detail.inbound.rsr.palletStowToReserve'},
            {name:'RSR Support',id:'ppr.detail.inbound.rsr.rsrSupport'},
            {name:'RSR Total',id:'ppr.detail.inbound.rsr.rsrTotal',b:1},
            {name:'IB Problem Solve',id:'ppr.detail.inbound.ibDefect.ibProblemSolve'},
            {name:'IB Lead/PA',id:'ppr.detail.inbound.ibLeadPa.ibLeadPa'}
        ]},
        { label:'OB', color:'#FF9800', tid:'ppr.fcSummary.outbound', items:[
            {name:'Pick - Small',id:'ppr.detail.outbound.pick.pick.small'},
            {name:'Pick - Medium',id:'ppr.detail.outbound.pick.pick.medium'},
            {name:'Pick - Large',id:'ppr.detail.outbound.pick.pick.large'},
            {name:'RF Pick',frPid:'01003001',frMatch:'RF Pick'},
            {name:'P2R Pick',frPid:'01003001',frMatch:'Pick To Rebin'},
            {name:'Pick - Total',id:'ppr.detail.outbound.pick.pick.total',b:1},
            {name:'Pick Support',id:'ppr.detail.outbound.pick.pickSupport'},
            {name:'Pick Total (Incl. Support)',id:'ppr.detail.outbound.pick.pick.grossTotal',b:1},
            {name:'Flow Sort - Small',id:'ppr.detail.outbound.sort.flowSort.small'},
            {name:'Flow Sort - Medium',id:'ppr.detail.outbound.sort.flowSort.medium'},
            {name:'Flow Sort - Large',id:'ppr.detail.outbound.sort.flowSort.large'},
            {name:'AFE1 Induct',frPid:'01003051',frMatch:'AFE1 Induct'},
            {name:'AFE 1 Rebin',frPid:'01003051',frMatch:'AFE 1 Rebin'},
            {name:'Flow Sort - Total',id:'ppr.detail.outbound.sort.flowSort.total',b:1},
            {name:'Chutings - Small',id:'ppr.detail.outbound.pack.chuting.small'},
            {name:'Chutings - Medium',id:'ppr.detail.outbound.pack.chuting.medium'},
            {name:'Chutings - Large',id:'ppr.detail.outbound.pack.chuting.large'},
            {name:'Pack Chuting - Total',id:'ppr.detail.outbound.pack.chuting.total',b:1},
            {name:'Pack - Lev/Autofold',id:'ppr.detail.outbound.pack.packLevAutofold'},
            {name:'Pack Singles - Small',id:'ppr.detail.outbound.pack.packSingle.small'},
            {name:'Pack Singles - Medium',id:'ppr.detail.outbound.pack.packSingle.medium'},
            {name:'Pack Singles - Large',id:'ppr.detail.outbound.pack.packSingle.large'},
            {name:'SingleMedium',frPid:'01002993',frMatch:'Scan Verify Medium'},
            {name:'SingleMedium2',frPid:'01002993',frMatch:'Pack Kaizen 1'},
            {name:'SingleNoSLAM',frPid:'01002993',frMatch:'Slam At Pack'},
            {name:'Pack Singles - Total',id:'ppr.detail.outbound.pack.packSingle.total',b:1},
            {name:'Pack Multis - Small',id:'ppr.detail.outbound.pack.packMultis.small'},
            {name:'Pack Multis - Medium',id:'ppr.detail.outbound.pack.packMultis.medium'},
            {name:'Pack Multis - Large',id:'ppr.detail.outbound.pack.packMultis.large'},
            {name:'Pack Multis - Total',id:'ppr.detail.outbound.pack.packMultis.total',b:1},
            {name:'Pack Support',id:'ppr.detail.outbound.pack.packSupport'},
            {name:'Giftwrap',id:'ppr.detail.outbound.outboundPrep.giftwrap'},
            {name:'Custom Packaging',id:'ppr.detail.outbound.outboundPrep.customPackaging'},
            {name:'Pack & OB Prep Total',id:'ppr.detail.outbound.outboundPrep.packAndOBPrepTotal',b:1},
            {name:'OB Lead/PA',id:'ppr.detail.outbound.obLeadPA.obLeadPA'},
            {name:'OB Problem Solve',id:'ppr.detail.outbound.obDefect.obProblemSolve'},
            {name:'Ship Dock',id:'ppr.detail.outbound.ship.shipDock'}
        ]},
        { label:'TSO', color:'#9C27B0', tid:'ppr.fcSummary.transferOut', items:[
            {name:'Transfer Out',id:'ppr.detail.da.transferOut.transferOut'},
            {name:'TO Lead/PA',id:'ppr.detail.da.toLeadPa.toLeadPa'}
        ]},
        { label:'VRET', color:'#E91E63', tid:'ppr.fcSummary.reverseLogistics', items:[
            {name:'V-Return Pack Total',id:'ppr.detail.reverseLogistics.vReturn.vReturnPack.total',b:1},
            {name:'V-Return Support',id:'ppr.detail.reverseLogistics.vReturn.vReturnSupport'},
        ]}
    ];
    var SUPS = [
        {label:'Admin/HR/IT',color:'#607D8B',tid:'ppr.detail.support.support.adminHRIT',pid:'01002960'},
        {label:'Non FC Controllable',color:'#78909C',tid:'ppr.detail.support.support.nonFCControllable',pid:'01003047'},
        {label:'IC/QA/CS',color:'#546E7A',tid:'ppr.detail.support.support.ICQACS',pid:'01003030'},
        {label:'Facilities',color:'#455A64',tid:'ppr.detail.support.support.facilities',pid:'01003028'}
    ];
    var ALL_IDS = (function(){ var a=[]; OPS.forEach(function(s){a.push(s.tid);s.items.forEach(function(i){a.push(i.id);});}); SUPS.forEach(function(s){a.push(s.tid);}); return a; })();

    function el(t,c,x){var e=document.createElement(t);if(c)e.style.cssText=c;if(x!==undefined)e.textContent=x;return e;}
    function pad(n){return String(n).padStart(2,'0');}
    function pN(s){if(typeof s==='number')return s;s=(s||'').trim();if(!s||s==='-'||s==='\u2013')return 0;var ld=s.lastIndexOf('.'),lc=s.lastIndexOf(',');if(ld>-1&&lc>-1){if(lc>ld)s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'');}else if(lc>-1){var ac=s.substring(lc+1);if(ac.length===3&&/^\d{3}$/.test(ac))s=s.replace(/,/g,'');else s=s.replace(',','.');}return parseFloat(s)||0;}
    function fD(d){return d.getFullYear()+'/'+pad(d.getMonth()+1)+'/'+pad(d.getDate());}
    function fISO(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
    function fSh(d){return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.';}
    function aD(d,n){var r=new Date(d);r.setDate(r.getDate()+n);return r;}
    function dC(v){return v<0?'#D00000':v>0?'#008000':'#888';}
    var DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], DDE=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    function isoWk(d){var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);var y=new Date(Date.UTC(t.getUTCFullYear(),0,1));return Math.ceil((((t-y)/86400000)+1)/7);}
    function isoYr(d){var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));var n=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-n);return t.getUTCFullYear();}
    function monISO(w,y){var j=new Date(Date.UTC(y,0,4));var d=j.getUTCDay()||7;var m=new Date(j);m.setUTCDate(j.getUTCDate()-d+1);var t=new Date(m);t.setUTCDate(m.getUTCDate()+(w-1)*7);return new Date(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate());}
    function wkDays(cw,yr){var m=monISO(cw,yr);var su=aD(m,-1);var d=[];for(var i=0;i<7;i++)d.push(aD(su,i));return d;}
    function shDay(date){var n=DN[date.getDay()];var sm=_s.shiftMatrix||{};var r=[],k=Object.keys(sm);for(var i=0;i<k.length;i++){if(sm[k[i]]&&sm[k[i]][n]){var c=sm[k[i]][n];r.push({name:k[i],sos:c.sos,eos:c.eos});}}return r;}
    function shNames(){return Object.keys(_s.shiftMatrix||{});}
    function pHM(s){if(!s)return null;var p=s.split(':');if(p.length!==2)return null;return{h:parseInt(p[0],10)||0,m:parseInt(p[1],10)||0};}
    function bSU(date,sh){var s=pHM(sh.sos),e=pHM(sh.eos);if(!s||!e)return null;var sd=new Date(date),ed=new Date(date);if(e.h<s.h||(e.h===s.h&&e.m<s.m))ed=aD(ed,1);return'https://fclm-portal.amazon.com/reports/processPathRollup?reportFormat=HTML&warehouseId='+CONFIG.warehouseId+'&spanType=Intraday&maxIntradayDays=30&startDateIntraday='+encodeURIComponent(fD(sd))+'&startHourIntraday='+s.h+'&startMinuteIntraday='+s.m+'&endDateIntraday='+encodeURIComponent(fD(ed))+'&endHourIntraday='+e.h+'&endMinuteIntraday='+e.m;}
    function bDU(date){return'https://fclm-portal.amazon.com/reports/processPathRollup?reportFormat=HTML&warehouseId='+CONFIG.warehouseId+'&spanType=Day&maxIntradayDays=30&startDateDay='+encodeURIComponent(fD(date));}
    function fP(url,cb){GM_xmlhttpRequest({method:'GET',url:url,timeout:45000,onload:function(r){cb(r.status===200?r.responseText:null);},onerror:function(){cb(null);},ontimeout:function(){cb(null);}});}

    function parse(html){
        var doc=new DOMParser().parseFromString(html,'text/html'),res={};
        for(var k=0;k<ALL_IDS.length;k++){var rid=ALL_IDS[k],row=doc.getElementById(rid);
            if(!row){res[rid]=null;continue;}
            var vc=row.querySelector('td.actualVolume'),tc=row.querySelector('td.actualProductivity'),dc=row.querySelector('td.planVarianceSeconds');
            // Hours: actualHours (operational), or for support: actualTimeSeconds only (no plan fallback)
            var hc=row.querySelector('td.actualHours');
            if(!hc){
                var hAct=row.querySelector('td.actualTimeSeconds');
                if(hAct) hc=hAct;
            }
            var vd=vc?(vc.querySelector('div.original')||vc):null;
            var td=tc?(tc.querySelector('div.original')||tc):null;
            var dd=dc?(dc.querySelector('div.original')||dc):null;
            var hd=hc?(hc.querySelector('div.original')||hc):null;
            if(!vd&&!td&&!dd&&!hd){res[rid]=null;continue;}
            res[rid]={vol:vd?vd.textContent.trim():'-',volN:vd?pN(vd.textContent.trim()):0,tph:td?td.textContent.trim():'-',tphN:td?pN(td.textContent.trim()):0,dlt:dd?dd.textContent.trim():'-',dltN:dd?pN(dd.textContent.trim()):0,hrs:hd?hd.textContent.trim():'-',hrsN:hd?pN(hd.textContent.trim()):0};}
        return res;
    }

    var _d={},_days=[],_fs={total:0,done:0,err:0},_cw,_yr;
    _cw=isoWk(new Date());_yr=isoYr(new Date());

    function fetchAll(onP,onD){
        _days=wkDays(_cw,_yr);_d={};_fs={total:0,done:0,err:0};CONFIG.warehouseId=_s.fc||'BRE4';
        var q=[];for(var i=0;i<_days.length;i++){var day=_days[i];_d[i]={};var sh=shDay(day);
            for(var j=0;j<sh.length;j++){var u=bSU(day,sh[j]);if(u)q.push({di:i,sh:sh[j],url:u});}
            q.push({di:i,sh:{name:'FD'},url:bDU(day)});}
        _fs.total=q.length;if(!q.length){onD();return;}
        var idx=0,act=0;
        function nx(){while(act<CONFIG.maxConcurrent&&idx<q.length){(function(j){act++;
            fP(j.url,function(h){if(h)_d[j.di][j.sh.name]={ppr:parse(h)};else{_d[j.di][j.sh.name]={ppr:{},err:1};_fs.err++;}
            _fs.done++;act--;onP(_fs);if(_fs.done>=_fs.total)onD();else nx();});})(q[idx]);idx++;}}
        nx();
    }
    function G(di,sn,rid){if(_d[di]&&_d[di][sn]&&_d[di][sn].ppr)return _d[di][sn].ppr[rid]||null;return null;}


    // -- SUPPORT DETAIL (Function Rollup) -----------
    var _supDetail={};

    function buildFRUrl(date,shift,pid){
        var ds=date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate());
        if(!shift||shift.name==='FD'){
            var sd=ds+'T00:00:00.000';
            var dObj=new Date(date);dObj.setDate(dObj.getDate()+1);
            var ed=dObj.getFullYear()+'-'+pad(dObj.getMonth()+1)+'-'+pad(dObj.getDate())+'T00:00:00.000';
            return'https://fclm-portal.amazon.com/reports/functionRollup?warehouseId='+CONFIG.warehouseId+'&spanType=Day&startDate='+encodeURIComponent(sd)+'&endDate='+encodeURIComponent(ed)+'&reportFormat=HTML&processId='+pid;
        }
        var sos=pHM(shift.sos),eos=pHM(shift.eos);if(!sos||!eos)return null;
        var sDate=new Date(date),eDate=new Date(date);
        if(eos.h<sos.h||(eos.h===sos.h&&eos.m<sos.m))eDate=aD(eDate,1);
        var sds=sDate.getFullYear()+'-'+pad(sDate.getMonth()+1)+'-'+pad(sDate.getDate());
        var eds=eDate.getFullYear()+'-'+pad(eDate.getMonth()+1)+'-'+pad(eDate.getDate());
        var sT=sds+'T'+pad(sos.h)+':'+pad(sos.m)+':00.000';
        var eT=eds+'T'+pad(eos.h)+':'+pad(eos.m)+':00.000';
        return'https://fclm-portal.amazon.com/reports/functionRollup?warehouseId='+CONFIG.warehouseId+'&spanType=Intraday&startDate='+encodeURIComponent(sT)+'&endDate='+encodeURIComponent(eT)+'&reportFormat=HTML&processId='+pid;
    }

    function parseFR(html){
        var doc=new DOMParser().parseFromString(html,"text/html");
        var funcHrs={},funcOrder=[],mgrMap={};
        var tables=doc.querySelectorAll("table");
        for(var ti=0;ti<tables.length;ti++){
            var trs=tables[ti].querySelectorAll("tbody tr");
            var curF="";
            for(var r=0;r<trs.length;r++){
                var th=trs[r].querySelector("th");
                var tds=trs[r].querySelectorAll("td");
                if(th){var ht=th.textContent.trim();if(ht&&ht!=="-"&&ht!=="Total")curF=ht;}
                if(!curF||tds.length<2)continue;
                if(tds[0].textContent.trim()==="Total"){
                    var h=pN(tds[1].textContent.trim());
                    if(h>0&&!funcHrs[curF]){funcHrs[curF]=h;funcOrder.push(curF);}
                }
            }
            if(funcOrder.length>0)break;
        }
        var blocks=html.split(/<table\b/i);
        for(var t=1;t<blocks.length;t++){
            var capM=blocks[t].match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
            if(!capM)continue;
            var cap=capM[1].replace(/<[^>]+>/g,"").trim();
            if(!cap||cap==="Summary"||cap==="Display Preferences")continue;
            var matched="";for(var fi=0;fi<funcOrder.length;fi++){if(cap.indexOf(funcOrder[fi])>-1){matched=funcOrder[fi];break;}}
            if(!matched)continue;
            if(!mgrMap[matched])mgrMap[matched]={};
            var d2=new DOMParser().parseFromString("<table"+blocks[t],"text/html");
            var rs=d2.querySelectorAll("tr");
            for(var r2=0;r2<rs.length;r2++){
                var td2=rs[r2].querySelectorAll("td");
                if(td2.length<4)continue;
                var tp=td2[0].textContent.trim();
                if(tp!=="AMZN"&&tp!=="TMPF"&&tp!=="TEMP")continue;
                var mgr=(td2[3]?td2[3].textContent.trim():"")||"Unknown";
                var eh=0;for(var c=0;c<td2.length;c++){var cl=(td2[c].className||"");if(cl.indexOf("size-total")>-1&&cl.indexOf("highlighted")>-1){eh=pN(td2[c].textContent.trim());break;}}
                if(eh>0){if(!mgrMap[matched][mgr])mgrMap[matched][mgr]=0;mgrMap[matched][mgr]+=eh;}
            }
        }
        var result=[];
        for(var fi2=0;fi2<funcOrder.length;fi2++){
            var fn=funcOrder[fi2],mgrs=[];
            var mm=mgrMap[fn]||{};for(var mk in mm){if(mm.hasOwnProperty(mk))mgrs.push({name:mk,hrs:mm[mk]});}
            mgrs.sort(function(a,b){return b.hrs-a.hrs;});
            result.push({name:fn,hours:funcHrs[fn],mgrs:mgrs});
        }
        return result;
    }

    function fetchSupDetail(onP,onD){
        _supDetail={};
        var q=[];
        for(var di=0;di<_days.length;di++){
            _supDetail[di]={};
            var day=_days[di],shifts=shDay(day);
            for(var si=0;si<shifts.length;si++){
                var shift=shifts[si];
                if(!_supDetail[di][shift.name])_supDetail[di][shift.name]={};
                for(var sp=0;sp<SUPS.length;sp++){
                    var url=buildFRUrl(day,shift,SUPS[sp].pid);
                    if(url)q.push({di:di,sn:shift.name,sp:sp,url:url});
                }
            }
        }
        if(!q.length){onD();return;}
        var total=q.length,done=0,idx=0,act=0;
        function nx(){while(act<CONFIG.maxConcurrent&&idx<q.length){(function(j){act++;
            fP(j.url,function(h){
                if(h){if(!_supDetail[j.di][j.sn])_supDetail[j.di][j.sn]={};_supDetail[j.di][j.sn][j.sp]=parseFR(h);}
                else{if(!_supDetail[j.di][j.sn])_supDetail[j.di][j.sn]={};_supDetail[j.di][j.sn][j.sp]=[];}
                done++;act--;onP({done:done,total:total});
                if(done>=total)onD();else nx();
            });})(q[idx]);idx++;}}
        nx();
    }
    function GS(di,sn,spIdx){return(_supDetail[di]&&_supDetail[di][sn]&&_supDetail[di][sn][spIdx])||[];}
    var _frData={};
    function parseFRRate(html,matchName){var doc=new DOMParser().parseFromString(html,'text/html');var tables=doc.querySelectorAll('table');for(var ti=0;ti<tables.length;ti++){var trs=tables[ti].querySelectorAll('tbody tr');var curF='';for(var r=0;r<trs.length;r++){var th=trs[r].querySelector('th');var tds=trs[r].querySelectorAll('td');if(th){var ht=th.textContent.trim();if(ht&&ht!=='-'&&ht!=='Total')curF=ht;}if(matchName!=='*ALL*'&&curF.toLowerCase().indexOf(matchName.toLowerCase())===-1)continue;if(tds.length>=2&&tds[0].textContent.trim()==='Total'){var hrs=pN(tds[1].textContent.trim());var nums=[];for(var c=2;c<tds.length;c++)nums.push(pN(tds[c].textContent.trim()));var rate=0;for(var ni=3;ni<nums.length;ni+=4){if(nums[ni]>0){rate=nums[ni];break;}}if(!rate){for(var ni2=1;ni2<nums.length;ni2+=2){if(nums[ni2]>0){rate=nums[ni2];break;}}}return{tph:rate,hrs:hrs};}}}return null;}
    function GFR(di,sn,pid,match){var k=di+'_'+sn+'_'+pid;var h=_frData[k];return h?parseFRRate(h,match):null;}
    function fetchFRData(onP,onD){_frData={};var pids={};for(var s=0;s<OPS.length;s++){for(var it=0;it<OPS[s].items.length;it++){var itm=OPS[s].items[it];if(itm.frPid)pids[itm.frPid]=1;}}var pidList=Object.keys(pids);if(!pidList.length){onD();return;}var q=[];for(var di=0;di<_days.length;di++){var day=_days[di];var sh=shDay(day);for(var si=0;si<sh.length;si++){for(var pi=0;pi<pidList.length;pi++){var url=buildFRUrl(day,sh[si],pidList[pi]);if(url)q.push({di:di,sn:sh[si].name,pid:pidList[pi],url:url});}}}var total=q.length,done=0,idx=0,act=0,fin2=false;if(!total){onD();return;}setTimeout(function(){if(!fin2){fin2=true;onD();}},15000);function fin(){done++;act--;onP(done,total);if(done>=total){if(!fin2){fin2=true;onD();}}else nx();}function nx(){while(act<4&&idx<q.length){(function(j){act++;GM_xmlhttpRequest({method:'GET',url:j.url,timeout:10000,onload:function(r){if(r.status===200&&r.responseText)_frData[j.di+'_'+j.sn+'_'+j.pid]=r.responseText;fin();},onerror:function(){fin();},ontimeout:function(){fin();}});})(q[idx]);idx++;}}nx();}

    // Ã¢â€â‚¬Ã¢â€â‚¬ UI HELPERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    var TH='padding:5px 8px;border:1px solid #ccc;color:#222;font-size:0.78em;text-align:center;white-space:nowrap;';
    var TD='padding:4px 8px;border:1px solid #ccc;color:#333;text-align:center;font-size:0.78em;';
    var _hlKey=0;
    function _clearHL(){
        var all=document.querySelectorAll('[data-sp-hl]');
        for(var i=0;i<all.length;i++){all[i].style.backgroundColor=all[i].getAttribute('data-obg')||'';all[i].style.fontWeight=all[i].getAttribute('data-ofw')||'';all[i].removeAttribute('data-sp-hl');all[i].removeAttribute('data-obg');all[i].removeAttribute('data-ofw');}
        _hlKey=0;
    }
    function _hlCell(c,key){
        if(c.getAttribute('data-sp-hl'))return; // already highlighted
        c.setAttribute('data-obg',c.style.backgroundColor||'');
        c.setAttribute('data-ofw',c.style.fontWeight||'');
        c.setAttribute('data-sp-hl',key);
        c.style.backgroundColor='#bbdefb';c.style.fontWeight='bold';
    }
    // Get visual column start position for a cell in its row
    function _vCol(row,cell){
        var pos=0;
        // Account for rowSpan cells from previous rows
        var table=row.closest('table');
        if(table&&row.parentElement.tagName==='THEAD'){
            var prevRows=[];var tr=row.previousElementSibling;
            while(tr){prevRows.unshift(tr);tr=tr.previousElementSibling;}
            // Count columns spanned by rowSpan>1 from previous rows
            var spanned={};
            for(var pr=0;pr<prevRows.length;pr++){
                var p=0;
                for(var pc=0;pc<prevRows[pr].children.length;pc++){
                    while(spanned[p])p++;
                    var rs=parseInt(prevRows[pr].children[pc].rowSpan,10)||1;
                    var cs=parseInt(prevRows[pr].children[pc].colSpan,10)||1;
                    if(rs>1){for(var sc=0;sc<cs;sc++)spanned[p+sc]=true;}
                    p+=cs;
                }
            }
            // Now calculate position in current row accounting for spanned columns
            pos=0;var childIdx=0;
            while(childIdx<row.children.length){
                while(spanned[pos])pos++;
                if(row.children[childIdx]===cell)return pos;
                pos+=(parseInt(row.children[childIdx].colSpan,10)||1);
                childIdx++;
            }
            return pos;
        }
        // Body rows: simple position calc
        for(var i=0;i<row.children.length;i++){
            if(row.children[i]===cell)return pos;
            pos+=(parseInt(row.children[i].colSpan,10)||1);
        }
        return pos;
    }
    function mT(){var t=document.createElement('table');t.style.cssText='width:100%;border-collapse:collapse;font-size:0.82em;margin-bottom:4px;';
        t.addEventListener('click',function(e){
            var cell=e.target.closest('td,th');if(!cell)return;
            var row=cell.closest('tr');if(!row)return;
            var isHeader=row.parentElement.tagName==='THEAD';
            if(isHeader){
                var colStart=_vCol(row,cell);
                var colSpan=parseInt(cell.colSpan,10)||1;
                var wasActive=cell.getAttribute('data-sp-hl');
                _clearHL();
                if(!wasActive){
                    _hlKey++;var key='c'+_hlKey;
                    _hlCell(cell,key);
                    // Highlight body rows
                    var bodyRows=t.querySelectorAll('tbody tr');
                    for(var r=0;r<bodyRows.length;r++){
                        var bpos=0;
                        for(var ci=0;ci<bodyRows[r].children.length;ci++){
                            var bspan=parseInt(bodyRows[r].children[ci].colSpan,10)||1;
                            if(bpos+bspan>colStart&&bpos<colStart+colSpan) _hlCell(bodyRows[r].children[ci],key);
                            bpos+=bspan;
                        }
                    }
                    // Highlight other header cells that overlap
                    var headRows=t.querySelectorAll('thead tr');
                    for(var hr2=0;hr2<headRows.length;hr2++){
                        if(headRows[hr2]===row)continue;
                        var hpos=0,hSpanned={};
                        // Account for rowSpan from earlier rows
                        var prev=headRows[hr2].previousElementSibling;
                        if(prev){var pp=0;for(var pci=0;pci<prev.children.length;pci++){var prs=parseInt(prev.children[pci].rowSpan,10)||1;var pcs=parseInt(prev.children[pci].colSpan,10)||1;if(prs>1){for(var psc=0;psc<pcs;psc++)hSpanned[pp+psc]=true;}pp+=pcs;}}
                        hpos=0;
                        for(var hci=0;hci<headRows[hr2].children.length;hci++){
                            while(hSpanned[hpos])hpos++;
                            var hspan=parseInt(headRows[hr2].children[hci].colSpan,10)||1;
                            if(hpos+hspan>colStart&&hpos<colStart+colSpan) _hlCell(headRows[hr2].children[hci],key);
                            hpos+=hspan;
                        }
                    }
                }
            } else {
                var wasRow=row.querySelector('[data-sp-hl]');
                _clearHL();
                if(!wasRow){_hlKey++;var key2='r'+_hlKey;var tds=row.querySelectorAll('td');for(var k=0;k<tds.length;k++) _hlCell(tds[k],key2);}
            }
        });
        return t;}
    function col(c,title,color,content,open){
        var w=el('div','margin-bottom:5px;');
        var h=el('div','font-size:0.88em;font-weight:bold;color:'+color+';padding:5px 10px;background:#e8eaed;border:1px solid #ccc;border-radius:4px 4px 0 0;cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center;');
        var ar=el('span','transition:transform 0.15s;font-size:0.8em;','\u25BC');
        h.appendChild(el('span','',title));h.appendChild(ar);
        var b=el('div','border:1px solid #ccc;border-radius:0 0 4px 4px;overflow:hidden;padding:4px;');
        b.appendChild(content);var o=open!==false;
        if(!o){b.style.display='none';ar.style.transform='rotate(-90deg)';}
        h.onclick=function(){o=!o;b.style.display=o?'block':'none';ar.style.transform=o?'rotate(0deg)':'rotate(-90deg)';};
        w.appendChild(h);w.appendChild(b);c.appendChild(w);
    }
    var _tabRegistry=[];
    var _tabState={};
    var _isScriptReload=false;
    function _saveTabState(){_tabState={};for(var i=0;i<_tabRegistry.length;i++){var r=_tabRegistry[i];_tabState[r.id]=r.active;}}
    function _restoreTabState(){for(var i=0;i<_tabRegistry.length;i++){var r=_tabRegistry[i];if(_tabState[r.id])r.sw(_tabState[r.id]);}}

    var _tabIdx=0;
    function tabs(defs,lvl){
        var wrap=el('div','');
        var bg=lvl===1?'#e8eaed':lvl===2?'#f0f0f0':'#e4e6ea';
        var bar=el('div','display:flex;gap:0;background:'+bg+';border-bottom:1px solid #ccc;margin-bottom:4px;overflow-x:auto;');
        var pn={},bt={},myId='tab_'+(++_tabIdx),curActive=defs.length?defs[0].id:'';
        var reg={id:myId,active:curActive,sw:null};
        function sw(id){curActive=id;reg.active=id;for(var i=0;i<defs.length;i++){var d=defs[i].id;pn[d].style.display=d===id?'block':'none';bt[d].style.color=d===id?'#4caf50':'#777';bt[d].style.borderBottom=d===id?'2px solid #4caf50':'2px solid transparent';bt[d].style.background=d===id?'rgba(76,175,80,0.15)':'transparent';}}
        reg.sw=sw;
        for(var i=0;i<defs.length;i++){(function(d){
            var b=el('button','flex:0 0 auto;padding:5px 12px;border:none;border-bottom:2px solid transparent;cursor:pointer;font-size:0.78em;font-weight:600;background:transparent;color:#666;white-space:nowrap;',d.label);
            b.onclick=function(){sw(d.id);};bar.appendChild(b);bt[d.id]=b;
            pn[d.id]=el('div','display:none;padding:2px;');
        })(defs[i]);}
        wrap.appendChild(bar);for(var j=0;j<defs.length;j++)wrap.appendChild(pn[defs[j].id]);
        if(defs.length)sw(defs[0].id);
        _tabRegistry.push(reg);
        return{el:wrap,pn:pn};
    }
    function fmtN(v){return v?v.toLocaleString():'-';}
    function fmtD(v){return v?(v>0?'+':'')+v.toFixed(2):'-';}
    function fmtAvg(v){return v?v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):'-';}
    function dayLbl(day,shift){var lbl=DDE[day.getDay()]+' '+fSh(day);if(shift){var sos=pHM(shift.sos),eos=pHM(shift.eos);if(sos&&eos&&(eos.h<sos.h||(eos.h===sos.h&&eos.m<sos.m))){var next=aD(day,1);lbl=DDE[day.getDay()]+' '+fSh(day)+'\u2192'+DDE[next.getDay()]+' '+fSh(next);}}return lbl;}
    var _popup=null;
    function showSupPopup(funcName,dayLabel,mgrs,anchorEl){
        if(_popup){_popup.remove();_popup=null;}
        if(!mgrs||!mgrs.length)return;
        var p=el("div","position:fixed;z-index:100000;background:#fff;border:2px solid #4caf50;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);padding:14px;min-width:300px;max-width:420px;max-height:400px;overflow-y:auto;font-size:0.88em;");
        p.appendChild(el("div","font-weight:bold;color:#333;font-size:1em;margin-bottom:2px;",funcName));
        p.appendChild(el("div","color:#666;font-size:0.82em;margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:6px;",dayLabel));
        var t=el("table","width:100%;border-collapse:collapse;");
        var thr=el("tr","background:#e8eaed;");thr.appendChild(el("th","padding:5px 8px;text-align:left;border:1px solid #ddd;font-size:0.85em;","Manager"));thr.appendChild(el("th","padding:5px 8px;text-align:right;border:1px solid #ddd;font-size:0.85em;","Total Hours"));t.appendChild(thr);
        var totalH=0;
        for(var i=0;i<mgrs.length;i++){totalH+=mgrs[i].hrs;var tr=el("tr","background:"+(i%2===0?"#fff":"#f5f6f8")+";");tr.appendChild(el("td","padding:4px 8px;border:1px solid #ddd;",mgrs[i].name));tr.appendChild(el("td","padding:4px 8px;text-align:right;border:1px solid #ddd;font-weight:bold;",mgrs[i].hrs.toFixed(2)));t.appendChild(tr);}
        var tfr=el("tr","background:#e8f5e9;font-weight:bold;");tfr.appendChild(el("td","padding:5px 8px;border:1px solid #ddd;","Total"));tfr.appendChild(el("td","padding:5px 8px;text-align:right;border:1px solid #ddd;",totalH.toFixed(2)));t.appendChild(tfr);
        p.appendChild(t);
        var cls=el("div","text-align:right;margin-top:8px;");var cb=el("button","padding:4px 14px;border:1px solid #ccc;border-radius:4px;background:#f5f5f5;color:#333;cursor:pointer;font-size:0.82em;","Close");
        cb.onclick=function(){p.remove();_popup=null;};cls.appendChild(cb);p.appendChild(cls);
        var rect=anchorEl.getBoundingClientRect();
        p.style.left=Math.min(rect.left,window.innerWidth-440)+"px";
        p.style.top=Math.min(rect.bottom+4,window.innerHeight-420)+"px";
        document.body.appendChild(p);_popup=p;
        setTimeout(function(){document.addEventListener("click",function closer(e){if(_popup&&!_popup.contains(e.target)){_popup.remove();_popup=null;document.removeEventListener("click",closer);}});},100);
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ OVERVIEW Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    function rOverview(c){
        c.innerHTML='';
        c.appendChild(el('div','font-size:1em;font-weight:bold;color:#222;margin-bottom:8px;','\ud83c\udf10 Week Overview \u2014 Week '+_cw+' ('+fSh(_days[0])+' \u2192 '+fSh(_days[6])+')'));

        // Operational table with week totals
        var t=mT(),th=document.createElement('thead'),hr=el('tr','background:#e8eaed;');
        hr.appendChild(el('th',TH+'text-align:left;min-width:80px;','Day'));
        for(var s=0;s<OPS.length;s++){hr.appendChild(el('th',TH+'color:'+OPS[s].color+';',OPS[s].label+' TPH'));hr.appendChild(el('th',TH+'color:'+OPS[s].color+';',OPS[s].label+' \u0394 Hrs'));}
        th.appendChild(hr);t.appendChild(th);
        var tb=document.createElement('tbody');
        var wkTph={},wkDlt={},wkCnt={};
        for(var s2=0;s2<OPS.length;s2++){wkTph[s2]=0;wkDlt[s2]=0;wkCnt[s2]=0;}
        for(var di=0;di<_days.length;di++){var day=_days[di];
            var tr=el('tr','background:'+(di%2===0?'#fff':'#f5f6f8')+';');
            tr.appendChild(el('td',TD+'text-align:left;font-weight:bold;white-space:nowrap;',DDE[day.getDay()]+' '+fSh(day)));
            for(var si=0;si<OPS.length;si++){var d=G(di,'FD',OPS[si].tid);
                var tph=d?d.tphN:0,dlt=d?d.dltN:0;
                if(tph){wkTph[si]+=tph;wkCnt[si]++;}wkDlt[si]+=dlt;
                tr.appendChild(el('td',TD+(tph?'font-weight:bold;':''),fmtN(tph)));
                tr.appendChild(el('td',TD+'color:'+dC(dlt)+';font-weight:bold;',fmtD(dlt)));}
            tb.appendChild(tr);}
        // Week total row
        var wtr=el('tr','background:#fff;font-weight:bold;');
        wtr.appendChild(el('td',TD+'text-align:left;color:#4caf50;','\u2211 Week'));
        for(var s3=0;s3<OPS.length;s3++){
            var avgTph=wkCnt[s3]?(wkTph[s3]/wkCnt[s3]):0;
            wtr.appendChild(el('td',TD+'color:#4caf50;','avg '+fmtAvg(avgTph)));
            wtr.appendChild(el('td',TD+'color:'+dC(wkDlt[s3])+';',fmtD(wkDlt[s3])));}
        tb.appendChild(wtr);
        t.appendChild(tb);col(c,'\ud83d\udce6 Operational (IB / OB / TSO / VRET)','#4caf50',t);

        // Support - each separate, total hours from FULL_DAY data
        for(var sp=0;sp<SUPS.length;sp++){
            var sec=SUPS[sp];
            var st=mT(),sth=document.createElement('thead'),shr=el('tr','background:#e8eaed;');
            shr.appendChild(el('th',TH+'text-align:left;min-width:80px;','Day'));
            shr.appendChild(el('th',TH+'color:'+sec.color+';','Total Hours'));
            sth.appendChild(shr);st.appendChild(sth);
            var stb=document.createElement('tbody');var wkH=0;
            for(var di2=0;di2<_days.length;di2++){var day2=_days[di2];
                var tr2=el('tr','background:'+(di2%2===0?'#fff':'#f5f6f8')+';');
                tr2.appendChild(el('td',TD+'text-align:left;font-weight:bold;',DDE[day2.getDay()]+' '+fSh(day2)));
                var sd=G(di2,'FD',sec.tid);
                var h=sd?sd.hrsN:0; wkH+=h;
                tr2.appendChild(el('td',TD,h?h.toFixed(2):'-'));
                stb.appendChild(tr2);}
            // Week total
            var wtr2=el('tr','background:#fff;font-weight:bold;');
            wtr2.appendChild(el('td',TD+'text-align:left;color:#4caf50;','\u2211 Week'));
            wtr2.appendChild(el('td',TD+'color:#4caf50;',wkH?wkH.toFixed(2):'-'));
            stb.appendChild(wtr2);
            st.appendChild(stb);col(c,'\ud83d\udee0 '+sec.label,sec.color,st,false);
        }
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ BY SHIFT: shift tabs Ã¢â€ â€™ day tabs Ã¢â€ â€™ process path tabs Ã¢â€â‚¬Ã¢â€â‚¬
    // -- BY SHIFT: Shift tabs -> PP tabs -> table (items left, days with TPH+Delta right) --
    function rByShift(c){
        c.innerHTML='';
        c.appendChild(el('div','font-size:1em;font-weight:bold;color:#222;margin-bottom:8px;','\u23f0 By Shift \u2014 Week '+_cw));
        var sn=shNames();
        if(!sn.length){c.appendChild(el('div','color:#666;padding:20px;','No shifts configured.'));return;}
        var shT=tabs(sn.map(function(s){return{id:s,label:s};}),1);
        c.appendChild(shT.el);
        for(var si=0;si<sn.length;si++){
            var shift=sn[si],sp=shT.pn[shift];
            var dayDefs=[];
            for(var di=0;di<_days.length;di++){var sh=shDay(_days[di]);for(var j=0;j<sh.length;j++){if(sh[j].name===shift){dayDefs.push({di:di,day:_days[di],sh:sh[j]});break;}}}
            if(!dayDefs.length){sp.appendChild(el('div','color:#666;padding:10px;','No data for '+shift));continue;}
            var ppDefs=OPS.map(function(s){return{id:s.label,label:s.label};});
            for(var sp2=0;sp2<SUPS.length;sp2++) ppDefs.push({id:'sup_'+sp2,label:SUPS[sp2].label});
            var ppT=tabs(ppDefs,2);
            sp.appendChild(ppT.el);
            for(var sec=0;sec<OPS.length;sec++){
                var section=OPS[sec],pp=ppT.pn[section.label];
                var t=mT(),thead=document.createElement('thead');
                var hr1=el('tr','background:#e8eaed;');
                var ppTh=el('th',TH+'text-align:left;min-width:150px;position:sticky;left:0;background:#e8eaed;z-index:2;vertical-align:middle;','Process Path');ppTh.rowSpan=2;hr1.appendChild(ppTh);
                for(var dk=0;dk<dayDefs.length;dk++){var dth=el('th',TH+'min-width:120px;border-left:2px solid #999;',dayLbl(dayDefs[dk].day,dayDefs[dk].sh));dth.colSpan=2;hr1.appendChild(dth);}
                var ath=el('th',TH+'min-width:120px;color:#4caf50;border-left:2px solid #999;','\u00D8 Avg / \u2211 Total');ath.colSpan=2;hr1.appendChild(ath);
                thead.appendChild(hr1);
                var hr2=el('tr','background:#e8eaed;');
                for(var dk2=0;dk2<dayDefs.length;dk2++){hr2.appendChild(el('th',TH+'font-size:0.7em;border-left:2px solid #999;','TPH'));hr2.appendChild(el('th',TH+'font-size:0.7em;','\u0394 Hrs'));}
                hr2.appendChild(el('th',TH+'font-size:0.7em;color:#4caf50;border-left:2px solid #999;','TPH'));
                hr2.appendChild(el('th',TH+'font-size:0.7em;color:#4caf50;','\u0394 Hrs'));
                thead.appendChild(hr2);t.appendChild(thead);
                var tb=document.createElement('tbody');
                var ttr=el('tr','background:#e3f2fd;');
                ttr.appendChild(el('td',TD+'text-align:left;font-weight:bold;color:'+section.color+';position:sticky;left:0;background:#e3f2fd;z-index:1;',section.label+' Total'));
                var tST=0,tSD=0,tC=0;
                for(var dk3=0;dk3<dayDefs.length;dk3++){var td=G(dayDefs[dk3].di,shift,section.tid);var tp=td?td.tphN:0,dl=td?td.dltN:0;tST+=tp;tSD+=dl;if(tp)tC++;
                    ttr.appendChild(el('td',TD+'font-weight:bold;border-left:2px solid #999;',fmtN(tp)));ttr.appendChild(el('td',TD+'font-weight:bold;color:'+dC(dl)+';',fmtD(dl)));}
                ttr.appendChild(el('td',TD+'font-weight:bold;color:#4caf50;border-left:2px solid #999;',fmtAvg(tC?(tST/tC):0)));
                ttr.appendChild(el('td',TD+'font-weight:bold;color:'+dC(tSD)+';',fmtD(tSD)));
                tb.appendChild(ttr);
                for(var li=0;li<section.items.length;li++){var item=section.items[li];
                    var bgc=item.b?'#e3f2fd':(li%2===0?'#fff':'#f5f6f8');
                    var itr=el('tr','background:'+bgc+';');
                    itr.appendChild(el('td',TD+'text-align:left;padding-left:'+(item.b?'6':'14')+'px;position:sticky;left:0;background:'+bgc+';z-index:1;'+(item.b?'font-weight:bold;':''),item.name));
                    var iST=0,iSD=0,iC=0;
                    for(var dk4=0;dk4<dayDefs.length;dk4++){var d=item.id?G(dayDefs[dk4].di,shift,item.id):null;var fr=item.frPid?GFR(dayDefs[dk4].di,shift,item.frPid,item.frMatch):null;var tp2=fr?fr.tph:(d?d.tphN:0),dl2=d?d.dltN:0;iST+=tp2;iSD+=dl2;if(tp2)iC++;
                        itr.appendChild(el('td',TD+(item.b?'font-weight:bold;border-left:2px solid #999;':'border-left:2px solid #999;'),fmtN(tp2)));itr.appendChild(el('td',TD+'color:'+dC(dl2)+';'+(item.b?'font-weight:bold;':''),fmtD(dl2)));}
                    itr.appendChild(el('td',TD+'font-weight:bold;color:#4caf50;border-left:2px solid #999;',fmtAvg(iC?(iST/iC):0)));
                    itr.appendChild(el('td',TD+'font-weight:bold;color:'+dC(iSD)+';',fmtD(iSD)));
                    tb.appendChild(itr);}
                t.appendChild(tb);var sw=el('div','overflow-x:auto;');sw.appendChild(t);pp.appendChild(sw);
            }
            // Support sections - hours only per day
            // Support sections - hours per day + sub-function breakdown
            for(var sp3=0;sp3<SUPS.length;sp3++){
                var sup=SUPS[sp3],spp=ppT.pn['sup_'+sp3];
                var st=mT(),sth=document.createElement('thead');
                var shr=el('tr','background:#e8eaed;');
                shr.appendChild(el('th',TH+'text-align:left;min-width:180px;position:sticky;left:0;background:#e8eaed;z-index:1;','Function'));
                for(var sdk=0;sdk<dayDefs.length;sdk++)
                    shr.appendChild(el('th',TH+'min-width:80px;border-left:2px solid #999;',dayLbl(dayDefs[sdk].day,dayDefs[sdk].sh)));
                shr.appendChild(el('th',TH+'min-width:80px;color:#4caf50;border-left:2px solid #999;','\u2211 Total'));
                sth.appendChild(shr);st.appendChild(sth);
                var stb=document.createElement('tbody');
                // Total row
                var str=el('tr','background:#e3f2fd;');
                str.appendChild(el('td',TD+'text-align:left;font-weight:bold;color:'+sup.color+';position:sticky;left:0;background:#e3f2fd;z-index:1;',sup.label+' Total'));
                var swkH=0;
                for(var sdk2=0;sdk2<dayDefs.length;sdk2++){
                    var funcsT=GS(dayDefs[sdk2].di,shift,sp3);
                    var h=0;for(var ft=0;ft<funcsT.length;ft++)h+=funcsT[ft].hours;swkH+=h;
                    str.appendChild(el('td',TD+'font-weight:bold;border-left:2px solid #999;',h?h.toFixed(2):'-'));}
                str.appendChild(el('td',TD+'font-weight:bold;color:#4caf50;border-left:2px solid #999;',swkH?swkH.toFixed(2):'-'));
                stb.appendChild(str);
                // Collect all unique sub-function names across all days for this shift+support
                var allFuncs={};
                for(var sdk3=0;sdk3<dayDefs.length;sdk3++){
                    var funcs=GS(dayDefs[sdk3].di,shift,sp3);
                    for(var fi=0;fi<funcs.length;fi++) allFuncs[funcs[fi].name]=1;
                }
                var funcNames=Object.keys(allFuncs).sort();
                // Sub-function rows
                for(var fn=0;fn<funcNames.length;fn++){
                    var fName=funcNames[fn];
                    var ftr=el('tr','background:'+(fn%2===0?'#fff':'#f5f6f8')+';');
                    var fbg=fn%2===0?'#fff':'#f5f6f8';
                    ftr.appendChild(el('td',TD+'text-align:left;padding-left:14px;position:sticky;left:0;background:'+fbg+';z-index:1;',fName));
                    var fTotal=0;
                    for(var sdk4=0;sdk4<dayDefs.length;sdk4++){
                        var funcs2=GS(dayDefs[sdk4].di,shift,sp3);
                        var fh=0;
                        for(var fi2=0;fi2<funcs2.length;fi2++){if(funcs2[fi2].name===fName){fh=funcs2[fi2].hours;break;}}
                        fTotal+=fh;
                        var fCell=el('td',TD+'border-left:2px solid #999;'+(fh?'cursor:pointer;':''),fh?fh.toFixed(2):'-');
                        if(fh){
                            (function(cellEl,funcNm,dayIdx,shiftNm,supIdx,dayStr){
                                cellEl.addEventListener('click',function(ev){
                                    ev.stopPropagation();
                                    var fData=GS(dayIdx,shiftNm,supIdx);
                                    var mgrs=[];
                                    for(var xx=0;xx<fData.length;xx++){if(fData[xx].name===funcNm&&fData[xx].mgrs){mgrs=fData[xx].mgrs;break;}}
                                    showSupPopup(funcNm,dayStr+' ('+shiftNm+')',mgrs,cellEl);
                                });
                            })(fCell,fName,dayDefs[sdk4].di,shift,sp3,dayLbl(dayDefs[sdk4].day,dayDefs[sdk4].sh));
                        }
                        ftr.appendChild(fCell);
                    }
                    ftr.appendChild(el('td',TD+'font-weight:bold;color:#4caf50;border-left:2px solid #999;',fTotal?fTotal.toFixed(2):'-'));
                    stb.appendChild(ftr);
                }
                st.appendChild(stb);
                var ssw=el('div','overflow-x:auto;');ssw.appendChild(st);
                spp.appendChild(ssw);
            }
        }
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ COMPARISON: shift tabs Ã¢â€ â€™ day tabs Ã¢â€ â€™ PP tabs + week overall + shift avg Ã¢â€â‚¬Ã¢â€â‚¬
    function rCompare(c){
        c.innerHTML="";
        c.appendChild(el("div","font-size:1em;font-weight:bold;color:#222;margin-bottom:8px;","\ud83d\udcca Performance Comparison \u2014 Week "+_cw));
        var sn=shNames();
        if(!sn.length){c.appendChild(el("div","color:#666;padding:20px;","No shifts configured."));return;}
        // Top tabs: Daily Comparison | Week Overall
        var topT=tabs([{id:"daily",label:"\ud83d\udcc5 Daily Comparison"},{id:"weekly",label:"\u2211 Week Overall"}],1);
        c.appendChild(topT.el);

        // === DAILY COMPARISON: day tabs -> PP tabs -> table with shifts as columns ===
        var dailyP=topT.pn.daily;
        var dayDefs=[];
        for(var di=0;di<_days.length;di++){var sh=shDay(_days[di]);if(sh.length)dayDefs.push({di:di,day:_days[di],shifts:sh});}
        var dayT=tabs(dayDefs.map(function(dd){return{id:"d"+dd.di,label:DDE[dd.day.getDay()]+" "+fSh(dd.day)};}),2);
        dailyP.appendChild(dayT.el);
        for(var dk=0;dk<dayDefs.length;dk++){
            var dd=dayDefs[dk],dp=dayT.pn["d"+dd.di];
            var ppT=tabs(OPS.map(function(s){return{id:s.label,label:s.label};}),3);
            dp.appendChild(ppT.el);
            for(var sec=0;sec<OPS.length;sec++){
                var section=OPS[sec],pp=ppT.pn[section.label];
                var t=mT(),thead=document.createElement("thead");
                var hr1=el("tr","background:#e8eaed;");
                var ppTh=el("th",TH+"text-align:left;min-width:150px;position:sticky;left:0;background:#e8eaed;z-index:2;vertical-align:middle;","Process Path");ppTh.rowSpan=2;hr1.appendChild(ppTh);
                for(var si=0;si<dd.shifts.length;si++){var sth=el("th",TH+"min-width:120px;border-left:2px solid #999;color:#ff9800;",dd.shifts[si].name);sth.colSpan=2;hr1.appendChild(sth);}
                thead.appendChild(hr1);
                var hr2=el("tr","background:#e8eaed;");
                for(var si2=0;si2<dd.shifts.length;si2++){hr2.appendChild(el("th",TH+"font-size:0.7em;border-left:2px solid #999;","TPH"));hr2.appendChild(el("th",TH+"font-size:0.7em;","\u0394 Hrs"));}
                thead.appendChild(hr2);t.appendChild(thead);
                var tb=document.createElement("tbody");
                // Section total
                var ttr=el("tr","background:#e3f2fd;");
                ttr.appendChild(el("td",TD+"text-align:left;font-weight:bold;color:"+section.color+";position:sticky;left:0;background:#e3f2fd;z-index:1;",section.label+" Total"));
                for(var si3=0;si3<dd.shifts.length;si3++){var td=G(dd.di,dd.shifts[si3].name,section.tid);ttr.appendChild(el("td",TD+"font-weight:bold;border-left:2px solid #999;",td?td.tph:"-"));ttr.appendChild(el("td",TD+"font-weight:bold;color:"+dC(td?td.dltN:0)+";",td?td.dlt:"-"));}
                tb.appendChild(ttr);
                // Line items
                for(var li=0;li<section.items.length;li++){
                    var item=section.items[li];
                    var bgc=item.b?"#e3f2fd":(li%2===0?"#fff":"#f5f6f8");
                    var itr=el("tr","background:"+bgc+";");
                    itr.appendChild(el("td",TD+"text-align:left;padding-left:"+(item.b?"6":"14")+"px;position:sticky;left:0;background:"+bgc+";z-index:1;"+(item.b?"font-weight:bold;":""),item.name));
                    for(var si4=0;si4<dd.shifts.length;si4++){
                        var d=item.id?G(dd.di,dd.shifts[si4].name,item.id):null;
                        var fr=item.frPid?GFR(dd.di,dd.shifts[si4].name,item.frPid,item.frMatch):null;
                        var tp=fr?fr.tph:(d?d.tphN:0),dl=d?d.dltN:0;
                        itr.appendChild(el("td",TD+(item.b?"font-weight:bold;":"")+"border-left:2px solid #999;",fmtN(tp)));
                        itr.appendChild(el("td",TD+"color:"+dC(dl)+";"+(item.b?"font-weight:bold;":""),item.frPid?"-":fmtD(dl)));
                    }
                    tb.appendChild(itr);
                }
                t.appendChild(tb);var sw=el("div","overflow-x:auto;");sw.appendChild(t);pp.appendChild(sw);
            }
        }

        // === WEEK OVERALL: PP tabs -> table with shifts as columns, days as rows + avg ===
        var weekP=topT.pn.weekly;
        var ppT2=tabs(OPS.map(function(s){return{id:s.label,label:s.label};}),2);
        weekP.appendChild(ppT2.el);
        for(var sec2=0;sec2<OPS.length;sec2++){
            var section2=OPS[sec2],pp2=ppT2.pn[section2.label];
            // Section total table
            var t2=mT(),th2=document.createElement("thead"),hr3=el("tr","background:#e8eaed;");
            hr3.appendChild(el("th",TH+"text-align:left;","Day"));
            for(var sn2=0;sn2<sn.length;sn2++){hr3.appendChild(el("th",TH+"color:#ff9800;border-left:2px solid #999;",sn[sn2]+" TPH"));hr3.appendChild(el("th",TH+"color:#ff9800;",sn[sn2]+" \u0394"));}
            th2.appendChild(hr3);t2.appendChild(th2);
            var tb2=document.createElement("tbody");
            var shTotTph={},shTotDlt={},shTotCnt={};
            for(var x=0;x<sn.length;x++){shTotTph[x]=0;shTotDlt[x]=0;shTotCnt[x]=0;}
            for(var di2=0;di2<_days.length;di2++){var day2=_days[di2];
                var tr=el("tr","background:"+(di2%2===0?"#fff":"#f5f6f8")+";");
                tr.appendChild(el("td",TD+"text-align:left;font-weight:bold;",DDE[day2.getDay()]+" "+fSh(day2)));
                for(var sn3=0;sn3<sn.length;sn3++){var td2=G(di2,sn[sn3],section2.tid);
                    var tph=td2?td2.tphN:0,dlt=td2?td2.dltN:0;
                    if(tph){shTotTph[sn3]+=tph;shTotCnt[sn3]++;}shTotDlt[sn3]+=dlt;
                    tr.appendChild(el("td",TD+"font-weight:bold;border-left:2px solid #999;",fmtN(tph)));
                    tr.appendChild(el("td",TD+"color:"+dC(dlt)+";font-weight:bold;",fmtD(dlt)));}
                tb2.appendChild(tr);}
            // Avg row
            var avgR=el("tr","background:#fff;font-weight:bold;");
            avgR.appendChild(el("td",TD+"text-align:left;color:#4caf50;","\u00D8 Avg"));
            for(var sn4=0;sn4<sn.length;sn4++){
                var avg=shTotCnt[sn4]?(shTotTph[sn4]/shTotCnt[sn4]):0;
                avgR.appendChild(el("td",TD+"color:#4caf50;border-left:2px solid #999;",fmtAvg(avg)));
                var avgD=shTotCnt[sn4]?(shTotDlt[sn4]/shTotCnt[sn4]):0;
                avgR.appendChild(el("td",TD+"color:"+dC(avgD)+";",fmtD(avgD)));}
            tb2.appendChild(avgR);
            // Total row
            var totR=el("tr","background:#fff;font-weight:bold;");
            totR.appendChild(el("td",TD+"text-align:left;color:#ff9800;","\u2211 Total"));
            for(var sn5=0;sn5<sn.length;sn5++){
                totR.appendChild(el("td",TD+"color:#ff9800;border-left:2px solid #999;","-"));
                totR.appendChild(el("td",TD+"color:"+dC(shTotDlt[sn5])+";font-weight:bold;",fmtD(shTotDlt[sn5])));}
            tb2.appendChild(totR);
            t2.appendChild(tb2);
            col(pp2,section2.label+" Total",section2.color,t2);

            // Line items as collapsibles
            for(var li2=0;li2<section2.items.length;li2++){
                var item2=section2.items[li2];
                var it=mT(),ith=document.createElement("thead"),ihr=el("tr","background:#e8eaed;");
                ihr.appendChild(el("th",TH+"text-align:left;","Day"));
                for(var sn6=0;sn6<sn.length;sn6++){ihr.appendChild(el("th",TH+"color:#ff9800;border-left:2px solid #999;",sn[sn6]+" TPH"));ihr.appendChild(el("th",TH+"color:#ff9800;",sn[sn6]+" \u0394"));}
                ith.appendChild(ihr);it.appendChild(ith);
                var itb=document.createElement("tbody");
                for(var di3=0;di3<_days.length;di3++){var day3=_days[di3];
                    var itr2=el("tr","background:"+(di3%2===0?"#fff":"#f5f6f8")+";");
                    itr2.appendChild(el("td",TD+"text-align:left;font-weight:bold;",DDE[day3.getDay()]+" "+fSh(day3)));
                    for(var sn7=0;sn7<sn.length;sn7++){var d2=item2.id?G(di3,sn[sn7],item2.id):null;var fr2=item2.frPid?GFR(di3,sn[sn7],item2.frPid,item2.frMatch):null;
                        itr2.appendChild(el("td",TD+"border-left:2px solid #999;",fr2?fr2.tph.toLocaleString():(d2?d2.tph:"-")));
                        itr2.appendChild(el("td",TD+"color:"+dC(item2.frPid?0:(d2?d2.dltN:0))+";",item2.frPid?"-":(d2?d2.dlt:"-")));}
                    itb.appendChild(itr2);}
                it.appendChild(itb);
                col(pp2,item2.name,"#aaa",it,false);
            }
        }
    }

    // (Heatmap removed)

    // Ã¢â€â‚¬Ã¢â€â‚¬ SETTINGS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    function rSettings(c){
        c.innerHTML='';
        c.appendChild(el('div','font-size:1em;font-weight:bold;color:#222;margin-bottom:8px;','\u2699 Settings'));
        var fw=el('div','margin-bottom:14px;display:flex;align-items:center;gap:10px;');
        fw.appendChild(el('span','color:#333;font-size:0.88em;','FC Code:'));
        var fi=el('input','width:80px;padding:4px 8px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#222;font-size:0.88em;');
        fi.value=_s.fc||'BRE4';fw.appendChild(fi);c.appendChild(fw);


        c.appendChild(el('div','font-size:0.92em;font-weight:bold;color:#4caf50;margin-bottom:6px;border-bottom:1px solid #333;padding-bottom:3px;','Shift Timings'));
        var sm=_s.shiftMatrix||{},sk=Object.keys(sm),dns=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],inp={};
        for(var si=0;si<sk.length;si++){var sn=sk[si];inp[sn]={};
            var sw=el('div','margin-bottom:10px;');
            sw.appendChild(el('div','font-size:0.85em;font-weight:bold;color:#ff9800;margin-bottom:3px;',sn));
            var g=el('div','display:grid;grid-template-columns:50px repeat(7,1fr);gap:2px;font-size:0.75em;');
            g.appendChild(el('div','color:#666;padding:2px;',''));
            for(var d=0;d<dns.length;d++)g.appendChild(el('div','color:#666;text-align:center;padding:2px;',dns[d]));
            g.appendChild(el('div','color:#555;padding:2px;','Start'));
            for(var d2=0;d2<dns.length;d2++){var dn=dns[d2];
                var si2=el('input','width:100%;padding:2px;border:1px solid #ccc;border-radius:3px;background:#e8eaed;color:#222;font-size:0.9em;text-align:center;box-sizing:border-box;');
                si2.type='time';si2.value=(sm[sn]&&sm[sn][dn])?sm[sn][dn].sos:'';
                if(!inp[sn][dn])inp[sn][dn]={};inp[sn][dn].sos=si2;g.appendChild(si2);}
            g.appendChild(el('div','color:#555;padding:2px;','End'));
            for(var d3=0;d3<dns.length;d3++){var dn2=dns[d3];
                var ei=el('input','width:100%;padding:2px;border:1px solid #ccc;border-radius:3px;background:#e8eaed;color:#222;font-size:0.9em;text-align:center;box-sizing:border-box;');
                ei.type='time';ei.value=(sm[sn]&&sm[sn][dn2])?sm[sn][dn2].eos:'';
                inp[sn][dn2].eos=ei;g.appendChild(ei);}
            sw.appendChild(g);c.appendChild(sw);}
        var sl=el('div','display:flex;align-items:center;gap:8px;margin-top:6px;');
        var sb=el('button','padding:6px 20px;border:1px solid #4caf50;border-radius:6px;font-size:0.85em;font-weight:bold;background:#e8f5e9;color:#4caf50;cursor:pointer;','\ud83d\udcbe Save');
        var sm2=el('span','color:#4caf50;font-size:0.8em;display:none;','\u2705 Saved!');
        sb.onclick=function(){_s.fc=fi.value.trim()||'BRE4';CONFIG.warehouseId=_s.fc;
            for(var i=0;i<sk.length;i++){var sn2=sk[i];for(var j=0;j<dns.length;j++){var dn3=dns[j];
                var sv=inp[sn2][dn3].sos.value,ev=inp[sn2][dn3].eos.value;
                if(sv&&ev){if(!_s.shiftMatrix[sn2])_s.shiftMatrix[sn2]={};_s.shiftMatrix[sn2][dn3]={sos:sv,eos:ev};}
                else{if(_s.shiftMatrix[sn2])_s.shiftMatrix[sn2][dn3]=null;}}}
            saveS(_s);sm2.style.display='inline';setTimeout(function(){sm2.style.display='none';},2000);};
        sl.appendChild(sb);sl.appendChild(sm2);
        var rb=el('button','padding:5px 14px;border:1px solid #bbb;border-radius:6px;font-size:0.82em;background:#e8eaed;color:#333;cursor:pointer;','Reset Defaults');
        rb.onclick=function(){_s=defS();saveS(_s);CONFIG.warehouseId=_s.fc;rSettings(c);};
        sl.appendChild(rb);c.appendChild(sl);
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ SNAPSHOT: select line item + shift Ã¢â€ â€™ styled card + screenshot Ã¢â€â‚¬Ã¢â€â‚¬
    function rSnapshot(c){
        c.innerHTML='';
        c.appendChild(el('div','font-size:1em;font-weight:bold;color:#222;margin-bottom:10px;','\ud83d\udcf8 Snapshot \u2014 Week '+_cw));
        if(!_days.length){c.appendChild(el('div','color:#666;padding:20px;','Load data first.'));return;}

        // Build flat list of all selectable items
        var allItems=[];
        for(var s=0;s<OPS.length;s++){
            allItems.push({label:OPS[s].label+' Total',id:OPS[s].tid,sec:OPS[s].label,color:OPS[s].color});
            for(var i=0;i<OPS[s].items.length;i++)
                allItems.push({label:OPS[s].items[i].name,id:OPS[s].items[i].id,frPid:OPS[s].items[i].frPid,frMatch:OPS[s].items[i].frMatch,sec:OPS[s].label,color:OPS[s].color});
        }
        var sn=shNames();

        // Controls
        var ctrl=el('div','display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;');
        // Line item select
        var itemSel=document.createElement('select');
        itemSel.style.cssText='padding:5px 8px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#222;font-size:0.85em;max-width:250px;';
        var curGroup='';
        for(var ai=0;ai<allItems.length;ai++){
            if(allItems[ai].sec!==curGroup){
                var og=document.createElement('optgroup');og.label=allItems[ai].sec;itemSel.appendChild(og);curGroup=allItems[ai].sec;}
            var opt=document.createElement('option');opt.value=ai;opt.textContent=allItems[ai].label;
            itemSel.lastChild.appendChild(opt);
        }
        ctrl.appendChild(el('span','color:#333;font-size:0.85em;','Line Item:'));
        ctrl.appendChild(itemSel);

        // Shift select
        var shSel=document.createElement('select');
        shSel.style.cssText='padding:5px 8px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#222;font-size:0.85em;';
        for(var si=0;si<sn.length;si++){var o=document.createElement('option');o.value=sn[si];o.textContent=sn[si];shSel.appendChild(o);}
        ctrl.appendChild(el('span','color:#333;font-size:0.85em;','Shift:'));
        ctrl.appendChild(shSel);

        var genBtn=el('button','padding:5px 16px;border:1px solid #4caf50;border-radius:6px;font-size:0.85em;font-weight:bold;background:#e8f5e9;color:#4caf50;cursor:pointer;','Generate');
        ctrl.appendChild(genBtn);
        c.appendChild(ctrl);

        var cardWrap=el('div','');
        c.appendChild(cardWrap);

        function generateCard(){
            cardWrap.innerHTML='';
            var idx=parseInt(itemSel.value,10);
            var item=allItems[idx];
            var shift=shSel.value;
            if(!item)return;

            // Collect data for each day this shift runs
            var dayData=[];var sum=0,cnt=0;
            for(var di=0;di<_days.length;di++){
                var day=_days[di];
                var sh=shDay(day);var hasShift=false;
                for(var j=0;j<sh.length;j++){if(sh[j].name===shift){hasShift=true;break;}}
                if(!hasShift)continue;
                var d=item.id?G(di,shift,item.id):null;var fr=item.frPid?GFR(di,shift,item.frPid,item.frMatch):null;
                var tph=fr?fr.tph:(d?d.tphN:0);
                dayData.push({day:day,tph:tph});
                sum+=tph;if(tph)cnt++;
            }
            var avg=cnt?(sum/cnt):0;

            // Find min/max for color scaling
            var vals=dayData.map(function(dd){return dd.tph;}).filter(function(v){return v>0;});
            var mn=vals.length?Math.min.apply(null,vals):0;
            var mx=vals.length?Math.max.apply(null,vals):1;

            function rowColor(v){
                if(!v)return'#f0f0f0';
                if(mx===mn)return'rgba(76,175,80,0.15)';
                var ratio=(v-mn)/(mx-mn);
                // Low = warm (peach), High = cool (green)
                var r=Math.round(255-(ratio*50));
                var g=Math.round(200+(ratio*55));
                var b=Math.round(180-(ratio*80));
                return'rgba('+r+','+g+','+b+',0.18)';
            }

            // Build card
            var card=el('div','background:#e8eaed;border:2px solid #ccc;border-radius:10px;overflow:hidden;max-width:420px;font-family:Arial,sans-serif;');
            // Title bar
            var titleBar=el('div','background:#e0e0e0;padding:10px 16px;text-align:center;');
            titleBar.appendChild(el('div','font-size:1.1em;font-weight:bold;color:#222;',item.label+' | '+({ES:'Early Shift',LS:'Late Shift',NS:'Night Shift',CS:'Custom Shift'}[shift]||shift)+' | Week '+_cw));
            card.appendChild(titleBar);

            // Rows
            for(var r=0;r<dayData.length;r++){
                var dd=dayData[r];
                var fullDay=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dd.day.getDay()];
                var row=el('div','display:flex;justify-content:space-between;padding:8px 16px;border-bottom:1px solid #333;background:'+rowColor(dd.tph)+';');
                row.appendChild(el('span','font-weight:bold;color:#333;font-size:0.95em;',fullDay));
                row.appendChild(el('span','font-weight:bold;color:#222;font-size:0.95em;',dd.tph?fmtAvg(dd.tph):'-'));
                card.appendChild(row);
            }
            // Average row
            var avgRow=el('div','display:flex;justify-content:space-between;padding:10px 16px;background:rgba(76,175,80,0.2);');
            avgRow.appendChild(el('span','font-weight:bold;color:#4caf50;font-size:1em;','Average'));
            avgRow.appendChild(el('span','font-weight:bold;color:#4caf50;font-size:1em;',fmtAvg(avg)));
            card.appendChild(avgRow);

            cardWrap.appendChild(card);

            // Screenshot button
            var snapBtn=el('button','padding:6px 18px;border:1px solid #2196F3;border-radius:6px;font-size:0.85em;font-weight:bold;background:#fff;color:#1565c0;cursor:pointer;margin-top:10px;','\ud83d\udcf7 Copy as Image');
            snapBtn.onclick=function(){
                // Use html2canvas-like approach via canvas
                try{
                    var range=document.createRange();
                    range.selectNode(card);
                    var sel=window.getSelection();
                    sel.removeAllRanges();sel.addRange(range);
                    // Try clipboard API with canvas fallback
                    if(typeof html2canvas!=='undefined'){
                        html2canvas(card).then(function(canvas){
                            canvas.toBlob(function(blob){
                                navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(function(){
                                    snapBtn.textContent='\u2705 Copied!';setTimeout(function(){snapBtn.textContent='\ud83d\udcf7 Copy as Image';},2000);
                                });
                            });
                        });
                    } else {
                        // Fallback: copy as text selection
                        document.execCommand('copy');
                        sel.removeAllRanges();
                        snapBtn.textContent='\u2705 Copied (text)!';setTimeout(function(){snapBtn.textContent='\ud83d\udcf7 Copy as Image';},2000);
                    }
                }catch(e){snapBtn.textContent='\u274c Failed';setTimeout(function(){snapBtn.textContent='\ud83d\udcf7 Copy as Image';},2000);}
            };
            cardWrap.appendChild(snapBtn);

            // Download as PNG button
            var dlBtn=el('button','padding:6px 18px;border:1px solid #ff9800;border-radius:6px;font-size:0.85em;font-weight:bold;background:#fff3e0;color:#e65100;cursor:pointer;margin-top:10px;margin-left:8px;','\u2b07 Save as PNG');
            dlBtn.onclick=function(){
                // Canvas-based screenshot
                var w=card.offsetWidth,h=card.offsetHeight;
                var cvs=document.createElement('canvas');cvs.width=w*2;cvs.height=h*2;
                var ctx=cvs.getContext('2d');ctx.scale(2,2);
                // Draw background
                ctx.fillStyle='#f4f5f7';ctx.fillRect(0,0,w,h);
                // Title
                ctx.fillStyle='#444';ctx.fillRect(0,0,w,42);
                ctx.fillStyle='#fff';ctx.font='bold 16px Arial';ctx.textAlign='center';
                ctx.fillText(item.label+' | '+({ES:'Early Shift',LS:'Late Shift',NS:'Night Shift',CS:'Custom Shift'}[shift]||shift)+' | Week '+_cw,w/2,27);
                // Rows
                var y=42;
                for(var ri=0;ri<dayData.length;ri++){
                    var dd2=dayData[ri];
                    var fullDay2=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dd2.day.getDay()];
                    ctx.fillStyle=rowColor(dd2.tph);ctx.fillRect(0,y,w,34);
                    ctx.strokeStyle='#333';ctx.beginPath();ctx.moveTo(0,y+34);ctx.lineTo(w,y+34);ctx.stroke();
                    ctx.fillStyle='#ddd';ctx.font='bold 14px Arial';ctx.textAlign='left';
                    ctx.fillText(fullDay2,16,y+22);
                    ctx.fillStyle='#fff';ctx.textAlign='right';
                    ctx.fillText(dd2.tph?fmtAvg(dd2.tph):'-',w-16,y+22);
                    y+=34;
                }
                // Average
                ctx.fillStyle='rgba(76,175,80,0.25)';ctx.fillRect(0,y,w,38);
                ctx.fillStyle='#4caf50';ctx.font='bold 15px Arial';ctx.textAlign='left';
                ctx.fillText('Average',16,y+25);
                ctx.textAlign='right';
                ctx.fillText(fmtAvg(avg),w-16,y+25);
                // Download
                var a=document.createElement('a');a.href=cvs.toDataURL('image/png');
                a.download=(item.label+'_'+shift+'_Week'+_cw).replace(/[^a-zA-Z0-9]/g,'_')+'_'+shift+'_Week '+_cw+'.png';a.click();
                dlBtn.textContent='\u2705 Saved!';setTimeout(function(){dlBtn.textContent='\u2b07 Save as PNG';},2000);
            };
            cardWrap.appendChild(dlBtn);
        }

        genBtn.onclick=generateCard;
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ CSV Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    function exportCsv(){
        var rows=[['Day','Date','Shift','Section','Process Path','TPH','Delta Hrs','Hours']];
        for(var di=0;di<_days.length;di++){var day=_days[di],sh=shDay(day);
            for(var si=0;si<sh.length;si++){var sn=sh[si].name;
                for(var sec=0;sec<OPS.length;sec++){var section=OPS[sec];
                    var td=G(di,sn,section.tid);
                    rows.push([DN[day.getDay()],fISO(day),sn,section.label,section.label+' Total',td?td.tph:'',td?td.dlt:'',td?td.hrs:'']);
                    for(var li=0;li<section.items.length;li++){var item=section.items[li],d=G(di,sn,item.id);
                        rows.push([DN[day.getDay()],fISO(day),sn,section.label,item.name,d?d.tph:'',d?d.dlt:'',d?d.hrs:'']);}}}}
        var csv=rows.map(function(r){return r.join(';');}).join('\n');
        var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
        var a=document.createElement('a');a.href=URL.createObjectURL(blob);
        a.download='ShiftPulse_Weekeek '+_cw+'_'+CONFIG.warehouseId+'.csv';a.click();
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ MAIN PANEL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    function buildPanel(){
        var wr=el('div','position:fixed;top:50%;left:0;z-index:999999;font-family:Arial,sans-serif;font-size:0.92em;transform:translateY(-50%);');
        var btn=el('button','padding:16px 11px;border:none;border-radius:0 10px 10px 0;font-size:1.05em;font-weight:bold;background:#37474f;color:#fff;cursor:grab;box-shadow:2px 2px 10px rgba(0,0,0,0.3);transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:4px;');var btnTxt=el('span','writing-mode:vertical-rl;letter-spacing:3px;','Weekly Dashboard');var btnArrow=el('span','font-size:0.7em;','\u25BC');btn.appendChild(btnTxt);btn.appendChild(btnArrow);



        wr.appendChild(btn);
        var ov=el('div','display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.4);z-index:9999999;');
        var db=el('div','position:absolute;top:2%;left:2%;width:96%;height:96%;background:#f4f5f7;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;');
        
        // Header
        var hdr=el('div','background:#e8eaed;color:#222;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;flex-wrap:wrap;gap:6px;');
        var tl=el('div','display:flex;align-items:center;gap:8px;flex-wrap:wrap;');
        tl.appendChild(el('span','font-weight:bold;font-size:1.05em;border-bottom:2px solid #4caf50;padding-bottom:2px;','\u26a1 ShiftPulse'));
        var fcB=el('span','background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:10px;font-size:0.72em;font-weight:bold;',CONFIG.warehouseId);tl.appendChild(fcB);
        var kwB=el('span','background:#4caf50;color:#222;padding:2px 10px;border-radius:12px;font-size:0.72em;font-weight:bold;','Week '+_cw);tl.appendChild(kwB);
        var stB=el('span','font-size:0.72em;color:#666;font-family:monospace;','');tl.appendChild(stB);
        hdr.appendChild(tl);
        var nav=el('div','display:flex;align-items:center;gap:4px;');
        nav.appendChild(el('span','color:#666;font-size:0.75em;','Week:'));
        var cwI=el('input','width:44px;padding:2px 4px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#222;text-align:center;font-size:0.8em;');cwI.type='number';cwI.min=1;cwI.max=53;cwI.value=_cw;
        var yrI=el('input','width:52px;padding:2px 4px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#222;text-align:center;font-size:0.8em;');yrI.type='number';yrI.value=_yr;
        var pB=el('button','padding:2px 8px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#333;cursor:pointer;font-size:0.78em;','\u25C0');
        var nB=el('button','padding:2px 8px;border:1px solid #bbb;border-radius:4px;background:#e8eaed;color:#333;cursor:pointer;font-size:0.78em;','\u25B6');
        var tB=el('button','padding:2px 8px;border:1px solid #4caf50;border-radius:4px;background:#e8f5e9;color:#4caf50;cursor:pointer;font-size:0.78em;font-weight:bold;','Today');
        nav.appendChild(cwI);nav.appendChild(yrI);nav.appendChild(pB);nav.appendChild(tB);nav.appendChild(nB);
        hdr.appendChild(nav);
        var bts=el('div','display:flex;gap:4px;align-items:center;');
        var ldB=el('button','padding:3px 12px;border:1px solid #4caf50;border-radius:6px;font-size:0.78em;font-weight:bold;background:#e8f5e9;color:#4caf50;cursor:pointer;','\u25B6 Load');
        var csB=el('button','padding:3px 8px;border:1px solid #bbb;border-radius:6px;font-size:0.78em;background:#e8eaed;color:#333;cursor:pointer;','\u2b07 CSV');
        var clB=el('button','padding:3px 8px;border:1px solid #bbb;border-radius:6px;font-size:0.78em;background:#e8eaed;color:#f44336;cursor:pointer;font-weight:bold;','\u2715');
        clB.onclick=function(){ov.style.display='none';};
        bts.appendChild(ldB);bts.appendChild(csB);bts.appendChild(clB);
        hdr.appendChild(bts);db.appendChild(hdr);

        // Main tabs
        var tabBar=el('div','display:flex;gap:0;background:#fff;border-bottom:2px solid #ccc;flex-shrink:0;');
        var TABS=[{id:'ov',label:'\ud83c\udf10 Overview'},{id:'bs',label:'\u23f0 By Shift'},{id:'cp',label:'\ud83d\udcca Comparison'},{id:'sn',label:'\ud83d\udcf8 Snapshot'},{id:'st',label:'\u2699 Settings'}];
        var tP={},tBn={};
        function swT(id){for(var i=0;i<TABS.length;i++){var t=TABS[i].id;tP[t].style.display=t===id?'block':'none';tBn[t].style.color=t===id?'#4caf50':'#888';tBn[t].style.borderBottom=t===id?'2px solid #4caf50':'2px solid transparent';}}
        for(var i=0;i<TABS.length;i++){(function(tab){
            var b=el('button','flex:1;padding:6px 8px;border:none;border-bottom:2px solid transparent;cursor:pointer;font-size:0.8em;font-weight:600;background:transparent;color:#666;',tab.label);
            b.onclick=function(){swT(tab.id);if(tab.id==='st')rSettings(tP.st);if(tab.id==='sn')rSnapshot(tP.sn);};tabBar.appendChild(b);tBn[tab.id]=b;
            tP[tab.id]=el('div','display:none;padding:8px;');
        })(TABS[i]);}
        db.appendChild(tabBar);
        var cw=el('div','flex:1;overflow-y:auto;');
        for(var j=0;j<TABS.length;j++)cw.appendChild(tP[TABS[j].id]);
        db.appendChild(cw);ov.appendChild(db);
        ov.onclick=function(e){if(e.target===ov)ov.style.display='none';};
        document.body.appendChild(ov);wr.appendChild(ov);document.body.appendChild(wr);

        function sync(){cwI.value=_cw;yrI.value=_yr;kwB.textContent='Week '+_cw;fcB.textContent=CONFIG.warehouseId;}
        function doLoad(){
            _cw=parseInt(cwI.value,10)||_cw;_yr=parseInt(yrI.value,10)||_yr;sync();
            _saveTabState(); // remember sub-tab positions
            _isScriptReload=true;
            ldB.disabled=true;ldB.textContent='\u23f3...';
            stB.textContent='Fetching...';stB.style.color='#ff9800';
            _tabRegistry=[];_tabIdx=0; // reset tab registry for fresh render
            for(var i=0;i<TABS.length;i++)if(TABS[i].id!=='st')tP[TABS[i].id].innerHTML='';
            // Floating progress bar overlay
            var pOverlay=el('div','position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(244,245,247,0.95);z-index:50;display:flex;align-items:center;justify-content:center;');
            var pBarWrap=el('div','text-align:center;width:350px;');
            var pLabel=el('div','color:#555;font-size:0.88em;margin-bottom:8px;font-weight:bold;','\u23f3 Loading...');
            var pBarOuter=el('div','width:100%;height:22px;background:#e0e0e0;border-radius:11px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);');
            var pBarInner=el('div','width:0%;height:100%;background:linear-gradient(90deg,#4caf50,#66bb6a);border-radius:11px;transition:width 0.2s;');
            var pPct=el('div','color:#333;font-size:0.82em;margin-top:6px;font-weight:bold;','0%');
            pBarOuter.appendChild(pBarInner);pBarWrap.appendChild(pLabel);pBarWrap.appendChild(pBarOuter);pBarWrap.appendChild(pPct);
            pOverlay.appendChild(pBarWrap);
            cw.style.position='relative';cw.appendChild(pOverlay);
            // Calculate total steps using week days directly
            var wkd=wkDays(_cw,_yr);var pprQ=0;for(var pi=0;pi<wkd.length;pi++){pprQ+=shDay(wkd[pi]).length+1;}
            var supQ=0;for(var si2=0;si2<wkd.length;si2++){var ssh2=shDay(wkd[si2]);for(var sj2=0;sj2<ssh2.length;sj2++)supQ+=SUPS.length;}
            var frPids2={};for(var fp=0;fp<OPS.length;fp++){for(var fi2=0;fi2<OPS[fp].items.length;fi2++){if(OPS[fp].items[fi2].frPid)frPids2[OPS[fp].items[fi2].frPid]=1;}}var frQ=Object.keys(frPids2).length;var frTotal=0;for(var fw=0;fw<wkd.length;fw++)frTotal+=shDay(wkd[fw]).length*frQ;var grandTotal=pprQ+supQ+frTotal,grandDone=0;
            function pUp(label,done,total){grandDone++;var pct=grandTotal?Math.round((grandDone/grandTotal)*100):0;pBarInner.style.width=pct+'%';pPct.textContent=pct+'%';pLabel.textContent=label+' '+done+'/'+total;}
            fetchAll(
                function(s){pUp('PPR Data',s.done,s.total);stB.textContent='PPR: '+s.done+'/'+s.total;},
                function(){
                    fetchSupDetail(function(s2){pUp('Support Detail',s2.done,s2.total);stB.textContent='Support: '+s2.done+'/'+s2.total;},function(){
                    fetchFRData(function(d,t){grandDone++;var pct=grandTotal?Math.round((grandDone/grandTotal)*100):0;pBarInner.style.width=pct+'%';pPct.textContent=pct+'%';pLabel.textContent='Rates '+d+'/'+t;},function(){                        pBarInner.style.width='100%';pPct.textContent='100%';pLabel.textContent='\u2705 Complete!';setTimeout(function(){if(pOverlay.parentNode)pOverlay.remove();},500);
                        ldB.disabled=false;ldB.textContent='\u21bb Reload';
                        var now=new Date();stB.textContent='\u2705 '+pad(now.getHours())+':'+pad(now.getMinutes())+':'+pad(now.getSeconds());stB.style.color='#4caf50';
                    if(pOverlay.parentNode)pOverlay.remove();rOverview(tP.ov);rByShift(tP.bs);rCompare(tP.cp);rSnapshot(tP.sn);
                        if(_isScriptReload)_restoreTabState();_isScriptReload=false;});
                    });
                });
        }
        ldB.onclick=doLoad;
        csB.onclick=function(){exportCsv();};
        pB.onclick=function(){_cw--;if(_cw<1){_cw=52;_yr--;}sync();doLoad();};
        nB.onclick=function(){_cw++;if(_cw>52){_cw=1;_yr++;}sync();doLoad();};
        tB.onclick=function(){_cw=isoWk(new Date());_yr=isoYr(new Date());sync();doLoad();};
        // Draggable button - sticks to left/right edge, moves up/down, snaps at 50%
        var btnSide='left'; // 'left' or 'right'
        var isDragging=false,dragStartY=0,btnStartTop=0;
        function updateBtnSide(){if(btnSide==='left'){wr.style.left='0';wr.style.right='auto';btn.style.borderRadius='0 10px 10px 0';btnTxt.style.transform='rotate(0deg)';btnArrow.textContent='\u25B6';}else{wr.style.left='auto';wr.style.right='0';btn.style.borderRadius='10px 0 0 10px';btnTxt.style.transform='rotate(180deg)';btnArrow.textContent='\u25C0';}}
        updateBtnSide();
        btn.addEventListener('mousedown',function(e){e.preventDefault();isDragging=false;dragStartY=e.clientY;var rect=wr.getBoundingClientRect();btnStartTop=rect.top;
            function onMove(e2){isDragging=true;var newTop=btnStartTop+(e2.clientY-dragStartY);newTop=Math.max(0,Math.min(window.innerHeight-100,newTop));wr.style.top=newTop+'px';wr.style.transform='none';
                var mid=window.innerWidth/2;if(e2.clientX>mid&&btnSide==='left'){btnSide='right';updateBtnSide();}else if(e2.clientX<=mid&&btnSide==='right'){btnSide='left';updateBtnSide();}}
            function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);if(!isDragging){ov.style.display='block';swT('ov');}}
            document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);});
        btn.style.cursor='grab';

        // On full page load: don't auto-restore, start fresh
        // Only remember that dashboard was open (for convenience)
    }

    buildPanel();
})();
