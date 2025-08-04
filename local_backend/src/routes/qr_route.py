from fastapi import APIRouter, HTTPException
from utils import qrgenerator

router = APIRouter()

@router.post('/generateqr')
async def generateqr(bottleIds: list[str]):
    try:
        result = qrgenerator.generate_qr_codes(bottleIds)
        return {"status": "success", "qrs": result}
    except Exception as e:
        print(f"Error generating QR: {e}")
        raise HTTPException(status_code=500, detail="Error generating QR codes")