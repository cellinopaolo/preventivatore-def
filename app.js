// Configurazione Database Locale (Dexie.js)
const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

const STRUTTURA = {
    "Mattoni": { gamme: ["Genesis", "Futura", "Croma", "Fortis", "Cotto"], colore: "bg-orange-600", icona: "brick-wall" },
    "Pietra": { gamme: ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"], colore: "bg-stone-500", icona: "mountain" },
    "Legno": { gamme: ["Rivestimenti", "Pavimenti"], colore: "bg-amber-800", icona: "tree-deciduous" }
};

async function init() { renderCategorie(); lucide.createIcons(); }

// --- NAVIGAZIONE ---
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    c.innerHTML = `<div class="grid gap-4 italic font-black text-xl uppercase tracking-tighter">
        ${Object.keys(STRUTTURA).map(key => `
            <button onclick="renderGamme('${key}')" class="${STRUTTURA[key].colore} p-8 rounded-[2rem] text-white flex items-center gap-6 shadow-lg active:scale-95 transition-all w-full">
                <div class="bg-white/20 p-4 rounded-2xl"><i data-lucide="${STRUTTURA[key].icona}"></i></div>
                <span>${key}</span>
            </button>`).join('')}
    </div>`;
    lucide.createIcons();
}

function renderGamme(cat) {
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden'); b.onclick = renderCategorie;
    c.innerHTML = `<h2 class="text-2xl font-black mb-6 uppercase italic text-slate-800 border-l-4 border-blue-600 pl-3">${cat}</h2>
        <div class="grid gap-3 italic font-bold text-slate-700 uppercase tracking-widest text-sm">
            ${STRUTTURA[cat].gamme.map(g => `
                <button onclick="renderInterfacciaCalcolo('${cat}', '${g}')" class="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm active:border-blue-500 transition-all">
                    <span>${g}</span><i data-lucide="chevron-right" class="text-blue-500"></i>
                </button>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- INTERFACCIA CALCOLO ---
async function renderInterfacciaCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-10 text-center opacity-30 font-bold uppercase italic">Carica il listino per ${gamma}</div>`;
        return;
    }

    const htmlPosaFortis = gamma === "Fortis" ? `
        <div class="space-y-2">
            <label class="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Tipo di Posa</label>
            <select id="tipo-posa" class="w-full bg-orange-50 p-4 rounded-2xl font-black italic outline-none border-2 border-orange-100 focus:border-orange-500 appearance-none">
                <option value="piatto">DI PIATTO (Standard)</option>
                <option value="coltello">DI COLTELLO</option>
            </select>
        </div>` : "";

    const unitOptions = gamma === "Posa incerta" ? 
        `<option value="auto">AUTO (M2/ML)</option><option value="pz">PEZZI</option>` :
        `<option value="mq">MQ</option><option value="pz">PEZZI</option>`;

    c.innerHTML = `
        <div class="mb-4 italic"><p class="text-[10px] font-black text-blue-600 uppercase">${cat} / ${gamma}</p></div>
        <div class="bg-white p-5 rounded-[2.5rem] border shadow-sm space-y-5">
            <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Modello</label>
                <select id="select-prod" class="w-full bg-slate-100 p-4 rounded-2xl font-bold italic outline-none border-2 border-transparent focus:border-blue-500">
                    ${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}
                </select>
            </div>
            ${htmlPosaFortis}
            <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                    <input type="number" id="q-main" class="w-full bg-slate-50 rounded-2xl p-4 text-2xl font-black text-center border focus:border-blue-500 outline-none italic" value="0">
                    <label class="absolute -top-2 left-4 bg-slate-800 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Quantità</label>
                </div>
                <select id="u-type" class="w-full bg-slate-100 p-4 rounded-2xl font-black italic outline-none text-sm">${unitOptions}</select>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                    <input type="number" id="q-extra" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0">
                    <label class="absolute -top-2 left-4 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Extra</label>
                </div>
                <div class="relative">
                    <input type="number" id="d-extra" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0">
                    <label class="absolute -top-2 left-4 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Sconto Extra %</label>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                    <input type="number" id="cost-trans" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0">
                    <label class="absolute -top-2 left-4 bg-slate-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Trasporto €</label>
                </div>
                <select id="c-type" class="w-full bg-slate-100 p-4 rounded-2xl font-black italic outline-none text-[10px] uppercase"><option value="azienda">Azienda</option><option value="privato">Privato</option></select>
            </div>
            <button onclick="eseguiCalcoloCommerciale()" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all">Calcola Totale</button>
            <div id="risultato" class="hidden bg-slate-900 p-6 rounded-[2rem] text-white italic space-y-3 shadow-2xl">
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Sconto Composto</span> <span id="res-sconto-base"></span></div>
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Pezzi Finali</span> <span id="res-pz"></span></div>
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Vincolo Logistico</span> <span id="res-vincolo"></span></div>
                <div class="flex justify-between items-end pt-2 border-t border-white/10"><span class="text-xs font-black uppercase text-blue-400">TOTALE FINALE</span><span id="res-p" class="text-3xl font-black tracking-tighter"></span></div>
                <p id="iva-note" class="text-[8px] uppercase text-center opacity-40 pt-2"></p>
            </div>
        </div>`;
    lucide.createIcons();
}

// --- LOGICA DI CALCOLO COMMERCIALE ---
function eseguiCalcoloCommerciale() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    const mainQty = parseFloat(document.getElementById('q-main').value) || 0;
    const extraQty = parseFloat(document.getElementById('q-extra').value) || 0;
    const unitType = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    let pzMqEffettivo = p.pz_mq;
    if (p.range === "Fortis") {
        const tipoPosa = document.getElementById('tipo-posa').value;
        pzMqEffettivo = (tipoPosa === "coltello") ? p.pz_mq_coltello : p.pz_mq_piatto;
    }

    let pzRichiesti;
    if (p.range === "Posa incerta") {
        const isAngolare = p.name.includes("Angolare");
        if (unitType === 'auto') {
            const factor = isAngolare ? (p.pz_ml || 1) : (p.pz_mq || 1);
            pzRichiesti = Math.ceil((mainQty + extraQty) * factor);
        } else {
            pzRichiesti = (mainQty + extraQty);
        }
    } else {
        pzRichiesti = (unitType === 'mq') ? Math.ceil((mainQty + extraQty) * pzMqEffettivo) : (mainQty + extraQty);
    }

    let pzFinali = pzRichiesti;
    let vincoloMsg = "";
    const sfusoVal = (p.sfuso || "").toString().trim().toLowerCase();

    // APPLICAZIONE REGOLE PER GAMMA
    if (p.range === "Posa incerta") {
        pzFinali = pzRichiesti;
        vincoloMsg = "Vendita Libera";
    } else if (p.range === "Croma") {
        if (sfusoVal === 'no') {
            pzFinali = Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale;
            vincoloMsg = "Bancale Intero (Sfuso NO)";
        } else {
            pzFinali = pzRichiesti;
            vincoloMsg = "Vendita Libera (Sfuso SÌ)";
        }
    } else if (p.range === "Genesis") {
        pzFinali = (sfusoVal === 'no') ? Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale : Math.ceil(pzRichiesti / p.pz_scatola) * p.pz_scatola;
        vincoloMsg = (sfusoVal === 'no') ? "Bancale Intero" : "Scatola Intera";
    } else if (p.range === "Futura") {
        pzFinali = pzRichiesti;
        vincoloMsg = "Vendita Libera";
    } else if (p.range === "Fortis" || p.range === "Cotto") {
        pzFinali = Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale;
        vincoloMsg = "Bancale Intero";
    }

    // LOGICA SCONTI SPECIFICA PIETRA
    let baseDisc = 45;
    if (p.range === "Posa incerta") {
        const isAngolare = p.name.includes("Angolare");
        if (isAngolare) {
            baseDisc = (pzFinali >= p.pz_bancale) ? 50 : 45;
        } else {
            const mqEffettivi = (unitType === 'auto') ? (mainQty + extraQty) : (pzFinali / (p.pz_mq || 1));
            baseDisc = (mqEffettivi >= (p.m2_bancale || 9999)) ? 50 : 45;
        }
    } else {
        baseDisc = (pzFinali >= p.pz_bancale) ? 50 : 45;
    }

    const priceScontato = p.price * (1 - baseDisc / 100) * (1 - extraDisc / 100);
    const imponibile = (pzFinali * priceScontato) + transport;
    const totale = isPrivato ? imponibile * 1.22 : imponibile;

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-sconto-base').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-pz').innerText = pzFinali + " pz";
    document.getElementById('res-vincolo').innerText = vincoloMsg;
    document.getElementById('res-p').innerText = "€" + totale.toLocaleString('it-IT', {minimumFractionDigits: 2});
    document.getElementById('iva-note').innerText = isPrivato ? "Incl. IVA 22% e Trasp." : "Escl. IVA, Incl. Trasp.";
}

// --- GESTIONE LISTINI ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    let h = `<h2 class="text-2xl font-black mb-6 uppercase italic">Gestione Listini</h2><div class="space-y-4 pb-24">`;
    for (const [cat, info] of Object.entries(STRUTTURA)) {
        h += `<div class="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
            <div class="${info.colore} p-4 text-white font-black uppercase italic text-[10px] tracking-widest">${cat}</div>
            <div class="p-4 space-y-2">${info.gamme.map(g => `
                <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                    <span class="font-bold text-[10px] uppercase text-slate-500">${g}</span>
                    <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                    <label for="f-${cat}-${g}" class="bg-slate-800 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] cursor-pointer">Carica CSV</label>
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
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
        
        const idx = {
            nome: header.indexOf("nome"),
            prezzo: header.indexOf("prezzo_pz") !== -1 ? header.indexOf("prezzo_pz") : header.indexOf("prezzo_unita"),
            pz_mq: header.indexOf("pz_m2"),
            pz_ml: header.indexOf("pz_ml"),
            m2_bancale: header.indexOf("m2_bancale"),
            pz_mq_p: header.indexOf("pz_m2_piatto"),
            pz_mq_c: header.indexOf("pz_m2_coltello"),
            pz_scatola: header.indexOf("pz_scatola"),
            pz_bancale: header.indexOf("pz_bancale"),
            kg_bancale: header.indexOf("kg_bancale"),
            sfuso: header.indexOf("sfuso")
        };

        const batch = [];
        await db.prodotti.where({ category: cat, range: gamma }).delete();

        for(let i = 1; i < lines.length; i++) {
            const c = lines[i].split(/[,;]/).map(val => val.trim());
            if (!c[idx.nome]) continue;

            let item = { 
                category: cat, range: gamma, name: c[idx.nome], 
                price: parseFloat(c[idx.prezzo]?.replace(',', '.')) || 0,
                sfuso: idx.sfuso !== -1 ? c[idx.sfuso].toLowerCase() : 'no'
            };

            if (gamma === "Fortis") {
                item.pz_mq_piatto = parseFloat(c[idx.pz_mq_p]?.replace(',', '.')) || 0;
                item.pz_mq_coltello = parseFloat(c[idx.pz_mq_c]?.replace(',', '.')) || 0;
                item.pz_bancale = parseInt(c[idx.pz_bancale]) || 1;
                item.pz_mq = item.pz_mq_piatto;
            } else if (gamma === "Posa incerta") {
                item.pz_ml = parseFloat(c[idx.pz_ml]?.replace(',', '.')) || 0;
                item.m2_bancale = parseFloat(c[idx.m2_bancale]?.replace(',', '.')) || 0;
                item.pz_bancale = parseInt(c[idx.pz_bancale]) || 1;
                item.pz_mq = parseFloat(c[idx.pz_mq]?.replace(',', '.')) || 1;
            } else if (gamma === "Cotto" || gamma === "Croma") {
                item.pz_mq = parseFloat(c[idx.pz_mq]?.replace(',', '.')) || 1;
                item.pz_bancale = parseInt(c[idx.pz_bancale]) || 1;
                item.kg_bancale = parseFloat(c[idx.kg_bancale]?.replace(',', '.')) || 0;
                item.pz_scatola = 0;
            } else {
                item.pz_mq = parseFloat(c[idx.pz_mq]?.replace(',', '.')) || 1;
                item.pz_scatola = idx.pz_scatola !== -1 ? parseInt(c[idx.pz_scatola]) : 0;
                item.pz_bancale = parseInt(c[idx.pz_bancale]) || 1;
                item.kg_bancale = parseFloat(c[idx.kg_bancale]?.replace(',', '.')) || 0;
            }
            batch.push(item);
        }
        await db.prodotti.bulkAdd(batch);
        alert(`SUCCESSO: Listino ${gamma} caricato!`);
        renderGestionale();
    };
    reader.readAsText(file);
}

init();
