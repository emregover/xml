import pandas as pd
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import io
import csv
from lxml import etree

class FileParser:
    @staticmethod
    def parse_csv(content: bytes) -> List[Dict[str, Any]]:
        try:
            df = pd.read_csv(io.BytesIO(content))
            return FileParser._dataframe_to_products(df)
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")
    
    @staticmethod
    def parse_excel(content: bytes) -> List[Dict[str, Any]]:
        try:
            df = pd.read_excel(io.BytesIO(content))
            return FileParser._dataframe_to_products(df)
        except Exception as e:
            raise ValueError(f"Failed to parse Excel: {str(e)}")
    
    @staticmethod
    def parse_xml(content: bytes) -> List[Dict[str, Any]]:
        try:
            root = etree.fromstring(content)
            products = []
            
            for element in root.iter():
                if element.tag.lower() in ['product', 'item', 'entry']:
                    product_data = {}
                    
                    for child in element:
                        tag = child.tag.lower()
                        text = child.text.strip() if child.text else ""
                        
                        if tag in ['name', 'title', 'productname']:
                            product_data['name'] = text
                        elif tag in ['description', 'desc', 'details']:
                            product_data['description'] = text
                        elif tag in ['price', 'cost', 'amount']:
                            try:
                                product_data['price'] = float(text.replace('$', '').replace(',', ''))
                            except:
                                product_data['price'] = None
                        elif tag in ['category', 'cat', 'type']:
                            product_data['category'] = text
                        else:
                            product_data[tag] = text
                    
                    if product_data and 'name' in product_data:
                        products.append(product_data)
            
            if not products:
                for child in root:
                    product_data = FileParser._xml_element_to_dict(child)
                    if product_data.get('name'):
                        products.append(product_data)
            
            return products
        except Exception as e:
            raise ValueError(f"Failed to parse XML: {str(e)}")
    
    @staticmethod
    def _xml_element_to_dict(element) -> Dict[str, Any]:
        data = {}
        
        for attr_name, attr_value in element.attrib.items():
            attr_name_lower = attr_name.lower()
            if attr_name_lower in ['name', 'title', 'productname']:
                data['name'] = attr_value
            elif attr_name_lower in ['description', 'desc']:
                data['description'] = attr_value
            elif attr_name_lower in ['price', 'cost']:
                try:
                    data['price'] = float(attr_value.replace('$', '').replace(',', ''))
                except:
                    data['price'] = None
            elif attr_name_lower in ['category', 'cat']:
                data['category'] = attr_value
            else:
                data[attr_name] = attr_value
        
        if element.text and element.text.strip():
            if 'name' not in data:
                data['name'] = element.text.strip()
        
        for child in element:
            tag = child.tag.lower()
            text = child.text.strip() if child.text else ""
            
            if tag in ['name', 'title', 'productname']:
                data['name'] = text
            elif tag in ['description', 'desc', 'details']:
                data['description'] = text
            elif tag in ['price', 'cost', 'amount']:
                try:
                    data['price'] = float(text.replace('$', '').replace(',', ''))
                except:
                    data['price'] = None
            elif tag in ['category', 'cat', 'type']:
                data['category'] = text
            else:
                data[tag] = text
        
        return data
    
    @staticmethod
    def _dataframe_to_products(df: pd.DataFrame) -> List[Dict[str, Any]]:
        products = []
        df.columns = df.columns.str.lower()
        
        name_cols = ['name', 'product_name', 'productname', 'title', 'product']
        desc_cols = ['description', 'desc', 'details', 'product_description']
        price_cols = ['price', 'cost', 'amount', 'unitprice', 'unit_price']
        cat_cols = ['category', 'cat', 'type', 'product_category']
        
        name_col = next((col for col in name_cols if col in df.columns), None)
        desc_col = next((col for col in desc_cols if col in df.columns), None)
        price_col = next((col for col in price_cols if col in df.columns), None)
        cat_col = next((col for col in cat_cols if col in df.columns), None)
        
        for _, row in df.iterrows():
            product_data = {}
            
            if name_col:
                product_data['name'] = str(row[name_col]) if pd.notna(row[name_col]) else ""
            else:
                product_data['name'] = str(row.iloc[0]) if len(row) > 0 and pd.notna(row.iloc[0]) else ""
            
            if desc_col:
                product_data['description'] = str(row[desc_col]) if pd.notna(row[desc_col]) else None
            
            if price_col and pd.notna(row[price_col]):
                try:
                    price_str = str(row[price_col]).replace('$', '').replace(',', '')
                    product_data['price'] = float(price_str)
                except:
                    product_data['price'] = None
            else:
                product_data['price'] = None
            
            if cat_col:
                product_data['category'] = str(row[cat_col]) if pd.notna(row[cat_col]) else None
            
            for col in df.columns:
                if col not in [name_col, desc_col, price_col, cat_col]:
                    product_data[col] = str(row[col]) if pd.notna(row[col]) else None
            
            if product_data['name']:
                products.append(product_data)
        
        return products
