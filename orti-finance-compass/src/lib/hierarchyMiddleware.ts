// Local type definitions (avoiding deprecated dependencies)
interface Category {
  id: string;
  company_id: string;
  name: string;
  type_id: 'revenue' | 'expense' | 'balance' | 'financing' | 'calculation';
  is_total?: boolean;
  is_calculated?: boolean;
  calculation_formula?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Entry {
  id: string;
  subcategory_id: string;
  year: number;
  month: number;
  value: number;
  is_projection?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CategoryWithSubcategories extends Category {
  subcategories?: Subcategory[];
}

// Rappresentazione flattened per il frontend
export interface HierarchicalCategory {
  id: string;
  name: string;
  type_id: 'revenue' | 'expense' | 'balance' | 'financing' | 'calculation';
  is_total?: boolean;
  is_calculated?: boolean;
  sort_order: number;
  
  // Hierarchy info
  hasSubcategories: boolean;
  subcategories?: HierarchicalSubcategory[];
  
  // Aggregated entries for this category
  entries: ProcessedEntry[];
  monthlyTotals: Record<string, number>; // "2025-1" → total
}

export interface HierarchicalSubcategory {
  id: string;
  name: string;
  category_id: string;
  sort_order: number;
  entries: ProcessedEntry[];
}

export interface ProcessedEntry {
  id: string;
  subcategory_id: string;
  subcategory_name?: string;
  category_id: string; // Computed for compatibility
  category_name?: string;
  year: number;
  month: number;
  value: number;
  is_projection?: boolean;
  notes?: string;
  
  // UI helpers
  monthYear: string; // "2025-1"
  displayValue: string; // "€1,234.56"
}

export class HierarchyMiddleware {
  
  /**
   * Load full company hierarchy and process it for frontend consumption
   */
  static async loadCompanyHierarchy(companyId: string, year?: number): Promise<HierarchicalCategory[]> {
    // Get raw data from FinanceService
    const { categories } = await FinanceService.getCompanyData(companyId, year);
    
    // Process each category
    const processedCategories: HierarchicalCategory[] = [];
    
    for (const categoryData of categories) {
      const processedCategory = await this.processCategory(categoryData as CategoryWithSubcategories);
      processedCategories.push(processedCategory);
    }
    
    return processedCategories.sort((a, b) => a.sort_order - b.sort_order);
  }
  
  /**
   * Process a single category with its subcategories and entries
   */
  private static async processCategory(categoryData: CategoryWithSubcategories): Promise<HierarchicalCategory> {
    const hasSubcategories = (categoryData.subcategories?.length || 0) > 0;
    
    // Process subcategories if they exist
    const processedSubcategories: HierarchicalSubcategory[] = [];
    const allCategoryEntries: ProcessedEntry[] = [];
    
    if (hasSubcategories) {
      for (const subcategory of categoryData.subcategories || []) {
        const processedSubcategory = this.processSubcategory(subcategory, categoryData);
        processedSubcategories.push(processedSubcategory);
        
        // Add subcategory entries to category total
        allCategoryEntries.push(...processedSubcategory.entries);
      }
    }
    
    // Calculate monthly totals
    const monthlyTotals: Record<string, number> = {};
    allCategoryEntries.forEach(entry => {
      const key = entry.monthYear;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + entry.value;
    });
    
    return {
      id: categoryData.id,
      name: categoryData.name,
      type_id: categoryData.type_id,
      is_total: categoryData.is_total,
      is_calculated: categoryData.is_calculated,
      sort_order: categoryData.sort_order,
      hasSubcategories,
      subcategories: processedSubcategories,
      entries: allCategoryEntries,
      monthlyTotals
    };
  }

  /**
   * Process a subcategory with its entries
   */
  private static processSubcategory(
    subcategory: Subcategory & { entries?: Entry[] }, 
    parentCategory: Category
  ): HierarchicalSubcategory {
    const processedEntries = (subcategory.entries || []).map(entry => 
      this.processEntry(entry, subcategory, parentCategory)
    );
    
    return {
      id: subcategory.id,
      name: subcategory.name,
      category_id: subcategory.category_id,
      sort_order: subcategory.sort_order,
      entries: processedEntries
    };
  }
  
  /**
   * Process a single entry with UI helpers
   */
  private static processEntry(
    entry: Entry, 
    subcategory: Subcategory, 
    category: Category
  ): ProcessedEntry {
    return {
      id: entry.id,
      subcategory_id: entry.subcategory_id,
      subcategory_name: subcategory.name,
      category_id: category.id, // Computed for compatibility
      category_name: category.name,
      year: entry.year,
      month: entry.month,
      value: entry.value,
      is_projection: entry.is_projection,
      notes: entry.notes,
      
      // UI helpers
      monthYear: `${entry.year}-${entry.month}`,
      displayValue: this.formatCurrency(entry.value)
    };
  }
  
  /**
   * Create or update an entry (handles subcategory creation automatically)
   */
  static async upsertEntry(
    categoryId: string,
    subcategoryName: string | null, // If null, creates default subcategory
    year: number,
    month: number,
    value: number,
    isProjection: boolean = false,
    notes?: string
  ): Promise<ProcessedEntry> {
    
    // Get or create subcategory
    let subcategoryId: string;
    
    if (subcategoryName) {
      // 🚀 REFACTORED: Find existing subcategory or create new one via API
      console.log('🔄 Getting subcategories via API Backend for category:', categoryId);
      
      try {
        const response = await fetch('http://localhost:8000/companies/ORTI/categories');
        const result = await response.json();
        
        if (result.success) {
          const category = result.categories?.find((cat: any) => cat.id === categoryId);
          const existingSubcategories = category?.subcategories || [];
          let subcategory = existingSubcategories.find((s: any) => s.name === subcategoryName);
          
          if (!subcategory) {
            // Create new subcategory via API
            console.log('🆕 Creating subcategory via API:', subcategoryName);
            const createResponse = await fetch(`http://localhost:8000/categories/${categoryId}/subcategories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: subcategoryName,
                sort_order: existingSubcategories.length + 1
              })
            });
            
            const createResult = await createResponse.json();
            if (createResult.success) {
              subcategory = createResult.subcategory;
            } else {
              throw new Error(`Failed to create subcategory: ${createResult.message}`);
            }
          }
          
          subcategoryId = subcategory.id;
        } else {
          throw new Error('Failed to get categories from API');
        }
      } catch (error) {
        console.error('❌ Error in subcategory operations:', error);
        throw error;
      }
    } else {
      // 🚀 REFACTORED: Create/use default subcategory via API
      console.log('🔄 Getting/creating default subcategory for category:', categoryId);
      
      try {
        const response = await fetch('http://localhost:8000/companies/ORTI/categories');
        const result = await response.json();
        
        if (result.success) {
          const category = result.categories?.find((cat: any) => cat.id === categoryId);
          const existingSubcategories = category?.subcategories || [];
          let defaultSubcategory = existingSubcategories.find((s: any) => s.name === 'Default');
          
          if (!defaultSubcategory) {
            // Create default subcategory via API  
            const createResponse = await fetch(`http://localhost:8000/categories/${categoryId}/subcategories`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'Default',
                sort_order: 0
              })
            });
            
            const createResult = await createResponse.json();
            if (createResult.success) {
              defaultSubcategory = createResult.subcategory;
            } else {
              throw new Error(`Failed to create default subcategory: ${createResult.message}`);
            }
          }
          
          subcategoryId = defaultSubcategory.id;
        } else {
          throw new Error('Failed to get categories from API');
        }
      } catch (error) {
        console.error('❌ Error in default subcategory operations:', error);
        throw error;
      }
  }
  
    // 🚀 REFACTORED: Create/update entry via API Backend
    console.log('🔄 Creating/updating entry via API Backend');
    
    let entry: any;
    try {
      const entryResponse = await fetch('http://localhost:8000/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategory_id: subcategoryId,
          year,
          month,
          value,
          is_projection: isProjection,
          notes
        })
      });
      
      const entryResult = await entryResponse.json();
      if (entryResult.success) {
        entry = entryResult.data;
        console.log('✅ Entry created/updated via API');
      } else {
        throw new Error(`Failed to create/update entry: ${entryResult.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating/updating entry:', error);
      throw error;
    }
    
    // Get fresh subcategory data via API  
    let subcategory: any;
    try {
      const response = await fetch('http://localhost:8000/companies/ORTI/categories');
      const result = await response.json();
      
      if (result.success) {
        const category = result.categories?.find((cat: any) => cat.id === categoryId);
        const subcategories = category?.subcategories || [];
        subcategory = subcategories.find((s: any) => s.id === subcategoryId);
        
        if (!subcategory) {
          throw new Error(`Subcategory with id ${subcategoryId} not found`);
        }
      } else {
        throw new Error('Failed to get fresh subcategory data from API');
      }
    } catch (error) {
      console.error('❌ Error getting fresh subcategory data:', error);
      throw error;
    }
    
    // We need to get the category data - let's use a different approach
    const categoryInfo = {
      id: categoryId,
      company_id: '', // Fallback
      name: subcategory.name, // Fallback
      type_id: 'expense' as const,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return this.processEntry(entry, subcategory, categoryInfo);
        }
  
  /**
   * Delete an entry
   */
  static async deleteEntry(subcategoryId: string, year: number, month: number): Promise<void> {
    await FinanceService.deleteEntry(subcategoryId, year, month);
  }
  
  /**
   * Get monthly totals for a company (aggregated by type)
   */
  static async getMonthlyTotals(companyId: string, year: number, month: number) {
    return await FinanceService.getMonthlyTotals(companyId, year, month);
  }
  
  /**
   * Utility: Format currency for display
   */
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  /**
   * Utility: Get all entries for a category (flattened from subcategories)
   */
  static async getCategoryEntries(categoryId: string, year?: number): Promise<ProcessedEntry[]> {
    const entries = await FinanceService.getCategoryEntries(categoryId, year);
    
    // We need to enrich with subcategory info
    const subcategories = await FinanceService.getSubcategories(categoryId);
    
    return entries.map(entry => {
      const subcategory = subcategories.find(s => s.id === entry.subcategory_id)!;
              const categoryInfo = {
          id: categoryId,
          company_id: '', // Fallback
          name: subcategory.name,
          type_id: 'expense' as const,
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      return this.processEntry(entry, subcategory, categoryInfo);
    });
  }
} 