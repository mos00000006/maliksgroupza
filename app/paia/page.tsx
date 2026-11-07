import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./paia.module.css";

export const metadata: Metadata = {
  title: "PAIA Manual | Maliks Group Hub",
  description:
    "Section 51 PAIA manual for Maliks Paint & Hardware trading as PowerBuild — draft awaiting legal and Information Officer confirmation.",
};

const manual = "/legal/Maliks_Paint_Hardware_PowerBuild_PAIA_Manual_V1_1_DRAFT.pdf";
const guide = "https://inforegulator.org.za/paia/";
const fees = "https://inforegulator.org.za/paia-fees-structure-2/";
const logo = "/legal/powerbuild-paia-logo.webp";

const recordGroups = [
  { number: "01", title: "Company & governance", detail: "Policies, corporate documents, contracts and approval registers." },
  { number: "02", title: "Store operations", detail: "Store tasks, checklists, audits and supporting documents." },
  { number: "03", title: "People & HR", detail: "Employment, training, attendance and assessments where enabled." },
  { number: "04", title: "Sales & customers", detail: "Quotations, orders, accounts and payment records where enabled." },
  { number: "05", title: "Stock & supply", detail: "GRVs, counts, adjustments, supplier returns and stock transfers." },
  { number: "06", title: "Finance & systems", detail: "Financial, delivery, vehicle, access-control and audit records." },
];

const steps = [
  { title: "Obtain the official request form", description: "Complete Form 2 — Request for Access to Record, available from the Information Regulator." },
  { title: "Describe the record and your right", description: "Identify the record, explain which right the request is needed to exercise or protect, and provide any required authority." },
  { title: "Submit to the Information Officer", description: "Send the form to the company's confirmed Information Officer at the official PAIA contact address once published." },
  { title: "Await the decision", description: "Pay prescribed fees only when formally notified. Decisions are normally made within 30 days, subject to PAIA." },
  { title: "Review or complain if needed", description: "Use the Information Regulator's Form 5 complaint process or an applicable court remedy." },
];

export default function PaiaManualPage() {
  return (
    <main className={styles.page} id="top">
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/" aria-label="Return to Maliks Group Hub">
            <span className={styles.brandIcon}>
              <Image src={logo} alt="PowerBuild" width={54} height={54} unoptimized priority />
            </span>
            <span className={styles.brandWords}>
              <strong>MALIKS GROUP HUB</strong>
              <small>POWERBUILD · GOVERNANCE CENTRE</small>
            </span>
          </Link>
          <div className={styles.topActions}>
            <span className={styles.topStatus}><span className={styles.statusDot} /> DRAFT MANUAL</span>
            <Link className={styles.back} href="/"><span aria-hidden="true">←</span> Back to Hub</Link>
          </div>
        </header>

        <section className={styles.hero} aria-labelledby="paia-heading">
          <div className={styles.heroCopy}>
            <div className={styles.heroEyebrow}><span className={styles.goldLine} /> LEGAL &amp; GOVERNANCE <span className={styles.heroNumber}>/ 01</span></div>
            <h1 id="paia-heading">Access to<br /><span>information.</span></h1>
            <p className={styles.heroTitle}>PAIA Manual <span>• Version 1.1</span></p>
            <p className={styles.heroDescription}>Our Section 51 manual explains the categories of information held by Maliks Paint &amp; Hardware, trading as PowerBuild, and how to request access to records through the appropriate legal process.</p>
            <div className={styles.heroButtons}>
              <a className={styles.primaryButton} href={manual} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true">↓</span> View PAIA Manual (PDF)
              </a>
              <a className={styles.secondaryButton} href={guide} target="_blank" rel="noopener noreferrer">Official PAIA guide <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className={styles.heroArtwork}>
            <div className={styles.logoPlate}>
              <Image src={logo} alt="PowerBuild logo" width={220} height={220} unoptimized priority className={styles.heroLogo} />
            </div>
            <div className={styles.heroSeal}><span>POWERBUILD</span><strong>DOCUMENT<br />CONTROL</strong><small>SECTION 51 · PAIA</small></div>
          </div>
        </section>

        <div className={styles.notice} role="note">
          <span className={styles.noticeSymbol} aria-hidden="true">!</span>
          <div className={styles.noticeCopy}>
            <strong>Draft document — not yet approved for statutory publication</strong>
            <p>The registered legal entity and number, statutory Information Officer, official PAIA contact details and final disclosures still require confirmation. This page and PDF are preparation copies.</p>
          </div>
          <a href="#document-control" className={styles.noticeLink}>See document status <span aria-hidden="true">↓</span></a>
        </div>

        <section className={styles.factRow} aria-label="Company information">
          <div className={styles.factCard}>
            <span className={styles.factIcon} aria-hidden="true">⌂</span>
            <div><span className={styles.factLabel}>HEAD OFFICE</span><strong>26 Jacobs Road</strong><small>Chamdor, Krugersdorp, Gauteng</small></div>
          </div>
          <div className={styles.factCard}>
            <span className={styles.factIcon} aria-hidden="true">☎</span>
            <div><span className={styles.factLabel}>GENERAL TELEPHONE</span><strong><a href="tel:+27117628051">011 762 8051</a></strong><small>Maliks Paint &amp; Hardware</small></div>
          </div>
          <div className={styles.factCard}>
            <span className={styles.factIcon} aria-hidden="true">↗</span>
            <div><span className={styles.factLabel}>COMPANY WEBSITE</span><strong><a href="https://maliks.co.za" target="_blank" rel="noopener noreferrer">maliks.co.za</a></strong><small>Trading as PowerBuild</small></div>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <div className={styles.contentMain}>
            <section className={styles.panel} id="governance">
              <div className={styles.panelHeader}><span className={styles.sectionIndex}>01</span><div><span className={styles.kicker}>OUR ORGANISATION</span><h2>Ownership &amp; administration</h2></div></div>
              <p className={styles.intro}>The following roles describe Maliks Group Hub administration. They do not by themselves establish statutory Information Officer appointments.</p>
              <div className={styles.peopleGrid}>
                <div className={styles.person}><span className={styles.avatar}>M</span><strong>Msallikuti</strong><small>Owner / Admin</small></div>
                <div className={styles.person}><span className={styles.avatar}>A</span><strong>Azam Malik</strong><small>Owner / Admin</small></div>
                <div className={styles.person}><span className={styles.avatar}>M</span><strong>Moses Moyana</strong><small>Developer / Technician Admin</small></div>
              </div>
              <div className={styles.footnote}><span aria-hidden="true">i</span> Statutory Information Officer: formal designation and contact details pending confirmation.</div>
            </section>

            <section className={styles.panel} id="records">
              <div className={styles.panelHeader}><span className={styles.sectionIndex}>02</span><div><span className={styles.kicker}>INFORMATION ACCESS</span><h2>Categories of records</h2></div></div>
              <p className={styles.intro}>The business and Hub may hold records in the following categories, depending on the modules in use.</p>
              <div className={styles.recordGrid}>
                {recordGroups.map(group => <div className={styles.record} key={group.number}><span>{group.number}</span><div><strong>{group.title}</strong><p>{group.detail}</p></div></div>)}
              </div>
              <p className={styles.smallPrint}>A category being listed does not imply that the information exists in every module or is automatically available to the public.</p>
            </section>

            <section className={styles.panel} id="requests">
              <div className={styles.panelHeader}><span className={styles.sectionIndex}>03</span><div><span className={styles.kicker}>STEP-BY-STEP</span><h2>How to request information</h2></div></div>
              <div className={styles.timeline}>
                {steps.map((item, i) => <div className={styles.timelineItem} key={item.title}><span className={styles.stepNumber}>{String(i+1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.description}</p></div></div>)}
              </div>
              <a className={styles.inlineLink} href={guide} target="_blank" rel="noopener noreferrer">Get the Information Regulator's forms <span aria-hidden="true">↗</span></a>
            </section>

            <section className={styles.panel} id="privacy">
              <div className={styles.panelHeader}><span className={styles.sectionIndex}>04</span><div><span className={styles.kicker}>PRIVACY &amp; FEES</span><h2>Personal information &amp; fees</h2></div></div>
              <div className={styles.twoCol}>
                <div><h3>POPIA-related disclosures</h3><p>Depending on enabled features, the Hub may process employee, candidate, customer, supplier, driver and system-user information for administration, verification, operations and security. Production processing disclosures and recipients must be verified before approval.</p></div>
                <div><h3>Access request fees</h3><p>The applicable prescribed fees and exemptions are determined by PAIA and the Information Regulator's current fee schedule. Requesters should only pay fees following the appropriate official notice.</p><a className={styles.inlineLink} href={fees} target="_blank" rel="noopener noreferrer">View official fee schedule <span aria-hidden="true">↗</span></a></div>
              </div>
            </section>
          </div>

          <div className={styles.sideColumn} id="document-control">
            <div className={styles.controlCard}>
              <div className={styles.controlHeader}><span className={styles.kicker}>DOCUMENT CONTROL</span><span className={styles.version}>V1.1</span></div>
              <h2>PAIA Manual</h2><p>Maliks Group Hub · PowerBuild</p>
              <div className={styles.controlRow}><span>Status</span><strong className={styles.pending}>Draft — not approved</strong></div>
              <div className={styles.controlRow}><span>Issue date</span><strong>06 November 2026</strong></div>
              <div className={styles.controlRow}><span>Registered entity</span><strong>CIPC confirmation pending</strong></div>
              <div className={styles.controlRow}><span>Information Officer</span><strong>To be confirmed</strong></div>
              <div className={styles.controlRow}><span>PAIA contact</span><strong>Email &amp; postal address pending</strong></div>
              <a className={styles.controlDownload} href={manual} target="_blank" rel="noopener noreferrer">Open the full PDF <span aria-hidden="true">↗</span></a>
            </div>
            <div className={styles.helpCard}>
              <span className={styles.kicker}>OFFICIAL RESOURCES</span>
              <h3>Need a record?</h3>
              <p>Use the Information Regulator's prescribed forms. This Hub page does not accept or lodge statutory requests.</p>
              <a href={guide} target="_blank" rel="noopener noreferrer">PAIA guide &amp; forms <span aria-hidden="true">↗</span></a>
            </div>
            <div className={styles.approvalCard}>
              <span className={styles.kicker}>BEFORE FINAL PUBLICATION</span>
              <h3>Approval checklist</h3>
              <p>Verify the legal entity and CIPC number, Information Officer, PAIA email and postal address, production data disclosures, and final sign-off.</p>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <span>© Maliks Paint &amp; Hardware · Trading as PowerBuild</span>
          <span>Maliks Group Hub / Governance Centre / PAIA V1.1 · Draft</span>
          <Link href="#top">Back to top ↑</Link>
        </footer>
      </div>
    </main>
  );
}
