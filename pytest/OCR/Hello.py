from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = 'C:/Program Files (x86)/Tesseract-OCR/tesseract'
im = Image.open("hi.png")


text = pytesseract.image_to_string(im, lang = "eng")

print(text)



