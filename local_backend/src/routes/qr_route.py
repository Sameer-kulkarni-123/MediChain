from fastapi import APIRouter, HTTPException
from utils import qrgenerator

router = APIRouter()

@router.post('/generateqr')
async def generateqr(bottleIds: list[str], crateCode:str):
    try:
        result = qrgenerator.generate_qr_codes(bottleIds, crateCode)
        return {"status": "success", "qrcodes": result}
    except Exception as e:
        print(f"Error generating QR: {e}")
        raise HTTPException(status_code=500, detail="Error generating QR codes")