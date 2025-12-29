# Quick Start Guide - Category Hierarchy

## 🚀 What Changed?

Your category system is now **three levels deep**:
```
Category → Type → SubCategory
```

**Key Feature:** Admins only need to select **SubCategory** when creating products - the system automatically fills in Category and Type!

---

## 📋 Step-by-Step Setup

### 1. Apply Database Migration

```bash
cd backend
npx prisma migrate dev --name add_type_subcategory_hierarchy
```

### 2. Seed Your Hierarchy

Create your category structure in this order:

#### a) Create Categories
```bash
POST /api/categories
{
  "name": "Skincare",
  "slug": "skincare"
}
```

#### b) Create Types (within Categories)
```bash
POST /api/types
{
  "name": "Face Care",
  "slug": "face-care",
  "categorySlug": "skincare"  # Links to category
}
```

#### c) Create SubCategories (within Types)
```bash
POST /api/subcategories
{
  "name": "Moisturizers",
  "slug": "moisturizers",
  "typeSlug": "face-care"  # Links to type
}
```

---

## 🎯 Creating Products (The Easy Way)

### Admin Only Needs SubCategory!

```bash
POST /api/admin/products
{
  "name": "Hydrating Night Cream",
  "slug": "hydrating-night-cream",
  "price": 45.99,
  "stock": 100,
  "subCategorySlug": "moisturizers",  # ← Only this for hierarchy!
  "brandName": "CeraVe"  # optional
}
```

**What happens automatically:**
1. System finds SubCategory "moisturizers"
2. Gets Type "face-care" from SubCategory
3. Gets Category "skincare" from Type
4. Product is created with all three IDs!

---

## 📊 Example Hierarchy

```
Skincare (Category)
├── Face Care (Type)
│   ├── Cleansers (SubCategory)
│   ├── Moisturizers (SubCategory)
│   ├── Serums (SubCategory)
│   └── Toners (SubCategory)
│
├── Body Care (Type)
│   ├── Body Lotions (SubCategory)
│   ├── Body Wash (SubCategory)
│   └── Body Scrubs (SubCategory)
│
└── Sun Care (Type)
    ├── Sunscreen (SubCategory)
    └── After Sun (SubCategory)

Makeup (Category)
├── Face Makeup (Type)
│   ├── Foundation (SubCategory)
│   ├── Concealer (SubCategory)
│   └── Powder (SubCategory)
│
└── Eye Makeup (Type)
    ├── Eyeshadow (SubCategory)
    ├── Mascara (SubCategory)
    └── Eyeliner (SubCategory)
```

---

## 🔍 Filtering Products

### By Category
```bash
GET /api/products?categoryId=<category-id>
```

### By Type
```bash
GET /api/products?typeId=<type-id>
```

### By SubCategory
```bash
GET /api/products?subCategoryId=<subcategory-id>
```

### Admin Filtering (supports name/slug/ID)
```bash
GET /api/admin/products?category=skincare&type=face-care&subCategory=moisturizers
```

---

## 🛠️ Common Tasks

### View Full Category Hierarchy
```bash
GET /api/categories
```
Returns all categories with nested Types and SubCategories.

### Get Products in a SubCategory
```bash
GET /api/admin/products/subcategory/moisturizers
```
Accepts SubCategory ID, name, or slug.

### Get Products in a Type
```bash
GET /api/admin/products/type/face-care
```
Accepts Type ID, name, or slug.

### Update Product's SubCategory
```bash
PUT /api/admin/products/:id
{
  "subCategorySlug": "serums"  # Changes entire hierarchy automatically
}
```

---

## ⚡ Quick Tips

1. **Always use `/api/admin/products`** for product creation - it's easier!
2. **SubCategory auto-populates** Category and Type - no manual work
3. **Use slugs** instead of IDs for better readability
4. **Delete protection**: Can't delete Category/Type/SubCategory if products exist
5. **Hierarchy validation**: SubCategory must belong to correct Type → Category chain

---

## 🐛 Troubleshooting

### Error: "SubCategory not found"
- Check that the SubCategory exists
- Verify the slug/name/ID is correct
- Use `GET /api/subcategories` to see all available

### Error: "Cannot delete category with existing products"
- Delete or reassign all products first
- Check with `GET /api/admin/products/category/:categoryId`

### Products missing Category/Type after migration
- Run this for each product:
```bash
PUT /api/admin/products/:id
{
  "subCategoryId": "<appropriate-subcategory-id>"
}
```

---

## 📚 Full Documentation

See [CATEGORY_HIERARCHY_CHANGES.md](./CATEGORY_HIERARCHY_CHANGES.md) for complete API reference and technical details.
