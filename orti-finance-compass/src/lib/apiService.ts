// 🚀 UNIFIED API SERVICE - All Backend Communication
// Replaces direct Supabase calls with REST API calls

const API_BASE = 'http://localhost:8000';

export interface ApiEntry {
  id?: string;
  subcategory_id: string;
  year: number;
  month: number;
  value: number;
  is_projection: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // 📊 ENTRIES CRUD OPERATIONS
  // ============================================================================

  async createEntry(entry: Omit<ApiEntry, 'id'>): Promise<ApiResponse<ApiEntry>> {
    const response = await fetch(`${this.baseUrl}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`Create entry failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getEntry(entryId: string): Promise<ApiResponse<ApiEntry>> {
    const response = await fetch(`${this.baseUrl}/entries/${entryId}`);

    if (!response.ok) {
      throw new Error(`Get entry failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getEntries(filters: {
    subcategory_id?: string;
    year?: number;
    month?: number;
    is_projection?: boolean;
    limit?: number;
  } = {}): Promise<ApiResponse<ApiEntry[]>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/entries?${params}`);

    if (!response.ok) {
      throw new Error(`Get entries failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async updateEntry(entryId: string, updates: Partial<ApiEntry>): Promise<ApiResponse<ApiEntry>> {
    const response = await fetch(`${this.baseUrl}/entries/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Update entry failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // LEGACY: Update by subcategory + year + month (for existing frontend)
  async updateEntryLegacy(entry: Omit<ApiEntry, 'id'>): Promise<ApiResponse<ApiEntry>> {
    const response = await fetch(`${this.baseUrl}/entry`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error(`Update entry (legacy) failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async deleteEntry(entryId: string): Promise<ApiResponse<ApiEntry>> {
    const response = await fetch(`${this.baseUrl}/entries/${entryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Delete entry failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // 🏢 COMPANY OPERATIONS
  // ============================================================================

  async getCompanySummary(companyName: string, year: number, includeProjections: boolean = true): Promise<any> {
    const params = new URLSearchParams({
      include_projections: includeProjections.toString()
    });

    const response = await fetch(`${this.baseUrl}/companies/${companyName}/summary/${year}?${params}`);

    if (!response.ok) {
      throw new Error(`Get company summary failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getDataSummary(companyName: string, year: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/companies/${companyName}/data-summary?year=${year}`);

    if (!response.ok) {
      throw new Error(`Get data summary failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getVarianceAnalysis(companyName: string, year: number, month: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/companies/${companyName}/variance/${year}/${month}`);

    if (!response.ok) {
      throw new Error(`Get variance analysis failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // 📂 CATEGORIES OPERATIONS
  // ============================================================================

  async getCategories(companyName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/companies/${companyName}/categories`);

    if (!response.ok) {
      throw new Error(`Get categories failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // 📊 BULK OPERATIONS
  // ============================================================================

  async bulkImport(companyName: string, data: any): Promise<ApiResponse<any>> {
    const response = await fetch(`${this.baseUrl}/api/companies/${companyName}/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Bulk import failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================================================
  // 🔍 UTILITY METHODS
  // ============================================================================

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getStatus(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/status`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export class for custom instances
export default ApiService;