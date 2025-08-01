import { createClient } from 'jsr:@supabase/supabase-js@^2';

// 🧘 ORTI Finance Edge Function - Advanced Financial Analysis
Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' }
      }
    }
  );

  try {
    const { action, data } = await req.json();

    switch (action) {
      // 📊 Calcoli finanziari avanzati
      case 'seasonal_forecast':
        return await calculateSeasonalForecast(supabaseClient, data);
      
      // 📈 Analisi ROI per investimenti
      case 'roi_analysis':
        return await calculateROI(supabaseClient, data);
        
      // 📋 Import massivo da Excel/CSV  
      case 'bulk_import':
        return await importBulkData(supabaseClient, data);
        
      // 📄 Generazione report PDF
      case 'generate_report':
        return await generateFinancialReport(supabaseClient, data);
        
      // 🎯 Confronto performance multi-anno
      case 'performance_comparison':
        return await compareYearlyPerformance(supabaseClient, data);

      default:
        return new Response(JSON.stringify({ 
          error: 'Invalid action. Available: seasonal_forecast, roi_analysis, bulk_import, generate_report, performance_comparison' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' } 
        });
    }
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});

// 🌊 Calcola proiezioni stagionali basate su storico
async function calculateSeasonalForecast(supabase: any, { year, category }: any) {
  // Query dati storici ultimi 3 anni
  const { data: historicalData, error } = await supabase
    .from('entries')
    .select(`
      value, month, year,
      subcategories!inner (
        categories!inner (name, type_id)
      )
    `)
    .eq('subcategories.categories.name', category)
    .gte('year', year - 3)
    .lt('year', year)
    .eq('is_projection', false);

  if (error) throw error;

  // Calcola medie stagionali
  const seasonalPattern = calculateSeasonalPattern(historicalData);
  const forecast = generateForecast(seasonalPattern, year);

  return new Response(JSON.stringify({
    category,
    year,
    seasonalPattern,
    forecast,
    confidence: calculateConfidence(historicalData)
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 💰 Calcola ROI per investimenti/progetti
async function calculateROI(supabase: any, { investment, period, category }: any) {
  const { data: revenues, error } = await supabase
    .from('entries')
    .select('value, month')
    .eq('subcategories.categories.name', category)
    .eq('year', new Date().getFullYear())
    .eq('is_projection', false);

  if (error) throw error;

  const totalRevenue = revenues.reduce((sum: number, entry: any) => sum + entry.value, 0);
  const roi = ((totalRevenue - investment) / investment) * 100;
  const paybackPeriod = investment / (totalRevenue / period);

  return new Response(JSON.stringify({
    investment,
    totalRevenue,
    roi: roi.toFixed(2),
    paybackPeriod: paybackPeriod.toFixed(1),
    isPositive: roi > 0
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 📋 Import massivo di dati
async function importBulkData(supabase: any, { entries }: any) {
  const results = [];
  
  for (const entry of entries) {
    try {
      // Trova subcategory_id
      const { data: subcategory } = await supabase
        .from('subcategories')
        .select('id')
        .eq('categories.name', entry.categoryName)
        .eq('categories.companies.name', 'ORTI')
        .single();

      if (!subcategory) {
        results.push({ ...entry, status: 'error', reason: 'Category not found' });
        continue;
      }

      // Insert entry
      const { error } = await supabase
        .from('entries')
        .upsert({
          subcategory_id: subcategory.id,
          year: entry.year,
          month: entry.month,
          value: entry.value,
          is_projection: entry.isProjection || false,
          notes: entry.notes || ''
        });

      results.push({ 
        ...entry, 
        status: error ? 'error' : 'success',
        reason: error?.message 
      });

    } catch (err) {
      results.push({ ...entry, status: 'error', reason: err.message });
    }
  }

  return new Response(JSON.stringify({
    total: entries.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 📄 Genera report finanziario
async function generateFinancialReport(supabase: any, { year, format }: any) {
  // Query tutti i dati dell'anno
  const { data: entries, error } = await supabase
    .from('entries')
    .select(`
      value, month, is_projection,
      subcategories!inner (
        name,
        categories!inner (name, type_id)
      )
    `)
    .eq('year', year)
    .eq('subcategories.categories.companies.name', 'ORTI');

  if (error) throw error;

  // Aggrega dati per report
  const summary = aggregateForReport(entries);
  
  if (format === 'pdf') {
    // Qui useresti una libreria PDF come jsPDF
    return new Response('PDF generation not implemented yet', { status: 501 });
  }

  return new Response(JSON.stringify({
    year,
    generated: new Date().toISOString(),
    summary,
    totalEntries: entries.length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// 📊 Confronta performance multi-anno
async function compareYearlyPerformance(supabase: any, { years }: any) {
  const comparison = [];

  for (const year of years) {
    const { data: entries } = await supabase
      .from('entries')
      .select(`
        value,
        subcategories!inner (
          categories!inner (type_id)
        )
      `)
      .eq('year', year)
      .eq('is_projection', false);

    const revenues = entries
      ?.filter(e => e.subcategories.categories.type_id === 'revenue')
      .reduce((sum, e) => sum + e.value, 0) || 0;

    const expenses = entries
      ?.filter(e => e.subcategories.categories.type_id === 'expense')
      .reduce((sum, e) => sum + e.value, 0) || 0;

    comparison.push({
      year,
      revenues,
      expenses,
      profit: revenues - expenses,
      margin: revenues > 0 ? ((revenues - expenses) / revenues * 100).toFixed(2) : '0.00'
    });
  }

  return new Response(JSON.stringify({
    comparison,
    bestYear: comparison.reduce((best, current) => 
      current.profit > best.profit ? current : best
    )
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper functions
function calculateSeasonalPattern(data: any[]) {
  const monthlyAverages = {};
  for (let month = 1; month <= 12; month++) {
    const monthData = data.filter(d => d.month === month);
    monthlyAverages[month] = monthData.length > 0 
      ? monthData.reduce((sum, d) => sum + d.value, 0) / monthData.length 
      : 0;
  }
  return monthlyAverages;
}

function generateForecast(pattern: any, year: number) {
  return Object.entries(pattern).map(([month, avgValue]) => ({
    year,
    month: parseInt(month),
    predictedValue: avgValue,
    confidence: 0.8 // Simplified confidence
  }));
}

function calculateConfidence(data: any[]) {
  return data.length > 24 ? 0.9 : data.length > 12 ? 0.7 : 0.5;
}

function aggregateForReport(entries: any[]) {
  return {
    totalRevenues: entries
      .filter(e => e.subcategories.categories.type_id === 'revenue')
      .reduce((sum, e) => sum + e.value, 0),
    totalExpenses: entries
      .filter(e => e.subcategories.categories.type_id === 'expense')
      .reduce((sum, e) => sum + e.value, 0),
    monthlyBreakdown: Array.from({length: 12}, (_, i) => {
      const month = i + 1;
      const monthEntries = entries.filter(e => e.month === month);
      return {
        month,
        revenues: monthEntries
          .filter(e => e.subcategories.categories.type_id === 'revenue')
          .reduce((sum, e) => sum + e.value, 0),
        expenses: monthEntries
          .filter(e => e.subcategories.categories.type_id === 'expense')
          .reduce((sum, e) => sum + e.value, 0)
      };
    })
  };
}