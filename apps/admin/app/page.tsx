import { BadgeCheck, BookOpenCheck, CircleDollarSign, LayoutDashboard, MessageSquareText, ShieldCheck, Store, Users } from "lucide-react";
import { requireAdmin } from "../lib/supabase/server";

const requests = [
  ["Amaka & Tobi", "Venue · Lekki · 14 Feb 2027", "Confirming"],
  ["Dara & Kene", "Caterer · 300 guests · Ikeja", "Needs quote"],
  ["Zainab & Nura", "Venue · Victoria Island · 03 Jan", "New request"],
];
const stages = [["Briefs", 30, 100], ["Requests", 18, 60], ["Quotes", 12, 40], ["Paid", 6, 20], ["Completed", 2, 7]];

export default async function OperationsDashboard() {
  await requireAdmin();
  return <div className="shell"><aside className="sidebar"><div className="brand">mmemme <small style={{fontSize:11,opacity:.65}}>OPS</small></div><nav className="nav" aria-label="Operations navigation">
    <a className="active" href="/"><LayoutDashboard size={17}/> Dashboard</a><a href="#"><BookOpenCheck size={17}/> Booking requests</a><a href="/vendors"><Store size={17}/> Vendors</a><a href="/vendors"><ShieldCheck size={17}/> Verification</a><a href="#"><CircleDollarSign size={17}/> Money & ledger</a><a href="#"><MessageSquareText size={17}/> Support</a>
  </nav></aside><main className="main"><header className="top"><div><div className="eyebrow">Lagos closed beta</div><h1 className="title">Good morning, operations.</h1></div><div className="live"><span className="dot"/>Sandbox mode · no live funds</div></header>
    <section className="metrics" aria-label="Beta metrics"><div className="metric"><Users size={19}/><strong>30</strong><span>Qualified couples target</span></div><div className="metric"><BadgeCheck size={19}/><strong>17/25</strong><span>Verified vendor target</span></div><div className="metric"><BookOpenCheck size={19}/><strong>6/10</strong><span>Paid booking target</span></div><div className="metric"><CircleDollarSign size={19}/><strong>100%</strong><span>Funds reconciled</span></div></section>
    <div className="grid"><section className="panel"><div className="panel-head"><h2>Requests needing attention</h2><button className="link">View queue</button></div>{requests.map(([name, detail, state])=><div className="request" key={name}><div><strong>{name}</strong><p>{detail}</p></div><span className="pill">{state}</span></div>)}</section>
      <section className="panel"><div className="panel-head"><h2>Beta funnel</h2><span className="eyebrow">Cohort 01</span></div><div className="funnel">{stages.map(([label,count,width])=><div className="funnel-row" key={label}><span>{label}</span><div className="bar"><span style={{width:`${width}%`}}/></div><strong>{count}</strong></div>)}</div><div className="gate"><strong>Live payment gate is closed</strong>Paystack, legal, cancellation policy and reconciliation rehearsal must all pass.</div></section>
    </div></main></div>;
}
