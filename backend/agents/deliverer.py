import smtplib
from email.mime.text import MIMEText
from config import GMAIL_ADDRESS, GMAIL_APP_PASSWORD

def send_briefing_email(subject: str, body: str, to_address: str = None) -> bool:
    to_address = to_address or GMAIL_ADDRESS  # send to yourself by default
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_address

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.send_message(msg)
        print(f"Email sent to {to_address}")
        return True
    except Exception as e:
        print(f"[send_briefing_email] Failed: {e}")
        return False

if __name__ == "__main__":
    send_briefing_email("Radar Test", "This is a test briefing from Radar.")