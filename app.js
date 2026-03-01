const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

const ESTR = {
    "Mattoni": { icon: "brick-wall", color: "bg-[#FF9500]", gamme: ["Genesis", "Futura", "Croma", "Fortis", "Cotto"] },
    "Pietra": { icon: "mountain", color: "bg-[#8E8E93]", gamme: ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"] },
    "Legno": { icon: "tree-deciduous", color: "bg-[#A2845E]", gamme: ["Rivestimenti", "Pavimenti"] }
};

function init() { renderCategorie(); lucide.createIcons(); }

// --- NAVIGAZIONE ---
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = "Preventivi B&B";
    document.getElementById('back-btn').classList.add('hidden');
    
    // Layout pulsanti ingranditi
    c.innerHTML = `
        <div class="space-y-4 px-4 mt-6">
            ${Object.keys(ESTR).map(key => `
                <div onclick="renderGamme('${key}')" class="bg-white rounded-[20px] p-6 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer border border-gray-100">
                    <div class="flex items-center gap-5">
                        <div class="${ESTR[key].color} w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-md">
                            <i data-lucide="${ESTR[key].icon}" class="w-8 h-8"></i>
                        </div>
                        <span class="text-xl font-bold tracking-tight text-gray-800">${key}</span>
                    </div>
                    <i data-lucide="chevron-right" class="text-gray-300 w-6 h-6"></i>
                </div>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

function renderGamme(cat) {
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = cat;
    const back = document.getElementById('back-btn');
    back.classList.remove('hidden');
    back.onclick = renderCategorie;

    c.innerHTML = `
        <div class="ios-group mt-6">
            ${ESTR[cat].gamme.map(g => `
                <div onclick="renderCalcolo('${cat}', '${g}')" class="ios-row cursor-pointer active:bg-gray-100 transition-colors">
                    <span class="ios-label font-medium">${g}</span>
                    <i data-lucide="chevron-right" class="text-[#C6C6C8] w-5 h-5"></i>
                </div>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

// --- PAGINA CALCOLO ---
async function renderCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = "Calcolo";
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-12 text-center text-gray-400">Nessun listino trovato per ${gamma}.</div>`;
        return;
    }

    c.innerHTML = `
        <div class="ios-group mt-4">
            <div class="ios-row">
                <span class="ios-label">Modello</span>
                <select id="select-prod" class="text-blue-600 font-medium">${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}</select>
            </div>
            ${gamma === 'Fortis' ? `<div class="ios-row"><span class="ios-label">Posa</span><select id="tipo-posa"><option value="piatto">Piatto</option><option value="coltello">Coltello</option></select></div>` : ''}
            ${gamma === 'Posa incerta' ? `
            <div class="ios-row"><span class="ios-label">Finitura</span><select id="finitura-pietra" onchange="document.getElementById('row-sfrido').classList.toggle('hidden', this.value !== 'secco')"><option value="fugata">Fugata</option><option value="secco">A Secco</option></select></div>
            <div id="row-sfrido" class="ios-row hidden"><span class="ios-label text-orange-500 font-bold">Sfrido %</span><input type="number" id="perc-sfrido" value="15" class="font-bold"></div>` : ''}
        </div>

        <div class="ios-group">
            <div class="ios-row"><span class="ios-label font-semibold">Quantità</span><input type="number" id="q-main" placeholder="MQ/PZ" class="font-bold text-black"></div>
            <div class="ios-row"><span class="ios-label">Unità</span><select id="u-type"><option value="mq">MQ</option><option value="pz">Pezzi</option></select></div>
            <div class="ios-row"><span class="ios-label text-gray-400">Extra</span><input type="number" id="q-extra" value="0"></div>
        </div>

        <div class="ios-group">
            <div class="ios-row"><span class="ios-label text-blue-500 font-bold">Sconto Extra %</span><input type="number" id="d-extra" value="0"></div>
            <div class="ios-row"><span class="ios-label">Trasporto €</span><input type="number" id="cost-trans" value="0"></div>
            <div class="ios-row"><span class="ios-label">Cliente</span><select id="c-type"><option value="azienda">Azienda (Iva Escl.)</option><option value="privato">Privato (Iva Incl. 22%)</option></select></div>
        </div>

        <button onclick="calcola()" class="btn-primary mt-4">Calcola Totale</button>

        <div id="risultato" class="hidden mt-8 mb-12">
            <div class="ios-group !mx-4">
                <div class="ios-row"><span class="ios-label opacity-50 text-xs uppercase">Sconto</span><span id="res-sconto" class="font-bold"></span></div>
                <div class="ios-row"><span class="ios-label opacity-50 text-xs uppercase">Venduto</span><span id="res-qty" class="font-bold text-blue-600"></span></div>
                <div class="ios-row"><span class="ios-label opacity-50 text-xs uppercase">Note</span><span id="res-vincolo" class="italic text-gray-500 text-sm"></span></div>
            </div>
            <div class="text-center p-8 bg-white rounded-3xl mx-4 shadow-sm border border-gray-100">
                <span class="text-xs uppercase font-black text-gray-300 tracking-[0.2em]">Totale Preventivo</span>
                <div id="res-prezzo" class="text-5xl font-black text-gray-900 mt-2 tracking-tighter"></div>
            </div>
        </div>`;
    lucide.createIcons();
}

// --- LOGICA DI CALCOLO INTEGRALE ---
function calcola() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    let qBase = parseFloat(document.getElementById('q-main').value) || 0;
    const qExtra = parseFloat(document.getElementById('q-extra').value) || 0;
    const unit = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    if (p.range === "Posa incerta" && document.getElementById('finitura-pietra')?.value === 'secco') {
        const perc = parseFloat(document.getElementById('perc-sfrido').value) || 15;
        qBase = qBase * (1 + perc / 100);
    }

    let qtyVenduta = qBase + qExtra;
    let vincolo = "Nessun vincolo";
    let baseDisc = 45;
    let label = (p.category === "Mattoni") ? " pz" : " m²";

    if (p.category === "Legno") {
        if (p.range === "Rivestimenti") { qtyVenduta = (qBase + qExtra) * (146/136); label = " m² Nom."; vincolo = "Arrot. Superficie Nominale"; }
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
    } else if (p.category === "Mattoni") {
        let pzMq = p.pz_mq;
        if (p.range === "Fortis") pzMq = document.getElementById('tipo-posa').value === 'coltello' ? p.pz_mq_coltello : p.pz_mq_piatto;
        let pzRichiesti = (unit === 'mq') ? Math.ceil(qtyVenduta * pzMq) : qtyVenduta;
        
        if (p.range === "Genesis") {
            qtyVenduta = (p.sfuso === 'no') ? Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale : Math.ceil(pzRichiesti / p.pz_scatola) * p.pz_scatola;
            vincolo = (p.sfuso === 'no') ? "Arrot. Bancale" : "Arrot. Scatola";
        } else if (["Croma", "Fortis", "Cotto"].includes(p.range)) {
            qtyVenduta = Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale;
            vincolo = "Arrot. Bancale Intero";
        } else { qtyVenduta = pzRichiesti; }
        label = " pz";
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
    } else {
        if (p.range === "Pannelli preassemblati") { qtyVenduta = Math.ceil(qtyVenduta / (p.m2_scatola || 1)) * (p.m2_scatola || 1); vincolo = "Arrot. Scatola"; }
        else if (p.range === "Pavimenti" && p.sfuso === 'no') { qtyVenduta = Math.ceil(qtyVenduta / (p.m2_bancale || 1)) * (p.m2_bancale || 1); vincolo = "Arrot. Bancale"; }
        baseDisc = qtyVenduta >= (p.m2_bancale || 999) ? 50 : 45;
    }

    const priceScontato = p.price * (1 - baseDisc/100) * (1 - extraDisc/100);
    const totImponibile = (qtyVenduta * priceScontato) + transport;
    const finale = isPrivato ? totImponibile * 1.22 : totImponibile;

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-sconto').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-qty').innerText = qtyVenduta.toFixed(2) + label;
    document.getElementById('res-vincolo').innerText = vincolo;
    document.getElementById('res-prezzo').innerText = `€ ${finale.toLocaleString('it-IT', {minimumFractionDigits: 2})}`;
}

// --- SEZIONE LISTINI ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = "Gestione Listini";
    document.getElementById('back-btn').classList.add('hidden');
    
    let h = "";
    for (const [cat, info] of Object.entries(ESTR)) {
        h += `<h3 class="ml-6 mb-2 mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest">${cat}</h3>
        <div class="ios-group !mb-2">
            ${info.gamme.map(g => `
                <div class="ios-row">
                    <span class="ios-label text-sm font-semibold text-gray-700">${g}</span>
                    <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                    <label for="f-${cat}-${g}" class="text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-full active:opacity-50 cursor-pointer">CARICA CSV</label>
                </div>`).join('')}
        </div>`;
    }
    c.innerHTML = h;
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
            n: header.indexOf("nome"), p: header.findIndex(h => h.includes("prezzo")),
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
        alert(`Aggiornato: ${gamma}`);
    };
    reader.readAsText(file);
}

init();
