// FinCal Types
export interface FinCalEntry {
  id: string;
  value: number;
  isProjection: boolean;
  notes?: string;
  attachments?: string[];
  lastUpdated: string;
}

export interface FinCalSubCategory {
  id: string;
  name: string;
  entries: Record<string, FinCalEntry>; // month-year key
}

export interface FinCalCategory {
  id: string;
  name: string;
  type: 'revenue' | 'expense' | 'balance' | 'calculation';
  subcategories: Record<string, FinCalSubCategory>;
  isTotal?: boolean;
  isCalculated?: boolean;
  calculationFormula?: string;
}

export interface FinCalCompany {
  id: string;
  name: string;
  description?: string;
  categories: Record<string, FinCalCategory>;
  bankAccounts: Record<string, BankAccount>;
  financingLines: Record<string, FinancingLine>;
  createdAt: string;
  lastUpdated: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit';
  lastUpdated: string;
}

export interface FinancingLine {
  id: string;
  name: string;
  amount: number;
  availableAmount: number;
  interestRate: number;
  maturityMonths: number;
  type: 'credit_line' | 'loan' | 'mortgage';
  lastUpdated: string;
}

export interface FinCalState {
  companies: Record<string, FinCalCompany>;
  activeCompanyId: string | null;
  currentYear: number;
  currentMonth: number;
}

// Utility types for calculations
export interface MonthlyTotals {
  revenues: number;
  expenses: number;
  difference: number;
  bankBalance: number;
  cashFlow: number;
  financingTotal: number;
  cashFlowWithFinancing: number;
}

export interface YearlyProjection {
  totalRevenues: number;
  totalExpenses: number;
  netResult: number;
  avgMonthlyRevenue: number;
  avgMonthlyExpense: number;
  peakMonth: string;
  lowMonth: string;
}

// Data import/export types
export interface ORTIHistoricalData {
  ricavi: {
    [year: string]: {
      ANGELINARES: Record<string, number>;
      HOMEHOLIDAY: Record<string, number>;
      PANORAMAHT: Record<string, number>;
      CVM?: Record<string, number>;
      TOTALE: Record<string, number>;
    };
  };
}

export interface FinCalExport {
  companies: Record<string, FinCalCompany>;
  exportedAt: string;
  version: string;
}