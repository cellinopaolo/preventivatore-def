const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, macrocategoria, gamma, nome" });

async function init() {
    renderCategorie();
    lucide.createIcons();
}

async function renderGestionale() {
    const prodotti = await db.prodotti.toArray();
    const content = document.getElementById('content');
    document.getElementById('sub-title').innerText = "Gestione Listini";
    document.getElementById('back-btn').classList.add('hidden');
    
    content.innerHTML = `
        <div class="bg-blue-600 text-white p-6 rounded-3xl mb-6 shadow-lg">
            <h3 class="font-bold mb-2 tracking-tight">Importa Listino .CSV</h3>
            <input type="file" accept=".csv" onchange="importaCSV(event)" class="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700">
            <p class="text-[9px] mt-4 opacity-70 leading-tight">Ordine colonne: Categoria, Gamma, Nome, Prezzo, Pz_Bancale, Sfuso(si/no), Kg_Bancale, Pz_MQ</p>
        </div>
        <div class="space-y-3 pb-24">
            ${prodotti.map(p => `
                <div class="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center">
                    <div>
                        <p class="font-bold text-sm text-slate-800">${p.nome}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase">${p.gamma}</p>
                    </div>
                    <div class="text-right">
                        <input type="number" step="0.01" value="${p.prezzo_unita}" onchange="updatePrezzo(${p.id}, this.value)" class="w-20 border rounded px-2 py-1 text-xs font-bold text-blue-600">
                    </div>
                </div>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

async function importaCSV(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
        const righe = e.target.result.split("\n");
        const data = righe.filter(r => r.trim()).map(r => {
            const c = r.split(",");
            return {
                macrocategoria: c[0].trim(), gamma: c[1].trim(), nome: c[2].trim(),
                prezzo_unita: parseFloat(c[3]), pz_bancale: parseInt(c[4]),
                sfuso: c[5].trim().toLowerCase(), kg_bancale: parseFloat(c[6] || 0),
                pz_mq: parseFloat(c[7] || 0)
            };
        });
        await db.prodotti.bulkAdd(data);
        alert("Listino aggiunto al database!");
        renderGestionale();
    };
    reader.readAsText(file);
}

async function updatePrezzo(id, valore) {
    await db.prodotti.update(id, { prezzo_unita: parseFloat(valore) });
}

function renderCategorie() {
    document.getElementById('sub-title').innerText = "Catalogo";
    const content = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    content.innerHTML = `
        <div class="grid gap-4">
            <button onclick="renderProdotti('Mattoni')" class="bg-orange-600 text-white p-8 rounded-3xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform font-bold text-xl uppercase italic tracking-tighter"><i data-lucide="brick-wall"></i> Mattoni</button>
            <button onclick="renderProdotti('Pietre')" class="bg-stone-500 text-white p-8 rounded-3xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform font-bold text-xl uppercase italic tracking-tighter"><i data-lucide="mountain"></i> Pietra</button>
            <button onclick="renderProdotti('Legno')" class="bg-amber-800 text-white p-8 rounded-3xl shadow-lg flex items-center gap-4 active:scale-95 transition-transform font-bold text-xl uppercase italic tracking-tighter"><i data-lucide="tree-deciduous"></i> Legno</button>
        </div>`;
    lucide.createIcons();
}

async function renderProdotti(cat) {
    const prodotti = await db.prodotti.where('macrocategoria').equals(cat).toArray();
    const content = document.getElementById('content');
    document.getElementById('back-btn').classList.remove('hidden');
    document.getElementById('back-btn').onclick = renderCategorie;
    content.innerHTML = `
        <h2 class="text-2xl font-black mb-6 text-slate-800 tracking-tight">${cat.toUpperCase()}</h2>
        <div class="space-y-3 pb-24">
            ${prodotti.map(p => `
                <div onclick='apriCalcolatore(${JSON.stringify(p)})' class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center active:bg-slate-50">
                    <div>
                        <p class="font-bold text-slate-800">${p.nome}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase">${p.gamma}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-blue-600 font-black">€${p.prezzo_unita}</p>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

function apriCalcolatore(p) {
    const modal = document.getElementById('modal');
    modal.classList.remove('hidden');
    document.getElementById('modal-content').innerHTML = `
        <h3 class="text-xl font-black mb-4">${p.nome}</h3>
        <input type="number" id="mq" placeholder="Inserisci MQ" class="w-full border-2 border-slate-100 rounded-xl p-4 text-xl font-bold mb-4 focus:border-blue-600 outline-none">
        <div id="res" class="hidden bg-slate-50 p-4 rounded-2xl mb-4 space-y-2 text-sm">
            <div class="flex justify-between"><span>Pezzi:</span> <span id="rp" class="font-bold"></span></div>
            <div class="flex justify-between"><span>Bancali:</span> <span id="rb" class="font-bold"></span></div>
            <div class="flex justify-between border-t pt-2 text-blue-600 font-black"><span>TOTALE:</span> <span id="rt"></span></div>
        </div>
        <div class="flex gap-2">
            <button onclick="document.getElementById('modal').classList.add('hidden')" class="flex-1 py-4 font-bold text-slate-400 uppercase text-xs tracking-widest">Chiudi</button>
            <button onclick='calcola(${JSON.stringify(p)})' class="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest">Calcola</button>
        </div>`;
}

function calcola(p) {
    const mq = parseFloat(document.getElementById('mq').value);
    let pz = Math.ceil(mq * p.pz_mq);
    if (p.sfuso === 'no' && p.pz_bancale > 0) {
        pz = Math.ceil(pz / p.pz_bancale) * p.pz_bancale;
    }
    document.getElementById('res').classList.remove('hidden');
    document.getElementById('rp').innerText = pz;
    document.getElementById('rb').innerText = (pz / p.pz_bancale).toFixed(1);
    document.getElementById('rt').innerText = "€ " + (pz * p.prezzo_unita).toFixed(2);
}

init();
