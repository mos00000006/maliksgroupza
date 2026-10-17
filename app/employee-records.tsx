"use client";

import { useEffect, useMemo, useState } from "react";
import { downloadEmployeeWarningPdf } from "./employee-warning-pdf";
import { buildEmployeePayslipPdfBlob, payslipPdfFileName } from "./employee-payslip-pdf";

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
type Payslip = {
  id: number;
  employee_id: number;
  workspace: string;
  pay_period_start: string;
  pay_period_end: string;
  payment_date: string;
  payment_method: string;
  payment_reference: string;
  basic_salary: number;
  overtime_hours: number;
  overtime_rate: number;
  overtime_amount: number;
  allowance_amount: number;
  commission_amount: number;
  bonus_amount: number;
  other_earnings: number;
  gross_pay: number;
  uif: number;
  loan_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  notes: string;
  employee_email: string;
  employee_whatsapp: string;
  generated_by: string;
  pdf_object_key: string;
  pdf_file_name: string;
  share_token: string;
  share_expires_at: string;
  status: string;
  created_at: string;
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
  payslips: Payslip[];
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
    canManagePayslips: boolean;
    canSeeFullId?: boolean;
  };
  today: string;
};

type Tab = "Employees" | "Attendance History" | "Leave Requests" | "Company Property" | "Warnings" | "Payslips" | "HR Records";

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
const isBusterBuildWorkspace = (value?: string) => /buster\s*build/i.test(String(value || ""));
const addSixMonthsIso = (value: string) => {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  parsed.setMonth(parsed.getMonth() + 6);
  return parsed.toISOString().slice(0, 10);
};
const employeeName = (employee: Employee) => `${employee.first_name} ${employee.last_name}`.trim();
const initials = (employee: Employee) => `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() || "ST";
const warningIsActive = (warning: Warning, today: string) => warning.status === "Active" && (!warning.valid_until || warning.valid_until >= today);
const rand = (value: unknown) => Number(value || 0).toLocaleString("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const payNumber = (value: unknown) => Math.max(0, Number(value) || 0);
const normaliseWhatsapp = (value: string) => {
  const digits = String(value || "").replace(/[^0-9+]/g, "").replace(/^\+/, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  return digits;
};

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

const southAfricaVehicleOptions = [
  "Toyota Hilux",
  "Toyota Quantum",
  "Toyota Fortuner",
  "Toyota Corolla Cross",
  "Toyota Starlet",
  "Toyota Rumion",
  "Ford Ranger",
  "Ford Everest",
  "Ford Transit",
  "Isuzu D-Max",
  "Isuzu MU-X",
  "Isuzu N-Series",
  "Volkswagen Polo Vivo",
  "Volkswagen Polo",
  "Volkswagen Amarok",
  "Volkswagen Caddy",
  "Volkswagen T-Cross",
  "Suzuki Swift",
  "Suzuki Fronx",
  "Suzuki Ertiga",
  "Suzuki Dzire",
  "Hyundai Grand i10",
  "Hyundai Venue",
  "Hyundai Creta",
  "Hyundai Staria",
  "Kia Picanto",
  "Kia Sonet",
  "Kia Seltos",
  "Nissan Navara",
  "Nissan Magnite",
  "Nissan Almera",
  "GWM P-Series / P500",
  "GWM Steed",
  "Haval Jolion",
  "Haval H6",
  "Chery Tiggo 4 Pro",
  "Chery Tiggo 7 Pro",
  "Chery Tiggo 8 Pro",
  "Mahindra Pik Up",
  "Mahindra Scorpio-N",
  "Mahindra XUV 3XO",
  "Renault Kwid",
  "Renault Triber",
  "Renault Kiger",
  "Peugeot Landtrek",
  "Foton Tunland",
  "Foton View",
  "Mercedes-Benz Sprinter",
  "Mercedes-Benz Vito",
  "BMW 3 Series",
  "BMW X1",
  "Audi A3",
  "Audi Q3",
];

const southAfricaPhoneSimOptions = [
  "Apple iPhone 16 / 16 Plus",
  "Apple iPhone 16 Pro / Pro Max",
  "Apple iPhone 15 / 15 Plus",
  "Apple iPhone 15 Pro / Pro Max",
  "Apple iPhone 14",
  "Apple iPhone SE",
  "Samsung Galaxy A06 / A16",
  "Samsung Galaxy A26",
  "Samsung Galaxy A36",
  "Samsung Galaxy A56",
  "Samsung Galaxy S24 / S24+",
  "Samsung Galaxy S24 Ultra",
  "Samsung Galaxy S25 / S25+",
  "Samsung Galaxy S25 Ultra",
  "Samsung Galaxy Z Flip",
  "Samsung Galaxy Z Fold",
  "Huawei nova series",
  "Huawei Pura series",
  "Honor X series",
  "Honor Magic series",
  "Oppo A series",
  "Oppo Reno series",
  "Xiaomi / Redmi Note series",
  "Xiaomi / Redmi A series",
  "Vivo Y series",
  "Vivo V series",
  "Tecno Spark series",
  "Tecno Camon series",
  "Nokia / HMD smartphone",
  "Motorola Moto G series",
  "Itel smartphone",
  "Vodacom SIM only",
  "MTN SIM only",
  "Telkom Mobile SIM only",
  "Cell C SIM only",
  "Rain SIM / eSIM only",
  "Company eSIM only",
];

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

.warningRowActions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.warningPdfBtn,.warningPdfPrimary{border:1px solid #d2a500;border-radius:8px;background:#f6ca2f;color:#172438;font:inherit;font-weight:900;cursor:pointer;box-shadow:0 2px 6px rgba(23,36,56,.08)}.warningPdfBtn{min-height:30px;padding:0 10px;font-size:7px}.warningPdfPrimary{min-height:38px;padding:0 14px;font-size:8px}.warningPdfBtn:hover:not(:disabled),.warningPdfPrimary:hover:not(:disabled){background:#ffd84f;border-color:#b99000}.warningPdfBtn:disabled,.warningPdfPrimary:disabled{opacity:.55;cursor:not-allowed}.warningHistoryItem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.warningHistoryOpen{width:100%;min-width:0}.warningHistoryOpen b,.warningHistoryOpen small{display:block}.warningHistoryItem .warningPdfBtn{white-space:nowrap}@media(max-width:620px){.warningRowActions{align-items:stretch;flex-direction:column}.warningRowActions .warningPdfBtn{width:100%}.warningHistoryItem{grid-template-columns:1fr}.warningHistoryItem .warningPdfBtn{width:100%;min-height:36px}}

.panelHeaderActions{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.panelHeaderActions button,.panelAddBtn{min-height:34px;border:1px solid #d2dce6;border-radius:8px;background:#fff;padding:0 10px;color:#35516d;font:inherit;font-size:7px;font-weight:900;cursor:pointer;white-space:nowrap}.panelHeaderActions button:hover,.panelAddBtn:hover{background:#f1f6fb;border-color:#bccbd9}.panelAddBtn{border-color:#d8af1b;background:#f6ca2f;color:#172438}.panelAddBtn:hover{background:#f2c21b;border-color:#c99f0c}.recordPickerOverlay{z-index:64}.recordPickerModal{width:min(720px,calc(100vw - 24px));max-height:min(720px,calc(100dvh - 24px))}.recordPickerBody{min-height:0;overflow-y:auto;padding:14px}.recordPickerSearch{height:42px;border:1px solid #d6e0e9;border-radius:10px;background:#f8fafc;display:flex;align-items:center;padding:0 11px;color:#7b8998}.recordPickerSearch input{flex:1;min-width:0;border:0;outline:0;background:transparent;padding:0 8px;color:#263e56;font:inherit;font-size:9px}.recordPickerList{display:grid;gap:7px;margin-top:10px}.recordPickerList>button{width:100%;display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid #dfe6ed;border-radius:11px;background:#fff;padding:9px 10px;text-align:left;cursor:pointer}.recordPickerList>button:hover{background:#f7fafc;border-color:#c9d5e0}.recordPickerList>button span{min-width:0}.recordPickerList>button b,.recordPickerList>button small{display:block}.recordPickerList>button b{color:#243c55;font-size:9px}.recordPickerList>button small{margin-top:3px;overflow:hidden;color:#8996a5;font-size:7px;text-overflow:ellipsis;white-space:nowrap}.recordPickerList>button em{color:#315a7e;font-size:7px;font-style:normal;font-weight:900;white-space:nowrap}@media(max-width:760px){.panelHeader{align-items:flex-start;flex-direction:column}.panelHeaderActions{width:100%;display:grid;grid-template-columns:1fr 1fr}.panelHeaderActions button,.panelAddBtn{width:100%;min-height:40px}.recordPickerModal{width:calc(100vw - 10px);max-height:calc(100dvh - 10px)}.recordPickerList>button{grid-template-columns:36px minmax(0,1fr);min-height:62px}.recordPickerList>button em{grid-column:2;margin-top:-5px}.recordPickerSearch{height:46px}}


.payslipRegister .registerHead,.payslipRegister .registerRow{grid-template-columns:1.15fr 1fr .85fr .85fr .8fr 1.45fr;min-width:980px}.payslipActions{display:flex;gap:6px;flex-wrap:wrap}.payslipActions button{min-height:30px;border:1px solid #d6e0e9;border-radius:8px;background:#fff;padding:0 9px;color:#35516d;font:inherit;font-size:6.5px;font-weight:900;cursor:pointer}.payslipActions .download{border-color:#d0a500;background:#f6ca2f;color:#172438}.payslipActions .whatsapp{border-color:#b9e2d1;color:#1a7655}.payslipActions .email{border-color:#bfd4ec;color:#245d9c}.payslipAmount{font-weight:900;color:#173b60}.payslipForm{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.payslipForm label{display:grid;gap:5px;color:#3d5268;font-size:7px;font-weight:850}.payslipForm input,.payslipForm select,.payslipForm textarea{width:100%;border:1px solid #d7e0e8;border-radius:8px;background:#fff;color:#21364e;padding:9px 10px;font:inherit;font-size:8px}.payslipForm textarea{min-height:78px;resize:vertical}.payslipForm .wide2{grid-column:span 2}.payslipForm .wide4{grid-column:1/-1}.payslipSectionTitle{grid-column:1/-1;margin:3px 0 -1px;padding-top:6px;border-top:1px solid #e8edf2;color:#1d4d78;font-size:7px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.payslipTotals{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.payslipTotals article{border:1px solid #dbe4ed;border-radius:11px;background:#f8fafc;padding:11px 12px}.payslipTotals span,.payslipTotals b{display:block}.payslipTotals span{color:#7a8999;font-size:6px;font-weight:900;text-transform:uppercase}.payslipTotals b{margin-top:5px;color:#183b5d;font-size:18px}.payslipTotals article.net{border-color:#e4bd21;background:#173a5e}.payslipTotals article.net span{color:#f5cd2c}.payslipTotals article.net b{color:#fff}.payslipGenerated{width:min(650px,calc(100vw - 26px))}.payslipGeneratedSummary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}.payslipGeneratedSummary article{border:1px solid #dce4ec;border-radius:10px;background:#f8fafc;padding:11px}.payslipGeneratedSummary span,.payslipGeneratedSummary b{display:block}.payslipGeneratedSummary span{font-size:6px;color:#7f8d9c;font-weight:900;text-transform:uppercase}.payslipGeneratedSummary b{margin-top:5px;font-size:13px;color:#203b56}.payslipShareNotice{border:1px solid #d9e3ec;border-radius:10px;background:#f7fafc;padding:10px;color:#61758a;font-size:7px;line-height:1.55}.payslipHistoryItem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}.payslipHistoryItem .payslipActions{justify-content:flex-end}.payslipPrimaryBtn{border:1px solid #d2a500!important;background:#f6ca2f!important;color:#172438!important}.payslipPickerBadge{display:inline-block;border-radius:999px;background:#e9f1fa;color:#285c89;padding:5px 8px;font-size:6px;font-weight:900}
@media(max-width:900px){.payslipForm{grid-template-columns:1fr 1fr}.payslipForm .wide4{grid-column:1/-1}.payslipGeneratedSummary{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.payslipForm{grid-template-columns:1fr}.payslipForm .wide2,.payslipForm .wide4{grid-column:1}.payslipTotals{grid-template-columns:1fr}.payslipGeneratedSummary{grid-template-columns:1fr}.payslipHistoryItem{grid-template-columns:1fr}.payslipActions{width:100%}.payslipActions button{flex:1;min-height:36px}}

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
  const [propertyChoice, setPropertyChoice] = useState("");
  const [recordPicker, setRecordPicker] = useState<{ recordType: HrRecord["record_type"]; heading: string } | null>(null);
  const [recordPickerSearch, setRecordPickerSearch] = useState("");
  const [payslipPicker, setPayslipPicker] = useState(false);
  const [payslipModal, setPayslipModal] = useState<Employee | null>(null);
  const [generatedPayslip, setGeneratedPayslip] = useState<Payslip | null>(null);
  const [payslipForm, setPayslipForm] = useState({
    payPeriodStart: "", payPeriodEnd: "", paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: "EFT", paymentReference: "",
    basicSalary: "", overtimeHours: "", overtimeRate: "", allowanceAmount: "", commissionAmount: "", bonusAmount: "", otherEarnings: "",
    uif: "", loanDeduction: "", otherDeductions: "", notes: "", employeeEmail: "", employeeWhatsapp: "",
  });

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
  const payslipsFor = (id: number) => (data?.payslips || []).filter((row) => Number(row.employee_id) === id);

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

  const filteredPayslips = useMemo(() => {
    if (!data?.permissions.canManagePayslips) return [];
    const needle = search.trim().toLowerCase();
    return (data.payslips || []).filter((payslip) => {
      const employee = data.employees.find((item) => item.id === Number(payslip.employee_id));
      return !needle || [employee ? employeeName(employee) : "", employee?.employee_number || "", payslip.pay_period_start, payslip.pay_period_end, payslip.payment_reference, payslip.generated_by].join(" ").toLowerCase().includes(needle);
    });
  }, [data, search]);

  const payslipTotals = useMemo(() => {
    const overtime = payNumber(payslipForm.overtimeHours) * payNumber(payslipForm.overtimeRate);
    const gross = payNumber(payslipForm.basicSalary) + overtime + payNumber(payslipForm.allowanceAmount) + payNumber(payslipForm.commissionAmount) + payNumber(payslipForm.bonusAmount) + payNumber(payslipForm.otherEarnings);
    const deductions = payNumber(payslipForm.uif) + payNumber(payslipForm.loanDeduction) + payNumber(payslipForm.otherDeductions);
    return { overtime, gross, deductions, net: gross - deductions };
  }, [payslipForm]);

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

  const openPayslip = (employee: Employee) => {
    const base = new Date(`${data?.today || new Date().toISOString().slice(0, 10)}T12:00:00`);
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    setPayslipForm({
      payPeriodStart: start.toISOString().slice(0, 10),
      payPeriodEnd: end.toISOString().slice(0, 10),
      paymentDate: data?.today || new Date().toISOString().slice(0, 10),
      paymentMethod: "EFT", paymentReference: "",
      basicSalary: "", overtimeHours: "", overtimeRate: "", allowanceAmount: "", commissionAmount: "", bonusAmount: "", otherEarnings: "",
      uif: "", loanDeduction: "", otherDeductions: "", notes: "",
      employeeEmail: employee.email || "", employeeWhatsapp: employee.phone || "",
    });
    setPayslipModal(employee);
  };

  const ensurePayslipPdf = async (payslip: Payslip, employee?: Employee | null) => {
    const person = employee || employeeById(Number(payslip.employee_id));
    if (!person) throw new Error("Employee file could not be found for this payslip.");
    if (payslip.pdf_object_key) return payslip;
    const blob = await buildEmployeePayslipPdfBlob({ employee: person, payslip });
    const form = new FormData();
    form.append("file", new File([blob], payslipPdfFileName(person, payslip), { type: "application/pdf" }));
    const response = await fetch(`/api/employees/payslips/${payslip.id}/pdf`, { method: "POST", body: form });
    const result = await response.json().catch(() => ({})) as { payslip?: Payslip; error?: string };
    if (!response.ok || !result.payslip) throw new Error(result.error || "Payslip PDF could not be stored.");
    return result.payslip;
  };

  const savePayslip = async () => {
    if (!payslipModal || saving) return;
    if (!payslipForm.payPeriodStart || !payslipForm.payPeriodEnd) return flash("Choose the payslip period start and end dates.");
    setSaving(true);
    try {
      const result = await post({ action: "payslip", employeeId: payslipModal.id, ...payslipForm }) as { payslip?: Payslip };
      if (!result.payslip) throw new Error("Payslip record was not returned.");
      const completed = await ensurePayslipPdf(result.payslip, payslipModal);
      setGeneratedPayslip(completed);
      setPayslipModal(null);
      flash(`Payslip generated for ${employeeName(payslipModal)}.`);
      await load(workspace);
    } catch (error) { flash(error instanceof Error ? error.message : "Payslip could not be generated."); }
    finally { setSaving(false); }
  };

  const downloadPayslip = async (payslip: Payslip, employee?: Employee | null) => {
    if (saving) return;
    setSaving(true);
    try {
      const completed = await ensurePayslipPdf(payslip, employee);
      const anchor = document.createElement("a");
      anchor.href = `/api/employees/payslips/${completed.id}/pdf`;
      anchor.download = completed.pdf_file_name || "PowerBuild_Payslip.pdf";
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setGeneratedPayslip(completed);
      flash("Payslip PDF downloaded.");
    } catch (error) { flash(error instanceof Error ? error.message : "Payslip could not be downloaded."); }
    finally { setSaving(false); }
  };

  const payslipShareLink = async (payslip: Payslip, employee?: Employee | null) => {
    const completed = await ensurePayslipPdf(payslip, employee);
    const response = await fetch(`/api/employees/payslips/${completed.id}/share`, { method: "POST" });
    const result = await response.json().catch(() => ({})) as { shareUrl?: string; error?: string };
    if (!response.ok || !result.shareUrl) throw new Error(result.error || "Payslip share link could not be created.");
    return { completed, shareUrl: result.shareUrl };
  };

  const sharePayslipFile = async (payslip: Payslip, employee?: Employee | null) => {
    if (saving) return;
    const person = employee || employeeById(Number(payslip.employee_id));
    if (!person) return flash("Employee file could not be found for this payslip.");
    setSaving(true);
    try {
      const completed = await ensurePayslipPdf(payslip, person);
      const response = await fetch(`/api/employees/payslips/${completed.id}/pdf`, { cache: "no-store" });
      if (!response.ok) throw new Error("Payslip PDF could not be loaded for sharing.");
      const blob = await response.blob();
      const file = new File([blob], completed.pdf_file_name || payslipPdfFileName(person, completed), { type: "application/pdf" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: `PowerBuild Payslip - ${employeeName(person)}`, text: `Payslip for ${formatDate(completed.pay_period_start)} to ${formatDate(completed.pay_period_end)}` });
        flash("Payslip PDF shared.");
      } else {
        const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1200);
        flash("This device cannot attach the PDF directly. The payslip was downloaded so you can attach it manually.");
      }
    } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; flash(error instanceof Error ? error.message : "Payslip PDF could not be shared."); }
    finally { setSaving(false); }
  };

  const sendPayslipWhatsapp = async (payslip: Payslip, employee?: Employee | null) => {
    if (saving) return;
    const person = employee || employeeById(Number(payslip.employee_id));
    const number = normaliseWhatsapp(payslip.employee_whatsapp || person?.phone || "");
    if (!number) return flash("Add the employee WhatsApp/mobile number before sending the payslip.");
    setSaving(true);
    try {
      const { shareUrl } = await payslipShareLink(payslip, person);
      const message = `Hi ${person ? employeeName(person) : ""}, your PowerBuild payslip for ${formatDate(payslip.pay_period_start)} to ${formatDate(payslip.pay_period_end)} is ready. Download the PDF here: ${shareUrl}`;
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
      flash("WhatsApp opened with the secure payslip PDF link. The link expires in 7 days.");
    } catch (error) { flash(error instanceof Error ? error.message : "Payslip could not be shared on WhatsApp."); }
    finally { setSaving(false); }
  };

  const sendPayslipEmail = async (payslip: Payslip, employee?: Employee | null) => {
    if (saving) return;
    const person = employee || employeeById(Number(payslip.employee_id));
    const email = (payslip.employee_email || person?.email || "").trim();
    if (!email) return flash("Add the employee email address before sending the payslip.");
    setSaving(true);
    try {
      const { shareUrl } = await payslipShareLink(payslip, person);
      const subject = `PowerBuild Payslip - ${formatDate(payslip.pay_period_end)}`;
      const body = `Hi ${person ? employeeName(person) : ""},

Your PowerBuild payslip for ${formatDate(payslip.pay_period_start)} to ${formatDate(payslip.pay_period_end)} is ready.

Download the PDF: ${shareUrl}

This secure link expires in 7 days.

Regards,
PowerBuild HR`;
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      flash("Email opened with the secure payslip PDF link. The link expires in 7 days.");
    } catch (error) { flash(error instanceof Error ? error.message : "Payslip could not be shared by email."); }
    finally { setSaving(false); }
  };

  const openWarning = (employee: Employee) => {
    const warningDate = data?.today || new Date().toISOString().slice(0, 10);
    setWarningForm({
      warningDate,
      warningLevel: "Written",
      reason: "",
      details: "",
      issuedBy: currentUser.name || "",
      validUntil: isBusterBuildWorkspace(employee.workspace) ? addSixMonthsIso(warningDate) : "",
      acknowledgement: "",
    });
    setWarningModal(employee);
  };

  const downloadWarningPdf = async (warning: Warning, employee?: Employee | null) => {
    const person = employee || employeeById(Number(warning.employee_id));
    if (!person) throw new Error("Employee file could not be found for this warning.");
    await downloadEmployeeWarningPdf({ employee: person, warning, generatedBy: currentUser.name || warning.issued_by || "" });
  };

  const handleWarningPdfDownload = async (warning: Warning, employee?: Employee | null) => {
    if (saving) return;
    setSaving(true);
    try {
      await downloadWarningPdf(warning, employee);
      const person = employee || employeeById(Number(warning.employee_id));
      flash(`Warning PDF downloaded${person ? ` for ${employeeName(person)}.` : "."}`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Warning PDF could not be downloaded.");
    } finally {
      setSaving(false);
    }
  };
  const saveWarning = async () => {
    if (!warningModal || saving) return;
    setSaving(true);
    try {
      const result = await post({ action: "warning", employeeId: warningModal.id, ...warningForm }) as { warning?: Warning };
      const savedWarning = result.warning || {
        id: Date.now(),
        employee_id: warningModal.id,
        workspace: warningModal.workspace,
        warning_date: warningForm.warningDate,
        warning_level: warningForm.warningLevel as Warning["warning_level"],
        reason: warningForm.reason,
        details: warningForm.details,
        issued_by: warningForm.issuedBy,
        valid_until: warningForm.validUntil,
        acknowledgement: warningForm.acknowledgement,
        status: "Active" as Warning["status"],
      };
      let pdfError = "";
      try {
        await downloadWarningPdf(savedWarning, warningModal);
      } catch (error) {
        pdfError = error instanceof Error ? error.message : "The warning PDF could not be generated.";
      }
      flash(pdfError ? `Warning recorded for ${employeeName(warningModal)}. ${pdfError}` : `Warning recorded for ${employeeName(warningModal)} and PDF downloaded.`);
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
    const title = type === "Leave Request" ? "Annual Leave" : type === "Uniform / PPE" ? "Uniform / PPE issue" : "";
    setPropertyChoice("");
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

  const warningModalIsBusterBuild = Boolean(warningModal && isBusterBuildWorkspace(warningModal.workspace));

  return (
    <section className="employeeRecords">
      <style>{CSS}</style>
      {message && <div className="toast">{message}</div>}

      <div className="employeeHero">
        <div>
          <small>POWERBUILD PEOPLE CONTROL</small>
          <h2>Employee Records, Attendance & HR History</h2>
          <p>Maintain employee files, attendance, leave, warnings, payroll payslips, uniforms/PPE, company assets, training and employment records.</p>
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
        {(["Employees", "Attendance History", "Leave Requests", "Company Property", "Warnings", ...(data.permissions.canManagePayslips ? ["Payslips"] : []), "HR Records"] as Tab[]).map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => { setActiveTab(tab); setSearch(""); }}>{tab}</button>)}
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
          <div className="panelHeader"><div><small className="sectionEyebrow">DISCIPLINARY REGISTER</small><h3>Warnings</h3><p>View every verbal, written and final written warning for this location. Use the yellow PDF button to download the printable PowerBuild warning form.</p></div></div>
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
                <div className="warningRowActions"><button className="rowButton" onClick={() => setSelectedWarning(warning)}>View warning</button><button className="warningPdfBtn" disabled={saving} onClick={() => void handleWarningPdfDownload(warning, employee)}>PDF</button></div>
              </div>;
            })}
            {!filteredWarnings.length && <div className="employeeEmpty">No warnings match this view.</div>}
          </div>
        </div>
      )}

      {activeTab === "Payslips" && data.permissions.canManagePayslips && (
        <div className="panel payslipRegister">
          <div className="panelHeader"><div><small className="sectionEyebrow">CONFIDENTIAL PAYROLL</small><h3>Payslips</h3><p>Generate premium PowerBuild payslips, keep a payroll history and share each PDF securely by WhatsApp or email.</p></div><button className="panelAddBtn" onClick={() => setPayslipPicker(true)}>＋ Generate payslip</button></div>
          <div className="tableWrap">
            <div className="registerHead"><span>Employee</span><span>Pay period</span><span>Gross pay</span><span>Deductions</span><span>Net pay</span><span>PDF / Send</span></div>
            {filteredPayslips.map((payslip) => {
              const employee = employeeById(Number(payslip.employee_id));
              return <div className="registerRow" key={payslip.id}>
                <button className="rowButton" onClick={() => employee && setSelected(employee)}>{employee ? employeeName(employee) : `Employee #${payslip.employee_id}`}<small>{employee?.employee_number || payslip.workspace}</small></button>
                <span className="stack"><b>{formatDate(payslip.pay_period_start)} → {formatDate(payslip.pay_period_end)}</b><small>Paid {formatDate(payslip.payment_date)} · {payslip.payment_method}</small></span>
                <span>{rand(payslip.gross_pay)}</span>
                <span>{rand(payslip.total_deductions)}</span>
                <span className="payslipAmount">{rand(payslip.net_pay)}</span>
                <div className="payslipActions"><button className="download" disabled={saving} onClick={() => void downloadPayslip(payslip, employee)}>↓ PDF</button><button className="whatsapp" disabled={saving} onClick={() => void sendPayslipWhatsapp(payslip, employee)}>WhatsApp</button><button className="email" disabled={saving} onClick={() => void sendPayslipEmail(payslip, employee)}>Email</button></div>
              </div>;
            })}
            {!filteredPayslips.length && <div className="employeeEmpty">No payslips have been generated for this location yet.</div>}
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

      {payslipPicker && data.permissions.canManagePayslips && (
        <div className="overlay employeeOverlay recordPickerOverlay" onMouseDown={() => setPayslipPicker(false)}>
          <section className="employeeModal recordPickerModal" onMouseDown={(e) => e.stopPropagation()}>
            <header><div><small className="sectionEyebrow">PAYROLL · SELECT EMPLOYEE</small><h2>Generate payslip</h2><p>Choose an employee to open the payroll capture form.</p></div><button className="closeBtn" onClick={() => setPayslipPicker(false)}>×</button></header>
            <div className="recordPickerBody"><div className="recordPickerList">{data.employees.map((employee) => <button key={employee.id} onClick={() => { setPayslipPicker(false); openPayslip(employee); }}><i className="avatar">{initials(employee)}</i><span><b>{employeeName(employee)}</b><small>{employee.employee_number || "No employee no."} · {employee.job_title || "No job title"} · {employee.department || "No department"}</small></span><em>Generate →</em></button>)}{!data.employees.length && <div className="employeeEmpty">No employees are available in this workspace.</div>}</div></div>
          </section>
        </div>
      )}

      {payslipModal && data.permissions.canManagePayslips && (
        <div className="overlay employeeOverlay" onMouseDown={() => !saving && setPayslipModal(null)}>
          <section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}>
            <header><div><small className="sectionEyebrow">CONFIDENTIAL PAYROLL</small><h2>Generate payslip</h2><p>{employeeName(payslipModal)} · {payslipModal.employee_number} · {payslipModal.workspace}</p></div><button className="closeBtn" disabled={saving} onClick={() => setPayslipModal(null)}>×</button></header>
            <div className="modalBody payslipForm">
              <div className="payslipSectionTitle">Pay period & payment</div>
              <label>Pay period start<input type="date" value={payslipForm.payPeriodStart} onChange={(e)=>setPayslipForm({...payslipForm,payPeriodStart:e.target.value})}/></label>
              <label>Pay period end<input type="date" value={payslipForm.payPeriodEnd} onChange={(e)=>setPayslipForm({...payslipForm,payPeriodEnd:e.target.value})}/></label>
              <label>Payment date<input type="date" value={payslipForm.paymentDate} onChange={(e)=>setPayslipForm({...payslipForm,paymentDate:e.target.value})}/></label>
              <label>Payment method<select value={payslipForm.paymentMethod} onChange={(e)=>setPayslipForm({...payslipForm,paymentMethod:e.target.value})}><option>EFT</option><option>Cash</option><option>Cheque</option><option>Other</option></select></label>
              <label className="wide2">Payment / bank reference<input value={payslipForm.paymentReference} onChange={(e)=>setPayslipForm({...payslipForm,paymentReference:e.target.value})} placeholder="Optional payroll reference"/></label>
              <label>Employee email<input type="email" value={payslipForm.employeeEmail} onChange={(e)=>setPayslipForm({...payslipForm,employeeEmail:e.target.value})}/></label>
              <label>Employee WhatsApp<input value={payslipForm.employeeWhatsapp} onChange={(e)=>setPayslipForm({...payslipForm,employeeWhatsapp:e.target.value})} placeholder="e.g. 071 234 5678"/></label>

              <div className="payslipSectionTitle">Earnings</div>
              <label>Basic salary (R)<input type="number" min="0" step="0.01" value={payslipForm.basicSalary} onChange={(e)=>setPayslipForm({...payslipForm,basicSalary:e.target.value})}/></label>
              <label>Overtime hours<input type="number" min="0" step="0.01" value={payslipForm.overtimeHours} onChange={(e)=>setPayslipForm({...payslipForm,overtimeHours:e.target.value})}/></label>
              <label>Overtime rate / hour (R)<input type="number" min="0" step="0.01" value={payslipForm.overtimeRate} onChange={(e)=>setPayslipForm({...payslipForm,overtimeRate:e.target.value})}/></label>
              <label>Overtime amount<input disabled value={rand(payslipTotals.overtime)}/></label>
              <label>Allowances (R)<input type="number" min="0" step="0.01" value={payslipForm.allowanceAmount} onChange={(e)=>setPayslipForm({...payslipForm,allowanceAmount:e.target.value})}/></label>
              <label>Commission (R)<input type="number" min="0" step="0.01" value={payslipForm.commissionAmount} onChange={(e)=>setPayslipForm({...payslipForm,commissionAmount:e.target.value})}/></label>
              <label>Bonus (R)<input type="number" min="0" step="0.01" value={payslipForm.bonusAmount} onChange={(e)=>setPayslipForm({...payslipForm,bonusAmount:e.target.value})}/></label>
              <label>Other earnings (R)<input type="number" min="0" step="0.01" value={payslipForm.otherEarnings} onChange={(e)=>setPayslipForm({...payslipForm,otherEarnings:e.target.value})}/></label>

              <div className="payslipSectionTitle">Deductions</div>
              <label>UIF (R)<input type="number" min="0" step="0.01" value={payslipForm.uif} onChange={(e)=>setPayslipForm({...payslipForm,uif:e.target.value})}/></label>
              <label>Loan / Advance (R)<input type="number" min="0" step="0.01" value={payslipForm.loanDeduction} onChange={(e)=>setPayslipForm({...payslipForm,loanDeduction:e.target.value})}/></label>
              <label>Other deductions (R)<input type="number" min="0" step="0.01" value={payslipForm.otherDeductions} onChange={(e)=>setPayslipForm({...payslipForm,otherDeductions:e.target.value})}/></label>
              <label className="wide4">Payroll notes<textarea value={payslipForm.notes} onChange={(e)=>setPayslipForm({...payslipForm,notes:e.target.value})} placeholder="Optional payroll note, allowance description or deduction explanation"/></label>
              <div className="payslipTotals"><article><span>Gross pay</span><b>{rand(payslipTotals.gross)}</b></article><article><span>Total deductions</span><b>{rand(payslipTotals.deductions)}</b></article><article className="net"><span>Net pay</span><b>{rand(payslipTotals.net)}</b></article></div>
              <p className="privacyNote wide4">The Hub totals only the deductions captured here: UIF, loan/advance and other deductions. Payroll values remain subject to your company payroll controls.</p>
            </div>
            <footer className="modalFooter"><button className="secondaryBtn" disabled={saving} onClick={() => setPayslipModal(null)}>Cancel</button><button className="primaryBtn payslipPrimaryBtn" disabled={saving} onClick={() => void savePayslip()}>{saving ? "Generating PDF…" : "Generate & save payslip"}</button></footer>
          </section>
        </div>
      )}

      {generatedPayslip && (
        <div className="overlay employeeOverlay" onMouseDown={() => !saving && setGeneratedPayslip(null)}>
          <section className="employeeModal payslipGenerated" onMouseDown={(e) => e.stopPropagation()}>
            <header><div><small className="sectionEyebrow">PAYSLIP READY</small><h2>{employeeById(Number(generatedPayslip.employee_id)) ? employeeName(employeeById(Number(generatedPayslip.employee_id)) as Employee) : "Employee payslip"}</h2><p>{formatDate(generatedPayslip.pay_period_start)} → {formatDate(generatedPayslip.pay_period_end)}</p></div><button className="closeBtn" onClick={() => setGeneratedPayslip(null)}>×</button></header>
            <div className="modalBody"><div className="payslipGeneratedSummary"><article><span>Gross pay</span><b>{rand(generatedPayslip.gross_pay)}</b></article><article><span>Deductions</span><b>{rand(generatedPayslip.total_deductions)}</b></article><article><span>Net pay</span><b>{rand(generatedPayslip.net_pay)}</b></article></div><p className="payslipShareNotice">The PDF is stored in the employee payroll history. WhatsApp and Email create a secure 7-day PDF download link for the employee. On devices that support native file sharing, you can also download the PDF and share the actual file.</p></div>
            <footer className="modalFooter payslipActions"><button className="download" disabled={saving} onClick={() => void downloadPayslip(generatedPayslip)}>↓ Download PDF</button><button className="download" disabled={saving} onClick={() => void sharePayslipFile(generatedPayslip)}>Share PDF file</button><button className="whatsapp" disabled={saving} onClick={() => void sendPayslipWhatsapp(generatedPayslip)}>Send WhatsApp</button><button className="email" disabled={saving} onClick={() => void sendPayslipEmail(generatedPayslip)}>Send Email</button><button className="secondaryBtn" onClick={() => setGeneratedPayslip(null)}>Close</button></footer>
          </section>
        </div>
      )}

      {selected && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelected(null)}>
          <section className="profileModal" onMouseDown={(e) => e.stopPropagation()}>
            <header><div className="profileHeader"><i className="avatar">{initials(selected)}</i><div><small className="sectionEyebrow">EMPLOYEE FILE · {selected.employee_number}</small><h2>{employeeName(selected)}</h2><p>{selected.job_title || "Job title not set"} · {selected.workspace}</p></div></div><div className="miniActions">{data.permissions.canManageEmployees && <button className="secondaryBtn" onClick={() => openEditEmployee(selected)}>Edit file</button>}{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected,"Leave Request")}>Leave request</button>}{data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => openWarning(selected)}>Issue warning</button>}{data.permissions.canManagePayslips && <button className="secondaryBtn payslipPrimaryBtn" onClick={() => openPayslip(selected)}>Generate payslip</button>}<button className="closeBtn" onClick={() => setSelected(null)}>×</button></div></header>
            <div className="profileBody">
              {(() => { const insight = attendanceInsights(selected.id); return <div className="profileStats"><article><span>Attended this week</span><b>{insight.week.attended}</b><small>{insight.week.late} late</small></article><article><span>Attended this month</span><b>{insight.month.attended}</b><small>{insight.month.late} late · {insight.month.lateMinutes} min</small></article><article><span>Absent this month</span><b>{insight.month.absent}</b><small>Not-at-work records</small></article><article><span>Warnings</span><b>{selected.warning_count}</b><small>{selected.active_warning_count} active</small></article><article><span>Year attendance</span><b>{insight.year.attended}</b><small>{insight.year.late} late · {insight.year.absent} absent</small></article></div>; })()}
              <div className="profileGrid">
                <section className="profileCard"><small className="sectionEyebrow">EMPLOYMENT</small><dl><div><dt>Employee no.</dt><dd>{selected.employee_number}</dd></div><div><dt>Job title</dt><dd>{selected.job_title || "—"}</dd></div><div><dt>Department</dt><dd>{selected.department || "—"}</dd></div><div><dt>Start date</dt><dd>{formatDate(selected.start_date)}</dd></div><div><dt>Probation ends</dt><dd>{formatDate(selected.probation_end_date)}</dd></div><div><dt>Contract ends</dt><dd>{formatDate(selected.contract_end_date)}</dd></div><div><dt>Supervisor</dt><dd>{selected.supervisor || "—"}</dd></div><div><dt>Status</dt><dd>{selected.employment_status}</dd></div></dl></section>
                <section className="profileCard"><small className="sectionEyebrow">CONTACT & IDENTIFICATION</small><dl><div><dt>ID / Passport</dt><dd>{selected.id_number || "—"}</dd></div><div><dt>Phone</dt><dd>{selected.phone || "—"}</dd></div><div><dt>Email</dt><dd>{selected.email || "—"}</dd></div><div><dt>Address</dt><dd>{selected.residential_address || "—"}</dd></div><div><dt>Emergency contact</dt><dd>{selected.emergency_contact_name || "—"}</dd></div><div><dt>Emergency phone</dt><dd>{selected.emergency_contact_phone || "—"}</dd></div></dl></section>
              </div>
              {(() => { const insight = attendanceInsights(selected.id); return <section className="historySection"><header><div><small className="sectionEyebrow">ATTENDANCE PERFORMANCE</small><h3>Weekly, Monthly & 12-Month Record</h3></div></header><div className="profileAttendanceSummary"><article><span>This week</span><b>{insight.week.attended}</b><small>days attended</small></article><article><span>This month</span><b>{insight.month.attended}</b><small>days attended</small></article><article><span>Late this month</span><b>{insight.month.late}</b><small>{insight.month.lateMinutes} minutes</small></article><article><span>Absent this month</span><b>{insight.month.absent}</b><small>days recorded absent</small></article><article><span>This year</span><b>{insight.year.attended}</b><small>days attended</small></article></div><div className="monthHistory"><div className="monthHistoryHead"><span>Month</span><span>Attended</span><span>Late</span><span>Absent</span><span>Late minutes</span></div>{insight.months.map((month) => <div className="monthHistoryRow" key={month.key}><b>{month.label}</b><span>{month.attended}</span><span>{month.late}</span><span>{month.absent}</span><span>{month.lateMinutes}</span></div>)}</div></section>; })()}
              <section className="historySection"><header><div><small className="sectionEyebrow">LEAVE REQUEST HISTORY</small><h3>Leave Requests</h3></div>{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected,"Leave Request")}>＋ New leave request</button>}</header><div className="historyList">{hrFor(selected.id).filter((record) => leaveRecordTypes.includes(record.record_type)).map((record) => <div className="historyItem profileAssetItem" key={record.id}><div><b>{record.title || "Leave"} · {record.status || "Requested"}</b><small>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""}{record.details ? ` · ${record.details}` : ""}</small></div><div className="statusActions">{data.permissions.canManageHrRecords && !/approved|declined|cancelled/i.test(record.status || "") && <><button className="approve" onClick={() => void updateHrStatus(record,"Approved")}>Approve</button><button className="decline" onClick={() => void updateHrStatus(record,"Declined")}>Decline</button></>}</div></div>)}{!hrFor(selected.id).some((record) => leaveRecordTypes.includes(record.record_type)) && <div className="employeeEmpty">No leave requests recorded.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">COMPANY PROPERTY</small><h3>Uniforms, Vehicles, Phones & Other Assets</h3></div>{data.permissions.canManageHrRecords && <div className="quickRecordActions"><button onClick={() => openHrRecord(selected,"Uniform / PPE")}>＋ Uniform / PPE</button><button onClick={() => openHrRecord(selected,"Company Vehicle")}>＋ Vehicle</button><button onClick={() => openHrRecord(selected,"Company Phone / SIM")}>＋ Phone / SIM</button></div>}</header><div className="historyList">{hrFor(selected.id).filter((record) => propertyRecordTypes.includes(record.record_type)).map((record) => <div className="historyItem profileAssetItem" key={record.id}><div><b>{record.record_type} · {record.title}</b><small>{formatDate(record.record_date)} · {record.status || "No status"}{record.reference ? ` · ${record.reference}` : ""}{record.details ? ` · ${record.details}` : ""}</small></div><div className="statusActions">{data.permissions.canManageHrRecords && /issued|allocated/i.test(record.status || "") && <button className="approve" onClick={() => void updateHrStatus(record,"Returned")}>Mark returned</button>}</div></div>)}{!hrFor(selected.id).some((record) => propertyRecordTypes.includes(record.record_type)) && <div className="employeeEmpty">No company property issued.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">DISCIPLINARY HISTORY</small><h3>Warnings ({selected.warning_count})</h3></div>{data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => openWarning(selected)}>＋ Issue warning</button>}</header><div className="historyList">{warningsFor(selected.id).map((warning) => <div key={warning.id} className="historyItem warningHistoryItem"><button className="rowButton warningHistoryOpen" onClick={() => setSelectedWarning(warning)}><b>{warning.warning_level} · {warning.reason}</b><small>{formatDate(warning.warning_date)} · {warningIsActive(warning, data.today) ? "Active" : warning.status === "Withdrawn" ? "Withdrawn" : "Expired"} · Issued by {warning.issued_by}</small></button><button className="warningPdfBtn" disabled={saving} onClick={() => void handleWarningPdfDownload(warning, selected)}>Download PDF</button></div>)}{!warningsFor(selected.id).length && <div className="employeeEmpty">No warnings recorded.</div>}</div></section>
              {data.permissions.canManagePayslips && <section className="historySection"><header><div><small className="sectionEyebrow">CONFIDENTIAL PAYROLL</small><h3>Payslip History ({payslipsFor(selected.id).length})</h3></div><button className="secondaryBtn payslipPrimaryBtn" onClick={() => openPayslip(selected)}>＋ Generate payslip</button></header><div className="historyList">{payslipsFor(selected.id).map((payslip) => <div className="historyItem payslipHistoryItem" key={payslip.id}><div><b>{formatDate(payslip.pay_period_start)} → {formatDate(payslip.pay_period_end)} · Net {rand(payslip.net_pay)}</b><small>Gross {rand(payslip.gross_pay)} · Deductions {rand(payslip.total_deductions)} · Paid {formatDate(payslip.payment_date)} · {payslip.generated_by}</small></div><div className="payslipActions"><button className="download" disabled={saving} onClick={() => void downloadPayslip(payslip, selected)}>↓ PDF</button><button className="whatsapp" disabled={saving} onClick={() => void sendPayslipWhatsapp(payslip, selected)}>WhatsApp</button><button className="email" disabled={saving} onClick={() => void sendPayslipEmail(payslip, selected)}>Email</button></div></div>)}{!payslipsFor(selected.id).length && <div className="employeeEmpty">No payslips generated for this employee yet.</div>}</div></section>}
              <section className="historySection"><header><div><small className="sectionEyebrow">DAILY ATTENDANCE LOG</small><h3>Recent Daily Records</h3></div></header><div className="historyList">{attendanceFor(selected.id).slice(0,60).map((record) => <div className="historyItem" key={record.id}><b>{formatDate(record.attendance_date)} · {record.status}{record.status === "Late" ? ` (${record.minutes_late} min)` : ""}</b><small>{record.absence_type || record.reason || record.recorded_by || "No additional detail"}</small></div>)}{!attendanceFor(selected.id).length && <div className="employeeEmpty">No attendance history yet.</div>}</div></section>
              <section className="historySection"><header><div><small className="sectionEyebrow">OTHER HR FILE HISTORY</small><h3>Training, Employment Changes & HR Notes</h3></div>{data.permissions.canManageHrRecords && <button className="secondaryBtn" onClick={() => openHrRecord(selected,"HR Note")}>＋ Add HR record</button>}</header><div className="historyList">{hrFor(selected.id).filter((record) => !leaveRecordTypes.includes(record.record_type) && !propertyRecordTypes.includes(record.record_type)).map((record) => <div className="historyItem" key={record.id}><b>{record.record_type} · {record.title}</b><small>{formatDate(record.record_date)}{record.end_date ? ` → ${formatDate(record.end_date)}` : ""} · {record.status || "No status"}{record.reference ? ` · ${record.reference}` : ""}</small>{record.details && <small>{record.details}</small>}</div>)}{!hrFor(selected.id).some((record) => !leaveRecordTypes.includes(record.record_type) && !propertyRecordTypes.includes(record.record_type)) && <div className="employeeEmpty">No additional HR history records yet.</div>}</div></section>
              {selected.notes && <section className="profileCard"><small className="sectionEyebrow">EMPLOYEE FILE NOTES</small><p style={{fontSize:"8px",color:"#52667a",lineHeight:1.5,whiteSpace:"pre-wrap"}}>{selected.notes}</p></section>}
            </div>
          </section>
        </div>
      )}

      {selectedWarning && (
        <div className="overlay employeeOverlay" onMouseDown={() => setSelectedWarning(null)}><section className="employeeModal smallModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">WARNING RECORD</small><h2>{selectedWarning.warning_level}</h2><p>{employeeById(Number(selectedWarning.employee_id)) ? employeeName(employeeById(Number(selectedWarning.employee_id)) as Employee) : `Employee #${selectedWarning.employee_id}`}</p></div><button className="closeBtn" onClick={() => setSelectedWarning(null)}>×</button></header><div className="modalBody"><div className="warningDetailGrid"><div><span>Date</span><b>{formatDate(selectedWarning.warning_date)}</b></div><div><span>Status</span><b>{warningIsActive(selectedWarning,data.today) ? "Active" : selectedWarning.status === "Withdrawn" ? "Withdrawn" : "Expired"}</b></div><div><span>Reason</span><b>{selectedWarning.reason}</b></div><div><span>Issued by</span><b>{selectedWarning.issued_by || "—"}</b></div><div><span>Valid until</span><b>{formatDate(selectedWarning.valid_until)}</b></div><div><span>Acknowledgement</span><b>{selectedWarning.acknowledgement || "—"}</b></div></div><div className="warningDetailText">{selectedWarning.details || "No additional warning details were recorded."}</div><p className="privacyNote">This is a factual HR record. The Hub does not make disciplinary or termination decisions.</p></div><footer className="modalFooter"><button className="warningPdfPrimary" disabled={saving} onClick={() => void handleWarningPdfDownload(selectedWarning)}>{saving ? "Preparing PDF…" : "↓ Download warning PDF"}</button>{warningIsActive(selectedWarning,data.today) && data.permissions.canIssueWarnings && <button className="secondaryBtn" onClick={() => void withdrawWarning(selectedWarning)}>Withdraw warning</button>}<button className="primaryBtn" onClick={() => setSelectedWarning(null)}>Close</button></footer></section></div>
      )}

      {attendanceModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setAttendanceModal(null)}><section className="employeeModal smallModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">ATTENDANCE · {data.today}</small><h2>{attendanceModal.status}</h2><p>{employeeName(attendanceModal.employee)}</p></div><button className="closeBtn" onClick={() => setAttendanceModal(null)}>×</button></header><div className="modalBody recordForm">{attendanceModal.status === "Late" ? <label className="span2">Minutes late *<input type="number" min="1" value={attendanceForm.minutesLate} onChange={(e) => setAttendanceForm({...attendanceForm,minutesLate:e.target.value})} /></label> : <label className="span2">Absence type<select value={attendanceForm.absenceType} onChange={(e) => setAttendanceForm({...attendanceForm,absenceType:e.target.value})}><option>Unauthorised absence</option><option>Sick</option><option>Annual leave</option><option>Family responsibility</option><option>Off day</option><option>Training</option><option>Other</option></select></label>}<label className="span2">Reason / note<textarea value={attendanceForm.reason} onChange={(e) => setAttendanceForm({...attendanceForm,reason:e.target.value})} /></label></div><footer className="modalFooter"><button className="secondaryBtn" onClick={() => setAttendanceModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={() => void saveAttendance()}>{saving ? "Saving…" : "Save"}</button></footer></section></div>
      )}

      {warningModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setWarningModal(null)}>
          <section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}>
            <header>
              <div>
                <small className="sectionEyebrow">DISCIPLINARY RECORD</small>
                <h2>Issue warning</h2>
                <p>{employeeName(warningModal)} · {warningModal.employee_number}</p>
              </div>
              <button className="closeBtn" onClick={() => setWarningModal(null)}>×</button>
            </header>
            <div className="modalBody recordForm">
              <label>Date issued
                <input
                  type="date"
                  value={warningForm.warningDate}
                  onChange={(e) => {
                    const warningDate = e.target.value;
                    setWarningForm({
                      ...warningForm,
                      warningDate,
                      validUntil: warningModalIsBusterBuild ? addSixMonthsIso(warningDate) : warningForm.validUntil,
                    });
                  }}
                />
              </label>
              <label>Warning level
                <select value={warningForm.warningLevel} onChange={(e)=>setWarningForm({...warningForm,warningLevel:e.target.value})}>
                  <option>Verbal</option><option>Written</option><option>Final written</option>
                </select>
              </label>
              <label>{warningModalIsBusterBuild ? "Expiry date" : "Valid until"}
                <input type="date" value={warningForm.validUntil} onChange={(e)=>setWarningForm({...warningForm,validUntil:e.target.value})}/>
              </label>
              <label className="span2">{warningModalIsBusterBuild ? "Nature of offence *" : "Reason *"}
                <input
                  value={warningForm.reason}
                  onChange={(e)=>setWarningForm({...warningForm,reason:e.target.value})}
                  placeholder={warningModalIsBusterBuild ? "e.g. Repeated lateness / misconduct / poor performance" : "e.g. Repeated lateness"}
                />
              </label>
              <label>Manager / issued by
                <input value={warningForm.issuedBy} onChange={(e)=>setWarningForm({...warningForm,issuedBy:e.target.value})}/>
              </label>
              <label className="span3">{warningModalIsBusterBuild ? "Short description" : "Full details"}
                <textarea value={warningForm.details} onChange={(e)=>setWarningForm({...warningForm,details:e.target.value})}/>
              </label>
              <label className="span3">{warningModalIsBusterBuild ? "Employee statement / comments / remarks (optional)" : "Employee acknowledgement"}
                <textarea value={warningForm.acknowledgement} onChange={(e)=>setWarningForm({...warningForm,acknowledgement:e.target.value})}/>
              </label>
              {warningModalIsBusterBuild ? (
                <p className="privacyNote span3">Buster Build warning PDFs include the employee’s full name and surname, employee number, job title, department, date issued, six-month expiry date, nature of offence, short description, the standard disciplinary procedure and appeal notice, plus signature sections for Manager, Employee and Witness.</p>
              ) : (
                <p className="privacyNote span3">When the warning is saved, PowerBuild Hub will automatically generate a printable PDF warning letter with signature lines for download.</p>
              )}
            </div>
            <footer className="modalFooter"><button className="secondaryBtn" onClick={()=>setWarningModal(null)}>Cancel</button><button className="primaryBtn" disabled={saving} onClick={()=>void saveWarning()}>{saving?"Saving…":"Record warning & download PDF"}</button></footer>
          </section>
        </div>
      )}

      {hrModal && (
        <div className="overlay employeeOverlay" onMouseDown={() => setHrModal(null)}><section className="employeeModal" onMouseDown={(e) => e.stopPropagation()}><header><div><small className="sectionEyebrow">EMPLOYEE HR RECORD</small><h2>{hrForm.recordType === "Leave Request" ? "New leave request" : propertyRecordTypes.includes(hrForm.recordType) ? "Issue company property" : "Add file record"}</h2><p>{employeeName(hrModal)} · {hrModal.employee_number}</p></div><button className="closeBtn" onClick={()=>setHrModal(null)}>×</button></header><div className="modalBody recordForm">
          <label>Record type<select value={hrForm.recordType} onChange={(e)=>{ const type=e.target.value; setPropertyChoice(""); setHrForm({...hrForm,recordType:type,title:type==="Leave Request"?"Annual Leave":type==="Uniform / PPE"?"Uniform / PPE issue":"",status:type==="Leave Request"?"Requested":propertyRecordTypes.includes(type)?(type==="Company Vehicle"?"Allocated":"Issued"):""}); }}><option>Leave Request</option><option>Training / Certification</option><option>Uniform / PPE</option><option>Company Vehicle</option><option>Company Phone / SIM</option><option>Company Asset</option><option>Employment Change</option><option>HR Note</option></select></label>
          <label>{hrForm.recordType === "Leave Request" ? "Leave start date" : propertyRecordTypes.includes(hrForm.recordType) ? "Issue / allocation date" : "Start / record date"}<input type="date" value={hrForm.recordDate} onChange={(e)=>setHrForm({...hrForm,recordDate:e.target.value})}/></label>
          <label>{hrForm.recordType === "Leave Request" ? "Leave end date" : propertyRecordTypes.includes(hrForm.recordType) ? "Expected return date" : "End / expiry date"}<input type="date" value={hrForm.endDate} onChange={(e)=>setHrForm({...hrForm,endDate:e.target.value})}/></label>

          {hrForm.recordType === "Company Vehicle" ? (
            <>
              <label className="span2">Vehicle make / model *
                <select
                  value={propertyChoice}
                  onChange={(e)=>{ const choice=e.target.value; setPropertyChoice(choice); setHrForm({...hrForm,title:choice==="Other"?"":choice}); }}
                >
                  <option value="">Select vehicle make / model…</option>
                  {southAfricaVehicleOptions.map((vehicle)=><option key={vehicle} value={vehicle}>{vehicle}</option>)}
                  <option value="Other">Other</option>
                </select>
              </label>
              {propertyChoice === "Other" && (
                <label className="span2">Other vehicle make / model *
                  <input
                    value={hrForm.title}
                    onChange={(e)=>setHrForm({...hrForm,title:e.target.value})}
                    placeholder="Type make and model, e.g. JAC T9 2.0T"
                    autoFocus
                  />
                </label>
              )}
            </>
          ) : hrForm.recordType === "Company Phone / SIM" ? (
            <>
              <label className="span2">Phone / SIM item *
                <select
                  value={propertyChoice}
                  onChange={(e)=>{ const choice=e.target.value; setPropertyChoice(choice); setHrForm({...hrForm,title:choice==="Other"?"":choice}); }}
                >
                  <option value="">Select phone / SIM item…</option>
                  {southAfricaPhoneSimOptions.map((item)=><option key={item} value={item}>{item}</option>)}
                  <option value="Other">Other</option>
                </select>
              </label>
              {propertyChoice === "Other" && (
                <label className="span2">Other phone / SIM item *
                  <input
                    value={hrForm.title}
                    onChange={(e)=>setHrForm({...hrForm,title:e.target.value})}
                    placeholder="Type device / SIM details"
                    autoFocus
                  />
                </label>
              )}
            </>
          ) : (
            <label className="span2">{hrForm.recordType === "Leave Request" ? "Leave type *" : hrForm.recordType === "Uniform / PPE" ? "Uniform / PPE issued *" : "Title *"}
              <input
                value={hrForm.title}
                onChange={(e)=>setHrForm({...hrForm,title:e.target.value})}
                placeholder={hrForm.recordType === "Leave Request" ? "Annual Leave / Sick Leave / Family Responsibility" : hrForm.recordType === "Uniform / PPE" ? "e.g. 2 Golf Shirts XL + Safety Boots size 9" : "Record title"}
              />
            </label>
          )}

          <label>Status<select value={hrForm.status} onChange={(e)=>setHrForm({...hrForm,status:e.target.value})}>{hrForm.recordType === "Leave Request" ? <><option>Requested</option><option>Approved</option><option>Declined</option><option>Cancelled</option><option>Taken</option></> : propertyRecordTypes.includes(hrForm.recordType) ? <><option>{hrForm.recordType === "Company Vehicle" ? "Allocated" : "Issued"}</option><option>Returned</option><option>Lost / Damaged</option><option>Replaced</option></> : <><option value="">No status</option><option>Active</option><option>Completed</option><option>Expired</option></>}</select></label>
          <label>{hrForm.recordType === "Company Vehicle" ? "Registration / fleet no." : hrForm.recordType === "Company Phone / SIM" ? "IMEI / mobile / SIM no." : hrForm.recordType === "Uniform / PPE" ? "Issue reference / size" : "Reference / certificate / asset no."}<input value={hrForm.reference} onChange={(e)=>setHrForm({...hrForm,reference:e.target.value})}/></label>
          <label className="span2">{hrForm.recordType === "Leave Request" ? "Leave reason / note" : propertyRecordTypes.includes(hrForm.recordType) ? "Condition, quantity, accessories & notes" : "Details"}<textarea value={hrForm.details} onChange={(e)=>setHrForm({...hrForm,details:e.target.value})}/></label>
          {hrForm.recordType === "Leave Request" && <div className="contextHint">Leave requests remain in the employee file permanently. Use Approved/Declined to record the management decision; the record is never deleted when the leave is completed.</div>}
          {propertyRecordTypes.includes(hrForm.recordType) && <div className="contextHint">Choose the vehicle or phone from the preset South African list. If it is not listed, select Other and type it manually. For uniforms/PPE record quantity and sizes. For vehicles record registration/fleet number. For phones record IMEI and SIM/mobile number. When returned, use “Mark returned” from the employee file/property register.</div>}
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
