#!/usr/bin/env python3
"""
🚀 IMPORT DATI 2024 E 2026 DAL PIANO EXCEL
Script rapido per importare i dati mancanti negli anni 2024 e 2026
"""

import asyncio
from supabase_service import SupabaseService

# Dati 2024 (solo entrate) - dal tuo Excel
DATI_2024 = {
    "Entrate Residence": {
        3: 4777, 4: 49890, 5: 88296, 6: 153629, 7: 257788, 8: 316657, 
        9: 134995, 10: 55622, 11: 3208
    },
    "Entrate CVM": {
        1: 5689, 2: 5175, 3: 8060, 4: 16739, 5: 23803, 6: 29012, 
        7: 39076, 8: 46508, 9: 21464, 10: 13060, 11: 1994, 12: 4088
    },
    "Entrate Hotel": {
        1: 637, 2: 726, 3: 9513, 4: 125808, 5: 339132, 6: 469332, 
        7: 570080, 8: 627518, 9: 510343, 10: 274977, 11: 30226, 12: 3453
    },
    "Entrate Supermercato": {m: 25620 for m in range(1, 13)}  # Tutti i mesi
}

# Dati 2026 (gen-apr) - dal tuo Excel
DATI_2026 = {
    # Entrate
    "Entrate Supermercato": {1: 25620, 2: 25620, 3: 25620, 4: 25620},
    
    # Uscite (principalmente)
    "SALARI": {1: 37000},  # Gennaio
    "Energia elettrica": {1: 15944, 2: 14234},
    "IMPOSTE": {1: 5109, 3: 10000},
    "Mutuo Intesa": {1: 13157, 2: 13157, 3: 13157, 4: 13157},
    "Proxima Service": {1: 398, 2: 98, 3: 98, 4: 98}
}

async def main():
    supabase = SupabaseService()
    
    # Ottieni company ORTI
    company = await supabase.get_or_create_company("ORTI")
    company_id = company["id"]
    
    print("🚀 Importing 2024 e 2026 data...")
    
    # ===== IMPORT 2024 (solo entrate) =====
    print("\n📈 Importing 2024 data...")
    entries_2024 = 0
    
    for categoria, mesi_valori in DATI_2024.items():
        # Trova subcategory (usa la prima disponibile)
        try:
            subcategory = await supabase.supabase.table('subcategories')\
                .select('id')\
                .eq('categories.name', categoria)\
                .eq('categories.company_id', company_id)\
                .single()
            
            if not subcategory.data:
                print(f"⚠️  Categoria {categoria} non trovata, skip...")
                continue
                
            subcategory_id = subcategory.data['id']
            
            for mese, valore in mesi_valori.items():
                if valore > 0:
                    await supabase.supabase.table('entries').upsert({
                        'subcategory_id': subcategory_id,
                        'year': 2024,
                        'month': mese,
                        'value': valore,
                        'is_projection': False,
                        'notes': f'Import Excel 2024 - {categoria}'
                    }, on_conflict='subcategory_id,year,month').execute()
                    entries_2024 += 1
                    
        except Exception as e:
            print(f"❌ Errore {categoria}: {e}")
    
    print(f"✅ 2024: {entries_2024} entries importate")
    
    # ===== IMPORT 2026 (gen-apr) =====
    print("\n📊 Importing 2026 data...")
    entries_2026 = 0
    
    for categoria, mesi_valori in DATI_2026.items():
        try:
            # Cerca per nome categoria (match flessibile)
            subcategory = await supabase.supabase.table('subcategories')\
                .select('id')\
                .ilike('categories.name', f'%{categoria}%')\
                .eq('categories.company_id', company_id)\
                .limit(1)\
                .single()
            
            if not subcategory.data:
                print(f"⚠️  Categoria {categoria} non trovata, skip...")
                continue
                
            subcategory_id = subcategory.data['id']
            
            for mese, valore in mesi_valori.items():
                if valore > 0:
                    await supabase.supabase.table('entries').upsert({
                        'subcategory_id': subcategory_id,
                        'year': 2026,
                        'month': mese,
                        'value': valore,
                        'is_projection': True,  # 2026 è forecast
                        'notes': f'Import Excel 2026 - {categoria}'
                    }, on_conflict='subcategory_id,year,month').execute()
                    entries_2026 += 1
                    
        except Exception as e:
            print(f"❌ Errore {categoria}: {e}")
    
    print(f"✅ 2026: {entries_2026} entries importate")
    
    print(f"\n🎉 Import completato!")
    print(f"📊 Totale entries: {entries_2024 + entries_2026}")
    print("🔄 Ricarica il frontend per vedere i nuovi dati!")

if __name__ == "__main__":
    asyncio.run(main()) 