"use client";
import { useEffect, useMemo, useState } from "react";
type Step = {
  step_no: number;
  title: string;
  description: string;
  owner_role: string;
  frequency: string;
  due_offset_days: number;
  evidence_required: string;
  approval_required: boolean;
};
type Check = {
  id: string;
  text: string;
  owner_role: string;
  evidence_required: string;
  required: boolean;
  checked: boolean;
};
type Doc = {
  id: number;
  title: string;
  document_type: string;
  department: string;
  workspace: string;
  owner: string;
  review_date: string;
  notes: string;
  file_name: string;
  mime_type: string;
  size: number;
  status: string;
  ai_summary: string;
  workflow: Step[];
  checklist: Check[];
};
type W = { name: string };
type Resource = {
  id: number;
  label: string;
  resource_type: string;
  file_name: string;
  size: number;
};
type TrainingRecord = {
  id: number;
  member_email: string;
  member_name: string;
  status: string;
  signature_name: string;
  read_at: string;
  trained_at: string;
  competency_status: string;
};
type TeamMember = { name: string; email: string; role?: string };
const kinds = ["SOP", "Manual", "Policy", "Checklist", "Form"],
  departments = [
    "Operations",
    "Receiving",
    "Dispatch",
    "Sales",
    "Wholesale",
    "Finance",
    "HR / Staffing",
    "Stock Control",
    "Safety",
    "Maintenance",
  ],
  today = () => new Date().toISOString().slice(0, 10);
export default function SopLibrary({
  onTasksChanged,
  teamMembers = [],
  currentUser,
}: {
  onTasksChanged?: () => void;
  teamMembers?: TeamMember[];
  currentUser?: { name: string; email: string };
}) {
  const [docs, setDocs] = useState<Doc[]>([]),
    [workspaces, setWorkspaces] = useState<W[]>([]),
    [selected, setSelected] = useState<Doc | null>(null),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState(false),
    [working, setWorking] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [query, setQuery] = useState(""),
    [newCheck, setNewCheck] = useState(""),
    [resources, setResources] = useState<Resource[]>([]),
    [training, setTraining] = useState<TrainingRecord[]>([]),
    [resourceLabel, setResourceLabel] = useState(""),
    [resourceType, setResourceType] = useState("GRV / Operational Form"),
    [resourceFile, setResourceFile] = useState<File | null>(null),
    [traineeEmail, setTraineeEmail] = useState(""),
    [signatureName, setSignatureName] = useState(""),
    [draft, setDraft] = useState({
      title: "",
      document_type: "SOP",
      department: "Operations",
      workspace: "Head Office",
      owner: "Operations",
      review_date: "",
      notes: "",
      file: null as File | null,
    });
  const load = async () => {
    const [a, b] = await Promise.all([
        fetch("/api/sops"),
        fetch("/api/workspaces"),
      ]),
      [j, k] = await Promise.all([a.json(), b.json()]);
    setDocs(j.documents || []);
    setWorkspaces(k.workspaces || []);
    setLoading(false);
  };
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, []);
  const refresh = async (id: number) => {
    const [r, resourceResponse, trainingResponse] = await Promise.all([
        fetch(`/api/sops/${id}`),
        fetch(`/api/sops/${id}/resources`),
        fetch(`/api/sops/${id}/training`),
      ]),
      [j, resourceJson, trainingJson] = await Promise.all([
        r.json(),
        resourceResponse.json(),
        trainingResponse.json(),
      ]);
    if (r.ok) setSelected(j.document);
    setResources(resourceJson.resources || []);
    setTraining(trainingJson.records || []);
  };
  const openDocument = (document: Doc) => {
    setSelected(document);
    setResources([]);
    setTraining([]);
    void refresh(document.id);
  };
  const upload = async () => {
    if (!draft.title || !draft.file) {
      setError("Enter a title and choose a file.");
      return;
    }
    setWorking("upload");
    const f = new FormData();
    Object.entries(draft).forEach(([k, v]) => {
      if (v !== null) f.append(k, v instanceof File ? v : String(v));
    });
    const r = await fetch("/api/sops", { method: "POST", body: f }),
      j = await r.json();
    if (r.ok) {
      setOpen(false);
      setNotice("Document uploaded to the SOP library");
      await load();
      await refresh(j.document.id);
    } else setError(j.error);
    setWorking("");
  };
  const generate = async () => {
    if (!selected) return;
    setWorking("generate");
    const r = await fetch(`/api/sops/${selected.id}/generate`, {
        method: "POST",
      }),
      j = await r.json();
    if (r.ok) {
      setNotice("AI workflow and checklist generated");
      await refresh(selected.id);
      await load();
    } else setError(j.error);
    setWorking("");
  };
  const activate = async () => {
    if (!selected) return;
    setWorking("activate");
    const r = await fetch(`/api/sops/${selected.id}/activate`, {
        method: "POST",
      }),
      j = await r.json();
    if (r.ok) {
      setNotice(`${j.created} tasks created from this SOP`);
      await refresh(selected.id);
      await load();
      onTasksChanged?.();
    } else setError(j.error);
    setWorking("");
  };
  const save = async (c: Check[]) => {
    if (!selected) return;
    setSelected({ ...selected, checklist: c });
    await fetch(`/api/sops/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checklist: c }),
    });
    await load();
  };
  const removeWorkflow = async () => {
    if (!selected || !window.confirm("Remove this generated workflow and checklist?")) return;
    setWorking("remove-workflow");
    const r = await fetch(`/api/sops/${selected.id}?mode=workflow`, { method: "DELETE" });
    if (r.ok) {
      setNotice("Generated workflow removed");
      await refresh(selected.id);
      await load();
    } else setError((await r.json()).error || "The workflow could not be removed.");
    setWorking("");
  };
  const removeDocument = async () => {
    if (!selected || !window.confirm("Remove this document from the SOP library? Permanent training history will be retained.")) return;
    setWorking("remove-document");
    const r = await fetch(`/api/sops/${selected.id}`, { method: "DELETE" });
    if (r.ok) {
      setSelected(null);
      setNotice("Document removed; training history retained for audit");
      await load();
    } else setError((await r.json()).error || "The document could not be removed.");
    setWorking("");
  };
  const uploadResource = async () => {
    if (!selected || !resourceLabel || !resourceFile) {
      setError("Enter a supporting document label and choose a file.");
      return;
    }
    setWorking("resource");
    const form = new FormData();
    form.append("label", resourceLabel);
    form.append("resource_type", resourceType);
    form.append("file", resourceFile);
    const r = await fetch(`/api/sops/${selected.id}/resources`, { method: "POST", body: form });
    if (r.ok) {
      setResourceLabel("");
      setResourceFile(null);
      setNotice("Supporting form/checklist stored inside this process");
      await refresh(selected.id);
    } else setError((await r.json()).error || "The supporting file could not be uploaded.");
    setWorking("");
  };
  const removeResource = async (resourceId: number) => {
    if (!selected || !window.confirm("Remove this supporting document?")) return;
    const r = await fetch(`/api/sops/${selected.id}/resources/${resourceId}`, { method: "DELETE" });
    if (r.ok) await refresh(selected.id);
  };
  const assignTraining = async () => {
    if (!selected || !traineeEmail) return;
    const member = teamMembers.find((item) => item.email === traineeEmail);
    if (!member) return;
    setWorking("training");
    const r = await fetch(`/api/sops/${selected.id}/training`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ member_email: member.email, member_name: member.name }),
    });
    if (r.ok) {
      setNotice(`Training assigned to ${member.name}`);
      await refresh(selected.id);
    } else setError((await r.json()).error || "Training could not be assigned.");
    setWorking("");
  };
  const acknowledge = async () => {
    if (!selected || !currentUser?.email || !signatureName.trim()) return;
    const r = await fetch(`/api/sops/${selected.id}/training`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "acknowledge",
        member_email: currentUser.email,
        signature_name: signatureName,
      }),
    });
    if (r.ok) {
      setSignatureName("");
      setNotice("Your read-and-understood acknowledgement was recorded permanently");
      await refresh(selected.id);
    } else setError((await r.json()).error || "Acknowledgement could not be recorded.");
  };
  const markTrained = async (memberEmail: string) => {
    if (!selected) return;
    const r = await fetch(`/api/sops/${selected.id}/training`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "assess", member_email: memberEmail, competency_status: "Competent" }),
    });
    if (r.ok) {
      setNotice("Training and competency recorded");
      await refresh(selected.id);
    }
  };
  const filtered = useMemo(
      () =>
        docs.filter((d) =>
          (d.title + d.department + d.workspace + d.document_type)
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
      [docs, query],
    ),
    total = docs.reduce((n, d) => n + d.checklist.length, 0),
    done = docs.reduce(
      (n, d) => n + d.checklist.filter((x) => x.checked).length,
      0,
    );
  return (
    <>
      <div className="moduleHero sopHero">
        <span>
          <small>CONTROLLED DOCUMENT CENTRE</small>
          <h2>SOPs, manuals and operational checklists</h2>
          <p>
            Upload procedures, generate accountable workflows and turn approved
            steps into assigned Hub tasks.
          </p>
        </span>
        <button onClick={() => setOpen(true)}>＋ Upload document</button>
      </div>
      <div className="sopKpis">
        <article>
          <i>▤</i>
          <span>
            <small>Controlled documents</small>
            <b>{docs.length}</b>
            <em>SOPs, manuals, policies and forms</em>
          </span>
        </article>
        <article>
          <i>✦</i>
          <span>
            <small>AI workflows ready</small>
            <b>{docs.filter((d) => d.workflow.length).length}</b>
            <em>Documents converted into steps</em>
          </span>
        </article>
        <article>
          <i>◇</i>
          <span>
            <small>Reviews due</small>
            <b>
              {
                docs.filter((d) => d.review_date && d.review_date <= today())
                  .length
              }
            </b>
            <em>Governance dates requiring attention</em>
          </span>
        </article>
        <article>
          <i>✓</i>
          <span>
            <small>Checklist progress</small>
            <b>{total ? Math.round((done / total) * 100) : 0}%</b>
            <em>
              {done} of {total} controls completed
            </em>
          </span>
        </article>
      </div>
      {notice && (
        <div className="sopNotice">
          ✓ {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      {error && (
        <div className="sopError">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      <section className="panel">
        <div className="panelhead">
          <span>
            <h2>Document library</h2>
            <p>
              One controlled source for company procedures and work instructions
            </p>
          </span>
          <div className="sopTools">
            <label>
              ⌕
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
              />
            </label>
            <button onClick={() => setOpen(true)}>Upload</button>
          </div>
        </div>
        {loading ? (
          <div className="loading">Loading documents…</div>
        ) : !filtered.length ? (
          <div className="moduleEmpty">
            <i>▤</i>
            <b>No SOPs or manuals uploaded yet</b>
            <p>
              Upload the first approved document to create its workflow and
              checklist.
            </p>
            <button onClick={() => setOpen(true)}>Upload document</button>
          </div>
        ) : (
          <div className="sopTable">
            <div className="sopRow sopHead">
              <span>Document</span>
              <span>Type</span>
              <span>Department</span>
              <span>Workspace</span>
              <span>Owner</span>
              <span>Review</span>
              <span>Status</span>
            </div>
            {filtered.map((d) => (
              <button
                className="sopRow"
                key={d.id}
                onClick={() => openDocument(d)}
              >
                <span>
                  <i>{d.mime_type.includes("pdf") ? "PDF" : "DOC"}</i>
                  <b>{d.title}</b>
                  <small>{d.file_name}</small>
                </span>
                <span>{d.document_type}</span>
                <span>{d.department}</span>
                <span>{d.workspace}</span>
                <span>{d.owner}</span>
                <span>{d.review_date || "Not set"}</span>
                <span>
                  <em className="sopStatus">{d.status}</em>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      {open && (
        <div className="overlay" onMouseDown={() => setOpen(false)}>
          <div className="crmModal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <span>
                <h2>Upload controlled document</h2>
                <p>Add an SOP, manual, policy, checklist or company form.</p>
              </span>
              <button onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="crmForm">
              <label>
                Document Title
                <input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                />
              </label>
              <label>
                Document Type
                <select
                  value={draft.document_type}
                  onChange={(e) =>
                    setDraft({ ...draft, document_type: e.target.value })
                  }
                >
                  {kinds.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Department
                <select
                  value={draft.department}
                  onChange={(e) =>
                    setDraft({ ...draft, department: e.target.value })
                  }
                >
                  {departments.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                Workspace
                <select
                  value={draft.workspace}
                  onChange={(e) =>
                    setDraft({ ...draft, workspace: e.target.value })
                  }
                >
                  {workspaces.map((x) => (
                    <option key={x.name}>{x.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Process Owner
                <input
                  value={draft.owner}
                  onChange={(e) =>
                    setDraft({ ...draft, owner: e.target.value })
                  }
                />
              </label>
              <label>
                Review Date
                <input
                  type="date"
                  value={draft.review_date}
                  onChange={(e) =>
                    setDraft({ ...draft, review_date: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Notes
                <input
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                />
              </label>
              <label className="wide sopDrop">
                Document File
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.rtf,.xls,.xlsx,.csv,.ppt,.pptx"
                  onChange={(e) =>
                    setDraft({ ...draft, file: e.target.files?.[0] || null })
                  }
                />
                <small>{draft.file ? draft.file.name : "Maximum 15MB"}</small>
              </label>
            </div>
            <footer>
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={upload}>
                {working === "upload" ? "Uploading…" : "Upload document"}
              </button>
            </footer>
          </div>
        </div>
      )}
      {selected && (
        <div
          className="overlay sopDetailOverlay"
          onMouseDown={() => setSelected(null)}
        >
          <div className="sopDetail" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <span>
                <em>
                  {selected.document_type} · {selected.department}
                </em>
                <h2>{selected.title}</h2>
                <p>
                  {selected.workspace} · Owner: {selected.owner}
                </p>
              </span>
              <div>
                <a href={`/api/sops/${selected.id}/file`} target="_blank">
                  Open document ↗
                </a>
                <button className="sopDanger" onClick={removeDocument}>
                  Remove document
                </button>
                <button onClick={() => setSelected(null)}>×</button>
              </div>
            </header>
            <div className="sopDetailBody">
              <section className="sopSummary">
                <div>
                  <h3>AI process summary</h3>
                  <p>
                    {selected.ai_summary ||
                      "Generate a workflow and checklist from this document."}
                  </p>
                </div>
                <div className="sopActions">
                  <button onClick={generate}>
                    ✦{" "}
                    {working === "generate"
                      ? "Reading document…"
                      : "Generate workflow + checklist"}
                  </button>
                  <button
                    className="activate"
                    disabled={!selected.workflow.length}
                    onClick={activate}
                  >
                    {working === "activate"
                      ? "Creating tasks…"
                      : "Create tasks from workflow"}
                  </button>
                  {!!selected.workflow.length && (
                    <button className="sopDanger" onClick={removeWorkflow}>
                      {working === "remove-workflow" ? "Removing…" : "Remove process"}
                    </button>
                  )}
                </div>
              </section>
              {!!selected.workflow.length && (
                <section className="workflowDiagramPanel">
                  <header>
                    <span>
                      <h3>Workflow diagram</h3>
                      <p>Generated directly from the uploaded controlled document</p>
                    </span>
                  </header>
                  <div className="workflowDiagram">
                    {selected.workflow.map((step, index) => (
                      <div className="workflowDiagramItem" key={`diagram-${step.step_no}`}>
                        <article>
                          <i>{step.step_no}</i>
                          <b>{step.title}</b>
                          <small>{step.owner_role}</small>
                          {step.approval_required && <em>Approval gate</em>}
                        </article>
                        {index < selected.workflow.length - 1 && <span aria-hidden="true">→</span>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <div className="sopTwoCol">
                <section>
                  <header>
                    <span>
                      <h3>Operational workflow</h3>
                      <p>{selected.workflow.length} controlled steps</p>
                    </span>
                  </header>
                  <div className="workflowSteps">
                    {selected.workflow.map((s) => (
                      <article key={s.step_no}>
                        <i>{s.step_no}</i>
                        <span>
                          <h4>
                            {s.title}
                            {s.approval_required && <em>Approval</em>}
                          </h4>
                          <p>{s.description}</p>
                          <div>
                            <b>{s.owner_role}</b>
                            <small>
                              {s.frequency} · Day +{s.due_offset_days}
                            </small>
                          </div>
                          <footer>Evidence: {s.evidence_required}</footer>
                        </span>
                      </article>
                    ))}
                    {!selected.workflow.length && (
                      <div className="sopBlank">No workflow generated yet.</div>
                    )}
                  </div>
                </section>
                <section>
                  <header>
                    <span>
                      <h3>SOP checklist</h3>
                      <p>
                        {selected.checklist.filter((x) => x.checked).length} of{" "}
                        {selected.checklist.length} completed
                      </p>
                    </span>
                  </header>
                  <div className="checklistItems">
                    {selected.checklist.map((c) => (
                      <label key={c.id} className={c.checked ? "done" : ""}>
                        <input
                          type="checkbox"
                          checked={c.checked}
                          onChange={() =>
                            void save(
                              selected.checklist.map((x) =>
                                x.id === c.id
                                  ? { ...x, checked: !x.checked }
                                  : x,
                              ),
                            )
                          }
                        />
                        <span>
                          <b>{c.text}</b>
                          <small>
                            {c.owner_role} · Evidence: {c.evidence_required}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="newCheck">
                    <input
                      value={newCheck}
                      onChange={(e) => setNewCheck(e.target.value)}
                      placeholder="Add a manual checklist control"
                    />
                    <button
                      onClick={() => {
                        if (!newCheck) return;
                        void save([
                          ...selected.checklist,
                          {
                            id: crypto.randomUUID(),
                            text: newCheck,
                            owner_role: selected.owner,
                            evidence_required: "Evidence to be attached",
                            required: true,
                            checked: false,
                          },
                        ]);
                        setNewCheck("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                </section>
              </div>
              <div className="sopTwoCol sopRecordsGrid">
                <section>
                  <header>
                    <span>
                      <h3>Forms, checklists and supporting records</h3>
                      <p>Keep GRV documents, receiving checklists and templates inside this process.</p>
                    </span>
                  </header>
                  <div className="sopResourceList">
                    {resources.map((resource) => (
                      <article key={resource.id}>
                        <span>
                          <b>{resource.label}</b>
                          <small>{resource.resource_type} · {resource.file_name}</small>
                        </span>
                        <a href={`/api/sops/${selected.id}/resources/${resource.id}`} target="_blank">Open</a>
                        <button onClick={() => void removeResource(resource.id)}>Remove</button>
                      </article>
                    ))}
                    {!resources.length && <div className="sopBlank">No supporting forms stored yet.</div>}
                  </div>
                  <div className="sopResourceForm">
                    <input value={resourceLabel} onChange={(e) => setResourceLabel(e.target.value)} placeholder="e.g. GRV document checklist" />
                    <select value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                      <option>GRV / Operational Form</option>
                      <option>Receiving Checklist</option>
                      <option>Training Material</option>
                      <option>Evidence Template</option>
                      <option>Other Supporting Record</option>
                    </select>
                    <input type="file" onChange={(e) => setResourceFile(e.target.files?.[0] || null)} />
                    <button onClick={uploadResource}>{working === "resource" ? "Uploading…" : "Store inside process"}</button>
                  </div>
                </section>
                <section>
                  <header>
                    <span>
                      <h3>Training and acknowledgement register</h3>
                      <p>Permanent proof of who read, signed, trained and passed competency.</p>
                    </span>
                  </header>
                  <div className="trainingAssign">
                    <select value={traineeEmail} onChange={(e) => setTraineeEmail(e.target.value)}>
                      <option value="">Choose team member</option>
                      {teamMembers.map((member) => <option value={member.email} key={member.email}>{member.name} · {member.role}</option>)}
                    </select>
                    <button onClick={assignTraining}>{working === "training" ? "Assigning…" : "Assign training"}</button>
                  </div>
                  <div className="trainingList">
                    {training.map((record) => (
                      <article key={record.id}>
                        <span>
                          <b>{record.member_name}</b>
                          <small>{record.status} · {record.competency_status}</small>
                        </span>
                        {record.status !== "Training completed" && (
                          <button onClick={() => void markTrained(record.member_email)}>Mark trained</button>
                        )}
                      </article>
                    ))}
                    {!training.length && <div className="sopBlank">No employees assigned yet.</div>}
                  </div>
                  {currentUser?.email && training.some((record) => record.member_email.toLowerCase() === currentUser.email.toLowerCase()) && (
                    <div className="trainingSignature">
                      <input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Type your full name as signature" />
                      <button onClick={acknowledge}>I have read and understand</button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
