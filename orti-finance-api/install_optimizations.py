#!/usr/bin/env python3
"""
Script per installare le ottimizzazioni Supabase nel database.
Esegue il file supabase_optimizations.sql per creare RPC functions e views ottimizzate.
"""

import asyncio
import logging
from supabase_service import SupabaseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def install_optimizations():
    """Installa le ottimizzazioni SQL nel database Supabase"""
    try:
        service = SupabaseService()
        
        # Leggi lo script di ottimizzazioni
        with open('supabase_optimizations.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        logger.info('🚀 Installando ottimizzazioni Supabase...')
        
        # Dividi per statement SQL (per evitare problemi con statement multipli)
        statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
        
        successful = 0
        failed = 0
        
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
                
            try:
                logger.info(f'📦 Eseguendo statement {i}/{len(statements)}...')
                
                # Per funzioni CREATE OR REPLACE, prova l'esecuzione diretta
                if any(keyword in statement.upper() for keyword in ['CREATE OR REPLACE FUNCTION', 'CREATE OR REPLACE VIEW', 'CREATE INDEX']):
                    # Usa il client SQL diretto per DDL statements
                    result = service.client.postgrest.session.post(
                        f"{service.client.supabase_url}/rest/v1/rpc/exec_raw_sql",
                        json={"sql": statement},
                        headers=service.client.postgrest.auth.headers
                    )
                    
                    if result.status_code == 200:
                        successful += 1
                        logger.info(f'✅ Statement {i} completato')
                    else:
                        logger.warning(f'⚠️ Statement {i} fallito: {result.text}')
                        failed += 1
                else:
                    # Per altri statement, usa rpc se disponibile
                    try:
                        result = service.client.rpc("exec_sql", {"sql_query": statement}).execute()
                        successful += 1
                        logger.info(f'✅ Statement {i} completato via RPC')
                    except Exception as rpc_error:
                        logger.warning(f'⚠️ RPC fallito per statement {i}: {rpc_error}')
                        failed += 1
                        
            except Exception as e:
                logger.warning(f'⚠️ Errore nello statement {i}: {e}')
                failed += 1
                continue
        
        logger.info(f'✅ Installazione completata: {successful} successi, {failed} fallimenti')
        
        # Verifica che alcune funzioni chiave esistano
        try:
            # Test della funzione principale
            result = service.client.rpc("get_company_quick_stats", {
                "p_company_id": "00000000-0000-0000-0000-000000000000",  # UUID dummy per test
                "p_year": 2025
            }).execute()
            logger.info('✅ Funzione get_company_quick_stats disponibile')
        except Exception as e:
            logger.warning(f'⚠️ Funzione get_company_quick_stats non disponibile: {e}')
            
        # Verifica view
        try:
            result = service.client.table("financial_data_complete").select("*").limit(1).execute()
            logger.info('✅ View financial_data_complete disponibile')
        except Exception as e:
            logger.warning(f'⚠️ View financial_data_complete non disponibile: {e}')
        
    except Exception as e:
        logger.error(f'❌ Errore durante l\'installazione: {e}')
        raise

if __name__ == "__main__":
    asyncio.run(install_optimizations())