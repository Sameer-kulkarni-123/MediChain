# filepath: main.py

from fastapi import FastAPI
from routes.connection_route import router as connection_router
from routes.distributor_route import router as distributor_router
from routes.manufacturer_route import router as manufacturer_router
from routes.order_route import router as order_router
from routes.product_route import router as product_router
from routes.retailer_route import router as retailer_router
from routes.shipment_route import router as shipment_router
from routes.optimizer_route import router as optimizer_router

import uvicorn

app = FastAPI()

# Include all routers
app.include_router(connection_router, prefix="/connections")
app.include_router(distributor_router, prefix="/distributors")
app.include_router(manufacturer_router, prefix="/manufacturers")
app.include_router(order_router, prefix="/orders")
app.include_router(product_router, prefix="/products")
app.include_router(retailer_router, prefix="/retailers")
app.include_router(shipment_router, prefix="/shipments")
app.include_router(optimizer_router)  # /test-optimize lives here

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
