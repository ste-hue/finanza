from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from io import BytesIO
from datetime import datetime
import json
from typing import Dict, Any

app = FastAPI(
    title="ORTI Finance API",
    description="API per export di dati finanziari e proiezioni",
    version="1.0.0"
)

# CORS per collegamento con React (porta 5173 di Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "ORTI Finance API", "status": "active", "timestamp": datetime.now()}

@app.get("/export/previsioni")
def export_excel():
    """
    Endpoint per export Excel delle previsioni finanziarie
    Genera un file .xlsx scaricabile dal frontend
    """
    # Dati di esempio - TODO: sostituire con dati reali dal JSON ORTI
    dati_proiezioni = [
        {"Mese": "Gennaio 2025", "Entrate": 0.0, "Uscite": 158293.0, "Saldo": -158293.0, "Cumulativo": -158293.0},
        {"Mese": "Febbraio 2025", "Entrate": 0.0, "Uscite": 31468.0, "Saldo": -31468.0, "Cumulativo": -189761.0},
        {"Mese": "Marzo 2025", "Entrate": 45000.0, "Uscite": 42500.0, "Saldo": 2500.0, "Cumulativo": -187261.0},
        {"Mese": "Aprile 2025", "Entrate": 85000.0, "Uscite": 48200.0, "Saldo": 36800.0, "Cumulativo": -150461.0},
        {"Mese": "Maggio 2025", "Entrate": 125000.0, "Uscite": 55300.0, "Saldo": 69700.0, "Cumulativo": -80761.0},
        {"Mese": "Giugno 2025", "Entrate": 180000.0, "Uscite": 62400.0, "Saldo": 117600.0, "Cumulativo": 36839.0},
    ]
    
    # Crea DataFrame
    df = pd.DataFrame(dati_proiezioni)
    
    # Formatta le colonne monetarie
    for col in ['Entrate', 'Uscite', 'Saldo', 'Cumulativo']:
        df[col] = df[col].apply(lambda x: f"€ {x:,.2f}")
    
    # Crea file Excel in memoria
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Proiezioni ORTI", startrow=2)
        
        # Accedi al worksheet per personalizzazioni
        worksheet = writer.sheets["Proiezioni ORTI"]
        
        # Aggiungi header
        worksheet['A1'] = 'PROIEZIONI FINANZIARIE ORTI SRL'
        worksheet['A2'] = f'Generato il: {datetime.now().strftime("%d/%m/%Y %H:%M")}'
        
        # Autofit colonne
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    output.seek(0)
    
    # Genera nome file con timestamp
    filename = f"proiezioni_orti_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    
    return Response(
        content=output.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "orti-finance-api"} 