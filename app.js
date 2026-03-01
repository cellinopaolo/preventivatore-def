const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

const STRUTTURA = {
    "Mattoni": { icon: "brick-wall", color: "bg-[#FF9500]" },
    "Pietra": { icon: "mountain", color: "bg-[#8E8E93]" },
    "Legno": { icon: "tree-deciduous", color: "bg-[#A2845E]" }
};

const GAMME = {
    "Mattoni": ["Genesis", "Futura", "Croma", "Fortis", "Cotto"],
    "Pietra": ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"],
    "Legno": ["Rivestimenti", "Pavimenti"]
};

function init() { renderCategorie(); lucide.createIcons(); }

// --- RENDER CATEGORIE ---
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = "Catalogo";
    document.getElementById('back-btn').classList.add('hidden');
    
    c.innerHTML = `
        <div class="ios-group overflow-hidden">
            ${Object.keys(STRUTTURA).map(key => `
                <div onclick="renderGamme('${key}')" class="ios-row cursor-pointer active:bg-slate-100">
                    <div class="${STRUTTURA[key].color} p-2 rounded-lg text-white mr-4">
                        <i data-lucide="${STRUTTURA[key].icon}" class="w-5 h-5"></i>
                    </div>
                    <span class="flex-1 font-semibold">${key}</span>
                    <i data-lucide="chevron-right" class="text-slate-300 w-5 h-5"></i>
                </div>
            `).join('')}
        </div>
    `;
    lucide.createIcons();
}

// --- RENDER GAMME ---
function renderGamme(cat) {
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = cat;
    const back = document.getElementById('back-btn');
    back.classList.remove('hidden');
    back.onclick = renderCategorie;

    c.innerHTML = `
        <div class="ios-group overflow-hidden">
            ${GAMME[cat].map(g => `
                <div onclick="renderCalcolo('${cat}', '${g}')" class="ios-row cursor-pointer active:bg-slate-100">
                    <span class="flex-1 font-medium">${g}</span>
                    <i data-lucide="chevron-right" class="text-slate-300 w-5 h-5"></i>
                </div>
            `).join('')}
        </div>
    `;
    lucide.createIcons();
}

// --- RENDER CALCOLO (L'INTERFACCIA CHE VOLEVI ABBELLIRE) ---
async function renderCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = gamma;
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<p class="text-center p-10 opacity-50">Listino vuoto.</p>`;
        return;
    }

    c.innerHTML = `
        <div class="ios-group">
            <div class="ios-row">
                <span class="ios-label">Modello</span>
                <select id="select-prod">
                    ${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}
                </select>
            </div>
            ${gamma === 'Fortis' ? `
                <div class="ios-row">
                    <span class="ios-label">Posa</span>
                    <select id="tipo-posa"><option value="piatto">Piatto</option><option value="coltello">Coltello</option></select>
                </div>` : ''}
        </div>

        <div class="ios-group">
            <div class="ios-row">
                <span class="ios-label">Quantità</span>
                <input type="number" id="q-main" placeholder="0">
            </div>
            <div class="ios-row">
                <span class="ios-label">Unità</span>
                <select id="u-type">
                    <option value="mq">MQ</option>
                    <option value="pz">Pezzi</option>
                </select>
            </div>
        </div>

        <div class="ios-group">
            <div class="ios-row">
                <span class="ios-label">Sconto Extra %</span>
                <input type="number" id="d-extra" placeholder="0">
            </div>
            <div class="ios-row">
                <span class="ios-label">Trasporto €</span>
                <input type="number" id="cost-trans" placeholder="0">
            </div>
            <div class="ios-row">
                <span class="ios-label">IVA</span>
                <select id="c-type">
                    <option value="azienda">Esclusa (Azienda)</option>
                    <option value="privato">Inclusa 22% (Privato)</option>
                </select>
            </div>
        </div>

        <button onclick="calcola()" class="btn-primary">Calcola Totale</button>

        <div id="risultato" class="hidden mt-8">
            <h3 class="ml-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Riepilogo Preventivo</h3>
            <div class="ios-group">
                <div class="ios-row">
                    <span class="ios-label">Sconto Applicato</span>
                    <span id="res-sconto" class="flex-1 text-right font-semibold text-slate-900"></span>
                </div>
                <div class="ios-row">
                    <span class="ios-label">Quantità Finale</span>
                    <span id="res-qty" class="flex-1 text-right font-semibold text-slate-900"></span>
                </div>
                <div class="ios-row">
                    <span class="ios-label">Logica</span>
                    <span id="res-vincolo" class="flex-1 text-right text-blue-500 font-medium italic"></span>
                </div>
            </div>
            
            <div class="ios-group p-6 text-center">
                <span class="block text-slate-400 text-xs uppercase font-bold mb-1">Totale da Fatturare</span>
                <span id="res-prezzo" class="text-4xl font-black tracking-tighter text-slate-900"></span>
            </div>
        </div>
    `;
    lucide.createIcons();
}

// --- LOGICA DI CALCOLO INTEGRALE (CONGELATA) ---
function calcola() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    const mqInput = parseFloat(document.getElementById('q-main').value) || 0;
    const unit = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    let qtyVenduta = mqInput;
    let vincolo = "Vendita Libera";
    let baseDisc = 45;
    let unitLabel = (p.category === "Mattoni") ? "pz" : "m²";

    // --- LOGICA RIVESTIMENTI LEGNO ---
    if (p.category === "Legno" && p.range === "Rivestimenti") {
        qtyVenduta = mqInput * (146/136);
        vincolo = "Conv. Nominale";
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
        unitLabel = "m² Nom.";
    } 
    // --- LOGICA PAVIMENTI LEGNO ---
    else if (p.category === "Legno") {
        baseDisc = mqInput >= 15 ? 50 : 45;
    }
    // --- LOGICA MATTONI ---
    else if (p.category === "Mattoni") {
        let pzMq = p.pz_mq;
        if (p.range === "Fortis") pzMq = document.getElementById('tipo-posa').value === 'coltello' ? p.pz_mq_coltello : p.pz_mq_piatto;
        qtyVenduta = unit === 'mq' ? Math.ceil(mqInput * pzMq) : mqInput;
        
        if (p.range === "Genesis") {
            qtyVenduta = (p.sfuso === 'no') ? Math.ceil(qtyVenduta / p.pz_bancale) * p.pz_bancale : Math.ceil(qtyVenduta / p.pz_scatola) * p.pz_scatola;
            vincolo = p.sfuso === 'no' ? "Bancale" : "Scatola";
        } else if (["Croma", "Fortis", "Cotto"].includes(p.range)) {
            qtyVenduta = Math.ceil(qtyVenduta / p.pz_bancale) * p.pz_bancale;
            vincolo = "Bancale Intero";
        }
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
    }

    const priceScontato = p.price * (1 - baseDisc/100) * (1 - extraDisc/100);
    const subtotale = (qtyVenduta * priceScontato) + transport;
    const finale = isPrivato ? subtotale * 1.22 : subtotale;

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-sconto').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-qty').innerText = `${qtyVenduta.toFixed(2)} ${unitLabel}`;
    document.getElementById('res-vincolo').innerText = vincolo;
    document.getElementById('res-prezzo').innerText = `€ ${finale.toLocaleString('it-IT', {minimumFractionDigits: 2})}`;
}

// --- GESTIONALE ---
function renderGestionale() {
    // ... stessa logica per caricare i CSV ...
    document.getElementById('page-title').innerText = "Impostazioni";
    document.getElementById('content').innerHTML = `<div class="p-10 text-center opacity-30 italic">Sezione Listini (carica i file CSV qui)</div>`;
}

init();
