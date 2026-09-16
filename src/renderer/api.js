const STORAGE_KEY = "gureevdoc-demo-state-021-rich";

const sampleState = {
  nextId: 25,
  objects: [
    {
      id: 1,
      name: "ЖК Северный квартал",
      customer: "ООО Северстрой",
      address: "Москва, Северный проспект, 14",
      comment: "Монолит, 2 очередь. Проверить закрывающие за июль.",
      folder_created_date: "2026-07-18",
      created_at: "2026-07-18T09:00:00.000Z",
    },
    {
      id: 2,
      name: "Складской комплекс Восток",
      customer: "АО Восток Девелопмент",
      address: "Московская область, промзона Восточная",
      comment: "Генподряд, инженерные сети.",
      folder_created_date: "2026-06-02",
      created_at: "2026-06-02T09:00:00.000Z",
    },
    {
      id: 9,
      name: "БЦ Гурьев Плаза",
      customer: "ООО Гурьев Плаза",
      address: "Москва, ул. Правды, 22",
      comment: "Отделка общественных зон, высокий приоритет.",
      folder_created_date: "2026-08-19",
      created_at: "2026-08-19T09:00:00.000Z",
    },
    {
      id: 10,
      name: "Школа на Лесной",
      customer: "ГБУ Дирекция строительства",
      address: "Химки, ул. Лесная, 7",
      comment: "Тендерная стадия, ждём обратную связь по КП.",
      folder_created_date: "2026-09-03",
      created_at: "2026-09-03T09:00:00.000Z",
    },
  ],
  commercial_proposals: [
    {
      id: 8,
      object_id: 1,
      number: "КП-21",
      date: "2026-08-28",
      amount: 3400000,
      status: "pending",
      comment: "кровля",
      file_path: null,
      original_filename: "kp-21.pdf",
      created_at: "2026-08-28T09:00:00.000Z",
    },
    {
      id: 11,
      object_id: 10,
      number: "КП-44/26",
      date: "2026-09-08",
      amount: 5750000,
      status: "not_sent",
      comment: "тендер",
      file_path: null,
      original_filename: "kp-school-draft.pdf",
      created_at: "2026-09-08T09:00:00.000Z",
    },
    {
      id: 12,
      object_id: 9,
      number: "КП-39/26",
      date: "2026-08-24",
      amount: 2100000,
      status: "approved",
      comment: "витражи",
      file_path: null,
      original_filename: "kp-vitraji.pdf",
      created_at: "2026-08-24T09:00:00.000Z",
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
      partial_payment_amount: 7000000,
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
      partial_payment_amount: null,
      comment: "сети",
      comment_color: "violet",
      file_path: null,
      original_filename: null,
      created_at: "2026-06-07T09:00:00.000Z",
    },
    {
      id: 13,
      object_id: 9,
      number: "31-ОЗ/26",
      date: "2026-08-30",
      amount: 12600000,
      status: "approved",
      payment_status: "paid",
      partial_payment_amount: null,
      comment: "отделка",
      comment_color: "violet",
      file_path: null,
      original_filename: "contract-31-oz-26.pdf",
      created_at: "2026-08-30T09:00:00.000Z",
    },
    {
      id: 14,
      object_id: 10,
      number: "без номера",
      date: "2026-09-12",
      amount: 5750000,
      status: "pending",
      payment_status: "partial",
      partial_payment_amount: 1500000,
      comment: "срочно",
      comment_color: "pink",
      file_path: null,
      original_filename: "contract-school-scan.pdf",
      created_at: "2026-09-12T09:00:00.000Z",
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
      partial_payment_amount: null,
      file_path: null,
      original_filename: null,
      created_at: "2026-08-02T09:00:00.000Z",
    },
    {
      id: 15,
      contract_id: 13,
      date: "2026-09-05",
      amount: 850000,
      status: "pending",
      payment_status: "partial",
      partial_payment_amount: 300000,
      file_path: null,
      original_filename: "ds-materialy.pdf",
      created_at: "2026-09-05T09:00:00.000Z",
    },
    {
      id: 16,
      contract_id: 14,
      date: "2026-09-14",
      amount: 420000,
      status: "not_sent",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "ds-avans.pdf",
      created_at: "2026-09-14T09:00:00.000Z",
    },
  ],
  secondary_documents: [
    {
      id: 6,
      parent_type: "contract",
      parent_id: 3,
      doc_type: "invoice",
      number: "С-42",
      date: "2026-08-10",
      amount: 4600000,
      status: "na",
      payment_status: "partial",
      partial_payment_amount: 1200000,
      file_path: null,
      original_filename: "schet-14k-avgust.pdf",
      created_at: "2026-08-10T09:00:00.000Z",
    },
    {
      id: 7,
      parent_type: "annex",
      parent_id: 5,
      doc_type: "act",
      number: "А-17",
      date: "2026-08-22",
      amount: 1260000,
      status: "not_sent",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "akt-ds-1.pdf",
      created_at: "2026-08-22T09:00:00.000Z",
    },
    {
      id: 17,
      parent_type: "contract",
      parent_id: 3,
      doc_type: "commercial_proposal",
      number: "КП-18/26",
      date: "2026-07-12",
      amount: 18400000,
      status: "approved",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "kp-pereneseno-pod-dogovor.pdf",
      created_at: "2026-07-12T09:00:00.000Z",
    },
    {
      id: 18,
      parent_type: "contract",
      parent_id: 13,
      doc_type: "invoice_facture",
      number: "СФ-118",
      date: "2026-09-02",
      amount: 12600000,
      status: "na",
      payment_status: "paid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "schet-faktura-118.pdf",
      created_at: "2026-09-02T09:00:00.000Z",
    },
    {
      id: 19,
      parent_type: "contract",
      parent_id: 13,
      doc_type: "outgoing_letter",
      number: "ИСХ-77",
      date: "2026-09-07",
      amount: null,
      status: "pending",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "letter-change-deadline.pdf",
      created_at: "2026-09-07T09:00:00.000Z",
    },
    {
      id: 20,
      parent_type: "annex",
      parent_id: 15,
      doc_type: "invoice",
      number: "СЧ-204",
      date: "2026-09-06",
      amount: 850000,
      status: "na",
      payment_status: "partial",
      partial_payment_amount: 300000,
      file_path: null,
      original_filename: "invoice-ds-materialy.pdf",
      created_at: "2026-09-06T09:00:00.000Z",
    },
    {
      id: 21,
      parent_type: "annex",
      parent_id: 15,
      doc_type: "act",
      number: "АКТ-56",
      date: "2026-09-11",
      amount: 850000,
      status: "approved",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "akt-56.pdf",
      created_at: "2026-09-11T09:00:00.000Z",
    },
    {
      id: 22,
      parent_type: "contract",
      parent_id: 14,
      doc_type: "waybill",
      number: "ТН-009",
      date: "2026-09-13",
      amount: 240000,
      status: "not_sent",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "nakladnaya-009.pdf",
      created_at: "2026-09-13T09:00:00.000Z",
    },
    {
      id: 23,
      parent_type: "annex",
      parent_id: 16,
      doc_type: "order",
      number: "ПР-12",
      date: "2026-09-15",
      amount: null,
      status: "approved",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "prikaz-12.pdf",
      created_at: "2026-09-15T09:00:00.000Z",
    },
    {
      id: 24,
      parent_type: "contract",
      parent_id: 4,
      doc_type: "report",
      number: "ОТЧ-03",
      date: "2026-08-31",
      amount: null,
      status: "pending",
      payment_status: "unpaid",
      partial_payment_amount: null,
      file_path: null,
      original_filename: "weekly-report-03.pdf",
      created_at: "2026-08-31T09:00:00.000Z",
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
  const state = JSON.parse(raw);
  state.commercial_proposals ||= [];
  state.contracts = (state.contracts || []).map((contract) => ({
    partial_payment_amount: null,
    ...contract,
  }));
  state.annexes = (state.annexes || []).map((annex) => ({
    partial_payment_amount: null,
    ...annex,
  }));
  state.secondary_documents = (state.secondary_documents || []).map((document) => ({
    number: "",
    partial_payment_amount: null,
    ...document,
  }));
  state.objects = (state.objects || []).map((object) => ({
    customer: "",
    address: "",
    ...object,
  }));
  return state;
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

  const commercial_proposals = state.commercial_proposals.filter((proposal) => proposal.object_id === object.id);
  return { ...object, commercial_proposals, contracts };
}

function listRegistryDocumentsFromState(state) {
  const rows = [];
  for (const object of state.objects) {
    const proposals = state.commercial_proposals.filter((proposal) => proposal.object_id === object.id);
    for (const proposal of proposals) {
      rows.push({
        source_type: "commercial_proposal",
        source_id: proposal.id,
        object_id: object.id,
        object_name: object.name,
        contract_id: null,
        contract_number: null,
        annex_id: null,
        annex_label: null,
        doc_type: "commercial_proposal",
        category: "primary",
        date: proposal.date,
        amount: proposal.amount,
        status: proposal.status,
        payment_status: "unpaid",
        partial_payment_amount: null,
        document_number: proposal.number,
        file_path: proposal.file_path,
        original_filename: proposal.original_filename,
      });
    }

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
        partial_payment_amount: contract.partial_payment_amount,
        document_number: contract.number,
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
          partial_payment_amount: annex.partial_payment_amount,
          document_number: String(annex.id),
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
          document_number: doc.number || "",
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
            document_number: doc.number || "",
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
        const proposals = state.commercial_proposals.filter((proposal) => proposal.object_id === object.id);
        const annexes = state.annexes.filter((annex) => contracts.some((contract) => contract.id === annex.contract_id));
        const secondary = state.secondary_documents.filter((doc) => {
          if (doc.parent_type === "contract") return contracts.some((contract) => contract.id === doc.parent_id);
          return annexes.some((annex) => annex.id === doc.parent_id);
        });
        return {
          ...object,
          customer: object.customer || "",
          address: object.address || "",
          proposals_count: proposals.length,
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
        customer: payload.customer || "",
        address: payload.address || "",
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
      state.commercial_proposals = state.commercial_proposals.filter((proposal) => proposal.object_id !== objectId);
      state.contracts = state.contracts.filter((contract) => contract.object_id !== objectId);
      state.annexes = state.annexes.filter((annex) => !contracts.includes(annex.contract_id));
      state.secondary_documents = state.secondary_documents.filter((doc) => {
        if (doc.parent_type === "contract") return !contracts.includes(doc.parent_id);
        return !annexes.includes(doc.parent_id);
      });
      setState(state);
      return { ok: true };
    },
    async createCommercialProposal(payload) {
      const state = getState();
      const proposal = { id: nextId(state), ...payload, created_at: now(), file_path: payload.sourceFilePath || null, original_filename: payload.original_filename || null };
      state.commercial_proposals.push(proposal);
      setState(state);
      return proposal;
    },
    async updateCommercialProposal(payload) {
      const state = getState();
      const index = state.commercial_proposals.findIndex((proposal) => proposal.id === Number(payload.id));
      if (index >= 0) {
        state.commercial_proposals[index] = {
          ...state.commercial_proposals[index],
          number: payload.number || "",
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          comment: payload.comment || "",
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.commercial_proposals[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.commercial_proposals[index].original_filename,
        };
      }
      setState(state);
      return state.commercial_proposals[index] || null;
    },
    async deleteCommercialProposal(id) {
      const state = getState();
      state.commercial_proposals = state.commercial_proposals.filter((proposal) => proposal.id !== Number(id));
      setState(state);
      return { ok: true };
    },
    async createContractFromProposal(payload) {
      const state = getState();
      const proposal = state.commercial_proposals.find((item) => item.id === Number(payload.proposal_id));
      if (!proposal) throw new Error("КП не найдено");
      const contract = {
        id: nextId(state),
        object_id: proposal.object_id,
        number: payload.number || "",
        date: payload.date || null,
        amount: payload.amount === "" ? null : Number(payload.amount),
        status: payload.status,
        payment_status: payload.payment_status,
        partial_payment_amount: payload.payment_status === "partial" ? Number(payload.partial_payment_amount || 0) || null : null,
        comment: payload.comment || proposal.comment || "",
        comment_color: payload.comment_color || "pink",
        file_path: payload.sourceFilePath || null,
        original_filename: payload.original_filename || null,
        created_at: now(),
      };
      state.contracts.push(contract);
      state.secondary_documents.push({
        id: nextId(state),
        parent_type: "contract",
        parent_id: contract.id,
        doc_type: "commercial_proposal",
        date: proposal.date,
        amount: proposal.amount,
        status: proposal.status,
        payment_status: "unpaid",
        partial_payment_amount: null,
        number: proposal.number || "",
        file_path: proposal.file_path,
        original_filename: proposal.original_filename,
        created_at: now(),
      });
      state.commercial_proposals = state.commercial_proposals.filter((item) => item.id !== proposal.id);
      setState(state);
      return contract;
    },
    async createContract(payload) {
      const state = getState();
      const contract = { id: nextId(state), ...payload, created_at: now(), file_path: payload.sourceFilePath || null, original_filename: payload.original_filename || null };
      contract.partial_payment_amount = contract.payment_status === "partial" ? Number(contract.partial_payment_amount || 0) || null : null;
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
          partial_payment_amount: payload.payment_status === "partial" ? Number(payload.partial_payment_amount || 0) || null : null,
          comment: payload.comment || "",
          comment_color: payload.comment_color || "pink",
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.contracts[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.contracts[index].original_filename,
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
      const annex = { id: nextId(state), ...payload, created_at: now(), file_path: payload.sourceFilePath || null, original_filename: payload.original_filename || null };
      annex.partial_payment_amount = annex.payment_status === "partial" ? Number(annex.partial_payment_amount || 0) || null : null;
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
          partial_payment_amount: payload.payment_status === "partial" ? Number(payload.partial_payment_amount || 0) || null : null,
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.annexes[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.annexes[index].original_filename,
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
        number: payload.number || "",
        partial_payment_amount: payload.payment_status === "partial" ? Number(payload.partial_payment_amount || 0) || null : null,
        file_path: payload.sourceFilePath || null,
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
          number: payload.number || "",
          date: payload.date || null,
          amount: payload.amount === "" ? null : Number(payload.amount),
          status: payload.status,
          payment_status: payload.payment_status,
          partial_payment_amount: payload.payment_status === "partial" ? Number(payload.partial_payment_amount || 0) || null : null,
          file_path: payload.sourceFilePath ? payload.sourceFilePath : state.secondary_documents[index].file_path,
          original_filename: payload.sourceFilePath ? payload.original_filename : state.secondary_documents[index].original_filename,
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
      return { sourceFilePath: "demo-document.pdf", originalFilename: "demo-document.pdf" };
    },
    async openFile() {
      return { ok: false, message: "Открытие файлов доступно в Electron-приложении" };
    },
  };
}

export const api = window.stroySort || makeMockApi();
