from typing import  Optional,  Literal, Any, List
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



class LocationModel(BaseModel):
    type: Literal['manufacturer', 'distributor', 'retailer']
    id: PyObjectId

class ShipmentModel(BaseModel):
    shipmentId:str
    productName: str
    qty: conint(ge=0)
    unitIds: Optional[List[PyObjectId]]  # Which product units are inside
    parentShipmentId: Optional[PyObjectId]  # For sub-crates created by distributors
    inTransit: bool = False
    status: Literal['sealed','opened']
    location: Optional[LocationModel]  # Current holder (manufacturer/distributor/retailer)
    createdAt: Optional[datetime]
    updatedAt: Optional[datetime]


class ProductInDB(ShipmentModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True  