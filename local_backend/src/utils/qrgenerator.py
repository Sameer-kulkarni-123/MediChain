import qrcode

# Your URL

# Generate QR code

# Save the image

ip = "192.168.1.22"

import os

pwd = os.getcwd()

def generate_qr_codes(bottleIds):
  crateCode = ""
  for i in range(5):
    crateCode += bottleIds[0][i]

  image_urls = []

  for bottleId in bottleIds:
    url = f"http://{ip}:3001/{bottleId}"
    qr = qrcode.make(url)
    path = os.path.join(pwd,"qrs", crateCode, f"{bottleId}.png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    qr.save(path)
    public_url = f"http://127.0.0.1:8000/static/{crateCode}/{bottleId}.png"
    
    image_urls.append({
            "bottleId": bottleId,
            "qrUrl": public_url
        })
    
  return image_urls