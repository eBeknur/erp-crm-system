from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import Product, StockMovement, User
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductOut, StockMovementOut
from app.services.ledger import FifoEngine, AuditService

router = APIRouter(prefix="/products", tags=["Products & Warehouse"])

@router.get("", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        pattern = f"%{search}%"
        query = query.filter((Product.name.like(pattern)) | (Product.sku.like(pattern)) | (Product.barcode.like(pattern)))
    if category:
        query = query.filter(Product.category_name == category)
    return query.order_by(Product.id.desc()).all()

@router.post("", response_model=ProductOut)
def create_product(
    req: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Product).filter(Product.sku == req.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"SKU [{req.sku}] allaqachon mavjud!")

    product = Product(
        name=req.name,
        sku=req.sku,
        barcode=req.barcode,
        category_name=req.category_name,
        unit=req.unit,
        cost_price=req.cost_price,
        selling_price=req.selling_price,
        min_stock=req.min_stock,
        current_stock=0.0
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initial stock if provided
    if req.initial_stock > 0:
        FifoEngine.add_stock(
            db=db,
            product_id=product.id,
            quantity=req.initial_stock,
            cost_price=req.cost_price,
            selling_price=req.selling_price,
            user_id=current_user.id
        )
        db.commit()
        db.refresh(product)

    AuditService.log(
        db=db,
        user_name=current_user.full_name,
        action="PRODUCT_CREATED",
        entity="Product",
        entity_id=product.id,
        details=f"Yangi mahsulot yaratildi: {product.name} ({product.sku})",
        user_id=current_user.id
    )
    db.commit()
    return product

@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    req: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Tovarni tahrirlash faqat Administrator uchun mo'ljallangan!")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    old_price = product.selling_price
    old_stock = product.current_stock

    if req.name is not None: product.name = req.name
    if req.sku is not None: product.sku = req.sku
    if req.barcode is not None: product.barcode = req.barcode
    if req.category_name is not None: product.category_name = req.category_name
    if req.unit is not None: product.unit = req.unit
    if req.cost_price is not None: product.cost_price = req.cost_price
    if req.selling_price is not None: product.selling_price = req.selling_price
    if req.min_stock is not None: product.min_stock = req.min_stock

    # Direct Stock Adjustment by Admin
    if req.current_stock is not None and req.current_stock != old_stock:
        product.current_stock = req.current_stock
        AuditService.log(
            db=db,
            user_name=current_user.full_name,
            action="PRODUCT_STOCK_ADJUSTED",
            entity="Product",
            entity_id=product.id,
            details=f"Ombor qoldig'i o'zgartirildi: '{product.name}' ({old_stock} -> {req.current_stock} dona)",
            user_id=current_user.id
        )

    if req.selling_price is not None and req.selling_price != old_price:
        AuditService.log(
            db=db,
            user_name=current_user.full_name,
            action="PRODUCT_PRICE_CHANGED",
            entity="Product",
            entity_id=product.id,
            details=f"Narx o'zgardi: {product.name} ({old_price:,.0f} -> {req.selling_price:,.0f} so'm)",
            user_id=current_user.id
        )

    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["SUPER_ADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Mahsulotni o'chirish faqat Administrator uchun mo'ljallangan!")

    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

    prod_name = prod.name
    db.delete(prod)
    db.commit()

    AuditService.log(
        db=db,
        user_name=current_user.full_name,
        action="PRODUCT_DELETED",
        entity="Product",
        entity_id=product_id,
        details=f"Mahsulot ombordan o'chirildi: '{prod_name}'",
        user_id=current_user.id
    )
    db.commit()
    return {"message": "Mahsulot ombordan muvaffaqiyatli o'chirildi"}

@router.get("/movements", response_model=List[StockMovementOut])
def get_stock_movements(
    product_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(StockMovement)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    return query.order_by(StockMovement.id.desc()).limit(limit).all()
