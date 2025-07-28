import asyncio
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

async def add_subcategories():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    # Get ORTI company ID
    result = supabase.table('companies').select('id').eq('name', 'ORTI').execute()
    if not result.data:
        print("❌ Company ORTI not found!")
        return
    
    company_id = result.data[0]['id']
    print(f"Adding subcategories for company ORTI (ID: {company_id})")
    
    # Get all parent categories
    result = supabase.table('categories').select('id, name').eq('company_id', company_id).execute()
    parent_map = {cat['name']: cat['id'] for cat in result.data}
    
    # Define subcategories
    subcategories = [
        # Salari e Stipendi
        {"parent": "Salari e Stipendi", "name": "SALARI", "order": 101},
        {"parent": "Salari e Stipendi", "name": "F24", "order": 102},
        
        # Materie Prime/Consumo
        {"parent": "Materie Prime/Consumo", "name": "A. MIGLIORE", "order": 111},
        {"parent": "Materie Prime/Consumo", "name": "BEVERAGE", "order": 112},
        {"parent": "Materie Prime/Consumo", "name": "MATERIALI DI CONSUMO", "order": 113},
        {"parent": "Materie Prime/Consumo", "name": "MATERIALE DI MANUTENZIONE", "order": 114},
        {"parent": "Materie Prime/Consumo", "name": "LAVANDERIA", "order": 115},
        
        # Utenze
        {"parent": "Utenze", "name": "Energia elettrica", "order": 121},
        {"parent": "Utenze", "name": "Gas", "order": 122},
        {"parent": "Utenze", "name": "Ausino", "order": 123},
        {"parent": "Utenze", "name": "Vodafone", "order": 124},
        {"parent": "Utenze", "name": "Connectivia", "order": 125},
        
        # Commissioni Portali
        {"parent": "Commissioni Portali", "name": "Commissioni Booking", "order": 131},
        {"parent": "Commissioni Portali", "name": "Commissioni Expedia", "order": 132},
        
        # Tasse e Imposte
        {"parent": "Tasse e Imposte", "name": "IMU", "order": 141},
        {"parent": "Tasse e Imposte", "name": "IMPOSTE", "order": 142},
        {"parent": "Tasse e Imposte", "name": "TARI HOTEL", "order": 143},
        {"parent": "Tasse e Imposte", "name": "IVA", "order": 144},
        {"parent": "Tasse e Imposte", "name": "IMPOSTA DI SOGGIORNO HP", "order": 145},
        {"parent": "Tasse e Imposte", "name": "IMPOSTA DI SOGGIORNO AR", "order": 146},
        {"parent": "Tasse e Imposte", "name": "IMPOSTA DI SOGGIORNO CVM", "order": 147},
        {"parent": "Tasse e Imposte", "name": "TARI RESIDENCE", "order": 148},
        {"parent": "Tasse e Imposte", "name": "TARI CVM", "order": 149},
        
        # Mutui e Finanziamenti
        {"parent": "Mutui e Finanziamenti", "name": "Mutuo MPS", "order": 151},
        {"parent": "Mutui e Finanziamenti", "name": "Mutuo Intesa", "order": 152},
        
        # Canoni e servizi
        {"parent": "Canoni e servizi", "name": "Proxima Service", "order": 161},
        {"parent": "Canoni e servizi", "name": "Hoxell", "order": 162},
        {"parent": "Canoni e servizi", "name": "Sistemi (E_solver)", "order": 163},
        {"parent": "Canoni e servizi", "name": "Zucchetti", "order": 164},
        {"parent": "Canoni e servizi", "name": "Pin App", "order": 165},
        {"parent": "Canoni e servizi", "name": "Spiagge", "order": 166},
        {"parent": "Canoni e servizi", "name": "Altamira", "order": 167},
        {"parent": "Canoni e servizi", "name": "Amalfi Web", "order": 168},
        {"parent": "Canoni e servizi", "name": "Commissioni Transato Pos", "order": 169},
        {"parent": "Canoni e servizi", "name": "Software tecnology", "order": 170},
        {"parent": "Canoni e servizi", "name": "Commissioni e spese Bancarie Varie", "order": 171},
        {"parent": "Canoni e servizi", "name": "Noleggio Tesla", "order": 172},
        
        # Godimento Beni di Terzi
        {"parent": "Godimento Beni di Terzi", "name": "Fitto Ramo d'Azienda", "order": 181},
        {"parent": "Godimento Beni di Terzi", "name": "Fitto AR", "order": 182},
        {"parent": "Godimento Beni di Terzi", "name": "Fitto CVM", "order": 183},
        
        # Consulenze
        {"parent": "Consulenze", "name": "Consulenza del lavoro", "order": 191},
        {"parent": "Consulenze", "name": "Consulenza fiscale", "order": 192},
        {"parent": "Consulenze", "name": "Consulenza legale", "order": 193},
        
        # Ristr. Apt SDP Jr
        {"parent": "Ristr. Apt SDP Jr", "name": "MIELE RI.BA DAL 31/05/2025", "order": 211},
        {"parent": "Ristr. Apt SDP Jr", "name": "ALESSIO", "order": 212},
        {"parent": "Ristr. Apt SDP Jr", "name": "S.T.E.", "order": 213},
        {"parent": "Ristr. Apt SDP Jr", "name": "PITTORE", "order": 214},
        {"parent": "Ristr. Apt SDP Jr", "name": "INFISSI ROMANO", "order": 215},
        {"parent": "Ristr. Apt SDP Jr", "name": "SANTELIA IMPIANTI", "order": 216},
        {"parent": "Ristr. Apt SDP Jr", "name": "NUSCO", "order": 217},
        {"parent": "Ristr. Apt SDP Jr", "name": "ARCHITETTO", "order": 218},
    ]
    
    created_count = 0
    skipped_count = 0
    
    for subcat in subcategories:
        parent_name = subcat["parent"]
        if parent_name not in parent_map:
            print(f"⚠️  Parent category '{parent_name}' not found, skipping {subcat['name']}")
            skipped_count += 1
            continue
            
        # Check if subcategory already exists
        existing = supabase.table('categories').select('id').eq('company_id', company_id).eq('name', subcat['name']).execute()
        if existing.data:
            print(f"⏭️  Subcategory already exists: {subcat['name']}")
            skipped_count += 1
            continue
        
        # Create subcategory using correct column names
        new_subcat = {
            "company_id": company_id,
            "name": subcat["name"],
            "type_id": "expense",  # Most subcategories are expenses
            "parent_id": parent_map[parent_name],
            "sort_order": subcat["order"]
        }
        
        try:
            supabase.table('categories').insert(new_subcat).execute()
            created_count += 1
            print(f"✅ Created subcategory: {parent_name} → {subcat['name']}")
        except Exception as e:
            print(f"❌ Error creating subcategory {subcat['name']}: {e}")
            skipped_count += 1
    
    print(f"\n🎉 Successfully created {created_count} subcategories!")
    print(f"⏭️  Skipped {skipped_count} existing subcategories")
    
    # Final summary
    result = supabase.table('categories').select('type_id, parent_id').eq('company_id', company_id).execute()
    parent_count = sum(1 for cat in result.data if cat['parent_id'] is None)
    child_count = sum(1 for cat in result.data if cat['parent_id'] is not None)
    
    print(f"\n📊 Final Structure:")
    print(f"  - Parent categories: {parent_count}")
    print(f"  - Subcategories: {child_count}")
    print(f"  - Total: {len(result.data)}")

if __name__ == "__main__":
    asyncio.run(add_subcategories()) 