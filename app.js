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
    document.getElementById('page-title').innerText = "Catalogo";
    document.getElementById('back-btn').classList.add('hidden');
    
    c.innerHTML = `
        <div class="ios-group">
            ${Object.keys(ESTR).map(key => `
                <div onclick="renderGamme('${key}')" class="ios-row cursor-pointer active:bg-gray-100 transition-colors">
                    <div class="${ESTR[key].color} w-7 h-7 rounded-md text-white flex items-center justify-center mr-3">
                        <i data-lucide="${ESTR[key].icon}" class="w-4 h-4"></i>
                    </div>
                    <span class="ios-label font-medium">${key}</span>
                    <i data-lucide="chevron-right" class="text-[#C6C6C8] w-5 h-5"></i>
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
        <div class="ios-group">
            ${ESTR[cat].gamme.map(g => `
                <div onclick="renderCalcolo('${cat}', '${g}')" class="ios-row cursor-pointer active:bg-gray-100 transition-colors">
                    <span class="ios-label">${g}</span>
                    <i data-lucide="chevron-right" class="text-[#C6C6C8] w-5 h-5"></i>
                </div>
            `).join('')}
        </div>`;
    lucide.createIcons();
}

// --- PAGINA CALCOLO (CON TUTTE LE FUNZIONI RIPRISTINATE) ---
async function renderCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = "Calcolo";
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-12 text-center text-gray-400">Listino vuoto.<br><span class="text-xs">Usa la scheda Listini per caricare il CSV</span></div>`;
        return;
    }

    c.innerHTML = `
        <div class="ios-group">
            <div class="ios-row">
                <span class="ios-label">Prodotto</span>
                <select id="select-prod">${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}</select>
            </div>
            ${gamma === 'Fortis' ? `
            <div class="ios-row">
                <span class="ios-label">Posa</span>
                <select id="tipo-posa"><option value="piatto">Di Piatto</option><option value="coltello">Di Coltello</option></select>
            </div>` : ''}
            ${gamma === 'Posa incerta' ? `
            <div class="ios-row">
                <span class="ios-label">Finitura</span>
                <select id="finitura-pietra" onchange="document.getElementById('row-sfrido').classList.toggle('hidden', this.value !== 'secco')">
                    <option value="fugata">Fugata</option><option value="secco">A Secco</option>
                </select>
            </div>
            <div id="row-sfrido" class="ios-row hidden">
                <span class="ios-label text-orange-500 font-medium">Sfrido %</span>
                <input type="number" id="perc-sfrido" value="15">
            </div>` : ''}
        </div>

        <div class="ios-group">
            <div class="ios-row">
                <span class="ios-label">Quantità</span>
                <input type="number" id="q-main" placeholder="Inserisci">
            </div>
            <div class="ios-row">
                <span class="ios-label">Unità</span>
                <select id="u-type">
                    <option value="mq">MQ</option>
                    <option value="pz">Pezzi</option>
                </select>
            </div>
            <div class="ios-row">
                <span class="ios-label text-gray-400">Extra (Pz/Mq)</span>
                <input type="number" id="q-extra" value="0">
            </div>
        </div>

        <div class="ios-group">
            <div class="ios-row">
                <span class="ios-label text-blue-500">Sconto Extra %</span>
                <input type="number" id="d-extra" value="0">
            </div>
            <div class="ios-row">
                <span class="ios-label">Trasporto (€)</span>
                <input type="number" id="cost-trans" value="0">
            </div>
            <div class="ios-row">
                <span class="ios-label">IVA / Cliente</span>
                <select id="c-type">
                    <option value="azienda">Azienda (Escl.)</option>
                    <option value="privato">Privato (22%)</option>
                </select>
            </div>
        </div>

        <button onclick="calcola()" class="btn-primary">Calcola Totale</button>

        <div id="risultato" class="hidden mt-8 px-4">
            <div class="ios-group !mx-0">
                <div class="ios-row"><span class="ios-label opacity-50">Sconto Applicato</span><span id="res-sconto" class="font-semibold"></span></div>
                <div class="ios-row"><span class="ios-label opacity-50">Quantità Venduta</span><span id="res-qty" class="font-semibold text-blue-600"></span></div>
                <div class="ios-row"><span class="ios-label opacity-50">Vincolo Logistico</span><span id="res-vincolo" class="italic text-gray-400"></span></div>
            </div>
            <div class="text-center py-4">
                <span class="text-xs uppercase font-bold tracking-widest text-gray-400">Prezzo Finale</span>
                <div id="res-prezzo" class="text-5xl font-extrabold tracking-tighter mt-1"></div>
            </div>
        </div>`;
    lucide.createIcons();
}

// --- LOGICA DI CALCOLO RIPRISTINATA ---
function calcola() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    let qBase = parseFloat(document.getElementById('q-main').value) || 0;
    const qExtra = parseFloat(document.getElementById('q-extra').value) || 0;
    const unit = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    // Sfrido Pietra
    if (p.range === "Posa incerta" && document.getElementById('finitura-pietra')?.value === 'secco') {
        const perc = parseFloat(document.getElementById('perc-sfrido').value) || 15;
        qBase = qBase * (1 + perc / 100);
    }

    let qtyVenduta = qBase + qExtra;
    let vincolo = "Vendita Libera";
    let baseDisc = 45;
    let label = (p.category === "Mattoni") ? " pz" : " m²";

    // 1. LEGNO
    if (p.category === "Legno") {
        if (p.range === "Rivestimenti") {
            qtyVenduta = (qBase + qExtra) * (146/136);
            label = " m² Nom.";
            vincolo = "Sup. Nominale";
        }
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
    } 
    // 2. MATTONI
    else if (p.category === "Mattoni") {
        let pzMq = p.pz_mq;
        if (p.range === "Fortis") pzMq = document.getElementById('tipo-posa').value === 'coltello' ? p.pz_mq_coltello : p.pz_mq_piatto;
        
        let pzRichiesti = (unit === 'mq') ? Math.ceil(qtyVenduta * pzMq) : qtyVenduta;
        
        if (p.range === "Genesis") {
            qtyVenduta = (p.sfuso === 'no') ? Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale : Math.ceil(pzRichiesti / p.pz_scatola) * p.pz_scatola;
            vincolo = (p.sfuso === 'no') ? "Bancale Intero" : "Scatola Intera";
        } else if (["Croma", "Fortis", "Cotto"].includes(p.range)) {
            qtyVenduta = Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale;
            vincolo = "Bancale Intero";
        } else {
            qtyVenduta = pzRichiesti;
        }
        label = " pz";
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
    } 
    // 3. PIETRA ALTRA
    else {
        if (p.range === "Pannelli preassemblati") {
            qtyVenduta = Math.ceil(qtyVenduta / (p.m2_scatola || 1)) * (p.m2_scatola || 1);
            vincolo = "Scatola Intera";
        } else if (p.range === "Pavimenti" && p.sfuso === 'no') {
            qtyVenduta = Math.ceil(qtyVenduta / (p.m2_bancale || 1)) * (p.m2_bancale || 1);
            vincolo = "Bancale Intero";
        }
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

// --- SEZIONE LISTINI (RIPRISTINATA COMPLETA) ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('page-title').innerText = "Listini";
    document.getElementById('back-btn').classList.add('hidden');
    
    let h = "";
    for (const [cat, info] of Object.entries(ESTR)) {
        h += `<h3 class="ml-4 mb-2 mt-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">${cat}</h3>
        <div class="ios-group">
            ${info.gamme.map(g => `
                <div class="ios-row">
                    <span class="ios-label">${g}</span>
                    <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                    <label for="f-${cat}-${g}" class="text-blue-600 font-bold text-xs cursor-pointer active:opacity-50">CARICA CSV</label>
                </div>
            `).join('')}
        </div>`;
    }
    c.innerHTML = h;
    lucide.createIcons();
}

// --- FUNZIONE IMPORTA (CONGELATA) ---
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
        alert(`Listino ${gamma} aggiornato con successo!`);
    };
    reader.readAsText(file);
}

init();
