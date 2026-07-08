"use client";

export interface EmployeeSession {
  name: string;
  redditUsername?: string;
}

export interface AdminSession {
  name: string;
}

const EMPLOYEE_KEY = "ret_employee";
const ADMIN_KEY = "ret_admin";

export function getEmployeeSession(): EmployeeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(EMPLOYEE_KEY);
    return raw ? (JSON.parse(raw) as EmployeeSession) : null;
  } catch {
    return null;
  }
}

export function setEmployeeSession(session: EmployeeSession): void {
  localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(session));
}

export function clearEmployeeSession(): void {
  localStorage.removeItem(EMPLOYEE_KEY);
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_KEY);
}
