const STORAGE_KEY = "gureevdoc-demo-state";

const sampleState = {
  nextId: 8,
  objects: [
    {
      id: 1,
      name: "ЖК Северный квартал",
      comment: "Монолит, 2 очередь. Проверить закрывающие за июль.",
      folder_created_date: "2026-07-18",
      created_at: "2026-07-18T09:00:00.000Z",
    },
    {
      id: 2,
      name: "Складской комплекс Восток",
      comment: "Генподряд, инженерные сети.",
      folder_created_date: "2026-06-02",
      created_at: "2026-06-02T09:00:00.000Z",
    },
  ],
  contracts: [
    {
      id: 3,
      object_id: 1,
      number: "14-К/26",
      date: "2026-07-21",
      amount: 18400000,
      status: "approved",
      payment_status: "partial",
      comment: "фасад",
      comment_color: "pink",
      file_path: null,
      original_filename: null,
      created_at: "2026-07-21T09:00:00.000Z",
    },
    {
      id: 4,
      object_id: 2,
      number: "08-В/26",
      date: "2026-06-07",
      amount: 9200000,
      status: "pending",
      payment_status: "unpaid",
      comment: "сети",
      comment_color: "violet",
      file_path: null,
      original_filename: null,
      created_at: "2026-06-07T09:00:00.000Z",
    },
  ],
  annexes: [
    {
      id: 5,
      contract_id: 3,
      date: "2026-08-02",
      amount: 1260000,
      status: "approved",
      payment_status: "paid",
      file_path: null,
      original_filename: null,
      created_at: "2026-08-02T09:00:00.000Z",
    },
  ],
  secondary_documents: [
    {
      id: 6,
      parent_type: "contract",
      parent_id: 3,
      doc_type: "invoice",
      date: "2026-08-10",
      amount: 4600000,
      status: "na",
      payment_status: "partial",
      file_path: null,
      original_filename: "schet-14k-avgust.pdf",
      created_at: "2026-08-10T09:00:00.000Z",
    },
    {
      id: 7,
      parent_type: "annex",
      parent_id: 5,
      doc_type: "act",
      date: "2026-08-22",
      amount: 1260000,
      status: "not_sent",
      payment_status: "unpaid",
      file_path: null,
      original_filename: "akt-ds-1.pdf",
      created_at: "2026-08-22T09:00:00.000Z",
    },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleState));
    return clone(sampleState);
  }
  return JSON.parse(raw);
}

function setState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(state) {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}

function now() {
  return new Date().toISOString();
}

function enrichObject(state, object) {
  const contracts = state.contracts
    .filter((contract) => contract.object_id === object.id)
    .map((contract) => {
      const annexes = state.annexes
        .filter((annex) => annex.contract_id === contract.id)
        .map((annex) => ({
          ...annex,
          documents: state.secondary_documents.filter((doc) => doc.parent_type === "annex" && doc.parent_id === annex.id),
        }));

      return {
        ...contract,
        annexes,
        documents: state.secondary_documents.filter((doc) => doc.parent_type === "contract" && doc.parent_id === contract.id),
      };
    });

  return { ...object, contracts };
}

function listRegistryDocumentsFromState(state) {
  const rows = [];
  for (const object of state.objects) {
    const contracts = state.contracts.filter((contract) => contract.object_id === object.id);
    for (const contract of contracts) {
      rows.push({
        source_type: "contract",
        source_id: contract.id,
        object_id: object.id,
        object_name: object.name,
        contract_id: contract.id,
        contract_number: contract.number,
        annex_id: null,
        annex_label: null,
        doc_type: "contract",
        category: "primary",
        date: contract.date,
        amount: contract.amount,
        status: contract.status,
        payment_status: contract.payment_status,
        file_path: contract.file_path,
        original_filename: contract.original_filename,
      });

      const annexes = state.annexes.filter((annex) => annex.contract_id === contract.id);
      for (const annex of annexes) {
        rows.push({
          source_type: "annex",
          source_id: annex.id,
          object_id: object.id,
          object_name: object.name,
          contract_id: contract.id,
          contract_number: contract.number,
          annex_id: annex.id,
          annex_label: `ДС ${annex.id}`,
          doc_type: "annex",
          category: "primary",
          date: annex.date,
          amount: annex.amount,
          status: annex.status,
          payment_status: annex.payment_status,
          file_path: annex.file_path,
          original_filename: annex.original_filename,
        });
      }

      const directDocs = state.secondary_documents.filter((doc) => doc.parent_type === "contract" && doc.parent_id === contract.id);
      for (const doc of directDocs) {
        rows.push({
          ...doc,
          source_type: "secondary",
          source_id: doc.id,
          object_id: object.id,
          object_name: object.name,
          contract_id: contract.id,
          contract_number: contract.number,
          annex_id: null,
          annex_label: null,
          category: "secondary",
        });
      }

      for (const annex of annexes) {
        const annexDocs = state.secondary_documents.filter((doc) => doc.parent_type === "annex" && doc.parent_id === annex.id);
        for (const doc of annexDocs) {
          rows.push({
            ...doc,
            source_type: "secondary",
            source_id: doc.id,
            object_id: object.id,
            object_name: object.name,
            contract_id: contract.id,
            contract_number: contract.number,
            annex_id: annex.id,
            annex_label: `ДС ${annex.id}`,
            category: "secondary",
          });
        }
      }
    }
  }
  return rows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function makeMockApi() {
  return {
    async listObjects() {
      const state = getState();
      return state.objects.map((object) => {
        const contracts = state.contracts.filter((contract) => contract.object_id === object.id);
        const annexes = state.annexes.filter((annex) => contracts.some((contract) => contract.id === annex.contract_id));
        const secondary = state.secondary_documents.filter((doc) => {
          if (doc.parent_type === "contract") return contracts.some((contract) => contract.id === doc.parent_id);
          return annexes.some((annex) => annex.id === doc.parent_id);
        });
        return {
          ...object,
          contracts_count: contracts.length,
          annexes_count: annexes.length,
          secondary_count: secondary.length,
        };
      });
    },
    async getObjectDetails(id) {
      const state = getState();
      const object = state.objects.find((item) => item.id === Number(id));
      return object ? enrichObject(state, object) : null;
    },
    async createObject(payload) {
      const state = getState();
      const object = {
        id: nextId(state),
        name: payload.name,
        comment: payload.comment || "",
        folder_created_date: payload.folder_created_date || null,
        created_at: now(),
      };
      state.objects.push(object);
      setState(state);
      return enrichObject(state, object);
    },
    async updateObject(payload) {
      const state = getState();
      const index = state.objects.findIndex((item) => item.id === Number(payload.id));
      if (index >= 0) state.objects[index] = { ...state.objects[index], ...payload };
      setState(state);
      return enrichObject(state, state.objects[index]);
    },
    async deleteObject(id) {
      const state = getState();
      const objectId = Number(id);
      const contracts = state.contracts.filter((contract) => contract.object_id === objectId).map((contract) => contract.id);
      const annexes = state.annexes.filter((annex) => contracts.includes(annex.contract_id)).map((annex) => annex.id);
      state.objects = state.objects.filter((object) => object.id !== objectId);
      state.contracts = state.contracts.filter((contract) => contract.object_id !== objectId);
      state.annexes = state.annexes.filter((annex) => !contracts.includes(annex.contract_id));
      state.secondary_documents = state.secondary_documents.filter((doc) => {
        if (doc.parent_type === "contract") return !contracts.includes(doc.parent_id);
        return !annexes.includes(doc.parent_id);
      });
      setState(state);
      return { ok: true };
    },
    async createContract(payload) {
      const state = getState();
      const contract = { id: nextId(state), ...payload, created_at: now(), file_path: null, original_filename: payload.original_filename || null };
      state.contracts.push(contract);
      setState(state);
      return contract;
    },
    async updateContract(payload) {
      const state = getState();
      const index = state.contracts.findIndex((contract) => contract.id === Number(payload.id));
      if (index >= 0) {
        state.contracts[index] = {
          ...state.contracts[index],
          number: payload.number || "",
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          payment_status: payload.payment_status,
          comment: payload.comment || "",
          comment_color: payload.comment_color || "pink",
        };
      }
      setState(state);
      return state.contracts[index] || null;
    },
    async deleteContract(id) {
      const state = getState();
      const contractId = Number(id);
      const annexes = state.annexes.filter((annex) => annex.contract_id === contractId).map((annex) => annex.id);
      state.contracts = state.contracts.filter((contract) => contract.id !== contractId);
      state.annexes = state.annexes.filter((annex) => annex.contract_id !== contractId);
      state.secondary_documents = state.secondary_documents.filter((doc) => {
        if (doc.parent_type === "contract") return doc.parent_id !== contractId;
        return !annexes.includes(doc.parent_id);
      });
      setState(state);
      return { ok: true };
    },
    async createAnnex(payload) {
      const state = getState();
      const annex = { id: nextId(state), ...payload, created_at: now(), file_path: null, original_filename: payload.original_filename || null };
      state.annexes.push(annex);
      setState(state);
      return annex;
    },
    async updateAnnex(payload) {
      const state = getState();
      const index = state.annexes.findIndex((annex) => annex.id === Number(payload.id));
      if (index >= 0) {
        state.annexes[index] = {
          ...state.annexes[index],
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          payment_status: payload.payment_status,
        };
      }
      setState(state);
      return state.annexes[index] || null;
    },
    async deleteAnnex(id) {
      const state = getState();
      const annexId = Number(id);
      state.annexes = state.annexes.filter((annex) => annex.id !== annexId);
      state.secondary_documents = state.secondary_documents.filter((doc) => doc.parent_type !== "annex" || doc.parent_id !== annexId);
      setState(state);
      return { ok: true };
    },
    async createSecondaryDocument(payload) {
      const state = getState();
      const document = {
        id: nextId(state),
        ...payload,
        file_path: null,
        original_filename: payload.original_filename || "demo-document.pdf",
        created_at: now(),
      };
      state.secondary_documents.push(document);
      setState(state);
      return document;
    },
    async updateSecondaryDocument(payload) {
      const state = getState();
      const index = state.secondary_documents.findIndex((doc) => doc.id === Number(payload.id));
      if (index >= 0) {
        state.secondary_documents[index] = {
          ...state.secondary_documents[index],
          doc_type: payload.doc_type,
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          payment_status: payload.payment_status,
        };
      }
      setState(state);
      return state.secondary_documents[index] || null;
    },
    async deleteSecondaryDocument(id) {
      const state = getState();
      state.secondary_documents = state.secondary_documents.filter((doc) => doc.id !== Number(id));
      setState(state);
      return { ok: true };
    },
    async listRegistryDocuments() {
      return listRegistryDocumentsFromState(getState());
    },
    async exportAllData() {
      return { ok: false, message: "ZIP-экспорт доступен в Electron-приложении" };
    },
    async importAllData() {
      return { ok: false, message: "ZIP-импорт доступен в Electron-приложении" };
    },
    async selectFile() {
      return { sourceFilePath: null, originalFilename: "demo-document.pdf" };
    },
    async openFile() {
      return { ok: false, message: "Открытие файлов доступно в Electron-приложении" };
    },
  };
}

export const api = window.stroySort || makeMockApi();
