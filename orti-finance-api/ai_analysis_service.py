"""
🧠 AI Analysis Service for ORTI Finance
Integrates Sequential Thinking for financial analysis and insights
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

class AnalysisType(Enum):
    VARIANCE_INVESTIGATION = "variance_investigation"
    BUDGET_PLANNING = "budget_planning" 
    SEASONAL_OPTIMIZATION = "seasonal_optimization"
    CASH_FLOW_ANALYSIS = "cash_flow_analysis"
    INVESTMENT_DECISION = "investment_decision"

class SequentialThinkingService:
    """Service for AI-powered sequential analysis of financial data"""
    
    def __init__(self, supabase_service):
        self.supabase = supabase_service
        
    async def analyze_variance(self, company_id: str, year: int, month: int, 
                             variance_threshold: float = 0.15) -> Dict[str, Any]:
        """
        Perform sequential thinking analysis for variance investigation
        
        Args:
            company_id: Company ID
            year: Year to analyze  
            month: Month to analyze
            variance_threshold: Minimum variance % to investigate (default 15%)
        """
        
        # Get actual vs projected data
        comparison_data = await self._get_variance_data(company_id, year, month)
        
        if not comparison_data:
            return {"error": "No data available for analysis"}
            
        # Calculate significant variances
        significant_variances = self._identify_significant_variances(
            comparison_data, variance_threshold
        )
        
        if not significant_variances:
            return {
                "analysis_type": "variance_investigation",
                "period": f"{month:02d}-{year}",
                "conclusion": "No significant variances detected",
                "threshold": f"{variance_threshold:.1%}",
                "all_variances_within_acceptable_range": True
            }
        
        # Sequential thinking analysis
        analysis_steps = []
        
        # Step 1: Identify the problem
        analysis_steps.append({
            "step": 1,
            "thought": f"Analyzing {len(significant_variances)} significant variances for {month:02d}/{year}",
            "findings": [f"{var['category']}: {var['variance']:.1%}" for var in significant_variances[:3]]
        })
        
        # Step 2: Prioritize by impact
        sorted_variances = sorted(significant_variances, key=lambda x: abs(x['absolute_variance']), reverse=True)
        analysis_steps.append({
            "step": 2, 
            "thought": "Prioritizing variances by absolute financial impact",
            "top_impact": {
                "category": sorted_variances[0]['category'],
                "impact": f"€{sorted_variances[0]['absolute_variance']:,.0f}",
                "variance_pct": f"{sorted_variances[0]['variance']:.1%}"
            }
        })
        
        # Step 3: Context analysis
        seasonal_context = await self._get_seasonal_context(company_id, month)
        analysis_steps.append({
            "step": 3,
            "thought": "Considering seasonal and business context",
            "context": seasonal_context
        })
        
        # Step 4: Root cause hypothesis
        root_causes = self._generate_root_cause_hypotheses(sorted_variances[0], seasonal_context)
        analysis_steps.append({
            "step": 4,
            "thought": "Generating root cause hypotheses",
            "hypotheses": root_causes
        })
        
        # Step 5: Recommendations
        recommendations = self._generate_recommendations(sorted_variances[0], root_causes)
        analysis_steps.append({
            "step": 5,
            "thought": "Formulating actionable recommendations",
            "recommendations": recommendations
        })
        
        return {
            "analysis_type": "variance_investigation",
            "period": f"{month:02d}-{year}",
            "significant_variances_count": len(significant_variances),
            "analysis_steps": analysis_steps,
            "executive_summary": {
                "primary_concern": sorted_variances[0]['category'],
                "financial_impact": f"€{sorted_variances[0]['absolute_variance']:,.0f}",
                "variance_percentage": f"{sorted_variances[0]['variance']:.1%}",
                "priority": "HIGH" if abs(sorted_variances[0]['variance']) > 0.25 else "MEDIUM",
                "next_actions": recommendations[:2]
            },
            "generated_at": datetime.now().isoformat()
        }
    
    async def analyze_budget_planning(self, company_id: str, target_year: int) -> Dict[str, Any]:
        """Sequential thinking analysis for budget planning"""
        
        # Get historical performance
        historical_data = await self._get_historical_performance(company_id, target_year - 1)
        seasonal_patterns = await self._analyze_seasonal_patterns(company_id)
        
        analysis_steps = []
        
        # Step 1: Historical baseline
        analysis_steps.append({
            "step": 1,
            "thought": f"Establishing baseline from {target_year-1} performance",
            "baseline": {
                "revenue": f"€{historical_data.get('total_revenue', 0):,.0f}",
                "expenses": f"€{historical_data.get('total_expenses', 0):,.0f}",
                "profit": f"€{historical_data.get('net_profit', 0):,.0f}"
            }
        })
        
        # Step 2: Seasonal adjustments
        analysis_steps.append({
            "step": 2,
            "thought": "Applying seasonal pattern adjustments",
            "seasonal_insights": seasonal_patterns
        })
        
        # Step 3: Growth projections
        growth_assumptions = self._calculate_growth_assumptions(historical_data)
        analysis_steps.append({
            "step": 3,
            "thought": "Determining realistic growth assumptions",
            "growth_factors": growth_assumptions
        })
        
        # Step 4: Risk factors
        risk_analysis = self._assess_budget_risks(historical_data, seasonal_patterns)
        analysis_steps.append({
            "step": 4,
            "thought": "Identifying potential risk factors",
            "risks": risk_analysis
        })
        
        # Step 5: Budget recommendations
        budget_recommendations = self._generate_budget_recommendations(
            historical_data, growth_assumptions, risk_analysis
        )
        analysis_steps.append({
            "step": 5,
            "thought": "Finalizing budget recommendations with risk mitigation",
            "recommendations": budget_recommendations
        })
        
        return {
            "analysis_type": "budget_planning",
            "target_year": target_year,
            "analysis_steps": analysis_steps,
            "executive_summary": budget_recommendations,
            "generated_at": datetime.now().isoformat()
        }
    
    async def _get_variance_data(self, company_id: str, year: int, month: int) -> Optional[Dict]:
        """Get variance data for a specific period"""
        try:
            # Get actual data
            actual_result = self.supabase.client.table('entries')\
                .select('*, subcategories!inner(name, categories!inner(name, type_id))')\
                .eq('subcategories.categories.company_id', company_id)\
                .eq('year', year)\
                .eq('month', month)\
                .eq('is_projection', False)\
                .execute()
                
            # Get projection data  
            projection_result = self.supabase.client.table('entries')\
                .select('*, subcategories!inner(name, categories!inner(name, type_id))')\
                .eq('subcategories.categories.company_id', company_id)\
                .eq('year', year)\
                .eq('month', month)\
                .eq('is_projection', True)\
                .execute()
                
            return {
                "actual": actual_result.data,
                "projected": projection_result.data
            }
        except Exception as e:
            print(f"Error getting variance data: {e}")
            return None
    
    def _identify_significant_variances(self, comparison_data: Dict, threshold: float) -> List[Dict]:
        """Identify variances above threshold"""
        significant_variances = []
        
        # Group by category
        actual_by_category = {}
        projected_by_category = {}
        
        for entry in comparison_data["actual"]:
            category = entry['subcategories']['categories']['name']
            actual_by_category[category] = actual_by_category.get(category, 0) + entry['value']
            
        for entry in comparison_data["projected"]:
            category = entry['subcategories']['categories']['name']
            projected_by_category[category] = projected_by_category.get(category, 0) + entry['value']
        
        # Calculate variances
        all_categories = set(actual_by_category.keys()) | set(projected_by_category.keys())
        
        for category in all_categories:
            actual = actual_by_category.get(category, 0)
            projected = projected_by_category.get(category, 0)
            
            if projected != 0:
                variance = (actual - projected) / abs(projected)
                if abs(variance) >= threshold:
                    significant_variances.append({
                        "category": category,
                        "actual": actual,
                        "projected": projected,
                        "absolute_variance": actual - projected,
                        "variance": variance
                    })
        
        return significant_variances
    
    async def _get_seasonal_context(self, company_id: str, month: int) -> Dict[str, Any]:
        """Get seasonal business context"""
        season_info = {
            1: {"season": "Bassa stagione", "activity": "Minima", "focus": "Manutenzione"},
            2: {"season": "Bassa stagione", "activity": "Minima", "focus": "Preparazione"},
            3: {"season": "Pre-stagione", "activity": "Crescente", "focus": "Setup"},
            4: {"season": "Inizio stagione", "activity": "Media", "focus": "Aperture"},
            5: {"season": "Alta stagione", "activity": "Alta", "focus": "Operazioni"},
            6: {"season": "Picco stagione", "activity": "Massima", "focus": "Revenue"},
            7: {"season": "Picco stagione", "activity": "Massima", "focus": "Revenue"},
            8: {"season": "Picco stagione", "activity": "Massima", "focus": "Revenue"},
            9: {"season": "Fine stagione", "activity": "Decrescente", "focus": "Ottimizzazione"},
            10: {"season": "Post-stagione", "activity": "Bassa", "focus": "Chiusure"},
            11: {"season": "Bassa stagione", "activity": "Minima", "focus": "Pianificazione"},
            12: {"season": "Bassa stagione", "activity": "Minima", "focus": "Budget"}
        }
        
        return season_info.get(month, {"season": "Unknown", "activity": "Unknown", "focus": "Unknown"})
    
    def _generate_root_cause_hypotheses(self, variance: Dict, context: Dict) -> List[str]:
        """Generate root cause hypotheses based on variance and context"""
        hypotheses = []
        
        variance_pct = variance['variance']
        category = variance['category']
        season = context.get('season', 'Unknown')
        
        if 'Hotel' in category or 'Residence' in category or 'CVM' in category:
            if variance_pct > 0:  # Revenue higher than expected
                hypotheses.extend([
                    f"Pricing strategy più efficace del previsto per {season}",
                    "Occupancy rate superiore alle previsioni",
                    "Clientela premium o upselling efficace",
                    "Eventi speciali o partnership non previste"
                ])
            else:  # Revenue lower than expected
                hypotheses.extend([
                    f"Competitive pressure durante {season}",
                    "Cancellazioni o no-show superiori al normale",
                    "Pricing troppo alto per il mercato attuale",
                    "Problemi operativi o di servizio"
                ])
        
        elif 'Salari' in category or 'Stipendi' in category:
            if variance_pct > 0:  # Expenses higher than expected
                hypotheses.extend([
                    "Overtime necessario per alta occupancy",
                    "Staff aggiuntivo per eventi speciali",
                    "Aumenti contrattuali non previsti"
                ])
            else:  # Expenses lower than expected
                hypotheses.extend([
                    "Efficienza operativa migliorata",
                    "Stagionalità più bassa del previsto",
                    "Risparmi su staff temporaneo"
                ])
        
        # Add generic hypotheses
        hypotheses.extend([
            "Timing difference - entrate/uscite spostate nel mese",
            "Errori di classificazione contabile",
            "Previsioni iniziali non accurate per questo periodo"
        ])
        
        return hypotheses[:5]  # Return top 5
    
    def _generate_recommendations(self, variance: Dict, hypotheses: List[str]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        category = variance['category']
        variance_pct = variance['variance']
        impact = abs(variance['absolute_variance'])
        
        # High-impact recommendations first
        if impact > 50000:  # €50k+ impact
            recommendations.append(f"PRIORITÀ ALTA: Investigare immediatamente {category} (impatto €{impact:,.0f})")
        
        # Category-specific recommendations
        if 'Hotel' in category or 'Residence' in category:
            if variance_pct > 0:
                recommendations.extend([
                    "Analizzare pricing strategy per replicare il successo",
                    "Documentare best practices per prossime stagioni",
                    "Considerare aumento capacity se sostenibile"
                ])
            else:
                recommendations.extend([
                    "Review competitività pricing vs mercato",
                    "Audit processo prenotazioni e customer service",
                    "Analizzare marketing mix e canali distribuzione"
                ])
        
        # General recommendations
        recommendations.extend([
            "Aggiornare previsioni per i prossimi mesi",
            "Implementare monitoring più frequente per questa categoria",
            "Documentare lessons learned per budget futuro"
        ])
        
        return recommendations[:6]  # Return top 6
    
    async def _get_historical_performance(self, company_id: str, year: int) -> Dict[str, float]:
        """Get historical performance data"""
        try:
            entries_result = self.supabase.client.table('entries')\
                .select('*, subcategories!inner(categories!inner(company_id, type_id))')\
                .eq('subcategories.categories.company_id', company_id)\
                .eq('year', year)\
                .eq('is_projection', False)\
                .execute()
            
            total_revenue = sum(entry['value'] for entry in entries_result.data 
                              if entry['subcategories']['categories']['type_id'] == 'revenue')
            total_expenses = sum(entry['value'] for entry in entries_result.data 
                               if entry['subcategories']['categories']['type_id'] == 'expense')
            
            return {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "net_profit": total_revenue - total_expenses
            }
        except Exception as e:
            print(f"Error getting historical performance: {e}")
            return {"total_revenue": 0, "total_expenses": 0, "net_profit": 0}
    
    async def _analyze_seasonal_patterns(self, company_id: str) -> Dict[str, Any]:
        """Analyze seasonal patterns from historical data"""
        # This would analyze multiple years of data to identify patterns
        # For now, return ORTI's known seasonal pattern
        return {
            "peak_months": [6, 7, 8],
            "low_months": [11, 12, 1, 2],
            "shoulder_months": [3, 4, 5, 9, 10],
            "revenue_distribution": {
                "peak_season": "60%",
                "shoulder_season": "30%", 
                "low_season": "10%"
            }
        }
    
    def _calculate_growth_assumptions(self, historical_data: Dict) -> Dict[str, Any]:
        """Calculate realistic growth assumptions"""
        # Industry benchmarks for tourism
        return {
            "revenue_growth": "5-8% (turismo post-COVID recovery)",
            "cost_inflation": "3-5% (inflazione generale)",
            "occupancy_target": "+2-3% vs previous year",
            "pricing_power": "Moderata (+3-5%)"
        }
    
    def _assess_budget_risks(self, historical_data: Dict, seasonal_patterns: Dict) -> List[str]:
        """Assess budget risks"""
        return [
            "Volatilità economica globale",
            "Competizione crescente nel settore turistico",
            "Inflazione costi energetici e materiali",
            "Cambiamenti meteo e stagionalità",
            "Evoluzione preferenze clientela post-COVID"
        ]
    
    def _generate_budget_recommendations(self, historical_data: Dict, 
                                       growth_assumptions: Dict, 
                                       risks: List[str]) -> Dict[str, Any]:
        """Generate budget recommendations"""
        baseline_revenue = historical_data.get('total_revenue', 0)
        baseline_expenses = historical_data.get('total_expenses', 0)
        
        # Conservative growth projections
        projected_revenue = baseline_revenue * 1.06  # 6% growth
        projected_expenses = baseline_expenses * 1.04  # 4% cost increase
        
        return {
            "recommended_revenue_target": f"€{projected_revenue:,.0f}",
            "recommended_expense_budget": f"€{projected_expenses:,.0f}",
            "projected_profit": f"€{projected_revenue - projected_expenses:,.0f}",
            "confidence_level": "Medium (seasonal business volatility)",
            "key_assumptions": list(growth_assumptions.values()),
            "contingency_plan": "Mantenere 10-15% buffer per costi imprevisti"
        }