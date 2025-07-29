from pickletools import pybool
from typing import List, Optional,  Literal, Any
from pydantic import BaseModel, Field, conint,  GetCoreSchemaHandler
from bson import ObjectId
from datetime import datetime
from pydantic_core import core_schema
from pydantic.json_schema import JsonSchemaValue

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, value: Any) -> ObjectId:
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str):
            if ObjectId.is_valid(value):
                return ObjectId(value)
        raise ValueError(f"Invalid ObjectId: {value}")

    @classmethod
    def __get_pydantic_json_schema__(cls, _core_schema, handler) -> JsonSchemaValue:
        return handler(core_schema.str_schema())


class PathModel(BaseModel):
    fromType:Literal ['manufacturer', 'distributor']
    fromId: PyObjectId
    toType: Literal['distributor', 'retailer']
    toId: PyObjectId
    etaDays: float
    scannedAt: Optional[datetime]

class AllocationsModel(BaseModel):
    qty: conint(ge=0)
    batchId: Optional[PyObjectId]
    productUnitIds: Optional[List[PyObjectId]]
    currentStage: Optional[conint(ge=0)]
    fulfilled: bool = False
    path: PathModel

class LineItemsModel (BaseModel):
    productName: str
    qty: conint(ge = 0)
    allocations: AllocationsModel

class OrderModel(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    orderId: str 
    retailerId: str
    lineItems: LineItemsModel
    status: Literal['created','in-transit','completed','cancelled']
    createdAt: Optional[datetime]
    updatedAt: Optional[datetime]



class ProductInDB(OrderModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True  