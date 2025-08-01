from fastapi import APIRouter, UploadFile, Form, File
import json
from controllers import certificate_controller

router = APIRouter()


@router.post("/{manufacturer_walletAddress}/upload")
async def upload_certificate(
    manufacturer_walletAddress: str,
    cert_data: str = Form(...),  # cert_data is JSON string
    file: UploadFile = File(...)
):
    cert_data_dict = json.loads(cert_data)
    return await certificate_controller.upload_certificate(
        manufacturer_walletAddress, file, cert_data_dict
    )

@router.get("/{manufacturer_walletAddress}/latest")
async def get_latest_certificate_image(manufacturer_walletAddress: str):
    return await certificate_controller.get_latest_certificate_image(manufacturer_walletAddress)


@router.get("/{manufacturer_walletAddress}/all")
async def list_certificates(manufacturer_walletAddress: str):
    return await certificate_controller.list_certificates(manufacturer_walletAddress)