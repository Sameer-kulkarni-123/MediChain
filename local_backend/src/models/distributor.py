from typing import List, Optional, Literal, Any
from pydantic import BaseModel, Field, conint, conlist, constr, GetCoreSchemaHandler, EmailStr
from bson import ObjectId
from pydantic import BaseModel
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


class GeoModel(BaseModel):
    type: Literal['Point']
    coordinates: List[float] = Field(..., min_items=2, max_items=2)

class ContactsModel(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class PriceListModel(BaseModel):
    productName: str
    unitPrice: float


class LeadTimesModel(BaseModel):
    productName: str
    days: conint(ge=0)


class InventoryModel(BaseModel):
    productName: str
    productIds: List[str]
    qty: conint(ge=0)
    reorderLevel: Optional[conint(ge=0)] = None


class DistributorModel(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    distributorId: Optional[str] = None
    name: str
    address: Optional[str] = None
    walletAddress: str
    geo: GeoModel
    contacts: Optional[ContactsModel]
    priceList: Optional[List[PriceListModel]] = []
    leadTimes: Optional[List[LeadTimesModel]] = []
    inventory: Optional[List[InventoryModel]] = []
    active: Optional[bool] = True

class DistributorUpdateModel(BaseModel):
    name: Optional[str]
    address: Optional[str] = None
    walletAddress: Optional[str]
    geo: Optional[GeoModel]
    contacts: Optional[ContactsModel]
    priceList: Optional[List[PriceListModel]] = []
    leadTimes: Optional[List[LeadTimesModel]] = []
    inventory: Optional[List[InventoryModel]] = []
    active: Optional[bool] = True




class ProductInDB(DistributorModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True  