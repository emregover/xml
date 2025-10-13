from typing import List, Dict, Optional
from app.models import SubcategorySuggestion, Product
from app.database import InMemoryDatabase

class SuggestionEngine:
    @staticmethod
    def suggest_subcategories(product: Product, db: InMemoryDatabase, top_n: int = 5) -> List[SubcategorySuggestion]:
        suggestions = []
        
        product_text = f"{product.name} {product.description or ''} {product.category or ''}".lower()
        
        for subcategory in db.subcategories.values():
            category = db.get_category(subcategory.parent_id)
            if not category:
                continue
            
            score = 0.0
            reasons = []
            
            subcat_text = f"{subcategory.name} {subcategory.description or ''}".lower()
            cat_text = f"{category.name} {category.description or ''}".lower()
            
            subcat_words = set(subcat_text.split())
            cat_words = set(cat_text.split())
            product_words = set(product_text.split())
            
            subcat_overlap = len(product_words & subcat_words)
            cat_overlap = len(product_words & cat_words)
            
            if subcat_overlap > 0:
                score += subcat_overlap * 10
                reasons.append(f"Matches {subcat_overlap} keyword(s) with subcategory")
            
            if cat_overlap > 0:
                score += cat_overlap * 5
                reasons.append(f"Matches {cat_overlap} keyword(s) with category")
            
            if product.category:
                product_cat_lower = product.category.lower()
                if product_cat_lower in subcat_text:
                    score += 20
                    reasons.append("Product category matches subcategory name")
                elif product_cat_lower in cat_text:
                    score += 15
                    reasons.append("Product category matches category name")
            
            name_similarity = SuggestionEngine._string_similarity(product.name.lower(), subcategory.name.lower())
            if name_similarity > 0.3:
                score += name_similarity * 30
                reasons.append(f"Name similarity: {int(name_similarity * 100)}%")
            
            if product.description:
                desc_similarity = SuggestionEngine._string_similarity(product.description.lower(), subcat_text)
                if desc_similarity > 0.2:
                    score += desc_similarity * 20
                    reasons.append(f"Description similarity: {int(desc_similarity * 100)}%")
            
            if score > 0:
                confidence = min(score / 100, 1.0)
                reason = "; ".join(reasons) if reasons else "General match"
                
                suggestions.append(SubcategorySuggestion(
                    subcategory_id=subcategory.id,
                    subcategory_name=subcategory.name,
                    category_name=category.name,
                    confidence=round(confidence, 2),
                    reason=reason
                ))
        
        suggestions.sort(key=lambda x: x.confidence, reverse=True)
        return suggestions[:top_n]
    
    @staticmethod
    def _string_similarity(s1: str, s2: str) -> float:
        words1 = set(s1.split())
        words2 = set(s2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1 & words2
        union = words1 | words2
        
        return len(intersection) / len(union) if union else 0.0
