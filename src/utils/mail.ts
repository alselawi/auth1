const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .otp {
            font-size: 32px;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background-color: #e0e0e0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #888888;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            Your OTP Code
        </div>
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div class="otp">{{OTP_CODE}}</div>
        <p>Please use this code to complete your login. The code is valid for the next 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <div class="footer">
            &copy; Apexo.app
        </div>
    </div>
</body>
</html>`;

export async function sendEmail(to: string, subject: string, code: string, mlsn: string) {
	const send_request = new Request('https://api.mailersend.com/v1/email', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			Authorization: `Bearer ${mlsn}`,
		},
		body: JSON.stringify({
			from: {
				email: 'info@apexo.app',
				name: 'Apexo',
			},
			to: [
				{
					email: to,
				},
			],
			subject: subject,
			html: template.replace('{{OTP_CODE}}', code)
		}),
	});
	return await fetch(send_request);
}