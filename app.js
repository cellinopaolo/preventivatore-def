// Configurazione Database Locale
const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

// Struttura fissa delle categorie e gamme
const STRUTTURA = {
    "Mattoni": {
        gamme: ["Genesis", "Futura", "Croma", "Fortis", "Cotto"],
        colore: "bg-orange-600",
        icona: "brick-wall"
    },
    "Pietra": {
        gamme: ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"],
        colore: "bg-stone-500",
        icona: "mountain"
    },
    "Legno": {
        gamme: ["Rivestimenti", "Pavimenti"],
        colore: "bg-amber-800",
        icona: "tree-deciduous"
    }
};

// Avvio applicazione
async function init() {
    renderCategorie();
    lucide.createIcons();
}

// --- CATALOGO: LIVELLO 1 (MACROCATEGORIE) ---
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    
    c.innerHTML = `<div class="grid gap-4 italic font-black text-xl uppercase tracking-tighter">
        ${Object.keys(STRUTTURA).map(key => `
            <button onclick="renderGamme('${key}')" class="${STRUTTURA[key].colore} p-8 rounded-[2rem] text-white flex items-center gap-6 shadow-lg active:scale-95 transition-all w-full">
                <div class="bg-white/20 p-4 rounded-2xl"><i data-lucide="${STRUTTURA[key].icona}"></i></div>
                <span>${key}</span>
            </button>
        `).join('')}
    </div>`;
    lucide.createIcons();
}

// --- CATALOGO: LIVELLO 2 (SOTTO CATEGORIE / GAMME) ---
function renderGamme(cat) {
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden');
    b.onclick = renderCategorie;

    c.innerHTML = `<h2 class="text-2xl font-black mb-6 uppercase italic text-slate-800 underline decoration-blue-500 decoration-4 underline-offset-8">${cat}</h2>
        <div class="grid gap-3 italic font-bold text-slate-700 uppercase tracking-widest text-sm">
            ${STRUTTURA[cat].gamme.map(g => `
                <button onclick="renderProdotti('${cat}', '${g}')" class="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm active:border-blue-500 active:bg-blue-50 transition-all">
                    <span>${g}</span><i data-lucide="chevron-right" class="text-blue-500"></i>
                </button>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

// --- CATALOGO: LIVELLO 3 (PRODOTTI) ---
async function renderProdotti(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    c.innerHTML = `<div class="mb-6"><p class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">${cat}</p>
        <h2 class="text-2xl font-black text-slate-800 uppercase italic">${gamma}</h2></div>
        <div class="space-y-2 pb-20">
            ${prodotti.length > 0 ? prodotti.map(p => `
                <div onclick='apriCalcolatore(${JSON.stringify(p)})' class="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center font-bold italic active:scale-95 transition-transform">
                    <span class="text-slate-700 truncate pr-4">${p.name}</span>
                    <span class="text-blue-600 shrink-0">€${p.price.toFixed(2)}</span>
                </div>
            `).join('') : '<div class="p-10 text-center opacity-30 italic font-bold">Listino vuoto. Carica il CSV in "Listini".</div>'}
        </div>`;
}

// --- GESTIONE: CARICAMENTO PER OGNI GAMMA ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');

    let htmlListini = `<h2 class="text-2xl font-black mb-6 uppercase italic">Gestione Listini</h2>
                       <div class="space-y-6 pb-24">`;

    for (const [cat, info] of Object.entries(STRUTTURA)) {
        htmlListini += `
            <div class="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                <div class="${info.colore} p-4 text-white flex items-center gap-3">
                    <i data-lucide="${info.icona}" size="18"></i>
                    <span class="font-black uppercase italic text-sm tracking-widest">${cat}</span>
                </div>
                <div class="p-4 space-y-3">
                    ${info.gamme.map(g => `
                        <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span class="flex-grow font-bold text-[10px] uppercase text-slate-600 ml-2">${g}</span>
                            <input type="file" id="file-${cat}-${g}" accept=".csv" class="hidden" onchange="importaPerGamma('${cat}', '${g}', event)">
                            <label for="file-${cat}-${g}" class="bg-slate-800 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] cursor-pointer hover:bg-blue-600 transition-colors">
                                Carica CSV
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }

    htmlListini += `<button onclick="resetTotale()" class="w-full py-4 text-red-500 font-black uppercase text-[10px] italic underline">Svuota database completo</button></div>`;
    c.innerHTML = htmlListini;
    lucide.createIcons();
}

// Funzione importazione CSV mirata
async function importaPerGamma(cat, gamma, e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const lines = event.target.result.split(/\r?\n/);
        const batch = [];
        
        await db.prodotti.where({ category: cat, range: gamma }).delete();

        lines.forEach((line, i) => {
            const c = line.split(/[,;]/); 
            if (c.length >= 8 && i > 0 && c[2] && c[2].trim() !== "") {
                batch.push({
                    category: cat,
                    range: gamma,
                    name: c[2].trim(),
                    price: parseFloat(c[3].replace(',', '.')) || 0,
                    pz_mq: parseFloat(c[4]?.replace(',', '.')) || 1,
                    pz_scatola: parseInt(c[5]) || 0,
                    pz_bancale: parseInt(c[6]) || 1,
                    kg_bancale: parseFloat(c[7]?.replace(',', '.')) || 0,
                    sfuso: c[8] ? c[8].trim().toLowerCase() : 'si'
                });
            }
        });

        if (batch.length > 0) {
            await db.prodotti.bulkAdd(batch);
            alert(`Aggiornato listino ${gamma} (${batch.length} prodotti)`);
        } else {
            alert("Errore: Formato file non valido.");
        }
        renderGestionale();
    };
    reader.readAsText(file);
}

// --- CALCOLATORE ---
function apriCalcolatore(p) {
    document.getElementById('modal').classList.remove('hidden');
    const labelInput = p.category === "Mattoni" ? "Metri Quadri" : "Quantità (MQ)";
    
    document.getElementById('modal-content').innerHTML = `
        <div class="text-center mb-6 italic">
            <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">${p.range}</p>
            <h3 class="text-xl font-black uppercase tracking-tighter">${p.name}</h3>
        </div>
        <div class="space-y-6">
            <div class="relative">
                <input type="number" id="input-val" class="w-full bg-slate-100 rounded-3xl p-6 text-3xl font-black text-center outline-none focus:ring-4 focus:ring-blue-100 italic" placeholder="0">
                <label class="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase italic">Inserisci ${labelInput}</label>
            </div>
            <div id="res-box" class="hidden space-y-3 bg-blue-50 p-6 rounded-3xl border border-blue-100 italic">
                <div class="flex justify-between text-[10px] font-black uppercase text-blue-800 tracking-widest">
                    <span>${p.category === "Mattoni" ? "Pezzi Totali" : "MQ Effettivi"}</span>
                    <span id="res-quantita" class="text-slate-900"></span>
                </div>
                <div class="flex justify-between text-[10px] font-black uppercase text-blue-800 tracking-widest">
                    <span>Bancali / Colli</span>
                    <span id="res-bancali" class="text-slate-900"></span>
                </div>
                <div class="flex justify-between text-lg font-black text-blue-900 border-t border-blue-200 pt-2">
                    <span>TOTALE</span>
                    <span id="res-prezzo"></span>
                </div>
            </div>
            <div class="flex gap-4">
                <button onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 text-slate-400 font-bold uppercase text-[10px] italic underline">Chiudi</button>
                <button onclick='eseguiCalcolo(${JSON.stringify(p)})' class="flex-[2] bg-blue-600 text-white py-5 rounded-3xl font-black uppercase italic shadow-lg shadow-blue-200 active:scale-95 transition-transform">Calcola</button>
            </div>
        </div>`;
}

function eseguiCalcolo(p) {
    const val = parseFloat(document.getElementById('input-val').value) || 0;
    let finale_q = 0, finale_p = 0, finale_b = 0;

    if (p.category === "Mattoni") {
        let pz = Math.ceil(val * p.pz_mq);
        if (p.sfuso === 'no') pz = Math.ceil(pz / p.pz_bancale) * p.pz_bancale;
        finale_q = pz + " pz";
        finale_p = pz * p.price;
        finale_b = (pz / p.pz_bancale).toFixed(1);
    } else {
        let mq = val;
        if (p.sfuso === 'no') mq = Math.ceil(mq / p.pz_bancale) * p.pz_bancale;
        finale_q = mq.toFixed(2) + " m²";
        finale_p = mq * p.price;
        finale_b = (mq / p.pz_bancale).toFixed(1);
    }

    document.getElementById('res-box').classList.remove('hidden');
    document.getElementById('res-quantita').innerText = finale_q;
    document.getElementById('res-bancali').innerText = finale_b;
    document.getElementById('res-prezzo').innerText = "€ " + finale_p.toLocaleString('it-IT', {minimumFractionDigits: 2});
}

async function resetTotale() {
    if(confirm('Sei sicuro di voler cancellare tutto?')) {
        await db.prodotti.clear();
        renderGestionale();
    }
}

init();
