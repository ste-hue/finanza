// Types for financial data management with forecast/consolidated distinction
export interface FinanceEntry {
  id: string;
  companyId: string;
  categoryId: string;
  subcategoryId?: string;
  year: number;
  month: number;
  value: number;
  isProjection: boolean;
  isManuallyConsolidated?: boolean;
  consolidatedAt?: string;
  previousProjectedValue?: number; // Delta tracking
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthStatus {
  year: number;
  month: number;
  isConsolidated: boolean;
  consolidatedAt?: string;
  manuallyMarked?: boolean;
}

export interface Company {
  id: string;
  name: string;
  code: string; // ORTI, INTUR, etc.
  description?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'revenue' | 'expense' | 'balance' | 'financing';
  companyId: string;
  parentId?: string; // For subcategories
  order?: number;
}

export interface ViewFilter {
  mode: 'all' | 'consolidated' | 'projections';
  company: string;
  year: number;
}

export interface MonthlyData {
  month: number;
  year: number;
  consolidated: {
    revenues: number;
    expenses: number;
    hasData: boolean;
  };
  projections: {
    revenues: number;
    expenses: number;
    hasData: boolean;
  };
  delta?: {
    revenues: number;
    expenses: number;
  };
}

export interface AggregatedData {
  totalRevenues: number;
  totalExpenses: number;
  consolidatedRevenues: number;
  consolidatedExpenses: number;
  projectedRevenues: number;
  projectedExpenses: number;
  difference: number;
}

export interface DataContext {
  currentDate: Date;
  companies: Company[];
  activeCompany: Company | null;
  categories: Category[];
  monthStatuses: MonthStatus[];
  viewFilter: ViewFilter;
}