from pydantic import BaseModel, Field, GetCoreSchemaHandler, EmailStr, conint
from typing import Optional, Literal, Any, List, Dict
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

class GeoModel(BaseModel):
    type: Literal['Point']
    coordinates: List[float] = Field(..., min_items=2, max_items=2)

class ContactsModel(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class ProductionTimesModel(BaseModel):
    productName: str
    days: conint(ge=0)

    
class CertificateModel(BaseModel):
    certId: str
    type: str
    issuedBy: str
    validFrom: datetime
    validTo: datetime
    fileUrl: Optional[str] = None
    imageFileId: PyObjectId


class ManufacturerModel(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    manufacturerId: Optional[str] =  Field(default=None)
    name: str
    address: Optional[str]
    walletAddress: str
    geo: GeoModel
    contacts: ContactsModel
    productsProduced: Optional[List[str]]
    productionTimes: List[ProductionTimesModel]
    certificates: List[CertificateModel]

class ManufacturerUpdateModel(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    walletAddress: Optional[str] = None
    geo: Optional[dict]= None
    contacts: Optional[dict] = None
    productsProduced: Optional[List[str]] = None
    productionTimes: Optional[dict] = None
    certificates: Optional[List[str]] = None

class ProductInDB(ManufacturerModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias='_id')

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True