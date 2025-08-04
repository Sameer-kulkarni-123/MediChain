import qrcode

# Your URL
# url = "http://172.16.232.102:3001/X5OYB-NMKX4"
url = "X5OYB-NMKX4"

# Generate QR code
qr = qrcode.make(url)

# Save the image
qr.save("link_qr.png")
 #has the code 


