# Category Hierarchy Restructuring - Implementation Summary

## Overview
The category system has been restructured from a single-level (Category) to a three-level hierarchy:
**Category → Type → SubCategory**

Products now belong to all three levels, but admins only need to specify the SubCategory during product creation - the Category and Type are automatically populated.

---

## Database Schema Changes

### New Models

#### 1. **Type Model**
- Belongs to a Category
- Contains multiple SubCategories
- Fields: `id`, `name`, `slug`, `description`, `image`, `categoryId`, `createdAt`, `updatedAt`
- Unique constraint: `[categoryId, slug]` (slug must be unique within a category)

#### 2. **SubCategory Model**
- Belongs to a Type
- Fields: `id`, `name`, `slug`, `description`, `image`, `typeId`, `createdAt`, `updatedAt`
- Unique constraint: `[typeId, slug]` (slug must be unique within a type)

#### 3. **Updated Product Model**
Now includes:
- `categoryId` (required)
- `typeId` (required)
- `subCategoryId` (required)

All three are automatically populated when admin provides only the `subCategoryId`.

---

## Complete API Endpoints Reference

### Category Management (Updated)

**Public Routes:**
- `GET /api/categories` - Get all categories with full Type → SubCategory hierarchy
- `GET /api/categories/:id` - Get single category with full hierarchy

**Admin Routes:**
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Type Management

**Public Routes:**
- `GET /api/types` - Get all types (with optional `?categoryId` filter)
- `GET /api/types/:id` - Get single type with subcategories
- `GET /api/types/category/:categoryId` - Get types by category

**Admin Routes:**
- `POST /api/types` - Create type (accepts `categoryId`, `categorySlug`, or `categoryName`)
- `PUT /api/types/:id` - Update type
- `DELETE /api/types/:id` - Delete type (only if no products/subcategories exist)

### SubCategory Management

**Public Routes:**
- `GET /api/subcategories` - Get all subcategories (with optional `?typeId` filter)
- `GET /api/subcategories/:id` - Get single subcategory
- `GET /api/subcategories/type/:typeId` - Get subcategories by type

**Admin Routes:**
- `POST /api/subcategories` - Create subcategory (accepts `typeId`, `typeSlug`, or `typeName`)
- `PUT /api/subcategories/:id` - Update subcategory
- `DELETE /api/subcategories/:id` - Delete subcategory (only if no products exist)

### Product Endpoints (Updated)

**Public Product Routes:**
- `GET /api/products` - Get all products with filtering
  - Query params: `categoryId`, `typeId`, `subCategoryId`, `brandId`, `minPrice`, `maxPrice`, `featured`, `search`, `page`, `limit`
  - Returns products with full Category, Type, SubCategory hierarchy
- `GET /api/products/featured` - Get featured products
- `GET /api/products/top-selling` - Get top selling products
- `GET /api/products/:id` - Get single product by ID or slug (includes hierarchy)

**Admin Product Routes:**
- `GET /api/admin/products` - Get all products with admin filtering
  - Query params: `category`, `type`, `subCategory`, `brand`, `featured`, `inStock`, `search`, `page`, `limit`
  - Accepts name, slug, or ID for category/type/subcategory/brand filters
- `GET /api/admin/products/stats` - Get inventory statistics
- `GET /api/admin/products/category/:categoryId` - Get products by category
- `GET /api/admin/products/type/:typeId` - **NEW** - Get products by type
- `GET /api/admin/products/subcategory/:subCategoryId` - **NEW** - Get products by subcategory
- `GET /api/admin/products/brand/:brandId` - Get products by brand
- `GET /api/admin/products/:id` - Get single product with detailed stats
- `POST /api/admin/products/upload-images` - Upload product images
- `POST /api/admin/products` - Create product (see below)
- `PUT /api/admin/products/:id` - Update product (see below)
- `PATCH /api/admin/products/bulk` - Bulk update products
- `DELETE /api/admin/products/:id` - Delete product

**Admin Product Creation (RECOMMENDED):**
```
POST /api/admin/products
```

**Request Body (Simplified):**
```json
{
  "name": "Product Name",
  "slug": "product-slug",
  "price": 100,
  "subCategoryId": "uuid-here",  // Only this is needed for hierarchy!
  "brandId": "uuid-here" // optional
}
```

Or use name/slug:
```json
{
  "name": "Product Name",
  "slug": "product-slug",
  "price": 100,
  "subCategoryName": "Face Serum",  // Auto-populates category and type!
  "brandName": "The Ordinary" // optional
}
```

**What happens automatically:**
- Admin provides only `subCategoryId` (or `subCategoryName`/`subCategorySlug`)
- Backend automatically resolves and populates:
  - `categoryId` from SubCategory → Type → Category
  - `typeId` from SubCategory → Type
  - `subCategoryId` (the one provided)

**Admin Product Update:**
```
PUT /api/admin/products/:id
```

Same behavior - provide only `subCategoryId` to update the entire hierarchy.

---

## Updated Category Endpoints

**GET /api/categories**
Now returns categories with full hierarchy:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Skincare",
      "slug": "skincare",
      "Type": [
        {
          "id": "uuid",
          "name": "Face Care",
          "slug": "face-care",
          "SubCategory": [
            {
              "id": "uuid",
              "name": "Moisturizers",
              "slug": "moisturizers"
            }
          ],
          "_count": {
            "Product": 15
          }
        }
      ],
      "_count": {
        "Product": 50,
        "Type": 3
      }
    }
  ]
}
```

**GET /api/categories/:id**
Returns single category with full Type → SubCategory hierarchy.

---

## Controller Changes

### New Controllers

**File:** `src/controllers/type.subcategory.controller.ts`

Contains all CRUD operations for Type and SubCategory:
- `getAllTypes`, `getTypeById`, `getTypesByCategoryId`
- `createType`, `updateType`, `deleteType`
- `getAllSubCategories`, `getSubCategoryById`, `getSubCategoriesByTypeId`
- `createSubCategory`, `updateSubCategory`, `deleteSubCategory`

### Updated Controllers

**File:** `src/controllers/admin.product.controller.ts`

Added helper functions:
- `resolveTypeId()` - Resolve type by ID, name, or slug
- `resolveSubCategoryId()` - Resolve subcategory by ID, name, or slug
- `getHierarchyFromSubCategory()` - Auto-populate full hierarchy from subCategory

Updated functions:
- `createProduct()` - Now accepts `subCategoryId`/`subCategoryName`/`subCategorySlug` and auto-populates hierarchy
- `updateProduct()` - Same behavior for updates

**File:** `src/controllers/category.brand.controller.ts`

Updated to include Type and SubCategory in responses:
- `getAllCategories()` - Returns full hierarchy
- `getCategoryById()` - Returns full hierarchy

**File:** `src/controllers/product.controller.ts`

Updated for backward compatibility:
- `createProduct()` - Now requires explicit `categoryId`, `typeId`, `subCategoryId`
- Recommends using `/api/admin/products` for easier creation

---

## Routes

**New Route File:** `src/routes/type.subcategory.routes.ts`
- Registered in `src/server.ts` as `app.use('/api', typeSubCategoryRoutes)`

---

## Migration

**Prisma Schema:** `prisma/schema.prisma`
- Added Type model
- Added SubCategory model
- Updated Product model with `typeId` and `subCategoryId`

**To apply the migration to database:**
```bash
npx prisma migrate dev --name add_type_subcategory_hierarchy
```

**IMPORTANT:** Existing products in the database will need migration:
1. Create Categories, Types, and SubCategories
2. Update existing products to include `typeId` and `subCategoryId`

---

## Example Hierarchy

```
Category: Skincare
└── Type: Face Care
    ├── SubCategory: Cleansers
    ├── SubCategory: Moisturizers
    └── SubCategory: Serums
└── Type: Body Care
    ├── SubCategory: Body Lotions
    └── SubCategory: Body Wash
└── Type: Sun Care
    ├── SubCategory: Sunscreen
    └── SubCategory: After Sun

Category: Makeup
└── Type: Face Makeup
    ├── SubCategory: Foundation
    ├── SubCategory: Concealer
    └── SubCategory: Powder
└── Type: Eye Makeup
    ├── SubCategory: Eyeshadow
    ├── SubCategory: Mascara
    └── SubCategory: Eyeliner
```

---

## Benefits

1. **Simplified Admin Experience**: Admins only need to select SubCategory - the rest is automatic
2. **Better Organization**: Three-level hierarchy allows for more precise product categorization
3. **Flexible Querying**: Can filter products by Category, Type, or SubCategory
4. **Backward Compatible**: Old endpoints still work (with updated requirements)
5. **Multiple Input Formats**: Accept ID, name, or slug for all hierarchy levels

---

## Breaking Changes

⚠️ **IMPORTANT:** Existing product creation code must be updated to include:
- Either `subCategoryId`/`subCategoryName`/`subCategorySlug` (recommended)
- OR all three: `categoryId`, `typeId`, `subCategoryId` (manual)

Products created without these fields will fail validation.

---

## Testing the Changes

1. **Create a Category:**
```bash
POST /api/categories
{
  "name": "Skincare",
  "slug": "skincare"
}
```

2. **Create a Type:**
```bash
POST /api/types
{
  "name": "Face Care",
  "slug": "face-care",
  "categorySlug": "skincare"
}
```

3. **Create a SubCategory:**
```bash
POST /api/subcategories
{
  "name": "Moisturizers",
  "slug": "moisturizers",
  "typeSlug": "face-care"
}
```

4. **Create a Product (Easy Way):**
```bash
POST /api/admin/products
{
  "name": "Hydrating Cream",
  "slug": "hydrating-cream",
  "price": 29.99,
  "subCategorySlug": "moisturizers"  // That's it! Category and Type auto-populate
}
```

---

## Files Modified

1. `prisma/schema.prisma` - Added Type, SubCategory models; updated Product
2. `src/controllers/type.subcategory.controller.ts` - NEW
3. `src/controllers/admin.product.controller.ts` - Updated with hierarchy resolution
4. `src/controllers/category.brand.controller.ts` - Updated to include hierarchy
5. `src/controllers/product.controller.ts` - Updated for new schema
6. `src/routes/type.subcategory.routes.ts` - NEW
7. `src/server.ts` - Registered new routes

---

## Next Steps

1. Run `npx prisma migrate dev` to apply database changes
2. Seed database with Categories, Types, and SubCategories
3. Update frontend to use new hierarchy structure
4. Migrate existing products to new structure (if any exist)
