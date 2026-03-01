// 1. Inizializzazione Database Locale (IndexedDB)
const db = new Dexie("PreventiviDB");
db.version(1).stores({
    prodotti: "++id, macrocategoria, gamma, nome"
});

// 2. Funzione Iniziale
async function init() {
    renderCategorie();
    lucide.createIcons();
}

// --- LOGICA GESTIONALE (CSV E MODIFICA) ---

async function renderGestionale() {
    const prodotti = await db.prodotti.toArray();
    const content = document.getElementById('content');
    cambiaTitolo("Gestione Listini");
    
    let html = `
        <div class="bg-blue-600 text-white p-6 rounded-3xl mb-6 shadow-lg">
            <h3 class="font-bold mb-2">Importa Listino .CSV</h3>
            <input type="file" accept=".csv" onchange="importaCSV(event)" class="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
            <p class="text-[10px] mt-4 opacity-70">Formato: Categoria, Gamma, Nome, Prezzo, Pz_Bancale, Sfuso(si/no), Kg_Bancale, Pz_MQ</p>
        </div>
        <div class="space-y-3 pb-20">
            ${prodotti.map(p => `
                <div class="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
                    <div class="flex justify-between items-start">
                        <span class="font-bold text-slate-800">${p.nome}</span>
                        <button onclick="eliminaProdotto(${p.id})" class="text-red-400"><i data-lucide="trash-2" size="16"></i></button>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-[9px] uppercase font-bold text-slate-400">Prezzo (€)</label>
                            <input type="number" step="0.01" value="${p.prezzo_unita}" onchange="updateDB(${p.id}, 'prezzo_unita', this.value)" class="w-full border rounded-lg px-2 py-1 text-sm">
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-slate-400">Pz/Bancale</label>
                            <input type="number" value="${p.pz_bancale}" onchange="updateDB(${p.id}, 'pz_bancale', this.value)" class="w-full border rounded-lg px-2 py-1 text-sm">
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    content.innerHTML = html;
    lucide.createIcons();
}

async function importaCSV(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
        const righe = e.target.result.split("\n").slice(1);
        const data = righe.filter(r => r.trim()).map(r => {
            const c = r.split(",");
            return {
                macrocategoria: c[0].trim(),
                gamma: c[1].trim(),
                nome: c[2].trim(),
                prezzo_unita: parseFloat(c[3]),
                pz_bancale: parseInt(c[4]),
                sfuso: c[5].trim().toLowerCase(),
                kg_bancale: parseFloat(c[6] || 0),
                pz_mq: parseFloat(c[7] || 0)
            };
        });
        await db.prodotti.clear();
        await db.prodotti.bulkAdd(data);
        alert("Listino Caricato!");
        renderGestionale();
    };
    reader.readAsText(file);
}

async function updateDB(id, campo, valore) {
    const updateObj = {};
    updateObj[campo] = campo === 'sfuso' ? valore : parseFloat(valore);
    await db.prodotti.update(id, updateObj);
}

// --- LOGICA PREVENTIVO (CALCOLO) ---

function renderCategorie() {
    cambiaTitolo("Catalogo");
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="grid gap-4">
            <button onclick="renderProdotti('Mattoni')" class="bg-orange-600 text-white p-8 rounded-3xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform">
                <i data-lucide="brick-wall"></i> <span class="text-xl font-bold uppercase">Mattoni</span>
            </button>
            <button onclick="renderProdotti('Pietre')" class="bg-stone-500 text-white p-8 rounded-3xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform">
                <i data-lucide="mountain"></i> <span class="text-xl font-bold uppercase">Pietra</span>
            </button>
            <button onclick="renderProdotti('Legno')" class="bg-amber-800 text-white p-8 rounded-3xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform">
                <i data-lucide="tree-deciduous"></i> <span class="text-xl font-bold uppercase">Legno</span>
            </button>
        </div>
    `;
    lucide.createIcons();
}

async function renderProdotti(cat) {
    const prodotti = await db.prodotti.where('macrocategoria').equals(cat).toArray();
    const content = document.getElementById('content');
    document.getElementById('back-btn').classList.remove('hidden');
    document.getElementById('back-btn').onclick = renderCategorie;

    content.innerHTML = `
        <h2 class="text-2xl font-black mb-6 text-slate-800">${cat}</h2>
        <div class="space-y-3 pb-20">
            ${prodotti.map(p => `
                <div onclick='apriCalcolatore(${JSON.stringify(p)})' class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center active:bg-slate-50">
                    <div>
                        <p class="font-bold text-slate-800">${p.nome}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase">${p.gamma}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-blue-600 font-black">€${p.prezzo_unita}</p>
                        <p class="text-[9px] text-slate-400">Pz/Bancale: ${p.pz_bancale}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    lucide.createIcons();
}

function apriCalcolatore(p) {
    const modal = document.getElementById('modal');
    const mContent = document.getElementById('modal-content');
    modal.classList.remove('hidden');
    
    mContent.innerHTML = `
        <h3 class="text-xl font-black mb-1">${p.nome}</h3>
        <p class="text-xs text-slate-400 uppercase mb-4">${p.gamma} - €${p.prezzo_unita}/pz</p>
        
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-bold text-slate-600 mb-1">Inserisci MQ da coprire:</label>
                <input type="number" id="input-mq" placeholder="Esempio: 25" class="w-full border-2 border-slate-100 rounded-xl p-4 text-xl font-bold focus:border-blue-500 outline-none">
            </div>
            
            <div id="risultato" class="bg-slate-50 p-4 rounded-2xl hidden space-y-2">
                <div class="flex justify-between text-sm"><span>Pezzi necessari:</span> <span id="res-pz" class="font-bold"></span></div>
                <div class="flex justify-between text-sm"><span>Bancali:</span> <span id="res-ban" class="font-bold"></span></div>
                <div class="flex justify-between text-sm"><span>Peso stimato:</span> <span id="res-kg" class="font-bold"></span></div>
                <div class="pt-2 border-t mt-2 flex justify-between text-lg font-black text-blue-600">
                    <span>TOTALE:</span> <span id="res-tot"></span>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="chiudiModale()" class="flex-1 py-4 font-bold text-slate-400">Annulla</button>
                <button onclick='eseguiCalcolo(${JSON.stringify(p)})' class="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">Calcola</button>
            </div>
        </div>
    `;
}

function eseguiCalcolo(p) {
    const mq = parseFloat(document.getElementById('input-mq').value);
    if (!mq) return;

    let pzNecessari = Math.ceil(mq * (p.pz_mq || 1));
    
    // Logica Sfuso
    if (p.sfuso === 'no' && p.pz_bancale > 0) {
        const numBancali = Math.ceil(pzNecessari / p.pz_bancale);
        pzNecessari = numBancali * p.pz_bancale;
    }

    const numBancali = (pzNecessari / p.pz_bancale).toFixed(1);
    const peso = (pzNecessari / p.pz_bancale * p.kg_bancale).toFixed(0);
    const totale = (pzNecessari * p.prezzo_unita).toFixed(2);

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-pz').innerText = pzNecessari;
    document.getElementById('res-ban').innerText = numBancali;
    document.getElementById('res-kg').innerText = peso + " kg";
    document.getElementById('res-tot').innerText = "€ " + totale;
}

// --- UTILITY ---
function cambiaTitolo(t) { document.getElementById('sub-title').innerText = t; }
function chiudiModale() { document.getElementById('modal').classList.add('hidden'); }

init();
