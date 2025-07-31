-- 🚀 ORTI FINANCE - SUPABASE API OPTIMIZATIONS
-- Based on https://supabase.com/docs/guides/api
-- Creates optimized RPC functions and views for better API performance

-- ============================================================================
-- MATERIALIZED VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for complete financial data with category relationships
CREATE OR REPLACE VIEW financial_data_complete AS
SELECT 
    e.id,
    e.subcategory_id,
    e.year,
    e.month,
    e.value,
    e.is_projection,
    e.notes,
    e.created_at,
    e.updated_at,
    sc.name as subcategory_name,
    sc.sort_order as subcategory_sort,
    c.id as category_id,
    c.name as category_name,
    c.type_id as category_type,
    c.sort_order as category_sort,
    c.company_id,
    comp.name as company_name
FROM entries e
JOIN subcategories sc ON e.subcategory_id = sc.id
JOIN categories c ON sc.category_id = c.id
JOIN companies comp ON c.company_id = comp.id;

-- ============================================================================
-- RPC FUNCTIONS FOR COMPLEX AGGREGATIONS
-- ============================================================================

-- Get complete company financial summary (faster than multiple API calls)
CREATE OR REPLACE FUNCTION get_company_financial_summary(
    p_company_id UUID,
    p_year INTEGER,
    p_include_projections BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    consolidated_revenue DECIMAL := 0;
    consolidated_expenses DECIMAL := 0;
    projection_revenue DECIMAL := 0;
    projection_expenses DECIMAL := 0;
    monthly_data JSON;
    categories_data JSON;
BEGIN
    -- Calculate consolidated totals (actual data)
    SELECT 
        COALESCE(SUM(CASE WHEN category_type = 'revenue' THEN value ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category_type = 'expense' THEN value ELSE 0 END), 0)
    INTO consolidated_revenue, consolidated_expenses
    FROM financial_data_complete 
    WHERE company_id = p_company_id 
      AND year = p_year 
      AND NOT is_projection;
    
    -- Calculate projection totals if requested
    IF p_include_projections THEN
        SELECT 
            COALESCE(SUM(CASE WHEN category_type = 'revenue' THEN value ELSE 0 END), 0),
            COALESCE(SUM(CASE WHEN category_type = 'expense' THEN value ELSE 0 END), 0)
        INTO projection_revenue, projection_expenses
        FROM financial_data_complete 
        WHERE company_id = p_company_id 
          AND year = p_year 
          AND is_projection;
    END IF;
    
    -- Get monthly breakdown
    SELECT json_agg(
        json_build_object(
            'month', month,
            'consolidated_revenue', consolidated_rev,
            'consolidated_expenses', consolidated_exp,
            'projection_revenue', projection_rev,
            'projection_expenses', projection_exp
        ) ORDER BY month
    ) INTO monthly_data
    FROM (
        SELECT 
            month,
            SUM(CASE WHEN NOT is_projection AND category_type = 'revenue' THEN value ELSE 0 END) as consolidated_rev,
            SUM(CASE WHEN NOT is_projection AND category_type = 'expense' THEN value ELSE 0 END) as consolidated_exp,
            SUM(CASE WHEN is_projection AND category_type = 'revenue' THEN value ELSE 0 END) as projection_rev,
            SUM(CASE WHEN is_projection AND category_type = 'expense' THEN value ELSE 0 END) as projection_exp
        FROM financial_data_complete 
        WHERE company_id = p_company_id AND year = p_year
        GROUP BY month
    ) monthly_summary;
    
    -- Get category breakdown
    SELECT json_agg(
        json_build_object(
            'category_name', category_name,
            'category_type', category_type,
            'consolidated_total', consolidated_total,
            'projection_total', projection_total,
            'subcategories', subcategories
        ) ORDER BY category_sort
    ) INTO categories_data
    FROM (
        SELECT 
            category_name,
            category_type,
            category_sort,
            SUM(CASE WHEN NOT is_projection THEN value ELSE 0 END) as consolidated_total,
            SUM(CASE WHEN is_projection THEN value ELSE 0 END) as projection_total,
            json_agg(
                json_build_object(
                    'name', subcategory_name,
                    'consolidated_value', COALESCE(SUM(CASE WHEN NOT is_projection THEN value END), 0),
                    'projection_value', COALESCE(SUM(CASE WHEN is_projection THEN value END), 0)
                ) ORDER BY subcategory_sort
            ) as subcategories
        FROM financial_data_complete 
        WHERE company_id = p_company_id AND year = p_year
        GROUP BY category_name, category_type, category_sort
    ) category_summary;
    
    -- Build final result
    result := json_build_object(
        'company_id', p_company_id,
        'year', p_year,
        'consolidated', json_build_object(
            'total_revenue', consolidated_revenue,
            'total_expenses', consolidated_expenses,
            'net_profit', consolidated_revenue - consolidated_expenses
        ),
        'projections', json_build_object(
            'total_revenue', projection_revenue,
            'total_expenses', projection_expenses,
            'net_profit', projection_revenue - projection_expenses
        ),
        'combined', json_build_object(
            'total_revenue', consolidated_revenue + projection_revenue,
            'total_expenses', consolidated_expenses + projection_expenses,
            'net_profit', (consolidated_revenue + projection_revenue) - (consolidated_expenses + projection_expenses)
        ),
        'monthly_data', monthly_data,
        'categories', categories_data,
        'generated_at', CURRENT_TIMESTAMP
    );
    
    RETURN result;
END;
$$;

-- Get variance analysis for specific period
CREATE OR REPLACE FUNCTION get_variance_analysis(
    p_company_id UUID,
    p_year INTEGER,
    p_month INTEGER DEFAULT NULL,
    p_variance_threshold DECIMAL DEFAULT 0.15
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    significant_variances JSON;
BEGIN
    -- Calculate variances by category
    WITH variance_data AS (
        SELECT 
            category_name,
            category_type,
            month,
            SUM(CASE WHEN NOT is_projection THEN value ELSE 0 END) as actual_value,
            SUM(CASE WHEN is_projection THEN value ELSE 0 END) as projected_value,
            SUM(CASE WHEN NOT is_projection THEN value ELSE 0 END) - 
            SUM(CASE WHEN is_projection THEN value ELSE 0 END) as variance_absolute,
            CASE 
                WHEN SUM(CASE WHEN is_projection THEN value ELSE 0 END) != 0 THEN
                    (SUM(CASE WHEN NOT is_projection THEN value ELSE 0 END) - 
                     SUM(CASE WHEN is_projection THEN value ELSE 0 END)) / 
                    ABS(SUM(CASE WHEN is_projection THEN value ELSE 0 END))
                ELSE 0
            END as variance_percentage
        FROM financial_data_complete 
        WHERE company_id = p_company_id 
          AND year = p_year
          AND (p_month IS NULL OR month = p_month)
        GROUP BY category_name, category_type, month
    )
    SELECT json_agg(
        json_build_object(
            'category_name', category_name,
            'category_type', category_type,
            'month', month,
            'actual_value', actual_value,
            'projected_value', projected_value,
            'variance_absolute', variance_absolute,
            'variance_percentage', variance_percentage,
            'is_significant', ABS(variance_percentage) > p_variance_threshold
        )
    ) INTO significant_variances
    FROM variance_data
    WHERE ABS(variance_percentage) > p_variance_threshold
    ORDER BY ABS(variance_percentage) DESC;
    
    result := json_build_object(
        'company_id', p_company_id,
        'year', p_year,
        'month', p_month,
        'variance_threshold', p_variance_threshold,
        'significant_variances', significant_variances,
        'analysis_date', CURRENT_TIMESTAMP
    );
    
    RETURN result;
END;
$$;

-- Batch upsert entries (much faster than individual calls)
CREATE OR REPLACE FUNCTION batch_upsert_entries(
    entries_json JSON
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    entry_record JSON;
    inserted_count INTEGER := 0;
    updated_count INTEGER := 0;
    error_count INTEGER := 0;
    result JSON;
BEGIN
    -- Process each entry in the JSON array
    FOR entry_record IN SELECT * FROM json_array_elements(entries_json)
    LOOP
        BEGIN
            INSERT INTO entries (
                subcategory_id, 
                year, 
                month, 
                value, 
                is_projection, 
                notes
            ) 
            VALUES (
                (entry_record->>'subcategory_id')::UUID,
                (entry_record->>'year')::INTEGER,
                (entry_record->>'month')::INTEGER,
                (entry_record->>'value')::DECIMAL,
                (entry_record->>'is_projection')::BOOLEAN,
                (entry_record->>'notes')::TEXT
            )
            ON CONFLICT (subcategory_id, year, month) 
            DO UPDATE SET 
                value = EXCLUDED.value,
                is_projection = EXCLUDED.is_projection,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP;
            
            -- Check if it was an insert or update
            IF FOUND THEN
                updated_count := updated_count + 1;
            ELSE
                inserted_count := inserted_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
        END;
    END LOOP;
    
    result := json_build_object(
        'success', true,
        'inserted_count', inserted_count,
        'updated_count', updated_count,
        'error_count', error_count,
        'total_processed', inserted_count + updated_count + error_count
    );
    
    RETURN result;
END;
$$;

-- Quick performance function to get basic stats
CREATE OR REPLACE FUNCTION get_company_quick_stats(
    p_company_id UUID,
    p_year INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_entries', COUNT(*),
        'consolidated_entries', SUM(CASE WHEN NOT is_projection THEN 1 ELSE 0 END),
        'projection_entries', SUM(CASE WHEN is_projection THEN 1 ELSE 0 END),
        'total_value', SUM(value),
        'months_with_data', COUNT(DISTINCT month),
        'categories_count', COUNT(DISTINCT category_id),
        'last_updated', MAX(updated_at)
    ) INTO result
    FROM financial_data_complete
    WHERE company_id = p_company_id AND year = p_year;
    
    RETURN result;
END;
$$;

-- ============================================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entries_company_year_month 
ON entries USING btree ((
    SELECT c.company_id FROM subcategories sc 
    JOIN categories c ON sc.category_id = c.id 
    WHERE sc.id = entries.subcategory_id
), year, month);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entries_projection_type 
ON entries USING btree (is_projection, year, month);

-- Full-text search index for notes (useful for API search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entries_notes_fts 
ON entries USING gin(to_tsvector('english', notes));

COMMENT ON FUNCTION get_company_financial_summary IS 'Optimized RPC function for complete financial summary - replaces multiple API calls with single query';
COMMENT ON FUNCTION get_variance_analysis IS 'Fast variance analysis using PostgreSQL aggregations instead of client-side calculations';
COMMENT ON FUNCTION batch_upsert_entries IS 'Batch insert/update entries for bulk operations - much faster than individual API calls';
COMMENT ON VIEW financial_data_complete IS 'Pre-joined view of all financial data - optimizes common queries with deep relationships';