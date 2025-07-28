import asyncio
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY
import uuid

async def create_uscite_categories():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Get ORTI company ID
    result = supabase.table('companies').select('id').eq('name', 'ORTI').execute()
    if not result.data:
        print("❌ Company ORTI not found!")
        return
    
    company_id = result.data[0]['id']
    print(f"Adding categories for company ORTI (ID: {company_id})")
    
    # Define all categories with hierarchy
    categories_data = [
        # Main expense categories
        {"name": "Salari e Stipendi", "type": "expense", "order": 100, "children": [
            {"name": "SALARI", "type": "expense", "order": 101},
            {"name": "F24", "type": "expense", "order": 102},
        ]},
        
        {"name": "Materie Prime/Consumo", "type": "expense", "order": 110, "children": [
            {"name": "A. MIGLIORE", "type": "expense", "order": 111},
            {"name": "BEVERAGE", "type": "expense", "order": 112},
            {"name": "MATERIALI DI CONSUMO", "type": "expense", "order": 113},
            {"name": "MATERIALE DI MANUTENZIONE", "type": "expense", "order": 114},
            {"name": "LAVANDERIA", "type": "expense", "order": 115},
        ]},
        
        {"name": "Utenze", "type": "expense", "order": 120, "children": [
            {"name": "Energia elettrica", "type": "expense", "order": 121},
            {"name": "Gas", "type": "expense", "order": 122},
            {"name": "Ausino", "type": "expense", "order": 123},
            {"name": "Vodafone", "type": "expense", "order": 124},
            {"name": "Connectivia", "type": "expense", "order": 125},
        ]},
        
        {"name": "Commissioni Portali", "type": "expense", "order": 130, "children": [
            {"name": "Commissioni Booking", "type": "expense", "order": 131},
            {"name": "Commissioni Expedia", "type": "expense", "order": 132},
        ]},
        
        {"name": "Tasse e Imposte", "type": "expense", "order": 140, "children": [
            {"name": "IMU", "type": "expense", "order": 141},
            {"name": "IMPOSTE", "type": "expense", "order": 142},
            {"name": "TARI HOTEL", "type": "expense", "order": 143},
            {"name": "IVA", "type": "expense", "order": 144},
            {"name": "IMPOSTA DI SOGGIORNO HP", "type": "expense", "order": 145},
            {"name": "IMPOSTA DI SOGGIORNO AR", "type": "expense", "order": 146},
            {"name": "IMPOSTA DI SOGGIORNO CVM", "type": "expense", "order": 147},
            {"name": "TARI RESIDENCE", "type": "expense", "order": 148},
            {"name": "TARI CVM", "type": "expense", "order": 149},
        ]},
        
        {"name": "Mutui e Finanziamenti", "type": "expense", "order": 150, "children": [
            {"name": "Mutuo MPS", "type": "expense", "order": 151},
            {"name": "Mutuo Intesa", "type": "expense", "order": 152},
        ]},
        
        {"name": "Canoni e servizi", "type": "expense", "order": 160, "children": [
            {"name": "Proxima Service", "type": "expense", "order": 161},
            {"name": "Hoxell", "type": "expense", "order": 162},
            {"name": "Sistemi (E_solver)", "type": "expense", "order": 163},
            {"name": "Zucchetti", "type": "expense", "order": 164},
            {"name": "Pin App", "type": "expense", "order": 165},
            {"name": "Spiagge", "type": "expense", "order": 166},
            {"name": "Altamira", "type": "expense", "order": 167},
            {"name": "Amalfi Web", "type": "expense", "order": 168},
            {"name": "Commissioni Transato Pos", "type": "expense", "order": 169},
            {"name": "Software tecnology", "type": "expense", "order": 170},
            {"name": "Commissioni e spese Bancarie Varie", "type": "expense", "order": 171},
            {"name": "Noleggio Tesla", "type": "expense", "order": 172},
        ]},
        
        {"name": "Godimento Beni di Terzi", "type": "expense", "order": 180, "children": [
            {"name": "Fitto Ramo d'Azienda", "type": "expense", "order": 181},
            {"name": "Fitto AR", "type": "expense", "order": 182},
            {"name": "Fitto CVM", "type": "expense", "order": 183},
        ]},
        
        {"name": "Consulenze", "type": "expense", "order": 190, "children": [
            {"name": "Consulenza del lavoro", "type": "expense", "order": 191},
            {"name": "Consulenza fiscale", "type": "expense", "order": 192},
            {"name": "Consulenza legale", "type": "expense", "order": 193},
        ]},
        
        {"name": "Varie ed Eventuali", "type": "expense", "order": 200},
        
        {"name": "Ristr. Apt SDP Jr", "type": "expense", "order": 210, "children": [
            {"name": "MIELE RI.BA DAL 31/05/2025", "type": "expense", "order": 211},
            {"name": "ALESSIO", "type": "expense", "order": 212},
            {"name": "S.T.E.", "type": "expense", "order": 213},
            {"name": "PITTORE", "type": "expense", "order": 214},
            {"name": "INFISSI ROMANO", "type": "expense", "order": 215},
            {"name": "SANTELIA IMPIANTI", "type": "expense", "order": 216},
            {"name": "NUSCO", "type": "expense", "order": 217},
            {"name": "ARCHITETTO", "type": "expense", "order": 218},
        ]},
        
        {"name": "Deposito Fitto", "type": "expense", "order": 220},
        
        # Balance categories
        {"name": "Saldo Banca Sella", "type": "balance", "order": 300},
        {"name": "Saldo MPS", "type": "balance", "order": 301},
        {"name": "Saldo Intesa", "type": "balance", "order": 302},
        {"name": "CASSA CONTANTI", "type": "balance", "order": 310},
        
        # Financing categories
        {"name": "Fin. MPS 60 mesi", "type": "financing", "order": 400},
        
        # Calculated totals
        {"name": "TOTALE ENTRATE", "type": "revenue", "order": 90, "is_total": True, "is_calculated": True},
        {"name": "TOTALE USCITE", "type": "expense", "order": 290, "is_total": True, "is_calculated": True},
        {"name": "DIFF. Entrate-Uscite", "type": "balance", "order": 295, "is_calculated": True},
        {"name": "TOTALE BANCHE", "type": "balance", "order": 320, "is_total": True, "is_calculated": True},
        {"name": "CASH FLOW", "type": "balance", "order": 330, "is_calculated": True},
        {"name": "TOTALE AFFIDAMENTI", "type": "financing", "order": 410, "is_total": True, "is_calculated": True},
        {"name": "CASH FLOW CON AFFID.", "type": "balance", "order": 420, "is_calculated": True},
    ]
    
    # Get existing categories to avoid duplicates
    existing_result = supabase.table('categories').select('name').eq('company_id', company_id).execute()
    existing_names = {cat['name'] for cat in existing_result.data}
    
    # Create categories
    created_count = 0
    skipped_count = 0
    
    for cat_data in categories_data:
        # Skip if parent category already exists
        if cat_data["name"] in existing_names:
            print(f"⏭️  Skipped existing: {cat_data['name']}")
            skipped_count += 1
            continue
            
        # Create parent category
        parent_cat = {
            "company_id": company_id,
            "name": cat_data["name"],
            "type_id": cat_data["type"],
            "sort_order": cat_data["order"],
            "is_total": cat_data.get("is_total", False),
            "is_calculated": cat_data.get("is_calculated", False)
        }
        
        try:
            result = supabase.table('categories').insert(parent_cat).execute()
            created_count += 1
            parent_id = result.data[0]['id']
            print(f"✅ Created: {cat_data['name']} ({cat_data['type']})")
            
            # Create children if any
            if "children" in cat_data:
                for child in cat_data["children"]:
                    if child["name"] in existing_names:
                        print(f"  ⏭️  Skipped existing subcategory: {child['name']}")
                        skipped_count += 1
                        continue
                        
                    child_cat = {
                        "company_id": company_id,
                        "name": child["name"],
                        "type_id": child["type"],
                        "parent_id": parent_id,
                        "sort_order": child["order"],
                        "is_total": child.get("is_total", False),
                        "is_calculated": child.get("is_calculated", False)
                    }
                    
                    supabase.table('categories').insert(child_cat).execute()
                    created_count += 1
                    print(f"  ✅ Created subcategory: {child['name']}")
        except Exception as e:
            print(f"❌ Error creating {cat_data['name']}: {e}")
    
    print(f"\n🎉 Successfully created {created_count} categories!")
    print(f"⏭️  Skipped {skipped_count} existing categories")
    
    # Show summary
    result = supabase.table('categories').select('type_id').eq('company_id', company_id).execute()
    summary = {}
    for cat in result.data:
        cat_type = cat['type_id']
        summary[cat_type] = summary.get(cat_type, 0) + 1
    
    print("\n📊 Final Category Summary:")
    for cat_type, count in summary.items():
        print(f"  - {cat_type}: {count} categories")

if __name__ == "__main__":
    asyncio.run(create_uscite_categories()) 