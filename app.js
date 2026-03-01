const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

// Struttura Gamme definita da te
const STRUTTURA_GAMME = {
    "Mattoni": ["Genesis", "Futura", "Croma", "Fortis", "Cotto"],
    "Pietra": ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"],
    "Legno": ["Rivestimenti", "Pavimenti"]
};

async function init() {
    renderCategorie();
    lucide.createIcons();
}

// LIVELLO 1: MACROCATEGORIE
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    
    const cats = [
        { n: 'Mattoni', i: 'brick-wall', cl: 'bg-orange-600' },
        { n: 'Pietra', i: 'mountain', cl: 'bg-stone-500' },
        { n: 'Legno', i: 'tree-deciduous', cl: 'bg-amber-800' }
    ];

    c.innerHTML = `<div class="grid gap-4">${cats.map(x => `
        <button onclick="renderGamme('${x.n}')" class="${x.cl} p-8 rounded-[2rem] shadow-lg text-white flex items-center gap-6 active:scale-95 transition-all w-full">
            <div class="bg-white/20 p-4 rounded-2xl"><i data-lucide="${x.i}"></i></div>
            <span class="text-xl font-bold uppercase italic tracking-tighter">${x.n}</span>
        </button>`).join('')}</div>`;
    lucide.createIcons();
}

// LIVELLO 2: GAMME (SOTTOCATEGORIE)
function renderGamme(cat) {
    const gamme = STRUTTURA_GAMME[cat] || [];
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden');
    b.onclick = renderCategorie;

    c.innerHTML = `
        <h2 class="text-xl font-black mb-6 uppercase text-slate-800">${cat}</h2>
        <div class="grid grid-cols-1 gap-3">
            ${gamme.map(g => `
                <button onclick="renderListaProdotti('${cat}', '${g}')" class="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center active:border-blue-500 transition-all">
                    <span class="font-bold text-slate-700 uppercase text-sm">${g}</span>
                    <i data-lucide="chevron-right" class="text-slate-300"></i>
                </button>`).join('')}
        </div>`;
    lucide.createIcons();
}

// LIVELLO 3: PRODOTTI
async function renderListaProdotti(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    c.innerHTML = `
        <div class="mb-6">
            <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">${cat}</p>
            <h2 class="text-2xl font-black text-slate-800 uppercase">${gamma}</h2>
        </div>
        <div class="space-y-2 pb-20">
            ${prodotti.length > 0 ? prodotti.map(p => `
                <div onclick='apriCalcolatore(${JSON.stringify(p)})' class="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center active:bg-slate-50">
                    <span class="font-bold text-sm text-slate-700">${p.name}</span>
                    <span class="text-blue-600 font-black">€${p.price.toFixed(2)}</span>
                </div>`).join('') : '<p class="text-slate-400 italic p-4 text-center">Nessun prodotto trovato. Importa il CSV per questa gamma.</p>'}
        </div>`;
}

// GESTIONALE
async function renderGestionale() {
    const p = await db.prodotti.toArray();
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('content').innerHTML = `
        <div class="bg-slate-900 text-white p-8 rounded-[2.5rem] mb-6 shadow-xl text-center">
            <i data-lucide="upload-cloud" class="mx-auto mb-4 opacity-50" size="40"></i>
            <h3 class="font-bold text-lg mb-4">Carica Listino CSV</h3>
            <input type="file" id="csvFile" accept=".csv" onchange="importaCSV(event)" class="hidden">
            <label for="csvFile" class="inline-block bg-blue-600 px-8 py-4 rounded-2xl font-black uppercase text-xs cursor-pointer active:scale-95 transition-all">Scegli File</label>
            <button onclick="if(confirm('Cancellare tutto?')) {db.prodotti.clear(); renderGestionale();}" class="block w-full mt-6 text-[10px] text-red-400 font-bold uppercase">Svuota Database</button>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase text-center">Prodotti attivi: ${p.length}</p>
    `;
    lucide.createIcons();
}

async function importaCSV(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
        const lines = event.target.result.split(/\r?\n/);
        const batch = [];
        lines.forEach((line, i) => {
            const c = line.split(/[,;]/); 
            if (c.length >= 6 && i > 0) {
                batch.push({
                    category: c[0].trim(), range: c[1].trim(), name: c[2].trim(),
                    price: parseFloat(c[3]) || 0, pz_bancale: parseInt(c[4]) || 1,
                    sfuso: c[5].trim().toLowerCase(), kg_bancale: parseFloat(c[6]) || 0,
                    pz_mq: parseFloat(c[7]) || 1
                });
            }
        });
        await db.prodotti.bulkAdd(batch);
        alert("Importazione completata!");
        renderCategorie();
    };
    reader.readAsText(file);
}

// MODALE CALCOLO
function apriCalcolatore(p) {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal-content').innerHTML = `
        <div class="text-center mb-6">
            <h3 class="text-xl font-black">${p.name}</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${p.range}</p>
        </div>
        <div class="space-y-6 text-center">
            <div class="relative">
                <input type="number" id="mq" class="w-full bg-slate-100 rounded-3xl p-6 text-3xl font-black text-center outline-none focus:ring-4 focus:ring-blue-100" placeholder="0">
                <label class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">Metri Quadri</label>
            </div>
            <div id="res" class="hidden space-y-2 bg-blue-50 p-6 rounded-3xl border border-blue-100 text-left">
                <div class="flex justify-between text-xs font-bold uppercase text-blue-800"><span>Pezzi</span> <span id="rp">0</span></div>
                <div class="flex justify-between text-xs font-bold uppercase text-blue-800"><span>Bancali</span> <span id="rb">0</span></div>
                <div class="flex justify-between text-lg font-black text-blue-700 border-t border-blue-200 pt-2"><span>TOTALE</span> <span id="rt">€ 0.00</span></div>
            </div>
            <div class="flex gap-3">
                <button onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 text-slate-400 font-bold uppercase text-xs">Esci</button>
                <button onclick='calcola(${JSON.stringify(p)})' class="flex-[2] bg-blue-600 text-white py-5 rounded-3xl font-black uppercase shadow-lg shadow-blue-200">Calcola</button>
            </div>
        </div>`;
}

function calcola(p) {
    const mq = parseFloat(document.getElementById('mq').value) || 0;
    let pz = Math.ceil(mq * (p.pz_mq || 1));
    if (p.sfuso === 'no' && p.pz_bancale > 0) pz = Math.ceil(pz / p.pz_bancale) * p.pz_bancale;
    
    document.getElementById('res').classList.remove('hidden');
    document.getElementById('rp').innerText = pz;
    document.getElementById('rb').innerText = (pz / p.pz_bancale).toFixed(1);
    document.getElementById('rt').innerText = "€ " + (pz * p.price).toFixed(2);
}

init();
