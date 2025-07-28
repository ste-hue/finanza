from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    async def get_or_create_company(self, name: str, description: str = None) -> Dict[str, Any]:
        """Ottiene o crea una compagnia"""
        try:
            # Cerca se esiste già
            result = self.client.table("companies").select("*").eq("name", name).execute()
            
            if result.data:
                return result.data[0]
            
            # Se non esiste, la crea
            result = self.client.table("companies").insert({
                "name": name,
                "description": description or f"Compagnia {name}"
            }).execute()
            
            return result.data[0]
        except Exception as e:
            logger.error(f"Errore get_or_create_company: {e}")
            raise
    
    async def get_category_by_name(self, company_id: str, category_name: str) -> Optional[Dict[str, Any]]:
        """Ottiene una categoria per nome"""
        try:
            result = self.client.table("categories").select("*").eq("company_id", company_id).eq("name", category_name).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Errore get_category_by_name: {e}")
            return None
    
    async def create_category(self, company_id: str, name: str, type_id: str, sort_order: int = 0) -> Dict[str, Any]:
        """Crea una nuova categoria"""
        try:
            result = self.client.table("categories").insert({
                "company_id": company_id,
                "name": name,
                "type_id": type_id,
                "sort_order": sort_order
            }).execute()
            return result.data[0]
        except Exception as e:
            logger.error(f"Errore create_category: {e}")
            raise
    
    async def get_or_create_subcategory(self, category_id: str, name: str, sort_order: int = 0) -> Dict[str, Any]:
        """Ottiene o crea una subcategoria"""
        try:
            # Cerca se esiste già
            result = self.client.table("subcategories").select("*").eq("category_id", category_id).eq("name", name).execute()
            
            if result.data:
                return result.data[0]
            
            # Se non esiste, la crea
            result = self.client.table("subcategories").insert({
                "category_id": category_id,
                "name": name,
                "sort_order": sort_order
            }).execute()
            
            return result.data[0]
        except Exception as e:
            logger.error(f"Errore get_or_create_subcategory: {e}")
            raise
    
    async def upsert_entry(self, subcategory_id: str, year: int, month: int, value: float, 
                          is_projection: bool = False, notes: str = None) -> Dict[str, Any]:
        """Inserisce o aggiorna un entry"""
        try:
            result = self.client.table("entries").upsert({
                "subcategory_id": subcategory_id,
                "year": year,
                "month": month,
                "value": value,
                "is_projection": is_projection,
                "notes": notes
            }, on_conflict="subcategory_id,year,month").execute()
            
            return result.data[0]
        except Exception as e:
            logger.error(f"Errore upsert_entry: {e}")
            raise
    
    async def get_monthly_totals(self, company_id: str, year: int, month: int) -> Dict[str, Any]:
        """Ottiene i totali mensili per una compagnia"""
        try:
            # Usa la view monthly_category_totals
            result = self.client.rpc("get_monthly_totals", {
                "p_company_id": company_id,
                "p_year": year,
                "p_month": month
            }).execute()
            
            return result.data
        except Exception as e:
            logger.error(f"Errore get_monthly_totals: {e}")
            return {}
    
    async def import_historical_revenues(self, company_id: str, revenues_data: Dict[str, Any]) -> Dict[str, Any]:
        """Importa i ricavi storici nel database"""
        try:
            imported_entries = 0
            
            # Mapping categorie come definito prima
            CATEGORY_MAPPING = {
                "entrate-residence": "Entrate Residence",
                "entrate-cvm": "Entrate CVM", 
                "entrate-hotel": "Entrate Hotel"
            }
            
            for category_key, monthly_data in revenues_data.items():
                if category_key not in CATEGORY_MAPPING:
                    continue
                
                category_name = CATEGORY_MAPPING[category_key]
                
                # Ottieni o crea la categoria
                category = await self.get_category_by_name(company_id, category_name)
                if not category:
                    category = await self.create_category(company_id, category_name, "revenue")
                
                # Crea subcategoria main per entrate dirette
                subcategory = await self.get_or_create_subcategory(category["id"], "Totale")
                
                # Inserisci tutti i valori mensili
                for month_year, value in monthly_data.items():
                    month, year = month_year.split("-")
                    
                    await self.upsert_entry(
                        subcategory["id"],
                        int(year),
                        int(month),
                        float(value),
                        is_projection=(int(year) > 2025)
                    )
                    imported_entries += 1
            
            return {
                "success": True,
                "imported_entries": imported_entries
            }
            
        except Exception as e:
            logger.error(f"Errore import_historical_revenues: {e}")
            raise
    
    async def import_monthly_data(self, company_id: str, monthly_data: Dict[str, Any]) -> Dict[str, Any]:
        """Importa dati mensili completi"""
        try:
            imported_entries = 0
            month_year = monthly_data["month_year"]
            month, year = month_year.split("-")
            
            # Importa entrate
            for category_key, value in monthly_data.get("revenues", {}).items():
                # Trova la categoria esistente o creala
                category = await self.get_category_by_name(company_id, category_key.replace("-", " ").title())
                if category:
                    subcategory = await self.get_or_create_subcategory(category["id"], "Totale")
                    await self.upsert_entry(subcategory["id"], int(year), int(month), float(value))
                    imported_entries += 1
            
            # Importa uscite
            for category_key, value in monthly_data.get("expenses", {}).items():
                if "_details" in category_key:
                    continue  # Skippa i dettagli per ora
                    
                category = await self.get_category_by_name(company_id, category_key.replace("-", " ").title())
                if category:
                    subcategory = await self.get_or_create_subcategory(category["id"], "Totale")
                    await self.upsert_entry(subcategory["id"], int(year), int(month), float(value))
                    imported_entries += 1
            
            # Importa saldi
            for balance_key, value in monthly_data.get("balances", {}).items():
                category = await self.get_category_by_name(company_id, balance_key.replace("-", " ").title())
                if category:
                    subcategory = await self.get_or_create_subcategory(category["id"], "Saldo")
                    await self.upsert_entry(subcategory["id"], int(year), int(month), float(value))
                    imported_entries += 1
            
            return {
                "success": True,
                "imported_entries": imported_entries
            }
            
        except Exception as e:
            logger.error(f"Errore import_monthly_data: {e}")
            raise 