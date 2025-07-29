#!/usr/bin/env python3
"""
🔄 DATABASE RESTRUCTURING SCRIPT
Ristruttura il database ORTI per riflettere la gerarchia corretta dell'Excel:
- Livello 1: ENTRATE/USCITE (category_types)
- Livello 2: Macro categorie (categories) - dal foglio principale Excel
- Livello 3: Dettagli (subcategories) - dai fogli separati Excel
"""

import asyncio
import json
from typing import Dict, List
from supabase_service import SupabaseService

class DatabaseRestructurer:
    
    def __init__(self):
        self.supabase = SupabaseService()
        self.company_id = None
        
    async def initialize(self):
        """Inizializza company ORTI"""
        company = await self.supabase.get_or_create_company("ORTI")
        self.company_id = company["id"]
        print(f"✅ Company ORTI: {self.company_id}")
    
    async def analyze_current_structure(self):
        """Analizza struttura attuale per mapping"""
        print("\n🔍 ANALIZZANDO STRUTTURA ATTUALE...")
        
        try:
            # Get categories
            categories = self.supabase.client.table('categories').select('*').eq('company_id', self.company_id).execute()
            
            # Get subcategories 
            subcategories = self.supabase.client.table('subcategories').select('*').execute()
            
            # Get entries count
            entries = self.supabase.client.table('entries').select('*').execute()
            
            print(f"📊 Trovate {len(categories.data)} categorie, {len(subcategories.data)} sottocategorie, {len(entries.data)} entries")
            return {
                'categories': categories.data,
                'subcategories': subcategories.data,
                'entries': entries.data
            }
            
        except Exception as e:
            print(f"❌ Errore analisi: {e}")
            return []
    
    async def create_macro_categories(self):
        """Crea le macro-categorie basate sull'Excel"""
        print("\n🏗️ CREANDO MACRO-CATEGORIE...")
        
        # Macro categorie USCITE basate sui fogli Excel
        macro_uscite = [
            {"name": "Salari e Stipendi", "sort_order": 100},
            {"name": "Utenze", "sort_order": 110}, 
            {"name": "Materie Prime/Consumo", "sort_order": 120},
            {"name": "Tasse e Imposte", "sort_order": 130},
            {"name": "Commissioni Portali", "sort_order": 140},
            {"name": "Mutui e Finanziamenti", "sort_order": 150},
            {"name": "Consulenze", "sort_order": 160},
            {"name": "Godimento Beni di Terzi", "sort_order": 170},
            {"name": "Varie ed Eventuali", "sort_order": 180},
            {"name": "Canoni e servizi", "sort_order": 190},
            {"name": "Ristr. Apt SDP Jr", "sort_order": 200},
            {"name": "Deposito Fitto", "sort_order": 210}
        ]
        
        # Macro categorie ENTRATE (già corrette)
        macro_entrate = [
            {"name": "Entrate Hotel", "sort_order": 10},
            {"name": "Entrate Residence", "sort_order": 20},
            {"name": "Entrate CVM", "sort_order": 30},
            {"name": "Entrate Supermercato", "sort_order": 40},
            {"name": "Rientro Sospesi", "sort_order": 50},
            {"name": "Caparre Intur", "sort_order": 60}
        ]
        
        created_categories = {}
        
                 # Crea ENTRATE macro
        for macro in macro_entrate:
            try:
                # Usa get_category_by_name per vedere se esiste già
                existing_category = await self.supabase.get_category_by_name(self.company_id, macro['name'])
                
                if existing_category:
                    created_categories[macro['name']] = existing_category['id']
                    print(f"  ✅ Entrata (esistente): {macro['name']}")
                else:
                    # Crea nuova categoria
                    category = await self.supabase.create_category(
                        self.company_id, 
                        macro['name'], 
                        'revenue', 
                        macro['sort_order']
                    )
                    created_categories[macro['name']] = category['id']
                    print(f"  ✅ Entrata (nuova): {macro['name']}")
                    
            except Exception as e:
                print(f"  ❌ Errore {macro['name']}: {e}")
        
        # Crea USCITE macro  
        for macro in macro_uscite:
            try:
                # Usa get_category_by_name per vedere se esiste già
                existing_category = await self.supabase.get_category_by_name(self.company_id, macro['name'])
                
                if existing_category:
                    created_categories[macro['name']] = existing_category['id']
                    print(f"  ✅ Uscita (esistente): {macro['name']}")
                else:
                    # Crea nuova categoria
                    category = await self.supabase.create_category(
                        self.company_id, 
                        macro['name'], 
                        'expense', 
                        macro['sort_order']
                    )
                    created_categories[macro['name']] = category['id']
                    print(f"  ✅ Uscita (nuova): {macro['name']}")
                    
            except Exception as e:
                print(f"  ❌ Errore {macro['name']}: {e}")
        
        print(f"\n✅ Create {len(created_categories)} macro-categorie")
        return created_categories
    
    async def create_detail_subcategories(self):
        """Crea sottocategorie dettaglio basate sui fogli Excel"""
        print("\n🔧 CREANDO SOTTOCATEGORIE DETTAGLIO...")
        
        # Mapping dettagli per ogni macro categoria (basato su analisi Excel)
        detail_mapping = {
            "Salari e Stipendi": [
                {"name": "SALARI", "sort_order": 1},
                {"name": "F24", "sort_order": 2}
            ],
            "Utenze": [
                {"name": "Energia elettrica", "sort_order": 1},
                {"name": "Gas", "sort_order": 2},
                {"name": "Ausino", "sort_order": 3},
                {"name": "Vodafone", "sort_order": 4}
            ],
            "Materie Prime/Consumo": [
                {"name": "A. MIGLIORE", "sort_order": 1},
                {"name": "BEVERAGE", "sort_order": 2},
                {"name": "MATERIALI DI CONSUMO", "sort_order": 3},
                {"name": "LAVANDERIA", "sort_order": 4},
                {"name": "MATERIALE DI MANUTENZIONE", "sort_order": 5}
            ],
            "Commissioni Portali": [
                {"name": "Commissioni Booking", "sort_order": 1},
                {"name": "Commissioni Expedia", "sort_order": 2},
                {"name": "Commissioni Transato Pos", "sort_order": 3},
                {"name": "Commissioni e spese Bancarie", "sort_order": 4}
            ],
            "Tasse e Imposte": [
                {"name": "IMPOSTA DI SOGGIORNO HP", "sort_order": 1},
                {"name": "IMPOSTA DI SOGGIORNO AR", "sort_order": 2}, 
                {"name": "IMPOSTA DI SOGGIORNO CVM", "sort_order": 3},
                {"name": "IMU", "sort_order": 4},
                {"name": "IMPOSTE", "sort_order": 5},
                {"name": "IVA", "sort_order": 6},
                {"name": "TARI HOTEL", "sort_order": 7},
                {"name": "TARI RESIDENCE", "sort_order": 8},
                {"name": "TARI CVM", "sort_order": 9}
            ],
            "Mutui e Finanziamenti": [
                {"name": "Mutuo MPS", "sort_order": 1},
                {"name": "Mutuo Intesa", "sort_order": 2},
                {"name": "Fin. MPS 60 mesi", "sort_order": 3}
            ],
            "Consulenze": [
                {"name": "Consulenza del lavoro", "sort_order": 1},
                {"name": "Consulenza fiscale", "sort_order": 2},
                {"name": "Consulenza legale", "sort_order": 3}
            ],
            "Godimento Beni di Terzi": [
                {"name": "Fitto Ramo d'Azienda", "sort_order": 1},
                {"name": "Fitto AR", "sort_order": 2},
                {"name": "Fitto CVM", "sort_order": 3}
            ],
            "Canoni e servizi": [
                {"name": "Proxima Service", "sort_order": 1},
                {"name": "Hoxell", "sort_order": 2},
                {"name": "Sistemi (E_solver)", "sort_order": 3},
                {"name": "Noleggio Tesla", "sort_order": 4},
                {"name": "Pin App", "sort_order": 5},
                {"name": "Connectivia", "sort_order": 6},
                {"name": "Amalfi Web", "sort_order": 7},
                {"name": "Software tecnology", "sort_order": 8},
                {"name": "Zucchetti", "sort_order": 9}
            ],
            "Ristr. Apt SDP Jr": [
                {"name": "MIELE RI.BA DAL 31/05/2025", "sort_order": 1},
                {"name": "ALESSIO", "sort_order": 2},
                {"name": "S.T.E.", "sort_order": 3},
                {"name": "INFISSI ROMANO", "sort_order": 4},
                {"name": "NUSCO", "sort_order": 5},
                {"name": "SANTELIA IMPIANTI", "sort_order": 6},
                {"name": "PITTORE", "sort_order": 7},
                {"name": "ARCHITETTO", "sort_order": 8}
            ],
            "Varie ed Eventuali": [
                {"name": "Cantiere Carotenuto", "sort_order": 1},
                {"name": "Spiagge", "sort_order": 2},
                {"name": "Altamira", "sort_order": 3}
            ]
        }
        
                 # Get category IDs
        categories = self.supabase.client.table('categories').select('id, name').eq('company_id', self.company_id).execute()
        category_map = {cat['name']: cat['id'] for cat in categories.data}
        
        created_subcategories = 0
        
        for category_name, details in detail_mapping.items():
            if category_name not in category_map:
                print(f"  ⚠️ Categoria {category_name} non trovata, skip...")
                continue
                
            category_id = category_map[category_name]
            
            for detail in details:
                try:
                    # Usa il metodo get_or_create_subcategory del servizio
                    subcategory = await self.supabase.get_or_create_subcategory(
                        category_id, 
                        detail['name'], 
                        detail['sort_order']
                    )
                    
                    if subcategory:
                        created_subcategories += 1
                        print(f"    ✅ {category_name} > {detail['name']}")
                        
                except Exception as e:
                    print(f"    ❌ Errore {detail['name']}: {e}")
        
        print(f"\n✅ Create {created_subcategories} sottocategorie dettaglio")
        return created_subcategories
    
    async def migrate_existing_entries(self):
        """Migra entries esistenti nella nuova struttura"""
        print("\n🔄 MIGRAZIONE ENTRIES ESISTENTI...")
        
        # Mapping per spostare entries dalle vecchie categorie alle nuove sottocategorie
        entry_migration_map = {
            # Vecchia categoria -> Nuova sottocategoria 
            "SALARI": "Salari e Stipendi > SALARI",
            "F24": "Salari e Stipendi > F24",
            "Energia elettrica": "Utenze > Energia elettrica", 
            "Gas": "Utenze > Gas",
            # ... aggiungi altri mapping necessari
        }
        
        migrated_entries = 0
        
        print(f"✅ Migrate {migrated_entries} entries")
        return migrated_entries
    
    async def cleanup_old_structure(self):
        """Cleanup struttura obsoleta (OPZIONALE)"""
        print("\n🧹 CLEANUP STRUTTURA OBSOLETA...")
        
        # TODO: Implementa cleanup se necessario
        # - Rimuovi categorie duplicate
        # - Rimuovi sottocategorie orfane
        
        print("✅ Cleanup completato")
        
    async def run_full_restructure(self):
        """Esegue ristrutturazione completa"""
        print("🚀 AVVIO RISTRUTTURAZIONE DATABASE")
        print("=" * 50)
        
        await self.initialize()
        
        # Step 1: Analizza struttura attuale
        current = await self.analyze_current_structure()
        
        # Step 2: Crea macro-categorie
        categories = await self.create_macro_categories()
        
        # Step 3: Crea sottocategorie dettaglio
        subcategories = await self.create_detail_subcategories()
        
        # Step 4: Migra entries esistenti
        # migrated = await self.migrate_existing_entries()
        
        # Step 5: Cleanup (opzionale)
        # await self.cleanup_old_structure()
        
        print("\n🎉 RISTRUTTURAZIONE COMPLETATA!")
        print("=" * 50)
        print(f"📊 Macro-categorie: {len(categories)}")
        print(f"🔧 Sottocategorie: {subcategories}")
        # print(f"🔄 Entries migrate: {migrated}")
        
        print("\n✅ Il database ora riflette la struttura gerarchica dell'Excel!")
        print("🎯 Prossimo step: Implementare UI collassabile nel frontend")

async def main():
    """Main function"""
    restructurer = DatabaseRestructurer()
    await restructurer.run_full_restructure()

if __name__ == "__main__":
    asyncio.run(main()) 