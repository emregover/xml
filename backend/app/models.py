from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Subcategory(BaseModel):
    id: int
    name: str
    parent_id: int
    description: Optional[str] = None

class Category(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    subcategories: List[Subcategory] = []

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class SubcategoryCreate(BaseModel):
    name: str
    parent_id: int
    description: Optional[str] = None

class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Product(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    raw_data: Dict[str, Any] = {}
    mapped_subcategory_id: Optional[int] = None

class ProductMapping(BaseModel):
    subcategory_id: int

class SubcategorySuggestion(BaseModel):
    subcategory_id: int
    subcategory_name: str
    category_name: str
    confidence: float
    reason: str
