"use client";

import { useEffect, useMemo, useState } from "react";

type CurrentHubUser = { name: string; email: string; role?: string; department?: string };
type Store = { id: number; name: string; type: string; region: string; manager: string };
type Attendance = {
  id: number;
  employee_id: number;
  workspace: string;
  attendance_date: string;
  status: "At work" | "Not at work" | "Late";
  absence_type: string;
  minutes_late: number;
  reason: string;
  recorded_by: string;
};
type Warning = {
  id: number;
  employee_id: number;
  workspace: string;
  warning_date: string;
  warning_level: "Verbal" | "Written" | "Final written";
  reason: string;
  details: string;
  issued_by: string;
  valid_until: string;
  acknowledgement: string;
  status: "Active" | "Withdrawn";
};
type HrRecord = {
  id: number;
  employee_id: number;
  workspace: string;
  record_type: "Leave" | "Leave Request" | "Training / Certification" | "Uniform / PPE" | "Company Vehicle" | "Company Phone / SIM" | "Company Asset" | "Employment Change" | "HR Note";
  title: string;
  record_date: string;
  end_date: string;
  status: string;
  reference: string;
  details: string;
  created_by: string;
};
type Employee = {
  id: number;
  employee_number: string;
  workspace: string;
  first_name: string;
  last_name: string;
  id_number: string;
  phone: string;
  email: string;
  job_title: string;
  department: string;
  start_date: string;
  employment_type: string;
  supervisor: string;
  employment_status: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  residential_address: string;
  probation_end_date: string;
  contract_end_date: string;
  today_attendance: Attendance | null;
  attendance_stats: { atWork: number; notAtWork: number; late: number; lateMinutes: number };
  warning_count: number;
  active_warning_count: number;
  hr_record_count: number;
};
type ApiData = {
  stores: Store[];
  workspace: string;
  employees: Employee[];
  attendance: Attendance[];
  warnings: Warning[];
  hrRecords: HrRecord[];
  summary: {
    total: number;
    atWork: number;
    notAtWork: number;
    late: number;
    unmarked: number;
    activeWarnings: number;
    currentLeave: number;
    issuedAssets: number;
    expiringTraining: number;
  };
  permissions: {
    canManageEmployees: boolean;
    canRecordAttendance: boolean;
    canIssueWarnings: boolean;
    canManageHrRecords: boolean;
    canSeeFullId?: boolean;
  };
  today: string;
};

type Tab = "Employees" | "Attendance History" | "Leave Requests" | "Company Property" | "Warnings" | "HR Records";

const blankEmployee = (workspace = "") => ({
  employeeNumber: "",
  workspace,
  firstName: "",
  lastName: "",
  idNumber: "",
  phone: "",
  email: "",
  jobTitle: "",
  department: "",
  startDate: "",
  employmentType: "Permanent",
  supervisor: "",
  employmentStatus: "Active",
  emergencyContactName: "",
  emergencyContactPhone: "",
  residentialAddress: "",
  probationEndDate: "",
  contractEndDate: "",
  notes: "",
});

const formatDate = (value: string) => {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
};
const employeeName = (employee: Employee) => `${employee.first_name} ${employee.last_name}`.trim();
const initials = (employee: Employee) => `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() || "ST";
const warningIsActive = (warning: Warning, today: string) => warning.status === "Active" && (!warning.valid_until || warning.valid_until >= today);

const isAttendedStatus = (status: Attendance["status"]) => status === "At work" || status === "Late";
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const startOfWeekIso = (todayValue: string) => {
  const date = new Date(`${todayValue}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return isoDate(date);
};
const monthKey = (value: string) => value.slice(0, 7);
const monthLabel = (key: string) => {
  const date = new Date(`${key}-01T12:00:00`);
  return date.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
};
const propertyRecordTypes = ["Uniform / PPE", "Company Vehicle", "Company Phone / SIM", "Company Asset"];
const leaveRecordTypes = ["Leave", "Leave Request"];

const CSS = `
.employeeRecords{display:grid;gap:12px;padding-bottom:32px}.employeeHero{display:flex;justify-content:space-between;gap:18px;padding:18px 20px;border-radius:14px;background:linear-gradient(120deg,#172438,#223955);color:#fff}.employeeHero small,.sectionEyebrow{color:#f2c72d;font-size:7px;font-weight:900;letter-spacing:.13em}.employeeHero h2{margin:5px 0;font-size:20px}.employeeHero p{margin:0;max-width:760px;color:#c9d4e2;font-size:9px;line-height:1.5}.employeeHeroActions{min-width:360px;display:flex;align-items:end;gap:8px}.employeeHeroActions label{flex:1;display:grid;gap:5px;font-size:8px;font-weight:800}.employeeHeroActions select,.employeeForm input,.employeeForm select,.employeeForm textarea,.recordForm input,.recordForm select,.recordForm textarea{width:100%;border:1px solid #d7e0e8;border-radius:8px;background:#fff;color:#21364e;padding:9px 10px;font:inherit;font-size:8px}.employeeHeroActions select{height:39px}.employeeHeroActions button,.primaryBtn,.secondaryBtn{min-height:38px;border-radius:8px;padding:0 13px;font:inherit;font-size:8px;font-weight:850;cursor:pointer}.employeeHeroActions button,.primaryBtn{border:1px solid #dbb21f;background:#f6ca2f;color:#172438}.secondaryBtn{border:1px solid #d3dde6;background:#fff;color:#425870}.employeeKpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}.employeeKpis article{border:1px solid #dfe6ed;border-radius:10px;background:#fff;padding:11px 12px}.employeeKpis span,.employeeKpis b,.employeeKpis small{display:block}.employeeKpis span{color:#7d8997;font-size:6px;font-weight:900;text-transform:uppercase}.employeeKpis b{margin-top:5px;color:#21384f;font-size:18px}.employeeKpis small{margin-top:4px;color:#929daa;font-size:6px}.employeeKpis .good b{color:#23805b}.employeeKpis .warn b{color:#a96b0c}.employeeKpis .bad b{color:#b53c49}.employeeTabs{display:flex;gap:6px;overflow-x:auto;border:1px solid #dfe6ed;border-radius:10px;background:#fff;padding:6px}.employeeTabs button{border:0;border-radius:7px;background:transparent;padding:9px 12px;color:#677789;font:inherit;font-size:8px;font-weight:850;cursor:pointer;white-space:nowrap}.employeeTabs button.active{background:#172438;color:#fff}.employeeToolbar{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #dfe6ed;border-radius:10px;background:#fff;padding:7px 10px}.employeeToolbar label{display:flex;align-items:center;flex:1;max-width:520px;border:1px solid #dde4eb;border-radius:8px;padding:0 9px}.employeeToolbar input{width:100%;border:0;outline:0;padding:9px;font:inherit;font-size:8px}.employeeToolbar small{color:#8693a1;font-size:7px}.panel{overflow:hidden;border:1px solid #dfe6ed;border-radius:12px;background:#fff}.panelHeader{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid #e8edf2;background:#fbfcfd}.panelHeader h3{margin:3px 0 0;color:#22394f;font-size:13px}.panelHeader p{margin:3px 0 0;color:#8290a0;font-size:7px}.tableWrap{overflow-x:auto}.tableHead,.tableRow{min-width:1040px;display:grid;grid-template-columns:1.35fr .9fr .62fr .8fr .55fr 1.75fr;gap:9px;align-items:center;padding:9px 13px}.tableHead{background:#f7f9fb;color:#7f8b99;font-size:6px;font-weight:900;text-transform:uppercase}.tableRow{min-height:62px;border-top:1px solid #edf1f5;color:#50657a;font-size:8px}.identityBtn{border:0;background:transparent;padding:0;display:flex;align-items:center;gap:8px;text-align:left;cursor:pointer}.avatar{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:grid;place-items:center;background:#e8f0f8;color:#2b5174;font-size:9px;font-weight:900;font-style:normal}.identityBtn b,.identityBtn small,.stack b,.stack small{display:block}.identityBtn b{color:#233b53;font-size:9px}.identityBtn small,.stack small{margin-top:3px;color:#929daa;font-size:6px}.attendancePill,.warningLevel,.statusPill,.recordTypePill{display:inline-block;border-radius:999px;padding:5px 7px;font-style:normal;font-size:6px;font-weight:900}.attendancePill.atWork{background:#e5f6ee;color:#207a55}.attendancePill.late{background:#fff1d4;color:#94600d}.attendancePill.notAtWork{background:#ffe8eb;color:#ab3946}.attendancePill.unmarked{background:#eef2f6;color:#6f7f91}.attendanceButtons{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.attendanceButtons button{min-height:31px;border:1px solid #d9e1e8;border-radius:7px;background:#fff;font:inherit;font-size:7px;font-weight:850;cursor:pointer}.attendanceButtons .atWork{color:#247653;border-color:#bfe3d1}.attendanceButtons .notAtWork{color:#aa3d49;border-color:#efc6cb}.attendanceButtons .late{color:#93600d;border-color:#ead8aa}.warningCount{border:1px solid #e1e7ee;border-radius:8px;background:#fff;padding:5px;cursor:pointer}.warningCount b,.warningCount small{display:block}.warningCount b{color:#ad3946;font-size:12px}.warningCount small{color:#8b97a5;font-size:6px}.employeeEmpty{padding:22px;text-align:center;color:#8895a4;font-size:8px}.registerHead,.registerRow{min-width:930px;display:grid;gap:8px;align-items:center;padding:9px 13px}.registerHead{background:#f7f9fb;color:#7f8b99;font-size:6px;font-weight:900;text-transform:uppercase}.registerRow{border-top:1px solid #edf1f5;color:#50657a;font-size:8px}.warningRegister .registerHead,.warningRegister .registerRow{grid-template-columns:1.1fr .72fr 1.35fr .72fr .72fr .7fr}.attendanceRegister .registerHead,.attendanceRegister .registerRow{grid-template-columns:1.1fr .7fr .65fr 1.2fr .75fr}.hrRegister .registerHead,.hrRegister .registerRow{grid-template-columns:1.05fr .9fr 1.2fr .75fr .75fr .7fr}.warningLevel.verbal{background:#eef2f6;color:#5d6e81}.warningLevel.written{background:#fff1d4;color:#93600d}.warningLevel.final{background:#ffe8eb;color:#ad3543}.statusPill.active{background:#ffe8eb;color:#ad3543}.statusPill.inactive{background:#eef2f6;color:#6e7d8e}.recordTypePill{background:#e9f0f8;color:#31597a}.rowButton{border:0;background:transparent;color:#28557d;font:inherit;font-size:8px;font-weight:850;cursor:pointer;text-align:left}.overlay.employeeOverlay{z-index:55;padding:14px}.employeeModal,.profileModal{width:min(860px,calc(100vw - 28px));max-height:calc(100dvh - 28px);overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 28px 80px rgba(14,29,48,.28);display:flex;flex-direction:column}.smallModal{width:min(530px,calc(100vw - 28px))}.employeeModal>header,.profileModal>header{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid #e6ebf1;background:#fbfcfd}.employeeModal h2,.profileModal h2{margin:3px 0;color:#21374f;font-size:16px}.employeeModal p,.profileModal p{margin:0;color:#8290a0;font-size:8px}.closeBtn{width:32px;height:32px;border:0;border-radius:8px;background:#edf2f6;color:#607187;font-size:18px;cursor:pointer}.modalBody{overflow-y:auto;padding:14px 16px}.modalFooter{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e6ebf1;padding:10px 14px;background:#fbfcfd}.employeeForm,.recordForm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.employeeForm label,.recordForm label,.fullField{display:grid;gap:5px;color:#3d5268;font-size:7px;font-weight:850}.employeeForm textarea,.recordForm textarea,.fullField textarea{min-height:80px;resize:vertical}.span2{grid-column:span 2}.span3{grid-column:1/-1}.privacyNote{margin:10px 0 0;border:1px solid #dce4ec;border-radius:8px;background:#f7fafc;padding:9px;color:#65768a;font-size:7px;line-height:1.5}.profileHeader{display:flex;align-items:center;gap:10px}.profileHeader .avatar{width:43px;height:43px;flex-basis:43px}.profileBody{overflow-y:auto;padding:14px;display:grid;gap:11px}.profileStats{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.profileStats article{border:1px solid #dfe6ed;border-radius:9px;padding:10px}.profileStats span,.profileStats b,.profileStats small{display:block}.profileStats span{font-size:6px;color:#7f8c9a;font-weight:900;text-transform:uppercase}.profileStats b{margin-top:4px;font-size:15px;color:#263e56}.profileStats small{margin-top:3px;font-size:6px;color:#929daa}.profileGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.profileCard{border:1px solid #dfe6ed;border-radius:10px;padding:11px}.profileCard dl{margin:8px 0 0}.profileCard dl div{display:grid;grid-template-columns:125px 1fr;gap:8px;padding:6px 0;border-top:1px solid #eff2f5}.profileCard dt{font-size:7px;color:#8995a4}.profileCard dd{margin:0;font-size:8px;color:#354c64;font-weight:700;word-break:break-word}.historySection{border:1px solid #dfe6ed;border-radius:10px;overflow:hidden}.historySection header{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:10px 12px;background:#fbfcfd;border-bottom:1px solid #e9eef3}.historySection h3{margin:3px 0 0;font-size:11px;color:#263c54}.historyList{display:grid}.historyItem{padding:9px 11px;border-top:1px solid #edf1f5;font-size:8px;color:#566a7e}.historyItem:first-child{border-top:0}.historyItem b,.historyItem small{display:block}.historyItem small{margin-top:3px;color:#8d99a7;font-size:6px}.warningDetailGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.warningDetailGrid div{border:1px solid #e2e7ed;border-radius:8px;padding:9px}.warningDetailGrid span,.warningDetailGrid b{display:block}.warningDetailGrid span{font-size:6px;color:#8995a4;text-transform:uppercase;font-weight:900}.warningDetailGrid b{margin-top:4px;font-size:8px;color:#31475f}.warningDetailText{margin-top:10px;border:1px solid #e2e7ed;border-radius:8px;padding:10px;color:#53667b;font-size:8px;line-height:1.5;white-space:pre-wrap}.toast{position:fixed;right:18px;top:95px;z-index:70;border:1px solid #cbd8e5;border-radius:9px;background:#fff;padding:10px 12px;box-shadow:0 12px 32px rgba(25,49,76,.18);color:#30475f;font-size:8px;font-weight:800}.filters{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.filters select{height:34px;border:1px solid #d9e1e8;border-radius:7px;background:#fff;padding:0 8px;color:#52667a;font:inherit;font-size:7px}.miniActions{display:flex;gap:6px;flex-wrap:wrap}.miniActions button{border:1px solid #d6dfe8;border-radius:7px;background:#fff;padding:6px 8px;color:#40576f;font:inherit;font-size:6px;font-weight:850;cursor:pointer}


/* EMPLOYEE PROFILE V3 — polished HR file + visible right-side scroll */
.profileModal{
  width:min(1120px,calc(100vw - 36px));
  height:min(900px,calc(100dvh - 34px));
  max-height:calc(100dvh - 34px);
  border:1px solid #dbe4ed;
  border-radius:20px;
  background:#f5f8fb;
  box-shadow:0 32px 90px rgba(10,30,52,.30);
}
.profileModal>header{
  position:sticky;
  top:0;
  z-index:5;
  min-height:96px;
  padding:18px 20px;
  border-bottom:1px solid rgba(255,255,255,.12);
  background:linear-gradient(115deg,#14243a 0%,#1e3958 62%,#244b72 100%);
  box-shadow:0 7px 18px rgba(15,34,55,.12);
}
.profileModal>header .profileHeader{gap:13px}
.profileModal>header .profileHeader .avatar{
  width:54px;height:54px;flex-basis:54px;
  border:1px solid rgba(255,255,255,.20);
  border-radius:15px;
  background:linear-gradient(145deg,#f8d649,#efbc12);
  color:#172438;
  box-shadow:0 6px 16px rgba(0,0,0,.13);
  font-size:14px;
}
.profileModal>header .sectionEyebrow{color:#ffd633;font-size:7px;letter-spacing:.16em}
.profileModal>header h2{margin:4px 0 3px;color:#fff;font-size:22px;letter-spacing:-.01em}
.profileModal>header p{color:#c8d4e2;font-size:9px}
.profileModal>header .secondaryBtn{
  min-height:38px;
  border:1px solid rgba(255,255,255,.22);
  background:rgba(255,255,255,.10);
  color:#fff;
  padding:0 12px;
  backdrop-filter:blur(6px);
}
.profileModal>header .secondaryBtn:hover{background:rgba(255,255,255,.18)}
.profileModal>header .closeBtn{
  width:38px;height:38px;
  border:1px solid rgba(255,255,255,.16);
  background:rgba(255,255,255,.10);
  color:#fff;
}
.profileBody{
  overflow-y:scroll;
  overscroll-behavior:contain;
  scrollbar-gutter:stable;
  padding:18px 18px 30px;
  gap:14px;
  background:linear-gradient(180deg,#f5f8fb 0%,#f8fafc 100%);
}
.profileBody::-webkit-scrollbar{width:13px}
.profileBody::-webkit-scrollbar-track{background:#e8eef4;border-left:1px solid #d9e2eb}
.profileBody::-webkit-scrollbar-thumb{background:#7f91a5;border:3px solid #e8eef4;border-radius:999px}
.profileBody::-webkit-scrollbar-thumb:hover{background:#5d7187}
.profileBody{scrollbar-width:auto;scrollbar-color:#7f91a5 #e8eef4}
.profileStats{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
.profileStats article{
  position:relative;
  min-height:92px;
  border:1px solid #dae4ed;
  border-radius:14px;
  background:#fff;
  padding:13px 14px;
  box-shadow:0 5px 15px rgba(24,50,77,.055);
}
.profileStats article:before{
  content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 4px 4px 0;background:#2c5c84;
}
.profileStats article:nth-child(2):before{background:#e0a513}
.profileStats article:nth-child(3):before{background:#bf4854}
.profileStats article:nth-child(4):before{background:#9e3b48}
.profileStats article:nth-child(5):before{background:#376f67}
.profileStats span{font-size:7px;letter-spacing:.04em}
.profileStats b{margin-top:7px;font-size:22px;line-height:1;color:#1e3650}
.profileStats small{margin-top:7px;font-size:7px;color:#8795a4}
.profileGrid{gap:12px}
.profileCard{
  border:1px solid #d9e3ec;
  border-radius:15px;
  padding:0;
  overflow:hidden;
  background:#fff;
  box-shadow:0 5px 15px rgba(24,50,77,.045);
}
.profileCard>.sectionEyebrow{
  display:block;
  margin:0;
  padding:13px 15px;
  border-bottom:1px solid #e6edf3;
  background:linear-gradient(180deg,#fbfcfd,#f7f9fb);
  color:#c58f00;
  font-size:8px;
}
.profileCard dl{margin:0;padding:0 15px 8px}
.profileCard dl div{
  grid-template-columns:145px minmax(0,1fr);
  min-height:38px;
  align-items:center;
  padding:8px 0;
  border-top:1px solid #edf2f6;
}
.profileCard dl div:first-child{border-top:0}
.profileCard dt{font-size:8px;color:#7e8d9f}
.profileCard dd{font-size:9px;color:#2f4862;font-weight:760}
.historySection{
  border:1px solid #d9e3ec;
  border-radius:15px;
  background:#fff;
  box-shadow:0 5px 15px rgba(24,50,77,.045);
}
.historySection header{
  position:sticky;
  top:0;
  z-index:2;
  min-height:60px;
  padding:12px 15px;
  background:linear-gradient(180deg,#fff,#f8fafc);
}
.historySection header .sectionEyebrow{font-size:7px;color:#c58f00;letter-spacing:.13em}
.historySection h3{margin-top:4px;font-size:13px;color:#1f3953}
.historySection header .secondaryBtn{min-height:34px;background:#fff;border-color:#cdd9e4;color:#314e6c}
.historyList{background:#fff}
.historyItem{
  min-height:50px;
  padding:11px 14px;
  border-top:1px solid #edf1f5;
  background:#fff;
  color:#53687d;
  transition:background .15s ease;
}
button.historyItem:hover{background:#f6f9fc}
.historyItem b{font-size:9px;color:#2d465f}
.historyItem small{margin-top:4px;font-size:7px;line-height:1.45;color:#8492a1}
.profileModal .employeeEmpty{padding:18px;color:#8996a4;background:#fbfcfd}
.profileModal .miniActions{justify-content:flex-end}
.profileModal .miniActions button{white-space:nowrap}

@media(max-width:900px){
  .profileModal{width:calc(100vw - 18px);height:calc(100dvh - 18px);max-height:calc(100dvh - 18px);border-radius:15px}
  .profileModal>header{min-height:auto;padding:14px 15px;align-items:flex-start}
  .profileModal>header h2{font-size:18px}
  .profileModal>header .miniActions{max-width:48%;justify-content:flex-end}
  .profileModal>header .miniActions .secondaryBtn{min-height:34px;padding:0 9px;font-size:7px}
  .profileStats{grid-template-columns:repeat(3,minmax(0,1fr))}
  .profileGrid{grid-template-columns:1fr}
}
@media(max-width:620px){
  .overlay.employeeOverlay{padding:4px}
  .profileModal{width:calc(100vw - 8px);height:calc(100dvh - 8px);max-height:calc(100dvh - 8px);border-radius:12px}
  .profileModal>header{position:sticky;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px}
  .profileModal>header .profileHeader .avatar{display:grid;width:42px;height:42px;flex-basis:42px;font-size:11px}
  .profileModal>header h2{font-size:16px}
  .profileModal>header p{font-size:7px}
  .profileModal>header .miniActions{max-width:none}
  .profileModal>header .miniActions .secondaryBtn{display:none}
  .profileModal>header .closeBtn{width:34px;height:34px}
  .profileBody{padding:10px 8px 24px;gap:9px}
  .profileBody::-webkit-scrollbar{width:9px}
  .profileBody::-webkit-scrollbar-thumb{border-width:2px}
  .profileStats{grid-template-columns:1fr 1fr;gap:7px}
  .profileStats article{min-height:78px;padding:10px 11px}
  .profileStats b{font-size:18px}
  .profileCard dl{padding:0 11px 6px}
  .profileCard dl div{grid-template-columns:115px minmax(0,1fr);gap:8px}
  .historySection header{position:static;padding:10px 11px}
  .historySection h3{font-size:11px}
}

@media(max-width:1200px){.employeeKpis{grid-template-columns:repeat(4,1fr)}.employeeForm,.recordForm{grid-template-columns:1fr 1fr}.span3{grid-column:1/-1}}@media(max-width:760px){.employeeHero{flex-direction:column;padding:15px}.employeeHeroActions{min-width:0;flex-direction:column;align-items:stretch}.employeeKpis{grid-template-columns:1fr 1fr}.employeeToolbar{align-items:stretch;flex-direction:column}.employeeToolbar label{max-width:none}.employeeModal,.profileModal{width:calc(100vw - 12px);max-height:calc(100dvh - 12px)}.overlay.employeeOverlay{padding:6px}.employeeForm,.recordForm,.profileGrid,.warningDetailGrid{grid-template-columns:1fr}.span2,.span3{grid-column:1}.profileStats{grid-template-columns:1fr 1fr}.profileHeader .avatar{display:none}.toast{left:10px;right:10px;top:80px}.employeeHeroActions button{width:100%}}
.attendanceOverview{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;padding:12px 0 2px}.attendanceOverview article{border:1px solid #d9e3ec;border-radius:12px;background:#fff;padding:11px 12px}.attendanceOverview span,.attendanceOverview b,.attendanceOverview small{display:block}.attendanceOverview span{color:#7e8d9d;font-size:6px;font-weight:900;text-transform:uppercase}.attendanceOverview b{margin-top:5px;color:#213a54;font-size:18px}.attendanceOverview small{margin-top:4px;color:#8e9aa7;font-size:6px}.monthHistory{overflow-x:auto}.monthHistoryHead,.monthHistoryRow{min-width:650px;display:grid;grid-template-columns:1.1fr .8fr .75fr .75fr .85fr;gap:8px;align-items:center;padding:8px 13px}.monthHistoryHead{background:#f7f9fb;color:#7f8b99;font-size:6px;font-weight:900;text-transform:uppercase}.monthHistoryRow{border-top:1px solid #edf1f5;color:#4c6278;font-size:8px}.quickRecordActions{display:flex;gap:6px;flex-wrap:wrap}.quickRecordActions button{min-height:32px;border:1px solid #d5dfe8;border-radius:8px;background:#fff;padding:0 9px;color:#35506c;font:inherit;font-size:7px;font-weight:850;cursor:pointer}.quickRecordActions button:hover{background:#f5f8fb}.leaveStatus{display:inline-block;border-radius:999px;padding:5px 7px;font-size:6px;font-weight:900}.leaveStatus.requested{background:#fff1d4;color:#94600d}.leaveStatus.approved{background:#e5f6ee;color:#207a55}.leaveStatus.declined{background:#ffe8eb;color:#aa3946}.leaveStatus.cancelled{background:#eef2f6;color:#6e7d8e}.propertyType{display:inline-block;border-radius:999px;padding:5px 7px;background:#e8f0f8;color:#2d587b;font-size:6px;font-weight:900}.statusActions{display:flex;gap:5px;flex-wrap:wrap}.statusActions button{border:1px solid #d8e1e9;border-radius:7px;background:#fff;padding:5px 7px;color:#496077;font:inherit;font-size:6px;font-weight:850;cursor:pointer}.statusActions .approve{border-color:#bfe3d1;color:#247653}.statusActions .decline{border-color:#efc6cb;color:#aa3d49}.profileQuickGrid{display:grid;grid-template-columns:1.15fr .85fr;gap:12px}.profileQuickGrid .historySection{min-width:0}.profileAttendanceSummary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:12px 13px}.profileAttendanceSummary article{border:1px solid #e0e7ee;border-radius:10px;background:#fbfcfd;padding:10px}.profileAttendanceSummary span,.profileAttendanceSummary b,.profileAttendanceSummary small{display:block}.profileAttendanceSummary span{font-size:6px;color:#8190a0;font-weight:900;text-transform:uppercase}.profileAttendanceSummary b{margin-top:5px;font-size:17px;color:#243d56}.profileAttendanceSummary small{margin-top:3px;font-size:6px;color:#909ca9}.profileAssetItem{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.profileAssetItem .statusActions{justify-content:flex-end}.hrRegister.propertyRegister .registerHead,.hrRegister.propertyRegister .registerRow{grid-template-columns:1.05fr .9fr 1.25fr .8fr .75fr .8fr}.hrRegister.leaveRegister .registerHead,.hrRegister.leaveRegister .registerRow{grid-template-columns:1.05fr .85fr 1.2fr .8fr .75fr 1fr}.attendanceRegister.allAttendance .registerHead,.attendanceRegister.allAttendance .registerRow{grid-template-columns:1.05fr .7fr .7fr 1.2fr .75fr}.recordForm .contextHint{grid-column:1/-1;border:1px solid #dbe5ed;border-radius:9px;background:#f7fafc;padding:9px 10px;color:#64778a;font-size:7px;line-height:1.5}.profileModal .historySection .quickRecordActions{justify-content:flex-end}
@media(max-width:900px){.attendanceOverview,.profileAttendanceSummary{grid-template-columns:repeat(3,1fr)}.profileQuickGrid{grid-template-columns:1fr}}@media(max-width:620px){.attendanceOverview,.profileAttendanceSummary{grid-template-columns:1fr 1fr}.quickRecordActions{width:100%}.quickRecordActions button{flex:1}.profileAssetItem{grid-template-columns:1fr}}

.panelHeaderActions{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.panelHeaderActions button,.panelAddBtn{min-height:34px;border:1px solid #d2dce6;border-radius:8px;background:#fff;padding:0 10px;color:#35516d;font:inherit;font-size:7px;font-weight:900;cursor:pointer;white-space:nowrap}.panelHeaderActions button:hover,.panelAddBtn:hover{background:#f1f6fb;border-color:#bccbd9}.panelAddBtn{border-color:#d8af1b;background:#f6ca2f;color:#172438}.panelAddBtn:hover{background:#f2c21b;border-color:#c99f0c}.recordPickerOverlay{z-index:64}.recordPickerModal{width:min(720px,calc(100vw - 24px));max-height:min(720px,calc(100dvh - 24px))}.recordPickerBody{min-height:0;overflow-y:auto;padding:14px}.recordPickerSearch{height:42px;border:1px solid #d6e0e9;border-radius:10px;background:#f8fafc;display:flex;align-items:center;padding:0 11px;color:#7b8998}.recordPickerSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;padding:0 8px;color:#263e56;font:inherit;font-size:9px}.recordPickerList{display:grid;gap:7px;margin-top:10px}.recordPickerList>button{width:100%;display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #dfe6ed;border-radius:11px;background:#fff;padding:9px 10px;text-align:left;cursor:pointer}.recordPickerList>button:hover{background:#f7fafc;border-color:#c9d5e0}.recordPickerList>button span{min-width:0}.recordPickerList>button b,.recordPickerList>button small{display:block}.recordPickerList>button b{color:#243c55;font-size:9px}.recordPickerList>button small{margin-top:3px;overflow:hidden;color:#8996a5;font-size:7px;text-overflow:ellipsis;white-space:nowrap}.recordPickerList>button em{color:#315a7e;font-size:7px;font-style:normal;font-weight:900;white-space:nowrap}@media(max-width:760px){.panelHeader{align-items:flex-start;flex-direction:column}.panelHeaderActions{width:100%;display:grid;grid-template-columns:1fr 1fr}.panelHeaderActions button,.panelAddBtn{width:100%;min-height:40px}.recordPickerModal{width:calc(100vw - 10px);max-height:calc(100dvh - 10px)}.recordPickerList>button{grid-template-columns:36px minmax(0,1fr);min-height:62px}.recordPickerList>button em{grid-column:2;margin-top:-5px}.recordPickerSearch{height:46px}}


`;

export default function EmployeeRecords({ currentUser }: { currentUser: CurrentHubUser }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [workspace, setWorkspace] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("Employees");
  const [search, setSearch] = useState("");
  const [warningFilter, setWarningFilter] = useState("All");
  const [recordFilter, setRecordFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [employeeModal, setEmployeeModal] = useState<"add" | "edit" | null>(null);
  const [employeeForm, setEmployeeForm] = useState(blankEmployee(""));
  const [attendanceModal, setAttendanceModal] = useState<{ employee: Employee; status: "Not at work" | "Late" } | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ absenceType: "Unauthorised absence", minutesLate: "", reason: "" });
  const [warningModal, setWarningModal] = useState<Employee | null>(null);
  const [warningForm, setWarningForm] = useState({
    warningDate: new Date().toISOString().slice(0, 10), warningLevel: "Written", reason: "", details: "", issuedBy: currentUser.name || "", validUntil: "", acknowledgement: "",
  });
  const [hrModal, setHrModal] = useState<Employee | null>(null);
  const [hrForm, setHrForm] = useState({
    recordType: "Leave", title: "", recordDate: new Date().toISOString().slice(0, 10), endDate: "", status: "", reference: "", details: "",
  });
  const [recordPicker, setRecordPicker] = useState<{ recordType: HrRecord["record_type"]; heading: string } | null>(null);
  const [recordPickerSearch, setRecordPickerSearch] = useState("");

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const applyData = (result: ApiData) => {
    setData(result);
    setWorkspace(result.workspace);
    setSelected((current) => current ? result.employees.find((employee) => employee.id === current.id) || null : null);
  };

  const load = async (target?: string) => {
    setLoading(true);
    try {
      const requested = target ?? workspace;
      const response = await fetch(requested ? `/api/employees?workspace=${encodeURIComponent(requested)}` : "/api/employees", { cache: "no-store" });
      const result = (await response.json()) as ApiData & { error?: string };
      if (!response.ok) return flash(result.error || "Employee records could not be loaded.");
      applyData(result);
    } catch {
      flash("Employee records could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/employees", { cache: "no-store" })
      .then(async (response) => ({ response, result: (await response.json()) as ApiData & { error?: string } }))
      .then(({ response, result }) => {
        if (cancelled) return;
        if (!response.ok) {
          setMessage(result.error || "Employee records could not be loaded.");
          return;
        }
        setData(result);
        setWorkspace(result.workspace);
      })
      .catch(() => { if (!cancelled) setMessage("Employee records could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const employeeById = (id: number) => data?.employees.find((employee) => employee.id === id);
  const attendanceFor = (id: number) => (data?.attendance || []).filter((row) => Number(row.employee_id) === id);
  const warningsFor = (id: number) => (data?.warnings || []).filter((row) => Number(row.employee_id) === id);
  const hrFor = (id: number) => (data?.hrRecords || []).filter((row) => Number(row.employee_id) === id);

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!data || !needle) return data?.employees || [];
    return data.employees.filter((employee) => [employeeName(employee), employee.employee_number, employee.job_title, employee.department, employee.phone, employee.email].join(" ").toLowerCase().includes(needle));
  }, [data, search]);

  const filteredWarnings = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.warnings.filter((warning) => {
      const employee = data.employees.find((item) => item.id === Number(warning.employee_id));
      const status = warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired";
      const matchStatus = warningFilter === "All" || warningFilter === status || warningFilter === warning.warning_level;
      const matchSearch = !needle || [employee ? employeeName(employee) : "", warning.reason, warning.warning_level, warning.issued_by].join(" ").toLowerCase().includes(needle);
      return matchStatus && matchSearch;
    });
  }, [data, search, warningFilter]);

  const attendanceHistory = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.attendance.filter((record) => {
      const employee = data.employees.find((item) => item.id === Number(record.employee_id));
      return !needle || [employee ? employeeName(employee) : "", record.status, record.absence_type, record.reason, record.recorded_by].join(" ").toLowerCase().includes(needle);
    });
  }, [data, search]);

  const leaveRequests = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.hrRecords.filter((record) => {
      if (!leaveRecordTypes.includes(record.record_type)) return false;
      const employee = data.employees.find((item) => item.id === Number(record.employee_id));
      return !needle || [employee ? employeeName(employee) : "", record.title, record.status, record.reference, record.details].join(" ").toLowerCase().includes(needle);
    });
  }, [data, search]);

  const companyProperty = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.hrRecords.filter((record) => {
      if (!propertyRecordTypes.includes(record.record_type)) return false;
      const employee = data.employees.find((item) => item.id === Number(record.employee_id));
      return !needle || [employee ? employeeName(employee) : "", record.record_type, record.title, record.status, record.reference, record.details].join(" ").toLowerCase().includes(needle);
    });
  }, [data, search]);

  const attendanceInsights = (employeeId: number) => {
    const records = attendanceFor(employeeId);
    const weekStart = startOfWeekIso(data?.today || new Date().toISOString().slice(0, 10));
    const currentMonth = monthKey(data?.today || new Date().toISOString().slice(0, 10));
    const currentYear = (data?.today || new Date().toISOString().slice(0, 10)).slice(0, 4);
    const week = records.filter((record) => record.attendance_date >= weekStart);
    const month = records.filter((record) => monthKey(record.attendance_date) === currentMonth);
    const year = records.filter((record) => record.attendance_date.startsWith(currentYear));
    const summarize = (items: Attendance[]) => ({
      attended: items.filter((record) => isAttendedStatus(record.status)).length,
      late: items.filter((record) => record.status === "Late").length,
      absent: items.filter((record) => record.status === "Not at work").length,
      lateMinutes: items.reduce((sum, record) => sum + (record.status === "Late" ? Number(record.minutes_late || 0) : 0), 0),
    });
    const months: Array<{ key: string; label: string; attended: number; late: number; absent: number; lateMinutes: number }> = [];
    const cursor = new Date(`${data?.today || new Date().toISOString().slice(0, 10)}T12:00:00`);
    for (let i = 0; i < 12; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const summary = summarize(records.filter((record) => monthKey(record.attendance_date) === key));
      months.push({ key, label: monthLabel(key), ...summary });
      cursor.setMonth(cursor.getMonth() - 1);
    }
    return { week: summarize(week), month: summarize(month), year: summarize(year), months };
  };

  const filteredHrRecords = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    return data.hrRecords.filter((record) => {
      const employee = data.employees.find((item) => item.id === Number(record.employee_id));
      if (leaveRecordTypes.includes(record.record_type) || propertyRecordTypes.includes(record.record_type)) return false;
      const matchType = recordFilter === "All" || record.record_type === recordFilter;
      const matchSearch = !needle || [employee ? employeeName(employee) : "", record.record_type, record.title, record.status, record.reference].join(" ").toLowerCase().includes(needle);
      return matchType && matchSearch;
    });
  }, [data, search, recordFilter]);

  const post = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/employees", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { error?: string }).error || "Record could not be saved.");
    return result;
  };

  const patch = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/employees", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error((result as { error?: string }).error || "Record could not be updated.");
    return result;
  };

  const markAtWork = async (employee: Employee) => {
    if (!data?.permissions.canRecordAttendance || saving) return;
    setSaving(true);
    try {
      await post({ action: "attendance", employeeId: employee.id, attendanceDate: data.today, status: "At work" });
      flash(`${employeeName(employee)} marked at work.`);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Attendance could not be saved."); }
    finally { setSaving(false); }
  };

  const saveAttendance = async () => {
    if (!attendanceModal || !data || saving) return;
    setSaving(true);
    try {
      await post({
        action: "attendance", employeeId: attendanceModal.employee.id, attendanceDate: data.today, status: attendanceModal.status,
        absenceType: attendanceModal.status === "Not at work" ? attendanceForm.absenceType : "",
        minutesLate: attendanceModal.status === "Late" ? Number(attendanceForm.minutesLate) : 0,
        reason: attendanceForm.reason,
      });
      flash(attendanceModal.status === "Late" ? `${employeeName(attendanceModal.employee)} marked ${attendanceForm.minutesLate} minutes late.` : `${employeeName(attendanceModal.employee)} marked not at work.`);
      setAttendanceModal(null);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Attendance could not be saved."); }
    finally { setSaving(false); }
  };

  const openAddEmployee = () => { setEmployeeForm(blankEmployee(workspace)); setEmployeeModal("add"); };
  const openEditEmployee = (employee: Employee) => {
    setSelected(employee);
    setEmployeeForm({
      employeeNumber: employee.employee_number, workspace: employee.workspace, firstName: employee.first_name, lastName: employee.last_name,
      idNumber: employee.id_number.includes("•") ? "" : employee.id_number, phone: employee.phone, email: employee.email, jobTitle: employee.job_title,
      department: employee.department, startDate: employee.start_date, employmentType: employee.employment_type, supervisor: employee.supervisor,
      employmentStatus: employee.employment_status, emergencyContactName: employee.emergency_contact_name, emergencyContactPhone: employee.emergency_contact_phone,
      residentialAddress: employee.residential_address || "", probationEndDate: employee.probation_end_date || "", contractEndDate: employee.contract_end_date || "", notes: employee.notes,
    });
    setEmployeeModal("edit");
  };

  const saveEmployee = async () => {
    if (!employeeModal || saving) return;
    setSaving(true);
    try {
      const editing = employeeModal === "edit" && selected;
      const response = await fetch("/api/employees", {
        method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "employee", ...(editing ? { id: selected.id } : {}), ...employeeForm }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error((result as { error?: string }).error || "Employee file could not be saved.");
      flash(editing ? "Employee file updated." : "Employee added.");
      setEmployeeModal(null);
      await load(employeeForm.workspace || workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Employee file could not be saved."); }
    finally { setSaving(false); }
  };

  const openWarning = (employee: Employee) => {
    setWarningForm({ warningDate: data?.today || new Date().toISOString().slice(0, 10), warningLevel: "Written", reason: "", details: "", issuedBy: currentUser.name || "", validUntil: "", acknowledgement: "" });
    setWarningModal(employee);
  };
  const saveWarning = async () => {
    if (!warningModal || saving) return;
    setSaving(true);
    try {
      await post({ action: "warning", employeeId: warningModal.id, ...warningForm });
      flash(`Warning recorded for ${employeeName(warningModal)}.`);
      setWarningModal(null);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Warning could not be saved."); }
    finally { setSaving(false); }
  };
  const withdrawWarning = async (warning: Warning) => {
    if (!data?.permissions.canIssueWarnings || saving) return;
    setSaving(true);
    try { await patch({ action: "warning", id: warning.id, status: "Withdrawn" }); flash("Warning withdrawn."); setSelectedWarning(null); await load(workspace); }
    catch (error) { flash(error instanceof Error ? error.message : "Warning could not be updated."); }
    finally { setSaving(false); }
  };

  const openHrRecord = (employee: Employee, type = "HR Note") => {
    const status = type === "Leave Request" ? "Requested" : propertyRecordTypes.includes(type) ? (type === "Company Vehicle" ? "Allocated" : "Issued") : "";
    const title = type === "Leave Request" ? "Annual Leave" : type === "Uniform / PPE" ? "Uniform / PPE issue" : type === "Company Vehicle" ? "Vehicle allocation" : type === "Company Phone / SIM" ? "Phone / SIM issue" : "";
    setHrForm({ recordType: type, title, recordDate: data?.today || new Date().toISOString().slice(0, 10), endDate: "", status, reference: "", details: "" });
    setHrModal(employee);
  };
  const openRecordPicker = (recordType: HrRecord["record_type"], heading: string) => {
    if (!data?.permissions.canManageHrRecords) return;
    setRecordPickerSearch("");
    setRecordPicker({ recordType, heading });
  };

  const chooseEmployeeForRecord = (employee: Employee) => {
    if (!recordPicker) return;
    const recordType = recordPicker.recordType;
    setRecordPicker(null);
    setRecordPickerSearch("");
    openHrRecord(employee, recordType);
  };

  const pickerEmployees = (data?.employees || []).filter((employee) => {
    const needle = recordPickerSearch.trim().toLowerCase();
    if (!needle) return true;
    return [employeeName(employee), employee.employee_number, employee.job_title, employee.department]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const saveHrRecord = async () => {
    if (!hrModal || saving) return;
    setSaving(true);
    try {
      await post({ action: "hrRecord", employeeId: hrModal.id, ...hrForm });
      flash(`${hrForm.recordType} record added for ${employeeName(hrModal)}.`);
      setHrModal(null);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "HR record could not be saved."); }
    finally { setSaving(false); }
  };

  const updateHrStatus = async (record: HrRecord, status: string) => {
    if (!data?.permissions.canManageHrRecords || saving) return;
    setSaving(true);
    try {
      await patch({ action: "hrRecordStatus", id: record.id, status });
      flash(`${record.record_type} updated to ${status}.`);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "HR record could not be updated."); }
    finally { setSaving(false); }
  };

  if (loading && !data) return <div className="employeeEmpty">Loading employee records…</div>;
  if (!data) return <div className="employeeEmpty">Employee records are unavailable.</div>;

  return (
    <section className="employeeRecords">
      <style>{CSS}</style>
      {message && <div className="toast">{message}</div>}

      <div className="employeeHero">
        <div>
          <small>POWERBUILD PEOPLE CONTROL</small>
          <h2>Employee Records, Attendance & HR History</h2>
          <p>Maintain employee files, weekly/monthly attendance history, leave requests, warnings, uniforms/PPE, company vehicles, phones/SIMs, training and employment records.</p>
        </div>
        <div className="employeeHeroActions">
          <label>Location<select value={workspace} onChange={(e) => { setSearch(""); setSelected(null); void load(e.target.value); }}>{data.stores.map((store) => <option key={store.id} value={store.name}>{store.name}</option>)}</select></label>
          {data.permissions.canManageEmployees && <button onClick={openAddEmployee}>＋ Add employee</button>}
        </div>
      </div>

      <div className="employeeKpis">
        <article><span>Total employees</span><b>{data.summary.total}</b><small>{workspace}</small></article>
        <article className="good"><span>At work today</span><b>{data.summary.atWork}</b><small>Present</small></article>
        <article className="warn"><span>Late today</span><b>{data.summary.late}</b><small>Minutes retained</small></article>
        <article className="bad"><span>Not at work</span><b>{data.summary.notAtWork}</b><small>Reason retained</small></article>
        <article className="bad"><span>Active warnings</span><b>{data.summary.activeWarnings}</b><small>Disciplinary register</small></article>
        <article><span>On leave</span><b>{data.summary.currentLeave}</b><small>Current leave records</small></article>
        <article><span>Assets issued</span><b>{data.summary.issuedAssets}</b><small>Company assets out</small></article>
      </div>

      <div className="employeeTabs">
        {(["Employees", "Attendance History", "Leave Requests", "Company Property", "Warnings", "HR Records"] as Tab[]).map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); setSearch(""); }}>{tab}</button>)}
      </div>

      <div className="employeeToolbar">
        <label>⌕<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={activeTab === "Employees" ? "Search employee, number, job title or department…" : `Search ${activeTab.toLowerCase()}…`} /></label>
        {activeTab === "Warnings" && <div className="filters"><select value={warningFilter} onChange={(e) => setWarningFilter(e.target.value)}><option>All</option><option>Active</option><option>Expired</option><option>Withdrawn</option><option>Verbal</option><option>Written</option><option>Final written</option></select></div>}
        {activeTab === "HR Records" && <div className="filters"><select value={recordFilter} onChange={(e) => setRecordFilter(e.target.value)}><option>All</option><option>Training / Certification</option><option>Employment Change</option><option>HR Note</option></select></div>}
      </div>

      {activeTab === "Employees" && (
        <div className="panel">
          <div className="panelHeader"><div><small className="sectionEyebrow">DAILY STAFF CONTROL</small><h3>Employees</h3><p>At work, not at work and late can be recorded directly against each employee.</p></div></div>
          <div className="tableWrap">
            <div className="tableHead"><span>Employee</span><span>Role</span><span>Start date</span><span>Today</span><span>Warnings</span><span>Attendance action</span></div>
            {filteredEmployees.map((employee) => {
              const attendance = employee.today_attendance;
              return <div className="tableRow" key={employee.id}>
                <button className="identityBtn" onClick={() => setSelected(employee)}><i className="avatar">{initials(employee)}</i><span><b>{employeeName(employee)}</b><small>{employee.employee_number} · {employee.department || "No department"}</small></span></button>
                <span className="stack"><b>{employee.job_title || "Not set"}</b><small>{employee.employment_type}</small></span>
                <span>{formatDate(employee.start_date)}</span>
                <span><em className={`attendancePill ${attendance?.status === "At work" ? "atWork" : attendance?.status === "Late" ? "late" : attendance?.status === "Not at work" ? "notAtWork" : "unmarked"}`}>{attendance?.status || "Not marked"}{attendance?.status === "Late" ? ` · ${attendance.minutes_late} min` : ""}</em></span>
                <button className="warningCount" onClick={() => { setSelected(employee); setActiveTab("Warnings"); }}><b>{employee.warning_count}</b><small>{employee.active_warning_count} active</small></button>
                <div className="attendanceButtons">
                  <button className="atWork" disabled={!data.permissions.canRecordAttendance || saving} onClick={() => void markAtWork(employee)}>✓ At work</button>
                  <button className="notAtWork" disabled={!data.permissions.canRecordAttendance || saving} onClick={() => { setAttendanceForm({ absenceType: "Unauthorised absence", minutesLate: "", reason: employee.today_attendance?.reason || "" }); setAttendanceModal({ employee, status: "Not at work" }); }}>× Not at work</button>
                  <button className="late" disabled={!data.permissions.canRecordAttendance || saving} onClick={() => { setAttendanceForm({ absenceType: "", minutesLate: String(employee.today_attendance?.minutes_late || ""), reason: employee.today_attendance?.reason || "" }); setAttendanceModal({ employee, status: "Late" }); }}>⏱ Late</button>
                </div>
              </div>;
            })}
            {!filteredEmployees.length && <div className="employeeEmpty">No employees found for this location/search.</div>}
          </div>
        </div>
      )}

      {activeTab === "Warnings" && (
        <div className="panel warningRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">DISCIPLINARY REGISTER</small><h3>Warnings</h3><p>View every verbal, written and final written warning for this location.</p></div></div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Level</span><span>Reason</span><span>Date</span><span>Status</span><span>Action</span></div>
            {filteredWarnings.map((warning) => {
              const employee = employeeById(Number(warning.employee_id));
              const status = warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired";
              return <div className="registerRow" key={warning.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${warning.employee_id}`}</button>
                <span><em className={`warningLevel ${warning.warning_level === "Final written" ? "final" : warning.warning_level === "Written" ? "written" : "verbal"}`}>{warning.warning_level}</em></span>
                <span className="stack"><b>{warning.reason}</b><small>{warning.issued_by}</small></span>
                <span>{formatDate(warning.warning_date)}</span>
                <span><em className={`statusPill ${status === "Active" ? "active" : "inactive"}`}>{status}</em></span>
                <button className="rowButton" onClick={() => setSelectedWarning(warning)}>View warning</button>
              </div>;
            })}
            {!filteredWarnings.length && <div className="employeeEmpty">No warnings match this view.</div>}
          </div>
        </div>
      )}

      {activeTab === "Attendance History" && (
        <div className="panel attendanceRegister allAttendance">
          <div className="panelHeader"><div><small className="sectionEyebrow">ATTENDANCE REGISTER</small><h3>Attendance History</h3><p>Full attendance record for the last 12 months, including days attended, lateness and absences.</p></div></div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Date</span><span>Status</span><span>Reason / Detail</span><span>Recorded by</span></div>
            {attendanceHistory.map((record) => {
              const employee = employeeById(Number(record.employee_id));
              return <div className="registerRow" key={record.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${record.employee_id}`}</button>
                <span>{formatDate(record.attendance_date)}</span>
                <span><em className={`attendancePill ${record.status === "At work" ? "atWork" : record.status === "Late" ? "late" : "notAtWork"}`}>{record.status}{record.status === "Late" ? ` · ${record.minutes_late} min` : ""}</em></span>
                <span className="stack"><b>{record.absence_type || (record.status === "Late" ? `${record.minutes_late} minutes late` : record.status === "At work" ? "Present" : "—")}</b><small>{record.reason || "No additional note"}</small></span>
                <span>{record.recorded_by || "—"}</span>
              </div>;
            })}
            {!attendanceHistory.length && <div className="employeeEmpty">No attendance history matches this view.</div>}
          </div>
        </div>
      )}

      {activeTab === "Leave Requests" && (
        <div className="panel hrRegister leaveRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">LEAVE CONTROL</small><h3>Leave Requests</h3><p>Track requested, approved, declined and completed employee leave.</p></div>{data.permissions.canManageHrRecords && <button className="panelAddBtn" onClick={() => openRecordPicker("Leave Request", "Choose employee for leave request")}>＋ New leave request</button>}</div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Leave type</span><span>Period / Reason</span><span>Requested</span><span>Status</span><span>Action</span></div>
            {leaveRequests.map((record) => {
              const employee = employeeById(Number(record.employee_id));
              const statusClass = /approved|taken|on leave/i.test(record.status) ? "approved" : /declined/i.test(record.status) ? "declined" : /cancel/i.test(record.status) ? "cancelled" : "requested";
              return <div className="registerRow" key={record.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${record.employee_id}`}</button>
                <span><em className="recordTypePill">{record.title || "Leave"}</em></span>
                <span className="stack"><b>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""}</b><small>{record.details || "No reason entered"}</small></span>
                <span>{record.created_by || "—"}</span>
                <span><em className={`leaveStatus ${statusClass}`}>{record.status || "Requested"}</em></span>
                <span className="statusActions">{data.permissions.canManageHrRecords && !/approved|declined|cancelled/i.test(record.status || "") && <><button className="approve" onClick={() => void updateHrStatus(record,"Approved")}>Approve</button><button className="decline" onClick={() => void updateHrStatus(record,"Declined")}>Decline</button></>}{data.permissions.canManageHrRecords && /approved/i.test(record.status || "") && <button onClick={() => void updateHrStatus(record,"Taken")}>Mark taken</button>}</span>
              </div>;
            })}
            {!leaveRequests.length && <div className="employeeEmpty">No leave requests recorded.</div>}
          </div>
        </div>
      )}

      {activeTab === "Company Property" && (
        <div className="panel hrRegister propertyRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">COMPANY PROPERTY</small><h3>Uniforms, Vehicles, Phones & Assets</h3><p>Keep a permanent issue/return trail for company property allocated to employees.</p></div>{data.permissions.canManageHrRecords && <div className="panelHeaderActions"><button onClick={() => openRecordPicker("Uniform / PPE", "Choose employee for Uniform / PPE")}>＋ Uniform / PPE</button><button onClick={() => openRecordPicker("Company Vehicle", "Choose employee for Vehicle allocation")}>＋ Vehicle</button><button onClick={() => openRecordPicker("Company Phone / SIM", "Choose employee for Phone / SIM")}>＋ Phone / SIM</button><button onClick={() => openRecordPicker("Company Asset", "Choose employee for Company Asset")}>＋ Other Asset</button></div>}</div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Type</span><span>Item / Identifier</span><span>Issued</span><span>Status</span><span>Action</span></div>
            {companyProperty.map((record) => {
              const employee = employeeById(Number(record.employee_id));
              const active = /issued|allocated/i.test(record.status || "");
              return <div className="registerRow" key={record.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${record.employee_id}`}</button>
                <span><em className="propertyType">{record.record_type}</em></span>
                <span className="stack"><b>{record.title}</b><small>{record.reference || record.details || "No identifier"}</small></span>
                <span>{formatDate(record.record_date)}</span>
                <span><em className={`statusPill ${active ? "active" : "inactive"}`}>{record.status || "—"}</em></span>
                <span className="statusActions">{data.permissions.canManageHrRecords && active && <button className="approve" onClick={() => void updateHrStatus(record,"Returned")}>Mark returned</button>}{data.permissions.canManageHrRecords && active && <button className="decline" onClick={() => void updateHrStatus(record,"Lost / Damaged")}>Lost / damaged</button>}</span>
              </div>;
            })}
            {!companyProperty.length && <div className="employeeEmpty">No company property records match this view.</div>}
          </div>
        </div>
      )}

      {activeTab === "HR Records" && (
        <div className="panel hrRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">EMPLOYEE FILE HISTORY</small><h3>HR Records</h3><p>Training/certifications, employment changes and general HR notes.</p></div>{data.permissions.canManageHrRecords && <button className="panelAddBtn" onClick={() => openRecordPicker("HR Note", "Choose employee for HR record")}>＋ Add HR record</button>}</div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Type</span><span>Record</span><span>Date</span><span>Status</span><span>Reference</span></div>
            {filteredHrRecords.map((record) => {
              const employee = employeeById(Number(record.employee_id));
              return <div className="registerRow" key={record.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${record.employee_id}`}</button>
                <span><em className="recordTypePill">{record.record_type}</em></span>
                <span className="stack"><b>{record.title}</b><small>{record.details || "No additional detail"}</small></span>
                <span>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""}</span>
                <span>{record.status || "—"}</span>
                <span>{record.reference || "—"}</span>
              </div>;
            })}
            {!filteredHrRecords.length && <div className="employeeEmpty">No HR records match this view.</div>}
          </div>
        </div>
      )}

      {recordPicker && (
        <div className="overlay employeeOverlay recordPickerOverlay" onMouseDown={() => setRecordPicker(null)}>
          <section className="employeeModal recordPickerModal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <div><small className="sectionEyebrow">SELECT EMPLOYEE</small><h2>{recordPicker.heading}</h2><p>Select the employee first, then complete the record details.</p></div>
              <button className="closeBtn" onClick={() => setRecordPicker(null)}>×</button>
            </header>
            <div className="recordPickerBody">
              <label className="recordPickerSearch">⌕<input autoFocus value={recordPickerSearch} onChange={(e) => setRecordPickerSearch(e.target.value)} placeholder="Search name, employee number, job title or department…" /></label>
              <div className="recordPickerList">
                {pickerEmployees.map((employee) => (
                  <button key={employee.id} onClick={() => chooseEmployeeForRecord(employee)}>
                    <i className="avatar">{initials(employee)}</i>
                    <span><b>{employeeName(employee)}</b><small>{employee.employee_number || "No employee no."} · {employee.job_title || "No job title"} · {employee.department || "No department"}</small></span>
                    <em>Choose →</em>
                  </button>
                ))}
                {!pickerEmployees.length && <div className="employeeEmpty">No employees match your search.</div>}
              </div>
            </div>
          </section>
        </div>
      )}

      {selected && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelected(null)}>
          <section className="profileModal" onMouseDown={(e) => e.stopPropagation()}>
            <header><div className="profileHeader"><i className="avatar">{initials(selected)}</i><div><small className="sectionEyebrow">EMPLOYEE FILE · {selected.employee_number}</small><h2>{employeeName(selected)}</h2><p>{selected.job_title || "Job title not set"} · {selected.workspace}</p></div></div><div className="miniActions">{data.permissions.canManageEmployees && <button className="secondaryBtn" onClick={() => openEditEmployee(selected)}>Edit file</button>}{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected,"Leave Request")}>Leave request</button>}{data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => openWarning(selected)}>Issue warning</button>}<button className="closeBtn" onClick={() => setSelected(null)}>×</button></div></header>
            <div className="profileBody">
              {(() => { const insight = attendanceInsights(selected.id); return <div className="profileStats"><article><span>Attended this week</span><b>{insight.week.attended}</b><small>{insight.week.late} late</small></article><article><span>Attended this month</span><b>{insight.month.attended}</b><small>{insight.month.late} late · {insight.month.lateMinutes} min</small></article><article><span>Absent this month</span><b>{insight.month.absent}</b><small>Not-at-work records</small></article><article><span>Warnings</span><b>{selected.warning_count}</b><small>{selected.active_warning_count} active</small></article><article><span>Year attendance</span><b>{insight.year.attended}</b><small>{insight.year.late} late · {insight.year.absent} absent</small></article></div>; })()}
              <div className="profileGrid">
                <section className="profileCard"><small className="sectionEyebrow">EMPLOYMENT</small><dl><div><dt>Employee no.</dt><dd>{selected.employee_number}</dd></div><div><dt>Job title</dt><dd>{selected.job_title || "—"}</dd></div><div><dt>Department</dt><dd>{selected.department || "—"}</dd></div><div><dt>Start date</dt><dd>{formatDate(selected.start_date)}</dd></div><div><dt>Probation ends</dt><dd>{formatDate(selected.probation_end_date)}</dd></div><div><dt>Contract ends</dt><dd>{formatDate(selected.contract_end_date)}</dd></div><div><dt>Supervisor</dt><dd>{selected.supervisor || "—"}</dd></div><div><dt>Status</dt><dd>{selected.employment_status}</dd></div></dl></section>
                <section className="profileCard"><small className="sectionEyebrow">CONTACT & IDENTIFICATION</small><dl><div><dt>ID / Passport</dt><dd>{selected.id_number || "—"}</dd></div><div><dt>Phone</dt><dd>{selected.phone || "—"}</dd></div><div><dt>Email</dt><dd>{selected.email || "—"}</dd></div><div><dt>Address</dt><dd>{selected.residential_address || "—"}</dd></div><div><dt>Emergency contact</dt><dd>{selected.emergency_contact_name || "—"}</dd></div><div><dt>Emergency phone</dt><dd>{selected.emergency_contact_phone || "—"}</dd></div></dl></section>
              </div>
              {(() => { const insight = attendanceInsights(selected.id); return <section className="historySection"><header><div><small className="sectionEyebrow">ATTENDANCE PERFORMANCE</small><h3>Weekly, Monthly & 12-Month Record</h3></div></header><div className="profileAttendanceSummary"><article><span>This week</span><b>{insight.week.attended}</b><small>days attended</small></article><article><span>This month</span><b>{insight.month.attended}</b><small>days attended</small></article><article><span>Late this month</span><b>{insight.month.late}</b><small>{insight.month.lateMinutes} minutes</small></article><article><span>Absent this month</span><b>{insight.month.absent}</b><small>days recorded absent</small></article><article><span>This year</span><b>{insight.year.attended}</b><small>days attended</small></article></div><div className="monthHistory"><div className="monthHistoryHead"><span>Month</span><span>Attended</span><span>Late</span><span>Absent</span><span>Late minutes</span></div>{insight.months.map((month) => <div className="monthHistoryRow" key={month.key}><b>{month.label}</b><span>{month.attended}</span><span>{month.late}</span><span>{month.absent}</span><span>{month.lateMinutes}</span></div>)}</div></section>; })()}
              <section className="historySection"><header><div><small className="sectionEyebrow">LEAVE REQUEST HISTORY</small><h3>Leave Requests</h3></div>{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected,"Leave Request")}>＋ New leave request</button>}</header><div className="historyList">{hrFor(selected.id).filter((record) => leaveRecordTypes.includes(record.record_type)).map((record) => <div className="historyItem profileAssetItem" key={record.id}><div><b>{record.title || "Leave"} · {record.status || "Requested"}</b><small>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""}{record.details ? ` · ${record.details}` : ""}</small></div><div className="statusActions">{data.permissions.canManageHrRecords && !/approved|declined|cancelled/i.test(record.status || "") && <><button className="approve" onClick={() => void updateHrStatus(record,"Approved")}>Approve</button><button className="decline" onClick={() => void updateHrStatus(record,"Declined")}>Decline</button></>}</div></div>)}{!hrFor(selected.id).some((record) => leaveRecordTypes.includes(record.record_type)) && <div className="employeeEmpty">No leave requests recorded.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">COMPANY PROPERTY</small><h3>Uniforms, Vehicles, Phones & Other Assets</h3></div>{data.permissions.canManageHrRecords && <div className="quickRecordActions"><button onClick={() => openHrRecord(selected,"Uniform / PPE")}>＋ Uniform / PPE</button><button onClick={() => openHrRecord(selected,"Company Vehicle")}>＋ Vehicle</button><button onClick={() => openHrRecord(selected,"Company Phone / SIM")}>＋ Phone / SIM</button></div>}</header><div className="historyList">{hrFor(selected.id).filter((record) => propertyRecordTypes.includes(record.record_type)).map((record) => <div className="historyItem profileAssetItem" key={record.id}><div><b>{record.record_type} · {record.title}</b><small>{formatDate(record.record_date)} · {record.status || "No status"}{record.reference ? ` · ${record.reference}` : ""}{record.details ? ` · ${record.details}` : ""}</small></div><div className="statusActions">{data.permissions.canManageHrRecords && /issued|allocated/i.test(record.status || "") && <button className="approve" onClick={() => void updateHrStatus(record,"Returned")}>Mark returned</button>}</div></div>)}{!hrFor(selected.id).some((record) => propertyRecordTypes.includes(record.record_type)) && <div className="employeeEmpty">No company property issued.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">DISCIPLINARY HISTORY</small><h3>Warnings ({selected.warning_count})</h3></div>{data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => openWarning(selected)}>＋ Issue warning</button>}</header><div className="historyList">{warningsFor(selected.id).map((warning) => <button key={warning.id} className="historyItem rowButton" onClick={() => setSelectedWarning(warning)}><b>{warning.warning_level} · {warning.reason}</b><small>{formatDate(warning.warning_date)} · {warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired"} · Issued by {warning.issued_by}</small></button>)}{!warningsFor(selected.id).length && <div className="employeeEmpty">No warnings recorded.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">DAILY ATTENDANCE LOG</small><h3>Recent Daily Records</h3></div></header><div className="historyList">{attendanceFor(selected.id).slice(0,60).map((record) => <div className="historyItem" key={record.id}><b>{formatDate(record.attendance_date)} · {record.status}{record.status === "Late" ? ` (${record.minutes_late} min)` : ""}</b><small>{record.absence_type || record.reason || record.recorded_by || "No additional detail"}</small></div>)}{!attendanceFor(selected.id).length && <div className="employeeEmpty">No attendance history yet.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">OTHER HR FILE HISTORY</small><h3>Training, Employment Changes & HR Notes</h3></div>{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected,"HR Note")}>＋ Add HR record</button>}</header><div className="historyList">{hrFor(selected.id).filter((record) => !leaveRecordTypes.includes(record.record_type) && !propertyRecordTypes.includes(record.record_type)).map((record) => <div className="historyItem" key={record.id}><b>{record.record_type} · {record.title}</b><small>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""} · {record.status || "No status"}{record.reference ? ` · ${record.reference}` : ""}</small>{record.details && <small>{record.details}</small>}</div>)}{!hrFor(selected.id).some((record) => !leaveRecordTypes.includes(record.record_type) && !propertyRecordTypes.includes(record.record_type)) && <div className="employeeEmpty">No additional HR history records yet.</div>}</div></section>
              {selected.notes && <section className="profileCard"><small className="sectionEyebrow">EMPLOYEE FILE NOTES</small><p style={{fontSize:"8px",color:"#52667a",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{selected.notes}</p></section>}
            </div>
          </section>
        </div>
      )}

      {selectedWarning && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelectedWarning(null)}><section className="employeeModal smallModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">WARNING RECORD</small><h2>{selectedWarning.warning_level}</h2><p>{employeeById(Number(selectedWarning.employee_id)) ? employeeName(employeeById(Number(selectedWarning.employee_id)) as Employee) : `Employee #${selectedWarning.employee_id}`}</p></div><button className="closeBtn" onClick={() => setSelectedWarning(null)}>×</button></header><div className="modalBody"><div className="warningDetailGrid"><div><span>Date</span><b>{formatDate(selectedWarning.warning_date)}</b></div><div><span>Status</span><b>{warningIsActive(selectedWarning,data.today) ? "Active" : selectedWarning.status === "Withdrawn" ? "Withdrawn" : "Expired"}</b></div><div><span>Reason</span><b>{selectedWarning.reason}</b></div><div><span>Issued by</span><b>{selectedWarning.issued_by || "—"}</b></div><div><span>Valid until</span><b>{formatDate(selectedWarning.valid_until)}</b></div><div><span>Acknowledgement</span><b>{selectedWarning.acknowledgement || "—"}</b></div></div><div className="warningDetailText">{selectedWarning.details || "No additional warning details were recorded."}</div><p className="privacyNote">This is a factual HR record. The Hub does not make disciplinary or termination decisions.</p></div><footer className="modalFooter">{warningIsActive(selectedWarning,data.today) && data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => void withdrawWarning(selectedWarning)}>Withdraw warning</button>}<button className="primaryBtn" onClick={() => setSelectedWarning(null)}>Close</button></footer></section></div>
      )}

      {attendanceModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setAttendanceModal(null)}><section className="employeeModal smallModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">ATTENDANCE · {data.today}</small><h2>{attendanceModal.status}</h2><p>{employeeName(attendanceModal.employee)}</p></div><button className="closeBtn" onClick={() => setAttendanceModal(null)}>×</button></header><div className="modalBody recordForm">{attendanceModal.status === "Late" ? <label className="span2">Minutes late *<input type="number" min="1" value={attendanceForm.minutesLate} onChange={(e) => setAttendanceForm({...attendanceForm,minutesLate:e.target.value})} /></label> : <label className="span2">Absence type<select value={attendanceForm.absenceType} onChange={(e) => setAttendanceForm({...attendanceForm,absenceType:e.target.value})}><option>Unauthorised absence</option><option>Sick</option><option>Annual leave</option><option>Family responsibility</option><option>Off day</option><option>Training</option><option>Other</option></select></label>}<label className="span2">Reason / note<textarea value={attendanceForm.reason} onChange={(e) => setAttendanceForm({...attendanceForm,reason:e.target.value})} /></label></div><footer className="modalFooter"><button className="secondaryBtn" onClick={() => setAttendanceModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={() => void saveAttendance()}>{saving ? "Saving…" : "Save"}</button></footer></section></div>
      )}

      {warningModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setWarningModal(null)}><section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">DISCIPLINARY RECORD</small><h2>Issue warning</h2><p>{employeeName(warningModal)} · {warningModal.employee_number}</p></div><button className="closeBtn" onClick={() => setWarningModal(null)}>×</button></header><div className="modalBody recordForm"><label>Warning date<input type="date" value={warningForm.warningDate} onChange={(e)=>setWarningForm({...warningForm,warningDate:e.target.value})}/></label><label>Warning level<select value={warningForm.warningLevel} onChange={(e)=>setWarningForm({...warningForm,warningLevel:e.target.value})}><option>Verbal</option><option>Written</option><option>Final written</option></select></label><label>Valid until<input type="date" value={warningForm.validUntil} onChange={(e)=>setWarningForm({...warningForm,validUntil:e.target.value})}/></label><label className="span2">Reason *<input value={warningForm.reason} onChange={(e)=>setWarningForm({...warningForm,reason:e.target.value})} placeholder="e.g. Repeated lateness"/></label><label>Issued by<input value={warningForm.issuedBy} onChange={(e)=>setWarningForm({...warningForm,issuedBy:e.target.value})}/></label><label className="span3">Full details<textarea value={warningForm.details} onChange={(e)=>setWarningForm({...warningForm,details:e.target.value})}/></label><label className="span3">Employee acknowledgement<textarea value={warningForm.acknowledgement} onChange={(e)=>setWarningForm({...warningForm,acknowledgement:e.target.value})}/></label></div><footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setWarningModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveWarning()}>{saving?"Saving…":"Record warning"}</button></footer></section></div>
      )}

      {hrModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setHrModal(null)}><section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">EMPLOYEE HR RECORD</small><h2>{hrForm.recordType === "Leave Request" ? "New leave request" : propertyRecordTypes.includes(hrForm.recordType) ? "Issue company property" : "Add file record"}</h2><p>{employeeName(hrModal)} · {hrModal.employee_number}</p></div><button className="closeBtn" onClick={()=>setHrModal(null)}>×</button></header><div className="modalBody recordForm">
          <label>Record type<select value={hrForm.recordType} onChange={(e)=>{ const type=e.target.value; setHrForm({...hrForm,recordType:type,status:type==="Leave Request"?"Requested":propertyRecordTypes.includes(type)?(type==="Company Vehicle"?"Allocated":"Issued"):""}); }}><option>Leave Request</option><option>Training / Certification</option><option>Uniform / PPE</option><option>Company Vehicle</option><option>Company Phone / SIM</option><option>Company Asset</option><option>Employment Change</option><option>HR Note</option></select></label>
          <label>{hrForm.recordType === "Leave Request" ? "Leave start date" : propertyRecordTypes.includes(hrForm.recordType) ? "Issue / allocation date" : "Start / record date"}<input type="date" value={hrForm.recordDate} onChange={(e)=>setHrForm({...hrForm,recordDate:e.target.value})}/></label>
          <label>{hrForm.recordType === "Leave Request" ? "Leave end date" : propertyRecordTypes.includes(hrForm.recordType) ? "Expected return date" : "End / expiry date"}<input type="date" value={hrForm.endDate} onChange={(e)=>setHrForm({...hrForm,endDate:e.target.value})}/></label>
          <label className="span2">{hrForm.recordType === "Leave Request" ? "Leave type *" : hrForm.recordType === "Uniform / PPE" ? "Uniform / PPE issued *" : hrForm.recordType === "Company Vehicle" ? "Vehicle make / model *" : hrForm.recordType === "Company Phone / SIM" ? "Phone / SIM item *" : "Title *"}<input value={hrForm.title} onChange={(e)=>setHrForm({...hrForm,title:e.target.value})} placeholder={hrForm.recordType === "Leave Request" ? "Annual Leave / Sick Leave / Family Responsibility" : hrForm.recordType === "Uniform / PPE" ? "e.g. 2 Golf Shirts XL + Safety Boots size 9" : hrForm.recordType === "Company Vehicle" ? "e.g. Toyota Hilux 2.4 GD-6" : hrForm.recordType === "Company Phone / SIM" ? "e.g. Samsung A55 + MTN SIM" : "Record title"}/></label>
          <label>Status<select value={hrForm.status} onChange={(e)=>setHrForm({...hrForm,status:e.target.value})}>{hrForm.recordType === "Leave Request" ? <><option>Requested</option><option>Approved</option><option>Declined</option><option>Cancelled</option><option>Taken</option></> : propertyRecordTypes.includes(hrForm.recordType) ? <><option>{hrForm.recordType === "Company Vehicle" ? "Allocated" : "Issued"}</option><option>Returned</option><option>Lost / Damaged</option><option>Replaced</option></> : <><option value="">No status</option><option>Active</option><option>Completed</option><option>Expired</option></>}</select></label>
          <label>{hrForm.recordType === "Company Vehicle" ? "Registration / fleet no." : hrForm.recordType === "Company Phone / SIM" ? "IMEI / mobile / SIM no." : hrForm.recordType === "Uniform / PPE" ? "Issue reference / size" : "Reference / certificate / asset no."}<input value={hrForm.reference} onChange={(e)=>setHrForm({...hrForm,reference:e.target.value})}/></label>
          <label className="span2">{hrForm.recordType === "Leave Request" ? "Leave reason / note" : propertyRecordTypes.includes(hrForm.recordType) ? "Condition, quantity, accessories & notes" : "Details"}<textarea value={hrForm.details} onChange={(e)=>setHrForm({...hrForm,details:e.target.value})}/></label>
          {hrForm.recordType === "Leave Request" && <div className="contextHint">Leave requests remain in the employee file permanently. Use Approved/Declined to record the management decision; the record is never deleted when the leave is completed.</div>}
          {propertyRecordTypes.includes(hrForm.recordType) && <div className="contextHint">For uniforms/PPE record quantity and sizes. For vehicles record registration/fleet number. For phones record device, IMEI and SIM/mobile number. When returned, use “Mark returned” from the employee file/property register.</div>}
        </div><footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setHrModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveHrRecord()}>{saving?"Saving…":hrForm.recordType === "Leave Request" ? "Save leave request" : propertyRecordTypes.includes(hrForm.recordType) ? "Issue / allocate" : "Add HR record"}</button></footer></section></div>
      )}

      {employeeModal && (
        <div className="overlay employeeOverlay" onMouseDown={()=>setEmployeeModal(null)}><section className="employeeModal" onMouseDown={(e)=>e.stopPropagation()}><header><div><small className="sectionEyebrow">EMPLOYEE MASTER FILE</small><h2>{employeeModal==="add"?"Add employee":"Edit employee file"}</h2><p>Employment, contact, contract and emergency information.</p></div><button className="closeBtn" onClick={()=>setEmployeeModal(null)}>×</button></header><div className="modalBody employeeForm">
          <label>Employee number *<input value={employeeForm.employeeNumber} onChange={(e)=>setEmployeeForm({...employeeForm,employeeNumber:e.target.value})}/></label><label>Location *<select value={employeeForm.workspace} onChange={(e)=>setEmployeeForm({...employeeForm,workspace:e.target.value})}>{data.stores.map((store)=><option key={store.id} value={store.name}>{store.name}</option>)}</select></label><label>Employment status<select value={employeeForm.employmentStatus} onChange={(e)=>setEmployeeForm({...employeeForm,employmentStatus:e.target.value})}><option>Active</option><option>On leave</option><option>Suspended</option><option>Resigned</option><option>Terminated</option></select></label>
          <label>First name *<input value={employeeForm.firstName} onChange={(e)=>setEmployeeForm({...employeeForm,firstName:e.target.value})}/></label><label>Surname *<input value={employeeForm.lastName} onChange={(e)=>setEmployeeForm({...employeeForm,lastName:e.target.value})}/></label><label>ID / Passport<input value={employeeForm.idNumber} onChange={(e)=>setEmployeeForm({...employeeForm,idNumber:e.target.value})}/></label>
          <label>Phone<input value={employeeForm.phone} onChange={(e)=>setEmployeeForm({...employeeForm,phone:e.target.value})}/></label><label>Email<input value={employeeForm.email} onChange={(e)=>setEmployeeForm({...employeeForm,email:e.target.value})}/></label><label>Residential address<input value={employeeForm.residentialAddress} onChange={(e)=>setEmployeeForm({...employeeForm,residentialAddress:e.target.value})}/></label>
          <label>Job title<input value={employeeForm.jobTitle} onChange={(e)=>setEmployeeForm({...employeeForm,jobTitle:e.target.value})}/></label><label>Department<input value={employeeForm.department} onChange={(e)=>setEmployeeForm({...employeeForm,department:e.target.value})}/></label><label>Supervisor / manager<input value={employeeForm.supervisor} onChange={(e)=>setEmployeeForm({...employeeForm,supervisor:e.target.value})}/></label>
          <label>Start date<input type="date" value={employeeForm.startDate} onChange={(e)=>setEmployeeForm({...employeeForm,startDate:e.target.value})}/></label><label>Probation end date<input type="date" value={employeeForm.probationEndDate} onChange={(e)=>setEmployeeForm({...employeeForm,probationEndDate:e.target.value})}/></label><label>Contract end date<input type="date" value={employeeForm.contractEndDate} onChange={(e)=>setEmployeeForm({...employeeForm,contractEndDate:e.target.value})}/></label>
          <label>Employment type<select value={employeeForm.employmentType} onChange={(e)=>setEmployeeForm({...employeeForm,employmentType:e.target.value})}><option>Permanent</option><option>Fixed-term</option><option>Temporary</option><option>Casual</option><option>Contractor</option></select></label><label>Emergency contact<input value={employeeForm.emergencyContactName} onChange={(e)=>setEmployeeForm({...employeeForm,emergencyContactName:e.target.value})}/></label><label>Emergency phone<input value={employeeForm.emergencyContactPhone} onChange={(e)=>setEmployeeForm({...employeeForm,emergencyContactPhone:e.target.value})}/></label>
          <label className="span3">Employee file notes<textarea value={employeeForm.notes} onChange={(e)=>setEmployeeForm({...employeeForm,notes:e.target.value})}/></label><p className="privacyNote span3">ID numbers, warnings and HR records are sensitive employee information. Keep access limited to authorised managers and HR.</p>
        </div><footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setEmployeeModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveEmployee()}>{saving?"Saving…":employeeModal==="add"?"Add employee":"Save employee file"}</button></footer></section></div>
      )}
    </section>
  );
}
