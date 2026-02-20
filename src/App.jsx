import React, { useState, useEffect, useRef } from "react";

/* ── Animated counter ── */
function useAnimatedNumber(value, duration = 700) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current;
    const delta = value - start;
    if (delta === 0) return;
    const startTime = performance.now();
    const raf = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + delta * ease));
      if (t < 1) requestAnimationFrame(raf);
      else prev.current = value;
    };
    requestAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

const CATEGORIES = {
  Income:  ["Salary 💼","Freelance 💻","Business 🏪","Investment 📈","Gift 🎁","Other ✨"],
  Expense: ["Food 🍜","Transport 🚌","Shopping 🛍️","Health 💊","Entertainment 🎬","Bills ⚡","Education 📚","Travel ✈️","Other 📌"],
};

const CAT_ICON = (c) => c?.split(" ")[1] || "📌";
const CAT_NAME = (c) => c?.split(" ")[0] || c;
const fmt   = (n) => "₹" + Math.abs(n).toLocaleString("en-IN");
const toYM  = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const toISO = (d) => d.toISOString().slice(0,10);
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const today = new Date();
const pd1 = new Date(today); pd1.setDate(today.getDate()-8);
const pd2 = new Date(today); pd2.setDate(today.getDate()-3);
const pd3 = new Date(today); pd3.setDate(today.getDate()-1);

const SEED = [
  { id:1, desc:"Monthly Salary",     amount:90000, type:"Income",  cat:"Salary 💼",       date:toISO(today) },
  { id:2, desc:"Grocery Run",         amount:4200,  type:"Expense", cat:"Food 🍜",          date:toISO(pd2)   },
  { id:3, desc:"Netflix + Hotstar",   amount:999,   type:"Expense", cat:"Entertainment 🎬", date:toISO(pd3)   },
  { id:4, desc:"Freelance Project",   amount:22000, type:"Income",  cat:"Freelance 💻",     date:toISO(pd1)   },
  { id:5, desc:"Metro Card Recharge", amount:500,   type:"Expense", cat:"Transport 🚌",     date:toISO(pd2)   },
];

export default function App() {
  const [dark, setDark]           = useState(false);
  const [transactions, setTx]     = useState(SEED);
  const [activeTab, setActiveTab] = useState("overview");

  /* form */
  const [desc, setDesc]           = useState("");
  const [amount, setAmount]       = useState("");
  const [type, setType]           = useState("Income");
  const [cat, setCat]             = useState(CATEGORIES.Income[0]);
  const [customCat, setCustomCat] = useState("");
  const [txDate, setTxDate]       = useState(toISO(today));

  /* list */
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [toast, setToast]   = useState(null);

  /* monthly nav */
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear,  setViewYear]  = useState(today.getFullYear());

  useEffect(() => { setCat(CATEGORIES[type][0]); setCustomCat(""); }, [type]);

  const isOther      = cat.startsWith("Other");
  const effectiveCat = isOther && customCat.trim() ? `${customCat.trim()} 📌` : cat;

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2800);
  };

  const addTx = (e) => {
    e.preventDefault();
    const a = parseFloat(amount);
    if (!desc.trim() || !a || a <= 0) { showToast("Enter a valid description & amount!", "#ef4444"); return; }
    if (isOther && !customCat.trim()) { showToast("Please enter a custom category name!", "#ef4444"); return; }
    setTx(prev => [...prev, { id:Date.now(), desc:desc.trim(), amount:a, type, cat:effectiveCat, date:txDate }]);
    setDesc(""); setAmount(""); setCustomCat("");
    const dateLabel = new Date(txDate+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});
    showToast(`${type} added for ${dateLabel}!`, type==="Income"?"#10d97e":"#ff5f7e");
  };

  const deleteTx = (id) => setTx(prev => prev.filter(t => t.id !== id));

  /* ── all-time ── */
  const totalIncome  = transactions.filter(t=>t.type==="Income").reduce((s,t)=>s+t.amount,0);
  const totalExpense = transactions.filter(t=>t.type==="Expense").reduce((s,t)=>s+t.amount,0);
  const balance      = totalIncome - totalExpense;
  const savingsRate  = totalIncome>0 ? ((balance/totalIncome)*100).toFixed(1) : 0;
  const animBal = useAnimatedNumber(balance);
  const animInc = useAnimatedNumber(totalIncome);
  const animExp = useAnimatedNumber(totalExpense);

  /* ── monthly ── */
  const viewYM = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}`;
  const monthTx      = transactions.filter(t=>t.date?.slice(0,7)===viewYM);
  const monthIncome  = monthTx.filter(t=>t.type==="Income").reduce((s,t)=>s+t.amount,0);
  const monthExpense = monthTx.filter(t=>t.type==="Expense").reduce((s,t)=>s+t.amount,0);
  const monthBalance = monthIncome - monthExpense;
  const monthSavings = monthIncome>0 ? ((monthBalance/monthIncome)*100).toFixed(1) : 0;
  const animMInc = useAnimatedNumber(monthIncome);
  const animMExp = useAnimatedNumber(monthExpense);
  const animMBal = useAnimatedNumber(monthBalance);

  const dailyMap = monthTx.filter(t=>t.type==="Expense").reduce((acc,t)=>{ acc[t.date]=(acc[t.date]||0)+t.amount; return acc; },{});
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const activeDays  = Object.keys(dailyMap).length;
  const dailyAvg    = monthExpense>0 && activeDays>0 ? Math.round(monthExpense/activeDays) : 0;
  const highestDay  = Object.entries(dailyMap).sort((a,b)=>b[1]-a[1])[0];
  const mCatExp     = monthTx.filter(t=>t.type==="Expense").reduce((acc,t)=>{ acc[t.cat]=(acc[t.cat]||0)+t.amount; return acc; },{});
  const mTopCats    = Object.entries(mCatExp).sort((a,b)=>b[1]-a[1]).slice(0,5);

  /* ── last 6 months ── */
  const last6 = Array.from({length:6},(_,i)=>{
    const d  = new Date(today.getFullYear(), today.getMonth()-5+i, 1);
    const ym = toYM(d);
    const inc = transactions.filter(t=>t.type==="Income" &&t.date?.slice(0,7)===ym).reduce((s,t)=>s+t.amount,0);
    const exp = transactions.filter(t=>t.type==="Expense"&&t.date?.slice(0,7)===ym).reduce((s,t)=>s+t.amount,0);
    return { label:MONTH_NAMES[d.getMonth()].slice(0,3), ym, inc, exp };
  });
  const maxBar = Math.max(...last6.map(m=>Math.max(m.inc,m.exp)),1);

  /* ── filtered list ── */
  const filtered = transactions
    .filter(t=>filter==="All"||t.type===filter)
    .filter(t=>t.desc.toLowerCase().includes(search.toLowerCase())||CAT_NAME(t.cat).toLowerCase().includes(search.toLowerCase()))
    .slice().sort((a,b)=>new Date(b.date)-new Date(a.date));

  /* ── top cats overview ── */
  const expCats  = transactions.filter(t=>t.type==="Expense").reduce((acc,t)=>{ acc[t.cat]=(acc[t.cat]||0)+t.amount; return acc; },{});
  const topCats  = Object.entries(expCats).sort((a,b)=>b[1]-a[1]).slice(0,4);

  const navMonth = (dir) => {
    const d = new Date(viewYear, viewMonth+dir, 1);
    setViewMonth(d.getMonth()); setViewYear(d.getFullYear());
  };

  const d = dark;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        :root{
          --ff-head:'Outfit',sans-serif; --ff-body:'Plus Jakarta Sans',sans-serif;
          --l-bg:#f0f4ff;--l-bg2:#e6ecff;--l-surface:#fff;--l-surface2:#f7f9ff;
          --l-border:#dde4ff;--l-text1:#0f1535;--l-text2:#4a5580;--l-text3:#8c97b8;
          --d-bg:#090d1a;--d-bg2:#0d1428;--d-surface:#111827;--d-surface2:#192135;
          --d-border:#1e2d4a;--d-text1:#eef2ff;--d-text2:#8896c0;--d-text3:#3d4f70;
          --cyan:#00d4ff;--lime:#a3f000;--coral:#ff5f7e;--gold:#ffc145;
          --violet:#9b6dff;--emerald:#10d97e;
          --radius:18px;--radius-s:12px;
          --shadow-l:0 8px 40px rgba(100,120,255,.08);
          --shadow-d:0 8px 40px rgba(0,0,0,.4);
        }
        html,body{width:100%;min-height:100vh;font-family:var(--ff-body);transition:background .3s,color .3s;overflow-x:hidden;}
        .lt{background:var(--l-bg);color:var(--l-text1);}
        .dk{background:var(--d-bg);color:var(--d-text1);}
        .app{
          position:fixed;top:0;left:0;right:0;bottom:0;
          overflow-y:auto;overflow-x:hidden;
          z-index:0;
        }
        .blob{position:absolute;border-radius:50%;filter:blur(90px);opacity:.22;pointer-events:none;z-index:0;transition:background .4s;}
        .blob1{width:480px;height:480px;top:-100px;left:-140px;}
        .blob2{width:360px;height:360px;bottom:-80px;right:-80px;}
        .blob3{width:220px;height:220px;top:50%;left:55%;transform:translate(-50%,-50%);}
        .lt .blob1{background:var(--violet);}.lt .blob2{background:var(--cyan);}.lt .blob3{background:var(--lime);}
        .dk .blob1{background:var(--violet);}.dk .blob2{background:var(--cyan);}.dk .blob3{background:var(--coral);}
        .inner{position:relative;z-index:1;width:100%;padding:28px 32px 60px;box-sizing:border-box;}

        /* HEADER */
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:14px;}
        .brand{display:flex;align-items:center;}
        .brand-logo-img{height:80px;width:auto;object-fit:contain;filter:drop-shadow(0 4px 18px rgba(155,109,255,.35));transition:filter .3s,transform .3s;}
        .brand-logo-img:hover{transform:scale(1.06) rotate(-1deg);filter:drop-shadow(0 6px 28px rgba(0,212,255,.4));}
        .header-right{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}

        /* clickable date chip */
        .date-chip{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;transition:all .22s;border:1.5px solid transparent;position:relative;user-select:none;}
        .lt .date-chip{background:var(--l-surface);border-color:var(--l-border);color:var(--l-text2);box-shadow:var(--shadow-l);}
        .dk .date-chip{background:var(--d-surface);border-color:var(--d-border);color:var(--d-text2);box-shadow:var(--shadow-d);}
        .date-chip:hover{border-color:var(--violet);color:var(--violet);}
        .date-chip input[type=date]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;border:none;outline:none;background:transparent;}

        .theme-toggle{padding:9px 18px;border-radius:99px;border:none;cursor:pointer;font-family:var(--ff-body);font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;transition:all .25s;}
        .lt .theme-toggle{background:var(--d-bg);color:var(--d-text1);box-shadow:var(--shadow-l);}
        .dk .theme-toggle{background:var(--l-surface);color:var(--l-text1);box-shadow:var(--shadow-d);}
        .theme-toggle:hover{transform:translateY(-2px) scale(1.03);}

        /* TABS */
        .main-tabs{display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;width:100%;}
        .main-tab{padding:10px 22px;border:none;border-radius:99px;font-family:var(--ff-body);font-size:13px;font-weight:700;cursor:pointer;transition:all .22s;display:flex;align-items:center;gap:7px;}
        .lt .main-tab{background:var(--l-surface);color:var(--l-text2);border:1.5px solid var(--l-border);}
        .dk .main-tab{background:var(--d-surface);color:var(--d-text2);border:1.5px solid var(--d-border);}
        .main-tab.active{background:linear-gradient(135deg,var(--violet),var(--cyan));color:#fff;border-color:transparent;box-shadow:0 4px 18px rgba(155,109,255,.35);}
        .main-tab:hover:not(.active){border-color:var(--violet);color:var(--violet);}

        /* STAT CARDS */
        .stats-grid{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:18px;margin-bottom:28px;width:100%;box-sizing:border-box;}
        .stat{border-radius:var(--radius);padding:26px 28px;position:relative;overflow:hidden;transition:transform .25s;}
        .stat:hover{transform:translateY(-6px);}
        .lt .stat{background:var(--l-surface);box-shadow:var(--shadow-l);}
        .dk .stat{background:var(--d-surface);box-shadow:var(--shadow-d);}
        .stat::after{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--radius) var(--radius) 0 0;}
        .stat-bal::after{background:linear-gradient(90deg,var(--violet),var(--cyan));}
        .stat-inc::after{background:linear-gradient(90deg,var(--emerald),var(--lime));}
        .stat-exp::after{background:linear-gradient(90deg,var(--coral),var(--gold));}
        .stat-glow{position:absolute;right:-28px;bottom:-28px;width:120px;height:120px;border-radius:50%;opacity:.1;}
        .stat-bal .stat-glow{background:var(--cyan);}.stat-inc .stat-glow{background:var(--emerald);}.stat-exp .stat-glow{background:var(--coral);}
        .stat-label{font-size:10.5px;text-transform:uppercase;letter-spacing:2.5px;font-weight:700;margin-bottom:10px;opacity:.55;}
        .stat-value{font-family:var(--ff-head);font-size:34px;font-weight:800;letter-spacing:-1.5px;line-height:1;margin-bottom:14px;}
        .stat-bal .stat-value{color:var(--violet);}.stat-bal .stat-value.neg{color:var(--coral);}
        .stat-inc .stat-value{color:var(--emerald);}.stat-exp .stat-value{color:var(--coral);}
        .progress-track{height:5px;border-radius:99px;overflow:hidden;margin-bottom:10px;}
        .lt .progress-track{background:var(--l-bg2);}.dk .progress-track{background:var(--d-surface2);}
        .progress-fill{height:100%;border-radius:99px;transition:width .9s cubic-bezier(.4,0,.2,1);}
        .stat-bal .progress-fill{background:linear-gradient(90deg,var(--violet),var(--cyan));}
        .stat-inc .progress-fill{background:linear-gradient(90deg,var(--emerald),var(--lime));}
        .stat-exp .progress-fill{background:linear-gradient(90deg,var(--coral),var(--gold));}
        .stat-meta{font-size:12px;opacity:.5;font-weight:500;}
        .badge-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;}
        .badge-up{background:rgba(16,217,126,.14);color:var(--emerald);}.badge-down{background:rgba(255,95,126,.14);color:var(--coral);}

        /* MAIN GRID */
        .main-grid{display:grid;grid-template-columns:380px 1fr;gap:22px;align-items:start;width:100%;box-sizing:border-box;}

        /* CARD */
        .card{border-radius:var(--radius);padding:26px;transition:background .3s;}
        .lt .card{background:var(--l-surface);box-shadow:var(--shadow-l);border:1px solid var(--l-border);}
        .dk .card{background:var(--d-surface);box-shadow:var(--shadow-d);border:1px solid var(--d-border);}
        .card+.card{margin-top:18px;}
        .sec-title{font-family:var(--ff-head);font-size:14px;font-weight:700;letter-spacing:-.2px;margin-bottom:20px;display:flex;align-items:center;gap:10px;}
        .sec-title::after{content:'';flex:1;height:1.5px;border-radius:99px;}
        .lt .sec-title::after{background:var(--l-border);}.dk .sec-title::after{background:var(--d-border);}
        .sec-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}

        /* TYPE TOGGLE */
        .type-toggle{display:grid;grid-template-columns:1fr 1fr;border-radius:var(--radius-s);padding:5px;gap:5px;margin-bottom:18px;}
        .lt .type-toggle{background:var(--l-bg2);}.dk .type-toggle{background:var(--d-surface2);}
        .type-btn{padding:11px;border:none;border-radius:9px;font-family:var(--ff-body);font-size:13px;font-weight:700;cursor:pointer;transition:all .22s;display:flex;align-items:center;justify-content:center;gap:7px;}
        .lt .type-btn{background:transparent;color:var(--l-text2);}.dk .type-btn{background:transparent;color:var(--d-text2);}
        .type-btn.inc-active{background:linear-gradient(135deg,#0aab5e,var(--emerald));color:#fff;box-shadow:0 4px 18px rgba(16,217,126,.35);}
        .type-btn.exp-active{background:linear-gradient(135deg,#e83058,var(--coral));color:#fff;box-shadow:0 4px 18px rgba(255,95,126,.35);}

        /* FORM */
        .field{margin-bottom:14px;}
        .field label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.8px;margin-bottom:7px;opacity:.55;}
        .field input,.field select{width:100%;padding:12px 15px;border-radius:var(--radius-s);font-family:var(--ff-body);font-size:14px;outline:none;transition:all .2s;-webkit-appearance:none;}
        .lt .field input,.lt .field select{background:var(--l-bg2);border:1.5px solid var(--l-border);color:var(--l-text1);}
        .dk .field input,.dk .field select{background:var(--d-surface2);border:1.5px solid var(--d-border);color:var(--d-text1);}
        .field input:focus,.field select:focus{border-color:var(--violet);box-shadow:0 0 0 3px rgba(155,109,255,.18);}
        .lt .field select option{background:var(--l-surface);}.dk .field select option{background:var(--d-surface);}
        .lt .field input[type=date]{color-scheme:light;}.dk .field input[type=date]{color-scheme:dark;}
        .field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .custom-cat-wrap{overflow:hidden;max-height:0;opacity:0;transform:translateY(-6px);transition:max-height .3s,opacity .3s,transform .3s,margin .3s;margin-bottom:0;}
        .custom-cat-wrap.visible{max-height:80px;opacity:1;transform:translateY(0);margin-bottom:14px;}
        .custom-cat-wrap .field{margin-bottom:0;}
        .submit-btn{width:100%;padding:14px;border:none;border-radius:var(--radius-s);cursor:pointer;font-family:var(--ff-head);font-size:15px;font-weight:700;letter-spacing:.3px;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .28s;margin-top:4px;}
        .submit-btn.inc-btn{background:linear-gradient(135deg,#0aab5e,var(--emerald));color:#fff;box-shadow:0 6px 24px rgba(16,217,126,.35);}
        .submit-btn.exp-btn{background:linear-gradient(135deg,#e83058,var(--coral));color:#fff;box-shadow:0 6px 24px rgba(255,95,126,.35);}
        .submit-btn:hover{transform:translateY(-3px) scale(1.01);}

        /* INSIGHTS */
        .insight-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;}
        .insight-item{border-radius:var(--radius-s);padding:14px 16px;}
        .lt .insight-item{background:var(--l-bg2);border:1px solid var(--l-border);}
        .dk .insight-item{background:var(--d-surface2);border:1px solid var(--d-border);}
        .i-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:.5;margin-bottom:6px;font-weight:700;}
        .i-val{font-family:var(--ff-head);font-size:22px;font-weight:800;}
        .i-green{color:var(--emerald);}.i-red{color:var(--coral);}.i-gold{color:var(--gold);}
        .cats-title{font-size:10.5px;text-transform:uppercase;letter-spacing:2px;opacity:.45;font-weight:700;margin-bottom:12px;}
        .cat-row{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
        .cat-emoji{font-size:18px;width:30px;flex-shrink:0;}
        .cat-body{flex:1;}
        .cat-top{display:flex;justify-content:space-between;margin-bottom:5px;font-size:13px;font-weight:600;}
        .cat-top span{font-size:12px;opacity:.5;}
        .cat-bar{height:4px;border-radius:99px;overflow:hidden;}
        .lt .cat-bar{background:var(--l-bg2);}.dk .cat-bar{background:var(--d-border);}
        .cat-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--coral),var(--gold));}

        /* TX LIST */
        .tx-toolbar{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
        .search-wrap{flex:1;min-width:160px;position:relative;}
        .search-wrap::before{content:'🔍';position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;}
        .search-wrap input{width:100%;padding:10px 12px 10px 36px;border-radius:var(--radius-s);font-family:var(--ff-body);font-size:13px;outline:none;transition:all .2s;}
        .lt .search-wrap input{background:var(--l-bg2);border:1.5px solid var(--l-border);color:var(--l-text1);}
        .dk .search-wrap input{background:var(--d-surface2);border:1.5px solid var(--d-border);color:var(--d-text1);}
        .search-wrap input:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(0,212,255,.12);}
        .filter-group{display:flex;gap:4px;}
        .ftab{padding:8px 14px;border:none;border-radius:var(--radius-s);font-family:var(--ff-body);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;}
        .lt .ftab{background:var(--l-bg2);color:var(--l-text2);}.dk .ftab{background:var(--d-surface2);color:var(--d-text2);}
        .ftab.f-all.active{background:linear-gradient(135deg,var(--violet),var(--cyan));color:#fff;}
        .ftab.f-income.active{background:linear-gradient(135deg,#0aab5e,var(--emerald));color:#fff;}
        .ftab.f-expense.active{background:linear-gradient(135deg,#e83058,var(--coral));color:#fff;}
        .tx-count{font-size:12px;opacity:.4;font-weight:600;margin-bottom:10px;}
        .tx-scroll{max-height:520px;overflow-y:auto;padding-right:4px;}
        .tx-scroll::-webkit-scrollbar{width:4px;}
        .lt .tx-scroll::-webkit-scrollbar-track{background:var(--l-bg2);}.dk .tx-scroll::-webkit-scrollbar-track{background:var(--d-surface2);}
        .lt .tx-scroll::-webkit-scrollbar-thumb{background:var(--l-border);border-radius:99px;}.dk .tx-scroll::-webkit-scrollbar-thumb{background:var(--d-border);border-radius:99px;}
        .tx-item{display:flex;align-items:center;gap:13px;padding:13px 16px;border-radius:var(--radius-s);margin-bottom:8px;transition:all .22s;animation:popIn .3s ease forwards;opacity:0;position:relative;overflow:hidden;}
        .tx-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3.5px;border-radius:3.5px 0 0 3.5px;}
        .tx-income::before{background:var(--emerald);}.tx-expense::before{background:var(--coral);}
        .lt .tx-item{background:var(--l-bg2);border:1px solid var(--l-border);}
        .dk .tx-item{background:var(--d-surface2);border:1px solid var(--d-border);}
        .tx-item:hover{transform:translateX(5px);}
        .lt .tx-item:hover{border-color:var(--violet);}.dk .tx-item:hover{border-color:var(--violet);}
        .tx-icon-wrap{width:42px;height:42px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;}
        .tx-income .tx-icon-wrap{background:rgba(16,217,126,.12);}.tx-expense .tx-icon-wrap{background:rgba(255,95,126,.12);}
        .tx-body{flex:1;min-width:0;}
        .tx-desc{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .tx-meta{font-size:11px;opacity:.45;margin-top:2px;font-weight:500;}
        .tx-right{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0;}
        .tx-amount{font-family:var(--ff-head);font-size:15px;font-weight:800;letter-spacing:-.4px;}
        .tx-income .tx-amount{color:var(--emerald);}.tx-expense .tx-amount{color:var(--coral);}
        .tx-type-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;opacity:.65;}
        .lt .tx-type-badge{background:var(--l-border);}.dk .tx-type-badge{background:var(--d-border);}
        .del-btn{background:none;border:1.5px solid transparent;border-radius:7px;cursor:pointer;font-size:11px;font-weight:700;padding:3px 9px;transition:all .2s;opacity:.35;}
        .lt .del-btn{color:var(--l-text1);}.dk .del-btn{color:var(--d-text1);}
        .del-btn:hover{opacity:1;border-color:var(--coral);color:var(--coral);background:rgba(255,95,126,.1);}
        .empty-box{text-align:center;padding:50px 20px;opacity:.35;}
        .empty-box .e-ico{font-size:48px;margin-bottom:10px;}
        .empty-box p{font-size:14px;font-weight:500;}

        /* MONTHLY */
        .month-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:10px;}
        .month-title{font-family:var(--ff-head);font-size:22px;font-weight:800;letter-spacing:-.5px;}
        .month-title span{background:linear-gradient(120deg,var(--violet),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .nav-btns{display:flex;gap:8px;align-items:center;}
        .nav-btn{width:36px;height:36px;border-radius:99px;border:none;cursor:pointer;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .lt .nav-btn{background:var(--l-surface);border:1.5px solid var(--l-border);color:var(--l-text2);}
        .dk .nav-btn{background:var(--d-surface);border:1.5px solid var(--d-border);color:var(--d-text2);}
        .nav-btn:hover{background:var(--violet);color:#fff;border-color:var(--violet);}
        .today-btn{padding:8px 16px;border-radius:99px;border:none;cursor:pointer;font-family:var(--ff-body);font-size:12px;font-weight:700;transition:all .2s;}
        .lt .today-btn{background:var(--l-surface);border:1.5px solid var(--l-border);color:var(--l-text2);}
        .dk .today-btn{background:var(--d-surface);border:1.5px solid var(--d-border);color:var(--d-text2);}
        .today-btn:hover{background:var(--violet);color:#fff;border-color:var(--violet);}
        .month-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;width:100%;}
        .m-stat{border-radius:var(--radius-s);padding:18px 20px;position:relative;overflow:hidden;}
        .lt .m-stat{background:var(--l-surface);border:1px solid var(--l-border);box-shadow:var(--shadow-l);}
        .dk .m-stat{background:var(--d-surface);border:1px solid var(--d-border);box-shadow:var(--shadow-d);}
        .m-stripe{position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--radius-s) var(--radius-s) 0 0;}
        .m-stat-label{font-size:10px;text-transform:uppercase;letter-spacing:2px;opacity:.5;font-weight:700;margin-bottom:8px;}
        .m-stat-val{font-family:var(--ff-head);font-size:22px;font-weight:800;letter-spacing:-.8px;}
        .m-stat-sub{font-size:11px;opacity:.45;margin-top:5px;font-weight:500;}
        .monthly-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;align-items:start;}

        /* BAR CHART */
        .bars{display:flex;align-items:flex-end;gap:8px;height:140px;margin-bottom:10px;}
        .bar-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
        .bar-pair{display:flex;gap:3px;align-items:flex-end;width:100%;}
        .bar{border-radius:6px 6px 0 0;flex:1;min-height:4px;transition:height .7s cubic-bezier(.4,0,.2,1);}
        .bar-inc{background:linear-gradient(0deg,#0aab5e,var(--emerald));}
        .bar-exp{background:linear-gradient(0deg,#e83058,var(--coral));}
        .bar-lbl{font-size:10px;opacity:.45;font-weight:600;}
        .bar-legend{display:flex;gap:16px;margin-top:12px;}
        .bar-leg-item{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;opacity:.65;}
        .leg-dot{width:10px;height:10px;border-radius:3px;}
        .leg-inc{background:var(--emerald);}.leg-exp{background:var(--coral);}

        /* HEATMAP */
        .day-strip{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;}
        .day-cell{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:700;cursor:default;transition:transform .15s;position:relative;}
        .day-cell:hover{transform:scale(1.18);}
        .lt .day-cell.empty-day{background:var(--l-bg2);color:var(--l-text3);}
        .dk .day-cell.empty-day{background:var(--d-surface2);color:var(--d-text3);}
        .day-cell.has-expense{color:#fff;}
        .day-cell.today-cell{outline:2px solid var(--violet);outline-offset:1px;}
        .heatmap-legend{margin-top:12px;font-size:11px;opacity:.4;display:flex;gap:10px;align-items:center;}
        .heatmap-leg-swatch{width:14px;height:14px;border-radius:4px;}

        /* TOAST */
        .toast{position:fixed;bottom:28px;right:28px;z-index:9999;padding:14px 22px;border-radius:14px;font-family:var(--ff-body);font-size:14px;font-weight:600;color:#fff;display:flex;align-items:center;gap:10px;animation:toastIn .3s ease,toastOut .3s ease 2.5s forwards;box-shadow:0 8px 32px rgba(0,0,0,.3);}
        @keyframes popIn{from{opacity:0;transform:translateY(8px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes toastIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes toastOut{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(20px);}}

        /* RESPONSIVE */
        @media(max-width:1100px){.monthly-grid{grid-template-columns:1fr;}}
        @media(max-width:960px){
          .main-grid{grid-template-columns:1fr !important;}
          .stats-grid{grid-template-columns:1fr 1fr !important;}
          .stats-grid .stat:first-child{grid-column:span 2;}
          .month-stats{grid-template-columns:1fr 1fr;}
        }
        @media(max-width:640px){
          .inner{padding:18px 16px 48px;}
          .stats-grid{grid-template-columns:1fr !important;}
          .stats-grid .stat:first-child{grid-column:unset;}
          .stat-value{font-size:28px;}
          .field-row{grid-template-columns:1fr;}
          .header{flex-direction:column;align-items:flex-start;}
          .header-right{width:100%;justify-content:space-between;}
          .filter-group{flex-wrap:wrap;}
          .month-stats{grid-template-columns:1fr 1fr;}
          .bars{height:100px;}
          .main-grid{grid-template-columns:1fr !important;}
        }
        @media(max-width:400px){.insight-row{grid-template-columns:1fr;}.month-stats{grid-template-columns:1fr;}}
      `}</style>

      <div className={`app ${d?"dk":"lt"}`}>
        <div className="blob blob1"/><div className="blob blob2"/><div className="blob blob3"/>
        <div className="inner">

          {/* ── HEADER ── */}
          <header className="header">
            <div className="brand">
              <img src="src\assets\FinFlow-logo.png" alt="FinFlow" className="brand-logo-img"/>
            </div>
            <div className="header-right">
              <label className="date-chip" title="Click to pick transaction date">
                📅 {new Date(txDate+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                <input type="date" value={txDate} onChange={e=>setTxDate(e.target.value)}/>
              </label>
              <button className="theme-toggle" onClick={()=>setDark(!d)}>
                {d?"☀️ Light":"🌙 Dark"}
              </button>
            </div>
          </header>

          {/* ── TABS ── */}
          <div className="main-tabs">
            {[{id:"overview",icon:"📊",label:"Overview"},{id:"monthly",icon:"📅",label:"Monthly View"},{id:"transactions",icon:"📋",label:"All Transactions"}].map(tab=>(
              <button key={tab.id} className={`main-tab${activeTab===tab.id?" active":""}`} onClick={()=>setActiveTab(tab.id)}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW ══ */}
          {activeTab==="overview"&&<>
            <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr",gap:"18px",marginBottom:"28px",width:"100%",boxSizing:"border-box"}}>
              <div className="stat stat-bal">
                <div className="stat-glow"/>
                <div className="stat-label">Net Balance</div>
                <div className={`stat-value${balance<0?" neg":""}`}>{fmt(animBal)}</div>
                <div className="progress-track"><div className="progress-fill" style={{width:totalIncome>0?`${Math.max(0,Math.min((balance/totalIncome)*100,100))}%`:"0%"}}/></div>
                <div className="stat-meta"><span className={`badge-pill ${balance>=0?"badge-up":"badge-down"}`}>{balance>=0?"▲":"▼"} {savingsRate}% savings</span></div>
              </div>
              <div className="stat stat-inc">
                <div className="stat-glow"/>
                <div className="stat-label">Total Income</div>
                <div className="stat-value">{fmt(animInc)}</div>
                <div className="progress-track"><div className="progress-fill" style={{width:"100%"}}/></div>
                <div className="stat-meta">{transactions.filter(t=>t.type==="Income").length} entries</div>
              </div>
              <div className="stat stat-exp">
                <div className="stat-glow"/>
                <div className="stat-label">Total Expense</div>
                <div className="stat-value">{fmt(animExp)}</div>
                <div className="progress-track"><div className="progress-fill" style={{width:totalIncome>0?`${Math.min((totalExpense/totalIncome)*100,100)}%`:"0%"}}/></div>
                <div className="stat-meta">{transactions.filter(t=>t.type==="Expense").length} entries</div>
              </div>
            </div>

            <div className="main-grid" style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:"22px",width:"100%",boxSizing:"border-box",alignItems:"start"}}>
              <div>
                <div className="card">
                  <div className="sec-title"><span className="sec-dot" style={{background:"var(--violet)"}}/>Add Transaction</div>
                  <div className="type-toggle">
                    <button type="button" className={`type-btn${type==="Income"?" inc-active":""}`} onClick={()=>setType("Income")}>↑ Income</button>
                    <button type="button" className={`type-btn${type==="Expense"?" exp-active":""}`} onClick={()=>setType("Expense")}>↓ Expense</button>
                  </div>
                  <form onSubmit={addTx}>
                    <div className="field">
                      <label>Description</label>
                      <input type="text" placeholder={type==="Income"?"e.g. Monthly Salary…":"e.g. Grocery, Netflix…"} value={desc} onChange={e=>setDesc(e.target.value)}/>
                    </div>
                    <div className="field-row">
                      <div className="field">
                        <label>Amount (₹)</label>
                        <input type="number" placeholder="0.00" min="1" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)}/>
                      </div>
                      <div className="field">
                        <label>Date</label>
                        <input type="date" value={txDate} onChange={e=>setTxDate(e.target.value)}/>
                      </div>
                    </div>
                    <div className="field">
                      <label>Category</label>
                      <select value={cat} onChange={e=>{setCat(e.target.value);setCustomCat("");}}>
                        {CATEGORIES[type].map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={`custom-cat-wrap${isOther?" visible":""}`}>
                      <div className="field">
                        <label>Custom Category Name</label>
                        <input type="text" placeholder="e.g. Insurance, Rent…" value={customCat} onChange={e=>setCustomCat(e.target.value)}/>
                      </div>
                    </div>
                    <button type="submit" className={`submit-btn${type==="Income"?" inc-btn":" exp-btn"}`}>
                      <span>{type==="Income"?"＋":"−"}</span> Add {type}
                    </button>
                  </form>
                </div>

                <div className="card">
                  <div className="sec-title"><span className="sec-dot" style={{background:"var(--gold)"}}/>Insights</div>
                  <div className="insight-row">
                    <div className="insight-item"><div className="i-label">Savings Rate</div><div className={`i-val${parseFloat(savingsRate)>=20?" i-green":parseFloat(savingsRate)>=0?" i-gold":" i-red"}`}>{savingsRate}%</div></div>
                    <div className="insight-item"><div className="i-label">Status</div><div className={`i-val${balance>=0?" i-green":" i-red"}`} style={{fontSize:"18px",paddingTop:"4px"}}>{balance>=0?"Healthy 👍":"Overspent ⚠️"}</div></div>
                    <div className="insight-item"><div className="i-label">Transactions</div><div className="i-val i-gold">{transactions.length}</div></div>
                    <div className="insight-item"><div className="i-label">Spend Ratio</div><div className={`i-val${totalIncome>0&&(totalExpense/totalIncome)>0.8?" i-red":" i-green"}`}>{totalIncome>0?((totalExpense/totalIncome)*100).toFixed(1):0}%</div></div>
                  </div>
                  {topCats.length>0&&<><div className="cats-title">Top Expense Categories</div>
                    {topCats.map(([c,v])=>(
                      <div className="cat-row" key={c}>
                        <div className="cat-emoji">{CAT_ICON(c)}</div>
                        <div className="cat-body">
                          <div className="cat-top">{CAT_NAME(c)}<span>{fmt(v)}</span></div>
                          <div className="cat-bar"><div className="cat-fill" style={{width:`${(v/totalExpense)*100}%`}}/></div>
                        </div>
                      </div>
                    ))}</>}
                </div>
              </div>

              <div className="card" style={{height:"100%"}}>
                <div className="sec-title"><span className="sec-dot" style={{background:"var(--cyan)"}}/>Recent Transactions</div>
                <div className="tx-toolbar">
                  <div className="search-wrap"><input type="text" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
                  <div className="filter-group">
                    {["All","Income","Expense"].map(f=>(
                      <button key={f} className={`ftab f-${f.toLowerCase()}${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="tx-count">{filtered.length} transaction{filtered.length!==1?"s":""}</div>
                <div className="tx-scroll">
                  {filtered.length===0
                    ?<div className="empty-box"><div className="e-ico">🔍</div><p>No transactions found.</p></div>
                    :filtered.map((t,i)=>(
                      <div key={t.id} className={`tx-item tx-${t.type.toLowerCase()}`} style={{animationDelay:`${i*0.04}s`}}>
                        <div className="tx-icon-wrap">{CAT_ICON(t.cat)}</div>
                        <div className="tx-body">
                          <div className="tx-desc">{t.desc}</div>
                          <div className="tx-meta">{CAT_NAME(t.cat)} · {t.date?new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</div>
                        </div>
                        <div className="tx-right">
                          <div className="tx-amount">{t.type==="Income"?"+":"−"}{fmt(t.amount)}</div>
                          <button className="del-btn" onClick={()=>deleteTx(t.id)}>✕ delete</button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>}

          {/* ══ MONTHLY ══ */}
          {activeTab==="monthly"&&<>
            <div className="month-nav">
              <div className="month-title"><span>{MONTH_NAMES[viewMonth]}</span> {viewYear}</div>
              <div className="nav-btns">
                <button className="nav-btn" onClick={()=>navMonth(-1)}>‹</button>
                <button className="today-btn" onClick={()=>{setViewMonth(today.getMonth());setViewYear(today.getFullYear());}}>This Month</button>
                <button className="nav-btn" onClick={()=>navMonth(1)}>›</button>
              </div>
            </div>

            <div className="month-stats">
              <div className="m-stat">
                <div className="m-stripe" style={{background:"linear-gradient(90deg,var(--violet),var(--cyan))"}}/>
                <div className="m-stat-label">Net Balance</div>
                <div className="m-stat-val" style={{color:monthBalance>=0?"var(--emerald)":"var(--coral)"}}>{fmt(animMBal)}</div>
                <div className="m-stat-sub">{monthBalance>=0?"Surplus":"Deficit"} this month</div>
              </div>
              <div className="m-stat">
                <div className="m-stripe" style={{background:"linear-gradient(90deg,var(--emerald),var(--lime))"}}/>
                <div className="m-stat-label">Income</div>
                <div className="m-stat-val" style={{color:"var(--emerald)"}}>{fmt(animMInc)}</div>
                <div className="m-stat-sub">{monthTx.filter(t=>t.type==="Income").length} transactions</div>
              </div>
              <div className="m-stat">
                <div className="m-stripe" style={{background:"linear-gradient(90deg,var(--coral),var(--gold))"}}/>
                <div className="m-stat-label">Expenses</div>
                <div className="m-stat-val" style={{color:"var(--coral)"}}>{fmt(animMExp)}</div>
                <div className="m-stat-sub">{monthTx.filter(t=>t.type==="Expense").length} transactions</div>
              </div>
              <div className="m-stat">
                <div className="m-stripe" style={{background:"linear-gradient(90deg,var(--gold),var(--coral))"}}/>
                <div className="m-stat-label">Savings Rate</div>
                <div className="m-stat-val" style={{color:parseFloat(monthSavings)>=20?"var(--emerald)":parseFloat(monthSavings)>=0?"var(--gold)":"var(--coral)"}}>{monthSavings}%</div>
                <div className="m-stat-sub">{dailyAvg>0?`Avg ${fmt(dailyAvg)}/active day`:"No expense data"}</div>
              </div>
            </div>

            <div className="monthly-grid">
              {/* LEFT — trend + categories */}
              <div>
                <div className="card">
                  <div className="sec-title"><span className="sec-dot" style={{background:"var(--violet)"}}/>6-Month Trend</div>
                  <div className="bars">
                    {last6.map((m,i)=>(
                      <div className="bar-group" key={i}>
                        <div className="bar-pair">
                          <div className="bar bar-inc" style={{height:`${maxBar>0?(m.inc/maxBar)*100:0}%`}} title={`Income: ${fmt(m.inc)}`}/>
                          <div className="bar bar-exp" style={{height:`${maxBar>0?(m.exp/maxBar)*100:0}%`}} title={`Expense: ${fmt(m.exp)}`}/>
                        </div>
                        <div className="bar-lbl">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bar-legend">
                    <div className="bar-leg-item"><div className="leg-dot leg-inc"/>Income</div>
                    <div className="bar-leg-item"><div className="leg-dot leg-exp"/>Expense</div>
                  </div>
                </div>

                <div className="card">
                  <div className="sec-title"><span className="sec-dot" style={{background:"var(--coral)"}}/>Expenses by Category</div>
                  {mTopCats.length===0
                    ?<div className="empty-box" style={{padding:"24px 0"}}><div className="e-ico">📭</div><p>No expenses this month.</p></div>
                    :mTopCats.map(([c,v])=>(
                      <div className="cat-row" key={c}>
                        <div className="cat-emoji">{CAT_ICON(c)}</div>
                        <div className="cat-body">
                          <div className="cat-top">{CAT_NAME(c)}<span>{fmt(v)} · {monthExpense>0?((v/monthExpense)*100).toFixed(0):0}%</span></div>
                          <div className="cat-bar"><div className="cat-fill" style={{width:`${monthExpense>0?(v/monthExpense)*100:0}%`}}/></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* RIGHT — heatmap + transactions */}
              <div>
                <div className="card">
                  <div className="sec-title"><span className="sec-dot" style={{background:"var(--gold)"}}/>Daily Spending — {MONTH_NAMES[viewMonth]}</div>
                  {highestDay&&<div style={{fontSize:"12px",marginBottom:"12px",opacity:.6}}>🔥 Highest: <strong>{new Date(highestDay[0]+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</strong> — {fmt(highestDay[1])}</div>}
                  <div className="day-strip">
                    {Array.from({length:daysInMonth},(_,i)=>{
                      const dayNum  = i+1;
                      const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
                      const spend   = dailyMap[dateStr]||0;
                      const maxSpend= Math.max(...Object.values(dailyMap),1);
                      const intensity = spend>0 ? 0.2+(spend/maxSpend)*0.8 : 0;
                      const isToday   = dateStr===toISO(today);
                      return (
                        <div
                          key={dayNum}
                          className={`day-cell${spend>0?" has-expense":""}${isToday?" today-cell":" empty-day"}`}
                          style={spend>0?{background:`rgba(255,95,126,${intensity})`}:{}}
                          title={spend>0?`${dateStr}: ${fmt(spend)}`:`${dateStr}: No expense`}
                        >{dayNum}</div>
                      );
                    })}
                  </div>
                  <div className="heatmap-legend">
                    <div className="heatmap-leg-swatch" style={{background:"rgba(255,95,126,0.2)"}}/>Low spend
                    <div className="heatmap-leg-swatch" style={{background:"rgba(255,95,126,0.7)"}}/>High spend
                    <div className="heatmap-leg-swatch" style={{outline:"2px solid var(--violet)"}}/>Today
                  </div>
                </div>

                <div className="card">
                  <div className="sec-title"><span className="sec-dot" style={{background:"var(--cyan)"}}/>Transactions — {MONTH_NAMES[viewMonth]}</div>
                  <div className="tx-scroll" style={{maxHeight:"380px"}}>
                    {monthTx.length===0
                      ?<div className="empty-box"><div className="e-ico">📭</div><p>No transactions this month.</p></div>
                      :monthTx.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map((t,i)=>(
                        <div key={t.id} className={`tx-item tx-${t.type.toLowerCase()}`} style={{animationDelay:`${i*0.04}s`}}>
                          <div className="tx-icon-wrap">{CAT_ICON(t.cat)}</div>
                          <div className="tx-body">
                            <div className="tx-desc">{t.desc}</div>
                            <div className="tx-meta">{CAT_NAME(t.cat)} · {new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
                          </div>
                          <div className="tx-right">
                            <div className="tx-amount">{t.type==="Income"?"+":"−"}{fmt(t.amount)}</div>
                            <button className="del-btn" onClick={()=>deleteTx(t.id)}>✕</button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </>}

          {/* ══ ALL TRANSACTIONS ══ */}
          {activeTab==="transactions"&&(
            <div className="card" style={{width:"100%",boxSizing:"border-box"}}>
              <div className="sec-title"><span className="sec-dot" style={{background:"var(--cyan)"}}/>All Transactions</div>
              <div className="tx-toolbar">
                <div className="search-wrap"><input type="text" placeholder="Search by name or category…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <div className="filter-group">
                  {["All","Income","Expense"].map(f=>(
                    <button key={f} className={`ftab f-${f.toLowerCase()}${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="tx-count">{filtered.length} transaction{filtered.length!==1?"s":""}</div>
              <div className="tx-scroll" style={{maxHeight:"70vh"}}>
                {filtered.length===0
                  ?<div className="empty-box"><div className="e-ico">🔍</div><p>No transactions found.</p></div>
                  :filtered.map((t,i)=>(
                    <div key={t.id} className={`tx-item tx-${t.type.toLowerCase()}`} style={{animationDelay:`${i*0.03}s`}}>
                      <div className="tx-icon-wrap">{CAT_ICON(t.cat)}</div>
                      <div className="tx-body">
                        <div className="tx-desc">{t.desc}</div>
                        <div className="tx-meta">{CAT_NAME(t.cat)} · {t.date?new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—"}</div>
                      </div>
                      <div className="tx-right">
                        <div className="tx-amount">{t.type==="Income"?"+":"−"}{fmt(t.amount)}</div>
                        <span className="tx-type-badge">{t.type}</span>
                        <button className="del-btn" onClick={()=>deleteTx(t.id)}>✕ delete</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>

        {toast&&(
          <div className="toast" style={{background:toast.color}}>
            {toast.color==="#10d97e"?"✅":"❌"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}