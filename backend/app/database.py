from typing import Dict, List, Optional
from app.models import Category, Subcategory, Product

class InMemoryDatabase:
    def __init__(self):
        self.categories: Dict[int, Category] = {}
        self.subcategories: Dict[int, Subcategory] = {}
        self.products: Dict[int, Product] = {}
        self.next_category_id = 1
        self.next_subcategory_id = 1
        self.next_product_id = 1
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        categories_data = [
            {"name": "Electronics", "description": "Electronic devices and accessories"},
            {"name": "Clothing", "description": "Apparel and fashion items"},
            {"name": "Home & Garden", "description": "Home improvement and garden supplies"},
            {"name": "Sports & Outdoors", "description": "Sports equipment and outdoor gear"},
            {"name": "Books & Media", "description": "Books, movies, and music"}
        ]
        
        for cat_data in categories_data:
            self.create_category(cat_data["name"], cat_data.get("description"))
        
        subcategories_data = [
            {"name": "Smartphones", "parent_id": 1, "description": "Mobile phones and accessories"},
            {"name": "Laptops", "parent_id": 1, "description": "Portable computers"},
            {"name": "Televisions", "parent_id": 1, "description": "TVs and displays"},
            {"name": "Men's Clothing", "parent_id": 2, "description": "Clothing for men"},
            {"name": "Women's Clothing", "parent_id": 2, "description": "Clothing for women"},
            {"name": "Shoes", "parent_id": 2, "description": "Footwear"},
            {"name": "Furniture", "parent_id": 3, "description": "Home furniture"},
            {"name": "Garden Tools", "parent_id": 3, "description": "Tools for gardening"},
            {"name": "Fitness Equipment", "parent_id": 4, "description": "Exercise equipment"},
            {"name": "Camping Gear", "parent_id": 4, "description": "Outdoor camping equipment"},
            {"name": "Fiction Books", "parent_id": 5, "description": "Fiction literature"},
            {"name": "Non-Fiction Books", "parent_id": 5, "description": "Non-fiction literature"}
        ]
        
        for subcat_data in subcategories_data:
            self.create_subcategory(subcat_data["name"], subcat_data["parent_id"], subcat_data.get("description"))
    
    def create_category(self, name: str, description: Optional[str] = None) -> Category:
        category_id = self.next_category_id
        self.next_category_id += 1
        category = Category(id=category_id, name=name, description=description, subcategories=[])
        self.categories[category_id] = category
        return category
    
    def get_category(self, category_id: int) -> Optional[Category]:
        return self.categories.get(category_id)
    
    def get_all_categories(self) -> List[Category]:
        categories = []
        for category in self.categories.values():
            subcats = [s for s in self.subcategories.values() if s.parent_id == category.id]
            cat_with_subcats = Category(
                id=category.id,
                name=category.name,
                description=category.description,
                subcategories=subcats
            )
            categories.append(cat_with_subcats)
        return categories
    
    def update_category(self, category_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Category]:
        category = self.categories.get(category_id)
        if category:
            if name is not None:
                category.name = name
            if description is not None:
                category.description = description
            self.categories[category_id] = category
        return category
    
    def delete_category(self, category_id: int) -> bool:
        if category_id in self.categories:
            subcats_to_delete = [s_id for s_id, s in self.subcategories.items() if s.parent_id == category_id]
            for s_id in subcats_to_delete:
                del self.subcategories[s_id]
            del self.categories[category_id]
            return True
        return False
    
    def create_subcategory(self, name: str, parent_id: int, description: Optional[str] = None) -> Optional[Subcategory]:
        if parent_id not in self.categories:
            return None
        subcategory_id = self.next_subcategory_id
        self.next_subcategory_id += 1
        subcategory = Subcategory(id=subcategory_id, name=name, parent_id=parent_id, description=description)
        self.subcategories[subcategory_id] = subcategory
        return subcategory
    
    def get_subcategory(self, subcategory_id: int) -> Optional[Subcategory]:
        return self.subcategories.get(subcategory_id)
    
    def update_subcategory(self, subcategory_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[Subcategory]:
        subcategory = self.subcategories.get(subcategory_id)
        if subcategory:
            if name is not None:
                subcategory.name = name
            if description is not None:
                subcategory.description = description
            self.subcategories[subcategory_id] = subcategory
        return subcategory
    
    def delete_subcategory(self, subcategory_id: int) -> bool:
        if subcategory_id in self.subcategories:
            del self.subcategories[subcategory_id]
            return True
        return False
    
    def create_product(self, name: str, description: Optional[str] = None, price: Optional[float] = None, 
                      category: Optional[str] = None, raw_data: Dict = None) -> Product:
        product_id = self.next_product_id
        self.next_product_id += 1
        product = Product(
            id=product_id,
            name=name,
            description=description,
            price=price,
            category=category,
            raw_data=raw_data or {},
            mapped_subcategory_id=None
        )
        self.products[product_id] = product
        return product
    
    def get_product(self, product_id: int) -> Optional[Product]:
        return self.products.get(product_id)
    
    def get_all_products(self) -> List[Product]:
        return list(self.products.values())
    
    def map_product_to_subcategory(self, product_id: int, subcategory_id: int) -> Optional[Product]:
        product = self.products.get(product_id)
        if product and subcategory_id in self.subcategories:
            product.mapped_subcategory_id = subcategory_id
            self.products[product_id] = product
            return product
        return None
    
    def clear_products(self):
        self.products = {}
        self.next_product_id = 1

db = InMemoryDatabase()
