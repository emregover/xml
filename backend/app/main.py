from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import httpx

from app.database import db
from app.models import (
    CategoryCreate, CategoryUpdate, SubcategoryCreate, SubcategoryUpdate,
    ProductMapping
)
from app.file_parser import FileParser
from app.suggestion_engine import SuggestionEngine

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/categories")
async def get_categories():
    return db.get_all_categories()

@app.post("/api/categories")
async def create_category(category: CategoryCreate):
    new_category = db.create_category(category.name, category.description)
    return new_category

@app.put("/api/categories/{category_id}")
async def update_category(category_id: int, category: CategoryUpdate):
    updated = db.update_category(category_id, category.name, category.description)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@app.delete("/api/categories/{category_id}")
async def delete_category(category_id: int):
    success = db.delete_category(category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

@app.post("/api/subcategories")
async def create_subcategory(subcategory: SubcategoryCreate):
    new_subcategory = db.create_subcategory(subcategory.name, subcategory.parent_id, subcategory.description)
    if not new_subcategory:
        raise HTTPException(status_code=404, detail="Parent category not found")
    return new_subcategory

@app.put("/api/subcategories/{subcategory_id}")
async def update_subcategory(subcategory_id: int, subcategory: SubcategoryUpdate):
    updated = db.update_subcategory(subcategory_id, subcategory.name, subcategory.description)
    if not updated:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return updated

@app.delete("/api/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: int):
    success = db.delete_subcategory(subcategory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return {"message": "Subcategory deleted successfully"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    db.clear_products()
    
    content = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            products_data = FileParser.parse_csv(content)
        elif filename.endswith(('.xlsx', '.xls')):
            products_data = FileParser.parse_excel(content)
        elif filename.endswith('.xml'):
            products_data = FileParser.parse_xml(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, Excel, or XML file.")
        
        products = []
        for product_data in products_data:
            product = db.create_product(
                name=product_data.get('name', ''),
                description=product_data.get('description'),
                price=product_data.get('price'),
                category=product_data.get('category'),
                raw_data=product_data
            )
            products.append(product)
        
        return {"message": f"Successfully parsed {len(products)} products", "count": len(products)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/parse-url")
async def parse_url(url: str = Form(...)):
    db.clear_products()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            content = response.content
        
        content_type = response.headers.get('content-type', '').lower()
        url_lower = url.lower()
        
        if 'text/csv' in content_type or url_lower.endswith('.csv'):
            products_data = FileParser.parse_csv(content)
        elif 'application/vnd' in content_type or url_lower.endswith(('.xlsx', '.xls')):
            products_data = FileParser.parse_excel(content)
        elif 'xml' in content_type or url_lower.endswith('.xml'):
            products_data = FileParser.parse_xml(content)
        else:
            try:
                products_data = FileParser.parse_xml(content)
            except:
                try:
                    products_data = FileParser.parse_csv(content)
                except:
                    raise HTTPException(status_code=400, detail="Could not determine file format or unsupported format")
        
        products = []
        for product_data in products_data:
            product = db.create_product(
                name=product_data.get('name', ''),
                description=product_data.get('description'),
                price=product_data.get('price'),
                category=product_data.get('category'),
                raw_data=product_data
            )
            products.append(product)
        
        return {"message": f"Successfully parsed {len(products)} products from URL", "count": len(products)}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")

@app.get("/api/products")
async def get_products():
    return db.get_all_products()

@app.post("/api/products/{product_id}/map")
async def map_product(product_id: int, mapping: ProductMapping):
    product = db.map_product_to_subcategory(product_id, mapping.subcategory_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product or subcategory not found")
    return product

@app.get("/api/products/{product_id}/suggest")
async def suggest_subcategories(product_id: int):
    product = db.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    suggestions = SuggestionEngine.suggest_subcategories(product, db)
    return suggestions
