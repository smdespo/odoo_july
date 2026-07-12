import httpClient from "./httpClient";
import { USE_MOCK, mockDelay } from "./config";
import { fuelLogs, expenses } from "../data/mockData";

// Contract: GET /fuel-logs -> FuelLog[]
export async function getFuelLogs() {
  if (USE_MOCK) {
    await mockDelay();
    return [...fuelLogs];
  }
  const { data } = await httpClient.get("/fuel-logs");
  return data;
}

// Contract: POST /fuel-logs -> FuelLog
export async function createFuelLog(payload) {
  if (USE_MOCK) {
    await mockDelay();
    const newLog = { id: `F-${Date.now()}`, ...payload };
    fuelLogs.push(newLog);
    return newLog;
  }
  const { data } = await httpClient.post("/fuel-logs", payload);
  return data;
}

// Contract: GET /expenses -> Expense[]
export async function getExpenses() {
  if (USE_MOCK) {
    await mockDelay();
    return [...expenses];
  }
  const { data } = await httpClient.get("/expenses");
  return data;
}

// Contract: POST /expenses -> Expense
export async function createExpense(payload) {
  if (USE_MOCK) {
    await mockDelay();
    const newExpense = { id: `E-${Date.now()}`, ...payload };
    expenses.push(newExpense);
    return newExpense;
  }
  const { data } = await httpClient.post("/expenses", payload);
  return data;
}