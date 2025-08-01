from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from bson import ObjectId
from config.db import db
import io
import json
import uuid
from fastapi.encoders import jsonable_encoder
from datetime import datetime



# GridFS Bucket
fs = AsyncIOMotorGridFSBucket(db, bucket_name="certimages")


async def upload_certificate(manufacturer_walletAddress: str, file, cert_data: dict):
    try:
        # GridFS bucket
        fs = AsyncIOMotorGridFSBucket(db, bucket_name="certimages")

        # Upload the file to GridFS
        file_id = await fs.upload_from_stream(file.filename, file.file, metadata={"contentType": file.content_type})
        file_url = f"/certificates/{file_id}"

        # Build certificate document matching the JSON schema
        cert_document = {
            "certId": str(uuid.uuid4()),
            "type": cert_data["type"],
            "issuedBy": cert_data["issuedBy"],
            "validFrom": datetime.fromisoformat(cert_data["validFrom"]),  # convert string -> datetime
            "validTo": datetime.fromisoformat(cert_data["validTo"]),      # convert string -> datetime
            "fileUrl": file_url,
            "imageFileId": file_id
        }

        # Push into the manufacturer's certificates array
        result = await db.manufacturers.update_one(
            {"walletAddress": manufacturer_walletAddress},
            {"$push": {"certificates": cert_document}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Manufacturer not found")

        return {"detail": "Certificate uploaded", "fileUrl": file_url}

    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    



async def get_latest_certificate_image(manufacturer_walletAddress: str):
    manufacturer = await db.manufacturers.find_one({"walletAddress": manufacturer_walletAddress})

    if not manufacturer or not manufacturer.get("certificates"):
        raise HTTPException(status_code=404, detail="No certificates found")

    fs = AsyncIOMotorGridFSBucket(db, bucket_name="certimages")

    # Try certificates sorted by validTo
    for cert in sorted(manufacturer["certificates"], key=lambda c: c["validTo"], reverse=True):
        try:
            file_id = cert["imageFileId"]
            if not isinstance(file_id, ObjectId):
                file_id = ObjectId(file_id)

            grid_out = await fs.open_download_stream(file_id)
            contents = await grid_out.read()

            return StreamingResponse(io.BytesIO(contents), media_type=grid_out.metadata.get("contentType", "image/jpeg"))
        except Exception as e:
            print(f"Skipping invalid certificate {cert.get('certId')}: {e}")

    # If no valid certificate found
    raise HTTPException(status_code=404, detail="Certificate image not found")



async def list_certificates(manufacturer_walletAddress: str):
    """Return list of certificates metadata for a manufacturer"""
    manufacturer = await db.manufacturers.find_one({"walletAddress": manufacturer_walletAddress})

    if not manufacturer or not manufacturer.get("certificates"):
        raise HTTPException(status_code=404, detail="No certificates found")

    # Convert ObjectId to string
    certificates = manufacturer["certificates"]
    for cert in certificates:
        if isinstance(cert.get("imageFileId"), ObjectId):
            cert["imageFileId"] = str(cert["imageFileId"])

    return jsonable_encoder(certificates)
