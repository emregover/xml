# Product Category Mapper

A single-page, responsive web application that allows users to upload or link product data files (XML, Excel, CSV) and interactively map raw products to a predefined, hierarchical set of database categories and subcategories.

## Features

- **Category Management**: Add, edit, and delete predefined categories and subcategories
- **File Upload Support**: Upload XML, Excel (xlsx/xls), or CSV files containing product data
- **URL Parsing**: Parse product data directly from a URL
- **Intelligent Suggestions**: AI-powered suggestion engine recommends the most relevant subcategories based on product data
- **Interactive Mapping**: Easily map products to subcategories with an intuitive drag-and-drop-style interface
- **Real-time Updates**: See mapped vs unmapped products in real-time
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **Python 3.12**: Latest Python version
- **Pandas**: Data parsing and manipulation
- **OpenPyXL**: Excel file support
- **LXML**: XML parsing
- **In-Memory Database**: Fast, proof-of-concept storage (data resets on restart)

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Beautiful, accessible component library
- **Lucide Icons**: Clean, modern icons

## Project Structure

```
xml/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # API endpoints and CORS configuration
│   │   ├── models.py    # Pydantic data models
│   │   ├── database.py  # In-memory database with sample data
│   │   ├── file_parser.py       # File parsing logic (XML, CSV, Excel)
│   │   └── suggestion_engine.py # Intelligent subcategory suggestion algorithm
│   ├── pyproject.toml   # Python dependencies
│   └── poetry.lock      # Locked dependencies
│
├── frontend/            # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategoryManager.tsx  # Category/subcategory CRUD UI
│   │   │   ├── FileUpload.tsx       # File upload and URL parsing UI
│   │   │   └── ProductMapper.tsx    # Product mapping interface
│   │   ├── api.ts       # API client functions
│   │   ├── types.ts     # TypeScript type definitions
│   │   └── App.tsx      # Main application component
│   ├── package.json     # Node.js dependencies
│   └── .env             # Environment variables
│
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Python 3.12+
- Poetry (Python package manager)
- Node.js 18+ and npm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

The backend API will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

## Usage

1. **Manage Categories**: Start by navigating to the "Categories" tab to view, add, edit, or delete categories and subcategories.

2. **Upload Products**: Go to the "Upload" tab and either:
   - Upload a local file (XML, Excel, or CSV)
   - Provide a URL to a product data file

3. **Map Products**: Navigate to the "Mapping" tab to:
   - View all uploaded products
   - Click "Get Suggestions" to see AI-powered subcategory recommendations
   - Select from suggestions or manually choose a subcategory
   - Track your progress with the mapped/unmapped counter

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories with subcategories
- `POST /api/categories` - Create a new category
- `PUT /api/categories/{id}` - Update a category
- `DELETE /api/categories/{id}` - Delete a category

### Subcategories
- `POST /api/subcategories` - Create a new subcategory
- `PUT /api/subcategories/{id}` - Update a subcategory
- `DELETE /api/subcategories/{id}` - Delete a subcategory

### Products
- `POST /api/upload` - Upload a product data file
- `POST /api/parse-url` - Parse products from a URL
- `GET /api/products` - Get all products
- `POST /api/products/{id}/map` - Map a product to a subcategory
- `GET /api/products/{id}/suggest` - Get AI-powered subcategory suggestions

## Suggestion Algorithm

The intelligent suggestion engine analyzes multiple factors:
- **Keyword Matching**: Matches product name/description with subcategory names
- **Category Overlap**: Identifies relevant parent categories
- **Product Category**: Uses existing product category field when available
- **Name Similarity**: Calculates similarity between product and subcategory names
- **Description Analysis**: Analyzes product descriptions for context

Each suggestion includes:
- Confidence score (0-100%)
- Reason for the suggestion
- Category hierarchy path

## Notes

- The backend uses an in-memory database, so all data will be lost when the server restarts
- Sample categories are pre-loaded on startup for testing
- CORS is enabled for development (configured for all origins)

## Future Enhancements

- Persistent database (PostgreSQL/MySQL)
- Bulk product mapping
- Export mapped products
- User authentication
- Machine learning-based suggestions
- Product image support
- Advanced filtering and search

## License

This project is built for demonstration purposes.
