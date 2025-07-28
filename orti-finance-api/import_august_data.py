import asyncio
import json
from datetime import datetime
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

async def import_august_2025_data():
    """Import complete August 2025 financial data"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Get ORTI company
    result = supabase.from_('companies').select('id').eq('name', 'ORTI').single().execute()
    company_id = result.data['id']
    print(f"📊 Importing August 2025 data for ORTI (ID: {company_id})")
    
    # August 2025 complete data
    august_data = {
        "uscite": {
            "Salari e Stipendi": {
                "SALARI": 80000,
                "F24": 40000
            },
            "Utenze": {
                "Energia elettrica": 9000,
                "Gas": 4500,
                "Ausino": 1500,
                "Vodafone": 600,
                "Connectivia": 560
            },
            "Materie Prime/Consumo": {
                "A. MIGLIORE": 1800,
                "BEVERAGE": 3500,
                "MATERIALI DI CONSUMO": 2200,
                "MATERIALE DI MANUTENZIONE": 1800,
                "LAVANDERIA": 1000
            },
            "Tasse e Imposte": {
                "IMU": 0,
                "IMPOSTE": 1800,
                "TARI HOTEL": 1200,
                "IVA": 2000,
                "IMPOSTA DI SOGGIORNO HP": 0,
                "IMPOSTA DI SOGGIORNO AR": 0,
                "IMPOSTA DI SOGGIORNO CVM": 0,
                "TARI RESIDENCE": 0,
                "TARI CVM": 0
            },
            "Commissioni Portali": {
                "Commissioni Booking": 1000,
                "Commissioni Expedia": 800
            },
            "Mutui e Finanziamenti": {
                "Mutuo MPS": 12924,
                "Mutuo Intesa": 7988
            },
            "Consulenze": {
                "Consulenza del lavoro": 800,
                "Consulenza fiscale": 1000,
                "Consulenza legale": 500
            },
            "Godimento Beni di Terzi": {
                "Fitto Ramo d'Azienda": 10000,
                "Fitto AR": 2500,
                "Fitto CVM": 1500
            },
            "Canoni e servizi": {
                "Proxima Service": 1500,
                "Hoxell": 300,
                "Sistemi (E_solver)": 400,
                "Zucchetti": 700,
                "Pin App": 150,
                "Spiagge": 800,
                "Altamira": 200,
                "Amalfi Web": 100,
                "Commissioni Transato Pos": 500,
                "Software tecnology": 300,
                "Commissioni e spese Bancarie Varie": 200,
                "Noleggio Tesla": 0
            },
            "Ristrutturazione Appartamento": {
                "MIELE RI.BA DAL 31/05/2025": 15000,
                "ALESSIO": 4000,
                "S.T.E.": 3000,
                "PITTORE": 2000,
                "INFISSI ROMANO": 0,
                "SANTELIA IMPIANTI": 0,
                "NUSCO": 0,
                "ARCHITETTO": 1000
            },
            "Varie ed Eventuali": {
                "Cantiere Carotenuto?": 0
            },
            "Deposito Fitto": 0
        },
        "saldi_bancari": [
            {"name": "Saldo Banca Sella", "value": 0},
            {"name": "Saldo MPS", "value": 572486.27},
            {"name": "Saldo Intesa", "value": 67840.88},
            {"name": "CASSA CONTANTI", "value": 5000}
        ],
        "affidamenti": [
            {"name": "Fin. MPS 60 mesi", "value": 500000}
        ]
    }
    
    # Get all categories for mapping
    result = supabase.from_('categories').select('id, name, type_id').eq('company_id', company_id).execute()
    category_map = {cat['name']: {'id': cat['id'], 'type': cat['type_id']} for cat in result.data}
    
    # Get all existing subcategories
    result = supabase.from_('subcategories').select('id, name, category_id').execute()
    existing_subcategories = {f"{sub['category_id']}_{sub['name']}": sub['id'] for sub in result.data}
    
    print(f"\n🔧 Creating missing subcategories...")
    subcategory_map = {}
    
    # Collect all item names that need subcategories
    all_items = []
    
    # From expenses (nested)
    for parent_name, subcategories in august_data['uscite'].items():
        if isinstance(subcategories, dict):
            for subcat_name, value in subcategories.items():
                if isinstance(value, (int, float)) and value > 0:
                    all_items.append(subcat_name)
        elif isinstance(subcategories, (int, float)) and subcategories > 0:
            all_items.append(parent_name)
    
    # From balances and financing
    for item in august_data['saldi_bancari']:
        all_items.append(item['name'])
    
    for item in august_data['affidamenti']:
        all_items.append(item['name'])
    
    # Create subcategories for items that don't exist
    for item_name in all_items:
        # Find the corresponding category
        cat_info = category_map.get(item_name)
        if cat_info:
            subcategory_key = f"{cat_info['id']}_{item_name}"
            
            if subcategory_key not in existing_subcategories:
                # Create subcategory
                result = supabase.from_('subcategories').insert({
                    'category_id': cat_info['id'],
                    'name': item_name,
                    'description': f'Subcategory for {item_name}',
                    'sort_order': 1
                }).execute()
                
                subcategory_id = result.data[0]['id']
                subcategory_map[item_name] = subcategory_id
                print(f"  ✅ Created subcategory: {item_name}")
            else:
                subcategory_map[item_name] = existing_subcategories[subcategory_key]
                print(f"  ♻️  Using existing subcategory: {item_name}")
    
    # Now insert entries
    entries_to_insert = []
    year = 2025
    month = 8  # August
    
    print(f"\n💰 Processing USCITE (Expenses)...")
    total_expenses = 0
    
    # Process uscite (expenses) - nested structure
    for parent_name, subcategories in august_data['uscite'].items():
        if isinstance(subcategories, dict):
            for subcat_name, value in subcategories.items():
                if isinstance(value, (int, float)) and value > 0:
                    subcategory_id = subcategory_map.get(subcat_name)
                    if subcategory_id:
                        entries_to_insert.append({
                            'subcategory_id': subcategory_id,
                            'year': year,
                            'month': month,
                            'value': value,
                            'is_projection': False,
                            'notes': f'Import Agosto 2025 - {parent_name}'
                        })
                        total_expenses += value
                        print(f"  ✅ {subcat_name}: €{value:,.2f}")
        elif isinstance(subcategories, (int, float)) and subcategories > 0:
            # Direct category value
            subcategory_id = subcategory_map.get(parent_name)
            if subcategory_id:
                entries_to_insert.append({
                    'subcategory_id': subcategory_id,
                    'year': year,
                    'month': month,
                    'value': subcategories,
                    'is_projection': False,
                    'notes': 'Import Agosto 2025'
                })
                total_expenses += subcategories
                print(f"  ✅ {parent_name}: €{subcategories:,.2f}")
    
    print(f"\n🏦 Processing SALDI BANCARI (Bank Balances)...")
    total_balances = 0
    
    # Process saldi bancari (balances)
    for item in august_data['saldi_bancari']:
        subcategory_id = subcategory_map.get(item['name'])
        if subcategory_id:
            entries_to_insert.append({
                'subcategory_id': subcategory_id,
                'year': year,
                'month': month,
                'value': item['value'],
                'is_projection': False,
                'notes': 'Saldo Agosto 2025'
            })
            total_balances += item['value']
            print(f"  ✅ {item['name']}: €{item['value']:,.2f}")
    
    print(f"\n💳 Processing AFFIDAMENTI (Financing)...")
    total_financing = 0
    
    # Process affidamenti (financing)
    for item in august_data['affidamenti']:
        subcategory_id = subcategory_map.get(item['name'])
        if subcategory_id:
            entries_to_insert.append({
                'subcategory_id': subcategory_id,
                'year': year,
                'month': month,
                'value': item['value'],
                'is_projection': False,
                'notes': 'Affidamento Agosto 2025'
            })
            total_financing += item['value']
            print(f"  ✅ {item['name']}: €{item['value']:,.2f}")
    
    # Insert all entries
    if entries_to_insert:
        print(f"\n📤 Inserting {len(entries_to_insert)} entries...")
        
        # Delete existing August 2025 entries first
        supabase.from_('entries').delete().eq('year', year).eq('month', month).execute()
        
        # Insert in batches
        batch_size = 50
        for i in range(0, len(entries_to_insert), batch_size):
            batch = entries_to_insert[i:i + batch_size]
            result = supabase.from_('entries').insert(batch).execute()
            print(f"  ✅ Inserted batch {i//batch_size + 1}")
        
        print(f"\n🎉 Successfully imported {len(entries_to_insert)} entries!")
    else:
        print("⚠️  No entries to insert")
    
    # Summary
    print(f"\n📊 AUGUST 2025 SUMMARY:")
    print(f"  💸 Total Expenses: €{total_expenses:,.2f}")
    print(f"  🏦 Total Bank Balances: €{total_balances:,.2f}")
    print(f"  💳 Total Financing: €{total_financing:,.2f}")
    print(f"  📈 Net Position: €{total_balances + total_financing - total_expenses:,.2f}")
    
    # Verify import
    result = supabase.from_('entries').select('*').eq('year', year).eq('month', month).execute()
    print(f"  ✅ Verified: {len(result.data)} entries in database")

if __name__ == "__main__":
    asyncio.run(import_august_2025_data()) 