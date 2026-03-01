// --- DATABASE & STRUTTURA ---
const db = new Dexie("PreventiviDB");
db.version(1).stores({ prodotti: "++id, category, range, name" });

const STRUTTURA = {
    "Mattoni": { gamme: ["Genesis", "Futura", "Croma", "Fortis", "Cotto"], colore: "bg-[#FF9500]", icona: "brick-wall" },
    "Pietra": { gamme: ["Posa incerta", "Pannelli preassemblati", "Taglio rettangolare", "Pavimenti", "Tetti"], colore: "bg-[#8E8E93]", icona: "mountain" },
    "Legno": { gamme: ["Rivestimenti", "Pavimenti"], colore: "bg-[#A2845E]", icona: "tree-deciduous" }
};

async function init() { 
    renderCategorie(); 
    lucide.createIcons(); 
}

// --- NAVIGAZIONE STILE APPLE ---
function renderCategorie() {
    const c = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('nav-title').innerText = "Libreria";
    
    c.innerHTML = `
        <h1 class="text-4xl font-extrabold mb-8 tracking-tight">Catalogo</h1>
        <div class="space-y-4">
            ${Object.keys(STRUTTURA).map(key => `
                <div onclick="renderGamme('${key}')" class="ios-card p-5 flex items-center justify-between ios-press cursor-pointer">
                    <div class="flex items-center gap-4">
                        <div class="${STRUTTURA[key].colore} w-14 h-14 rounded-[1.2rem] flex items-center justify-center text-white shadow-md">
                            <i data-lucide="${STRUTTURA[key].icona}" class="w-7 h-7"></i>
                        </div>
                        <span class="text-[19px] font-semibold tracking-tight">${key}</span>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-[#C4C4C6]"></i>
                </div>`).join('')}
        </div>`;
    lucide.createIcons();
}

function renderGamme(cat) {
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden'); b.onclick = renderCategorie;
    document.getElementById('nav-title').innerText = cat;

    c.innerHTML = `
        <h1 class="text-3xl font-bold mb-8 tracking-tight">Gamme</h1>
        <div class="ios-card overflow-hidden">
            ${STRUTTURA[cat].gamme.map((g, i) => `
                <div onclick="renderInterfacciaCalcolo('${cat}', '${g}')" class="p-5 flex justify-between items-center ios-press cursor-pointer ${i !== 0 ? 'border-t border-[#F2F2F7]' : ''}">
                    <span class="text-[17px] font-medium text-[#1C1C1E]">${g}</span>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-[#C4C4C6]"></i>
                </div>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- INTERFACCIA CALCOLO AVANZATA ---
async function renderInterfacciaCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);
    document.getElementById('nav-title').innerText = gamma;

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-20 text-center text-slate-400 font-medium">Nessun listino caricato.</div>`;
        return;
    }

    let htmlSpecial = "";
    if (gamma === "Fortis") {
        htmlSpecial = `<div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Tipo di Posa</label><select id="tipo-posa" class="w-full"><option value="piatto">Di Piatto</option><option value="coltello">Di Coltello</option></select></div>`;
    } else if (gamma === "Posa incerta") {
        htmlSpecial = `<div class="grid grid-cols-2 gap-4"><div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Finitura</label><select id="finitura-pietra" onchange="toggleSfrido(this.value)" class="w-full"><option value="fugata">Fugata</option><option value="secco">A Secco</option></select></div><div id="box-sfrido" class="space-y-2 hidden"><label class="text-[11px] font-bold uppercase text-[#FF9500] ml-1">+ % Sfrido</label><input type="number" id="perc-sfrido" value="15"></div></div>`;
    }

    c.innerHTML = `
        <h1 class="text-3xl font-bold mb-6 tracking-tight">${gamma}</h1>
        <div class="ios-card p-6 space-y-6">
            <div class="space-y-2">
                <label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Modello</label>
                <select id="select-prod" class="w-full">${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}</select>
            </div>

            ${htmlSpecial}

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Quantità</label><input type="number" id="q-main" value="0"></div>
                <div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Unità</label><select id="u-type" class="w-full"><option value="mq">MQ</option><option value="pz">PEZZI</option></select></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Extra Quantità</label><input type="number" id="q-extra" value="0"></div>
                <div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#FF9500] ml-1">Sconto Extra %</label><input type="number" id="d-extra" value="0"></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">Trasporto €</label><input type="number" id="cost-trans" value="0"></div>
                <div class="space-y-2"><label class="text-[11px] font-bold uppercase text-[#8E8E93] ml-1">IVA</label><select id="c-type" class="w-full"><option value="azienda">Azienda (Escl.)</option><option value="privato">Privato (22%)</option></select></div>
            </div>

            <button onclick="eseguiCalcoloCommerciale()" class="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-[17px] ios-press mt-4">Calcola Totale</button>

            <div id="risultato" class="hidden mt-8 pt-6 border-t border-[#F2F2F7] space-y-3">
                <div class="flex justify-between text-sm"><span class="text-[#8E8E93] font-medium uppercase text-[10px]">Sconto Base</span> <span id="res-sconto-base" class="font-bold"></span></div>
                <div class="flex justify-between text-sm"><span class="text-[#8E8E93] font-medium uppercase text-[10px]">Qtà Venduta</span> <span id="res-pz" class="font-bold"></span></div>
                <div class="flex justify-between text-sm"><span class="text-[#007AFF] font-medium uppercase text-[10px]">Vincolo Logistico</span> <span id="res-vincolo" class="font-bold text-[#007AFF]"></span></div>
                <div class="bg-[#F2F2F7] p-5 rounded-[1.5rem] flex justify-between items-center mt-6 shadow-inner">
                    <span class="text-lg font-bold">Prezzo Finale</span>
                    <span id="res-p" class="text-2xl font-black text-[#007AFF]"></span>
                </div>
            </div>
        </div>`;
    lucide.createIcons();
}

function toggleSfrido(val) { document.getElementById('box-sfrido').classList.toggle('hidden', val !== 'secco'); }

// --- MOTORE DI CALCOLO CERTIFICATO (LOGICA CONGELATA) ---
function eseguiCalcoloCommerciale() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    let mainQtyInput = parseFloat(document.getElementById('q-main').value) || 0;
    const extraQty = parseFloat(document.getElementById('q-extra').value) || 0;
    const unitType = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    let qtyLavorazione = mainQtyInput;
    if (p.range === "Posa incerta" && document.getElementById('finitura-pietra')?.value === 'secco') {
        const percSfrido = parseFloat(document.getElementById('perc-sfrido').value) || 0;
        qtyLavorazione = mainQtyInput * (1 + percSfrido / 100);
    }

    let qtyVenduta = 0;
    let vincoloMsg = "Vendita Libera";
    let baseDisc = 45;
    let labelUnit = (p.category === "Mattoni") ? " pz" : " MQ";

    // 1. LEGNO: RIVESTIMENTI (CONV. NOMINALE)
    if (p.range === "Rivestimenti" && p.category === "Legno") {
        qtyVenduta = (qtyLavorazione + extraQty) * (146/136);
        vincoloMsg = "Superficie Nominale";
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
        labelUnit = " MQ Nom.";
    } 
    // 2. LEGNO: PAVIMENTI
    else if (p.range === "Pavimenti" && p.category === "Legno") {
        qtyVenduta = qtyLavorazione + extraQty;
        baseDisc = qtyVenduta >= 15 ? 50 : 45;
    }
    // 3. PIETRA: PANNELLI (SCATOLA)
    else if (p.range === "Pannelli preassemblati") {
        const mqR = qtyLavorazione + extraQty;
        const m2scat = parseFloat(p.m2_scatola) || 1;
        qtyVenduta = Math.ceil(mqR / m2scat) * m2scat;
        vincoloMsg = "Scatola Intera";
        baseDisc = qtyVenduta >= (p.m2_bancale || 999) ? 50 : 45;
    } 
    // 4. PIETRA: PAVIMENTI (BANCALE)
    else if (p.range === "Pavimenti" && p.category === "Pietra") {
        const tot = qtyLavorazione + extraQty;
        const m2banc = parseFloat(p.m2_bancale) || 1;
        if (p.sfuso === "no") {
            qtyVenduta = Math.ceil(tot / m2banc) * m2banc;
            vincoloMsg = "Bancale Intero";
        } else {
            qtyVenduta = tot;
        }
        baseDisc = qtyVenduta >= m2banc ? 50 : 45;
    }
    // 5. PIETRA: TETTI (PEZZI)
    else if (p.range === "Tetti") {
        const pzMq = parseFloat(p.pz_mq) || 1;
        qtyVenduta = (unitType === 'mq') ? Math.ceil((qtyLavorazione + extraQty) * pzMq) : (qtyLavorazione + extraQty);
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
        labelUnit = " pz";
    }
    // 6. MATTONI (LOGICA BANCALI/SCATOLE)
    else if (p.category === "Mattoni") {
        let pzMq = p.pz_mq;
        if (p.range === "Fortis") pzMq = document.getElementById('tipo-posa').value === 'coltello' ? p.pz_mq_coltello : p.pz_mq_piatto;
        let pzR = unitType === 'mq' ? Math.ceil((qtyLavorazione + extraQty) * pzMq) : (qtyLavorazione + extraQty);
        qtyVenduta = pzR;
        if (p.range === "Genesis") {
            qtyVenduta = (p.sfuso === 'no') ? Math.ceil(pzR / p.pz_bancale) * p.pz_bancale : Math.ceil(pzR / p.pz_scatola) * p.pz_scatola;
            vincoloMsg = p.sfuso === 'no' ? "Bancale" : "Scatola";
        } else if (p.sfuso === 'no' || ["Fortis", "Cotto", "Croma"].includes(p.range)) {
            qtyVenduta = Math.ceil(pzR / p.pz_bancale) * p.pz_bancale;
            vincoloMsg = "Bancale Intero";
        }
        baseDisc = qtyVenduta >= (p.pz_bancale || 999) ? 50 : 45;
        labelUnit = " pz";
    } else {
        qtyVenduta = qtyLavorazione + extraQty;
        baseDisc = qtyVenduta >= (p.m2_bancale || 999) ? 50 : 45;
    }

    const priceScontato = p.price * (1 - baseDisc / 100) * (1 - extraDisc / 100);
    const imponibile = (qtyVenduta * priceScontato) + transport;
    const totale = isPrivato ? imponibile * 1.22 : imponibile;

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-sconto-base').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-pz').innerText = qtyVenduta.toFixed(2) + labelUnit;
    document.getElementById('res-vincolo').innerText = vincoloMsg;
    document.getElementById('res-p').innerText = "€ " + totale.toLocaleString('it-IT', {minimumFractionDigits: 2});
}

// --- GESTIONE LISTINI (STYLE: iOS Grouped Table) ---
function renderGestionale() {
    const c = document.getElementById('content');
    document.getElementById('nav-title').innerText = "Gestione";
    document.getElementById('back-btn').classList.add('hidden');
    
    let h = `<h1 class="text-3xl font-bold mb-8 tracking-tight">Impostazioni</h1>`;
    for (const [cat, info] of Object.entries(STRUTTURA)) {
        h += `<div class="mb-6"><h3 class="text-[13px] font-semibold text-[#8E8E93] ml-4 mb-2 uppercase tracking-wider">${cat}</h3>
            <div class="ios-card overflow-hidden">
                ${info.gamme.map((g, i) => `
                    <div class="p-4 flex items-center justify-between ${i !== 0 ? 'border-t border-[#F2F2F7]' : ''}">
                        <span class="font-medium">${g}</span>
                        <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                        <label for="f-${cat}-${g}" class="text-[#007AFF] font-bold text-sm ios-press cursor-pointer">CARICA CSV</label>
                    </div>`).join('')}
            </div></div>`;
    }
    c.innerHTML = h;
    lucide.createIcons();
}

// --- FUNZIONE IMPORTAZIONE (Mantenuta Integrale) ---
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
        alert(`Listino ${gamma} caricato correttamente!`);
    };
    reader.readAsText(file);
}

init();
