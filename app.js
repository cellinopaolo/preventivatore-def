// 1. Configurazione Database
const db = new Dexie("PreventiviDB");
db.version(1).stores({
    prodotti: "++id, macrocategoria, gamma, nome"
});

// 2. I tuoi dati (Esempio basato sul tuo SQL)
const datiIniziali = [
    { macrocategoria: 'Mattoni', gamma: 'Genesis', nome: 'Rosso Antico', prezzo_pz: 1.50, pz_bancale: 500, sfuso: 'no' },
    { macrocategoria: 'Pietre', gamma: 'Posa incerta', nome: 'Giallo Reale', prezzo_unita: 45.00, pz_bancale: 25, sfuso: 'no' },
    { macrocategoria: 'Legno', gamma: 'Pavimenti', nome: 'Rovere', prezzo_m2: 60.00, sfuso: 'si' }
];

// 3. Funzioni dell'App
async function init() {
    const count = await db.prodotti.count();
    if (count === 0) await db.prodotti.bulkAdd(datiIniziali);
    renderCategorie();
    lucide.createIcons(); // Attiva le icone
}

function renderCategorie() {
    const content = document.getElementById('content');
    document.getElementById('back-btn').classList.add('hidden');
    
    content.innerHTML = `
        <div class="grid gap-4">
            <button onclick="renderProdotti('Mattoni')" class="bg-orange-600 text-white p-8 rounded-2xl shadow-lg font-bold text-xl uppercase">🧱 Mattoni</button>
            <button onclick="renderProdotti('Pietre')" class="bg-stone-500 text-white p-8 rounded-2xl shadow-lg font-bold text-xl uppercase">🪨 Pietra</button>
            <button onclick="renderProdotti('Legno')" class="bg-amber-800 text-white p-8 rounded-2xl shadow-lg font-bold text-xl uppercase">🪵 Legno</button>
        </div>
    `;
}

async function renderProdotti(cat) {
    const prodotti = await db.prodotti.where('macrocategoria').equals(cat).toArray();
    const content = document.getElementById('content');
    const backBtn = document.getElementById('back-btn');
    
    backBtn.classList.remove('hidden');
    backBtn.onclick = renderCategorie;

    let html = `<h2 class="text-2xl font-bold mb-4">${cat}</h2><div class="space-y-3">`;
    prodotti.forEach(p => {
        html += `
            <div class="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                <div>
                    <p class="font-bold">${p.nome}</p>
                    <p class="text-xs text-slate-500 uppercase">${p.gamma}</p>
                </div>
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">+</button>
            </div>
        `;
    });
    html += `</div>`;
    content.innerHTML = html;
}

init();