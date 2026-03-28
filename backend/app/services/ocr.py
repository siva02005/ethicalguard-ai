from io import BytesIO

import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR


ocr_engine = None


def _get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        ocr_engine = RapidOCR()
    return ocr_engine


def extract_text_from_image_bytes(raw: bytes) -> str:
    image = Image.open(BytesIO(raw)).convert("RGB")
    image_array = np.array(image)
    result, _ = _get_ocr_engine()(image_array)
    if not result:
        return ""

    lines = []
    for item in result:
        if len(item) >= 2 and item[1]:
            lines.append(str(item[1]).strip())

    return "\n".join(line for line in lines if line)
