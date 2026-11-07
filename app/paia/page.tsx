import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./paia.module.css";

export const metadata: Metadata = {
  title: "PAIA Manual | Maliks Group Hub",
  description: "Section 51 PAIA manual for Maliks Paint & Hardware trading as PowerBuild — draft pending Information Officer and legal approval.",
};

const guide = "https://inforegulator.org.za/paia/";
const fees = "https://inforegulator.org.za/paia-fees-structure-2/";
const download = "/legal/Maliks_Paint_Hardware_PowerBuild_PAIA_Manual_V1_1_DRAFT.pdf";

export default function PaiaManualPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/" aria-label="Back to Maliks Group Hub">
            <Image src="/legal/powerbuild-logo.png" alt="PowerBuild" width={52} height={52} priority />
            <span><strong>MALIKS GROUP HUB</strong><small>Governance & compliance</small></span>
          </Link>
          <Link className={styles.back} href="/">Back to Hub</Link>
        </header>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>PROMOTION OF ACCESS TO INFORMATION</span>
            <h1>PAIA Manual</h1>
            <p>Prepared under section 51 of the Promotion of Access to Information Act 2 of 2000, as amended, for Maliks Paint & Hardware, trading as PowerBuild, and its Maliks Group Hub platform.</p>
            <div className={styles.actions}>
              <a className={styles.download} href={download} target="_blank" rel="noopener noreferrer">View PAIA Manual (PDF)</a>
              <a className={styles.outline} href={guide} target="_blank" rel="noopener noreferrer">PAIA Guide & forms</a>
            </div>
          </div>
          <Image className={styles.heroLogo} src="/legal/powerbuild-logo.png" alt="PowerBuild branded Hub manual" width={176} height={176} />
        </section>
        <section className={styles.notice} aria-label="Publication status">
          <strong>Draft — legal details and approval pending</strong>
          <p>This is a preparation copy, not a final statutory publication. The Head Office address and general telephone are provided below. The exact registered legal entity and number, postal address, dedicated PAIA email, statutory Information Officer, processing disclosures and final approval are still outstanding.</p>
        </section>
        <div className={styles.mainGrid}>
          <article className={styles.paper}>
            <span className={styles.kicker}>01 / OWNERSHIP & GOVERNANCE</span>
            <h2>Responsible persons</h2>
            <div className={styles.people}>
              <div><strong>Msallikuti</strong><span>Owner / Admin</span></div>
              <div><strong>Azam Malik</strong><span>Owner / Admin</span></div>
              <div><strong>Moses Moyana</strong><span>Developer / Technician Admin</span></div>
              <div><strong>Information Officer</strong><span>Formal appointment and contact pending confirmation</span></div>
            </div>
            <p>Hub administrator roles are not statutory Information Officer appointments. Only an appropriately authorised person should decide whether records may be disclosed under PAIA.</p>
            <hr />
            <span className={styles.kicker}>HEAD OFFICE / GENERAL CONTACT</span>
            <h2>Maliks Paint &amp; Hardware · PowerBuild</h2>
            <p><strong>Head Office:</strong> 26 Jacobs Road, Chamdor, Krugersdorp, Gauteng, South Africa.</p>
            <p><strong>Telephone:</strong> <a href="tel:+27117628051">011 762 8051</a> · <strong>Website:</strong> <a href="https://maliks.co.za" target="_blank" rel="noopener noreferrer">maliks.co.za</a></p>
            <p>This manual lists the Head Office only. The official PAIA email address and statutory Information Officer details are still to be confirmed.</p>
            <hr />
            <span className={styles.kicker}>02 / WHAT RECORDS ARE HELD</span>
            <h2>Categories of records</h2>
            <ul className={styles.categories}>
              <li><b>Company and governance:</b> policies, approvals, administration and contracts.</li>
              <li><b>Store operations:</b> branch tasks, checklists, audit records and supporting documents.</li>
              <li><b>People:</b> employee records, roles, training, attendance and assessments where enabled.</li>
              <li><b>Sales and customers:</b> quotations, customer accounts, orders and payments where enabled.</li>
              <li><b>Stock and supply:</b> GRVs, stock counts, adjustments, returns, suppliers, transfers and movement records.</li>
              <li><b>Finance, transport and technical:</b> P&L, deliveries, vehicle records, user access and audit trails.</li>
            </ul>
            <p>These categories do not mean that every module is active, every record exists, or every record is open to public access.</p>
            <hr />
            <span className={styles.kicker}>03 / REQUESTING INFORMATION</span>
            <h2>How to submit a request</h2>
            <ol className={styles.steps}>
              <li>Download and complete the Regulator’s <a href={guide} target="_blank" rel="noopener noreferrer">Form 2 — Request for Access to Record</a>.</li>
              <li>Identify the requested record and the right that access is needed to exercise or protect; explain the connection.</li>
              <li>Send the form and any required authority to the confirmed Information Officer at the official PAIA address.</li>
              <li>Pay any prescribed fee only after receiving the appropriate notice; a decision is normally given within 30 days, subject to PAIA.</li>
              <li>If dissatisfied, use the Regulator’s <a href={guide} target="_blank" rel="noopener noreferrer">Form 5 complaint process</a> or applicable court remedy.</li>
            </ol>
            <hr />
            <span className={styles.kicker}>04 / PERSONAL INFORMATION</span>
            <h2>POPIA-related disclosures</h2>
            <p>Depending on enabled features, Maliks Group Hub can hold employee, candidate, customer, supplier, driver and system-user information needed for operations, accounts, verification, training, audit and security. Access is intended to be limited by role and branch.</p>
            <p>Actual service-provider recipients, cross-border data flows and security controls require verification against the production system. See the PDF manual for the full categories and required disclosures.</p>
            <hr />
            <span className={styles.kicker}>05 / STATUTORY FEES</span>
            <h2>Request fees</h2>
            <p>As published in the Information Regulator’s March 2026 private-body fee schedule, the standard request fee is <strong>R140</strong>, subject to statutory exemptions. A black-and-white A4 copy costs R2 per page. Other production and search fees may apply.</p>
            <a href={fees} target="_blank" rel="noopener noreferrer">See current official fee schedule</a>
          </article>
          <aside className={styles.side}>
            <div className={styles.sideCard}>
              <span className={styles.kicker}>DOCUMENT CONTROL</span>
              <h3>PAIA Manual • V1.1</h3>
              <dl>
                <dt>Issue date</dt><dd>06 November 2026</dd>
                <dt>Status</dt><dd>Draft — not approved</dd>
                <dt>Trading identity</dt><dd>Maliks Paint &amp; Hardware (t/a PowerBuild)</dd><dt>Registered legal entity</dt><dd>CIPC verification pending</dd><dt>Head Office</dt><dd>26 Jacobs Road, Chamdor, Krugersdorp</dd><dt>General telephone</dt><dd>011 762 8051</dd><dt>Website</dt><dd>maliks.co.za</dd>
                <dt>Information Officer</dt><dd>To be confirmed</dd>
                <dt>PAIA contact</dt><dd>Dedicated email and postal details pending</dd>
              </dl>
            </div>
            <div className={styles.sideCard}>
              <span className={styles.kicker}>OFFICIAL RESOURCES</span>
              <h3>Need to request a record?</h3>
              <p>Use the Information Regulator’s prescribed forms and guide. This page does not accept or lodge an official request.</p>
              <a href={guide} target="_blank" rel="noopener noreferrer">Forms 2, 3 and 5</a>
            </div>
            <div className={styles.sideCard}>
              <span className={styles.kicker}>CONTACT / APPOINTMENT</span>
              <h3>Publication checklist</h3>
              <p>Confirm the legal entity and CIPC number, Head Office postal address, dedicated PAIA email, statutory Information Officer, processing disclosures and final sign-off before publishing this as an approved policy.</p>
            </div>
          </aside>
        </div>
        <footer className={styles.footer}>
          <span>Maliks Group Hub · PowerBuild branded compliance draft</span>
          <span>Section 51 PAIA · V1.1 · 06 November 2026</span>
        </footer>
      </div>
    </main>
  );
}
