import React, { useState } from 'react';
import 'boxicons/css/boxicons.min.css';

/* global Word */

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [status, setStatus] = useState("System Ready");

  const handleAction = async (actionType) => {
    setStatus("AI is thinking...");
    try {
      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        selection.load("text");
        await context.sync();

        const response = await fetch("https://word-automator-backend.onrender.com", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: actionType, text: selection.text })
        });
        const data = await response.json();

        if (data.type === "template") {
          context.document.body.insertText(data.title + "\n", "Start");
          context.document.body.insertParagraph(data.content, "End");
        } else {
          selection.insertText(data.result, "Replace");
        }

        await context.sync();
        setStatus("Process Complete");
      });
    } catch (err) {
      setStatus("Error: Connect to Word");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* RESPONSIVE HEADER */}
      <header className="bg-blue-700 text-white p-3 sm:p-4 shadow-md">
        <h1 className="text-xs sm:text-sm font-black tracking-tighter uppercase">Word Automator AI</h1>
        <p className="text-[10px] opacity-80">{status}</p>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
        {activeTab === 'home' ? (
          <div className="grid grid-cols-1 gap-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Writing Tools</h2>
            <ActionButton icon="bx-magic-wand" color="bg-blue-500" title="Autocorrect" desc="Fix all errors" onClick={() => handleAction('autocorrect')} />
            <ActionButton icon="bx-list-plus" color="bg-green-500" title="Autofill" desc="Smart complete" onClick={() => handleAction('autofill')} />
            <ActionButton icon="bx-copy-alt" color="bg-purple-500" title="Template" desc="JSON structure" onClick={() => handleAction('template')} />
            <ActionButton icon="bx-bullseye" color="bg-orange-500" title="Summarize" desc="Get key points" onClick={() => handleAction('summarize')} />
          </div>
        ) : (
          <DashboardView />
        )}
      </main>

      {/* RESPONSIVE NAV */}
      <nav className="bg-white border-t flex justify-around py-2 sm:py-4 px-2">
        <NavButton icon="bx-home-alt" label="Tools" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavButton icon="bx-grid-alt" label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
      </nav>
    </div>
  );
}

// COMPONENT: Responsive Action Cards
const ActionButton = ({ icon, color, title, desc, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center w-full bg-white border border-slate-200 p-3 sm:p-4 rounded-xl hover:shadow-lg transition-all active:scale-95 group"
  >
    <div className={`${color} text-white p-2 sm:p-3 rounded-lg mr-4 group-hover:rotate-12 transition-transform`}>
      <i className={`bx ${icon} text-lg sm:text-2xl`}></i>
    </div>
    <div className="text-left">
      <h3 className="font-bold text-xs sm:text-sm">{title}</h3>
      <p className="text-[10px] text-slate-400 uppercase font-medium tracking-tight">{desc}</p>
    </div>
  </button>
);

// COMPONENT: Dashboard Sections
const DashboardView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
    <section>
      <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">Templates & Rules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {['Formal', 'Casual', 'Medical'].map(rule => (
          <div key={rule} className="bg-white p-3 border rounded-lg text-xs font-semibold flex justify-between items-center">
            {rule} <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        ))}
      </div>
    </section>
    <section>
      <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3">System Logs</h3>
      <div className="bg-slate-800 text-green-400 p-3 rounded-lg font-mono text-[9px] leading-relaxed shadow-inner">
        <div>&gt; [08:30] Template Applied</div>
        <div>&gt; [08:32] Correction Rule Set: Formal</div>
        <div className="animate-pulse">&gt; [READY] Waiting for input...</div>
      </div>
    </section>
  </div>
);

const NavButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <i className={`bx ${icon} text-xl sm:text-2xl`}></i>
    <span className="text-[9px] font-bold tracking-widest uppercase">{label}</span>
  </button>
);

export default App;