const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

const STRUTTURA = {
    "Mattoni": { gamme: ["Genesis", "Futura", "Croma", "Fortis", "Cotto"], colore: "bg-orange-600", icona: "brick-wall" },
    "Pietra": { gamme: ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"], colore: "bg-stone-500", icona: "mountain" },
    "Legno": { gamme: ["Rivestimenti", "Pavimenti"], colore: "bg-amber-800", icona: "tree-deciduous" }
};

async function init() { renderCategorie(); lucide.createIcons(); }

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
    c.innerHTML = `<h2 class="text-2xl font-black mb-6 uppercase italic text-slate-800 underline decoration-blue-500 decoration-4 underline-offset-8">${cat}</h2>
        <div class="grid gap-3 italic font-bold text-slate-700 uppercase tracking-widest text-sm">
            ${STRUTTURA[cat].gamme.map(g => `
                <button onclick="renderInterfacciaCalcolo('${cat}', '${g}')" class="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm active:border-blue-500 transition-all">
                    <span>${g}</span><i data-lucide="chevron-right" class="text-blue-500"></i>
                </button>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- INTERFACCIA DEDICATA AL PREVENTIVO ---
async function renderInterfacciaCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-10 text-center opacity-30 italic font-bold uppercase">Nessun listino caricato per ${gamma}</div>`;
        return;
    }

    c.innerHTML = `
        <div class="mb-6 italic">
            <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">${cat}</p>
            <h2 class="text-2xl font-black text-slate-800 uppercase italic">${gamma}</h2>
        </div>

        <div class="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-6">
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 ml-4 italic">Seleziona Modello</label>
                <select id="select-prod" class="w-full bg-slate-100 p-4 rounded-2xl font-bold italic outline-none border-2 border-transparent focus:border-blue-500 appearance-none">
                    ${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name} - €${p.price.toFixed(2)}</option>`).join('')}
                </select>
            </div>

            <div class="relative">
                <input type="number" id="val-mq" class="w-full bg-slate-50 rounded-3xl p-8 text-4xl font-black text-center outline-none border-2 border-slate-100 focus:border-blue-500 italic" placeholder="0">
                <label class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-1 rounded-full text-[10px] font-black uppercase italic whitespace-nowrap">Metri Quadri (m²)</label>
            </div>

            <div id="risultato" class="hidden space-y-4 bg-blue-600 p-6 rounded-[2rem] text-white italic shadow-lg shadow-blue-100">
                <div class="flex justify-between border-b border-white/20 pb-2">
                    <span class="text-[10px] font-bold uppercase opacity-80">Quantità</span>
                    <span id="res-q" class="font-black"></span>
                </div>
                <div class="flex justify-between border-b border-white/20 pb-2">
                    <span class="text-[10px] font-bold uppercase opacity-80">Bancali/Colli</span>
                    <span id="res-b" class="font-black"></span>
                </div>
                <div class="flex justify-between items-end pt-2">
                    <span class="text-xs font-black uppercase">Totale Preventivo</span>
                    <span id="res-p" class="text-3xl font-black tracking-tighter"></span>
                </div>
            </div>

            <button onclick="eseguiCalcolo()" class="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase italic shadow-xl shadow-blue-200 active:scale-95 transition-all">Calcola Preventivo</button>
        </div>
    `;
    lucide.createIcons();
}

function eseguiCalcolo() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    const mqInput = parseFloat(document.getElementById('val-mq').value) || 0;
    
    let quantita, prezzo, bancali;

    if (p.category === "Mattoni") {
        let pz = Math.ceil(mqInput * p.pz_mq);
        if (p.sfuso === 'no') pz = Math.ceil(pz / p.pz_bancale) * p.pz_bancale;
        quantita = pz + " pz";
        prezzo = pz * p.price;
        bancali = (pz / p.pz_bancale).toFixed(1);
    } else {
        let mq = mqInput;
        if (p.sfuso === 'no') mq = Math.ceil(mq / p.pz_bancale) * p.pz_bancale;
        quantita = mq.toFixed(2) + " m²";
        prezzo = mq * p.price;
        bancali = (mq / p.pz_bancale).toFixed(1);
    }

    const box = document.getElementById('risultato');
    box.classList.remove('hidden');
    document.getElementById('res-q').innerText = quantita;
    document.getElementById('res-b').innerText = bancali;
    document.getElementById('res-p').innerText = "€" + prezzo.toLocaleString('it-IT', {minimumFractionDigits: 2});
}

// --- GESTIONALE (Resta uguale per caricare i file) ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    let h = `<h2 class="text-2xl font-black mb-6 uppercase italic">Configurazione Listini</h2><div class="space-y-4 pb-24">`;
    for (const [cat, info] of Object.entries(STRUTTURA)) {
        h += `<div class="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
            <div class="${info.colore} p-4 text-white font-black uppercase italic text-[10px] tracking-widest">${cat}</div>
            <div class="p-4 space-y-2">${info.gamme.map(g => `
                <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                    <span class="font-bold text-[10px] uppercase text-slate-500">${g}</span>
                    <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                    <label for="f-${cat}-${g}" class="bg-slate-800 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] cursor-pointer">Carica</label>
                </div>`).join('')}</div></div>`;
    }
    c.innerHTML = h + `</div>`;
    lucide.createIcons();
}

async function importa(cat, gamma, e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        const lines = event.target.result.split(/\r?\n/);
        const batch = [];
        await db.prodotti.where({ category: cat, range: gamma }).delete();
        lines.forEach((line, i) => {
            const c = line.split(/[,;]/); 
            if (c.length >= 8 && i > 0 && c[2]) {
                batch.push({
                    category: cat, range: gamma, name: c[2].trim(),
                    price: parseFloat(c[3].replace(',', '.')) || 0,
                    pz_mq: parseFloat(c[4]?.replace(',', '.')) || 1,
                    pz_bancale: parseInt(c[6]) || 1,
                    sfuso: c[8] ? c[8].trim().toLowerCase() : 'si'
                });
            }
        });
        await db.prodotti.bulkAdd(batch);
        alert(`Aggiornato: ${gamma}`);
        renderGestionale();
    };
    reader.readAsText(file);
}

init();
