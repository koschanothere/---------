import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  FileArchive,
  FileCheck2,
  FileInput,
  FilePlus2,
  FileText,
  FolderTree,
  Plus,
  ReceiptText,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api } from "./api";

const statusLabels = {
  na: "N/A",
  approved: "Согласован",
  pending: "Ждёт согласования",
  not_sent: "Не отправлен",
};

const paymentLabels = {
  paid: "Оплачен",
  partial: "Частично",
  unpaid: "Не оплачен",
};

const docTypeLabels = {
  commercial_proposal: "КП",
  contract: "Договор",
  annex: "Доп. соглашение",
  act: "Акт",
  invoice: "Счёт",
  invoice_facture: "Счёт-фактура",
  report: "Отчёт",
  outgoing_letter: "Исходящее письмо",
  order: "Приказ",
  waybill: "Накладная",
};

const categoryLabels = {
  primary: "Первичный",
  secondary: "Вторичный",
};

const docTypeOptions = ["commercial_proposal", "act", "invoice", "invoice_facture", "report", "outgoing_letter", "order", "waybill"];
const statusOptions = ["na", "approved", "pending", "not_sent"];
const paymentOptions = ["paid", "partial", "unpaid"];
const commentColorOptions = ["pink", "violet"];

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU").format(new Date(`${value}T00:00:00`));
}

function paymentPatch(document, paymentStatus) {
  return {
    payment_status: paymentStatus,
    partial_payment_amount: paymentStatus === "partial" ? document.partial_payment_amount ?? "" : "",
  };
}

function normalizeSortValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  const numeric = Number(value);
  if (value !== "" && !Number.isNaN(numeric) && String(value).match(/^\d+(\.\d+)?$/)) return numeric;
  return String(value).toLowerCase();
}

function sortRows(rows, sort) {
  return [...rows].sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1;
    const left = normalizeSortValue(a[sort.key]);
    const right = normalizeSortValue(b[sort.key]);
    if (typeof left === "number" || typeof right === "number") {
      return (Number(left || 0) - Number(right || 0)) * direction;
    }
    return String(left).localeCompare(String(right), "ru") * direction;
  });
}

function nextSort(current, key) {
  return {
    key,
    direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
  };
}

function sortArrow(sort) {
  return sort.direction === "asc" ? "↑" : "↓";
}

function App() {
  const [view, setView] = useState("objects");
  const [objects, setObjects] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [wizard, setWizard] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadObjects() {
    try {
      setObjects(await api.listObjects());
      setError("");
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
    }
  }

  useEffect(() => {
    loadObjects();
  }, [refreshKey]);

  function openObject(id) {
    setSelectedObjectId(id);
    setView("object");
  }

  async function afterMutation() {
    await loadObjects();
    setRefreshKey((value) => value + 1);
  }

  async function handleExport() {
    try {
      setMessage("");
      const result = await api.exportAllData();
      if (result?.canceled) return;
      if (!result?.ok) {
        setError(result?.message || "Не удалось экспортировать данные");
        return;
      }
      const counts = result.counts || {};
      setError("");
      setMessage(`Экспорт готов: ${counts.objects || 0} объектов, ${counts.commercial_proposals || 0} КП, ${counts.contracts || 0} договоров, ${counts.annexes || 0} ДС, ${counts.secondary_documents || 0} вторичных документов.`);
    } catch (err) {
      setError(err.message || "Не удалось экспортировать данные");
    }
  }

  async function handleImport() {
    if (!window.confirm("Импорт заменит текущую локальную базу и файлы документами из архива. Продолжить?")) return;
    try {
      setMessage("");
      const result = await api.importAllData();
      if (result?.canceled) return;
      if (!result?.ok) {
        setError(result?.message || "Не удалось импортировать данные");
        return;
      }
      await afterMutation();
      setSelectedObjectId(null);
      setView("objects");
      const counts = result.counts || {};
      setError("");
      setMessage(`Импорт завершён: ${counts.objects || 0} объектов, ${counts.commercial_proposals || 0} КП, ${counts.contracts || 0} договоров, ${counts.annexes || 0} ДС, ${counts.secondary_documents || 0} вторичных документов.`);
    } catch (err) {
      setError(err.message || "Не удалось импортировать данные");
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Building2 size={20} /></div>
          <div>
            <strong>GureevDoc</strong>
            <span>локальный реестр</span>
          </div>
        </div>
        <nav className="nav">
          <button className={view === "objects" ? "active" : ""} onClick={() => setView("objects")}>
            <Building2 size={18} /> Объекты
          </button>
          <button className={view === "registry" ? "active" : ""} onClick={() => setView("registry")}>
            <ClipboardList size={18} /> Реестр документов
          </button>
        </nav>
        <button className="primary-action" onClick={() => setWizard({})}>
          <Plus size={18} /> Добавить документ
        </button>
        <div className="sidebar-actions">
          <button className="ghost-button" onClick={handleExport}>
            <Download size={16} /> Экспорт
          </button>
          <button className="ghost-button" onClick={handleImport}>
            <Upload size={16} /> Импорт
          </button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <h1>{view === "registry" ? "Глобальный реестр документов" : view === "object" ? "Карточка объекта" : "Объекты"}</h1>
            <p>{view === "registry" ? "Плоская ведомость первичных и вторичных документов" : "Учёт объектов, договоров и закрывающих документов"}</p>
          </div>
          <button className="icon-button filled" title="Добавить документ" onClick={() => setWizard({ objectId: selectedObjectId })}>
            <FilePlus2 size={20} />
          </button>
        </header>

        {error && <div className="notice error">{error}</div>}
        {message && <div className="notice success">{message}</div>}

        {view === "objects" && (
          <ObjectList
            objects={objects}
            onOpenObject={openObject}
            onCreated={afterMutation}
            onDeleted={afterMutation}
          />
        )}

        {view === "object" && selectedObjectId && (
          <ObjectDetails
            objectId={selectedObjectId}
            refreshKey={refreshKey}
            onBack={() => setView("objects")}
            onOpenWizard={(payload) => setWizard(payload)}
            onChanged={afterMutation}
          />
        )}

        {view === "registry" && (
          <Registry
            onOpenObject={openObject}
            refreshKey={refreshKey}
          />
        )}
      </main>

      {wizard && (
        <DocumentWizard
          initialObjectId={wizard.objectId}
          initialContractId={wizard.contractId}
          initialAnnexId={wizard.annexId}
          objects={objects}
          onClose={() => setWizard(null)}
          onSaved={async (context) => {
            setWizard(null);
            await afterMutation();
            if (context?.objectId) openObject(context.objectId);
          }}
        />
      )}
    </div>
  );
}

function ObjectList({ objects, onOpenObject, onCreated, onDeleted }) {
  const [sort, setSort] = useState({ key: "created_at", direction: "desc" });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: "", customer: "", address: "", comment: "", folder_created_date: new Date().toISOString().slice(0, 10) });

  const rows = useMemo(() => sortRows(objects, sort), [objects, sort]);

  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    await api.createObject(form);
    setForm({ name: "", customer: "", address: "", comment: "", folder_created_date: new Date().toISOString().slice(0, 10) });
    setFormOpen(false);
    onCreated();
  }

  async function removeObject(id) {
    if (!window.confirm("Удалить объект вместе с договорами и документами?")) return;
    await api.deleteObject(id);
    onDeleted();
  }

  return (
    <section className="panel">
      <div className="panel-toolbar">
        <div className="section-title">
          <FolderTree size={18} />
          <span>Список объектов</span>
        </div>
        <button className="text-button" onClick={() => setFormOpen(true)}><Plus size={16} /> Новый объект</button>
      </div>

      {formOpen && (
        <form className="inline-form" onSubmit={submit}>
          <label>
            Название
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoFocus />
          </label>
          <label>
            Заказчик
            <input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} />
          </label>
          <label>
            Адрес
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </label>
          <label>
            Дата папки
            <input type="date" value={form.folder_created_date || ""} onChange={(event) => setForm({ ...form, folder_created_date: event.target.value })} />
          </label>
          <label className="wide">
            Комментарий
            <input value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
          </label>
          <div className="form-actions">
            <button className="ghost-button" type="button" onClick={() => setFormOpen(false)}>Отмена</button>
            <button className="text-button" type="submit"><Save size={16} /> Сохранить</button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="Объект" field="name" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Заказчик" field="customer" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Адрес" field="address" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Дата папки" field="folder_created_date" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="КП" field="proposals_count" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Договоры" field="contracts_count" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="ДС" field="annexes_count" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Вторичные" field="secondary_count" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <th>Комментарий</th>
              <th aria-label="Действия"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((object) => (
              <tr key={object.id} className="clickable-row" onClick={() => onOpenObject(object.id)}>
                <td className="strong-cell">{object.name}</td>
                <td>{object.customer || "—"}</td>
                <td className="muted">{object.address || "—"}</td>
                <td className="mono">{formatDate(object.folder_created_date)}</td>
                <td className="mono">{object.proposals_count || 0}</td>
                <td className="mono">{object.contracts_count || 0}</td>
                <td className="mono">{object.annexes_count || 0}</td>
                <td className="mono">{object.secondary_count || 0}</td>
                <td className="muted">{object.comment || "—"}</td>
                <td onClick={(event) => event.stopPropagation()}>
                  <button className="icon-button danger" title="Удалить объект" onClick={() => removeObject(object.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow columns={10} text="Добавьте первый строительный объект" />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ObjectDetails({ objectId, refreshKey, onBack, onOpenWizard, onChanged }) {
  const [details, setDetails] = useState(null);
  const [form, setForm] = useState(null);
  const [expandedContracts, setExpandedContracts] = useState(new Set());
  const [expandedAnnexes, setExpandedAnnexes] = useState(new Set());
  const [tabs, setTabs] = useState({});
  const [contractProposal, setContractProposal] = useState(null);
  const [proposalSort, setProposalSort] = useState({ key: "date", direction: "desc" });
  const [contractSort, setContractSort] = useState({ key: "date", direction: "desc" });
  const [annexSort, setAnnexSort] = useState({ key: "date", direction: "desc" });

  async function load() {
    const object = await api.getObjectDetails(objectId);
    setDetails(object);
    setForm(object ? {
      name: object.name,
      customer: object.customer || "",
      address: object.address || "",
      comment: object.comment,
      folder_created_date: object.folder_created_date || "",
    } : null);
  }

  useEffect(() => {
    load();
  }, [objectId, refreshKey]);

  if (!details || !form) {
    return <div className="notice">Объект не найден</div>;
  }

  const contracts = sortRows(details.contracts || [], contractSort);
  const proposals = sortRows(details.commercial_proposals || [], proposalSort);

  function toggleContract(id) {
    setExpandedContracts((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAnnex(id) {
    setExpandedAnnexes((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveObject(event) {
    event.preventDefault();
    await api.updateObject({ id: details.id, ...form });
    await onChanged();
    await load();
  }

  async function updateContract(contract, patch) {
    await api.updateContract({ ...contract, ...patch });
    await onChanged();
    await load();
  }

  async function updateCommercialProposal(proposal, patch) {
    await api.updateCommercialProposal({ ...proposal, ...patch });
    await onChanged();
    await load();
  }

  async function updateAnnex(annex, patch) {
    await api.updateAnnex({ ...annex, ...patch });
    await onChanged();
    await load();
  }

  async function updateSecondaryDocument(document, patch) {
    await api.updateSecondaryDocument({ ...document, ...patch });
    await onChanged();
    await load();
  }

  async function replaceDocumentFile(document, updateFn) {
    const selected = await api.selectFile();
    if (!selected) return;
    await updateFn(document, {
      sourceFilePath: selected.sourceFilePath,
      original_filename: selected.originalFilename,
    });
  }

  async function deleteContract(id) {
    if (!window.confirm("Удалить договор, его ДС и документы?")) return;
    await api.deleteContract(id);
    await onChanged();
    await load();
  }

  async function deleteCommercialProposal(id) {
    if (!window.confirm("Удалить КП?")) return;
    await api.deleteCommercialProposal(id);
    await onChanged();
    await load();
  }

  async function createContractFromProposal(proposal, payload) {
    await api.createContractFromProposal({ proposal_id: proposal.id, ...payload });
    setContractProposal(null);
    await onChanged();
    await load();
  }

  async function deleteAnnex(id) {
    if (!window.confirm("Удалить доп. соглашение и его документы?")) return;
    await api.deleteAnnex(id);
    await onChanged();
    await load();
  }

  async function deleteSecondary(id) {
    if (!window.confirm("Удалить документ?")) return;
    await api.deleteSecondaryDocument(id);
    await onChanged();
    await load();
  }

  return (
    <div className="object-layout">
      <section className="panel object-card">
        <div className="panel-toolbar">
          <button className="ghost-button" onClick={onBack}>Назад</button>
          <button className="text-button" onClick={() => onOpenWizard({ objectId: details.id })}><Plus size={16} /> Документ</button>
        </div>
        <form className="object-form" onSubmit={saveObject}>
          <label>
            Название объекта
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Заказчик
            <input value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} />
          </label>
          <label className="wide">
            Адрес
            <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          </label>
          <label>
            Дата создания папки
            <input type="date" value={form.folder_created_date || ""} onChange={(event) => setForm({ ...form, folder_created_date: event.target.value })} />
          </label>
          <label className="wide">
            Комментарий
            <textarea value={form.comment || ""} onChange={(event) => setForm({ ...form, comment: event.target.value })} rows={3} />
          </label>
          <button className="text-button fit" type="submit"><Save size={16} /> Сохранить карточку</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-toolbar">
          <div className="section-title"><FileInput size={18} /> Коммерческие предложения</div>
          <div className="sort-strip">
            <button className={proposalSort.key === "number" ? "active" : ""} onClick={() => setProposalSort(nextSort(proposalSort, "number"))}>Номер {proposalSort.key === "number" ? sortArrow(proposalSort) : ""}</button>
            <button className={proposalSort.key === "date" ? "active" : ""} onClick={() => setProposalSort(nextSort(proposalSort, "date"))}>Дата {proposalSort.key === "date" ? sortArrow(proposalSort) : ""}</button>
            <button className={proposalSort.key === "amount" ? "active" : ""} onClick={() => setProposalSort(nextSort(proposalSort, "amount"))}>Сумма {proposalSort.key === "amount" ? sortArrow(proposalSort) : ""}</button>
            <button className={proposalSort.key === "status" ? "active" : ""} onClick={() => setProposalSort(nextSort(proposalSort, "status"))}>Статус {proposalSort.key === "status" ? sortArrow(proposalSort) : ""}</button>
          </div>
        </div>
        <ProposalList
          proposals={proposals}
          onUpdate={updateCommercialProposal}
          onDelete={deleteCommercialProposal}
          onCreateContract={setContractProposal}
          onReplaceFile={(proposal) => replaceDocumentFile(proposal, updateCommercialProposal)}
        />
      </section>

      <section className="panel">
        <div className="panel-toolbar">
          <div className="section-title"><FileCheck2 size={18} /> Договоры объекта</div>
          <div className="sort-strip">
            <button className={contractSort.key === "number" ? "active" : ""} onClick={() => setContractSort(nextSort(contractSort, "number"))}>Номер {contractSort.key === "number" ? sortArrow(contractSort) : ""}</button>
            <button className={contractSort.key === "date" ? "active" : ""} onClick={() => setContractSort(nextSort(contractSort, "date"))}>Дата {contractSort.key === "date" ? sortArrow(contractSort) : ""}</button>
            <button className={contractSort.key === "amount" ? "active" : ""} onClick={() => setContractSort(nextSort(contractSort, "amount"))}>Сумма {contractSort.key === "amount" ? sortArrow(contractSort) : ""}</button>
            <button className={contractSort.key === "status" ? "active" : ""} onClick={() => setContractSort(nextSort(contractSort, "status"))}>Статус {contractSort.key === "status" ? sortArrow(contractSort) : ""}</button>
            <button className={contractSort.key === "payment_status" ? "active" : ""} onClick={() => setContractSort(nextSort(contractSort, "payment_status"))}>Оплата {contractSort.key === "payment_status" ? sortArrow(contractSort) : ""}</button>
          </div>
        </div>

        <div className="accordion-list">
          {contracts.map((contract) => {
            const isOpen = expandedContracts.has(contract.id);
            const activeTab = tabs[contract.id] || "annexes";
            const annexes = sortRows(contract.annexes || [], annexSort);

            return (
              <article className="tree-item" key={contract.id}>
                <div className="contract-row">
                  <button className="icon-button" title={isOpen ? "Свернуть" : "Развернуть"} onClick={() => toggleContract(contract.id)}>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <FileText size={18} className="row-icon" />
                  <EditableValue
                    className="strong-cell"
                    value={contract.number}
                    emptyValue={`#${contract.id}`}
                    prefix="Договор "
                    onCommit={(value) => updateContract(contract, { number: value })}
                  />
                  <EditableValue
                    className="mono"
                    type="date"
                    value={contract.date}
                    displayValue={formatDate(contract.date)}
                    onCommit={(value) => updateContract(contract, { date: value })}
                  />
                  <EditableValue
                    className="mono amount"
                    type="number"
                    value={contract.amount ?? ""}
                    displayValue={formatMoney(contract.amount)}
                    onCommit={(value) => updateContract(contract, { amount: value })}
                  />
                  <EditableValue
                    type="select"
                    value={contract.status}
                    options={statusOptions.map((value) => ({ value, label: statusLabels[value] }))}
                    displayValue={<Badge type="status" value={contract.status} />}
                    onCommit={(value) => updateContract(contract, { status: value })}
                  />
                  <EditableValue
                    type="select"
                    value={contract.payment_status}
                    options={paymentOptions.map((value) => ({ value, label: paymentLabels[value] }))}
                    displayValue={<Badge type="payment" value={contract.payment_status} />}
                    onCommit={(value) => updateContract(contract, paymentPatch(contract, value))}
                  />
                  <PartialPaymentValue
                    document={contract}
                    onCommit={(value) => updateContract(contract, { partial_payment_amount: value })}
                  />
                  <EditableValue
                    value={contract.comment}
                    emptyValue="метка"
                    displayValue={contract.comment ? <span className={`comment-chip ${contract.comment_color}`}>{contract.comment}</span> : null}
                    onCommit={(value) => updateContract(contract, { comment: value })}
                  />
                  <div className="row-actions">
                    <FileCell document={contract} onReplace={() => replaceDocumentFile(contract, updateContract)} />
                    <button className="icon-button danger" title="Удалить договор" onClick={() => deleteContract(contract.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="tree-children">
                    <div className="tabs">
                      <button className={activeTab === "annexes" ? "active" : ""} onClick={() => setTabs({ ...tabs, [contract.id]: "annexes" })}>
                        Доп. соглашения
                      </button>
                      <button className={activeTab === "documents" ? "active" : ""} onClick={() => setTabs({ ...tabs, [contract.id]: "documents" })}>
                        Документы по договору
                      </button>
                      <button className="text-button compact" onClick={() => onOpenWizard({ objectId: details.id, contractId: contract.id })}>
                        <Plus size={14} /> Добавить
                      </button>
                    </div>

                    {activeTab === "annexes" && (
                      <AnnexList
                        annexes={annexes}
                        sort={annexSort}
                        onSort={(key) => setAnnexSort(nextSort(annexSort, key))}
                        expandedAnnexes={expandedAnnexes}
                        onToggleAnnex={toggleAnnex}
                        onUpdateAnnex={updateAnnex}
                        onUpdateDocument={updateSecondaryDocument}
                        onReplaceAnnexFile={(annex) => replaceDocumentFile(annex, updateAnnex)}
                        onReplaceDocumentFile={(document) => replaceDocumentFile(document, updateSecondaryDocument)}
                        onDeleteAnnex={deleteAnnex}
                        onDeleteDocument={deleteSecondary}
                      />
                    )}

                    {activeTab === "documents" && (
                      <SecondaryDocumentsTable
                        documents={contract.documents || []}
                        onUpdate={updateSecondaryDocument}
                        onReplaceFile={(document) => replaceDocumentFile(document, updateSecondaryDocument)}
                        onDelete={deleteSecondary}
                      />
                    )}
                  </div>
                )}
              </article>
            );
          })}
          {contracts.length === 0 && <div className="empty-state">У объекта пока нет договоров</div>}
        </div>
      </section>

      {contractProposal && (
        <ProposalContractModal
          proposal={contractProposal}
          onClose={() => setContractProposal(null)}
          onSaved={(payload) => createContractFromProposal(contractProposal, payload)}
        />
      )}
    </div>
  );
}

function ProposalList({ proposals, onUpdate, onDelete, onCreateContract, onReplaceFile }) {
  return (
    <div className="proposal-list">
      <div className="proposal-header">
        <span></span>
        <span>Номер</span>
        <span>Дата</span>
        <span>Сумма</span>
        <span>Статус</span>
        <span>Комментарий</span>
        <span>Файл</span>
        <span></span>
      </div>
      {proposals.map((proposal) => (
        <div className="proposal-row" key={proposal.id}>
          <FileInput size={18} className="row-icon" />
          <EditableValue
            className="strong-cell"
            value={proposal.number}
            emptyValue={`КП #${proposal.id}`}
            prefix="КП "
            onCommit={(value) => onUpdate(proposal, { number: value })}
          />
          <EditableValue
            className="mono"
            type="date"
            value={proposal.date}
            displayValue={formatDate(proposal.date)}
            onCommit={(value) => onUpdate(proposal, { date: value })}
          />
          <EditableValue
            className="mono amount"
            type="number"
            value={proposal.amount ?? ""}
            displayValue={formatMoney(proposal.amount)}
            onCommit={(value) => onUpdate(proposal, { amount: value })}
          />
          <EditableValue
            type="select"
            value={proposal.status}
            options={statusOptions.map((value) => ({ value, label: statusLabels[value] }))}
            displayValue={<Badge type="status" value={proposal.status} />}
            onCommit={(value) => onUpdate(proposal, { status: value })}
          />
          <EditableValue
            value={proposal.comment}
            emptyValue="—"
            onCommit={(value) => onUpdate(proposal, { comment: value })}
          />
          <FileCell document={proposal} onReplace={() => onReplaceFile(proposal)} />
          <div className="row-actions">
            <button className="text-button compact" onClick={() => onCreateContract(proposal)}>Появился договор</button>
            <button className="icon-button danger" title="Удалить КП" onClick={() => onDelete(proposal.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      {proposals.length === 0 && <div className="empty-state">КП пока нет</div>}
    </div>
  );
}

function PartialPaymentValue({ document, onCommit }) {
  if (document.payment_status !== "partial") {
    return <span className="muted">—</span>;
  }

  return (
    <EditableValue
      className="mono amount"
      type="number"
      value={document.partial_payment_amount ?? ""}
      displayValue={formatMoney(document.partial_payment_amount)}
      onCommit={onCommit}
    />
  );
}

function FileCell({ document, onReplace }) {
  return (
    <div className="file-actions">
      {document.original_filename ? (
        <button className="file-link" type="button" onClick={() => api.openFile(document.file_path)} title={document.original_filename}>
          {document.original_filename}
        </button>
      ) : (
        <span className="muted">—</span>
      )}
      <button className="icon-button" type="button" title="Заменить файл" onClick={onReplace}>
        <Upload size={14} />
      </button>
    </div>
  );
}

function ProposalContractModal({ proposal, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    number: "",
    date: new Date().toISOString().slice(0, 10),
    amount: proposal.amount ?? "",
    status: "approved",
    payment_status: "unpaid",
    partial_payment_amount: "",
    comment: proposal.comment || "",
    comment_color: "pink",
  });
  const [error, setError] = useState("");

  async function chooseFile() {
    const selected = await api.selectFile();
    if (selected) setFile(selected);
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setError("");
      await onSaved({
        ...form,
        sourceFilePath: file?.sourceFilePath || null,
        original_filename: file?.originalFilename || null,
      });
    } catch (err) {
      setError(err.message || "Не удалось создать договор из КП");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal proposal-contract-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <h2>Появился договор</h2>
            <p>КП {proposal.number || `#${proposal.id}`} станет вторичным документом нового договора</p>
          </div>
          <button className="icon-button" type="button" title="Закрыть" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="notice error">{error}</div>}
        <div className="form-section">
          <button className="upload-target compact-upload" type="button" onClick={chooseFile}>
            <Upload size={22} />
            <strong>{file ? file.originalFilename : "Выбрать файл договора"}</strong>
            <span>Файл договора можно приложить сразу, КП перенесётся под договор автоматически</span>
          </button>
        </div>
        <div className="form-section wizard-grid">
          <label>
            Номер договора
            <input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} autoFocus />
          </label>
          <label>
            Дата договора
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label>
            Сумма
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label>
            Статус согласования
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          <label>
            Статус оплаты
            <select value={form.payment_status} onChange={(event) => setForm({ ...form, ...paymentPatch(form, event.target.value) })}>
              {paymentOptions.map((status) => <option key={status} value={status}>{paymentLabels[status]}</option>)}
            </select>
          </label>
          {form.payment_status === "partial" && (
            <label>
              Сумма частичной оплаты
              <input type="number" min="0" step="0.01" value={form.partial_payment_amount} onChange={(event) => setForm({ ...form, partial_payment_amount: event.target.value })} />
            </label>
          )}
          <label>
            Комментарий-метка
            <input maxLength={24} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
          </label>
          <div className="segmented">
            <button type="button" className={form.comment_color === "pink" ? "active pink" : ""} onClick={() => setForm({ ...form, comment_color: "pink" })}>Розовый</button>
            <button type="button" className={form.comment_color === "violet" ? "active violet" : ""} onClick={() => setForm({ ...form, comment_color: "violet" })}>Фиолетовый</button>
          </div>
        </div>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>Отмена</button>
          <button className="text-button" type="submit"><Save size={16} /> Создать договор</button>
        </div>
      </form>
    </div>
  );
}

function AnnexList({ annexes, sort, onSort, expandedAnnexes, onToggleAnnex, onUpdateAnnex, onUpdateDocument, onReplaceAnnexFile, onReplaceDocumentFile, onDeleteAnnex, onDeleteDocument }) {
  return (
    <div className="nested-list">
      <div className="annex-header">
        <span></span>
        <span></span>
        <SortableDiv label="ДС" field="id" sort={sort} onSort={onSort} />
        <SortableDiv label="Дата" field="date" sort={sort} onSort={onSort} />
        <SortableDiv label="Сумма" field="amount" sort={sort} onSort={onSort} />
        <SortableDiv label="Статус" field="status" sort={sort} onSort={onSort} />
        <SortableDiv label="Оплата" field="payment_status" sort={sort} onSort={onSort} />
        <SortableDiv label="Оплачено" field="partial_payment_amount" sort={sort} onSort={onSort} />
        <span>Файл</span>
        <span></span>
      </div>

      {annexes.map((annex) => {
        const annexOpen = expandedAnnexes.has(annex.id);
        return (
          <div className="annex-block" key={annex.id}>
            <div className="annex-row">
              <button className="icon-button" onClick={() => onToggleAnnex(annex.id)} title={annexOpen ? "Свернуть" : "Развернуть"}>
                {annexOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <FileArchive size={17} className="row-icon" />
              <span className="strong-cell">ДС {annex.id}</span>
              <EditableValue
                className="mono"
                type="date"
                value={annex.date}
                displayValue={formatDate(annex.date)}
                onCommit={(value) => onUpdateAnnex(annex, { date: value })}
              />
              <EditableValue
                className="mono amount"
                type="number"
                value={annex.amount ?? ""}
                displayValue={formatMoney(annex.amount)}
                onCommit={(value) => onUpdateAnnex(annex, { amount: value })}
              />
              <EditableValue
                type="select"
                value={annex.status}
                options={statusOptions.map((value) => ({ value, label: statusLabels[value] }))}
                displayValue={<Badge type="status" value={annex.status} />}
                onCommit={(value) => onUpdateAnnex(annex, { status: value })}
              />
              <EditableValue
                type="select"
                value={annex.payment_status}
                options={paymentOptions.map((value) => ({ value, label: paymentLabels[value] }))}
                displayValue={<Badge type="payment" value={annex.payment_status} />}
                onCommit={(value) => onUpdateAnnex(annex, paymentPatch(annex, value))}
              />
              <PartialPaymentValue
                document={annex}
                onCommit={(value) => onUpdateAnnex(annex, { partial_payment_amount: value })}
              />
              <FileCell document={annex} onReplace={() => onReplaceAnnexFile(annex)} />
              <button className="icon-button danger push-right" title="Удалить ДС" onClick={() => onDeleteAnnex(annex.id)}>
                <Trash2 size={15} />
              </button>
            </div>
            {annexOpen && (
              <div className="tree-children tight">
                <SecondaryDocumentsTable documents={annex.documents || []} onUpdate={onUpdateDocument} onReplaceFile={onReplaceDocumentFile} onDelete={onDeleteDocument} />
              </div>
            )}
          </div>
        );
      })}
      {annexes.length === 0 && <div className="empty-state">Доп. соглашений пока нет</div>}
    </div>
  );
}

function SecondaryDocumentsTable({ documents, onUpdate, onReplaceFile, onDelete }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: "date", direction: "desc" });
  const rows = useMemo(() => {
    const filtered = filter === "all" ? documents : documents.filter((doc) => doc.doc_type === filter);
    return sortRows(filtered, sort);
  }, [documents, filter, sort]);

  return (
    <div className="secondary-table">
      <div className="mini-toolbar">
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Все типы</option>
          {docTypeOptions.map((type) => <option key={type} value={type}>{docTypeLabels[type]}</option>)}
        </select>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <SortableTh label="Тип" field="doc_type" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <SortableTh label="Номер" field="number" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <SortableTh label="Дата" field="date" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <SortableTh label="Сумма" field="amount" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <SortableTh label="Статус" field="status" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <SortableTh label="Оплата" field="payment_status" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <SortableTh label="Оплачено" field="partial_payment_amount" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            <th>Файл</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((doc) => (
            <tr key={doc.id}>
              <td>
                <EditableValue
                  type="select"
                  value={doc.doc_type}
                  options={docTypeOptions.map((value) => ({ value, label: docTypeLabels[value] }))}
                  displayValue={<><DocIcon type={doc.doc_type} /> {docTypeLabels[doc.doc_type]}</>}
                  onCommit={(value) => onUpdate(doc, { doc_type: value })}
                />
              </td>
              <td>
                <EditableValue
                  className="mono"
                  value={doc.number}
                  emptyValue="—"
                  onCommit={(value) => onUpdate(doc, { number: value })}
                />
              </td>
              <td>
                <EditableValue
                  className="mono"
                  type="date"
                  value={doc.date}
                  displayValue={formatDate(doc.date)}
                  onCommit={(value) => onUpdate(doc, { date: value })}
                />
              </td>
              <td>
                <EditableValue
                  className="mono"
                  type="number"
                  value={doc.amount ?? ""}
                  displayValue={formatMoney(doc.amount)}
                  onCommit={(value) => onUpdate(doc, { amount: value })}
                />
              </td>
              <td>
                <EditableValue
                  type="select"
                  value={doc.status}
                  options={statusOptions.map((value) => ({ value, label: statusLabels[value] }))}
                  displayValue={<Badge type="status" value={doc.status} />}
                  onCommit={(value) => onUpdate(doc, { status: value })}
                />
              </td>
              <td>
                <EditableValue
                  type="select"
                  value={doc.payment_status}
                  options={paymentOptions.map((value) => ({ value, label: paymentLabels[value] }))}
                  displayValue={<Badge type="payment" value={doc.payment_status} />}
                  onCommit={(value) => onUpdate(doc, paymentPatch(doc, value))}
                />
              </td>
              <td>
                <PartialPaymentValue
                  document={doc}
                  onCommit={(value) => onUpdate(doc, { partial_payment_amount: value })}
                />
              </td>
              <td><FileCell document={doc} onReplace={() => onReplaceFile(doc)} /></td>
              <td>
                <button className="icon-button danger" title="Удалить документ" onClick={() => onDelete(doc.id)}>
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <EmptyRow columns={9} text="Документов нет" />}
        </tbody>
      </table>
    </div>
  );
}

function Registry({ onOpenObject, refreshKey }) {
  const [rows, setRows] = useState([]);
  const [sort, setSort] = useState({ key: "date", direction: "desc" });
  const [filters, setFilters] = useState({ search: "", status: "all", payment: "all", docType: "all", category: "all" });

  useEffect(() => {
    api.listRegistryDocuments().then(setRows);
  }, [refreshKey]);

  const visibleRows = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      const text = `${row.object_name} ${row.contract_number} ${row.document_number || ""} ${row.annex_label || ""} ${docTypeLabels[row.doc_type] || ""}`.toLowerCase();
      return (!search || text.includes(search))
        && (filters.status === "all" || row.status === filters.status)
        && (filters.payment === "all" || row.payment_status === filters.payment)
        && (filters.docType === "all" || row.doc_type === filters.docType)
        && (filters.category === "all" || row.category === filters.category);
    });
    return sortRows(filtered, sort);
  }, [rows, filters, sort]);

  return (
    <section className="panel">
      <div className="registry-filters">
        <label className="search-box">
          <Search size={16} />
          <input placeholder="Поиск по объекту, договору, типу" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        </label>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="all">Все статусы</option>
          {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
        <select value={filters.payment} onChange={(event) => setFilters({ ...filters, payment: event.target.value })}>
          <option value="all">Любая оплата</option>
          {paymentOptions.map((status) => <option key={status} value={status}>{paymentLabels[status]}</option>)}
        </select>
        <select value={filters.docType} onChange={(event) => setFilters({ ...filters, docType: event.target.value })}>
          <option value="all">Все типы</option>
          <option value="contract">Договор</option>
          <option value="annex">Доп. соглашение</option>
          {docTypeOptions.map((type) => <option key={type} value={type}>{docTypeLabels[type]}</option>)}
        </select>
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="all">Все категории</option>
          <option value="primary">Первичные</option>
          <option value="secondary">Вторичные</option>
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <SortableTh label="Объект" field="object_name" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Договор" field="contract_number" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="ДС" field="annex_label" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Тип" field="doc_type" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Номер док." field="document_number" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Категория" field="category" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Дата" field="date" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Сумма" field="amount" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Статус" field="status" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Оплата" field="payment_status" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
              <SortableTh label="Оплачено" field="partial_payment_amount" sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={`${row.source_type}-${row.source_id}-${row.annex_id || 0}`} className="clickable-row" onClick={() => onOpenObject(row.object_id)}>
                <td className="strong-cell">{row.object_name}</td>
                <td>{row.contract_number || "—"}</td>
                <td>{row.annex_label || "—"}</td>
                <td><DocIcon type={row.doc_type} /> {docTypeLabels[row.doc_type]}</td>
                <td className="mono">{row.document_number || "—"}</td>
                <td>{categoryLabels[row.category]}</td>
                <td className="mono">{formatDate(row.date)}</td>
                <td className="mono">{formatMoney(row.amount)}</td>
                <td><Badge type="status" value={row.status} /></td>
                <td><Badge type="payment" value={row.payment_status} /></td>
                <td className="mono">{row.payment_status === "partial" ? formatMoney(row.partial_payment_amount) : "—"}</td>
              </tr>
            ))}
            {visibleRows.length === 0 && <EmptyRow columns={11} text="По фильтрам ничего не найдено" />}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DocumentWizard({ initialObjectId, initialContractId, initialAnnexId, objects, onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(initialContractId ? "secondary" : "contract");
  const [parentType, setParentType] = useState(initialAnnexId ? "annex" : "contract");
  const [objectId, setObjectId] = useState(initialObjectId || objects[0]?.id || "");
  const [objectDetails, setObjectDetails] = useState(null);
  const [contractId, setContractId] = useState(initialContractId || "");
  const [annexId, setAnnexId] = useState(initialAnnexId || "");
  const [docType, setDocType] = useState("act");
  const [form, setForm] = useState({
    number: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    status: "na",
    payment_status: "unpaid",
    partial_payment_amount: "",
    comment: "",
    comment_color: "pink",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!objectId) {
      setObjectDetails(null);
      return;
    }
    api.getObjectDetails(Number(objectId)).then((details) => {
      setObjectDetails(details);
      if (!contractId && details?.contracts?.length) {
        setContractId(details.contracts[0].id);
      }
    });
  }, [objectId]);

  const selectedContract = objectDetails?.contracts?.find((contract) => contract.id === Number(contractId));
  const annexes = selectedContract?.annexes || [];

  useEffect(() => {
    if (parentType === "annex" && !annexId && annexes.length) {
      setAnnexId(annexes[0].id);
    }
  }, [parentType, contractId, annexes.length]);

  async function chooseFile() {
    const selected = await api.selectFile();
    if (selected) setFile(selected);
  }

  function canSave() {
    if (!objectId) return false;
    if (category === "contract" || category === "commercial_proposal") return true;
    if (!contractId) return false;
    if (category === "secondary" && parentType === "annex") return Boolean(annexId);
    return true;
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const base = {
        date: form.date,
        amount: form.amount,
        status: form.status,
        payment_status: form.payment_status,
        partial_payment_amount: form.partial_payment_amount,
        sourceFilePath: file?.sourceFilePath || null,
        original_filename: file?.originalFilename || null,
      };

      if (category === "commercial_proposal") {
        await api.createCommercialProposal({
          ...base,
          object_id: Number(objectId),
          number: form.number,
          comment: form.comment,
        });
      } else if (category === "contract") {
        await api.createContract({
          ...base,
          object_id: Number(objectId),
          number: form.number,
          comment: form.comment,
          comment_color: form.comment_color,
        });
      } else if (category === "annex") {
        await api.createAnnex({
          ...base,
          contract_id: Number(contractId),
        });
      } else {
        await api.createSecondaryDocument({
          ...base,
          parent_type: parentType,
          parent_id: Number(parentType === "annex" ? annexId : contractId),
          doc_type: docType,
          number: form.number,
        });
      }
      onSaved({ objectId: Number(objectId) });
    } catch (err) {
      setError(err.message || "Не удалось сохранить документ");
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal wizard document-form" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <h2>Добавление документа</h2>
            <p>Все атрибуты назначаются здесь до сохранения</p>
          </div>
          <button className="icon-button" type="button" title="Закрыть" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="notice error">{error}</div>}

        <div className="form-section">
          <button className="upload-target compact-upload" type="button" onClick={chooseFile}>
            <Upload size={22} />
            <strong>{file ? file.originalFilename : "Выбрать файл"}</strong>
            <span>Файл можно добавить сейчас или оставить запись только с атрибутами</span>
          </button>
        </div>

        <div className="form-section choice-grid">
          <ChoiceCard active={category === "commercial_proposal"} icon={<FileInput />} title="КП" text="Коммерческое предложение до договора" onClick={() => setCategory("commercial_proposal")} />
          <ChoiceCard active={category === "contract"} icon={<FileText />} title="Договор" text="Первичный документ объекта" onClick={() => setCategory("contract")} />
          <ChoiceCard active={category === "annex"} icon={<FileArchive />} title="Доп. соглашение" text="Первичный документ договора" onClick={() => setCategory("annex")} />
          <ChoiceCard active={category === "secondary"} icon={<ReceiptText />} title="Вторичный документ" text="Акты, счета, отчёты и прочее" onClick={() => setCategory("secondary")} />
        </div>

        <div className="form-section wizard-grid">
          <label>
            Объект
            <select value={objectId} onChange={(event) => { setObjectId(event.target.value); setContractId(""); setAnnexId(""); }}>
              <option value="">Выберите объект</option>
              {objects.map((object) => <option key={object.id} value={object.id}>{object.name}</option>)}
            </select>
          </label>

          {category !== "contract" && category !== "commercial_proposal" && (
            <label>
              Договор
              <select value={contractId} onChange={(event) => { setContractId(event.target.value); setAnnexId(""); }}>
                <option value="">Выберите договор</option>
                {(objectDetails?.contracts || []).map((contract) => (
                  <option key={contract.id} value={contract.id}>{contract.number || `Договор #${contract.id}`}</option>
                ))}
              </select>
            </label>
          )}

          {category === "secondary" && (
            <>
              <label>
                Тип вторичного документа
                <select value={docType} onChange={(event) => setDocType(event.target.value)}>
                  {docTypeOptions.map((type) => <option key={type} value={type}>{docTypeLabels[type]}</option>)}
                </select>
              </label>
              <div className="segmented">
                <button type="button" className={parentType === "contract" ? "active" : ""} onClick={() => setParentType("contract")}>К договору</button>
                <button type="button" className={parentType === "annex" ? "active" : ""} onClick={() => setParentType("annex")}>К ДС</button>
              </div>
              {parentType === "annex" && (
                <label>
                  Доп. соглашение
                  <select value={annexId} onChange={(event) => setAnnexId(event.target.value)}>
                    <option value="">Выберите ДС</option>
                    {annexes.map((annex) => <option key={annex.id} value={annex.id}>ДС {annex.id} от {formatDate(annex.date)}</option>)}
                  </select>
                </label>
              )}
            </>
          )}
        </div>

        <div className="form-section wizard-grid">
          {(category === "contract" || category === "commercial_proposal" || category === "secondary") && (
            <>
              <label>
                {category === "commercial_proposal" ? "Номер КП" : category === "secondary" ? "Номер документа" : "Номер договора"}
                <input value={form.number} onChange={(event) => setForm({ ...form, number: event.target.value })} />
              </label>
              {category !== "secondary" && (
                <>
                  <label>
                    {category === "commercial_proposal" ? "Комментарий" : "Комментарий-метка"}
                    <input maxLength={24} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
                  </label>
                  {category === "contract" && (
                    <div className="segmented">
                      <button type="button" className={form.comment_color === "pink" ? "active pink" : ""} onClick={() => setForm({ ...form, comment_color: "pink" })}>Розовый</button>
                      <button type="button" className={form.comment_color === "violet" ? "active violet" : ""} onClick={() => setForm({ ...form, comment_color: "violet" })}>Фиолетовый</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          <label>
            Дата
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label>
            Сумма
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </label>
          <label>
            Статус согласования
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
            </select>
          </label>
          {category !== "commercial_proposal" && (
            <label>
              Статус оплаты
              <select value={form.payment_status} onChange={(event) => setForm({ ...form, ...paymentPatch(form, event.target.value) })}>
                {paymentOptions.map((status) => <option key={status} value={status}>{paymentLabels[status]}</option>)}
              </select>
            </label>
          )}
          {category !== "commercial_proposal" && form.payment_status === "partial" && (
            <label>
              Сумма частичной оплаты
              <input type="number" min="0" step="0.01" value={form.partial_payment_amount} onChange={(event) => setForm({ ...form, partial_payment_amount: event.target.value })} />
            </label>
          )}
        </div>

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>Отмена</button>
          <button className="text-button" type="submit" disabled={!canSave()}><Save size={16} /> Сохранить</button>
        </div>
      </form>
    </div>
  );
}

function EditableValue({ value, displayValue, emptyValue = "—", prefix = "", type = "text", options = [], className = "", onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  async function commit(nextValue = draft) {
    setEditing(false);
    const normalized = type === "number" && nextValue !== "" ? Number(nextValue) : nextValue;
    if (String(value ?? "") === String(normalized ?? "")) return;
    await onCommit(normalized);
  }

  function cancel() {
    setDraft(value ?? "");
    setEditing(false);
  }

  if (editing) {
    if (type === "select") {
      return (
        <select
          className={`edit-control ${className}`}
          value={draft}
          autoFocus
          onBlur={(event) => commit(event.target.value)}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancel();
          }}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      );
    }

    return (
      <input
        className={`edit-control ${className}`}
        type={type}
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") cancel();
        }}
      />
    );
  }

  const content = displayValue ?? `${prefix}${value || emptyValue}`;
  return (
    <button className={`editable-value ${className}`} type="button" title="Нажмите, чтобы редактировать" onClick={() => setEditing(true)}>
      {content}
    </button>
  );
}

function ChoiceCard({ active, icon, title, text, onClick }) {
  return (
    <button type="button" className={`choice-card ${active ? "active" : ""}`} onClick={onClick}>
      {icon}
      <strong>{title}</strong>
      <span>{text}</span>
    </button>
  );
}

function Badge({ type, value }) {
  const label = type === "payment" ? paymentLabels[value] : statusLabels[value];
  return <span className={`badge ${type}-${value}`}>{label}</span>;
}

function DocIcon({ type }) {
  if (type === "commercial_proposal") return <FileInput size={16} className="inline-icon" />;
  if (type === "contract") return <FileText size={16} className="inline-icon" />;
  if (type === "annex") return <FileArchive size={16} className="inline-icon" />;
  if (type === "invoice" || type === "invoice_facture") return <ReceiptText size={16} className="inline-icon" />;
  if (type === "act") return <FileCheck2 size={16} className="inline-icon" />;
  if (type === "outgoing_letter") return <FileInput size={16} className="inline-icon" />;
  return <Archive size={16} className="inline-icon" />;
}

function SortableTh({ label, field, sort, onSort }) {
  return (
    <th>
      <button className="sort-button" onClick={() => onSort(field)}>
        {label}
        {sort.key === field && <span>{sortArrow(sort)}</span>}
      </button>
    </th>
  );
}

function SortableDiv({ label, field, sort, onSort }) {
  return (
    <button className="sort-button header-cell" onClick={() => onSort(field)}>
      {label}
      {sort.key === field && <span>{sortArrow(sort)}</span>}
    </button>
  );
}

function EmptyRow({ columns, text }) {
  return (
    <tr>
      <td colSpan={columns} className="empty-cell">{text}</td>
    </tr>
  );
}

export default App;
