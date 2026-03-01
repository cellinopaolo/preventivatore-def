// --- DATABASE & STRUTTURA ---
const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

const STRUTTURA = {
    "Mattoni": { gamme: ["Genesis", "Futura", "Croma", "Fortis", "Cotto"], colore: "bg-[#FF9500]", icona: "brick-wall" },
    "Pietra": { gamme: ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"], colore: "bg-[#8E8E93]", icona: "mountain" },
    "Legno": { gamme: ["Rivestimenti", "Pavimenti"], colore: "bg-[#A2845E]", icona: "tree-deciduous" }
};

async function init() { 
    renderCategorie(); 
    lucide.createIcons(); 
}

// --- RENDERING CATEGORIE (STYLE: iOS Dashboard) ---
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    
    c.innerHTML = `
        <header class="mb-8">
            <h1 class="text-4xl font-extrabold tracking-tight">Catalogo</h1>
        </header>
        <div class="grid gap-4">
            ${Object.keys(STRUTTURA).map(key => `
                <div onclick="renderGamme('${key}')" class="glass p-5 rounded-[2rem] flex items-center justify-between ios-tap cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="${STRUTTURA[key].colore} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm">
                            <i data-lucide="${STRUTTURA[key].icona}" class="w-6 h-6"></i>
                        </div>
                        <span class="text-lg font-semibold tracking-tight">${key}</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300"></i>
                </div>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- RENDERING GAMME (STYLE: iOS List) ---
function renderGamme(cat) {
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden'); b.onclick = renderCategorie;

    c.innerHTML = `
        <header class="mb-6">
            <p class="text-[#007aff] font-semibold text-sm mb-1">${cat}</p>
            <h2 class="text-3xl font-extrabold tracking-tight">Gamme</h2>
        </header>
        <div class="bg-white/50 rounded-[2rem] overflow-hidden border border-white/40">
            ${STRUTTURA[cat].gamme.map((g, i) => `
                <div onclick="renderInterfacciaCalcolo('${cat}', '${g}')" class="p-5 flex justify-between items-center ios-tap cursor-pointer ${i !== 0 ? 'border-t border-slate-100' : ''}">
                    <span class="font-medium text-slate-700">${g}</span>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                </div>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- INTERFACCIA CALCOLO (STYLE: iOS Form) ---
async function renderInterfacciaCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-20 text-center text-slate-400 font-medium">Nessun listino caricato per ${gamma}</div>`;
        return;
    }

    let htmlSpecial = "";
    if (gamma === "Fortis") {
        htmlSpecial = `<div class="p-4 bg-slate-50/50 rounded-2xl"><label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Posa</label><select id="tipo-posa" class="w-full font-semibold"><option value="piatto">Di Piatto (Standard)</option><option value="coltello">Di Coltello</option></select></div>`;
    } else if (gamma === "Posa incerta") {
        htmlSpecial = `<div class="grid grid-cols-2 gap-3"><div class="p-4 bg-slate-50/50 rounded-2xl"><label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Finitura</label><select id="finitura-pietra" onchange="toggleSfrido(this.value)" class="w-full font-semibold"><option value="fugata">Fugata</option><option value="secco">A Secco</option></select></div><div id="box-sfrido" class="p-4 bg-orange-50 hidden rounded-2xl"><label class="text-[10px] font-bold uppercase text-orange-400 mb-1 block px-1">% Sfrido</label><input type="number" id="perc-sfrido" value="15" class="w-full font-bold text-orange-600 bg-transparent !p-0"></div></div>`;
    }

    c.innerHTML = `
        <header class="mb-6">
            <p class="text-[#007aff] font-semibold text-sm mb-1">${cat} / ${gamma}</p>
            <h2 class="text-3xl font-extrabold tracking-tight">Calcolo</h2>
        </header>
        
        <div class="glass p-6 rounded-[2.5rem] shadow-xl space-y-4">
            <div class="p-4 bg-slate-50/50 rounded-2xl">
                <label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Modello Prodotto</label>
                <select id="select-prod" class="w-full font-semibold text-lg">${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}</select>
            </div>

            ${htmlSpecial}

            <div class="grid grid-cols-2 gap-3">
                <div class="p-4 bg-slate-50/50 rounded-2xl">
                    <label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Quantità</label>
                    <input type="number" id="q-main" value="0" class="w-full text-xl font-bold bg-transparent !p-0">
                </div>
                <div class="p-4 bg-slate-50/50 rounded-2xl">
                    <label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Unità</label>
                    <select id="u-type" class="w-full font-semibold">${cat === 'Mattoni' ? '<option value="pz">PEZZI</option><option value="mq">MQ</option>' : '<option value="mq">MQ</option><option value="pz">PEZZI</option>'}</select>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="p-4 bg-blue-50 rounded-2xl">
                    <label class="text-[10px] font-bold uppercase text-blue-400 mb-1 block px-1">Extra</label>
                    <input type="number" id="q-extra" value="0" class="w-full font-bold bg-transparent !p-0">
                </div>
                <div class="p-4 bg-orange-50 rounded-2xl">
                    <label class="text-[10px] font-bold uppercase text-orange-400 mb-1 block px-1">Sconto Extra %</label>
                    <input type="number" id="d-extra" value="0" class="w-full font-bold bg-transparent !p-0">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="p-4 bg-slate-50/50 rounded-2xl">
                    <label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Trasporto €</label>
                    <input type="number" id="cost-trans" value="0" class="w-full font-bold bg-transparent !p-0">
                </div>
                <div class="p-4 bg-slate-50/50 rounded-2xl">
                    <label class="text-[10px] font-bold uppercase text-slate-400 mb-1 block px-1">Cliente</label>
                    <select id="c-type" class="w-full font-semibold"><option value="azienda">Azienda</option><option value="privato">Privato</option></select>
                </div>
            </div>

            <button onclick="eseguiCalcoloCommerciale()" class="w-full bg-[#007aff] text-white py-5 rounded-2xl font-bold text-lg ios-tap shadow-lg shadow-blue-200">
                Calcola Totale
            </button>

            <div id="risultato" class="hidden mt-6 p-6 bg-slate-900 rounded-[2rem] text-white space-y-4 shadow-2xl">
                <div class="flex justify-between items-center opacity-60 text-[11px] uppercase tracking-widest font-bold">
                    <span>Sconto</span> <span id="res-sconto-base"></span>
                </div>
                <div class="flex justify-between items-center opacity-60 text-[11px] uppercase tracking-widest font-bold">
                    <span>Qtà Venduta</span> <span id="res-pz" class="text-white opacity-100"></span>
                </div>
                <div class="flex justify-between items-center text-blue-400 text-[11px] uppercase tracking-widest font-bold">
                    <span>Vincolo</span> <span id="res-vincolo"></span>
                </div>
                <div class="pt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span class="text-sm font-medium opacity-60">Totale</span>
                    <span id="res-p" class="text-4xl font-extrabold tracking-tighter"></span>
                </div>
            </div>
        </div>`;
    lucide.createIcons();
}

function toggleSfrido(val) {
    document.getElementById('box-sfrido').classList.toggle('hidden', val !== 'secco');
}

// --- MOTORE DI CALCOLO CONGELATO ---
function eseguiCalcoloCommerciale() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    let mainQty = parseFloat(document.getElementById('q-main').value) || 0;
    const extraQty = parseFloat(document.getElementById('q-extra').value) || 0;
    const unitType = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    let qtyLavorazione = mainQty;
    if (p.range === "Posa incerta" && document.getElementById('finitura-pietra')?.value === 'secco') {
        qtyLavorazione = mainQty * (1 + (parseFloat(document.getElementById('perc-sfrido').value) || 0) / 100);
    }

    let qtyVenduta = 0;
    let vincoloMsg = "Vendita Libera";
    let baseDisc = 45;
    let labelUnit = (p.category === "Mattoni") ? " pz" : " MQ";

    // 1. LEGNO: RIVESTIMENTI
    if (p.range === "Rivestimenti" && p.category === "Legno") {
        qtyVenduta = (qtyLavorazione + extraQty) * (146/136);
        vincoloMsg = "Superficie Nominale";
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
        labelUnit = " MQ Nom.";
    } 
    // 2. LEGNO: PAVIMENTI
    else if (p.range === "Pavimenti" && p.category === "Legno") {
        qtyVenduta = qtyLavorazione + extraQty;
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
    }
    // 3. PIETRA: PANNELLI
    else if (p.range === "Pannelli preassemblati") {
        const mqR = qtyLavorazione + extraQty;
        qtyVenduta = Math.ceil(mqR / (p.m2_scatola || 1)) * (p.m2_scatola || 1);
        vincoloMsg = "Scatola Intera";
        baseDisc = qtyVenduta >= (p.m2_bancale || 999) ? 50 : 45;
    }
    // 4. PIETRA: PAVIMENTI
    else if (p.range === "Pavimenti" && p.category === "Pietra") {
        const tot = qtyLavorazione + extraQty;
        qtyVenduta = (p.sfuso === "no") ? Math.ceil(tot / (p.m2_bancale || 1)) * (p.m2_bancale || 1) : tot;
        vincoloMsg = p.sfuso === "no" ? "Bancale Intero" : "Libera";
        baseDisc = qtyVenduta >= (p.m2_bancale || 999) ? 50 : 45;
    }
    // 5. PIETRA: TETTI
    else if (p.range === "Tetti") {
        qtyVenduta = (unitType === 'mq') ? Math.ceil((qtyLavorazione + extraQty) * (p.pz_mq || 1)) : (qtyLavorazione + extraQty);
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
        labelUnit = " pz";
    }
    // 6. MATTONI
    else if (p.category === "Mattoni") {
        let pzMq = p.pz_mq;
        if (p.range === "Fortis") pzMq = document.getElementById('tipo-posa').value === 'coltello' ? p.pz_mq_coltello : p.pz_mq_piatto;
        let pzR = unitType === 'mq' ? Math.ceil((qtyLavorazione + extraQty) * pzMq) : (qtyLavorazione + extraQty);
        qtyVenduta = pzR;
        if (p.range === "Genesis") {
            qtyVenduta = (p.sfuso === 'no') ? Math.ceil(pzR / p.pz_bancale) * p.pz_bancale : Math.ceil(pzR / p.pz_scatola) * p.pz_scatola;
            vincoloMsg = p.sfuso === 'no' ? "Bancale" : "Scatola";
        } else if (p.sfuso === 'no' || ["Fortis", "Cotto"].includes(p.range)) {
            qtyVenduta = Math.ceil(pzR / p.pz_bancale) * p.pz_bancale;
            vincoloMsg = "Bancale Intero";
        }
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
        labelUnit = " pz";
    } else {
        qtyVenduta = qtyLavorazione + extraQty;
        baseDisc = qtyVenduta >= (p.m2_bancale || 999) ? 50 : 45;
    }

    const priceScontato = p.price * (1 - baseDisc / 100) * (1 - extraDisc / 100);
    const imponibile = (qtyVenduta * priceScontato) + transport;
    const totale = isPrivato ? imponibile * 1.22 : imponibile;

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-sconto-base').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-pz').innerText = qtyVenduta.toFixed(2) + labelUnit;
    document.getElementById('res-vincolo').innerText = vincoloMsg;
    document.getElementById('res-p').innerText = "€" + totale.toLocaleString('it-IT', {minimumFractionDigits: 2});
}

// --- GESTIONALE ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    let h = `<header class="mb-8"><h1 class="text-4xl font-extrabold tracking-tight">Listini</h1></header><div class="space-y-6">`;
    for (const [cat, info] of Object.entries(STRUTTURA)) {
        h += `<div class="glass p-6 rounded-[2.5rem] shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">${cat}</h3>
            <div class="space-y-3">${info.gamme.map(g => `
                <div class="flex items-center justify-between bg-white/50 p-3 pl-4 rounded-2xl border border-white/60 shadow-sm">
                    <span class="font-bold text-xs text-slate-600">${g}</span>
                    <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                    <label for="f-${cat}-${g}" class="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-[10px] ios-tap cursor-pointer">CARICA</label>
                </div>`).join('')}</div></div>`;
    }
    c.innerHTML = h + `</div>`;
    lucide.createIcons();
}

async function importa(cat, gamma, e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
        const idx = {
            n: header.indexOf("nome"),
            p: header.findIndex(h => h.includes("prezzo")),
            m2b: header.indexOf("m2_bancale"), m2s: header.indexOf("m2_scatola"),
            pzm: header.indexOf("pz_m2"), pzb: header.indexOf("pz_bancale"),
            pzs: header.indexOf("pz_scatola"), sf: header.indexOf("sfuso"),
            pzp: header.indexOf("pz_m2_piatto"), pzc: header.indexOf("pz_m2_coltello")
        };
        const batch = [];
        await db.prodotti.where({ category: cat, range: gamma }).delete();
        for(let i = 1; i < lines.length; i++) {
            const c = lines[i].split(/[,;]/).map(v => v.trim());
            if (!c[idx.n]) continue;
            let item = { category: cat, range: gamma, name: c[idx.n], price: parseFloat(c[idx.p]?.replace(',', '.')) || 0, sfuso: idx.sf !== -1 ? c[idx.sf].toLowerCase() : 'sì' };
            item.m2_bancale = parseFloat(c[idx.m2b]?.replace(',', '.')) || 999;
            item.m2_scatola = parseFloat(c[idx.m2s]?.replace(',', '.')) || 1;
            item.pz_mq = parseFloat(c[idx.pzm]?.replace(',', '.')) || 1;
            item.pz_bancale = parseInt(c[idx.pzb]) || 1;
            item.pz_scatola = parseInt(c[idx.pzs]) || 0;
            if (gamma === "Fortis") {
                item.pz_mq_piatto = parseFloat(c[idx.pzp]?.replace(',', '.')) || 0;
                item.pz_mq_coltello = parseFloat(c[idx.pzc]?.replace(',', '.')) || 0;
            }
            batch.push(item);
        }
        await db.prodotti.bulkAdd(batch);
        alert(`${gamma} aggiornato con successo!`);
    };
    reader.readAsText(file);
}

init();
