import barcode
from barcode.writer import ImageWriter

# Generate a Code128 barcode
code128 = barcode.get('code128', '123456789012', writer=ImageWriter())
code128.save('barcode_image')  # Saves as barcode_image.png
