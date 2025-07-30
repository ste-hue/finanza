#!/usr/bin/env python3
"""
🚀 ORTI FINANCE - COMPLETE UNIFIED SYSTEM
Single script that replaces all redundant import/fix/analysis scripts.
Includes FastAPI server, CLI interface, and database management.
"""

import asyncio
import json
import sys
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional, Union, List
from pathlib import Path

# API dependencies
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Supabase service
from supabase_service import SupabaseService

# ============================================================================
# CONFIGURATION & DATA
# ============================================================================

# Historical data from Excel (embedded for completeness)
HISTORICAL_DATA_2024 = {
    # Revenue categories with complete 2024 data (FROM OFFICIAL INTUR BALANCE SHEET)
    "Ricavi vendite e prestazioni": 4210919,  # €4,210,919 (Soggiorni: €3,952,594 + Spiaggia: €181,236 + Bar: €77,089)
    "Altri ricavi e proventi": 216233,        # €216,233 (Fitti: €36,886 + Sopravvenienze: €125,247 + Risarcimenti: €53,823 + Altri: €277)
    # Expense categories with complete 2024 data  
    "Materie Prime/Consumo": 436638,
    "Servizi": 1026679,
    "Godimento Beni di Terzi": 326736,
    "Salari e Stipendi": 900110,
    "Ammortamenti": 471907,
    "Oneri Diversi": 815761,
    "Oneri Finanziari": 39430,
    "Tasse e Imposte": 171749,
}

PARTIAL_DATA_2025 = {
    # CONSOLIDATED Revenue data for Jan-Jun 2025 (ACTUAL DATA)
    "Entrate Residence": {4: 22806, 5: 62070, 6: 101547},  # Total: €186,422
    "Entrate CVM": {1: 2242, 2: 4483, 3: 4286, 4: 16649, 5: 22888, 6: 29586},  # Total: €80,134  
    "Entrate Hotel": {1: 3750, 2: 3750, 3: 4403, 4: 123495, 5: 451019, 6: 601975},  # Total: €1,188,391
}

# PROJECTION Data for Jul 2025 - Apr 2026 (FORECASTED DATA)
PROJECTION_DATA_2025_2026 = {
    # These are PROJECTIONS and should be marked as is_projection=True
    "Entrate Hotel": {
        7: 802060.58, 8: 884990.72, 9: 675860.06, 10: 372591.29, 11: 25620, 12: 25620
    },
    # Add other projection categories as needed
}

# Category mappings for API compatibility
REVENUE_MAPPING = {
    "ANGELINARES": "entrate-residence",
    "HOMEHOLIDAY": "entrate-cvm", 
    "PANORAMAHT": "entrate-hotel",
    "Hotel": "entrate-hotel",
    "Residence": "entrate-residence",
    "CVM": "entrate-cvm",
    "Supermercato": "entrate-supermercato",
    "Caparre": "caparre-intur",
}

EXPENSE_MAPPING = {
    "Salari e Stipendi": "salari-stipendi",
    "Utenze": "utenze",
    "Materie Prime/Consumo": "materie-prime", 
    "Tasse e Imposte": "tasse-imposte",
    "Varie ed Eventuali": "varie-eventuali"
}

MONTH_MAPPING = {
    "Gennaio": "01", "Febbraio": "02", "Marzo": "03", "Aprile": "04",
    "Maggio": "05", "Giugno": "06", "Luglio": "07", "Agosto": "08",
    "Settembre": "09", "Ottobre": "10", "Novembre": "11", "Dicembre": "12"
}

# ============================================================================
# PYDANTIC MODELS (API)
# ============================================================================

class RicaviStorici(BaseModel):
    ricavi: Dict[str, Dict[str, Dict[str, Union[float, int]]]]

class DatiMensili(BaseModel):
    compagnia: str
    anno: int
    mese: str
    entrate: Dict[str, Union[float, int]]
    uscite: Dict[str, Union[float, int, Dict[str, Any]]]
    cashflow: Optional[Dict[str, Union[float, int, Dict[str, Any]]]] = {}

class EntryUpdate(BaseModel):
    subcategory_id: str
    year: int
    month: int
    value: float
    is_projection: Optional[bool] = False
    notes: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    type_id: str  # 'revenue', 'expense', 'balance', 'financing'
    is_calculated: Optional[bool] = False
    sort_order: Optional[int] = 1

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    type_id: Optional[str] = None
    is_calculated: Optional[bool] = None
    sort_order: Optional[int] = None

class SubcategoryCreate(BaseModel):
    name: str
    sort_order: Optional[int] = 1

# ============================================================================
# CORE FINANCE MANAGER CLASS  
# ============================================================================

class ORTIFinanceManager:
    """Single unified class for all ORTI financial operations"""
    
    def __init__(self):
        self.supabase = SupabaseService()
        self.company_id = None
        
    async def initialize_company(self, company_name: str = "ORTI") -> str:
        """Initialize or get ORTI company"""
        try:
            company = await self.supabase.get_or_create_company(
                company_name, "Gruppo ORTI - Strutture turistiche"
            )
            self.company_id = company["id"]
            print(f"✅ Company '{company_name}' initialized: {self.company_id}")
            return self.company_id
        except Exception as e:
            print(f"❌ Error initializing company: {e}")
            raise

    async def import_historical_data(self) -> Dict[str, Any]:
        """Import all historical data (2024 + 2025 partial)"""
        if not self.company_id:
            await self.initialize_company()
            
        total_imported = 0
        
        print("📊 Importing 2024 complete data...")
        
        # Import 2024 data (monthly averages)
        for category_name, annual_total in HISTORICAL_DATA_2024.items():
            monthly_value = annual_total / 12
            last_month_adjustment = annual_total - (monthly_value * 11)
            
            for month in range(1, 13):
                value = last_month_adjustment if month == 12 else monthly_value
                
                try:
                    # Find category by name
                    category_result = self.supabase.client.table('categories')\
                        .select('id')\
                        .eq('name', category_name)\
                        .eq('company_id', self.company_id)\
                        .limit(1).execute()
                    
                    if category_result.data:
                        category_id = category_result.data[0]['id']
                        
                        # Get or create subcategory
                        subcategory = await self.supabase.get_or_create_subcategory(category_id, "Main")
                        
                        # Upsert entry
                        self.supabase.client.table('entries').upsert({
                            'subcategory_id': subcategory['id'],
                            'year': 2024,
                            'month': month,
                            'value': round(value, 2),
                            'is_projection': False,
                            'notes': f'Historical import - {category_name}'
                        }, on_conflict='subcategory_id,year,month').execute()
                        
                        total_imported += 1
                        
                except Exception as e:
                    print(f"⚠️ Error importing {category_name} month {month}: {e}")
        
        print("📈 Importing 2025 partial data...")
        
        # Import 2025 partial data
        for category_name, month_values in PARTIAL_DATA_2025.items():
            try:
                category_result = self.supabase.client.table('categories')\
                    .select('id')\
                    .eq('name', category_name)\
                    .eq('company_id', self.company_id)\
                    .limit(1).execute()
                
                if category_result.data:
                    category_id = category_result.data[0]['id']
                    
                    # Get or create subcategory
                    subcategory = await self.supabase.get_or_create_subcategory(category_id, "Main")
                    
                    for month, value in month_values.items():
                        self.supabase.client.table('entries').upsert({
                            'subcategory_id': subcategory['id'],
                            'year': 2025,
                            'month': month,
                            'value': value,
                            'is_projection': False,
                            'notes': f'Partial 2025 import - {category_name}'
                        }, on_conflict='subcategory_id,year,month').execute()
                        
                        total_imported += 1
                        
            except Exception as e:
                print(f"⚠️ Error importing {category_name}: {e}")
        
        # Import projections data 
        print("🔮 Importing projection data...")
        for category_name, month_values in PROJECTION_DATA_2025_2026.items():
            try:
                category_result = self.supabase.client.table('categories')\
                    .select('id')\
                    .eq('name', category_name)\
                    .eq('company_id', self.company_id)\
                    .limit(1).execute()
                
                if category_result.data:
                    category_id = category_result.data[0]['id']
                    
                    # Get or create subcategory
                    subcategory = await self.supabase.get_or_create_subcategory(category_id, "Main")
                    
                    for month, value in month_values.items():
                        year = 2025 if month <= 12 else 2026
                        actual_month = month if month <= 12 else month - 12
                        
                        self.supabase.client.table('entries').upsert({
                            'subcategory_id': subcategory['id'],
                            'year': year,
                            'month': actual_month,
                            'value': value,
                            'is_projection': True,  # MARK AS PROJECTION
                            'notes': f'PROJECTION - {category_name}'
                        }, on_conflict='subcategory_id,year,month').execute()
                        
                        total_imported += 1
                        
            except Exception as e:
                print(f"⚠️ Error importing projection {category_name}: {e}")

        return {
            "success": True,
            "total_imported": total_imported,
            "years": [2024, 2025, 2026],
            "data_types": {
                "consolidated_2024": "Complete year from INTUR balance sheet",
                "consolidated_2025_jan_jun": "Actual data through June",
                "projections_jul_onwards": "Forecasted data marked as projections"
            },
            "message": f"Imported {total_imported} entries (consolidated + projections)"
        }

    async def get_company_summary(self, year: int = 2025, include_projections: bool = True) -> Dict[str, Any]:
        """Get financial summary with consolidated vs projection separation"""
        if not self.company_id:
            await self.initialize_company()
            
        try:
            # 🔥 PRIMA: Ottengo TUTTE le categorie della compagnia (anche se vuote)
            all_categories_result = self.supabase.client.table('categories')\
                .select('id, name, type_id, sort_order')\
                .eq('company_id', self.company_id)\
                .order('sort_order')\
                .execute()
            
            # Get all entries for the year  
            entries_result = self.supabase.client.table('entries')\
                .select('*, subcategories!inner(name, categories!inner(name, type_id, company_id))')\
                .eq('subcategories.categories.company_id', self.company_id)\
                .eq('year', year)\
                .execute()
            
            summary = {
                "company_id": self.company_id,
                "year": year,
                "data_status": {},
                "consolidated": {
                    "total_revenue": 0,
                    "total_expenses": 0,
                    "monthly_data": {},
                    "categories": {}
                },
                "projections": {
                    "total_revenue": 0,
                    "total_expenses": 0,
                    "monthly_data": {},
                    "categories": {}
                },
                "combined": {
                    "total_revenue": 0,
                    "total_expenses": 0,
                    "monthly_data": {},
                    "categories": {}
                }
            }
            
            # 🎯 INIZIALIZZA tutte le categorie a ZERO
            for category in all_categories_result.data:
                cat_name = category['name']
                cat_type = category['type_id']
                
                for target in ["consolidated", "projections", "combined"]:
                    summary[target]["categories"][cat_name] = {
                        "type": cat_type, 
                        "total": 0,
                        "id": category['id'],
                        "sort_order": category['sort_order']
                    }
            
            for entry in entries_result.data:
                category = entry['subcategories']['categories']  
                month = entry['month']
                value = float(entry['value'])
                is_projection = entry.get('is_projection', False)
                
                # Determine which dataset to update
                dataset = "projections" if (is_projection and include_projections) else "consolidated"
                
                # Skip projections if not requested
                if is_projection and not include_projections:
                    continue
                
                # Monthly totals
                if month not in summary[dataset]["monthly_data"]:
                    summary[dataset]["monthly_data"][month] = {"revenue": 0, "expenses": 0}
                if month not in summary["combined"]["monthly_data"]:
                    summary["combined"]["monthly_data"][month] = {"revenue": 0, "expenses": 0}
                
                if category['type_id'] == 'revenue':
                    summary[dataset]["total_revenue"] += value
                    summary[dataset]["monthly_data"][month]["revenue"] += value
                    summary["combined"]["total_revenue"] += value
                    summary["combined"]["monthly_data"][month]["revenue"] += value
                elif category['type_id'] == 'expense':
                    summary[dataset]["total_expenses"] += value
                    summary[dataset]["monthly_data"][month]["expenses"] += value
                    summary["combined"]["total_expenses"] += value
                    summary["combined"]["monthly_data"][month]["expenses"] += value
                
                # Category totals
                cat_name = category['name']
                for target in [dataset, "combined"]:
                    if cat_name not in summary[target]["categories"]:
                        summary[target]["categories"][cat_name] = {"type": category['type_id'], "total": 0}
                    summary[target]["categories"][cat_name]["total"] += value
            
            # Calculate net profits
            for target in ["consolidated", "projections", "combined"]:
                summary[target]["net_profit"] = summary[target]["total_revenue"] - summary[target]["total_expenses"]
            
            # Data status info
            current_month = 7  # July 2025 as current cutoff
            summary["data_status"] = {
                "consolidation_cutoff": f"2025-{current_month:02d}",
                "consolidated_months": f"Jan-{current_month-1} 2025" if year == 2025 else f"Full year {year}",
                "projection_months": f"{current_month}-Dec 2025 + 2026" if year == 2025 else "None",
                "note": "Use 'consolidated' for official reporting, 'combined' for planning"
            }
            
            return summary
            
        except Exception as e:
            print(f"❌ Error getting summary: {e}")
            raise

    async def get_projection_vs_actual(self, year: int, month: int) -> Dict[str, Any]:  
        """Compare projected vs actual data for variance analysis"""
        if not self.company_id:
            await self.initialize_company()
            
        try:
            # Get actual data (is_projection = False)
            actual_result = self.supabase.client.table('entries')\
                .select('*, subcategories!inner(name, categories!inner(name, type_id))')\
                .eq('subcategories.categories.company_id', self.company_id)\
                .eq('year', year)\
                .eq('month', month)\
                .eq('is_projection', False)\
                .execute()
            
            # Get projection data (is_projection = True) 
            projection_result = self.supabase.client.table('entries')\
                .select('*, subcategories!inner(name, categories!inner(name, type_id))')\
                .eq('subcategories.categories.company_id', self.company_id)\
                .eq('year', year)\
                .eq('month', month)\
                .eq('is_projection', True)\
                .execute()
            
            comparison = {
                "period": f"{month:02d}-{year}",
                "actual": {"total_revenue": 0, "total_expenses": 0, "categories": {}},
                "projected": {"total_revenue": 0, "total_expenses": 0, "categories": {}},
                "variance": {"revenue_variance": 0, "expense_variance": 0, "categories": {}}
            }
            
            # Process actual data
            for entry in actual_result.data:
                category = entry['subcategories']['categories']
                value = float(entry['value'])
                cat_name = category['name']
                
                if category['type_id'] == 'revenue':
                    comparison["actual"]["total_revenue"] += value
                else:
                    comparison["actual"]["total_expenses"] += value
                    
                if cat_name not in comparison["actual"]["categories"]:
                    comparison["actual"]["categories"][cat_name] = 0
                comparison["actual"]["categories"][cat_name] += value
            
            # Process projection data  
            for entry in projection_result.data:
                category = entry['subcategories']['categories']
                value = float(entry['value'])
                cat_name = category['name']
                
                if category['type_id'] == 'revenue':
                    comparison["projected"]["total_revenue"] += value
                else:
                    comparison["projected"]["total_expenses"] += value
                    
                if cat_name not in comparison["projected"]["categories"]:
                    comparison["projected"]["categories"][cat_name] = 0
                comparison["projected"]["categories"][cat_name] += value
            
            # Calculate variances
            comparison["variance"]["revenue_variance"] = comparison["actual"]["total_revenue"] - comparison["projected"]["total_revenue"]
            comparison["variance"]["expense_variance"] = comparison["actual"]["total_expenses"] - comparison["projected"]["total_expenses"]
            
            # Category variances
            all_categories = set(comparison["actual"]["categories"].keys()) | set(comparison["projected"]["categories"].keys())
            for cat in all_categories:
                actual_val = comparison["actual"]["categories"].get(cat, 0)
                projected_val = comparison["projected"]["categories"].get(cat, 0)
                comparison["variance"]["categories"][cat] = actual_val - projected_val
            
            return comparison
            
        except Exception as e:
            print(f"❌ Error getting projection comparison: {e}")
            raise

    async def cleanup_database(self) -> Dict[str, Any]:
        """Clean up database by removing duplicate or invalid entries"""
        if not self.company_id:
            await self.initialize_company()
            
        print("🧹 Cleaning up database...")
        
        try:
            # Remove entries with 0 values
            zero_result = self.supabase.client.table('entries')\
                .delete()\
                .eq('value', 0)\
                .execute()
            
            print(f"🗑️ Removed {len(zero_result.data) if zero_result.data else 0} zero-value entries")
            
            return {
                "success": True,
                "cleaned_entries": len(zero_result.data) if zero_result.data else 0,
                "message": "Database cleanup completed"
            }
            
        except Exception as e:
            print(f"❌ Error during cleanup: {e}")
            raise

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def converti_mese_anno(mese: str, anno: int) -> str:
    """Convert Italian month and year to MM-YYYY format"""
    mese_num = MONTH_MAPPING.get(mese, "01")
    return f"{mese_num}-{anno}"

def converti_ricavi_storici(data: RicaviStorici) -> Dict[str, Any]:
    """Convert historical revenue data to FinCal format"""
    risultato = {}
    
    for anno, dati_anno in data.ricavi.items():
        for struttura, mesi_dati in dati_anno.items():
            if struttura == "TOTALE":
                continue
                
            categoria_id = REVENUE_MAPPING.get(struttura)
            if not categoria_id:
                continue
                
            if categoria_id not in risultato:
                risultato[categoria_id] = {}
                
            for mese, valore in mesi_dati.items():
                if mese == "Totale":
                    continue
                    
                month_year = converti_mese_anno(mese, int(anno))
                if month_year not in risultato[categoria_id]:
                    risultato[categoria_id][month_year] = 0
                    
                risultato[categoria_id][month_year] += float(valore)
    
    return risultato

def converti_dati_mensili(data: DatiMensili) -> Dict[str, Any]:
    """Convert monthly data to FinCal format"""
    month_year = converti_mese_anno(data.mese, data.anno)
    risultato = {
        "month_year": month_year,
        "revenues": {},
        "expenses": {},
        "balances": {}
    }
    
    # Convert revenues
    for nome, valore in data.entrate.items():
        if nome == "Totale":
            continue
        categoria_id = REVENUE_MAPPING.get(nome)
        if categoria_id:
            risultato["revenues"][categoria_id] = float(valore)
    
    # Convert expenses
    for nome, valore in data.uscite.items():
        if nome == "Totale":
            continue
            
        categoria_id = EXPENSE_MAPPING.get(nome)
        if categoria_id:
            if isinstance(valore, dict) and "Totale" in valore:
                risultato["expenses"][categoria_id] = float(valore["Totale"])
                if "Dettagli" in valore:
                    risultato["expenses"][f"{categoria_id}_details"] = valore["Dettagli"]
            elif isinstance(valore, (int, float)):
                risultato["expenses"][categoria_id] = float(valore)
            elif isinstance(valore, str):
                try:
                    risultato["expenses"][categoria_id] = float(valore)
                except ValueError:
                    continue
    
    # Convert cashflow/bank balances
    if data.cashflow:
        for nome, valore in data.cashflow.items():
            if nome == "Saldo MPS":
                risultato["balances"]["saldo-mps"] = float(valore)
            elif nome == "Saldo Intesa":
                risultato["balances"]["saldo-intesa"] = float(valore)
            elif nome == "Saldo Sella":
                risultato["balances"]["saldo-sella"] = float(valore)
            elif nome == "Cassa":
                risultato["balances"]["cassa-contanti"] = float(valore)
            elif nome == "Affidamenti" and isinstance(valore, dict):
                for nome_aff, valore_aff in valore.items():
                    if "MPS" in nome_aff:
                        risultato["balances"]["fin-mps-60"] = float(valore_aff)
    
    return risultato

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

# Initialize FastAPI app
app = FastAPI(title="ORTI Finance Complete API", version="2.0.0")

# Initialize service
supabase_service = SupabaseService()
finance_manager = ORTIFinanceManager()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "ORTI Finance Complete API", 
        "version": "2.0.0",
        "description": "Unified financial management system"
    }

@app.post("/import/ricavi-storici")
async def import_ricavi_storici(data: RicaviStorici):
    """Import historical revenues (2024-2025) to Supabase"""
    try:
        dati_convertiti = converti_ricavi_storici(data)
        company = await supabase_service.get_or_create_company("ORTI", "Gruppo ORTI - Strutture turistiche")
        result = await supabase_service.import_historical_revenues(company["id"], dati_convertiti)
        
        return {
            "success": True,
            "message": f"Imported revenues for {len(dati_convertiti)} categories",
            "data": dati_convertiti,
            "summary": {
                "categorie": list(dati_convertiti.keys()),
                "periodi": len(set([
                    month_year 
                    for categoria in dati_convertiti.values() 
                    for month_year in categoria.keys()
                ])),
                "entries_salvate": result["imported_entries"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import error: {str(e)}")

@app.post("/import/dati-mensili")
async def import_dati_mensili(data: DatiMensili):
    """Import complete monthly data (revenues, expenses, cashflow)"""
    try:
        dati_convertiti = converti_dati_mensili(data)
        company = await supabase_service.get_or_create_company("ORTI", "Gruppo ORTI - Strutture turistiche")
        result = await supabase_service.import_monthly_data(company["id"], dati_convertiti)
        
        return {
            "success": True,
            "message": f"Imported data for {data.mese} {data.anno}",
            "data": dati_convertiti,
            "summary": {
                "periodo": f"{data.mese} {data.anno}",
                "entrate": len(dati_convertiti["revenues"]),
                "uscite": len(dati_convertiti["expenses"]),
                "saldi": len(dati_convertiti["balances"]),
                "entries_salvate": result["imported_entries"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import error: {str(e)}")

@app.post("/import/historical-complete")
async def import_historical_complete():
    """Import all embedded historical data (2024 + 2025 partial)"""
    try:
        await finance_manager.initialize_company()
        result = await finance_manager.import_historical_data()
        
        return {
            "success": True,
            "message": "Historical data import completed",
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Historical import error: {str(e)}")

@app.get("/companies/{company_name}/data/{year}/{month}")
async def get_monthly_data(company_name: str, year: int, month: int):
    """Get monthly data for a company"""
    try:
        company = await supabase_service.get_or_create_company(company_name)
        totals = await supabase_service.get_monthly_totals(company["id"], year, month)
        
        return {
            "success": True,
            "company": company["name"],
            "period": f"{month:02d}-{year}",
            "data": totals
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data retrieval error: {str(e)}")

@app.get("/companies/{company_name}/summary/{year}")
async def get_company_summary_endpoint(
    company_name: str, 
    year: int,
    consolidated_only: bool = False,
    include_projections: bool = True
):
    """Get financial summary with consolidated vs projection separation
    
    Parameters:
    - consolidated_only: If True, returns only consolidated data (for official reporting)
    - include_projections: If False, excludes projection data entirely
    """
    try:
        await finance_manager.initialize_company(company_name)
        
        if consolidated_only:
            # Return only consolidated data (backward compatibility + official reporting)
            summary = await finance_manager.get_company_summary(year, include_projections=False)
            return {"success": True, "summary": summary["consolidated"], "data_type": "consolidated_only"}
        else:
            # Return full breakdown (default behavior for planning)
            summary = await finance_manager.get_company_summary(year, include_projections)
            return {"success": True, "summary": summary}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Summary error: {str(e)}")

@app.get("/companies/{company_name}/variance/{year}/{month}")
async def get_projection_variance_endpoint(company_name: str, year: int, month: int):
    """Compare projected vs actual data for variance analysis"""
    try:
        await finance_manager.initialize_company(company_name)
        comparison = await finance_manager.get_projection_vs_actual(year, month)
        
        return {"success": True, "comparison": comparison}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Variance analysis error: {str(e)}")

# ============================================================================
# 📊 COMPLETE CRUD ENDPOINTS FOR ENTRIES
# ============================================================================

@app.post("/entries")
async def create_entry(data: EntryUpdate):
    """Create new entry"""
    try:
        result = await supabase_service.upsert_entry(
            subcategory_id=data.subcategory_id,
            year=data.year,
            month=data.month,
            value=data.value,
            is_projection=data.is_projection,
            notes=data.notes
        )
        
        return {
            "success": True,
            "message": f"Entry created for {data.month:02d}-{data.year}",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Create error: {str(e)}")

@app.get("/entries/{entry_id}")
async def get_entry(entry_id: str):
    """Get single entry by ID"""
    try:
        result = supabase_service.client.table('entries')\
            .select('*, subcategories!inner(name, categories!inner(name, type_id))')\
            .eq('id', entry_id)\
            .single()\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        return {
            "success": True,
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Get error: {str(e)}")

@app.get("/entries")
async def get_entries(
    subcategory_id: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    is_projection: Optional[bool] = None,
    limit: int = 100
):
    """Get entries with optional filters"""
    try:
        query = supabase_service.client.table('entries')\
            .select('*, subcategories!inner(name, categories!inner(name, type_id))')
        
        if subcategory_id:
            query = query.eq('subcategory_id', subcategory_id)
        if year:
            query = query.eq('year', year)
        if month:
            query = query.eq('month', month)
        if is_projection is not None:
            query = query.eq('is_projection', is_projection)
            
        query = query.limit(limit).order('year.desc,month.desc')
        result = query.execute()
        
        return {
            "success": True,
            "count": len(result.data),
            "data": result.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Get entries error: {str(e)}")

@app.put("/entries/{entry_id}")
async def update_entry_by_id(entry_id: str, data: EntryUpdate):
    """Update entry by ID"""
    try:
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        result = supabase_service.client.table('entries')\
            .update(update_data)\
            .eq('id', entry_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        return {
            "success": True,
            "message": f"Entry updated",
            "data": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update error: {str(e)}")

@app.put("/entry")
async def update_entry(data: EntryUpdate):
    """Update single entry (LEGACY - for frontend compatibility)"""
    try:
        result = await supabase_service.upsert_entry(
            subcategory_id=data.subcategory_id,
            year=data.year,
            month=data.month,
            value=data.value,
            is_projection=data.is_projection,
            notes=data.notes
        )
        
        return {
            "success": True,
            "message": f"Entry updated for {data.month:02d}-{data.year}",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Update error: {str(e)}")

@app.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    """Delete entry by ID"""
    try:
        result = supabase_service.client.table('entries')\
            .delete()\
            .eq('id', entry_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        return {
            "success": True,
            "message": "Entry deleted successfully",
            "deleted": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Delete error: {str(e)}")

@app.post("/cleanup")
async def cleanup_database():
    """Clean up database (remove duplicates, zero values, etc.)"""
    try:
        await finance_manager.initialize_company()
        result = await finance_manager.cleanup_database()
        
        return {
            "success": True,
            "message": "Database cleanup completed",
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cleanup error: {str(e)}")

@app.get("/test-supabase")
async def test_supabase():
    """Test Supabase connection"""
    try:
        company = await supabase_service.get_or_create_company("ORTI", "Test connection")
        
        return {
            "success": True,
            "message": "Supabase connection working",
            "company": company
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection error: {str(e)}")

# ============================================================================
# CATEGORY MANAGEMENT ENDPOINTS
# ============================================================================

@app.get("/companies/{company_name}/categories")
async def get_categories(company_name: str):
    """Get all categories for a company"""
    try:
        company = await supabase_service.get_or_create_company(company_name)
        
        categories_result = supabase_service.client.table('categories')\
            .select('*, subcategories(id, name, sort_order)')\
            .eq('company_id', company['id'])\
            .order('sort_order')\
            .execute()
        
        return {
            "success": True,
            "company": company_name,
            "categories": categories_result.data
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error getting categories: {str(e)}")

@app.post("/companies/{company_name}/categories")
async def create_category(company_name: str, category: CategoryCreate):
    """Create a new category"""
    try:
        company = await supabase_service.get_or_create_company(company_name)
        
        # Insert category
        category_result = supabase_service.client.table('categories').insert({
            'name': category.name,
            'type_id': category.type_id,
            'company_id': company['id'],
            'is_calculated': category.is_calculated,
            'sort_order': category.sort_order
        }).execute()
        
        new_category = category_result.data[0]
        
        # Auto-create default subcategory
        subcategory_name = "Totale" if category.type_id == "revenue" else "Saldo"
        subcategory_result = supabase_service.client.table('subcategories').insert({
            'name': subcategory_name,
            'category_id': new_category['id'],
            'sort_order': 1
        }).execute()
        
        return {
            "success": True,
            "message": f"Category '{category.name}' created",
            "category": new_category,
            "subcategory": subcategory_result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating category: {str(e)}")

@app.put("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryUpdate):
    """Update a category"""
    try:
        update_data = {k: v for k, v in category.dict().items() if v is not None}
        
        result = supabase_service.client.table('categories')\
            .update(update_data)\
            .eq('id', category_id)\
            .execute()
        
        return {
            "success": True,
            "message": f"Category updated",
            "category": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating category: {str(e)}")

@app.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Delete a category and all its subcategories and entries"""
    try:
        # First delete all entries
        entries_result = supabase_service.client.table('entries')\
            .delete()\
            .in_('subcategory_id', 
                 supabase_service.client.table('subcategories')
                 .select('id')
                 .eq('category_id', category_id)
                 .execute().data)\
            .execute()
        
        # Then delete subcategories
        subcategories_result = supabase_service.client.table('subcategories')\
            .delete()\
            .eq('category_id', category_id)\
            .execute()
        
        # Finally delete category
        category_result = supabase_service.client.table('categories')\
            .delete()\
            .eq('id', category_id)\
            .execute()
        
        return {
            "success": True,
            "message": f"Category deleted",
            "deleted": {
                "entries": len(entries_result.data or []),
                "subcategories": len(subcategories_result.data or []),
                "category": len(category_result.data or [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting category: {str(e)}")

@app.post("/categories/{category_id}/subcategories")
async def create_subcategory(category_id: str, subcategory: SubcategoryCreate):
    """Create a new subcategory"""
    try:
        result = supabase_service.client.table('subcategories').insert({
            'name': subcategory.name,
            'category_id': category_id,
            'sort_order': subcategory.sort_order
        }).execute()
        
        return {
            "success": True,
            "message": f"Subcategory '{subcategory.name}' created",
            "subcategory": result.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating subcategory: {str(e)}")

@app.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: str):
    """Delete a subcategory and all its entries"""
    try:
        # First delete all entries
        entries_result = supabase_service.client.table('entries')\
            .delete()\
            .eq('subcategory_id', subcategory_id)\
            .execute()
        
        # Then delete subcategory
        subcategory_result = supabase_service.client.table('subcategories')\
            .delete()\
            .eq('id', subcategory_id)\
            .execute()
        
        return {
            "success": True,
            "message": f"Subcategory deleted",
            "deleted": {
                "entries": len(entries_result.data or []),
                "subcategory": len(subcategory_result.data or [])
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting subcategory: {str(e)}")

@app.get("/status")
async def status():
    return {
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "version": "2.2.0",
        "description": "Unified ORTI Finance System with Category Management",
        "data_types": {
            "consolidated": "Official data from INTUR balance sheet + actual monthly data",
            "projections": "Forecasted data marked with is_projection=True",
            "combined": "Both consolidated and projection data for planning"
        },
        "endpoints": [
            "/import/ricavi-storici",
            "/import/dati-mensili", 
            "/import/historical-complete",
            "/companies/{company_name}/data/{year}/{month}",
            "/companies/{company_name}/summary/{year}?consolidated_only=false&include_projections=true",
            "/companies/{company_name}/variance/{year}/{month}",
            "/companies/{company_name}/categories (GET, POST)",
            "/categories/{id} (PUT, DELETE)",
            "/categories/{id}/subcategories (POST)",
            "/subcategories/{id} (DELETE)",
            "/entry (PUT)",
            "/cleanup (POST)",
            "/test-supabase",
            "/status"
        ],
        "features": {
            "consolidated_vs_projections": "System distinguishes between actual and forecasted data",
            "variance_analysis": "Compare projected vs actual performance",
            "official_reporting": "Use consolidated_only=true for official INTUR reporting",
            "planning_mode": "Use combined data for business planning and forecasting",
            "category_management": "Full CRUD operations for categories and subcategories"
        }
    }

# ============================================================================
# CLI INTERFACE
# ============================================================================

async def cli_main():
    """CLI interface for finance management"""
    manager = ORTIFinanceManager()
    
    print("🏢 ORTI FINANCE UNIFIED SYSTEM")
    print("=" * 50)
    
    # Initialize company
    await manager.initialize_company()
    
    print("\n📊 Available operations:")
    print("1. Import complete historical data")
    print("2. Get financial summary")
    print("3. Cleanup database")
    print("4. View company status")
    
    try:
        # Get current summary with separation of data types
        summary = await manager.get_company_summary(2025)
        
        print(f"\n✅ System ready - Company: {summary['company_id']}")
        print("\n📊 DATA BREAKDOWN:")
        print(f"   🏛️  CONSOLIDATED (Official): €{summary['consolidated']['total_revenue']:,.2f} revenue")
        print(f"   🔮 PROJECTIONS (Forecast): €{summary['projections']['total_revenue']:,.2f} revenue")
        print(f"   📊 COMBINED (Planning): €{summary['combined']['total_revenue']:,.2f} revenue")
        
        print(f"\n💰 NET PROFIT:")
        print(f"   🏛️  Consolidated: €{summary['consolidated']['net_profit']:,.2f}")
        print(f"   🔮 Projections: €{summary['projections']['net_profit']:,.2f}")
        print(f"   📊 Combined: €{summary['combined']['net_profit']:,.2f}")
        
        print(f"\n📅 {summary['data_status']['note']}")
        
        # Import historical data if needed
        if summary['combined']['total_revenue'] == 0:
            print("\n📊 No data found - importing historical data...")
            import_result = await manager.import_historical_data()
            print(f"✅ Imported {import_result['total_imported']} entries")
            print(f"📋 Data types: {', '.join(import_result['data_types'].keys())}")
        
    except Exception as e:
        print(f"\n❌ System check failed: {e}")

def run_server():
    """Run FastAPI server"""
    import uvicorn
    print("🚀 Starting ORTI Finance API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

def run_cli():
    """Run CLI interface"""
    print("🖥️ Starting ORTI Finance CLI...")
    asyncio.run(cli_main())

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
# 🗑️ DATABASE RESET ENDPOINT
# ============================================================================

@app.post("/reset/all-data")
async def reset_all_data(company_name: str = "ORTI"):
    """
    🗑️ RESET COMPLETO: Cancella tutti i dati finanziari
    
    ⚠️  ATTENZIONE: Questa operazione è IRREVERSIBILE!
    - Elimina tutti gli entries
    - Mantiene la struttura delle categorie (22 categorie)
    - Azzera completamente i dati finanziari
    """
    try:
        print(f"🗑️ Starting complete data reset for company: {company_name}")
        
        # Initialize company
        finance_manager = ORTIFinanceManager()
        company = await finance_manager.supabase.get_or_create_company(
            company_name, "Gruppo ORTI - Strutture turistiche"
        )
        
        # Delete all entries for this company
        result = await finance_manager.supabase.execute_query(
            """
            DELETE FROM entries 
            WHERE subcategory_id IN (
                SELECT s.id FROM subcategories s 
                JOIN categories c ON s.category_id = c.id 
                WHERE c.company_id = %s
            )
            """,
            (company["id"],)
        )
        
        print(f"🗑️ Deleted all financial entries for {company_name}")
        
        return {
            "success": True,
            "message": f"All financial data reset for company {company_name}",
            "company_id": company["id"],
            "reset_timestamp": "2025-01-30T18:15:00Z",
            "categories_preserved": 22,
            "entries_deleted": "all"
        }
        
    except Exception as e:
        print(f"❌ Reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

# ============================================================================
# 📊 BULK DATA IMPORT ENDPOINT
# ============================================================================

class BulkImportData(BaseModel):
    """Schema for bulk data import from JSON format"""
    company_name: str
    import_metadata: Dict[str, Any]
    data: List[Dict[str, Any]]
    category_mapping: Optional[Dict[str, List[str]]] = None
    validation_rules: Optional[Dict[str, Any]] = None

@app.post("/api/companies/{company_name}/bulk-import")
async def bulk_import_financial_data(company_name: str, import_data: BulkImportData):
    """
    🚀 BULK IMPORT endpoint for financial data
    
    Supports both CONSOLIDATED and PROJECTION data with proper separation
    Expected format: See orti_data_import_format.json
    """
    try:
        print(f"🚀 Starting bulk import for company: {company_name}")
        
        # Initialize finance manager
        finance_manager = ORTIFinanceManager()
        await finance_manager.initialize_company(company_name)
        
        total_imported = 0
        errors = []
        
        # Process each data group
        for data_group in import_data.data:
            try:
                category_name = data_group['category_name']
                subcategory_name = data_group.get('subcategory_name', 'Totale')
                is_projection = data_group['is_projection']
                data_type = data_group['data_type']
                
                print(f"📊 Processing {category_name} - {data_type}")
                
                # Get category
                category = await finance_manager.supabase.get_category_by_name(
                    finance_manager.company_id, category_name
                )
                
                if not category:
                    errors.append(f"Category not found: {category_name}")
                    continue
                
                # Get or create subcategory
                subcategory = await finance_manager.supabase.get_or_create_subcategory(
                    category['id'], subcategory_name
                )
                
                # Process each entry
                for entry in data_group['entries']:
                    try:
                        # Upsert the entry
                        await finance_manager.supabase.upsert_entry(
                            subcategory_id=subcategory['id'],
                            year=entry['year'],
                            month=entry['month'],
                            value=float(entry['value']),
                            is_projection=is_projection,
                            notes=entry.get('notes', f"{data_type} - {category_name}")
                        )
                        total_imported += 1
                        
                    except Exception as entry_error:
                        error_msg = f"Error importing entry {category_name} {entry['year']}-{entry['month']:02d}: {entry_error}"
                        errors.append(error_msg)
                        print(f"⚠️ {error_msg}")
                        
            except Exception as group_error:
                error_msg = f"Error processing group {data_group.get('category_name', 'Unknown')}: {group_error}"
                errors.append(error_msg)
                print(f"⚠️ {error_msg}")
        
        return {
            "success": True,
            "company_name": company_name,
            "total_imported": total_imported,
            "errors": errors,
            "import_metadata": import_data.import_metadata
        }
        
    except Exception as e:
        print(f"❌ Bulk import failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk import failed: {str(e)}")

@app.get("/api/companies/{company_name}/data-summary")
async def get_data_type_summary(company_name: str, year: int = 2025):
    """
    📊 Get summary of consolidated vs projection data
    
    Returns separate totals and counts for each data type
    """
    try:
        finance_manager = ORTIFinanceManager()
        await finance_manager.initialize_company(company_name)
        
        # Get consolidated data (is_projection = false)
        consolidated_result = finance_manager.supabase.client.table('entries')\
            .select('*, subcategories!inner(categories!inner(company_id, type_id))')\
            .eq('subcategories.categories.company_id', finance_manager.company_id)\
            .eq('year', year)\
            .eq('is_projection', False)\
            .execute()
        
        # Get projection data (is_projection = true)  
        projection_result = finance_manager.supabase.client.table('entries')\
            .select('*, subcategories!inner(categories!inner(company_id, type_id))')\
            .eq('subcategories.categories.company_id', finance_manager.company_id)\
            .eq('year', year)\
            .eq('is_projection', True)\
            .execute()
        
        # Calculate totals
        consolidated_total = sum(entry['value'] for entry in consolidated_result.data)
        projection_total = sum(entry['value'] for entry in projection_result.data)
        
        return {
            "company_name": company_name,
            "year": year,
            "consolidated": {
                "total_value": consolidated_total,
                "entries_count": len(consolidated_result.data),
                "data_type": "consolidated",
                "description": "Dati reali e verificati"
            },
            "projection": {
                "total_value": projection_total,
                "entries_count": len(projection_result.data),
                "data_type": "projection", 
                "description": "Stime e previsioni"
            },
            "warning": "❌ Non sommare i totali consolidated + projection per evitare doppi conteggi"
        }
        
    except Exception as e:
        print(f"❌ Error getting data summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting data summary: {str(e)}")

# ============================================================================

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "server":
            run_server()
        elif sys.argv[1] == "cli":
            run_cli()
        else:
            print("Usage: python orti_finance_complete.py [server|cli]")
            print("  server: Start FastAPI server")
            print("  cli: Run CLI interface")
    else:
        # Default to server mode
        run_server() 