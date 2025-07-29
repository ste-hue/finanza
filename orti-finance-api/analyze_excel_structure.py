#!/usr/bin/env python3
"""
📊 EXCEL STRUCTURE ANALYZER
Analizza la struttura del Piano Finanziario Excel per mappare la gerarchia corretta
"""

import pandas as pd
import json
from pathlib import Path

def analyze_excel_structure(excel_path: str):
    """Analizza tutti i fogli dell'Excel e mappa la struttura gerarchica"""
    
    print("🔍 ANALISI STRUTTURA EXCEL")
    print("=" * 50)
    
    try:
        # Leggi tutti i fogli
        excel_file = pd.ExcelFile(excel_path)
        sheet_names = excel_file.sheet_names
        
        print(f"📁 Fogli trovati: {len(sheet_names)}")
        for i, sheet in enumerate(sheet_names):
            print(f"  {i+1}. {sheet}")
        
        print("\n" + "=" * 50)
        
        structure = {
            "primo_foglio": {},  # Piano finanziario totale
            "fogli_dettaglio": {},  # Fogli per ogni voce di uscita
            "entrate": {},
            "uscite_macro": {},
            "uscite_dettaglio": {}
        }
        
        # ===== ANALISI PRIMO FOGLIO (Piano principale) =====
        primo_foglio = sheet_names[0]
        print(f"\n📋 ANALIZZANDO PRIMO FOGLIO: {primo_foglio}")
        print("-" * 40)
        
        df_main = pd.read_excel(excel_path, sheet_name=primo_foglio)
        print(f"📏 Dimensioni: {df_main.shape[0]} righe, {df_main.shape[1]} colonne")
        
        # Mostra struttura colonne
        print(f"📊 Colonne: {list(df_main.columns)}")
        
        # Trova sezioni ENTRATE e USCITE
        entrate_section = find_section(df_main, "ENTRATE")
        uscite_section = find_section(df_main, "USCITE")
        
        if entrate_section:
            structure["entrate"] = analyze_entrate_section(df_main, entrate_section)
            print(f"✅ Sezione ENTRATE trovata: {len(structure['entrate'])} voci")
            
        if uscite_section:
            structure["uscite_macro"] = analyze_uscite_macro_section(df_main, uscite_section)
            print(f"✅ Sezione USCITE trovata: {len(structure['uscite_macro'])} voci macro")
        
        # ===== ANALISI FOGLI DETTAGLIO =====
        print(f"\n📑 ANALIZZANDO FOGLI DETTAGLIO ({len(sheet_names)-1} fogli)")
        print("-" * 40)
        
        for sheet_name in sheet_names[1:]:  # Salta il primo foglio
            print(f"\n🔍 Foglio: {sheet_name}")
            try:
                df_detail = pd.read_excel(excel_path, sheet_name=sheet_name)
                detail_analysis = analyze_detail_sheet(df_detail, sheet_name)
                structure["fogli_dettaglio"][sheet_name] = detail_analysis
                print(f"  📏 {df_detail.shape[0]} righe, {df_detail.shape[1]} colonne")
                print(f"  📊 Voci dettaglio: {detail_analysis.get('num_items', 0)}")
                
            except Exception as e:
                print(f"  ❌ Errore leggendo {sheet_name}: {e}")
        
        # ===== SALVA RISULTATI =====
        output_file = "excel_structure_analysis.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n💾 Analisi salvata in: {output_file}")
        
        # ===== SUMMARY =====
        print(f"\n🎯 RIASSUNTO STRUTTURA")
        print("=" * 50)
        print(f"📁 Primo foglio (macro): {primo_foglio}")
        print(f"📈 Entrate macro: {len(structure['entrate'])} voci")
        print(f"📉 Uscite macro: {len(structure['uscite_macro'])} voci")
        print(f"📑 Fogli dettaglio: {len(structure['fogli_dettaglio'])} fogli")
        
        return structure
        
    except Exception as e:
        print(f"❌ Errore generale: {e}")
        return None

def find_section(df, section_name):
    """Trova l'inizio di una sezione (ENTRATE/USCITE) nel dataframe"""
    try:
        # Cerca in tutte le colonne
        for col in df.columns:
            mask = df[col].astype(str).str.contains(section_name, case=False, na=False)
            if mask.any():
                row_idx = df[mask].index[0]
                return {"start_row": row_idx, "column": col}
        return None
    except:
        return None

def analyze_entrate_section(df, section_info):
    """Analizza la sezione entrate del foglio principale"""
    entrate = {}
    try:
        start_row = section_info["start_row"]
        
        # Scorri le righe dopo ENTRATE finché non trovi USCITE o fine
        for i in range(start_row + 1, len(df)):
            row = df.iloc[i]
            
            # Fermati se trovi USCITE
            if any("USCITE" in str(cell) for cell in row if pd.notna(cell)):
                break
                
            # Cerca voci che sembrano categorie entrate
            first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
            if first_col and not first_col.startswith("Total") and len(first_col) > 3:
                entrate[first_col] = {
                    "row": i,
                    "values": [v for v in row[1:13] if pd.notna(v)]  # 12 mesi
                }
                
    except Exception as e:
        print(f"⚠️ Errore analisi entrate: {e}")
        
    return entrate

def analyze_uscite_macro_section(df, section_info):
    """Analizza la sezione uscite macro del foglio principale"""
    uscite = {}
    try:
        start_row = section_info["start_row"]
        
        # Scorri le righe dopo USCITE
        for i in range(start_row + 1, len(df)):
            row = df.iloc[i]
            
            # Fermati se arrivi alla fine o trovi una sezione diversa
            if i > start_row + 50:  # Limite ragionevole
                break
                
            first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
            if first_col and not first_col.startswith("Total") and len(first_col) > 3:
                uscite[first_col] = {
                    "row": i,
                    "values": [v for v in row[1:13] if pd.notna(v)],  # 12 mesi
                    "has_detail_sheet": first_col in excel_file.sheet_names if 'excel_file' in globals() else False
                }
                
    except Exception as e:
        print(f"⚠️ Errore analisi uscite: {e}")
        
    return uscite

def analyze_detail_sheet(df, sheet_name):
    """Analizza un foglio di dettaglio"""
    analysis = {
        "sheet_name": sheet_name,
        "num_items": 0,
        "columns": list(df.columns),
        "sample_rows": [],
        "monthly_data": {}
    }
    
    try:
        # Conta righe non vuote
        non_empty_rows = df.dropna(how='all')
        analysis["num_items"] = len(non_empty_rows)
        
        # Prendi campione prime 5 righe
        for i in range(min(5, len(df))):
            row_data = []
            for val in df.iloc[i]:
                if pd.notna(val):
                    row_data.append(str(val)[:50])  # Limita lunghezza
            if row_data:
                analysis["sample_rows"].append(row_data)
        
    except Exception as e:
        print(f"⚠️ Errore analisi foglio {sheet_name}: {e}")
    
    return analysis

def main():
    """Main function"""
    excel_path = "../Piano Finanziario Jul 24 2025.xlsx"
    
    if not Path(excel_path).exists():
        print(f"❌ File non trovato: {excel_path}")
        return
    
    print("🚀 AVVIO ANALISI STRUTTURA EXCEL")
    
    structure = analyze_excel_structure(excel_path)
    
    if structure:
        print("\n✅ ANALISI COMPLETATA!")
        print("\n🎯 PROSSIMI STEP:")
        print("1. Verifica excel_structure_analysis.json")
        print("2. Confronta con struttura DB attuale") 
        print("3. Pianifica migrazione/ristrutturazione")
    else:
        print("\n❌ ANALISI FALLITA")

if __name__ == "__main__":
    main() 