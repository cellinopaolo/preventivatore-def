const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

async function init() {
    renderCategorie();
    lucide.createIcons();
}

async function renderGestionale() {
    const p = await db.prodotti.toArray();
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('content').innerHTML = `
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-[2rem] mb-6 shadow-xl">
            <h3 class="font-bold text-lg mb-1">Importa Prodotti</h3>
            <p class="text-xs opacity-80 mb-4 italic">Assicurati che il CSV sia pulito (es. Genesis, Rosso, 1.50...)</p>
            <input type="file" accept=".csv" onchange="importaCSV(event)" class="text-xs file:bg-white file:text-blue-600 file:px-4 file:py-2 file:rounded-full file:border-0 font-semibold cursor-pointer">
            <button onclick="await db.prodotti.clear(); renderGestionale();" class="mt-4 block text-[10px] underline opacity-60">Svuota database</button>
        </div>
        <div class="space-y-2">
            ${p.map(x => `
                <div class="bg-white p-3 rounded-2xl border flex justify-between items-center shadow-sm">
                    <div class="leading-tight">
                        <p class="font-bold text-sm text-slate-800">${x.name}</p>
                        <p class="text-[9px] text-slate-400 uppercase font-bold">${x.range}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-black text-blue-600">€${x.price.toFixed(2)}</span>
                    </div>
                </div>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

async function importaCSV(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split(/\r?\n/);
        const products = [];

        lines.forEach((line, index) => {
            const cols = line.split(/[,;]/); // Gestisce sia virgola che punto e virgola
            if (cols.length >= 6 && index > 0) { // Salta intestazione
                products.push({
                    category: cols[0].trim(),
                    range: cols[1].trim(),
                    name: cols[2].trim(),
                    price: parseFloat(cols[3]) || 0,
                    pz_bancale: parseInt(cols[4]) || 1,
                    sfuso: cols[5].trim().toLowerCase() === 'si' ? 'si' : 'no',
                    kg_bancale: parseFloat(cols[6]) || 0,
                    pz_mq: parseFloat(cols[7]) || 1
                });
            }
        });

        if (products.length > 0) {
            await db.prodotti.bulkAdd(products);
            alert(`Importati ${products.length} prodotti!`);
            renderCategorie();
        }
    };
    reader.readAsText(file);
}

function renderCategorie() {
    document.getElementById('back-btn').classList.add('hidden');
    const c = document.getElementById('content');
    const cats = [
        { n: 'Mattoni', i: 'brick-wall', cl: 'bg-orange-500' },
        { n: 'Pietra', i: 'mountain', cl: 'bg-stone-500' },
        { n: 'Legno', i: 'tree-deciduous', cl: 'bg-amber-800' }
    ];
    c.innerHTML = `<div class="grid gap-4">${cats.map(x => `
        <button onclick="renderRange('${x.n}')" class="${x.cl} p-8 rounded-[2.5rem] shadow-lg text-white flex items-center gap-6 active:scale-95 transition-all">
            <div class="bg-white/20 p-4 rounded-3xl"><i data-lucide="${x.i}" size="32"></i></div>
            <span class="text-2xl font-black uppercase tracking-tighter">${x.n}</span>
        </button>`).join('')}</div>`;
    lucide.createIcons();
}

async function renderRange(cat) {
    const p = await db.prodotti.where('category').equals(cat).toArray();
    const ranges = [...new Set(p.map(x => x.range))];
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden'); b.onclick = renderCategorie;

    c.innerHTML = `
        <h2 class="text-2xl font-black mb-6 uppercase tracking-tight">${cat}</h2>
        <div class="grid grid-cols-2 gap-3">
            ${ranges.map(r => `
                <button onclick="renderProducts('${cat}', '${r}')" class="bg-white p-5 rounded-3xl border shadow-sm text-center active:bg-blue-50 transition-colors">
                    <p class="text-xs font-black uppercase text-blue-600">${r}</p>
                </button>`).join('')}
        </div>`;
}

async function renderProducts(cat, range) {
    const p = await db.prodotti.where({ category: cat, range: range }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderRange(cat);

    c.innerHTML = `
        <h2 class="text-xl font-black mb-1 uppercase tracking-tight">${range}</h2>
        <p class="text-[10px] text-slate-400 font-bold mb-6 uppercase">Seleziona un prodotto</p>
        <div class="space-y-2">
            ${p.map(x => `
                <div onclick='openCalc(${JSON.stringify(x)})' class="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center active:scale-[0.98] transition-all">
                    <span class="font-bold text-sm truncate pr-4">${x.name}</span>
                    <span class="text-blue-600 font-black text-sm shrink-0">€${x.price.toFixed(2)}</span>
                </div>`).join('')}
        </div>`;
}

function openCalc(p) {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal-content').innerHTML = `
        <div class="text-center mb-6">
            <h3 class="text-xl font-black">${p.name}</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${p.range}</p>
        </div>
        <div class="space-y-6">
            <div class="relative">
                <input type="number" id="mq" class="w-full bg-slate-100 rounded-3xl p-6 text-3xl font-black text-center outline-none focus:ring-4 focus:ring-blue-100" placeholder="0">
                <label class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">MQ Desiderati</label>
            </div>
            <div id="res" class="hidden space-y-3 bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <div class="flex justify-between text-xs font-bold uppercase text-blue-800"><span>Pezzi</span> <span id="rp">0</span></div>
                <div class="flex justify-between text-xs font-bold uppercase text-blue-800"><span>Bancali</span> <span id="rb">0</span></div>
                <div class="flex justify-between text-lg font-black text-blue-700 border-t border-blue-200 pt-2"><span>TOTALE</span> <span id="rt">€ 0.00</span></div>
            </div>
            <div class="flex gap-3 pt-4">
                <button onclick="closeModal()" class="flex-1 text-slate-400 font-bold uppercase text-xs">Annulla</button>
                <button onclick='doCalc(${JSON.stringify(p)})' class="flex-[2] bg-blue-600 text-white py-5 rounded-3xl font-black shadow-lg shadow-blue-200 uppercase tracking-tighter">Calcola</button>
            </div>
        </div>`;
}

function doCalc(p) {
    const mq = parseFloat(document.getElementById('mq').value) || 0;
    let pz = Math.ceil(mq * (p.pz_mq || 1));
    if (p.sfuso === 'no' && p.pz_bancale > 0) pz = Math.ceil(pz / p.pz_bancale) * p.pz_bancale;
    
    document.getElementById('res').classList.remove('hidden');
    document.getElementById('rp').innerText = pz;
    document.getElementById('rb').innerText = (pz / p.pz_bancale).toFixed(1);
    document.getElementById('rt').innerText = "€ " + (pz * p.price).toFixed(2);
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function renderGestionale() { /* Come sopra */ }

init();
