from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, Union
import json
from datetime import datetime
import calendar
from supabase_service import SupabaseService

app = FastAPI(title="ORTI Finance API", version="1.0.0")

# Inizializza il servizio Supabase
supabase_service = SupabaseService()

# CORS middleware per il frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelli Pydantic per l'import
class RicaviStorici(BaseModel):
    ricavi: Dict[str, Dict[str, Dict[str, Union[float, int]]]]

class DettagliUscite(BaseModel):
    Totale: float
    Dettagli: Optional[Dict[str, float]] = {}

class DatiMensili(BaseModel):
    compagnia: str
    anno: int
    mese: str
    entrate: Dict[str, Union[float, int]]
    uscite: Dict[str, Union[float, int, Dict[str, Any]]]
    cashflow: Optional[Dict[str, Union[float, int, Dict[str, Any]]]] = {}

# Mapping dei nomi dai tuoi dati alle categorie dell'app
REVENUE_MAPPING = {
    "ANGELINARES": "entrate-residence",  # Residence
    "HOMEHOLIDAY": "entrate-cvm",        # CVM (Casa Vacanze Mare)
    "PANORAMAHT": "entrate-hotel",       # Hotel
    "Hotel": "entrate-hotel",
    "Residence": "entrate-residence", 
    "CVM": "entrate-cvm",
    "Supermercato": "entrate-supermercato",
    "Caparre": "caparre-intur",
    "Caparre Intur": "caparre-intur"
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

def converti_mese_anno(mese: str, anno: int) -> str:
    """Converte mese italiano e anno in formato MM-YYYY"""
    mese_num = MONTH_MAPPING.get(mese, "01")
    return f"{mese_num}-{anno}"

def converti_ricavi_storici(data: RicaviStorici) -> Dict[str, Any]:
    """Converte i ricavi storici nel formato FinCal"""
    risultato = {}
    
    for anno, dati_anno in data.ricavi.items():
        for struttura, mesi_dati in dati_anno.items():
            if struttura == "TOTALE":
                continue  # Skippiamo il totale, lo calcoliamo automaticamente
                
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
    """Converte i dati mensili nel formato FinCal"""
    month_year = converti_mese_anno(data.mese, data.anno)
    risultato = {
        "month_year": month_year,
        "revenues": {},
        "expenses": {},
        "balances": {}
    }
    
    # Converti entrate
    for nome, valore in data.entrate.items():
        if nome == "Totale":
            continue
        categoria_id = REVENUE_MAPPING.get(nome)
        if categoria_id:
            risultato["revenues"][categoria_id] = float(valore)
    
    # Converti uscite
    for nome, valore in data.uscite.items():
        if nome == "Totale":
            continue
            
        categoria_id = EXPENSE_MAPPING.get(nome)
        if categoria_id:
            # Se il valore è un dizionario con struttura {Totale: X, Dettagli: {...}}
            if isinstance(valore, dict) and "Totale" in valore:
                risultato["expenses"][categoria_id] = float(valore["Totale"])
                
                # Gestisci subcategorie se presenti
                if "Dettagli" in valore:
                    risultato["expenses"][f"{categoria_id}_details"] = valore["Dettagli"]
            # Se il valore è numerico direttamente
            elif isinstance(valore, (int, float)):
                risultato["expenses"][categoria_id] = float(valore)
            # Se arriva come stringa numerica
            elif isinstance(valore, str):
                try:
                    risultato["expenses"][categoria_id] = float(valore)
                except ValueError:
                    continue
    
    # Converti cashflow/saldi bancari
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

@app.get("/")
async def root():
    return {"message": "ORTI Finance API", "version": "1.0.0"}

@app.post("/import/ricavi-storici")
async def import_ricavi_storici(data: RicaviStorici):
    """Importa i ricavi storici (2024-2025) in Supabase"""
    try:
        # Converti i dati nel formato interno
        dati_convertiti = converti_ricavi_storici(data)
        
        # Ottieni o crea la compagnia ORTI
        company = await supabase_service.get_or_create_company("ORTI", "Gruppo ORTI - Strutture turistiche")
        
        # Importa i dati nel database
        result = await supabase_service.import_historical_revenues(company["id"], dati_convertiti)
        
        return {
            "success": True,
            "message": f"Importati ricavi per {len(dati_convertiti)} categorie in Supabase",
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
        raise HTTPException(status_code=400, detail=f"Errore nell'import: {str(e)}")

@app.post("/import/dati-mensili")
async def import_dati_mensili(data: DatiMensili):
    """Importa dati mensili completi (entrate, uscite, cashflow) in Supabase"""
    try:
        # Converti i dati nel formato interno
        dati_convertiti = converti_dati_mensili(data)
        
        # Ottieni o crea la compagnia ORTI
        company = await supabase_service.get_or_create_company("ORTI", "Gruppo ORTI - Strutture turistiche")
        
        # Importa i dati nel database
        result = await supabase_service.import_monthly_data(company["id"], dati_convertiti)
        
        return {
            "success": True,
            "message": f"Importati dati per {data.mese} {data.anno} in Supabase",
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
        raise HTTPException(status_code=400, detail=f"Errore nell'import: {str(e)}")

@app.get("/companies/{company_name}/data/{year}/{month}")
async def get_monthly_data(company_name: str, year: int, month: int):
    """Ottiene i dati mensili di una compagnia da Supabase"""
    try:
        # Trova la compagnia
        company = await supabase_service.get_or_create_company(company_name)
        
        # Ottieni i totali mensili
        totals = await supabase_service.get_monthly_totals(company["id"], year, month)
        
        return {
            "success": True,
            "company": company["name"],
            "period": f"{month:02d}-{year}",
            "data": totals
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Errore nel recupero dati: {str(e)}")

@app.get("/test-supabase")
async def test_supabase():
    """Testa la connessione a Supabase"""
    try:
        # Prova a creare/ottenere la compagnia ORTI
        company = await supabase_service.get_or_create_company("ORTI", "Test connessione")
        
        return {
            "success": True,
            "message": "Connessione a Supabase funzionante",
            "company": company
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore connessione Supabase: {str(e)}")

@app.get("/status")
async def status():
    return {
        "status": "active",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/import/ricavi-storici",
            "/import/dati-mensili",
            "/companies/{company_name}/data/{year}/{month}",
            "/test-supabase",
            "/status"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 