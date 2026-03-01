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
    c.innerHTML = `<h2 class="text-2xl font-black mb-6 uppercase italic text-slate-800">${cat}</h2>
        <div class="grid gap-3 italic font-bold text-slate-700 uppercase tracking-widest text-sm">
            ${STRUTTURA[cat].gamme.map(g => `
                <button onclick="renderInterfacciaCalcolo('${cat}', '${g}')" class="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm active:border-blue-500 transition-all">
                    <span>${g}</span><i data-lucide="chevron-right" class="text-blue-500"></i>
                </button>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- CALCOLATORE CON LOGICA SFUSO/SCATOLA ---
async function renderInterfacciaCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-10 text-center opacity-30 font-bold uppercase">Carica il listino per ${gamma}</div>`;
        return;
    }

    c.innerHTML = `
        <div class="mb-4 italic">
            <p class="text-[10px] font-black text-blue-600 uppercase mb-1">${cat} / ${gamma}</p>
        </div>

        <div class="bg-white p-5 rounded-[2.5rem] border shadow-sm space-y-5">
            <div>
                <label class="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Modello</label>
                <select id="select-prod" class="w-full bg-slate-100 p-4 rounded-2xl font-bold italic outline-none border-2 border-transparent focus:border-blue-500">
                    ${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}
                </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                    <input type="number" id="q-main" class="w-full bg-slate-50 rounded-2xl p-4 text-2xl font-black text-center border focus:border-blue-500 outline-none italic" value="0">
                    <label class="absolute -top-2 left-4 bg-slate-800 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Quantità</label>
                </div>
                <select id="u-type" class="w-full bg-slate-100 p-4 rounded-2xl font-black italic outline-none text-sm">
                    <option value="mq">MQ</option>
                    <option value="pz">PEZZI</option>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                    <input type="number" id="q-extra" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0">
                    <label class="absolute -top-2 left-4 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Extra (MQ o Pz)</label>
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
                <select id="c-type" class="w-full bg-slate-100 p-4 rounded-2xl font-black italic outline-none text-[10px] uppercase">
                    <option value="azienda">Azienda (Escl. IVA)</option>
                    <option value="privato">Privato (Incl. IVA)</option>
                </select>
            </div>

            <button onclick="eseguiCalcoloCommerciale()" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all">Calcola Preventivo</button>

            <div id="risultato" class="hidden bg-slate-900 p-6 rounded-[2rem] text-white italic space-y-3 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Sconto Composto</span> <span id="res-sconto-base"></span></div>
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Pezzi Venduti</span> <span id="res-pz"></span></div>
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Vincolo</span> <span id="res-vincolo"></span></div>
                <div class="flex justify-between items-end pt-2 border-t border-white/10">
                    <span class="text-xs font-black uppercase text-blue-400">TOTALE FINALE</span>
                    <span id="res-p" class="text-3xl font-black tracking-tighter"></span>
                </div>
                <p id="iva-note" class="text-[8px] uppercase text-center opacity-40 pt-2"></p>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function eseguiCalcoloCommerciale() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    const mainQty = parseFloat(document.getElementById('q-main').value) || 0;
    const extraQty = parseFloat(document.getElementById('q-extra').value) || 0;
    const unitType = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    // Conversione base in pezzi
    let pzPrincipali = (unitType === 'mq') ? Math.ceil(mainQty * p.pz_mq) : mainQty;
    let pzExtra = (unitType === 'mq') ? Math.ceil(extraQty * p.pz_mq) : extraQty;
    let pzRichiesti = pzPrincipali + pzExtra;

    // --- LOGICA VINCOLI VENDITA ---
    let pzFinali = pzRichiesti;
    let vincoloMsg = "Sfuso Libero";

    if (p.sfuso === 'no') {
        // Vincolo Bancale Completo
        pzFinali = Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale;
        vincoloMsg = "Bancale Intero";
    } else {
        // Vincolo Pezzi per Scatola (se pz_scatola > 0)
        if (p.pz_scatola > 0) {
            pzFinali = Math.ceil(pzRichiesti / p.pz_scatola) * p.pz_scatola;
            vincoloMsg = "Scatola Intera";
        }
    }

    // Calcolo Sconto Base
    const baseDisc = (pzFinali >= p.pz_bancale) ? 50 : 45;

    // Calcolo Sconto Composto (Cascata)
    const priceScontatoBase = p.price * (1 - baseDisc / 100);
    const priceScontatoFinale = priceScontatoBase * (1 - extraDisc / 100);
    
    const imponibileMerce = pzFinali * priceScontatoFinale;
    const totaleImponibile = imponibileMerce + transport;

    let finale = isPrivato ? totaleImponibile * 1.22 : totaleImponibile;

    // Output
    const box = document.getElementById('risultato');
    box.classList.remove('hidden');
    document.getElementById('res-sconto-base').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-pz').innerText = pzFinali + " pz";
    document.getElementById('res-vincolo').innerText = vincoloMsg;
    document.getElementById('res-p').innerText = "€" + finale.toLocaleString('it-IT', {minimumFractionDigits: 2});
    document.getElementById('iva-note').innerText = isPrivato ? "Include IVA 22% e Trasporto" : "Prezzo IVA esclusa, include Trasporto";
}

// --- GESTIONALE CSV ---
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
                    pz_scatola: parseInt(c[5]) || 0,
                    pz_bancale: parseInt(c[6]) || 1,
                    kg_bancale: parseFloat(c[7]?.replace(',', '.')) || 0,
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
