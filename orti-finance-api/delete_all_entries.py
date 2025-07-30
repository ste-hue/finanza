#!/usr/bin/env python3
"""
Script per eliminare TUTTE le entries dal database cloud
Mantiene struttura (categorie + subcategorie) ma rimuove tutti i valori
"""

import asyncio
from supabase_service import SupabaseService

async def delete_all_entries():
    """Elimina tutte le entries ORTI dal database cloud"""
    
    service = SupabaseService()
    
    try:
        print("🧹 ELIMINAZIONE COMPLETA ENTRIES...")
        
        # 1. Trova company ORTI
        company_result = service.client.table('companies')\
            .select('id')\
            .eq('name', 'ORTI')\
            .execute()
        
        if not company_result.data:
            print("❌ Company ORTI non trovata")
            return
            
        company_id = company_result.data[0]['id']
        print(f"✅ Company ORTI trovata: {company_id}")
        
        # 2. Prima trova le categorie ORTI
        categories_result = service.client.table('categories')\
            .select('id')\
            .eq('company_id', company_id)\
            .execute()
            
        category_ids = [cat['id'] for cat in categories_result.data]
        print(f"📋 Trovate {len(category_ids)} categorie")
        
        # 3. Poi trova le subcategories
        subcats_result = service.client.table('subcategories')\
            .select('id')\
            .in_('category_id', category_ids)\
            .execute()
        
        subcat_ids = [sc['id'] for sc in subcats_result.data]
        print(f"📋 Trovate {len(subcat_ids)} subcategories")
        
        # 4. Conta entries esistenti
        count_result = service.client.table('entries')\
            .select('id', count='exact')\
            .in_('subcategory_id', subcat_ids)\
            .execute()
        
        total_entries = count_result.count
        print(f"📊 Entries da eliminare: {total_entries}")
        
        if total_entries == 0:
            print("✅ Database già vuoto!")
            return
        
        # 5. ELIMINA TUTTE LE ENTRIES
        delete_result = service.client.table('entries')\
            .delete()\
            .in_('subcategory_id', subcat_ids)\
            .execute()
        
        print(f"🗑️ Eliminate {len(delete_result.data) if delete_result.data else total_entries} entries")
        
        # 6. Verifica che sia tutto vuoto
        verify_result = service.client.table('entries')\
            .select('id', count='exact')\
            .in_('subcategory_id', subcat_ids)\
            .execute()
        
        remaining = verify_result.count
        print(f"✅ Entries rimanenti: {remaining}")
        
        if remaining == 0:
            print("🎉 DATABASE COMPLETAMENTE PULITO!")
        else:
            print(f"⚠️ Ancora {remaining} entries rimaste")
            
        return {
            "success": True,
            "deleted_entries": total_entries - remaining,
            "remaining_entries": remaining
        }
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = asyncio.run(delete_all_entries())
    print(f"\n📊 RISULTATO FINALE: {result}")