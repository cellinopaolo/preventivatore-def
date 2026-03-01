// --- CONFIGURAZIONE DATABASE (DEXIE) ---
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
    c.innerHTML = `
        <div class="grid gap-4 italic font-black text-xl uppercase tracking-tighter">
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
    c.innerHTML = `<h2 class="text-2xl font-black mb-6 uppercase italic text-slate-800 border-l-4 border-blue-600 pl-3">${cat}</h2>
        <div class="grid gap-3 italic font-bold text-slate-700 uppercase tracking-widest text-sm">
            ${STRUTTURA[cat].gamme.map(g => `
                <button onclick="renderInterfacciaCalcolo('${cat}', '${g}')" class="bg-white p-6 rounded-2xl border-2 border-slate-100 flex justify-between items-center shadow-sm active:border-blue-500 transition-all">
                    <span>${g}</span><i data-lucide="chevron-right" class="text-blue-500"></i>
                </button>`).join('')}
        </div>`;
    lucide.createIcons();
}

// --- INTERFACCIA CALCOLO ---
async function renderInterfacciaCalcolo(cat, gamma) {
    const prodotti = await db.prodotti.where({ category: cat, range: gamma }).toArray();
    const c = document.getElementById('content');
    document.getElementById('back-btn').onclick = () => renderGamme(cat);

    if (prodotti.length === 0) {
        c.innerHTML = `<div class="p-10 text-center opacity-30 font-bold uppercase italic">Carica il listino per ${gamma}</div>`;
        return;
    }

    let htmlSpecial = "";
    if (gamma === "Fortis") {
        htmlSpecial = `<div class="space-y-2"><label class="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Tipo di Posa</label><select id="tipo-posa" class="w-full bg-orange-50 p-4 rounded-2xl font-black italic outline-none border-2 border-orange-100 focus:border-orange-500 appearance-none"><option value="piatto">DI PIATTO (Standard)</option><option value="coltello">DI COLTELLO</option></select></div>`;
    } else if (gamma === "Posa incerta") {
        htmlSpecial = `<div class="grid grid-cols-2 gap-3"><div class="space-y-2"><label class="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Finitura Posa</label><select id="finitura-pietra" onchange="toggleSfrido(this.value)" class="w-full bg-stone-100 p-4 rounded-2xl font-black italic outline-none border-2 border-transparent focus:border-stone-500 appearance-none"><option value="fugata">FUGATA</option><option value="secco">A SECCO</option></select></div><div id="box-sfrido" class="space-y-2 hidden"><label class="text-[9px] font-black uppercase text-orange-500 ml-4 italic">+ % Materiale</label><input type="number" id="perc-sfrido" class="w-full bg-orange-50 p-4 rounded-2xl font-black italic outline-none border-2 border-orange-200 focus:border-orange-500 text-center" value="15"></div></div>`;
    }

    const unitLabel = (cat === "Legno") ? "MQ UTILI" : "Quantità";
    const unitOptions = (cat === "Pietra" || cat === "Legno") ? `<option value="mq">MQ</option><option value="pz">PEZZI</option>` : `<option value="mq">MQ</option><option value="pz">PEZZI</option>`;

    c.innerHTML = `
        <div class="mb-4 italic"><p class="text-[10px] font-black text-blue-600 uppercase">${cat} / ${gamma}</p></div>
        <div class="bg-white p-5 rounded-[2.5rem] border shadow-sm space-y-5">
            <div><label class="text-[9px] font-black uppercase text-slate-400 ml-4 italic">Modello</label><select id="select-prod" class="w-full bg-slate-100 p-4 rounded-2xl font-bold italic outline-none border-2 border-transparent focus:border-blue-500">${prodotti.map(p => `<option value='${JSON.stringify(p)}'>${p.name}</option>`).join('')}</select></div>
            ${htmlSpecial}
            <div class="grid grid-cols-2 gap-3"><div class="relative"><input type="number" id="q-main" class="w-full bg-slate-50 rounded-2xl p-4 text-2xl font-black text-center border focus:border-blue-500 outline-none italic" value="0"><label class="absolute -top-2 left-4 bg-slate-800 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">${unitLabel}</label></div><select id="u-type" class="w-full bg-slate-100 p-4 rounded-2xl font-black italic outline-none text-sm">${unitOptions}</select></div>
            <div class="grid grid-cols-2 gap-3"><div class="relative"><input type="number" id="q-extra" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0"><label class="absolute -top-2 left-4 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Extra</label></div><div class="relative"><input type="number" id="d-extra" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0"><label class="absolute -top-2 left-4 bg-orange-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Sconto Extra %</label></div></div>
            <div class="grid grid-cols-2 gap-3"><div class="relative"><input type="number" id="cost-trans" class="w-full bg-slate-50 rounded-2xl p-4 text-xl font-black text-center border outline-none italic" value="0"><label class="absolute -top-2 left-4 bg-slate-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase italic">Trasporto €</label></div><select id="c-type" class="w-full bg-slate-100 p-4 rounded-2xl font-black italic outline-none text-[10px] uppercase"><option value="azienda">Azienda</option><option value="privato">Privato</option></select></div>
            <button onclick="eseguiCalcoloCommerciale()" class="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all">Calcola Totale</button>
            <div id="risultato" class="hidden bg-slate-900 p-6 rounded-[2rem] text-white italic shadow-2xl space-y-3">
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Sconto Composto</span> <span id="res-sconto-base"></span></div>
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Qtà Venduta</span> <span id="res-pz"></span></div>
                <div class="flex justify-between text-[10px] uppercase opacity-60"><span>Vincolo Logistico</span> <span id="res-vincolo"></span></div>
                <div class="flex justify-between items-end pt-2 border-t border-white/10"><span class="text-xs font-black uppercase text-blue-400">TOTALE FINALE</span><span id="res-p" class="text-3xl font-black tracking-tighter"></span></div>
                <p id="iva-note" class="text-[8px] uppercase text-center opacity-40 pt-2"></p>
            </div>
        </div>`;
    lucide.createIcons();
}

function toggleSfrido(val) {
    const box = document.getElementById('box-sfrido');
    if (val === 'secco') box.classList.remove('hidden');
    else box.classList.add('hidden');
}

// --- LOGICA DI CALCOLO COMMERCIALE (BLINDATA) ---
function eseguiCalcoloCommerciale() {
    const p = JSON.parse(document.getElementById('select-prod').value);
    let mainQtyInput = parseFloat(document.getElementById('q-main').value) || 0;
    const extraQty = parseFloat(document.getElementById('q-extra').value) || 0;
    const unitType = document.getElementById('u-type').value;
    const extraDisc = parseFloat(document.getElementById('d-extra').value) || 0;
    const transport = parseFloat(document.getElementById('cost-trans').value) || 0;
    const isPrivato = document.getElementById('c-type').value === 'privato';

    let qtyLavorazione = mainQtyInput;
    if (p.range === "Posa incerta" && document.getElementById('finitura-pietra').value === 'secco') {
        const percSfrido = parseFloat(document.getElementById('perc-sfrido').value) || 0;
        qtyLavorazione = mainQtyInput * (1 + percSfrido / 100);
    }

    let qtyVenduta = 0;
    let vincoloMsg = "Vendita Libera";
    let baseDisc = 45;
    let labelUnit = (p.category === "Pietra" || p.category === "Legno") ? " MQ" : " pz";

    // 1. LOGICA RIVESTIMENTI LEGNO (NOMINALE)
    if (p.range === "Rivestimenti" && p.category === "Legno") {
        const coeffLegno = 146 / 136;
        qtyVenduta = (qtyLavorazione + extraQty) * coeffLegno;
        vincoloMsg = "Calcolo su Nominale";
        baseDisc = (qtyVenduta >= 15) ? 50 : 45;
        labelUnit = " MQ Nom.";
    } 
    // 2. LOGICA PANNELLI PIETRA (SCATOLA)
    else if (p.range === "Pannelli preassemblati") {
        const mqRichiesti = qtyLavorazione + extraQty;
        const m2scat = parseFloat(p.m2_scatola) || 1;
        qtyVenduta = Math.ceil(mqRichiesti / m2scat) * m2scat;
        vincoloMsg = "Arrotondamento Scatola";
        baseDisc = (qtyVenduta >= (parseFloat(p.m2_bancale) || 999)) ? 50 : 45;
    } 
    // 3. LOGICA PAVIMENTI PIETRA (BANCALE SE SFUSO NO)
    else if (p.range === "Pavimenti" && p.category === "Pietra") {
        const totalQty = qtyLavorazione + extraQty;
        const m2banc = parseFloat(p.m2_bancale) || 999;
        if (p.sfuso === "no") {
            qtyVenduta = Math.ceil(totalQty / m2banc) * m2banc;
            vincoloMsg = "Bancale Intero";
        } else {
            qtyVenduta = totalQty;
        }
        baseDisc = (qtyVenduta >= m2banc) ? 50 : 45;
    }
    // 4. LOGICA TETTI (PEZZI)
    else if (p.range === "Tetti") {
        const pzMq = parseFloat(p.pz_mq) || 1;
        qtyVenduta = (unitType === 'mq') ? Math.ceil((qtyLavorazione + extraQty) * pzMq) : (qtyLavorazione + extraQty);
        baseDisc = (qtyVenduta >= (p.pz_bancale || 999)) ? 50 : 45;
        labelUnit = " pz";
    }
    // 5. LOGICA PIETRA LIBERA
    else if (p.range === "Posa incerta" || p.range === "Taglio rettangolare") {
        qtyVenduta = qtyLavorazione + extraQty;
        baseDisc = (qtyVenduta >= (parseFloat(p.m2_bancale) || 999)) ? 50 : 45;
    } 
    // 6. LOGICA MATTONI (GENESIS, CROMA, ETC)
    else {
        let pzMq = p.pz_mq;
        if (p.range === "Fortis") pzMq = (document.getElementById('tipo-posa').value === "coltello") ? p.pz_mq_coltello : p.pz_mq_piatto;
        let pzRichiesti = (unitType === 'mq') ? Math.ceil((qtyLavorazione + extraQty) * pzMq) : (qtyLavorazione + extraQty);
        qtyVenduta = pzRichiesti;
        if (p.range === "Genesis") {
            qtyVenduta = (p.sfuso === 'no') ? Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale : Math.ceil(pzRichiesti / p.pz_scatola) * p.pz_scatola;
            vincoloMsg = (p.sfuso === 'no') ? "Bancale Intero" : "Scatola Intera";
        } else if ((p.range === "Croma" && p.sfuso === 'no') || p.range === "Fortis" || p.range === "Cotto") {
            qtyVenduta = Math.ceil(pzRichiesti / p.pz_bancale) * p.pz_bancale;
            vincoloMsg = "Bancale Intero";
        }
        baseDisc = (qtyVenduta >= p.pz_bancale) ? 50 : 45;
        labelUnit = " pz";
    }

    const priceScontato = p.price * (1 - baseDisc / 100) * (1 - extraDisc / 100);
    const imponibile = (qtyVenduta * priceScontato) + transport;
    const totale = isPrivato ? imponibile * 1.22 : imponibile;

    document.getElementById('risultato').classList.remove('hidden');
    document.getElementById('res-sconto-base').innerText = `${baseDisc}% + ${extraDisc}%`;
    document.getElementById('res-pz').innerText = qtyVenduta.toFixed(2) + labelUnit;
    document.getElementById('res-vincolo').innerText = vincoloMsg;
    document.getElementById('res-p').innerText = "€" + totale.toLocaleString('it-IT', {minimumFractionDigits: 2});
    document.getElementById('iva-note').innerText = isPrivato ? "Incl. IVA 22% e Trasp." : "Escl. IVA, Incl. Trasp.";
}

// --- GESTIONALE (TAB LISTINI) ---
function renderGestionale() {
    const c = document.getElementById('content');
    const b = document.getElementById('back-btn');
    b.classList.remove('hidden'); b.onclick = renderCategorie;
    let h = `<h2 class="text-2xl font-black mb-6 uppercase italic">Gestione Listini</h2><div class="space-y-4 pb-24">`;
    for (const [cat, info] of Object.entries(STRUTTURA)) {
        h += `<div class="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
            <div class="${info.colore} p-4 text-white font-black uppercase italic text-[10px] tracking-widest">${cat}</div>
            <div class="p-4 space-y-2">${info.gamme.map(g => `
                <div class="flex items-center justify-between bg-slate-50 p-3 rounded-xl border">
                    <span class="font-bold text-[10px] uppercase text-slate-500">${g}</span>
                    <input type="file" id="f-${cat}-${g}" accept=".csv" class="hidden" onchange="importa('${cat}','${g}',event)">
                    <label for="f-${cat}-${g}" class="bg-slate-800 text-white px-4 py-2 rounded-lg font-black uppercase text-[9px] cursor-pointer">Carica CSV</label>
                </div>`).join('')}</div></div>`;
    }
    c.innerHTML = h + `</div>`;
    lucide.createIcons();
}

async function importa(cat, gamma, e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        const header = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase());
        const idx = {
            nome: header.indexOf("nome"),
            prezzo: header.indexOf("prezzo_m2") !== -1 ? header.indexOf("prezzo_m2") : (header.indexOf("prezzo_pz") !== -1 ? header.indexOf("prezzo_pz") : header.indexOf("prezzo_unita")),
            m2_banc: header.indexOf("m2_bancale"), m2_scat: header.indexOf("m2_scatola"),
            pz_mq: header.indexOf("pz_m2"), pz_banc: header.indexOf("pz_bancale"),
            pz_scat: header.indexOf("pz_scatola"), sfuso: header.indexOf("sfuso"),
            pz_mq_p: header.indexOf("pz_m2_piatto"), pz_mq_c: header.indexOf("pz_m2_coltello")
        };
        const batch = [];
        await db.prodotti.where({ category: cat, range: gamma }).delete();
        for(let i = 1; i < lines.length; i++) {
            const c = lines[i].split(/[,;]/).map(val => val.trim());
            if (!c[idx.nome]) continue;
            let item = { 
                category: cat, range: gamma, name: c[idx.nome], 
                price: parseFloat(c[idx.prezzo]?.replace(',', '.')) || 0, 
                sfuso: idx.sfuso !== -1 ? c[idx.sfuso].toLowerCase() : 'sì' 
            };
            item.m2_bancale = parseFloat(c[idx.m2_banc]?.replace(',', '.')) || 999;
            item.m2_scatola = parseFloat(c[idx.m2_scat]?.replace(',', '.')) || 1;
            item.pz_mq = parseFloat(c[idx.pz_mq]?.replace(',', '.')) || 1;
            item.pz_bancale = parseInt(c[idx.pz_banc]) || 1;
            item.pz_scatola = parseInt(c[idx.pz_scat]) || 0;
            if (gamma === "Fortis") {
                item.pz_mq_piatto = parseFloat(c[idx.pz_mq_p]?.replace(',', '.')) || 0;
                item.pz_mq_coltello = parseFloat(c[idx.pz_mq_c]?.replace(',', '.')) || 0;
            }
            batch.push(item);
        }
        await db.prodotti.bulkAdd(batch);
        alert(`SUCCESSO: ${gamma} caricato!`);
    };
    reader.readAsText(file);
}

init();
