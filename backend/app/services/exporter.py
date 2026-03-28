from datetime import datetime
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def build_certificate(payload: dict) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 80, "EthicalGuard AI Compliance Certificate")

    c.setFont("Helvetica", 12)
    c.drawString(50, height - 120, f"Generated: {datetime.utcnow().isoformat()} UTC")
    c.drawString(50, height - 145, f"Safety Score: {payload['safety']}/100")
    c.drawString(50, height - 165, f"Bias Score: {payload['bias']}/100")
    c.drawString(50, height - 185, f"Toxicity Score: {payload['toxicity']}/100")
    c.drawString(50, height - 205, f"PII Findings: {len(payload['pii_findings'])}")

    c.drawString(50, height - 245, "Flags:")
    y = height - 265
    for item in payload["flags"][:8]:
        c.drawString(65, y, f"- {item}")
        y -= 18

    c.drawString(50, 60, "This certificate reflects automated checks and should be reviewed by a human auditor.")
    c.showPage()
    c.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
