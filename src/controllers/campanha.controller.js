import { getFirestore, doc, getDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { deleteObject, getStorage, ref } from "firebase/storage";
import { adminApp } from "../config/firebase.js"; // Importa a instância de adminApp

// Variáveis Globais de Configuração (simulação do ambiente Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Inicialização do Firebase (se ainda não estiver inicializado)
let firebaseApp;
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp();
}
const db = getFirestore(firebaseApp);
const storage = getStorage(adminApp);

// =======================================================================
// Funções Auxiliares de Path
// =======================================================================

/** Obtém o caminho da campanha no Firestore */
const getCampaignDocRef = (campaignId) => 
    doc(db, `/artifacts/${appId}/users/${adminApp.options.userId}/campanhas`, campaignId);

/** Obtém o caminho da coleção de sessões dentro da campanha */
const getSessionCollectionRef = (campaignId) => 
    collection(db, `/artifacts/${appId}/users/${adminApp.options.userId}/campanhas/${campaignId}/sessoes`);

// =======================================================================
// 1. Rotas de Listagem (Index) e Criação
// (Assumindo que este código está OK, não será modificado)
// =======================================================================

export async function index(req, res) {
    // ... (código existente para listar campanhas)
}

export async function criarGet(req, res) {
    // ... (código existente para exibir formulário de criação GET)
}

export async function criarPost(req, res) {
    // ... (código existente para processar criação POST)
}


// =======================================================================
// 2. Rota de Detalhes (Correção para o índice de sessão)
// =======================================================================

export async function detalhes(req, res) {
    const { id } = req.params;
    const campanhaRef = getCampaignDocRef(id);

    try {
        const docSnap = await getDoc(campanhaRef);

        if (!docSnap.exists()) {
            return res.status(404).render("404", { message: "Campanha não encontrada." });
        }

        const campanhaData = { id: docSnap.id, ...docSnap.data() };
        
        // -----------------------------------------------------------------
        // 🚨 CRÍTICO: Consulta de Sessões - Requer Índice Composto
        // -----------------------------------------------------------------
        const sessoesRef = getSessionCollectionRef(id);
        
        // Cria a query: busca todas as sessões e ordena pela data em ordem decrescente.
        // O Firestore REQUER um índice composto se você tiver um WHERE ou se usar um campo
        // diferente do ID do documento para ordenação.
        // Como 'data' não é indexada por padrão, a consulta pode falhar sem o índice.
        const q = query(sessoesRef); // Não precisamos de WHERE, pois já estamos na subcoleção.

        // Vamos ordenar em memória para evitar o erro de índice composto,
        // garantindo que a consulta mais simples do Firestore funcione.
        // A consulta mais simples (apenas a subcoleção) não requer índice.
        const sessoesSnapshot = await getDocs(q);
        
        let sessoes = sessoesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // 💡 ORDENAÇÃO NO CLIENTE (Javascript) para evitar o erro de índice no Firestore.
        // Ordena as sessões pela data do mais recente para o mais antigo (descendente).
        sessoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        // -----------------------------------------------------------------
        
        res.render("campanha/detalhes", {
            campanha: campanhaData,
            sessoes: sessoes, // As sessões agora estão ordenadas e prontas para renderização
            csrfToken: res.locals.csrfToken
        });

    } catch (error) {
        console.error("Erro ao buscar detalhes da campanha e sessões:", error);
        res.status(500).render("erro", { message: "Erro interno do servidor ao carregar campanha." });
    }
}


// =======================================================================
// 3. Rotas de Edição e Remoção
// (Assumindo que este código está OK, não será modificado)
// =======================================================================

export async function apagarGet(req, res) {
    // ... (código existente para exibir confirmação de apagar GET)
}

export async function apagarPost(req, res) {
    // ... (código existente para processar remoção POST)
}

export async function editarGet(req, res) {
    // ... (código existente para exibir formulário de edição GET)
}

export async function editarPost(req, res) {
    // ... (código existente para processar edição POST)
}