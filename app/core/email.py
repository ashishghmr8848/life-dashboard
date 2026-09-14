import logging
import os
import smtplib
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USERNAME)


def send_email(to: str, subject: str, body: str) -> None:
    """Best-effort send over SMTP with STARTTLS. Never raises - a delivery
    failure must not leak whether an email address is registered (see
    /auth/forgot-password's always-the-same response) or block anything
    else in the request. Logs loudly instead so a real failure is still
    visible to whoever's running the server.
    """
    if not (SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD):
        logger.warning(
            "SMTP is not configured (SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD) - "
            "would have sent %r to %s, skipping.",
            subject,
            to,
        )
        return

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = to

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to], message.as_string())
    except Exception:
        logger.exception("Failed to send email to %s", to)


def send_password_reset_email(to: str, code: str, expire_minutes: int) -> None:
    send_email(
        to=to,
        subject="Your Life Dashboard password reset code",
        body=(
            f"Your password reset code is: {code}\n\n"
            f"This code expires in {expire_minutes} minutes. If you didn't "
            "request a password reset, you can safely ignore this email."
        ),
    )
