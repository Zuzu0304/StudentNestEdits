import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib_api.js";
import ChatCenter from './ChatCenter.jsx';
import MarketplaceAdmin from './MarketplaceAdmin.jsx';
import "./AdminHub.css";

const INITIAL_PROPERTIES = []

const INITIAL_USERS = []

const INITIAL_REPORTS = []

const currency = (value) => `₦${Number(value).toLocaleString("en-NG")}`;

function StatCard({ icon, label, value, hint }) {
  return (
    <div className='admin-stat-card'>
      <div className='admin-stat-top'>
        <span className='admin-stat-icon'>{icon}</span>
        <span className='admin-stat-hint'>{hint}</span>
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function AdminHub() {
  const [section, setSection] = useState("overview");
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [liveSummary, setLiveSummary] = useState(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [inspections, setInspections] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [inspectorForm, setInspectorForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [creatingInspector, setCreatingInspector] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [confirmedPayments, setConfirmedPayments] = useState([]);
  const [inspectionDetails, setInspectionDetails] = useState(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [selectedInspectors, setSelectedInspectors] = useState({});

  useEffect(() => { const handler=e=>viewInspectionDetails(e.detail); window.addEventListener('studentnest-open-inspection',handler); return()=>window.removeEventListener('studentnest-open-inspection',handler); }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch("/moderation/dashboard"),
      apiFetch("/admin/properties/pending"),
      apiFetch("/admin/inspections"),
      apiFetch("/admin/users"),
      apiFetch("/reports/admin"),
      apiFetch("/moderation/reviews"),
      apiFetch("/admin/payments/disputes"),
      apiFetch("/admin/inspectors"),
      apiFetch("/admin/payments/transactions?status=confirmed"),
    ])
      .then(([d, p, i, u, r, rv, ds, ag, cp]) => {
        if (cancelled) return;
        setLiveSummary(d.summary || null);
        setProperties(
          (p.properties || []).map((x) => ({
            id: x.id,
            name: x.title,
            area: [x.area, x.city].filter(Boolean).join(", "),
            provider: x.provider_name || "Provider",
            type: x.property_type || "",
            rent: x.rent,
            status: x.listing_status === "approved" ? "Approved" : x.listing_status === "rejected" ? "Rejected" : x.inspection_status === "completed" ? "Reviewed" : "Awaiting inspection",
            verified: Boolean(x.is_verified),
            inspectionStatus: x.inspection_status || null,
            inspectionResult: x.inspection_result || null,
            inspectionId: x.inspection_id || null,
            inspectionInspector: x.inspection_agent_name || null,
            inspectionInspectorEmail: x.inspection_agent_email || null,
            providerEmail: x.provider_email || null,
            providerPhone: x.provider_phone || null,
            views: x.views || 0,
          })),
        );
        setInspections(i.inspections || []);
        setUsers(
          (u.users || []).map((x) => ({
            id: x.id,
            name: x.full_name,
            email: x.email,
            role: String(x.role).replace(/^./, (c) => c.toUpperCase()),
            status: x.is_active ? "Active" : "Suspended",
            joined: new Date(x.created_at).toLocaleDateString(),
          })),
        );
        setReports(
          (r.reports || []).map((x) => ({
            id: `R-${x.id}`,
            subject: x.reason,
            reporter: x.reporter_name || "User",
            target: `${x.target_type} #${x.target_id}`,
            priority: x.priority,
            status: x.status,
          })),
        );
        setReviews(rv.reviews || []);
        setDisputes(ds.disputes || []);
        setInspectors(ag.inspectors || []);
        setConfirmedPayments(cp.transactions || []);
      })
      .catch((e) => {
        if (!cancelled) notify(e.message);
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const filteredProperties = useMemo(
    () =>
      properties.filter((p) =>
        `${p.name} ${p.area} ${p.provider}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [properties, query],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        `${u.name} ${u.email} ${u.role}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [users, query],
  );

  const updateProperty = async (id, status) => {
    try {
      const decision = status === "Approved" ? "approve" : "reject";
      const d = await apiFetch(`/admin/properties/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      setProperties((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status, verified: status === "Approved" }
            : item,
        ),
      );
      notify(d.message);
    } catch (e) {
      notify(e.message);
    }
  };

  const viewInspectionDetails = async (propertyId) => {
    setInspectionLoading(true);
    try { const data = await apiFetch(`/admin/properties/${propertyId}/inspection-details`); setInspectionDetails(data.inspections || []); }
    catch (e) { notify(e.message); }
    finally { setInspectionLoading(false); }
  };

  const toggleUser = async (id) => {
    const current = users.find((u) => u.id === id);
    if (!current) return;
    try {
      const d = await apiFetch(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: current.status === "Suspended" }),
      });
      setUsers((items) =>
        items.map((user) =>
          user.id === id
            ? {
                ...user,
                status: current.status === "Suspended" ? "Active" : "Suspended",
              }
            : user,
        ),
      );
      notify(d.message);
    } catch (e) {
      notify(e.message);
    }
  };

  const resolveReport = async (id) => {
    const numeric = String(id).replace("R-", "");
    try {
      const d = await apiFetch(`/reports/admin/${numeric}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "resolved",
          resolution_note: "Resolved by administrator.",
        }),
      });
      setReports((items) =>
        items.map((report) =>
          report.id === id ? { ...report, status: "Resolved" } : report,
        ),
      );
      notify(d.message);
    } catch (e) {
      notify(e.message);
    }
  };

  const createInspector = async (event) => {
    event.preventDefault();
    if (inspectorForm.password.length < 8)
      return notify("Use at least 8 characters for the inspector password.");
    if (inspectorForm.password !== inspectorForm.confirmPassword)
      return notify("Inspector passwords do not match.");
    setCreatingInspector(true);
    try {
      const data = await apiFetch("/admin/inspectors", {
        method: "POST",
        body: JSON.stringify({
          fullName: inspectorForm.fullName,
          email: inspectorForm.email,
          phone: inspectorForm.phone,
          password: inspectorForm.password,
        }),
      });
      setUsers((items) => [
        {
          id: data.inspector.id,
          name: data.inspector.fullName,
          email: data.inspector.email,
          role: "Inspector",
          status: "Active",
          joined: new Date().toLocaleDateString(),
        },
        ...items,
      ]);
      setInspectorForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
      notify("StudentNest inspector created.");
    } catch (e) {
      notify(e.message);
    } finally {
      setCreatingInspector(false);
    }
  };

  const assignDisputeInspector = async (id, agent_id) => {
    if (!agent_id) return;
    try { const d=await apiFetch(`/admin/payment-disputes/${id}/assign-inspector`,{method:'POST',body:JSON.stringify({inspector_id:Number(agent_id)})}); setDisputes(items=>items.map(x=>x.id===id?{...x,agent_id:Number(agent_id),assigned_inspector_name:d.inspector?.full_name||x.assigned_inspector_name,status:'investigating'}:x)); notify(d.message); } catch(e){notify(e.message)}
  };
  const releaseConfirmedPayment = async (id) => { try { const d=await apiFetch(`/admin/payments/transactions/${id}/release`,{method:'POST'}); setConfirmedPayments(items=>items.filter(x=>x.id!==id)); notify(d.message); } catch(e){notify(e.message)} };
  const resolveDispute = async (id, decision) => {
    const note=window.prompt(decision==='refund'?'Refund note (optional):':'Resolution note (optional):')||'';
    try { const d=await apiFetch(`/admin/payments/disputes/${id}/resolve`,{method:'POST',body:JSON.stringify({decision,note})}); setDisputes(items=>items.filter(x=>x.id!==id)); notify(d.message); } catch(e){notify(e.message)}
  };

  const menu = [
    ["overview", "▦", "Overview"],
    ["messages", "✉", "Messages"],
    ["properties", "⌂", "Properties"],
    ["users", "♙", "Users"],
    ["verification", "✓", "Verified properties"],
    ["reports", "⚑", "Reports & Moderation"],
    ["disputes", "₦", "Payment Disputes"],
    ["marketplace", "◈", "Student Shop"],
    ["reviews", "★", "Reviews"],
    ["analytics", "◔", "Analytics"],
  ];

  return (
    <div className='admin-shell'>
      <aside className='admin-sidebar'>
        <div className='admin-brand'>
          <span className='admin-brand-mark'>S</span>
          <div>
            <strong>StudentNest</strong>
            <small>Admin Console</small>
          </div>
        </div>
        <nav className='admin-menu'>
          {menu.map(([key, icon, label]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => {
                setSection(key);
                setQuery("");
              }}>
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className='admin-sidebar-footer'>
          <span className='admin-avatar'>AD</span>
          <div>
            <strong>Administrator</strong>
            <small>Platform manager</small>
          </div>
        </div>
      </aside>

      <main className='admin-main'>
        <header className='admin-topbar'>
          <div>
            <span className='eyebrow'>StudentNest control center</span>
            <h1>{menu.find(([key]) => key === section)?.[2]}</h1>
          </div>
          <div className='admin-top-actions'>
            <a href='#home' className='btn btn-outline-ink'>
              Exit Admin
            </a>
          </div>
        </header>

        {section !== "overview" && section !== "analytics" && section !== "messages" && (
          <div className='admin-toolbar'>
            <div className='admin-search'>
              <span>⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${section}...`}
              />
            </div>
            <button className='admin-filter'>
              Filter <span>⌄</span>
            </button>
          </div>
        )}

        {section === "overview" && (
          <>
            <section className='admin-stats'>
              <StatCard
                icon='♙'
                label='Active Users'
                value={liveSummary?.active_users ?? "—"}
                hint={liveLoading ? "Loading" : "Live"}
              />
              <StatCard
                icon='⌂'
                label='Properties needing attention'
                value={liveSummary?.properties_needing_attention ?? "—"}
                hint={liveLoading ? "Loading" : "Live"}
              />
              <StatCard
                icon='▣'
                label='Open Reports'
                value={liveSummary?.open_reports ?? "—"}
                hint={liveLoading ? "Loading" : "Live"}
              />
              <StatCard
                icon='!'
                label='Pending Reviews'
                value={liveSummary?.pending_reviews ?? "—"}
                hint={liveLoading ? "Loading" : "Live"}
              />
            </section>
            <section className='admin-grid-two'>
              <div className='admin-panel'>
                <div className='panel-heading'>
                  <div>
                    <h2>Needs your attention</h2>
                    <p>Tasks waiting for an administrator.</p>
                  </div>
                  <button onClick={() => setSection("properties")}>
                    View all
                  </button>
                </div>
                <div className='attention-list'>
                  <button onClick={() => setSection("properties")}>
                    <span className='attention-icon gold'>⌂</span>
                    <div>
                      <strong>12 property listings</strong>
                      <small>are waiting for approval</small>
                    </div>
                    <b>›</b>
                  </button>
                  <button onClick={() => setSection("verification")}>
                    <span className='attention-icon plum'>✓</span>
                    <div>
                      <strong>Verified properties</strong>
                      <small>View approved listings and inspection records</small>
                    </div>
                    <b>›</b>
                  </button>
                  <button onClick={() => setSection("reports")}>
                    <span className='attention-icon red'>⚑</span>
                    <div>
                      <strong>3 reports</strong>
                      <small>need moderation</small>
                    </div>
                    <b>›</b>
                  </button>
                </div>
              </div>
              <div className='admin-panel'>
                <div className='panel-heading'>
                  <div>
                    <h2>Platform activity</h2>
                    <p>Last 7 days</p>
                  </div>
                  <button onClick={() => setSection("analytics")}>
                    Analytics
                  </button>
                </div>
                <div className='mini-chart'>
                  <div className='chart-bars'>
                    {[34, 52, 43, 68, 61, 82, 74].map((height, i) => (
                      <div key={i}>
                        <span style={{ height: `${height}%` }}></span>
                        <small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small>
                      </div>
                    ))}
                  </div>
                  <div className='chart-caption'>
                    <strong>+18.6%</strong>
                    <span>new activity this week</span>
                  </div>
                </div>
              </div>
            </section>
            <section className='admin-panel'>
              <div className='panel-heading'>
                <div>
                  <h2>Recent property submissions</h2>
                  <p>Latest listings entering moderation.</p>
                </div>
                <button onClick={() => setSection("properties")}>
                  Manage properties
                </button>
              </div>
              <PropertyTable
                properties={properties.slice(0, 3)}
                onApprove={updateProperty}
              />
            </section>
          </>
        )}

        {section === "messages" && <ChatCenter title="Admin messages"/>}

        {section === "properties" && (
          <section className='admin-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Property management</h2>
                <p>Review, approve and moderate accommodation listings.</p>
              </div>
              <span className='admin-count'>
                {filteredProperties.length} listings
              </span>
            </div>
            <PropertyTable
              properties={filteredProperties}
              onApprove={updateProperty}
            />
          </section>
        )}

        {section === "users" && (
          <section className='admin-panel'>
            <div className='panel-heading'>
              <div>
                <h2>User management</h2>
                <p>
                  Manage student, provider and internal inspection accounts.
                </p>
              </div>
              <span className='admin-count'>{filteredUsers.length} users</span>
            </div>
            <form className='agent-create-form' onSubmit={createInspector}>
              <div className='agent-form-heading'>
                <div>
                  <h3>Create inspector</h3>
                  <p>
                    Only administrators can create StudentNest field accounts.
                  </p>
                </div>
                <span className='agent-form-badge'>Internal role</span>
              </div>
              <div className='agent-form-grid'>
                <label>
                  <span>Full name</span>
                  <input
                    required
                    value={inspectorForm.fullName}
                    onChange={(e) =>
                      setInspectorForm((v) => ({ ...v, fullName: e.target.value }))
                    }
                    placeholder='e.g. Ibrahim Sani'
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    required
                    type='email'
                    value={inspectorForm.email}
                    onChange={(e) =>
                      setInspectorForm((v) => ({ ...v, email: e.target.value }))
                    }
                    placeholder='inspector@studentnest.com'
                  />
                </label>
                <label>
                  <span>Phone number</span>
                  <input
                    required
                    value={inspectorForm.phone}
                    onChange={(e) =>
                      setInspectorForm((v) => ({ ...v, phone: e.target.value }))
                    }
                    placeholder='0800 000 0000'
                  />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    required
                    minLength='8'
                    type='password'
                    value={inspectorForm.password}
                    onChange={(e) =>
                      setInspectorForm((v) => ({ ...v, password: e.target.value }))
                    }
                    placeholder='At least 8 characters'
                  />
                </label>
                <label>
                  <span>Confirm password</span>
                  <input
                    required
                    minLength='8'
                    type='password'
                    value={inspectorForm.confirmPassword}
                    onChange={(e) =>
                      setInspectorForm((v) => ({
                        ...v,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder='Repeat the password'
                  />
                </label>
                <button
                  className='agent-create-button'
                  disabled={creatingInspector}>
                  {creatingInspector
                    ? "Creating..."
                    : "＋ Create StudentNest Inspector"}
                </button>
              </div>
            </form>
            <div className='admin-table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className='table-person'>
                          <span className='table-avatar'>
                            {user.name
                              .split(" ")
                              .map((x) => x[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.role}</td>
                      <td>{user.joined}</td>
                      <td>
                        <span className={`status ${user.status.toLowerCase()}`}>
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className='table-action'
                          onClick={() => toggleUser(user.id)}>
                          {user.status === "Suspended"
                            ? "Reactivate"
                            : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "verification" && (
          <section className='admin-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Verified properties</h2>
                <p>Review properties that have passed inspection and were approved. Open the inspection record for the full report.</p>
              </div>
            </div>
            <div className='verification-cards'>
              {properties.filter(property => property.status === 'Approved').length ? properties.filter(property => property.status === 'Approved').map(property => (
                <article key={property.id} className='verification-card'>
                  <div className='verification-avatar'>{property.name?.slice(0, 1) || 'P'}</div>
                  <div className='verification-main'><strong>{property.name}</strong><span>{property.area} · {property.provider}</span><small>{property.status === 'Reviewed' ? `Inspection ${property.inspectionResult === 'pass' ? 'passed' : 'failed'}${property.inspectionInspector ? ` · ${property.inspectionInspector}` : ''}` : 'Awaiting field inspection'}</small></div>
                  <span className={`status ${property.status.toLowerCase().replace(/\s+/g,'-')}`}>{property.status}</span>
                  <div className='verification-actions'><button className='approve' onClick={() => viewInspectionDetails(property.id)}>See details</button></div>
                </article>
              )) : <div className='feature-empty'><p>No approved and verified properties yet. Approve inspected listings from Properties first.</p></div>}
            </div>
          </section>
        )}

        {section === "disputes" && (
          <section className='admin-panel'>
            <div className='panel-heading'><div><h2>Payment disputes & property investigations</h2><p>Review complaints, see the property and its initial inspector, assign an internal StudentNest inspector, and decide whether to refund or release protected funds.</p></div><span className='admin-count'>{disputes.length} open</span></div>
            {disputes.length ? <div className='dispute-admin-list'>{disputes.map(d=><article className='dispute-admin-card' key={d.id}>
              <div className='dispute-admin-main'><div className='dispute-admin-top'><span className='status pending'>{d.status}</span><strong>{d.property_title}</strong></div><p><strong>Student:</strong> {d.student_name} · {d.student_email}</p><p><strong>Complaint:</strong> {d.description}</p><p><strong>Initial inspector:</strong> {d.initial_inspection_agent||'Not recorded'}</p>{d.assigned_agent_name&&<p><strong>Investigation inspector:</strong> {d.assigned_agent_name}</p>}{d.agent_report&&<div className='agent-report-box'><strong>Inspector report ({d.agent_result==='found'?'Complaint found':'Complaint not found'})</strong><p>{d.agent_report}</p></div>}</div>
              <div className='dispute-admin-actions'><label>Assign inspector<select value={selectedInspectors[d.id] ?? d.agent_id ?? ''} onChange={e=>setSelectedInspectors(v=>({...v,[d.id]:e.target.value}))}><option value=''>Select inspector…</option>{inspectors.map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}</select></label><button className='approve' disabled={!selectedInspectors[d.id] && !d.agent_id} onClick={()=>assignDisputeInspector(d.id,selectedInspectors[d.id]||d.agent_id)}>Go</button><button className='approve' disabled={!d.agent_id||d.agent_result==='pending'} onClick={()=>resolveDispute(d.id,'refund')}>Refund student</button><button disabled={!d.agent_id||d.agent_result==='pending'} onClick={()=>resolveDispute(d.id,'release')}>Release to provider</button></div>
            </article>)}</div> : <div className='feature-empty'><p>No open payment disputes.</p></div>}
            <div className='confirmed-payment-admin'><div className='panel-heading'><div><h3>Payments ready for provider release</h3><p>Students who marked the property satisfactory are ready for payout.</p></div></div>{confirmedPayments.length?confirmedPayments.map(t=>{const rate=Number(t.commission_rate||5);const commission=Math.round(Number(t.total_amount||0)*rate)/100;const providerShare=Number(t.total_amount||0)-commission;return <div className='confirmed-payment-row' key={t.id}><div><strong>{t.property_title}</strong><span>{t.student_name} · {currency(t.total_amount)} total</span><span className='commission-split'>StudentNest keeps {currency(commission)} ({rate}%) · sends {currency(providerShare)} to provider</span></div><button className='approve' onClick={()=>releaseConfirmedPayment(t.id)}>Approve &amp; release funds</button></div>}):<p className='panel-copy'>No confirmed payments awaiting release.</p>}</div>
          </section>
        )}

        {section === "marketplace" && <MarketplaceAdmin />}

        {section === "reviews" && (
          <section className='admin-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Review moderation</h2>
                <p>
                  Student reviews are held for moderation before publication.
                </p>
              </div>
              <span className='admin-count'>{reviews.length} reviews</span>
            </div>
            <div className='admin-table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Student</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id}>
                      <td>{r.property_title}</td>
                      <td>{r.student_name}</td>
                      <td>★ {r.rating}/5</td>
                      <td>{r.comment || "—"}</td>
                      <td>{r.status}</td>
                      <td>
                        {r.status === "pending" && (
                          <button
                            className='table-action approve-text'
                            onClick={async () => {
                              try {
                                await apiFetch(`/moderation/reviews/${r.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ status: "published" }),
                                });
                                setReviews((v) =>
                                  v.map((x) =>
                                    x.id === r.id
                                      ? { ...x, status: "published" }
                                      : x,
                                  ),
                                );
                                notify("Review published.");
                              } catch (e) {
                                notify(e.message);
                              }
                            }}>
                            Publish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "reports" && (
          <section className='admin-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Reports & moderation</h2>
                <p>
                  Investigate user reports and keep the marketplace trustworthy.
                </p>
              </div>
            </div>
            <div className='admin-table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Reporter</th>
                    <th>Target</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.id}</strong>
                        <small className='table-description'>
                          {report.subject}
                        </small>
                      </td>
                      <td>{report.reporter}</td>
                      <td>{report.target}</td>
                      <td>
                        <span
                          className={`priority ${report.priority.toLowerCase()}`}>
                          {report.priority}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status ${report.status.toLowerCase()}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        {report.status === "Open" ? (
                          <button
                            className='table-action'
                            onClick={() => resolveReport(report.id)}>
                            Resolve
                          </button>
                        ) : (
                          <span className='muted'>Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {section === "analytics" && (
          <section className='analytics-grid'>
            <div className='admin-panel analytics-wide'>
              <div className='panel-heading'>
                <div>
                  <h2>Accommodation demand</h2>
                  <p>Property views and inquiries over the last 7 days.</p>
                </div>
                <span className='admin-count'>Live preview</span>
              </div>
              <div className='large-chart'>
                {[48, 62, 56, 78, 71, 91, 84].map((height, i) => (
                  <div key={i}>
                    <span style={{ height: `${height}%` }}></span>
                    <small>
                      {
                        [
                          "16 Aug",
                          "17 Aug",
                          "18 Aug",
                          "19 Aug",
                          "20 Aug",
                          "21 Aug",
                          "22 Aug",
                        ][i]
                      }
                    </small>
                  </div>
                ))}
              </div>
            </div>
            <div className='admin-panel'>
              <div className='panel-heading'>
                <div>
                  <h2>Popular areas</h2>
                  <p>Most viewed locations.</p>
                </div>
              </div>
              <div className='rank-list'>
                {[
                  ["Yelwa", 82],
                  ["GRA", 67],
                  ["Wunti", 54],
                  ["Kofar Idi", 39],
                ].map(([name, value], i) => (
                  <div key={name}>
                    <span>{i + 1}</span>
                    <strong>{name}</strong>
                    <div>
                      <i style={{ width: `${value}%` }}></i>
                    </div>
                    <b>{value}%</b>
                  </div>
                ))}
              </div>
            </div>
            <div className='admin-panel'>
              <div className='panel-heading'>
                <div>
                  <h2>Platform health</h2>
                  <p>Current marketplace signals.</p>
                </div>
              </div>
              <div className='health-list'>
                <div>
                  <span>Listing approval rate</span>
                  <strong>91%</strong>
                </div>
                <div>
                  <span>Provider response rate</span>
                  <strong>84%</strong>
                </div>
                <div>
                  <span>Reported listings resolved</span>
                  <strong>96%</strong>
                </div>
                <div>
                  <span>Verified providers</span>
                  <strong>72%</strong>
                </div>
              </div>
            </div>
          </section>
        )}

        {inspectionDetails && <div className='admin-modal-backdrop' onClick={()=>setInspectionDetails(null)}><section className='admin-modal' onClick={e=>e.stopPropagation()}><button className='modal-close' onClick={()=>setInspectionDetails(null)}>×</button><p className='eyebrow'>StudentNest · Inspection record</p><h2>{inspectionDetails[0]?.property_title}</h2>{inspectionLoading?<p>Loading inspection details…</p>:inspectionDetails.map(i=><article className='inspection-detail-card' key={i.id}><div className='detail-grid'><span><b>Inspection</b> #{i.id}</span><span><b>Result</b> {i.result}</span><span><b>Status</b> {i.status}</span><span><b>Submitted</b> {i.submitted_at?new Date(i.submitted_at).toLocaleString():'Not submitted'}</span></div><div className='inspection-agent-detail'><strong>Inspecting agent</strong><span>{i.agent_name||'Not assigned'}</span><span>{i.agent_email||'No email recorded'}</span>{i.agent_phone&&<span>{i.agent_phone}</span>}</div><div className='inspection-checks'>{[['location_verified','Location'],['property_exists','Property exists'],['amenities_verified','Amenities'],['photos_verified','Photos'],['rent_verified','Rent'],['availability_verified','Availability'],['condition_verified','Condition']].map(([key,label])=><span key={key} className={i[key]?'check-pass':'check-fail'}>{i[key]?'✓':'×'} {label}</span>)}</div><div className='inspection-notes'><strong>Inspection notes</strong><p>{i.notes||'No notes supplied.'}</p></div><div className='inspection-provider-detail'><strong>Provider</strong><span>{i.provider_name} · {i.provider_email}</span>{i.provider_phone&&<span>{i.provider_phone}</span>}</div></article>)}</section></div>}

        {toast && <div className='admin-toast'>✓ {toast}</div>}
      </main>
    </div>
  );
}

function PropertyTable({ properties, onApprove }) {
  const openDetails = property => window.dispatchEvent(new CustomEvent('studentnest-open-inspection',{detail:property.id}));
  return <div className='admin-table-wrap'><table><thead><tr><th>Property</th><th>Provider</th><th>Rent</th><th>Status</th><th>Action</th></tr></thead><tbody>{properties.map(property=><tr key={property.id}><td><div className='table-person'><span className='property-thumb'>⌂</span><div><strong>{property.name}</strong><small>{property.area} · {property.type}</small></div></div></td><td>{property.provider}</td><td>{currency(property.rent)} <small className='table-description'>/ year</small></td><td><span className={`status ${property.status.toLowerCase().replace(/\s+/g,'-')}`}>{property.status}</span>{property.verified&&<span className='table-verified'>✓ Verified</span>}</td><td><div className='row-actions'>{property.status==='Awaiting inspection'&&<span className='table-muted'>Inspection pending</span>}{property.status==='Reviewed'&&<><button className='table-action' onClick={()=>openDetails(property)}>See details</button>{property.inspectionResult==='pass'&&<button className='table-action approve-text' onClick={()=>onApprove(property.id,'Approved')}>Approve & verify</button>}</>}{property.status==='Approved'&&<span className='table-verified'>✓ Verified</span>}</div></td></tr>)}</tbody></table></div>
}

export default AdminHub;
