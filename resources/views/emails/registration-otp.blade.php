<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your MENRO Account</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f7fb;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
            padding: 50px 30px 40px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%); }
            100% { transform: translateX(100%) translateY(100%); }
        }
        .header h1 {
            color: #ffffff;
            font-size: 32px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.5px;
            text-align: center;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        .header p {
            color: #e0e7ff;
            font-size: 15px;
            margin: 12px 0 0 0;
            font-weight: 500;
            text-align: center;
            position: relative;
            z-index: 1;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            color: #1e293b;
            font-size: 16px;
            margin-bottom: 20px;
        }
        .code-container {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px dashed #94a3b8;
            border-radius: 8px;
            padding: 25px;
            text-align: center;
            margin: 25px 0;
        }
        .code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #1e3a8a;
            font-family: 'Courier New', monospace;
            margin: 0;
        }
        .instructions {
            color: #64748b;
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 20px;
        }
        .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            color: #92400e;
            font-size: 13px;
            margin: 0;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8fafc;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            color: #64748b;
            font-size: 12px;
            margin: 0 0 8px 0;
        }
        .footer-links {
            color: #3b82f6;
            font-size: 12px;
            text-decoration: none;
        }
        .footer-links:hover {
            text-decoration: underline;
        }
        .logo {
            display: inline-block;
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            border-radius: 50%;
            border: 4px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            object-fit: contain;
            background-color: #ffffff;
            position: relative;
            z-index: 1;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('images/opol-logo.png') }}" alt="Municipality of Opol Seal" class="logo" />
            <h1>MENRO Opol</h1>
            <p>Municipal Environmental and Natural Resources Office</p>
        </div>

        <div class="content">
            <p class="greeting">
                Hello,
            </p>

            <p class="instructions">
                Thank you for registering with the MENRO Certificate Services Portal. To complete your account setup, please use the verification code below:
            </p>

            <div class="code-container">
                <p class="code">{{ $code }}</p>
            </div>

            <p class="instructions">
                <strong>Important:</strong> This verification code will expire in <strong>10 minutes</strong>. Please enter it promptly to secure your account.
            </p>

            <div class="warning">
                <p>
                    <strong>Security Notice:</strong> If you did not request this registration or receive this email unexpectedly, please ignore it. Your account remains secure and no action is required.
                </p>
            </div>

            <p class="instructions">
                If you have any questions or need assistance, please contact our office during business hours (Monday to Friday, 8:00 AM - 5:00 PM).
            </p>
        </div>

        <div class="footer">
            <p>
                <strong>Municipal Environmental and Natural Resources Office</strong><br>
                Municipality of Opol, Misamis Oriental
            </p>
            <p>
                This is an automated email. Please do not reply to this message.
            </p>
            <p>
                © {{ date('Y') }} MENRO Opol. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>