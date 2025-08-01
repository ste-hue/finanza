#!/usr/bin/env python3
"""
Script per importare i dati finanziari da Excel a Supabase
"""

import pandas as pd
from supabase import create_client
import os
from datetime import datetime
import sys

# Configurazione
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://udeavsfewakatewsphfw.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_KEY:
    print("❌ Errore: SUPABASE_KEY non trovata. Impostala come variabile d'ambiente.")
    print("   Esempio: export SUPABASE_KEY='tua-api-key'")
    sys.exit(1)

# Inizializza client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def import_financial_data(excel_file='Piano Finanziario Jul 24 2025.xlsx'):
    """
    Importa i dati finanziari dal file Excel a Supabase
    """
    print(f"📊 Importazione dati da {excel_file}...")
    
    try:
        # Leggi Excel
        df = pd.read_excel(excel_file, sheet_name='Piano Finanziario')
        print(f"✅ File letto: {df.shape[0]} righe, {df.shape[1]} colonne")
        
        # Ottieni company_id
        result = supabase.table('companies').select('id').eq('name', 'ORTI').execute()
        if not result.data:
            print("❌ Errore: Company 'ORTI' non trovata nel database")
            return
        
        company_id = result.data[0]['id']
        print(f"✅ Company ID: {company_id}")
        
        # Pulisci dati esistenti 2025
        print("🧹 Pulizia dati 2025 esistenti...")
        supabase.table('entries').delete().eq('company_id', company_id).eq('year', 2025).execute()
        
        # Mappa mesi
        month_map = {
            'GENNAIO': 1, 'FEBBRAIO': 2, 'MARZO': 3, 'APRILE': 4,
            'MAGGIO': 5, 'GIUGNO': 6, 'LUGLIO': 7, 'AGOSTO': 8,
            'SETTEMBRE': 9, 'OTTOBRE': 10, 'NOVEMBRE': 11, 'DICEMBRE': 12
        }
        
        # Trova riga con mesi
        month_row_idx = None
        for idx, row in df.iterrows():
            row_str = ' '.join([str(v) for v in row.values if pd.notna(v)])
            if any(month in row_str.upper() for month in month_map.keys()):
                month_row_idx = idx
                print(f"✅ Trovata riga mesi all'indice: {month_row_idx}")
                break
        
        if month_row_idx is None:
            print("❌ Errore: Non riesco a trovare la riga con i mesi")
            return
        
        # Categorie da importare
        categories_to_import = [
            'Entrate Hotel', 'Entrate Residence', 'Entrate CVM', 
            'Entrate Supermercato', 'Rientro Sospesi', 'Caparre Intur',
            'Salari e Stipendi', 'Utenze', 'Materie Prime/Consumo',
            'Tasse e Imposte', 'Commissioni Portali', 'Mutui e Finaziamenti',
            'Consulenze', 'Godimento Beni di Terzi', 'Varie ed Eventuali',
            'Canoni e servizi', 'Saldo MPS', 'Saldo Intesa', 'CASSA CONTANTI'
        ]
        
        entries = []
        
        # Per ogni categoria
        for idx, row in df.iterrows():
            if idx <= month_row_idx:
                continue
                
            category_name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''
            
            if category_name in categories_to_import:
                print(f"📈 Processando categoria: {category_name}")
                
                # Per ogni colonna (mese)
                month_row = df.iloc[month_row_idx]
                for col_idx in range(1, len(row)):
                    month_str = str(month_row.iloc[col_idx]).strip().upper() if pd.notna(month_row.iloc[col_idx]) else ''
                    
                    if month_str in month_map:
                        month = month_map[month_str]
                        # Determina l'anno (assumendo 2025 per i primi 12 mesi, poi 2026)
                        year = 2025 if col_idx <= 14 else 2026
                        value = row.iloc[col_idx]
                        
                        if pd.notna(value) and value != 0:
                            try:
                                amount = float(value)
                                # Determina se è proiezione (da luglio 2025)
                                is_projection = (year == 2025 and month >= 7) or year > 2025
                                
                                entries.append({
                                    'company_id': company_id,
                                    'year': year,
                                    'month': month,
                                    'category_name': category_name,
                                    'amount': amount,
                                    'is_projection': is_projection
                                })
                            except (ValueError, TypeError):
                                print(f"⚠️  Valore non valido per {category_name} in {month_str}: {value}")
        
        print(f"\n📊 Trovate {len(entries)} voci da importare")
        
        # Salva nel database usando la stored procedure
        success_count = 0
        error_count = 0
        
        for entry in entries:
            try:
                result = supabase.rpc('save_entry', {
                    'p_company_name': 'ORTI',
                    'p_category_name': entry['category_name'],
                    'p_subcategory_name': 'Main',
                    'p_year': entry['year'],
                    'p_month': entry['month'],
                    'p_value': entry['amount'],
                    'p_is_projection': entry['is_projection']
                }).execute()
                success_count += 1
            except Exception as e:
                error_count += 1
                print(f"❌ Errore salvando {entry['category_name']} {entry['month']}/{entry['year']}: {e}")
        
        print(f"\n✅ Importazione completata!")
        print(f"   - Successi: {success_count}")
        print(f"   - Errori: {error_count}")
        
        # Mostra riepilogo per categoria
        print("\n📊 Riepilogo per categoria:")
        category_summary = {}
        for entry in entries:
            cat = entry['category_name']
            if cat not in category_summary:
                category_summary[cat] = 0
            category_summary[cat] += 1
        
        for cat, count in sorted(category_summary.items()):
            print(f"   - {cat}: {count} voci")
            
    except FileNotFoundError:
        print(f"❌ Errore: File '{excel_file}' non trovato")
        print("   Assicurati che il file Excel sia nella stessa cartella dello script")
    except Exception as e:
        print(f"❌ Errore generico: {e}")

if __name__ == "__main__":
    # Se viene passato un file come argomento, usalo
    if len(sys.argv) > 1:
        import_financial_data(sys.argv[1])
    else:
        import_financial_data()